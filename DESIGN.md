# thoughtlessmind.dev — design v3 "SIGNAL"

The site is a live signal console run by one frontend engineer. Dark by default, phosphor-on-black, hard edges,
pixel display type, telemetry readouts, and digital motion that flickers, decodes and glitches, but only in short,
deliberate bursts. It should feel like a well-built instrument, not a hacker-movie cliché: no green-on-black Matrix
rain, no neon purple synthwave, no fake "hacking" text. Every readout shows a real fact about Rajiv.

Why it fits him: he builds developer-grade tools (a no-JS tooltip library, a Chrome extension that outlines every
element on a page, a playlist timer), he's a CSS and React person who reads about rockets and orbital mechanics.
So the metaphor is **mission control for a frontend engineer**: telemetry, launch orange, a ringed planet made of
points, a field of dust that bends around the cursor like a gravitational lens, and a set of easter eggs for people who poke at things
(a real terminal, a rocket launch, a warp drive).

`src/styles/global.css` implements this file. Tokens only: no ad-hoc colours, radii, durations or fonts anywhere else.

---

## 1. Type

| Role | Font (Fontsource package) | Where |
|---|---|---|
| Display | **Geist Pixel** (`@fontsource-variable/geist-pixel`) | Hero name, page titles, 404, big counters. Only at ≥ 40px. Never body text. |
| Interface / headings | **Martian Mono** (`@fontsource-variable/martian-mono`, uses `wdth` 75–112.5 and `wght`) | h2–h4, nav, buttons, labels, tags, readouts, tables |
| Body / prose | **Geist** (`@fontsource-variable/geist`, already installed) | Paragraphs, article prose, summaries |
| Code | **Geist Mono** (`@fontsource-variable/geist-mono`, already installed) | Code blocks, inline code, kbd |

Remove `@fontsource-variable/newsreader` and `@fontsource-variable/instrument-sans` (use `pnpm remove`).

Tokens: `--font-display`, `--font-ui`, `--font-sans`, `--font-mono`.

Scale (fluid, 360 → 1440):
- `--text-display`: clamp(3.25rem, 1rem + 10vw, 10.5rem); line-height 0.9; tracking 0
- `--text-h1`: clamp(2.5rem, 1.5rem + 4vw, 5rem); lh 1.0 (Geist Pixel for page titles)
- `--text-h2`: clamp(1.5rem, 1.1rem + 1.6vw, 2.25rem); lh 1.15; Martian Mono 600, `wdth` 100, tracking -0.01em
- `--text-h3`: clamp(1.125rem, 1rem + 0.6vw, 1.375rem); lh 1.3; Martian Mono 500
- `--text-lead`: clamp(1.125rem, 1.05rem + 0.4vw, 1.3125rem); lh 1.55; Geist
- `--text-body`: 1.0625rem (17px); lh 1.7; Geist
- `--text-small`: 0.875rem; lh 1.55
- `--text-label`: 0.6875rem (11px); lh 1.4; Martian Mono 500, UPPERCASE, tracking 0.14em, `wdth` 87.5
- `--text-caption`: 0.75rem; lh 1.5; Martian Mono 400

Labels, nav, buttons and tags are uppercase Martian Mono. Headings and body are sentence case. No emoji.

## 2. Colour

Two themes. **Dark is the default** (no stored choice → dark). `data-theme="dark" | "light"` on `<html>`.

Dark, "signal":
| Token | Value | Use |
|---|---|---|
| `--bg` | `#0a0b0d` | page |
| `--bg-elevated` | `#101216` | cards, palette, popovers |
| `--surface` | `#15181d` | code, inputs, hover rows |
| `--border` | `#23272e` | hairlines |
| `--border-strong` | `#3b414b` | inputs, frames |
| `--field-dot` / `--field-vignette` / `--field-grain` | (see global.css) | background dust (brightest level), edge vignette, grain |
| `--text` | `#ebe9e4` | primary text |
| `--text-muted` | `#a6aab2` | secondary |
| `--text-subtle` | `#858b95` | labels, meta (≥ 4.5:1 on bg) |
| `--accent` | `#ff5f1f` | **launch orange**: primary CTA, active nav, focus ring, corner brackets |
| `--accent-hover` | `#ff7a45` | |
| `--accent-fg` | `#0a0b0d` | text on accent |
| `--accent-soft` | `rgb(255 95 31 / 0.12)` | selection, hover wash |
| `--signal` | `#38e1f0` | cyan: the second glitch channel, link hover underline, code accents. Never large fills. |
| `--ok` | `#a4f04a` | lime: status dots only |
| `--code-bg` | `#0d0f12` | |

Light, "blueprint paper" (same roles, print-like):
| Token | Value |
|---|---|
| `--bg` | `#edebe5` |
| `--bg-elevated` | `#f6f5f1` |
| `--surface` | `#e2dfd7` |
| `--border` | `#cdc9bf` |
| `--border-strong` | `#9b968b` |
| `--field-*` | light values in global.css |
| `--text` | `#111214` |
| `--text-muted` | `#44474d` |
| `--text-subtle` | `#595d64` |
| `--accent` | `#c73a05` (verify ≥ 4.5:1 on `--bg`; darken if not) |
| `--accent-hover` | `#a93104` |
| `--accent-fg` | `#ffffff` |
| `--accent-soft` | `rgb(199 58 5 / 0.1)` |
| `--signal` | `#00788a` |
| `--ok` | `#2e7d0a` |
| `--code-bg` | `#e6e3db` |

Colour rules: orange is rare and meaningful (one primary CTA per view, the active state, focus, bracket corners).
Cyan appears only in motion (glitch split, hover underline) and small code accents. Lime only on status dots.

## 3. Shape, space, surfaces

- **Radius: 0.** Only `--radius-1: 2px` for kbd and status dots (`999px` allowed for dots only). No rounded cards.
- **HUD frame** (`.hud`): 1px `--border` box with four 10px **corner brackets** in `--accent` (drawn with background gradients on `::before`, no extra DOM). This replaces cards and shadows. No drop shadows anywhere.
- Background: **random dust**. `canvas.field-fx` (drawn by `src/scripts/field.ts`) scatters 1px dots from a seeded PRNG, one
  candidate per 24px cell (`--field-size`), jittered inside the cell, ~30% empty, three brightness levels, repeating on a 480px
  tile so it is stable across reloads. `.field` (CSS) adds only the edge vignette and a faint grain on top. No crosses, no
  scanlines. Everything sits below the sky (z -2 / -1). Without JS only the vignette and grain show.
- Container: `--container-site` 1320px, gutter `clamp(1rem, 4vw, 2.5rem)`. Measure `--container-measure` 68ch.
- Section rhythm: `--spacing-section` clamp(5rem, 3rem + 7vw, 9rem).
- Section header pattern: `// 01` index in `--accent` + label + title + a hairline that fills to the right edge, and an optional right-aligned `all work →` link.

## 4. Motion

Tokens: `--dur-1` 120ms, `--dur-2` 240ms, `--dur-3` 480ms, `--dur-4` 900ms; `--ease-out` cubic-bezier(0.2, 0.8, 0.2, 1); `--ease-step` steps(4, end).

Everything below is **off under `prefers-reduced-motion: reduce`** (final state shown immediately) and never blocks
content: text is in the HTML at its final value; JS only animates it.

Safety: no element larger than ~25% of the viewport may flash, and nothing flashes more than 3 times per second
(WCAG 2.3.1). Flicker is an opacity dip to ≥ 0.6, not a black/white flash.

| Effect | Trigger | Spec |
|---|---|---|
| **Decode / scramble** | `data-scramble` (once, when ≥ 40% in view); `data-scramble="hover"` (on hover/focus, nav links, buttons) | Characters resolve left→right from random glyphs `!<>-_\/[]{}=+*^?#01ABCDEF` over ~700ms (hover: 350ms). Spaces are kept. Screen readers get the final text (`aria-label` on the element or visually hidden copy; the animated glyphs are `aria-hidden`). Width must not jump: use `font-variant-numeric: tabular-nums` and monospace fonts only (Martian Mono / Geist Mono / Geist Pixel). |
| **CRT turn-on** | `.flicker` | On load: opacity 0 → 1 with three stutters (0, .8, .2, 1, .6, 1) over 420ms `--ease-step`. |
| **Idle flicker** | `.flicker-idle` | Every 6–11s (random), one 120ms dip to opacity 0.7. |
| **Glitch** | `.glitch` with `data-text="same text"`, on hover; `data-glitch-burst` for periodic bursts every 5–9s | Two pseudo-elements copy the text, offset ±2–3px in `--accent` and `--signal` with `mix-blend-mode: screen` (dark) / `multiply` (light), clipped to 3 random horizontal slices that jump in `steps()`, 280ms total. |
| **Caret** | `.caret` | Blinking block `▍` or 0.6em×1em box in `--accent`, 1.1s steps(1). |
| **Boot log** | `[data-boot]` on home hero | Child lines appear one by one (70ms apart, each decoding), about 1s total. Once per session (`sessionStorage`); later visits render lines instantly. Decorative (`aria-hidden`). |
| **Counters** | `data-count-to="98"` (+ optional `data-count-suffix="k+"`) | When in view, digits roll through random digits then settle, 900ms. |
| **Marquee tape** | `.marquee` | Horizontal infinite scroll of stack keywords separated by `▲`, 40s linear; pauses on hover. Duplicated content is `aria-hidden`. |
| **Reveal** | `.reveal` in `[data-reveal-group]` | Keep the existing behaviour but make it digital: opacity 0 → 1 with a 2-step `clip-path` inset wipe (top→bottom), 360ms, 50ms stagger. Hidden only when `html.js`. |
| **Lens** | Pointer move (fine pointers) | The dust around the cursor is displaced like a gravitational lens: a clear ~32px core, dots compressed into a soft ring that brightens and warms slightly toward `--accent`, back to rest by ~150px. Faint extra dust (invisible at rest) appears only inside the ring. The lens follows an eased cursor (~70ms) with no trail; rAF stops when it settles. `signal:pulse` sends a 420px shockwave through the dust. Off (static field) on article pages, under reduced motion and on touch. |
| **Live clock** | `data-clock` | `HH:MM:SS IST` in Asia/Kolkata, updates each second, tabular nums. |
| **Uptime** | `data-uptime-since="2019-03"` | Renders `07y 06m` style difference from that month to now. Server renders a build-time value first. |
| **Pointer coords** | `data-pointer-coords` | `X 0412 · Y 0233` from the pointer position, fine pointers only, rAF-throttled. |
| **Page transitions** | Astro `ClientRouter` | Old page: 160ms steps(3) opacity out; new page: `.flicker` turn-on for `main`. |

All behaviour lives in one module, `src/scripts/fx.ts`, re-initialised on `astro:page-load` and cleaned up on
`astro:before-swap` (no leaked intervals, observers or listeners).

## 5. 3D — the signal body (React Three Fiber)

One persisted `<canvas>` behind everything (existing `SkyCanvas` lazy-load and fallback logic stays: loads after
`load` + fonts + idle; never on article pages; never under reduced motion / save-data / weak devices).

Scene:
- A **ringed planet made of points**: ~5,000 points on a Fibonacci sphere + ~3,000 points in a tilted ring
  (inner/outer radius 1.5/2.4, slight thickness). Plus ~900 background stars. At most 2–3 draw calls, custom `ShaderMaterial`, no drei, no postprocessing package.
- Look: points are small squares (pixel feel), brightness quantised into 4 levels with an ordered **Bayer 4×4
  dither** in the fragment shader. Lit from upper-left: lit side in `--text` colour, terminator/rim in launch orange,
  a thin cyan fringe on the dark limb. A horizontal **scanline** modulation from `gl_FragCoord.y`.
- Motion: slow rotation (one turn / ~90s), ring rotates independently; pointer parallax (≤ 6°) on fine pointers;
  per-point **flicker** noise (a few % of points blink each second); **glitch bursts** every 5–9s for ~180ms:
  points in 2–3 random horizontal screen bands shift sideways and split into an orange copy and a cyan copy.
  Points near the projected pointer brighten slightly (a "scanner" hover).
- Layout: the planet is placed over the home hero's `[data-planet-anchor]` (desktop: right of the text; mobile: its own band above the copy). As the hero scrolls away it shrinks into the top-right corner and dims (corner opacity is low because thousands of points stack into few pixels under additive blending). On other non-article pages it sits small and dim in that corner.
- Events: `signal:warp` runs the 2.6s warp (stars stream into streaks, spin-up, one orange/cyan split at the peak, exact return to rest; every frame rendered while it runs). `signal:pulse` `{x, y}` on the planet gives it a short glitch hit. While the WebGL scene runs, `<html data-scene="on">` is set so other code can tell.
- Theme: dark uses additive blending; light uses normal blending with ink-coloured points and orange rim.
- Cost: capped at ~30fps via the existing `invalidate()` loop, `dpr` ≤ 1.5, paused when the tab is hidden.
- Static fallback (no WebGL / reduced motion / weak device): a CSS-only dithered disc and ellipse ring using
  `radial-gradient` dots, no animation.

## 6. Chrome

**Header** (sticky, 56px, `--bg` at 85% + backdrop blur, bottom hairline):
`[ tm_ ]` wordmark with blinking caret (links home) · nav `01 WORK  02 WRITING  03 ABOUT` (index in `--text-subtle`,
active item in `--accent` with a `▸` marker, hover scramble) · right side: `NDL 14:32:07 IST` live clock (hidden < 900px),
`⌘K` search button, theme toggle `[DRK|LGT]` two-state switch. Mobile: nav collapses into a `MENU` button opening a full-width sheet.

**Footer**: HUD frame. Left: "Built by Rajiv Kumar in New Delhi." + `28.6139° N, 77.2090° E`. Middle: socials as
`GH  IN  X  SO  DEV  RSS` mono links. Right: status `● ALL SYSTEMS NOMINAL` (lime dot), `BUILD 2026-09-23`
(build date).

## 7. Pages

**Home**
1. Hero (min-height ~92svh desktop): boot log (4 muted lines, e.g. `> init signal.v3 ........ ok`,
   `> mount /work /writing /about .. ok`, `> locate operator ....... 28.61N 77.21E`, `> status .................. shipping`),
   status label `● ONLINE — SYS://THOUGHTLESSMIND`, `<h1>` "Rajiv Kumar" in Geist Pixel display (two lines, `.flicker`,
   `.glitch` + `data-glitch-burst`), a typed role line `frontend engineer` + caret, lead paragraph (Geist):
   "I build interfaces that load fast and read clearly. Seven years of React and TypeScript, currently shipping at swipejobs."
   CTAs: primary `[ VIEW WORK ]`, secondary `> ping me` (mailto). Telemetry panel (`.hud`, bottom-right of hero or
   below on mobile) with rows: `LOC 28.6139° N 77.2090° E` · `LOCAL <clock> IST` · `UPTIME <since 2019-03>` ·
   `STACK TS / REACT / ASTRO / R3F` · `STATUS SHIPPING @ SWIPEJOBS` · `CURSOR <pointer coords>`.
   The panel is secondary: compact by default (11px, em-based off `--tele-scale`) and user-resizable. Its free top-left
   corner bracket is a grip (`role="slider"`, drag / arrow keys / Home / End, Enter or double-click resets), range 0.85×–1.8×
   clamped so it never reaches the copy column or leaves the hero. The scale is kept in `localStorage.tele-scale` and applied
   before paint. It grows up-left inside a fixed slot so the hero never reflows. Touch/mobile: compact, no grip.
2. Marquee tape: TYPESCRIPT ▲ REACT ▲ CSS ▲ ASTRO ▲ WEBGL ▲ PERFORMANCE ▲ ACCESSIBILITY ▲ CHROME EXTENSIONS ▲ DESIGN SYSTEMS ▲ NODE.
3. `// 01 SHIPPED` — this site as the case study (updated for v3), then featured projects as module cards in a
   2-column grid: `M-01` index + year, title (Martian Mono), summary, `[css] [npm]` tags, `REPO ↗ LIVE ↗`. The YouTube
   Playlist Info screenshot gets a duotone + dither + scanline treatment (CSS filters / overlay) that clears on hover. Cards are `.hud`, title glitches on hover.
4. `// 02 LOGS` — latest writing as terminal log lines: `2026-09-08  ▸ Title .......... 6 MIN` with dot leaders.
5. `// 03 OPERATOR` — counters row: `98` SO answers, `60` accepted, `110k+` reads on one answer, `49` PRs to others'
   repos, `07` years. One short paragraph, then `OFF-DUTY: ROCKETS · ORBITAL MECHANICS · PHYSICS · SPORT`.
6. `// 04 TRANSMIT` — huge "Let's build something." (Geist Pixel), email as a large link that glitches on hover, socials.

**Work** `/work/`: page title in Geist Pixel; featured module cards; then the full index as an `ls -la` style table
(idx · year · name · stack · links), archived rows dimmed with `[ARCHIVED]`, rows highlight with `--surface` on hover.

**About** `/about/`: "Operator dossier". Avatar (initials `RK` in Geist Pixel inside a HUD frame with a dithered
scan effect; photo if `/public/images/avatar.*` exists, shown grayscale + dither), experience as log entries,
timeline, a spec sheet table for stack, "on record" counters, "now", elsewhere links.

**Writing** index / tag / series: terminal listing (date · title · tags · minutes), tag filters as `--tag=css` chips.

**Article**: the calmest page. No 3D and no lens (static dust only). Prose in Geist 17–18px, 68ch, headings in Martian Mono.
Reading progress: 2px `--accent` bar under the header plus a `037%` readout. TOC as `> section` list with the active item in
accent. Code blocks: expressive-code, `github-dark` / `github-light`, radius 0, tab indicator in accent.

**404**: "SIGNAL LOST". Big glitching `404` in Geist Pixel over animated TV static (small canvas or CSS noise, low contrast), `> return home` link.

**⌘K palette**: terminal prompt: `tm:~$` prefix, mono input, results with an orange selection bar, `↑↓ ↵ esc` hints.

**OG images**: dark `--bg`, grid lines, orange 8px left bar, title in Geist Mono bold, `thoughtlessmind.dev` + date
footer. Only the fonts already in `src/assets/fonts/og/` (drop Newsreader from the card).

## 8. Accessibility and performance

- AA contrast in both themes; focus ring 2px `--accent`, offset 2px, never removed.
- Every animation has a reduced-motion path; motion never hides content from no-JS users.
- Pixel and mono fonts never carry long reading text.
- Fonts: preload only the Geist Pixel and Martian Mono latin subsets used above the fold.
- The 3D chunk stays lazy and out of the initial bundle; no new runtime dependencies besides fonts.
- `pnpm check` and `pnpm build` pass; no console errors.

## 9. Implementation contract (shared by every file)

Global classes (defined only in `src/styles/global.css`):
- Layout: `.container-site`, `.section`, `.rows` (list with hairline dividers), `.skip-link`, `.tap` (44px min hit area)
- Type: `.display` (Geist Pixel, `--text-display`), `.page-title` (Geist Pixel, `--text-h1`), `.page-head`, `.page-head__dek`,
  `.label` (and alias `.eyebrow`), `.mono` (Martian Mono), `.prose`
- Surfaces: `.hud` (frame + accent corner brackets), `.hud--solid` (with `--bg-elevated`), `.hairline`
- Controls: `.btn`, `.btn-primary`, `.btn-ghost`, `.btn-sm`, `.icon-btn`, `.link`, `.link-arrow`, `.tag` (renders `[text]`), `.kbd`, `.popover`
- Status: `.dot-status` (lime pulsing dot), `.draft-badge`, `.caret`
- Motion: `.reveal`, `.flicker`, `.flicker-idle`, `.glitch` (needs `data-text`), `.marquee` + `.marquee__track`
- Background: `.field` (vignette + grain) + `canvas.field-fx` (dust + lens, persisted across navigations)
- Section header markup (used by `SectionHeading.astro`): `// 0N` index + label + title + filling hairline + optional link

Data attributes (behaviour in `src/scripts/fx.ts`): `data-scramble`, `data-scramble="hover"`, `data-glitch-burst`,
`data-count-to` (+ `data-count-suffix`), `data-boot`, `data-clock`, `data-uptime-since`, `data-pointer-coords`,
`data-egg-hint` / `data-egg-hint-text` (the CURSOR row's arrow + target slot), `data-tele` / `data-tele-grip` (telemetry panel + its resize grip), `data-egg-mark` (coordinate egg markers), plus existing `data-reveal-group`.

Component-specific styles live in the component's scoped `<style>` (or a CSS file imported by a React island), never in
global.css. The ⌘K palette's styles live in `src/components/palette.css`; the sky fallback styles in
`src/components/three/sky.css`.

## 10. Easter eggs

For people who poke at things. No keyboard triggers: the eggs are hidden at coordinates on the home hero, found with the
`CURSOR` readout in the telemetry panel (fine pointers only).

How a coordinate egg is found: within ~200px of an active egg point the `CURSOR` row appends a muted `↗ X 0772 · Y 0286`
on the same line: an arrow rotated live to the exact direction of the egg, then its coordinates. When the egg is reached the
arrow swaps to an `--accent` target glyph; within ~16px a 26px accent circle outline appears on the point with ten dots drifting inward
(1.2s loop; static under reduced motion). It is a real `<button>` with an `aria-label`, stays until the pointer is 48px away,
and clicking fires the egg. A point is active only while it is inside the hero, on screen and not over text, a control or a
`.hud` (`elementsFromPoint` + text line boxes).

The eggs: All facts are real, all motion has a reduced-motion path, and found eggs are tracked
in `localStorage` with a `EGG FOUND n/6` HUD toast (`src/scripts/eggs.ts`).

| Egg | Trigger | What happens |
|---|---|---|
| **Terminal** | Coordinate egg at client **X 0772 · Y 0286** (his longitude/latitude ×10), or the ⌘K "Open terminal" action (the accessible path) | A drop-down console (`src/components/Terminal.astro`, a native modal `<dialog>` persisted across navigations). `rajiv@thoughtlessmind:~$` prompt, history (↑↓), Tab completion, Ctrl+L. Commands: help, whoami, ls, cat, cd, open, neofetch, uptime, date, ping (a real timed fetch), theme, hire, launch, warp, sudo, rm -rf, echo, history, eggs, clear, exit. |
| **Warp** | Coordinate egg at the live centre of `[data-planet-anchor]` (only when `html[data-scene="on"]`), or `warp` in the terminal | Dispatches `signal:warp`; otherwise "Warp drive offline on this page". |
| **Launch** | Coordinate egg at the "launch pad", 32px left of the telemetry panel and 16px above its bottom edge (desktop two-column hero only), or `launch` in the terminal | HUD countdown T-3 → liftoff, a pixel rocket climbs from the pad out of the viewport with a fading exhaust trail, and `signal:pulse` fires at the pad (the dust gets a shockwave). |
| **Console** | Opening DevTools (production, or `?console`) | A styled greeting with the email and a `hi()` function. |
| **404** | Visiting any missing page (`data-egg="404"`) | Counts as found. |
| **Sudo** | `sudo …` in the terminal | "rajiv is not in the sudoers file. This incident will be reported." |

Events on `window`: `terminal:open` (no detail), `signal:warp` (no detail) and `signal:pulse` (`detail: {x, y}` in client px; the dust gets a shockwave, the planet glitches if hit).
