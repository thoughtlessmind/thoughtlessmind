# rajiv.me, design v4

A quiet, typographic page in two themes, with the hexagon mark as the one piece of colour that never changes.

## §1 Type

- **Geist** (`--sans`, `font-sans`): headings, body, the hero. Weights 400 and 500.
- **Geist Mono** (`--mono`, `font-mono`): labels via `.lab` (13px, uppercase, +0.02em): nav, the theme switch, the
  hero's build list. The domain beside the logo is `.lab` without the uppercase.
- Body 17px / 1.5. Hero: name `clamp(20px, 1.8vw, 28px)` in accent; headline `clamp(40px, 4.9vw, 76px)`, line-height 1,
  -0.04em, 14ch, balanced; sub `clamp(17px, 1.3vw, 19px)` muted, 44ch.
- Sentence case. No emoji, no em or en dashes.

## §2 Colour

Tokens on `:root` in `src/styles/global.css`, exposed to Tailwind with `@theme inline` (`bg-bg`, `text-ink`,
`border-line`…; the default palette is cleared).

| Token      | Dark                    | Light                 | Use                       |
| ---------- | ----------------------- | --------------------- | ------------------------- |
| `--bg`     | `#141414`               | `#f3f2ee`             | page                      |
| `--panel`  | `#1c1c1c`               | `#e8e7e1`             | raised surfaces           |
| `--line`   | `rgba(237,237,234,.1)`  | `rgba(21,21,21,.12)`  | hairlines                 |
| `--ink`    | `#ededea`               | `#151515`             | text                      |
| `--muted`  | `#8f8f8a`               | `#63635e`             | secondary text            |
| `--hi`     | `#ffffff`               | `#000000`             | emphasis                  |
| `--logo`   | `#ff5f1f`               | `#ff5f1f`             | the mark, both themes     |
| `--accent` | `#ff5f1f`               | `#c2410c`             | text orange, focus ring   |

Dark is the default. Light applies under `prefers-color-scheme: light` unless `data-theme="dark"`, and always under
`data-theme="light"`. Both pass WCAG AA.

## §3 Chrome

- **Header** (`.top`): absolute over the page, flex. The logo alone, no wordmark: the hexagon mark (`.mark`,
  `data-logo`, 28px) in a link labelled "rajiv.me, home"; then nav (Work, Writing, About) pushed right; then the theme
  switch. Gap 40px, 16px under 700px; nav gap 22px, 14px under 700px. Hover: opacity .7.
- **Theme switch** (`ThemeToggle.astro`): an icon button (Phosphor regular, 20px, 32px hit area) showing the theme it
  switches to: a sun on dark, a moon on light. CSS picks the icon with the same rules as the tokens, so it is right
  before any script runs; the name says the action ("Switch to light theme"). It follows the system until clicked,
  then stores `localStorage['theme']` and fires `theme:change` on window.
- Side gutters `--gut` / `--gut-r` (16px or the safe area) via `.wrap`. Focus ring: 2px `--accent`, offset 2px.

## §4 Motion

`.rise` elements carry `--d` (unitless ms): header 0 / 60 / 100 / 140 / 180, hero 120 / 190 / 270 / 340. Only the intro
animates them (800 ms, 20 px rise + opacity, `--ease` = `cubic-bezier(.2, .7, .2, 1)`).

### Intro (`components/Intro.astro`, `scripts/intro/`)

On a first visit the mark assembles in the middle of the screen in the theme's ink, moves into the header logo
(800 ms, centre linear in eased time, scale geometric), turns orange (350 ms) and the real SVG takes over in the same
frame; the content rises from 200 ms into the move. Two intros, picked at random on the first visit; `?intro=machine`
or `?intro=bits` forces one on any visit.

- **Machine** (lands 3.25 s): 18 translucent triangular plates slide in as three trains and pile onto the triangle the
  three hexagons share (3 px shake), unfold about each hexagon's centre in three synced 60° beats (hard stop, small
  rebound), then the seams clamp shut. All 18 plates sit on one lattice: each hexagon's centre is a corner of the others.
- **Bits** (lands 4.05 s): a faint field of 0s and 1s gathers into the mark hexagon by hexagon; read row by row the
  landed digits are the ASCII bits of "rajiv.me". A diagonal sweep turns them into a pixel mosaic that resolves into the
  vector mark.

Mechanics: the pre-paint gate in BaseLayout adds `html.intro` and `data-intro` (first visit: `localStorage
['intro-seen']` unset; never under reduced motion), which hides `.mark` and `.rise`. Each intro's frame is a pure
function of t (`kit.ts` holds the geometry; prototypes and frame-by-frame scrubbing live in the local
`docs/v4-research/i-loaders/` playboard). Any click, key, wheel or touch skips: the canvas and logo cross-fade
(300 ms) and the content rises. A theme change mid-intro redraws in the new ink. If the intro script hasn't started
2.5 s after the gate, the page shows anyway. rAF stops at the landing.
