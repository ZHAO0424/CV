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
  if (!supportsFinePointer() || prefersReducedMotion()) return;

  const body = document.body;
  if (!body) return;

  const shell = document.createElement('div');
  shell.className = 'cursor-shell';
  shell.innerHTML = `
    <div class="cursor-trail cursor-trail-1"></div>
    <div class="cursor-trail cursor-trail-2"></div>
    <div class="cursor-trail cursor-trail-3"></div>
    <div class="cursor-aura"></div>
    <div class="cursor-ring"></div>
  `;
  body.appendChild(shell);
  body.classList.add('has-custom-cursor');

  const aura = shell.querySelector('.cursor-aura');
  const ring = shell.querySelector('.cursor-ring');
  const trails = Array.from(shell.querySelectorAll('.cursor-trail'));

  const state = {
    x: window.innerWidth / 2,
    y: window.innerHeight / 2,
    currentX: window.innerWidth / 2,
    currentY: window.innerHeight / 2,
    hover: 'default'
  };

  const trailPoints = trails.map(() => ({ x: state.currentX, y: state.currentY }));

  function applyHoverState(kind) {
    state.hover = kind;
    body.dataset.cursor = kind;
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
    shell.classList.add('is-visible');
    applyHoverState(resolveHoverKind(ev.target));
  }

  function onPointerLeave() {
    shell.classList.remove('is-visible');
    applyHoverState('default');
  }

  function animate() {
    state.currentX += (state.x - state.currentX) * 0.18;
    state.currentY += (state.y - state.currentY) * 0.18;

    const auraSize = state.hover === 'video' ? 58 : state.hover === 'link' ? 52 : state.hover === 'card' ? 46 : 36;
    const ringSize = state.hover === 'video' ? 42 : state.hover === 'link' ? 38 : state.hover === 'card' ? 32 : 24;

    aura.style.transform = `translate3d(${(state.currentX - auraSize / 2).toFixed(2)}px, ${(state.currentY - auraSize / 2).toFixed(2)}px, 0)`;
    ring.style.transform = `translate3d(${(state.currentX - ringSize / 2).toFixed(2)}px, ${(state.currentY - ringSize / 2).toFixed(2)}px, 0)`;

    let leaderX = state.currentX;
    let leaderY = state.currentY;
    trails.forEach((trail, index) => {
      const point = trailPoints[index];
      point.x += (leaderX - point.x) * (0.22 - index * 0.03);
      point.y += (leaderY - point.y) * (0.22 - index * 0.03);
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
function setupLogoPixelBurst() {
  if (prefersReducedMotion()) return;

  const trigger = document.querySelector('.pixel-square');
  if (!trigger || trigger.dataset.pixelBurstBound === 'true') return;
  trigger.dataset.pixelBurstBound = 'true';

  let layer = document.querySelector('.logo-pixel-layer');
  if (!layer) {
    layer = document.createElement('div');
    layer.className = 'logo-pixel-layer';
    document.body.appendChild(layer);
  }

  const palettes = [
    { fill: 'linear-gradient(135deg, rgba(30,77,178,0.98), rgba(92,163,255,0.92))', glow: 'rgba(80, 148, 255, 0.35)', border: 'rgba(197, 223, 255, 0.55)' },
    { fill: 'linear-gradient(135deg, rgba(145,18,68,0.98), rgba(255,108,170,0.92))', glow: 'rgba(255, 112, 169, 0.32)', border: 'rgba(255, 212, 232, 0.55)' },
    { fill: 'linear-gradient(135deg, rgba(171,87,14,0.98), rgba(255,189,88,0.94))', glow: 'rgba(255, 187, 93, 0.34)', border: 'rgba(255, 226, 182, 0.52)' },
    { fill: 'linear-gradient(135deg, rgba(15,121,97,0.98), rgba(101,231,201,0.9))', glow: 'rgba(102, 232, 201, 0.30)', border: 'rgba(204, 255, 243, 0.50)' },
    { fill: 'linear-gradient(135deg, rgba(89,32,153,0.98), rgba(176,123,255,0.90))', glow: 'rgba(172, 121, 255, 0.28)', border: 'rgba(226, 213, 255, 0.52)' }
  ];

  const fragments = [];
  let raf = 0;
  let obstacleMap = [];

  function collectObstacles(originY) {
    const selector = '.glass, .resume-section, .photo-card, .project-card, .shot';
    const nodes = Array.from(new Set(Array.from(document.querySelectorAll(selector))));

    return nodes
      .filter((node) => node !== trigger && !node.contains(trigger) && !node.classList.contains('footer-field'))
      .map((node, index) => {
        const rect = node.getBoundingClientRect();
        return {
          id: index,
          left: rect.left,
          right: rect.right,
          top: rect.top,
          bottom: rect.bottom,
          width: rect.width,
          height: rect.height
        };
      })
      .filter((rect) => rect.width > 160 && rect.height > 48 && rect.bottom > originY + 20 && rect.top < window.innerHeight - 36)
      .sort((a, b) => a.top - b.top);
  }

  function spawnFragment(originX, originY, burstLeft, burstWidth, burstBase) {
    const node = document.createElement('span');
    node.className = 'logo-pixel';
    const palette = palettes[Math.floor(Math.random() * palettes.length)];
    const width = 10 + Math.random() * 10;
    const height = width * (0.82 + Math.random() * 0.38);
    const laneCount = burstBase.length;
    const lane = Math.min(laneCount - 1, Math.floor(Math.pow(Math.random(), 0.7) * laneCount));
    const laneGap = burstWidth / Math.max(1, laneCount - 1);
    const floorX = burstLeft + lane * laneGap + (Math.random() - 0.08) * 10;
    const floorY = window.innerHeight - 10 - height - burstBase[lane] * (5 + Math.random() * 4);
    burstBase[lane] += 1;

    node.style.width = `${width}px`;
    node.style.height = `${height}px`;
    node.style.background = palette.fill;
    node.style.borderColor = palette.border;
    node.style.boxShadow = `0 0 14px ${palette.glow}, inset 0 1px 0 rgba(255,255,255,0.28)`;
    node.style.opacity = `${0.8 + Math.random() * 0.16}`;
    layer.appendChild(node);

    fragments.push({
      el: node,
      width,
      height,
      x: originX + (Math.random() - 0.2) * 5,
      y: originY + (Math.random() - 0.5) * 4,
      vx: (floorX - originX) / (220 + Math.random() * 34),
      vy: 0.14 + Math.random() * 0.14,
      gravity: 0.14 + Math.random() * 0.018,
      rotate: (Math.random() - 0.5) * 8,
      spin: (Math.random() - 0.5) * 0.24,
      floorY,
      floorX,
      settled: false,
      settledAt: 0,
      bounceCount: 0,
      blockedUntil: 0,
      holdX: null,
      holdY: null,
      visitedObstacleIds: new Set(),
      rightPush: 0.0015 + Math.random() * 0.0035,
      slideSpeed: 0.45 + Math.random() * 0.62,
      activeObstacleRight: null
    });

    if (!raf) raf = requestAnimationFrame(tick);
  }

  function triggerBurst() {
    const rect = trigger.getBoundingClientRect();
    const originX = rect.left + rect.width / 2;
    const originY = rect.top + rect.height / 2;
    const burstWidth = 112;
    const burstLeft = Math.max(42, originX - burstWidth * 0.22);
    const burstBase = new Array(7).fill(0);
    const count = 15 + Math.round(Math.random() * 4);

    obstacleMap = collectObstacles(originY);

    for (let i = 0; i < count; i += 1) {
      const delay = i * (34 + Math.random() * 22);
      window.setTimeout(() => spawnFragment(originX, originY, burstLeft, burstWidth, burstBase), delay);
    }
  }

  function resolveFragmentCollisions(now) {
    for (let i = 0; i < fragments.length; i += 1) {
      const a = fragments[i];
      if (a.settled || now < a.blockedUntil) continue;

      for (let j = i + 1; j < fragments.length; j += 1) {
        const b = fragments[j];
        if (b.settled || now < b.blockedUntil) continue;

        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const minX = (a.width + b.width) * 0.42;
        const minY = (a.height + b.height) * 0.4;

        if (Math.abs(dx) >= minX || Math.abs(dy) >= minY) continue;

        const overlapX = minX - Math.abs(dx);
        const overlapY = minY - Math.abs(dy);
        const dirX = dx === 0 ? (Math.random() > 0.5 ? 1 : -1) : Math.sign(dx);

        if (overlapX <= overlapY) {
          const shift = overlapX * 0.22;
          a.x -= dirX * shift;
          b.x += dirX * shift;
          a.vx -= dirX * 0.015;
          b.vx += dirX * 0.015;
        } else {
          const dirY = dy === 0 ? 1 : Math.sign(dy);
          const shift = overlapY * 0.16;
          a.y -= dirY * shift;
          b.y += dirY * shift;
        }
      }
    }
  }

  function tryObstacleCatch(fragment, prevBottom, now) {
    const centerX = fragment.x + fragment.width / 2;

    for (let i = 0; i < obstacleMap.length; i += 1) {
      const obstacle = obstacleMap[i];
      if (fragment.visitedObstacleIds.has(obstacle.id)) continue;
      if (centerX < obstacle.left + 10 || centerX > obstacle.right - 10) continue;
      if (prevBottom > obstacle.top || fragment.y + fragment.height < obstacle.top) continue;

      fragment.y = obstacle.top - fragment.height;
      fragment.vy = 0;
      fragment.blockedUntil = now + 900 + Math.random() * 900;
      fragment.holdX = fragment.x;
      fragment.holdY = fragment.y;
      fragment.activeObstacleRight = obstacle.right;
      fragment.vx = Math.max(fragment.vx, 0.08 + fragment.rightPush * 90);
      fragment.visitedObstacleIds.add(obstacle.id);
      return true;
    }

    return false;
  }

  function tick(now) {
    for (let i = fragments.length - 1; i >= 0; i -= 1) {
      const fragment = fragments[i];

      if (!fragment.settled) {
        if (now < fragment.blockedUntil) {
          const maxSlideX = fragment.activeObstacleRight !== null ? fragment.activeObstacleRight - fragment.width - 14 : fragment.holdX;
          fragment.holdX = Math.min(maxSlideX, fragment.holdX + fragment.slideSpeed);
          fragment.x = fragment.holdX;
          fragment.y = fragment.holdY;
          fragment.rotate += fragment.spin * 0.45;

          if (fragment.x >= maxSlideX - 0.5) {
            fragment.blockedUntil = now;
          }
        } else {
          const prevBottom = fragment.y + fragment.height;
          fragment.vy += fragment.gravity;
          fragment.x += fragment.vx;
          fragment.y += fragment.vy;
          fragment.rotate += fragment.spin;

          fragment.vx += fragment.rightPush;
          fragment.vx += (fragment.floorX - fragment.x) * 0.00016;
          fragment.vx *= 0.995;

          if (!tryObstacleCatch(fragment, prevBottom, now) && fragment.y >= fragment.floorY) {
            fragment.y = fragment.floorY;
            if (fragment.bounceCount < 1 && Math.abs(fragment.vy) > 0.68) {
              fragment.vy *= -0.12;
              fragment.vx *= 0.58;
              fragment.bounceCount += 1;
            } else {
              fragment.vy = 0;
              fragment.vx *= 0.34;
              fragment.activeObstacleRight = null;
              fragment.settled = true;
              fragment.settledAt = now;
              fragment.el.classList.add('is-settled');
            }
          }
        }
      } else {
        const age = now - fragment.settledAt;
        if (age > 3000) {
          fragment.activeObstacleRight = null;
          const fade = Math.max(0, 1 - (age - 3000) / 1800);
          fragment.el.style.opacity = `${fade * 0.9}`;
          if (fade <= 0) {
            fragment.el.remove();
            fragments.splice(i, 1);
            continue;
          }
        }
      }

      fragment.el.style.transform = `translate3d(${fragment.x.toFixed(2)}px, ${fragment.y.toFixed(2)}px, 0) rotate(${fragment.rotate.toFixed(2)}deg)`;
    }

    resolveFragmentCollisions(now);

    if (fragments.length > 0) {
      raf = requestAnimationFrame(tick);
    } else {
      raf = 0;
    }
  }

  trigger.addEventListener('pointerdown', triggerBurst);
  trigger.addEventListener('click', triggerBurst);
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
    }

    function draw() {
      ctx.clearRect(0, 0, width, height);
      if (!visible) {
        window.requestAnimationFrame(draw);
        return;
      }

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

      window.requestAnimationFrame(draw);
    }

    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver((entries) => {
        visible = entries.some((entry) => entry.isIntersecting);
      }, { threshold: 0.05 });
      io.observe(field);
    } else {
      visible = true;
    }

    window.addEventListener('pointermove', updateMouse, { passive: true });
    window.addEventListener('pointerleave', () => {
      mouse.active = false;
    });
    window.addEventListener('resize', resize);

    resize();
    window.requestAnimationFrame(draw);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  setupReveal();
  setupCardTilt();
  optimizeMediaLoading();
  setupManagedVideos();
  setupMagneticTargets();
  setupCursorEffects();
  setupFooterField();
  setupLogoPixelBurst();
});







