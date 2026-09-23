// Inlined into <head> before any stylesheet. Sets `html.js` (gates reveal hiding) before first paint and on the
// incoming document of every ClientRouter swap. There is no light mode in space: a `theme` stored by the old light
// theme is dropped.
(() => {
  document.documentElement.classList.add('js');
  document.addEventListener('astro:before-swap', (e) => e.newDocument.documentElement.classList.add('js'));
  try {
    localStorage.removeItem('theme');
  } catch {}
})();
