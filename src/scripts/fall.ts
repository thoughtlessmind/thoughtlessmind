// The big bang's fall (src/scripts/bigbang.ts, src/scripts/warp.ts) as pure maths: no DOM, so
// src/scripts/fall.check.ts runs it under plain node. The page falls from rest into a point mass at the viewport
// centre. A closed universe recollapsing follows the same curve, so space (the scale factor of the sky) uses it too.

export const START = 0.3; // s: everything begins to fall
export const CRUNCH = 3.4; // s: the last of the page (a corner) arrives
export const WIND = 1.25 * Math.PI * 2; // rad the page has turned (clockwise) by the time it falls in
const FASTEST = 0.8; // s: even material at the centre takes this long
const N = 64; // lookup samples
const EPS = 0.08; // floor on r/r0 in the spin integral, so the last turns stay finite
const STEPS = 1024; // samples of the forward fall that infall() inverts

// Radial free fall from rest: r/r0 = cos²η while τ = (η + sin η cos η) / (π/2) runs 0 → 1 (half a cycloid).
const F = new Float32Array(N + 1);
// Spin-up: angular momentum is kept, so dθ/dt ∝ 1/r². G(τ) = ∫ dτ / max(f, EPS)², normalised to G(1) = 1.
const G = new Float32Array(N + 1);

const tauAt = (eta: number) => (eta + Math.sin(eta) * Math.cos(eta)) / (Math.PI / 2);
for (let i = 0; i <= N; i++) {
  let lo = 0;
  let hi = Math.PI / 2;
  for (let k = 0; k < 40; k++) {
    const mid = (lo + hi) / 2;
    if (tauAt(mid) < i / N) lo = mid;
    else hi = mid;
  }
  F[i] = Math.cos((lo + hi) / 2) ** 2;
}
F[0] = 1;
F[N] = 0;
for (let i = 1; i <= N; i++) {
  const a = 1 / Math.max(F[i - 1], EPS) ** 2;
  const b = 1 / Math.max(F[i], EPS) ** 2;
  G[i] = G[i - 1] + (a + b) / (2 * N);
}
const total = G[N];
for (let i = 1; i <= N; i++) G[i] /= total;

const sample = (table: Float32Array, tau: number) => {
  const x = Math.min(1, Math.max(0, tau)) * N;
  const i = Math.min(N - 1, Math.floor(x));
  return table[i] + (table[i + 1] - table[i]) * (x - i);
};

/** r/r0 at τ = t / T of a fall: 1 at rest, slow to start, 0 on arrival. */
export const radius = (tau: number) => sample(F, tau);
/** The share of its whole turn falling material has made by τ: 0 → 1, most of it near the end. */
export const spin = (tau: number) => sample(G, tau);
/** Seconds material r0 px from the centre takes to fall in. One rMax away (a corner) arrives at CRUNCH. */
export const fallTime = (r0: number, rMax: number) =>
  FASTEST + (CRUNCH - START - FASTEST) * Math.min(1, r0 / rMax) ** 1.5;

// τ at t of material that started r0 rMax out (fallTime depends only on the ratio).
const tauOf = (t: number, r0: number) => (t - START) / fallTime(r0, 1);
// r0 / rMax of the frontier: everything that started inside it has fallen in by t.
const frontier = (t: number) =>
  Math.min(1, Math.max(0, (t - START - FASTEST) / (CRUNCH - START - FASTEST))) ** (2 / 3);

/** The share of the page (by area of the disc the corners span) that has fallen in by t: 0 → 1. */
export const swallowed = (t: number) => frontier(t) ** 2;

/**
 * The fall at t turned inside out for the warp's shader, into `out` (bins = out.length / 2, over ρ = 0 → rMax on
 * screen now): out[2i] = ρ0 / rMax, where the material now at ρ = i / (bins − 1) of rMax started, and
 * out[2i + 1] = spin(τ), how much of its wind it has made. Every ρ0 is −1 once all of it has fallen in.
 * Allocation-free: it runs every frame.
 */
export function infall(t: number, out: Float32Array) {
  const bins = out.length >> 1;
  const lo = frontier(t);
  if (lo >= 1) return void out.fill(-1);
  // ρ(ρ0) = ρ0·radius(τ(ρ0)) rises with ρ0 (outer material has further to fall and longer to do it), so one walk
  // over its samples, from the frontier out, inverts it for every bin in turn. Past the corners (off the page) the
  // last sample's line carries on, so the bin that straddles them has no kink to smooth over.
  let j = 0;
  let a = lo;
  let fa = 0;
  let b = lo;
  let fb = lo * radius(tauOf(t, lo));
  for (let i = 0; i < bins; i++) {
    const rho = i / (bins - 1);
    while (fb <= rho && j < STEPS) {
      a = b;
      fa = fb;
      b = lo + ((1 - lo) * ++j) / STEPS;
      fb = b * radius(tauOf(t, b));
    }
    const r0 = fb > fa ? a + ((b - a) * (rho - fa)) / (fb - fa) : a;
    out[2 * i] = r0;
    out[2 * i + 1] = spin(tauOf(t, r0));
  }
}
