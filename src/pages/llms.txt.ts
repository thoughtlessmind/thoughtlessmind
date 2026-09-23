import type { APIContext } from 'astro';
import { getCollection } from 'astro:content';
import { SITE } from '../consts';
import { getSeries, getSyndicatedPosts, readingTime, slugify } from '../lib/posts';

export async function GET({ site }: APIContext) {
  const base = site ?? SITE.url;
  const abs = (path: string) => new URL(path.endsWith('/') ? path : `${path}/`, base).href;

  const posts = await getSyndicatedPosts();
  const feed = new URL('/rss.xml', base).href;
  const series = getSeries(posts);
  const projects = (await getCollection('projects')).sort((a, b) => a.data.order - b.data.order);

  const lines = [
    `# ${SITE.name}`,
    '',
    `> ${SITE.description}`,
    '',
    `Personal site of ${SITE.name} (${SITE.handle}), ${SITE.location}. Portfolio and writing on frontend engineering: React, TypeScript, CSS, performance, tooling. ${posts.length} articles, ${projects.length} projects. Feed at ${feed}.`,
    '',
    '## Pages',
    '',
    `- [Home](${abs('/')})`,
    ...SITE.nav.map((n) => `- [${n.label}](${abs(n.href)})`),
    `- [RSS](${feed})`,
    '',
    '## Writing',
    '',
    ...posts.map((p) => {
      const { minutes } = readingTime(p.body);
      const meta = [p.data.pubDate.toISOString().slice(0, 10), `${minutes} min`, ...p.data.tags].join(', ');
      return `- [${p.data.title}](${p.data.external ?? abs(`/writing/${p.id}/`)}): ${p.data.description} (${meta})`;
    }),
    ...(series.size
      ? ['', '## Series', '', ...[...series].map(([name, list]) => `- [${name}](${abs(`/writing/series/${slugify(name)}/`)}): ${list.length} parts`)]
      : []),
    '',
    '## Projects',
    '',
    ...projects.map((p) => `- [${p.data.title}](${p.data.live ?? p.data.repo ?? abs('/work/')}): ${p.data.summary}`),
    '',
    '## Contact',
    '',
    `- Email: ${SITE.email}`,
    ...Object.entries(SITE.socials)
      .filter(([, url]) => url)
      .map(([k, url]) => `- ${k}: ${url}`),
    '',
  ];

  return new Response(lines.join('\n'), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
