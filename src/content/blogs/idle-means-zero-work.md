---
# Placeholder: replace with a real post. Hidden until then: remove `draft` to publish.
draft: true
title: Idle means zero work
description: The rule behind the drawing on this site's home page. Animation loops run only while you can see them, keep their own clock, and reduced motion gets the finished drawing.
date: 2026-09-10
code: 'cancelAnimationFrame(raf)'
---

A page that is sitting still should cost nothing: no loop redrawing something nobody can see, no script waking up on every scroll. This site has that as a written rule, in the instruction file at the root of the repo: "Idle means zero work: stop rAF loops when nothing moves." The drawing on the home page is the part that had to work hardest to follow it.

## What moves, and how

The drawing draws itself once when the page loads, in about 2.4 seconds: a telescope, a dotted route, a ringed planet, a moon, a pendulum, stars and a rocket. Every stroke is a CSS animation on `stroke-dashoffset`, with its own delay and duration. When the draw finishes, those animations are over, and the elements sit in their plain state. Nothing is left running.

Two things keep moving after that. The pendulum swings, 1.1 seconds each way, and the planet's rings orbit, their dashes sliding round with periods from about 45 seconds on the inside to 75 on the outside. Both are CSS animations too. They need no JavaScript per frame, and the page can pause them with one property, `animation-play-state: paused`.

The planet's cloud bands are the exception. They are seven broken lines of latitude on a sphere that turns once every 64 seconds, so as it turns they have to slow and shorten towards the edge of the disk and end exactly at it. CSS can't project a line onto a sphere. That takes a little math every frame, and every frame means `requestAnimationFrame`.

## The loop only runs when you can see it

A `requestAnimationFrame` loop runs on every frame while the tab is visible. Browsers pause it in background tabs, but they don't pause it when the thing it draws has scrolled out of view. Left alone, the bands would keep being projected for every frame of every visit, long after the reader had scrolled down to read something else.

So the loop starts when the drawing comes on screen and stops when it leaves. IntersectionObserver tells me when that happens, without a scroll listener:

```ts
let raf = 0;
let last = 0;
let t = 0; // the animation's own clock, in seconds

const tick = (now: number) => {
  if (last) t += (now - last) / 1000;
  last = now;
  draw(t);
  raf = requestAnimationFrame(tick);
};

const start = () => {
  if (!raf) raf = requestAnimationFrame(tick);
};

const stop = () => {
  cancelAnimationFrame(raf);
  raf = last = 0;
};

if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
  new IntersectionObserver(([entry]) => (entry.isIntersecting ? start() : stop())).observe(el);
}
```

That is a simplified version of what the home page runs. The real one has a second reason to stop: while the splash screen covers the drawing, the bands hold still. A MutationObserver watches the class on the root element, and the loop runs only when the drawing is on screen and nothing is in front of it. Both observers feed one `sync` function that decides whether the loop should be running, so there is exactly one place where it starts or stops.

The `if (!raf)` guard matters as soon as more than one thing can call `start()`, as in the real version. Without it, a second call would begin a second loop, drawing every frame twice.

## A clock that stops with the loop

The obvious way to animate is to compute the frame from the timestamp `requestAnimationFrame` hands you. That timestamp keeps counting while the loop is stopped. Scroll away for a minute, come back, and the planet would jump to wherever it would have been, mid-turn, in one frame.

So the loop keeps its own clock. `t` only grows by the time between two frames the loop actually drew. On `stop()`, `last` goes back to zero, so the first frame after a restart adds nothing, and the planet picks up exactly where it was. You can't see the pause, because time stopped for the planet too.

The CSS animations get the same treatment for free. A paused CSS animation resumes from where it paused.

## Reduced motion gets the finished drawing

With `prefers-reduced-motion: reduce`, none of this runs. The CSS animations are declared inside a media query, so they never start:

```css
@media (prefers-reduced-motion: no-preference) {
  .doodle [pathLength] { animation: d-draw calc(var(--t) * 1ms) var(--ease) calc(var(--d) * 1ms) backwards; }
  .doodle .ring { animation: d-orbit calc(var(--ms) * 1ms) linear infinite; }
  html.splash:not(.go) .doodle * { animation-play-state: paused; }
}
```

The script checks the same query before it creates the observer, so the loop never starts either. The reader still gets the whole drawing. The planet's markup is generated at build time, with the bands already projected at time zero, so the drawing is complete and still from the first paint, with or without JavaScript. Reduced motion is a different way to see the page, and nothing is missing from it.

To check the rule holds, I record a few seconds in the browser's performance panel with the page scrolled past the drawing. The main thread should show no script at all from frame to frame. If a function turns up on every frame, a loop is running that shouldn't be, and I go find it.
