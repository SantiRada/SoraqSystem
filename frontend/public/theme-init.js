// Applies the saved theme before React loads (no flash of the wrong theme).
// External file so the Content-Security-Policy can forbid inline scripts.
(function () {
  try {
    var saved = localStorage.getItem('soraq-theme');
    if (saved === 'light' || saved === 'dark') {
      var root = document.documentElement;
      root.setAttribute('data-theme', saved);
      root.classList.remove('light', 'dark');
      root.classList.add(saved);
    }
  } catch (e) {
    /* storage unavailable: keep the default dark theme */
  }
})();
