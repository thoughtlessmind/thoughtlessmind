// The one runnable check for the big bang's fall maths. Run: node --experimental-strip-types src/scripts/fall.check.ts
import { CRUNCH, START, fallTime, infall, radius, spin, swallowed } from './fall.ts';

const ok = (cond: boolean, msg: string) => {
  if (!cond) throw new Error(`fall.check: ${msg}`);
};
const near = (a: number, b: number, e = 1e-6) => Math.abs(a - b) <= e;

ok(radius(0) === 1 && radius(1) === 0, 'radius runs 1 → 0');
// Free fall from rest starts slow: at half the fall time it has only dropped ~16% of the way (cos²η, η ≈ 0.416).
ok(near(radius(0.5), 0.838, 0.01), `r/r0 at half time is ${radius(0.5)}, not ~0.838`);
ok(spin(0) === 0 && near(spin(1), 1), 'spin runs 0 → 1');
for (let i = 1; i <= 200; i++) {
  const a = (i - 1) / 200;
  const b = i / 200;
  ok(radius(b) <= radius(a), `radius rises at τ ${b}`);
  ok(spin(b) >= spin(a), `spin falls back at τ ${b}`);
  ok(swallowed(4 * b) >= swallowed(4 * a), `swallowed falls back at ${4 * b}s`);
}
const rMax = 850;
ok(fallTime(100, rMax) < fallTime(400, rMax), 'far material takes longer');
ok(near(START + fallTime(rMax, rMax), CRUNCH, 1e-9), 'the corners arrive as the crunch ends');
ok(near(fallTime(2 * rMax, rMax), fallTime(rMax, rMax)), 'past the corner is capped');
ok(swallowed(START) === 0 && swallowed(CRUNCH) === 1, 'swallowed runs 0 → 1');

// infall() inverts the fall: material that started r0 px out, now at ρ, reads back as r0 (to 1px) through the same
// lerp between bins the shader does. The table rises with ρ, and at rest it is the identity with no wind.
const BINS = 256;
const table = new Float32Array(2 * BINS);
const look = (rho: number) => {
  const x = Math.min(rho, 1) * (BINS - 1);
  const i = Math.min(BINS - 2, Math.floor(x));
  return table[2 * i] + (table[2 * i + 2] - table[2 * i]) * (x - i);
};
for (const t of [0, START, 0.9, 1.5, 2.2, 2.9, 3.3]) {
  infall(t, table);
  for (let i = 1; i < BINS; i++) ok(table[2 * i] >= table[2 * i - 2], `ρ0 falls back at bin ${i}, ${t}s`);
  if (t <= START) ok(table.every((v, i) => i % 2 === 0 || v === 0), `material at rest has wound (${t}s)`);
  for (let r0 = 0; r0 <= rMax; r0 += 0.5) {
    const tau = (t - START) / fallTime(r0, rMax);
    if (tau >= 1) continue; // already in
    const back = look((r0 * radius(tau)) / rMax) * rMax;
    ok(Math.abs(back - r0) < 1, `${r0}px reads back as ${back}px at ${t}s`);
    if (t <= START) ok(near(back, r0, 1e-3), `the table moves material at rest (${t}s)`);
  }
}
infall(CRUNCH, table);
ok(table.every((v) => v === -1), 'something is left at the crunch');
console.log('fall.check: ok');
