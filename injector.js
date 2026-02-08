// injector.js
var s = document.createElement("script");
// This loads the local file 'logic.js' and executes it in the PAGE context
s.src = browser.runtime.getURL("logic.js");
s.onload = function () {
  this.remove(); // Clean up the tag after running
};
(document.head || document.documentElement).appendChild(s);
console.log("Injection successful");
