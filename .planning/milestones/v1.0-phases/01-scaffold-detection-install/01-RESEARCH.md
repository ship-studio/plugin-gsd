# Phase 1: Scaffold, Detection & Install - Research

**Researched:** 2026-02-28
**Domain:** Ship Studio plugin scaffold, filesystem detection via shell.exec, interactive terminal install
**Confidence:** HIGH — all findings sourced from direct inspection of reference implementations in the sibling monorepo (plugin-starter, plugin-vercel, plugin-ralph, plugin-memberstack) and the authoritative plugin-starter CLAUDE.md

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| INST-01 | User sees a GSD toolbar button consistent with Ship Studio conventions | `toolbar-icon-btn` host CSS class; `slots: { toolbar: ToolbarButton }` export pattern; plugin.json `slots: ["toolbar"]` |
| INST-02 | Plugin detects whether GSD is installed by checking `~/.claude/get-shit-done/` existence | `shell.exec('bash', ['-c', 'test -d "$HOME/.claude/get-shit-done" && echo yes || echo no'])` — tilde does not expand in raw shell.exec args; must use bash -c with $HOME |
| INST-03 | User can install GSD via one-click button that opens interactive terminal running `npx get-shit-done-cc@latest` | `actions.openTerminal('npx', ['get-shit-done-cc@latest'], { title: 'Install GSD' })` returns Promise<number \| null>; re-detect after Promise resolves |
| INST-04 | Plugin detects whether current project has a `.planning/` directory | `shell.exec('bash', ['-c', `test -d "${project.path}/.planning" && echo yes || echo no`])` — must use absolute path from project.path |
| INST-05 | User sees toast notifications for install success/failure and all significant actions | `ctx.actions.showToast(message, 'success' \| 'error')` — called after openTerminal resolves and re-detection completes |
| INST-06 | User sees loading states during shell command execution | `loading: boolean` state in useGsd() hook, set to true before shell.exec calls, false after; views render spinner/disabled state when loading is true |
| INST-07 | Plugin shows distinct error states for not-installed, no-project, and file-read failures | Discriminated union type `PluginPhase` with members: 'loading', 'no-project', 'gsd-not-installed', 'no-planning', 'has-planning', 'error'; each renders a distinct component |
</phase_requirements>

---

## Summary

Phase 1 builds the entire plugin from scratch — the project directory currently contains only `.planning/` and `.git/`. This means the first plan (scaffold) must create all the infrastructure files (package.json, vite.config.ts, tsconfig.json, plugin.json, src/ structure) before any feature work can begin.

The Ship Studio plugin system has a narrow, well-documented API with clear patterns from the reference plugins in the monorepo. All findings in this research come directly from reading those reference implementations — there is no guessing or training-data inference. The stack is React 19 (host-provided, never bundled), TypeScript 5.6, Vite 6, and the Ship Studio plugin context API accessed via `window.__SHIPSTUDIO_PLUGIN_CONTEXT_REF__`.

The three core technical challenges for Phase 1 are: (1) the scaffold must get the Vite data-URL aliasing config exactly right or React hooks will break; (2) GSD installation detection requires a bash -c wrapper because tilde/HOME does not expand in direct shell.exec args; and (3) the install flow uses `actions.openTerminal()` not `shell.exec()` because the GSD installer requires interactive user input. All three patterns are verified from existing sibling plugins.

**Primary recommendation:** Start with the plugin-starter files as the base (copy package.json, vite.config.ts, tsconfig.json verbatim), then build a multi-file src/ structure following the plugin-ralph/plugin-memberstack patterns, with a discriminated union state model in types.ts defined before any component code.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | 19.x (host-provided, peer dep only) | UI components | Host provides it via `window.__SHIPSTUDIO_REACT__`; never bundle |
| TypeScript | ^5.6.0 | Type safety | All monorepo plugins use TS; required for TSX compilation |
| Vite | ^6.0.0 | Build tool | Required; the data-URL aliasing config is non-negotiable |
| Ship Studio Plugin Context API | Runtime (no npm) | shell, actions, storage, theme, invoke | Accessed via `window.__SHIPSTUDIO_PLUGIN_CONTEXT_REF__` + React.useContext |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @types/react | ^19.0.0 | TypeScript types for React | Always install as devDependency |
| @shipstudio/plugin-sdk | latest (devDep only) | Type imports for PluginContextValue | Optional; only if you prefer import-based types over inlining the interface |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Inline `PluginContextValue` in types.ts | @shipstudio/plugin-sdk devDep | Either works identically at runtime; inline approach has zero runtime cost |
| CSS injection pattern | Tailwind, CSS Modules, styled-components | Never use bundled CSS libraries — no build pipeline at install time, no CSS file resolution via Blob URL |
| `shell.exec` for filesystem ops | Direct filesystem API | There is no direct filesystem API in the plugin sandbox |

**Installation:**
```bash
# package.json devDependencies — no runtime deps needed
npm install
# Runtime API is provided by the Ship Studio host — no npm package for it
```

---

## Architecture Patterns

### Recommended Project Structure

```
plugin-gsd/
├── package.json          # devDeps: vite, typescript, @types/react; peerDep: react
├── vite.config.ts        # Data-URL React aliasing (copy from plugin-starter verbatim)
├── tsconfig.json         # target: ES2020, jsx: react-jsx, moduleResolution: bundler
├── plugin.json           # id: gsd, slots: ["toolbar"], api_version: 1, required_commands: []
├── dist/
│   └── index.js          # COMMITTED TO GIT — Ship Studio does not run npm install
└── src/
    ├── index.tsx          # Exports: name, slots, onActivate, onDeactivate; ToolbarButton slot; CSS injection
    ├── context.ts         # usePluginContext() hook + convenience hooks (useShell, useToast, etc.)
    ├── types.ts           # PluginContextValue interface; PluginPhase discriminated union; GSD domain types
    ├── styles.ts          # STYLE_ID constant; PLUGIN_CSS string
    ├── useGsd.ts          # Custom hook: detection chain, install action, loading/error state
    └── views/
        ├── InstallView.tsx   # Rendered when PluginPhase === 'gsd-not-installed'
        └── NoProjectView.tsx # Rendered when PluginPhase === 'no-project'
```

Note: Phase 1 creates only `InstallView.tsx` and `NoProjectView.tsx`. The `OverviewView.tsx` and `GuideView.tsx` views are Phase 2 work. The view router in `index.tsx` will have placeholder rendering for states that aren't fully implemented yet.

### Pattern 1: Plugin Module Exports

**What:** Ship Studio expects exactly this export shape from `dist/index.js`.
**When to use:** Always — this is the mandatory entry point contract.

```typescript
// src/index.tsx
export const name = 'GSD';

export const slots = {
  toolbar: ToolbarButton,
};

export function onActivate() {
  console.log('[gsd] Plugin activated');
}

export function onDeactivate() {
  console.log('[gsd] Plugin deactivated');
}
```

### Pattern 2: Plugin Context Access (api_version 1)

**What:** The `usePluginContext()` hook reads context via `window.__SHIPSTUDIO_PLUGIN_CONTEXT_REF__` (api_version 1 pattern). The Vercel plugin uses the older `__SHIPSTUDIO_PLUGIN_CONTEXT__` direct global — do NOT copy that pattern.
**When to use:** In context.ts; all other files import convenience hooks from context.ts.

```typescript
// src/context.ts
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const _w = window as any;

export function usePluginContext(): PluginContextValue {
  const React = _w.__SHIPSTUDIO_REACT__;
  const CtxRef = _w.__SHIPSTUDIO_PLUGIN_CONTEXT_REF__;

  if (CtxRef && React?.useContext) {
    const ctx = React.useContext(CtxRef) as PluginContextValue | null;
    if (ctx) return ctx;
  }

  throw new Error('Plugin context not available.');
}

// Convenience hooks
export function useShell()         { return usePluginContext().shell; }
export function useToast()         { return usePluginContext().actions.showToast; }
export function useProject()       { return usePluginContext().project; }
export function useAppActions()    { return usePluginContext().actions; }
export function useTheme()         { return usePluginContext().theme; }
export function usePluginStorage() { return usePluginContext().storage; }
```

### Pattern 3: Discriminated Union for Plugin State (CRITICAL)

**What:** Model all plugin states as a discriminated union, not booleans. Each phase maps 1:1 to a distinct view component.
**When to use:** Define in types.ts before writing any component. This is Phase 1 infrastructure that all future phases depend on.

```typescript
// src/types.ts

// Discriminated union for all possible plugin states
export type PluginPhase =
  | 'loading'           // Initial detection in progress
  | 'no-project'        // Ship Studio has no project open (project === null)
  | 'gsd-not-installed' // ~/.claude/get-shit-done/ does not exist
  | 'no-planning'       // GSD installed, but project has no .planning/ directory
  | 'has-planning'      // GSD installed + .planning/ exists → show dashboard
  | 'error';            // Detection failed with an unexpected error

// The full plugin context value (inline, no SDK dependency)
export interface PluginContextValue {
  pluginId: string;
  project: {
    name: string;
    path: string;
    currentBranch: string;
    hasUncommittedChanges: boolean;
  } | null;
  actions: {
    showToast: (message: string, type?: 'success' | 'error') => void;
    refreshGitStatus: () => void;
    refreshBranches: () => void;
    focusTerminal: () => void;
    openUrl: (url: string) => void;
    openTerminal: (command: string, args: string[], options?: { title?: string }) => Promise<number | null>;
  };
  shell: {
    exec: (command: string, args: string[], options?: { timeout?: number }) => Promise<{
      stdout: string;
      stderr: string;
      exit_code: number;
    }>;
  };
  storage: {
    read: () => Promise<Record<string, unknown>>;
    write: (data: Record<string, unknown>) => Promise<void>;
  };
  invoke: {
    call: <T = unknown>(command: string, args?: Record<string, unknown>) => Promise<T>;
  };
  theme: {
    bgPrimary: string; bgSecondary: string; bgTertiary: string;
    textPrimary: string; textSecondary: string; textMuted: string;
    border: string; accent: string; accentHover: string;
    action: string; actionHover: string; actionText: string;
    error: string; success: string;
  };
}

// Return type of useGsd() hook (Phase 1 subset)
export interface UseGsdReturn {
  phase: PluginPhase;
  loading: boolean;
  error: string | null;
  install: () => Promise<void>;
  redetect: () => Promise<void>;
}
```

### Pattern 4: Detection Chain in useGsd()

**What:** Sequential shell.exec checks that walk down the detection chain, setting `phase` state at each failure point. Uses cancellation flag to prevent stale state updates.
**When to use:** In useGsd.ts; fires on mount and after openTerminal resolves.

```typescript
// src/useGsd.ts (Phase 1 portion)
import { useState, useEffect, useCallback, useRef } from 'react';
import { useProject, useShell, useAppActions } from './context';
import type { PluginPhase, UseGsdReturn } from './types';

export function useGsd(): UseGsdReturn {
  const project = useProject();
  const shell = useShell();
  const actions = useAppActions();

  // Use refs for unstable values (mirrors plugin-ralph pattern)
  const shellRef = useRef(shell);
  shellRef.current = shell;
  const actionsRef = useRef(actions);
  actionsRef.current = actions;

  const [phase, setPhase] = useState<PluginPhase>('loading');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const detect = useCallback(async () => {
    const sh = shellRef.current;

    // Step 1: Check if Ship Studio has a project open
    if (!project) {
      setPhase('no-project');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      // Step 2: Check GSD global installation
      // CRITICAL: Must use bash -c + $HOME — tilde does NOT expand in shell.exec args
      const gsdCheck = await sh.exec('bash', ['-c', 'test -d "$HOME/.claude/get-shit-done" && echo yes || echo no']);
      if (gsdCheck.exit_code !== 0 || gsdCheck.stdout.trim() !== 'yes') {
        setPhase('gsd-not-installed');
        return;
      }

      // Step 3: Check project has .planning/ directory
      // CRITICAL: Always absolute path using project.path
      const planningCheck = await sh.exec('bash', ['-c', `test -d "${project.path}/.planning" && echo yes || echo no`]);
      if (planningCheck.stdout.trim() !== 'yes') {
        setPhase('no-planning');
        return;
      }

      setPhase('has-planning');
    } catch (err) {
      setError(String(err));
      setPhase('error');
    } finally {
      setLoading(false);
    }
  }, [project]);

  // Run detection on mount and when project changes
  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      // Wrap detect to respect cancellation
      await detect();
    };

    void run();

    return () => { cancelled = true; };
  }, [detect]);

  const install = useCallback(async () => {
    const act = actionsRef.current;
    const sh = shellRef.current;

    setLoading(true);
    try {
      // openTerminal opens an interactive terminal pane; Promise resolves when terminal closes
      await act.openTerminal('npx', ['get-shit-done-cc@latest'], { title: 'Install GSD' });

      // Re-detect after terminal closes (user may have completed or cancelled)
      const gsdCheck = await sh.exec('bash', ['-c', 'test -d "$HOME/.claude/get-shit-done" && echo yes || echo no']);
      if (gsdCheck.stdout.trim() === 'yes') {
        act.showToast('GSD installed successfully!', 'success');
        await detect();
      } else {
        act.showToast('GSD installation was not completed', 'error');
      }
    } catch (err) {
      act.showToast('Failed to open installer terminal', 'error');
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }, [detect]);

  return { phase, loading, error, install, redetect: detect };
}
```

### Pattern 5: CSS Injection (styles.ts)

**What:** CSS injected into document.head via useEffect. All class names namespaced with `gsd-` prefix. Use CSS variables for color references to auto-follow host theme.
**When to use:** Always — only styling mechanism available to Ship Studio plugins.

```typescript
// src/styles.ts
export const STYLE_ID = 'gsd-plugin-styles';

export const PLUGIN_CSS = `
.gsd-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
}
.gsd-modal {
  width: 520px;
  max-height: 80vh;
  border-radius: 12px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  background: var(--bg-primary);
  border: 1px solid var(--border);
  color: var(--text-primary);
}
.gsd-modal-header {
  padding: 16px 20px;
  font-size: 14px;
  font-weight: 600;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid var(--border);
}
.gsd-modal-body {
  padding: 24px;
  overflow-y: auto;
  font-size: 13px;
  line-height: 1.5;
}
.gsd-btn {
  padding: 6px 14px;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  transition: opacity 0.15s;
}
.gsd-btn:hover { opacity: 0.85; }
.gsd-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.gsd-btn-primary { background: var(--action); color: var(--action-text); }
.gsd-btn-secondary { background: var(--bg-tertiary); color: var(--text-primary); border: 1px solid var(--border); }
.gsd-loading-indicator { color: var(--text-muted); font-size: 12px; }
.gsd-error-state { color: var(--error); font-size: 12px; padding: 8px; }
`;
```

### Pattern 6: Modal Shell with View Router

**What:** `ToolbarButton` in index.tsx holds `modalOpen` + `phase` (from useGsd) and routes to the correct view component using a switch statement. Navigation is state-driven, no React Router.
**When to use:** Always — Ship Studio plugins have no URL bar.

```typescript
// src/index.tsx (simplified Phase 1 version)
import { useState, useEffect } from 'react';
import { STYLE_ID, PLUGIN_CSS } from './styles';
import { useGsd } from './useGsd';
import { useToast } from './context';
import { InstallView } from './views/InstallView';
import { NoProjectView } from './views/NoProjectView';

function useInjectStyles() {
  useEffect(() => {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = PLUGIN_CSS;
    document.head.appendChild(style);
    return () => { document.getElementById(STYLE_ID)?.remove(); };
  }, []);
}

function ToolbarButton() {
  const [modalOpen, setModalOpen] = useState(false);
  const gsd = useGsd();
  useInjectStyles();

  // Escape key to close modal
  useEffect(() => {
    if (!modalOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setModalOpen(false); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [modalOpen]);

  // Render the appropriate view for current phase
  let content: React.ReactNode;
  switch (gsd.phase) {
    case 'loading':
      content = <div className="gsd-loading-indicator">Checking GSD status...</div>;
      break;
    case 'no-project':
      content = <NoProjectView />;
      break;
    case 'gsd-not-installed':
      content = <InstallView gsd={gsd} />;
      break;
    case 'no-planning':
      content = <div>GSD is installed. Run /gsd:new-project in Claude Code to start planning.</div>;
      break;
    case 'has-planning':
      content = <div>Dashboard (Phase 2)</div>;
      break;
    case 'error':
      content = <div className="gsd-error-state">Error: {gsd.error}</div>;
      break;
  }

  return (
    <>
      <button
        className="toolbar-icon-btn"
        title="GSD — Get Shit Done"
        onClick={() => setModalOpen(true)}
      >
        {/* Checkmark/checklist icon */}
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="9 11 12 14 22 4" />
          <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
        </svg>
      </button>
      {modalOpen && (
        <div className="gsd-modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="gsd-modal" onClick={(e) => e.stopPropagation()}>
            <div className="gsd-modal-header">
              <span>GSD</span>
              <button className="gsd-btn gsd-btn-secondary" onClick={() => setModalOpen(false)}>Close</button>
            </div>
            <div className="gsd-modal-body">
              {content}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export const name = 'GSD';
export const slots = { toolbar: ToolbarButton };
export function onActivate() { console.log('[gsd] activated'); }
export function onDeactivate() { console.log('[gsd] deactivated'); }
```

### Pattern 7: InstallView Component

**What:** Shown when `phase === 'gsd-not-installed'`. Calls `gsd.install()` on button click. Shows loading state when install is in progress.
**When to use:** Phase 1. This is the primary user-facing feature of this phase.

```typescript
// src/views/InstallView.tsx
import type { UseGsdReturn } from '../types';

export function InstallView({ gsd }: { gsd: UseGsdReturn }) {
  return (
    <div>
      <h3 style={{ marginBottom: 8 }}>GSD Not Installed</h3>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 16, fontSize: 13 }}>
        Get Shit Done (GSD) is a planning system for Claude Code projects.
        Install it to start managing your project plans from Ship Studio.
      </p>
      <button
        className="gsd-btn gsd-btn-primary"
        onClick={gsd.install}
        disabled={gsd.loading}
      >
        {gsd.loading ? 'Installing...' : 'Install GSD'}
      </button>
      {gsd.error && (
        <div className="gsd-error-state" style={{ marginTop: 8 }}>
          {gsd.error}
        </div>
      )}
    </div>
  );
}
```

### Anti-Patterns to Avoid

- **Copying the Vercel plugin's `getCtx()` pattern:** The Vercel plugin uses `window.__SHIPSTUDIO_PLUGIN_CONTEXT__` (old API). Always use `window.__SHIPSTUDIO_PLUGIN_CONTEXT_REF__` with `React.useContext` (api_version 1).
- **Using booleans for state:** `const [gsdInstalled, setGsdInstalled] = useState(false)` loses the three-way distinction between "not installed", "no project", and "no planning". Always use the discriminated union.
- **Tilde expansion in shell.exec args:** `shell.exec('test', ['-d', '~/.claude/...'])` — tilde does NOT expand. Use `bash -c` with `$HOME` instead.
- **Relative paths in shell.exec:** `shell.exec('cat', ['.planning/ROADMAP.md'])` — CWD is not guaranteed. Always use `project.path` absolute paths.
- **Unnamespaced CSS classes:** `.modal`, `.btn`, `.header` collide with other plugins. Use `.gsd-modal`, `.gsd-btn`, `.gsd-header`.
- **Single-file monolith:** The plugin will have 4 views by the end of Phase 2. Define the file structure in Phase 1 before writing any feature logic.
- **Not committing dist/index.js:** Ship Studio clones the repo and does NOT run npm install or npm run build. Missing dist/ = "Plugin bundle not found" for all users.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| React shared with host | Bundle React | Vite data-URL aliasing (see vite.config.ts below) | Two React copies = broken hooks. This config is non-negotiable. |
| CSS styling | Runtime CSS-in-JS, CSS Modules, Tailwind | CSS injection via `useEffect` + `document.createElement('style')` | No build pipeline at install time; Blob URL has no CSS file resolution |
| Interactive terminal | Custom UI terminal emulator | `actions.openTerminal(command, args, options)` | Ship Studio already provides a real terminal pane |
| Filesystem reads | Direct Node.js fs API | `shell.exec('cat', [absolutePath])` | No direct filesystem API in plugin sandbox |
| Directory existence check | Custom bash script | `shell.exec('bash', ['-c', 'test -d "$HOME/..." && echo yes || echo no'])` | Cleanest pattern; bash -c handles HOME expansion |
| View routing | React Router | `currentView` string state + switch statement | No URL bar in plugin modal; React Router is unnecessary overhead |

**Key insight:** The Ship Studio plugin API is intentionally minimal. Anything not in `shell.exec`, `actions`, `storage`, `invoke`, or `theme` does not exist as an API. Every creative workaround (direct fs access, CSS frameworks, React bundles) will silently fail or break.

---

## Common Pitfalls

### Pitfall 1: Wrong React Context API Pattern

**What goes wrong:** Copying the Vercel plugin's `getCtx()` function that reads `window.__SHIPSTUDIO_PLUGIN_CONTEXT__`. This is the legacy api_version 0 pattern. New plugins must use `window.__SHIPSTUDIO_PLUGIN_CONTEXT_REF__` with `React.useContext`.

**Why it happens:** The Vercel plugin is the most visible reference implementation but it predates the newer API. It's easy to copy without noticing the API difference.

**How to avoid:** Always start from plugin-starter's `usePluginContext()` pattern (reads `__SHIPSTUDIO_PLUGIN_CONTEXT_REF__`). Never reference `__SHIPSTUDIO_PLUGIN_CONTEXT__` (no `_REF_` suffix).

**Warning signs:** Context reads work initially but break when multiple plugins are loaded simultaneously. TypeScript types imported from the old context don't include `openTerminal`.

### Pitfall 2: HOME/Tilde Does Not Expand in Shell Args

**What goes wrong:** `shell.exec('test', ['-d', '~/.claude/get-shit-done'])` — tilde is a shell feature, not a kernel feature. When Ship Studio passes args as an array directly to the process, no shell expansion occurs. The check always returns "not found" even when GSD is installed.

**Why it happens:** Developers assume `~` works the same as in a terminal. It does in interactive shells because bash expands it. Direct process exec bypasses bash.

**How to avoid:** Always use `shell.exec('bash', ['-c', 'test -d "$HOME/.claude/get-shit-done" && echo yes || echo no'])`. The `$HOME` variable is set by the OS environment and expands correctly inside bash -c.

**Warning signs:** GSD detection always returns "not installed" even when it is installed.

### Pitfall 3: Treating openTerminal as Synchronous / Not Re-detecting After

**What goes wrong:** Calling `actions.openTerminal(...)` and immediately calling `setPhase('has-planning')` without waiting for the Promise or re-checking the filesystem. The terminal may not have completed the install (user closed it early, install failed, etc.).

**Why it happens:** Developers assume a successful `openTerminal` call means the install succeeded. In reality, the Promise resolves with `null` if the user closes the terminal early.

**How to avoid:** Always `await` the openTerminal Promise, then re-run the detection chain (`detect()`) regardless of the return value. Let the filesystem state determine what view to show.

**Warning signs:** Plugin shows "GSD installed" state even when the user cancelled the installer mid-way.

### Pitfall 4: Not Null-Guarding `project`

**What goes wrong:** `shell.exec('bash', ['-c', `test -d "${project.path}/.planning"...`])` — if `project` is `null` (no Ship Studio project open), this throws a TypeError or produces a path like `"undefined/.planning"`.

**Why it happens:** The `PluginContextValue.project` field is typed as `{ ... } | null`. Developers see project.path used everywhere in examples and assume it's always set.

**How to avoid:** First check in `detect()` must be `if (!project) { setPhase('no-project'); return; }`. Never reference `project.path` without guarding first.

**Warning signs:** TypeScript catches this if strict mode is enabled — `project.path` is a type error when project is `null`. If you're not seeing TypeScript errors, check that `strict: true` is in tsconfig.json.

### Pitfall 5: Building Everything in index.tsx

**What goes wrong:** All components, hooks, types, and CSS in one file. Grows to 1000+ lines before Phase 2 begins. Every future change requires scrolling through unrelated code.

**Why it happens:** plugin-starter's `index.tsx` is a single file (it's a demo). Developers copy the single-file pattern without recognizing it's appropriate only for simple single-view plugins.

**How to avoid:** Define the file structure before writing any feature code. `index.tsx` should be under 80 lines at the end of Phase 1 — just the toolbar button, modal shell, view router, and module exports.

**Warning signs:** `index.tsx` passes 200 lines before the first view component is complete.

### Pitfall 6: Forgetting to Commit dist/index.js

**What goes wrong:** Developer builds locally, tests in Ship Studio, commits src/ changes, pushes. Ship Studio users see "Plugin bundle not found" because dist/ is in .gitignore or simply not staged.

**Why it happens:** Standard JavaScript project conventions add dist/ to .gitignore. This is correct for libraries but wrong for Ship Studio plugins.

**How to avoid:** Never add `dist/` to `.gitignore`. Always `git add dist/index.js` and commit it with every src/ change. The scaffold plan must include an explicit check that `.gitignore` does NOT list `dist/`.

**Warning signs:** dist/ is missing from the repo when viewing on GitHub.

---

## Code Examples

Verified patterns from reference implementations:

### Vite Config (Copy Verbatim from plugin-starter)

```typescript
// vite.config.ts — copy this exactly; do not modify the data URLs
import { defineConfig } from 'vite';

const reactDataUrl = `data:text/javascript,export default window.__SHIPSTUDIO_REACT__;export const useState=window.__SHIPSTUDIO_REACT__.useState;export const useEffect=window.__SHIPSTUDIO_REACT__.useEffect;export const useCallback=window.__SHIPSTUDIO_REACT__.useCallback;export const useMemo=window.__SHIPSTUDIO_REACT__.useMemo;export const useRef=window.__SHIPSTUDIO_REACT__.useRef;export const useContext=window.__SHIPSTUDIO_REACT__.useContext;export const createElement=window.__SHIPSTUDIO_REACT__.createElement;export const Fragment=window.__SHIPSTUDIO_REACT__.Fragment;`;

const jsxRuntimeDataUrl = `data:text/javascript,export const jsx=window.__SHIPSTUDIO_REACT__.createElement;export const jsxs=window.__SHIPSTUDIO_REACT__.createElement;export const Fragment=window.__SHIPSTUDIO_REACT__.Fragment;`;

const reactDomDataUrl = `data:text/javascript,export default window.__SHIPSTUDIO_REACT_DOM__`;

export default defineConfig({
  build: {
    lib: {
      entry: 'src/index.tsx',
      formats: ['es'],
      fileName: () => 'index.js',
    },
    rollupOptions: {
      external: ['react', 'react-dom', 'react/jsx-runtime'],
      output: {
        paths: {
          'react': reactDataUrl,
          'react-dom': reactDomDataUrl,
          'react/jsx-runtime': jsxRuntimeDataUrl,
        },
      },
    },
    minify: false,
    outDir: 'dist',
    emptyOutDir: true,
  },
});
```

Source: `/Users/juliangalluzzo/Desktop/Projects/shipstudio-plugins/plugin-starter/vite.config.ts` (HIGH confidence)

### plugin.json for GSD Plugin

```json
{
  "id": "gsd",
  "name": "GSD",
  "version": "0.1.0",
  "description": "Manage Get Shit Done plans from within Ship Studio",
  "slots": ["toolbar"],
  "author": "Julian Galluzzo",
  "repository": "https://github.com/juliangalluzzo/plugin-gsd",
  "min_app_version": "0.3.53",
  "icon": "",
  "required_commands": [],
  "api_version": 1
}
```

Note: `required_commands` is empty — all filesystem operations use `shell.exec` which requires no permissions. `invoke.call` (which requires `required_commands`) is not needed for this plugin.

Source: Stack research + plugin-starter/plugin.json pattern (HIGH confidence)

### GSD Detection Command (Correct Pattern)

```typescript
// CORRECT: bash -c with $HOME expands correctly
const result = await shell.exec('bash', ['-c', 'test -d "$HOME/.claude/get-shit-done" && echo yes || echo no']);
const isInstalled = result.exit_code === 0 && result.stdout.trim() === 'yes';

// WRONG: tilde does not expand in direct args
const result = await shell.exec('test', ['-d', '~/.claude/get-shit-done']); // BROKEN
```

Source: STACK.md and PITFALLS.md research, confirmed by plugin-ralph HOME-expansion pattern (HIGH confidence)

### Planning Directory Check (Correct Pattern)

```typescript
// CORRECT: absolute path using project.path
const result = await shell.exec('bash', ['-c', `test -d "${project.path}/.planning" && echo yes || echo no`]);
const hasPlanningDir = result.stdout.trim() === 'yes';

// WRONG: relative path (CWD not guaranteed)
const result = await shell.exec('cat', ['.planning/PROJECT.md']); // may fail silently
```

Source: PITFALLS.md + STACK.md (HIGH confidence)

### Install Flow with openTerminal

```typescript
// CORRECT: await openTerminal, then re-detect
const install = async () => {
  setLoading(true);
  try {
    // Returns Promise<number | null>; null = user closed early
    await actions.openTerminal('npx', ['get-shit-done-cc@latest'], { title: 'Install GSD' });
    // Re-check filesystem regardless of return value
    await detect();
    // detect() will setPhase based on actual filesystem state
    // show toast based on resulting phase
    if (phase === 'gsd-not-installed') {
      actions.showToast('GSD installation was not completed', 'error');
    } else {
      actions.showToast('GSD installed!', 'success');
    }
  } finally {
    setLoading(false);
  }
};

// WRONG: assume install succeeded
await actions.openTerminal('npx', ['get-shit-done-cc@latest'], {});
setPhase('no-planning'); // Wrong — user may have cancelled
```

Source: Vercel plugin's `handleLogin` pattern + ARCHITECTURE.md (HIGH confidence; caveat: openTerminal Promise resolution on user-close is inferred from Vercel pattern — verify at runtime)

### CSS Injection with Style Idempotency

```typescript
// CORRECT: check for existing style before injecting
useEffect(() => {
  if (document.getElementById(STYLE_ID)) return; // Idempotent — don't double-inject
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = PLUGIN_CSS;
  document.head.appendChild(style);
  return () => { document.getElementById(STYLE_ID)?.remove(); };
}, []);

// WRONG: inject on every render, no cleanup
const style = document.createElement('style'); // Leaks — never cleaned up
document.head.appendChild(style);
```

Source: plugin-starter/src/index.tsx `useInjectStyles()` (HIGH confidence)

### Refs for Unstable Context Values in Callbacks

```typescript
// CORRECT (plugin-ralph pattern): use ref to keep callbacks stable
const shellRef = useRef(shell);
shellRef.current = shell;
const actionsRef = useRef(actions);
actionsRef.current = actions;

// Callback uses ref, stable identity, won't cause re-renders
const install = useCallback(async () => {
  await actionsRef.current.openTerminal(...);
  await shellRef.current.exec(...);
}, []); // empty deps — ref access keeps it current

// WRONG: include unstable context objects in deps
const install = useCallback(async () => { ... }, [actions, shell]); // Recreates on every render
```

Source: plugin-ralph/src/useRalph.ts (HIGH confidence)

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `window.__SHIPSTUDIO_PLUGIN_CONTEXT__` direct global | `window.__SHIPSTUDIO_PLUGIN_CONTEXT_REF__` via `React.useContext` | api_version 1 (current) | Multi-plugin isolation; each plugin gets isolated context. Old approach still exists in Vercel plugin but is deprecated pattern |
| Single `src/index.tsx` monolith | Multi-file `src/` with views/, context.ts, types.ts, styles.ts | plugin-ralph, plugin-memberstack era | Maintainable for multi-view plugins; Vite still bundles to single dist/index.js |
| `@shipstudio/plugin-sdk` import | Inline `PluginContextValue` interface | plugin-starter current | Zero extra dependency; SDK types are identical to inline interface |

**Deprecated/outdated:**
- `window.__SHIPSTUDIO_PLUGIN_CONTEXT__`: Avoid. Use `_REF_` variant.
- Single-file monolith for multi-view plugins: Anti-pattern for GSD which has 4+ views.
- `api_version: 0`: Legacy. Use `api_version: 1` for new plugins.

---

## Open Questions

1. **openTerminal Promise behavior when user closes terminal early**
   - What we know: Returns `Promise<number | null>`; Vercel plugin awaits it and re-checks filesystem after
   - What's unclear: Does null specifically mean "user closed early" vs a non-zero exit code meaning "installer errored"? Does the Promise resolve at all if the terminal window is force-closed?
   - Recommendation: Always re-detect via filesystem after the Promise resolves, regardless of return value. Treat null and non-zero exit codes identically (both = "check if GSD is now installed"). Test this at runtime in Phase 1 verification.

2. **openTerminal return type discrepancy (Promise vs void)**
   - What we know: plugin-starter CLAUDE.md documents `openTerminal` as returning `Promise<number | null>`. plugin-ralph types.ts defines it as returning `void` (not awaitable). The Vercel plugin (which actually uses it) awaits it and handles the result.
   - What's unclear: Is the return type `Promise<number | null>` (as documented in STACK.md) or `void`? This affects whether `await` is semantically meaningful.
   - Recommendation: Use `await actions.openTerminal(...)` as written in STACK.md and Vercel plugin. If the runtime return is actually void, the await is a no-op. If it's a Promise, the await is essential. Defensive implementation costs nothing.

3. **shell.exec CWD behavior**
   - What we know: PITFALLS.md warns that CWD may not be project root. Vercel plugin uses relative paths (`.vercel/project.json`) suggesting CWD sometimes is the project root.
   - What's unclear: Is CWD ever reliably the project root? Under what conditions?
   - Recommendation: Always use absolute paths via `project.path`. Never rely on CWD. This is the safe pattern regardless of whether CWD happens to be correct.

4. **Whether `.planning/` check needs to be `test -d` or can be `ls`**
   - What we know: Both work. `test -d` is more semantically correct (directory existence). `ls` checks if the directory is readable and non-empty, which is different.
   - What's unclear: Whether an empty `.planning/` directory should be treated as "no-planning" or "has-planning".
   - Recommendation: Use `test -d` for the Phase 1 detection. An empty `.planning/` directory should show `no-planning` state (no plans to show). Phase 2 can refine this.

---

## Build Order for Phase 1

The ROADMAP.md has already pre-planned Phase 1 into three plans. This maps research findings to those plans:

| Plan | Contents | Research Basis |
|------|----------|----------------|
| 01-01: Project scaffold | package.json, vite.config.ts, tsconfig.json, plugin.json, src/context.ts, src/types.ts, src/styles.ts | STACK.md complete file contents; plugin-starter verbatim configs |
| 01-02: Core hook and detection | src/useGsd.ts with PluginPhase union, detection chain, install() action, loading/error state | Pattern 4 (detection chain); Pattern 3 (discriminated union); pitfalls 2, 3, 4 |
| 01-03: Toolbar button, modal, install view | src/index.tsx (ToolbarButton + modal shell + view router), src/views/InstallView.tsx, src/views/NoProjectView.tsx | Patterns 1, 5, 6, 7; pitfalls 5, 6; INST-01 through INST-07 |

---

## Sources

### Primary (HIGH confidence)

- `/Users/juliangalluzzo/Desktop/Projects/shipstudio-plugins/plugin-starter/CLAUDE.md` — Official plugin development guide. API reference, build system, styling guide, patterns, constraints. Authoritative source.
- `/Users/juliangalluzzo/Desktop/Projects/shipstudio-plugins/plugin-starter/src/index.tsx` — Reference implementation. CSS injection, modal pattern, usePluginContext, all API features.
- `/Users/juliangalluzzo/Desktop/Projects/shipstudio-plugins/plugin-starter/vite.config.ts` — Canonical Vite config with data-URL React aliasing.
- `/Users/juliangalluzzo/Desktop/Projects/shipstudio-plugins/plugin-starter/package.json` — Confirmed versions: Vite ^6.0.0, TypeScript ^5.6.0, @types/react ^19.0.0.
- `/Users/juliangalluzzo/Desktop/Projects/shipstudio-plugins/plugin-ralph/src/useRalph.ts` — Multi-phase detection chain, ref-stable callbacks, openTerminal usage, HOME expansion pattern.
- `/Users/juliangalluzzo/Desktop/Projects/shipstudio-plugins/plugin-ralph/src/types.ts` — RalphPhase discriminated union pattern; PluginContextValue with openTerminal.
- `/Users/juliangalluzzo/Desktop/Projects/shipstudio-plugins/plugin-vercel/src/index.tsx` — openTerminal call pattern (line 932); detection with shell.exec; CSS injection.
- `.planning/research/STACK.md` — Previously researched stack details (HIGH confidence, sourced from same reference implementations).
- `.planning/research/ARCHITECTURE.md` — Previously researched architecture patterns (HIGH confidence).
- `.planning/research/PITFALLS.md` — Previously researched pitfalls (HIGH confidence).

### Secondary (MEDIUM confidence)

- `openTerminal` return type as `Promise<number | null>` — Documented in STACK.md (derived from Vercel plugin type + plugin-starter CLAUDE.md). The return type in plugin-ralph types.ts shows `void`, creating slight ambiguity. Runtime verification needed.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — copied from plugin-starter exact versions, no inference
- Architecture: HIGH — derived from multi-file plugin reference implementations (ralph, memberstack)
- Pitfalls: HIGH — verified from reference code (tilde expansion, context API pattern, monolith anti-pattern)
- Detection patterns: HIGH — bash -c with $HOME verified in plugin-ralph; absolute paths pattern in PITFALLS.md
- openTerminal behavior: MEDIUM — pattern verified in Vercel plugin; Promise resolution on user-close inferred from docs, needs runtime validation

**Research date:** 2026-02-28
**Valid until:** 2026-03-30 (stable ecosystem; Ship Studio plugin API unlikely to change in 30 days)
