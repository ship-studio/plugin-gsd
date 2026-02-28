# Pitfalls Research

**Domain:** Ship Studio toolbar plugin — CLI management dashboard with filesystem reads
**Researched:** 2026-02-28
**Confidence:** HIGH (derived from direct inspection of the reference Vercel plugin implementation + verified React/UX patterns)

---

## Critical Pitfalls

### Pitfall 1: Single-File Monolith That Becomes Unmaintainable

**What goes wrong:**
The Vercel plugin is 1,673 lines in a single `index.tsx` file. That was manageable for a plugin with one primary workflow (deploy). The GSD plugin has significantly more surface area: installation detection, three distinct states (not installed / no project / has project), a multi-view dashboard (overview → phase list → file detail), drill-down navigation, delete flows with confirmation, and a guide page. Putting all of this in one file means every component, every CSS string, every event handler, and every state variable lives in the same scroll of code. Navigation between views is handled by conditional rendering with a flag variable, not by separating into real components. Adding a new dashboard view requires scrolling through 1,000+ lines to find the right branch of a multi-level conditional.

**Why it happens:**
The Vercel plugin works fine as a monolith because it has a single linear flow. Developers copy that pattern for GSD without recognizing that GSD's state machine is substantially more complex. The Ship Studio plugin constraint (single `index.tsx` export) leads developers to wrongly conclude they must put everything in one file — but that constraint is about the export shape, not file organization. Components can be defined in separate files and imported into `index.tsx` freely.

**How to avoid:**
Design a file structure from Phase 1, before writing logic:
```
src/
  index.tsx          # Plugin exports only — slots wiring, CSS injection
  components/
    NotInstalled.tsx  # Install CTA state
    NoProject.tsx     # No .planning/ directory state
    Dashboard.tsx     # Overview: phases, status, next action
    PhaseList.tsx     # Drill-down phase listing
    FileViewer.tsx    # Markdown file renderer
    DeleteConfirm.tsx # Confirmation modal
    GuidePage.tsx     # Workflow explainer
  hooks/
    useGsdDetection.ts  # GSD installed? project exists?
    usePlanningFiles.ts # Read .planning/ structure
  types.ts
  utils/
    markdown.ts       # Heading extraction, status parsing
```
Treat `index.tsx` as a thin shell that only exports the slot component. All real logic lives in `components/` and `hooks/`. This costs nothing — Vite bundles it into one output file.

**Warning signs:**
- Phase 1 starts with `index.tsx` growing past 300 lines before any feature is complete
- Adding a new view requires scrolling to find which `if/else` branch controls it
- Two developers cannot work on different views without merge conflicts in the same file

**Phase to address:** Phase 1 (Project scaffold). Establish file structure in the first commit before writing any feature code.

---

### Pitfall 2: Not Handling the `project.path` as the Working Directory for Shell Commands

**What goes wrong:**
`shell.exec()` in Ship Studio may not automatically use the open project's directory as its working directory. The Vercel plugin works around this by running `cat .vercel/project.json` (a relative path) which works because Vercel sets up a CWD correctly — but this is not guaranteed behavior. The GSD plugin needs to read `.planning/` files relative to the **current project root**, not the plugin's own directory or the user's home directory. If `shell.exec('cat', ['.planning/PROJECT.md'])` resolves against the wrong directory, every file read silently returns an error and the dashboard shows nothing, or worse, cached stale data.

**Why it happens:**
Developers assume the plugin context's `project.path` is automatically the working directory for all shell commands. The Vercel plugin's `cat .vercel/project.json` pattern works when CWD happens to be correct, but it fails silently when CWD is wrong. The GSD plugin reads more files, so this failure surface is much larger.

**How to avoid:**
Always construct absolute paths using `project.path` explicitly:
```typescript
const ctx = getCtx();
const projectPath = ctx.project?.path;

// BAD — relies on implicit CWD
await shell.exec('cat', ['.planning/PROJECT.md']);

// GOOD — absolute path, always correct
await shell.exec('cat', [`${projectPath}/.planning/PROJECT.md`]);
```
For GSD detection specifically, the install path is `~/.claude/get-shit-done/`. The tilde is not expanded by `shell.exec()` in all environments. Use `os.homedir()` via a node inline script, or use the `$HOME` env var expansion with `sh -c`:
```typescript
// Safe home-relative path check
await shell.exec('sh', ['-c', 'test -d "$HOME/.claude/get-shit-done"']);
```

**Warning signs:**
- File reads return empty or error on the first project load but work after a reload
- GSD detection always returns "not installed" even when it is installed
- Works fine locally but breaks when Ship Studio is opened from a different directory

**Phase to address:** Phase 1 (Detection layer). All `shell.exec()` calls must be written with explicit absolute paths from the start.

---

### Pitfall 3: Race Conditions Between Concurrent File Reads

**What goes wrong:**
The dashboard needs to read multiple `.planning/` files to build its view: `ROADMAP.md` for phase list, each phase's plan file for status, `STATE.md` for current phase, `PROJECT.md` for project name. If these reads are triggered sequentially in `useEffect` without cancellation guards, and the user switches projects or closes/reopens the panel mid-read, state updates from stale reads land on the new project's view. The symptom is Phase 1 data appearing in a Phase 3 project's dashboard after a quick switch.

**Why it happens:**
React's `useEffect` does not cancel in-flight async operations when dependencies change. Shell exec calls do not return Promises that support `.cancel()`. Without an explicit "is this effect still current?" guard, every resolved async call writes to state — even ones triggered by old renders.

**How to avoid:**
Use a cancellation flag pattern inside every `useEffect` that fires async shell reads:
```typescript
useEffect(() => {
  let cancelled = false;

  const loadPlanning = async () => {
    const result = await shell.exec('cat', [`${projectPath}/.planning/ROADMAP.md`]);
    if (cancelled) return; // Discard if project changed
    setRoadmap(result.stdout);
  };

  void loadPlanning();
  return () => { cancelled = true; };
}, [projectPath]);
```
The Vercel plugin already uses this pattern correctly in its deployment polling (`let cancelled = false`). Apply it to every file-reading effect without exception.

**Warning signs:**
- Stale data flashes briefly when switching between projects
- Dashboard shows correct data but then overwrites it with wrong data seconds later
- `console.log` in effect teardown never fires (cleanup return is missing)

**Phase to address:** Phase 2 (File reading and dashboard). Every async effect must include a cancellation guard before the first `shell.exec` call.

---

### Pitfall 4: Treating "GSD Not Installed" and "No Project" as the Same State

**What goes wrong:**
There are three distinct states a user can be in:
1. GSD is not installed (`~/.claude/get-shit-done/` does not exist)
2. GSD is installed, but the current project has no `.planning/` directory
3. GSD is installed and the current project has a `.planning/` directory

If the plugin collapses states 1 and 2 into a generic "not set up" view, or conflates them in state variables (e.g., `isSetup: boolean`), two major problems occur: (a) the wrong action is surfaced ("Install GSD" when the user needs to run `/gsd:new-project` instead), and (b) adding a third state later requires a partial rewrite of both the state model and all UI branches.

**Why it happens:**
Early prototyping rushes to a working demo. A boolean `installed` flag is simpler than a three-state enum. The distinction only becomes painful when users report "Install GSD" appearing on a project that already has GSD installed.

**How to avoid:**
Model the plugin state as an explicit discriminated union from Phase 1:
```typescript
type PluginState =
  | { phase: 'loading' }
  | { phase: 'no-project' }           // No Ship Studio project open
  | { phase: 'gsd-not-installed' }    // ~/.claude/get-shit-done/ missing
  | { phase: 'no-planning' }          // GSD installed, .planning/ missing
  | { phase: 'has-planning'; data: PlanningData }; // Full dashboard state
```
Each state renders a completely distinct component. No conditional prop drilling. Adding a new state (e.g., GSD installed but outdated version) means adding a new union member, not modifying existing branches.

**Warning signs:**
- The "Install GSD" button appears in a project that has GSD installed
- A single boolean or two booleans control three or more distinct views
- The `if/else` chain for rendering grows beyond three conditions

**Phase to address:** Phase 1 (State model design). Define the discriminated union in `types.ts` before writing any component.

---

### Pitfall 5: Polling the Filesystem Continuously Without a Cleanup Strategy

**What goes wrong:**
The dashboard reads `.planning/` files to display status. If users are actively using GSD in a terminal alongside the plugin, the files change (new phases get created, STATE.md gets updated). A naive implementation either (a) never refreshes, so the dashboard is always stale, or (b) sets up a `setInterval` that polls every N seconds but never cleans up the interval when the component unmounts. The result is a mounting leak: every time the plugin panel is opened, a new interval is started but none of the old ones are cleared. After several open/close cycles, the plugin triggers dozens of shell.exec calls per second.

**Why it happens:**
The Vercel plugin's polling pattern looks simple to copy, but its cleanup is meticulous. Developers copy the polling setup code without copying the `return () => { cancelled = true; clearTimeout(timeoutId); }` teardown. Ship Studio plugins that render into toolbar slots can mount/unmount unexpectedly during workspace switches.

**How to avoid:**
Use a timeout-based recursive poll (not `setInterval`) with proper cleanup, mirroring the Vercel plugin pattern exactly:
```typescript
useEffect(() => {
  let cancelled = false;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  const poll = async () => {
    await refreshPlanningFiles();
    if (cancelled) return;
    timeoutId = setTimeout(() => void poll(), 30_000); // 30s refresh
  };

  void poll();

  return () => {
    cancelled = true;
    if (timeoutId) clearTimeout(timeoutId);
  };
}, [projectPath]);
```
For a read-only dashboard, 30-second polling is appropriate. Do not poll on a shorter interval — file reads via `shell.exec` have overhead and GSD file changes are not time-critical.

**Warning signs:**
- CPU usage grows after opening/closing the plugin panel repeatedly
- `shell.exec` calls appear in logs at an accelerating rate
- Plugin slows down Ship Studio after extended use

**Phase to address:** Phase 2 (Dashboard). Polling must have cleanup from the first implementation. Do not add cleanup "later."

---

### Pitfall 6: Markdown Parsing Without Graceful Degradation

**What goes wrong:**
The plugin reads `ROADMAP.md`, phase plan files, and potentially `PROJECT.md` and parses them to extract structure (phase names, statuses, next steps). GSD's markdown format is structured, but it's also human-edited. Users rename headings, remove sections, use different status syntax. A parser that expects `## Phase 1: Foundation` and throws when it finds `## Phase 1 — Foundation` will render nothing. A parser that expects `Status: in_progress` and finds a blank file (mid-write) will crash.

**Why it happens:**
Dashboard plugins are built against happy-path data. The developer has a clean `.planning/` directory with well-formed files. Edge cases (missing sections, partial writes, user edits, unicode in headings) only appear in production.

**How to avoid:**
Parse defensively. Every extraction should return `null` or a default rather than throwing:
```typescript
function extractPhases(roadmapContent: string): Phase[] {
  if (!roadmapContent?.trim()) return [];

  const phases: Phase[] = [];
  const lines = roadmapContent.split('\n');

  for (const line of lines) {
    // Match both "## Phase 1: X" and "## Phase 1 — X" and "## Phase 1 - X"
    const match = line.match(/^##\s+Phase\s+(\d+)[:\s—-]+(.+)/i);
    if (!match) continue;
    phases.push({
      number: parseInt(match[1], 10),
      name: match[2].trim(),
      status: extractStatus(roadmapContent, match[1]) ?? 'unknown',
    });
  }

  return phases;
}
```
Never parse markdown with a single-pass regex that fails on minor format variation. Always test against files that are empty, partially written, and user-modified.

**Warning signs:**
- Dashboard shows correctly on the developer's machine but "Loading..." forever on user machines
- Any change to a `.planning/` file causes the dashboard to go blank
- Error boundary catches unhandled exceptions from parsing functions

**Phase to address:** Phase 2 (Dashboard parsing). Write parser tests against malformed inputs during implementation, not after.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Put everything in `index.tsx` | Faster initial prototype | Every feature addition requires navigating 1500+ lines; impossible to split later without full rewrite | Never — costs nothing to split from the start |
| Boolean `gsdInstalled` instead of discriminated union | Simpler initial state | Forces a partial rewrite when the third state is discovered; UI branches become incoherent | Never — define the union before writing any component |
| Polling without cleanup | Faster to write | Mounting leak; CPU creep; Ship Studio slowdown after extended use | Never — cleanup is 3 lines |
| Trust relative paths in `shell.exec` | Fewer characters | Silently wrong on some machines or workspace configurations | Never — always use `project.path`-based absolute paths |
| Parse markdown with a single tight regex | Works on your files | Breaks on any user variation; hard to debug because failure is silent | Never — defensive parsing costs nothing |
| No loading states between file reads | Simpler component | Dashboard flashes old data or shows blank on project switch | Only if reads are guaranteed sub-50ms (they are not) |

---

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| `shell.exec` for file reads | Reading relative paths like `.planning/PROJECT.md` assuming CWD is the project root | Always prefix with `${ctx.project.path}/` to form absolute paths |
| GSD installation detection | Using `shell.exec('which', ['gsd'])` or checking PATH — GSD installs to `~/.claude/get-shit-done/` and has no PATH binary | Check existence of `~/.claude/get-shit-done/` directory using `sh -c 'test -d "$HOME/.claude/get-shit-done"'` |
| `actions.openTerminal()` for GSD install | Assuming the terminal exit code tells you install succeeded | GSD's interactive installer requires user input (runtime choice, scope). Re-check the filesystem after the terminal closes, regardless of exit code — user may have exited early |
| CSS injection via `<style>` tag | Adding a CSS `<style>` block in JSX that re-injects on every render | Follow the Vercel plugin pattern: inject once in `useEffect(() => { ... }, [])` and remove in cleanup to avoid duplicate style blocks |
| Ship Studio `storage` API | Caching file content in storage as the source of truth | Use `storage` only for user preferences (e.g., last viewed phase). Always re-read `.planning/` files from disk — storage can be stale if files changed outside the plugin |
| Host CSS class names like `toolbar-icon-btn` | Overriding host styles with plugin-specific CSS | Always namespace plugin CSS with a unique prefix (e.g., `.gsd-`) to avoid colliding with Ship Studio's own classes or the Vercel plugin's classes |

---

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Reading all `.planning/` files on every render | UI lag every time state changes; excessive shell.exec calls | Read files in `useEffect` with proper deps, not in render functions; cache parsed results in state | Any project with more than 3 phases |
| Parsing large markdown files synchronously in render | Frame drops when the dashboard first loads | Parse in an async effect, store parsed result in state, render from state | Files larger than ~50KB (phase plans can get verbose) |
| No loading state for file reads | Content flashes between old and new on project switch | Track a `loading` boolean per data source; show skeleton/spinner | First time opening any project |
| Polling interval shorter than read duration | Multiple overlapping reads; state corruption from out-of-order resolution | Use recursive timeout-based polling (not `setInterval`); 30s is appropriate for file content | On slow systems where `shell.exec` takes >1s |

---

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Passing unsanitized file paths from storage or project names to `shell.exec` | Path traversal or command injection if project name contains special characters | Validate that all paths are within `project.path` before use; never concatenate user-provided strings into command arguments — use the `args[]` array form of `shell.exec`, not `sh -c` with string interpolation |
| Storing sensitive content from `.planning/` files in `storage` | Content persists after project deletion; potentially visible to other contexts | Only store structural metadata (phase number, last view) in `storage`, never file content |
| Deleting directories using `rm -rf` via `shell.exec` with a user-provided path | Catastrophic data loss if path is wrong (e.g., project.path is null) | Always validate path is non-null and is within `project.path` before any destructive `shell.exec` call; confirm path starts with the expected prefix |

---

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Generic "Are you sure?" delete confirmation | Users click through without reading; accidental deletion of `.planning/` means losing the entire project roadmap | Show the specific path being deleted and what it contains ("Delete .planning/ — this removes 4 phases and 23 files and cannot be undone"); use a named action button ("Delete Planning Files") not just "Confirm" |
| Same friction for deleting a single file vs. the entire `.planning/` directory | Deleting all plans feels as casual as deleting one file | Single file deletion: simple confirm modal. Entire `.planning/` directory: require typing confirmation or show a longer explanation of consequences |
| No "contextual hint" when GSD is installed but no project exists | User opens the plugin, sees a blank or confusing state, closes it, never comes back | Show a clear CTA: "You have GSD installed. To start a project plan, type `/gsd:new-project` in Claude Code's chat." Include an icon or visual that makes this feel actionable, not like an error |
| Dashboard is read-only but users try to click on things expecting navigation | Users tap phase names expecting to see details; nothing happens | Make all navigable elements visually interactive (hover state, cursor pointer, chevron icon). If something is clickable, make it obvious. If it's not, don't style it as if it is |
| Plugin shows "Loading..." indefinitely when GSD detection fails silently | Users wait forever with no feedback | All async operations must have a timeout (5s max for detection); failure state must be surfaced, not hidden behind a spinner |

---

## "Looks Done But Isn't" Checklist

- [ ] **GSD detection:** Verify the detection works on a machine where GSD was installed weeks ago AND on a fresh machine where it has never been installed. Test both `test -d` and `ls` approaches to confirm the path.
- [ ] **Project switch:** Open the plugin on Project A, then switch to Project B — verify dashboard immediately reflects Project B's `.planning/` data, not a mix or Project A's stale data.
- [ ] **No `.planning/` directory:** Open the plugin on a project with GSD installed but no `.planning/` directory — verify the "no planning files" state renders with the correct CTA, not a blank screen or an error.
- [ ] **Malformed markdown:** Rename a heading in `ROADMAP.md` to use a dash instead of a colon — verify the dashboard still renders (even if the phase is shown as "unknown") rather than going blank.
- [ ] **Delete confirmation:** Trigger the delete flow for the entire `.planning/` directory — verify the modal names the path explicitly, the action button is labeled "Delete" not "OK", and the cancel path works.
- [ ] **Install terminal flow:** Click "Install GSD", close the terminal mid-way through (before completing setup) — verify the plugin correctly detects "still not installed" and does not show a success state.
- [ ] **CSS isolation:** Verify no GSD plugin CSS classes collide with Vercel plugin CSS classes (run both plugins together and inspect computed styles).
- [ ] **Interval cleanup:** Open the plugin, close it, open it 5 more times — verify there are not 6 active polling intervals (check via `shell.exec` call frequency in logs or network inspector).

---

## Recovery Strategies

When pitfalls occur despite prevention, how to recover.

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Single-file monolith that can't be navigated | HIGH | Extract one component at a time by view (start with the simplest view); refactor in a dedicated branch; use TypeScript errors as the guide for what needs to be re-imported |
| Wrong CWD causing silent file read failures | LOW | Add explicit `project.path` prefix to all `shell.exec` file path arguments; no data model changes required |
| Race condition showing stale data | LOW | Add `cancelled` flag to each `useEffect`; takes <10 minutes per effect |
| Collapsed states (boolean instead of union) | MEDIUM | Define the discriminated union type, then refactor rendering from outside-in — start with the top-level switch, then update each branch component |
| Polling interval leak | LOW | Audit every `useEffect` that calls `setTimeout`/`setInterval`, add cleanup returns; verify with open/close cycle test |
| Markdown parser breaks on user-edited files | MEDIUM | Replace tight regex matchers with defensive fallback patterns; requires testing against a variety of real `.planning/` files |

---

## Pitfall-to-Phase Mapping

How roadmap phases should address these pitfalls.

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Single-file monolith | Phase 1 (Scaffold) | `src/` contains `components/` and `hooks/` directories; `index.tsx` is under 100 lines at scaffold |
| Wrong CWD for shell commands | Phase 1 (Detection layer) | Run detection on a project in a non-standard location; all reads use `project.path` prefix |
| Race conditions on project switch | Phase 2 (Dashboard) | Manual test: switch projects rapidly 5 times; verify correct data shown |
| Collapsed state model | Phase 1 (Types) | `types.ts` contains discriminated union before any component is written |
| Polling leak | Phase 2 (Dashboard) | Cycle open/close 5 times; verify no accelerating shell.exec calls |
| Markdown parsing failures | Phase 2 (Dashboard parsing) | Parse against: empty file, partial file, heading with dash instead of colon, unicode in heading |
| Delete UX (wrong friction level) | Phase 3 (Delete flows) | QA review of confirmation modal copy against UX checklist; modal must name the specific path |
| CSS collision with Vercel plugin | Phase 1 (Scaffold) | All CSS classes prefixed with `.gsd-`; visual test with both plugins loaded |

---

## Sources

- Direct inspection of `/Users/juliangalluzzo/Desktop/Projects/shipstudio-plugins/plugin-vercel/src/index.tsx` (1,673 lines) — HIGH confidence, primary reference implementation
- PROJECT.md context: requirements, constraints, and key decisions — HIGH confidence, authoritative
- [useEffect Cleanup: Why It Matters and Common Mistakes](https://medium.com/@kom50/useeffect-cleanup-why-it-matters-and-common-mistakes-01a0107f98ee) — MEDIUM confidence
- [Avoiding race conditions and memory leaks in React useEffect](https://www.wisdomgeek.com/development/web-development/react/avoiding-race-conditions-memory-leaks-react-useeffect/) — MEDIUM confidence
- [How to design better destructive action modals](https://uxpsychology.substack.com/p/how-to-design-better-destructive) — MEDIUM confidence
- [Confirmation Dialogs Can Prevent User Errors (If Not Overused)](https://www.nngroup.com/articles/confirmation-dialog/) — HIGH confidence (Nielsen Norman Group)
- [Tilde Expansion pitfalls in Node.js](https://github.com/nodejs/node/issues/684) — MEDIUM confidence
- [cwd issue with exec() in Node.js](https://github.com/nodejs/node-v0.x-archive/issues/7721) — MEDIUM confidence
- [Organize a Large React Application and Make It Scale](https://www.sitepoint.com/organize-large-react-application/) — MEDIUM confidence

---
*Pitfalls research for: Ship Studio toolbar plugin — GSD CLI management dashboard*
*Researched: 2026-02-28*
