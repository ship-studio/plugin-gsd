# GSD Plugin for Ship Studio

## What This Is

A Ship Studio plugin that makes Get Shit Done (GSD) accessible to people who'd never touch a CLI. It handles GSD installation via an interactive terminal, shows a dashboard of project plans with drill-down into individual files, lets users delete plans with confirmation, and explains the GSD workflow in dead simple terms — all from within Ship Studio's UI.

## Core Value

Make GSD approachable — anyone using Ship Studio can install it, understand it, and manage their plans without ever reading a README or memorizing commands.

## Requirements

### Validated

- ✓ Detect whether GSD is installed (`~/.claude/get-shit-done/` exists) — v1.0
- ✓ One-click install that opens interactive terminal running `npx get-shit-done-cc@latest` — v1.0
- ✓ Detect whether current project has a `.planning/` directory — v1.0
- ✓ Dashboard overview showing roadmap phases, statuses, and plan counts — v1.0
- ✓ Drill-down to read individual `.planning/` files with markdown rendering — v1.0
- ✓ Delete entire `.planning/` directory with high-friction confirmation dialog — v1.0
- ✓ Delete individual phase folders/files with low-friction confirmation dialog — v1.0
- ✓ In-plugin guide page explaining the GSD workflow in simple visual terms — v1.0
- ✓ Toolbar button as entry point (consistent with Ship Studio plugin patterns) — v1.0

### Active

- [ ] Contextual next-step hints based on current project state (e.g., "Run /gsd:plan-phase 1 next")
- [ ] Phase status visualization badges (pending/in-progress/complete at a glance)
- [ ] "What's next" empty state with actionable guidance when no `.planning/` exists
- [ ] Install state persistence across sessions via plugin storage

### Out of Scope

- Other runtimes (OpenCode, Gemini CLI, Codex) — Claude Code only
- Running GSD commands from the plugin — users run those in Claude Code's terminal
- Editing `.planning/` files from the plugin — read-only view
- Creating new projects from the plugin — that's `/gsd:new-project` in Claude Code
- Auto-refresh polling for plan changes — manual refresh on modal open instead
- Embedded terminal in plugin — Ship Studio's `openTerminal()` already provides one
- Version checking / GSD update notifications — npx always fetches latest

## Context

Shipped v1.0 with 1,677 LOC TypeScript/TSX across 13 source files.
Tech stack: React + TypeScript + Vite, zero external dependencies beyond Ship Studio host.
Bundle: 41KB single-file `dist/index.js`.

Architecture: multi-file with `useGsd()` hook owning all state and shell interactions, presentational views (OverviewView, FileViewer, GuideView, InstallView, ConfirmDialog), and CSS-in-JS via style injection.

Plugin context uses dual-pattern: `__SHIPSTUDIO_PLUGIN_CONTEXT_REF__` (React Context) with fallback to `__SHIPSTUDIO_PLUGIN_CONTEXT__` (direct global).

## Constraints

- **Tech stack**: React + TypeScript + Vite (Ship Studio plugin requirements)
- **Slot**: Toolbar only
- **API**: Must use dual context pattern (React Context + global fallback)
- **Runtime**: Claude Code only
- **Read-only plans**: Plugin reads `.planning/` files but doesn't edit them
- **Bundle committed**: `dist/index.js` must be committed — Ship Studio loads it directly

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Use React Context pattern with global fallback | Starter template shows Context as current API, but direct global is needed for plugin link | ✓ Good — prevents crash on plugin link |
| Toolbar button → modal UI | Consistent with Vercel plugin pattern | ✓ Good — works well |
| openTerminal() for GSD install | Interactive installer needs user input | ✓ Good — handles prompts |
| Detect GSD via filesystem check | Check `~/.claude/get-shit-done/` existence | ✓ Good — fast and reliable |
| React aliased to data-URL re-exporting window.__SHIPSTUDIO_REACT__ | Required for hook sharing with host | ✓ Good — zero-dep bundle |
| dist/ committed to repo | Ship Studio clones repo and reads dist/index.js directly | ✓ Good — no build step needed |
| ConfirmDialog as inline view replacement (not overlay) | Prevents overflow/clipping in constrained plugin panel | ✓ Good — clean UX |
| useRef pattern for shell/actions | Keeps detect() and install() stable without stale closures | ✓ Good — no stale state bugs |
| fileReadIdRef race guard | Discards stale file read results | ✓ Good — prevents wrong content display |

---
*Last updated: 2026-02-28 after v1.0 milestone*
