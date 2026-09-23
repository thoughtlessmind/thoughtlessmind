// The R3F scene proper. Loaded lazily by SkyCanvas so three stays out of the initial bundle.
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useEffect, useRef, useState, type RefObject } from 'react';
import * as THREE from 'three';
import BlackHole from './BlackHole';
import Planet from './Planet';

/** Normalised (-1..1, y up) and CSS px (y down) pointer. Off-screen until a fine pointer moves. */
export type Pointer = { x: number; y: number; px: number; py: number };
/** Theme colours as sRGB 0..1, read from the CSS tokens on <html>. */
export type Palette = { ink: THREE.Vector3; hot: THREE.Vector3; cold: THREE.Vector3; bg: THREE.Vector3; dark: boolean };
/**
 * The home page's black hole, shared by BlackHole (writes where it is and how hard it pulls) and Planet (tears
 * the planet apart, reports what it swallows and where the planet is drawn). Client CSS px, y down.
 */
export type Tide = {
  on: boolean; // a hole is on this page
  x: number;
  y: number;
  scale: number; // px per planet unit in the hero (the hole's size and gravity scale with it)
  r: number; // horizon radius, px
  pull: number; // 0..1
  held: boolean; // being dragged
  fed: number; // 0..1: the disk flares after a gulp; Planet bumps it, BlackHole decays it
  eaten: number; // 0..1: share of the planet swallowed (the hole grows and gets heavier with it)
  gulpAt: number; // clock s of the last gulp, -1 before any
  gulpSize: number; // 0..1
  px: number; // where the planet is drawn now: centre and px per planet unit (0 before its first frame)
  py: number;
  ps: number;
};

// Used only when a token is missing; values from DESIGN.md §2.
const FALLBACK = {
  dark: { ink: '#ebe9e4', hot: '#ff5f1f', cold: '#38e1f0' },
  light: { ink: '#111214', hot: '#b33504', cold: '#006d7d' },
};

let ctx: CanvasRenderingContext2D | null = null;
/** Any CSS colour syntax (hex, rgb, oklch, color-mix...) -> sRGB, by painting one pixel. */
function rgb(value: string, fallback: string, out: THREE.Vector3) {
  ctx ??= document.createElement('canvas').getContext('2d', { willReadFrequently: true });
  if (!ctx) return out.set(0.5, 0.5, 0.5);
  ctx.fillStyle = fallback;
  ctx.fillStyle = value || fallback; // invalid values are ignored, leaving the fallback
  ctx.clearRect(0, 0, 1, 1);
  ctx.fillRect(0, 0, 1, 1);
  const d = ctx.getImageData(0, 0, 1, 1).data;
  return out.set(d[0] / 255, d[1] / 255, d[2] / 255);
}

function readPalette(p: Palette) {
  const css = getComputedStyle(document.documentElement);
  const get = (name: string) => css.getPropertyValue(name).trim();
  const bg = rgb(get('--bg'), '#0a0b0d', p.bg);
  p.dark = 0.2126 * bg.x + 0.7152 * bg.y + 0.0722 * bg.z < 0.5;
  const f = FALLBACK[p.dark ? 'dark' : 'light'];
  rgb(get('--text'), f.ink, p.ink);
  rgb(get('--accent'), f.hot, p.hot);
  rgb(get('--signal'), f.cold, p.cold);
  return p;
}

/** Theme is not a prop (persisted island): re-read the tokens whenever <html> changes theme. */
function usePalette(): RefObject<Palette> {
  const [palette] = useState(() =>
    readPalette({ ink: new THREE.Vector3(), hot: new THREE.Vector3(), cold: new THREE.Vector3(), bg: new THREE.Vector3(), dark: true }),
  );
  const ref = useRef(palette);
  useEffect(() => {
    const mo = new MutationObserver(() => readPalette(palette));
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => mo.disconnect();
  }, [palette]);
  return ref;
}

/** Fine pointers only. Read from useFrame, never re-renders. */
function usePointer(): RefObject<Pointer> {
  const ref = useRef<Pointer>({ x: 0, y: 0, px: -1e4, py: -1e4 });
  useEffect(() => {
    if (!matchMedia('(pointer: fine)').matches) return;
    const on = (e: PointerEvent) => {
      const p = ref.current;
      p.px = e.clientX;
      p.py = e.clientY;
      p.x = (e.clientX / innerWidth) * 2 - 1;
      p.y = 1 - (e.clientY / innerHeight) * 2;
    };
    addEventListener('pointermove', on, { passive: true });
    return () => removeEventListener('pointermove', on);
  }, []);
  return ref;
}

/**
 * Owns the render cadence: ~30fps via invalidate(), paused when hidden or when reduced motion turns on
 * (a warp renders every frame by invalidating from Planet's useFrame).
 * On article pages the sky fades out (sky.css), so it renders ~1.5s more and then parks.
 */
function Loop({ onReady }: { onReady: () => void }) {
  const invalidate = useThree((s) => s.invalidate);
  const setDpr = useThree((s) => s.setDpr);
  const ready = useRef(false);

  useFrame(() => {
    if (ready.current) return;
    ready.current = true;
    onReady();
  });

  useEffect(() => {
    const reduce = matchMedia('(prefers-reduced-motion: reduce)');
    let raf = 0;
    let lastRender = 0;
    let prevTick = 0;
    let start = 0;
    let slow = 0;
    let watching = true;
    let parked = false;
    let parkTimer = 0;

    const tick = (t: number) => {
      raf = requestAnimationFrame(tick);
      // ponytail: "frame > 32ms repeatedly" measured as rAF gaps > 45ms with a leaky counter,
      // armed 2s after mount so page-load jank does not trip it. Drops dpr to 1 once, permanently.
      if (!start) start = t;
      if (watching && t - start > 2000) {
        slow = Math.max(0, slow + (t - prevTick > 45 ? 2 : -1));
        if (slow >= 10) {
          watching = false;
          setDpr(1);
        }
      }
      prevTick = t;
      if (t - lastRender < 32) return;
      lastRender = t;
      invalidate();
    };
    const stop = () => {
      cancelAnimationFrame(raf);
      raf = 0;
    };
    const run = () => {
      if (raf || parked || document.hidden || reduce.matches) return;
      prevTick = performance.now();
      raf = requestAnimationFrame(tick);
    };
    const onVisibility = () => (document.hidden ? stop() : run());
    const onReduce = () => (reduce.matches ? stop() : run());
    // <html data-scene="on"> while the live scene runs on this page: the warp egg checks it.
    const root = document.documentElement;
    const onPage = () => {
      clearTimeout(parkTimer);
      parked = false;
      run();
      if (document.body.dataset.page !== 'article') return void (root.dataset.scene = 'on');
      delete root.dataset.scene;
      parkTimer = window.setTimeout(() => {
        parked = true;
        stop();
      }, 1500);
    };

    document.addEventListener('visibilitychange', onVisibility);
    document.addEventListener('astro:page-load', onPage);
    reduce.addEventListener('change', onReduce);
    onPage();
    return () => {
      stop();
      clearTimeout(parkTimer);
      delete root.dataset.scene;
      document.removeEventListener('visibilitychange', onVisibility);
      document.removeEventListener('astro:page-load', onPage);
      reduce.removeEventListener('change', onReduce);
    };
  }, [invalidate, setDpr]);

  return null;
}

export default function Scene({ onReady }: { onReady: () => void }) {
  const palette = usePalette();
  const pointer = usePointer();
  const tide = useRef<Tide>({
    on: false,
    x: 0,
    y: 0,
    scale: 1,
    r: 0,
    pull: 0,
    held: false,
    fed: 0,
    eaten: 0,
    gulpAt: -1,
    gulpSize: 0,
    px: 0,
    py: 0,
    ps: 0,
  });

  return (
    <Canvas
      dpr={[1, 1.5]}
      frameloop="demand"
      flat
      gl={{ antialias: false, alpha: true, powerPreference: 'low-power' }}
      style={{ pointerEvents: 'none' }}
      onCreated={({ gl }) => gl.domElement.setAttribute('aria-hidden', 'true')}
    >
      <Loop onReady={onReady} />
      <BlackHole tide={tide} palette={palette} />
      <Planet pointer={pointer} palette={palette} tide={tide} />
    </Canvas>
  );
}
