---
title: 'Tooltips with CSS only'
description: 'Two pseudo-elements and a data attribute are enough for most tooltips. No library required.'
date: 2021-01-17
code: 'content: attr(data-tooltip);'
---

A tooltip is a cheap way to hand the reader a detail without printing it on the page. Most projects reach for a library to get one. That is fine when you need twenty tooltips with collision detection, but carrying a dependency for two labels on a settings page feels wrong.

This post builds a tooltip with one data attribute and a pseudo-element. There is no extra element in the HTML and no JavaScript.

## What you need to know

- How `data-*` attributes work in HTML, and how CSS selects on them. CSS-Tricks has [a complete guide](https://css-tricks.com/a-complete-guide-to-data-attributes/#styling).
- What `::before` and `::after` pseudo-elements are.
- `position: absolute` and `transform`.

## The markup

Put a `data-tooltip` attribute on the element that should show the tooltip. The attribute value is the tooltip text.

```html title="index.html"
<span data-tooltip="Tooltip text">
  Hover on me to see the tooltip
</span>
```

That is the whole HTML change.

## The tooltip

Select every element that has the attribute, make it a positioning context, and draw the tooltip as an `::after` pseudo-element. `content: attr(data-tooltip)` pulls the text straight out of the attribute.

```css title="styles.css"
[data-tooltip] {
  position: relative;
  cursor: pointer;
}

[data-tooltip]::after {
  content: attr(data-tooltip);
  position: absolute;
  top: 100%;
  left: 50%;
  width: max-content;
  padding: 8px 12px;
  border-radius: 6px;
  background: #fff;
  color: #222;
  font-size: 14px;
  text-align: center;
  box-shadow:
    0 4px 14px rgb(0 0 0 / 0.2),
    0 0 0 1px rgb(0 0 0 / 0.05);
  transform: translate(-50%, 8px) scale(0);
  transform-origin: top;
  transition: transform 140ms;
}
```

At this point the pseudo-element exists but `scale(0)` keeps it invisible. Reveal it on hover by scaling back to 1.

```css title="styles.css"
[data-tooltip]:hover::after {
  transform: translate(-50%, 8px) scale(1);
}
```

`top: 100%` plus an 8px translate places the tooltip just under the trigger. Swap those for `bottom: 100%` and a negative translate to put it above, or use `left` and `right` with a matching translate for the sides.

## Adding an arrow

A second pseudo-element gives you the small pointer. It is a zero-size box with one coloured border, centred under the trigger and shown with the same hover rule.

```css title="styles.css"
[data-tooltip]::before {
  content: "";
  position: absolute;
  top: 100%;
  left: 50%;
  border: 6px solid transparent;
  border-bottom-color: #fff;
  transform: translate(-50%, -4px) scale(0);
  transform-origin: bottom;
  transition: transform 140ms;
}

[data-tooltip]:hover::before {
  transform: translate(-50%, -4px) scale(1);
}
```

## Using it

From here on, any element that needs a tooltip gets `data-tooltip="text"` and nothing else. The demo is on [CodePen](https://codepen.io/thoughtlessmind/pen/rNMoLWo).

Two things this version does not do: it cannot detect the viewport edge, and it will not show on keyboard focus unless you add `:focus-visible` next to `:hover`. Add the second one; it is one selector. I later packaged this pattern, with light and dark themes and four positions, as [css-only-tooltip](https://www.npmjs.com/package/css-only-tooltip) on npm.

---

Also published on [dev.to](https://dev.to/thoughtlessmind/tooltip-using-only-css-2oh4).
