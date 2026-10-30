// A liquid blob's outline: a closed Catmull-Rom curve through its rim points, as SVG path data. The footer name's
// blob and the theme switch's pour both draw with it (DESIGN.md §4).
export function loop(p: [number, number][]): string {
  const N = p.length;
  const f = (n: number) => n.toFixed(1);
  let d = `M${f(p[0][0])} ${f(p[0][1])}`;
  for (let i = 0; i < N; i++) {
    const [p0, p1, p2, p3] = [p[(i + N - 1) % N], p[i], p[(i + 1) % N], p[(i + 2) % N]];
    d += `C${f(p1[0] + (p2[0] - p0[0]) / 6)} ${f(p1[1] + (p2[1] - p0[1]) / 6)} ${f(p2[0] - (p3[0] - p1[0]) / 6)} ${f(p2[1] - (p3[1] - p1[1]) / 6)} ${f(p2[0])} ${f(p2[1])}`;
  }
  return d + 'Z';
}

// A liquid blob that trails a mouse over `area` (DESIGN.md §4): each of `paths` gets its outline, in the units of
// `svg`'s viewBox, radius `R`. It springs after the cursor, stretches along its speed and wobbles at the rim. rAF runs
// only while the cursor is on the area or the blob is melting away. Under reduced motion it is a plain circle on the
// cursor. Mouse only: touch never shows it. The footer name and the section doodles use it.
export function trail(area: HTMLElement, svg: SVGSVGElement, paths: Element[], R: number) {
  if (!matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const vb = svg.viewBox.baseVal;
  const N = 36, TAU = Math.PI * 2;
  let on = false, raf = 0, last = 0, t = 0;
  let cx = 0, cy = 0, tx = 0, ty = 0, x = 0, y = 0, vx = 0, vy = 0, r = 0, vr = 0;
  const set = (d: string) => paths.forEach((p) => p.setAttribute('d', d));

  // Client px to viewBox units (the viewBox fills the svg, or is fitted into it from the top left).
  const aim = () => {
    const b = svg.getBoundingClientRect(), k = Math.max(vb.width / b.width, vb.height / b.height);
    tx = vb.x + (cx - b.left) * k;
    ty = vb.y + (cy - b.top) * k;
  };
  const draw = () => {
    const a = 1 + Math.min(Math.hypot(vx, vy) / (17 * R), 0.5), b = 1 / Math.sqrt(a), dir = Math.atan2(vy, vx);
    const p: [number, number][] = [];
    for (let i = 0; i < N; i++) {
      const th = (i / N) * TAU, ph = th - dir;
      const w = still ? 1 : 1 + 0.05 * Math.sin(3 * th + 1.7 * t) + 0.035 * Math.sin(5 * th - 2.3 * t) + 0.025 * Math.sin(2 * th + 1.1 * t);
      const rr = (r * w) / Math.hypot(Math.cos(ph) / a, Math.sin(ph) / b);
      p.push([x + Math.cos(th) * rr, y + Math.sin(th) * rr]);
    }
    set(loop(p));
  };
  const tick = (now: number) => {
    const dt = last ? Math.min((now - last) / 1000, 1 / 30) : 1 / 60;
    last = now;
    t += dt;
    aim();
    // Springs: the centre a little loose so it trails, the radius bouncy so the blob swells in like a drop.
    const ax = 160 * (tx - x) - 18 * vx, ay = 160 * (ty - y) - 18 * vy;
    vx += ax * dt; vy += ay * dt; x += vx * dt; y += vy * dt;
    vr += (190 * ((on ? R : 0) - r) - 14 * vr) * dt;
    r = Math.max(0, r + vr * dt);
    if (!on && r < 1) {
      set('');
      raf = last = 0;
      return;
    }
    draw();
    raf = requestAnimationFrame(tick);
  };

  const track = (e: PointerEvent) => {
    cx = e.clientX;
    cy = e.clientY;
    if (!still) return;
    aim();
    x = tx; y = ty; r = R;
    draw();
  };
  area.addEventListener('pointerenter', (e) => {
    if (e.pointerType === 'touch') return;
    on = true;
    track(e);
    if (still) return;
    if (r < 1) {
      aim();
      x = tx; y = ty; vx = vy = 0;
    }
    if (!raf) raf = requestAnimationFrame(tick);
  });
  area.addEventListener('pointermove', (e) => on && track(e));
  area.addEventListener('pointerleave', () => {
    on = false;
    if (still) set('');
  });
}
