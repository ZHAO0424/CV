function prefersReducedMotion() {
  return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
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
          e.target.classList.add('is-visible');
          e.target.classList.add('visible');
          io.unobserve(e.target);
        }
      });
    },
    { threshold: 0.1, rootMargin: '0px 0px -10% 0px' }
  );

  nodes.forEach((n) => io.observe(n));

  window.setTimeout(() => {
    nodes.forEach((n) => {
      n.classList.add('is-visible');
      n.classList.add('visible');
    });
  }, 700);
}

function setupCardTilt() {
  if (prefersReducedMotion()) return;
  const cards = Array.from(document.querySelectorAll('.project-card[data-tilt="true"]'));
  if (cards.length === 0) return;

  cards.forEach((card) => {
    const maxRotation = 5.5;
    const maxShift = 10;
    let raf = 0;

    function onMove(ev) {
      const rect = card.getBoundingClientRect();
      const px = (ev.clientX - rect.left) / rect.width;
      const py = (ev.clientY - rect.top) / rect.height;
      const rx = (py - 0.5) * -maxRotation;
      const ry = (px - 0.5) * maxRotation;
      const tx = (px - 0.5) * maxShift;
      const ty = (py - 0.5) * maxShift * 0.45;

      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        card.style.transform = `translate3d(${tx.toFixed(2)}px, ${(-4 + ty).toFixed(2)}px, 0) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg)`;
      });
    }

    function onLeave() {
      cancelAnimationFrame(raf);
      card.style.transform = '';
    }

    card.addEventListener('mousemove', onMove);
    card.addEventListener('mouseleave', onLeave);
  });
}

function optimizeMediaLoading() {
  const images = Array.from(document.querySelectorAll('img'));
  images.forEach((img, index) => {
    const isPriority = index < 3 || !!img.closest('.hero, .resume-hero, .proj-hero, .side-cover-box, .project-card-media');
    if (!img.hasAttribute('decoding')) img.decoding = 'async';
    if (!img.hasAttribute('loading')) img.loading = isPriority ? 'eager' : 'lazy';
    if (!img.hasAttribute('fetchpriority')) img.fetchPriority = isPriority ? 'high' : 'low';
  });

  document.querySelectorAll('video').forEach((video, index) => {
    if (!video.hasAttribute('preload')) video.preload = index === 0 ? 'metadata' : 'none';
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

function setupMagneticTargets() {
  if (prefersReducedMotion()) return;

  const targets = Array.from(
    document.querySelectorAll(
      '.nav-link, .lang-btn, .proj-back, .footer-link, .project-card, .photo-card, .shot, .side-cover-box, .tag'
    )
  );

  targets.forEach((target) => {
    if (target.classList.contains('project-card')) return;

    const strength = target.matches('.nav-link, .lang-btn, .proj-back, .footer-link, .tag') ? 7 : 10;

    function onMove(ev) {
      const rect = target.getBoundingClientRect();
      const offsetX = ev.clientX - (rect.left + rect.width / 2);
      const offsetY = ev.clientY - (rect.top + rect.height / 2);
      const moveX = (offsetX / rect.width) * strength;
      const moveY = (offsetY / rect.height) * strength;
      target.style.setProperty('--cursor-mx', `${moveX.toFixed(2)}px`);
      target.style.setProperty('--cursor-my', `${moveY.toFixed(2)}px`);
      target.classList.add('cursor-magnetic');
    }

    function onLeave() {
      target.style.removeProperty('--cursor-mx');
      target.style.removeProperty('--cursor-my');
      target.classList.remove('cursor-magnetic');
    }

    target.addEventListener('mousemove', onMove);
    target.addEventListener('mouseleave', onLeave);
  });
}

function setupCursorEffects() {
  const supportsFinePointer = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (!supportsFinePointer || prefersReducedMotion()) return;

  const body = document.body;
  if (!body) return;

  const shell = document.createElement('div');
  shell.className = 'cursor-shell';
  shell.innerHTML = `
    <div class="cursor-trail cursor-trail-1"></div>
    <div class="cursor-trail cursor-trail-2"></div>
    <div class="cursor-trail cursor-trail-3"></div>
    <div class="cursor-ring"></div>
    <div class="cursor-dot"></div>
    <div class="cursor-label"></div>
  `;
  body.appendChild(shell);
  body.classList.add('has-custom-cursor');

  const dot = shell.querySelector('.cursor-dot');
  const ring = shell.querySelector('.cursor-ring');
  const label = shell.querySelector('.cursor-label');
  const trails = Array.from(shell.querySelectorAll('.cursor-trail'));

  const state = {
    x: window.innerWidth / 2,
    y: window.innerHeight / 2,
    currentX: window.innerWidth / 2,
    currentY: window.innerHeight / 2,
    visible: false,
    hover: 'default'
  };

  const trailPoints = trails.map(() => ({ x: state.currentX, y: state.currentY }));

  function applyHoverState(kind) {
    state.hover = kind;
    body.dataset.cursor = kind;
    label.textContent = kind === 'video' ? 'PLAY' : kind === 'link' ? 'OPEN' : '';
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
    applyHoverState(resolveHoverKind(ev.target));
  }

  function onPointerLeave() {
    state.visible = false;
    shell.classList.remove('is-visible');
    applyHoverState('default');
  }

  function animate() {
    state.currentX += (state.x - state.currentX) * 0.2;
    state.currentY += (state.y - state.currentY) * 0.2;

    const ringOffsetX = state.hover === 'link' ? 18 : state.hover === 'video' ? 22 : state.hover === 'card' ? 20 : 16;
    const ringOffsetY = ringOffsetX;
    const dotOffset = 4;

    ring.style.transform = `translate3d(${(state.currentX - ringOffsetX).toFixed(2)}px, ${(state.currentY - ringOffsetY).toFixed(2)}px, 0)`;
    dot.style.transform = `translate3d(${(state.currentX - dotOffset).toFixed(2)}px, ${(state.currentY - dotOffset).toFixed(2)}px, 0)`;
    label.style.transform = `translate3d(${(state.currentX + 18).toFixed(2)}px, ${(state.currentY - 18).toFixed(2)}px, 0)`;

    let leaderX = state.currentX;
    let leaderY = state.currentY;
    trails.forEach((trail, index) => {
      const point = trailPoints[index];
      point.x += (leaderX - point.x) * (0.24 - index * 0.03);
      point.y += (leaderY - point.y) * (0.24 - index * 0.03);
      trail.style.transform = `translate3d(${(point.x - 5).toFixed(2)}px, ${(point.y - 5).toFixed(2)}px, 0)`;
      leaderX = point.x;
      leaderY = point.y;
    });

    window.requestAnimationFrame(animate);
  }

  document.addEventListener('pointermove', onPointerMove, { passive: true });
  document.addEventListener('pointerleave', onPointerLeave);
  window.addEventListener('blur', onPointerLeave);
  window.requestAnimationFrame(animate);
}

document.addEventListener('DOMContentLoaded', () => {
  setupReveal();
  setupCardTilt();
  optimizeMediaLoading();
  setupManagedVideos();
  setupMagneticTargets();
  setupCursorEffects();
});
