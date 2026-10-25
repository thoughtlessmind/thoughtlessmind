@AGENTS.md

## Claude Code notes

- **Dev servers:** start them with the preview tools from `.claude/launch.json` (`dev` on 4323, `preview` on 4324), not
  from Bash. Astro 7 runs one dev server per project, so reuse the running one.
- **Browser checks:** verify in Chrome (the chrome-devtools MCP with an isolated context) at 1440 and 375. The in-app
  browser pane is often hidden, which pauses rAF and IntersectionObserver, so motion looks broken when it isn't.
- **Before calling UI work done:** run `pnpm check` and `pnpm build`.
- **Git:** `docs/`, `.impeccable/` and `.claude/` are local notes and tools. Never commit them.
