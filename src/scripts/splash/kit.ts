// Shared kit for the splash screen: the mark's geometry, easing and drawing helpers.

export interface Cam { x: number; y: number; s: number }
export interface Env {
  W: number; H: number; dpr: number; mobile: boolean;
  S0: number; C0: [number, number];   // the mark in the middle: px per logo unit, centre
  S1: number; C1: [number, number];   // the header logo
  ink: string;                        // the theme's --ink
  logo: string;                       // --logo (hex)
}
/** The splash paints frame t (ms) as a pure function of t. By t = dock it shows the finished mark in ink at the centre. */
export interface Splash {
  dock: number;
  init?(env: Env): void;
  draw(c: CanvasRenderingContext2D, t: number, cam: Cam, env: Env): void;
}

// The mark, from favicon.svg: three pointy-top hexagons (circumradius 10), painted back to front, each at its own
// opacity. Their centres are 10 apart, so every hexagon's centre sits on a corner of the other two.
export const LOGO = [
  { x: 8.66, y: 15, o: 0.45 },
  { x: 17.32, y: 20, o: 0.65 },
  { x: 17.32, y: 10, o: 0.8 },
] as const;
export const MID = [12.99, 15] as const;   // the centre of the viewBox (-2.01 0 30 30)
export const APO = 8.660254;
export const MONO = '"Geist Mono Variable", "Geist Mono", ui-monospace, Menlo, monospace';

export const clamp = (x: number, a = 0, b = 1) => Math.max(a, Math.min(b, x));
export const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
export const smooth = (e0: number, e1: number, x: number) => { const k = clamp((x - e0) / (e1 - e0)); return k * k * (3 - 2 * k); };
export const io3 = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(2 - 2 * x, 3) / 2);
export const hash = (a: number, b = 0) => { const n = Math.sin(a * 12.9898 + b * 78.233) * 43758.5453; return n - Math.floor(n); };
const hex2rgb = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
export const mix = (a: string, b: string, k: number) => {
  const p = hex2rgb(a), q = hex2rgb(b);
  return `rgb(${p.map((v, i) => Math.round(lerp(v, q[i], k))).join(',')})`;
};

// Logo units to px through a camera: MID lands on (x, y), s px per unit.
export const X = (cam: Cam, u: number) => cam.x + (u - MID[0]) * cam.s;
export const Y = (cam: Cam, v: number) => cam.y + (v - MID[1]) * cam.s;

/** One pointy-top hexagon of circumradius 10 as a subpath, in logo units. */
export function hexPath(c: CanvasRenderingContext2D, cam: Cam, cx: number, cy: number) {
  for (let k = 0; k < 6; k++) {
    const a = -Math.PI / 2 + k * Math.PI / 3, x = X(cam, cx + 10 * Math.cos(a)), y = Y(cam, cy + 10 * Math.sin(a));
    if (k) c.lineTo(x, y); else c.moveTo(x, y);
  }
  c.closePath();
}

/** The finished mark, exactly as the SVG paints it: three fills at .45 / .65 / .8, back to front. */
export function solid(c: CanvasRenderingContext2D, cam: Cam, color: string) {
  c.fillStyle = color;
  for (const h of LOGO) { c.globalAlpha = h.o; c.beginPath(); hexPath(c, cam, h.x, h.y); c.fill(); }
  c.globalAlpha = 1;
}

/** Signed distance to a pointy-top hexagon of apothem r centred on the origin (after iq), in logo units. */
export function hexSD(px: number, py: number, r = APO) {
  let x = Math.abs(py), y = Math.abs(px);
  const kx = -0.866025404, ky = 0.5, kz = 0.577350269;
  const t = 2 * Math.min(kx * x + ky * y, 0);
  x -= t * kx; y -= t * ky;
  x -= clamp(x, -kz * r, kz * r); y -= r;
  return Math.hypot(x, y) * Math.sign(y);
}
