// The big bang. There is no light mode in space: ThemeToggle.astro warns and counts down, then calls bigBang(),
// which collapses the page into a point and re-creates it, still dark (DESIGN.md §4 "Big bang"). Loaded on the
// first LGT click, so it costs nothing until then.
//
// The page's DOM is never changed. Copies of every visible word, box and image go into one top-layer overlay (a
// manual popover) and html.bb hides the originals. For the crunch the copies and the dust behind them are drawn
// once into a canvas (raster.ts) and the GPU bends and drains that picture into the hole (warp.ts); the copies come
// back for the re-forming. At the end they sit exactly on the originals, and the overlay goes in the same frame the
// originals come back. The sky is scaled in place, not copied. Every way out is finish(): the end, Esc, the tab
// hidden, a resize, a navigation, reduced motion turning on, an error, or the watchdog.
//
//   signal:dawn   window CustomEvent { ms }: field.ts ignites the stars (ms 0: all at once)
import { toast } from './eggs';
import { CRUNCH, START, WIND, fallTime, radius, spin } from './fall';
import { rasterize } from './raster';
import { createWarp, type Warp } from './warp';

type Rect = { left: number; top: number; width: number; height: number };
type Clip = { l: number; t: number; r: number; b: number };
type Piece = {
  el: HTMLElement | SVGElement; // the copy
  w: number; // its size at T-0, px
  h: number;
  o: number; // opacity, ancestors included
};
type Run = {
  t0: number; // performance.now() at T-0; 0 while the page is still being drawn
  step: number; // the next entry in STEPS
  crushed: boolean; // the crunch's last frame is drawn
  point: HTMLElement; // the singularity
  flash: HTMLElement; // the bang's light
  glow: HTMLCanvasElement; // the afterglow
  skyOpacity: number; // .sky's opacity before the run
  fieldOpacity: number; // canvas.field-fx's
  layer: HTMLElement;
  copies: HTMLElement;
  warp: Warp | null; // null: no WebGL2, the copies fall as one sheet
  pieces: Piece[];
  space: HTMLElement[];
  field: HTMLElement | undefined; // canvas.field-fx, one of space…
  sky: HTMLElement | undefined; // …and .sky, the other
  skyT: number; // s the planet takes to fall in, from where it is
  spaceCss: string[]; // their inline styles before the run
  htmlCss: string;
  ac: AbortController;
  watchdog: number;
};

const MAX_WORDS = 1500; // ponytail: above this, one copy per line of a text node instead of per word
const BOX_MAX = 0.6; // share of the viewport a filled box may cover and still be an item (bigger is space)
const DPR = Math.min(2, devicePixelRatio || 1); // the warp's resolution, capped like the dust's
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
const BANG = 4.1; // s: the singularity lets go
const COOL_MS = 2400; // the plasma cools from the bang to transparent
const GLOW_AT = 1500; // ms after the bang: the afterglow…
const GLOW_MS = 1200; // …for this long
const DAWN = 7.1; // s: after the dark ages, the first stars
const DAWN_MS = 2400;
const FORM = 8.0; // s: structure begins to condense
const FORM_SPREAD = 1.5; // s from the smallest copy's start to the largest's
const FORM_JITTER = 0.28; // s of random on top
const FORM_MS = 1220; // one copy: 800ms condensing, then the flicker stutter
const SKY_AT = 1.8; // s after FORM: the planet (the largest structure) forms last
const SKY_MS = 900;
const END = 11.0; // s: every copy has formed; swap back
const EASE = 'cubic-bezier(0.2, 0.8, 0.2, 1)'; // --ease-out
const STEP = 'steps(1, end)';
// Blackbody colours as the plasma cools (physics, not theme tokens). 3,000 K is recombination: the universe turns
// transparent and lets go of the light we now see as the cosmic microwave background.
const COOLING: Keyframe[] = [
  { backgroundColor: '#cfdcff', offset: 0 }, // ~15,000 K, blue-white
  { backgroundColor: '#fff8ee', offset: 0.08 }, // ~6,500 K, white: the peak…
  { backgroundColor: '#fff8ee', offset: 0.14 }, // …held 150ms
  { backgroundColor: '#ffe2bf', offset: 0.3 }, // ~4,500 K
  { backgroundColor: '#ffb46b', offset: 0.5 }, // ~3,000 K, recombination
  { backgroundColor: '#ff5f1f', offset: 0.66 }, // ~1,900 K
  { backgroundColor: '#5a1604', offset: 0.84 },
  { backgroundColor: 'rgb(90 22 4 / 0)', offset: 1 },
];
/** A copy condensing out of diffuse gas, then flickering on (the .flicker steps), to its own opacity o. */
const condense = (o: number): Keyframe[] => [
  { opacity: 0, transform: 'scale(1.6)', easing: EASE },
  { opacity: 0.6 * o, transform: 'scale(1)', offset: 0.66, easing: STEP },
  { opacity: 0.8 * o, offset: 0.73, easing: STEP },
  { opacity: 0.2 * o, offset: 0.8, easing: STEP },
  { opacity: o, offset: 0.87, easing: STEP },
  { opacity: 0.6 * o, offset: 0.93, easing: STEP },
  { opacity: o, transform: 'scale(1)' },
];
/** Large copies (over 5% of the viewport): a smaller swell and the soft flicker, never below 0.6. */
const condenseSoft = (o: number): Keyframe[] => [
  { opacity: 0, transform: 'scale(1.08)', easing: EASE },
  { opacity: 0.6 * o, transform: 'scale(1)', offset: 0.66, easing: STEP },
  { opacity: 0.85 * o, offset: 0.79, easing: STEP },
  { opacity: 0.6 * o, offset: 0.88, easing: STEP },
  { opacity: o, transform: 'scale(1)' },
];

// [time in s from T-0, what happens]: run in order, once each, from the frame loop.
const STEPS: [number, (r: Run) => void][] = [
  [BANG, bang],
  [BANG + 0.25, reset], // under the white: the copies go back to their places, unseen
  [DAWN, dawn],
  [FORM, form],
  [END, () => finish()],
];

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
  const add = (el: HTMLElement | SVGElement, r: Rect, o: number) => pieces.push({ el, w: r.width, h: r.height, o });
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
        if (copy instanceof HTMLImageElement && el instanceof HTMLImageElement) {
          copy.src = el.currentSrc || el.src; // the source the original chose, whatever its sizes
          copy.removeAttribute('srcset');
          copy.removeAttribute('sizes');
        }
        // Its styles, inline: rules that match through an ancestor (.card img) no longer reach the clone, and
        // scoped rules that do still match (by class) must not move it.
        copy.style.cssText =
          `${at};position:absolute;margin:0;translate:none;rotate:none;scale:none;max-width:none;` +
          `color:${s.color};fill:${s.fill};stroke:${s.stroke};object-fit:${s.objectFit};` +
          `object-position:${s.objectPosition};filter:${s.filter}`;
        add(copy, r, alpha(el));
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
      // A wrapped inline box (prose code) paints one piece per line, with no inner-side borders or corners.
      // ponytail: left-to-right only; the site is.
      const frags = s.display === 'inline' ? [...el.getClientRects()] : [r];
      const look = props(s, BOX);
      frags.forEach((f, i) => {
        if (!seen(f, clip(el.parentElement))) return;
        const open = i > 0 ? 'border-left-width:0;border-top-left-radius:0;border-bottom-left-radius:0;' : '';
        const shut = i < frags.length - 1 ? 'border-right-width:0;border-top-right-radius:0;border-bottom-right-radius:0;' : '';
        const box = document.createElement('div');
        if (hud) box.className = 'hud';
        box.style.cssText = `${look};${open}${shut}left:${f.left}px;top:${f.top}px;width:${f.width}px;height:${f.height}px`;
        add(box, f, alpha(el));
      });
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
      add(span, w.r, alpha(p));
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
  const copies = document.createElement('div');
  copies.className = 'bb-copies';
  const point = document.createElement('div');
  point.className = 'bb-point';
  const flash = document.createElement('div');
  flash.className = 'bb-flash';
  const glow = document.createElement('canvas');
  glow.className = 'bb-glow';
  afterglow(glow);
  el.append(copies, point, flash, glow);
  document.body.append(el);
  if ('showPopover' in el) {
    el.popover = 'manual';
    el.showPopover();
  }
  return {
    el,
    copies,
    point,
    flash,
    glow,
  };
}

/** The afterglow's mottle: 48×27 random cells of 3,000 K light, blown up smooth (the CMB, stood in for). */
function afterglow(c: HTMLCanvasElement) {
  c.width = 48;
  c.height = 27;
  const g = c.getContext('2d');
  if (!g) return;
  const img = g.createImageData(48, 27);
  for (let i = 0; i < img.data.length; i += 4) img.data.set([255, 180, 107, Math.random() * 255], i);
  g.putImageData(img, 0, 0);
}

export async function bigBang() {
  if (run || document.hidden) return; // a background tab: nobody is watching, and rAF would not run
  if (calm.matches) {
    toast(STILL);
    return;
  }
  // Top-layer UI and the open mobile menu sheet would sit over the copies (or hide what they copy): close them.
  for (const d of document.querySelectorAll<HTMLDialogElement>('dialog[open]')) d.close();
  document.querySelector<HTMLElement>('[data-menu-toggle][aria-expanded="true"]')?.click();
  const { el, copies, point, flash, glow } = layer();
  const space = [...document.querySelectorAll<HTMLElement>('canvas.field-fx, .sky')];
  const sky = space.find((s) => s.matches('.sky'));
  const field = space.find((s) => s.matches('canvas.field-fx'));
  // The planet sits on the hero's anchor, or parked in the top-right corner (about a corner's distance out).
  const rMax = Math.hypot(innerWidth / 2, innerHeight / 2);
  const planet = document.querySelector('[data-planet-anchor]')?.getBoundingClientRect();
  const r0 = planet
    ? Math.hypot(planet.left + planet.width / 2 - innerWidth / 2, planet.top + planet.height / 2 - innerHeight / 2)
    : rMax;
  const ac = new AbortController();
  const r: Run = (run = {
    t0: 0,
    step: 0,
    crushed: false,
    point,
    flash,
    glow,
    skyOpacity: sky ? Number(getComputedStyle(sky).opacity) : 1,
    fieldOpacity: field ? Number(getComputedStyle(field).opacity) : 1,
    layer: el,
    copies,
    warp: null,
    pieces: [],
    space,
    field,
    sky,
    skyT: fallTime(r0, rMax),
    spaceCss: space.map((s) => s.style.cssText),
    htmlCss: root.style.cssText,
    ac,
    watchdog: window.setTimeout(() => finish(), WATCHDOG),
  });
  try {
    // Scroll locked with a classic scrollbar's gutter kept (only if one shows): the layout the copies are measured
    // in is the one they swap back into.
    if (innerWidth > root.clientWidth) root.style.scrollbarGutter = 'stable';
    root.style.overflow = 'hidden';
    r.pieces = collect(copies);
    for (const s of space) s.style.transformOrigin = `${innerWidth / 2}px ${innerHeight / 2}px`;
    listen(ac.signal);
    // The copies sit on the originals while the page is drawn for the GPU (a few ms; Esc or a resize can end it).
    const page = await rasterize(copies, field instanceof HTMLCanvasElement ? [field] : [], DPR).catch(() => null);
    if (run !== r) return;
    r.warp = page && createWarp(page, DPR);
    if (r.warp) {
      r.warp.canvas.className = 'bb-warp';
      // The page was drawn at innerWidth × innerHeight: the same box here, even beside a classic scrollbar's gutter.
      r.warp.canvas.style.cssText = `width:${innerWidth}px;height:${innerHeight}px`;
      copies.after(r.warp.canvas);
    }
    root.classList.add('bb');
    r.t0 = performance.now();
    raf = requestAnimationFrame(frame);
  } catch (e) {
    finish(true);
    throw e;
  }
}

/** Big crunch: the page bends and drains into the hole; the sky falls in with it. */
function crunch(r: Run, t: number) {
  // The planet can't be copied into the warp (a WebGL canvas reads back blank), so the sky falls in whole, on the
  // path the page takes at the planet's distance.
  if (r.sky) sink(r.sky, (t - START) / r.skyT);
  if (r.warp) {
    // The GPU's picture of the page (and its dust) fades in over the copies while nothing moves yet, then
    // replaces them. It lies on top, so opaque text never dips mid-fade; the faint dust under it crossfades, or
    // doubled up it would brighten and then drop.
    const u = Math.min(1, t / START);
    r.warp.canvas.style.opacity = String(u);
    if (r.field) r.field.style.opacity = String(r.fieldOpacity * (1 - u));
    if (u === 1) r.copies.style.visibility = 'hidden';
    r.warp.draw(t);
    return;
  }
  // No WebGL2: the page and the dust fall in as one sheet.
  const tau = (t - START) / (CRUNCH - START);
  sink(r.copies, tau);
  if (r.field) sink(r.field, tau);
}

/** Something falling in whole about the viewport centre at τ of its fall: turned, shrunk and heated. */
function sink(el: HTMLElement, tau: number) {
  const f = radius(tau);
  el.style.transform = `rotate(${WIND * spin(tau)}rad) scale(${f})`;
  el.style.filter = `brightness(${1 + 2 * (1 - f)})`;
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

/** Inflation: light bursts from the point to fill the screen, then cools along the blackbody curve. */
function bang(r: Run) {
  r.flash.animate([{ clipPath: 'circle(0px at 50% 50%)' }, { clipPath: 'circle(150% at 50% 50%)' }], {
    duration: 200,
    easing: 'cubic-bezier(0.3, 0, 0, 1)',
    fill: 'forwards',
  });
  r.flash.animate(COOLING, { duration: COOL_MS, fill: 'forwards' });
  r.glow.animate([{ opacity: 0 }, { opacity: 0.3, offset: 0.4 }, { opacity: 0 }], {
    duration: GLOW_MS,
    delay: GLOW_AT,
    fill: 'both',
  });
}

/** Under the white: the copies back, unseen, on their originals; space back to size, dark until its stars ignite. */
function reset(r: Run) {
  for (const p of r.pieces) p.el.style.opacity = '0';
  r.copies.style.cssText = '';
  r.warp?.canvas.remove();
  r.warp?.destroy();
  r.warp = null;
  r.space.forEach((el, i) => {
    el.style.cssText = r.spaceCss[i];
    el.style.transition = 'none';
    el.style.opacity = '0';
  });
}

/** Cosmic dawn: the dust ignites star by star (field.ts draws its dark first frame before this returns). */
function dawn(r: Run) {
  window.dispatchEvent(new CustomEvent('signal:dawn', { detail: { ms: DAWN_MS } }));
  if (r.field) r.field.style.opacity = '';
}

/**
 * Structure forms bottom-up, as in ΛCDM: the smallest copies condense first, the largest last, everywhere at once
 * (not a ripple from the centre: the big bang happened everywhere). The planet is the largest and forms last.
 */
function form(r: Run) {
  const area = innerWidth * innerHeight;
  const order = [...r.pieces].sort((a, b) => a.w * a.h - b.w * b.h);
  order.forEach((p, i) => {
    const q = order.length > 1 ? i / (order.length - 1) : 0;
    const delay = (q * FORM_SPREAD + Math.random() * FORM_JITTER) * 1000;
    const keys = p.w * p.h > 0.05 * area ? condenseSoft(p.o) : condense(p.o);
    p.el.animate(keys, { duration: FORM_MS, delay, fill: 'both' });
  });
  const sky = r.space.find((el) => el.matches('.sky'));
  const b = r.skyOpacity;
  sky?.animate([{ opacity: 0 }, { opacity: 0.85 * b, offset: 0.3 }, { opacity: 0.6 * b, offset: 0.55 }, { opacity: b }], {
    duration: SKY_MS,
    delay: SKY_AT * 1000,
    easing: 'steps(4, end)',
    fill: 'both',
  });
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
  r.warp?.destroy();
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
