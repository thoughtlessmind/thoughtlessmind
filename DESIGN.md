# rajiv.me, design v4

A quiet, typographic site in two themes, with the hexagon mark as the one piece of colour that never changes. Three
kinds of page: the home page, the blogs list and a post. Product truth (who it is for, what it may claim) is in
`PRODUCT.md`.

## §1 Type

- **Geist** (`--sans`) does every visible word. Weights 400 and 500. Sentence case, no emoji, no em or en dashes.
- **Geist Mono** (`--mono`) only for code: the posts' code tokens (cards, the blogs list), code in posts, the
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
  14px/1.6. The project stills are small illustrations with their own sizes inside, not text steps. The header's
  written name is the one place for `--hand` (Caveat, 600, 27px; 25px on a phone).

## §2 Colour

Tokens on `:root` in `src/styles/global.css`, exposed to Tailwind with `@theme inline` (`bg-bg`, `text-ink`,
`border-line`…; the default palette is cleared).

| Token      | Dark                    | Light                 | Use                       |
| ---------- | ----------------------- | --------------------- | ------------------------- |
| `--bg`     | `#03060c`               | `#e4e7eb`             | page (lacquer black / pearl grey) |
| `--panel`  | `#0d121c`               | `#dde1e6`             | raised surfaces           |
| `--line`   | `rgba(237,237,234,.1)`  | `rgba(20,23,28,.12)`  | hairlines                 |
| `--ink`    | `#ededea`               | `#14171c`             | text                      |
| `--muted`  | `#8f8f8a`               | `#555b66`             | secondary text            |
| `--hi`     | `#ffffff`               | `#000000`             | emphasis                  |
| `--logo`   | `#ff5f1f`               | `#ff5f1f`             | the mark and the rocket's flame (decorative) |
| `--spot`   | `--logo`                | `--logo`              | the drawings' filled bits: the doodles' hexagon and spark, cover accents (decorative) |
| `--accent` | `#ff5f1f`               | `#b23c0a`             | text orange, focus ring, the nav underline, active dots, reading line, the timeline's current node |
| `--frame`  | `--ink` at 16%          | `--ink` at 16%        | the 1px border round post covers and project stills (no fill) |
| `--tile`   | `#f3f2ee`               | `#ffffff`             | Experience's logo tiles, light in both themes so a black mark reads on dark |
| `--tile-edge` | `transparent`        | `--line`              | the tile's 1px border, so a white tile still reads on the light page |
| `--raised` | `--panel`               | `#f6f7f9`             | the Say hi popover, a raised layer (text orange 6.1:1 / 5.5:1 on it) |
| `--shadow` | `rgba(0,0,0,.55)`       | `rgba(24,32,48,.16)`  | the lifted header's drop shadow, nothing else |
| `--sel-bg` | `#e4e7eb`               | `#03060c`             | selected text's ground: the other theme's page |
| `--gloss`  | cool sheen and blooms   | white sheen and blooms | a layer over the whole page that scrolls with it (`body::after`): a sheen over the top, soft blooms left then right every 180svh, each easing out over several stops |
| `--gloss-blend` | `normal`           | `overlay`             | how the gloss meets the page: on light, overlay lifts the pale ground towards white but barely touches dark text |
| `--sig`    | `#ff5f1f` to `#ffb877`  | `#9a3412` to `#c2410c` | the header's written name: a gradient along the writing (large text, 3:1 or better on light) |
| `--gloss-edge` | the sheen's top row | the sheen's top row | the overscroll gap's ground: `--gloss` along the page's top edge, held as a vertical band (top half of the screen) |
| `--sel-ink`| `#b23c0a`               | `#ff5f1f`             | selected text: the other theme's text orange (4.8:1 / 6.7:1) |

Dark is the default. Light applies under `prefers-color-scheme: light` unless `data-theme="dark"`, and always under
`data-theme="light"`. Under `prefers-contrast: more`, `--line` and `--frame` both go to `--ink` at 40%. Both pass WCAG AA for text; `--logo` and `--spot` are only ever the mark, drawings and the
footer's star field, never running text.

Code in posts uses Shiki's `github-dark-default` and `github-light-default` on `--panel`, both themes emitted as
`--shiki-dark` / `--shiki-light` and picked by the token rules in `prose.css`. The light theme is drawn for white, so a
transformer in `astro.config.mjs` swaps its comment, keyword and function colours for Primer's next darker step: the
worst token is 4.9:1 on the light panel and 6.0:1 on the dark one.

## §3 Chrome

- **The frame**: margins `--gut` / `--gut-r` = `clamp(20px, 3.4vw, 48px)` (or the safe area) via `.wrap`. One axis at
  42% of the width, `--cols` = `42fr 58fr`, shared by every page: the header's nav, the
  blogs list and a post's article all start on it. `--media` (240px) is the home page's right-hand column (§5).
  `--head-h` (76px) is the header's height at rest; pages clear
  it, and `scroll-padding-top` keeps anchors below it.
- **Header** (`Header.astro`, `.top`): pinned to the top on every page (a zero-height sticky dock, so a rubber-band overscroll pulls it along with the page), a grid on `--cols`. The logo in the first
  column: the hexagon mark (`.mark`, `data-logo`, 28px) in a link labelled "rajiv.me, home", and 12px after it his name
  in `--hand` (`.sig`, `--ink`). On the home page the name is hidden while the hero's name is on screen and writes
  itself in once that name has scrolled up under the header (§4), so it is never on screen twice; other pages show it
  from the start. On a phone there is no room for both, so the name floats over the nav's place and the nav fades
  out while it shows; other pages on a phone keep the nav and show no name. From the axis, `.bar`:
  nav (About `/#about`, Blogs `/#blogs`, Projects `/#projects`, in the home page's section order; sans 15px, gap
  28px; every link scrolls to its home section, from any page, and the blogs index is reached from the section's
  "All blogs"), then on the right `.reach` (the X icon, 17px, and "Say hi", a pill with a 1px `--frame` border) and the
  theme switch. "Say hi" opens a native popover (`#say-hi`, light dismiss and Esc built in) anchored 10px under it
  (84px down without anchor positioning): a muted line, then Email (mailto, with a Copy button that reads "Copied", announced politely, for
  1.6s), LinkedIn and X, split by `--line` hairlines, on `--raised` (a layer lighter than the page, so it reads apart from it and from the lifted bar) with a 1px `--line` border, 14px radius and the
  header's shadows. It fades and drops 6px in over 180 ms; under reduced motion it just appears. At 640px and under
  the X icon goes (X is in the popover). The current link has a small `--accent` underline (`.nav-line`: 16 x 2px,
  radius 1px, 5px under the nav, centred under the label), so no label moves: `aria-current="page"` on the blogs
  pages (`current="blogs"`), and on the home page the scroll spy's `aria-current="true"`. The header script measures
  the current link (labels differ in width) and sets its `translateX`; it slides between links (320 ms `--ease`, no
  slide on the first placement, none under reduced motion) and is placed again when `aria-current` changes, the nav
  resizes or the fonts load. No scroll listener, no loop. With no current link (the 404) it is hidden. At 720px and under it is a flex row (gap 16px, nav gap 20px); all three
  labels fit at 375. Hover and keyboard focus: `--accent` (see Hover below); the logo does not change.
  - **Blended, then lifted**: at scroll 0 it is no surface at all. One registered property, `--lift` (0 to 1), drives
    the bar: background `--bg` mixed in at up to 80%, `backdrop-filter: blur(16px) saturate(160%)`, a `--line`
    hairline, two offset shadows in `--shadow` (`0 4px 10px -6px`, `0 14px 32px -16px`), and padding compacting from
    the resting 76px to 56px. See §4 for what moves it. Under `prefers-reduced-transparency` the bar is solid `--bg`
    with no blur.
  - **Reading line** (`progress`, post pages): a 2px `--accent` line along the header's bottom edge, filling from the
    left with the page's scroll.
- **Theme switch** (`ThemeToggle.astro`): an icon button (20px, 32px hit area, drawn in Phosphor's regular weight)
  showing the theme it switches to: a sun on dark, a moon on light, one drawing that morphs between them (§4). CSS
  sets its state, `--m` 0 or 1, with the same rules as the tokens, so it is right before any script runs; the name says the action ("Switch to light theme"). It follows the system until clicked,
  then stores `localStorage['theme']` and fires `theme:change` on window. One script drives every switch on a page.
  A click pours the new theme out of the switch (§4). It holds the right margin's auto space. (The palette trial,
  orange, jade and blue from a dot beside it, ended on 12 Nov: orange stays, and the pre-paint script clears the old
  `localStorage['palette']`.)
- **Skip link** (`BaseLayout.astro`, `.skip`): the first focusable thing on every page, "Skip to content". Off screen
  until the keyboard reaches it, then an `--ink` chip over the header's left corner; it jumps to `main#main`.
- **Footer** (`Footer.astro`, every page): one row of "Write to me at <email>", the socials (GitHub, LinkedIn, X,
  dev.to, Stack Overflow), `RSS` and `llms.txt`, then "© 2026 Rajiv Kumar" (a column on a phone). Under it, 64px down (40px on
  a phone), the star field as wide as the content and `clamp(200px, 21vw, 300px)` tall: a canvas
  (`scripts/field.ts`) of dots on an 18px grid (14px under 600px wide), `--muted` at 50%, about one in seventeen a
  brighter star in `--ink`. The cursor stirs it (§4).
- **Text links** (`.ul`, and links in posts): 1px underline at 0.22em offset; on hover or keyboard focus the text and
  its underline turn `--accent` and the underline goes to 2px. Focus ring: 2px `--accent`, offset 2px.
- **Hit areas**: small links and controls take a finger without growing. The logo and the theme switch pad out to
  44px against a negative margin; the nav links and anything with `.hit` (footer links, a post's
  back link and Markdown controls on a phone, "All blogs", the 404's links) carry a pseudo-element about 44px tall
  over the label. Rows of them sit far enough apart that the areas meet and never overlap.
- **Hover**: one answer everywhere. Whatever you point at or tab to turns `--accent` over 200ms `--ease`, the colour
  of the focus ring and the "you are here" underline and dots: nav links, the theme switch, text links, the post page's Back,
  contents, Copy and Markdown links, and the title of every clickable item (post rows, project rows, the /blogs
  list, "Read all 12 posts"). Nothing fades. Hover rules sit under `@media (hover: hover)`, so a tap on a touch
  screen never leaves anything orange; `:focus-visible` gets the same colour. Press (`:active`, so it works on touch
  too and never sticks): a post or project row's title takes `--accent` and its cover or still gives to 0.97 over
  160 ms (the colour only under reduced motion); "Read all" turns `--accent`. Every other link and control (nav, text
  links, the post page's Back, contents, Copy and Markdown, the popover's rows) turns `--accent` on press, and the
  Say hi pill and Copy chip give to 0.96 and the theme switch to 0.9 over 100 ms (colour only under reduced motion).
  The hover moments that are not links,
  the landing phrase (§5) and the footer's star field (§4), are slow and large, so they do
  not read as links.
- **Browser surfaces**: `::selection` turns the site inside out, `--sel-ink` on `--sel-bg` (the other theme's text
  orange on its page: burnt orange on paper in dark, brand orange on black in light), the caret is `--accent`, the scrollbar is
  thin in half-`--muted` on transparent, and every `time` uses tabular numbers.
- Hairlines between label rows (the landing facts, Lately), between blogs list rows and years, and under the lifted
  header. No boxes or gradients; the lifted header is the only shadow. Code sits on `--panel`; project stills and post
  covers have no fill, only a 1px `--frame` border (the text colour at 16%).

## §4 Motion

One easing, `--ease` = `cubic-bezier(.2, .7, .2, 1)`. Every motion has a reduced-motion path, and idle means zero work:
CSS animations and transitions only, state from IntersectionObserver, no scroll listeners. rAF runs only in the splash
screen and for the planet's bands, and only while they are on screen, and for the footer's star field while it
lights up or a cursor is stirring it, stopping once every dot is back in place.

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
  lights its header link: the landing and Now are About, Blogs and Experience (which follows it) are Blogs, Projects and the
  footer are Projects, so the header never jumps back to About mid-page.
  On a post, the contents' active heading is the last one above 30% of the viewport (root margin
  `100000px 0px -70% 0px`, so a jump of any length still flips it). In-page links scroll smoothly
  (`html { scroll-behavior: smooth }`, instant under reduced motion).
- **Page transitions**: cross-document view transitions (`@view-transition { navigation: auto }`, only without
  reduced motion). The root cross-fades in 200 ms on `--ease`; the header (`view-transition-name: top`) holds still; a
  post card's cover (`cover-<id>`) morphs into the post's cover and a blogs list title (`title-<id>`) into the
  post's h1.
- **Theme pour** (`ThemeToggle.astro`): a click on the switch spills the new theme out of it over the old one, a
  liquid blob centred on the switch, so from the top right it floods down and left. A same-document view transition
  snapshots the page (`html.pour` drops every other view-transition-name, so the header and covers go with it, and
  holds the old snapshot still with the new one opaque on top); the new snapshot's `clip-path` runs through 50
  `path()` keyframes worked out on the click (WAAPI, no rAF). The radius eases out to the farthest corner while the
  rim wobbles with three waves running round it, drawn with the closed curve in `scripts/blob.ts`. No two
  pours are alike: every click rolls each knob inside a range that still reads as liquid: 850 to 1250 ms, ease-out
  power 1.7 to 2.6, and per wave its lobes (3 to 5, 6 to 9, 10 to 14), depth (4 to 8%, 2.5 to 5%, 1 to 3% of the
  radius, so the rim never dips more than 16%), speed (3 to 6, 4 to 7, 2 to 5 rad/s, either way round) and phase.
  A click mid-pour starts a new one from the current state. Under reduced motion the themes cross-fade (the view
  transition's default, about 250 ms), so there is no full-screen brightness jump; without view transitions the
  theme flips at once.
- **Switch morph** (`global.css`, `.theme`): as the theme flips the icon morphs over 600 ms `--ease`. Sun to moon:
  the rays spin a quarter turn into the middle and vanish (opacity 200 ms), the orb grows by half (its outline
  thinned to keep the weight) and a shade circle slides in along the diagonal from the top right; an svg mask cuts
  the orb's outline under the shade and the shade's own outline, clipped to the orb, closes the crescent. Moon to
  sun runs it back, the rays fading in only after 250 ms, once they are outside the orb. Every part is a CSS
  transition on `--m`, so a system theme change morphs too. Under reduced motion it swaps at once.
- **Header name**: the name beside the logo (§3) is shown when the hero's name has left the area under the header
  (an IntersectionObserver with the header's height as its top margin). It writes itself in: a `clip-path` inset
  opens left to right over 750 ms, linear, a steady pen speed, so the hand font reads as written. Scrolled back, it
  fades out in 150 ms and the clip resets behind the fade, so the exit is quick and the next entry writes again.
  Both are transitions, so a quick scroll back and forth retargets instead of restarting. Under reduced motion it
  is a 200 ms fade.
- **Star field** (footer): the first time a fifth of it is on screen the dots light up outward from the centre, each
  fading in over 420 ms, about 2.5 s in all. A mouse over it is a gravity well: the well springs after the cursor,
  pulls the dots within 170px (110px on a narrow screen) towards it with a swirl, drags them along its path like a
  liquid, and lights the ones near its core `--accent`, a little larger. Each dot is a spring back to its own place,
  so the grid wobbles and settles once the cursor leaves; then rAF stops. On touch a tap drops a well for 450 ms.
  Under reduced motion the dots never move: the field is drawn at once and the well is a still glow under the
  cursor. The colours are read from CSS and redrawn when the theme changes.
- **Hover**: links thicken their underline, titles turn `--accent` (§3), post covers scale to 1.03 (800 ms, hover
  devices only, not under reduced motion). On the project stills the css-only tooltip's tip rises 4px (200 ms) and
  Diver's outlines go from the accent at 45% to full (200 ms, a colour, so it stays under reduced motion and on
  keyboard focus). Press is in §3.
- **Row reveal** (home page, and a post's More blogs): every post row, "Read all", project row and Experience entry
  fades in as it scrolls in, on its own CSS view timeline (`animation-range: entry 10% entry 60%`, linear, fill both): rows rise 12px,
  Experience entries only fade so the nodes stay on the rail. No script; a nav jump lands with rows already shown.
  Only under `screen`, `prefers-reduced-motion: no-preference` and `@supports (animation-timeline: view())`; anywhere
  else the rows are simply there. The timeline sits in its own `:root` rule (see Header lift).

### Overscroll (`components/Overscroll.astro`)

A fixed canvas under the body's background, on the page's own ground: `--bg` under `--gloss-edge`, the gloss's top row as a band that does not change
downwards, so whatever height the pull opens, the gap meets the page top in the same colour and reads as one surface, seen only in the gap a rubber-band overscroll opens past the top or the
bottom: a fine dot grid, 15px pitch, from 6px off the edge, thinning out over 160px. The pull lights it softly from
the point on that edge straight above (or below) the pointer, brighter the harder the pull, decaying over about half a second. Every pull sends a ripple
out from there (each keeps the pointer's x from when it started) at 620px/s, like a drop on still water, gone in 1.5 s, and earlier ripples keep spreading under
new ones, like stones dropped in a pond (up to 10, at least 140 ms apart). A pull is a new wheel gesture after a
120 ms pause, or deltas that rise again while the last push was easing off, which is how a second pull mid-bounce
arrives on macOS. Each ripple also moves the dots it passes along the line from its centre, up to 5px: out on its
leading edge, back behind it, so the grid swells and settles like water (ripples add up). Dots on its
crest swell a little and warm to `--logo`. Dots in `--ink`. The grid fades with the light, and the loop stops when
both are gone. Reduced motion: the light only, no ripple. Trackpad wheel only.

### Splash screen (`components/Splash.astro`, `scripts/splash/`)

On a fresh arrival at the home page, once per tab session, the mark assembles in the middle of the screen in the theme's ink, moves
into the header logo (800 ms, centre linear in eased time, scale geometric), turns orange (350 ms) and the real SVG
takes over in the same frame; the content rises from 200 ms into the move. It does not play on a reload, a second arrival in the same tab session
(`sessionStorage['splash']`), from another page of the site (the header logo included) or by back and forward.
`?splash=off` skips it (for screenshots and checks), `?splash=on` forces it.

- **Bits** (`bits.ts`, lands 4.05 s), the one splash: a faint field of 0s and 1s gathers into the mark hexagon by
  hexagon; read row by row the landed digits are the ASCII bits of "rajiv.me". A diagonal sweep turns them into a pixel
  mosaic that resolves into the vector mark. (Machine, the plates that unfolded into the mark, was dropped on 30 Oct.)

Mechanics: a page opts in with `<BaseLayout splash>` (only the home page does), which renders the pre-paint gate and the
splash canvas. The gate plays it only when the navigation type is `navigate` with no same-origin referrer and the tab session has not
seen it;
it adds `html.splash` (never under reduced motion), which hides `.mark` and `.rise` until the splash lands, and
everything after the landing too (a screen taller than the hero shows it); that rises with the last fact row (500).
The splash's frame is a pure function of t (`kit.ts` holds the geometry; prototypes and frame-by-frame scrubbing live
in the local `docs/v4-research/i-loaders/` playboard). A pointer down, key, touch or wheel while the bits gather moves its clock to the start of the move
to the header, so the hand-off still plays and the wait is at most 1.35 s more; the page holds at the top (`overflow: hidden`, gutter kept) until the content rises. A theme change mid-splash
redraws in the new ink. If the splash script hasn't started 2.5 s after the gate, the page shows anyway. rAF stops at
the landing.

## §5 Home page (`pages/index.astro`)

Quiet: about him in one paragraph, what he works on now, what he wrote, where he has worked, the things he made. One
drawing that draws itself (not on a phone), the header for getting around. The AI depth is shown, never titled: no
"AI engineer" anywhere. Copy is written the way the best engineers' own sites are (Lee Robinson, Mitchell Hashimoto,
Hamel Husain): who and where, what now, one line of values, one human line. No labels, no adjectives about himself.
Sections, in order:

1. **Landing** (`#about`): `min-height: clamp(640px, 100vh, 960px)`, the text vertically centred. Left column
   `min(760px, 52vw)`: the name (`--t-sm`, `--accent`), then 20px under it the h1 "Software you don’t / have to think
   about." (`clamp(38px, 4.6vw, 66px)`, weight 400, leading 1, `--hi`, two authored lines): big and quiet, a step
   lighter than the rest of the display type. Under it one short paragraph (`clamp(17px, 1.3vw, 19px)`, leading 1.55,
   `--muted`, max 28em, 36px down): "A software engineer in New Delhi, building web and native apps, their backends and
   the infrastructure under them since 2019. Lately, language models inside real products. The aim stays the same:
   fast to load, clear to use, boring to run." The values phrase (`.hl`) reads in `--ink` until the pointer is on the
   paragraph; then `--accent` flows through it left to right, line after line, and ebbs back on leave. It is text
   clipped to a `--accent` to `--ink` gradient (soft 40% to 60% edge, 250% wide, one strip across the line break)
   whose position slides 100% to 0 over 1100ms `--ease`. Reduced motion: the colour switches at once. Touch shows
   plain text. Then 28px under it, at `--t-xs`, the address alone as an underlined link (the header's Say hi and the
   footer carry the rest). The right
   48% (to the screen edge) holds the doodle, centred with 96 / 56 / 40 px of air: a sketchbook line drawing of a
   telescope whose dotted route loops a ringed planet and runs up to a rocket, with a moon, a pendulum, stars and two
   hexagons. It is an inline SVG traced from Codex line art (`src/assets/doodle.svg`; tracer in the local
   `docs/v4-research/art/vector/`; the planet is generated, see §4): strokes on `currentColor` (`--ink`), the flame in
   `--logo` and one hexagon in `--spot`, so it follows the theme. At 720px and under the home page has no doodle (the
   404 keeps its 208px band): the landing starts `--head-h` + 32px down, so the page opens on the name and headline,
   balanced over three lines (no forced break). The hidden doodle does no work: its observer never sees it, so the
   planet's loop never starts and its CSS loops don't run.
2. **How I work** (`#now`, counted as About by the scroll spy): the h2 "How I work" (it read as a status, not as
   what he does) with its note under it ("Where most of my week goes."), then, in the content block (below), the thesis (`--t-m`, 500,
   max 22em, balanced): "The model is rarely the hard part. Everything around it is." Under it its four parts in two
   columns (one on a phone), each a 500 title and a muted sentence on a `--line` hairline. Each sentence is in the
   first person and in words a founder or recruiter can follow, the outcome last; the posts on these
   topics, once written, carry the technical terms (no MCP, evals, hooks or diffs here). Tools, not paragraphs (a few narrow tools over a product's
   real data and actions); A budget for every call (a time limit, a cost limit and a fallback on every feature);
   Tested before trusted (every prompt or model change runs against past failures); Agents on the team (coding agents
   under written rules). Last, a muted line led by "Coming soon" in `--accent`: Orca, a timer for the macOS menu bar
   that you and an AI agent can both run (no link until it ships). On a phone it starts 64px under the landing, not 88px. The Coming soon line sits 32px under the parts (28px on a
   phone), at most 36em.
3. **Blogs** (`#blogs`), 4. **Experience** (`#experience`) and 5. **Projects** (`#projects`), like How I work, read
   top to bottom, no columns: the h2 and its note (muted, max 36em, under it) at the left margin, then the section's
   content 40px under them (24px on a phone), indented `clamp(0px, 7.8vw, 112px)` (112px at 1440, none on a phone)
   and at most 1040px wide. **One alignment system**: that indent is the only text edge below the landing. Every
   title, paragraph, logo tile and list line in every section starts on it (x = 160 at 1440); nothing indents
   further, and the only things left of it are the Experience rail and the work list's markers, hanging in the
   gutter. Rows with a picture or dates put it in one right-hand column, `--media` (240px) wide and 48px from the
   text, so covers, stills and job dates all start on the same line (x = 960). Body text stops at 36em (about 68
   characters) everywhere. Nothing is sticky. (Until 13 Nov the head sat in a sticky
   first column on `--cols` with the content from the axis; it read as two pages side by side.)
   - Blogs: the note "Notes on building for the web, and the problems I would rather solve once." (the same
     line as the /blogs dek; "putting models to work" comes back into both when those posts are published), then
     a hint for the other half of his writing, 12px down in `--muted` 15px: "Here for philosophy or psychology?
     Those essays are in the full list too." with the full list linked, the
     four newest posts that have a cover drawing as `PostCard` rows (so the list is a mix and every row carries a
     doodle; a new post joins it once its cover is drawn), their covers in the `--media` column at 2:1 (240 x 120,
     so a row is about as tall as its text; from 721px up, the /blogs list keeps its own smaller cover), then a row of its own between hairlines: "Read all 6
     posts" (`--t-sm`, 500, the live count; a phone shows three posts, then this row)
     with a `--accent` arrow at the far end that slides 6px on hover (reduced motion: it stays); the label turns
     `--accent` too.
   - Experience (counted as Blogs by the scroll spy): the note "The teams I’ve built with, newest first." A
     timeline (`ol.tl`) that keeps the text edge: each entry is a grid of the job on the edge and its dates in the
     `--media` column (`--t-xs`, top-aligned; the start month in `--ink` on its own line, then "to now" or "to Jul
     2021" in `--muted`, each month a `<time>`). The job: a 44px `--tile` (radius 11px, `--tile-edge` border) holding
     the logo (`src/assets/logos/`, imported and hashed, a plain `<img>`), beside it the role as the h3 (`--t-sm`,
     500) and the company muted under it, then one line on the product and his part in it in `--ink` (16px down),
     then a short list of what he built there and the problem it solved (`ul.wk`, 12px down: muted, lines 6px apart,
     disc markers in `--accent` hanging outside the edge). Both at most 36em. The rail hangs in the gutter 35px left
     of the edge: one 2px line down the whole list from the first node, `--accent` at the top into `--line` by 160px
     and fading out over the last 64px. Each entry has a 12px node on it, level with the logo tile: the current job
     filled `--accent` with a 5px ring of the accent at 18%, a past job a 2px `--muted` ring on `--bg`. Entries sit
     48px apart. The `work` lines are lorem ipsum placeholders until he writes them; they must be replaced before
     this ships. The one place an employer is named: Senior Frontend Engineer at swipejobs (Aug 2021 to now),
     Frontend Engineer at Influence (Jan 2020 to Jul 2021). Real titles and dates only, no stats. At 720px and under
     there is no gutter, so no rail or nodes: the dates sit on one line above each job, which takes the full width
     (the work list's markers move inside, 18px).
   - Every clickable item (post rows, project rows, the /blogs list) turns its title `--accent` while the pointer
     is anywhere on the item, cover and still included, or the item has keyboard focus (§3 Hover). Nothing else in
     the row changes colour.
   - Projects: the note "Tools I built for my own problems, then released." The tools newest first (Diver,
     css-only-tooltip, YouTube Playlist Info), then this site as the colophon. One row per project on a `--line`
     hairline (24px padding, about 200px tall at 1440), each a link to the real thing, split
     text first (the rest of the row) and the still second in the `--media` column, 48px away: the text (one title
     line of the name in `--t-sm`, its status, then "Kind, 2023 to 2025" in `--muted` `--t-xs` (the years it was
     worked on, first release to last update, from the Chrome Web Store, npm and GitHub; "since 2026" while
     active), wrapping as a group; a muted two-sentence summary (max 36em), then where the link goes, underlined: View on npm, Get it for Chrome, Open the app, Read
     the source) and a 16:10 still with a `--frame` border and no fill drawn in HTML (the CSS-only tooltip with its attribute, the Diver outline on a mini copy
     of this page, the playlist total, the mark; at 240px they show at their own size, scaled 1.35 only when wider
     than 420px). On a phone the still sits above
     the text at 2:1, so a row stays short. The status is `--t-xs` after a 7px dot: "Active" in `--ink` with a filled
     `--accent` dot and a soft halo (the Experience rail's current node, small), "Finished" in `--muted` with a ring. Each link opens a new tab and says so: its accessible name is "name: where
     it goes (opens in a new tab)", described by the summary.

Sections sit 120px apart (88px on a phone). The footer is the layout's (§3).

**Post row** (`components/PostCard.astro`, on the home page, /blogs and "More blogs"; the home page and More blogs
pass `wide`, which from 721px puts the cover in the `--media` column at 2:1, 48px from the text): on a `--line` hairline with 24px padding, the text on the left (the title in `--t-sm`, the muted summary,
max 36em, then "Oct 2026 · 4 min read" in `--muted` 14px under it) and, 32px away, a 16:10 cover with a `--frame`
border and no fill, `clamp(112px, 9vw, 136px)`
wide: the post's line doodle, traced to SVG in `src/assets/covers/<slug>.svg`, ink on `currentColor`, orange in
`--spot`, scaled 1.25 so the drawing (at most 70% of its frame) keeps only a thin margin; a post with no cover yet
shows its line of code there, in mono at `--t-code`. On a phone the cover is an 80px thumbnail beside the title only (16px gap; a code cover sets its line at 9px), and
the summary and date run the full width under them, so the summary keeps a readable line (about 38 characters at
375, not 27).

## §6 Blogs list (`pages/blogs/index.astro`)

A grid on `--cols` from 1000px up. The first column is a sticky head (top `--head-h` + 40px): the h1 "Blogs"
(`--t-xl`), the dek "Notes on building for the web, and the problems I would rather solve once." (`--t-sm`,
`--muted`) and a count ("6 posts since 2021"). From the axis, the posts by year, newest first: the
year (`--t-xs`, `--muted`) on a hairline, then each post as the home page's row (`PostCard`): title, summary, "Mon
YYYY · N min read" under it and the cover on the right (or its line of code when it has none), the cover morphing into
the post's own on navigation. The year's hairline stands in for its first row's.
Under 1000px one column with the head on top.

## §7 Post (`pages/blogs/[slug].astro`, `styles/prose.css`)

Posts are plain Markdown in `src/content/blogs/<slug>.md` (`content.config.ts`: title, description, date, updated,
code, canonical, draft; helpers in `lib/blogs.ts`). From 1200px three tracks, `minmax(220px, 1fr) minmax(0, 44em)
minmax(0, 1fr)`, gap 64px, so the article is centred (it gives up its centre near 1200px before the rail narrows):

- **Rail**, 220px at the start of the left track (under the logo), sticky under the header, its top level with the
  title: "Blogs" with a Phosphor arrow back to the list; the meta as a column (date, "N min read", "Updated" when there
  is one); then under a hairline "On this page" and the `##` headings (when there are two or more; `--muted`, the
  active one `--ink` with the `--accent` dot); then two controls with 16px Phosphor icons: "Copy as Markdown"
  (fetches the post's `.md` into the clipboard; the icon becomes an `--accent` tick and the label "Copied" for 2 s,
  announced by an `aria-live` region) and "View as Markdown".
- **Article**, 44em (20% wider than the old 37em): the title (§1), the description as a dek (`--t-sm`, `--muted`), the
  cover (16:10 `--panel`, posts without one have none), then the prose, 17px/1.7, text, code, tables and images all on
  the 44em measure (about 90 characters a line). h2 at `--t-sm`, inline code on
  `--panel`, code blocks on `--panel` with no radius, blockquotes with a 1px `--line` rule, tables and rules in
  hairlines. A post first published elsewhere ends with "First published on <host>." Every post then signs off
  (`.by`, muted, max 44em, links in `--ink`), for the reader who came from a search and has not seen the home page:
  "Written by Rajiv Kumar, a software engineer in New Delhi. If something here is wrong or unclear, write to me at
  hello@rajiv.me."
- **More blogs**, 120px under the article (88px on a phone), laid out exactly as the home page's Blogs (§5): the h2
  (`--t-l`) and the same note at the left margin, then 40px down (24px on a phone) the three newest other posts as
  wide `PostCard` rows on the home page's text edge (indented `clamp(0px, 7.8vw, 112px)`, at most 1040px wide, covers
  in the `--media` column at 2:1), then the "Read all N posts" row (`.all`, shared in `global.css`). Rows fade up as
  they scroll in, like the home page's row reveal (§4).

Under 1200px one column on the 44em measure: Back, then the date and reading time stacked, then title, dek, cover,
prose, then the contents and the Markdown controls. At 720px and under the contents are left out. The header's reading line (§3) runs on every post.

**Page not found** (`pages/404.astro`): the landing's frame (`.hero`, `.hero-text` and `.art` in `global.css`, shared
with the home page) and the landing doodle, which draws itself here too. "Page not found." (`--t-xl`), a muted line
(`--t-sm`, max 30em) that ends "The telescope has not found it either.", then two links: home and all blogs.

## §8 For agents, feeds and link previews

Every post is also served as Markdown at `/blogs/<slug>.md` (`[slug].md.ts`: title, description, body), and
`/llms.txt` (llmstxt.org format) lists the posts' Markdown, the projects and where to find him. The footer links
`llms.txt` and the head carries `<link rel="alternate" type="text/plain" href="/llms.txt">`.

- **Link preview**: one card for every page, `public/og.png` (1200x630): the mark, the name in orange, the headline,
  "rajiv.me" and the landing doodle on the dark page, with `twitter:card` `summary_large_image`. It is a screenshot
  of the landing at 1200x630 with the paragraphs and the nav hidden; retake it when the headline or the doodle
  changes. A link shared anywhere carries the drawing, which is where most people meet the site first.
- **Structured data** (`jsonLd` on `BaseLayout`): the home page is a schema.org `Person` (the real job title, New
  Delhi, the socials, no employer); a post is a `BlogPosting` with its dates and author, and `og:type` `article`.
- **Feed**: `/rss.xml` (`rss.xml.ts`, written by hand: titles, summaries, dates), linked from the head and the footer.
  `public/robots.txt` allows everything and points at the sitemap.
