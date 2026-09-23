# thoughtlessmind.dev

Personal site of Rajiv Kumar (*thoughtlessmind*), a senior web engineer in New Delhi. It is a portfolio and blog
that should show ~7 years of frontend craft through the site itself: static, fast, accessible, playful in the details.
No backend, no login, no comments by design. `README.md` is the GitHub profile README: never overwrite it.

`DESIGN.md` is the design spec (§1 type · §2 colour · §3 surfaces · §4 motion · §5 3D · §6 chrome · §7 pages ·
§8 a11y/perf · §9 class/attribute contract · §10 easter eggs). Read the relevant section before UI work, and update it
in the same change when the UI changes.

## Commands

```bash
pnpm install
pnpm dev       # http://localhost:4321; Astro 7 allows only one dev server per project
pnpm build     # dist/, plus the Pagefind index and OG images
pnpm preview   # serves dist/ as a daemon; `astro preview stop` ends it
pnpm check     # astro check (types); must be clean
```

Node ≥ 22.12, pnpm. Search needs a built index: run `pnpm build` once, then the dev server serves `dist/pagefind`.

## Stack

- Astro 7, `output: 'static'`, `trailingSlash: 'always'`, ClientRouter transitions.
- React 19 islands, only two: the ⌘K palette (`CommandPalette.tsx`) and the 3D sky (`components/three/`). Everything
  else is `.astro` plus vanilla TS in `src/scripts/`. Keep it that way.
- three 0.182 + @react-three/fiber 9 with custom GLSL shaders. No drei, no postprocessing.
- Tailwind v4. Every token lives in `src/styles/global.css`.
- MDX content collections (`src/content.config.ts`), expressive-code, Pagefind, canvaskit OG images, RSS, sitemap, `llms.txt`.

## Content

**Post**: `src/content/blog/<slug>.mdx`

```yaml
title: Short, specific title
description: One sentence, ≤ 160 chars (row, meta, OG image, RSS)
pubDate: 2026-09-08
updatedDate: 2026-09-10       # optional
tags: [javascript, performance] # convention: javascript typescript react css html performance tooling thinking
series: Frontend performance field notes   # optional, with seriesOrder: 2
draft: false        # true: "Draft" badge + noindex; left out of RSS, sitemap, search, ⌘K, llms.txt, home "Latest writing"
canonical: https://…  # optional; if the host isn't ours, the post is also left out of the sitemap
external: https://…   # optional; dev.to cross-post, listed with ↗ and no local page
```

The route, tag/series pages, reading time, TOC (h2/h3), prev/next, related posts and `/og/<slug>.png` all derive from
the file. ` ```ts title="file.ts" ` gives a code block a filename tab and a copy button.

**Project**: `src/content/projects/<slug>.md`, frontmatter only (fields in `content.config.ts`). `featured: true` shows it
as a module card on home and /work (keep it to about 3). A project with `image` spans both card columns.

**Facts**: `src/consts.ts` (name, role, company, email, socials, coords, since, nav) and `src/lib/person.ts` (JSON-LD).
Use real facts only; never invent numbers or titles. Never name the current employer anywhere; the role reads "web engineer".

## Design direction: v3 "SIGNAL"

Mission control for a web engineer. The motif pool is his interests: astronomy, rockets, orbital mechanics,
physics, sport, problem solving. It should feel like a well-built instrument, not a hacker cliché.

- Techie and funky: pixel display type, telemetry readouts, digital motion that decodes, flickers and glitches in short
  bursts.
- Dark by default, plus a light "blueprint paper" theme. Both must pass WCAG AA.
- Colour roles:
  - Launch orange `--accent` is rare: the primary CTA, active state, focus ring and corner brackets.
  - Cyan `--signal` appears only in motion.
  - Lime `--ok` is only for status dots.
- Radius 0. `.hud` frames with accent corner brackets. Hairlines, no shadows.
- Fonts: Geist Pixel (display, ≥ 40px), Martian Mono (UI, labels uppercase via CSS), Geist (body), Geist Mono (code).
  Copy is sentence case. No emoji.
- Background: seeded random dust that bends around the cursor like a gravitational lens.
- Easter eggs are found by exploring coordinates, not by shortcuts.
- Secondary UI stays compact: the telemetry panel is small and user-resizable.
- **Rejected, do not reintroduce:**
  - The old calm serif ("old-money") direction.
  - Diver mode (outline every element).
  - Graph-paper grids, `+` registration crosses, scanline overlays.
  - Cursor trails, wakes and click pings.
  - Keyboard-triggered easter eggs (`~`, Konami, typed words) and visible buttons that give eggs away.
  - Matrix rain, neon synthwave, fake hacking text.

## Design system

- `global.css` holds the tokens (dark in `:root`, light in `[data-theme="light"]`), `@theme static` (fonts, type scale,
  `--dur-*`, layout) and `@theme inline` (colour utilities). It also holds base type, the `.field` vignette + grain, and
  the global classes (`.hud`, `.btn*`, `.link`, `.tag`, `.label`, `.display`, `.page-title`, `.prose`, `.glitch`,
  `.flicker`, `.reveal`, `.marquee`…).
- Change a colour, radius or duration in `global.css` and nowhere else.
- Theme: `data-theme` on `<html>`. `localStorage.theme` is `light` or `dark`; absent means dark. `src/scripts/theme.js`
  sets it before paint, along with `html.js`.
- Martian Mono width: use `font-stretch`, not `font-variation-settings`. Geist Pixel uses the square `ELSH` instance.

## Motion, 3D, easter eggs

- `src/scripts/fx.ts` drives markup behaviour:
  - Attributes: `data-scramble` (decode in view, or `="hover"`), `data-count-to` + `data-count-suffix`, `data-boot`
    (once per session), `data-glitch-burst`, `data-clock`, `data-uptime-since`, `data-pointer-coords`.
  - Lifecycle: inits on `astro:page-load`, cleans up on `astro:before-swap`.
  - The HTML always holds the final text. Under reduced motion only the readouts run.
- `.reveal` in `[data-reveal-group]` does a 2-step wipe once (`src/scripts/reveal.ts`).
- Page transitions: the old page steps out, the new `<main>` flickers on.
- `src/scripts/field.ts` draws the dust on the persisted `canvas.field-fx` and runs the lens:
  - No trail; rAF stops once it settles.
  - It is static without a fine pointer, under reduced motion and on article pages.
  - `signal:pulse` sends a shockwave through it.
- `src/components/three/` is the planet: one persisted WebGL2 canvas, lazy.
  - It loads after `load` + fonts + idle.
  - It never loads on articles, weak devices, save-data or reduced motion; a CSS fallback shows instead (`three/sky.css`).
  - While running it sets `html[data-scene="on"]`.
  - It keeps WebGL for the planet only. The 2D dust measured < 1 ms/frame, so it stays 2D.
- `components/three/BlackHole.tsx` + Hero's `[data-black-hole]`: a small, heavy, draggable black hole on the home page,
  only while the scene runs. It goes anywhere in `<main>` but onto the planet; the closer, the harder it pulls.
  - The pull tears the planet apart, outer ring first; torn points plunge, hang at the horizon and are gulped
    (`Planet.tsx` "Tide"). Out of reach, the planet re-forms. It gets heavier as it eats.
  - It lenses the stars, the dust (field.ts, via `signal:hole`) and nearby text (`three/bend.ts`, SVG filters).
- `src/scripts/eggs.ts` + `Terminal.astro`: eggs are hidden at coordinates on the home hero and found with the telemetry
  `CURSOR` readout. Near an egg a direction arrow and its coordinates show; on it, a click marker appears.
  - Terminal at X 0772 · Y 0286.
  - Warp on the planet core.
  - Launch on the pad left of the telemetry panel.
  - ⌘K "Open terminal" is the accessible path; Ctrl+` (Ctrl+~) toggles it too. See DESIGN.md §10.
- Window events: `signal:warp`, `signal:pulse` `{x, y}`, `signal:hole` `{x, y, r, held}` | null, `terminal:open`,
  `open-palette`.
- Storage: `theme`, `eggs`, `tele-scale` (localStorage), `booted` (sessionStorage).

## Layout of src

```
components/   Astro UI (Header, Footer, ThemeToggle, Hero, ProjectCard, PostRow, Terminal, article parts…), CommandPalette.tsx, three/
content/      blog/*.mdx, projects/*.md
layouts/      BaseLayout (head, chrome, scripts, sky, field), WritingLayout (index/tag/series), ArticleLayout
lib/          posts.ts (published posts, reading time, related, series, dates), person.ts
pages/        index, work, about, 404, writing/…, og/[...slug].png.ts, rss.xml.ts, robots.txt.ts, llms.txt.ts
scripts/      theme.js (inline, no flash), fx.ts, field.ts (dust + lens), eggs.ts, reveal.ts
styles/       global.css
```

## Rules

- Tokens only: no ad-hoc colours, radii, durations or fonts in components. Exceptions:
  - Canvas, WebGL and OG code can't read CSS, so they keep hex fallbacks.
  - The egg marker is the one circle.
- Every internal link ends with `/`. Astro 7's compiler is strict: close every tag.
- Every animation needs a `prefers-reduced-motion` path. Nothing may flash more than 3 times a second or over a large area.
- Idle means zero work: stop rAF loops when nothing moves. The three.js chunk (~244 KB gz) stays lazy.
- Check changes at 1440 and 375 wide, in dark and light, with a clean console, before calling them done.
