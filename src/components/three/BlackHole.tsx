// The home page's black hole. Its hit area is Hero's `[data-black-hole]`; this binds it and draws the hole under
// it: one quad, shaded per point cell like the planet (grid snap, 4 dithered levels, scanline). A shadow, a thin
// photon ring, and a tilted accretion disk turning clockwise, brighter on its approaching (right) side, whose far
// half is lensed into an arc over the shadow. It swells for a moment each time it gulps (Planet decides when).
//
// It is heavy: a drag pulls it along on a damped spring, and let go it glides to a stop; it gets heavier (up to
// 1 + MASS) as it eats the planet. It goes anywhere in <main> (it scrolls with the page) except onto the planet:
// wherever the planet is drawn, it is kept CLEAR horizon radii (its disk) off the planet's outline. Its pull fades
// from full there to none REACH radii further out. From the keyboard it is a slider whose value is that pull.
//
// It bends what lies behind it: the dust (field.ts, through `signal:hole`) and the text around it (bend.ts).
import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, type RefObject } from 'react';
import * as THREE from 'three';
import { createBend } from './bend';
import { common, material, RING_MINOR, ROLL, SPAN } from './Planet';
import type { Palette, Tide } from './Scene';

const HORIZON = 0.15; // planet units at the hero's scale (sphere radius 1)
const EXTENT = 3.6; // quad half size, horizon radii
const GROW = 0.35; // the horizon grows by this share once the whole planet is swallowed
const DISK_TILT = 0.3; // minor/major axis of the disk as seen
const CLEAR = 3.2; // horizon radii (its disk) kept between it and the planet's outline, plus 6px
const REACH = 9; // horizon radii beyond that, where its pull fades to nothing
const MASS = 3; // extra mass once the whole planet is eaten
const SPRING = 9; // rad/s: how fast a drag pulls it along, at rest mass
const DAMP = 0.8;
const GLIDE = 4; // 1/s: how fast it slows once let go, at rest mass
const STEP = 24; // px per arrow key, toward or away from the planet
const GULP = 0.32; // s
// Where it rests, tried in order (angle from the planet's centre, y up): lower left, lower right, upper left, upper right.
const REST = [-2.4, -0.75, 2.4, 0.75];

const vertex = /* glsl */ `
  uniform vec3 uSink; // centre (CSS px, y up), horizon radius px
  uniform float uGulp;
  uniform vec2 uRes;
  void main() {
    float extent = ${EXTENT.toFixed(1)} + uGulp;
    gl_Position = vec4((uSink.xy + position.xy * uSink.z * extent) / uRes * 2.0 - 1.0, 0.0, 1.0);
  }
`;

const fragment = /* glsl */ `
  uniform vec3 uSink;
  uniform float uDpr;
  uniform float uGrid;
  uniform float uTime;
  uniform float uFeed;
  uniform float uGulp;     // 0..1: the horizon swells as it swallows
  uniform vec3 uInk;
  uniform vec3 uHot;
  uniform vec3 uShadow;
  ${common}

  // Disk brightness at disk-plane radius r (horizon radii) and angle a; it turns clockwise, Keplerian.
  float disk(float r, float a) {
    float outer = 3.1 + 0.5 * uFeed;
    float body = smoothstep(1.55, 1.8, r) * (1.0 - smoothstep(outer - 0.7, outer, r)) * pow(1.6 / r, 1.3);
    float ph = a + uTime * 2.4 * pow(1.6 / r, 1.5);
    return body * (0.62 + 0.38 * sin(ph * 5.0 + r * 7.0) * sin(ph * 3.0 - r * 11.0 + 1.7));
  }

  void main() {
    // Shade the whole point cell from its centre, so the hole is built from the same squares as the planet.
    vec2 cell = floor(gl_FragCoord.xy / uGrid);
    vec2 p = ((cell + 0.5) * uGrid / uDpr - uSink.xy) / uSink.z;
    float r = length(p);
    float swell = 1.0 + 0.22 * uGulp;
    bool shadow = r < swell;

    // Direct image: the near half crosses in front of the shadow, the far half hides behind it.
    vec2 d = vec2(p.x, p.y / ${DISK_TILT.toFixed(2)});
    float rd = length(d);
    float b = shadow && p.y > 0.0 ? 0.0 : disk(rd, atan(d.y, d.x)) * (1.0 + 0.6 * d.x / rd);
    float hot = 1.0 - smoothstep(1.7, 2.6, rd);
    // Lensed image of the far half: an arc over the top of the shadow, 1.15..2.2 radii for the disk's 1.6..3.1.
    if (p.y > 0.0 && !shadow) {
      float rl = 1.6 + (r - 1.15) * 1.45;
      float arc = disk(rl, -atan(p.y, p.x)) * (1.0 + 0.6 * p.x / r) * smoothstep(0.0, 0.5, p.y) * 0.85;
      if (arc > b) { b = arc; hot = 1.0 - smoothstep(1.7, 2.6, rl); }
    }
    // Photon ring; it flares with each gulp.
    float ring = 1.0 - smoothstep(0.0, 0.1, abs(r - 1.1 * swell));
    b = max(b, ring * (0.85 + 0.6 * uGulp));
    b *= 1.0 + 0.9 * uFeed;

    float level = min(floor(b * 3.0 + bayer(cell)), 3.0) / 3.0;
    float row = mod(gl_FragCoord.y - 0.5, uGrid);
    float a = level * (uGrid >= 3.0 && row < 0.5 ? 0.45 : 1.0);
    vec3 col = mix(uInk, uHot, clamp(hot, 0.0, 1.0));
    if (shadow) { gl_FragColor = vec4(mix(uShadow, col, a), 1.0); return; }
    if (level <= 0.0) discard;
    gl_FragColor = vec4(col, a);
  }
`;

const clamp = (x: number, a: number, b: number) => Math.min(b, Math.max(a, x));
const smooth = (x: number) => x * x * (3 - 2 * x);

/** Distance from the planet's centre to its outline (disc or ring ellipse) at angle th (y up), planet units. */
function outline(th: number) {
  const a = th - ROLL;
  return Math.max(1, 1 / Math.hypot(Math.cos(a) / 2.4, Math.sin(a) / RING_MINOR));
}
/** How far (px) the hole's centre must stay from the planet's centre at angle th. */
const clearance = (th: number, ps: number, R: number) => outline(th) * ps + CLEAR * R + 6;

// Positions are px from the hero's top-left, so the hole scrolls with the page.
function makeState() {
  return {
    handle: null as HTMLElement | null,
    hero: null as HTMLElement | null,
    main: null as HTMLElement | null,
    anchor: null as HTMLElement | null,
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    tx: 0, // where a drag or a key is taking it
    ty: 0,
    cx: 0, // pointer while held (client px)
    cy: 0,
    gx: 0, // grab offset
    gy: 0,
    held: false,
    seek: false, // heading for (tx, ty) after a key
    placed: false,
    moved: false, // has left its resting place (until then a resize re-rests it)
    pct: -1,
    hl: 0, // hero's client left/top, this frame
    ht: 0,
    l: 0, // walls
    r: 0,
    t: 0,
    b: 0,
    sent: { x: NaN, y: NaN, r: 0, held: false }, // last `signal:hole`
  };
}
type State = ReturnType<typeof makeState>;

/** This frame's boxes; false when the hole is not on this page. */
function measure(s: State) {
  if (!s.handle?.isConnected || !s.hero || !s.main || !s.anchor?.isConnected) return false;
  const h = s.hero.getBoundingClientRect();
  const m = s.main.getBoundingClientRect();
  const half = s.handle.offsetWidth / 2 || 28;
  s.hl = h.left;
  s.ht = h.top;
  s.l = half - h.left;
  s.r = document.documentElement.clientWidth - half - h.left;
  s.t = m.top - h.top + half;
  s.b = m.bottom - h.top - half;
  return true;
}

/** Its resting place: just beyond its reach, lower left of the planet in the hero (or the first spot that fits). */
function restPoint(s: State, R: number): [number, number] {
  const a = s.anchor!.getBoundingClientRect();
  const scale = Math.min(a.width, a.height) / SPAN;
  const cx = a.left + a.width / 2 - s.hl;
  const cy = a.top + a.height / 2 - s.ht;
  const at = (th: number): [number, number] => {
    const d = clearance(th, scale, R) + (REACH + 1) * R;
    return [cx + Math.cos(th) * d, cy - Math.sin(th) * d];
  };
  const fit = REST.map(at).find(([x, y]) => x >= s.l && x <= s.r && y >= s.t && y <= s.b);
  return fit ?? at(REST[0]);
}

type Props = { tide: RefObject<Tide>; palette: RefObject<Palette> };

export default function BlackHole({ tide, palette }: Props) {
  const invalidate = useThree((s) => s.invalidate);
  const scene = useMemo(() => {
    const pal = palette.current;
    const geometry = new THREE.PlaneGeometry(2, 2);
    const mat = material(vertex, fragment, {
      uSink: { value: new THREE.Vector3() },
      uRes: { value: new THREE.Vector2(1, 1) },
      uDpr: { value: 1 },
      uGrid: { value: 3 },
      uTime: { value: 0 },
      uFeed: { value: 0 },
      uGulp: { value: 0 },
      uInk: { value: pal.ink.clone() },
      uHot: { value: pal.hot.clone() },
      uShadow: { value: pal.bg.clone() },
    });
    return { geometry, mat, bend: createBend() };
    // The palette is read once: one theme.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const st = useMemo(makeState, []);

  useEffect(() => {
    const T = tide.current;
    const s = st;
    let ac: AbortController | undefined;

    const bind = () => {
      ac?.abort();
      const handle = document.querySelector<HTMLElement>('[data-black-hole]');
      s.handle = handle;
      s.hero = handle?.closest('section') ?? null;
      s.main = handle?.closest('main') ?? null;
      s.anchor = document.querySelector('[data-planet-anchor]');
      s.placed = s.moved = s.held = s.seek = false;
      s.vx = s.vy = 0;
      if (!handle) return;
      ac = new AbortController();
      const { signal } = ac;
      handle.hidden = false;

      handle.addEventListener(
        'pointerdown',
        (e) => {
          if (e.button !== 0 || !measure(s)) return;
          e.preventDefault();
          handle.setPointerCapture(e.pointerId);
          handle.classList.add('is-held');
          s.held = s.moved = true;
          s.seek = false;
          s.cx = e.clientX;
          s.cy = e.clientY;
          s.gx = s.x - (e.clientX - s.hl);
          s.gy = s.y - (e.clientY - s.ht);
          invalidate();
        },
        { signal },
      );
      handle.addEventListener(
        'pointermove',
        (e) => {
          if (!s.held) return;
          s.cx = e.clientX;
          s.cy = e.clientY;
          invalidate();
        },
        { signal },
      );
      const drop = () => {
        s.held = false;
        handle.classList.remove('is-held');
      };
      handle.addEventListener('pointerup', drop, { signal });
      handle.addEventListener('lostpointercapture', drop, { signal });
      // Slider: nearer the planet (more pull) or further, along the line to its centre; Home rests, End is closest.
      handle.addEventListener(
        'keydown',
        (e) => {
          const k = e.key;
          const near = k === 'ArrowUp' || k === 'ArrowRight';
          const far = k === 'ArrowDown' || k === 'ArrowLeft';
          if (!near && !far && k !== 'Home' && k !== 'End') return;
          e.preventDefault();
          if (!measure(s) || !T.ps) return;
          if (k === 'Home') {
            [s.tx, s.ty] = restPoint(s, T.r);
          } else {
            const px = T.px - s.hl;
            const py = T.py - s.ht;
            const dx = s.x - px;
            const dy = s.y - py;
            const d = Math.hypot(dx, dy) || 1;
            const min = clearance(Math.atan2(-dy, dx), T.ps, T.r) + 1;
            const to = k === 'End' ? min : Math.max(min, d + (near ? -STEP : STEP));
            s.tx = clamp(px + (dx / d) * to, s.l, s.r);
            s.ty = clamp(py + (dy / d) * to, s.t, s.b);
          }
          s.seek = s.moved = true;
          invalidate();
        },
        { signal },
      );
      // Until it is moved, a resize puts it back at its resting place.
      addEventListener('resize', () => void (s.moved || (s.placed = false)), { signal });
    };

    bind();
    document.addEventListener('astro:page-load', bind);
    return () => {
      ac?.abort();
      document.removeEventListener('astro:page-load', bind);
      if (s.handle) s.handle.hidden = true;
      scene.bend.dispose();
      dispatchEvent(new CustomEvent('signal:hole', { detail: null }));
      T.on = T.held = false;
    };
  }, [invalidate, scene, st, tide]);

  useEffect(
    () => () => {
      scene.geometry.dispose();
      scene.mat.dispose();
    },
    [scene],
  );

  useFrame((state, delta) => {
    const T = tide.current;
    const s = st;
    const u = scene.mat.uniforms;
    T.on = measure(s);
    if (!T.on) {
      T.pull = 0;
      T.held = false;
      u.uSink.value.z = 0;
      if (!Number.isNaN(s.sent.x)) {
        s.sent.x = NaN;
        scene.bend.clear();
        dispatchEvent(new CustomEvent('signal:hole', { detail: null }));
      }
      return;
    }
    const dt = Math.min(delta, 0.05);
    const t = state.clock.elapsedTime;
    const a = s.anchor!.getBoundingClientRect();
    T.scale = Math.min(a.width, a.height) / SPAN;
    const R = HORIZON * T.scale * (1 + GROW * T.eaten);
    T.r = R;
    if (!s.placed) {
      [s.x, s.y] = restPoint(s, R);
      s.vx = s.vy = 0;
      s.placed = true;
    }

    // Heavy: a damped spring toward the drag (or key) target, slower the more it has eaten; let go, it glides.
    const mass = 1 + MASS * T.eaten;
    if (s.held) {
      s.tx = s.cx - s.hl + s.gx;
      s.ty = s.cy - s.ht + s.gy;
    }
    if (s.held || s.seek) {
      const w = SPRING / Math.sqrt(mass);
      s.vx += (w * w * (s.tx - s.x) - 2 * DAMP * w * s.vx) * dt;
      s.vy += (w * w * (s.ty - s.y) - 2 * DAMP * w * s.vy) * dt;
    } else {
      const k = Math.exp((-GLIDE / Math.sqrt(mass)) * dt);
      s.vx *= k;
      s.vy *= k;
    }
    s.x += s.vx * dt;
    s.y += s.vy * dt;
    if (s.x < s.l || s.x > s.r) {
      s.x = clamp(s.x, s.l, s.r);
      s.vx = 0;
    }
    if (s.y < s.t || s.y > s.b) {
      s.y = clamp(s.y, s.t, s.b);
      s.vy = 0;
    }
    // Never on the planet, wherever it is drawn; its pull falls off with the distance to the planet's outline.
    let pull = 0;
    if (T.ps > 0) {
      const dx = s.x - (T.px - s.hl);
      const dy = s.y - (T.py - s.ht);
      const d = Math.hypot(dx, dy) || 1;
      const min = clearance(Math.atan2(-dy, dx), T.ps, R);
      if (d < min) {
        s.x += (dx / d) * (min - d);
        s.y += (dy / d) * (min - d);
        const vr = (s.vx * dx + s.vy * dy) / d;
        if (vr < 0) {
          s.vx -= (vr * dx) / d;
          s.vy -= (vr * dy) / d;
        }
      }
      pull = smooth(clamp(1 - (Math.max(d, min) - min) / (REACH * R), 0, 1));
    }
    T.pull = pull;
    const speed = Math.hypot(s.vx, s.vy);
    if (s.seek && speed < 4 && Math.hypot(s.tx - s.x, s.ty - s.y) < 1) s.seek = false;
    if (!s.held && !s.seek && speed < 3) s.vx = s.vy = 0;
    T.held = s.held;
    if (s.held || s.seek || s.vx || s.vy) invalidate();

    const x = s.x + s.hl;
    const y = s.y + s.ht;
    T.x = x;
    T.y = y;
    s.handle!.style.translate = `${s.x.toFixed(1)}px ${s.y.toFixed(1)}px`;
    const pct = Math.round(pull * 100);
    if (pct !== s.pct) {
      s.pct = pct;
      s.handle!.setAttribute('aria-valuenow', String(pct));
      s.handle!.setAttribute('aria-valuetext', `Pull ${pct}%`);
    }

    // It bends the dust and the text around it.
    const sent = s.sent;
    if (Math.abs(x - sent.x) > 0.3 || Math.abs(y - sent.y) > 0.3 || R !== sent.r || s.held !== sent.held) {
      Object.assign(sent, { x, y, r: R, held: s.held });
      dispatchEvent(new CustomEvent('signal:hole', { detail: { x, y, r: R, held: s.held } }));
    }
    scene.bend.update(x, y, R, t);

    const gulp = T.gulpAt >= 0 && t - T.gulpAt < GULP ? Math.sin((Math.PI * (t - T.gulpAt)) / GULP) * T.gulpSize : 0;
    if (gulp > 0) invalidate();
    T.fed *= Math.exp(-dt / 0.5);

    const { width: w, height: hh } = state.size;
    const dpr = state.viewport.dpr;
    u.uSink.value.set(x, hh - y, R);
    u.uRes.value.set(w, hh);
    u.uDpr.value = dpr;
    u.uGrid.value = Math.max(2, Math.round(Math.min(Math.max(T.scale / 38, 1.5), 3) * dpr));
    u.uTime.value = t;
    u.uFeed.value = Math.max(T.fed, s.held ? 0.25 : 0);
    u.uGulp.value = gulp;
  });

  return <mesh geometry={scene.geometry} material={scene.mat} frustumCulled={false} renderOrder={2} />;
}
