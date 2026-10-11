(() => {
  try {
    if (localStorage.getItem('portfolio-theme') === 'cyber') {
      document.documentElement.dataset.theme = 'cyber';
    }
  } catch (_) { /* Theme switching still works when storage is unavailable. */ }
})();
