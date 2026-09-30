// The big bang's page as one picture (src/scripts/bigbang.ts): the copies collect() made, drawn into a canvas that
// warp.ts bends. It is crossfaded against the copies, so at t = 0 it must land on their pixels: same font, spacing,
// baseline and colour, hairlines snapped to device pixels as the DOM snaps them.

type Draw = (g: CanvasRenderingContext2D) => void;

const SIDES = ['top', 'right', 'bottom', 'left'];
const CORNERS = ['top-left', 'top-right', 'bottom-right', 'bottom-left'];
const WIDTHS = [50, 62.5, 75, 87.5, 100, 112.5, 125, 150, 200]; // font-stretch %, for its keywords
const STRETCH = ['ultra-condensed', 'extra-condensed', 'condensed', 'semi-condensed', 'normal', 'semi-expanded', 'expanded', 'extra-expanded', 'ultra-expanded'];
// Class rules do not reach an SVG drawn as an image: these go inline on every descendant.
const SVG_PROPS = [
  'fill', 'stroke', 'stroke-width', 'opacity', 'color', 'fill-opacity', 'stroke-opacity', 'fill-rule',
  'stroke-linecap', 'stroke-linejoin', 'stroke-dasharray', 'stroke-dashoffset', 'display', 'visibility',
  'transform', 'transform-origin', 'transform-box',
];

let set = ''; // the text state g holds now (the draw loop is synchronous, so one is enough)

/** Transparent in computed style: `transparent`, `rgba(…, 0)` or `… / 0)` (as in bigbang.ts). */
const clear = (c: string) => !c || c === 'transparent' || /^rgba\(.*,\s*0\)$/.test(c) || /\/\s*0\)$/.test(c);
/** A computed length or percentage (of `of`) in px. */
const len = (v: string, of: number) => (v.endsWith('%') ? (parseFloat(v) / 100) * of : parseFloat(v) || 0);
/** Canvas takes font-stretch as a keyword only: the nearest one. */
const stretch = (v: string) => {
  if (!v.endsWith('%')) return v;
  const p = parseFloat(v);
  return STRETCH[WIDTHS.reduce((b, w, i) => (Math.abs(w - p) < Math.abs(WIDTHS[b] - p) ? i : b), 0)];
};

/**
 * Draws the big bang's copies into one canvas the size of the viewport × dpr: first `under` (canvases already
 * sized to the viewport, e.g. canvas.field-fx, drawn stretched to fill it at their computed opacity, then dimmed as
 * .field's vignette dims them), then every child of `copies` in DOM order (= paint order). Resolves once images and
 * inline SVGs have decoded.
 */
export async function rasterize(copies: HTMLElement, under: HTMLCanvasElement[], dpr: number): Promise<HTMLCanvasElement> {
  const vw = innerWidth;
  const vh = innerHeight;
  const snap = (v: number) => Math.round(v * dpr) / dpr;
  // Read every rect and style first (one style and layout pass), starting the decodes; then draw.
  const space = under
    .filter((c) => c.width && c.height)
    .map((c) => {
      const s = getComputedStyle(c);
      return { c, o: Number(s.opacity), smooth: s.imageRendering !== 'pixelated' };
    });
  const vignette = getComputedStyle(document.documentElement).getPropertyValue('--field-vignette');
  // Each word's baseline, from the DOM: a 0×0 inline-block sits on it. Canvas rounds its font metrics to whole px and
  // Blink does not (Geist Mono lands 0.5px off). All go in before the first read, so it is still one layout.
  const els = [...copies.children];
  const probes = els.map((el) => {
    if (!(el instanceof HTMLSpanElement)) return null;
    const p = document.createElement('i');
    p.style.cssText = 'display:inline-block;width:0;height:0';
    return el.appendChild(p);
  });
  const kids = els.map((el, i) => {
    const r = el.getBoundingClientRect();
    const s = getComputedStyle(el);
    const o = Number(s.opacity);
    if (!o || !r.width || !r.height) return null;
    // Boxes and images on device pixels, as the DOM snaps them (crisp hairlines); text keeps its subpixel x.
    const b = new DOMRect(snap(r.left), snap(r.top), snap(r.right) - snap(r.left), snap(r.bottom) - snap(r.top));
    const p = probes[i];
    const d =
      p ? word(el as HTMLElement, s, r, p.getBoundingClientRect().bottom, snap)
      : el instanceof HTMLImageElement ? image(el, s, b)
      : el instanceof SVGSVGElement ? svg(el, s, b)
      : box(el, s, b);
    return { o, d };
  });
  for (const p of probes) p?.remove();
  const draws = await Promise.all(kids.map((k) => k?.d));

  const canvas = document.createElement('canvas');
  canvas.width = Math.round(vw * dpr);
  canvas.height = Math.round(vh * dpr);
  const g = canvas.getContext('2d');
  if (!g) throw new Error('rasterize: no 2d context');
  g.scale(dpr, dpr);
  for (const { c, o, smooth } of space) {
    g.globalAlpha = o;
    g.imageSmoothingEnabled = smooth;
    g.drawImage(c, 0, 0, c.clientWidth, c.clientHeight); // its CSS box, which leaves out a classic scrollbar
  }
  g.globalAlpha = 1;
  g.imageSmoothingEnabled = true;
  if (space.length) vignetted(g, vw, vh, vignette);
  set = '';
  // Connected (hidden), canvas text takes the page's -webkit-font-smoothing: detached it draws ~20% bolder on macOS.
  canvas.hidden = true;
  document.body.append(canvas);
  kids.forEach((k, i) => {
    const d = draws[i];
    if (!k || !d) return;
    g.globalAlpha = k.o;
    d(g);
  });
  canvas.remove();
  canvas.hidden = false;
  return canvas;
}

/**
 * .field lies over the dust with `radial-gradient(ellipse at 50% 40%, transparent 30%, var(--field-vignette))`;
 * this canvas lies over .field, so the dust takes the same dimming as alpha (the grain is left out).
 */
function vignetted(g: CanvasRenderingContext2D, vw: number, vh: number, color: string) {
  g.fillStyle = 'transparent';
  g.fillStyle = color; // canvas normalises it: #rrggbb, or rgba(r, g, b, a)
  const a = g.fillStyle.startsWith('rgba') ? parseFloat(g.fillStyle.split(',')[3]) : 1;
  if (!a) return;
  // farthest-corner ellipse, with farthest-side's aspect (k = rx / ry); a canvas gradient is a circle, so squash y.
  const cx = vw / 2;
  const cy = vh * 0.4;
  const k = cx / Math.max(cy, vh - cy);
  const rx = Math.hypot(cx, Math.max(cy, vh - cy) * k);
  const grad = g.createRadialGradient(0, 0, 0, 0, 0, rx);
  grad.addColorStop(0.3, '#000');
  grad.addColorStop(1, `rgb(0 0 0 / ${1 - a})`);
  g.save();
  g.globalCompositeOperation = 'destination-in';
  g.translate(cx, cy);
  g.scale(1, 1 / k);
  g.fillStyle = grad;
  g.fillRect(-cx, -cy * k, vw, vh * k);
  g.restore();
}

/**
 * A word (or a run of words on one line) at its DOM baseline `base`, snapped to a device pixel: the DOM snaps display
 * type that canvas draws as paths (163px Geist Pixel was 0.24px off unsnapped). Measured pixel-exact at dpr 2.
 * ponytail: at dpr 1 and 3 Blink rounds some baseline fractions the other way (dpr 1: [0.25, 0.5) goes down in
 * canvas, up in the DOM), so those words sit 1 device px off; a per-dpr rounding rule if it shows in the crossfade.
 * ponytail: canvas has no font-variation-settings, font-feature-settings or font-variant-numeric, and no skip-ink.
 * Geist Pixel's "ELSH" 1 draws pixel-identical to its default instance (measured), so nothing is lost today; a
 * setting that shows needs a FontFace clone of the family with `variationSettings` (Chrome 140+, Firefox).
 */
function word(el: HTMLElement, s: CSSStyleDeclaration, r: DOMRect, base: number, snap: (v: number) => number): Draw | null {
  const color = s.color;
  const t = el.textContent ?? '';
  const tt = s.textTransform;
  const text =
    tt === 'uppercase' ? t.toUpperCase()
    : tt === 'lowercase' ? t.toLowerCase()
    : tt === 'capitalize' ? t.replace(/(^|\s)(\S)/g, (_, a: string, b: string) => a + b.toUpperCase())
    : t;
  const font = `${s.fontStyle} ${s.fontWeight} ${stretch(s.getPropertyValue('font-stretch'))} ${s.fontSize} ${s.fontFamily}`;
  const ls = s.letterSpacing === 'normal' ? '0px' : s.letterSpacing;
  const ws = s.wordSpacing === 'normal' ? '0px' : s.wordSpacing;
  const key = `${font}|${ls}|${ws}`;
  const size = parseFloat(s.fontSize);
  // Blink puts an underline with a set offset at baseline + round(offset); auto guesses the font's own position.
  const under = s.textDecorationLine.includes('underline') && !clear(s.textDecorationColor);
  const th = Math.max(1, Math.round(len(s.textDecorationThickness, size) || size / 10));
  const off = s.textUnderlineOffset === 'auto' ? size * 0.1 : Math.round(len(s.textUnderlineOffset, size));
  const deco = s.textDecorationColor;
  const y = snap(base);
  const uy = snap(y + off);
  if (!text.trim() || (clear(color) && !under)) return null;
  return (g) => {
    if (set !== key) {
      set = key;
      g.font = font;
      g.letterSpacing = ls;
      g.wordSpacing = ws;
    }
    if (under) {
      g.fillStyle = deco;
      g.fillRect(r.left, uy, r.width, th);
    }
    g.fillStyle = color;
    g.fillText(text, r.left, y);
  };
}

/** A box: its fill, its borders (one ring per colour), and a .hud's eight corner-bracket bars (.hud::before). */
function box(el: Element, s: CSSStyleDeclaration, { x, y, width: w, height: h }: DOMRect): Draw {
  const bg = s.backgroundColor;
  const bw = SIDES.map((d) => parseFloat(s.getPropertyValue(`border-${d}-width`)) || 0); // 0 unless solid-ish
  const bc = SIDES.map((d) => s.getPropertyValue(`border-${d}-color`));
  const rad = CORNERS.map((c) => {
    const [a, b = a] = s.getPropertyValue(`border-${c}-radius`).split(' ');
    return { x: len(a, w), y: len(b, h) };
  });
  const hud = el.classList.contains('hud')
    ? { c: s.getPropertyValue('--hud-c').trim(), l: parseFloat(s.getPropertyValue('--hud-len')), w: parseFloat(s.getPropertyValue('--hud-w')) }
    : null;
  const round = rad.some((p) => p.x > 0 && p.y > 0);
  // ponytail: dashed and dotted borders draw solid; where two colours meet at a corner they overlap, not mitre.
  const shape = (g: CanvasRenderingContext2D, t: number[]) => {
    const iw = Math.max(0, w - t[1] - t[3]);
    const ih = Math.max(0, h - t[0] - t[2]);
    if (!round) return g.rect(x + t[3], y + t[0], iw, ih);
    // Inner corners: the outer radius less the two borders that meet there (tl: left and top, tr: right and top…).
    const ins = rad.map((p, i) => ({ x: Math.max(0, p.x - t[i === 0 || i === 3 ? 3 : 1]), y: Math.max(0, p.y - t[i < 2 ? 0 : 2]) }));
    g.roundRect(x + t[3], y + t[0], iw, ih, ins);
  };
  const none = [0, 0, 0, 0];
  return (g) => {
    if (!clear(bg)) {
      g.beginPath();
      shape(g, none);
      g.fillStyle = bg;
      g.fill();
    }
    for (const c of new Set(bc.filter((c, i) => bw[i] > 0 && !clear(c)))) {
      g.beginPath();
      shape(g, none);
      shape(g, bw.map((v, i) => (bc[i] === c ? v : 0)));
      g.fillStyle = c;
      g.fill('evenodd');
    }
    if (!hud || clear(hud.c)) return;
    // .hud::before: inset -1px from the padding box; a len × w and a w × len bar in each corner.
    const bx = x + bw[3] - 1;
    const by = y + bw[0] - 1;
    const W = w - bw[1] - bw[3] + 2;
    const H = h - bw[0] - bw[2] + 2;
    g.fillStyle = hud.c;
    for (const [u, v] of [[0, 0], [1, 0], [0, 1], [1, 1]]) {
      g.fillRect(bx + u * (W - hud.l), by + v * (H - hud.w), hud.l, hud.w);
      g.fillRect(bx + u * (W - hud.w), by + v * (H - hud.l), hud.w, hud.l);
    }
  };
}

/** An image, fitted as object-fit and object-position place it. Cross-origin sources are skipped: they taint. */
async function image(el: HTMLImageElement, s: CSSStyleDeclaration, r: DOMRect): Promise<Draw | null> {
  const src = new URL(el.currentSrc || el.src, location.href);
  if (!/^(data|blob):$/.test(src.protocol) && src.origin !== location.origin) return null;
  const fit = s.objectFit;
  const [px = '50%', py = '50%'] = s.objectPosition.split(' '); // ponytail: the 2-value form; the site uses no other
  const filter = s.filter;
  if (!(await el.decode().then(() => true, () => false))) return null;
  const nw = el.naturalWidth || r.width;
  const nh = el.naturalHeight || r.height;
  const cover = Math.max(r.width / nw, r.height / nh);
  const contain = Math.min(r.width / nw, r.height / nh);
  const k = fit === 'cover' ? cover : fit === 'contain' ? contain : fit === 'none' ? 1 : fit === 'scale-down' ? Math.min(1, contain) : 0;
  const dw = k ? nw * k : r.width; // fill: stretched to the box
  const dh = k ? nh * k : r.height;
  const dx = r.left + len(px, r.width - dw);
  const dy = r.top + len(py, r.height - dh);
  return (g) => {
    g.save();
    g.beginPath();
    g.rect(r.left, r.top, r.width, r.height);
    g.clip();
    g.filter = filter; // the grayscale on project and avatar images
    g.drawImage(el, dx, dy, dw, dh);
    g.restore();
  };
}

/** An inline SVG: a clone with every descendant's computed look inline, drawn as a data: image at its rect. */
async function svg(el: SVGSVGElement, s: CSSStyleDeclaration, r: DOMRect): Promise<Draw | null> {
  const copy = el.cloneNode(true) as SVGSVGElement;
  const from = el.querySelectorAll('*');
  copy.querySelectorAll<SVGElement>('*').forEach((n, i) => {
    const c = getComputedStyle(from[i]);
    n.style.cssText += `;${SVG_PROPS.map((p) => `${p}:${c.getPropertyValue(p)}`).join(';')}`;
  });
  copy.removeAttribute('style'); // its place, opacity and filter are the canvas's to apply
  copy.setAttribute('width', String(r.width));
  copy.setAttribute('height', String(r.height));
  const filter = s.filter;
  const img = new Image();
  img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(new XMLSerializer().serializeToString(copy))}`;
  if (!(await img.decode().then(() => true, () => false))) return null;
  return (g) => {
    g.filter = filter;
    g.drawImage(img, r.left, r.top, r.width, r.height);
    g.filter = 'none';
  };
}
