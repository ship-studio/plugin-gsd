# Project Retrospective

*A living document updated after each milestone. Lessons feed forward into future planning.*

## Milestone: v1.0 — MVP

**Shipped:** 2026-02-28
**Phases:** 3 | **Plans:** 8 | **Sessions:** 1

### What Was Built
- Complete Ship Studio plugin: toolbar button, modal shell, 6-state detection chain
- One-click GSD install via interactive terminal with post-install re-detection
- Read-only dashboard with roadmap overview, accordion drill-down, markdown file viewer
- Guide tab with GSD workflow explanation and click-to-copy commands
- Safe delete flows with high/low friction confirmation dialogs
- 41KB single-file bundle with zero external dependencies

### What Worked
- Inside-out phase ordering (scaffold → dashboard → delete) meant each phase built cleanly on the last
- useGsd() hook as single state owner kept views purely presentational — easy to add new views
- Dual context pattern (React Context + global fallback) solved the plugin link crash on first attempt
- Human verification checkpoints caught real UI issues (border-radius, card styling)

### What Was Inefficient
- Phase 1 and Phase 2 were executed before verifier agents existed, leaving VERIFICATION.md gaps that complicated the audit
- EDUC-01/EDUC-02 checkboxes in REQUIREMENTS.md weren't updated when the code shipped, creating a false "Pending" signal

### Patterns Established
- `useRef` pattern for shell/actions to prevent stale closures in async callbacks
- `fileReadIdRef` race guard for discarding stale async results
- Inline view replacement (not overlay) for dialogs in constrained plugin panels
- `e.stopPropagation()` on nested interactive elements inside accordion rows

### Key Lessons
1. Run phase verification immediately after execution — retrofitting it creates documentation debt
2. The dual context pattern (`__SHIPSTUDIO_PLUGIN_CONTEXT_REF__` + `__SHIPSTUDIO_PLUGIN_CONTEXT__`) is essential for Ship Studio plugins — document this prominently
3. CSS-in-JS via style injection with STYLE_ID dedup works well for plugins that can't control the host stylesheet

### Cost Observations
- Model mix: 0% opus, 100% sonnet (executor + verifier agents)
- Sessions: 1 (entire milestone in single session)
- Notable: 8 plans across 3 phases completed in ~4 hours including human verification

---

## Cross-Milestone Trends

### Process Evolution

| Milestone | Sessions | Phases | Key Change |
|-----------|----------|--------|------------|
| v1.0 | 1 | 3 | Initial milestone — established plugin patterns |

### Cumulative Quality

| Milestone | Tests | Coverage | Zero-Dep Additions |
|-----------|-------|----------|-------------------|
| v1.0 | 0 | 0% | 13 source files |

### Top Lessons (Verified Across Milestones)

1. Run verification immediately after phase execution
2. Dual context pattern is mandatory for Ship Studio plugins
