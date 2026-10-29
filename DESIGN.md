# rajiv.me, design v4

A quiet, typographic page in two themes, with the hexagon mark as the one piece of colour that never changes.

## §1 Type

- **Geist** (`--sans`) does every visible word. Weights 400 and 500. Sentence case, no emoji, no em or en dashes.
- **Geist Mono** (`--mono`) only for code: the post cards' code tags, the tooltip still's markup and the Bits intro's
  digits. No mono labels, no small uppercase labels.
- Seven steps, tokens on `:root`. Each is its full size at 1440 and its phone size by about 720:

| Token      | Size                          | Use                                              |
| ---------- | ----------------------------- | ------------------------------------------------ |
| `--t-xl`   | `clamp(40px, 5vw, 72px)`      | the headline                                     |
| `--t-l`    | `clamp(28px, 2.4vw, 34px)`    | h2s                                              |
| `--t-m`    | `clamp(20px, 1.95vw, 28px)`   | the name over the headline                       |
| `--t-sm`   | `clamp(19px, 1.55vw, 22px)`   | project names, post titles                       |
| `--t-s`    | `17px`                        | body (line-height 1.5)                           |
| `--t-xs`   | `15px`                        | nav, rail, fact labels, meta, dates, footer      |
| `--t-code` | `13px`                        | the post cards' code tags                        |

  Display type: weight 500, leading 0.98 (1 on a phone), tracking -0.045em (-0.04em on a phone). The project stills
  are small illustrations with their own sizes inside, not text steps. The footer's "rajiv" is sized to the content
  width, not a step.

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
| `--logo`   | `#ff5f1f`               | `#ff5f1f`             | the mark, the doodles' orange, the footer's "rajiv" (decorative) |
| `--accent` | `#ff5f1f`               | `#c2410c`             | text orange, focus ring   |

Dark is the default. Light applies under `prefers-color-scheme: light` unless `data-theme="dark"`, and always under
`data-theme="light"`. Both pass WCAG AA for text; `--logo` is only ever the mark, drawings and the decorative
footer name, never running text.

## §3 Chrome

- **The frame**: margins `--gut` / `--gut-r` = `clamp(20px, 3.4vw, 48px)` (or the safe area) via `.wrap`. The header
  sits on one axis at 42% of the width: `--cols` = `42fr 58fr`. On the home page the content keeps `--rail` (168px)
  clear on the right from 721px up, so nothing sits under the rail.
- **Header** (`.top`): absolute over the page, a grid on `--cols`. The logo alone in the first column: the hexagon mark
  (`.mark`, `data-logo`, 28px) in a link labelled "rajiv.me, home". From the axis, `.bar`: nav (Work, Writing, About;
  sans 15px, gap 28px), then the theme switch on the right margin. Under 900px it is a flex row (gap 16px). Hover:
  opacity .7.
- **Theme switch** (`ThemeToggle.astro`): an icon button (Phosphor regular, 20px, 32px hit area) showing the theme it
  switches to: a sun on dark, a moon on light. CSS picks the icon with the same rules as the tokens, so it is right
  before any script runs; the name says the action ("Switch to light theme"). It follows the system until clicked,
  then stores `localStorage['theme']` and fires `theme:change` on window. A page can hold more than one (the home
  page has the header's and the rail's); one script drives them all.
- **Rail** (home page, `.rail`): a 168px column fixed to the right edge, `--bg` with a `--line` hairline on its left.
  The mark (24px) at the top links back to the top; About me, Projects and Writing sit as horizontal labels in the
  middle (15px, `--muted`; the active one `--ink` with a 6px `--accent` dot before it, `aria-current`); the theme
  switch at the bottom. Hidden (`visibility`) until it slides in, so it is never focusable off screen.
- **Bottom bar** (the rail at 720px and under): a 56px bar along the bottom (plus the safe area), hairline on top,
  the three labels on the left and the theme switch on the right, no mark.
- **Text links** (`.ul`): 1px underline at 0.22em offset, 2px on hover. Focus ring: 2px `--accent`, offset 2px.
- Hairlines only between the landing's fact rows and on the rail's edge. No boxes, gradients or shadows; surfaces
  change by a tone step (`--panel` under the project stills and post covers).

## §4 Motion

One easing, `--ease` = `cubic-bezier(.2, .7, .2, 1)`. Every motion has a reduced-motion path, and idle means zero work:
CSS animations and transitions only, state from IntersectionObserver, no scroll listeners. rAF runs only in the intro
and for the planet's bands, and only while they are on screen.

- **Content rise**: `.rise` elements carry `--d` (unitless ms): header 0 / 60 / 100 / 140 / 180; the name 120, the
  headline 190, the five fact rows 300 to 460. Only the intro animates them (800 ms, 20 px rise + opacity).
- **Doodle draw** (`Doodle.astro`): the landing drawing draws itself once, from the moment the content rises
  (`html.go`; on load when no intro plays), in the order of the composition: the telescope from the ground up
  (200 ms), the dotted route as a pen moving to the rocket (650 to 1500), the planet's outline (1150), its bands and
  rings fading in (1250, 900 ms), the orbit's dashes sweeping round (1000 to 1850), the moon (1250), the pendulum's
  bar, string and trail (1300), the pendulum starting to swing (1750), the stars popping in one at
  a time from lower left to upper right (1450 to 2150), and last the rocket: its outline (1600), the orange flame
  filling in from the nozzle and a small lift along its heading (1950, 750 ms). About 2.4 s in all. Strokes draw with
  `pathLength="1"` and `stroke-dashoffset`; each carries its delay `--d` and duration `--t` in ms. Fill mode
  `backwards`, so once done every element is back to its plain state. While the intro plays the animations are held
  (`animation-play-state: paused`) at their hidden start. Under reduced motion the finished drawing shows at once.
- **Doodle, alive**: two things keep moving after the draw, and both hold still under `html.rail-on` and reduced motion.
  The pendulum swings between its drawn extreme and its far ghost (rotate 0 to -55° about the pivot, 1.1 s each way,
  sine ease, `infinite alternate`). The planet (`scripts/planet.ts`, generated, not traced) turns with its rings, seen
  16° above the ring plane, its axis leaning 26°; the near side of both moves left to right (anticlockwise from the
  north). Rings: ringlets of random width (2.5 to 12.5 px in the ring plane) and spacing between 1.26 and 1.86 planet
  radii, with a wider Cassini-like gap near 1.6; each is a circle squashed by sin 16°, so it thins at the front and back
  as real rings do, and its dash clumps orbit by `stroke-dashoffset` with a period ∝ r^1.5 (about 45 s inside to 75 s
  outside). The body hides the far half; a second copy clipped to the near half passes over it. Bands: seven broken
  latitude lines projected on the sphere each frame (64 s day), so they slow and shorten towards the limb and end
  exactly at it; the loop runs only while the doodle is on screen and not covered by the intro or the rail, and its
  clock stops with it.
- **Rail**: once a sentinel 32% down the landing has left the top, `html.rail-on`: the rail slides in (translateX
  100% to 0, 550 ms) and the doodle fades and shifts out (opacity 600 ms, translateX 3% 800 ms). Scroll spy: the
  section crossing the middle of the screen (`rootMargin: -45% 0px -54% 0px`) is active; the footer counts as
  Writing. Rail links are plain anchors and `html { scroll-behavior: smooth }` scrolls to them (instant under reduced
  motion). On a phone the bottom bar slides up instead and steps back down while a quarter of the footer is on screen
  (`html.foot-vis`).
- **Footer rise**: "rajiv" sits in a box 0.47em tall with overflow hidden; the first time a quarter of the footer is
  on screen it rises from translateY(0.42em) to -0.11em (1.4 s), so its top half shows. Without JS or under reduced
  motion it is risen from the start.
- **Hover**: links thicken their underline, cards lighten to `--hi`, post covers scale to 1.03 (800 ms, not under
  reduced motion), rail labels go to `--ink`.

### Intro (`components/Intro.astro`, `scripts/intro/`)

On every load of the home page the mark assembles in the middle of the screen in the theme's ink, moves into the header logo
(800 ms, centre linear in eased time, scale geometric), turns orange (350 ms) and the real SVG takes over in the same
frame; the content rises from 200 ms into the move. `?intro=off` skips it (for screenshots and checks).

- **Bits** (`bits.ts`, lands 4.05 s), the one intro: a faint field of 0s and 1s gathers into the mark hexagon by
  hexagon; read row by row the landed digits are the ASCII bits of "rajiv.me". A diagonal sweep turns them into a pixel
  mosaic that resolves into the vector mark. (Machine, the plates that unfolded into the mark, was dropped on 30 Oct.)

Mechanics: a page opts in with `<BaseLayout intro>` (only the home page does), which renders the pre-paint gate and the
intro canvas. The gate adds `html.intro` (never under reduced motion), which hides `.mark` and `.rise` until the intro
lands. The intro's frame is a pure function of t (`kit.ts` holds the geometry; prototypes and
frame-by-frame scrubbing live in the local `docs/v4-research/i-loaders/` playboard). Any click, key, wheel or touch
skips: the canvas and logo cross-fade (300 ms) and the content rises. A theme change mid-intro redraws in the new ink.
If the intro script hasn't started 2.5 s after the gate, the page shows anyway. rAF stops at the landing.

## §5 Home page (`pages/index.astro`)

Quiet: about him in a few exact lines, the things he made, what he wrote. One drawing, one moving moment (the doodle
drawing itself), the rail for getting around. Sections, in order:

1. **Landing** (`#about`): `min-height: clamp(640px, 100vh, 960px)`, the text vertically centred. Left column
   `min(760px, 52vw)`: the name (`--t-m`, `--accent`), then the h1 "Software you don’t / have to think about."
   (`--t-xl`, two authored lines). Under it a `dl` of five rows on `--line` hairlines, label (15px, `--muted`) in a
   136px column: Based in New Delhi, India; Builds web and native apps, backends and infrastructure, since 2019;
   Cares about software that’s fast to load, clear to use and boring to run; Off screen astronomy, rockets, physics
   and sport; Elsewhere GitHub, LinkedIn, X, email. The right 48% (to the screen edge) holds the doodle, centred with
   96 / 56 / 40 px of air: a sketchbook line drawing of a telescope whose dotted route loops a ringed planet and runs
   up to a rocket, with a moon, a pendulum, stars and two hexagons. It is an inline SVG traced from Codex line art
   (`src/assets/doodle.svg`; tracer in the local `docs/v4-research/art/vector/`; the planet is generated, see §4):
   strokes on `currentColor` (`--ink`),
   the flame and one hexagon in `--logo`, so it follows the theme. At 720px and under: the doodle in a 208px band
   under the header (strokes 1.8x thicker), the text below, the headline balanced over three lines (no forced break),
   the fact labels above their values.
2. **Projects** (`#projects`): h2 with the note "Tools I built for my own problems, then released." beside it. Two
   columns of cards (one on a phone), each a link to the real thing: a 16:10 `--panel` still drawn in HTML (the
   CSS-only tooltip with its attribute, the Diver outline on a mini page, the playlist total, the mark; scaled 1.35
   when the card is wider than 420px), the name (`--t-sm`) with "Kind, year" on the right, and a muted summary.
3. **Writing** (`#writing`): h2 with the note "Short notes on problems worth writing down.", two columns of cards and
   "All writing". Each card: a 16:10 `--panel` cover (the post's line doodle, traced to SVG in
   `src/assets/covers/`, ink on `currentColor`, orange in `--logo`), the code the post is about in mono (`--t-code`,
   `--muted`, one line) with the date on the right, the title (`--t-sm`) and a muted summary. Links point at
   `/writing/<slug>` (pages not built yet).
4. **Footer** (the layout's `footer` slot): one row of "Write to me at <email>", the socials (GitHub, LinkedIn, X,
   dev.to, Stack Overflow) and "© 2026 Rajiv Kumar" (a column on a phone). Then a giant lowercase "rajiv" in `--logo`,
   weight 500, tracking -0.055em, as wide as the content (font-size `100cqw / 1.68`), cropped to its top half by a
   0.47em box at the bottom of the page.

