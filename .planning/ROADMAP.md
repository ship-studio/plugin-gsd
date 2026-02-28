# Roadmap: GSD Plugin for Ship Studio

## Overview

Three phases that build from the inside out: first the scaffolding and install flow that makes the plugin real, then the read-only dashboard that delivers its core value, then the destructive delete actions that give users full control. Each phase delivers a complete, user-testable slice of the final product.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Scaffold, Detection & Install** - Working plugin that detects GSD state and completes the install flow end-to-end
- [ ] **Phase 2: Dashboard & File Reading** - Full read-only plan viewer with phase overview, file drill-down, and workflow guide
- [ ] **Phase 3: Delete Flows & Polish** - Safe destructive actions with confirmation dialogs and all v1 quality requirements

## Phase Details

### Phase 1: Scaffold, Detection & Install
**Goal**: Users can open the plugin, see their GSD installation status, and install GSD via one-click interactive terminal — all from within Ship Studio
**Depends on**: Nothing (first phase)
**Requirements**: INST-01, INST-02, INST-03, INST-04, INST-05, INST-06, INST-07
**Success Criteria** (what must be TRUE):
  1. A GSD toolbar button appears in Ship Studio consistent with other plugin buttons
  2. Opening the plugin shows a distinct view for each of three states: GSD not installed, GSD installed but no .planning/ directory, and GSD installed with plans
  3. Clicking install opens an interactive terminal running `npx get-shit-done-cc@latest` with the user able to complete all prompts
  4. After the terminal closes, the plugin re-checks state and updates its view accordingly with a toast notification
  5. Shell command execution shows a loading indicator and file-read failures show a distinct error state with a message
**Plans:** 3 plans

Plans:
- [ ] 01-01-PLAN.md -- Project scaffold: package.json, vite.config.ts, tsconfig.json, plugin.json, types.ts, context.ts, styles.ts
- [ ] 01-02-PLAN.md -- Core hook and detection: useGsd() with detection chain, install action, loading/error state
- [ ] 01-03-PLAN.md -- Toolbar button, modal, install view: entry point, modal shell, InstallView, NoProjectView, build dist/index.js

### Phase 2: Dashboard & File Reading
**Goal**: Users can see an overview of their project's roadmap phases and read any .planning/ file in a drill-down panel, and learn the GSD workflow from a built-in guide
**Depends on**: Phase 1
**Requirements**: DASH-01, DASH-02, DASH-03, EDUC-01, EDUC-02
**Success Criteria** (what must be TRUE):
  1. Opening the plugin on a project with plans shows a dashboard listing roadmap phases with their names and statuses
  2. Clicking any phase or file in the dashboard opens a full-content panel displaying that file's contents
  3. The file panel has a back button that returns the user to the dashboard overview
  4. Opening the plugin modal refreshes plan data so changes made in Claude Code are reflected without restarting Ship Studio
  5. A guide tab is accessible from any state (installed or not) and displays the GSD workflow steps in visual terms
**Plans**: TBD

Plans:
- [ ] 02-01: ROADMAP.md parser and OverviewView — defensive markdown parsing, phase list display
- [ ] 02-02: FileViewer — shell.exec-based file reading, breadcrumb navigation, race condition guards
- [ ] 02-03: GuideView and navigation — static workflow explainer, tab routing, modal refresh on open

### Phase 3: Delete Flows & Polish
**Goal**: Users can safely delete their entire .planning/ directory or individual phase files, with confirmation dialogs that prevent accidental data loss
**Depends on**: Phase 2
**Requirements**: MGMT-01, MGMT-02, MGMT-03
**Success Criteria** (what must be TRUE):
  1. Clicking delete on the entire .planning/ directory shows a high-friction confirmation dialog naming the directory and warning about permanent data loss
  2. Clicking delete on an individual file or phase folder shows a lower-friction confirmation dialog naming the specific path being deleted
  3. After any deletion, the dashboard refreshes and shows the updated state with a toast notification confirming what was deleted
  4. A deleted .planning/ directory returns the plugin to the "no plans" state rather than an error state
**Plans**: TBD

Plans:
- [ ] 03-01: ConfirmDialog component and delete orchestration — reusable confirmation modal, friction-level variants
- [ ] 03-02: Full-directory delete and individual delete — rm -rf with path validation, post-delete state refresh

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Scaffold, Detection & Install | 0/3 | Not started | - |
| 2. Dashboard & File Reading | 0/3 | Not started | - |
| 3. Delete Flows & Polish | 0/2 | Not started | - |
