(function () {
  console.log("Bookwalker Ripper v3)");

  // We attach these to 'window' so they NEVER get reset by accident
  if (!window.downloadedIds) {
    window.downloadedIds = new Set(); // Tracks IDs like "wideScreen73"
  }
  if (!window.downloadedHashes) {
    window.downloadedHashes = new Set(); // Tracks image content (to stop visual duplicates)
  }

  // ==================================================
  // (CORS Fix)
  // ==================================================
  const OriginalImage = window.Image;
  window.Image = function (width, height) {
    const img = new OriginalImage(width, height);
    img.crossOrigin = "Anonymous";
    return img;
  };

  const originalCreate = document.createElement;
  document.createElement = function (tagName) {
    const el = originalCreate.apply(this, arguments);
    if (tagName && tagName.toLowerCase() === "img") {
      el.crossOrigin = "Anonymous";
    }
    return el;
  };

  // ==================================================
  // THE DOWNLOADER
  // ==================================================

  // Simple hash function to check if two images are identical
  function hashCode(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0; // Convert to 32bit integer
    }
    return hash;
  }

  function saveCanvas(canvas, id) {
    try {
      // 1. Size Check
      if (canvas.width === 0 || canvas.height === 0) {
        console.warn(`⚠️ ${id} is 0x0 size. Skipping.`);
        return;
      }

      // 2. Blank Check (Is it transparent?)
      const ctx = canvas.getContext("2d");
      const imageData = ctx.getImageData(
        0,
        0,
        canvas.width,
        canvas.height,
      ).data;
      let hasContent = false;
      for (let i = 3; i < imageData.length; i += 500) {
        // Check every 500th pixel
        if (imageData[i] > 0) {
          hasContent = true;
          break;
        }
      }

      if (!hasContent) {
        console.warn(`⚠️ ${id} is blank. Skipping.`);
        return;
      }

      // 3. Content Duplicate Check
      const dataUrl = canvas.toDataURL("image/png");
      const fileHash = hashCode(dataUrl);

      if (window.downloadedHashes.has(fileHash)) {
        console.warn(
          `🚫 ${id} is a VISUAL DUPLICATE of a previous page. Skipping.`,
        );
        return;
      }

      // 4. Save
      window.downloadedHashes.add(fileHash); // Remember this image content

      const link = document.createElement("a");
      link.download = id + ".png";
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      console.log(`✅ SAVED: ${id}`);
    } catch (e) {
      console.error(`❌ Error saving ${id}:`, e);
    }
  }

  function scan() {
    const wrappers = document.querySelectorAll('div[id^="wideScreen"]');

    wrappers.forEach((div) => {
      const id = div.id;

      // Check Global Set immediately
      if (!window.downloadedIds.has(id)) {
        const canvas = div.querySelector("canvas");
        if (canvas) {
          // Mark as seen immediately so we never queue it again
          window.downloadedIds.add(id);

          console.log(`Found NEW canvas: ${id}. Waiting 10s...`);

          // Wait 10 seconds, then try to save
          setTimeout(() => {
            saveCanvas(canvas, id);
          }, 3000);
        }
      }
    });
  }

  // Scan every 1 second
  setInterval(scan, 1000);

  // ==================================================
  // THE SLIDER MOVER
  // ==================================================
  function startAutoScroll() {
    console.log("⏳Auto-Scroll initialized...");

    // Interval: 5 seconds (5s Buffer for image loading)
    setInterval(() => {
      if (typeof window.jQuery === "undefined") return;

      const $ = window.jQuery;
      const $handle = $(".ui-slider-handle");
      const $slider = $handle.closest(".ui-slider");

      if ($slider.length) {
        const current = $slider.slider("value");
        const min = $slider.slider("option", "min") || 0;

        // Move BACKWARDS (-1)
        const next = current - 1;

        if (next >= min) {
          $slider.slider("value", next);

          const uiObj = { value: next, handle: $handle[0] };
          $slider.trigger("slide", uiObj);
          $slider.trigger("slidechange", uiObj);
          $slider.trigger("slidestop", uiObj);
          $slider.trigger("change");

          console.log(`➡️ Moved to: ${next}`);
        } else {
          console.log("🛑 Reached start.");
        }
      }
    }, 5000);
  }

  // Start scroller after 5 seconds
  setTimeout(startAutoScroll, 5000);
})();
