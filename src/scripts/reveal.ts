// Scroll reveal: once, 50ms stagger inside [data-reveal-group] (max 6). The 2-step clip-path wipe is CSS
// (global.css, .reveal.is-visible); this only adds .is-visible and sets --reveal-delay.
const STAGGER = 50;
const MAX_STAGGER = 6;

const observer =
  'IntersectionObserver' in window
    ? new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (!entry.isIntersecting) continue;
            entry.target.classList.add('is-visible');
            observer?.unobserve(entry.target);
          }
        },
        { rootMargin: '0px 0px -10% 0px' },
      )
    : null;

function init() {
  const groups = document.querySelectorAll<HTMLElement>('[data-reveal-group]');
  for (const group of groups) {
    const items = group.querySelectorAll<HTMLElement>('.reveal');
    items.forEach((el, i) => {
      if (el.dataset.revealDelay) return;
      el.style.setProperty('--reveal-delay', `${Math.min(i, MAX_STAGGER - 1) * STAGGER}ms`);
    });
  }

  const items = document.querySelectorAll<HTMLElement>('.reveal:not(.is-visible)');
  for (const el of items) {
    if (el.dataset.revealDelay) el.style.setProperty('--reveal-delay', `${el.dataset.revealDelay}ms`);
    if (observer) observer.observe(el);
    else el.classList.add('is-visible');
  }
}

document.addEventListener('astro:page-load', init);
// Drop the outgoing page's targets so detached nodes are not retained.
document.addEventListener('astro:before-swap', () => observer?.disconnect());

export {};
