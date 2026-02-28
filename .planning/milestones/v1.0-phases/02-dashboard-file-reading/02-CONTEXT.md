# Phase 2: Dashboard & File Reading - Context

**Gathered:** 2026-02-28
**Status:** Ready for planning

<domain>
## Phase Boundary

Read-only dashboard for viewing .planning/ files. Users see a phase overview with statuses, drill into individual files to read their contents, and access a GSD workflow guide. No editing, no deletion (Phase 3), no running commands.

</domain>

<decisions>
## Implementation Decisions

### Phase Overview Layout
- Compact list rows, not cards or table
- Each row shows: phase name, status indicator (complete/in-progress/not started), plan count (e.g., "3/3 plans")
- Clicking a phase row expands it inline (accordion) to show the files in that phase directory
- Files listed inside the accordion are clickable to open the file viewer
- Progress bar at the top of the overview showing overall milestone progress (e.g., "Phase 1 of 3 · 33% complete")

### File Viewer
- Styled markdown rendering (parse headings, bold, lists, code blocks) — lightweight approach, no heavy library since React is aliased via data: URLs
- Full scroll for file content, no collapsible sections
- Breadcrumb path in the viewer header (e.g., "Phase 1 > 01-01-PLAN.md") with a back button
- Copy-path button that copies the file's relative path to clipboard and shows a toast confirmation

### Navigation Model
- Two tabs in the modal header: "Dashboard" and "Guide"
- Both tabs visible in ALL plugin states (installed, not installed, no project, etc.)
- Smart default tab: Dashboard if GSD is installed with planning, Guide if GSD is not installed
- When viewing a file, tabs remain visible at top — file viewer replaces the Dashboard body only
- Switching to Guide tab and back returns to overview (not to the file being viewed)

### Guide Design
- Visual step-by-step vertical flow showing the GSD lifecycle
- Brief getting-started intro at the top (2-3 sentences: what GSD is, how it works with Claude Code, where to start)
- Core loop: new-project → discuss → plan → execute → verify
- Extra utility commands section: /gsd:progress, /gsd:debug, /gsd:add-todo, etc.
- Each step shows: slash command + one-liner description
- Slash commands are click-to-copy (copies to clipboard, shows toast via showToast action)

### Claude's Discretion
- Exact markdown parser approach (regex-based, tiny library, or custom)
- Status badge styling and color choices
- Accordion animation (if any)
- Exact progress bar visual style
- Which utility commands to include in the "extras" section of the guide
- Empty/loading states within the dashboard

</decisions>

<specifics>
## Specific Ideas

- Smart tab default creates a natural onboarding: first-time users land on Guide, returning users land on Dashboard
- Accordion expansion keeps users in context — no full-page navigation for the phase list
- Copy-path is a bridge to Claude Code: user sees a file path, copies it, pastes into Claude Code conversation

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `useGsd()` hook (src/useGsd.ts): Detection chain, shell.exec pattern, loading/error state management — will need extending with planning data and file reading
- `UseGsdReturn` interface (src/types.ts): Currently returns phase/loading/error/install/redetect — Phase 2 extends this with planning data
- `PluginPhase` discriminated union (src/types.ts): 'has-planning' is the entry point for the dashboard
- CSS classes in src/styles.ts: `.gsd-btn`, `.gsd-modal`, `.gsd-modal-header`, `.gsd-modal-body` — reuse for consistent styling
- Theme CSS variables via `PluginContextValue.theme`: `--bg-primary`, `--text-secondary`, `--border`, `--action`, etc.
- `shell.exec()` from context: Used for file reading via `cat` or similar commands
- `actions.showToast()`: For copy-to-clipboard feedback

### Established Patterns
- Views are purely presentational — receive data from useGsd() hook, never call shell.exec directly
- Inline styles using CSS variables (e.g., `color: 'var(--text-secondary)'`)
- Modal overlay with click-outside-to-close and Escape key handler
- Shell commands use `bash -c` with `$HOME` expansion and absolute paths from `project.path`
- Modal redetects on open (`useEffect` triggered by `modalOpen` state)

### Integration Points
- The `has-planning` case in index.tsx switch — currently a placeholder, will become the OverviewView
- Modal header (`.gsd-modal-header`) — needs tab UI added
- `useGsd()` return type — needs planning data (phases, file contents) and navigation state
- All other PluginPhase cases (loading, no-project, gsd-not-installed, no-planning, error) continue to render in the Dashboard tab

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 02-dashboard-file-reading*
*Context gathered: 2026-02-28*
