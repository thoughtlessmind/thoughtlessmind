import type { APIRoute } from 'astro';
import { SITE } from '../consts';
import { getPosts } from '../lib/blogs';

// Every post in full, in one file, for an agent that wants the whole site in one request (llmstxt.org).
export const GET: APIRoute = async () => {
  const posts = await getPosts();
  const body = [
    `# ${SITE.brand}\n\n> ${SITE.name} (thoughtlessmind) is a software engineer in New Delhi, India. ${SITE.url}`,
    ...posts.map((p) => `# ${p.data.title}\n\n${SITE.url}/blogs/${p.id}\n\n${p.data.description}\n\n${p.body?.trim() ?? ''}`),
  ].join('\n\n---\n\n');
  return new Response(`${body}\n`, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
