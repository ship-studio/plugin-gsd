# Architecture Research

**Domain:** Ship Studio plugin — dashboard-style, multi-view, toolbar slot
**Researched:** 2026-02-28
**Confidence:** HIGH (derived entirely from reading actual reference implementations in the sibling plugin repos)

---

## Standard Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     Ship Studio Host                             │
│  window.__SHIPSTUDIO_REACT__                                     │
│  window.__SHIPSTUDIO_PLUGIN_CONTEXT_REF__  (React ref)          │
├─────────────────────────────────────────────────────────────────┤
│                     Plugin Bundle (dist/index.js)                │
│                                                                  │
│  ┌──────────────────┐                                            │
│  │  ToolbarButton   │  ← only export in slots.toolbar           │
│  │  (slot component)│                                            │
│  └────────┬─────────┘                                            │
│           │ opens                                                │
│  ┌────────▼─────────────────────────────────────────────────┐   │
│  │  Modal (overlay + header + scrollable body)               │   │
│  │                                                           │   │
│  │  ┌───────────────────────────────────────────────────┐   │   │
│  │  │  View Router  (currentView state in ToolbarButton) │   │   │
│  │  └──────┬──────────┬──────────┬────────┬─────────────┘   │   │
│  │         │          │          │        │                  │   │
│  │  ┌──────▼──┐ ┌─────▼──┐ ┌────▼──┐ ┌───▼──────┐          │   │
│  │  │Install  │ │Overview│ │File   │ │  Guide   │          │   │
│  │  │  View   │ │  View  │ │Viewer │ │   View   │          │   │
│  │  └─────────┘ └────────┘ └───────┘ └──────────┘          │   │
│  └───────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  useGsd() hook  (custom hook encapsulating all logic)    │    │
│  │  - GSD detection (filesystem checks via shell.exec)      │    │
│  │  - .planning/ scanning and file reading                  │    │
│  │  - Install trigger (actions.openTerminal)                │    │
│  │  - Delete operations (shell.exec rm -rf)                 │    │
│  │  - Storage persistence (storage.read / storage.write)    │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌──────────┐  ┌──────────────┐  ┌────────────┐                 │
│  │ context  │  │  styles.ts   │  │  types.ts  │                 │
│  │   .ts    │  │  (CSS string)│  │            │                 │
│  └──────────┘  └──────────────┘  └────────────┘                 │
└─────────────────────────────────────────────────────────────────┘
         │
         │  calls via plugin context API
         ▼
┌─────────────────────────────────────────────────────────────────┐
│  Ship Studio APIs                                                │
│  shell.exec()          — run commands, read files, delete        │
│  actions.openTerminal()— open interactive terminal for install   │
│  actions.showToast()   — surface success/error feedback          │
│  storage.read/write()  — persist last active view, settings      │
│  theme                 — color tokens for host-aware styling     │
└─────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Communicates With |
|-----------|----------------|-------------------|
| `ToolbarButton` | Toolbar entry point; holds `modalOpen` and `currentView` state; routes to correct view; injects CSS | `Modal`, all View components, `useGsd()` hook |
| `Modal` | Overlay + header (title, nav tabs, close button) + scrollable body; handles ESC key, overlay click | Rendered by `ToolbarButton`; wraps View components |
| `InstallView` | Shown when GSD is not installed; explains what GSD is and provides "Install" button | `useGsd().install()`, `actions.openTerminal()` |
| `OverviewView` | Dashboard showing roadmap phases, statuses, contextual hints about what to run next | `useGsd().planning` data, file reads via `shell.exec` |
| `FileViewer` | Read-only display of a selected `.planning/` file's markdown content; breadcrumb back navigation | `shell.exec` for file reads; `ToolbarButton` view routing |
| `GuideView` | Static explainer of the GSD workflow (discuss → plan → execute → verify); no API calls | None (pure display) |
| `useGsd()` | Custom hook; all GSD-specific logic: detection, planning scan, install, delete, refresh | `shell.exec`, `actions.openTerminal`, `actions.showToast`, `storage` |
| `context.ts` | `usePluginContext()` hook reading `window.__SHIPSTUDIO_PLUGIN_CONTEXT_REF__` | Ship Studio host globals |
| `types.ts` | TypeScript interfaces for plugin context and GSD domain types | Shared across all files |
| `styles.ts` | CSS string injected into `document.head` on mount | `Modal` or `ToolbarButton` (injected once) |

---

## Recommended Project Structure

```
src/
├── index.tsx             # Exports: name, slots, onActivate, onDeactivate
│                         # Contains: ToolbarButton (slot), Modal (shell), view router
├── context.ts            # usePluginContext() hook + convenience hooks (useShell, useToast, etc.)
├── types.ts              # PluginContextValue, GSD domain types (PlanningState, PhaseInfo, etc.)
├── styles.ts             # PLUGIN_CSS string + STYLE_ID constant
├── useGsd.ts             # Custom hook: all GSD detection, file reading, install, delete logic
├── views/
│   ├── InstallView.tsx   # "Install GSD" — shown when ~/.claude/get-shit-done/ absent
│   ├── OverviewView.tsx  # Dashboard — phases, statuses, contextual hints
│   ├── FileViewer.tsx    # Read-only .planning/ file display + breadcrumb nav
│   └── GuideView.tsx     # Static GSD workflow explainer
└── components/
    └── ConfirmDialog.tsx  # Reusable delete confirmation (used by Overview and FileViewer)
```

### Structure Rationale

- **`index.tsx`:** Remains the single Vite entry point (`build.lib.entry`). Holds the top-level slot component and view router. Thin — just wires things together.
- **`views/`:** Each named view is its own file. Parallel to the Figma plugin's `src/views/` pattern (SetupView, MainView, SettingsView). Keeps views independently editable and testable.
- **`components/`:** Shared display primitives that are not full views. A confirmation dialog is the one obvious candidate. The `Modal` shell itself lives in `index.tsx` (co-located with the slot) to avoid over-engineering for this plugin's size.
- **`useGsd.ts`:** Follows the Memberstack plugin's `useMemberstack.ts` pattern — all stateful logic extracted into a single domain hook. The hook is the "model"; views are the "presentation".
- **`context.ts` / `types.ts` / `styles.ts`:** Directly mirrors the Figma plugin's file layout, the most mature multi-file plugin in the repo.

---

## Architectural Patterns

### Pattern 1: Custom Domain Hook

**What:** Extract all plugin logic (detection, data fetching, actions) into a single `useGsd()` hook. Views receive a handle to this hook and call its methods; they contain no `shell.exec` calls themselves.

**When to use:** Whenever a plugin has more than one view or more than 2-3 async operations. Avoids prop-drilling context API through nested components.

**Trade-offs:** Slightly more indirection vs. the single-file Vercel plugin. But for a 4-view plugin this is essential — without it, every view needs to manage its own loading state and shell calls.

**Example:**
```typescript
// useGsd.ts
export function useGsd(): UseGsdReturn {
  const ctx = usePluginContext();
  const [gsdInstalled, setGsdInstalled] = useState<boolean | null>(null);
  const [planningState, setPlanningState] = useState<PlanningState | null>(null);

  // Detection runs once on mount
  useEffect(() => {
    let cancelled = false;
    async function detect() {
      const result = await ctx.shell.exec('sh', ['-c', 'test -d ~/.claude/get-shit-done && echo yes']);
      if (!cancelled) setGsdInstalled(result.exit_code === 0 && result.stdout.trim() === 'yes');
    }
    detect();
    return () => { cancelled = true; };
  }, []);

  const install = useCallback(async () => {
    await ctx.actions.openTerminal('npx', ['get-shit-done-cc@latest'], { title: 'Install GSD' });
    // re-detect after terminal closes
    const result = await ctx.shell.exec('sh', ['-c', 'test -d ~/.claude/get-shit-done && echo yes']);
    setGsdInstalled(result.exit_code === 0 && result.stdout.trim() === 'yes');
  }, [ctx]);

  return { gsdInstalled, planningState, install, /* ... */ };
}

// OverviewView.tsx — no shell calls, no direct context access
export function OverviewView({ gsd }: { gsd: UseGsdReturn }) {
  return <div>{gsd.planningState?.phases.map(p => <PhaseRow phase={p} />)}</div>;
}
```

### Pattern 2: View Router via State (Not React Router)

**What:** A `currentView` string state in `ToolbarButton` drives which component renders inside the modal. Navigation is a `setCurrentView()` call passed down as a prop or via the `useGsd` hook.

**When to use:** Always, for Ship Studio plugins. There is no URL bar; React Router is unnecessary overhead. Figma plugin uses exactly this pattern (`useState('main' as 'main' | 'settings')`).

**Trade-offs:** View history is not tracked (no browser "back"). Acceptable since the plugin is modal-scoped and shallow.

**Example:**
```typescript
type View = 'install' | 'overview' | 'file-viewer' | 'guide';

function ToolbarButton() {
  const [modalOpen, setModalOpen] = useState(false);
  const [currentView, setCurrentView] = useState<View>('overview');
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const gsd = useGsd();

  // Auto-route to install view when GSD not detected
  useEffect(() => {
    if (gsd.gsdInstalled === false) setCurrentView('install');
    if (gsd.gsdInstalled === true)  setCurrentView('overview');
  }, [gsd.gsdInstalled]);

  const handleFileSelect = (path: string) => {
    setSelectedFile(path);
    setCurrentView('file-viewer');
  };

  let content: React.ReactNode;
  switch (currentView) {
    case 'install':    content = <InstallView gsd={gsd} />; break;
    case 'overview':   content = <OverviewView gsd={gsd} onFileSelect={handleFileSelect} onGuide={() => setCurrentView('guide')} />; break;
    case 'file-viewer': content = <FileViewer path={selectedFile!} gsd={gsd} onBack={() => setCurrentView('overview')} />; break;
    case 'guide':      content = <GuideView onBack={() => setCurrentView('overview')} />; break;
  }

  return (
    <>
      <button className="toolbar-icon-btn" onClick={() => setModalOpen(true)}>...</button>
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="GSD">
        {content}
      </Modal>
    </>
  );
}
```

### Pattern 3: CSS Injection on Mount

**What:** A CSS string constant is appended to `document.head` in a `useEffect` on mount and removed on unmount. All plugin elements get namespaced class names (e.g., `gsd-plugin-modal`, `gsd-plugin-btn`) to avoid collisions with Ship Studio's host styles.

**When to use:** Always — it is the only styling mechanism available to Ship Studio plugins. No CSS Modules, no Tailwind, no styled-components.

**Trade-offs:** All styles live in one string; no co-location. Manageable for a plugin this size. Extract to `styles.ts` to keep `index.tsx` clean.

**Example:**
```typescript
// styles.ts
export const STYLE_ID = 'gsd-plugin-styles';

export const PLUGIN_CSS = `
.gsd-plugin-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
}
.gsd-plugin-modal {
  width: 520px;
  max-height: 80vh;
  border-radius: 12px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
/* ... */
`;
```

### Pattern 4: `shell.exec` for Filesystem Operations

**What:** All filesystem reads and writes go through `shell.exec('sh', ['-c', '...'])` or `shell.exec('cat', [...])`. There is no native filesystem API in the plugin sandbox.

**When to use:** Detection checks, file reading, deletion, writing node scripts inline.

**Example:**
```typescript
// Read a .planning file
const result = await shell.exec('cat', [`${project.path}/.planning/ROADMAP.md`]);
if (result.exit_code === 0) {
  setFileContent(result.stdout);
}

// Delete with confirmation
await shell.exec('rm', ['-rf', `${project.path}/.planning`]);

// Check GSD installation
const installed = await shell.exec('sh', ['-c', 'test -d ~/.claude/get-shit-done && echo yes']);
```

---

## Data Flow

### Initial Load Flow

```
ToolbarButton mounts
    ↓
useGsd() effect fires
    ↓
shell.exec: test -d ~/.claude/get-shit-done   →   gsdInstalled: true/false
    ↓ (if installed)
shell.exec: ls ~/.planning/                    →   hasPlanningDir: true/false
    ↓ (if has planning)
shell.exec: cat .planning/ROADMAP.md           →   roadmapData parsed
shell.exec: ls .planning/                      →   phase directory list
    ↓
planningState populated
    ↓
View router auto-selects: 'install' | 'overview'
    ↓
Correct view renders
```

### Install Flow

```
User clicks "Install GSD" (InstallView)
    ↓
gsd.install() called
    ↓
actions.openTerminal('npx', ['get-shit-done-cc@latest'], { title: 'Install GSD' })
    ↓ (terminal opens — user completes interactive prompts)
terminal closes (returns)
    ↓
shell.exec re-checks ~/.claude/get-shit-done
    ↓
gsdInstalled state updated → view router switches to 'overview'
    ↓
actions.showToast('GSD installed!', 'success')
```

### File Viewer Flow

```
User clicks a file in OverviewView
    ↓
handleFileSelect(filePath) → setSelectedFile + setCurrentView('file-viewer')
    ↓
FileViewer mounts with filePath prop
    ↓
useEffect: shell.exec('cat', [filePath])
    ↓
fileContent state set → markdown rendered
    ↓
User clicks "Back" → setCurrentView('overview')
```

### Delete Flow (with confirmation)

```
User clicks delete on a phase/file (OverviewView or FileViewer)
    ↓
setConfirmTarget({ path, label }) — ConfirmDialog shown
    ↓
User confirms
    ↓
gsd.delete(path) → shell.exec('rm', ['-rf', path])
    ↓
gsd.refresh() → re-scan .planning/ directory
    ↓
planningState updated → OverviewView re-renders
    ↓
actions.showToast('Deleted', 'success')
```

### State Management

```
useGsd() hook (single source of truth for GSD state)
    ↓ (returns)
{
  gsdInstalled: boolean | null,    ← null = still checking
  planningState: PlanningState | null,
  loading: boolean,
  error: string | null,
  install: () => Promise<void>,
  deletePath: (path: string) => Promise<void>,
  refresh: () => Promise<void>,
  readFile: (path: string) => Promise<string>,
}
    ↓ (passed as prop)
View components read state + call actions
    ↓ (actions call)
Shell API + Storage API
    ↓ (results update)
useState in useGsd() → React re-render
```

---

## Suggested Build Order

This sequence respects component dependencies — lower layers must exist before higher layers consume them.

| Order | What to Build | Why This Order |
|-------|---------------|----------------|
| 1 | `context.ts`, `types.ts` | All other files import from these. Zero dependencies. |
| 2 | `styles.ts` | Needed by Modal before any view renders. |
| 3 | `useGsd.ts` (detection + install only) | Views need GSD state to know which one to render. Start with just `gsdInstalled` and `install()`. |
| 4 | `ToolbarButton` + `Modal` shell in `index.tsx` | The slot entry point. Wire up: toolbar button → modal → basic view router. |
| 5 | `InstallView` | First view to render (plugin isn't useful without GSD). Uses `gsd.install()`. |
| 6 | `OverviewView` (read-only, no delete yet) | Requires `useGsd()` to expose `planningState`. Extend the hook to scan `.planning/`. |
| 7 | `FileViewer` | Requires `shell.exec` for file reading. Navigation wired through view router already built in step 4. |
| 8 | `ConfirmDialog` + delete logic | Add `gsd.deletePath()` to hook; add ConfirmDialog component; wire into OverviewView and FileViewer. |
| 9 | `GuideView` | Pure static content — no dependencies. Can be built any time after step 4. |
| 10 | Storage persistence | Add `storage.read/write` for last active view and any plugin preferences. Non-blocking. |

---

## Anti-Patterns

### Anti-Pattern 1: Single-File Monolith for a Multi-View Plugin

**What people do:** Follow the Vercel plugin's single `index.tsx` approach (1400+ lines) for a plugin that has 4 separate views.

**Why it's wrong:** The Vercel plugin is a single-view toolbar widget with a dropdown — it never navigates between major UI states. A 4-view dashboard plugin in one file becomes uneditable. The Figma plugin's split into `views/` and `components/` is the right reference for this plugin's complexity.

**Do this instead:** Use the file structure above (`views/`, `components/`, `useGsd.ts`). Keep `index.tsx` under ~100 lines.

### Anti-Pattern 2: Shell Calls Inside View Components

**What people do:** Call `shell.exec` directly inside `OverviewView` or `FileViewer` to fetch data.

**Why it's wrong:** Views become untestable, duplicated logic appears across views, and loading/error state must be managed redundantly. The Memberstack plugin's `useMemberstack.ts` pattern exists precisely to avoid this.

**Do this instead:** All `shell.exec` calls live in `useGsd.ts`. Views receive data and callbacks as props or by consuming the hook return value.

### Anti-Pattern 3: Using `window.__SHIPSTUDIO_PLUGIN_CONTEXT__` (Old API)

**What people do:** Access context via the old `__SHIPSTUDIO_PLUGIN_CONTEXT__` window global (the Vercel plugin uses this — it predates the newer API).

**Why it's wrong:** PROJECT.md explicitly mandates using the React Context pattern (`__SHIPSTUDIO_PLUGIN_CONTEXT_REF__`). The starter plugin and Figma plugin both use the newer pattern. Mixing APIs risks breakage if the host drops the old global.

**Do this instead:** Use `usePluginContext()` from `context.ts` which reads `window.__SHIPSTUDIO_PLUGIN_CONTEXT_REF__.current`. This is also how the Memberstack and Figma plugins work.

### Anti-Pattern 4: Unnamespaced CSS Classes

**What people do:** Use generic class names like `.modal`, `.btn`, `.header` in the injected CSS string.

**Why it's wrong:** Ship Studio's host app and other plugins inject into the same `document.head`. Class name collisions will cause visual corruption.

**Do this instead:** Prefix all class names with a unique plugin identifier: `gsd-plugin-modal`, `gsd-plugin-btn`, `gsd-plugin-header`, etc.

### Anti-Pattern 5: Accessing `project.path` Without Null Guard

**What people do:** Call `shell.exec('cat', [`${project.path}/.planning/...`])` directly, assuming `project` is always set.

**Why it's wrong:** `project` is `null` when Ship Studio has no project open. The plugin context interface shows `project: { path, name, ... } | null`. Any shell command using `project.path` will throw or produce a wrong path.

**Do this instead:** Guard all `project`-dependent logic with `if (!project) return;`. Show a "No project open" empty state in views that need `project.path`.

---

## Integration Points

### Ship Studio Plugin API

| API | How GSD Plugin Uses It | Notes |
|-----|------------------------|-------|
| `shell.exec` | GSD detection, `.planning/` scanning, file reads, delete operations | The primary workhorse. All filesystem access goes here. |
| `actions.openTerminal` | Launching `npx get-shit-done-cc@latest` installer | Interactive prompts require a real terminal — `shell.exec` won't work for this. |
| `actions.showToast` | Install success, delete success, error messages | Keep toast messages short. Use `'success'` and `'error'` types. |
| `storage.read/write` | Persisting last active view, any user preferences | Storage is a flat JSON object, per-plugin. No schema migration needed at this scale. |
| `theme` | Styling via CSS custom properties (`var(--bg-primary)`, etc.) | The Vercel plugin uses `var(--bg-primary)` CSS vars directly in its injected CSS — no need to read `theme` object properties if using CSS vars. |
| `invoke.call` | Not needed — GSD plugin has no Tauri command requirements | The starter shows `invoke.call('list_branches')` but GSD doesn't need native Rust commands. |
| `project.path` | Prepended to all `.planning/` file paths | Always null-check before use. |
| `actions.openUrl` | Potentially for linking to GSD documentation | Low priority; nice-to-have. |

### Internal Module Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| `index.tsx` → `useGsd.ts` | Direct hook call; receives return value | `useGsd()` called in `ToolbarButton`, result passed as prop to views |
| `index.tsx` → `views/` | Props: `gsd` handle, navigation callbacks | Views are dumb; they call `gsd.method()` and `onNavigate()` |
| `views/` → `context.ts` | `usePluginContext()` for `theme` only | Views should NOT call `shell.exec` directly |
| `views/` → `components/` | Props-based | `ConfirmDialog` receives `onConfirm`, `onCancel`, `label` |
| All files → `types.ts` | Import types only | No runtime code in `types.ts` |
| All files → `styles.ts` | Import `STYLE_ID` and `PLUGIN_CSS` | `styles.ts` exports constants, no functions |

---

## Scalability Considerations

This is a local plugin with no backend, users, or network traffic. "Scaling" concerns are:

| Concern | Consideration |
|---------|---------------|
| Large `.planning/` directories | Use `ls` + lazy file loading. Don't read all files on mount — only read a file when user opens the FileViewer. The OverviewView only needs directory listings and ROADMAP.md. |
| Many phase directories | The phase list should be a scrollable list, not rendered all at once. No virtualization needed at realistic GSD project sizes (10-50 phases max). |
| Slow `shell.exec` calls | Show skeleton/loading state immediately; populate async. The Memberstack pattern of `loading: boolean` in the hook covers this. |
| Plugin size / bundle | Keep the bundle small — no runtime dependencies. React is provided by the host. CSS is a string. This plugin should compile to under 50KB. |

---

## Sources

All findings derived from direct code examination of the following sibling plugin repositories (HIGH confidence — primary sources):

- `plugin-starter/src/index.tsx` — canonical API patterns, `usePluginContext()` hook implementation, CSS injection, modal overlay, module exports
- `plugin-figma/src/` — multi-file structure pattern (`views/`, `components/`, `context.ts`, `types.ts`, `styles.ts`), view router via `currentView` state
- `plugin-memberstack/src/` — custom domain hook pattern (`useMemberstack.ts`), `ToolbarButton` as separate component, `ConnectView`/`ConnectedView` as separate view files
- `plugin-vercel/src/index.tsx` — `openTerminal()` for interactive CLI install, `shell.exec` for detection/filesystem, single-component monolith (anti-pattern reference for multi-view plugins)
- `plugin-gsd/.planning/PROJECT.md` — requirements: 4 views (install, overview, file viewer, guide), React Context API mandate, `openTerminal` for GSD install

---

*Architecture research for: Ship Studio plugin — GSD dashboard*
*Researched: 2026-02-28*
