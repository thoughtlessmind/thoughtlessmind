import { getCollection, type CollectionEntry } from 'astro:content';

export type Post = CollectionEntry<'blog'>;

const byDateDesc = (a: Post, b: Post) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf();

/**
 * Every post, newest first — drafts included. A draft still renders and is listed (with a "Draft"
 * badge) but is noindex and left out of RSS, llms.txt, the sitemap and Pagefind: see getSyndicatedPosts.
 */
export async function getPublishedPosts(): Promise<Post[]> {
  return (await getCollection('blog')).sort(byDateDesc);
}

/** Posts that feeds, indexes and crawlers may see: no drafts. */
export async function getSyndicatedPosts(): Promise<Post[]> {
  return (await getPublishedPosts()).filter((p) => !p.data.draft);
}

/** Words / 200, never less than a minute. Fenced code, import lines and JSX tags do not count. */
export function readingTime(body = '') {
  const text = body
    .replace(/^(`{3,}|~{3,})[\s\S]*?^\1/gm, ' ')
    .replace(/^import .*$/gm, '')
    .replace(/<[^>]+>/g, ' ');
  const words = text.split(/\s+/).filter(Boolean).length;
  return { words, minutes: Math.max(1, Math.round(words / 200)) };
}

export function groupByYear(posts: Post[]): [number, Post[]][] {
  const map = new Map<number, Post[]>();
  for (const p of posts) {
    const y = p.data.pubDate.getUTCFullYear();
    map.set(y, [...(map.get(y) ?? []), p]);
  }
  return [...map.entries()].sort((a, b) => b[0] - a[0]);
}

export function getAllTags(posts: Post[]) {
  const counts = new Map<string, number>();
  for (const p of posts) for (const t of p.data.tags) counts.set(t, (counts.get(t) ?? 0) + 1);
  return [...counts]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
}

/**
 * Posts sharing a tag, most shared first then most recent. When nothing overlaps, the newest posts
 * come back under the label "Latest" so the block is honest and never empty.
 */
export function getRelated(post: Post, posts: Post[], n = 3): { label: 'Related' | 'Latest'; posts: Post[] } {
  const tags = new Set(post.data.tags);
  const others = posts.filter((p) => p.id !== post.id);
  const related = others
    .map((p) => ({ p, shared: p.data.tags.filter((t) => tags.has(t)).length }))
    .filter((x) => x.shared > 0)
    .sort((a, b) => b.shared - a.shared || byDateDesc(a.p, b.p))
    .slice(0, n)
    .map((x) => x.p);
  return related.length ? { label: 'Related', posts: related } : { label: 'Latest', posts: others.slice(0, n) };
}

export function getSeries(posts: Post[]) {
  const map = new Map<string, Post[]>();
  for (const p of posts) {
    if (!p.data.series) continue;
    map.set(p.data.series, [...(map.get(p.data.series) ?? []), p]);
  }
  for (const list of map.values()) list.sort((a, b) => (a.data.seriesOrder ?? 0) - (b.data.seriesOrder ?? 0));
  return map;
}

export const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

const dateFmt = new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' });
/** "17 Jan 2021" — UTC so build machines agree. Prose-style date. */
export const formatDate = (d: Date) => dateFmt.format(d);
/** "2021-01-17" (UTC): the terminal-style date used by log rows, article meta and OG cards. */
export const isoDate = (d: Date) => d.toISOString().slice(0, 10);
