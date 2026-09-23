// The big bang's fall (src/scripts/bigbang.ts) as pure maths: no DOM, so src/scripts/fall.check.ts runs it under
// plain node. Every copy falls from rest into a point mass at the viewport centre. A closed universe recollapsing
// follows the same curve, so space (the scale factor of the dust and the sky) uses it too.

export const START = 0.3; // s: everything begins to fall
export const CRUNCH = 3.4; // s: the last copy (from a corner) arrives
export const MAX_STRETCH = 4; // tides stretch a copy along its fall line at most this much
const FASTEST = 0.8; // s: even a copy at the centre takes this long
const N = 64; // lookup samples
const EPS = 0.08; // floor on r/r0 in the spin integral, so the last turns stay finite

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
/** The share of its whole turn a falling copy has made by τ: 0 → 1, most of it near the end. */
export const spin = (tau: number) => sample(G, tau);
/** Seconds a copy r0 px from the centre takes to fall in. One rMax away (a corner) arrives at CRUNCH. */
export const fallTime = (r0: number, rMax: number) =>
  FASTEST + (CRUNCH - START - FASTEST) * Math.min(1, r0 / rMax) ** 1.5;
/** Tidal stretch along the fall line at r/r0 = f: none at rest, growing as it nears the centre. */
export const stretch = (f: number) => Math.min(MAX_STRETCH, 1 + 3 * (1 - f) ** 3);
