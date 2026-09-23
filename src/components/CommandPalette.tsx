import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { navigate } from 'astro:transitions/client';
import './palette.css';

type Link = { label: string; href: string };
/** `draft` is optional so the Header contract stays valid; a missing flag means not a draft. */
type PostLink = { title: string; href: string; date: string; draft?: boolean };
type Item = {
  id: string;
  label: string;
  /** Mono date, never truncated. */
  date?: string;
  /** Excerpt or marker; shrinks with an ellipsis. */
  hint?: string;
  draft?: boolean;
  href?: string;
  external?: boolean;
  run?: () => void;
  keep?: boolean;
};
type Group = { label: string; items: Item[] };

interface Props {
  pages: Link[];
  posts: PostLink[];
  projects: Link[];
}

/** Same contract as the header toggle: data-theme on <html> plus localStorage.theme. */
function toggleTheme() {
  const next = document.documentElement.dataset.theme === 'light' ? 'dark' : 'light';
  document.documentElement.dataset.theme = next;
  try {
    localStorage.theme = next;
  } catch {}
}

const has = (q: string, s: string) => s.toLowerCase().includes(q.toLowerCase());
/** Pagefind excerpts are HTML (with <mark>s and escaped code); render them as plain text. */
const strip = (html: string) => new DOMParser().parseFromString(html, 'text/html').body.textContent ?? '';
const PAGEFIND = '/pagefind/pagefind.js';

function Option({ item, selected, onHover, onPick }: { item: Item; selected: boolean; onHover: () => void; onPick: () => void }) {
  const props = {
    id: `opt-${item.id}`,
    role: 'option',
    'aria-selected': selected,
    className: 'palette__option',
    tabIndex: -1,
    onMouseMove: onHover,
    onClick: (e: React.MouseEvent) => {
      if (e.metaKey || e.ctrlKey || e.shiftKey) return;
      e.preventDefault();
      onPick();
    },
  };
  const body = (
    <>
      <span className="palette__option-label">
        {item.label}
        {item.draft && <span className="draft-badge">Draft</span>}
      </span>
      {item.date && <span className="palette__date">{item.date}</span>}
      {item.hint && <span className="palette__hint">{item.hint}</span>}
    </>
  );
  return item.href ? (
    <a {...props} href={item.href} target={item.external ? '_blank' : undefined} rel={item.external ? 'noopener' : undefined}>
      {body}
    </a>
  ) : (
    <button {...props} type="button">
      {body}
    </button>
  );
}

/** Renders nothing until opened, so SSR output and hydration are both empty. */
export default function CommandPalette({ pages, posts, projects }: Props) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [sel, setSel] = useState(0);
  const [hits, setHits] = useState<Item[] | null>(null);
  const [copied, setCopied] = useState(false);
  const opener = useRef<Element | null>(null);
  const dead = useRef(false);
  const input = useRef<HTMLInputElement>(null);
  const close = useRef<HTMLButtonElement>(null);
  const list = useRef<HTMLDivElement>(null);
  const pressed = useRef(0); // time of the last mousedown in the palette (a click's blur lands in the same task)

  const show = useCallback(() => {
    const active = document.activeElement;
    opener.current = active && active !== document.body ? active : document.querySelector('[data-open-palette]');
    setQ('');
    setSel(0);
    setHits(null);
    setCopied(false);
    setOpen(true);
  }, []);
  const hide = useCallback(() => {
    setOpen(false);
    (opener.current as HTMLElement | null)?.focus?.();
  }, []);
  // First Esc clears the query, the next one closes.
  const escape = () => {
    if (q) {
      setQ('');
      input.current?.focus();
    } else hide();
  };

  useEffect(() => {
    if (dead.current) return;
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (open) hide();
        else show();
      } else if (e.key === 'Escape' && open) {
        e.preventDefault(); // window-level, so it works wherever focus is
        escape();
      }
    };
    const onOpen = () => show();
    const onSwap = () => ((dead.current = true), setOpen(false)); // island belongs to the outgoing document
    window.addEventListener('keydown', onKey);
    window.addEventListener('open-palette', onOpen);
    document.addEventListener('astro:before-swap', onSwap);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('open-palette', onOpen);
      document.removeEventListener('astro:before-swap', onSwap);
    };
  }, [open, q, show, hide]);

  // Scroll lock + focus while open.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    input.current?.focus();
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // Pagefind for the Writing group; falls back to title filtering when there is no index (dev) or no hits.
  useEffect(() => {
    const query = q.trim();
    if (!open || query.length < 2) {
      setHits(null);
      return;
    }
    let live = true;
    const t = window.setTimeout(async () => {
      try {
        const pf = await import(/* @vite-ignore */ PAGEFIND);
        const res = await pf.search(query);
        const data = await Promise.all(res.results.slice(0, 6).map((r: { data: () => Promise<any> }) => r.data()));
        if (live)
          setHits(
            data.map((d) => ({ id: `pf:${d.url}`, label: d.meta?.title ?? d.url, hint: strip(d.excerpt ?? ''), href: d.url })),
          );
      } catch {
        if (live) setHits([]);
      }
    }, 80);
    return () => {
      live = false;
      window.clearTimeout(t);
    };
  }, [q, open]);

  const copyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(location.href);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {}
  }, []);

  const { groups, noMatch } = useMemo(() => {
    const query = q.trim();
    const filt = <T,>(arr: T[], key: (t: T) => string) => (query ? arr.filter((x) => has(query, key(x))) : arr);
    const writing: Item[] =
      hits && hits.length
        ? hits
        : (query ? posts.filter((p) => has(query, p.title)).slice(0, 6) : posts.slice(0, 5)).map((p) => ({
            id: `post:${p.href}`,
            label: p.title,
            date: p.date,
            draft: p.draft,
            href: p.href,
          }));
    const actions: Item[] = [
      { id: 'copy', label: copied ? 'Copied' : 'Copy current link', run: copyLink, keep: true },
      // A path to the terminal besides Ctrl+` and the hidden coordinate egg. Ask for it after the palette
      // has closed and handed focus back, so the terminal returns focus to the palette's opener.
      {
        id: 'terminal',
        label: 'Open terminal',
        run: () => requestAnimationFrame(() => dispatchEvent(new CustomEvent('terminal:open'))),
      },
      { id: 'theme', label: 'Switch light / dark theme', run: toggleTheme },
      { id: 'rss', label: 'Open RSS', href: '/rss.xml' },
    ];
    const groups: Group[] = [
      { label: 'Pages', items: filt(pages, (p) => p.label).map((p) => ({ id: `page:${p.href}`, label: p.label, href: p.href })) },
      { label: 'Writing', items: writing },
      {
        label: 'Projects',
        items: filt(projects, (p) => p.label).map((p) => ({ id: `proj:${p.href}`, label: p.label, hint: '↗', href: p.href, external: true })),
      },
      { label: 'Actions', items: filt(actions, (a) => a.label) },
    ].filter((g) => g.items.length > 0);
    const noMatch = groups.length === 0;
    return { groups, noMatch };
  }, [q, hits, pages, posts, projects, copied, copyLink]);

  const flat = useMemo(() => groups.flatMap((g) => g.items), [groups]);
  const cur = Math.min(sel, Math.max(0, flat.length - 1));

  useEffect(() => {
    setSel(0);
  }, [q, hits]);
  useEffect(() => {
    list.current?.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: 'nearest' });
  }, [cur]);

  const activate = (item: Item) => {
    if (item.run) {
      item.run();
      if (!item.keep) hide();
      return;
    }
    if (!item.href) return;
    hide();
    if (item.external) window.open(item.href, '_blank', 'noopener');
    else navigate(item.href);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    const n = flat.length;
    if (e.key === 'ArrowDown') setSel(n ? (cur + 1) % n : 0);
    else if (e.key === 'ArrowUp') setSel(n ? (cur - 1 + n) % n : 0);
    else if (e.key === 'Home') setSel(0);
    else if (e.key === 'End') setSel(Math.max(0, n - 1));
    else if (e.key === 'Enter') {
      // hide() moves focus to the opener (the ⌘K button); without this, Enter's default action clicks it and reopens.
      e.preventDefault();
      if (flat[cur]) activate(flat[cur]);
    }
    else if (e.key === 'Tab') {
      e.preventDefault();
      if (document.activeElement === close.current && !e.shiftKey) input.current?.focus();
      else if (document.activeElement === input.current && e.shiftKey) close.current?.focus();
      else if (document.activeElement === input.current) close.current?.focus();
      else input.current?.focus();
    }
  };

  if (!open) return null;
  return (
    <div
      className="palette-overlay"
      onMouseDown={(e) => {
        pressed.current = Date.now();
        if (e.target === e.currentTarget) hide();
      }}>
      <div className="palette hud" role="dialog" aria-modal="true" aria-label="Search" onKeyDown={onKeyDown}>
        <div className="palette__field">
          <span className="palette__prompt" aria-hidden="true">~$</span>
          <label className="sr-only" htmlFor="palette-search">Search the site</label>
          <input
            id="palette-search"
            ref={input}
            className="palette__input"
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onBlur={(e) => {
              // Vimium-style extensions swallow Esc in a text field and only blur it. Focus dropping to nowhere
              // (not a click in the palette, not another window) is that Esc.
              if (e.relatedTarget || Date.now() - pressed.current < 100) return;
              setTimeout(() => input.current && document.hasFocus() && document.activeElement === document.body && escape());
            }}
            placeholder="search writing, pages, actions"
            autoComplete="off"
            spellCheck={false}
            role="combobox"
            aria-expanded="true"
            aria-controls="palette-list"
            aria-autocomplete="list"
            aria-activedescendant={flat[cur] ? `opt-${flat[cur].id}` : undefined}
          />
          <button ref={close} type="button" className="palette__close" onClick={hide}>
            Close
          </button>
        </div>
        <div className="palette__list" id="palette-list" role="listbox" aria-label="Results" ref={list}>
          {noMatch && <p className="palette__empty">No matches.</p>}
          {groups.map((g) => (
            <div key={g.label} role="group" aria-label={g.label} className="palette__group">
              <p className="label palette__label">{g.label}</p>
              {g.items.map((item) => {
                const i = flat.indexOf(item);
                return <Option key={item.id} item={item} selected={i === cur} onHover={() => setSel(i)} onPick={() => activate(item)} />;
              })}
            </div>
          ))}
        </div>
        <p className="palette__footer">
          <span>
            <kbd className="kbd">↑</kbd>
            <kbd className="kbd">↓</kbd> navigate
          </span>
          <span>
            <kbd className="kbd">↵</kbd> open
          </span>
          <span>
            <kbd className="kbd">esc</kbd> close
          </span>
        </p>
        <p className="sr-only" aria-live="polite">
          {copied ? 'Link copied to clipboard' : ''}
        </p>
      </div>
    </div>
  );
}
