// The one runnable check for the big bang's fall maths. Run: node --experimental-strip-types src/scripts/fall.check.ts
import { CRUNCH, MAX_STRETCH, START, fallTime, radius, spin, stretch } from './fall.ts';

const ok = (cond: boolean, msg: string) => {
  if (!cond) throw new Error(`fall.check: ${msg}`);
};
const near = (a: number, b: number, e = 1e-6) => Math.abs(a - b) <= e;

ok(radius(0) === 1 && radius(1) === 0, 'radius runs 1 → 0');
// Free fall from rest starts slow: at half the fall time a copy has only dropped ~16% of the way (cos²η, η ≈ 0.416).
ok(near(radius(0.5), 0.838, 0.01), `r/r0 at half time is ${radius(0.5)}, not ~0.838`);
ok(spin(0) === 0 && near(spin(1), 1), 'spin runs 0 → 1');
for (let i = 1; i <= 200; i++) {
  const a = (i - 1) / 200;
  const b = i / 200;
  ok(radius(b) <= radius(a), `radius rises at τ ${b}`);
  ok(spin(b) >= spin(a), `spin falls back at τ ${b}`);
  ok(stretch(radius(b)) <= MAX_STRETCH, `stretch over the cap at τ ${b}`);
}
ok(stretch(1) === 1, 'no stretch at rest');
const rMax = 850;
ok(fallTime(100, rMax) < fallTime(400, rMax), 'far copies take longer');
ok(near(START + fallTime(rMax, rMax), CRUNCH, 1e-9), 'the corners arrive as the crunch ends');
ok(near(fallTime(2 * rMax, rMax), fallTime(rMax, rMax)), 'past the corner is capped');
console.log('fall.check: ok');
