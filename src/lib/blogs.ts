import { getCollection, type CollectionEntry } from 'astro:content';

export type Post = CollectionEntry<'blogs'>;

/** Published posts, newest first. */
export async function getPosts(): Promise<Post[]> {
  const all = await getCollection('blogs', (p) => !p.data.draft);
  return all.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
}

// Each post's cover is a line doodle traced to SVG (ink on currentColor, orange as .o). Not every post has one.
const covers = import.meta.glob<string>('../assets/covers/*.svg', { query: '?raw', import: 'default', eager: true });
export const cover = (id: string): string | undefined => covers[`../assets/covers/${id}.svg`];

/** Reading time at 230 words a minute, never under one. */
export const minutes = (body = '') => Math.max(1, Math.round(body.trim().split(/\s+/).length / 230));

const fmt = (opts: Intl.DateTimeFormatOptions) => (d: Date) => d.toLocaleDateString('en-GB', { ...opts, timeZone: 'UTC' });
export const month = fmt({ month: 'short', year: 'numeric' });
export const day = fmt({ day: 'numeric', month: 'short', year: 'numeric' });
export const iso = (d: Date) => d.toISOString().slice(0, 10);
