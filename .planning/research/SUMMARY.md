# Project Research Summary

**Project:** plugin-gsd (Ship Studio GSD Plugin)
**Domain:** Ship Studio toolbar plugin — CLI management dashboard / GUI bridge for the Get Shit Done (GSD) planning workflow
**Researched:** 2026-02-28
**Confidence:** HIGH — all findings sourced from direct inspection of the local `shipstudio-plugins` monorepo reference implementations; no inference from training data

## Executive Summary

The GSD plugin is a multi-view Ship Studio toolbar plugin that bridges the CLI-based GSD planning workflow into a visual GUI. Building a Ship Studio plugin follows a precise, non-negotiable pattern: React 19 is provided by the host (`window.__SHIPSTUDIO_REACT__`), the plugin must never bundle its own copy, all filesystem access goes through `shell.exec`, and styling is done exclusively via CSS injection. The reference implementations in the monorepo (plugin-starter, plugin-figma, plugin-memberstack, plugin-vercel, plugin-ralph) provide high-confidence answers for every architectural and API question — this is not a greenfield problem with ambiguous patterns.

The recommended approach is the multi-file pattern pioneered by plugin-figma and plugin-memberstack: a thin `index.tsx` that wires together a `useGsd()` custom hook, a view-routing state machine, and four distinct view components (InstallView, OverviewView, FileViewer, GuideView). The plugin has three meaningfully distinct runtime states (GSD not installed / GSD installed but no plans / GSD installed with plans), and these must be modeled as a TypeScript discriminated union from the outset. The feature set is intentionally read-only — the plugin surfaces plan status and enables installation, but does not edit files or invoke GSD slash commands, which require Claude Code's AI context.

The critical risks are architectural: starting with a single-file monolith (modeled on the simpler Vercel plugin) will make the plugin unmaintainable before v1 ships; using boolean state instead of a discriminated union for the three-state model will require a partial rewrite; and missing cancellation guards on async `shell.exec` effects will cause stale data to surface on project switches. All three risks are fully preventable by establishing the right scaffold in Phase 1 before writing any feature logic.

---

## Key Findings

### Recommended Stack

The stack is locked by the Ship Studio plugin runtime with zero ambiguity. React 19 (host-provided via `window.__SHIPSTUDIO_REACT__`), TypeScript 5.6+, and Vite 6+ with a specific `data: URL` aliasing configuration are the only options. No runtime npm dependencies are needed — the entire plugin API (shell, storage, toast, terminal, theme, invoke) is injected by the host at runtime. The `dist/index.js` build output must be committed to the repository because Ship Studio installs plugins via `git clone` without running any build step.

**Core technologies:**
- React 19 (peer dep, not bundled): UI components and hooks — shared from host via `window.__SHIPSTUDIO_REACT__`; bundling a separate copy will break hooks
- TypeScript 5.6+: Type safety — every plugin in the monorepo uses TS; `PluginContextValue` interface inlined from plugin-starter
- Vite 6+: Build tool — the `data: URL` aliasing config for React externals is non-negotiable; use plugin-starter's `vite.config.ts` verbatim
- Ship Studio Plugin Context API (runtime, not installed): All plugin operations — `shell.exec`, `actions.openTerminal`, `actions.showToast`, `storage.read/write`, `theme` tokens

**Critical version requirements:**
- `api_version: 1` in `plugin.json` (uses `__SHIPSTUDIO_PLUGIN_CONTEXT_REF__` React Context pattern, not the legacy `__SHIPSTUDIO_PLUGIN_CONTEXT__` global)
- `min_app_version: 0.3.53`
- `required_commands: []` — no Tauri commands needed; all filesystem ops use `shell.exec`

See `.planning/research/STACK.md` for complete `plugin.json`, `vite.config.ts`, `tsconfig.json`, and full API reference.

### Expected Features

The plugin has a clear MVP backed by reference implementations. The core value proposition — making GSD accessible to CLI-averse users — is validated by the interactive install pattern used identically in plugin-vercel (for `vercel login`) and plugin-ralph (for its installer).

**Must have (table stakes) — v1:**
- Toolbar button + modal shell — established Ship Studio plugin entry point pattern
- GSD installation detection — gates all other views; determines which state the user is in
- One-click interactive install — `actions.openTerminal('npx', ['get-shit-done-cc@latest'])` mirrors Vercel plugin exactly
- Project plan detection — checks for `.planning/` directory existence
- Plan dashboard overview — phase list with statuses parsed from ROADMAP.md
- Drill-down file reading — `shell.exec('cat', [absolutePath])` for any `.planning/` file
- Delete `.planning/` with confirmation — two-step confirm; the one explicitly required destructive action
- GSD workflow guide page — in-plugin education; the key differentiator from all reference plugins
- Toast feedback, loading states, and error states — without these the plugin feels broken

**Should have (differentiators) — v1.x:**
- Contextual next-step hints — surfaces which GSD command to run based on current plan state
- Granular file/folder delete — delete individual phases without nuking entire `.planning/`
- Install state persistence — cache `gsdInstalled` in `storage` to skip redundant filesystem checks

**Defer (v2+):**
- Phase status visualization badges — depends on GSD file format stabilizing
- "What's next" empty state refinements — iterate from real user confusion patterns

**Firm anti-features (never build):**
- Editing `.planning/` files — turns a viewer into an editor; doubles scope
- Running GSD slash commands — require Claude Code AI context; not triggerable from shell
- Auto-refresh polling below 30s — unnecessary I/O drain for non-critical file changes

See `.planning/research/FEATURES.md` for the full feature dependency graph and prioritization matrix.

### Architecture Approach

The plugin follows the multi-file dashboard pattern established by plugin-figma and plugin-memberstack. A single `useGsd()` custom hook centralizes all stateful logic — filesystem detection, plan scanning, install flow, delete operations, and storage persistence. View components are "dumb" — they receive the hook's return value as a prop and render from it without making any `shell.exec` calls directly. Navigation between the four views is handled by a `currentView` string state (no React Router — there's no URL bar in a plugin modal). All CSS is injected once on mount from a `styles.ts` constant, with all class names prefixed `.gsd-` to prevent collision.

**Major components:**
1. `ToolbarButton` (in `index.tsx`) — toolbar entry point; owns `modalOpen` and `currentView` state; auto-routes based on `gsdInstalled`
2. `Modal` (in `index.tsx`) — overlay, header, nav tabs, ESC/click-away close; wraps all view components
3. `useGsd()` hook (`useGsd.ts`) — single source of truth for all GSD state: detection, planning scan, install, delete, refresh
4. `InstallView` — shown when `~/.claude/get-shit-done/` is absent; surfaces the one-click install CTA
5. `OverviewView` — dashboard of phases and statuses; contextual hints; delete triggers
6. `FileViewer` — read-only markdown display of any `.planning/` file; breadcrumb back navigation
7. `GuideView` — static GSD workflow explainer (discuss → plan → execute → verify); no API calls
8. `ConfirmDialog` — reusable two-step delete confirmation component
9. Supporting modules: `context.ts`, `types.ts`, `styles.ts`

**Data flow:** ToolbarButton mounts → `useGsd()` fires detection chain → state routes to correct view → user actions call `gsd.method()` → shell/storage APIs update state → re-render.

See `.planning/research/ARCHITECTURE.md` for full component diagrams, data flow sequences, and the build order (10-step sequence respecting component dependencies).

### Critical Pitfalls

Six critical pitfalls identified, all with clear prevention strategies:

1. **Single-file monolith** — Copying the Vercel plugin's 1,673-line `index.tsx` approach for a 4-view plugin makes it unmaintainable before launch. Prevention: establish `src/views/`, `src/components/`, `src/useGsd.ts` file structure in Phase 1 before writing any feature logic; keep `index.tsx` under 100 lines.

2. **Boolean state instead of discriminated union** — Using `gsdInstalled: boolean` collapses three meaningfully distinct states (not installed / no plans / has plans) and requires a partial rewrite when the third state surfaces. Prevention: define `PluginState` as a TypeScript discriminated union in `types.ts` before writing any component.

3. **Race conditions on async file reads** — Without a `cancelled` flag in `useEffect` cleanup, stale shell.exec results from old renders overwrite new project data on project switches. Prevention: every async effect uses `let cancelled = false` with `return () => { cancelled = true; }`.

4. **Polling without cleanup** — Copying polling code without the `clearTimeout` teardown creates a mounting leak; every plugin open/close cycle adds another polling interval. Prevention: use recursive timeout-based polling (not `setInterval`) with explicit cleanup in every `useEffect` return.

5. **Relative paths in `shell.exec`** — `.planning/PROJECT.md` without an absolute prefix silently fails when CWD is wrong. Prevention: always construct paths as `` `${project.path}/.planning/...` ``; use `sh -c 'test -d "$HOME/..."'` for home-relative checks (tilde not expanded by shell.exec directly).

6. **Fragile markdown parsing** — Single tight regex for ROADMAP.md heading extraction breaks on user-modified files (dash vs. colon separator, unicode, partial writes). Prevention: defensive parsing with fallback defaults; parse empty/partial/modified files during implementation, not after.

See `.planning/research/PITFALLS.md` for recovery strategies, the "looks done but isn't" checklist, and the pitfall-to-phase mapping.

---

## Implications for Roadmap

Based on research, the architecture's build order and the pitfall-to-phase mapping suggest a clear 3-phase structure that front-loads risk mitigation and delivers a complete, testable slice of value in each phase.

### Phase 1: Scaffold + Detection + Install

**Rationale:** The architecture research defines a 10-step build order where foundational modules (`context.ts`, `types.ts`, `styles.ts`, `useGsd.ts` detection) must exist before any view can render. Three of the six critical pitfalls are explicitly flagged for Phase 1: monolith prevention, discriminated union state model, and absolute path discipline. Establishing the right scaffold before writing any feature logic costs nothing and prevents the highest-recovery-cost failures.

**Delivers:** A working Ship Studio plugin that: detects the three distinct GSD states (not installed / no plans / has plans); routes to the correct view; and completes the one-click interactive install flow end-to-end. All infrastructure that all later phases depend on.

**Addresses (features from FEATURES.md):**
- Toolbar button + modal shell
- GSD installation detection
- One-click interactive install
- Project plan detection
- Toast feedback + loading states + error states
- "What's next" empty states for all three runtime states

**Avoids (pitfalls from PITFALLS.md):**
- Monolith: file structure established first (`views/`, `components/`, `useGsd.ts`)
- Discriminated union: `PluginState` type defined in `types.ts` before components
- Wrong CWD: all `shell.exec` calls use explicit `project.path`-based absolute paths from the first commit
- CSS collision: all classes prefixed `.gsd-` from the first CSS injection

### Phase 2: Dashboard + File Reading + Polling

**Rationale:** The feature dependency graph shows that OverviewView, FileViewer, and contextual hints all require the detection layer from Phase 1 to exist first. The two pitfalls explicitly flagged for Phase 2 (race conditions, polling cleanup) both apply to the async file-reading that powers the dashboard — they must be addressed during initial implementation, not as a cleanup pass.

**Delivers:** The full read-only dashboard: phase list from ROADMAP.md, drill-down file reading for any `.planning/` file, 30-second background refresh, and contextual hints about next GSD commands.

**Addresses (features from FEATURES.md):**
- Plan dashboard overview (phase list + statuses)
- Drill-down file reading (FileViewer)
- Contextual next-step hints (derived from STATE.md + ROADMAP.md)
- GSD workflow guide page (static, but integrated into nav)

**Implements (architecture components):**
- `OverviewView`, `FileViewer`, `GuideView`
- Extended `useGsd()` hook: `planningState`, `readFile()`, `refresh()`
- Markdown parser in `src/utils/markdown.ts` with defensive fallbacks
- Polling with timeout-based recursive pattern and cleanup

**Avoids (pitfalls from PITFALLS.md):**
- Race conditions: every async effect includes `cancelled` guard
- Polling leak: cleanup return present from first implementation
- Fragile markdown parsing: defensive extraction with fallback defaults

### Phase 3: Delete Flows + Polish + v1.x Enhancements

**Rationale:** Delete operations are the only destructive actions and must build on a stable, tested dashboard (Phase 2) — users can only delete what the dashboard has confirmed exists. The pitfall research explicitly flags delete UX as needing specific friction calibration (full `.planning/` deletion gets higher friction than single file). Polish and v1.x enhancements (install state persistence, granular delete) are non-blocking for core value validation.

**Delivers:** Complete v1 with safe destructive actions and quality polish: delete entire `.planning/` with named-path confirmation, granular phase/file delete, install state persistence, and any remaining UX refinements.

**Addresses (features from FEATURES.md):**
- Delete `.planning/` with confirmation (v1 must-have)
- Granular file/folder delete (v1.x)
- Install state persistence via `storage.write` (v1.x)

**Avoids (pitfalls from PITFALLS.md):**
- Delete UX: confirmation modal names the specific path and file count; action button is labeled "Delete" not "Confirm"
- Path safety: validate non-null `project.path` and confirm path starts with expected prefix before any `rm -rf`

### Phase Ordering Rationale

- **Dependencies first:** The architecture's build order (types → styles → hook → toolbar/modal → views → delete → storage) is the driving constraint. No view can be built correctly before the state model and context hook exist.
- **Risk front-loading:** The three highest-recovery-cost pitfalls (monolith, boolean state, wrong CWD) are all Phase 1 concerns. Addressing them in scaffold prevents cascading failures in Phases 2 and 3.
- **Value slice per phase:** Each phase delivers a complete, user-testable slice — Phase 1 validates the install flow; Phase 2 validates the dashboard value prop; Phase 3 polishes for release.
- **Feature dependencies honored:** The dependency graph (detection → dashboard → hints/delete) maps cleanly to Phases 1 → 2 → 3.

### Research Flags

Phases likely needing deeper research during planning:

- **Phase 2:** ROADMAP.md and STATE.md file format parsing — GSD's markdown format is structured but partially undocumented. The parser needs to be tested against real `.planning/` output from `get-shit-done-cc`. Recommend reading actual GSD output files before finalizing the parser implementation.
- **Phase 2:** `openTerminal()` return value semantics — HIGH confidence it exists based on plugin-vercel and plugin-ralph usage, but the exact Promise resolution behavior (exit code vs. null on user close) needs verification against the actual Ship Studio API when wiring the install post-check logic.

Phases with standard patterns (skip research-phase):

- **Phase 1:** All patterns are directly lifted from plugin-starter (exact `vite.config.ts`, `tsconfig.json`, `plugin.json`, `usePluginContext` hook). No research needed — copy and adapt.
- **Phase 3:** Delete confirmation pattern is directly established by plugin-memberstack (confirmLogout) and plugin-cloudflare (disconnect). No research needed.

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All findings sourced from plugin-starter's CLAUDE.md (authoritative), confirmed by 4 reference implementations with consistent versions. Zero inference. |
| Features | HIGH | Feature set derived from direct inspection of 5 reference plugins + explicit PROJECT.md requirements. Feature dependency graph is internally consistent. |
| Architecture | HIGH | Component structure directly mirrors plugin-figma (multi-view) and plugin-memberstack (domain hook) patterns — both working, deployed plugins. Build order derived from actual component dependency analysis. |
| Pitfalls | HIGH | Critical pitfalls all derived from real code in the monorepo (the Vercel plugin's 1,673-line monolith is the anti-pattern reference). Supplemented by well-established React useEffect cleanup patterns. |

**Overall confidence:** HIGH

### Gaps to Address

- **GSD file format specifics:** The markdown structure of ROADMAP.md, STATE.md, and phase plan files is partially documented in GSD's own CLAUDE.md but not fully specified. The parser in Phase 2 should be validated against real `get-shit-done-cc` output. Mitigation: defensive parsing with fallback defaults handles any format variation gracefully.

- **`openTerminal()` Promise resolution:** The API signature is confirmed (`Promise<number | null>`) but the exact behavior when a user closes the terminal mid-install (before completing prompts) is inferred from the Vercel plugin's post-terminal re-detection pattern. Mitigation: always re-check the filesystem after the Promise resolves regardless of exit code — this is what the Vercel plugin does and it's the correct defensive pattern.

- **CSS variable availability:** The plugin uses `var(--bg-primary)` and related Ship Studio CSS custom properties in injected styles. Confirmed by Vercel plugin usage but the full list of available variables is not formally documented. Mitigation: use the `theme` object tokens as fallback for any color that doesn't resolve via CSS variable.

---

## Sources

### Primary (HIGH confidence)

- `/Users/juliangalluzzo/Desktop/Projects/shipstudio-plugins/plugin-starter/CLAUDE.md` — Official plugin development guide; covers API, build system, constraints, patterns, styling, testing, publishing
- `/Users/juliangalluzzo/Desktop/Projects/shipstudio-plugins/plugin-starter/src/index.tsx` — Reference implementation; demonstrates all API features
- `/Users/juliangalluzzo/Desktop/Projects/shipstudio-plugins/plugin-starter/vite.config.ts` — Canonical Vite config with data: URL aliasing
- `/Users/juliangalluzzo/Desktop/Projects/shipstudio-plugins/plugin-figma/src/` — Multi-file structure pattern, view router via `currentView` state
- `/Users/juliangalluzzo/Desktop/Projects/shipstudio-plugins/plugin-memberstack/src/` — Custom domain hook pattern, multi-view structure
- `/Users/juliangalluzzo/Desktop/Projects/shipstudio-plugins/plugin-vercel/src/index.tsx` — `openTerminal()` usage, shell.exec for detection, single-file anti-pattern reference
- `/Users/juliangalluzzo/Desktop/Projects/shipstudio-plugins/plugin-ralph/src/useRalph.ts` — Multi-file filesystem reads, `openTerminal` for install flow
- `/Users/juliangalluzzo/Desktop/Projects/shipstudio-plugins/plugin-cloudflare/src/index.tsx` — Disconnect/confirm destructive action pattern

### Secondary (MEDIUM confidence)

- VS Code UX Guidelines (https://code.visualstudio.com/api/ux-guidelines/overview) — Toolbar/status/onboarding principles that transfer to Ship Studio context
- Evil Martians dev tool onboarding research — Progressive disclosure, contextual guidance patterns
- Nielsen Norman Group — Confirmation dialog UX standards (applied to delete flow design)
- React useEffect cleanup documentation — Foundation for cancellation guard and polling cleanup patterns

### Tertiary (LOW confidence — validation needed)

- `openTerminal()` Promise resolution behavior on mid-install user close — Inferred from Vercel plugin pattern; needs runtime verification

---

*Research completed: 2026-02-28*
*Ready for roadmap: yes*
