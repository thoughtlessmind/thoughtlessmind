// Easter eggs: found-state (localStorage), HUD toasts, the coordinate eggs in the home hero (terminal, warp,
// launch), the launch and warp themselves, and the DevTools greeting. The terminal (Terminal.astro) imports from
// here. Per-page listeners and timers start on astro:page-load and are torn down on astro:before-swap.
//
//   data-egg="<id>"   marks that egg found when the page loads (the 404 page)
//   data-egg-hint     the hero's CURSOR row: an arrow toward the nearest hidden point (a lock once reached) and
//                     its coordinates ([data-egg-hint-text])
//   data-tele         the telemetry panel: the launch pad sits just left of it
//   data-egg-mark     the ring button drawn on a reached point
//   terminal:open     window CustomEvent (no detail): Terminal.astro opens
//   signal:pulse      window CustomEvent, detail { x, y } in viewport px: the launch pad at liftoff
//   signal:warp       window CustomEvent (no detail): the 3D scene plays its warp
import { SITE } from '../consts';

// Ids are stored in localStorage: keep them stable.
export const EGGS = [
  { id: 'terminal', name: 'Terminal', hint: 'the operator sits at LOC x10 on the home page' },
  { id: 'launch', name: 'Launch', hint: 'find the pad by the home telemetry panel' },
  { id: 'warp', name: 'Warp', hint: 'aim for the heart of the planet on the home page' },
  { id: 'devtools', name: 'Console', hint: 'the browser console has a message for you' },
  { id: '404', name: 'Signal lost', hint: 'go somewhere that does not exist' },
  { id: 'sudo', name: 'Sudo', hint: 'ask for more power than you have' },
] as const;
export type EggId = (typeof EGGS)[number]['id'];

export const LOGO = [
  '██████   ██   ██',
  '██   ██  ██  ██ ',
  '██████   █████  ',
  '██  ██   ██  ██ ',
  '██   ██  ██   ██',
].join('\n');

const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

let ac: AbortController | undefined;
const timers = new Set<number>();
let raf = 0;
let rocket: HTMLCanvasElement | undefined;
let launching = false;
let have: EggId[] | undefined; // mirrors storage, so a blocked localStorage still counts within the page

function later(fn: () => void, ms: number) {
  const id = window.setTimeout(() => {
    timers.delete(id);
    fn();
  }, ms);
  timers.add(id);
}

export function found(): EggId[] {
  if (!have) {
    try {
      const ids: unknown = JSON.parse(localStorage.getItem('eggs') ?? '[]');
      have = EGGS.map((e) => e.id).filter((id) => Array.isArray(ids) && ids.includes(id));
    } catch {
      have = [];
    }
  }
  return have;
}

/** Records the egg and shows the toast. Returns the toast text when the egg is new, '' otherwise. */
export function markFound(id: EggId) {
  const list = found();
  if (list.includes(id)) return '';
  list.push(id);
  try {
    localStorage.setItem('eggs', JSON.stringify(list));
  } catch {}
  const text = `Egg found ${list.length}/${EGGS.length} · ${EGGS.find((e) => e.id === id)!.name}`;
  toast(text);
  return text;
}

/** A HUD toast, bottom-right, in the page's live region. */
export function toast(text: string, ms = 3000) {
  const region = document.querySelector('[data-egg-toasts]');
  if (!region) return;
  const el = document.createElement('p');
  el.className = 'egg-toast hud hud--solid label';
  el.textContent = text;
  region.append(el);
  later(() => el.remove(), ms);
  return el;
}

// Pixel rocket, one character per pixel: T body, S window, A fins, F/Y flame (two frames).
const P = 6;
const FLIGHT = 1600;
const ROCKET = [
  '....T....',
  '...TTT...',
  '...TTT...',
  '..TTTTT..',
  '..TTSTT..',
  '..TTTTT..',
  '..TTTTT..',
  '..TTTTT..',
  '.ATTTTTA.',
  'AATTTTTAA',
  'AA.TTT.AA',
];
const FLAMES = [
  ['...FYF...', '....F....'],
  ['...FFF...', '...FYF...', '....F....'],
];

/**
 * T-3 · T-2 · T-1 · Liftoff, then the rocket (from client x `pad`, else a random spot).
 * `quiet` skips the reduced-motion toast (the terminal prints it).
 */
export function launch(quiet = false, pad?: number) {
  if (reduced()) {
    if (!quiet) toast('Liftoff confirmed (reduced motion)');
    return 'Liftoff confirmed (reduced motion).';
  }
  if (launching) return 'Already in flight.';
  launching = true;
  const steps = ['T-3', 'T-2', 'T-1', 'Liftoff'];
  const board = toast(steps[0], steps.length * 700 + 900);
  steps.forEach((_, i) => {
    if (i) later(() => board && (board.textContent = steps.slice(0, i + 1).join(' · ')), i * 700);
  });
  later(() => fly(pad), (steps.length - 1) * 700);
  return 'Countdown started. Watch the bottom of the screen.';
}

function fly(pad?: number) {
  const de = document.documentElement;
  const w = de.clientWidth;
  const h = de.clientHeight;
  const dpr = Math.min(devicePixelRatio || 1, 2);
  const canvas = document.createElement('canvas');
  canvas.className = 'egg-rocket';
  canvas.setAttribute('aria-hidden', 'true');
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  document.body.append(canvas);
  rocket = canvas;
  // An open terminal is a modal <dialog> in the top layer; a popover joins the top layer above it.
  if ('showPopover' in canvas) {
    canvas.popover = 'manual';
    canvas.showPopover();
  }
  const ctx = canvas.getContext('2d');
  if (!ctx) return land();
  ctx.scale(dpr, dpr);

  const css = getComputedStyle(de);
  const ink = (name: string) => css.getPropertyValue(name).trim();
  const INK: Record<string, string> = { T: ink('--text'), S: ink('--signal'), A: ink('--accent'), F: ink('--accent'), Y: ink('--accent-hover') };
  const smoke = ink('--text-subtle');
  const snap = (n: number) => Math.round(n / P) * P;
  const left = snap(pad === undefined ? w * (0.25 + Math.random() * 0.5) : pad - (ROCKET[0].length * P) / 2);
  const cx = left + (ROCKET[0].length * P) / 2;
  const height = (ROCKET.length + 3) * P;
  const trail: { x: number; y: number; vx: number; vy: number; age: number; life: number }[] = [];
  const sprite = (rows: string[], top: number) =>
    rows.forEach((row, j) =>
      [...row].forEach((c, i) => {
        if (c === '.') return;
        ctx.fillStyle = INK[c];
        ctx.fillRect(left + i * P, top + j * P, P, P);
      }),
    );

  window.dispatchEvent(new CustomEvent('signal:pulse', { detail: { x: cx, y: h } }));
  const t0 = performance.now();
  let last = t0;
  let prev = h;
  const tick = (now: number) => {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    const t = (now - t0) / FLIGHT;
    ctx.clearRect(0, 0, w, h);
    // Exhaust: pixel squares that drift down and fade in 4 steps, orange first, then smoke.
    for (let i = trail.length - 1; i >= 0; i--) {
      const p = trail[i];
      p.age += dt;
      if (p.age >= p.life) {
        trail.splice(i, 1);
        continue;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      const k = p.age / p.life;
      ctx.globalAlpha = Math.ceil((1 - k) * 4) / 4;
      ctx.fillStyle = k < 0.3 ? INK.F : smoke;
      ctx.fillRect(snap(p.x), snap(p.y), P, P);
    }
    ctx.globalAlpha = 1;
    if (t < 1) {
      const top = snap(h - (h + height) * t * t); // ease-in: it accelerates off the top
      const nozzle = top + ROCKET.length * P;
      for (let i = 0; i < 3; i++) {
        trail.push({
          x: cx - P / 2 + (Math.random() - 0.5) * 3 * P,
          y: nozzle + Math.random() * Math.max(P, prev - nozzle), // fill the gap left by a fast frame
          vx: (Math.random() - 0.5) * 40,
          vy: 20 + Math.random() * 60,
          age: 0,
          life: 0.5 + Math.random() * 0.7,
        });
      }
      prev = nozzle;
      sprite(ROCKET, top);
      sprite(FLAMES[Math.floor(now / 90) % 2], nozzle);
    }
    if (t < 1 || trail.length) raf = requestAnimationFrame(tick);
    else land();
  };
  raf = requestAnimationFrame(tick);
}

function land() {
  cancelAnimationFrame(raf);
  rocket?.remove();
  rocket = undefined;
  launching = false;
}

/** Asks the 3D scene to warp. The scene only runs on some pages and devices; say so when it is not there. */
export function warp(quiet = false) {
  // The scene sets data-scene="on" only while WebGL is mounted and rendering (never on articles or in the fallback).
  if (reduced() || document.documentElement.dataset.scene !== 'on') {
    if (!quiet) toast('Warp drive offline on this page');
    return 'Warp drive offline on this page.';
  }
  window.dispatchEvent(new CustomEvent('signal:warp'));
  return 'Engaging warp drive.';
}

// Coordinate eggs: hidden points in the home hero, fine pointers only (motion or not). Within NEAR px of a point
// the CURSOR row shows its coordinates; within REACH a ring button appears on it (and stays within KEEP), and
// clicking it fires the egg. A point counts only while it is inside the hero, on screen and not over text, a
// control or a panel. After a click that point stays quiet until the pointer moves KEEP away; it can be fired again.
const NEAR = 200;
const REACH = 16;
const KEEP = 48;
const SOLID = 'a, button, input, select, textarea, label, header, img, svg, .hud';

type Spot = {
  id: EggId;
  label: string;
  x: number;
  y: number;
  free?: boolean; // cached cover test at (fx, fy), cleared on scroll/resize or when the point moves
  fx?: number;
  fy?: number;
  place: (s: Spot) => boolean; // sets x/y in client px; false when the point does not exist right now
  fire: (s: Spot) => void;
};

let hero: HTMLElement | null = null;
let hint: HTMLElement | null = null;
let hintText: HTMLElement | null = null;
let arrow: SVGTransform | undefined; // the hint arrow's rotate(), set in place (no per-frame allocation)
let mark: HTMLButtonElement | null = null;
let anchor: HTMLElement | null = null;
let panel: HTMLElement | null = null;
let px = -1e4;
let py = -1e4;
let queued = 0;
let shown: Spot | undefined; // marker is up on this point
let spent: Spot | undefined; // just fired: no marker until the pointer leaves
let hinted: Spot | undefined;
let hx = -1;
let hy = -1;
let mx = -1;
let my = -1;
let range: Range | undefined;

const SPOTS: Spot[] = [
  {
    // The operator's longitude and latitude x10 (LOC 28.6139° N, 77.2090° E): a fixed client point.
    id: 'terminal',
    label: 'Open hidden terminal',
    x: 772,
    y: 286,
    place: () => true,
    fire: () => dispatchEvent(new CustomEvent('terminal:open')), // Terminal.astro marks it found
  },
  {
    // The planet's core: the centre of the box the 3D scene draws it over, only while the scene runs.
    id: 'warp',
    label: 'Engage warp drive',
    x: 0,
    y: 0,
    place: (s) => {
      if (!anchor || document.documentElement.dataset.scene !== 'on') return false;
      const r = anchor.getBoundingClientRect();
      s.x = Math.round(r.left + r.width / 2);
      s.y = Math.round(r.top + r.height / 2);
      return true;
    },
    fire: () => {
      markFound('warp');
      warp();
    },
  },
  {
    // The launch pad: just left of the telemetry panel, level with its CURSOR row. Hero.astro keeps the panel
    // (at any size) far enough from the copy column that this spot stays in the gap.
    id: 'launch',
    label: 'Launch the rocket',
    x: 0,
    y: 0,
    place: (s) => {
      if (!panel) return false;
      const r = panel.getBoundingClientRect();
      s.x = Math.round(r.left - 32);
      s.y = Math.round(r.bottom - 16);
      return true;
    },
    fire: (s) => {
      markFound('launch');
      launch(false, s.x);
    },
  },
];

/** Nothing readable or clickable at (x, y): the topmost hit is a bare layout box, or a box with no text line there. */
function isFree(x: number, y: number) {
  for (const el of document.elementsFromPoint(x, y)) {
    if (mark?.contains(el)) continue;
    if (el.matches('html, body, main, section')) return true;
    if (el.closest(SOLID)) return false;
    range ??= document.createRange();
    range.selectNodeContents(el);
    for (const r of range.getClientRects()) {
      if (x > r.left - 4 && x < r.right + 4 && y > r.top - 4 && y < r.bottom + 4) return false;
    }
    return true;
  }
  return true;
}

const pad4 = (n: number) => String(n).padStart(4, '0');

function frame() {
  queued = 0;
  if (!hero || !hint || !mark) return;
  const h = hero.getBoundingClientRect();
  const top = Math.max(0, h.top);
  const bottom = Math.min(innerHeight, h.bottom);
  let best: Spot | undefined;
  let bestD = NEAR;
  let keep = false;
  for (const s of SPOTS) {
    const on = s.place(s) && s.x >= h.left && s.x <= Math.min(innerWidth, h.right) && s.y >= top && s.y <= bottom;
    const d = on ? Math.hypot(px - s.x, py - s.y) : Infinity;
    if (s === spent && d > KEEP) spent = undefined;
    if (d > NEAR) continue;
    if (s.free === undefined || s.fx !== s.x || s.fy !== s.y) {
      s.free = isFree(s.x, s.y);
      s.fx = s.x;
      s.fy = s.y;
    }
    if (!s.free) continue;
    if (d <= bestD) {
      best = s;
      bestD = d;
    }
    if (s === shown && d <= KEEP) keep = true;
  }

  const was = shown;
  if (!keep) shown = undefined;
  if (!shown && best && bestD <= REACH && best !== spent) shown = best;
  if (shown && (shown !== was || shown.x !== mx || shown.y !== my)) {
    mx = shown.x;
    my = shown.y;
    mark.style.translate = `${shown.x}px ${shown.y}px`;
    mark.setAttribute('aria-label', shown.label);
    mark.classList.remove('is-fired');
  }
  mark.classList.toggle('is-on', !!shown);

  // Hint: [arrow toward the point | lock once the marker is up] X 0772 · Y 0286
  hint.hidden = !best;
  if (!best) {
    hinted = undefined;
    return;
  }
  if (best !== hinted || best.x !== hx || best.y !== hy) {
    hinted = best;
    hx = best.x;
    hy = best.y;
    if (hintText) hintText.textContent = `X ${pad4(hx)} · Y ${pad4(hy)}`;
  }
  hint.classList.toggle('is-locked', shown === best);
  arrow?.setRotate((Math.atan2(best.y - py, best.x - px) * 180) / Math.PI, 8, 8);
}

function schedule() {
  queued ||= requestAnimationFrame(frame);
}

function coordinates(signal: AbortSignal) {
  hint = document.querySelector('[data-egg-hint]');
  mark = document.querySelector('[data-egg-mark]');
  hero = hint?.closest('section') ?? null;
  if (!hint || !mark || !hero || !matchMedia('(pointer: fine)').matches) return;
  anchor = document.querySelector('[data-planet-anchor]');
  panel = document.querySelector('[data-tele]');
  hintText = hint.querySelector('[data-egg-hint-text]');
  arrow = hint.querySelector<SVGGElement>('.hero__egg-dir g')?.transform.baseVal.getItem(0);
  const moved = () => {
    for (const s of SPOTS) s.free = undefined;
    schedule();
  };
  addEventListener(
    'pointermove',
    (e) => {
      if (e.pointerType === 'touch') return;
      px = e.clientX;
      py = e.clientY;
      schedule();
    },
    { signal, passive: true },
  );
  document.documentElement.addEventListener(
    'pointerleave',
    () => {
      px = py = -1e4;
      schedule();
    },
    { signal },
  );
  addEventListener('scroll', moved, { signal, passive: true });
  addEventListener('resize', moved, { signal });
  mark.addEventListener(
    'click',
    () => {
      const s = shown;
      if (!s) return;
      spent = s;
      shown = undefined;
      mark!.classList.remove('is-on');
      mark!.classList.add('is-fired');
      s.fire(s);
    },
    { signal },
  );
}

function init() {
  cleanup();
  ac = new AbortController();
  const egg = document.querySelector<HTMLElement>('[data-egg]')?.dataset.egg;
  if (EGGS.some((e) => e.id === egg)) markFound(egg as EggId);
  coordinates(ac.signal);
}

function cleanup() {
  ac?.abort();
  for (const id of timers) clearTimeout(id);
  timers.clear();
  land();
  cancelAnimationFrame(queued);
  queued = 0;
  hero = hint = hintText = mark = anchor = panel = null;
  arrow = undefined;
  shown = spent = hinted = undefined;
  px = py = -1e4;
  for (const s of SPOTS) s.free = undefined;
}

document.addEventListener('astro:page-load', init);
document.addEventListener('astro:before-swap', cleanup);

// Once per full page load (module scripts do not re-run on ClientRouter swaps). Production only, or ?console.
if (import.meta.env.PROD || new URLSearchParams(location.search).has('console')) {
  const accent = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || 'inherit';
  console.log(
    `%c${LOGO}\n\n%cHey, you opened the console.\nHiring? ${SITE.email}\nSome coordinates on the home page aren't empty. Or say hi back: hi()`,
    `color:${accent};font-family:monospace;line-height:1`,
    'font-family:monospace;line-height:1.6',
  );
  (window as Window & { hi?: () => string }).hi = () => {
    markFound('devtools');
    return 'Hi. Hint: on the home page, the operator sits at LOC x10. Watch the cursor readout.';
  };
}
