// SIGNAL behaviours (DESIGN.md §4). Everything is driven by data attributes / classes in the markup;
// the HTML always holds the final text, JS only animates it. Initialised on astro:page-load, fully torn
// down on astro:before-swap. Under reduced motion only the non-animated readouts run (clock, uptime,
// pointer coords). Easter eggs live in eggs.ts and Terminal.astro.
//
//   data-scramble            decode once when >= 40% in view (700ms)
//   data-scramble="hover"    decode on hover/focus of the closest a/button (350ms)
//   data-count-to (+suffix)  digits roll then settle when in view (900ms)
//   data-boot                children appear one by one, decoding; once per session
//   data-glitch-burst        on a .glitch: a burst every 5–9s
//   data-clock               HH:MM:SS in Asia/Kolkata
//   data-uptime-since="YYYY-MM"  "07y 06m"
//   data-pointer-coords      "X 0412 · Y 0233" (fine pointers)
//
// Scramble/count targets must be text-only leaves: they are rewritten as a sr-only copy of the final
// text plus an aria-hidden span whose glyphs animate (same character count, so mono widths hold).

const GLYPHS = '!<>-_\\/[]{}=+*^?#01ABCDEF';
const DIGITS = '0123456789';

let ac: AbortController | undefined;
const observers: IntersectionObserver[] = [];
const timers = new Set<number>(); // timeouts and intervals share one id pool; clearTimeout clears both
const frames = new Set<number>();
const finals = new WeakMap<Text, string>();
const running = new WeakSet<HTMLElement>();

const $$ = (sel: string) => [...document.querySelectorAll<HTMLElement>(sel)];
const pad = (n: number, width: number) => String(n).padStart(width, '0');
const pick = (pool: string) => pool[Math.floor(Math.random() * pool.length)];
const isSpace = (c: string) => /\s/.test(c);
const isNotDigit = (c: string) => !/\d/.test(c);

function later(fn: () => void, ms: number) {
  const id = window.setTimeout(() => {
    timers.delete(id);
    fn();
  }, ms);
  timers.add(id);
}

function frame(fn: (now: number) => void) {
  const id = requestAnimationFrame((now) => {
    frames.delete(id);
    fn(now);
  });
  frames.add(id);
}

function onceInView(threshold: number, fn: (el: HTMLElement) => void) {
  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        io.unobserve(entry.target);
        fn(entry.target as HTMLElement);
      }
    },
    { threshold },
  );
  observers.push(io);
  return io;
}

function textNodes(el: Node) {
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  const out: Text[] = [];
  while (walker.nextNode()) out.push(walker.currentNode as Text);
  return out;
}

/** Split `el` into a sr-only final copy + an aria-hidden glyph span (once). Returns the glyph text nodes. */
function accessible(el: HTMLElement) {
  if (!('fx' in el.dataset)) {
    const glyphs = document.createElement('span');
    glyphs.setAttribute('aria-hidden', 'true');
    glyphs.append(...el.childNodes);
    const copy = document.createElement('span');
    copy.className = 'sr-only';
    copy.textContent = glyphs.textContent;
    el.append(copy, glyphs);
    el.dataset.fx = '';
  }
  return textNodes(el.lastElementChild!);
}

/** Resolve characters left→right from random `pool` glyphs over `ms`; `keep` chars never scramble. */
function decode(el: HTMLElement, nodes: Text[], ms: number, pool: string, keep: (c: string) => boolean) {
  if (running.has(el) || !nodes.length) return;
  running.add(el);
  const target = nodes.map((n) => finals.get(n) ?? (finals.set(n, n.data), n.data));
  const total = target.reduce((sum, s) => sum + s.length, 0);
  const start = performance.now();
  const tick = (now: number) => {
    const t = Math.min(1, (now - start) / ms);
    let settled = Math.floor(t * total);
    nodes.forEach((node, i) => {
      let out = '';
      for (const c of target[i]) out += settled-- > 0 || keep(c) ? c : pick(pool);
      if (node.data !== out) node.data = out;
    });
    if (t < 1) frame(tick);
    else running.delete(el);
  };
  frame(tick);
}

function scramble(signal: AbortSignal) {
  const inView = onceInView(0.4, (el) => decode(el, accessible(el), 700, GLYPHS, isSpace));
  for (const el of $$('[data-scramble]')) {
    if (el.dataset.scramble !== 'hover') {
      inView.observe(el);
      continue;
    }
    const nodes = accessible(el);
    const trigger = el.closest<HTMLElement>('a, button') ?? el;
    const go = () => decode(el, nodes, 350, GLYPHS, isSpace);
    trigger.addEventListener('pointerenter', go, { signal });
    trigger.addEventListener('focus', go, { signal });
  }
}

function counters() {
  const inView = onceInView(0.4, (el) => decode(el, accessible(el), 900, DIGITS, isNotDigit));
  for (const el of $$('[data-count-to]')) {
    if (!el.textContent?.trim()) el.textContent = `${el.dataset.countTo}${el.dataset.countSuffix ?? ''}`;
    inView.observe(el);
  }
}

function boot() {
  const log = document.querySelector<HTMLElement>('[data-boot]');
  if (!log) return;
  try {
    if (sessionStorage.getItem('booted')) return;
    sessionStorage.setItem('booted', '1');
  } catch {
    return; // no storage: render the lines as they are
  }
  const lines = [...log.children] as HTMLElement[];
  for (const line of lines) line.style.visibility = 'hidden';
  lines.forEach((line, i) =>
    later(() => {
      line.style.visibility = '';
      decode(line, textNodes(line), 700, GLYPHS, isSpace);
    }, i * 70),
  );
}

function bursts() {
  for (const el of $$('[data-glitch-burst]')) {
    const loop = () =>
      later(() => {
        if (!document.hidden) {
          el.classList.add('is-glitching');
          later(() => el.classList.remove('is-glitching'), 300);
        }
        loop();
      }, 5000 + Math.random() * 4000);
    loop();
  }
}

function readouts(signal: AbortSignal) {
  const clocks = $$('[data-clock]');
  if (clocks.length) {
    const fmt = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Kolkata',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hourCycle: 'h23',
    });
    const tick = () => {
      const now = fmt.format(new Date());
      for (const c of clocks) c.textContent = now;
    };
    tick();
    timers.add(window.setInterval(tick, 1000));
  }

  for (const el of $$('[data-uptime-since]')) {
    if (el.dataset.uptimeSince) el.textContent = uptime(el.dataset.uptimeSince);
  }

  const coords = $$('[data-pointer-coords]');
  if (coords.length && matchMedia('(pointer: fine)').matches) {
    let x = 0;
    let y = 0;
    let queued = false;
    const write = () => {
      queued = false;
      const text = `X ${pad(x, 4)} · Y ${pad(y, 4)}`;
      for (const c of coords) c.textContent = text;
    };
    window.addEventListener(
      'pointermove',
      (e) => {
        x = Math.round(e.clientX);
        y = Math.round(e.clientY);
        if (!queued) {
          queued = true;
          frame(write);
        }
      },
      { signal, passive: true },
    );
  }
}

/** "07y 06m" from a "YYYY-MM" month to now (also used by the terminal). */
export function uptime(since: string, now = new Date()) {
  const [y, m = 1] = since.split('-').map(Number);
  const months = Math.max(0, (now.getFullYear() - y) * 12 + now.getMonth() + 1 - m);
  return `${pad(Math.floor(months / 12), 2)}y ${pad(months % 12, 2)}m`;
}

function cleanup() {
  ac?.abort();
  for (const io of observers.splice(0)) io.disconnect();
  for (const id of timers) clearTimeout(id);
  timers.clear();
  for (const id of frames) cancelAnimationFrame(id);
  frames.clear();
}

function init() {
  cleanup();
  ac = new AbortController();
  const { signal } = ac;
  readouts(signal);
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  scramble(signal);
  counters();
  boot();
  bursts();
}

document.addEventListener('astro:page-load', init);
document.addEventListener('astro:before-swap', cleanup);
// Page transitions: the swapped-in <main> turns on like a CRT (CSS keeps it static under reduced motion).
document.addEventListener('astro:after-swap', () => document.querySelector('main')?.classList.add('flicker'));
