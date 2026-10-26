(() => {
  try {
    if (localStorage.getItem('portfolio-theme') === 'cyber') {
      document.documentElement.dataset.theme = 'cyber';
    }
  } catch (_) { /* Theme switching still works when storage is unavailable. */ }

  // Every page loads this file, so it also boots the visitor analytics.
  const self = document.currentScript;
  if (self && self.src) {
    const analytics = document.createElement('script');
    analytics.async = true;
    analytics.src = new URL('assets/analytics.js', self.src).href;
    document.head.appendChild(analytics);
  }
})();
