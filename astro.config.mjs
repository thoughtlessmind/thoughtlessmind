// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  // The deploy domain for now; rajiv.me redirects here (a Cloudflare Redirect Rule).
  site: 'https://thoughtlessmind.dev',
  output: 'static',
  // No trailing slash: /about, not /about/. Output stays about/index.html; Cloudflare's drop-trailing-slash
  // serves it at /about and 307s /about/ there (wrangler.jsonc).
  trailingSlash: 'never',
  prefetch: { prefetchAll: true, defaultStrategy: 'hover' },
  integrations: [sitemap()],
  vite: { plugins: [tailwindcss()] },
});
