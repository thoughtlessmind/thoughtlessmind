// Machine: 18 triangular plates slide in as three trains and pile up on the triangle the three hexagons share,
// then each stack unfolds about its hexagon's centre in three heavy 60 degree beats, and a clamp closes the seams.
// Every hexagon's centre is a corner of the other two, so all 18 plates (hex centre + two adjacent corners) sit on one
// triangular lattice, and the shared triangle T0 = A, B, C is one wedge of each hexagon.
import { LOGO, MID, clamp, smooth, solid, type Intro } from './kit';

const R = 10, STEP = Math.PI / 3, INRAD = R / (2 * Math.sqrt(3)), D2R = Math.PI / 180;
const G = [(LOGO[0].x + LOGO[1].x + LOGO[2].x) / 3, (LOGO[0].y + LOGO[1].y + LOGO[2].y) / 3];   // T0's centroid
// The corner angle each hexagon's T0 wedge starts at (screen angles, y down), and the way its stack comes in.
const START = [-30, 210, 90].map((d) => d * D2R);
const DIR = LOGO.map((h) => { const dx = h.x - G[0], dy = h.y - G[1], n = Math.hypot(dx, dy); return [dx / n, dy / n]; });
const KS = [0, 1, 2, 3, -1, -2];   // each plate's final wedge, counted from T0

// Timeline, ms
const HIT = 520;                    // the lead plates meet
const GAP = 1.1, PILE = 16;         // each stack slides as a train of plates GAP apart; they pile in PILE ms apart
const BEATS = [750, 990, 1230];     // unfold beats start
const TRAV = 140, SETTLE = 90;      // a beat: accelerate into a hard stop, then a small rebound
const REB = 0.045;                  // rebound depth (peaks near 2.7% of the 60 degree swing)
const CLAMP = 1500, PRESS = 220;    // seams close and the mark presses from 1.02 to 1
const LOCK = CLAMP + PRESS;
const SEAM = 0.18;                  // each plate's edge inset, logo units: the seam is twice this
const HITS = [[HIT, 3, 45], ...[1, 2, 3, 4, 5].map((j) => [HIT + j * PILE, 0.7, 25]),
  ...BEATS.map((b) => [b + TRAV, 1, 28]), [LOCK, 2, 40]];   // [t, px, decay ms]

let D = 34, AMP = 1;   // set in init: converge distance (logo units), shake scale

const in2 = (x: number) => x * x;
function beat(x: number) {
  if (x <= 0) return 0;
  if (x < TRAV) return in2(x / TRAV);
  const s = (x - TRAV) / SETTLE;
  return s >= 1 ? 1 : 1 - REB * Math.sin(Math.PI * s) * (1 - s);
}
function shake(t: number) {
  let x = 0, y = 0;
  for (const [t0, a, tau] of HITS) {
    const d = t - t0;
    if (d <= 0 || d >= 220) continue;
    const k = a * Math.exp(-d / tau) * (1 - d / 220);
    y += k * Math.sin(d * 2 * Math.PI / 64);
    x += k * 0.35 * Math.sin(d * 2 * Math.PI / 82 + 1);
  }
  return [x * AMP, y * AMP];
}

const machine: Intro = {
  dock: 2100,
  init(env) {
    // Start each train whole on screen near its edge (height bounds the two diagonal ones, width the left one).
    // A phone is too narrow for that, so there the left train starts partly off screen.
    const s = env.S0 * 1.02;
    D = clamp(Math.min((env.H / 2 / s - 6.5) / 0.866, env.W / 2 / s + G[0] - MID[0] - 6.8) - 5 * GAP, 22, 44);
    AMP = Math.min(1, env.S0 / 14);
  },
  draw(c, t, cam, env) {
    const [sx, sy] = shake(t);
    const press = in2(clamp((t - CLAMP) / PRESS));
    const m = { x: cam.x + sx, y: cam.y + sy, s: cam.s * (1 + 0.02 * (1 - press)) };
    if (t >= LOCK) { solid(c, m, env.ink); return; }

    const fade = smooth(0, 140, t);
    const slide = D * (1 - in2(clamp(t / HIT)));     // a shoved sled: accelerating all the way into the hit
    const f = 1 - SEAM * (1 - press) / INRAD;         // shrink toward each plate's centroid
    const X = (u: number) => m.x + (u - MID[0]) * m.s, Y = (v: number) => m.y + (v - MID[1]) * m.s;
    const b = BEATS.map((t0) => beat(t - t0));
    c.fillStyle = env.ink;
    for (let h = 0; h < 3; h++) {
      const H = LOGO[h];
      c.globalAlpha = H.o * fade;
      for (let j = 0; j < 6; j++) {
        const k = KS[j];
        // Plate j trails the lead by j gaps. The lead stops at HIT; the rest pile into it one by one, each a hard stop.
        const back = t < HIT ? slide + j * GAP : GAP * Math.max(0, j - (t - HIT) / PILE);
        const ox = H.x + DIR[h][0] * back, oy = H.y + DIR[h][1] * back;
        let turn = 0;
        for (let i = 0; i < Math.abs(k); i++) turn += b[i];
        const a = START[h] + Math.sign(k) * STEP * turn;
        // Plate corners relative to its hexagon's centre: (0,0), corner at a, corner at a + 60.
        const x1 = R * Math.cos(a), y1 = R * Math.sin(a), x2 = R * Math.cos(a + STEP), y2 = R * Math.sin(a + STEP);
        const qx = (x1 + x2) / 3, qy = (y1 + y2) / 3;   // centroid
        c.beginPath();
        c.moveTo(X(ox + qx - qx * f), Y(oy + qy - qy * f));
        c.lineTo(X(ox + qx + (x1 - qx) * f), Y(oy + qy + (y1 - qy) * f));
        c.lineTo(X(ox + qx + (x2 - qx) * f), Y(oy + qy + (y2 - qy) * f));
        c.closePath();
        c.fill();
      }
    }
    c.globalAlpha = 1;
  },
};
export default machine;
