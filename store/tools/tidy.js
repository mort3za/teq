// Screenshot-only CSS for the extension pages: hide the page scrollbar and keep
// the sidebar in view when the page is scrolled (Options shot). Run it after the
// page loads:  agent-browser --session teq eval "$(cat store/tools/tidy.js)"
(() => {
  const style = document.createElement("style");
  style.textContent =
    "html{scrollbar-width:none}.sidebar{position:sticky;top:0;height:100vh;box-sizing:border-box}";
  document.head.append(style);
  return "tidy";
})();
