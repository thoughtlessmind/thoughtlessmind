---
title: 'MUI theme shadows, gradient text and scrollable tabs'
description: 'Three MUI answers, updated for v9: pad theme.shadows to 25 entries, write WebkitBackgroundClip with a capital W, add variant="scrollable" to Tabs.'
date: 2026-10-07
code: 'WebkitBackgroundClip'
---

`theme.shadows` must hold exactly 25 entries, one for each elevation from 0 to 24, so pad your custom shadows out to 25. Gradient text on `Typography` needs `background-clip: text`, and in a JavaScript style object the prefixed key is `WebkitBackgroundClip`, with a capital W. Tabs that overflow scroll once you add `variant="scrollable"`.

The questions behind these were asked against Material UI v4 (`@material-ui/core`). Everything below is checked against `@mui/material` 9.4.0 and `@mui/lab` 9.0.0-beta.9, the current releases on 7 October 2026, and each section notes what changed since.

## Overriding theme shadows: all 25 entries

The question was a theme with five `shadows` entries and a console warning: "Material-UI: This elevation 4 is not implemented in the component."

`theme.shadows` is indexed by elevation. Paper's `elevation` prop accepts 0 to 24, and components pick an index by default. In the 9.4.0 source, `AppBar` uses 4, a contained `Button` 2, `SnackbarContent` 6, `Popover` (and so `Menu`) 8, a temporary `Drawer` 16 and `Dialog` 24. Five entries leave most of those undefined. v9's version of the warning reads `MUI: The elevation provided <Paper elevation={8}> is not available in the theme.`

My answer was to fill the rest with `'none'`. The same idea in v9 and TypeScript:

```ts title="theme.ts"
import { createTheme, type Shadows } from '@mui/material/styles';

const theme = createTheme({
  shadows: [
    'none',
    '0px 15px 60px rgba(0, 0, 0, 0.25)',
    '0px 35px 60px rgba(0, 0, 0, 0.25)',
    '20px 55px 60px rgba(0, 0, 0, 0.25)',
    '10px 15px 60px rgba(0, 0, 0, 0.25)',
    ...Array(20).fill('none'),
  ] as Shadows,
});

export default theme;
```

Five custom entries plus 20 `'none'` make 25. The `as Shadows` is for TypeScript. `Shadows` is a 25-item tuple whose first item is `'none'`, and a spread array has no fixed length, so without the cast `tsc` reports "Target requires 25 element(s) but source may have fewer." On the Next.js App Router, also put `'use client';` at the top of the theme file, as MUI's Next.js guide does.

Filling with `'none'` also flattens everything that uses a higher elevation: menus, drawers and dialogs lose their shadow. To keep MUI's defaults above your own, take the tail from a default theme:

```ts title="theme.ts"
import { createTheme, type Shadows } from '@mui/material/styles';

const defaultShadows = createTheme().shadows;

const theme = createTheme({
  shadows: [
    'none',
    '0px 15px 60px rgba(0, 0, 0, 0.25)',
    '0px 35px 60px rgba(0, 0, 0, 0.25)',
    '20px 55px 60px rgba(0, 0, 0, 0.25)',
    '10px 15px 60px rgba(0, 0, 0, 0.25)',
    ...defaultShadows.slice(5),
  ] as Shadows,
});

export default theme;
```

On v4 the function was `createMuiTheme` from `@material-ui/core/styles`. v5 renamed it to `createTheme` and moved the package to `@mui/material`.

## Gradient text on Typography

This question used v4's `withStyles` with `webkitBackgroundClip: "text"`, and it didn't work as expected. My answer was one character: make it `WebkitBackgroundClip`.

CSS-in-JS libraries turn a camelCase key into a CSS property by putting a hyphen before each capital letter and lowercasing the result. Emotion, MUI's default style engine today, does exactly that. `WebkitBackgroundClip` becomes `-webkit-background-clip`. `webkitBackgroundClip` becomes `webkit-background-clip`, which has no leading hyphen and isn't a property, so the browser drops it. JSS, the v4 engine, follows the same capital-letter rule.

`withStyles` isn't in `@mui/material/styles` any more: v5 dropped JSS, and the `@mui/styles` package that kept it is deprecated on npm. In v9, use the `sx` prop:

```tsx title="GradientHeading.tsx"
import Typography from '@mui/material/Typography';

export default function GradientHeading() {
  return (
    <Typography
      variant="h3"
      sx={{
        display: 'inline-block',
        backgroundImage: 'linear-gradient(45deg, #FE6B8B 30%, #FF8E53 90%)',
        WebkitBackgroundClip: 'text',
        backgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
      }}
    >
      Hello world!
    </Typography>
  );
}
```

`display: 'inline-block'` fixes the question's other complaint, that the gradient changed with the element's width. `Typography` renders a block element (`<h3>` here) that spans its container, and the gradient is painted across that box, since `background-origin` defaults to `padding-box`. Inline-block shrinks the box to the text.

I keep both clip lines. Chrome and Edge only accept the unprefixed `background-clip: text` from version 120, and MUI v9 still targets Chrome 117. Emotion's prefixer would add the `-webkit-` line for you, but I'd rather see it.

To reuse the style, wrap it once with `styled`:

```tsx title="GradientText.tsx"
import { styled } from '@mui/material/styles';
import Typography from '@mui/material/Typography';

const GradientText = styled(Typography)({
  display: 'inline-block',
  backgroundImage: 'linear-gradient(45deg, #FE6B8B 30%, #FF8E53 90%)',
  WebkitBackgroundClip: 'text',
  backgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
});

export default GradientText;
```

`<GradientText variant="h3">` keeps every `Typography` prop. MDN's `background-clip` page asks you to check contrast with this technique, so test both ends of the gradient against the page background.

## Scrollable tabs

With ten tabs in an `AppBar`, the last ones disappeared on smaller screens. `Tabs` takes `variant="scrollable"`: the row scrolls sideways and arrow buttons appear at its ends.

```tsx title="SectionTabs.tsx"
import * as React from 'react';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';

const sections = Array.from({ length: 10 }, (_, i) => `Section ${i + 1}`);

export default function SectionTabs() {
  const [value, setValue] = React.useState(0);

  return (
    <Tabs
      value={value}
      onChange={(_event: React.SyntheticEvent, next: number) => setValue(next)}
      variant="scrollable"
      scrollButtons="auto"
      aria-label="Account sections"
    >
      {sections.map((label) => (
        <Tab key={label} label={label} />
      ))}
    </Tabs>
  );
}
```

`scrollButtons="auto"` is the default, written out here for clarity. It shows the arrows only while the tabs overflow, and hides them below the `sm` breakpoint (600px unless you changed it). Add `scrollButtons` and `allowScrollButtonsMobile` to show them on every screen, or `scrollButtons={false}` to never show them.

My original answer put the prop on `TabList` from `@material-ui/lab` (now `@mui/lab`), and that still works: `TabList` accepts every `Tabs` prop. `@mui/lab` is still a beta for v9.

To make every `Tabs` in the app scrollable, set it once in the theme:

```ts title="theme.ts"
import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  components: {
    MuiTabs: {
      defaultProps: {
        variant: 'scrollable',
      },
    },
  },
});

export default theme;
```

If you customized the arrows on an older version: v9 removed `ScrollButtonComponent` and `TabScrollButtonProps`. Use `slots.scrollButtons` and `slotProps.scrollButtons` instead.

## More MUI answers

- [Remove or restyle the MUI TextField outline](/blogs/mui-textfield-remove-outline)
- [Use the MUI Link with the Next.js Link in the App Router](/blogs/mui-link-with-nextjs-link)
- [Why your MUI Divider is not showing in a flex container](/blogs/mui-divider-not-showing)

---

I first answered these on Stack Overflow in 2021: [theme shadows](https://stackoverflow.com/a/65792931), [gradient text](https://stackoverflow.com/a/66397215) and [scrollable tabs](https://stackoverflow.com/a/65558950).
