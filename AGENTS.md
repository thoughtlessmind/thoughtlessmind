# rajiv.me

Personal site of Rajiv Kumar, a software engineer in New Delhi: portfolio and writing. The site is **rajiv.me**
(thoughtlessmind.dev is being retired). Static, fast, accessible. No backend,
no login, no comments by design. `README.md` is the GitHub profile README: never overwrite it.

`DESIGN.md` is the v4 design spec (§1 type · §2 colour · §3 chrome · §4 motion). Read the relevant section before UI
work, and update it in the same change when the UI changes.

## Commands

```bash
pnpm install
pnpm dev       # http://localhost:4321; Astro 7 allows only one dev server per project
pnpm build     # dist/
pnpm preview   # serves dist/ as a daemon; `astro preview stop` ends it
pnpm check     # astro check (types); must be clean
```

Node ≥ 22.12, pnpm.

**Deploy**: Cloudflare Workers, static assets only (no Worker code). `wrangler.jsonc` points at `dist/`, drops
trailing slashes (`/about/` 307s to `/about`) and serves `404.html` with a 404. `public/_headers` makes `/_astro/*`
immutable; `public/_redirects` sends the old `/about` to `/#about`. Workers Builds deploys `main` to the Worker `rajiv-me` (`pnpm build`, then `npx wrangler deploy`) and reads `.node-version`. rajiv.me is a
Worker custom domain (`routes` in `wrangler.jsonc`); www.rajiv.me 301s to the apex via a Cloudflare Redirect Rule, not a
repo file. Check locally with `npx wrangler dev`
after a build.

## Stack

- Astro 7, `output: 'static'`, `trailingSlash: 'never'` (output stays `about/index.html`), prefetch on hover, sitemap.
- Tailwind v4 via `@tailwindcss/vite`, theme and preflight only (no utilities: all CSS is hand-written). Every token
  lives in `src/styles/global.css`.
- Geist and Geist Mono from fontsource (variable), Latin faces only, declared in `global.css`; Geist is preloaded with a
  metric-matched Arial fallback. The header's handwritten name is an SVG (`assets/sig.svg`, Caveat 600 outlined; the
  generator is in the local `docs/sig/`), not a font.
- `build.inlineStylesheets: 'always'`: each page's CSS is inline, no render-blocking stylesheet.
- One content collection, `blogs`: plain Markdown, Shiki for code (themes in `astro.config.mjs`). No React or MDX.

## Layout of src

```
assets/          doodle.svg (the landing drawing), covers/<slug>.svg (post covers): line art traced to SVG; sig.svg (the
                 header's written name), logos/
components/      Header (fixed, lifts on scroll, writes the name in), Footer (links, then the star field), ThemeToggle, PostCard,
                 Splash (canvas + styles for the splash screen), Doodle (draw-on, the planet,
                 the loops)
content/blogs/ the posts, <slug>.md (frontmatter in content.config.ts)
layouts/         BaseLayout (head with the link-preview card and JSON-LD, pre-paint script, skip link, header, main,
                 footer, splash)
lib/blogs.ts   getPosts, cover, reading time, date formats
pages/           index, blogs/index, blogs/[slug] (+ [slug].md.ts, the Markdown copy), llms.txt.ts, llms-full.txt.ts, rss.xml.ts,
                 404 (the landing doodle again)
scripts/         splash/ (index: engine, gate hand-off, dock, tint; kit: mark geometry; bits: the splash),
                 planet.ts (the doodle's turning planet), blob.ts (the liquid blob's outline, for the theme pour),
                 field.ts (the footer's star field) (DESIGN.md §4)
styles/          global.css (tokens, @theme, base, header, landing frame, theme switch, links, view transitions),
                 prose.css (posts)
consts.ts        facts: name, brand, title, description, email, socials, location, role, since, nav
```

Posts marked `# Placeholder: replace with a real post.` in their frontmatter are stand-ins until he writes real ones;
they carry `draft: true`, so they are not built, listed or in the feed. Remove `draft` only for a post he has written.
New posts get a cover drawn the same way as the others (Codex line art, traced; see `docs/v4-research/art/`) or show
their line of code until they have one.

## Facts

`src/consts.ts` holds the facts. Use real facts only; never invent numbers or titles. Name the current employer only in
the home page's Experience rows, as "Senior Frontend Engineer, swipejobs" (`SITE.role`). Everywhere else he is a
"software engineer" who builds web and native apps, backends and infrastructure: no library names in the positioning,
and never "freelancer". Client work is never named.

## Rules

- Both themes, and both pass WCAG AA. Dark is the default; light follows the system until the switch picks one
  (`data-theme` on `<html>`, stored in `localStorage['theme']`).
- The logo is orange `#ff5f1f` in both themes. Text orange (`--accent`) is `#ff5f1f` on dark and `#b23c0a` on light.
- Tokens only: no ad-hoc colours or fonts in components. Change a colour in `global.css` and nowhere else. Canvas and
  WebGL code can't read CSS, so it keeps hex fallbacks.
- Copy is sentence case. No emoji, no em or en dashes.
- No internal link ends with `/` (only the root is `/`). Astro 7's compiler is strict: close every tag.
- Every animation needs a `prefers-reduced-motion` path. Nothing may flash more than 3 times a second.
- Idle means zero work: stop rAF loops when nothing moves. No new `scroll` listeners: use IntersectionObserver or CSS
  scroll-driven animations.
- Check changes at 1440 and 375 wide with a clean console before calling them done.
