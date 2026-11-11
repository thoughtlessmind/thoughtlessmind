import type { APIRoute } from 'astro';
import { SITE } from '../consts';
import { getPosts } from '../lib/writing';

// The feed, written by hand: a dozen items do not need a dependency. Titles and summaries only; each item links
// to its post.
const esc = (s: string) => s.replace(/[<>&'"]/g, (c) => `&#${c.charCodeAt(0)};`);

export const GET: APIRoute = async () => {
  const posts = await getPosts();
  const items = posts
    .map((p) => {
      const url = `${SITE.url}/writing/${p.id}`;
      return `<item><title>${esc(p.data.title)}</title><link>${url}</link><guid>${url}</guid><description>${esc(p.data.description)}</description><pubDate>${p.data.date.toUTCString()}</pubDate></item>`;
    })
    .join('\n');
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"><channel>
<title>${esc(SITE.name)}</title>
<link>${SITE.url}/writing</link>
<description>Notes on building for the web, and the problems I would rather solve once.</description>
<language>en</language>
${items}
</channel></rss>
`;
  return new Response(body, { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' } });
};
