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
    const count = reduced ? 8 : window.innerWidth < 700 ? 4 : 16;

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
  setupFooterField();
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
  // Keep this image-only. Project videos share the .shot-img class, but their
  // native controls must never be routed through the image preview.
  const images = Array.from(document.querySelectorAll(
    '.page-photo img.photo-img, .proj-gallery img.shot-img'
  ));
  document.querySelectorAll('.proj-gallery video.shot-img').forEach((video) => {
    video.addEventListener('click', (ev) => ev.stopPropagation());
    video.addEventListener('pointerdown', (ev) => ev.stopPropagation());
  });

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
      if (targetImage.tagName !== 'IMG') return;
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
  const compactViewport = window.innerWidth < 700;
  let width = 0;
  let height = 0;
  let dpr = 1;
  let raf = 0;
  let visible = !document.hidden;
  let lastPaint = 0;

  const motes = Array.from({ length: compactViewport ? 2 : 28 }, () => ({
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
    const cyber = document.documentElement.dataset.theme === 'cyber';
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
    ctx.strokeStyle = cyber
      ? `rgba(${['0, 240, 255', '255, 42, 109', '252, 238, 10'][index]}, ${opacity})`
      : index === 0
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
    if (!prefersReduced && !compactViewport && now - lastPaint < 40) {
      raf = requestAnimationFrame(draw);
      return;
    }
    lastPaint = now;

    ctx.clearRect(0, 0, width, height);
    ctx.save();

    ctx.globalCompositeOperation = 'source-over';
    const cyber = document.documentElement.dataset.theme === 'cyber';
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, 'rgba(255,255,255,0)');
    gradient.addColorStop(0.35, cyber ? 'rgba(0,240,255,0.015)' : 'rgba(215,228,246,0.08)');
    gradient.addColorStop(0.65, cyber ? 'rgba(255,42,109,0.015)' : 'rgba(189,212,240,0.11)');
    gradient.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    drawWaveBand(now, 0, compactViewport ? 0.16 : 0.28, compactViewport ? 1.1 : 1.45);
    if (!compactViewport) {
      drawWaveBand(now, 1, 0.2, 1.12);
      drawWaveBand(now, 2, 0.16, 0.96);
    }
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

      ctx.fillStyle = cyber ? ['#00f0ff33', '#ff2a6d33', '#fcee0a33'][index % 3] : mote.color;
      ctx.fillRect(mote.x, mote.y, mote.size, mote.size);

      ctx.fillStyle = 'rgba(255,255,255,0.18)';
      ctx.fillRect(mote.x + 1, mote.y + 1, Math.max(1, mote.size * 0.4), Math.max(1, mote.size * 0.4));
    });

    if (!cyber) {
      const wash = ctx.createRadialGradient(width * 0.58, height * 0.72, 10, width * 0.58, height * 0.72, width * 0.52);
      wash.addColorStop(0, 'rgba(180, 221, 255, 0.14)');
      wash.addColorStop(0.42, 'rgba(129, 185, 255, 0.08)');
      wash.addColorStop(1, 'rgba(129, 185, 255, 0)');
      ctx.fillStyle = wash;
      ctx.fillRect(0, 0, width, height);
    }

    ctx.restore();

    if (!prefersReduced && !compactViewport) raf = requestAnimationFrame(draw);
  }

  function schedule() {
    if (!raf && !prefersReduced && !compactViewport) raf = requestAnimationFrame(draw);
  }

  document.addEventListener('visibilitychange', () => {
    visible = !document.hidden;
    if (visible) schedule();
  });

  window.addEventListener('resize', resize, { passive: true });
  window.addEventListener('portfolio-theme-change', () => {
    cancelAnimationFrame(raf);
    lastPaint = 0;
    draw(performance.now());
  });
  resize();
  if (prefersReduced || compactViewport) {
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

  const showDelay = hasSeenLoader ? 220 : 180;
  const minVisible = hasSeenLoader ? 100 : 250;
  const maxVisible = hasSeenLoader ? 800 : 1200;
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
      const cyber = document.documentElement.dataset.theme === 'cyber';

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

        ctx.strokeStyle = `rgba(${cyber ? '0, 240, 255' : '180, 204, 244'}, ${0.16 + intensity * 0.26})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(ax, ay);
        ctx.lineTo(bx, by);
        ctx.stroke();

        ctx.fillStyle = `rgba(${cyber ? '252, 238, 10' : '244, 248, 255'}, ${0.52 + intensity * 0.24})`;
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
            ctx.strokeStyle = `rgba(${cyber ? '255, 42, 109' : '164, 190, 240'}, ${opacity})`;
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

    window.addEventListener('portfolio-theme-change', scheduleDraw);

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

function setupProjectFilter() {
  const bar = document.querySelector('.project-filters');
  const grid = document.querySelector('.project-grid-large');
  if (!bar || !grid) return;

  const cards = Array.from(grid.querySelectorAll('.project-card[data-category]'));
  if (cards.length === 0) return;

  const buttons = Array.from(bar.querySelectorAll('.filter-btn'));

  // Counts are derived from the DOM, so adding a card never leaves a stale number.
  buttons.forEach((btn) => {
    const key = btn.dataset.filter;
    const n = key === 'all' ? cards.length : cards.filter((c) => c.dataset.category === key).length;
    const slot = btn.querySelector('.filter-count');
    if (slot) slot.textContent = String(n);
    if (n === 0 && key !== 'all') btn.hidden = true;
  });

  function apply(key) {
    cards.forEach((card) => {
      const show = key === 'all' || card.dataset.category === key;
      card.classList.toggle('is-filtered-out', !show);
      // setupReveal() unobserves a card once it has animated in. A card revealed
      // for the first time by a filter change would otherwise stay at opacity 0,
      // so mark anything we show as already revealed.
      if (show) {
        card.classList.add('is-visible');
        card.classList.add('visible');
        card.style.transitionDelay = '0ms';
      }
    });
    buttons.forEach((btn) => {
      const on = btn.dataset.filter === key;
      btn.classList.toggle('is-active', on);
      btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
  }

  bar.addEventListener('click', (e) => {
    const btn = e.target.closest('.filter-btn');
    if (!btn || !bar.contains(btn)) return;
    apply(btn.dataset.filter);
  });
}

function setupProjectViewMode() {
  const grid = document.querySelector('.project-grid-large');
  const bar = document.querySelector('.project-view-switch');
  if (!grid || !bar) return;

  const buttons = Array.from(bar.querySelectorAll('.view-btn'));
  const storageKey = 'cv-project-view-mode';

  function apply(mode) {
    const value = mode === 'studio' ? 'studio' : 'grid';
    grid.classList.toggle('is-studio-view', value === 'studio');
    buttons.forEach((button) => {
      const active = button.dataset.view === value;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
    try { window.localStorage.setItem(storageKey, value); } catch (_) { /* private browsing */ }
  }

  let initial = 'grid';
  try { initial = window.localStorage.getItem(storageKey) || initial; } catch (_) { /* private browsing */ }
  apply(initial);
  bar.addEventListener('click', (event) => {
    const button = event.target.closest('.view-btn');
    if (button && bar.contains(button)) apply(button.dataset.view);
  });

}

function setupProjectCoverLabels() {
  document.querySelectorAll('.project-card[data-cover-type]').forEach((card) => {
    const visual = card.querySelector('.project-visual');
    if (!visual || visual.querySelector('.project-cover-meta')) return;

    const meta = document.createElement('div');
    meta.className = 'project-cover-meta';
    meta.setAttribute('aria-hidden', 'true');
    meta.innerHTML = `
      <span class="project-cover-type">${card.dataset.coverType}</span>
      <span class="project-cover-stack">${card.dataset.coverStack || ''}</span>
    `;
    visual.appendChild(meta);
  });
}

setupPageLoader();

document.addEventListener('DOMContentLoaded', () => {
  setupHomeHeroIntro();
  setupReveal();
  setupProjectFilter();
  setupProjectViewMode();
  setupProjectCoverLabels();
  optimizeMediaLoading();
  setupManagedVideos();
  setupPhotoLightbox();
  setupProjectViewTransitions();
  scheduleNonCriticalSetup();
});
