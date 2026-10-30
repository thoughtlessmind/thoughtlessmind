# rajiv.me, design v4

A quiet, typographic site in two themes, with the hexagon mark as the one piece of colour that never changes. Three
kinds of page: the home page, the writing list and a post. Product truth (who it is for, what it may claim) is in
`PRODUCT.md`.

## §1 Type

- **Geist** (`--sans`) does every visible word. Weights 400 and 500. Sentence case, no emoji, no em or en dashes.
- **Geist Mono** (`--mono`) only for code: the posts' code tokens (cards, the writing list), code in posts, the
  tooltip still's markup and the splash screen's digits. No mono labels, no small uppercase labels.
- Seven steps, tokens on `:root`. Each is its full size at 1440 and its phone size by about 720:

| Token      | Size                          | Use                                              |
| ---------- | ----------------------------- | ------------------------------------------------ |
| `--t-xl`   | `clamp(40px, 5vw, 72px)`      | the headline                                     |
| `--t-l`    | `clamp(28px, 2.4vw, 34px)`    | h2s                                              |
| `--t-m`    | `clamp(20px, 1.95vw, 28px)`   | the name over the headline, post and project row titles |
| `--t-sm`   | `clamp(19px, 1.55vw, 22px)`   | the landing paragraph, list titles, deks, h2 in posts |
| `--t-s`    | `17px`                        | body (line-height 1.5; 1.7 in posts)             |
| `--t-xs`   | `15px`                        | nav, meta, dates, contents, footer               |
| `--t-code` | `13px`                        | the posts' code tokens                           |

  Display type: weight 500, leading 0.98 (1 on a phone), tracking -0.045em (-0.04em on a phone). A post's title is
  the one size between steps: `clamp(34px, 3.6vw, 54px)`, leading 1.04, tracking -0.035em, balanced. Code in posts is
  14px/1.6. The project stills are small illustrations with their own sizes inside, not text steps. The footer's
  "rajiv" is a drawing as wide as the content, not a step.

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
| `--logo`   | `#ff5f1f`               | `#ff5f1f`             | the mark, the doodles' orange, the footer name's revealed fill (decorative) |
| `--accent` | `#ff5f1f`               | `#c2410c`             | text orange, focus ring, active dots, reading line |
| `--shadow` | `rgba(0,0,0,.55)`       | `rgba(38,34,26,.14)`  | the lifted header's drop shadow, nothing else |
| `--sel-bg` | `#f3f2ee`               | `#141414`             | selected text's ground: the other theme's page |
| `--sel-ink`| `#c2410c`               | `#ff5f1f`             | selected text: the other theme's text orange (4.6:1 / 6.1:1) |

Dark is the default. Light applies under `prefers-color-scheme: light` unless `data-theme="dark"`, and always under
`data-theme="light"`. Both pass WCAG AA for text; `--logo` is only ever the mark, drawings and the decorative
footer name, never running text.

Code in posts uses Shiki's `github-dark-default` and `github-light-default` on `--panel`, both themes emitted as
`--shiki-dark` / `--shiki-light` and picked by the token rules in `prose.css`. The light theme is drawn for white, so a
transformer in `astro.config.mjs` swaps its comment, keyword and function colours for Primer's next darker step: the
worst token is 5.2:1 on the light panel and 5.5:1 on the dark one.

## §3 Chrome

- **The frame**: margins `--gut` / `--gut-r` = `clamp(20px, 3.4vw, 48px)` (or the safe area) via `.wrap`. One axis at
  42% of the width, `--cols` = `42fr 58fr`, shared by every page: the header's nav, the home page's Lately rows, the
  writing list and a post's article all start on it. `--head-h` (76px) is the header's height at rest; pages clear
  it, and `scroll-padding-top` keeps anchors below it.
- **Header** (`Header.astro`, `.top`): fixed to the top on every page, a grid on `--cols`. The logo alone in the first
  column: the hexagon mark (`.mark`, `data-logo`, 28px) in a link labelled "rajiv.me, home". From the axis, `.bar`:
  nav (About `/#about`, Writing `/writing`, Projects `/#projects`, in the home page's section order; sans 15px, gap
  28px), then the theme switch on the right margin. The current link is `--ink` with a 6px `--accent` dot hung before
  it, so no label moves: `aria-current="page"` on the writing pages (`current="writing"`), and on the home page the
  scroll spy's `.on` + `aria-current="true"`. At 720px and under it is a flex row (gap 16px, nav gap 20px); all three
  labels fit at 375. Hover and keyboard focus: `--accent` (see Hover below); the logo does not change.
  - **Blended, then lifted**: at scroll 0 it is no surface at all. One registered property, `--lift` (0 to 1), drives
    the bar: background `--bg` mixed in at up to 80%, `backdrop-filter: blur(16px) saturate(160%)`, a `--line`
    hairline, two offset shadows in `--shadow` (`0 4px 10px -6px`, `0 14px 32px -16px`), and padding compacting from
    the resting 76px to 56px. See §4 for what moves it.
  - **Reading line** (`progress`, post pages): a 2px `--accent` line along the header's bottom edge, filling from the
    left with the page's scroll.
- **Theme switch** (`ThemeToggle.astro`): an icon button (Phosphor regular, 20px, 32px hit area) showing the theme it
  switches to: a sun on dark, a moon on light. CSS picks the icon with the same rules as the tokens, so it is right
  before any script runs; the name says the action ("Switch to light theme"). It follows the system until clicked,
  then stores `localStorage['theme']` and fires `theme:change` on window. One script drives every switch on a page.
- **Footer** (`Footer.astro`, every page): one row of "Write to me at <email>", the socials (GitHub, LinkedIn, X,
  dev.to, Stack Overflow) and `llms.txt`, then "© 2026 Rajiv Kumar" (a column on a phone). Under it a giant lowercase
  "rajiv" as wide as the content, drawn like the doodle: Geist 500's outlines redrawn by hand (anchors nudged,
  straight runs bowed, each line running a little past its start), traced to `src/assets/name.svg` (generator in the
  local `docs/v4-research/art/vector/name.mjs`). Outline only, round-capped, in `--muted` at 70% (3.5 units, 7 at
  720px and under, so about 2.5px at 1440 and 1.3px at 375). The viewBox crops it to its top half at the bottom of
  the page. The `--logo` fill shows only where the cursor's blob is (§4).
- **Text links** (`.ul`, and links in posts): 1px underline at 0.22em offset; on hover or keyboard focus the text and
  its underline turn `--accent` and the underline goes to 2px. Focus ring: 2px `--accent`, offset 2px.
- **Hover**: one answer everywhere. Whatever you point at or tab to turns `--accent` over 200ms `--ease`, the colour
  of the focus ring and the "you are here" dots: nav links, the theme switch, text links, the post page's Back,
  contents, Copy and Markdown links, and the title of every clickable item (post rows, project rows, the /writing
  list, "Read all 12 posts"). Nothing fades. Hover rules sit under `@media (hover: hover)`, so a tap on a touch
  screen never leaves anything orange; `:focus-visible` gets the same colour. The two hover moments that are not
  links, the landing phrase (§5) and the footer name's blob (§4), are slow and large, so they do not read as links.
- **Browser surfaces**: `::selection` turns the site inside out, `--sel-ink` on `--sel-bg` (the other theme's text
  orange on its page: burnt orange on paper in dark, brand orange on black in light), the caret is `--accent`, the scrollbar is
  thin in half-`--muted` on transparent, and every `time` uses tabular numbers.
- Hairlines between label rows (the landing facts, Lately), between writing list rows and years, and under the lifted
  header. No boxes or gradients; the lifted header is the only shadow. Surfaces change by a tone step (`--panel` under
  project stills, post covers and code).

## §4 Motion

One easing, `--ease` = `cubic-bezier(.2, .7, .2, 1)`. Every motion has a reduced-motion path, and idle means zero work:
CSS animations and transitions only, state from IntersectionObserver, no scroll listeners. rAF runs only in the splash
screen and for the planet's bands, and only while they are on screen, and for the footer name's blob while a mouse is
on it.

- **Content rise**: `.rise` elements carry `--d` (unitless ms): header 0 / 60 / 100 / 140 / 180; the name 120, the
  headline 190, the six fact rows 300 to 500. Only the splash animates them (800 ms, 20 px rise + opacity).
- **Doodle draw** (`Doodle.astro`): the landing drawing draws itself once, from the moment the content rises
  (`html.go`; on load when no splash plays), in the order of the composition: the telescope from the ground up
  (200 ms), the dotted route as a pen moving to the rocket (650 to 1500), the planet's outline (1150), its bands and
  rings fading in (1250, 900 ms), the orbit's dashes sweeping round (1000 to 1850), the moon (1250), the pendulum's
  bar, string and trail (1300), the pendulum starting to swing (1750), the stars popping in one at
  a time from lower left to upper right (1450 to 2150), and last the rocket: its outline (1600), the orange flame
  filling in from the nozzle and a small lift along its heading (1950, 750 ms). About 2.4 s in all. Strokes draw with
  `pathLength="1"` and `stroke-dashoffset`; each carries its delay `--d` and duration `--t` in ms. Fill mode
  `backwards`, so once done every element is back to its plain state. While the splash plays the animations are held
  (`animation-play-state: paused`) at their hidden start. Under reduced motion the finished drawing shows at once.
- **Doodle, alive**: two things keep moving after the draw, and both hold still while the doodle is off screen (the
  svg's `.idle`, set by its IntersectionObserver) and under reduced motion.
  The pendulum swings between its drawn extreme and its far ghost (rotate 0 to -55° about the pivot, 1.1 s each way,
  sine ease, `infinite alternate`). The planet (`scripts/planet.ts`, generated, not traced) turns with its rings, seen
  16° above the ring plane, its axis leaning 26°; the near side of both moves left to right (anticlockwise from the
  north). Rings: ringlets of random width (2.5 to 12.5 px in the ring plane) and spacing between 1.26 and 1.86 planet
  radii, with a wider Cassini-like gap near 1.6; each is a circle squashed by sin 16°, so it thins at the front and back
  as real rings do, and its dash clumps orbit by `stroke-dashoffset` with a period ∝ r^1.5 (about 45 s inside to 75 s
  outside). The body hides the far half; a second copy clipped to the near half passes over it. Bands: seven broken
  latitude lines projected on the sphere each frame (64 s day), so they slow and shorten towards the limb and end
  exactly at it; the loop runs only while the doodle is on screen and not covered by the splash, and its clock stops
  with it.
- **Header lift**: a CSS scroll-driven animation, `lift` on `animation-timeline: scroll(root)` over
  `animation-range: 0 120px`, takes `--lift` from 0 to 1, so the bar forms as the page leaves the top and dissolves
  as it comes back, with no script. The timeline and range sit in their own `:root .top` rule: the minifier folds
  same-rule longhands into the `animation` shorthand, where `animation-timeline` is reset-only, and the browser would
  drop it. Without scroll timelines (`@supports not`), a sentinel 60px down, watched by IntersectionObserver, sets
  `html.lifted` and `--lift` transitions over 300 ms. Under reduced motion the surface still forms but the bar keeps
  its resting height. The reading line on post pages runs on the same timeline (`progress`, scale 0 to 1).
- **Scroll spy**: on the home page the section crossing the middle of the screen (`rootMargin: -45% 0px -54% 0px`)
  lights its header link: the landing and Lately are About, Writing is Writing, Projects and the footer are Projects.
  On a post, the contents' active heading is the last one above 30% of the viewport (root margin
  `100000px 0px -70% 0px`, so a jump of any length still flips it). In-page links scroll smoothly
  (`html { scroll-behavior: smooth }`, instant under reduced motion).
- **Page transitions**: cross-document view transitions (`@view-transition { navigation: auto }`, only without
  reduced motion). The root cross-fades in 200 ms on `--ease`; the header (`view-transition-name: top`) holds still; a
  post card's cover (`cover-<id>`) morphs into the post's cover and a writing list title (`title-<id>`) into the
  post's h1.
- **Footer name**: the first time a quarter of the footer is on screen, "rajiv" draws itself like the doodle: each
  outline from its start, left to right, 130 ms apart, each taking 350 ms plus its length (up to 1.1 s), about 2 s in
  all. Without JS or under reduced motion it is drawn from the start.
  - **Reveal**: a mouse over the name (`hover: hover` and `pointer: fine`, never touch) carries a liquid blob, the
    clip path of a `--logo` copy of the same outlines under the pen, so the letters fill orange inside it and the
    outline stays as it is. The blob (radius 140 units, about 100px at 1440) swells in on a bouncy spring, its centre
    trails the cursor on a looser one, it stretches along its speed (up to 1.5x, thinner across) and its rim wobbles
    (three sines turning at different rates). On leaving it shrinks away and rAF stops. Under reduced motion it is a
    plain circle on the cursor, drawn on pointer moves only.
- **Hover**: links thicken their underline, cards lighten to `--hi`, post covers scale to 1.03 (800 ms, not under
  reduced motion), writing list titles go to `--hi` with the `--accent` dot beside them.

### Splash screen (`components/Splash.astro`, `scripts/splash/`)

On a fresh load or a reload of the home page the mark assembles in the middle of the screen in the theme's ink, moves
into the header logo (800 ms, centre linear in eased time, scale geometric), turns orange (350 ms) and the real SVG
takes over in the same frame; the content rises from 200 ms into the move. It does not play when the home page is
reached from another page of the site (the header logo included) or by back and forward. `?splash=off` skips it (for
screenshots and checks).

- **Bits** (`bits.ts`, lands 4.05 s), the one splash: a faint field of 0s and 1s gathers into the mark hexagon by
  hexagon; read row by row the landed digits are the ASCII bits of "rajiv.me". A diagonal sweep turns them into a pixel
  mosaic that resolves into the vector mark. (Machine, the plates that unfolded into the mark, was dropped on 30 Oct.)

Mechanics: a page opts in with `<BaseLayout splash>` (only the home page does), which renders the pre-paint gate and the
splash canvas. The gate plays it only when the navigation type is `reload`, or `navigate` with no same-origin referrer;
it adds `html.splash` (never under reduced motion), which hides `.mark` and `.rise` until the splash lands, and
everything after the landing too (a screen taller than the hero shows it); that rises with the last fact row (500).
The splash's frame is a pure function of t (`kit.ts` holds the geometry; prototypes and frame-by-frame scrubbing live
in the local `docs/v4-research/i-loaders/` playboard). It always plays to the end: clicks and keys don't cut it short,
and the page holds at the top (`overflow: hidden`, gutter kept) until the content rises. A theme change mid-splash
redraws in the new ink. If the splash script hasn't started 2.5 s after the gate, the page shows anyway. rAF stops at
the landing.

## §5 Home page (`pages/index.astro`)

Quiet: about him in one paragraph, what he works on now, what he wrote, the things he made. One drawing, one
moving moment (the doodle drawing itself), the header for getting around. The AI depth is shown, never titled: no
"AI engineer" anywhere. Copy is written the way the best engineers' own sites are (Lee Robinson, Mitchell Hashimoto,
Hamel Husain): who and where, what now, one line of values, one human line. No labels, no adjectives about himself.
Sections, in order:

1. **Landing** (`#about`): `min-height: clamp(640px, 100vh, 960px)`, the text vertically centred. Left column
   `min(760px, 52vw)`: the name (`--t-m`, `--accent`), then the h1 "Software you don’t / have to think about."
   (`--t-xl`, two authored lines). Under it two short paragraphs (`--t-sm`, `--ink`, max 31em, 16px apart): "I’m a
   software engineer. I’ve been building web and native apps since 2019, along with the backends behind them and the
   infrastructure they run on." / "These days most of my time goes to putting language models to work inside real
   products. The goal hasn’t changed: software that’s fast to load, clear to use and boring to run." The values phrase
   (`.hl`) looks like the rest until the pointer is anywhere on the two paragraphs; then `--accent` flows through it
   left to right, line after line, and ebbs back on leave. It is text clipped to a `--accent` to `--ink` gradient
   (soft 40% to 60% edge, 250% wide, one strip across the line break) whose position slides 100% to 0 over 1100ms
   `--ease`. Reduced motion: the colour switches at once. Touch shows plain text. Then one muted line, its links in
   `--ink`: "Off screen: astronomy, rockets, physics and sport. Say hello by email, or find me on GitHub, LinkedIn and
   X." The right
   48% (to the screen edge) holds the doodle, centred with 96 / 56 / 40 px of air: a sketchbook line drawing of a
   telescope whose dotted route loops a ringed planet and runs up to a rocket, with a moon, a pendulum, stars and two
   hexagons. It is an inline SVG traced from Codex line art (`src/assets/doodle.svg`; tracer in the local
   `docs/v4-research/art/vector/`; the planet is generated, see §4): strokes on `currentColor` (`--ink`), the flame and
   one hexagon in `--logo`, so it follows the theme. At 720px and under: the doodle in a 208px band under the header
   (strokes 1.8x thicker), the text below, the headline balanced over three lines (no forced break).
2. **Now** (`#now`, counted as About by the scroll spy): a grid on `--cols`. The h2 "Now" in the first column; from
   the axis, on its baseline, the thesis (`--t-l`, 500, max 18em, balanced): "The model is rarely the hard part.
   Everything around it is." Under it its four parts in two columns (one on a phone), each a 500 title and a muted
   sentence on a `--line` hairline. The titles echo the posts: Tools, not paragraphs (MCP servers); A budget for every
   call (features in production, time and cost limits, a fallback); Evals before vibes; Agents on the team. Last, a
   muted line led by "Coming soon" in `--accent`: Orca, a macOS menu bar timer that you and an agent drive together
   over MCP (no link until it ships). Under 1000px everything stacks under the h2.
3. **Writing** (`#writing`) and 4. **Projects** (`#projects`) share one grid on `--cols`: the h2 and its note (muted,
   max 22em, under it) in the first column, sticky at `--head-h` + 40px, the rows from the axis. Under 1000px the head
   is static and the rows follow it.
   - Writing: the note "Notes on putting models to work and building for the web.", the four newest posts as
     `PostCard` rows, then a row of its own between hairlines: "Read all 12 posts" (`--t-sm`, 500, the live count)
     with a `--accent` arrow at the far end that slides 6px on hover (reduced motion: it stays); the label turns
     `--accent` too.
   - Every clickable item (post rows, project rows, the /writing list) turns its title `--accent` while the pointer
     is anywhere on the item, cover and still included, or the item has keyboard focus (§3 Hover). Nothing else in
     the row changes colour.
   - Projects: the note "Tools I built for my own problems, then released." One row per project on a `--line`
     hairline (28px padding, about 340px tall at 1440, so two fit on a screen), each a link to the real thing, split
     2fr / 3fr with a 32px gap: the text ("Kind, year" in `--muted`, the name in `--t-sm`, a muted two-sentence
     summary, then where the link goes, underlined: View on npm, Chrome Web Store, Open the app, Read the source) and
     a 16:10 `--panel` still drawn in HTML (the CSS-only tooltip with its attribute, the Diver outline on a mini copy
     of this page, the playlist total, the mark; scaled 1.35 when wider than 420px). On a phone the still sits above
     the text.

Sections sit 136px apart (104px on a phone). The footer is the layout's (§3).

**Post row** (`components/PostCard.astro`, on the home page and in "More writing", which uses the same split from
1000px): on a `--line` hairline with 24px padding, the text on the left ("Oct 2026 · 4 min read" in `--muted`, the
title in `--t-sm`, the muted summary, max 38em) and, 32px away, a 16:10 `--panel` cover `clamp(152px, 14vw, 208px)`
wide: the post's line doodle, traced to SVG in `src/assets/covers/<slug>.svg`, ink on `currentColor`, orange in
`--logo`, scaled 1.25 so the drawing (at most 70% of its frame) keeps only a thin margin; a post with no cover yet
shows its line of code there, in mono at `--t-code`. On a phone the cover sits above the text.

## §6 Writing list (`pages/writing/index.astro`)

A grid on `--cols` from 1000px up. The first column is a sticky head (top `--head-h` + 40px): the h1 "Writing"
(`--t-xl`), the dek "Notes on putting models to work, building for the web, and the problems I would rather solve
once." (`--t-sm`, `--muted`) and a count ("12 posts since 2021"). From the axis, the posts by year, newest first: the
year (`--t-xs`, `--muted`) on a hairline, then one link per post with hairlines between: title (`--t-sm`, 500),
description (`--muted`, max 40em) and a meta line of date, "N min read" and the post's code in mono. No thumbnails: the
list is for scanning. Rows are a `minmax(0, 1fr)` grid, so the mono line ellipsises instead of widening the page.
Under 1000px one column with the head on top.

## §7 Post (`pages/writing/[slug].astro`, `styles/prose.css`)

Posts are plain Markdown in `src/content/writing/<slug>.md` (`content.config.ts`: title, description, date, updated,
code, canonical, draft; helpers in `lib/writing.ts`). From 1000px a grid on `--cols`:

- **Aside**, sticky under the header: "Writing" with a Phosphor arrow back to the list, the date, "Updated" when there
  is one, "N min read", then "On this page" and the `##` headings (when there are two or more; `--muted`, the active
  one `--ink` with the `--accent` dot), then two controls with 16px Phosphor icons: "Copy as Markdown" (fetches the
  post's `.md` into the clipboard; the icon becomes an `--accent` tick and the label "Copied" for 2 s, announced by an
  `aria-live` region) and "View as Markdown".
- **Article**, from the axis: the title (§1), the description as a dek (`--t-sm`, `--muted`), the cover (16:10
  `--panel`, posts without one have none), then the prose: max 68ch, 17px/1.7, h2 at `--t-sm`, inline code on
  `--panel`, code blocks on `--panel` with no radius, blockquotes with a 1px `--line` rule, tables and rules in
  hairlines. A post first published elsewhere ends with "First published on <host>."
- **More writing**, full width under a hairline: the h2 with "All writing" on the right and the three newest other
  posts as `PostCard`s (three columns, two from 721px, one on a phone).

Under 1000px one column: back link, title, dek, a meta line, cover, prose, then the contents and the Markdown
controls. The header's reading line (§3) runs on every post.

## §8 For agents

Every post is also served as Markdown at `/writing/<slug>.md` (`[slug].md.ts`: title, description, body), and
`/llms.txt` (llmstxt.org format) lists the posts' Markdown, the projects and where to find him. The footer links
`llms.txt` and the head carries `<link rel="alternate" type="text/plain" href="/llms.txt">`.
