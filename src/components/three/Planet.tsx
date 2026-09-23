// The signal body: a ringed planet of square, Bayer-dithered points plus a star field. Two draw calls
// (stars, planet). The planet geometry is instanced: 1 copy normally, 3 during a glitch burst, where
// copies 1 and 2 are the orange and cyan split of the points inside the glitch bands.
// Stars are instanced quads (one per star) so that during a warp they can stretch into streaks.
// Layout is in CSS pixels: the vertex shader maps the planet straight to the screen (orthographic),
// centred on the hero's `[data-planet-anchor]`, or parked small in the top-right corner without one.
//
// Events (window): `signal:warp` runs the 2.6s warp once (ignored while one runs or unless
// <html data-scene="on">, which Scene's Loop sets); `signal:pulse` {x, y} (client px) on the planet
// or its ring fires a short glitch burst.
//
// Tide: the home hero's black hole (BlackHole.tsx) tears the planet apart. E, the exposure, climbs while
// the hole pulls and falls once it lets go, and the planet re-forms. A point tears off once E passes its
// threshold: a base (outer ring ~0, inner ring ~0.5, sphere 0.55-0.65) plus up to FACE on the side away
// from the hole, so the outer ring goes first and the near side before the far. Torn points drift off, then
// plunge (screen px, near free-fall speed), flattening into the hole's disk plane with a last clockwise curl;
// nothing settles into orbit. At the horizon they hang, dimming and reddening as a distant observer would see
// them, until the hole gulps: everything waiting goes at once and its horizon swells (BlackHole). Out of reach,
// the planet re-forms in reverse order, flickering on.
import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, type RefObject } from 'react';
import * as THREE from 'three';
import type { Palette, Pointer, Tide } from './Scene';

const SPHERE = 5000;
const RING = 3000;
const STARS = 900;
const SPIN = (Math.PI * 2) / 90; // planet: one turn per 90s
const RING_SPIN = (Math.PI * 2) / 60; // ring at r = 1.5; outer ring is slower (Keplerian r^-1.5)
const TILT = 0.36; // ring seen ~20deg from above
export const ROLL = 0.32; // and rolled so it rises to the left
const PARALLAX = (6 * Math.PI) / 180; // max tilt from the pointer
export const SPAN = 4.5; // anchor side / SPAN = px per world unit (sphere radius 1, ring outer 2.4)
const BURST = 0.18; // s
const HEADER = 56; // px, sticky header height: the corner planet sits below it
const STAR_ALPHA = new THREE.Vector2(0.16, 0.5); // star alpha range
// Warp. One speed curve drives everything: cubic ease-in to PEAK, cubic ease-out to WARP.
// Stars fly along rays from the planet in log-radius (perspective), nearer stars faster: outbound from
// their rest spot until the peak, then cross-faded to an inbound ghost that lands back on it.
const WARP = 2.6; // s
const PEAK = 1; // s: top speed, the out/in swap and the glitch split
const FLY_IN = 1.2; // log-radius the inbound ghost of a depth-1 star starts inside its rest spot
const FLY_OUT = (FLY_IN * PEAK) / (WARP - PEAK); // same speed at the swap
const SHUTTER = 0.055; // s of travel drawn as the streak
export const RING_MINOR = 2.4 * Math.sin(TILT); // ring outer radius, projected minor axis
// Tide
const TEAR_RATE = 0.05; // E per second at full pull: the whole planet in ~20s
const MEND_RATE = 0.25; // E per second once nothing pulls
const TEAR_MAX = 500; // points torn off per second, at most
const FACE = 0.35;
const TIDE_STRETCH = 0.08; // the planet stretches toward the hole, at full pull
const TIDE_SCATTER = 0.35; // and its ring loosens (uScatter)
const GRAVITY = 1.2; // planet units^3/s^2, times the hero's px per unit cubed and the hole's mass
const DISK_K = 0.3; // the hole's disk, minor/major (BlackHole's DISK_TILT)
const CURL = 0.7; // tangential share of the plunge right at the horizon, fading by 2.5 radii
const HANG = 1.3; // horizon radii: where infalling points stop and wait for the gulp
const GULP_EVERY = 0.45; // s the first waiting point waits, at most
const GULP_FULL = 30; // points waiting that set off a gulp at once
const LIFT = 0.8; // s from a torn point's own drift to the flow
const FADE_IN = 0.35; // s from its place on the planet to the sim's, and of the re-form flicker
const FLICK = [0.8, 0.2, 1, 0.6]; // re-form presence steps (the .flicker keyframes)
const HOME = 0;
const TORN = 1;
const GONE = 2;
const MEND = 3;
const HUNG = 4; // waiting at the horizon

// ---------------------------------------------------------------------------------------------
// GLSL

export const common = /* glsl */ `
  const float BAYER[16] = float[16](0., 8., 2., 10., 12., 4., 14., 6., 3., 11., 1., 9., 15., 7., 13., 5.);
  float bayer(vec2 cell) {
    ivec2 c = ivec2(mod(cell, 4.0));
    return (BAYER[c.y * 4 + c.x] + 0.5) / 16.0;
  }
  float hash(float n) { return fract(sin(n) * 43758.5453); }
  #define HIDE { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); gl_PointSize = 0.0; vAlpha = 0.0; return; }
`;

const planetVertex = /* glsl */ `
  attribute float aKind;   // 0 sphere, 1 ring
  attribute float aSeed;   // 0..1
  attribute float aAlbedo; // surface bands / ring density
  attribute vec4 aFree;    // tide: on the planet (-, -, presence, 0) or torn off (x, y CSS px y up, blend in, 1)
  uniform mat3 uSphere;    // object -> view rotation (tilt, spin, parallax)
  uniform mat3 uRing;
  uniform vec3 uLight;     // view space, upper-left
  uniform vec2 uCenter;    // CSS px, y up
  uniform float uScale;    // CSS px per world unit
  uniform vec2 uRes;       // CSS px
  uniform float uDpr;
  uniform float uGrid;     // device px: point size and snapping grid
  uniform float uTime;
  uniform vec2 uPointer;   // CSS px, y up
  uniform vec3 uBand[3];   // glitch bands: centre y, half height, shift (world units)
  uniform float uSplit;
  uniform float uWhole;    // 0..1: the split copies cover every point, not just the bands (warp peak)
  uniform float uScatter;  // 0..1: ring particles pushed out of formation (warp, tide)
  uniform vec3 uTide;      // view xy toward the black hole, stretch
  uniform vec3 uSink;      // black hole: centre (CSS px, y up), horizon radius px (0: none)
  uniform float uHollow;   // 0..1: the sphere's near side is torn away, so its far side and the ring behind show
  uniform float uOpacity;
  uniform vec3 uInk;
  uniform vec3 uHot;
  uniform vec3 uCold;
  varying vec3 vColor;
  varying float vAlpha;
  ${common}

  void main() {
    bool torn = aFree.w > 0.5;
    if (!torn && aFree.z <= 0.0) HIDE // swallowed
    vec3 p;
    float b;
    float hot = 0.0;
    float cold = 0.0;
    float seen = 1.0; // dims what shows through a hollowed planet
    if (aKind < 0.5) {
      p = uSphere * position;
      if (p.z < 0.0 && !torn) {
        if (uHollow <= 0.0) HIDE
        seen = 0.45 * uHollow;
      }
      float d = dot(p, uLight);
      float limb = 1.0 - p.z;
      b = 0.02 + pow(max(d, 0.0), 0.6) * aAlbedo;
      // Launch orange on the terminator and on the lit limb, a thin cyan fringe on the dark limb.
      hot = smoothstep(-0.14, 0.04, d) * (1.0 - smoothstep(0.04, 0.3, d));
      hot = max(hot, smoothstep(0.8, 0.97, limb) * smoothstep(0.1, 0.45, d));
      cold = smoothstep(0.86, 0.98, limb) * smoothstep(-0.05, -0.35, d);
      b = max(b, max(hot * 0.72, cold * 0.42));
    } else {
      float r = length(position.xz);
      float a = uTime * ${RING_SPIN.toFixed(5)} * pow(1.5 / r, 1.5);
      float c = cos(a), s = sin(a);
      vec3 o = position * (1.0 + uScatter * (0.05 + 0.2 * hash(aSeed * 53.7)));
      o.y += uScatter * (hash(aSeed * 91.3) - 0.5) * 0.3;
      p = uRing * vec3(c * o.x - s * o.z, o.y, s * o.x + c * o.z);
      if (p.z < 0.0 && dot(p.xy, p.xy) < 1.0 && !torn) { // behind the planet
        if (uHollow <= 0.0) HIDE
        seen = uHollow;
      }
      // The planet's shadow on the ring, with an orange penumbra.
      float t = -dot(p, uLight);
      vec3 m = p + t * uLight;
      float lit = t > 0.0 ? smoothstep(0.85, 1.15, dot(m, m)) : 1.0;
      b = aAlbedo * mix(0.06, 0.78, lit);
      hot = 4.0 * lit * (1.0 - lit);
      b = max(b, hot * 0.5 * aAlbedo);
    }
    p.xy += uTide.xy * dot(p.xy, uTide.xy) * uTide.z; // tidal stretch, toward and away from the hole
    b *= seen;

    // Flicker: ~3% of points dip each second, for 250ms, to 55%.
    float slot = floor(uTime * 4.0 + aSeed * 9.0);
    b *= 1.0 - 0.45 * step(hash(aSeed * 113.1 + slot * 7.13), 0.008);

    vec3 col = mix(mix(uInk, uHot, clamp(hot, 0.0, 1.0)), uCold, clamp(cold, 0.0, 1.0));
    vec2 q = p.xy;
    if (torn) {
      // Ease from its place on the planet to the sim's; it heats toward launch orange near the hole, and once it
      // hangs at the horizon (z 1..2) it fades and reddens.
      float blend = min(aFree.z, 1.0);
      float hang = max(aFree.z - 1.0, 0.0);
      float heat = 1.0 - smoothstep(uSink.z * 1.5, uSink.z * 7.0, distance(aFree.xy, uSink.xy));
      q = mix(q, (aFree.xy - uCenter) / uScale, blend);
      b = mix(b, (0.35 + 0.65 * heat) * (1.0 - 0.75 * hang), blend);
      col = mix(col, mix(uInk, uHot, max(heat, hang)), blend);
    } else {
      b *= aFree.z;
    }
    float shift = 0.0;
    float inBand = 0.0;
    for (int i = 0; i < 3; i++) {
      if (abs(q.y - uBand[i].x) < uBand[i].y) { shift = uBand[i].z; inBand = 1.0; }
    }
    if (gl_InstanceID > 0) {
      float copy = max(inBand, uWhole);
      if (copy <= 0.0 || b < 0.12) HIDE
      bool orange = gl_InstanceID == 1;
      shift += orange ? uSplit : -uSplit;
      col = orange ? uHot : uCold;
      b = 0.67 * copy;
    }
    q.x += shift;

    vec2 px = uCenter + q * uScale;
    // Scanner: points near the pointer brighten a little.
    b += 0.28 * (1.0 - smoothstep(0.0, 110.0, distance(px, uPointer))) * step(0.02, b);

    // Snap to the point grid and quantise to 4 levels (0, 1/3, 2/3, 1) with ordered dither.
    vec2 cell = floor(px * uDpr / uGrid);
    float level = min(floor(b * 3.0 + bayer(cell)), 3.0) / 3.0;
    if (level <= 0.0) HIDE
    gl_Position = vec4((cell + 0.5) * uGrid / (uRes * uDpr) * 2.0 - 1.0, 0.0, 1.0);
    gl_PointSize = uGrid;
    vColor = col;
    vAlpha = level * uOpacity;
  }
`;

const planetFragment = /* glsl */ `
  uniform float uGrid;
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    // Scanline: the bottom device row of every point cell is dimmed, so rows of points read as a raster.
    float row = mod(gl_FragCoord.y - 0.5, uGrid);
    float scan = uGrid >= 3.0 && row < 0.5 ? 0.45 : 1.0;
    gl_FragColor = vec4(vColor, vAlpha * scan);
  }
`;

const starVertex = /* glsl */ `
  attribute vec3 aStar;  // x, y (0..1 of the viewport), depth 0.2..1
  attribute float aSeed;
  uniform vec2 uRes;
  uniform float uDpr;
  uniform float uTime;
  uniform vec3 uHole;    // planet centre (CSS px, y up) + radius: stars behind the disc are hidden
  uniform vec2 uAlpha;
  uniform float uDensity; // share of stars shown: fewer on small screens
  uniform vec4 uFly;     // warp, per unit depth: outbound (log-radius offset, streak), inbound (same)
  uniform vec2 uFlyMix;  // warp: inbound share, brightness boost
  uniform vec3 uSink;    // black hole: centre (CSS px, y up), horizon radius px
  varying float vAlpha;
  varying float vFade;
  ${common}

  void main() {
    // position: quad corner (x -1 tail .. 1 head, y side); z picks the outbound (0) or inbound (1) ghost.
    float w = position.z < 0.5 ? 1.0 - uFlyMix.x : uFlyMix.x;
    if (w <= 0.0 || fract(aSeed * 37.13) > uDensity) HIDE
    vec2 px = aStar.xy * uRes;
    px.x = mod(px.x + uTime * 1.2 * aStar.z, uRes.x); // slow drift
    // Point lens around the black hole, r' = (r + sqrt(r^2 + 4E^2)) / 2, back to rest by 10 horizon radii.
    vec2 ds = px - uSink.xy;
    float rs = length(ds);
    float reach = uSink.z * 10.0;
    if (rs > 0.0 && rs < reach) {
      float e = uSink.z * 1.8;
      float u = 1.0 - rs * rs / (reach * reach);
      px += ds / rs * u * u * (sqrt(rs * rs + 4.0 * e * e) - rs) * 0.5;
    }
    vec2 fly = (position.z < 0.5 ? uFly.xy : uFly.zw) * aStar.z;
    vec2 ray = px - uHole.xy;
    vec2 head = px + ray * (exp(fly.x) - 1.0); // exactly px at rest
    vec2 tail = px + ray * (exp(fly.x - fly.y) - 1.0);
    if (distance(head, uHole.xy) < uHole.z) HIDE
    // At rest the quad is the g x g cell a point sprite would cover; warping, it spans tail..head.
    float g = max(1.0, floor((aSeed > 0.93 ? 2.0 : 1.0) * uDpr + 0.5));
    vec2 h = (floor(head * uDpr / g) + 0.5) * g;
    vec2 d = h - (floor(tail * uDpr / g) + 0.5) * g;
    float len = length(d);
    vec2 dir = len > 0.0 ? d / len : vec2(1.0, 0.0);
    float end = position.x * 0.5 + 0.5;
    vec2 c = h - d * (1.0 - end) + (dir * position.x + vec2(-dir.y, dir.x) * position.y) * g * 0.5;
    gl_Position = vec4(c / (uRes * uDpr) * 2.0 - 1.0, 0.0, 1.0);
    float slot = floor(uTime * 3.0 + aSeed * 11.0);
    float blink = step(hash(aSeed * 71.3 + slot), 0.012);
    vAlpha = mix(uAlpha.x, uAlpha.y, fract(aSeed * 13.7)) * (1.0 - 0.45 * blink) * w * (1.0 + uFlyMix.y);
    vFade = mix(1.0 - smoothstep(0.0, 4.0 * g, len), 1.0, end); // streak tails fade out
  }
`;

const starFragment = /* glsl */ `
  uniform vec3 uInk;
  uniform vec3 uHole;
  uniform float uDpr;
  varying float vAlpha;
  varying float vFade;
  ${common}
  void main() {
    if (distance(gl_FragCoord.xy / uDpr, uHole.xy) < uHole.z) discard; // streaks pass behind the disc
    gl_FragColor = vec4(uInk, vAlpha * floor(vFade * 3.0 + bayer(gl_FragCoord.xy)) / 3.0);
  }
`;

// ---------------------------------------------------------------------------------------------
// Geometry (built once)

// Ring bands: [inner, outer, share of points, albedo]. The gap at 2.06-2.14 is the Cassini division.
const BANDS = [
  [1.5, 1.74, 0.16, 0.42],
  [1.78, 2.06, 0.5, 1],
  [2.14, 2.4, 0.34, 0.72],
] as const;

function planetGeometry() {
  const n = SPHERE + RING;
  const position = new Float32Array(n * 3);
  const kind = new Float32Array(n);
  const seed = new Float32Array(n);
  const albedo = new Float32Array(n);
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < SPHERE; i++) {
    const y = 1 - (2 * (i + 0.5)) / SPHERE;
    const r = Math.sqrt(1 - y * y);
    const lon = i * golden;
    position.set([Math.cos(lon) * r, y, Math.sin(lon) * r], i * 3);
    // Gas-giant bands that wobble with longitude, so the spin is visible.
    albedo[i] = 0.86 + 0.14 * Math.sin(y * 12 + 0.9 * Math.sin(lon * 2 + y * 4));
    seed[i] = Math.random();
  }
  for (let i = SPHERE; i < n; i++) {
    let u = Math.random();
    const band = BANDS.find((b) => (u -= b[2]) < 0) ?? BANDS[1];
    const r = Math.sqrt(band[0] ** 2 + Math.random() * (band[1] ** 2 - band[0] ** 2));
    const a = Math.random() * Math.PI * 2;
    position.set([Math.cos(a) * r, (Math.random() - 0.5) * 0.03, Math.sin(a) * r], i * 3);
    kind[i] = 1;
    albedo[i] = band[3] * (0.65 + 0.35 * Math.random());
    seed[i] = Math.random();
  }
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(position, 3));
  g.setAttribute('aKind', new THREE.BufferAttribute(kind, 1));
  g.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));
  g.setAttribute('aAlbedo', new THREE.BufferAttribute(albedo, 1));
  const free = new Float32Array(n * 4);
  for (let i = 0; i < n; i++) free[i * 4 + 2] = 1;
  g.setAttribute('aFree', new THREE.BufferAttribute(free, 4).setUsage(THREE.DynamicDrawUsage));
  g.instanceCount = 1;
  return g;
}

function starGeometry() {
  const star = new Float32Array(STARS * 3);
  const seed = new Float32Array(STARS);
  for (let i = 0; i < STARS; i++) {
    star.set([Math.random(), Math.random(), 0.2 + Math.random() * 0.8], i * 3); // x, y (0..1), depth
    seed[i] = Math.random();
  }
  // Two quads per star: the star itself and its inbound warp ghost (drawn only while warping).
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0, -1, -1, 1, 1, -1, 1, 1, 1, 1, -1, 1, 1], 3));
  g.setIndex([0, 1, 2, 0, 2, 3, 4, 5, 6, 4, 6, 7]);
  g.setAttribute('aStar', new THREE.InstancedBufferAttribute(star, 3));
  g.setAttribute('aSeed', new THREE.InstancedBufferAttribute(seed, 1));
  g.instanceCount = STARS;
  g.setDrawRange(0, 6);
  return g;
}

const v3 = (c: THREE.Vector3) => ({ value: c.clone() });
export const material = (vertexShader: string, fragmentShader: string, uniforms: Record<string, THREE.IUniform>) =>
  new THREE.ShaderMaterial({ vertexShader, fragmentShader, uniforms, transparent: true, depthTest: false, depthWrite: false });

const X = new THREE.Vector3(1, 0, 0);
const Y = new THREE.Vector3(0, 1, 0);
const Z = new THREE.Vector3(0, 0, 1);
const BASE = new THREE.Quaternion().setFromAxisAngle(Z, ROLL).multiply(new THREE.Quaternion().setFromAxisAngle(X, TILT));
const LIGHT = new THREE.Vector3(-0.62, 0.5, 0.6).normalize();

const smooth = (x: number) => x * x * (3 - 2 * x);
const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
const hash = (n: number) => {
  const x = Math.sin(n) * 43758.5453;
  return x - Math.floor(x);
};

// ---------------------------------------------------------------------------------------------
// Tide (see the header). Sim space is the vertex shader's: CSS px, y up.

type Sim = ReturnType<typeof makeSim>;

function makeSim(g: THREE.InstancedBufferGeometry) {
  const pos = g.attributes.position.array as Float32Array;
  const kind = g.attributes.aKind.array as Float32Array;
  const seed = g.attributes.aSeed.array as Float32Array;
  const attr = g.attributes.aFree as THREE.BufferAttribute;
  const n = kind.length;
  const base = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const r = Math.hypot(pos[i * 3], pos[i * 3 + 2]);
    base[i] = kind[i] < 0.5 ? 0.55 + 0.1 * seed[i] : (0.5 * (2.4 - r)) / 0.9 + 0.04 * hash(seed[i] * 17.1);
  }
  return {
    pos,
    kind,
    seed,
    attr,
    free: attr.array as Float32Array,
    base,
    state: new Uint8Array(n),
    born: new Float32Array(n), // s: torn off, or began to re-form
    drift: new Float32Array(n * 2), // px/s, the kick it tore off with
    e: 0,
    torn: 0, // in flight or hanging
    hung: 0,
    hungAt: 0, // s the first of them began to wait
    mending: 0,
    lost: 0, // not HOME
    lostSphere: 0,
    near: false, // the pull has fired its glitch burst
  };
}

function resetSim(s: Sim) {
  s.state.fill(HOME);
  for (let i = 0; i < s.state.length; i++) {
    s.free[i * 4 + 2] = 1;
    s.free[i * 4 + 3] = 0;
  }
  s.e = s.torn = s.hung = s.mending = s.lost = s.lostSphere = 0;
  s.attr.needsUpdate = true;
}

type Place = {
  t: number;
  dt: number;
  cx: number; // planet centre, sim space
  cy: number;
  scale: number; // planet px per unit
  h: number; // canvas height (client y -> sim y)
  sphere: ArrayLike<number>; // uSphere / uRing elements (column-major)
  ring: ArrayLike<number>;
  scatter: number;
  tide: THREE.Vector3; // uTide
  tearing: boolean;
};

/** 0..1 as the sphere's near side (about half its points) is torn away. */
const hollowness = (s: Sim) => clamp01(s.lostSphere / (SPHERE * 0.45));

/** One step. Returns true while anything moves (then every frame is rendered). */
function stepSim(s: Sim, T: Tide, f: Place) {
  if (!T.on) {
    if (s.lost || s.e) resetSim(s);
    return false;
  }
  const pull = T.pull;
  s.e = pull > 0 ? Math.min(1.05, s.e + f.dt * TEAR_RATE * pull ** 1.5) : Math.max(0, s.e - f.dt * MEND_RATE);
  if (!s.lost && !s.e) return false;

  const { pos, kind, seed, free, base, state, born, drift } = s;
  const n = state.length;
  const hx = T.x;
  const hy = f.h - T.y;
  const R = T.r;
  const gm = GRAVITY * T.scale ** 3 * (1 + 3 * T.eaten);
  // The hole in planet units, for the facing term.
  const ux = (hx - f.cx) / f.scale;
  const uy = (hy - f.cy) / f.scale;
  const near = Math.hypot(ux, uy) - 2.4;
  const M = f.sphere;
  const W = f.ring;
  const { x: tx, y: ty, z: amt } = f.tide;
  const hollow = hollowness(s);
  let budget = f.tearing ? Math.max(1, Math.round(TEAR_MAX * f.dt)) : 0;
  let changed = s.torn > 0 || s.mending > 0;
  const gulp = s.hung > 0 && (s.hung >= GULP_FULL || f.t - s.hungAt > GULP_EVERY);
  if (gulp) {
    T.gulpAt = f.t;
    T.gulpSize = Math.min(1, 0.35 + s.hung / 60);
    T.fed = Math.min(1, T.fed + 0.5 * T.gulpSize);
  }

  for (let i = 0; i < n; i++) {
    const j = i * 4;
    const st = state[i];
    if (st === HOME) {
      if (!budget || base[i] >= s.e) continue;
      // Its view position, as the vertex shader places it (the scatter hash may differ in the last bits
      // on the GPU; the blend-in hides that).
      const x0 = pos[i * 3];
      const y0 = pos[i * 3 + 1];
      const z0 = pos[i * 3 + 2];
      let px: number, py: number;
      if (kind[i] < 0.5) {
        if (M[2] * x0 + M[5] * y0 + M[8] * z0 < 0 && hollow < 0.9) continue;
        px = M[0] * x0 + M[3] * y0 + M[6] * z0;
        py = M[1] * x0 + M[4] * y0 + M[7] * z0;
      } else {
        const a = f.t * RING_SPIN * (1.5 / Math.hypot(x0, z0)) ** 1.5;
        const c = Math.cos(a);
        const sn = Math.sin(a);
        const g = 1 + f.scatter * (0.05 + 0.2 * hash(seed[i] * 53.7));
        const ox = c * x0 * g - sn * z0 * g;
        const oy = y0 * g + f.scatter * (hash(seed[i] * 91.3) - 0.5) * 0.3;
        const oz = sn * x0 * g + c * z0 * g;
        px = W[0] * ox + W[3] * oy + W[6] * oz;
        py = W[1] * ox + W[4] * oy + W[7] * oz;
        if (W[2] * ox + W[5] * oy + W[8] * oz < 0 && px * px + py * py < 1 && hollow < 0.5) continue;
      }
      const d = px * tx + py * ty;
      px += tx * d * amt;
      py += ty * d * amt;
      const face = clamp01(1 - (Math.hypot(px - ux, py - uy) - near) / 4.8);
      if (s.e < base[i] + FACE * (1 - face)) continue;
      budget--;
      changed = true;
      state[i] = TORN;
      s.torn++;
      s.lost++;
      if (kind[i] < 0.5) s.lostSphere++;
      born[i] = f.t;
      free[j] = f.cx + px * f.scale;
      free[j + 1] = f.cy + py * f.scale;
      free[j + 2] = 0;
      free[j + 3] = 1;
      // Kick: outward from the planet's centre, with some spread.
      const l = Math.hypot(px, py) || 1;
      const k = f.scale * (0.2 + 0.25 * hash(seed[i] * 7.7));
      drift[i * 2] = (px / l) * k + (Math.random() - 0.5) * f.scale * 0.2;
      drift[i * 2 + 1] = (py / l) * k + (Math.random() - 0.5) * f.scale * 0.2;
    } else if (st === TORN) {
      const age = f.t - born[i];
      const dx = free[j] - hx;
      const dy = free[j + 1] - hy;
      // Near the hole the fall lies in its disk plane: squash y by the disk's tilt.
      const k = DISK_K + (1 - DISK_K) * smooth(clamp01((Math.hypot(dx, dy) - 2 * R) / (5 * R)));
      const qy = dy / k;
      const r = Math.hypot(dx, qy);
      if (r < R * HANG) {
        state[i] = HUNG;
        if (!s.hung++) s.hungAt = f.t;
        born[i] = f.t;
        drift[i * 2] = dx;
        drift[i * 2 + 1] = dy;
        continue;
      }
      // A plunge, faster the deeper it falls, with a last clockwise curl; stepped in polar form (exact turns).
      const v = Math.sqrt((2 * gm) / r) * (0.8 + 0.4 * seed[i]);
      const turn = CURL * Math.min(1, (2.5 * R) / r);
      const shrink = Math.max(0, r - v * (1 - turn) * f.dt) / r;
      const a = (-turn * v * f.dt) / r;
      const c = Math.cos(a) * shrink;
      const sn = Math.sin(a) * shrink;
      const m = smooth(clamp01(age / LIFT));
      free[j] += lerp(drift[i * 2] * f.dt, dx * c - qy * sn - dx, m);
      free[j + 1] += lerp(drift[i * 2 + 1] * f.dt, (dx * sn + qy * c) * k - dy, m);
      free[j + 2] = clamp01(age / FADE_IN);
    } else if (st === HUNG) {
      if (gulp) {
        state[i] = GONE;
        s.torn--;
        free[j + 2] = 0;
        free[j + 3] = 0;
        continue;
      }
      // Frozen at the horizon, riding along with the hole; 1..2 tells the shader how far it has faded.
      free[j] = hx + drift[i * 2];
      free[j + 1] = hy + drift[i * 2 + 1];
      free[j + 2] = 1 + clamp01((f.t - born[i]) / 0.5);
    } else if (st === GONE) {
      if (pull > 0 || s.e > base[i]) continue;
      changed = true;
      state[i] = MEND;
      born[i] = f.t;
      s.mending++;
    } else {
      const a = (f.t - born[i]) / FADE_IN;
      if (a < 1) {
        free[j + 2] = FLICK[Math.floor(a * 4)];
        continue;
      }
      state[i] = HOME;
      free[j + 2] = 1;
      s.mending--;
      s.lost--;
      if (kind[i] < 0.5) s.lostSphere--;
    }
  }
  if (gulp) s.hung = 0;
  if (changed) s.attr.needsUpdate = true;
  T.eaten = (s.lost - s.torn - s.mending) / n;
  return s.torn > 0 || s.mending > 0;
}

// ---------------------------------------------------------------------------------------------

type Props = { pointer: RefObject<Pointer>; palette: RefObject<Palette>; tide: RefObject<Tide> };

export default function Planet({ pointer, palette, tide }: Props) {
  const invalidate = useThree((s) => s.invalidate);
  const scene = useMemo(() => {
    const pal = palette.current;
    const planet = planetGeometry();
    const stars = starGeometry();
    const planetMat = material(planetVertex, planetFragment, {
      uSphere: { value: new THREE.Matrix3() },
      uRing: { value: new THREE.Matrix3() },
      uLight: { value: LIGHT },
      uCenter: { value: new THREE.Vector2() },
      uScale: { value: 1 },
      uRes: { value: new THREE.Vector2(1, 1) },
      uDpr: { value: 1 },
      uGrid: { value: 3 },
      uTime: { value: 0 },
      uPointer: { value: new THREE.Vector2(-1e4, -1e4) },
      uBand: { value: [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()] },
      uSplit: { value: 0 },
      uWhole: { value: 0 },
      uScatter: { value: 0 },
      uTide: { value: new THREE.Vector3() },
      uSink: { value: new THREE.Vector3() },
      uHollow: { value: 0 },
      uOpacity: { value: 0 },
      uInk: v3(pal.ink),
      uHot: v3(pal.hot),
      uCold: v3(pal.cold),
    });
    const starMat = material(starVertex, starFragment, {
      uRes: planetMat.uniforms.uRes,
      uDpr: planetMat.uniforms.uDpr,
      uTime: planetMat.uniforms.uTime,
      uHole: { value: new THREE.Vector3() },
      uAlpha: { value: STAR_ALPHA.clone() },
      uDensity: { value: 1 },
      uFly: { value: new THREE.Vector4() },
      uFlyMix: { value: new THREE.Vector2() },
      uInk: planetMat.uniforms.uInk,
      uSink: planetMat.uniforms.uSink,
    });
    starMat.side = THREE.DoubleSide;
    planetMat.blending = starMat.blending = THREE.AdditiveBlending;
    return { planet, stars, planetMat, starMat, sim: makeSim(planet) };
    // The palette is read once: one theme.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Mutable per-frame state; nothing below allocates per frame except getBoundingClientRect.
  const st = useMemo(
    () => ({
      anchor: null as Element | null,
      x: 0,
      y: 0,
      side: 0,
      opacity: 0,
      par: new THREE.Vector2(),
      nextBurst: 2.5 + Math.random() * 2,
      burstStart: -1,
      burstEnd: 0,
      nextJitter: 0,
      strong: 1, // glitch band size multiplier
      hit: false, // a signal:pulse landed on the planet; burst on the next frame
      warpAt: -1, // warp start (clock s); -1 idle, Infinity requested
      q: new THREE.Quaternion(),
      spin: new THREE.Quaternion(),
      e: new THREE.Euler(),
      m: new THREE.Matrix4(),
      place: { t: 0, dt: 0, cx: 0, cy: 0, scale: 1, h: 1, sphere: [], ring: [], scatter: 0, tide: new THREE.Vector3(), tearing: false } as Place,
    }),
    [],
  );

  useEffect(() => {
    // The island persists across ClientRouter navigations: re-find the anchor on every page.
    const find = () => (st.anchor = document.querySelector('[data-planet-anchor]'));
    // While the anchored planet scrolls with the hero, render at scroll rate instead of 30fps.
    const onScroll = () => st.anchor && invalidate();
    const onWarp = () => {
      if (st.warpAt !== -1 || document.documentElement.dataset.scene !== 'on') return;
      st.warpAt = Infinity;
      invalidate();
    };
    // Hit test in planet units: the disc, or the ring's ellipse (rolled by ROLL; parallax ignored).
    const onPulse = (e: Event) => {
      const p = (e as CustomEvent<{ x?: number; y?: number } | null>).detail;
      if (typeof p?.x !== 'number' || typeof p.y !== 'number' || !st.side) return;
      const k = SPAN / st.side;
      const dx = (p.x - st.x) * k;
      const dy = (st.y - p.y) * k;
      const rx = dx * Math.cos(ROLL) + dy * Math.sin(ROLL);
      const ry = dy * Math.cos(ROLL) - dx * Math.sin(ROLL);
      if (dx * dx + dy * dy > 1.1 && (rx / 2.4) ** 2 + (ry / RING_MINOR) ** 2 > 1) return;
      st.hit = true;
      invalidate();
    };
    find();
    document.addEventListener('astro:after-swap', find);
    document.addEventListener('astro:page-load', find);
    addEventListener('scroll', onScroll, { passive: true });
    addEventListener('signal:warp', onWarp);
    addEventListener('signal:pulse', onPulse);
    return () => {
      document.removeEventListener('astro:after-swap', find);
      document.removeEventListener('astro:page-load', find);
      removeEventListener('scroll', onScroll);
      removeEventListener('signal:warp', onWarp);
      removeEventListener('signal:pulse', onPulse);
    };
  }, [invalidate, st]);

  useEffect(
    () => () => {
      scene.planet.dispose();
      scene.stars.dispose();
      scene.planetMat.dispose();
      scene.starMat.dispose();
    },
    [scene],
  );

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.1);
    const t = state.clock.elapsedTime;
    const { width: w, height: h } = state.size;
    const dpr = state.viewport.dpr;
    const kMove = 1 - Math.exp(-dt / 0.12);
    const kColor = 1 - Math.exp(-dt / 0.08);
    const u = scene.planetMat.uniforms;
    const ptr = pointer.current;

    // Placement: anchor rect (home hero) blending into the corner slot as the anchor scrolls away.
    const corner = Math.min(Math.max(w * 0.15, 130), 230);
    let x = w - corner * 0.5 - 12;
    let y = HEADER + corner * 0.3 + 12;
    let side = corner;
    // Corner planet is small, so thousands of points stack into few cells; additive blending needs a low alpha.
    let opacity = 0.12;
    const anchor = st.anchor?.isConnected ? st.anchor : null;
    if (anchor) {
      const r = anchor.getBoundingClientRect();
      const gone = smooth(clamp01(-r.top / Math.max(r.height, 1)));
      x = lerp(r.left + r.width / 2, x, gone);
      y = Math.max(lerp(r.top + r.height / 2, y, gone), y); // rises into the corner slot, never under the header
      side = lerp(Math.min(r.width, r.height), side, gone);
      opacity = lerp(w < 768 ? 0.55 : 1, 0.08, gone);
    }
    if (st.side === 0) {
      st.x = x;
      st.y = y;
      st.side = side;
    }
    st.x = lerp(st.x, x, kMove);
    st.y = lerp(st.y, y, kMove);
    st.side = lerp(st.side, side, kMove);
    st.opacity = lerp(st.opacity, opacity, kColor * 0.5);

    const scale = st.side / SPAN;
    const grid = Math.max(2, Math.round(Math.min(Math.max(scale / 38, 1.5), 3) * dpr));
    u.uCenter.value.set(st.x, h - st.y);
    u.uScale.value = scale;
    u.uRes.value.set(w, h);
    u.uDpr.value = dpr;
    u.uGrid.value = grid;
    u.uTime.value = t;
    u.uOpacity.value = st.opacity;
    u.uPointer.value.set(ptr.px, h - ptr.py);

    // Warp: every frame while it runs (the Loop's 30fps cap resumes after). `travel` is the integral
    // of `speed`, so whole extra turns land the spin exactly where it would have been.
    if (st.warpAt === Infinity) {
      st.warpAt = t;
      // The peak glitch rides on the burst machinery; no regular burst during or just after.
      st.burstStart = st.nextJitter = t + PEAK - 0.08;
      st.burstEnd = t + PEAK + 0.26;
      st.strong = 2.2;
      st.nextBurst = t + WARP + 3 + Math.random() * 3;
    }
    const wt = st.warpAt >= 0 ? t - st.warpAt : -1;
    if (wt >= WARP) st.warpAt = -1;
    const warping = wt >= 0 && wt < WARP;
    let travel = 0;
    let speed = 0;
    let glitch = 0;
    const fly = scene.starMat.uniforms.uFly.value as THREE.Vector4;
    const flyMix = scene.starMat.uniforms.uFlyMix.value as THREE.Vector2;
    if (warping) {
      invalidate();
      const a = wt / PEAK; // outbound: keeps accelerating past the peak while it fades
      const b = 1 - Math.max(-0.3, (wt - PEAK) / (WARP - PEAK)); // inbound: share of the way left to go
      travel = wt < PEAK ? (PEAK * a ** 3) / WARP : (PEAK + (WARP - PEAK) * (1 - b ** 3)) / WARP;
      speed = wt < PEAK ? a * a : b * b;
      glitch = wt < PEAK ? smooth(clamp01((wt - PEAK + 0.08) / 0.08)) : 1 - smooth(clamp01((wt - PEAK) / 0.26));
      fly.set(FLY_OUT * a ** 3, ((3 * FLY_OUT * a * a) / PEAK) * SHUTTER, -FLY_IN * b ** 3, ((3 * FLY_IN * b * b) / (WARP - PEAK)) * SHUTTER);
      flyMix.set(smooth(clamp01((wt - PEAK + 0.12) / 0.24)), 0.7 * speed);
    } else {
      fly.set(0, 0, 0, 0);
      flyMix.set(0, 0);
    }
    scene.stars.drawRange.count = warping ? 12 : 6;
    const T = tide.current;
    T.px = st.x;
    T.py = st.y;
    T.ps = scale;
    u.uScatter.value = Math.max(speed, TIDE_SCATTER * T.pull);
    u.uWhole.value = 0.8 * glitch;
    u.uSplit.value = (Math.max((grid / dpr) * 1.5, 4) / scale) * (1 + 3 * glitch);

    // Orientation: pointer parallax (<= 6deg) * fixed tilt; the sphere also spins about its axis.
    // Warp: the ring gains two turns (it turns the other way), the sphere one.
    st.par.x = lerp(st.par.x, -ptr.y * PARALLAX, kMove * 0.5);
    st.par.y = lerp(st.par.y, ptr.x * PARALLAX, kMove * 0.5);
    st.q.setFromEuler(st.e.set(st.par.x, st.par.y, 0)).multiply(BASE);
    if (warping) st.q.multiply(st.spin.setFromAxisAngle(Y, -4 * Math.PI * travel));
    u.uRing.value.setFromMatrix4(st.m.makeRotationFromQuaternion(st.q));
    st.q.multiply(st.spin.setFromAxisAngle(Y, t * SPIN + 6 * Math.PI * travel));
    u.uSphere.value.setFromMatrix4(st.m.makeRotationFromQuaternion(st.q));

    // Tide: stretch toward the hole, a glitch burst as its pull takes hold, then the sim.
    const toward = (u.uTide.value as THREE.Vector3).set(T.x - st.x, st.y - T.y, 0);
    const reach = toward.length();
    toward.set(toward.x / (reach || 1), toward.y / (reach || 1), T.on ? TIDE_STRETCH * T.pull : 0);
    u.uSink.value.set(T.x, h - T.y, T.on ? T.r : 0);
    if (T.pull > 0.2 && !scene.sim.near) {
      scene.sim.near = st.hit = true;
    } else if (T.pull < 0.05) scene.sim.near = false;
    const f = st.place;
    f.t = t;
    f.dt = dt;
    f.cx = st.x;
    f.cy = h - st.y;
    f.scale = scale;
    f.h = h;
    f.sphere = u.uSphere.value.elements;
    f.ring = u.uRing.value.elements;
    f.scatter = u.uScatter.value;
    f.tide = u.uTide.value;
    f.tearing = !warping;
    if (stepSim(scene.sim, T, f)) invalidate();
    u.uHollow.value = hollowness(scene.sim);

    // Glitch burst every 5-9s for 180ms: 2-3 bands, re-cut once halfway through. A pulse on the planet
    // fires one early, at most every 0.4s so rapid clicks cannot strobe.
    if (st.hit) {
      st.hit = false;
      if (!warping && t - st.burstStart > 0.4) {
        st.burstStart = st.nextJitter = t;
        st.burstEnd = t + BURST;
        st.strong = 1.4;
        st.nextBurst = Math.max(st.nextBurst, t + 3);
      }
    }
    if (t >= st.nextBurst) {
      st.burstStart = st.nextJitter = t;
      st.burstEnd = t + BURST;
      st.strong = 1;
      st.nextBurst = t + 5 + Math.random() * 4;
    }
    const bursting = t >= st.burstStart && t < st.burstEnd;
    const bands = u.uBand.value as THREE.Vector3[];
    if (bursting && t >= st.nextJitter) {
      st.nextJitter = t + (st.burstEnd - st.burstStart) / 2;
      const count = Math.random() < 0.5 ? 2 : 3;
      for (let i = 0; i < 3; i++) {
        const dir = Math.random() < 0.5 ? -1 : 1;
        const k = st.strong;
        if (i < count) bands[i].set(-1.2 + Math.random() * 2.4, (0.04 + Math.random() * 0.1) * k, dir * (0.08 + Math.random() * 0.2) * k);
        else bands[i].set(0, 0, 0);
      }
    } else if (!bursting && bands[0].y !== 0) {
      for (const b of bands) b.set(0, 0, 0);
    }
    scene.planet.instanceCount = bursting ? 3 : 1;

    const s = scene.starMat.uniforms;
    s.uDensity.value = Math.min(1, (w * h) / (1440 * 900));
    // Stars hide behind the disc; as the sphere is torn away they show through.
    s.uHole.value.set(st.x, h - st.y, st.opacity > 0.5 ? scale * (1 - scene.sim.lostSphere / SPHERE) : 0);
  });

  return (
    <>
      <mesh geometry={scene.stars} material={scene.starMat} frustumCulled={false} renderOrder={0} />
      <points geometry={scene.planet} material={scene.planetMat} frustumCulled={false} renderOrder={1} />
    </>
  );
}

