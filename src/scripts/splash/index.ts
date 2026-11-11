// The splash screen, on a fresh load or reload of the home page: the mark gathers out of 0s and 1s in the middle of
// the screen (bits.ts), moves into the header logo, turns the logo colour, and the content rises. The gate in
// BaseLayout's head decides before paint and sets html.splash; this file plays it. It always plays to the end: clicks,
// keys and scrolling don't cut it short.
import { MONO, clamp, io3, mix, solid, type Env, type Splash } from './kit';
import bits from './bits';

// ms: the move to the header, the tint to the logo colour, how long after the move starts the content rises, and how
// long the rises take (the longest rise plus its delay: the last fact row, 800 ms at 500).
const DOCK = 800, TINT = 350, CONTENT = 200, RISE = 1340;

const root = document.documentElement;
const cv = document.querySelector<HTMLCanvasElement>('[data-splash-stage]');
const mark = document.querySelector<SVGSVGElement>('[data-logo]');
const ctx = cv?.getContext('2d');

if (root.classList.contains('splash')) {
  if (cv && ctx && mark) {
    root.dataset.splashRun = '';   // tells the gate's safety timer the splash has started
    // The bits are Geist Mono: wait for it briefly so the first frame is not a fallback face.
    Promise.race([document.fonts.load(`500 12px ${MONO}`), new Promise((r) => setTimeout(r, 700))])
      .catch(() => {})
      .then(() => play(bits, cv, ctx, mark));
  } else root.classList.remove('splash');
}

function play(splash: Splash, cv: HTMLCanvasElement, c: CanvasRenderingContext2D, mark: SVGSVGElement) {
  const env: Env = { W: 0, H: 0, dpr: 1, mobile: false, S0: 1, C0: [0, 0], S1: 1, C1: [0, 0], ink: '#ededea', logo: '#ff5f1f' };
  const END = splash.dock + DOCK + TINT;
  let t0 = 0, rose = false;
  try { history.scrollRestoration = 'manual'; } catch {}
  scrollTo({ top: 0, behavior: 'instant' });   // the page scrolls smoothly otherwise (in-page links)

  function measure() {
    env.W = root.clientWidth; env.H = root.clientHeight;
    env.dpr = Math.min(2, devicePixelRatio || 1);
    env.mobile = env.W < 600;
    const css = getComputedStyle(root);
    env.ink = css.getPropertyValue('--ink').trim() || env.ink;
    env.logo = css.getPropertyValue('--logo').trim() || env.logo;
    cv.width = Math.round(env.W * env.dpr); cv.height = Math.round(env.H * env.dpr);
    // The mark in the middle: about 46% of the height, never wider than 62% of the width.
    env.S0 = Math.min(env.W * 0.62, env.H * 0.46) / 30;
    env.C0 = [env.W / 2, env.H / 2];
    // The header logo, snapped to device pixels the way Chrome paints replaced elements.
    const r = mark.getBoundingClientRect(), snap = (v: number) => Math.round(v * env.dpr) / env.dpr;
    env.S1 = r.width / 30; env.C1 = [snap(r.left) + r.width / 2, snap(r.top) + r.height / 2];
    splash.init?.(env);
  }

  function render(t: number) {
    c.setTransform(env.dpr, 0, 0, env.dpr, 0, 0);
    c.globalAlpha = 1;
    c.clearRect(0, 0, env.W, env.H);
    if (t < splash.dock) splash.draw(c, t, { x: env.C0[0], y: env.C0[1], s: env.S0 }, env);
    else {
      // The ink mark moves to the header (centre linear in eased time, scale geometric), then turns --logo.
      const p = io3(clamp((t - splash.dock) / DOCK)), k = Math.pow(env.S1 / env.S0, p);
      const cam = { x: env.C0[0] + (env.C1[0] - env.C0[0]) * p, y: env.C0[1] + (env.C1[1] - env.C0[1]) * p, s: env.S0 * k };
      solid(c, cam, mix(env.ink, env.logo, clamp((t - splash.dock - DOCK) / TINT)));
    }
  }

  // The content rises once; when every rise has finished the page drops the splash classes (end states match).
  function rise() {
    if (rose) return;
    rose = true;
    root.classList.add('go');
    setTimeout(() => root.classList.remove('splash', 'go', 'docked'), RISE);
  }
  function tick(now: number) {
    const t = now - t0;
    if (t >= splash.dock + CONTENT) rise();
    if (t >= END) { land(); return; }
    render(t);
    requestAnimationFrame(tick);
  }
  // The canvas mark sits exactly on the header logo: swap them in the same frame.
  function land() {
    removeEventListener('resize', measure);
    removeEventListener('theme:change', measure);
    root.classList.add('docked');
    rise();
  }

  measure();
  addEventListener('resize', measure);
  addEventListener('theme:change', measure);   // redraw in the new theme's ink
  t0 = performance.now();
  requestAnimationFrame(tick);
}
