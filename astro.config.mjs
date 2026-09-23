// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import expressiveCode from 'astro-expressive-code';
import pagefind from 'astro-pagefind';
import tailwindcss from '@tailwindcss/vite';
import { readdirSync, readFileSync } from 'node:fs';

const site = 'https://thoughtlessmind.dev';

/**
 * Sitemap facts read straight from the post frontmatter (astro:content is not available here):
 * drafts and posts canonicalised elsewhere are left out; lastmod = updatedDate ?? pubDate.
 */
const blogDir = new URL('./src/content/blog/', import.meta.url);
/** @type {Set<string>} */
const excluded = new Set();
/** @type {Map<string, string>} */
const lastmod = new Map();
for (const file of readdirSync(blogDir)) {
  if (!/\.mdx?$/.test(file)) continue;
  const fm = readFileSync(new URL(file, blogDir), 'utf8').split(/^---$/m)[1] ?? '';
  const url = `${site}/writing/${file.replace(/\.mdx?$/, '')}/`;
  /** @param {string} name */
  const field = (name) => fm.match(new RegExp(`^${name}:\\s*(.+)$`, 'm'))?.[1].trim().replace(/^["']|["']$/g, '');
  const canonical = field('canonical');
  if (field('draft') === 'true' || (canonical && new URL(canonical).host !== new URL(site).host)) excluded.add(url);
  const date = field('updatedDate') ?? field('pubDate');
  if (date) lastmod.set(url, new Date(date).toISOString());
}
const buildDate = new Date().toISOString();

// https://astro.build/config
export default defineConfig({
  site,
  output: 'static',
  trailingSlash: 'always',
  prefetch: { prefetchAll: true, defaultStrategy: 'hover' },
  integrations: [
    react(),
    expressiveCode({
      // Dark first: it is the unconditional base (no-JS default); light applies under [data-theme="light"].
      themes: ['github-dark', 'github-light'],
      themeCssSelector: (theme) => `[data-theme="${theme.type}"]`,
      useDarkModeMediaQuery: false,
      useThemedScrollbars: false,
      useThemedSelectionColors: false,
      styleOverrides: {
        borderRadius: '0',
        borderColor: 'var(--border)',
        borderWidth: '1px',
        codeFontFamily: 'var(--font-mono)',
        codeFontSize: '0.875rem',
        codeLineHeight: '1.6',
        codeBackground: 'var(--code-bg)',
        uiFontFamily: 'var(--font-ui)',
        uiFontSize: '0.75rem',
        focusBorder: 'var(--accent)',
        frames: {
          shadowColor: 'transparent',
          frameBoxShadowCssValue: 'none',
          editorTabBarBackground: 'var(--surface)',
          editorTabBarBorderColor: 'var(--border)',
          editorTabBarBorderBottomColor: 'var(--border)',
          editorActiveTabBackground: 'var(--code-bg)',
          editorActiveTabForeground: 'var(--text)',
          editorActiveTabIndicatorTopColor: 'var(--accent)',
          editorActiveTabIndicatorBottomColor: 'transparent',
          editorActiveTabIndicatorHeight: '2px',
          editorTabBorderRadius: '0',
          editorBackground: 'var(--code-bg)',
          terminalBackground: 'var(--code-bg)',
          terminalTitlebarBackground: 'var(--surface)',
          terminalTitlebarBorderBottomColor: 'var(--border)',
          terminalTitlebarForeground: 'var(--text-muted)',
          terminalTitlebarDotsForeground: 'var(--border-strong)',
          terminalTitlebarDotsOpacity: '1',
          inlineButtonBackground: 'var(--bg-elevated)',
          inlineButtonBorder: 'var(--border-strong)',
          inlineButtonForeground: 'var(--text-muted)',
          inlineButtonBackgroundIdleOpacity: '1',
          inlineButtonBackgroundHoverOrFocusOpacity: '1',
          inlineButtonBackgroundActiveOpacity: '1',
          inlineButtonBorderOpacity: '1',
          tooltipSuccessBackground: 'var(--accent)',
          tooltipSuccessForeground: 'var(--accent-fg)',
        },
      },
    }),
    mdx(),
    sitemap({
      filter: (page) => !excluded.has(page),
      serialize: (item) => ({ ...item, lastmod: lastmod.get(item.url) ?? buildDate }),
    }),
    pagefind(),
  ],
  vite: { plugins: [tailwindcss()] },
});
