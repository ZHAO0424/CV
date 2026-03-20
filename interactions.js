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

  // Fallback: ensure no section stays hidden if the browser misses an observer update.
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
    const max = 5.5; // degrees
    let raf = 0;

    function onMove(ev) {
      const rect = card.getBoundingClientRect();
      const px = (ev.clientX - rect.left) / rect.width;
      const py = (ev.clientY - rect.top) / rect.height;
      const rx = (py - 0.5) * -max;
      const ry = (px - 0.5) * max;

      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        card.style.transform = `translateY(-4px) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg)`;
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

document.addEventListener('DOMContentLoaded', () => {
  setupReveal();
  setupCardTilt();
});

