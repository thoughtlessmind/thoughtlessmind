---
title: 'Using the MUI Link with the Next.js Link in the App Router'
description: "Pass next/link to the MUI Link's component prop. In a Next.js 16 Server Component, re-export next/link from a 'use client' file before passing it."
date: 2026-10-07
code: 'component={Link}'
---

Pass the Next.js `Link` to the MUI `Link` through its `component` prop: `<Link component={NextLink} href="/about">`. MUI keeps its styling and props like `variant` and `underline`; Next.js does the prefetching and client-side navigation. In the App Router there is one catch: a Server Component that passes `next/link` to `component` has to import it through a file marked `'use client'`, or the build fails.

Everything here is checked against `@mui/material` 9.4.0 and `next` 16.4.0 (App Router, TypeScript), the current releases on 7 October 2026.

## Why the direct import fails

The obvious version is a few lines in a page:

```tsx title="app/page.tsx"
import NextLink from 'next/link';
import Link from '@mui/material/Link';

export default function Page() {
  return (
    <Link component={NextLink} href="/about">
      About
    </Link>
  );
}
```

With Next.js 16.4, `next build` stops while prerendering that page:

```txt
Error: Functions cannot be passed directly to Client Components unless you
explicitly expose it by marking it with "use server". Or maybe you meant to call
this function rather than return it.
```

`page.tsx` is a Server Component and MUI's `Link` is a Client Component. React only lets serializable props cross from one to the other, and a function only qualifies if it is exported from a module marked `'use client'` or is a Server Function. `component={NextLink}` hands over a plain function. `next/link` has its own `'use client'`, but in a Next.js 16 build its import still reaches the page as a plain function, not a client reference (the full error points at `component: function`).

## The fix: re-export next/link from a client file

MUI's Next.js guide has the fix. Re-export `next/link` from a file with the `'use client'` directive:

```tsx title="components/NextLink.tsx"
'use client';
import NextLink from 'next/link';

export default NextLink;
```

Import that file instead of `next/link`. The page stays a Server Component:

```tsx title="app/page.tsx"
import Button from '@mui/material/Button';
import Link from '@mui/material/Link';
import NextLink from '../components/NextLink';

export default function Page() {
  return (
    <>
      <Link component={NextLink} href="/about" variant="body2" underline="hover">
        About
      </Link>
      <Button component={NextLink} href="/about" variant="contained">
        Go to about
      </Button>
    </>
  );
}
```

Each one renders a single `<a href="/about">` carrying MUI's classes. That works because `next/link` passes `<a>` attributes such as `className` to the anchor it renders. `Button` takes the same `component` prop, so a button-styled link is the same one-line change.

## One component for the whole app

The original question asked for a single component that combines the two, so nobody has to remember the `component` prop. That is a short client component:

```tsx title="components/AppLink.tsx"
'use client';
import NextLink from 'next/link';
import Link, { type LinkProps } from '@mui/material/Link';

export default function AppLink(props: LinkProps<typeof NextLink>) {
  return <Link component={NextLink} {...props} />;
}
```

This file is already a Client Component, so it can import `next/link` directly; no function crosses the server boundary. Server Components pass it plain, serializable props:

```tsx title="app/page.tsx"
import AppLink from '../components/AppLink';

export default function Page() {
  return (
    <nav>
      <AppLink href="/about" color="secondary">
        About
      </AppLink>
      <AppLink href={{ pathname: '/about', query: { ref: 'nav' } }} prefetch={false}>
        About, with a query
      </AppLink>
    </nav>
  );
}
```

`LinkProps<typeof NextLink>` merges both prop sets, so TypeScript accepts MUI props like `color` and `underline` next to Next.js props like `prefetch` and an object `href`. The second link renders `href="/about?ref=nav"`.

## Why older answers look different

Before Next.js 13, `next/link` expected an `<a>` as its child, and `passHref` forced it to hand `href` down when that child was a custom component. Version 13 changed this: the Link docs list "No longer requires a child `<a>` tag" under v13.0.0, and the `new-link` codemod strips the old `<a>` children.

So a snippet with `passHref` and `legacyBehavior` is written for the old model. `legacyBehavior` still exists in Next.js 16.4, but its type is marked `@deprecated` with "This will be removed in a future version". Leave it out of new code.

The Pages Router has no Server Components, so there `component={NextLink}` works with a direct import and no wrapper file. MUI's Pages Router example also ships an adapter, `NextLinkComposed`, which takes `to` instead of `href` to avoid a naming conflict.

My original answer was the one-liner `<Link component={NextjsLink}>`. At the time I had only confirmed it with react-router and said it might also work with Next.js. With today's `next/link` it does; the App Router adds one client file.

---

I first answered this on [Stack Overflow](https://stackoverflow.com/a/66227329) in 2021. The question has been viewed about 47,000 times.
