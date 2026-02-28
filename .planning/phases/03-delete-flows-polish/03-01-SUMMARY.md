---
phase: 03-delete-flows-polish
plan: 01
subsystem: ui
tags: [react, typescript, css, delete, confirmation-dialog]

# Dependency graph
requires:
  - phase: 02-dashboard-file-reading
    provides: useGsd hook, UseGsdReturn type, ref-stabilization pattern, loadPlanning/detect chain

provides:
  - deleteDirectory action in useGsd (rm -rf .planning/, calls detect() to transition phase)
  - deleteItem action in useGsd (validates .planning/ prefix, rm -rf item, calls loadPlanning())
  - ConfirmDialog component with high/low friction variants
  - CSS classes: gsd-delete-btn, gsd-confirm-dialog, gsd-btn-danger, gsd-delete-all-section

affects: [03-02-wire-delete-buttons, any future plan reading UseGsdReturn interface]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "deleteDirectory uses detect() for post-delete refresh (full phase transition)"
    - "deleteItem uses loadPlanning() for post-delete refresh (dashboard refresh only)"
    - "Path validation: relativePath must start with .planning/ before any rm -rf call"
    - "ConfirmDialog friction prop: high=directory deletion, low=single item deletion"

key-files:
  created:
    - src/views/ConfirmDialog.tsx
  modified:
    - src/types.ts
    - src/useGsd.ts
    - src/styles.ts

key-decisions:
  - "deleteDirectory calls detect() after deletion — triggers full phase transition to no-planning"
  - "deleteItem calls loadPlanning() after deletion — refreshes dashboard without phase transition overhead"
  - "deleteItem validates .planning/ prefix before exec — prevents path traversal or unintended rm -rf"
  - "ConfirmDialog Cancel button appears first (leftmost = safer default), Delete is rightmost"
  - "High-friction variant warns about losing all phases/plans/research/context — extra discoverability"

patterns-established:
  - "All rm -rf calls double-quote the full path to handle spaces in project.path"
  - "Post-delete refresh: full dir -> detect(), individual item -> loadPlanning()"
  - "useCallback deps: deleteDirectory depends on [project, detect], deleteItem on [project, loadPlanning]"

requirements-completed: [MGMT-01, MGMT-02, MGMT-03]

# Metrics
duration: 2min
completed: 2026-02-28
---

# Phase 3 Plan 01: Delete Action Infrastructure Summary

**Type-safe delete infrastructure: deleteDirectory/deleteItem hook actions with path validation, and ConfirmDialog component with high/low friction variants**

## Performance

- **Duration:** 2 min
- **Started:** 2026-02-28T17:38:16Z
- **Completed:** 2026-02-28T17:40:16Z
- **Tasks:** 2
- **Files modified:** 4 (3 modified, 1 created)

## Accomplishments
- Extended UseGsdReturn interface with deleteDirectory and deleteItem typed action functions
- Implemented both delete actions in useGsd with proper guards, path validation, toast notifications, and correct post-delete refresh (detect vs loadPlanning)
- Created ConfirmDialog.tsx with friction prop controlling two safety-appropriate UI variants
- Appended all required CSS classes to styles.ts maintaining gsd- namespace convention

## Task Commits

Each task was committed atomically:

1. **Task 1: Add delete actions to types, hook, and styles** - `55a6884` (feat)
2. **Task 2: Create ConfirmDialog component** - `81b9ca1` (feat)
3. **Dist rebuild** - `92e9710` (chore)

## Files Created/Modified
- `src/types.ts` - Added deleteDirectory and deleteItem to UseGsdReturn interface
- `src/useGsd.ts` - Added deleteDirectory and deleteItem useCallback implementations, added to return object
- `src/styles.ts` - Appended gsd-delete-btn, gsd-confirm-dialog, gsd-confirm-title, gsd-confirm-body, gsd-confirm-actions, gsd-btn-danger, gsd-delete-all-section CSS classes
- `src/views/ConfirmDialog.tsx` - New reusable confirmation component with friction prop

## Decisions Made
- `deleteDirectory` calls `detect()` post-delete (not `loadPlanning()`) — because the entire .planning/ directory is gone, the phase must transition from has-planning to no-planning
- `deleteItem` calls `loadPlanning()` post-delete (not `detect()`) — refreshes dashboard state without the overhead of a full detection chain
- Path validation in `deleteItem` requires `.planning/` prefix — prevents accidental rm -rf outside the planning directory
- Cancel button placed before Delete in DOM order — leftmost is the safer default action

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All delete infrastructure is in place and ready for wiring in Plan 03-02
- ConfirmDialog can be imported and placed inside any view with a confirmState pattern
- CSS classes are live in the injected stylesheet
- TypeScript compiles clean, dist rebuilt

---
*Phase: 03-delete-flows-polish*
*Completed: 2026-02-28*
