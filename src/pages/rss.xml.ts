import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { getContainerRenderer as mdxRenderer } from '@astrojs/mdx/container-renderer';
import { loadRenderers } from 'astro:container';
import { render } from 'astro:content';
import { SITE } from '../consts';
import { getSyndicatedPosts } from '../lib/posts';

export async function GET(context: APIContext) {
  const site = context.site ?? SITE.url;
  const posts = await getSyndicatedPosts();
  // Full HTML for feed readers (content:encoded), rendered from the MDX at build time.
  const container = await AstroContainer.create({ renderers: await loadRenderers([mdxRenderer()]) });
  const items = await Promise.all(
    posts.map(async (post) => {
      const { Content } = await render(post);
      const content = post.data.external ? undefined : await container.renderToString(Content);
      return {
        title: post.data.title,
        description: post.data.description,
        pubDate: post.data.pubDate,
        link: post.data.external ?? `/writing/${post.id}/`,
        categories: [...post.data.tags],
        author: `${SITE.email} (${SITE.name})`,
        content,
        customData: post.data.updatedDate ? `<atom:updated>${post.data.updatedDate.toISOString()}</atom:updated>` : undefined,
      };
    }),
  );

  return rss({
    title: `${SITE.name} — Writing`,
    description: SITE.description,
    site,
    xmlns: { atom: 'http://www.w3.org/2005/Atom' },
    customData: [
      '<language>en</language>',
      `<atom:link href="${new URL('/rss.xml', site).href}" rel="self" type="application/rss+xml" />`,
    ].join(''),
    items,
  });
}
