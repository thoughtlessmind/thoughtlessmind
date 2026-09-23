# thoughtlessmind.dev — project guide

Personal site of Rajiv Kumar. Astro 7 (static) + React 19 islands (only for the WebGL sky and the ⌘K palette) + Tailwind v4 tokens + MDX blog + Pagefind search. `README.md` is the GitHub profile README — leave it alone.

## Run

```bash
pnpm install
pnpm dev          # http://localhost:4321
pnpm build        # dist/ (also writes the Pagefind index and OG images)
pnpm preview      # serves dist/ as a background daemon: `astro preview stop` to end it
pnpm check        # astro check (types)
```

Node ≥ 22.12, pnpm. Search only works against a built index (`pnpm build` first, then `pnpm preview`, or the dev server serves `dist/pagefind` after one build).

## Add a post

Create `src/content/blog/<slug>.mdx`:

```yaml
---
title: Short, specific title
description: One sentence, ≤ 160 characters. Used for the row, meta, OG image and RSS.
pubDate: 2026-09-08
updatedDate: 2026-09-10        # optional
tags: [javascript, performance] # taxonomy: javascript typescript react css html performance tooling thinking
series: Frontend performance field notes   # optional
seriesOrder: 2                             # optional
draft: false                   # true = visible with a "Draft" badge, noindex, excluded from RSS/sitemap/search
canonical: https://…           # optional, when first published elsewhere
---
```

Everything else derives from the file: `/writing/<slug>/`, tag pages, series page, reading time, TOC (from h2/h3), prev/next, related, `/og/<slug>.png`, RSS, `llms.txt`, sitemap, Pagefind. Code blocks: ```ts title="file.ts" gets a filename tab and a copy button.

## Add a project

Create `src/content/projects/<slug>.md` (frontmatter only; see `src/content.config.ts` for fields: title, summary, description, year, stack, repo, live, image, featured, order, archived). `featured: true` puts it on the home page (max 3) as a module card.

## Site facts

`src/consts.ts` — name, role, company, email, socials, coordinates, nav. `src/lib/person.ts` — the JSON-LD Person used by home and about.

## Design system

v3 "SIGNAL": a dark-by-default signal console with launch orange, zero radius, and pixel display type. `DESIGN.md` is the reference, and §9 there is the class/attribute contract. `src/styles/global.css` is the implementation. It holds the colour tokens (dark in `:root`, light in `[data-theme="light"]`), `@theme static` (fonts, type scale, `--dur-*` motion, layout), `@theme inline` (colour utilities), base type, the plotting-field background (`.field`), and the global classes (`.hud`, `.btn*`, `.link`, `.tag`, `.label`, `.display`, `.page-title`, `.prose`, `.glitch`, `.flicker`, `.reveal`, `.marquee`…). Change a colour, radius or duration there and nothing else. The fonts are Geist Pixel (display, square `ELSH` instance), Martian Mono (UI; set width with `font-stretch`), Geist (body) and Geist Mono (code). The theme is `data-theme` on `<html>`: `localStorage.theme` = `light` | `dark`, and an absent key means dark. `src/scripts/theme.js` sets it before paint (plus `html.js`).

## Motion and 3D

- All behaviour is in `src/scripts/fx.ts` and driven by markup: `data-scramble` (decode in view, or `="hover"`), `data-count-to` (+ `data-count-suffix`), `data-boot` (once per session), `data-glitch-burst`, `.flicker-idle`, `data-clock`, `data-uptime-since`, and `data-pointer-coords`. It inits on `astro:page-load` and cleans up on `astro:before-swap`. The HTML always holds the final text. Under reduced motion only the readouts run.
- Background dust + lens: `src/scripts/field.ts` draws seeded random dust on the persisted `canvas.field-fx` and bends it around the cursor like a gravitational lens (no trail; rAF stops when settled). Static on touch, under reduced motion and on articles. `signal:pulse` sends a shockwave through it.
- Easter eggs (`src/scripts/eggs.ts`, `Terminal.astro`): hidden at coordinates on the home hero and found with the telemetry `CURSOR` readout (terminal at X 0772 · Y 0286, warp on the planet core, launch on the pad). No keyboard triggers; ⌘K "Open terminal" is the accessible path. See DESIGN.md §10.
- `.reveal` inside `[data-reveal-group]` does a 2-step wipe once (360ms, 50ms stagger; `src/scripts/reveal.ts`). It is hidden only when `html.js` is present and motion is allowed.
- Page transitions: the old page steps out and the new `<main>` flickers on (CSS in global.css; fx.ts adds `.flicker` on `astro:after-swap`).
- `src/components/three/` is the signal body: one persisted `<canvas>` behind everything, a ringed planet made of dithered points. It loads after `load` + fonts + idle, never on article pages, and never under reduced motion / save-data / weak devices (a CSS fallback takes its place; its styles are in `three/sky.css`).

## Layout of src

```
components/   Astro UI (Header, Footer, ThemeToggle, Hero, ProjectRow, PostRow, article parts…), CommandPalette.tsx, three/
content/      blog/*.mdx, projects/*.md
layouts/      BaseLayout (head, chrome, scripts, sky), WritingLayout (index/tag/series), ArticleLayout
lib/          posts.ts (published posts, reading time, related, series, dates), person.ts
pages/        index, work, about, 404, writing/…, og/[...slug].png.ts, rss.xml.ts, robots.txt.ts, llms.txt.ts
scripts/      theme.js (inline, no flash), fx.ts (all data-attribute behaviour), reveal.ts
styles/       global.css
```

## Rules

Tokens only (no ad-hoc colours, radii or durations). Sentence case, no emoji. Every internal link ends with `/`. Astro 7's compiler is strict: close every tag. Nothing here needs a backend; there is no login and no comments by design.
