// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

// github-light-default is drawn for white; on the light --panel (#dde1e6) three of its colours miss AA (comments
// 3.3:1, keywords 3.9:1, function names 3.7:1), so they take Primer's next darker step (4.9, 6.0, 5.6). The dark
// theme passes as it is (5.5:1 and up on #1c1c1c).
/** @type {Record<string, string>} */
const lightAA = { '#6E7781': '#57606A', '#CF222E': '#A40E26', '#8250DF': '#6639BA' };
const lightOnPanel = {
  /** @param {{ properties: { style?: unknown } }} node */
  span(node) {
    const s = node.properties.style;
    if (typeof s === 'string')
      node.properties.style = s.replace(/--shiki-light:(#\w{6})/, (_, c) => `--shiki-light:${lightAA[c.toUpperCase()] ?? c}`);
  },
};

// https://astro.build/config
export default defineConfig({
  site: 'https://rajiv.me',
  output: 'static',
  // No trailing slash: /about, not /about/. Output stays about/index.html; Cloudflare's drop-trailing-slash
  // serves it at /about and 307s /about/ there (wrangler.jsonc).
  trailingSlash: 'never',
  prefetch: { prefetchAll: true, defaultStrategy: 'hover' },
  // Every page's CSS goes inline in its <head> (about 11 KB gzipped): no render-blocking stylesheet request, so the
  // first paint waits on the HTML alone. Hover prefetch covers the CSS not being shared between pages.
  build: { inlineStylesheets: 'always' },
  integrations: [sitemap()],
  // Code blocks carry both themes as --shiki-light / --shiki-dark; prose.css picks one by the token rules.
  markdown: {
    shikiConfig: {
      themes: { light: 'github-light-default', dark: 'github-dark-default' },
      defaultColor: false,
      transformers: [lightOnPanel],
    },
  },
  vite: { plugins: [tailwindcss()] },
});
