# Phase 3: Delete Flows & Polish - Research

**Researched:** 2026-02-28
**Domain:** Destructive filesystem operations, confirmation dialog UX, React inline-modal pattern, Ship Studio shell.exec API
**Confidence:** HIGH

---

## Summary

Phase 3 adds the only two missing v1 management requirements: deleting the entire `.planning/` directory (MGMT-01) and deleting individual phase files or folders (MGMT-02), both with friction-calibrated confirmation dialogs (MGMT-03). The work is entirely additive: no existing code needs to change structurally. The pattern follows the same conventions already proven in Phases 1 and 2 — shell.exec for filesystem operations, actionsRef for stable callbacks, showToast for feedback, and redetect() to refresh state after a destructive action.

The confirmation dialog is the design centrepiece. Two friction levels are required: a high-friction path for full-directory deletion (warning text + typed confirmation or double-click) and a lower-friction path for individual file/folder deletion (single confirmation click). Both dialogs must be rendered inline inside the existing `.gsd-modal` — a nested overlay approach would fight the existing stacking context and is unnecessary. The dialog state is local to the component that hosts it (OverviewView), so no changes to `useGsd()` types are needed beyond adding the two delete action functions.

The filesystem commands are well-established: `rm -rf` via `shell.exec('bash', ['-c', '...'])` for full-directory removal (already precedented by the Vercel plugin's `shell.exec('rm', ['-rf', '.vercel'])`), and the same pattern for individual files or subdirectories. The critical safety measure is path validation before executing any `rm -rf`: the path must be constructed from `project.path` + a known relative segment (`.planning/` or `.planning/phases/<dir>/<file>`), never from user-supplied input.

**Primary recommendation:** Build a reusable `ConfirmDialog` component with a `friction` prop (`'high' | 'low'`), add `deleteDirectory` and `deleteItem` actions to `useGsd()`, and wire delete buttons into `OverviewView` with per-phase and global delete triggers.

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| MGMT-01 | User can delete the entire `.planning/` directory with a confirmation dialog | `bash -c 'rm -rf "${project.path}/.planning"'` via shell.exec; high-friction ConfirmDialog variant; after success call redetect() which will resolve to 'no-planning' |
| MGMT-02 | User can delete individual phase folders or files with a confirmation dialog that names the specific path | `bash -c 'rm -rf "${project.path}/.planning/phases/<dir>"'` or `rm -f` for individual .md files; low-friction ConfirmDialog variant naming the path |
| MGMT-03 | Delete confirmation uses distinct friction levels — full delete requires more confirmation than single file | ConfirmDialog `friction` prop: 'high' = two-step (warning text + confirmation button after timeout or typed word); 'low' = single confirmation button |
</phase_requirements>

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React (via host shim) | Host-provided | ConfirmDialog component, local state for dialog open/pending | Already aliased via data: URL in vite.config.ts; no new dependency |
| shell.exec (Ship Studio API) | Host-provided | `rm -rf` / `rm -f` destructive filesystem commands | Established pattern from Phases 1-2 and Vercel plugin |
| showToast (Ship Studio API) | Host-provided | Post-delete success/error feedback | Already used throughout; accessed via actionsRef |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| None | — | — | No new npm packages needed for this phase |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Inline ConfirmDialog rendered inside .gsd-modal-body | Separate portal overlay | Portal adds z-index complexity and fights existing stacking context; inline is simpler and sufficient for a single modal plugin |
| `rm -rf` via bash -c string | shell.exec('rm', ['-rf', path]) | Both work (vercel uses the latter); bash -c is safer because it lets us use double-quotes around the path and compose complex guards in one shot |
| Typed confirmation input (type "delete" to confirm) | Simple button click with warning text | Typed input is highest friction but adds UI complexity; a clearly-worded two-button high-friction dialog (Cancel prominent, Confirm danger-colored) is sufficient and matches Ship Studio's existing patterns |

**Installation:**
```bash
# No new packages. Existing setup sufficient.
```

---

## Architecture Patterns

### Recommended Project Structure

```
src/
├── types.ts           # Add deleteDirectory, deleteItem to UseGsdReturn
├── useGsd.ts          # Add deleteDirectory() and deleteItem() action functions
├── styles.ts          # Add ConfirmDialog CSS classes
├── views/
│   ├── OverviewView.tsx    # Add delete buttons + ConfirmDialog wiring
│   └── ConfirmDialog.tsx   # New reusable component (new file)
└── index.tsx          # No changes needed
```

### Pattern 1: ConfirmDialog as Inline Component (Not Portal)

**What:** A div rendered inside `.gsd-modal-body` that replaces or overlays the triggering content with a confirmation prompt. Uses local state in `OverviewView` (`confirmState: null | { type: 'full' } | { type: 'item', path: string, label: string }`).

**When to use:** Any time a destructive action is triggered from inside the existing modal.

**Example:**
```typescript
// ConfirmDialog.tsx — purely presentational, receives callbacks
interface ConfirmDialogProps {
  friction: 'high' | 'low';
  targetLabel: string;       // e.g., ".planning/" or "phases/01-scaffold/01-01-PLAN.md"
  onConfirm: () => void;
  onCancel: () => void;
  isDeleting: boolean;
}

export function ConfirmDialog({ friction, targetLabel, onConfirm, onCancel, isDeleting }: ConfirmDialogProps) {
  // high friction: show extra warning paragraph + danger-colored confirm button
  // low friction: show single-sentence warning + confirm button
  // Both: Cancel button is the visually dominant / leftmost action (safer default)
}
```

**Why inline, not portal:**
The existing `.gsd-modal` is already a fixed-position overlay (z-index: 10000). Rendering a nested portal on top creates double-overlay DOM complexity and requires managing a second stacking context. Inline replacement of the modal body content is simpler and the pattern used by the vercel plugin's inline confirmation flows.

### Pattern 2: confirmState in OverviewView (Not useGsd)

**What:** Dialog open/close and delete-in-progress state live as local component state in `OverviewView`, not in the hook. The hook only exposes action functions (`deleteDirectory`, `deleteItem`). This keeps `useGsd()` as a pure action/data layer.

**When to use:** When UI-only state (dialog visibility, deleting spinner) has no need to be shared across components.

**Example:**
```typescript
// OverviewView.tsx
const [confirmState, setConfirmState] = useState<
  null | { type: 'full' } | { type: 'item'; path: string; label: string }
>(null);
const [isDeleting, setIsDeleting] = useState(false);

async function handleConfirm() {
  setIsDeleting(true);
  try {
    if (confirmState?.type === 'full') {
      await gsd.deleteDirectory();
    } else if (confirmState?.type === 'item') {
      await gsd.deleteItem(confirmState.path);
    }
    setConfirmState(null);
  } finally {
    setIsDeleting(false);
  }
}
```

### Pattern 3: deleteDirectory and deleteItem in useGsd

**What:** Two new action functions added to `useGsd()` that call `rm -rf` via `shell.exec`, show a toast on success/error, then call `detect()` to refresh plugin state.

**Why detect() and not loadPlanning():** After a full `.planning/` delete, calling `loadPlanning()` would fail (directory gone). `detect()` handles this correctly — it will find no `.planning/` and transition to the `'no-planning'` phase (MGMT-01 success criterion 4).

**Example:**
```typescript
// useGsd.ts additions

const deleteDirectory = useCallback(async (): Promise<void> => {
  if (project === null) return;
  try {
    const result = await shellRef.current.exec(
      'bash',
      ['-c', `rm -rf "${project.path}/.planning"`],
    );
    if (result.exit_code !== 0) {
      actionsRef.current.showToast('Failed to delete .planning/ directory', 'error');
      return;
    }
    actionsRef.current.showToast('Deleted .planning/ directory', 'success');
    await detect();  // will resolve to 'no-planning'
  } catch {
    actionsRef.current.showToast('Failed to delete .planning/ directory', 'error');
  }
}, [project, detect]);  // detect is stable via useCallback

const deleteItem = useCallback(async (relativePath: string): Promise<void> => {
  if (project === null) return;
  try {
    const result = await shellRef.current.exec(
      'bash',
      ['-c', `rm -rf "${project.path}/${relativePath}"`],
    );
    if (result.exit_code !== 0) {
      actionsRef.current.showToast(`Failed to delete ${relativePath}`, 'error');
      return;
    }
    actionsRef.current.showToast(`Deleted ${relativePath}`, 'success');
    await loadPlanning();  // refresh dashboard without full redetect
  } catch {
    actionsRef.current.showToast(`Failed to delete ${relativePath}`, 'error');
  }
}, [project, loadPlanning]);
```

### Pattern 4: Delete Button Placement in OverviewView

**What:** The "Delete all plans" button appears at the bottom of the overview (after the phase list), clearly separated. Individual phase/file delete icons appear inline on hover in the phase row and file list items. Both wire into `setConfirmState`.

**Why bottom placement for global delete:** Keeps the destructive action far from casual browsing. User must scroll past all content before reaching it. This is the pattern for dangerous actions in settings UIs.

**Why hover-reveal for item delete:** Avoids visual clutter. Each phase row and file item gains a trash icon that appears on hover (`:hover` on the row toggles `opacity: 0 → 1`). Clicking it calls `setConfirmState({ type: 'item', path: ..., label: ... })`.

### Anti-Patterns to Avoid

- **Calling rm -rf with unvalidated user input:** Never construct the rm path from anything other than `project.path` + a hardcoded relative prefix (`.planning/` or `.planning/phases/`). Never accept a raw path from gsd.activeFile for deletion without stripping and revalidating against the known directory structure.
- **Using shell.exec('rm', ['-rf', path]) with spaces in path:** Paths with spaces in project.path will break when passed as a single arg. Always use `bash -c 'rm -rf "${escaped_path}"'` with double-quotes inside the bash string.
- **Calling detect() after an item deletion (not full-directory):** detect() is appropriate after full .planning/ deletion. After individual item deletion, call loadPlanning() instead — it's faster and doesn't re-check GSD installation.
- **Rendering ConfirmDialog as a second modal overlay:** Creates double-backdrop stacking issues. Render inline, replacing or covering the modal body content.
- **Forgetting to guard isDeleting state:** If the user can click Confirm twice before the first exec resolves, you'll get duplicate rm calls. Set isDeleting=true before exec, guard the button with `disabled={isDeleting}`.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Path sanitization for rm safety | Custom path validator | Construct paths entirely from `project.path` + constant prefix strings | Any regex-based validator will have edge cases. Constructing from known safe pieces is safer by design. |
| Confirmation dialog timing/debounce | Custom delay mechanism | Simple disabled-button state (`isDeleting`) | The shell.exec is fast enough; no need for artificial delays or timers |
| Directory existence check before rm -rf | Pre-rm test -d check | None needed — `rm -rf` on a nonexistent path exits 0 silently | Extra round-trip adds latency; rm -rf is already idempotent for this use case |

**Key insight:** This phase requires no new libraries and no novel patterns. It is an additive application of the patterns already established in Phases 1 and 2.

---

## Common Pitfalls

### Pitfall 1: detect() called after item delete transitions to 'no-planning'

**What goes wrong:** After deleting a single phase file, calling `detect()` works fine but is slower than necessary. However the real trap is deleting a phase folder that happens to be the only content under `.planning/phases/` — `detect()` would still find `.planning/` and stay in 'has-planning', which is correct. The issue is the reverse: if someone adds a `detect()` call after a full-directory delete AND the delete fails, the state could flicker incorrectly.

**Why it happens:** Conflating "check GSD and planning presence" (detect) with "reload planning data" (loadPlanning).

**How to avoid:** Use `detect()` only after full .planning/ delete. Use `loadPlanning()` after individual item deletes. These are the two separate functions already in useGsd.ts.

**Warning signs:** State shows 'no-planning' after a single file delete; or phase list doesn't refresh after a file delete.

### Pitfall 2: Path with spaces in project.path breaks rm

**What goes wrong:** `shell.exec('bash', ['-c', `rm -rf ${project.path}/.planning`])` (without quotes around the path) silently fails or deletes the wrong directory if `project.path` contains spaces (e.g., `/Users/julian/My Projects/app`).

**Why it happens:** Shell word-splitting interprets spaces as argument separators.

**How to avoid:** Always double-quote the path inside the bash -c string: `` `rm -rf "${project.path}/.planning"` ``. This is the pattern already used in all Phase 1 and 2 shell.exec calls (e.g., `` `cat "${project.path}/.planning/ROADMAP.md"` ``).

**Warning signs:** rm succeeds on projects without spaces, fails or wrong-targets on projects with spaces in their path.

### Pitfall 3: ConfirmDialog renders on top of modal causing scroll lock

**What goes wrong:** If ConfirmDialog is rendered as an absolute/fixed overlay inside .gsd-modal, it may clip or scroll unexpectedly on short viewports.

**Why it happens:** .gsd-modal has `overflow: hidden` on the container and `overflow-y: auto` on the body. An absolutely-positioned child inside .gsd-modal-body clips at the overflow boundary.

**How to avoid:** Render ConfirmDialog as an inline replacement (if confirmState !== null, show ConfirmDialog instead of normal body content) rather than as a positioned overlay. This avoids all overflow/clipping issues.

**Warning signs:** Dialog appears cut off or behind modal border on short screens.

### Pitfall 4: isDeleting state not reset on error path

**What goes wrong:** If shell.exec throws and the catch block doesn't call setIsDeleting(false), the Confirm button stays permanently disabled.

**Why it happens:** Forgetting the finally block or only resetting in the success branch.

**How to avoid:** Always use try/finally: `try { await exec... } catch { showToast... } finally { setIsDeleting(false); }`. This is the pattern used in `install()` and `readFile()` in useGsd.ts.

**Warning signs:** After a failed delete, the confirm dialog's button remains grayed out and unclickable.

### Pitfall 5: deleteItem accepts raw activeFile path without validation

**What goes wrong:** If deleteItem is called with `gsd.activeFile` directly (e.g., `.planning/phases/01-foo/01-01-PLAN.md`) and someone passes a malformed or path-traversal string, rm executes on an unexpected path.

**Why it happens:** Trusting UI state as a safe path source.

**How to avoid:** deleteItem in useGsd should validate that the relativePath starts with `.planning/phases/` before executing rm. The OverviewView should only ever pass paths constructed from `phase.dirName` and `fileName` values from `planningData`, both of which originate from trusted filesystem listings.

**Warning signs:** rm targets a path outside `.planning/`.

---

## Code Examples

Verified patterns from existing codebase (no external library needed):

### Delete entire directory
```typescript
// Source: pattern from Vercel plugin (shell.exec rm) + Phase 1/2 bash -c quote pattern
const result = await shellRef.current.exec(
  'bash',
  ['-c', `rm -rf "${project.path}/.planning"`],
);
// exit_code 0 = success (rm -rf on nonexistent path also exits 0)
```

### Delete individual file (safe rm -f)
```typescript
// Source: same shell.exec pattern as above
// Use rm -rf so it works for both files AND phase subdirectories without branching
const result = await shellRef.current.exec(
  'bash',
  ['-c', `rm -rf "${project.path}/.planning/phases/${phase.dirName}/${fileName}"`],
);
```

### Reloading state after full delete (transitions to no-planning)
```typescript
// Source: detect() in useGsd.ts — already handles all phase transitions
actionsRef.current.showToast('Deleted .planning/ directory', 'success');
await detect();  // will find no .planning/, set phase to 'no-planning'
```

### Reloading state after item delete (stays in has-planning)
```typescript
// Source: loadPlanning() in useGsd.ts — already handles planning data refresh
actionsRef.current.showToast(`Deleted ${relativePath}`, 'success');
await loadPlanning();  // re-reads ROADMAP.md and re-scans phase dirs
```

### ConfirmDialog hover-reveal CSS pattern
```css
/* Add to PLUGIN_CSS in styles.ts */
.gsd-delete-btn {
  opacity: 0;
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 4px;
  border: 1px solid var(--border);
  background: transparent;
  color: var(--error);
  cursor: pointer;
  transition: opacity 0.15s;
  flex-shrink: 0;
}
.gsd-phase-row:hover .gsd-delete-btn,
.gsd-file-item:hover .gsd-delete-btn {
  opacity: 1;
}
.gsd-delete-btn:hover {
  background: color-mix(in srgb, var(--error) 10%, transparent);
  border-color: var(--error);
}

/* ConfirmDialog inline block */
.gsd-confirm-dialog {
  padding: 16px;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: var(--bg-secondary);
}
.gsd-confirm-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 8px;
}
.gsd-confirm-body {
  font-size: 12px;
  color: var(--text-secondary);
  margin-bottom: 16px;
  line-height: 1.5;
}
.gsd-confirm-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}
.gsd-btn-danger {
  background: var(--error);
  color: white;
}
.gsd-btn-danger:hover { opacity: 0.85; }
.gsd-btn-danger:disabled { opacity: 0.5; cursor: not-allowed; }
```

### ConfirmDialog component structure
```typescript
// src/views/ConfirmDialog.tsx
interface ConfirmDialogProps {
  friction: 'high' | 'low';
  targetLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDeleting: boolean;
}

export function ConfirmDialog({ friction, targetLabel, onConfirm, onCancel, isDeleting }: ConfirmDialogProps) {
  return (
    <div className="gsd-confirm-dialog">
      <div className="gsd-confirm-title">
        {friction === 'high' ? 'Delete all plans?' : 'Delete this item?'}
      </div>
      <div className="gsd-confirm-body">
        {friction === 'high' ? (
          <>
            <strong>{targetLabel}</strong> and all its contents will be permanently deleted.
            This cannot be undone. All phases, plans, research, and context will be lost.
          </>
        ) : (
          <>
            <strong>{targetLabel}</strong> will be permanently deleted. This cannot be undone.
          </>
        )}
      </div>
      <div className="gsd-confirm-actions">
        <button
          className="gsd-btn gsd-btn-secondary"
          onClick={onCancel}
          disabled={isDeleting}
        >
          Cancel
        </button>
        <button
          className="gsd-btn gsd-btn-danger"
          onClick={onConfirm}
          disabled={isDeleting}
        >
          {isDeleting ? 'Deleting...' : 'Delete'}
        </button>
      </div>
    </div>
  );
}
```

### UseGsdReturn type additions
```typescript
// types.ts — add to UseGsdReturn interface:

// Phase 3: delete actions
deleteDirectory: () => Promise<void>;
deleteItem: (relativePath: string) => Promise<void>;
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Native browser `window.confirm()` | Inline JSX confirmation dialogs | Ship Studio renders in Electron/webview context where native dialogs may be suppressed | Always use React-rendered dialogs; never `window.confirm()` |
| `shell.exec('rm', ['-rf', path])` with path array arg | `bash -c 'rm -rf "${path}"'` with quoted path | This project's Phase 1 established bash -c pattern | Safer for paths with spaces; consistent with all other exec calls in this codebase |

**Deprecated/outdated:**
- Native confirm dialogs: suppressed in Electron renderer contexts; unreliable in Ship Studio's webview.

---

## Open Questions

1. **Does loadPlanning() need to be exposed on UseGsdReturn, or can it remain internal?**
   - What we know: loadPlanning is currently private inside useGsd.ts (defined with useCallback but not returned). deleteItem needs to call it after removing a file.
   - What's unclear: Whether to expose `reloadPlanning: () => Promise<void>` on UseGsdReturn (letting OverviewView call it directly) or keep it internal and have deleteItem call it automatically.
   - Recommendation: Keep loadPlanning internal. deleteItem in the hook calls it automatically after rm succeeds. This keeps the action-result coupling inside the hook, consistent with how install() calls detect() internally.

2. **Should phase-folder deletion (not just file deletion) be supported via MGMT-02?**
   - What we know: MGMT-02 says "individual phase folders or files." The roadmap plan list (`03-01`, `03-02`) mentions "individual delete."
   - What's unclear: Does deleting a phase folder (e.g., `01-scaffold-detection-install/`) require different UX than deleting a single file? A phase folder contains multiple files.
   - Recommendation: Treat phase-folder delete as lower-friction (same as file delete) since it's still a sub-directory of `.planning/`, not the full directory. The dialog should name the folder path clearly. Use `rm -rf` which handles both files and directories identically.

3. **Should deleting from FileViewer (while viewing a file) be supported, or only from OverviewView?**
   - What we know: The success criteria describe "clicking delete on an individual file" — this could mean from the file list or from the file viewer.
   - What's unclear: Adding delete to FileViewer requires either passing delete actions to it or surfacing a delete button in the breadcrumb area.
   - Recommendation: Only from OverviewView (phase row and file list). Adding delete to FileViewer adds scope. The hover-reveal delete icon on file list items is sufficient and keeps FileViewer read-only. Defer FileViewer delete to a future enhancement.

---

## Sources

### Primary (HIGH confidence)
- Existing codebase (`/src/useGsd.ts`) — shell.exec pattern, actionsRef pattern, detect/loadPlanning separation, showToast usage
- Existing codebase (`/src/styles.ts`) — CSS variable names, existing class conventions, color-mix pattern for tinted backgrounds
- Existing codebase (`/src/index.tsx`) — Modal structure, gsd-modal-body overflow-y: auto, stacking context
- Existing codebase (`/src/views/OverviewView.tsx`) — Phase row and file item render patterns, expandedPhases local state pattern
- Vercel plugin (`plugin-vercel/src/index.tsx` line 945) — `shell.exec('rm', ['-rf', '.vercel'])` direct precedent for destructive shell operation with showToast feedback pattern
- `.planning/ROADMAP.md` Phase 3 plan list — confirms two-plan split: 03-01 (ConfirmDialog component) and 03-02 (rm operations and state refresh)

### Secondary (MEDIUM confidence)
- Ship Studio plugin API (`/src/types.ts` PluginContextValue) — shell.exec signature, showToast type, confirmed by both Vercel plugin and Phase 1-2 implementation
- General Electron/webview behavior: native `window.confirm()` is suppressed in renderer process without `nodeIntegration` and dialog module — confirmed by Ship Studio's plugin pattern (no native dialogs used anywhere in reference plugins)

### Tertiary (LOW confidence)
- None — all claims are grounded in the existing codebase or the Ship Studio API as observed in working code.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new libraries; all patterns come from existing working code in this repo and the Vercel plugin reference
- Architecture: HIGH — ConfirmDialog as inline JSX, confirmState in OverviewView, and delete actions in useGsd are all direct extensions of established Phase 1-2 patterns
- Pitfalls: HIGH — path-quoting, isDeleting guard, and detect-vs-loadPlanning distinction are all verified from existing code patterns and prior decisions in STATE.md

**Research date:** 2026-02-28
**Valid until:** 2026-04-28 (stable — Ship Studio plugin API is not fast-moving)
