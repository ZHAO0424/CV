(() => {
  try {
    // Cyberpunk is the default; only a visitor who switched back to the original theme keeps it.
    if (localStorage.getItem('portfolio-theme') !== 'original') {
      document.documentElement.dataset.theme = 'cyber';
    }
  } catch (_) { document.documentElement.dataset.theme = 'cyber'; }

  // Every page loads this file, so it also boots the visitor analytics.
  const self = document.currentScript;
  if (self && self.src) {
    const analytics = document.createElement('script');
    analytics.async = true;
    analytics.src = new URL('assets/analytics.js', self.src).href;
    document.head.appendChild(analytics);
  }
})();
