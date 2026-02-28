---
phase: 01-scaffold-detection-install
plan: 01
subsystem: infra
tags: [vite, typescript, react, plugin]

# Dependency graph
requires: []
provides:
  - Vite build configuration with data-URL React aliasing for host-provided window.__SHIPSTUDIO_REACT__
  - TypeScript project config targeting ES2020 with react-jsx
  - Ship Studio plugin manifest (id gsd, api_version 1, slots toolbar)
  - PluginPhase discriminated union (6 states) and PluginContextValue + UseGsdReturn interfaces
  - usePluginContext() hook reading __SHIPSTUDIO_PLUGIN_CONTEXT_REF__ with six convenience hooks
  - PLUGIN_CSS constants with gsd- namespaced CSS classes
  - npm devDependencies installed (vite, typescript, @types/react)
affects:
  - 01-02-PLAN.md
  - 01-03-PLAN.md

# Tech tracking
tech-stack:
  added: [vite@6, typescript@5.6, "@types/react@19"]
  patterns:
    - "Data-URL React aliasing: externalize React and map to window.__SHIPSTUDIO_REACT__ via data: URLs in Vite rollupOptions.output.paths"
    - "api_version 1 context: use __SHIPSTUDIO_PLUGIN_CONTEXT_REF__ React context ref, NOT deprecated __SHIPSTUDIO_PLUGIN_CONTEXT__"
    - "CSS namespace: all classes prefixed gsd- to prevent collisions with other plugins"
    - "dist/ must not be in .gitignore — Ship Studio clones repos and does not build"

key-files:
  created:
    - package.json
    - vite.config.ts
    - tsconfig.json
    - plugin.json
    - .gitignore
    - src/types.ts
    - src/context.ts
    - src/styles.ts
  modified: []

key-decisions:
  - "React aliased to data-URL that re-exports from window.__SHIPSTUDIO_REACT__ — required for hook sharing with Ship Studio host"
  - "dist/ excluded from .gitignore — Ship Studio clones repo and reads dist/index.js directly without building"
  - "api_version 1 context pattern: __SHIPSTUDIO_PLUGIN_CONTEXT_REF__ React context ref (not window global)"
  - "PluginPhase as 6-member discriminated union not booleans — each state maps to a distinct view component"

patterns-established:
  - "Data-URL aliasing pattern: all React imports route through window.__SHIPSTUDIO_REACT__ globals"
  - "Convenience hooks: useShell(), useToast(), useProject(), useAppActions(), useTheme(), usePluginStorage() wrap usePluginContext()"
  - "CSS variables: use var(--bg-primary), var(--border), var(--action), etc. for theme-aware styling"

requirements-completed: [INST-01, INST-07]

# Metrics
duration: 2min
completed: 2026-02-28
---

# Phase 1 Plan 01: Project Scaffold Summary

**Vite + TypeScript plugin scaffold with data-URL React aliasing, Ship Studio api_version 1 context pattern, and 6-state PluginPhase discriminated union type system**

## Performance

- **Duration:** 2 min
- **Started:** 2026-02-28T14:48:13Z
- **Completed:** 2026-02-28T14:50:00Z
- **Tasks:** 2
- **Files modified:** 8

## Accomplishments

- Created complete project infrastructure from scratch (package.json, vite.config.ts, tsconfig.json, plugin.json, .gitignore)
- Created three shared source files (src/types.ts, src/context.ts, src/styles.ts) providing the full type system, context hooks, and CSS constants
- npm install completed successfully (67 packages: vite 6, typescript 5.6, @types/react 19)

## Task Commits

Each task was committed atomically:

1. **Task 1: Create project configuration files** - `e519236` (chore)
2. **Task 2: Create shared source files and install dependencies** - `92d3843` (feat)

## Files Created/Modified

- `package.json` - Project manifest: vite/typescript/@types/react devDeps, react peerDep, build/dev scripts
- `vite.config.ts` - Vite lib build with data-URL React externalization pointing to window.__SHIPSTUDIO_REACT__
- `tsconfig.json` - TypeScript config: ES2020 target, ESNext module, bundler resolution, react-jsx
- `plugin.json` - Ship Studio plugin manifest: id gsd, api_version 1, slots toolbar
- `.gitignore` - Excludes node_modules/ and .DS_Store but NOT dist/ (required by Ship Studio)
- `src/types.ts` - PluginPhase (6-member union), PluginContextValue (full interface), UseGsdReturn
- `src/context.ts` - usePluginContext() via __SHIPSTUDIO_PLUGIN_CONTEXT_REF__, six convenience hooks
- `src/styles.ts` - STYLE_ID constant and PLUGIN_CSS with gsd- prefixed class names

## Decisions Made

- React externalized via data-URL aliasing to `window.__SHIPSTUDIO_REACT__` — required so plugin hooks share the same React instance as the Ship Studio host, preventing the "multiple React instances" hook violation
- `dist/` is NOT in .gitignore — Ship Studio clones repos and reads `dist/index.js` directly without running npm install or npm run build; omitting dist from gitignore means the built output must be committed
- Context access uses `__SHIPSTUDIO_PLUGIN_CONTEXT_REF__` (api_version 1 pattern) — NOT the deprecated `__SHIPSTUDIO_PLUGIN_CONTEXT__` window global from api_version 0
- PluginPhase defined as a 6-member discriminated union string type, not booleans — each state renders a completely different view component

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- All 8 scaffold files in place; npm install complete with 67 packages
- Plan 02 (useGsd.ts hook) can import from src/types.ts and src/context.ts immediately
- Plan 03 (index.tsx + views) can use PLUGIN_CSS from src/styles.ts and all type definitions
- No blockers for Phase 1 continuation

---
*Phase: 01-scaffold-detection-install*
*Completed: 2026-02-28*
