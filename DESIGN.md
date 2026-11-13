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
  14px/1.6. The project stills are small illustrations with their own sizes inside, not text steps. The footer's
  "rajiv" is a drawing as wide as the content, not a step.

## §2 Colour

Tokens on `:root` in `src/styles/global.css`, exposed to Tailwind with `@theme inline` (`bg-bg`, `text-ink`,
`border-line`…; the default palette is cleared).

| Token      | Dark                    | Light                 | Use                       |
| ---------- | ----------------------- | --------------------- | ------------------------- |
| `--bg`     | `#02070a`               | `#f3f2ee`             | page (midnight black)     |
| `--panel`  | `#0c1419`               | `#e8e7e1`             | raised surfaces           |
| `--line`   | `rgba(237,237,234,.1)`  | `rgba(21,21,21,.12)`  | hairlines                 |
| `--ink`    | `#ededea`               | `#151515`             | text                      |
| `--muted`  | `#8f8f8a`               | `#63635e`             | secondary text            |
| `--hi`     | `#ffffff`               | `#000000`             | emphasis                  |
| `--logo`   | `#ff5f1f`               | `#ff5f1f`             | the mark and the rocket's flame (decorative) |
| `--spot`   | `--logo`                | `--logo`              | the drawings' filled bits: the doodles' hexagon and spark, cover accents, the footer name's revealed fill (decorative) |
| `--accent` | `#ff5f1f`               | `#c2410c`             | text orange, focus ring, the nav underline, active dots, reading line, the timeline's current node |
| `--frame`  | `--ink` at 16%          | `--ink` at 16%        | the 1px border round post covers and project stills (no fill) |
| `--tile`   | `#f3f2ee`               | `#ffffff`             | Experience's logo tiles, light in both themes so a black mark reads on dark |
| `--tile-edge` | `transparent`        | `--line`              | the tile's 1px border, so a white tile still reads on the light page |
| `--shadow` | `rgba(0,0,0,.55)`       | `rgba(38,34,26,.14)`  | the lifted header's drop shadow, nothing else |
| `--sel-bg` | `#f3f2ee`               | `#02070a`             | selected text's ground: the other theme's page |
| `--sel-ink`| `#c2410c`               | `#ff5f1f`             | selected text: the other theme's text orange (4.6:1 / 6.7:1) |

Dark is the default. Light applies under `prefers-color-scheme: light` unless `data-theme="dark"`, and always under
`data-theme="light"`. Both pass WCAG AA for text; `--logo` and `--spot` are only ever the mark, drawings and the
decorative footer name, never running text.

Code in posts uses Shiki's `github-dark-default` and `github-light-default` on `--panel`, both themes emitted as
`--shiki-dark` / `--shiki-light` and picked by the token rules in `prose.css`. The light theme is drawn for white, so a
transformer in `astro.config.mjs` swaps its comment, keyword and function colours for Primer's next darker step: the
worst token is 5.2:1 on the light panel and 6.0:1 on the dark one.

## §3 Chrome

- **The frame**: margins `--gut` / `--gut-r` = `clamp(20px, 3.4vw, 48px)` (or the safe area) via `.wrap`. One axis at
  42% of the width, `--cols` = `42fr 58fr`, shared by every page: the header's nav, the home page's Lately rows, the
  blogs list and a post's article all start on it. `--head-h` (76px) is the header's height at rest; pages clear
  it, and `scroll-padding-top` keeps anchors below it.
- **Header** (`Header.astro`, `.top`): fixed to the top on every page, a grid on `--cols`. The logo alone in the first
  column: the hexagon mark (`.mark`, `data-logo`, 28px) in a link labelled "rajiv.me, home". From the axis, `.bar`:
  nav (About `/#about`, Blogs `/#blogs`, Projects `/#projects`, in the home page's section order; sans 15px, gap
  28px; every link scrolls to its home section, from any page, and the blogs index is reached from the section's
  "All blogs"), then on the right `.reach` (the X icon, 17px, and "Say hi", a pill with a 1px `--frame` border) and the
  theme switch. "Say hi" opens a native popover (`#say-hi`, light dismiss and Esc built in) anchored 10px under it
  (84px down without anchor positioning): a muted line, then Email (mailto, with a Copy button that reads "Copied" for
  1.6s), LinkedIn and X, split by `--line` hairlines, on `--bg` with a 1px `--line` border, 14px radius and the
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
    the resting 76px to 56px. See §4 for what moves it.
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
  dev.to, Stack Overflow), `RSS` and `llms.txt`, then "© 2026 Rajiv Kumar" (a column on a phone). Under it a giant lowercase
  "rajiv" as wide as the content, drawn like the doodle: Geist 500's outlines redrawn by hand (anchors nudged,
  straight runs bowed, each line running a little past its start), traced to `src/assets/name.svg` (generator in the
  local `docs/v4-research/art/vector/name.mjs`). Outline only, round-capped, in `--muted` at 70% (3.5 units, 7 at
  720px and under, so about 2.5px at 1440 and 1.3px at 375). The viewBox crops it to its top half at the bottom of
  the page. The `--spot` fill shows only where the cursor's blob is (§4).
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
  screen never leaves anything orange; `:focus-visible` gets the same colour. The hover moments that are not links,
  the landing phrase (§5), the footer name's blob and the section doodles' reveal (§4), are slow and large, so they do
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
screen and for the planet's bands, and only while they are on screen, and for the blobs of the footer name and the
section doodles while a mouse is on them.

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
- **Section doodles** (`Doodle.astro` with `art`): a pencil sketch that the cursor inks, and no draw-on. The drawing
  is in the page twice: `.rest`, always on show in `--muted`, and over it `.ink`, the same lines in `--ink` inside a
  clip path that is empty until a mouse comes over its box. Then the footer name's blob (`trail` in `scripts/blob.ts`,
  the same springs, stretch and wobble, radius 270 units, about 82px at 1440) trails the cursor as the clip, so the
  sketch turns to ink under it, cut at its rim, as the footer name's fill is. A third path sharing the outline lies
  under the lines as a faint jelly (`--line`). On leaving it shrinks away and rAF stops. On touch (`hover: none`) the ink copy is
  unclipped, so it shows inked; under reduced motion the blob is a plain circle on the cursor. (Until 11 Nov the drawing was hidden outside
  the blob: nobody on touch and few with a mouse ever saw it.)
  - **Alive on hover**: while the svg is hovered, its parts loop on their own clocks (CSS only, rigged by
    `sections.mjs`), the sketch and its ink copy on one clock, so they stay in register; off hover every loop pauses
    where it is, so idle is zero work. Blogs: the pen writes the four
    rows in turn (each draws on as the nib follows it), lifts off, the full page tears away up and to the left and a
    blank one settles (12 s); the post scrolls up the laptop screen, clipped to it (16 s); the bulb's rays glow, the
    thought trail bobs, the sparkles twinkle. Projects: the gears turn, the small one the other way and faster by its
    size (24 s a turn for the big one); the flask's surface sloshes, two bubbles rise through the liquid and pop, three
    stream out of the neck; the parcel's tag sways from its knot and its motion strokes whoosh away in turn. All slow
    and small. Under reduced motion they hold still, the page fully written.
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
  rim wobbles with three waves running round it, drawn with the footer blob's closed curve (`scripts/blob.ts`). No two
  pours are alike: every click rolls each knob inside a range that still reads as liquid: 850 to 1250 ms, ease-out
  power 1.7 to 2.6, and per wave its lobes (3 to 5, 6 to 9, 10 to 14), depth (4 to 8%, 2.5 to 5%, 1 to 3% of the
  radius, so the rim never dips more than 16%), speed (3 to 6, 4 to 7, 2 to 5 rad/s, either way round) and phase.
  A click mid-pour starts a new one from the current state. Under reduced motion, or without view transitions, the
  theme flips at once.
- **Switch morph** (`global.css`, `.theme`): as the theme flips the icon morphs over 600 ms `--ease`. Sun to moon:
  the rays spin a quarter turn into the middle and vanish (opacity 200 ms), the orb grows by half (its outline
  thinned to keep the weight) and a shade circle slides in along the diagonal from the top right; an svg mask cuts
  the orb's outline under the shade and the shade's own outline, clipped to the orb, closes the crescent. Moon to
  sun runs it back, the rays fading in only after 250 ms, once they are outside the orb. Every part is a CSS
  transition on `--m`, so a system theme change morphs too. Under reduced motion it swaps at once.
- **Footer name**: the first time a quarter of the footer is on screen, "rajiv" draws itself like the doodle: each
  outline from its start, left to right, 130 ms apart, each taking 350 ms plus its length (up to 1.1 s), about 2 s in
  all. Without JS or under reduced motion it is drawn from the start.
  - **Reveal**: a mouse over the name (`hover: hover` and `pointer: fine`, never touch) carries a liquid blob, the
    clip path of a `--spot` copy of the same outlines under the pen, so the letters fill orange inside it and the
    outline stays as it is. The blob (radius 140 units, about 100px at 1440) swells in on a bouncy spring, its centre
    trails the cursor on a looser one, it stretches along its speed (up to 1.5x, thinner across) and its rim wobbles
    (three sines turning at different rates). On leaving it shrinks away and rAF stops. Under reduced motion it is a
    plain circle on the cursor, drawn on pointer moves only.
- **Hover**: links thicken their underline, cards lighten to `--hi`, post covers scale to 1.03 (800 ms, not under
  reduced motion), blogs list titles go to `--hi` with the `--accent` dot beside them.

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
drawing that draws itself, two pencil sketches beside the lists (none of the three on a phone), the header for getting around. The AI depth is shown, never titled: no
"AI engineer" anywhere. Copy is written the way the best engineers' own sites are (Lee Robinson, Mitchell Hashimoto,
Hamel Husain): who and where, what now, one line of values, one human line. No labels, no adjectives about himself.
Sections, in order:

1. **Landing** (`#about`): `min-height: clamp(640px, 100vh, 960px)`, the text vertically centred. Left column
   `min(760px, 52vw)`: the name (`--t-m`, `--accent`), then the h1 "Software you don’t / have to think about."
   (`--t-xl`, two authored lines). Under it two short paragraphs (`--t-sm`, `--ink`, max 31em, 16px apart): "I’m a
   software engineer in New Delhi. I’ve been building web and native apps since 2019, along with the backends behind
   them and the infrastructure they run on." / "These days most of my time goes to putting language models to work inside real
   products. The goal hasn’t changed: software that’s fast to load, clear to use and boring to run." The values phrase
   (`.hl`) looks like the rest until the pointer is anywhere on the two paragraphs; then `--accent` flows through it
   left to right, line after line, and ebbs back on leave. It is text clipped to a `--accent` to `--ink` gradient
   (soft 40% to 60% edge, 250% wide, one strip across the line break) whose position slides 100% to 0 over 1100ms
   `--ease`. Reduced motion: the colour switches at once. Touch shows plain text. Then two lines at `--t-s` (max
   42em). The person, muted and balanced: "Off screen: astronomy, rockets, physics and sport. The drawing covers three
   of the four." And 12px under it, in `--ink`, how to reach him, the address spelled out so it can be read and
   copied: "Write to me at hello@rajiv.me." (the socials are in the footer) The right
   48% (to the screen edge) holds the doodle, centred with 96 / 56 / 40 px of air: a sketchbook line drawing of a
   telescope whose dotted route loops a ringed planet and runs up to a rocket, with a moon, a pendulum, stars and two
   hexagons. It is an inline SVG traced from Codex line art (`src/assets/doodle.svg`; tracer in the local
   `docs/v4-research/art/vector/`; the planet is generated, see §4): strokes on `currentColor` (`--ink`), the flame in
   `--logo` and one hexagon in `--spot`, so it follows the theme. At 720px and under the home page has no doodle (the
   404 keeps its 208px band): the landing starts `--head-h` + 32px down, so the page opens on the name and headline,
   balanced over three lines (no forced break). The hidden doodle does no work: its observer never sees it, so the
   planet's loop never starts and its CSS loops don't run.
2. **How I work** (`#now`, counted as About by the scroll spy): a grid on `--cols`. The h2 "How I work" (it read as a status, not as
   what he does) in the first column with its note under it ("Where most of my week goes."); from the axis, on the h2's baseline, the thesis (`--t-l`, 500,
   max 18em, balanced): "The model is rarely the hard part. Everything around it is." Under it its four parts in two
   columns (one on a phone), each a 500 title and a muted sentence on a `--line` hairline. Each sentence is in the
   first person and in words a founder or recruiter can follow, the outcome last; the posts on these
   topics, once written, carry the technical terms (no MCP, evals, hooks or diffs here). Tools, not paragraphs (a few narrow tools over a product's
   real data and actions); A budget for every call (a time limit, a cost limit and a fallback on every feature);
   Tested before trusted (every prompt or model change runs against past failures); Agents on the team (coding agents
   under written rules). Last, a muted line led by "Coming soon" in `--accent`: Orca, a timer for the macOS menu bar
   that you and an AI agent can both run (no link until it ships). Under 1000px everything stacks under the h2; on a phone it starts 72px under the landing, not 104px.
3. **Blogs** (`#blogs`), 4. **Experience** (`#experience`) and 5. **Projects** (`#projects`) share one grid on
   `--cols`: the h2 and its note (muted, max 22em, under it) in the first column, sticky at `--head-h` + 40px, the
   content from the axis. Under 1000px the head is static and the content follows it.
   - Under the Blogs and Projects notes, 56px down, the section's doodle (`.sk`, at most 300px wide and
     `clamp(180px, 100svh - --head-h - 420px, 270px)` tall, about the note's width, held to the left edge, sticky with
     the head): a story in three objects on one dashed route that zigzags down the column, traced from Codex line art
     like the landing doodle (`src/assets/doodle-<section>.svg`, made by `sections.mjs` in the local
     `docs/v4-research/art/vector/`). It rests as a pencil sketch and a mouse inks it with the blob (§4),
     so every section's first column carries the site's drawing hand. Its strokes are `--muted`, one small spark is
     `--spot`, and any other filled area is the stroke colour at 22%. Blogs: a thought cloud with a
     lightbulb (the orange spark), a pen writing a page, a laptop showing it as a post (faint title bar). Projects: a
     lab flask (faint liquid), two gears, a parcel with a tag going out (orange tape). The traced wrench tangled with the
     small gear, so both were dropped and the small gear redrawn as a scaled copy of the big one. Under 1000px it is hidden: the lists lead.
   - Blogs: the note "Notes on building for the web, and the problems I would rather solve once." (the same
     line as the /blogs dek; "putting models to work" comes back into both when those posts are published), the
     four newest posts that have a cover drawing as `PostCard` rows (so the list is a mix and every row carries a
     doodle; a new post joins it once its cover is drawn), then a row of its own between hairlines: "Read all 6
     posts" (`--t-sm`, 500, the live count; a phone shows three posts, then this row)
     with a `--accent` arrow at the far end that slides 6px on hover (reduced motion: it stays); the label turns
     `--accent` too.
   - Experience (counted as Blogs by the scroll spy): the note "The teams I’ve built with, newest first." From
     the axis, a vertical timeline (`ol.tl`), one entry per job: a 112px date column (right-aligned, `--t-xs`; the
     start month in `--ink` on its own line, then "to now" or "to Jul 2021" in `--muted`, each month a `<time>`), a
     64px rail column, then the content. One 2px line runs down the rail through every entry, `--accent` at the top
     into `--line` by 160px and fading out over the last 64px. Each entry has a 12px node on it: the current job
     filled `--accent` with a 5px ring of the accent at 18%, a past job a 2px `--muted` ring on `--bg`. The content:
     a 44px `--tile` (radius 11px, `--tile-edge` border) holding the logo (`src/assets/logos/`, imported and hashed, a plain `<img>`), beside
     it the role as the h3 (`--t-sm`, 500) and the company muted under it, then one line on the product and his
     part in it in `--ink` (max 34em, 16px down), then a short list of what he built there and the problem it
     solved (`ul.wk`: muted, disc markers in `--accent`, 8px apart, 14px down). The `work` lines are lorem ipsum
     placeholders until he writes them; they must be replaced before this ships. Entries sit 64px apart. The one place an employer is named: Senior Frontend
     Engineer at swipejobs (Aug 2021 to now), Frontend Engineer at Influence (Jan 2020 to Jul 2021). Real titles and
     dates only, no stats. At 720px and under the rail moves to a 32px column at the left edge and the dates sit on
     one line above each entry's content.
   - Every clickable item (post rows, project rows, the /blogs list) turns its title `--accent` while the pointer
     is anywhere on the item, cover and still included, or the item has keyboard focus (§3 Hover). Nothing else in
     the row changes colour.
   - Projects: the note "Tools I built for my own problems, then released." The tools newest first (Diver,
     css-only-tooltip, YouTube Playlist Info), then this site as the colophon. One row per project on a `--line`
     hairline (28px padding, about 250px tall at 1440), each a link to the real thing, split
     text first (the rest of the row) and the still second (`clamp(240px, 22vw, 320px)`, 317px at 1440) with a 32px gap: the text (the name in `--t-sm`, a muted two-sentence summary, "Kind, year" in
     `--muted` 14px under it, then where the link goes, underlined: View on npm, Get it for Chrome, Open the app, Read
     the source) and a 16:10 still with a `--frame` border and no fill drawn in HTML (the CSS-only tooltip with its attribute, the Diver outline on a mini copy
     of this page, the playlist total, the mark; scaled 1.35 when wider than 420px). On a phone the still sits above
     the text at 2:1, so a row stays short. Each link opens a new tab and says so: its accessible name is "name: where
     it goes (opens in a new tab)", described by the summary.

Sections sit 136px apart (104px on a phone). The footer is the layout's (§3).

**Post row** (`components/PostCard.astro`, on the home page and in "More blogs", which uses the same split from
1000px): on a `--line` hairline with 24px padding, the text on the left (the title in `--t-sm`, the muted summary,
max 38em, then "Oct 2026 · 4 min read" in `--muted` 14px under it) and, 32px away, a 16:10 cover with a `--frame`
border and no fill, `clamp(112px, 9vw, 136px)`
wide: the post's line doodle, traced to SVG in `src/assets/covers/<slug>.svg`, ink on `currentColor`, orange in
`--spot`, scaled 1.25 so the drawing (at most 70% of its frame) keeps only a thin margin; a post with no cover yet
shows its line of code there, in mono at `--t-code`. On a phone the cover is an 80px thumbnail beside the text (16px gap; a code cover sets its line at 9px).

## §6 Blogs list (`pages/blogs/index.astro`)

A grid on `--cols` from 1000px up. The first column is a sticky head (top `--head-h` + 40px): the h1 "Blogs"
(`--t-xl`), the dek "Notes on building for the web, and the problems I would rather solve once." (`--t-sm`,
`--muted`) and a count ("6 posts since 2021"). From the axis, the posts by year, newest first: the
year (`--t-xs`, `--muted`) on a hairline, then each post as the home page's row (`PostCard`): title, summary, "Mon
YYYY · N min read" under it and the cover on the right (or its line of code when it has none), the cover morphing into
the post's own on navigation. The year's hairline stands in for its first row's.
Under the count, 56px down, the home page's Blogs doodle (§5), the same sketch and blob, so the list has the
site's drawing too. Under 1000px one column with the head on top and no doodle.

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
- **More blogs**, full width under a hairline: the h2 with "All blogs" on the right and the three newest other
  posts as `PostCard`s (three columns, two from 721px, one on a phone).

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
