import type { APIRoute } from 'astro';
import { SITE } from '../consts';
import { getPosts } from '../lib/blogs';

// The site for language models (llmstxt.org): who this is, then every post as Markdown, the projects and where
// else to find him. The projects mirror the home page's `work` list.
const projects = [
  ['css-only-tooltip', 'https://www.npmjs.com/package/css-only-tooltip', 'A tooltip library with no JavaScript. Data attributes in, tooltip out.'],
  ['Diver', 'https://chrome.google.com/webstore/detail/diver/onfnfdmnccoaknhjinebmlncejnofhoc', 'Outlines every element on a page, so you can see the layout you are debugging.'],
  ['YouTube Playlist Info', 'https://youtube-playlist-info.netlify.app', 'Paste a playlist link and see how long it really takes to watch.'],
  ['rajiv.me', `${SITE.socials.github}/thoughtlessmind`, 'Static pages, a drawing that draws itself, and nothing running in the background once it has loaded.'],
];

export const GET: APIRoute = async () => {
  const posts = await getPosts();
  const list = (rows: string[][]) => rows.map(([name, href, note]) => `- [${name}](${href})${note ? `: ${note}` : ''}`).join('\n');
  const body = `# ${SITE.brand}

> ${SITE.name} (thoughtlessmind) is a software engineer in New Delhi, India. He builds web and native apps, their backends and infrastructure, and puts language models to work inside them. Since ${SITE.since}.

I am ${SITE.name}, and this is my site, ${SITE.url}. Everything in one file: ${SITE.url}/llms-full.txt. Lately most of my week goes to putting language models to work inside real products: MCP servers that give a model typed access to a product’s data and actions, model features with a budget for latency and cost and a fallback, and evals that run on every prompt and model change. Every post below links to its Markdown source.

## Blogs

${list(posts.map((p) => [p.data.title, `${SITE.url}/blogs/${p.id}.md`, p.data.description]))}

## Projects

${list(projects)}

## Elsewhere

${list([
  ['GitHub', SITE.socials.github],
  ['LinkedIn', SITE.socials.linkedin],
  ['dev.to', SITE.socials.devto],
  ['Stack Overflow', SITE.socials.stackoverflow],
  ['X', SITE.socials.x],
  ['Email', `mailto:${SITE.email}`],
])}
`;
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
