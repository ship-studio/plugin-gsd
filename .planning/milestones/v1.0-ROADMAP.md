# Roadmap: GSD Plugin for Ship Studio

## Overview

Three phases that build from the inside out: first the scaffolding and install flow that makes the plugin real, then the read-only dashboard that delivers its core value, then the destructive delete actions that give users full control. Each phase delivers a complete, user-testable slice of the final product.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Scaffold, Detection & Install** - Working plugin that detects GSD state and completes the install flow end-to-end
- [x] **Phase 2: Dashboard & File Reading** - Full read-only plan viewer with phase overview, file drill-down, and workflow guide
- [x] **Phase 3: Delete Flows & Polish** - Safe destructive actions with confirmation dialogs and all v1 quality requirements (completed 2026-02-28)

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
**Plans:** 3/3 plans complete

Plans:
- [x] 01-01-PLAN.md -- Project scaffold: package.json, vite.config.ts, tsconfig.json, plugin.json, types.ts, context.ts, styles.ts
- [x] 01-02-PLAN.md -- Core hook and detection: useGsd() with detection chain, install action, loading/error state
- [x] 01-03-PLAN.md -- Toolbar button, modal, install view: entry point, modal shell, InstallView, NoProjectView, build dist/index.js

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
**Plans:** 3 plans

Plans:
- [x] 02-01-PLAN.md -- Types, parseRoadmap utility, useGsd planning extension, OverviewView with accordion and progress bar
- [x] 02-02-PLAN.md -- Lightweight markdown renderer, FileViewer with breadcrumb navigation and copy-path
- [x] 02-03-PLAN.md -- GuideView with click-to-copy commands, tab navigation, final wiring, build dist/index.js, human-verify

### Phase 3: Delete Flows & Polish
**Goal**: Users can safely delete their entire .planning/ directory or individual phase files, with confirmation dialogs that prevent accidental data loss
**Depends on**: Phase 2
**Requirements**: MGMT-01, MGMT-02, MGMT-03
**Success Criteria** (what must be TRUE):
  1. Clicking delete on the entire .planning/ directory shows a high-friction confirmation dialog naming the directory and warning about permanent data loss
  2. Clicking delete on an individual file or phase folder shows a lower-friction confirmation dialog naming the specific path being deleted
  3. After any deletion, the dashboard refreshes and shows the updated state with a toast notification confirming what was deleted
  4. A deleted .planning/ directory returns the plugin to the "no plans" state rather than an error state
**Plans:** 2/2 plans complete

Plans:
- [ ] 03-01-PLAN.md -- Delete actions in types/hook, ConfirmDialog component, CSS classes for delete UI
- [ ] 03-02-PLAN.md -- Wire delete buttons and ConfirmDialog into OverviewView, build dist/index.js, human-verify

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Scaffold, Detection & Install | 3/3 | Complete | 2026-02-28 |
| 2. Dashboard & File Reading | 3/3 | Complete | 2026-02-28 |
| 3. Delete Flows & Polish | 2/2 | Complete   | 2026-02-28 |
