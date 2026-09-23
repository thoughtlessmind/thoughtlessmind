@AGENTS.md

## Claude Code notes

- **Dev servers:** start them with the preview tools from `.claude/launch.json` (`dev` on 4323, `preview` on 4324), not
  from Bash. Astro 7 runs one dev server per project, so reuse the running one.
- **Browser checks:** verify in the chrome-devtools MCP with an isolated context. The in-app browser pane is often
  hidden, which pauses rAF and IntersectionObserver: reveals, the lens and the planet look broken when they aren't.
- **Before calling UI work done:** run `pnpm check` and `pnpm build`. Screenshot at 1440 and 375.
- **Git:** `docs/`, `.impeccable/` and `.claude/` are local notes and tools. Never commit them.
