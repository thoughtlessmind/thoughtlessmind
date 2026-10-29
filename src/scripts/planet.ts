// The ringed planet in the landing doodle (DESIGN.md §4), seen from E above its ring plane. Everything is drawn in the
// planet's own frame (`FRAME`): x along the rings' long axis, y down the screen. Rings are flat, so each ringlet is a
// circle squashed by sin E (CSS spins its dashes, inner ones faster: period ∝ r^1.5). The bands sit on the sphere, so
// they are projected here, frame by frame: they slow and shorten towards the limb and end exactly at it.

export const FRAME = 'translate(487.5 600) rotate(-26.3)';
export const R = 124;
const SIN = 0.28;
const COS = Math.sqrt(1 - SIN * SIN);
export const SQUASH = `scale(1 ${SIN})`;
const DAY = 64; // seconds per turn of the planet
const SPIN = (2 * Math.PI) / DAY;

// Fixed randomness, so every build draws the same planet.
function seeded(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const circle = (r: number) => `M${r} 0A${r} ${r} 0 1 1 ${-r} 0A${r} ${r} 0 1 1 ${r} 0`;
const f = (n: number) => +n.toFixed(1);

export interface Ringlet {
  r: number;
  width: number; // in the ring plane: thinner at the front and back once squashed
  alpha: number;
  dash: string;
  shift: number; // one repeat of the dash pattern
  ms: number; // time to move one repeat
}

// Ringlets of random width and spacing from 1.26R out to about 1.86R, with a wider gap (a Cassini division) near 1.6R.
// Periods run from about 45 s inside to 75 s outside; the planet's day (64 s) falls between, as Saturn's does.
export const RINGS: Ringlet[] = (() => {
  const rand = seeded(7);
  const out: Ringlet[] = [];
  let at = 1.26 * R;
  let gapped = false;
  while (at < 1.84 * R) {
    const width = 2.5 + rand() * 10;
    const r = at + width / 2;
    // Clumps: long dashes with short gaps, scaled so a whole number of repeats closes the circle without a seam.
    const parts: number[] = [];
    for (let i = 0; i < 4; i++) parts.push(60 + rand() * 160, 4 + rand() * 14);
    const total = parts.reduce((a, b) => a + b, 0);
    const around = 2 * Math.PI * r;
    const repeats = Math.max(1, Math.round(around / total));
    const k = around / (repeats * total);
    const period = 92000 * Math.pow(r / (1.3 * R), 1.5);
    out.push({
      r: f(r),
      width: f(width),
      alpha: f(0.55 + rand() * 0.45),
      dash: parts.map((p) => f(p * k)).join(' '),
      shift: f(around / repeats),
      ms: Math.round(period / repeats),
    });
    at = r + width / 2 + 1.5 + rand() * 6;
    if (!gapped && at > 1.56 * R) {
      at += 10;
      gapped = true;
    }
  }
  return out;
})();

export interface Band {
  lat: number; // radians
  cls: string;
  arcs: [number, number][]; // longitude spans, radians
}

// Cloud bands: broken latitude lines, so the breaks travel across the disk as it turns.
export const BANDS: Band[] = (() => {
  const rand = seeded(19);
  return [-52, -34, -17, 1, 18, 34, 51].map((deg, i) => {
    const arcs: [number, number][] = [];
    let a = rand() * Math.PI;
    const end = a + 2 * Math.PI - 0.3;
    while (a < end) {
      const len = (25 + rand() * 75) * (Math.PI / 180);
      arcs.push([a, Math.min(a + len, end)]);
      a += len + (14 + rand() * 46) * (Math.PI / 180);
    }
    return { lat: (deg * Math.PI) / 180, cls: i % 2 ? 'w25' : 'w35', arcs };
  });
})();

// A point on the sphere at latitude `lat`, longitude `lon`: its place on screen and how far it faces the viewer.
function project(lat: number, lon: number) {
  const rho = R * Math.cos(lat);
  const h = R * Math.sin(lat);
  return {
    x: rho * Math.cos(lon),
    y: rho * Math.sin(lon) * SIN - h * COS,
    depth: rho * Math.sin(lon) * COS + h * SIN,
  };
}

// The band's visible pieces after `t` seconds: sampled every 3 degrees and cut exactly at the limb. Seen from the north,
// the planet and its rings turn anticlockwise: their near side moves left to right.
export function bandPath(band: Band, t: number) {
  const turn = t * SPIN;
  const step = Math.PI / 60;
  let d = '';
  for (const [a0, a1] of band.arcs) {
    let prev: ReturnType<typeof project> | null = null;
    let open = false;
    for (let a = a0; ; a = Math.min(a + step, a1)) {
      const p = project(band.lat, a - turn);
      if (prev && prev.depth > 0 !== p.depth > 0) {
        const k = prev.depth / (prev.depth - p.depth);
        const x = f(prev.x + (p.x - prev.x) * k);
        const y = f(prev.y + (p.y - prev.y) * k);
        d += open ? `L${x} ${y}` : `M${x} ${y}`;
        open = !open;
      }
      if (p.depth > 0) {
        d += open ? `L${f(p.x)} ${f(p.y)}` : `M${f(p.x)} ${f(p.y)}`;
        open = true;
      }
      prev = p;
      if (a >= a1) break;
    }
  }
  return d || 'M0 0';
}

// The planet's markup, into the doodle's placeholder. Back to front: the rings, the body (filled with the ground, so it
// hides the rings behind it), its bands, then the near half of the rings again over the body.
export function withPlanet(doodle: string) {
  const rings = RINGS.map(
    (r) =>
      `<path class="ring" d="${circle(r.r)}" transform="${SQUASH}" style="stroke-width:calc(${r.width}px * var(--k));` +
      `stroke-opacity:${r.alpha};stroke-dasharray:${r.dash};--shift:${r.shift}px;--ms:${r.ms}"></path>`,
  ).join('');
  const bands = BANDS.map((b) => `<path class="${b.cls}" d="${bandPath(b, 0)}" data-band></path>`).join('');
  const planet =
    `<g transform="${FRAME}"><clipPath id="planet-near"><rect x="-400" y="0" width="800" height="400"></rect></clipPath>` +
    `<g class="rings">${rings}</g>` +
    `<path class="body w45" pathLength="1" d="${circle(R)}" style="--d:1150;--t:700"></path>` +
    `<g class="bands">${bands}</g>` +
    `<g class="rings" clip-path="url(#planet-near)">${rings}</g></g>`;
  return doodle.replace('<g data-planet=""></g>', planet);
}
