import type { APIRoute, GetStaticPaths } from 'astro';
import { getPosts, type Post } from '../../lib/blogs';

// Each post as raw Markdown at /blogs/<slug>.md, for agents and the post page's "Copy as Markdown".
export const getStaticPaths = (async () =>
  (await getPosts()).map((post) => ({ params: { slug: post.id }, props: { post } }))) satisfies GetStaticPaths;

export const GET: APIRoute<{ post: Post }> = ({ props: { post } }) =>
  new Response(`# ${post.data.title}\n\n${post.data.description}\n\n${post.body?.trim() ?? ''}\n`, {
    headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
  });
