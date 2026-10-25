// The page-load intro. On a first visit (or with ?intro=machine|bits) the mark assembles in the middle of the screen,
// moves into the header logo, turns orange, and the content rises. The gate in BaseLayout's head decides before paint
// and sets html.intro and data-intro; this file plays it. Any click, key, wheel or touch skips to the end.
import { ORANGE, MONO, clamp, io3, mix, solid, type Env, type Intro } from './kit';
import machine from './machine';
import bits from './bits';

const INTROS: Record<string, Intro> = { machine, bits };
// ms: the move to the header, the tint to orange, how long after the move starts the content rises, and how long the
// rises take (800 ms plus the last element's delay).
const DOCK = 800, TINT = 350, CONTENT = 200, RISE = 1200;
const SKIP = ['pointerdown', 'keydown', 'wheel', 'touchstart'];

const root = document.documentElement;
const intro = INTROS[root.dataset.intro ?? ''];
const cv = document.querySelector<HTMLCanvasElement>('[data-intro-stage]');
const mark = document.querySelector<SVGSVGElement>('[data-logo]');
const ctx = cv?.getContext('2d');

if (root.classList.contains('intro')) {
  if (intro && cv && ctx && mark) {
    root.dataset.introRun = '';   // tells the gate's safety timer the intro has started
    // The bits are Geist Mono: wait for it briefly so the first frame is not a fallback face.
    Promise.race([document.fonts.load(`500 12px ${MONO}`), new Promise((r) => setTimeout(r, 700))])
      .catch(() => {})
      .then(() => play(intro, cv, ctx, mark));
  } else root.classList.remove('intro');
}

function play(intro: Intro, cv: HTMLCanvasElement, c: CanvasRenderingContext2D, mark: SVGSVGElement) {
  const env: Env = { W: 0, H: 0, dpr: 1, mobile: false, S0: 1, C0: [0, 0], S1: 1, C1: [0, 0], ink: '#ededea' };
  const END = intro.dock + DOCK + TINT;
  let raf = 0, t0 = 0, running = true, rose = false;
  try { localStorage.setItem('intro-seen', '1'); } catch {}
  try { history.scrollRestoration = 'manual'; } catch {}
  scrollTo(0, 0);

  function measure() {
    env.W = root.clientWidth; env.H = root.clientHeight;
    env.dpr = Math.min(2, devicePixelRatio || 1);
    env.mobile = env.W < 600;
    env.ink = getComputedStyle(root).getPropertyValue('--ink').trim() || env.ink;
    cv.width = Math.round(env.W * env.dpr); cv.height = Math.round(env.H * env.dpr);
    // The mark in the middle: about 46% of the height, never wider than 62% of the width.
    env.S0 = Math.min(env.W * 0.62, env.H * 0.46) / 30;
    env.C0 = [env.W / 2, env.H / 2];
    // The header logo, snapped to device pixels the way Chrome paints replaced elements.
    const r = mark.getBoundingClientRect(), snap = (v: number) => Math.round(v * env.dpr) / env.dpr;
    env.S1 = r.width / 30; env.C1 = [snap(r.left) + r.width / 2, snap(r.top) + r.height / 2];
    intro.init?.(env);
  }

  function render(t: number) {
    c.setTransform(env.dpr, 0, 0, env.dpr, 0, 0);
    c.globalAlpha = 1;
    c.clearRect(0, 0, env.W, env.H);
    if (t < intro.dock) intro.draw(c, t, { x: env.C0[0], y: env.C0[1], s: env.S0 }, env);
    else {
      // The ink mark moves to the header (centre linear in eased time, scale geometric), then turns orange.
      const p = io3(clamp((t - intro.dock) / DOCK)), k = Math.pow(env.S1 / env.S0, p);
      const cam = { x: env.C0[0] + (env.C1[0] - env.C0[0]) * p, y: env.C0[1] + (env.C1[1] - env.C0[1]) * p, s: env.S0 * k };
      solid(c, cam, mix(env.ink, ORANGE, clamp((t - intro.dock - DOCK) / TINT)));
    }
  }

  // The content rises once; when every rise has finished the page drops the intro classes (end states match).
  function rise() {
    if (rose) return;
    rose = true;
    root.classList.add('go');
    setTimeout(() => root.classList.remove('intro', 'go', 'docked', 'skip'), RISE);
  }
  function tick(now: number) {
    const t = now - t0;
    if (t >= intro.dock + CONTENT) rise();
    if (t >= END) { land(); return; }
    render(t);
    raf = requestAnimationFrame(tick);
  }
  function stop() {
    running = false;
    cancelAnimationFrame(raf);
    SKIP.forEach((e) => removeEventListener(e, skip));
    removeEventListener('resize', measure);
    removeEventListener('theme:change', measure);
  }
  // The canvas mark sits exactly on the orange header logo: swap them in the same frame.
  function land() { stop(); root.classList.add('docked'); rise(); }
  // Click, key, wheel or touch: the canvas fades out, the header logo fades in, the content rises.
  function skip() { if (running) { stop(); root.classList.add('docked', 'skip'); rise(); } }

  measure();
  SKIP.forEach((e) => addEventListener(e, skip, { passive: true }));
  addEventListener('resize', measure);
  addEventListener('theme:change', measure);   // redraw in the new theme's ink
  t0 = performance.now();
  raf = requestAnimationFrame(tick);
}
