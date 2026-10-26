// GoatCounter analytics (dashboard: https://sphere.goatcounter.com).
// count.js is self-hosted because gc.zgo.at is unreachable from mainland China.
(() => {
  const here = document.currentScript && document.currentScript.src;
  if (!here) return;

  window.goatcounter = window.goatcounter || {};
  window.goatcounter.endpoint = 'https://sphere.goatcounter.com/count';

  const counter = document.createElement('script');
  counter.async = true;
  counter.src = new URL('goatcounter-count.js', here).href;
  document.head.appendChild(counter);

  const send = (path, title) => {
    if (window.goatcounter && typeof window.goatcounter.count === 'function') {
      window.goatcounter.count({ path, title, event: true });
    }
  };

  // Event names: click-project/<slug>, outbound/<host+path>, click-email.
  const onClick = (event) => {
    const link = event.target.closest && event.target.closest('a[href]');
    if (!link) return;

    const href = link.getAttribute('href');
    if (href.startsWith('mailto:')) {
      send('click-email', 'Email link');
      return;
    }

    let url;
    try { url = new URL(href, location.href); } catch (_) { return; }
    if (!/^https?:$/.test(url.protocol)) return;

    const heading = link.querySelector('h1, h2, h3, h4');
    const label = (link.getAttribute('aria-label') || (heading && heading.textContent) || link.textContent || '')
      .replace(/\s+/g, ' ').trim().slice(0, 100);
    if (url.host === location.host) {
      const project = url.pathname.match(/\/projects\/([^/]+)\.html$/);
      if (project && url.pathname !== location.pathname) {
        send(`click-project/${project[1]}`, label);
      }
    } else {
      send(`outbound/${url.host}${url.pathname}`.replace(/\/$/, ''), label);
    }
  };

  document.addEventListener('click', onClick, true);
  document.addEventListener('auxclick', onClick, true);
})();
