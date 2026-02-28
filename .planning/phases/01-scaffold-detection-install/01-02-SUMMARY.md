---
phase: 01-scaffold-detection-install
plan: 02
subsystem: ui
tags: [react, typescript, hooks, shell-exec, plugin]

# Dependency graph
requires:
  - phase: 01-scaffold-detection-install
    plan: 01
    provides: "PluginPhase union, UseGsdReturn interface, useShell/useProject/useAppActions convenience hooks from context.ts"
provides:
  - "useGsd() hook encapsulating all GSD detection logic and install action"
  - "Sequential detection chain: project null guard -> GSD install check -> .planning/ presence"
  - "install() action opening interactive terminal and re-verifying filesystem outcome"
  - "Stable useCallback identity via useRef pattern for shell and actions"
affects:
  - 01-03-PLAN.md

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "useRef stability pattern: store unstable context values in refs so useCallback deps stay minimal but closures always read current values"
    - "Sequential detection chain: each check gates the next, returns early on failure, sets appropriate PluginPhase"
    - "Post-install filesystem re-check: never assume terminal success; re-verify with shell.exec after openTerminal resolves"
    - "bash -c with $HOME: tilde does NOT expand in direct shell.exec args, must route through bash -c"
    - "Absolute path via project.path: CWD is not guaranteed, always construct paths from project.path for .planning/ checks"

key-files:
  created:
    - src/useGsd.ts
  modified: []

key-decisions:
  - "useRef pattern for shell/actions refs keeps detect() and install() stable without including context objects in useCallback deps"
  - "project===null checked before any shell.exec call — TypeScript strict mode catches this but runtime crash is the real risk"
  - "install() re-checks filesystem after openTerminal resolves — user may close terminal early (returns null), so success cannot be assumed"
  - "Cancellation flag declared in useEffect for Phase 2 readiness — Phase 1 detect() has no intermediate state updates that race"

patterns-established:
  - "Ref-stabilization pattern: shellRef.current = shell and actionsRef.current = actions on every render, accessed inside useCallback"
  - "Loading wraps async operations with setLoading(true) before and setLoading(false) in finally block"
  - "Error catch sets error state string and sets phase to 'error' — never swallowed silently"

requirements-completed: [INST-02, INST-04, INST-06]

# Metrics
duration: 1min
completed: 2026-02-28
---

# Phase 1 Plan 02: useGsd() Hook Summary

**useGsd() React hook with 3-step detection chain (project null guard, bash -c \$HOME GSD check, absolute-path .planning/ check) and openTerminal-based install action with post-install filesystem re-verification**

## Performance

- **Duration:** 1 min
- **Started:** 2026-02-28T14:52:19Z
- **Completed:** 2026-02-28T14:53:18Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments

- Created src/useGsd.ts (142 lines) exporting useGsd() with the full detection chain and install action
- TypeScript strict-mode type check passes with zero errors
- All 5 plan truths verified: bash -c \$HOME, absolute project.path, loading state wrapping, project null guard, re-detect after install

## Task Commits

Each task was committed atomically:

1. **Task 1: Create useGsd() hook with detection chain and install action** - `ec92f8e` (feat)

## Files Created/Modified

- `src/useGsd.ts` - useGsd() hook: detection chain, install action, loading/error state, useRef stability pattern

## Decisions Made

- Used the `useRef` ref-stabilization pattern (from plugin-ralph conventions) to keep `detect` and `install` stable without capturing stale shell/actions values
- `install()` always re-checks the filesystem after `openTerminal` resolves because the terminal's Promise resolves whether the user finishes installation or closes the window early
- Cancellation flag is declared in the useEffect cleanup but not checked inside `detect()` in Phase 1 — it is positioned for Phase 2 where intermediate async awaits between state updates make stale-state races possible

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- src/useGsd.ts is ready for import by Plan 03 (index.tsx + view components)
- Plan 03 ToolbarButton and view components will consume useGsd() return value directly without making any shell calls
- No blockers for Plan 03 continuation

---
*Phase: 01-scaffold-detection-install*
*Completed: 2026-02-28*
