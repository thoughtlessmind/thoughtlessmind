// Text near the black hole, bent by it. The part of each nearby text block that falls in its lens is displaced
// like a gravitational lens (point lens, plus a little frame-dragging swirl), with a clear core the hole shows
// through; and it flickers in short orange/cyan split bursts, about once a second, small areas only.
//
// One SVG filter per bent block (up to POOL) with `filter: url(#…)`, re-aimed at the hole every frame. The filter's
// map is drawn once: R/G the displacement, B the core mask, A the lens disc. Outside the disc the block is left as it
// is. Blocks are found with elementsFromPoint around the hole, a few times a second or as it moves.

const POOL = 4;
const SIZE = 256; // map px
const LENS = 9; // lens radius, horizon radii
const CORE = 0.26; // clear core, share of the lens radius (~2.3 horizon radii: the shadow, ring and arc show)
const SWIRL = 0.45; // tangential share of the displacement
const MAX = CORE * 1.15; // largest displacement in the map, share of the lens radius
const BLOCK = 'h1, h2, h3, h4, h5, h6, p, li, dt, dd, blockquote, figcaption, pre, .btn, .label';
const NS = 'http://www.w3.org/2000/svg';

/** The lens map, as a PNG data URL. */
function drawMap() {
  const c = document.createElement('canvas');
  c.width = c.height = SIZE;
  const g = c.getContext('2d');
  if (!g) return '';
  const img = g.createImageData(SIZE, SIZE);
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const u = ((x + 0.5) / SIZE) * 2 - 1;
      const v = ((y + 0.5) / SIZE) * 2 - 1;
      const r = Math.hypot(u, v);
      const i = (y * SIZE + x) * 4;
      if (r >= 1) continue; // transparent: outside the lens
      // Point lens: what shows at radius r comes from nearer the centre, by CORE^2 / r, windowed to 0 at the rim.
      const k = ((CORE * CORE) / Math.max(r, CORE)) * (1 - r * r) ** 2;
      const nx = r ? u / r : 0;
      const ny = r ? v / r : 0;
      const ox = -nx * k - ny * k * SWIRL;
      const oy = -ny * k + nx * k * SWIRL;
      img.data[i] = Math.round(127.5 + (ox / MAX) * 127.5);
      img.data[i + 1] = Math.round(127.5 + (oy / MAX) * 127.5);
      img.data[i + 2] = Math.round(255 * Math.min(1, Math.max(0, (r - CORE * 0.85) / (CORE * 0.2))));
      img.data[i + 3] = 255;
    }
  }
  g.putImageData(img, 0, 0);
  return c.toDataURL('image/png');
}

const FILTER = (id: string, map: string) => `
  <filter id="${id}" filterUnits="userSpaceOnUse" primitiveUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
    <feImage href="${map}" preserveAspectRatio="none" result="map" />
    <feDisplacementMap in="SourceGraphic" in2="map" xChannelSelector="R" yChannelSelector="G" result="bent" />
    <feColorMatrix in="map" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 1 0 0" result="keep" />
    <feComposite in="bent" in2="keep" operator="in" result="lens" />
    <feColorMatrix in="map" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="disc" />
    <feComposite in="SourceGraphic" in2="disc" operator="out" result="rest" />
    <feFlood style="flood-color: var(--accent)" flood-opacity="0" result="hotc" />
    <feOffset in="lens" result="hoto" />
    <feComposite in="hotc" in2="hoto" operator="in" result="hot" />
    <feFlood style="flood-color: var(--signal)" flood-opacity="0" result="coldc" />
    <feOffset in="lens" result="coldo" />
    <feComposite in="coldc" in2="coldo" operator="in" result="cold" />
    <feComponentTransfer in="lens" result="shown"><feFuncA type="linear" slope="1" /></feComponentTransfer>
    <feMerge><feMergeNode in="rest" /><feMergeNode in="hot" /><feMergeNode in="cold" /><feMergeNode in="shown" /></feMerge>
  </filter>`;

type Slot = {
  id: string;
  f: SVGFilterElement;
  img: SVGFEImageElement;
  disp: SVGFEDisplacementMapElement;
  floods: SVGFEFloodElement[];
  offsets: SVGFEOffsetElement[];
  alpha: SVGFEFuncAElement;
  el: HTMLElement | null;
};

export function createBend() {
  let svg: SVGSVGElement | null = null;
  let slots: Slot[] = [];
  let map = '';
  let scanAt = -1;
  let sx = 0;
  let sy = 0;
  let nextBurst = 0;
  let burstEnd = 0;
  let nextStep = 0;
  let split = 0;
  let dim = 1;
  let jolt = 1;
  let aimed = ''; // last applied aim, so a parked hole between bursts costs nothing

  // The ClientRouter swaps <body>, taking the SVG with it: rebuilt on demand.
  const build = () => {
    map ||= drawMap();
    svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('width', '0');
    svg.setAttribute('height', '0');
    svg.style.position = 'absolute';
    svg.innerHTML = `<defs>${Array.from({ length: POOL }, (_, i) => FILTER(`bh-bend-${i}`, map)).join('')}</defs>`;
    document.body.append(svg);
    slots = Array.from(svg.querySelectorAll('filter'), (f) => ({
      id: f.id,
      f,
      img: f.querySelector('feImage')!,
      disp: f.querySelector('feDisplacementMap')!,
      floods: Array.from(f.querySelectorAll('feFlood')),
      offsets: Array.from(f.querySelectorAll('feOffset')),
      alpha: f.querySelector('feFuncA')!,
      el: null,
    }));
  };

  const release = (s: Slot) => {
    s.el?.style.removeProperty('filter');
    s.el = null;
  };

  /** Text blocks under the lens, outermost only, nearest first, at most POOL. */
  const scan = (x: number, y: number, L: number) => {
    const found: HTMLElement[] = [];
    for (let k = 0; k < 13; k++) {
      const a = (k * Math.PI) / 3 + (k > 6 ? Math.PI / 6 : 0);
      const d = k === 0 ? 0 : k <= 6 ? L * 0.5 : L * 0.9;
      const px = x + Math.cos(a) * d;
      const py = y + Math.sin(a) * d;
      if (px < 0 || py < 0 || px >= innerWidth || py >= innerHeight) continue;
      for (const el of document.elementsFromPoint(px, py)) {
        if (el.closest('header, [data-black-hole], .egg-mark, dialog')) break;
        const b = el.closest<HTMLElement>(BLOCK);
        if (!b) continue;
        if (!found.includes(b) && b.textContent?.trim()) found.push(b);
        break;
      }
    }
    return found.filter((b) => !found.some((o) => o !== b && o.contains(b))).slice(0, POOL);
  };

  const clear = () => slots.forEach(release);

  return {
    /** Aim at the hole: client px, horizon radius px, clock s. */
    update(x: number, y: number, r: number, t: number) {
      if (!svg?.isConnected) {
        clear();
        build();
        scanAt = -1;
      }
      const L = r * LENS;
      if (scanAt < 0 || t - scanAt > 0.25 || Math.hypot(x - sx, y - sy) > 6) {
        scanAt = t;
        sx = x;
        sy = y;
        const want = scan(x, y, L);
        for (const s of slots) if (s.el && !want.includes(s.el)) release(s);
        for (const el of want) {
          if (slots.some((s) => s.el === el)) continue;
          const s = slots.find((s) => !s.el);
          if (!s) break;
          s.el = el;
          el.style.filter = `url(#${s.id})`;
        }
        aimed = '';
      }
      if (!slots.some((s) => s.el)) return;

      // Flicker: a 160ms burst every 0.8-1.6s, two steps of split, dim and jolt.
      if (t >= nextBurst) {
        burstEnd = t + 0.16;
        nextBurst = t + 0.8 + Math.random() * 0.8;
        nextStep = t;
      }
      if (t < burstEnd) {
        if (t >= nextStep) {
          nextStep = t + 0.08;
          split = (Math.random() < 0.5 ? -1 : 1) * (1.5 + Math.random() * 2.5);
          dim = 0.55 + Math.random() * 0.35;
          jolt = 0.75 + Math.random() * 0.6;
        }
      } else {
        split = 0;
        dim = jolt = 1;
      }
      const aim = `${x.toFixed(1)} ${y.toFixed(1)} ${r} ${split} ${dim}`;
      if (aim === aimed) return;
      aimed = aim;

      for (const s of slots) {
        if (!s.el) continue;
        const b = s.el.getBoundingClientRect();
        s.f.setAttribute('x', '-32');
        s.f.setAttribute('y', '-32');
        s.f.setAttribute('width', String(b.width + 64));
        s.f.setAttribute('height', String(b.height + 64));
        s.img.setAttribute('x', (x - b.left - L).toFixed(1));
        s.img.setAttribute('y', (y - b.top - L).toFixed(1));
        s.img.setAttribute('width', (2 * L).toFixed(1));
        s.img.setAttribute('height', (2 * L).toFixed(1));
        s.disp.setAttribute('scale', (2 * MAX * L * jolt).toFixed(1));
        s.offsets[0].setAttribute('dx', String(split));
        s.offsets[1].setAttribute('dx', String(-split));
        for (const f of s.floods) f.setAttribute('flood-opacity', split ? '0.85' : '0');
        s.alpha.setAttribute('slope', String(dim));
      }
    },
    clear,
    dispose() {
      clear();
      svg?.remove();
      svg = null;
    },
  };
}
