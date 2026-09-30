// The big bang's crunch on the GPU (bigbang.ts, DESIGN.md §4 "Big bang"): one full-screen pass bends a picture of
// the page (raster.ts) and drains it into a black hole at the viewport centre. Each pixel works backwards from
// the screen: the shadow, a point lens, the infall turned inside out (a small table from fall.ts, refilled each
// frame), the wind undone, the page sampled (mipmapped, so squeezed text doesn't shimmer), heated by compression,
// redshifted climbing out of the well, and the photon ring on top. Physics colours are hex, not theme tokens.
import { CRUNCH, START, WIND, infall, swallowed } from './fall';

export type Warp = {
  canvas: HTMLCanvasElement; // viewport × dpr; the caller inserts it, sizes it to the viewport and fades it
  draw(t: number): void; // the crunch at t s from T-0 (0 ≤ t ≤ CRUNCH); past CRUNCH it clears
  destroy(): void; // frees the textures and the GL context; safe to call twice
};

const BINS = 256; // infall table resolution over ρ = 0 → rMax
const PIN = 1.5; // px: the shadow's radius before anything has fallen in; it opens over 0 → START
const RS_MAX = 0.07; // × min(vw, vh): the shadow's radius once the whole page is in (it grows with √swallowed)
const HORIZON = 1 / 2.598; // horizon radius ÷ shadow radius, for the redshift
const LENS = 2; // Einstein radius ÷ shadow radius
const LENS_MIN = 6; // px: floor on the Einstein radius, so the lens shows before much has fallen in…
const LENS_IN = 0.4; // s: …eased in after START, with the redshift (until then the picture must match the copies)
const RING_AT = 1.05; // × shadow radius: the photon ring sits just outside the shadow…
const RING_W = 0.09; // × shadow radius: …this wide (σ; ~0.15 across at half height)…
const RING_MIN = 1.2; // px: …but no thinner, so it ends as a ~2px point
const RING_FLOOR = 0.15; // its glow with nothing falling in…
const RING_RATE = 0.6; // …plus this at the peak accretion rate
const RING_BOOST = 2; // it piles up the lensed light behind it: × (1 + this) at its crest
const COLLAPSE = 0.3; // s: shadow, lens and ring collapse into the centre over the crunch's end
const DT = 1 / 30; // s: step of the accretion rate's finite difference

const VERT = /* glsl */ `#version 300 es
void main() {
  gl_Position = vec4(float(gl_VertexID % 2) * 4.0 - 1.0, float(gl_VertexID / 2) * 4.0 - 1.0, 0.0, 1.0);
}`;

const FRAG = /* glsl */ `#version 300 es
precision highp float;
uniform sampler2D uPage;        // premultiplied, mipmapped
uniform highp sampler2D uTable; // BINS × 1, RG32F: ρ0 / rMax, spin
uniform vec2 uSize;             // canvas px
uniform float uRMax;            // centre to corner, canvas px
uniform float uWind;            // rad wound at spin 1
uniform vec3 uHole;             // shadow radius, Einstein radius², horizon radius (canvas px)
uniform vec4 uRing;             // radius, σ, glow, boost
uniform float uWhite;           // the ring's colour → white as it collapses
out vec4 o;

// Blackbody ramp over log2(T / 1,000 K): dim red, 1,900 K, 3,000 K, 4,500 K, 6,500 K, ~12,000 K (#e8f2ff).
const float BB_AT[6] = float[6](0.0, 0.926, 1.585, 2.17, 2.70, 3.585);
const vec3 BB[6] = vec3[6](vec3(0.353, 0.086, 0.016), vec3(1.0, 0.373, 0.122), vec3(1.0, 0.706, 0.42),
  vec3(1.0, 0.886, 0.749), vec3(1.0, 0.973, 0.933), vec3(0.91, 0.949, 1.0));
const vec3 RING = vec3(1.0, 0.957, 0.878); // #fff4e0

vec3 blackbody(float l) {
  vec3 c = BB[0];
  for (int i = 1; i < 6; i++) c = mix(c, BB[i], clamp((l - BB_AT[i - 1]) / (BB_AT[i] - BB_AT[i - 1]), 0.0, 1.0));
  return c;
}

void main() {
  vec2 c = uSize * 0.5;
  vec2 p = vec2(gl_FragCoord.x, uSize.y - gl_FragCoord.y) - c; // from the hole, y down
  float r = length(p);
  // Point lens: this pixel sees the sheet at β = θ(1 − θE²/|θ|²); inside θE that image is flipped.
  vec2 b = p * (1.0 - uHole.y / max(r * r, 1e-6));
  float rho = length(b);
  // Where the material now at ρ started and how far it has wound, lerped by hand (float textures don't filter
  // everywhere).
  float x = min(rho / uRMax, 1.0) * float(${BINS - 1});
  int i = min(int(x), ${BINS - 2});
  vec2 f = mix(texelFetch(uTable, ivec2(i, 0), 0).rg, texelFetch(uTable, ivec2(i + 1, 0), 0).rg, x - float(i));
  float r0 = f.x * uRMax;
  float w = f.y * uWind;
  // Unwound (anticlockwise) and out to where it started: a rotation, never an angle from atan, so no seam.
  vec2 s = c + mat2(cos(w), -sin(w), sin(w), cos(w)) * b * (r0 / max(rho, 1e-6));
  vec4 col = texture(uPage, s / uSize);
  // Off the page is empty (no edge smear): this pixel's share of the page, exactly 1 at rest. Nothing once all is in.
  vec2 fw = max(fwidth(s), 1e-3);
  vec2 on = clamp((s + 0.5 * fw) / fw, 0.0, 1.0) * clamp((uSize - s + 0.5 * fw) / fw, 0.0, 1.0);
  col *= on.x * on.y * step(0.0, f.x);
  // Heat: free fall compresses it (T ∝ ρ0/ρ), so it glows up the blackbody ramp and brightens. What was barely lit
  // (a translucent bar, a dark fill) has little light to heat: it would otherwise outshine the text.
  float k = clamp((rho + 1e-3) / (r0 + 1e-3), 1e-3, 1.0); // ρ/ρ0, and 1 at the very centre at rest
  float h = 1.0 - k;
  float lum = dot(col.rgb, vec3(0.2126, 0.7152, 0.0722)) / max(col.a, 1e-3);
  col.rgb = mix(col.rgb, blackbody(-log2(k)) * col.a, h * h * smoothstep(0.0, 0.5, lum));
  col = min(col * (1.0 + h), 1.0);
  // Redshift: light climbing out of the well cools by g (the page's own light reads as 6,500 K) and dims by g⁴.
  float g = clamp(1.0 - uHole.z / max(r, 1e-6), 1e-3, 1.0);
  col.rgb *= blackbody(BB_AT[4] + log2(g)) / BB[4];
  col *= g * g * g * g;
  // Photon ring: the lensed light piles up just outside the shadow…
  float d = (r - uRing.x) / uRing.y;
  float q = exp(-d * d);
  col = min(col * (1.0 + uRing.w * q), 1.0);
  // …the shadow, with a 1px edge (and none while it has no size)…
  col = mix(col, vec4(0.0, 0.0, 0.0, 1.0), clamp(uHole.x - r + 0.5, 0.0, 1.0) * min(uHole.x * 2.0, 1.0));
  // …and the ring's own glow, with the accretion rate.
  o = min(col + q * uRing.z * vec4(mix(RING, vec3(1.0), uWhite), 1.0), 1.0);
}`;

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

/** One WebGL2 full-screen pass over `page` (viewport × dpr, from rasterize()); null without WebGL2. */
export function createWarp(page: HTMLCanvasElement, dpr: number): Warp | null {
  const { width: w, height: h } = page;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const gl = canvas.getContext('webgl2', { alpha: true, premultipliedAlpha: true, antialias: false, depth: false });
  if (!gl) return null;
  const lose = () => gl.getExtension('WEBGL_lose_context')?.loseContext();
  if (Math.max(w, h) > gl.getParameter(gl.MAX_TEXTURE_SIZE)) return lose(), null;

  const prog = gl.createProgram();
  for (const [type, src] of [
    [gl.VERTEX_SHADER, VERT],
    [gl.FRAGMENT_SHADER, FRAG],
  ] as const) {
    const s = gl.createShader(type)!;
    gl.shaderSource(s, src);
    gl.compileShader(s);
    gl.attachShader(prog, s);
    gl.deleteShader(s);
  }
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    console.warn('warp:', gl.getAttachedShaders(prog)?.map((s) => gl.getShaderInfoLog(s)).join(' '));
    return lose(), null;
  }
  gl.useProgram(prog);

  // The page, premultiplied like the canvas it came from, with mipmaps (+ anisotropy) for squeezed text.
  const tex = gl.createTexture();
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, page);
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
  gl.generateMipmap(gl.TEXTURE_2D);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  const an = gl.getExtension('EXT_texture_filter_anisotropic');
  if (an) {
    const max = gl.getParameter(an.MAX_TEXTURE_MAX_ANISOTROPY_EXT);
    gl.texParameterf(gl.TEXTURE_2D, an.TEXTURE_MAX_ANISOTROPY_EXT, Math.min(16, max));
  }
  // The infall table, refilled every frame (left bound on unit 1 for that).
  const lut = gl.createTexture();
  gl.activeTexture(gl.TEXTURE1);
  gl.bindTexture(gl.TEXTURE_2D, lut);
  gl.texStorage2D(gl.TEXTURE_2D, 1, gl.RG32F, BINS, 1);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  const table = new Float32Array(2 * BINS);

  const u = (name: string) => gl.getUniformLocation(prog, name);
  gl.uniform1i(u('uPage'), 0);
  gl.uniform1i(u('uTable'), 1);
  gl.uniform2f(u('uSize'), w, h);
  gl.uniform1f(u('uRMax'), Math.hypot(w, h) / 2);
  gl.uniform1f(u('uWind'), WIND);
  const uHole = u('uHole');
  const uRing = u('uRing');
  const uWhite = u('uWhite');
  gl.viewport(0, 0, w, h);
  const peak = 1 - swallowed(CRUNCH - DT); // the accretion rate's last (and largest) step

  let live = true;
  return {
    canvas,
    draw(t) {
      if (!live) return;
      if (t > CRUNCH) return gl.clear(gl.COLOR_BUFFER_BIT);
      infall(t, table);
      gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, BINS, 1, gl.RG, gl.FLOAT, table);
      const open = Math.min(1, t / START);
      const c = clamp01((CRUNCH - t) / COLLAPSE);
      const m = swallowed(t);
      const rs = Math.max(PIN * dpr * open, RS_MAX * Math.min(w, h) * Math.sqrt(m));
      const well = clamp01((t - START) / LENS_IN) * c; // lens and redshift: both reach far, so not before START
      const e = Math.max(LENS * rs, LENS_MIN * dpr) * well;
      gl.uniform3f(uHole, rs * c, e * e, rs * HORIZON * well);
      const glow = (RING_FLOOR + (RING_RATE * (m - swallowed(t - DT))) / peak) * open;
      const ring = Math.max(RING_W * rs * c, RING_MIN * dpr);
      gl.uniform4f(uRing, RING_AT * rs * c, ring, 1 - c * (1 - glow), RING_BOOST * open * c);
      gl.uniform1f(uWhite, 1 - c);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    },
    destroy() {
      if (!live) return;
      live = false;
      gl.deleteTexture(tex);
      gl.deleteTexture(lut);
      gl.deleteProgram(prog);
      lose();
    },
  };
}
