// Inlined into <head> before any stylesheet. Sets the theme (stored 'light' | 'dark', absent = dark) and
// `html.js` (gates reveal hiding) before first paint, and re-applies them to the incoming document on every
// ClientRouter swap.
(() => {
  const root = document.documentElement;
  const stored = () => {
    try {
      return localStorage.getItem('theme');
    } catch {
      return null;
    }
  };
  const apply = (el) => {
    el.dataset.theme = stored() === 'light' ? 'light' : 'dark';
    el.classList.add('js');
  };
  apply(root);
  document.addEventListener('astro:before-swap', (e) => apply(e.newDocument.documentElement));

  // Browser chrome follows the theme through toggles and page swaps.
  const meta = () => {
    const m = document.querySelector('meta[name="theme-color"]');
    if (m) m.content = root.dataset.theme === 'light' ? '#edebe5' : '#0a0b0d';
  };
  new MutationObserver(meta).observe(root, { attributes: true, attributeFilter: ['data-theme'] });
  document.addEventListener('DOMContentLoaded', meta);
  document.addEventListener('astro:page-load', meta);
})();
