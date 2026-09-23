// Island wrapper for the fixed sky. SSR emits an empty div; the client decides whether to load the
// R3F scene (lazy, so three never enters the initial bundle) or to fall back to a static CSS planet.
// The scene waits for `load` + fonts + idle so its chunk never competes with the LCP font, and
// articles never load it at all. The island persists across ClientRouter navigations, so route
// changes are handled here too.
import { Component, lazy, Suspense, useCallback, useEffect, useState, type ReactNode } from 'react';
import './sky.css';

const Scene = lazy(() => import('./Scene'));

type Mode = 'idle' | 'scene' | 'static';

/** `/writing/<slug>/` only: the index, tag and series pages keep the full sky. */
const isArticle = () => /^\/writing\/(?!tag\/|series\/)[^/]+\/?$/.test(location.pathname);

const reduceQuery = () => matchMedia('(prefers-reduced-motion: reduce)');

function weakDevice() {
  const nav = navigator as Navigator & { connection?: { saveData?: boolean }; deviceMemory?: number };
  return (
    reduceQuery().matches ||
    nav.connection?.saveData === true ||
    (nav.deviceMemory ?? 8) < 4 ||
    (navigator.hardwareConcurrency ?? 4) <= 2
  );
}

/** R3F cannot report a failed context to an error boundary (it fails in an async effect), so probe first. */
function webgl2() {
  const gl = document.createElement('canvas').getContext('webgl2');
  gl?.getExtension('WEBGL_lose_context')?.loseContext();
  return gl !== null;
}

const loaded = () =>
  new Promise<void>((r) => (document.readyState === 'complete' ? r() : addEventListener('load', () => r(), { once: true })));
const idle = () =>
  new Promise<void>((r) => ('requestIdleCallback' in window ? requestIdleCallback(() => r(), { timeout: 4000 }) : setTimeout(r, 1500)));

/** CSS-only stand-in: a dithered ringed planet in the top-right corner, no animation (sky.css). */
const Static = () => (
  <div className="sky-layer sky-static is-ready">
    <div className="sky-static__planet">
      <i className="sky-static__ring" />
      <i className="sky-static__disc" />
      <i className="sky-static__ring sky-static__ring--front" />
    </div>
  </div>
);

/** Chunk failed to load (offline, blocked) or the scene threw: show the static planet instead of nothing. */
class Boundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? <Static /> : this.props.children;
  }
}

export default function SkyCanvas() {
  const [mode, setMode] = useState<Mode>('idle');
  const [ready, setReady] = useState(false);
  const onReady = useCallback(() => setReady(true), []);

  useEffect(() => {
    let cancelled = false;
    let scene = false;
    const reduce = reduceQuery();
    const decide = async () => {
      if (isArticle()) {
        // ArticleLayout sets this too; keep the fallback so the sky dims even if a layout forgets.
        if (!document.body.dataset.page) document.body.dataset.page = 'article';
        if (!scene) setMode('static');
        return;
      }
      if (scene) return;
      if (weakDevice()) return setMode('static');
      await loaded();
      await document.fonts.ready;
      await idle();
      if (cancelled || scene || isArticle()) return;
      if (weakDevice() || !webgl2()) return setMode('static');
      scene = true;
      setMode('scene');
    };
    // Reduced motion switched on mid-session: drop the scene (frees WebGL); switched off: try again.
    const onReduce = () => {
      if (!reduce.matches) return void decide();
      scene = false;
      setReady(false);
      setMode('static');
    };
    // Speculation-rules prerender: do not spin up WebGL in a hidden tab.
    if ((document as Document & { prerendering?: boolean }).prerendering) {
      document.addEventListener('prerenderingchange', decide, { once: true });
    } else {
      decide();
    }
    document.addEventListener('astro:page-load', decide);
    reduce.addEventListener('change', onReduce);
    return () => {
      cancelled = true;
      document.removeEventListener('astro:page-load', decide);
      reduce.removeEventListener('change', onReduce);
    };
  }, []);

  if (mode === 'idle') return <div className="sky-layer" />;
  if (mode === 'static') return <Static />;

  return (
    <Boundary>
      <div className={ready ? 'sky-layer is-ready' : 'sky-layer'}>
        <Suspense fallback={null}>
          <Scene onReady={onReady} />
        </Suspense>
      </div>
    </Boundary>
  );
}
