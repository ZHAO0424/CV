import { createElement, Zap } from 'lucide';

const root = document.documentElement;
const header = document.querySelector('.top-bar');
if (header) {
  const controls = document.createElement('div');
  controls.className = 'header-controls';
  const language = header.querySelector('.lang-switch');
  if (language) controls.append(language);
  const button = document.createElement('button');
  button.className = 'theme-toggle';
  button.type = 'button';
  button.append(createElement(Zap, { width: 18, height: 18, 'aria-hidden': 'true' }));
  const tooltip = document.createElement('span');
  tooltip.className = 'theme-tooltip';
  tooltip.id = 'theme-tooltip';
  button.setAttribute('aria-describedby', tooltip.id);
  controls.append(button, tooltip);
  header.append(controls);
  function sync() {
    const active = root.dataset.theme === 'cyber';
    const chinese = root.lang.startsWith('zh');
    button.setAttribute('aria-pressed', String(active));
    button.setAttribute('aria-label', chinese ? '\u5207\u6362\u8d5b\u535a\u670b\u514b\u4e3b\u9898' : 'Toggle cyberpunk theme');
    tooltip.textContent = chinese
      ? (active ? '\u5207\u56de\u539f\u6709\u914d\u8272' : '\u8d5b\u535a\u670b\u514b\u4e3b\u9898')
      : (active ? 'Switch to original theme' : 'Switch to Night Street theme');
  }
  let transitionTimer;
  button.addEventListener('click', () => {
    const theme = root.dataset.theme === 'cyber' ? 'original' : 'cyber';
    root.dataset.theme = theme;
    try { localStorage.setItem('portfolio-theme', theme); } catch (_) { }
    clearTimeout(transitionTimer);
    root.classList.remove('theme-entering');
    requestAnimationFrame(() => {
      if (theme === 'cyber') root.classList.add('theme-entering');
      transitionTimer = setTimeout(() => root.classList.remove('theme-entering'), 650);
    });
    sync();
    window.dispatchEvent(new CustomEvent('portfolio-theme-change', { detail: { theme } }));
  });
  new MutationObserver(sync).observe(root, { attributes: true, attributeFilter: ['lang'] });
  addEventListener('storage', event => {
    if (event.key === 'portfolio-theme') { root.dataset.theme = event.newValue === 'cyber' ? 'cyber' : 'original'; sync(); }
  });
  sync();
}
