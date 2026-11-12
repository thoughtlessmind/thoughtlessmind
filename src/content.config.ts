import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

// Posts are plain Markdown in src/content/blogs/<slug>.md; the file name is the slug.
const blogs = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/blogs' }),
  schema: z.object({
    title: z.string(),
    description: z.string().max(200),
    date: z.coerce.date(),
    updated: z.coerce.date().optional(),
    /** The one line of code the post is about: the mono token on its card. */
    code: z.string(),
    /** Where it was first published, if somewhere else. */
    canonical: z.url().optional(),
    draft: z.boolean().default(false),
  }),
});

export const collections = { blogs };
