// The footer's star field (DESIGN.md §4): a grid of dots, a few of them brighter stars, drawn on a canvas. The first
// time it comes on screen the dots light up outward from the centre. A mouse over it is a gravity well: it springs
// after the cursor, pulls the dots in with a swirl and drags them along its path like a liquid, and lights the ones
// near its core orange. Each dot is a spring back to its place, so the grid wobbles and settles once the cursor
// leaves. A tap on touch drops a short-lived well. rAF runs only while something moves; under reduced motion nothing
// moves and the well is a still glow under the cursor.
export function field(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const root = document.documentElement;

  type Dot = { hx: number; hy: number; x: number; y: number; vx: number; vy: number; star: number; delay: number };
  let dots: Dot[] = [], w = 0, h = 0, R = 160;
  let dim = '', ink = '', hot = '';
  let raf = 0, last = 0, seen = false, intro = -1;
  let on = false, g = 0, off = 0;
  let tx = 0, ty = 0, wx = 0, wy = 0, wvx = 0, wvy = 0;

  // A stable pseudo-random per grid cell, so the same dots are stars on every visit.
  const hash = (i: number, j: number) => {
    const s = Math.sin(i * 127.1 + j * 311.7) * 43758.5453;
    return s - Math.floor(s);
  };
  const colours = () => {
    const css = getComputedStyle(root);
    dim = getComputedStyle(canvas).color;
    ink = css.getPropertyValue('--ink').trim() || '#ededea';
    hot = css.getPropertyValue('--accent').trim() || '#ff5f1f';
  };
  const build = () => {
    const b = canvas.getBoundingClientRect(), dpr = Math.min(devicePixelRatio || 1, 2);
    w = b.width;
    h = b.height;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const S = w < 600 ? 14 : 18;
    R = w < 600 ? 110 : 170;
    const cols = Math.floor(w / S), rows = Math.floor(h / S);
    const x0 = (w - (cols - 1) * S) / 2, y0 = (h - (rows - 1) * S) / 2;
    dots = [];
    for (let j = 0; j < rows; j++)
      for (let i = 0; i < cols; i++) {
        const hx = x0 + i * S, hy = y0 + j * S, r = hash(i, j);
        dots.push({
          hx, hy, x: hx, y: hy, vx: 0, vy: 0,
          star: r > 0.94 ? 1 + (r - 0.94) * 12 : 0,
          delay: Math.hypot(hx - w / 2, (hy - h / 2) * 1.6) * 1.4 + r * 160,
        });
      }
  };

  const draw = (now: number) => {
    ctx.clearRect(0, 0, w, h);
    // Before the first sighting nothing shows, so the entrance never starts from a full grid.
    const t = intro < 0 ? -Infinity : now - intro;
    for (const d of dots) {
      const k = Math.min(Math.max((t - d.delay) / 420, 0), 1);
      if (!k) continue;
      const near = g > 0 ? Math.max(0, 1 - Math.hypot(d.x - wx, d.y - wy) / (R * 0.9)) * g : 0;
      const size = (d.star ? 1.3 + d.star * 0.5 : 1) * (1 + near * 1.5);
      ctx.globalAlpha = k * (d.star ? 0.85 : 0.5);
      ctx.fillStyle = d.star ? ink : dim;
      ctx.fillRect(d.x - size / 2, d.y - size / 2, size, size);
      if (near > 0.02) {
        ctx.globalAlpha = k * Math.min(near * 2.4, 1);
        ctx.fillStyle = hot;
        ctx.fillRect(d.x - size / 2, d.y - size / 2, size, size);
      }
    }
    ctx.globalAlpha = 1;
    return t < 2600;
  };

  const tick = (now: number) => {
    const dt = last ? Math.min((now - last) / 1000, 1 / 30) : 1 / 60;
    last = now;
    if (off && now > off) {
      on = false;
      off = 0;
    }
    // The well: a loose spring after the cursor, its strength easing in and out.
    const ax = 120 * (tx - wx) - 16 * wvx, ay = 120 * (ty - wy) - 16 * wvy;
    wvx += ax * dt; wvy += ay * dt; wx += wvx * dt; wy += wvy * dt;
    g += ((on ? 1 : 0) - g) * Math.min(1, dt * 6);
    let energy = 0;
    for (const d of dots) {
      let fx = -70 * (d.x - d.hx) - 9 * d.vx, fy = -70 * (d.y - d.hy) - 9 * d.vy;
      if (g > 0.01) {
        const dx = wx - d.x, dy = wy - d.y, r = Math.hypot(dx, dy);
        if (r < R && r > 0.5) {
          const f = (1 - r / R) ** 2 * g;
          // Pull in, swirl round and get dragged along with the well.
          fx += f * (dx / r * 1400 - dy / r * 700 + wvx * 9);
          fy += f * (dy / r * 1400 + dx / r * 700 + wvy * 9);
        }
      }
      d.vx += fx * dt; d.vy += fy * dt; d.x += d.vx * dt; d.y += d.vy * dt;
      energy += Math.abs(d.x - d.hx) + Math.abs(d.y - d.hy) + Math.abs(d.vx) * 0.05;
    }
    const busy = draw(now);
    if (seen && (on || g > 0.01 || energy / dots.length > 0.02 || busy)) raf = requestAnimationFrame(tick);
    else {
      raf = last = 0;
      if (!on) g = 0;
      dots.forEach((d) => ((d.x = d.hx), (d.y = d.hy), (d.vx = d.vy = 0)));
      draw(now);
    }
  };
  const wake = () => {
    if (still) return draw(performance.now());
    if (!raf && seen) raf = requestAnimationFrame(tick);
  };

  const aim = (e: PointerEvent) => {
    const b = canvas.getBoundingClientRect();
    tx = e.clientX - b.left;
    ty = e.clientY - b.top;
  };
  canvas.addEventListener('pointerenter', (e) => {
    if (e.pointerType === 'touch') return;
    aim(e);
    if (g < 0.01) ((wx = tx), (wy = ty), (wvx = wvy = 0));
    on = true;
    if (still) g = 1;
    wake();
  });
  canvas.addEventListener('pointermove', (e) => {
    if (e.pointerType === 'touch' || !on) return;
    aim(e);
    if (still) ((wx = tx), (wy = ty), draw(performance.now()));
  });
  canvas.addEventListener('pointerleave', (e) => {
    if (e.pointerType === 'touch') return;
    on = false;
    if (still) ((g = 0), draw(performance.now()));
  });
  // Touch: a tap drops a well where it lands for a moment, then lets go.
  canvas.addEventListener('pointerdown', (e) => {
    if (e.pointerType !== 'touch' || still) return;
    aim(e);
    wx = tx; wy = ty; wvx = wvy = 0;
    on = true;
    off = performance.now() + 450;
    wake();
  });

  colours();
  build();
  new ResizeObserver(() => {
    build();
    draw(performance.now());
  }).observe(canvas);
  new MutationObserver(() => {
    colours();
    if (!raf) draw(performance.now());
  }).observe(root, { attributes: true, attributeFilter: ['data-theme'] });
  matchMedia('(prefers-color-scheme: light)').addEventListener('change', () => {
    colours();
    if (!raf) draw(performance.now());
  });
  new IntersectionObserver(
    ([e]) => {
      seen = e.isIntersecting;
      if (seen && intro < 0) {
        intro = still ? -1e9 : performance.now();
        if (still) draw(performance.now());
      }
      if (seen) wake();
    },
    { threshold: 0.2 },
  ).observe(canvas);
}
