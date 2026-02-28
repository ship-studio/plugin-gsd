# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-28)

**Core value:** Make GSD approachable — anyone using Ship Studio can install it, understand it, and manage their plans without ever reading a README or memorizing commands.
**Current focus:** Phase 2 — Dashboard & File Reading

## Current Position

Phase: 2 of 3 (Dashboard & File Reading) — IN PROGRESS
Plan: 2 of 3 complete
Status: Plan 02-02 complete — ready for 02-03 (GuideView + tab wiring)
Last activity: 2026-02-28 — 02-02 complete (renderMarkdown, FileViewer, file viewer CSS)

Progress: [█████░░░░░] 50% (Phase 1 complete, Phase 2 plan 2/3 done)

## Performance Metrics

**Velocity:**
- Total plans completed: 5 (Phase 1 complete + Phase 2 plans 01-02)
- Average duration: 2 min
- Total execution time: 0.1 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 1. Scaffold, Detection & Install | 3 | 5 min | 2 min |
| 2. Dashboard & File Reading | 2 (of 3) | 6 min | 3 min |

**Recent Trend:**
- Last 5 plans: 01-02 (1 min), 01-03 (2 min), 02-01 (3 min), 02-02 (3 min)
- Trend: -

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- [Init]: Use React Context pattern (not window global) — starter template is the current API
- [Init]: Toolbar button → modal/panel UI — consistent with Vercel plugin pattern
- [Init]: openTerminal() for GSD install — interactive installer needs user input
- [Init]: Detect GSD via filesystem check — check ~/.claude/get-shit-done/ existence
- [Init]: Claude Code only — Ship Studio is already a Claude Code tool
- [01-01]: React aliased to data-URL re-exporting window.__SHIPSTUDIO_REACT__ — required for hook sharing with host
- [01-01]: dist/ excluded from .gitignore — Ship Studio clones repo and reads dist/index.js directly without building
- [01-01→fix]: Context must try __SHIPSTUDIO_PLUGIN_CONTEXT_REF__ first, then fall back to __SHIPSTUDIO_PLUGIN_CONTEXT__ (direct global). React Context alone crashes the app on plugin link.
- [01-01]: PluginPhase as 6-member discriminated union — each state maps to distinct view component
- [01-02]: useRef pattern for shell/actions keeps detect() and install() stable without capturing stale context values
- [01-02]: install() re-checks filesystem after openTerminal resolves — user may close terminal before completion
- [01-02]: project===null guard before any shell.exec call — prevents runtime crash in TypeScript strict mode
- [01-03]: Fragment root in ToolbarButton avoids extra DOM wrapper around toolbar button and modal portal
- [01-03]: redetect() called on every modal open — ensures fresh detection state, small UX cost, high correctness
- [01-03]: useInjectStyles() checks STYLE_ID before inserting — idempotent CSS injection across hot reloads
- [02-01]: loadPlanning() called from detect() after setPhase('has-planning') — single async chain, independent planningLoading state
- [02-01]: fileReadIdRef race guard — increment on each readFile() call, discard results if requestId !== current
- [02-01]: parseRoadmap combines phase bullets + progress table; status derived: checked->complete, unchecked+progress->in-progress, else not-started
- [02-01]: Phase dir matching uses Math.floor(phase.number) to handle decimal phase numbers (2.1 -> dir "02-...")
- [02-02]: renderMarkdown uses while loop (not forEach/map) to allow fenced code blocks to consume multiple lines per iteration
- [02-02]: inlineMarkdown splits on /(**[^*]+**|`[^`]+`)/g to interleave bold/code with plain text nodes
- [02-02]: parseBreadcrumb finds 'phases' segment in path array then reads next segment for NN- phase number prefix

### Pending Todos

None yet.

### Blockers/Concerns

- [Research]: ROADMAP.md parsing validated against this project's own ROADMAP.md — format matched correctly
- [Research]: openTerminal() Promise resolution on mid-install user close is inferred from Vercel plugin pattern; verify behavior at runtime

## Session Continuity

Last session: 2026-02-28
Stopped at: Completed 02-02-PLAN.md — renderMarkdown, FileViewer, file viewer CSS
Resume file: None
