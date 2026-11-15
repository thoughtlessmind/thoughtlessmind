// Bits: a faint field of 0s and 1s gathers, hexagon by hexagon, into the mark. Read row by row, the landed digits are
// the ASCII bits of "rajiv.me". Then the mark compiles: bits, pixels, vector.
import { LOGO, APO, MONO, X as LX, Y as LY, lerp, smooth, hash, hexSD, solid, type Env, type Splash } from './kit';

const BITS = [...'rajiv.me'].flatMap((ch) => [...ch.charCodeAt(0).toString(2).padStart(8, '0')].map(Number));

// Choreography, ms from the start.
const T = {
  fade: 250, fadeLag: 150,     // the field fades in over 0..400
  go: [380, 560, 740],         // each hexagon's first launch: A, B, C
  spread: 320,                 // launch window per hexagon, centre cells first
  fly: 500, flyJit: 80,        // flight time
  lock: 0.94,                  // flight progress where a bit lands (within ~0.5% of its path): its digit locks and it pops
  pop: 0.3, popDur: 260,       // the landing pop: extra alpha, and how long it takes to settle
  flyFlick: 125,               // a flying digit may change every 125 ms (8 a second at most)
  die: [550, 1350], dieDur: 350,   // the extra bits dissolve while the mark gathers
  sweep0: 1750, sweep: 220, cell: 100,   // compile: a diagonal sweep turns each digit into a block (the last bit lands ~1640)
  xf0: 2070, xf: 200,          // then the mosaic crossfades into the vector mark
};
const SOLID = T.xf0 + T.xf;    // 2270: the finished mark from here on
const EXTRA = 0.4;             // field bits that never land, as a share of the ones that do
// The compile sweep runs from the top-left of the mark to the bottom-right, a little steeper than 45 degrees.
const DIR = [0.45 / Math.hypot(0.45, 1), 1 / Math.hypot(0.45, 1)];
const SPAN = 25.98 * DIR[0] + 30 * DIR[1];

interface Cell { I: number; J: number; x: number; y: number; bx: number; by: number; bw: number; bh: number; tx: number; ty: number; cs: number; bit: number }
interface Bit {
  id: number; sx: number; sy: number; vx: number; vy: number; a0: number; fd: number; per: number; ph: number;
  t0: number; die: number;                  // launch time (Infinity: never), dissolve time (0: never)
  o: number; c: Cell | null;                // landing: its hexagon's alpha and its cell
  dur: number; tl: number; x0: number; y0: number; x1: number; y1: number;   // flight
}
interface Target { h: number; o: number; c: Cell; r: number; hx: number; hy: number }

let G: {
  P: Bit[]; L1: Bit[]; img: HTMLCanvasElement[]; hw: number; hh: number;
  mos: HTMLCanvasElement; vec: HTMLCanvasElement; ox: number; oy: number;
} | null = null;

function sprites(env: Env, cwPx: number, rhPx: number) {
  // A digit is drawn ~1500 times a frame, so it is a bitmap at device resolution, not fillText. Even sizes, so a
  // sprite placed at a whole device pixel stays crisp.
  const d = env.dpr, w = 2 * Math.ceil(cwPx * d / 2) + 2, h = 2 * Math.ceil(rhPx * d / 2) + 2;
  const img = ['0', '1'].map((ch) => {
    const cv = document.createElement('canvas'), x = cv.getContext('2d')!;
    cv.width = w; cv.height = h;
    x.font = `500 ${(rhPx * 0.8 * d).toFixed(2)}px ${MONO}`;
    x.fillStyle = env.ink; x.textAlign = 'center'; x.textBaseline = 'alphabetic';
    const m = x.measureText('0');
    x.fillText(ch, w / 2, h / 2 + (m.actualBoundingBoxAscent - m.actualBoundingBoxDescent) / 2);
    return cv;
  });
  return { w, h, img };
}

function init(env: Env) {
  const cam = { x: env.C0[0], y: env.C0[1], s: env.S0 }, s = cam.s, d = env.dpr;
  const snap = (v: number) => Math.round(v * d) / d;
  const X = (u: number) => LX(cam, u), Y = (v: number) => LY(cam, v);

  // The grid: hexagon centres are whole cells apart. A to B is (8.66, 5) = (a cells, b rows), a/b = 7/3, so a
  // cell is 0.74 as wide as a row is tall. b is 3, 6 or 9, whichever puts a row nearest 12 px.
  const b = [3, 6, 9].reduce((p, q) => (Math.abs(5 * s / q - 12) < Math.abs(5 * s / p - 12) ? q : p));
  const a = b * 7 / 3, A = LOGO[0], cw = (LOGO[1].x - A.x) / a, rh = (LOGO[1].y - A.y) / b;
  const spr = sprites(env, cw * s, rh * s), hw = spr.w / 2 / d, hh = spr.h / 2 / d;

  // One hexagon's cells, relative to its centre (which sits on a cell corner, so the pattern is symmetric).
  const pat: [number, number, number][] = [];
  for (let i = -a; i < a; i++) for (let j = -2 * b; j < 2 * b; j++) {
    const dx = (i + 0.5) * cw, dy = (j + 0.5) * rh;
    if (Math.abs(dx) <= 8.66 && Math.abs(dy) <= 10 - Math.abs(dx) / Math.sqrt(3)) pat.push([i, j, 1 + hexSD(dx, dy) / APO]);
  }

  // Cells of the union, keyed by grid index from A's centre. All bits in one cell show that cell's bit.
  const cells = new Map<number, Cell>(), land: Target[] = [];
  LOGO.forEach((hx, h) => {
    const I0 = Math.round((hx.x - A.x) / cw), J0 = Math.round((hx.y - A.y) / rh);
    for (const [i, j, r] of pat) {
      const I = I0 + i, J = J0 + j, key = I * 1000 + J;
      let c = cells.get(key);
      if (!c) {
        const u = A.x + (I + 0.5) * cw, v = A.y + (J + 0.5) * rh;
        // The block: cell edges snapped to device pixels, so neighbouring blocks meet without seams.
        const x0 = snap(X(u - cw / 2)), x1 = snap(X(u + cw / 2)), y0 = snap(Y(v - rh / 2)), y1 = snap(Y(v + rh / 2));
        c = { I, J, x: X(u), y: Y(v), bx: x0, by: y0, bw: x1 - x0, bh: y1 - y0,
          // landed sprite centre, placed so the sprite's corner is on a whole device pixel
          tx: snap(X(u) - hw) + hw, ty: snap(Y(v) - hh) + hh,
          cs: T.sweep0 + ((u * DIR[0] + v * DIR[1]) / SPAN) * T.sweep, bit: 0 };
        cells.set(key, c);
      }
      land.push({ h, o: hx.o, c, r, hx: X(hx.x), hy: Y(hx.y) });
    }
  });
  [...cells.values()].sort((p, q) => p.J - q.J || p.I - q.I).forEach((c, k) => { c.bit = BITS[k % BITS.length]; });

  // The field: a jittered grid over the viewport, so the bits are even rather than clumped, dealt out at random.
  const N = land.length + Math.round(land.length * EXTRA), W = env.W, H = env.H;
  const cols = Math.max(1, Math.round(Math.sqrt(N * W / H))), rows = Math.ceil(N / cols), slots: [number, number][] = [];
  for (let k = 0; k < cols * rows; k++) {
    slots.push([((k % cols) + 0.15 + 0.7 * hash(k, 1)) / cols * W, (Math.floor(k / cols) + 0.15 + 0.7 * hash(k, 2)) / rows * H]);
  }
  for (let k = slots.length - 1; k > 0; k--) { const j = Math.floor(hash(k, 3) * (k + 1)); [slots[k], slots[j]] = [slots[j], slots[k]]; }

  const P: Bit[] = [];
  const field = (id: number, [sx, sy]: [number, number]): Bit => {
    const ang = hash(id, 4) * Math.PI * 2, sp = (4 + 6 * hash(id, 5)) / 1000;   // drift, px per ms
    return { id, sx, sy, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp, a0: 0.15 + 0.12 * hash(id, 6),
      fd: hash(id, 7) * T.fadeLag, per: 300 + 400 * hash(id, 8), ph: hash(id, 9) * 1000, t0: Infinity, die: 0,
      o: 0, c: null, dur: 0, tl: Infinity, x0: 0, y0: 0, x1: 0, y1: 0 };
  };
  // The extras first, so they sit behind the mark.
  for (let k = land.length; k < N; k++) {
    const p = field(k, slots[k]);
    p.die = lerp(T.die[0], T.die[1], hash(k, 10));
    P.push(p);
  }
  // Each hexagon's sources and targets, both sorted by angle around its centre and matched in order, so the paths
  // converge without crossing much.
  let k0 = 0;
  for (let h = 0; h < LOGO.length; h++) {
    const tg = land.filter((q) => q.h === h), n = tg.length;
    const ang = (x: number, y: number) => Math.atan2(y - tg[0].hy, x - tg[0].hx);
    const src = slots.slice(k0, k0 + n).map((sl, j) => ({ sl, id: k0 + j })).sort((p, q) => ang(...p.sl) - ang(...q.sl));
    tg.sort((p, q) => ang(p.c.x, p.c.y) - ang(q.c.x, q.c.y));
    tg.forEach((q, j) => {
      const p = field(src[j].id, src[j].sl), id = p.id;
      p.o = q.o; p.c = q.c;
      p.t0 = T.go[h] + T.spread * (0.7 * q.r + 0.3 * hash(id, 11));
      p.dur = T.fly + T.flyJit * hash(id, 12);
      p.tl = p.t0 + T.lock * p.dur;
      // Quadratic path from where it is at launch; the control point bends every path the same way, a slow swirl.
      p.x0 = p.sx + p.vx * p.t0; p.y0 = p.sy + p.vy * p.t0;
      const dx = q.c.tx - p.x0, dy = q.c.ty - p.y0, bend = 0.12 + 0.16 * hash(id, 13);
      p.x1 = p.x0 + dx / 2 - dy * bend; p.y1 = p.y0 + dy / 2 + dx * bend;
      P.push(p);
    });
    k0 += n;
  }
  const L1 = P.filter((p) => p.c);

  // The two ends of the crossfade, drawn once: the mosaic of blocks and the vector mark, each in the mark's box.
  const ox = Math.floor((X(0) - 2 * cw * s) * d), oy = Math.floor((Y(0) - 2 * rh * s) * d);
  const ow = Math.ceil((X(25.98) + 2 * cw * s) * d) - ox, oh = Math.ceil((Y(30) + 2 * rh * s) * d) - oy;
  const off = () => { const cv = document.createElement('canvas'); cv.width = ow; cv.height = oh; return cv; };
  const mos = off(), vec = off(), m = mos.getContext('2d')!;
  m.fillStyle = env.ink;
  for (const p of L1) { const q = p.c!; m.globalAlpha = p.o; m.fillRect(q.bx * d - ox, q.by * d - oy, q.bw * d, q.bh * d); }
  solid(vec.getContext('2d')!, { x: cam.x * d - ox, y: cam.y * d - oy, s: s * d }, env.ink);

  G = { P, L1, img: spr.img, hw, hh, mos, vec, ox, oy };
}

const digit = (p: Bit, t: number, per: number) => (hash(p.id + 0.5, Math.floor((t + p.ph) / per)) < 0.5 ? 0 : 1);

function draw(c: CanvasRenderingContext2D, t: number, cam: { x: number; y: number; s: number }, env: Env) {
  if (t >= SOLID || !G) { solid(c, cam, env.ink); return; }
  const { P, L1, img, hw, hh } = G, sw = hw * 2, sh = hh * 2;

  if (t >= T.xf0) {
    // Mosaic to vector: (1 - k) of one plus k of the other, added, so the inside never dims mid-fade.
    const k = smooth(T.xf0, SOLID, t), d = env.dpr;
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.globalAlpha = 1 - k; c.drawImage(G.mos, G.ox, G.oy);
    c.globalCompositeOperation = 'lighter';
    c.globalAlpha = k; c.drawImage(G.vec, G.ox, G.oy);
    c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
    c.setTransform(d, 0, 0, d, 0, 0);
    return;
  }

  if (t >= T.sweep0) {
    // Compile: as the sweep passes a cell its digits swell into a block.
    c.fillStyle = env.ink;
    for (const p of L1) {
      const q = p.c!, k = smooth(q.cs, q.cs + T.cell, t);
      if (k < 1) { c.globalAlpha = p.o * (1 - k); c.drawImage(img[q.bit], q.tx - hw, q.ty - hh, sw, sh); }
      if (k <= 0) continue;
      c.globalAlpha = p.o * k;
      if (k >= 1) c.fillRect(q.bx, q.by, q.bw, q.bh);
      else { const z = lerp(0.45, 1, k), w = q.bw * z, h = q.bh * z; c.fillRect(q.x - w / 2, q.y - h / 2, w, h); }
    }
    c.globalAlpha = 1;
    return;
  }

  for (const p of P) {
    let a: number, x: number, y: number, n: number;
    if (t < p.t0) {
      // Waiting in the field: fade in, drift, flicker now and then; the extras dissolve.
      a = p.a0 * smooth(p.fd, p.fd + T.fade, t);
      if (p.die) a *= 1 - smooth(p.die, p.die + T.dieDur, t);
      if (a < 0.004) continue;
      x = p.sx + p.vx * t; y = p.sy + p.vy * t; n = digit(p, t, p.per);
    } else {
      const k = Math.min(1, (t - p.t0) / p.dur), q = p.c!;
      // Ease: a quick start, then a long soft landing.
      const e = 1 - Math.pow(1 - Math.pow(k, 1.5), 2), f = 1 - e;
      x = f * f * p.x0 + 2 * f * e * p.x1 + e * e * q.tx;
      y = f * f * p.y0 + 2 * f * e * p.y1 + e * e * q.ty;
      a = lerp(p.a0, p.o, 0.5 * e * e * e);   // stays faint in flight: bright means landed
      if (t >= p.tl) {
        const dt = t - p.tl;
        n = q.bit;
        // Landed: up to its hexagon's full alpha (the compile sweep starts from there), plus the pop.
        a = lerp(a, p.o, Math.min(1, dt / 40)) + T.pop * (dt < 40 ? dt / 40 : 1 - smooth(40, 40 + T.popDur, dt));
      } else n = digit(p, t, T.flyFlick);
    }
    c.globalAlpha = Math.min(1, a);
    c.drawImage(img[n], x - hw, y - hh, sw, sh);
  }
  c.globalAlpha = 1;
}

const bits: Splash = { dock: 2300, init, draw };
export default bits;
