# thoughtlessmind.dev — design v3 "SIGNAL"

The site is a live signal console run by one web engineer. Dark by default, phosphor-on-black, hard edges,
pixel display type, telemetry readouts, and digital motion that flickers, decodes and glitches, but only in short,
deliberate bursts. It should feel like a well-built instrument, not a hacker-movie cliché: no green-on-black Matrix
rain, no neon purple synthwave, no fake "hacking" text. Every readout shows a real fact about Rajiv.

Why it fits him: he builds developer-grade tools (a no-JS tooltip library, a Chrome extension that outlines every
element on a page, a playlist timer), he's a CSS and React person who reads about rockets and orbital mechanics.
So the metaphor is **mission control for a web engineer**: telemetry, launch orange, a ringed planet made of
points, a field of dust that bends around the cursor like a gravitational lens, and a set of easter eggs for people who poke at things
(a real terminal, a rocket launch, a warp drive).

`src/styles/global.css` implements this file. Tokens only: no ad-hoc colours, radii, durations or fonts anywhere else.

---

## 1. Type

| Role | Font (Fontsource package) | Where |
|---|---|---|
| Display | **Geist Pixel** (`@fontsource-variable/geist-pixel`, the square `ELSH` 1 instance, set once on `<html>`) | Hero name, page titles, 404, big counters, mobile menu links. Only at ≥ 40px. Never body text. |
| Interface / headings | **Martian Mono** (`@fontsource-variable/martian-mono/standard.css`: `wdth` 75–112.5 via `font-stretch`, `wght` 100–800) | h2–h6, nav, buttons, labels, tags, readouts, tables, the article title |
| Body / prose | **Geist** (`@fontsource-variable/geist`) | Paragraphs, article prose, summaries |
| Code | **Geist Mono** (`@fontsource-variable/geist-mono`) | Code blocks, inline code, kbd, the terminal, OG cards |

Tokens: `--font-display`, `--font-ui`, `--font-sans`, `--font-mono`.

Scale (fluid, 360 → 1440):
- `--text-display`: clamp(3.25rem, 1rem + 10vw, 10.5rem); line-height 0.9; tracking 0
- `--text-h1`: clamp(2.5rem, 1.5rem + 4vw, 5rem); lh 1.0 (Geist Pixel: bare `h1` and `.page-title`)
- `--text-h2`: clamp(1.5rem, 1.1rem + 1.6vw, 2.25rem); lh 1.15; Martian Mono 600, `wdth` 100, tracking -0.01em
- `--text-h3`: clamp(1.125rem, 1rem + 0.6vw, 1.375rem); lh 1.3; Martian Mono 500
- h4–h6: 1rem; lh 1.4
- `--text-lead`: clamp(1.125rem, 1.05rem + 0.4vw, 1.3125rem); lh 1.55; Geist
- `--text-body`: 1.0625rem (17px); lh 1.7; Geist
- `--text-small`: 0.875rem; lh 1.55
- `--text-label`: 0.6875rem (11px); lh 1.4; Martian Mono 500, UPPERCASE, tracking 0.14em, `wdth` 87.5
- `--text-caption`: 0.75rem; lh 1.5

Labels, nav, buttons and tags are uppercase Martian Mono. Headings and body are sentence case. No emoji.

## 2. Colour

Two themes. **Dark is the default** (no stored choice → dark). `data-theme="dark" | "light"` on `<html>`.

Dark, "signal":
| Token | Value | Use |
|---|---|---|
| `--bg` | `#0a0b0d` | page |
| `--bg-elevated` | `#101216` | cards, palette, terminal, telemetry, marquee tape |
| `--surface` | `#15181d` | code, inputs, hover rows |
| `--border` | `#23272e` | hairlines |
| `--border-strong` | `#3b414b` | inputs, frames, button borders |
| `--field-dot` / `--field-vignette` / `--field-grain` | `rgb(233 231 226 / 0.3)` / `rgb(0 0 0 / 0.5)` / 4% SVG noise | background dust (brightest level), edge vignette, grain |
| `--text` | `#ebe9e4` | primary text |
| `--text-muted` | `#a6aab2` | secondary |
| `--text-subtle` | `#858b95` | labels, meta (5.74:1 on bg) |
| `--accent` | `#ff5f1f` | **launch orange**: primary CTA, active nav, focus ring, corner brackets |
| `--accent-hover` | `#ff7a45` | |
| `--accent-fg` | `#0a0b0d` | text on accent |
| `--accent-soft` | `rgb(255 95 31 / 0.12)` | selection, hover wash |
| `--signal` | `#38e1f0` | cyan: the second glitch channel, link hover underline, the terminal's cwd. Never large fills. |
| `--ok` | `#a4f04a` | lime: status dots |
| `--code-bg` | `#0d0f12` | |
| `--glitch-blend` | `screen` | blend mode of the glitch copies |

Light, "blueprint paper" (same roles, print-like):
| Token | Value |
|---|---|
| `--bg` | `#edebe5` |
| `--bg-elevated` | `#f6f5f1` |
| `--surface` | `#e2dfd7` |
| `--border` | `#cdc9bf` |
| `--border-strong` | `#9b968b` |
| `--field-dot` / `--field-vignette` | `rgb(17 18 20 / 0.34)` / `rgb(255 255 255 / 0.55)` (grain shared) |
| `--text` | `#111214` |
| `--text-muted` | `#44474d` |
| `--text-subtle` | `#595d64` |
| `--accent` | `#b33504` (5.14:1 on `--bg`; the first pick `#c73a05` failed AA) |
| `--accent-hover` | `#962b03` |
| `--accent-fg` | `#ffffff` |
| `--accent-soft` | `rgb(179 53 4 / 0.1)` |
| `--signal` | `#006d7d` (5.06:1; darkened from `#00788a` for AA) |
| `--ok` | `#2e7d0a` |
| `--code-bg` | `#e6e3db` |
| `--glitch-blend` | `multiply` |

Colour rules: orange is rare and meaningful (one primary CTA per view, the active state, focus, bracket corners).
Cyan appears only in motion (glitch split, hover underline) and small accents. Lime only on status dots.
`theme.js` also keeps `<meta name="theme-color">` in step (`#0a0b0d` / `#edebe5`).

## 3. Shape, space, surfaces

- **Radius: 0.** Only `--radius-1: 2px` for kbd, and `999px` for status dots. The one circle in the system is the
  coordinate-egg marker ring (§10). No rounded cards.
- **HUD frame** (`.hud`): 1px `--border` box with four 10px × 2px **corner brackets** in `--accent` (background gradients on `::before`, no extra DOM). This replaces cards and shadows. No drop shadows anywhere.
- Background: **random dust**. `canvas.field-fx` (drawn by `src/scripts/field.ts`) scatters 1px dots from a seeded PRNG, one
  candidate per 24px cell (`--field-size`), jittered inside the cell with a 4px margin, ~30% empty, three brightness levels
  (55 / 30 / 15%), repeating on a 480px tile so it is identical on every page and reload. `.field` (CSS) adds only the edge
  vignette and a faint grain on top. No grid, no crosses, no scanlines. Both sit below the sky (z -2 / -1). Without JS only the
  vignette and grain show.
- Container: `--container-site` 1320px, gutter `--spacing-gutter` clamp(1rem, 4vw, 2.5rem). Measure `--container-measure`
  40rem (~70 characters of Geist; 68ch ran to ~88 because of its wide "0"). `--container-wide` 880px for code/figure breakouts.
  `--header-h` 3.5rem.
- Section rhythm: `--spacing-section` clamp(5rem, 3rem + 7vw, 9rem); `.section` pads half of it top and bottom.
- Section header pattern (`SectionHeading.astro`): one row of `// 0N` index in `--accent` + label (decodes in view) + a
  hairline that fills to the right edge + an optional `ALL WORK →` link; the title sits below the row.

## 4. Motion

Tokens: `--dur-1` 120ms, `--dur-2` 240ms, `--dur-3` 480ms, `--dur-4` 900ms; named: `--dur-page-out` 160ms,
`--dur-glitch` 280ms, `--dur-reveal` 360ms, `--dur-flicker` 420ms, `--dur-caret` 1.1s, `--dur-pulse` 2.4s,
`--dur-marquee` 40s; `--ease-out` cubic-bezier(0.2, 0.8, 0.2, 1); `--ease-step` steps(4, end).

Everything below except the three readouts (clock, uptime, pointer coords) is **off under
`prefers-reduced-motion: reduce`** (final state shown immediately) and never blocks content: text is in the HTML at its
final value; JS only animates it.

Safety: no element larger than ~25% of the viewport may flash, and nothing flashes more than 3 times per second
(WCAG 2.3.1). Flicker is an opacity dip, not a black/white flash; large areas (`main`, the mobile menu) use the gentler
`flicker-soft`, whose dip never goes below 0.6.

| Effect | Trigger | Spec |
|---|---|---|
| **Decode / scramble** | `data-scramble` (once, when ≥ 40% in view); `data-scramble="hover"` (pointerenter/focus of the closest link or button: nav, CTAs, section links) | Characters resolve left→right from random glyphs `!<>-_\/[]{}=+*^?#01ABCDEF` over 700ms (hover: 350ms). Spaces are kept. The element is split into a `.sr-only` copy of the final text plus an `aria-hidden` glyph span with the same character count, so mono widths hold. Targets must be text-only leaves. |
| **CRT turn-on** | `.flicker` | On load: opacity 0 → 1 with three stutters (0, .8, .2, 1, .6, 1) over 420ms `--ease-step`. On `main` it runs `flicker-soft` (0, .85, .6, 1). |
| **Glitch** | `.glitch` with `data-text="same text"`, on hover/focus; `data-glitch-burst` adds `.is-glitching` every 5–9s (skipped while the tab is hidden) | Two pseudo-elements copy the text, offset 2–3px in `--accent` and `--signal` with `mix-blend-mode: var(--glitch-blend)`, clipped to 3 horizontal slices that jump in `steps()`, 280ms total. Used on the hero name, the 404 code, project titles and the contact email. |
| **Caret** | `.caret` | A 0.6em × 1em `--accent` block (`::after`), blinking 1.1s `steps(1)`. |
| **Status dot** | `.dot-status` | A 6px round lime dot pulsing to 0.35 opacity every 2.4s. |
| **Boot log** | `[data-boot]` on home hero | Child lines appear one by one, 70ms apart, each decoding (700ms): about 1s total. Once per session (`sessionStorage.booted`); later visits render lines instantly. Decorative (`aria-hidden`). Hidden < 600px. |
| **Counters** | `data-count-to="98"` (+ optional `data-count-suffix="k+"`) | When ≥ 40% in view, digits roll through random digits then settle left→right, 900ms; the suffix never rolls. |
| **Marquee tape** | `.marquee` + `.marquee__track` | Horizontal infinite scroll of stack keywords separated by an accent `▲`, 40s linear; pauses on hover. The duplicated list is `aria-hidden`. |
| **Reveal** | `.reveal` in `[data-reveal-group]` (`src/scripts/reveal.ts`) | Once, when it enters the viewport (bottom 10% excluded): opacity 0 → 1 with a 2-step `clip-path` inset wipe (top→bottom), 360ms, 50ms stagger capped at 6 steps. Hidden only when `html.js` and motion is allowed. |
| **Lens** | Pointer move (fine pointers) | The dust around the cursor is displaced like a gravitational lens (point-lens mapping): a clear ~32px core, dots compressed into a soft ring (~48px of glow) that brightens and warms 25% toward `--accent`, back to rest by 150px; the brightest ring dots draw at 2px. Faint extra dust (invisible at rest) appears only inside the ring. The lens follows an eased cursor (~70ms) with no trail, fades in/out (~180ms) as the pointer enters/leaves the window, and rAF stops when it settles. `signal:pulse` sends a 420px, 800ms shockwave through the dust. Off (static field) on article pages, under reduced motion and without a fine pointer. |
| **Live clock** | `data-clock` | `HH:MM:SS` in Asia/Kolkata (markup adds ` IST`), updates each second, tabular nums. |
| **Uptime** | `data-uptime-since="2019-03"` | Renders `07y 06m` style difference from that month to now. Server renders a build-time value first. |
| **Pointer coords** | `data-pointer-coords` | `X 0412 · Y 0233` from the pointer position, fine pointers only, rAF-throttled. |
| **Theme switch** | `[data-theme-toggle]` | `html.theme-transition` eases background, text and border colours over 240ms. |
| **Page transitions** | Astro `ClientRouter` | Old page: 160ms `steps(3)` fade out (`--dur-page-out`); the new page is held until it is gone, then fx.ts adds `.flicker` to `main` on `astro:after-swap` (the soft variant above). |

All data-attribute behaviour lives in one module, `src/scripts/fx.ts`, re-initialised on `astro:page-load` and cleaned up
on `astro:before-swap` (no leaked intervals, observers or listeners). The dust and lens are `src/scripts/field.ts`, the
reveal `src/scripts/reveal.ts`, the eggs `src/scripts/eggs.ts`.

## 5. 3D — the signal body (React Three Fiber)

One persisted `<canvas>` behind everything (`div.sky[data-canvas]` > `SkyCanvas` island). It loads after `load` + fonts +
idle and only with WebGL2; never on article pages; never under reduced motion / save-data / `deviceMemory` < 4 / ≤ 2 cores;
not in a prerendering tab. Turning reduced motion on mid-session drops the scene for the fallback.

Scene:
- A **ringed planet made of points**: 5,000 points on a Fibonacci sphere (gas-giant bands that wobble with longitude) +
  3,000 points in a ring (radius 1.5–2.4 with a Cassini gap at 2.06–2.14, seen ~20° from above and rolled to rise left).
  Plus 900 background stars (slow drift, no pointer parallax: only the dust answers the cursor). Two draw calls (stars, planet; a third for the black hole on home), custom `ShaderMaterial`,
  no drei, no postprocessing package.
- Look: points are small squares snapped to a 2–3 device-px grid (pixel feel), brightness quantised into 4 levels with an
  ordered **Bayer 4×4 dither**. Lit from upper-left: lit side in `--text` colour, terminator and lit limb in launch orange,
  a thin cyan fringe on the dark limb, the planet's shadow across the ring with an orange penumbra. **Scanline**: the
  bottom device row of each point cell is dimmed, so rows of points read as a raster.
- Motion: slow rotation (one turn / 90s); the ring turns independently at Keplerian speed (60s at its inner edge, slower
  outside); pointer parallax (≤ 6°) on fine pointers; per-point **flicker** (~3% of points dip to 55% for 250ms each second);
  **glitch bursts** every 5–9s for 180ms: points in 2–3 random horizontal bands shift sideways and split into an orange
  copy and a cyan copy (the planet is instanced 3× only then). Points within ~110px of the pointer brighten slightly (a
  "scanner" hover).
- Layout: the planet is drawn over the home hero's `[data-planet-anchor]` (≥ 900px: right column, up to 540px square; below:
  its own band above the copy). As the hero scrolls away it shrinks into the top-right corner slot (15% of the width,
  130–230px, under the header) and fades from full (0.55 < 768px) to 0.08; it renders at scroll rate while it moves. On other
  non-article pages it sits in that corner at 0.12 (thousands of points stack into few pixels under additive blending). On
  articles the sky fades out and the loop parks after 1.5s.
- Events: `signal:warp` runs the 2.6s warp (stars stream along rays from the planet into streaks, the sphere gains one turn
  and the ring two, one orange/cyan split over the whole planet at the 1s peak, exact return to rest; every frame rendered
  while it runs; ignored while one runs). `signal:pulse` `{x, y}` on the disc or the ring's ellipse fires a glitch burst
  (at most every 0.4s). While the WebGL scene runs on a page, `<html data-scene="on">` is set so other code can tell.
- Theme: dark uses additive blending; light uses normal blending with ink-coloured points and orange rim. Colours are read
  from the tokens and ease over ~250ms on a theme change.
- Cost: capped at ~30fps via `invalidate()` (`frameloop="demand"`), `dpr` 1–1.5 (dropped to 1 for good after sustained slow
  frames), paused when the tab is hidden.
- **Black hole** (home page, `three/BlackHole.tsx` + the tide sim in `Planet.tsx` + `three/bend.ts`): a small hole,
  horizon 0.15 planet units, drawn as one quad shaded per point cell like the planet: a shadow (`--bg` on dark, ink on
  light), a thin photon ring, and a disk seen ~17° from above, turning clockwise, brighter on its approaching (right)
  side, orange toward its inner edge, whose near half crosses the shadow and whose far half is lensed into an arc
  over it. Its hit area is Hero's `[data-black-hole]`, a `role="slider"` (value = pull; arrows move it 24px nearer or
  further along the line to the planet, Home rests it, End brings it closest), hidden until the scene binds it.
  - **Moves**: anywhere in `<main>` (it scrolls with the page), with any pointer, never onto the planet: wherever the
    planet is drawn, its centre keeps 3.2 horizon radii + 6px off the planet's outline (disc or rolled ring ellipse,
    whichever reaches further). It is heavy: a drag pulls it on a damped spring (9 rad/s, ζ 0.8) and, let go, it
    glides to a stop; its mass grows to 4× as it eats the planet, which slows both. It rests lower left of the planet,
    just out of reach.
  - **Pull**: full at that closest point, fading to none 9 horizon radii further out. While it pulls: a glitch burst
    as the pull takes hold, the ring loosens, the planet stretches toward the hole, and points tear off, outer ring
    first, then the inner rings, then the sphere, near side first (about 20s for the whole planet at full pull, ≤ 500
    points/s). Once the near side of the sphere is gone its far side and the ring behind it show through.
  - **Gulps**: torn points drift off, then plunge at near free-fall speed, flattening into the disk plane with a last
    clockwise curl; nothing settles into orbit. At 1.3 horizon radii they stop and hang, dimming and reddening (as a
    distant observer sees infalling matter), until the hole gulps: every 0.45s, or at once when 30 are waiting, all of
    them go, the horizon swells (up to +22%) and the photon ring and disk flare. The hole grows with what it has eaten
    (up to +35%). Out of reach, the planet re-forms in reverse (sphere first), each point flickering on (the
    `.flicker` steps), in ~4s. Leaving the page resets it.
  - **Lensing**: stars bend around it (point lens) and never show through the shadow; the dust too (field.ts, a second
    lens: Einstein radius 2.2 and reach 10 horizon radii; it stands in for the pointer's lens while dragged). Text
    blocks it passes over (`bend.ts`: up to 4, found with `elementsFromPoint`) get an SVG filter: inside 9 horizon
    radii they are displaced like a point lens with a little frame-dragging swirl, a clear core of ~2.3 radii lets the
    hole show through, and every 0.8–1.6s a 160ms burst splits the bent part orange/cyan, dims and jolts it (two
    steps). The filters come off as it leaves. The DOM text is untouched.
  - Every frame is rendered while it moves, points are in flight or it gulps; otherwise the 30fps cap holds.
- Static fallback (no WebGL / reduced motion / weak device / chunk error): a CSS-only dithered disc (four lit steps +
  orange terminator) and tilted ring with its gap, drawn as a 3px dot grid in the top-right corner at 45% opacity over a
  sparse fixed star field (`three/sky.css`). No animation.

## 6. Chrome

**Header** (sticky, `--header-h` 56px, `--bg` at 85% + 12px backdrop blur, bottom hairline):
`[ tm▍ ]` wordmark with blinking caret (brackets `--text-subtle`, accent on hover; links home) · nav `01 WORK  02 WRITING  03 ABOUT`
(index in `--text-subtle`, active item in `--accent` with a `▸` marker, hover scramble) · right side: `NDL 14:32:07 IST` live
clock (hidden < 900px), search button (icon + `⌘K` kbd; opens the palette), theme toggle `[DRK|LGT]`: one native button,
`aria-pressed` = light, the lit segment filled in `--accent` by CSS off `html[data-theme]` so it is right before JS runs.
< 768px: nav and the `⌘K` kbd hide; a `MENU` / `CLOSE` button opens a full-height sheet under the header with Geist Pixel
40px links (flicker-soft on open), closed by Esc, an outside click, tabbing out or widening past 768px.

**Footer**: HUD frame (`--bg` at 85%). Left: "Built by Rajiv Kumar in New Delhi." + `28.6139° N, 77.2090° E`. Middle:
socials as `GH  IN  X  SO  DEV  RSS` mono links (cyan underline on hover). Right: status `● ALL SYSTEMS NOMINAL` (lime dot),
`BUILD 2026-09-23` (build date). One column < 768px. The footer also mounts the terminal `<dialog>` and the egg toast region.

## 7. Pages

**Home**
1. Hero (≥ 900px: two columns, min-height `92svh` minus the header; planet box `max(16rem, min(40vw, 540px, 100svh −
   header − 24rem))` on the right with the telemetry panel under it). Boot log (4 muted lines: `> init signal.v3 ........ ok`,
   `> mount /work /writing /about .. ok`, `> locate operator ....... 28.61N 77.21E`, `> status .................. shipping`),
   status label `● ONLINE — SYS://THOUGHTLESSMIND`, `<h1>` "Rajiv Kumar" in Geist Pixel display (two lines, `.flicker`,
   `.glitch` + `data-glitch-burst`), a role line `web engineer` (Martian Mono, h3 size, decodes in view) + caret, lead
   paragraph (Geist): "I build interfaces that load fast and read clearly. Seven years of React and TypeScript." CTAs: primary `[ VIEW WORK ]` (→ `#work`), ghost `> ping me` (mailto). Telemetry panel
   (`.hud.hud--solid`) with rows: `LOC 28.6139° N, 77.2090° E` · `LOCAL <clock> IST` · `UPTIME <since 2019-03>` ·
   `STACK TS / REACT / ASTRO / R3F` · `CURSOR <pointer coords>` (+ the egg hint, §10; the
   CURSOR row is hidden on coarse pointers). One line per cell, ellipsised, so nothing reflows.
   The panel is secondary: compact by default (11px, every size in em off `--tele-scale`, 32em wide) and user-resizable at
   ≥ 900px with a fine pointer. Its free top-left corner bracket is a grip (`role="slider"`, drag up-left to grow, arrow keys
   ±5%, Home / End, Enter or double-click resets), range 0.85×–1.8×, clamped so it stays 56px clear of the copy column and
   never rises above the hero. The scale is kept in `localStorage.tele-scale` and applied before paint by an inline script.
   It grows up-left inside a fixed slot so the hero never reflows.
   Mobile (< 900px): one column: the planet gets its own band (`min(62vw, 15rem)`) above the copy so no text sits on the
   points, then the copy, then the compact panel. < 600px the boot log is hidden so the name stays above the fold.
2. Marquee tape (`--bg-elevated`, hairlines above and below): TYPESCRIPT ▲ REACT ▲ CSS ▲ ASTRO ▲ WEBGL ▲ PERFORMANCE ▲ ACCESSIBILITY ▲ CHROME EXTENSIONS ▲ DESIGN SYSTEMS ▲ NODE.
3. `// 01 SHIPPED` "Selected work" (`ALL WORK →`): this site as the case study (`M-00` HUD panel: facts list + build
   pipeline readout + source link), then featured projects as module cards in a 2-column grid (≥ 720px): `M-01` index +
   year, title (Martian Mono, h3 size, glitches on hover), summary, `[CSS] [NPM]` tags, `REPO ↗` + `LIVE ↗` / `NPM ↗` /
   `WEB STORE ↗`. A card with a screenshot spans both columns (image 7fr | body 5fr); the YouTube Playlist Info screenshot
   gets a duotone (grayscale under an accent multiply) + dither + scanline wash that clears on hover/focus. Cards are `.hud`.
4. `// 02 LOGS` "Latest writing": the 3 latest non-draft posts as terminal log lines: `2026-09-08  ▸ Title .......... 6 MIN`
   with dot leaders, then the summary and up to 3 tags.
5. `// 03 OPERATOR` "On record" (`FULL DOSSIER →`): counters row: `98` SO answers, `60` accepted, `110k+` reads on one answer,
   `49` PRs to others' repos, `07` years (computed from 2019). Geist Pixel at clamp(2.5rem, 5vw, 4.5rem); two columns on
   phones, one row from 720px. One short paragraph, then `OFF-DUTY: ROCKETS · ORBITAL MECHANICS · PHYSICS · SPORT`.
6. `// 04 TRANSMIT` — huge "Let's build something." (Geist Pixel display), email as a large Martian Mono link with an accent
   underline that glitches on hover, socials with `↗`.

**Work** `/work/`: page title in Geist Pixel (`.flicker`) + dek; `// 01 FEATURED` the case study and featured module cards
(with the longer description); `// 02 INDEX` a `$ ls -la ~/work` prompt and the full index as a table (idx · year · name ·
stack · links), archived rows last, tagged `[ARCHIVED]` and dimmed by colour (not opacity, to keep AA), rows highlight with
`--surface` on hover; `TOTAL n` under it.

**About** `/about/`: "Operator dossier". Avatar (176px: initials `RK` in Geist Pixel inside a HUD frame with dither dots,
scanlines and a slow accent scan bar; a photo if `/public/images/avatar.{jpg,png,webp}` exists, shown grayscale + dither),
`About` page title, dek, an ID list (name · role · company · base · coords · active), then sections: `// 01 LOG` experience
as log entries, `// 02 TRAJECTORY` timeline (square nodes, current one in accent), `// 03 SPEC SHEET` stack table,
`// 04 ON RECORD` counters + record lines, `// 05 NOW`, `// 06 ELSEWHERE` links.

**Writing** index / tag / series: page title + dek, tag filters as CLI flags (`--tag=css 02` chips + an `NN ENTRIES` readout),
then a terminal listing grouped by year (`// 2026 04`), rows as on home. Tag and series pages add a `$ cd ../writing` crumb;
series pages keep reading order with numbered rows and no tag bar.

**Article**: the calmest page. No 3D and no lens (static dust only). `$ cd ../writing` crumb, title in Martian Mono 600 at
`--text-h2`, dek, a label meta line (date · N min read · N words · updated · draft badge), tags. Prose in Geist 17px on the
40rem measure, headings in Martian Mono, `#` anchors on hover; code, figures and tables break out to 880px at ≥ 960px.
Reading progress: 2px `--accent` bar fixed under the header plus a `037%` readout, measured through the prose only. TOC as a
`> section` list (h3 as `-`) with the active item in accent: a sticky right rail at ≥ 1200px, otherwise a `> ON THIS PAGE [+]`
`<details>`. Code blocks: expressive-code, `github-dark` / `github-light`, radius 0, tab indicator in accent. End stack:
share, series nav, older/newer, author box, related.

**404**: "Signal lost". Big glitching `404` (Geist Pixel, `data-glitch-burst`) over low-contrast TV static (SVG noise mask
at 7%, jumped in steps, flat brightness), `// ERROR 404 · NO CARRIER`, `> return home`, links to Writing and Work, and a hint
that the home telemetry knows where the signals are.

**⌘K palette** (⌘K / Ctrl+K or the header button): a `.hud` terminal prompt: `tm:~$` prefix, mono input ("search writing,
pages, actions"), grouped results (Pages · Writing via Pagefind, falling back to title filtering · Projects · Actions: copy
link, open terminal, switch theme, RSS) with an orange selection bar (inset 2px accent on `--accent-soft`),
`↑ ↓ navigate  ↵ open  esc close` hints. Esc works wherever focus is in it: the first clears a non-empty query, the
next (or the first, on an empty one) closes. Vimium-style extensions eat Esc in a text field and only blur it, so the
input dropping focus to nowhere (not a click, not another window) counts as an Esc; the terminal does the same.

**OG images** (`/og/<slug>.png`, `/og/default.png`; 1200×630, CanvasKit at build): `--bg` ground with a faint 48px grid,
orange 8px left bar, title in Geist Mono bold (64px, 54px when long), muted description, a hairline footer with
`thoughtlessmind.dev · date` on the left and `// SIGNAL` in accent on the right. Only `src/assets/fonts/og/GeistMono.ttf`.

## 8. Accessibility and performance

- AA contrast in both themes; focus ring 2px `--accent`, offset 2px, never removed.
- Every animation has a reduced-motion path; motion never hides content from no-JS users.
- Pixel and mono fonts never carry long reading text.
- Fonts: preload only the Geist Pixel (ELSH) and Martian Mono (standard) latin files used above the fold (`Head.astro`).
- The 3D chunk stays lazy and out of the initial bundle; no new runtime dependencies besides fonts.
- `pnpm check` and `pnpm build` pass; no console errors.

## 9. Implementation contract (shared by every file)

Global classes (defined only in `src/styles/global.css`):
- Layout: `.container-site`, `.section`, `.rows` (list with hairline dividers), `.skip-link`, `.tap` (44px min hit area on coarse pointers)
- Type: `.display` (Geist Pixel, `--text-display`), `.page-title` (Geist Pixel, `--text-h1`), `.page-head`, `.page-head__dek`,
  `.label`, `.mono` (Martian Mono), `.prose`
- Surfaces: `.hud` (frame + accent corner brackets), `.hud--solid` (with `--bg-elevated`)
- Controls: `.btn` (draws `[ ]` around its label in CSS), `.btn-primary`, `.btn-ghost` (a `>` prompt in accent instead),
  `.btn-sm`, `.icon-btn`, `.link`, `.tag` (renders `[text]`), `.kbd`
- Status: `.dot-status` (lime pulsing dot), `.draft-badge`, `.caret`
- Motion: `.reveal`, `.flicker`, `.glitch` (needs `data-text`), `.marquee` + `.marquee__track`; state classes set by
  scripts: `.is-visible`, `.is-glitching`, `.is-dim`, `html.theme-transition`
- Background: `.field` (vignette + grain) + `canvas.field-fx` (dust + lens, persisted across navigations)

Data attributes: `data-scramble`, `data-scramble="hover"`, `data-glitch-burst`, `data-count-to` (+ `data-count-suffix`),
`data-boot`, `data-clock`, `data-uptime-since`, `data-pointer-coords` (all fx.ts); `data-reveal-group` (reveal.ts);
`data-egg`, `data-egg-hint` / `data-egg-hint-text` (the CURSOR row's arrow + target slot), `data-egg-mark` (the marker
button), `data-tele` (eggs.ts); `data-tele-grip` (Hero's resize grip); `data-planet-anchor` (Planet.tsx, BlackHole.tsx,
eggs.ts); `data-black-hole` (the black hole's hit area, BlackHole.tsx);
`data-theme-toggle`, `data-open-palette`. Page state: `html.js`, `html[data-theme]`, `html[data-scene="on"]`,
`body[data-page="article"]`.

Events on `window`: `terminal:open` (no detail), `signal:warp` (no detail), `signal:pulse` (`detail: {x, y}` in client px;
the dust gets a shockwave, the planet glitches if hit), `signal:hole` (`detail: {x, y, r, held}` in client px whenever the
black hole moves, `null` once it is gone; the dust lenses around it), `open-palette` (no detail).

Storage: `localStorage.theme` (`light` | `dark`), `localStorage.tele-scale`, `localStorage.eggs` (found ids),
`sessionStorage.booted`.

Component-specific styles live in the component's scoped `<style>` (or a CSS file imported by a React island), never in
global.css. `Terminal.astro` uses `<style is:global>` because its output lines, toasts and rocket are created by script.
The ⌘K palette's styles live in `src/components/palette.css`; the sky container and fallback styles in
`src/components/three/sky.css`.

## 10. Easter eggs

For people who poke at things. No keyboard triggers (the terminal's Ctrl+` is a shortcut, not a find): the eggs are hidden at coordinates on the home hero, found with the
`CURSOR` readout in the telemetry panel (fine pointers only).

How a coordinate egg is found: within 200px of an active egg point the `CURSOR` row appends, on the same line, a muted
arrow rotated live to the exact direction of the nearest point, then its coordinates (`X 0772 · Y 0286`). When the egg is
reached the arrow swaps to an `--accent` target glyph; within 16px a 26px accent circle outline appears on the point with
ten dots drifting inward (1.2s loop; static under reduced motion). It is a real `<button>` with an `aria-label`, stays
until the pointer is 48px away, and clicking fires the egg; that point then stays quiet until the pointer moves 48px
away, and it can be fired again. A point is active only while it is inside the hero, on screen and not over text, a
control, the header, an image or a `.hud` (`elementsFromPoint` + text line boxes).

All facts are real, all motion has a reduced-motion path, and found eggs are kept in `localStorage.eggs` with an
`EGG FOUND n/6 · NAME` HUD toast, bottom-right (`src/scripts/eggs.ts`). The terminal's `eggs` command lists them with hints.

| Egg | Trigger | What happens |
|---|---|---|
| **Terminal** | Coordinate egg at client **X 0772 · Y 0286** (his longitude/latitude ×10), the ⌘K "Open terminal" action (the accessible path), or Ctrl+` (Ctrl+~, same key on macOS and Windows; toggles) | A console centred over the page on the palette's blurred veil, `--container-wide` at most (`src/components/Terminal.astro`: a native modal `<dialog>` in a `.hud`, persisted across navigations so `cd` keeps the scrollback). `rajiv@thoughtlessmind:~$` prompt with the cwd in cyan, output lines type in, history (↑↓), Tab completion (commands and arguments), Ctrl+L clears, Esc or a click outside closes, ⌘K hands over to the palette. Commands: help, whoami, ls, cat (about.txt, projects.txt, socials.txt, stack.txt), cd (work · writing · about · ~), open (github · linkedin · x · so · devto · rss), neofetch, uptime, date, ping (three real timed fetches of `/robots.txt`), theme [dark\|light], hire [--send] (alias contact), launch, warp, sudo, rm, echo, history, eggs, clear, exit. |
| **Warp** | Coordinate egg at the live centre of `[data-planet-anchor]` (only when `html[data-scene="on"]`), or `warp` in the terminal | Dispatches `signal:warp`; otherwise (or under reduced motion) "Warp drive offline on this page". |
| **Launch** | Coordinate egg at the "launch pad", 32px left of the telemetry panel and 16px above its bottom edge (level with the CURSOR row, in the gap Hero keeps clear), or `launch` in the terminal | HUD toast countdown `T-3 · T-2 · T-1 · LIFTOFF` (700ms steps), then a pixel rocket (6px pixels, two-frame flame) rises from the bottom of the viewport under the pad and out the top in 1.6s with a stepped-fade exhaust trail, drawn in a manual popover canvas so it flies over an open terminal; `signal:pulse` fires at its launch point (the dust gets a shockwave). Reduced motion: the toast only. |
| **Console** | Opening DevTools (production, or `?console`) | A styled pixel `RK` greeting with the email, a hint, and a `hi()` function (calling it finds the egg). |
| **Signal lost** | Visiting any missing page (`data-egg="404"`) | Counts as found. |
| **Sudo** | `sudo …` in the terminal | "rajiv is not in the sudoers file. This incident will be reported." |
