# Phase 2: Dashboard & File Reading - Research

**Researched:** 2026-02-28
**Domain:** React plugin UI — markdown parsing, accordion state, tab routing, file reading via shell.exec
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Phase Overview Layout**
- Compact list rows, not cards or table
- Each row shows: phase name, status indicator (complete/in-progress/not started), plan count (e.g., "3/3 plans")
- Clicking a phase row expands it inline (accordion) to show the files in that phase directory
- Files listed inside the accordion are clickable to open the file viewer
- Progress bar at the top of the overview showing overall milestone progress (e.g., "Phase 1 of 3 · 33% complete")

**File Viewer**
- Styled markdown rendering (parse headings, bold, lists, code blocks) — lightweight approach, no heavy library since React is aliased via data: URLs
- Full scroll for file content, no collapsible sections
- Breadcrumb path in the viewer header (e.g., "Phase 1 > 01-01-PLAN.md") with a back button
- Copy-path button that copies the file's relative path to clipboard and shows a toast confirmation

**Navigation Model**
- Two tabs in the modal header: "Dashboard" and "Guide"
- Both tabs visible in ALL plugin states (installed, not installed, no project, etc.)
- Smart default tab: Dashboard if GSD is installed with planning, Guide if GSD is not installed
- When viewing a file, tabs remain visible at top — file viewer replaces the Dashboard body only
- Switching to Guide tab and back returns to overview (not to the file being viewed)

**Guide Design**
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

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| DASH-01 | User sees an overview of roadmap phases with their names and statuses | ROADMAP.md parsing patterns, shell.exec ls/cat, phase directory scanning |
| DASH-02 | User can click a phase or file to read its full contents in a scrollable panel | shell.exec cat for file reading, markdown renderer, race condition guards |
| DASH-03 | Dashboard refreshes plan data when the modal is opened | redetect() pattern already proven in Phase 1; extend to loadPlanning() on modal open |
| EDUC-01 | User can view a guide page explaining the GSD workflow in simple visual terms | Static content, no shell.exec needed; slash-command copy pattern |
| EDUC-02 | Guide page is accessible regardless of GSD install state | Tab routing at the ToolbarButton level, above the PluginPhase switch |
</phase_requirements>

---

## Summary

Phase 2 has three distinct technical domains: (1) parsing ROADMAP.md to extract phase data, (2) reading arbitrary .planning/ files on demand via shell.exec, and (3) adding tab routing to the modal header. All three are self-contained and low-risk.

The ROADMAP.md parsing is the only area with genuine uncertainty: the markdown format is stable within this codebase (verified against three real GSD projects), but defensive parsing is required because the format could vary across user projects. A regex-based approach with no dependencies is the correct call — the Vite data-URL React aliasing means ANY npm package bundled into dist/index.js must be a true devDependency with no runtime React dependency, and markdown libraries add unnecessary bundle weight to what Ship Studio loads directly.

File reading via shell.exec (`cat`) is straightforward. The only operational pitfall is race conditions when the user clicks a file, then immediately clicks another before the first read completes — a stale-request guard using a request ID counter resolves this cleanly without useEffect cleanup complexity. The clipboard API (`navigator.clipboard.writeText`) is confirmed available in Ship Studio's Tauri context based on direct usage in the main codebase.

**Primary recommendation:** Parse ROADMAP.md with targeted regex (no library), read files with `bash -c 'cat "..."'`, guard file reads with a request-counter, implement tabs at the ToolbarButton level with a `activeTab: 'dashboard' | 'guide'` state variable, and use inline accordion expansion via a `Set<number>` of open phase indices.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React (host-provided) | 19.x | UI rendering | Aliased via data: URLs — zero bundle impact |
| TypeScript | 5.6.x | Type safety | Already in project devDependencies |
| Vite | 6.x | Build tool | Already in project devDependencies |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| None | — | — | No new dependencies needed for Phase 2 |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Regex markdown parser | `marked` or `micromark` | External libs add bundle weight and can't be external-aliased like React; regex covers the subset of markdown used in GSD files |
| Request-counter race guard | AbortController or useEffect cleanup | Request counter is simpler and sufficient; AbortController only helps with fetch, not shell.exec |
| useState Set for accordion | Third-party accordion component | No additional library needed; Set<number> for open indices is standard React pattern |

**Installation:**
```bash
# No new packages required
```

---

## Architecture Patterns

### Recommended Project Structure
```
src/
├── types.ts          # Extend UseGsdReturn with planning data + navigation state
├── context.ts        # Unchanged
├── styles.ts         # Add CSS for tabs, accordion, progress bar, file viewer
├── useGsd.ts         # Add loadPlanning(), readFile(), planning data state
├── utils/
│   └── parseRoadmap.ts   # Pure function: string → PhaseData[]
├── views/
│   ├── InstallView.tsx   # Unchanged
│   ├── NoProjectView.tsx # Unchanged
│   ├── OverviewView.tsx  # NEW: phase list + accordion + progress bar
│   ├── FileViewer.tsx    # NEW: markdown renderer + breadcrumb + copy-path
│   └── GuideView.tsx     # NEW: static GSD workflow guide + click-to-copy
└── index.tsx         # Add tab state, tab header, GuideView render
```

### Pattern 1: Tab State at ToolbarButton Level

**What:** `activeTab` state lives in `ToolbarButton` (the component that owns `modalOpen`). It sits above the `useGsd()` phase switch. The tab header renders unconditionally when the modal is open. The body switch renders either `<GuideView>` (when `activeTab === 'guide'`) or the existing per-phase content (when `activeTab === 'dashboard'`).

**When to use:** Tabs that must be visible across all plugin states — the tab selection is independent of the GSD install state.

**Example:**
```typescript
// src/index.tsx
function ToolbarButton() {
  const [modalOpen, setModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'guide'>('dashboard');
  const gsd = useGsd();
  useInjectStyles();

  // Smart default: Guide if not installed, Dashboard otherwise
  useEffect(() => {
    if (modalOpen) {
      setActiveTab(
        gsd.phase === 'gsd-not-installed' || gsd.phase === 'no-project'
          ? 'guide'
          : 'dashboard'
      );
      void gsd.redetect();
    }
  }, [modalOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  // Switching to Guide clears file viewer (returns to overview on tab switch back)
  const handleTabChange = (tab: 'dashboard' | 'guide') => {
    setActiveTab(tab);
    if (tab === 'guide') gsd.clearFileView?.();
  };

  return (
    <>
      <button className="toolbar-icon-btn" title="GSD" onClick={() => setModalOpen(true)}>
        {/* ... svg ... */}
      </button>
      {modalOpen && (
        <div className="gsd-modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="gsd-modal" onClick={e => e.stopPropagation()}>
            <div className="gsd-modal-header">
              <span>GSD</span>
              <div className="gsd-tabs">
                <button
                  className={`gsd-tab ${activeTab === 'dashboard' ? 'gsd-tab-active' : ''}`}
                  onClick={() => handleTabChange('dashboard')}
                >Dashboard</button>
                <button
                  className={`gsd-tab ${activeTab === 'guide' ? 'gsd-tab-active' : ''}`}
                  onClick={() => handleTabChange('guide')}
                >Guide</button>
              </div>
              <button className="gsd-btn gsd-btn-secondary" onClick={() => setModalOpen(false)}>
                Close
              </button>
            </div>
            <div className="gsd-modal-body">
              {activeTab === 'guide'
                ? <GuideView showToast={gsd.showToast} />
                : renderDashboardContent(gsd)
              }
            </div>
          </div>
        </div>
      )}
    </>
  );
}
```

### Pattern 2: ROADMAP.md Parsing with Defensive Regex

**What:** Pure function that takes the raw ROADMAP.md string and returns a typed array of `PhaseData`. Uses regex to extract phase entries from the `## Phases` bullet list. Falls back gracefully when the format differs.

**When to use:** Any time the ROADMAP.md string needs to be turned into structured data.

**Verified ROADMAP.md format** (from three real GSD projects — plugin-gsd, plugin-figma, shipstudio):

```markdown
## Phases
...
- [x] **Phase 1: Name Here** - Description text
- [ ] **Phase 2: Name Here** - Description text
```

The phase bullet pattern is:
- `- [x]` = complete
- `- [ ]` = not started
- No "in-progress" marker in the Phases list itself — status comes from the Progress table

The Progress table provides plan count and status:
```markdown
| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Name | 3/3 | Complete | 2026-02-28 |
| 2. Name | 0/3 | Not started | - |
```

**Status derivation:** Use the `## Phases` bullet list for completion (`[x]` vs `[ ]`), and the Progress table for "Plans Complete" count (e.g., "3/3"). "In-progress" can be derived: not `[x]` AND plans > 0.

**Example:**
```typescript
// src/utils/parseRoadmap.ts

export interface PhaseData {
  number: number;
  name: string;        // "Scaffold, Detection & Install"
  status: 'complete' | 'in-progress' | 'not-started';
  plansComplete: number;  // 3
  plansTotal: number;     // 3
  dirName: string | null; // "01-scaffold-detection-install" (matched from filesystem)
}

/**
 * Parses ROADMAP.md string into PhaseData[].
 * Defensive: returns [] on any parse failure, never throws.
 */
export function parseRoadmap(content: string): PhaseData[] {
  try {
    const phases: PhaseData[] = [];

    // Extract phase bullets from ## Phases section
    // Pattern: - [x] **Phase N: Name** - description
    //          - [ ] **Phase N: Name** - description
    const phaseLineRegex = /^- \[([ x])\] \*\*Phase (\d+(?:\.\d+)?): ([^*]+)\*\*/gm;
    const phaseBullets: Array<{ checked: boolean; num: string; name: string }> = [];
    let m: RegExpExecArray | null;
    while ((m = phaseLineRegex.exec(content)) !== null) {
      phaseBullets.push({
        checked: m[1] === 'x',
        num: m[2],
        name: m[3].trim(),
      });
    }

    // Extract plan counts from Progress table
    // Pattern: | 1. Name | 3/3 | Complete | ... |
    const progressRowRegex = /^\|\s*(\d+(?:\.\d+)?)\.\s*[^|]+\|\s*(\d+)\/(\d+)\s*\|\s*([^|]+)\|/gm;
    const progressMap = new Map<string, { complete: number; total: number; status: string }>();
    while ((m = progressRowRegex.exec(content)) !== null) {
      progressMap.set(m[1], {
        complete: parseInt(m[2], 10),
        total: parseInt(m[3], 10),
        status: m[4].trim(),
      });
    }

    for (const bullet of phaseBullets) {
      const progress = progressMap.get(bullet.num);
      const plansComplete = progress?.complete ?? 0;
      const plansTotal = progress?.total ?? 0;

      let status: PhaseData['status'];
      if (bullet.checked) {
        status = 'complete';
      } else if (plansComplete > 0) {
        status = 'in-progress';
      } else {
        status = 'not-started';
      }

      phases.push({
        number: parseFloat(bullet.num),
        name: bullet.name,
        status,
        plansComplete,
        plansTotal,
        dirName: null, // filled in by useGsd() after filesystem scan
      });
    }

    return phases;
  } catch {
    return [];
  }
}
```

### Pattern 3: Phase Directory Scanning

**What:** Use `ls -1` via shell.exec to list directories under `.planning/phases/`. Match each directory to a phase number using the naming convention `NN-slug` (e.g., `01-scaffold-detection-install`). Then list files within each phase directory to populate the accordion.

**Verified naming convention** (from real GSD projects):
- Phase directories: `NN-phase-slug` (zero-padded integer prefix)
- Phase files: `NN-MM-PLAN.md`, `NN-MM-SUMMARY.md`, `NN-RESEARCH.md`, `NN-CONTEXT.md`

**Example:**
```typescript
// In useGsd.ts loadPlanning()

// Step 1: List phase directories
const lsResult = await shellRef.current.exec(
  'bash',
  ['-c', `ls -1 "${project.path}/.planning/phases" 2>/dev/null || echo ""`],
);
const phaseDirs = lsResult.stdout
  .split('\n')
  .map(s => s.trim())
  .filter(Boolean);

// Step 2: Match directories to phase data by number prefix
// Directory "01-scaffold-detection-install" -> number 1 -> dirName = "01-scaffold-detection-install"
for (const dir of phaseDirs) {
  const dirNumMatch = dir.match(/^(\d+)-/);
  if (!dirNumMatch) continue;
  const dirNum = parseInt(dirNumMatch[1], 10);
  const phase = phases.find(p => Math.floor(p.number) === dirNum);
  if (phase) phase.dirName = dir;
}

// Step 3: List files in each phase directory
for (const phase of phases) {
  if (!phase.dirName) continue;
  const filesResult = await shellRef.current.exec(
    'bash',
    ['-c', `ls -1 "${project.path}/.planning/phases/${phase.dirName}" 2>/dev/null || echo ""`],
  );
  phase.files = filesResult.stdout
    .split('\n')
    .map(s => s.trim())
    .filter(s => s.endsWith('.md'));
}
```

### Pattern 4: File Reading with Race Condition Guard

**What:** Each file read request is tagged with an incrementing request ID. When the result arrives, it's only applied to state if the request ID matches the current expected ID. Prevents stale file content from overwriting fresh content when the user clicks rapidly.

**When to use:** Any async operation triggered by user clicks where the user might click again before the previous operation completes. This is the correct pattern for shell.exec-based data fetching (no AbortController, no useEffect cleanup needed).

**Example:**
```typescript
// In useGsd.ts
const fileReadIdRef = useRef(0);

const readFile = useCallback(async (relativePath: string): Promise<void> => {
  const requestId = ++fileReadIdRef.current;
  setFileLoading(true);
  setActiveFile(null);
  setFileContent(null);

  try {
    const result = await shellRef.current.exec(
      'bash',
      ['-c', `cat "${project!.path}/${relativePath}" 2>/dev/null`],
      { timeout: 10000 },
    );

    // Guard: only apply if this is still the latest request
    if (requestId !== fileReadIdRef.current) return;

    if (result.exit_code !== 0 || result.stdout === '') {
      setFileContent(null);
      actionsRef.current.showToast('Could not read file', 'error');
    } else {
      setActiveFile(relativePath);
      setFileContent(result.stdout);
    }
  } catch {
    if (requestId !== fileReadIdRef.current) return;
    actionsRef.current.showToast('File read failed', 'error');
  } finally {
    if (requestId === fileReadIdRef.current) {
      setFileLoading(false);
    }
  }
}, [project]); // eslint-disable-line react-hooks/exhaustive-deps
```

### Pattern 5: Lightweight Markdown Renderer

**What:** A pure function that transforms a markdown string into React elements using regex replacements. Handles the GSD-relevant subset: H1/H2/H3 headings, bold, inline code, fenced code blocks, bullet lists, numbered lists, horizontal rules, and plain paragraphs. No library needed.

**Why no library:** The Vite build externalizes React via data: URLs. Any npm markdown library would be bundled directly into dist/index.js. This is fine for zero-dependency libraries, but markdown libraries (marked, micromark, remark) are heavy (50KB+) and add complexity. The GSD file subset is well-defined and a ~80-line renderer covers it completely.

**Example:**
```typescript
// src/utils/renderMarkdown.tsx

import { createElement, Fragment } from 'react';

export function renderMarkdown(content: string): React.ReactNode {
  const elements: React.ReactNode[] = [];
  const lines = content.split('\n');
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Fenced code block
    if (line.startsWith('```')) {
      const lang = line.slice(3).trim();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // consume closing ```
      elements.push(
        <pre key={i} style={{ background: 'var(--bg-tertiary)', padding: '12px', borderRadius: 6, overflow: 'auto', fontSize: 11 }}>
          <code>{codeLines.join('\n')}</code>
        </pre>
      );
      continue;
    }

    // H1
    if (line.startsWith('# ')) {
      elements.push(<h1 key={i} style={{ fontSize: 16, fontWeight: 700, margin: '12px 0 8px' }}>{inlineMarkdown(line.slice(2))}</h1>);
      i++; continue;
    }
    // H2
    if (line.startsWith('## ')) {
      elements.push(<h2 key={i} style={{ fontSize: 14, fontWeight: 600, margin: '10px 0 6px', color: 'var(--text-primary)' }}>{inlineMarkdown(line.slice(3))}</h2>);
      i++; continue;
    }
    // H3
    if (line.startsWith('### ')) {
      elements.push(<h3 key={i} style={{ fontSize: 13, fontWeight: 600, margin: '8px 0 4px', color: 'var(--text-secondary)' }}>{inlineMarkdown(line.slice(4))}</h3>);
      i++; continue;
    }

    // Bullet list item
    if (/^[-*] /.test(line)) {
      elements.push(
        <div key={i} style={{ display: 'flex', gap: 6, marginBottom: 2 }}>
          <span style={{ color: 'var(--text-muted)', flexShrink: 0 }}>•</span>
          <span>{inlineMarkdown(line.slice(2))}</span>
        </div>
      );
      i++; continue;
    }

    // Numbered list item
    if (/^\d+\. /.test(line)) {
      const num = line.match(/^(\d+)\. /)?.[1] ?? '';
      elements.push(
        <div key={i} style={{ display: 'flex', gap: 6, marginBottom: 2 }}>
          <span style={{ color: 'var(--text-muted)', flexShrink: 0 }}>{num}.</span>
          <span>{inlineMarkdown(line.replace(/^\d+\. /, ''))}</span>
        </div>
      );
      i++; continue;
    }

    // HR
    if (/^---+$/.test(line.trim())) {
      elements.push(<hr key={i} style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '12px 0' }} />);
      i++; continue;
    }

    // Blank line
    if (line.trim() === '') {
      elements.push(<div key={i} style={{ height: 6 }} />);
      i++; continue;
    }

    // Paragraph
    elements.push(<p key={i} style={{ margin: '0 0 6px' }}>{inlineMarkdown(line)}</p>);
    i++;
  }

  return createElement(Fragment, null, ...elements);
}

function inlineMarkdown(text: string): React.ReactNode {
  // Bold: **text**
  // Inline code: `text`
  // These are the only inline elements GSD files regularly use
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return parts.map((part, idx) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={idx}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return <code key={idx} style={{ background: 'var(--bg-tertiary)', padding: '1px 4px', borderRadius: 3, fontSize: '0.9em', fontFamily: 'monospace' }}>{part.slice(1, -1)}</code>;
    }
    return part;
  });
}
```

### Pattern 6: Accordion with Set State

**What:** Track which phase indices are expanded using `useState<Set<number>>`. Toggle on row click. No animation needed (deferred) — a simple conditional render of the file list.

**Example:**
```typescript
const [expandedPhases, setExpandedPhases] = useState<Set<number>>(new Set());

const togglePhase = (idx: number) => {
  setExpandedPhases(prev => {
    const next = new Set(prev);
    if (next.has(idx)) {
      next.delete(idx);
    } else {
      next.add(idx);
    }
    return next;
  });
};
```

### Pattern 7: Clipboard Copy with Toast

**What:** `navigator.clipboard.writeText()` is confirmed available in Ship Studio's Tauri context. Use it directly with `.then()`/`.catch()` to show toast feedback.

**Verified:** Ship Studio's own codebase uses `navigator.clipboard.writeText()` in multiple components (GitErrorHandler, Terminal, CodeViewer, ConflictResolutionModal). This API works reliably in Tauri WebViews.

**Example:**
```typescript
const handleCopyPath = (relativePath: string) => {
  navigator.clipboard.writeText(relativePath).then(
    () => showToast('Path copied to clipboard', 'success'),
    () => showToast('Failed to copy path', 'error'),
  );
};
```

### Pattern 8: UseGsdReturn Extension

**What:** Extend `UseGsdReturn` in types.ts with planning data and navigation actions. Views remain purely presentational — they call `readFile()` and `clearFileView()` from the hook return, never calling shell.exec directly.

**Example:**
```typescript
// src/types.ts extension for Phase 2

export interface PhaseData {
  number: number;
  name: string;
  status: 'complete' | 'in-progress' | 'not-started';
  plansComplete: number;
  plansTotal: number;
  dirName: string | null;
  files: string[];  // filenames only, e.g. ["01-01-PLAN.md", "01-RESEARCH.md"]
}

// Extend UseGsdReturn:
export interface UseGsdReturn {
  // Phase 1 (unchanged)
  phase: PluginPhase;
  loading: boolean;
  error: string | null;
  install: () => Promise<void>;
  redetect: () => Promise<void>;

  // Phase 2 additions
  planningData: PhaseData[];         // populated when phase === 'has-planning'
  planningLoading: boolean;          // true during ROADMAP.md parse + dir scan
  activeFile: string | null;         // relative path of file being viewed
  fileContent: string | null;        // raw content of activeFile
  fileLoading: boolean;              // true during cat read
  readFile: (relativePath: string) => Promise<void>;
  clearFileView: () => void;         // called when tab switches or back pressed
}
```

### Anti-Patterns to Avoid
- **Calling shell.exec from view components:** All shell access must go through `useGsd()`. Views are purely presentational — no `useShell()` in views.
- **Parsing markdown with a bundled library:** Any library added to `devDependencies` that isn't externalized via vite.config.ts will be inlined into dist/index.js. For markdown, the inlining is acceptable but unnecessary given the bounded GSD file format.
- **Storing Set in state naively:** `useState(new Set())` works but `setExpandedPhases(prev => new Set(prev))` is required for mutation-free updates.
- **Awaiting all file reads on modal open:** Only read ROADMAP.md and list phase directories on open. Do NOT read individual file content until the user clicks. File content is loaded lazily.
- **Using `cancelled` ref for stale state:** The Phase 1 `detect()` already has a `cancelled` ref skeleton that was intentionally left incomplete. For Phase 2's `loadPlanning()`, use the request-ID counter pattern instead — it's more explicit.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Tab UI | Custom tab component library | Simple `activeTab` state + two buttons | No external dependency needed; two buttons with border-bottom styling is identical to what Ship Studio itself uses |
| Markdown parsing | AST-based parser | Regex line-by-line processor | GSD files use a bounded subset; an AST adds complexity for zero benefit |
| Accordion animation | CSS transition library | `overflow: hidden` with no animation (deferred per decisions) | User decision: accordion animation is discretionary, simple show/hide is sufficient |
| Race condition handling | RxJS switchMap or similar | Request ID counter (integer ref) | Shell.exec is already async; a simple counter is all that's needed |

**Key insight:** This phase is primarily wiring — the hard parts (shell.exec pattern, context, CSS variables) are already established. The new work is parsing a known format and routing between views.

---

## Common Pitfalls

### Pitfall 1: ROADMAP.md Phase Number Extraction
**What goes wrong:** Decimal phase numbers (e.g., "Phase 2.1: ...") appear in GSD when urgent phases are inserted between milestones. The regex must handle `\d+(?:\.\d+)?` not just `\d+`.
**Why it happens:** The GSD docs explicitly document decimal phases: "Integer phases (1, 2, 3): Planned milestone work / Decimal phases (2.1, 2.2): Urgent insertions". The plugin-figma ROADMAP.md shows the pattern documented in the roadmap header.
**How to avoid:** Use `(\d+(?:\.\d+)?)` in the phase extraction regex. `parseFloat()` for the number field.
**Warning signs:** A project with a Phase 1.5 or 2.1 would silently drop that phase if the regex only matches integers.

### Pitfall 2: Shell.exec CWD Not Guaranteed
**What goes wrong:** `shell.exec('bash', ['-c', 'ls .planning/phases'])` uses relative paths that break because shell.exec CWD is not guaranteed to be the project directory.
**Why it happens:** Phase 1 already discovered this — all paths must use `project.path` absolute prefix.
**How to avoid:** ALWAYS use `"${project.path}/.planning/..."` in shell commands. Never rely on relative paths.
**Warning signs:** ls returns empty or cat exits with code 1 when files definitely exist.

### Pitfall 3: File Names with Special Characters
**What goes wrong:** `cat "${project.path}/.planning/phases/01-foo/01-01-PLAN.md"` fails if the file name or path contains spaces, quotes, or shell metacharacters.
**Why it happens:** GSD naming conventions use dashes and dots (safe), but project paths can contain spaces (e.g., "My Project").
**How to avoid:** Always double-quote paths in bash -c strings. The outer string uses single-escape and the inner path uses double-quotes: `bash -c 'cat "' + path + '"'` — actually safer to construct the full bash string as a template literal and pass it as a single -c argument.
**Warning signs:** Shell exits with code 127 or "no such file or directory" for paths that definitely exist.

### Pitfall 4: Planning Data Loaded Too Eagerly
**What goes wrong:** Loading ROADMAP.md + all phase directories + all file contents on every modal open creates 10+ shell.exec calls on each open, making the modal feel slow.
**Why it happens:** Confusing "refresh on open" (DASH-03) with "load everything on open".
**How to avoid:** On modal open, load only: (1) ROADMAP.md content, (2) list of phase directories, (3) list of files within each directory. Do NOT read file contents until user clicks a file. This is 2 shell.exec calls total on open: one cat for ROADMAP.md, one ls for phases, plus N ls calls for phase directories (typically 2-5).
**Warning signs:** Modal takes 3+ seconds to open.

### Pitfall 5: Modal Width Too Narrow for File Content
**What goes wrong:** The current modal is 520px wide. Markdown files with long lines (especially code blocks) cause horizontal scroll or wrapping that looks broken.
**Why it happens:** Planning files (especially PLAN.md files at 15KB+) contain code blocks with long lines.
**How to avoid:** Set `overflow-x: auto` on the file viewer container so code blocks scroll horizontally. Also widen the modal when in file-viewer mode, or accept wrapping as intentional behavior. Research confirms that Ship Studio's plugin modals are typically 480-520px; `overflow-x: auto` on `<pre>` elements is the standard solution.
**Warning signs:** Code in PLAN.md files wraps awkwardly and is unreadable.

### Pitfall 6: Tab State Reset on Modal Close
**What goes wrong:** The `activeTab` state resets to 'dashboard' every time the modal is closed and reopened because `ToolbarButton` preserves its state between renders but the `useEffect` on `modalOpen` resets the tab for the smart-default behavior.
**Why it happens:** Smart default tab (Dashboard if GSD installed, Guide if not) requires resetting on open. But this overrides any tab the user had selected.
**How to avoid:** The user decision says smart default applies on open — this IS the intended behavior. The tab always resets to smart default on open. This is correct per the spec. Not a pitfall to avoid, but a deliberate tradeoff to document.
**Warning signs:** None — this is correct behavior per the user's locked decision.

### Pitfall 7: clearFileView Not Called on Tab Switch
**What goes wrong:** User is viewing a file, switches to Guide tab, switches back to Dashboard — and sees the file viewer again instead of the overview.
**Why it happens:** The locked decision says "Switching to Guide tab and back returns to overview (not to the file being viewed)."
**How to avoid:** When switching to 'guide' tab, call `gsd.clearFileView()`. This sets `activeFile = null` and `fileContent = null`, returning the Dashboard body to overview mode on next render.
**Warning signs:** After Guide→Dashboard tab switch, user still sees the last opened file.

---

## Code Examples

Verified patterns from this codebase:

### Shell.exec for File Reading
```typescript
// Confirmed pattern from useGsd.ts Phase 1 (absolute paths, bash -c, $HOME for tilde)
const result = await shellRef.current.exec(
  'bash',
  ['-c', `cat "${project.path}/.planning/ROADMAP.md" 2>/dev/null`],
);
if (result.exit_code !== 0) { /* handle error */ }
const content = result.stdout;
```

### Directory Listing
```typescript
// List .planning/phases directory for phase subdirectories
const lsResult = await shellRef.current.exec(
  'bash',
  ['-c', `ls -1 "${project.path}/.planning/phases" 2>/dev/null || echo ""`],
);
const dirs = lsResult.stdout.split('\n').map(s => s.trim()).filter(Boolean);
```

### Clipboard Copy (confirmed in Ship Studio codebase)
```typescript
// navigator.clipboard.writeText is available in Tauri WebView context
navigator.clipboard.writeText(relativePath).then(
  () => showToast('Path copied', 'success'),
  () => showToast('Copy failed', 'error'),
);
```

### CSS Variable Usage (from styles.ts)
```typescript
// Existing theme variables available via CSS custom properties
// var(--bg-primary), var(--bg-secondary), var(--bg-tertiary)
// var(--text-primary), var(--text-secondary), var(--text-muted)
// var(--border), var(--action), var(--action-text), var(--error), var(--success)
```

### Tab CSS Classes (new, to be added to styles.ts)
```css
.gsd-tabs {
  display: flex;
  gap: 0;
  border-bottom: 1px solid var(--border);
}

.gsd-tab {
  padding: 0 14px;
  font-size: 13px;
  font-weight: 500;
  color: var(--text-muted);
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  cursor: pointer;
  margin-bottom: -1px;
  transition: color 0.15s;
}

.gsd-tab:hover { color: var(--text-secondary); }
.gsd-tab-active {
  color: var(--text-primary);
  border-bottom-color: var(--text-primary);
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Single modal body switch | Tab header + body content switch | Phase 2 (this phase) | Guide tab accessible from all states |
| `UseGsdReturn` with 5 fields | Extended with 7 more fields for planning data | Phase 2 (this phase) | Views can display planning data without shell.exec |
| `has-planning` = placeholder | `has-planning` = OverviewView with accordion | Phase 2 (this phase) | Core dashboard value delivered |

**Deprecated/outdated:**
- The `has-planning` placeholder in index.tsx (`<div><h3>Dashboard</h3>...</div>`): replaced by `<OverviewView>` in plan 02-01
- The `no-planning` inline JSX in index.tsx: still valid, no change needed in Phase 2

---

## Open Questions

1. **ROADMAP.md Phase-to-Directory Matching for Decimal Phases**
   - What we know: Integer phases (1, 2, 3) map to directories `01-`, `02-`, `03-`. Decimal phases (1.5, 2.1) would presumably use directories like `01.5-` or `01-5-`.
   - What's unclear: The actual directory naming convention for decimal phases is not documented. No decimal phase examples exist in the current codebase.
   - Recommendation: Match directories using `parseInt(dirPrefix, 10)` and `Math.floor(phaseNumber)` for the integer part. Log a warning if a decimal phase has no matching directory. This is correct for all current real projects and is defensively correct for the decimal case.

2. **Modal Width for File Viewer**
   - What we know: Current modal is 520px. PLAN.md files contain large code blocks.
   - What's unclear: Whether to widen the modal when in file-viewer mode, or rely on overflow-x: auto on pre elements.
   - Recommendation: Keep 520px modal width; apply `overflow-x: auto` to `<pre>` elements in the markdown renderer. This matches Ship Studio's own code viewer behavior (confirmed in plugin-starter's `my-plugin-pre` CSS class). No modal width change needed.

3. **loadPlanning() Call Timing Relative to detect()**
   - What we know: `redetect()` is called on every modal open. Phase is set to `has-planning` after detect() completes.
   - What's unclear: Should `loadPlanning()` be called inside `detect()` (when phase is set to has-planning), or separately in the `modalOpen` useEffect?
   - Recommendation: Call `loadPlanning()` at the end of `detect()` when phase is `has-planning`. This keeps a single async chain and avoids a second useEffect dependency on `phase` changes. The `planningLoading` state keeps the UI responsive during the scan.

---

## Sources

### Primary (HIGH confidence)
- Direct filesystem inspection — three real GSD projects' ROADMAP.md files analyzed: plugin-gsd (this project), plugin-figma, shipstudio. Format is consistent across all three.
- `/Users/juliangalluzzo/Desktop/Projects/shipstudio-plugins/plugin-gsd/src/useGsd.ts` — shell.exec patterns, ref patterns, detect() structure
- `/Users/juliangalluzzo/Desktop/Projects/shipstudio-plugins/plugin-gsd/src/types.ts` — UseGsdReturn interface, PluginPhase union
- `/Users/juliangalluzzo/Desktop/Projects/shipstudio-plugins/plugin-gsd/src/styles.ts` — existing CSS variables and class names
- `/Users/juliangalluzzo/Desktop/Projects/shipstudio-plugins/plugin-gsd/src/index.tsx` — modal structure, tab insertion points
- `/Users/juliangalluzzo/Desktop/Projects/shipstudio/src/components/GitErrorHandler.tsx` — `navigator.clipboard.writeText()` confirmed available in Tauri context

### Secondary (MEDIUM confidence)
- `/Users/juliangalluzzo/.claude/skills/react-dev/SKILL.md` — React 19 patterns, useState with Set, discriminated unions
- `/Users/juliangalluzzo/Desktop/Projects/shipstudio-plugins/plugin-figma/src/components/Modal.tsx` — reusable modal pattern in a real plugin

### Tertiary (LOW confidence)
- None — all claims are verified from the codebase or direct file inspection.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new dependencies; same stack as Phase 1
- Architecture: HIGH — patterns verified from existing Phase 1 code and real Ship Studio codebase
- Pitfalls: HIGH — derived from Phase 1 lessons (absolute paths, bash -c, project guard) plus direct ROADMAP.md format analysis
- ROADMAP.md parsing regex: MEDIUM — verified against 3 real projects; decimal phase directory naming is inferred, not verified

**Research date:** 2026-02-28
**Valid until:** 2026-04-28 (stable domain — Ship Studio plugin API and GSD file format are unlikely to change)
