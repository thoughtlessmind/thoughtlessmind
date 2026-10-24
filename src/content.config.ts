import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const blog = defineCollection({
  loader: glob({ base: './src/content/blog', pattern: '**/*.{md,mdx}' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      description: z.string().max(160),
      pubDate: z.coerce.date(),
      updatedDate: z.coerce.date().optional(),
      tags: z.array(z.string()).default([]),
      series: z.string().optional(),
      seriesOrder: z.number().int().optional(),
      heroImage: image().optional(),
      draft: z.boolean().default(false),
      /** Set for posts that live elsewhere (dev.to cross-posts). Listed with an outward arrow, no local page. */
      external: z.url().optional(),
      canonical: z.url().optional(),
    }),
});

const projects = defineCollection({
  loader: glob({ base: './src/content/projects', pattern: '*.md' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      summary: z.string(),
      description: z.string(),
      year: z.number().int(),
      /** What it is, shown before the year: the range of platforms is the point of the work page. */
      kind: z.enum(['Web app', 'macOS app', 'Chrome extension', 'Library']),
      stack: z.array(z.string()),
      repo: z.url().optional(),
      live: z.url().optional(),
      /** Relative to the .md file, e.g. ../../assets/projects/foo.png; goes through Astro's image service. */
      image: image().optional(),
      featured: z.boolean().default(false),
      order: z.number().default(99),
      archived: z.boolean().default(false),
    }),
});

export const collections = { blog, projects };
