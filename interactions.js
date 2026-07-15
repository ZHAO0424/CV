function prefersReducedMotion() {
  return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function supportsFinePointer() {
  return window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
}

function setupReveal() {
  const nodes = Array.from(document.querySelectorAll('.reveal, .fade-slide-up'));
  if (nodes.length === 0) return;

  if (prefersReducedMotion() || !('IntersectionObserver' in window)) {
    nodes.forEach((n) => {
      n.classList.add('is-visible');
      n.classList.add('visible');
    });
    return;
  }

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          // Stagger slightly for a more deliberate, premium feel.
          // Avoid large delays to keep the page responsive.
          const idx = Number(e.target.dataset.revealIndex || 0);
          e.target.style.transitionDelay = `${Math.min(260, idx * 45)}ms`;
          e.target.classList.add('is-visible');
          e.target.classList.add('visible');
          io.unobserve(e.target);
        }
      });
    },
    { threshold: 0.1, rootMargin: '0px 0px -10% 0px' }
  );

  nodes.forEach((n, idx) => {
    n.dataset.revealIndex = String(idx);
    io.observe(n);
  });

  // If the observer misses some nodes (edge cases), reveal only near-viewport items.
  window.setTimeout(() => {
    const near = Array.from(document.querySelectorAll('.reveal:not(.is-visible), .fade-slide-up:not(.is-visible)'));
    near.forEach((n) => {
      const r = n.getBoundingClientRect();
      if (r.top < (window.innerHeight || 900) * 1.15 && r.bottom > -120) {
        n.classList.add('is-visible');
        n.classList.add('visible');
      }
    });
  }, 700);
}

function setupHomeHeroIntro() {
  const hero = document.querySelector('.hero-home');
  if (!hero || hero.dataset.heroIntroBound === 'true') return;
  hero.dataset.heroIntroBound = 'true';

  const squaresLayer = hero.querySelector('.hero-squares');
  const typingEl = hero.querySelector('.hero-typing');
  const focusTypingEl = hero.querySelector('.hero-focus-typing');
  const reduced = prefersReducedMotion();

  if (squaresLayer && !squaresLayer.hasChildNodes()) {
    const palette = [
      'rgba(96, 165, 250, 0.28)',
      'rgba(244, 208, 255, 0.24)',
      'rgba(134, 239, 172, 0.22)',
      'rgba(125, 211, 252, 0.24)',
      'rgba(191, 219, 254, 0.3)',
      'rgba(251, 191, 183, 0.22)'
    ];
    const count = reduced ? 8 : window.innerWidth < 700 ? 8 : 16;

    for (let i = 0; i < count; i += 1) {
      const node = document.createElement('span');
      const size = Math.round(16 + Math.random() * 42);
      const duration = 16 + Math.random() * 18;
      const delay = -Math.random() * duration;
      const drift = `${Math.round((Math.random() - 0.5) * 140)}px`;
      const rotate = `${Math.round((Math.random() - 0.5) * 240)}deg`;
      node.className = 'hero-square';
      node.style.left = `${Math.random() * 100}%`;
      node.style.width = `${size}px`;
      node.style.height = `${size}px`;
      node.style.opacity = `${0.52 + Math.random() * 0.36}`;
      node.style.animationDuration = `${duration}s`;
      node.style.animationDelay = `${delay}s`;
      node.style.setProperty('--drift', drift);
      node.style.setProperty('--rotate', rotate);
      node.style.setProperty('--square-fill', palette[i % palette.length]);
      squaresLayer.appendChild(node);
    }
  }

  if (!reduced && 'IntersectionObserver' in window) {
    const heroObserver = new IntersectionObserver((entries) => {
      hero.classList.toggle('is-motion-paused', !entries[0].isIntersecting);
    }, { threshold: 0.02 });
    heroObserver.observe(hero);
  }

  if (!typingEl) return;

  let typingTimer = 0;
  let focusTimer = 0;
  let runId = 0;

  function getCurrentLang() {
    return document.documentElement.lang && document.documentElement.lang.toLowerCase().startsWith('zh') ? 'zh' : 'en';
  }

  function playTyping() {
    window.clearTimeout(typingTimer);
    window.clearTimeout(focusTimer);
    runId += 1;
    const currentRun = runId;
    const lang = getCurrentLang();
    const target = typingEl.getAttribute(`data-typing-${lang}`) || typingEl.textContent.trim();

    if (reduced) {
      typingEl.textContent = target;
      if (focusTypingEl) {
        const reducedPhrases = (focusTypingEl.getAttribute(`data-rotate-${lang}`) || '')
          .split('|')
          .filter(Boolean);
        focusTypingEl.textContent = reducedPhrases[0] || '';
      }
      return;
    }

    typingEl.textContent = '';
    let index = 0;
    const speed = lang === 'zh' ? 95 : 62;

    function tick() {
      if (currentRun !== runId) return;
      typingEl.textContent = target.slice(0, index);
      index += 1;
      if (index <= target.length) {
        typingTimer = window.setTimeout(tick, speed);
      } else if (focusTypingEl) {
        focusTimer = window.setTimeout(() => {
          playFocusTyping(currentRun);
        }, 420);
      }
    }

    typingTimer = window.setTimeout(tick, 180);
  }

  function playFocusTyping(currentRun) {
    if (!focusTypingEl || currentRun !== runId) return;
    const lang = getCurrentLang();
    const phrases = (focusTypingEl.getAttribute(`data-rotate-${lang}`) || '')
      .split('|')
      .map((item) => item.trim())
      .filter(Boolean);
    if (!phrases.length) return;

    let phraseIndex = 0;
    let charIndex = 0;
    let deleting = false;

    function cycle() {
      if (currentRun !== runId) return;
      const phrase = phrases[phraseIndex];
      focusTypingEl.textContent = deleting
        ? phrase.slice(0, charIndex)
        : phrase.slice(0, charIndex);

      if (!deleting && charIndex < phrase.length) {
        charIndex += 1;
        focusTimer = window.setTimeout(cycle, lang === 'zh' ? 68 : 40);
        return;
      }

      if (!deleting && charIndex >= phrase.length) {
        deleting = true;
        focusTimer = window.setTimeout(cycle, 1450);
        return;
      }

      if (deleting && charIndex > 0) {
        charIndex -= 1;
        focusTimer = window.setTimeout(cycle, 22);
        return;
      }

      deleting = false;
      phraseIndex = (phraseIndex + 1) % phrases.length;
      charIndex = 0;
      focusTimer = window.setTimeout(cycle, 220);
    }

    cycle();
  }

  playTyping();
  document.addEventListener('cv:languagechange', playTyping);
}

function runNonCriticalSetup() {
  setupBackgroundAtmosphere();
  setupMagneticTargets();
  setupCursorEffects();
  setupFooterField();
  setupLogoPixelBurst();
}

function scheduleNonCriticalSetup() {
  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(runNonCriticalSetup, { timeout: 1400 });
  } else {
    window.setTimeout(runNonCriticalSetup, 320);
  }
}

function setupCardTilt() {
  if (prefersReducedMotion()) return;
  const cards = Array.from(document.querySelectorAll('.project-card[data-tilt="true"]'));
  if (cards.length === 0) return;

  cards.forEach((card) => {
    const maxRotation = 5.5;
    const maxShift = 10;
    let raf = 0;
    let lastPX = 0.5;
    let lastPY = 0.45;

    function onMove(ev) {
      const rect = card.getBoundingClientRect();
      const px = (ev.clientX - rect.left) / rect.width;
      const py = (ev.clientY - rect.top) / rect.height;
      const rx = (py - 0.5) * -maxRotation;
      const ry = (px - 0.5) * maxRotation;
      const tx = (px - 0.5) * maxShift;
      const ty = (py - 0.5) * maxShift * 0.45;

      lastPX = px;
      lastPY = py;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        card.style.setProperty('--hover-x', `${(lastPX * 100).toFixed(2)}%`);
        card.style.setProperty('--hover-y', `${(lastPY * 100).toFixed(2)}%`);
        card.style.transform = `translate3d(${tx.toFixed(2)}px, ${(-4 + ty).toFixed(2)}px, 0) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg)`;
      });
    }

    function onLeave() {
      cancelAnimationFrame(raf);
      card.style.removeProperty('--hover-x');
      card.style.removeProperty('--hover-y');
      card.style.transform = '';
    }

    card.addEventListener('mousemove', onMove);
    card.addEventListener('mouseleave', onLeave);
  });
}

function optimizeMediaLoading() {
  // Avoid forcing layout on every image during first paint.
  // We use selector-based heuristics; browsers' native lazy-loading does the rest.
  const images = Array.from(document.querySelectorAll('img'));

  images.forEach((img) => {
    img.decoding = 'async';
    if (!img.loading) img.loading = 'lazy';
    if (!img.fetchPriority) img.fetchPriority = 'low';
  });

  // Always prioritize true hero/cover imagery.
  document
    .querySelectorAll('.hero img, .resume-hero img, .proj-hero img, .side-cover-box img')
    .forEach((img) => {
      img.loading = 'eager';
      img.fetchPriority = 'high';
    });

  // Home page: prioritize the first row of project cards without measuring the layout.
  document
    .querySelectorAll('.project-grid-large .project-card:nth-child(-n+3) img.project-image')
    .forEach((img) => {
      img.loading = 'eager';
      img.fetchPriority = 'high';
    });

  document.querySelectorAll('video').forEach((video) => {
    const isAutoplay = video.dataset.managedVideo === 'autoplay' || video.hasAttribute('autoplay');
    video.preload = isAutoplay ? 'metadata' : 'none';
  });
}

function setupManagedVideos() {
  const videos = Array.from(document.querySelectorAll('video[data-managed-video="autoplay"]'));
  if (videos.length === 0) return;

  if (prefersReducedMotion() || !('IntersectionObserver' in window)) {
    videos.forEach((video) => {
      video.preload = video.getAttribute('preload') || 'metadata';
      video.muted = true;
      video.playsInline = true;
      video.play().catch(() => {});
    });
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const video = entry.target;
        if (entry.isIntersecting) {
          video.play().catch(() => {});
        } else {
          video.pause();
        }
      });
    },
    { threshold: 0.2, rootMargin: '120px 0px' }
  );

  videos.forEach((video) => {
    video.muted = true;
    video.playsInline = true;
    video.pause();
    observer.observe(video);
  });
}

function setupPhotoLightbox() {
  const images = Array.from(document.querySelectorAll('.page-photo .photo-img, .proj-gallery .shot-img'));
  if (!images.length || document.querySelector('.photo-lightbox')) return;

  const overlay = document.createElement('div');
  overlay.className = 'photo-lightbox';
  overlay.setAttribute('aria-hidden', 'true');
  overlay.innerHTML = `
    <button class="photo-lightbox-close" type="button" aria-label="Close image">x</button>
    <figure class="photo-lightbox-frame">
      <img class="photo-lightbox-img" alt="" />
      <figcaption class="photo-lightbox-caption"></figcaption>
    </figure>
  `;
  document.body.appendChild(overlay);

  const frame = overlay.querySelector('.photo-lightbox-frame');
  const image = overlay.querySelector('.photo-lightbox-img');
  const caption = overlay.querySelector('.photo-lightbox-caption');
  const closeBtn = overlay.querySelector('.photo-lightbox-close');
  let lastFocus = null;

  function closeLightbox() {
    overlay.classList.remove('is-open', 'is-shot', 'is-architecture');
    overlay.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('photo-lightbox-open');
    image.removeAttribute('src');
    if (lastFocus && typeof lastFocus.focus === 'function') lastFocus.focus();
  }

  function openLightbox(targetImage) {
    if (!targetImage) return;
    const isShot = targetImage.classList.contains('shot-img');
    const isArchitecture = Boolean(targetImage.closest('.gallery-grid-architecture'));
    lastFocus = document.activeElement;
    image.src = targetImage.currentSrc || targetImage.src;
    image.alt = targetImage.alt || 'Image preview';
    caption.textContent = targetImage.alt || '';
    overlay.classList.toggle('is-shot', isShot);
    overlay.classList.toggle('is-architecture', isArchitecture);
    overlay.classList.add('is-open');
    overlay.setAttribute('aria-hidden', 'false');
    document.body.classList.add('photo-lightbox-open');
    closeBtn.focus();
  }

  images.forEach((targetImage) => {
    const activate = (ev) => {
      ev.preventDefault();
      openLightbox(targetImage);
    };
    targetImage.addEventListener('click', activate);
    targetImage.addEventListener('keydown', (ev) => {
      if (ev.key === 'Enter' || ev.key === ' ') activate(ev);
    });
    targetImage.setAttribute('tabindex', '0');
    targetImage.setAttribute('role', 'button');
    targetImage.setAttribute('aria-label', targetImage.alt || 'Open image');
  });

  closeBtn.addEventListener('click', closeLightbox);
  overlay.addEventListener('click', (ev) => {
    if (ev.target === overlay) closeLightbox();
  });
  frame.addEventListener('click', (ev) => ev.stopPropagation());
  window.addEventListener('keydown', (ev) => {
    if (ev.key === 'Escape' && overlay.classList.contains('is-open')) closeLightbox();
  });
}
function setupMagneticTargets() {
  if (!supportsFinePointer() || prefersReducedMotion()) return;

  const targets = Array.from(
    document.querySelectorAll(
      '.nav-link, .lang-btn, .proj-back, .footer-link, .tag'
    )
  );

  targets.forEach((target) => {
    const strength = 5;
    let rect = null;
    let raf = 0;
    let pointerX = 0;
    let pointerY = 0;

    function onEnter() {
      rect = target.getBoundingClientRect();
    }

    function onMove(ev) {
      pointerX = ev.clientX;
      pointerY = ev.clientY;
      if (raf) return;

      raf = requestAnimationFrame(() => {
        raf = 0;
        if (!rect) rect = target.getBoundingClientRect();
        const offsetX = pointerX - (rect.left + rect.width / 2);
        const offsetY = pointerY - (rect.top + rect.height / 2);
        const moveX = (offsetX / rect.width) * strength;
        const moveY = (offsetY / rect.height) * strength;
        target.style.setProperty('--cursor-mx', `${moveX.toFixed(2)}px`);
        target.style.setProperty('--cursor-my', `${moveY.toFixed(2)}px`);
        target.classList.add('cursor-magnetic');
      });
    }

    function onLeave() {
      cancelAnimationFrame(raf);
      raf = 0;
      rect = null;
      target.style.removeProperty('--cursor-mx');
      target.style.removeProperty('--cursor-my');
      target.classList.remove('cursor-magnetic');
    }

    target.addEventListener('pointerenter', onEnter, { passive: true });
    target.addEventListener('pointermove', onMove, { passive: true });
    target.addEventListener('pointerleave', onLeave);
  });
}

function setupCursorEffects() {
  if (!supportsFinePointer() || prefersReducedMotion()) return;

  const body = document.body;
  if (!body) return;

  const shell = document.createElement('div');
  shell.className = 'cursor-shell';
  shell.innerHTML = `
    <div class="cursor-trail cursor-trail-1"></div>
    <div class="cursor-aura"></div>
    <div class="cursor-ring"></div>
  `;
  body.appendChild(shell);
  body.classList.add('has-custom-cursor');
  body.dataset.cursorContrast = 'light';

  const aura = shell.querySelector('.cursor-aura');
  const ring = shell.querySelector('.cursor-ring');
  const trail = shell.querySelector('.cursor-trail');

  const state = {
    x: window.innerWidth / 2,
    y: window.innerHeight / 2,
    currentX: window.innerWidth / 2,
    currentY: window.innerHeight / 2,
    trailX: window.innerWidth / 2,
    trailY: window.innerHeight / 2,
    hover: 'default',
    target: null,
    visible: false,
    raf: 0
  };

  function applyHoverState(kind) {
    state.hover = kind;
    body.dataset.cursor = kind;
  }

  function parseColor(color) {
    if (!color || color === 'transparent') return null;
    const match = color.match(/rgba?\(([^)]+)\)/i);
    if (!match) return null;
    const parts = match[1].split(',').map((part) => Number.parseFloat(part.trim()));
    if (parts.length < 3 || parts.some(Number.isNaN)) return null;
    return {
      r: parts[0],
      g: parts[1],
      b: parts[2],
      a: parts.length > 3 && !Number.isNaN(parts[3]) ? parts[3] : 1
    };
  }

  function luminanceOf(color) {
    const toLinear = (value) => {
      const channel = value / 255;
      return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
    };

    return 0.2126 * toLinear(color.r) + 0.7152 * toLinear(color.g) + 0.0722 * toLinear(color.b);
  }

  function resolveSurfaceContrast(target) {
    if (!target) return 'light';
    if (target.closest('.footer, .footer-field')) return 'dark';
    if (target.closest('video')) return 'light';

    const candidates = [];
    let node = target.nodeType === 1 ? target : target.parentElement;
    while (node && candidates.length < 6) {
      candidates.push(node);
      node = node.parentElement;
    }
    candidates.push(document.body);

    for (const candidate of candidates) {
      const styles = window.getComputedStyle(candidate);
      const color = parseColor(styles.backgroundColor);
      if (!color) continue;
      if (color.a <= 0.04) continue;
      const luminance = luminanceOf(color);
      if (color.a < 0.18 && luminance < 0.24) return 'dark';
      if (luminance > 0.45 || color.a < 0.24) return 'light';
      return 'dark';
    }

    return 'light';
  }

  function applyContrastState(kind) {
    body.dataset.cursorContrast = kind;
  }

  function resolveHoverKind(target) {
    if (!target) return 'default';
    if (target.closest('video')) return 'video';
    if (target.closest('a, button, .lang-btn')) return 'link';
    if (target.closest('.project-card, .photo-card, .shot, .side-cover-box')) return 'card';
    return 'default';
  }

  function onPointerMove(ev) {
    state.x = ev.clientX;
    state.y = ev.clientY;
    state.visible = true;
    shell.classList.add('is-visible');
    scheduleFrame();
  }

  function onPointerOver(ev) {
    if (ev.target === state.target) return;
    state.target = ev.target;
    applyHoverState(resolveHoverKind(ev.target));
    applyContrastState(resolveSurfaceContrast(ev.target));
  }

  function onPointerLeave() {
    state.visible = false;
    state.target = null;
    shell.classList.remove('is-visible');
    applyHoverState('default');
    applyContrastState('light');
  }

  function animate() {
    state.raf = 0;
    state.currentX += (state.x - state.currentX) * 0.34;
    state.currentY += (state.y - state.currentY) * 0.34;
    state.trailX += (state.currentX - state.trailX) * 0.2;
    state.trailY += (state.currentY - state.trailY) * 0.2;

    const cursorTransform = `translate3d(${state.currentX.toFixed(2)}px, ${state.currentY.toFixed(2)}px, 0) translate(-50%, -50%)`;
    aura.style.transform = cursorTransform;
    ring.style.transform = cursorTransform;
    trail.style.transform = `translate3d(${state.trailX.toFixed(2)}px, ${state.trailY.toFixed(2)}px, 0) translate(-50%, -50%)`;

    const cursorDistance = Math.abs(state.x - state.currentX) + Math.abs(state.y - state.currentY);
    const trailDistance = Math.abs(state.currentX - state.trailX) + Math.abs(state.currentY - state.trailY);
    if (state.visible && (cursorDistance > 0.08 || trailDistance > 0.08)) scheduleFrame();
  }

  function scheduleFrame() {
    if (!state.raf) state.raf = window.requestAnimationFrame(animate);
  }

  document.addEventListener('pointermove', onPointerMove, { passive: true });
  document.addEventListener('pointerover', onPointerOver, { passive: true });
  document.addEventListener('pointerleave', onPointerLeave);
  window.addEventListener('blur', onPointerLeave);
}
let threeLibraryPromise = null;

function loadThreeLibrary() {
  if (window.THREE) return Promise.resolve(window.THREE);
  if (threeLibraryPromise) return threeLibraryPromise;

  threeLibraryPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-three-runtime="true"]');
    if (existing) {
      existing.addEventListener('load', () => resolve(window.THREE), { once: true });
      existing.addEventListener('error', reject, { once: true });
      return;
    }

    const script = document.createElement('script');
    const base = window.location.pathname.includes('/projects/') ? '../' : './';
    script.src = `${base}vendor/three.min.js`;
    script.async = true;
    script.dataset.threeRuntime = 'true';
    script.onload = () => resolve(window.THREE);
    script.onerror = reject;
    document.head.appendChild(script);
  });

  return threeLibraryPromise;
}

function cubicBezier(a, b, c, d, t) {
  const mt = 1 - t;
  return mt * mt * mt * a + 3 * mt * mt * t * b + 3 * mt * t * t * c + t * t * t * d;
}

function smoothStep(edge0, edge1, value) {
  const t = Math.max(0, Math.min(1, (value - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

function setupBackgroundAtmosphere() {
  if (!document.querySelector('.hero-home')) return;
  if (document.querySelector('.page-atmosphere')) return;

  const layer = document.createElement('div');
  layer.className = 'page-atmosphere';
  layer.innerHTML = '<canvas class="page-atmosphere-canvas"></canvas>';
  document.body.appendChild(layer);

  const canvas = layer.querySelector('canvas');
  const ctx = canvas.getContext('2d', { alpha: true });
  if (!ctx) return;

  const prefersReduced = prefersReducedMotion();
  let width = 0;
  let height = 0;
  let dpr = 1;
  let raf = 0;
  let visible = !document.hidden;

  const motes = Array.from({ length: window.innerWidth < 700 ? 14 : 28 }, () => ({
    x: 0,
    y: 0,
    orbit: 80 + Math.random() * 260,
    speed: 0.00045 + Math.random() * 0.0012,
    size: 3 + Math.random() * 5,
    phase: Math.random() * Math.PI * 2,
    drift: 10 + Math.random() * 36,
    color: [
      'rgba(76, 140, 255, 0.16)',
      'rgba(241, 99, 149, 0.16)',
      'rgba(255, 190, 84, 0.14)',
      'rgba(72, 215, 189, 0.14)'
    ][Math.floor(Math.random() * 4)]
  }));

  const vortices = [
    { x: 0.18, y: 0.26, radius: 0.18, spin: 1 },
    { x: 0.82, y: 0.22, radius: 0.16, spin: -1 },
    { x: 0.72, y: 0.72, radius: 0.22, spin: 1 }
  ];

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 1.25);
    width = Math.max(1, layer.clientWidth || window.innerWidth);
    height = Math.max(1, layer.clientHeight || Math.round(window.innerHeight * 0.34));
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function drawWaveBand(now, index, opacity, thickness) {
    const t = now * 0.001;
    const yBase = height * (0.18 + index * 0.23);
    ctx.beginPath();
    ctx.moveTo(-40, yBase);
    for (let x = -40; x <= width + 40; x += 18) {
      const a = Math.sin((x * 0.0052) + t * (0.36 + index * 0.08));
      const b = Math.cos((x * 0.0028) - t * (0.24 + index * 0.06));
      const c = Math.sin((x * 0.0016) + t * 0.52 + index * 1.7);
      const y = yBase + a * (12 + index * 4) + b * 10 + c * 8;
      ctx.lineTo(x, y);
    }
    ctx.strokeStyle = index === 0
      ? `rgba(168, 196, 229, ${opacity})`
      : index === 1
        ? `rgba(208, 146, 184, ${opacity * 0.9})`
        : `rgba(130, 188, 176, ${opacity * 0.88})`;
    ctx.lineWidth = thickness;
    ctx.stroke();
  }

  function draw(now) {
    raf = 0;
    if (!visible) return;

    ctx.clearRect(0, 0, width, height);
    ctx.save();

    ctx.globalCompositeOperation = 'source-over';
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, 'rgba(255,255,255,0)');
    gradient.addColorStop(0.35, 'rgba(215,228,246,0.08)');
    gradient.addColorStop(0.65, 'rgba(189,212,240,0.11)');
    gradient.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    drawWaveBand(now, 0, 0.28, 1.45);
    drawWaveBand(now, 1, 0.2, 1.12);
    drawWaveBand(now, 2, 0.16, 0.96);
    ctx.globalCompositeOperation = 'lighter';
    const t = now;

    motes.forEach((mote, index) => {
      const vortex = vortices[index % vortices.length];
      const centerX = width * vortex.x;
      const centerY = height * vortex.y;
      const angle = mote.phase + t * mote.speed * vortex.spin;
      const radial = mote.orbit + Math.sin(t * mote.speed * 0.6 + mote.phase) * mote.drift;
      mote.x = centerX + Math.cos(angle) * radial;
      mote.y = centerY + Math.sin(angle * 0.92) * radial * 0.52 + Math.cos(angle * 0.4) * 24;

      ctx.fillStyle = mote.color;
      ctx.fillRect(mote.x, mote.y, mote.size, mote.size);

      ctx.fillStyle = 'rgba(255,255,255,0.18)';
      ctx.fillRect(mote.x + 1, mote.y + 1, Math.max(1, mote.size * 0.4), Math.max(1, mote.size * 0.4));
    });

    const wash = ctx.createRadialGradient(width * 0.58, height * 0.72, 10, width * 0.58, height * 0.72, width * 0.52);
    wash.addColorStop(0, 'rgba(180, 221, 255, 0.14)');
    wash.addColorStop(0.42, 'rgba(129, 185, 255, 0.08)');
    wash.addColorStop(1, 'rgba(129, 185, 255, 0)');
    ctx.fillStyle = wash;
    ctx.fillRect(0, 0, width, height);

    ctx.restore();

    if (!prefersReduced) raf = requestAnimationFrame(draw);
  }

  function schedule() {
    if (!raf && !prefersReduced) raf = requestAnimationFrame(draw);
  }

  document.addEventListener('visibilitychange', () => {
    visible = !document.hidden;
    if (visible) schedule();
  });

  window.addEventListener('resize', resize, { passive: true });
  resize();
  if (prefersReduced) {
    draw(performance.now());
  } else {
    schedule();
  }
}

function setupPageLoader() {
  if (prefersReducedMotion()) return null;

  let hasSeenLoader = false;
  try {
    hasSeenLoader = window.sessionStorage.getItem('portfolio-loader-seen') === '1';
  } catch (error) {
    hasSeenLoader = false;
  }

  const overlay = document.createElement('div');
  overlay.className = 'page-loader';
  overlay.setAttribute('aria-hidden', 'true');
  overlay.innerHTML = `
    <div class="page-loader-bg"></div>
    <div class="page-loader-inner">
      <div class="page-loader-pixel-mark" aria-hidden="true">
        <span></span><span></span><span></span><span></span>
      </div>
      <div class="page-loader-copy">
        <div class="page-loader-title">Zhao Zirui</div>
        <div class="page-loader-subtitle">XR / AI / Spatial Systems</div>
      </div>
      <div class="page-loader-scan"><span></span></div>
      <div class="page-loader-status">Calibrating interface</div>
    </div>
  `;
  document.body.appendChild(overlay);

  const showDelay = hasSeenLoader ? 220 : 140;
  const minVisible = hasSeenLoader ? 180 : 680;
  const maxVisible = hasSeenLoader ? 900 : 1600;
  let shownAt = 0;
  let shown = false;
  let ready = document.readyState === 'complete';
  let closed = false;
  let showTimer = 0;
  let maxTimer = 0;

  function rememberVisit() {
    try {
      window.sessionStorage.setItem('portfolio-loader-seen', '1');
    } catch (error) {
      // Storage may be unavailable in private browsing contexts.
    }
  }

  function removeLoader() {
    if (closed) return;
    closed = true;
    window.clearTimeout(showTimer);
    window.clearTimeout(maxTimer);
    rememberVisit();
    overlay.classList.add('is-leaving');
    document.body.classList.remove('page-loader-active');
    window.setTimeout(() => overlay.remove(), shown ? 420 : 0);
  }

  function showLoader() {
    if (ready || closed || shown) return;
    shown = true;
    shownAt = performance.now();
    document.body.classList.add('page-loader-active');
    overlay.classList.add('is-visible');
  }

  function finishLoading() {
    if (closed) return;
    ready = true;
    window.clearTimeout(showTimer);
    if (!shown) {
      removeLoader();
      return;
    }

    const remaining = Math.max(0, minVisible - (performance.now() - shownAt));
    window.setTimeout(removeLoader, remaining);
  }

  showTimer = window.setTimeout(showLoader, showDelay);
  maxTimer = window.setTimeout(() => {
    if (!shown && !ready) showLoader();
    removeLoader();
  }, maxVisible);

  if (ready) {
    window.setTimeout(finishLoading, 0);
  } else {
    window.addEventListener('load', finishLoading, { once: true });
  }

  return {
    close: removeLoader
  };
}

function createLogoThreeBurstSystem(trigger, THREE) {
  let layer = document.querySelector('.logo-three-layer');
  if (!layer) {
    layer = document.createElement('div');
    layer.className = 'logo-three-layer';
    layer.innerHTML = '<canvas class="logo-three-canvas"></canvas>';
    document.body.appendChild(layer);
  }

  const canvas = layer.querySelector('.logo-three-canvas');
  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
    powerPreference: 'high-performance'
  });

  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.setClearColor(0x000000, 0);
  if (renderer.outputEncoding !== undefined && THREE.sRGBEncoding !== undefined) {
    renderer.outputEncoding = THREE.sRGBEncoding;
  }

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 1, 2000);
  camera.position.z = 480;

  const ambient = new THREE.AmbientLight(0xffffff, 0.95);
  const key = new THREE.DirectionalLight(0xffffff, 1.45);
  const rim = new THREE.PointLight(0xc7e5ff, 1.7, 980);
  const blush = new THREE.PointLight(0xffd1a5, 0.95, 760);
  key.position.set(0, 0, 320);
  rim.position.set(160, 80, 260);
  blush.position.set(70, -40, 210);
  scene.add(ambient, key, rim, blush);

  const geometry = new THREE.BoxGeometry(1, 1, 0.22);
  const palette = [0x2667ff, 0xd63f73, 0xf6b73c, 0x10b384, 0x7dd8ff, 0x8e72ff];
  const active = [];
  let raf = 0;
  let viewportWidth = 0;
  let viewportHeight = 0;

  function resize() {
    viewportWidth = window.innerWidth;
    viewportHeight = window.innerHeight;
    renderer.setSize(viewportWidth, viewportHeight, false);
    camera.left = -viewportWidth / 2;
    camera.right = viewportWidth / 2;
    camera.top = viewportHeight / 2;
    camera.bottom = -viewportHeight / 2;
    camera.updateProjectionMatrix();
  }

  function buildMaterial(colorValue) {
    return new THREE.MeshPhongMaterial({
      color: colorValue,
      emissive: colorValue,
      emissiveIntensity: 0.34,
      specular: 0xffffff,
      shininess: 135,
      transparent: true,
      opacity: 0,
      depthWrite: false
    });
  }

  function createParticle(originX, originY, index) {
    const color = palette[Math.floor(Math.random() * palette.length)];
    const material = buildMaterial(color);
    const mesh = new THREE.Mesh(geometry, material);
    const size = 9 + Math.random() * 8;
    const biasRight = Math.random() < 0.9 ? 1 : -1;
    const baseSide = size * (0.92 + Math.random() * 0.24);
    const depth = 2.2 + Math.random() * 1.6;
    const endX = originX + biasRight * (biasRight > 0 ? 180 + Math.random() * 220 : 42 + Math.random() * 70);
    const endY = originY - (74 + Math.random() * 160);

    mesh.scale.set(baseSide, baseSide, depth);
    mesh.position.set(originX, originY, 0);
    scene.add(mesh);

    return {
      mesh,
      material,
      startedAt: performance.now() + index * (8 + Math.random() * 8),
      duration: 2600 + Math.random() * 980,
      originX,
      originY,
      cp1X: originX + biasRight * (36 + Math.random() * 72),
      cp1Y: originY - (8 + Math.random() * 28),
      cp2X: originX + biasRight * (114 + Math.random() * 148),
      cp2Y: originY - (42 + Math.random() * 88),
      endX,
      endY,
      swirlRadius: 18 + Math.random() * 30,
      swirlTurns: 0.82 + Math.random() * 0.76,
      baseAngle: Math.random() * Math.PI * 2,
      tiltX: (Math.random() - 0.5) * 0.56,
      tiltY: (Math.random() - 0.5) * 0.56,
      spin: (Math.random() - 0.5) * 0.18,
      driftDown: 64 + Math.random() * 90,
      baseSide,
      depth
    };
  }

  function destroyParticle(particle) {
    scene.remove(particle.mesh);
    particle.material.dispose();
  }

  function tick(now) {
    for (let i = active.length - 1; i >= 0; i -= 1) {
      const particle = active[i];
      if (now < particle.startedAt) continue;

      const t = Math.max(0, Math.min(1, (now - particle.startedAt) / particle.duration));
      const eased = 1 - Math.pow(1 - t, 3);
      const x = cubicBezier(particle.originX, particle.cp1X, particle.cp2X, particle.endX, eased);
      const yCurve = cubicBezier(particle.originY, particle.cp1Y, particle.cp2Y, particle.endY, eased);
      const swirlDecay = Math.pow(1 - t, 1.08);
      const swirlAngle = particle.baseAngle + particle.swirlTurns * Math.PI * 2 * eased;
      const swirlX = Math.cos(swirlAngle) * particle.swirlRadius * swirlDecay;
      const swirlY = Math.sin(swirlAngle) * particle.swirlRadius * swirlDecay * 0.48;
      const y = yCurve - swirlY - Math.pow(t, 1.16) * particle.driftDown;
      const opacity = smoothStep(0, 0.07, t) * (1 - smoothStep(0.82, 1, t)) * 1.04;
      const scalePulse = 0.96 + Math.sin(t * Math.PI) * 0.12;

      particle.mesh.position.set(x + swirlX, y, Math.sin(swirlAngle * 0.85) * 28);
      particle.mesh.rotation.set(
        particle.tiltX + swirlAngle * 0.28,
        particle.tiltY + swirlAngle * 0.34,
        swirlAngle * 0.22 + particle.spin * (now * 0.01)
      );
      particle.mesh.scale.set(
        particle.baseSide * scalePulse,
        particle.baseSide * scalePulse,
        particle.depth
      );
      particle.material.opacity = opacity;
      particle.material.emissiveIntensity = 0.26 + opacity * 0.64;

      if (t >= 1) {
        destroyParticle(particle);
        active.splice(i, 1);
      }
    }

    renderer.render(scene, camera);

    if (active.length > 0) {
      raf = requestAnimationFrame(tick);
      layer.classList.add('is-visible');
    } else {
      raf = 0;
      layer.classList.remove('is-visible');
    }
  }

  function burst() {
    const rect = trigger.getBoundingClientRect();
    const originX = rect.left + rect.width / 2 - viewportWidth / 2;
    const originY = viewportHeight / 2 - (rect.top + rect.height / 2);
    const count = 96;

    for (let i = 0; i < count; i += 1) {
      active.push(createParticle(originX, originY, i));
    }

    if (!raf) raf = requestAnimationFrame(tick);
  }

  window.addEventListener('resize', resize, { passive: true });
  resize();

  return { burst };
}

function setupLogoPixelBurst() {
  if (prefersReducedMotion()) return;

  const trigger = document.querySelector('.pixel-square');
  if (!trigger || trigger.dataset.pixelBurstBound === 'true') return;
  trigger.dataset.pixelBurstBound = 'true';

  let layer = document.querySelector('.logo-pixel-burst-layer');
  if (!layer) {
    layer = document.createElement('div');
    layer.className = 'logo-pixel-burst-layer';
    document.body.appendChild(layer);
  }

  trigger.addEventListener('click', () => {
    const rect = trigger.getBoundingClientRect();
    const colors = ['#60a5fa', '#f0abfc', '#86efac', '#fca5a5', '#ffffff'];

    for (let i = 0; i < 16; i += 1) {
      const pixel = document.createElement('span');
      const angle = (Math.PI * 2 * i) / 16 + (Math.random() - 0.5) * 0.34;
      const distance = 34 + Math.random() * 64;
      pixel.className = 'logo-burst-pixel';
      pixel.style.left = `${rect.left + rect.width / 2}px`;
      pixel.style.top = `${rect.top + rect.height / 2}px`;
      pixel.style.setProperty('--burst-x', `${Math.cos(angle) * distance}px`);
      pixel.style.setProperty('--burst-y', `${Math.sin(angle) * distance}px`);
      pixel.style.setProperty('--burst-r', `${Math.round((Math.random() - 0.5) * 220)}deg`);
      pixel.style.setProperty('--burst-delay', `${i * 5}ms`);
      pixel.style.setProperty('--burst-color', colors[i % colors.length]);
      layer.appendChild(pixel);
      window.setTimeout(() => pixel.remove(), 850);
    }
  });
}

function setupProjectViewTransitions() {
  const cards = Array.from(document.querySelectorAll('.project-card'));
  if (!cards.length) return;

  cards.forEach((card) => {
    card.addEventListener('pointerdown', () => {
      document.querySelectorAll('.project-image').forEach((image) => {
        image.style.viewTransitionName = 'none';
      });
      const cover = card.querySelector('.project-image');
      if (cover) cover.style.viewTransitionName = 'project-cover';
    });
  });
}

function setupFooterField() {
  if (!supportsFinePointer() || prefersReducedMotion()) return;

  document.querySelectorAll('.page').forEach((page) => {
    if (page.querySelector('.footer-field')) return;

    const field = document.createElement('div');
    field.className = 'footer-field';
    field.innerHTML = '<canvas class="footer-field-canvas"></canvas>';
    page.appendChild(field);

    const canvas = field.querySelector('canvas');
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    const mouse = { x: -9999, y: -9999, active: false };
    const pairs = [];
    let width = 0;
    let height = 0;
    let visible = false;
    let rafId = 0;
    let activeUntil = 0;

    function buildPairs() {
      pairs.length = 0;
      const pairCount = Math.max(18, Math.round(width / 70));
      for (let i = 0; i < pairCount; i += 1) {
        const cx = Math.random() * width;
        const cy = height * (0.18 + Math.random() * 0.68);
        pairs.push({
          cx,
          cy,
          length: 16 + Math.random() * 18,
          angle: Math.random() * Math.PI * 2,
          speed: 0.0015 + Math.random() * 0.0025,
          driftX: (Math.random() - 0.5) * 0.22,
          driftY: (Math.random() - 0.5) * 0.12,
          phase: Math.random() * Math.PI * 2
        });
      }
    }

    function resize() {
      const rect = field.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = Math.max(320, Math.round(rect.width));
      height = Math.max(220, Math.round(rect.height));
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      buildPairs();
    }

    function updateMouse(ev) {
      const rect = field.getBoundingClientRect();
      if (ev.clientX < rect.left || ev.clientX > rect.right || ev.clientY < rect.top || ev.clientY > rect.bottom) {
        mouse.active = false;
        return;
      }
      mouse.x = ev.clientX - rect.left;
      mouse.y = ev.clientY - rect.top;
      mouse.active = true;
      activeUntil = performance.now() + 650;
      scheduleDraw();
    }

    function scheduleDraw() {
      if (!rafId) rafId = window.requestAnimationFrame(draw);
    }

    function draw() {
      rafId = 0;
      if (!visible) return;

      ctx.clearRect(0, 0, width, height);

      const nodes = [];
      const now = performance.now();

      pairs.forEach((pair) => {
        pair.cx += pair.driftX;
        pair.cy += pair.driftY;
        if (pair.cx < -40) pair.cx = width + 40;
        if (pair.cx > width + 40) pair.cx = -40;
        if (pair.cy < 30 || pair.cy > height - 12) pair.driftY *= -1;

        const angle = pair.angle + now * pair.speed;
        let ax = pair.cx + Math.cos(angle) * pair.length * 0.5;
        let ay = pair.cy + Math.sin(angle) * pair.length * 0.5;
        let bx = pair.cx - Math.cos(angle) * pair.length * 0.5;
        let by = pair.cy - Math.sin(angle) * pair.length * 0.5;

        if (mouse.active) {
          [
            { x: ax, y: ay, side: 'a' },
            { x: bx, y: by, side: 'b' }
          ].forEach((node) => {
            const dx = node.x - mouse.x;
            const dy = node.y - mouse.y;
            const dist = Math.hypot(dx, dy) || 1;
            if (dist < 120) {
              const force = (1 - dist / 120) * 18;
              const pushX = (dx / dist) * force;
              const pushY = (dy / dist) * force;
              if (node.side === 'a') {
                ax += pushX;
                ay += pushY;
              } else {
                bx += pushX;
                by += pushY;
              }
            }
          });
        }

        const intensity = mouse.active ? Math.max(0, 1 - Math.min(Math.hypot(pair.cx - mouse.x, pair.cy - mouse.y), 220) / 220) : 0;

        ctx.strokeStyle = `rgba(180, 204, 244, ${0.16 + intensity * 0.26})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(ax, ay);
        ctx.lineTo(bx, by);
        ctx.stroke();

        ctx.fillStyle = `rgba(244, 248, 255, ${0.52 + intensity * 0.24})`;
        ctx.beginPath();
        ctx.arc(ax, ay, 1.6 + intensity * 0.4, 0, Math.PI * 2);
        ctx.arc(bx, by, 1.6 + intensity * 0.4, 0, Math.PI * 2);
        ctx.fill();

        nodes.push({ x: pair.cx, y: pair.cy, intensity });
      });

      for (let i = 0; i < nodes.length; i += 1) {
        for (let j = i + 1; j < nodes.length; j += 1) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const dist = Math.hypot(dx, dy);
          if (dist < 96) {
            const opacity = (1 - dist / 96) * 0.08 + Math.max(nodes[i].intensity, nodes[j].intensity) * 0.08;
            ctx.strokeStyle = `rgba(164, 190, 240, ${opacity})`;
            ctx.lineWidth = 0.8;
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.stroke();
          }
        }
      }

      if (mouse.active && performance.now() < activeUntil) {
        scheduleDraw();
      } else {
        mouse.active = false;
      }
    }

    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver((entries) => {
        visible = entries.some((entry) => entry.isIntersecting);
        if (visible) scheduleDraw();
      }, { threshold: 0.05 });
      io.observe(field);
    } else {
      visible = true;
      scheduleDraw();
    }

    window.addEventListener('pointermove', updateMouse, { passive: true });
    window.addEventListener('pointerleave', () => {
      mouse.active = false;
    });
    window.addEventListener('resize', resize);

    resize();
    if (visible) scheduleDraw();
  });
}

setupPageLoader();

document.addEventListener('DOMContentLoaded', () => {
  setupHomeHeroIntro();
  setupReveal();
  optimizeMediaLoading();
  setupManagedVideos();
  setupPhotoLightbox();
  setupProjectViewTransitions();
  scheduleNonCriticalSetup();
});
