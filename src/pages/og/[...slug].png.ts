/**
 * Build-time OG cards (1200x630) drawn with CanvasKit directly, in the SIGNAL look: near-black ground with a
 * faint 48px grid, an 8px launch-orange bar on the left, the title in Geist Mono bold, the description muted,
 * and a hairline footer with host + date on the left and a small `// SIGNAL` on the right.
 * Colours are literals because this file cannot read CSS; they mirror the dark tokens in DESIGN.md.
 */
import type { APIRoute } from 'astro';
import type { TextStyle } from 'canvaskit-wasm/full';
import CanvasKitInit from 'canvaskit-wasm/full';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { SITE } from '../../consts';
import { getPublishedPosts, isoDate } from '../../lib/posts';

type Page = { title: string; description: string; date?: Date };

const W = 1200;
const H = 630;
const BAR = 8;
const PAD = 80;
const GRID = 48;
const HOST = SITE.url.replace(/^https?:\/\//, '');

const require = createRequire(import.meta.url);
const CanvasKit = await CanvasKitInit({ locateFile: (file) => require.resolve(`canvaskit-wasm/bin/full/${file}`) });
const b = await readFile('src/assets/fonts/og/GeistMono.ttf');
const fonts = CanvasKit.FontMgr.FromData(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength));
if (!fonts) throw new Error('OG: could not load src/assets/fonts/og/GeistMono.ttf');

const BG = CanvasKit.Color(10, 11, 13); // --bg
const GRID_LINE = CanvasKit.Color(233, 231, 226, 0.045); // faint rule lines (OG only)
const RULE = CanvasKit.Color(35, 39, 46); // --border
const TEXT = CanvasKit.Color(235, 233, 228); // --text
const MUTED = CanvasKit.Color(166, 170, 178); // --text-muted
const SUBTLE = CanvasKit.Color(133, 139, 149); // --text-subtle
const ACCENT = CanvasKit.Color(255, 95, 31); // --accent

/** Geist Mono is variable (wght 100-900), so weight is a variation, not a second file. */
const mono = (color: Float32Array, fontSize: number, heightMultiplier: number, wght = 400): TextStyle => ({
  color,
  fontFamilies: ['Geist Mono'],
  fontSize,
  heightMultiplier,
  fontVariations: [{ axis: 'wght', value: wght }],
});

function paragraph(text: string, textStyle: TextStyle, maxLines: number, align = CanvasKit.TextAlign.Left) {
  const style = new CanvasKit.ParagraphStyle({ textStyle, textAlign: align, maxLines, ellipsis: '…' });
  const builder = CanvasKit.ParagraphBuilder.Make(style, fonts!);
  builder.addText(text);
  const p = builder.build();
  p.layout(W - BAR - 2 * PAD);
  builder.delete();
  return p;
}

function render({ title, description, date }: Page) {
  const surface = CanvasKit.MakeSurface(W, H);
  if (!surface) throw new Error('OG: MakeSurface failed');
  const canvas = surface.getCanvas();
  canvas.clear(BG);

  const paint = new CanvasKit.Paint();
  paint.setAntiAlias(false);
  paint.setStrokeWidth(1);
  paint.setColor(GRID_LINE);
  for (let x = GRID; x < W; x += GRID) canvas.drawLine(x + 0.5, 0, x + 0.5, H, paint);
  for (let y = GRID; y < H; y += GRID) canvas.drawLine(0, y + 0.5, W, y + 0.5, paint);
  paint.setColor(ACCENT);
  canvas.drawRect(CanvasKit.XYWHRect(0, 0, BAR, H), paint);

  const x = BAR + PAD;
  // Mono runs wide (~0.6em per glyph): long titles step down a size so they stay within three lines.
  const t = paragraph(title, mono(TEXT, title.length > 48 ? 54 : 64, 1.12, 700), 4);
  canvas.drawParagraph(t, x, PAD);
  const d = paragraph(description, mono(MUTED, 26, 1.45), 3);
  canvas.drawParagraph(d, x, PAD + t.getHeight() + 32);

  const left = paragraph([HOST, date && isoDate(date)].filter(Boolean).join('  ·  '), mono(SUBTLE, 22, 1), 1);
  const right = paragraph('// SIGNAL', mono(ACCENT, 22, 1, 500), 1, CanvasKit.TextAlign.Right);
  const fy = H - PAD - left.getHeight();
  canvas.drawParagraph(left, x, fy);
  canvas.drawParagraph(right, x, fy);
  paint.setColor(RULE);
  canvas.drawLine(x, fy - 27.5, W - PAD, fy - 27.5, paint);

  const image = surface.makeImageSnapshot();
  const bytes = image.encodeToBytes(CanvasKit.ImageFormat.PNG, 100);
  for (const o of [t, d, left, right, paint, image]) o.delete();
  surface.dispose();
  if (!bytes) throw new Error('OG: PNG encode failed');
  return bytes.slice(); // copy out of wasm memory (and onto a plain ArrayBuffer for Response)
}

export async function getStaticPaths() {
  const posts = await getPublishedPosts();
  const page = (slug: string, props: Page) => ({ params: { slug }, props });
  return [
    page('default', { title: SITE.title, description: SITE.description }),
    ...posts.map((p) => page(p.id, { title: p.data.title, description: p.data.description, date: p.data.pubDate })),
  ];
}

export const GET: APIRoute = ({ props }) =>
  new Response(render(props as Page), { headers: { 'Content-Type': 'image/png' } });
