import type { APIContext } from 'astro';
import { SITE } from '../consts';

export function GET({ site }: APIContext) {
  const sitemap = new URL('/sitemap-index.xml', site ?? SITE.url).href;
  return new Response(`User-agent: *\nAllow: /\n\nSitemap: ${sitemap}\n`, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
