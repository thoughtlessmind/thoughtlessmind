// Star field. The backdrop's dots are drawn here, on the persisted canvas.field-fx (the CSS .field on top
// of it holds only the vignette and grain). They are a seeded scatter: one candidate per --field-size cell,
// jittered inside it, ~30% of cells empty, three brightness levels, repeating every TILE cells, so the
// pattern is identical on every page and reload. 1 CSS px squares snapped to device pixels. A second,
// denser layer of dust stays invisible at rest.
//
// Where motion is allowed (fine pointer, no reduced motion, not an article) the pointer is a gravitational
// lens. Dots within RADIUS of an eased cursor move radially outward along the point-lens image mapping
// r' = (r + sqrt(r² + 4E²)) / 2, windowed back to rest by RADIUS: a clear core opens and the dots it held
// pile into a faint, slightly warm Einstein ring, joined by dust the lens magnifies into view. The field is
// a pure function of the lens position and strength (no trail); rAF runs only until the ease converges. A
// window `signal:pulse` ({x, y}, client px) sends a shockwave that shoves dots outward as it passes.
//
// The home page's black hole (three/BlackHole.tsx) is a second lens, with any pointer: `signal:hole` ({x, y, r},
// client px and its horizon radius, or null once it is gone) is sent whenever it moves. Its Einstein radius and
// reach scale with it; while it is dragged ({held: true}) it stands in for the pointer's lens.
// Everywhere else the field is drawn once (and on resize or theme change) and never animates. No
// allocation per frame.
//
// `signal:dawn` ({ms}) is the big bang's first stars (src/scripts/bigbang.ts): every dot goes dark, then each
// ignites once over ms, brightest level first, flickering on with the .flicker steps; rAF runs only until the
// last one is lit, on every page. ms 0 (or reduced motion) shows the whole field at once.

const TILE = 20; // cells per tile side (480px at 24px)
const EMPTY = 0.3; // share of empty cells
const MARGIN = 4; // px kept clear at each cell edge, so neighbours never touch
const LEVELS = [0.4, 0.68, 1, 0]; // rest brightness, as a share of --field-dot's alpha…
const ODDS = [0.55, 0.85]; // …picked 55% / 30% / 15%
const DUST = 3; // …and one dust point per cell, too faint to see until the lens magnifies it
const RADIUS = 150; // px of lens influence
const EINSTEIN = 32; // px: the clear core and the ring's inner edge
const RING = 48; // px of glow outside the ring's inner edge
const GLOW = 6; // colour steps from rest to ring
const RING_ALPHA = 3; // a ring dot's alpha, as a multiple of --field-dot's
const WARM = 0.25; // how far the ring leans toward --accent
const FOLLOW = 70; // ms time constant of the lens chasing the pointer
const FADE = 180; // ms time constant of the lens strength
const WAVE_RANGE = 420; // px the shockwave travels
const WAVE_MS = 800;
const WAVE_AMP = 12; // px peak shove
const WAVE_LEAD = 28; // px rising front (keeps dots from overtaking each other: AMP * 1.54 / LEAD < 1)
const WAVE_TAIL = 96; // px settling tail behind the front
const HOLE_E = 2.2; // the hole's Einstein radius, horizon radii
const HOLE_REACH = 10; // and its lens radius
const IGNITE_MS = 420; // one star flickering on (the .flicker keyframes)…
const IGNITE = [0, 0.8, 0.2, 1, 0.6]; // …each held a fifth of it, then 1
const DAWN_AT = [0.45, 0.25, 0, 0.45]; // earliest ignition per level (0 dim, 1, 2 bright, 3 dust), share of the dawn

const R2 = RADIUS * RADIUS;
const E4 = 4 * EINSTEIN * EINSTEIN;
const root = document.documentElement;
const fine = matchMedia('(pointer: fine)');
const calm = matchMedia('(prefers-reduced-motion: reduce)');

// One tile of dots, from a fixed seed (mulberry32).
const tileX: number[] = [];
const tileY: number[] = [];
const tileL: number[] = [];
let tilePx = 0;
function buildTile(pitch: number) {
  let seed = 0x51a7;
  const rand = () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  tileX.length = tileY.length = tileL.length = 0;
  tilePx = pitch * TILE;
  const span = pitch - 2 * MARGIN;
  for (let r = 0; r < TILE; r++) {
    for (let c = 0; c < TILE; c++) {
      const x = c * pitch + MARGIN + rand() * span;
      const y = r * pitch + MARGIN + rand() * span;
      const k = rand();
      if (rand() < EMPTY) continue;
      tileX.push(x);
      tileY.push(y);
      tileL.push(k < ODDS[0] ? 0 : k < ODDS[1] ? 1 : 2);
    }
  }
  for (let r = 0; r < TILE; r++) {
    for (let c = 0; c < TILE; c++) {
      tileX.push((c + rand()) * pitch);
      tileY.push((r + rand()) * pitch);
      tileL.push(DUST);
    }
  }
}

let canvas: HTMLCanvasElement | null = null;
let ctx: CanvasRenderingContext2D | null = null;
let live = false; // the lens and shockwaves may run
let dpr = 1;
let size = 1; // device px per dot
let n = 0;
let restX = new Float32Array(0);
let restY = new Float32Array(0);
let level = new Uint8Array(0);
let drawX = new Int32Array(0);
let drawY = new Int32Array(0);
let bucket = new Uint8Array(0);
let lit = new Int32Array(0); // indices drawn this frame
const colors: string[] = [];
let lx = 0; // eased lens position
let ly = 0;
let tx = 0; // pointer
let ty = 0;
let s = 0; // lens strength, eased toward target
let target = 0;
const waves = Array.from({ length: 3 }, () => ({ x: 0, y: 0, t0: 0, r: 0, a: 0, live: false }));
let hx = 0; // the black hole: centre, horizon radius, strength eased toward hTarget
let hy = 0;
let hr = 0;
let hs = 0;
let hTarget = 0;
let ox = 0; // push from the last lens() call
let oy = 0;
let raf = 0;
let last = 0;
let dawn0 = 0; // performance.now() when the stars began to ignite; 0 when they are not igniting
let dawnMs = 0;
let ignite = new Float32Array(0); // per dot: ms after dawn0 when it starts to flicker on
let shine = new Float32Array(0); // per dot: its alpha this frame, while igniting

function rgba(name: string, css: CSSStyleDeclaration) {
  ctx!.fillStyle = '#000';
  ctx!.fillStyle = css.getPropertyValue(name).trim(); // normalised to #rrggbb or rgba(r, g, b, a)
  const v = String(ctx!.fillStyle);
  if (v[0] === '#') {
    const h = parseInt(v.slice(1), 16);
    return [h >> 16, (h >> 8) & 255, h & 255, 1];
  }
  const [r, g, b, a = 1] = v.match(/[\d.]+/g)!.map(Number);
  return [r, g, b, a];
}

function readColors() {
  if (!ctx) return;
  const css = getComputedStyle(root);
  const dot = rgba('--field-dot', css);
  const hot = rgba('--accent', css);
  for (let l = 0; l < LEVELS.length; l++) {
    for (let k = 0; k < GLOW; k++) {
      const t = k / (GLOW - 1);
      const m = WARM * t * t;
      const rgb = [0, 1, 2].map((i) => Math.round(dot[i] + (hot[i] - dot[i]) * m)).join(' ');
      const alpha = Math.min(1, dot[3] * (LEVELS[l] + (RING_ALPHA - LEVELS[l]) * t));
      colors[l * GLOW + k] = `rgb(${rgb} / ${alpha.toFixed(3)})`;
    }
  }
}

function resize() {
  if (!canvas || !ctx) return;
  const pitch = parseFloat(getComputedStyle(root).getPropertyValue('--field-size')) || 24;
  if (pitch * TILE !== tilePx) buildTile(pitch);
  dpr = Math.min(2, devicePixelRatio || 1);
  size = Math.max(1, Math.round(dpr));
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  canvas.width = Math.round(w * dpr);
  canvas.height = Math.round(h * dpr);
  const cap = Math.ceil(w / tilePx) * Math.ceil(h / tilePx) * tileX.length;
  if (restX.length < cap) {
    restX = new Float32Array(cap);
    restY = new Float32Array(cap);
    level = new Uint8Array(cap);
    drawX = new Int32Array(cap);
    drawY = new Int32Array(cap);
    bucket = new Uint8Array(cap);
    lit = new Int32Array(cap);
    ignite = new Float32Array(cap);
    shine = new Float32Array(cap);
  }
  n = 0;
  for (let oy = 0; oy < h; oy += tilePx) {
    for (let ox = 0; ox < w; ox += tilePx) {
      for (let j = 0; j < tileX.length; j++) {
        const x = ox + tileX[j];
        const y = oy + tileY[j];
        if (x >= w || y >= h) continue;
        restX[n] = x;
        restY[n] = y;
        level[n++] = tileL[j];
      }
    }
  }
  draw();
}

/** Push (into ox, oy) of the dot at (x0, y0) by a lens at (cx, cy); returns its ring glow, 0..k. */
function lens(x0: number, y0: number, cx: number, cy: number, k: number, r2: number, e4: number, e: number) {
  ox = oy = 0;
  const dx = x0 - cx;
  const dy = y0 - cy;
  const d2 = dx * dx + dy * dy;
  if (d2 >= r2 || d2 === 0) return 0;
  const d = Math.sqrt(d2);
  const u = 1 - d2 / r2;
  const push = k * u * u * (Math.sqrt(d2 + e4) - d) * 0.5;
  ox = (dx / d) * push;
  oy = (dy / d) * push;
  const q = Math.max(0, (d + push - k * e) / RING);
  return q < 1 ? k * (1 - q) : 0;
}

function draw() {
  if (!canvas || !ctx) return;
  const pointer = s > 0.001;
  const hole = hs > 0.001 && hr > 0;
  const hR = hr * HOLE_REACH;
  const hE = hr * HOLE_E;
  const wave = waves[0].live || waves[1].live || waves[2].live;
  const t = dawn0 ? performance.now() - dawn0 : -1; // ms into the dawn, -1 when none
  let m = 0;
  for (let i = 0; i < n; i++) {
    if (level[i] === DUST && !pointer && !hole && !wave) continue;
    const x0 = restX[i];
    const y0 = restY[i];
    let x = x0;
    let y = y0;
    let g = 0;
    if (pointer) {
      g = lens(x0, y0, lx, ly, s, R2, E4, EINSTEIN);
      x += ox;
      y += oy;
    }
    if (hole) {
      g = Math.max(g, lens(x0, y0, hx, hy, hs, hR * hR, 4 * hE * hE, hE));
      x += ox;
      y += oy;
    }
    if (wave) {
      for (let j = 0; j < waves.length; j++) {
        const p = waves[j];
        if (!p.live) continue;
        const dx = x0 - p.x;
        const dy = y0 - p.y;
        const d = Math.sqrt(dx * dx + dy * dy);
        const u = d - p.r;
        const v = u > 0 ? u / WAVE_LEAD : -u / WAVE_TAIL;
        if (v >= 1 || d === 0) continue;
        const b = (1 - v * v) * (1 - v * v) * p.a;
        x += (dx / d) * b * WAVE_AMP;
        y += (dy / d) * b * WAVE_AMP;
        if (b * 0.6 > g) g = b * 0.6; // brightens, never magnifies
      }
    }
    const k = Math.min(GLOW - 1, Math.round(g * (GLOW - 1)));
    if (level[i] === DUST && k === 0) continue;
    if (t >= 0) {
      const p = (t - ignite[i]) / IGNITE_MS;
      const a = p >= 1 ? 1 : p <= 0 ? 0 : IGNITE[Math.floor(p * IGNITE.length)];
      if (a === 0) continue;
      shine[i] = a;
    }
    drawX[i] = Math.round(x * dpr);
    drawY[i] = Math.round(y * dpr);
    bucket[i] = level[i] * GLOW + k;
    lit[m++] = i;
  }
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (let b = 0; b < colors.length; b++) {
    const big = b % GLOW >= GLOW - 2; // the brightest ring images are magnified to 2 CSS px
    const sz = big ? size * 2 : size;
    const o = big ? size >> 1 : 0;
    let set = false;
    for (let j = 0; j < m; j++) {
      const i = lit[j];
      if (bucket[i] !== b) continue;
      if (!set) {
        ctx.fillStyle = colors[b];
        set = true;
      }
      if (t >= 0) ctx.globalAlpha = shine[i];
      ctx.fillRect(drawX[i] - o, drawY[i] - o, sz, sz);
    }
  }
  ctx.globalAlpha = 1;
}

function frame(now: number) {
  raf = 0;
  const dt = last ? Math.min(now - last, 64) : 16;
  last = now;
  const k = 1 - Math.exp(-dt / FOLLOW);
  lx += (tx - lx) * k;
  ly += (ty - ly) * k;
  s += (target - s) * (1 - Math.exp(-dt / FADE));
  let busy = false;
  if (Math.abs(tx - lx) < 0.1 && Math.abs(ty - ly) < 0.1) {
    lx = tx;
    ly = ty;
  } else busy = true;
  if (Math.abs(target - s) < 0.004) s = target;
  else busy = true;
  hs += (hTarget - hs) * (1 - Math.exp(-dt / FADE));
  if (Math.abs(hTarget - hs) < 0.004) hs = hTarget;
  else busy = true;
  for (let j = 0; j < waves.length; j++) {
    const p = waves[j];
    if (!p.live) continue;
    const t = Math.max(0, (now - p.t0) / WAVE_MS);
    if (t >= 1) {
      p.live = false;
      continue;
    }
    p.r = WAVE_RANGE * (1 - (1 - t) ** 3);
    p.a = 1 - t;
    busy = true;
  }
  if (dawn0) {
    if (now - dawn0 >= dawnMs) dawn0 = 0; // the last star is lit: this draw is the full field
    else busy = true;
  }
  draw();
  if (busy) raf = requestAnimationFrame(frame);
  else last = 0;
}

function wake() {
  if ((live || hTarget || hs || dawn0) && !raf && !document.hidden) raf = requestAnimationFrame(frame);
}

function sync() {
  const c = document.querySelector<HTMLCanvasElement>('.field-fx');
  if (c !== canvas) {
    canvas = c;
    ctx = c?.getContext('2d') ?? null;
    readColors();
    resize();
  }
  const on = !!ctx && fine.matches && !calm.matches && document.body.dataset.page !== 'article';
  if (calm.matches) hs = hTarget = 0;
  if (on === live) return;
  live = on;
  if (on) return;
  cancelAnimationFrame(raf);
  raf = last = 0;
  s = target = 0;
  for (const p of waves) p.live = false;
  draw();
}

window.addEventListener(
  'pointermove',
  (e) => {
    if (!live || e.pointerType === 'touch') return;
    tx = e.clientX;
    ty = e.clientY;
    if (target === 0) {
      lx = tx; // (re)entering: the lens appears under the pointer instead of sliding in
      ly = ty;
    }
    target = 1;
    wake();
  },
  { passive: true },
);
document.addEventListener('pointerout', (e) => {
  if (e.relatedTarget || !target) return; // left the window
  target = 0;
  wake();
});
// Contract for other scripts: window.dispatchEvent(new CustomEvent('signal:pulse', { detail: { x, y } })).
window.addEventListener('signal:pulse', (e) => {
  const d = (e as CustomEvent<{ x: number; y: number }>).detail;
  if (!live || !d || !Number.isFinite(d.x) || !Number.isFinite(d.y)) return;
  const p = waves.find((w) => !w.live) ?? waves.reduce((a, b) => (a.t0 < b.t0 ? a : b));
  Object.assign(p, { x: d.x, y: d.y, t0: performance.now(), r: 0, a: 1, live: true });
  wake();
});
window.addEventListener('signal:hole', (e) => {
  const d = (e as CustomEvent<{ x: number; y: number; r: number; held?: boolean } | null>).detail;
  if (!d || !ctx || calm.matches) {
    hTarget = 0;
  } else {
    hx = d.x;
    hy = d.y;
    hr = d.r;
    hTarget = 1;
    if (d.held) target = 0; // the pointer is on the hole: one lens, not two
  }
  wake();
});
// Contract: window.dispatchEvent(new CustomEvent('signal:dawn', { detail: { ms } })). Drawn synchronously, so the
// caller can show the canvas on the next line: dark (the first frame of a dawn) or, with ms 0, the full field.
window.addEventListener('signal:dawn', (e) => {
  const ms = Math.max(0, Number((e as CustomEvent<{ ms: number }>).detail?.ms) || 0);
  dawn0 = 0;
  if (ms && !calm.matches) {
    const span = Math.max(0, ms - IGNITE_MS);
    for (let i = 0; i < n; i++) ignite[i] = (DAWN_AT[level[i]] + Math.random() * 0.55) * span;
    dawn0 = performance.now();
    dawnMs = ms;
  }
  draw();
  wake();
});
window.addEventListener('resize', resize);
new MutationObserver(() => {
  readColors();
  draw();
}).observe(root, { attributes: true, attributeFilter: ['data-theme'] });
fine.addEventListener('change', sync);
calm.addEventListener('change', sync);
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) return wake();
  cancelAnimationFrame(raf);
  raf = last = 0;
});
document.addEventListener('astro:page-load', sync);
sync();
