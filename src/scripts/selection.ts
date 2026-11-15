// A text selection that fades in and out (DESIGN.md §4). Browsers can't transition ::selection, so the native
// highlight goes transparent (html.sel-fx, set here, so without this script the native one still shows) and the
// selected lines are drawn as rectangles in one layer that fades. The layer blends with the page (--sel-blend:
// lighten on dark, darken on light), so text keeps its colour and code blocks show the wash too. Event-driven: one
// draw per frame while the selection changes, nothing when idle. Reduced motion: the layer shows at once.
const layer = document.createElement('div');
layer.className = 'sel-layer';
layer.setAttribute('aria-hidden', 'true');
document.body.append(layer);
document.documentElement.classList.add('sel-fx');

// One rectangle per line of each selected text node. A range's own rects also include the boxes of whole elements it
// spans, which would stack and darken, so only text is measured.
const lines = (range: Range): DOMRect[] => {
  const out: DOMRect[] = [];
  const root = range.commonAncestorContainer;
  const walk = document.createTreeWalker(root.nodeType === 3 ? root.parentNode! : root, NodeFilter.SHOW_TEXT);
  const part = document.createRange();
  for (let n = walk.nextNode(); n; n = walk.nextNode()) {
    if (!range.intersectsNode(n)) continue;
    part.selectNodeContents(n);
    if (n === range.startContainer) part.setStart(n, range.startOffset);
    if (n === range.endContainer) part.setEnd(n, range.endOffset);
    for (const r of part.getClientRects()) if (r.width > 0.5 && r.height > 0.5) out.push(r);
  }
  return out;
};

let frame = 0;
const draw = () => {
  frame = 0;
  const sel = getSelection();
  if (!sel || sel.isCollapsed || !sel.rangeCount) return layer.classList.remove('on');
  const rects = lines(sel.getRangeAt(0));
  while (layer.childElementCount < rects.length) layer.append(document.createElement('i'));
  [...layer.children].forEach((el, i) => {
    const r = rects[i];
    (el as HTMLElement).style.cssText = r
      ? `left:${r.left + scrollX}px;top:${r.top + scrollY}px;width:${r.width}px;height:${r.height}px`
      : 'display:none';
  });
  layer.classList.add('on');
};
document.addEventListener('selectionchange', () => (frame ||= requestAnimationFrame(draw)));
// A resize reflows the text under a held selection; redraw it there instead of leaving the old boxes behind.
addEventListener('resize', () => (frame ||= requestAnimationFrame(draw)));
