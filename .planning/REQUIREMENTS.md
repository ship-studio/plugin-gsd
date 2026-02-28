# Requirements: GSD Plugin for Ship Studio

**Defined:** 2026-02-28
**Core Value:** Make GSD approachable — anyone using Ship Studio can install it, understand it, and manage their plans without ever reading a README or memorizing commands.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Installation & Detection

- [ ] **INST-01**: User sees a GSD toolbar button consistent with Ship Studio conventions
- [ ] **INST-02**: Plugin detects whether GSD is installed by checking `~/.claude/get-shit-done/` existence
- [ ] **INST-03**: User can install GSD via one-click button that opens interactive terminal running `npx get-shit-done-cc@latest`
- [ ] **INST-04**: Plugin detects whether current project has a `.planning/` directory
- [ ] **INST-05**: User sees toast notifications for install success/failure and all significant actions
- [ ] **INST-06**: User sees loading states during shell command execution
- [ ] **INST-07**: Plugin shows distinct error states for not-installed, no-project, and file-read failures

### Plan Dashboard

- [ ] **DASH-01**: User sees an overview of roadmap phases with their names and statuses
- [ ] **DASH-02**: User can click a phase or file to read its full contents in a scrollable panel
- [ ] **DASH-03**: Dashboard refreshes plan data when the modal is opened

### Plan Management

- [ ] **MGMT-01**: User can delete the entire `.planning/` directory with a confirmation dialog
- [ ] **MGMT-02**: User can delete individual phase folders or files with a confirmation dialog that names the specific path
- [ ] **MGMT-03**: Delete confirmation uses distinct friction levels — full delete requires more confirmation than single file

### Education

- [ ] **EDUC-01**: User can view a guide page explaining the GSD workflow (discuss → plan → execute → verify) in simple visual terms
- [ ] **EDUC-02**: Guide page is accessible regardless of GSD install state (always available as a view/tab)

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Dashboard Enhancements

- **DASH-04**: Contextual next-step hints based on current project state (e.g., "Run /gsd:plan-phase 1 next")
- **DASH-05**: Phase status visualization badges (pending/in-progress/complete at a glance)
- **DASH-06**: "What's next" empty state with actionable guidance when no `.planning/` exists

### Performance

- **PERF-01**: Install state persistence across sessions via plugin storage (skip repeated filesystem checks)

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Other runtimes (OpenCode, Gemini CLI, Codex) | Ship Studio is a Claude Code tool — zero current users on other runtimes |
| Running GSD slash commands from the plugin | Slash commands require Claude Code's full AI session — cannot be triggered from shell exec |
| Editing `.planning/` files from the plugin | Turns read-only viewer into full editor; GSD files are meant to be edited by the AI |
| Creating new projects from the plugin | `/gsd:new-project` requires the AI session; plugin shows a hint instead |
| Auto-refresh polling for plan changes | Constant shell.exec polling creates unnecessary I/O; manual refresh on modal open instead |
| Embedded terminal in plugin | Ship Studio's `openTerminal()` already provides a real interactive terminal |
| Version checking / GSD update notifications | GSD installs via npx which always fetches latest; no persistent version to compare |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| INST-01 | Phase 1 | Pending |
| INST-02 | Phase 1 | Pending |
| INST-03 | Phase 1 | Pending |
| INST-04 | Phase 1 | Pending |
| INST-05 | Phase 1 | Pending |
| INST-06 | Phase 1 | Pending |
| INST-07 | Phase 1 | Pending |
| DASH-01 | Phase 2 | Pending |
| DASH-02 | Phase 2 | Pending |
| DASH-03 | Phase 2 | Pending |
| EDUC-01 | Phase 2 | Pending |
| EDUC-02 | Phase 2 | Pending |
| MGMT-01 | Phase 3 | Pending |
| MGMT-02 | Phase 3 | Pending |
| MGMT-03 | Phase 3 | Pending |

**Coverage:**
- v1 requirements: 15 total
- Mapped to phases: 15
- Unmapped: 0

---
*Requirements defined: 2026-02-28*
*Last updated: 2026-02-28 after roadmap creation*
