// The big bang. There is no light mode in space: ThemeToggle.astro warns and counts down, then calls bigBang(),
// which collapses the page into a point and re-creates it, still dark (DESIGN.md §4 "Big bang"). Loaded on the
// first LGT click, so it costs nothing until then.
//
// The page's DOM is never changed. Copies of every visible word, box and image go into one top-layer overlay (a
// manual popover) and html.bb hides the originals; only the copies move. At the end they sit exactly on the
// originals, and the overlay goes in the same frame the originals come back. Space (canvas.field-fx, .sky) is
// scaled in place, not copied. Every way out is finish(): the end, Esc, the tab hidden, a resize, a navigation,
// reduced motion turning on, an error, or the watchdog.
//
//   signal:dawn   window CustomEvent { ms }: field.ts ignites the stars (ms 0: all at once)
import { toast } from './eggs';
import { CRUNCH, START, fallTime, radius, spin, stretch } from './fall';

type Kind = 'word' | 'frame' | 'box' | 'item'; // frame: a box with no fill (hairlines, .hud frames)
type Rect = { left: number; top: number; width: number; height: number };
type Clip = { l: number; t: number; r: number; b: number };
type Piece = {
  el: HTMLElement | SVGElement; // the copy
  kind: Kind;
  x: number; // its rect at T-0, client px
  y: number;
  w: number;
  h: number;
  o: number; // opacity, ancestors included
  color: string; // words: the computed colour; filled boxes: the background colour
  dx: number; // its centre's offset from the viewport centre at T-0…
  dy: number;
  r0: number; // …as a distance and an angle
  a0: number;
  T: number; // s it takes to fall in
  turns: number; // how far it spirals in, clockwise
  rgb: number[] | null; // words and filled boxes: [r, g, b, a], for the blueshift
  ra: number; // where it settles in the blob, as a share of the blob's radius
  gone: boolean; // swallowed
};
type Run = {
  t0: number; // performance.now() at T-0
  last: number; // the previous frame's timestamp
  step: number; // the next entry in STEPS
  slow: number; // consecutive slow frames
  liquid: 'goo' | 'blur';
  crushed: boolean; // the crunch's last frame is drawn
  point: HTMLElement; // the singularity
  disp: Element | null; // the liquid filter's feDisplacementMap and feGaussianBlur
  blur: Element | null;
  cx: number; // the viewport centre, client px
  cy: number;
  layer: HTMLElement;
  copies: HTMLElement;
  pieces: Piece[];
  space: HTMLElement[];
  spaceCss: string[]; // their inline styles before the run
  htmlCss: string;
  ac: AbortController;
  watchdog: number;
};

const MAX_WORDS = 1500; // ponytail: above this, one copy per line of a text node instead of per word
const BOX_MAX = 0.6; // share of the viewport a filled box may cover and still be an item (bigger is space)
const WATCHDOG = 20_000; // ms
const DONE = 'Universe rebooted · still dark';
const STILL = 'Still dark · space has no light mode';
const TEXT = [
  'font-family',
  'font-size',
  'font-weight',
  'font-style',
  'font-stretch',
  'font-variation-settings',
  'font-feature-settings',
  'font-variant-numeric',
  'letter-spacing',
  'word-spacing',
  'text-transform',
  'color',
];
const DECO = ['text-decoration-line', 'text-decoration-style', 'text-decoration-color', 'text-decoration-thickness', 'text-underline-offset'];
const SIDES = ['top', 'right', 'bottom', 'left'];
const BOX = [
  'background-color',
  ...SIDES.flatMap((s) => [`border-${s}-width`, `border-${s}-style`, `border-${s}-color`]),
  'border-top-left-radius',
  'border-top-right-radius',
  'border-bottom-right-radius',
  'border-bottom-left-radius',
  'backdrop-filter', // the sticky header blurs what scrolls under it; its copy blurs the copies under it
  '--hud-c',
  '--hud-len',
  '--hud-w',
];
const SKIP = '.sr-only, [hidden], dialog:not([open]), script, style, template, noscript, video, canvas';
const TURN = Math.PI * 2;
const BANG = 4.1; // s: the singularity lets go
const FRAME_FADE = 0.6; // s: frames and hairlines, the weakest-bound structure, are torn off first
const LIQUID = 1.5; // s: the goo filter ramps in over the crunch's last stretch
const SLOW_MS = 24; // a frame slower than this…
const SLOW_RUN = 10; // …this many times in a row swaps the goo for a CSS blur
const BLUE = [232, 242, 255]; // blueshift target, #e8f2ff
const BLOB = 30; // px: the molten blob's radius once everything has fallen in (it grows with what has)
const KMIN = 0.14; // an arrived copy's size in the blob
const CHURN = 6; // rad/s an arrived copy keeps turning in the blob
const COLLAPSE = 0.3; // s: the blob collapses into the point over the crunch's end
// Liquid: static noise wobbles the copies (only its scale animates, so the noise is never regenerated), then a
// blur and an alpha threshold fuse neighbours into one molten blob; the crisp copy is drawn back over it.
const LIQUID_SVG =
  '<svg width="0" height="0" aria-hidden="true" style="position:absolute"><filter id="bb-liquid" color-interpolation-filters="sRGB">' +
  '<feTurbulence type="fractalNoise" baseFrequency="0.012" numOctaves="2" seed="7" result="noise"/>' +
  '<feDisplacementMap in="SourceGraphic" in2="noise" scale="0" xChannelSelector="R" yChannelSelector="G" result="wobble"/>' +
  '<feGaussianBlur in="wobble" stdDeviation="0" result="soft"/>' +
  '<feColorMatrix in="soft" values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 18 -7" result="goo"/>' +
  '<feComposite in="wobble" in2="goo" operator="atop"/></filter></svg>';

// [time in s from T-0, what happens]: run in order, once each, from the frame loop.
// Until the bang lands: the crunch and the singularity, then swap back.
const STEPS: [number, (r: Run) => void][] = [[BANG, () => finish()]];

const root = document.documentElement;
const calm = matchMedia('(prefers-reduced-motion: reduce)');
let run: Run | null = null;
let raf = 0;

/** Transparent in computed style: `transparent`, `rgba(…, 0)` or `… / 0)`. */
const clear = (c: string) => c === 'transparent' || /^rgba\(.*,\s*0\)$/.test(c) || /\/\s*0\)$/.test(c);
/** `name:value;…` for the properties that have a value. */
const props = (s: CSSStyleDeclaration, names: string[]) =>
  names
    .map((n) => [n, s.getPropertyValue(n)])
    .filter(([, v]) => v)
    .map(([n, v]) => `${n}:${v}`)
    .join(';');

/**
 * Copies every visible word, box and image of the header, main and footer into `copies`, in paint order.
 * ponytail: paint order is per top-level container (by z-index: the sticky header over main), boxes and images
 * before text; overlapping positioned layers inside one container are not re-sorted.
 */
function collect(copies: HTMLElement): Piece[] {
  const vw = innerWidth;
  const vh = innerHeight;
  const view: Clip = { l: 0, t: 0, r: vw, b: vh };
  const styles = new Map<Element, CSSStyleDeclaration>();
  const css = (el: Element) => {
    let s = styles.get(el);
    if (!s) styles.set(el, (s = getComputedStyle(el)));
    return s;
  };
  const alphas = new Map<Element, number>();
  const alpha = (el: Element | null): number => {
    if (!el || el === document.body) return 1;
    let a = alphas.get(el);
    if (a === undefined) alphas.set(el, (a = Number(css(el).opacity) * alpha(el.parentElement)));
    return a;
  };
  // What an element's overflow ancestors leave visible: words clamped or scrolled out of view are not copied.
  const clips = new Map<Element, Clip>();
  const clip = (el: Element | null): Clip => {
    if (!el || el === document.body) return view;
    let c = clips.get(el);
    if (!c) {
      c = clip(el.parentElement);
      const s = css(el);
      if (s.overflowX !== 'visible' || s.overflowY !== 'visible') {
        const r = el.getBoundingClientRect();
        c = { l: Math.max(c.l, r.left), t: Math.max(c.t, r.top), r: Math.min(c.r, r.right), b: Math.min(c.b, r.bottom) };
      }
      clips.set(el, c);
    }
    return c;
  };
  const seen = (r: Rect, c: Clip) =>
    r.width > 0 && r.height > 0 && r.left + r.width > c.l && r.left < c.r && r.top + r.height > c.t && r.top < c.b;
  const fonts = new Map<Element, string>();
  const font = (el: Element) => {
    let f = fonts.get(el);
    if (f === undefined) {
      // An underline is drawn by the nearest decorated ancestor, through inline boxes (a .link around a span).
      let deco = css(el);
      for (let a: Element | null = el; a && a !== document.body; a = a.parentElement) {
        const s = css(a);
        if (s.textDecorationLine !== 'none') {
          deco = s;
          break;
        }
        if (!s.display.startsWith('inline')) break;
      }
      fonts.set(el, (f = `${props(css(el), TEXT)};${props(deco, DECO)}`));
    }
    return f;
  };

  type Word = { node: Text; start: number; end: number; r: Rect };
  const groups: { z: number; pieces: Piece[]; words: Word[] }[] = [];
  let pieces: Piece[] = [];
  let words: Word[] = [];
  const add = (el: HTMLElement | SVGElement, kind: Kind, r: Rect, o: number, color = '') =>
    pieces.push({
      el, kind, x: r.left, y: r.top, w: r.width, h: r.height, o, color,
      dx: 0, dy: 0, r0: 0, a0: 0, T: 1, turns: 0, rgb: null, ra: 0, gone: false,
    });
  const range = document.createRange();

  for (const top of document.querySelectorAll<HTMLElement>('body > header, body > main, body > footer')) {
    pieces = [];
    words = [];
    groups.push({ z: parseInt(css(top).zIndex) || 0, pieces, words });
    const walk = document.createTreeWalker(top, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, {
      acceptNode(n) {
        if (n.nodeType === Node.TEXT_NODE) return NodeFilter.FILTER_ACCEPT;
        const el = n as Element;
        // Inside an svg: copied with it. Hidden things are not copied, nor anything in them.
        if ((el instanceof SVGElement && el.ownerSVGElement) || el.matches(SKIP)) return NodeFilter.FILTER_REJECT;
        const s = css(el);
        return s.display === 'none' || s.visibility === 'hidden' ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT;
      },
    });
    // The root first (nextNode() never returns it): the header's own box is its backdrop.
    for (let n: Node | null = top; n; n = walk.nextNode()) {
      if (n instanceof Text) {
        if (n.parentElement instanceof SVGElement) continue;
        const c = clip(n.parentElement);
        range.selectNodeContents(n);
        if (!seen(range.getBoundingClientRect(), c)) continue;
        for (const m of n.data.matchAll(/\S+/g)) {
          range.setStart(n, m.index);
          range.setEnd(n, m.index + m[0].length);
          const r = range.getClientRects()[0];
          if (r && seen(r, c)) words.push({ node: n, start: m.index, end: m.index + m[0].length, r });
        }
        continue;
      }
      const el = n as HTMLElement | SVGElement;
      const r = el.getBoundingClientRect();
      if (!seen(r, clip(el.parentElement))) continue;
      const s = css(el);
      const at = `left:${r.left}px;top:${r.top}px;width:${r.width}px;height:${r.height}px`;
      if (el instanceof HTMLImageElement || el instanceof SVGSVGElement) {
        const copy = el.cloneNode(true) as HTMLElement | SVGElement;
        copy.removeAttribute('id');
        copy.removeAttribute('loading');
        copy.style.cssText = `${at};max-width:none;color:${s.color};fill:${s.fill};stroke:${s.stroke}`;
        add(copy, 'item', r, alpha(el));
        continue;
      }
      const fill = !clear(s.backgroundColor);
      if (fill && r.width * r.height > BOX_MAX * vw * vh) continue;
      const hud = el.classList.contains('hud');
      const line = SIDES.some(
        (d) =>
          parseFloat(s.getPropertyValue(`border-${d}-width`)) > 0 &&
          s.getPropertyValue(`border-${d}-style`) !== 'none' &&
          !clear(s.getPropertyValue(`border-${d}-color`)),
      );
      if (!fill && !line && !hud) continue;
      const box = document.createElement('div');
      if (hud) box.className = 'hud';
      box.style.cssText = `${props(s, BOX)};${at}`;
      add(box, fill ? 'box' : 'frame', r, alpha(el), fill ? s.backgroundColor : '');
    }
  }

  // Dense pages: one copy per line of a text node (a run of its words on one line box) instead of per word.
  const lines = groups.reduce((n, g) => n + g.words.length, 0) > MAX_WORDS;
  for (const g of groups) {
    let runs = g.words;
    if (lines) {
      runs = [];
      for (const w of g.words) {
        const prev = runs[runs.length - 1];
        if (prev && prev.node === w.node && Math.abs(prev.r.top - w.r.top) < 1) {
          range.setStart(prev.node, prev.start);
          range.setEnd(w.node, w.end);
          runs[runs.length - 1] = { ...prev, end: w.end, r: range.getBoundingClientRect() };
        } else runs.push(w);
      }
    }
    // Text goes after its container's boxes and images, so it paints above them.
    pieces = g.pieces;
    for (const w of runs) {
      const p = w.node.parentElement!;
      const text = w.node.data.slice(w.start, w.end);
      const span = document.createElement('span');
      span.textContent = css(p).whiteSpace.startsWith('pre') ? text : text.replace(/\s+/g, ' ');
      // line-height = the glyph box's height: the baseline lands where the original's is.
      span.style.cssText = `${font(p)};left:${w.r.left}px;top:${w.r.top}px;line-height:${w.r.height}px`;
      add(span, 'word', w.r, alpha(p), css(p).color);
    }
  }
  // The page's layers in paint order: main and the footer (z 1), then the sticky header (z 40). The sort is stable.
  const all = groups.sort((a, b) => a.z - b.z).flatMap((g) => g.pieces);
  for (const p of all) {
    p.el.style.opacity = String(p.o);
    copies.append(p.el);
  }
  return all;
}

/** The overlay: a manual popover, so it sits above the header and any top-layer UI. */
function layer() {
  const el = document.createElement('div');
  el.className = 'bb-layer';
  el.setAttribute('aria-hidden', 'true');
  el.innerHTML = LIQUID_SVG;
  const copies = document.createElement('div');
  copies.className = 'bb-copies';
  const point = document.createElement('div');
  point.className = 'bb-point';
  el.append(copies, point);
  document.body.append(el);
  if ('showPopover' in el) {
    el.popover = 'manual';
    el.showPopover();
  }
  return { el, copies, point, disp: el.querySelector('feDisplacementMap'), blur: el.querySelector('feGaussianBlur') };
}

export function bigBang() {
  if (run) return;
  if (calm.matches) {
    toast(STILL);
    return;
  }
  for (const d of document.querySelectorAll<HTMLDialogElement>('dialog[open]')) d.close();
  const { el, copies, point, disp, blur } = layer();
  const cx = innerWidth / 2;
  const cy = innerHeight / 2;
  const space = [...document.querySelectorAll<HTMLElement>('canvas.field-fx, .sky')];
  const ac = new AbortController();
  run = {
    t0: 0,
    last: 0,
    step: 0,
    slow: 0,
    liquid: matchMedia('(pointer: coarse)').matches ? 'blur' : 'goo',
    crushed: false,
    point,
    disp,
    blur,
    cx,
    cy,
    layer: el,
    copies,
    pieces: [],
    space,
    spaceCss: space.map((s) => s.style.cssText),
    htmlCss: root.style.cssText,
    ac,
    watchdog: window.setTimeout(() => finish(), WATCHDOG),
  };
  try {
    // Scroll locked with the gutter kept: the layout the copies are measured in is the one they swap back into.
    root.style.overflow = 'hidden';
    root.style.scrollbarGutter = 'stable';
    run.pieces = collect(copies);
    aim(run);
    for (const s of space) s.style.transformOrigin = `${cx}px ${cy}px`;
    root.classList.add('bb');
    listen(ac.signal);
    run.t0 = run.last = performance.now();
    raf = requestAnimationFrame(frame);
  } catch (e) {
    finish(true);
    throw e;
  }
}

/** Where each copy falls from: its offset from the centre, its fall time and its spiral. */
function aim(r: Run) {
  const rMax = Math.hypot(r.cx, r.cy);
  for (const p of r.pieces) {
    p.dx = p.x + p.w / 2 - r.cx;
    p.dy = p.y + p.h / 2 - r.cy;
    p.r0 = Math.hypot(p.dx, p.dy);
    p.a0 = Math.atan2(p.dy, p.dx);
    p.T = fallTime(p.r0, rMax);
    p.turns = 0.5 + 0.6 * Math.random();
    p.ra = Math.sqrt(Math.random()); // uniform over the blob's disc
    // rgb(r, g, b[, a]) in 0–255, or color(srgb r g b[ / a]) in 0–1 (what color-mix() computes to).
    const c = p.color ? p.color.match(/[\d.]+/g)?.map(Number) : undefined;
    const k = p.color.startsWith('color(') ? 255 : 1;
    p.rgb = c && c.length >= 3 ? [c[0] * k, c[1] * k, c[2] * k, c[3] ?? 1] : null;
  }
}

/** Big crunch: space shrinks to a point and blueshifts, frames tear off, every copy falls in and fuses. */
function crunch(r: Run, t: number) {
  // A closed universe recollapses on the free-fall curve: the scale factor of space is radius().
  const a = radius(t / CRUNCH);
  for (const el of r.space) {
    el.style.transform = `scale(${a})`;
    el.style.filter = `brightness(${1 + 2 * (1 - a)})`;
  }
  // What has fallen in piles up into a molten blob that grows with it, then all of it collapses into the point.
  let fallen = 0;
  for (const p of r.pieces) if (p.kind !== 'frame' && t >= START + p.T) fallen++;
  const blob = BLOB * Math.sqrt(fallen / Math.max(1, r.pieces.length));
  const c = Math.min(1, Math.max(0, (CRUNCH - t) / COLLAPSE));
  for (const p of r.pieces) place(p, t, blob, c);
  liquid(r, t);
}

/**
 * One copy at t: free fall into the centre, spinning up (angular momentum kept), stretched by the tides; once in,
 * it churns in the blob (radius `blob`) until the collapse (`c` runs 1 → 0) takes everything into the point.
 */
function place(p: Piece, t: number, blob: number, c: number) {
  if (p.gone) return;
  const s = p.el.style;
  if (p.kind === 'frame') {
    s.opacity = String(p.o * Math.max(0, 1 - t / FRAME_FADE));
    if (t >= FRAME_FADE) return void (p.gone = true);
  }
  const tau = (t - START) / p.T;
  if (tau <= 0) return;
  if (c === 0) {
    s.opacity = '0';
    p.gone = true;
    return;
  }
  const f = radius(tau); // 0 once it has arrived
  // Clockwise on screen (y down), the black hole disk's hand.
  const th = p.a0 + TURN * p.turns * spin(tau) + Math.max(0, tau - 1) * p.T * CHURN;
  const d = Math.max(p.r0 * f, blob * p.ra) * c;
  const k = Math.max(KMIN, Math.min(1, 2.5 * f)) * c; // it shrinks over the last stretch in
  const st = stretch(f);
  // Stretched along the line to the centre, squeezed across it, turned with its orbit (rotate(th)…rotate(-a0)).
  s.transform = `translate(${d * Math.cos(th) - p.dx}px, ${d * Math.sin(th) - p.dy}px) rotate(${th}rad) scale(${st * k}, ${k / Math.sqrt(st)}) rotate(${-p.a0}rad)`;
  if (p.kind !== 'frame') s.opacity = String(p.o * Math.min(1, c * 3));
  if (p.rgb) {
    const m = (1 - f) ** 2; // blueshift: text and fills alike get hotter and bluer as they are compressed
    const [cr, cg, cb, ca] = p.rgb;
    const v = `rgb(${cr + (BLUE[0] - cr) * m} ${cg + (BLUE[1] - cg) * m} ${cb + (BLUE[2] - cb) * m} / ${ca})`;
    if (p.kind === 'word') s.color = v;
    else s.backgroundColor = v;
  }
}

/** The goo filter over the crunch's last LIQUID seconds; a CSS blur on coarse pointers or slow frames. */
function liquid(r: Run, t: number) {
  const u = Math.min(1, Math.max(0, (t - (CRUNCH - LIQUID)) / LIQUID));
  if (r.liquid === 'goo' && r.slow >= SLOW_RUN) r.liquid = 'blur';
  const s = r.copies.style;
  if (u === 0 || t > CRUNCH) {
    s.filter = '';
    return;
  }
  if (r.liquid === 'goo') {
    s.filter = 'url(#bb-liquid)';
    r.disp?.setAttribute('scale', String(30 * u));
    r.blur?.setAttribute('stdDeviation', String(0.5 + 5.5 * u));
  } else s.filter = `blur(${4 * u}px)`;
}

/** Everything is a 2px point at the centre; it trembles and brightens for the last 300ms before the bang. */
function singularity(r: Run, t: number) {
  const s = r.point.style;
  if (t < CRUNCH - 0.2 || t >= BANG) {
    s.opacity = '0';
    return;
  }
  const q = Math.max(0, (t - (BANG - 0.3)) / 0.3);
  s.opacity = String(Math.min(1, (t - (CRUNCH - 0.2)) / 0.2));
  s.transform = `translate(${(Math.random() - 0.5) * 2 * q}px, ${(Math.random() - 0.5) * 2 * q}px) scale(${1 + 2 * q})`;
}

function listen(signal: AbortSignal) {
  // Esc skips to the end; every other key is swallowed, so ⌘K, Ctrl+` and the rest stay shut mid-run.
  addEventListener(
    'keydown',
    (e) => {
      e.stopImmediatePropagation();
      if (e.key === 'Escape') finish();
    },
    { signal, capture: true },
  );
  addEventListener('resize', () => finish(), { signal });
  document.addEventListener('visibilitychange', () => document.hidden && finish(), { signal });
  document.addEventListener('astro:before-swap', () => finish(true), { signal });
  calm.addEventListener('change', () => finish(), { signal });
}

function frame(now: number) {
  raf = 0;
  const r = run;
  if (!r) return;
  try {
    const t = (now - r.t0) / 1000;
    r.slow = now - r.last > SLOW_MS ? r.slow + 1 : 0;
    r.last = now;
    if (!r.crushed) {
      crunch(r, Math.min(t, CRUNCH + 0.1)); // a late frame still draws the crunch's end
      r.crushed = t > CRUNCH + 0.1;
    }
    singularity(r, t);
    while (run && r.step < STEPS.length && t >= STEPS[r.step][0]) STEPS[r.step++][1](r);
    if (run) raf = requestAnimationFrame(frame);
  } catch (e) {
    finish();
    throw e;
  }
}

/** Every way out. `quiet`: a navigation or a failed start (no focus, no toast). */
function finish(quiet = false) {
  const r = run;
  if (!r) return;
  run = null;
  cancelAnimationFrame(raf);
  raf = 0;
  clearTimeout(r.watchdog);
  r.ac.abort();
  // One frame: the copies go as the originals come back, on the same pixels.
  r.layer.remove();
  root.classList.remove('bb');
  root.style.cssText = r.htmlCss;
  r.space.forEach((el, i) => {
    for (const a of el.getAnimations()) a.cancel();
    el.style.cssText = r.spaceCss[i];
  });
  window.dispatchEvent(new CustomEvent('signal:dawn', { detail: { ms: 0 } }));
  if (quiet) return;
  document.querySelector<HTMLElement>('[data-theme-toggle]')?.focus({ preventScroll: true });
  toast(DONE);
}
