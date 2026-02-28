# GSD Plugin for Ship Studio

## What This Is

A Ship Studio plugin that makes Get Shit Done (GSD) accessible to people who'd never touch a CLI. It handles GSD installation via an interactive terminal, shows a dashboard of project plans with drill-down into individual files, lets users delete plans with confirmation, and explains the GSD workflow in dead simple terms — all from within Ship Studio's UI.

## Core Value

Make GSD approachable — anyone using Ship Studio can install it, understand it, and manage their plans without ever reading a README or memorizing commands.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Detect whether GSD is installed (`~/.claude/get-shit-done/` exists)
- [ ] One-click install that opens interactive terminal running `npx get-shit-done-cc@latest`
- [ ] Detect whether current project has a `.planning/` directory
- [ ] Dashboard overview showing roadmap phases, statuses, and what's next
- [ ] Drill-down to read individual `.planning/` files (PROJECT.md, REQUIREMENTS.md, ROADMAP.md, phase plans)
- [ ] Delete entire `.planning/` directory with confirmation dialog
- [ ] Delete individual phase folders/files with confirmation dialog
- [ ] In-plugin guide page explaining the GSD workflow (discuss → plan → execute → verify) in simple visual terms
- [ ] Contextual hints based on current project state (e.g., "Run /gsd:plan-phase 1 next")
- [ ] Toolbar button as entry point (consistent with Ship Studio plugin patterns)

### Out of Scope

- Other runtimes (OpenCode, Gemini CLI, Codex) — Claude Code only
- Running GSD commands from the plugin — users run those in Claude Code's terminal
- Editing `.planning/` files from the plugin — read-only view
- Creating new projects from the plugin — that's `/gsd:new-project` in Claude Code

## Context

- Ship Studio plugins are React/TypeScript apps built with Vite, rendered in a toolbar slot
- Plugin context provides: `shell.exec()` for commands, `actions.openTerminal()` for interactive CLI, `actions.showToast()` for notifications, `storage` for persistence, `theme` for styling
- The Vercel plugin (`ship-studio/plugin-vercel`) is the reference implementation for CLI installation patterns — it uses `openTerminal()` for interactive `vercel login` and `shell.exec()` for detection
- GSD installs via `npx get-shit-done-cc@latest` which has interactive prompts (runtime choice, scope)
- GSD creates `.planning/` in the project root with: `PROJECT.md`, `config.json`, `REQUIREMENTS.md`, `ROADMAP.md`, `STATE.md`, `research/` directory, and numbered phase directories
- The plugin starter repo (`ship-studio/plugin-starter`) shows the latest API patterns including React Context, storage, invoke, and theme access

## Constraints

- **Tech stack**: React + TypeScript + Vite (Ship Studio plugin requirements)
- **Slot**: Toolbar only (the only slot demonstrated in existing plugins)
- **API**: Must use `window.__SHIPSTUDIO_PLUGIN_CONTEXT_REF__` React Context pattern (newer API from starter)
- **Runtime**: Claude Code only — no need to detect or support other GSD runtimes
- **Read-only plans**: Plugin reads `.planning/` files but doesn't edit them (deletion is separate from editing)

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Use React Context pattern (not window global) | Starter template shows this as the current API — gives access to storage, theme, invoke | — Pending |
| Toolbar button → modal/panel UI | Consistent with Vercel plugin pattern, keeps everything in one slot | — Pending |
| openTerminal() for GSD install | Interactive installer needs user input (runtime, scope choices) — same pattern as Vercel CLI login | — Pending |
| Detect GSD via filesystem check | Check `~/.claude/get-shit-done/` existence rather than running a command | — Pending |
| Claude Code only | Ship Studio is already a Claude Code tool — simplifies scope | — Pending |

---
*Last updated: 2026-02-28 after initialization*
