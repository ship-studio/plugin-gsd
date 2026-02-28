---
phase: 02-dashboard-file-reading
plan: 03
subsystem: ui
tags: [react, typescript, tabs, guide, jsx-runtime]

# Dependency graph
requires:
  - phase: 02-dashboard-file-reading
    provides: OverviewView, FileViewer, UseGsdReturn
  - phase: 01-scaffold-detection-install
    provides: Modal shell, toolbar button, CSS injection
provides:
  - GuideView component: static GSD workflow guide with click-to-copy slash commands
  - Tab navigation (Dashboard/Guide) in modal header with smart defaults
  - Correct JSX runtime shim bridging automatic runtime to createElement
  - Polished CSS: subtle badges, contained hover, segmented tab control
affects:
  - 03-01-PLAN.md (delete flows will add to Dashboard tab content)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - JSX runtime shim: destructure children from props, route key to createElement correctly
    - Segmented tab control via CSS (bg-tertiary container, bg-secondary active fill)
    - color-mix() for subtle tinted badge backgrounds
    - All view components purely presentational: CSS classes only, no inline styles

key-files:
  created:
    - src/views/GuideView.tsx
  modified:
    - src/index.tsx
    - src/styles.ts
    - src/views/OverviewView.tsx
    - vite.config.ts
    - dist/index.js

key-decisions:
  - "JSX runtime shim must destructure {children, ...rest} from props and pass key as rest.key — createElement treats 3rd arg as child, not key"
  - "Status badges use color-mix(in srgb, var(--success) 15%, transparent) for subtle tinted backgrounds instead of solid fills"
  - "Phase row hover uses simple background change, no negative margin trick (was breaking out of container)"
  - "Tabs styled as segmented control (pill container) instead of underline tabs"
  - "Phase rows show name only (dropped 'Phase N:' prefix) — number is implicit from list position"

patterns-established:
  - "JSX runtime bridge pattern: function jsx(t,p,k){const{children:c,...r}=p;if(k!==undefined)r.key=k;return c!==undefined?Array.isArray(c)?R.createElement(t,r,...c):R.createElement(t,r,c):R.createElement(t,r)}"

requirements-completed: [EDUC-01, EDUC-02]

# Metrics
duration: multi-session (original tasks + bug fixes across 2 sessions)
completed: 2026-02-28
---

# Phase 2 Plan 03: GuideView, Tab Navigation & Bug Fixes Summary

**GuideView component with click-to-copy commands, tab navigation with smart defaults, JSX runtime shim fix, and CSS polish**

## Performance

- **Duration:** Multi-session (tasks 1-2 executed first, task 3 human-verify found bugs, bugs fixed in subsequent session)
- **Tasks:** 3 (2 auto + 1 human-verify)
- **Files modified:** 6

## Accomplishments
- Created GuideView with 5-step core workflow loop and utility commands section, all click-to-copy via navigator.clipboard with toast feedback
- Restructured index.tsx with Dashboard/Guide tab navigation, smart default tab (Guide if GSD not installed, Dashboard otherwise), clearFileView on tab switch
- Fixed critical JSX runtime shim bug: automatic JSX runtime passes `key` as 3rd arg to jsx/jsxs, but createElement treats 3rd arg as a child — shim now destructures children from props and routes key correctly
- Polished CSS: subtle tinted status badges (color-mix), contained hover state (no negative margin breakout), segmented tab control, all inline styles moved to CSS classes

## Task Commits

1. **Task 1: GuideView component** - `4581a3d` (feat)
2. **Task 2: Tab navigation and view wiring** - `e447a3b` (feat)
3. **Bug fixes from human verify** - `cece35b`, `2b70bee`, `f6d7dea` (fix)

## Files Created/Modified
- `src/views/GuideView.tsx` - Static GSD workflow guide, click-to-copy slash commands, no shell access
- `src/index.tsx` - Tab navigation, smart default, Dashboard/Guide routing, FileViewer integration
- `src/styles.ts` - Tabs, guide, badge, hover CSS; segmented control pattern
- `src/views/OverviewView.tsx` - Moved all inline styles to CSS classes, removed "Phase N:" prefix
- `vite.config.ts` - Correct JSX runtime shim that bridges automatic runtime to createElement
- `dist/index.js` - Rebuilt with all fixes

## Decisions Made
- JSX runtime shim must destructure children from props and set key separately — this is the fundamental incompatibility between automatic JSX runtime and createElement
- Status badges use color-mix for 15% opacity tinted backgrounds — subtle and readable in both light/dark themes
- Phase row hover contained within bounds (no negative margin trick)
- Segmented tab control instead of underline tabs

## Deviations from Plan
- Plan specified underline-style tabs; changed to segmented control after user feedback ("tabs look bad")
- Plan specified "Phase N: Name" in rows; simplified to just name after user feedback
- JSX runtime shim bug was not anticipated — required fundamental fix to vite.config.ts data URL

## Issues Encountered
- JSX runtime shim mapped jsx/jsxs directly to createElement, causing keyed elements to render only their key value as content. Root cause: createElement(type, props, ...children) treats 3rd arg as child, while jsx(type, props, key) treats it as key.
- Phase row hover with negative margin broke out of modal container bounds.

## Next Phase Readiness
- Phase 2 is complete — all views wired, all bugs fixed, human verified
- Phase 3 (Delete Flows) can proceed: add ConfirmDialog component and delete actions to the Dashboard tab

---
*Phase: 02-dashboard-file-reading*
*Completed: 2026-02-28*
