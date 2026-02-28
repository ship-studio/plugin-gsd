# Stack Research

**Domain:** Ship Studio plugin development (React/TypeScript/Vite, toolbar slot)
**Researched:** 2026-02-28
**Confidence:** HIGH — all findings sourced directly from the official plugin-starter reference implementation, plugin-vercel reference implementation, plugin-ralph, and plugin-memberstack in the local shipstudio-plugins monorepo. No training data guessing.

---

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| React | 19.x (peer dep, not bundled) | UI components and hooks | Required by host — plugins share the host's React instance via `window.__SHIPSTUDIO_REACT__`. Never bundle your own copy or hooks will break. |
| TypeScript | ^5.6.0 | Type safety | Every plugin in the monorepo uses TS. Inline the `PluginContextValue` interface — no external SDK needed for types. |
| Vite | ^6.0.0 | Build tool | Required. The specific vite.config.ts pattern (data: URL aliasing for React externals) is non-negotiable — it's the only way to share React with the host. |
| Ship Studio Plugin Context API | N/A (runtime, not installed) | Shell exec, toast, storage, invoke, theme, openTerminal | The entire plugin API. Accessed via `window.__SHIPSTUDIO_PLUGIN_CONTEXT_REF__` + `React.useContext`. No npm package required. |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @shipstudio/plugin-sdk | latest (dev dep only) | TypeScript type imports for `PluginContextValue` | Optional. Only install if you prefer `import type { PluginContextValue }` over inlining the interface. The inline approach (as in plugin-starter) has zero runtime cost and is equally valid. Do NOT install as a runtime dependency — it's types only. |
| @types/react | ^19.0.0 | TypeScript types for React | Always install as devDependency. Required for TSX compilation. |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| `npm run build` (vite build) | Produce `dist/index.js` | Run after every source change. COMMIT `dist/index.js` — Ship Studio clones repos as-is and does not run build steps. Never add `dist/` to `.gitignore`. |
| `npm run dev` (vite build --watch) | Watch mode for iteration | Triggers rebuild on save. Still requires manual "Reload" in Ship Studio Plugin Manager after each rebuild. |
| TypeScript compiler (tsc via Vite) | Type checking during build | Config: `target: ES2020`, `module: ESNext`, `moduleResolution: bundler`, `jsx: react-jsx`, `strict: true`. `declaration: false` — plugins don't export types. |
| Ship Studio "Link Dev Plugin" | Load local plugin for testing | Plugin Manager (puzzle icon) → "Link Dev Plugin" → select plugin folder. Reload after each build. |
| Ship Studio DevTools | Debug console | `Cmd + Option + I`. All `console.log` from plugin code appears here. |

---

## Installation

```bash
# Initialize (copy from plugin-starter)
cp -r /path/to/plugin-starter /path/to/plugin-gsd

# Dev dependencies (the only deps you need)
npm install

# What package.json looks like — no runtime dependencies needed
# devDependencies:
#   @types/react: ^19.0.0
#   typescript: ^5.6.0
#   vite: ^6.0.0
# peerDependencies:
#   react: ^19.0.0
```

No additional libraries are needed. The Ship Studio plugin API (shell, storage, toast, invoke, openTerminal, theme) is provided by the host at runtime — not through npm.

---

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| Inline `PluginContextValue` interface in `src/index.tsx` | Install `@shipstudio/plugin-sdk` as devDep for types | If you strongly prefer import-based types over inline. The SDK exports the same interface and convenience hooks. Either approach works identically at runtime. |
| CSS injection pattern (`useEffect` + `document.createElement('style')`) | Tailwind CSS, CSS Modules, styled-components | Never use these. Plugins are loaded as Blob URLs — there is no file system for CSS modules, no build step at install time, and bundling a CSS-in-JS runtime adds weight. Injected CSS strings are the only reliable pattern. |
| Plain CSS strings with CSS variable references (`var(--bg-primary)`) | Inline theme tokens from `useTheme()` | Mix both: CSS variables for static layout/structure, inline theme tokens for dynamic/conditional colors computed in JS. |
| Multi-file `src/` structure (context.ts, types.ts, components/*.tsx) | Single `src/index.tsx` | Use multi-file for plugins with 3+ views or a complex custom hook (see plugin-memberstack, plugin-ralph). Single-file is fine for simpler plugins. Vite bundles everything into one `dist/index.js` regardless. |
| `shell.exec('cat', [filePath])` for filesystem reads | Direct filesystem API | There is no direct filesystem API. `shell.exec` with standard Unix commands is the only way to read files. All plugins use this pattern. |
| `actions.openTerminal(command, args, { title })` for interactive CLI | `shell.exec` for interactive commands | `shell.exec` is non-interactive — it captures stdout/stderr and returns when done. `openTerminal` opens a visible terminal pane for commands that require user input (like `npx get-shit-done-cc@latest`). |

---

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| Bundling React or ReactDOM | Breaking hooks is guaranteed. The host provides React 19 globally. Two copies = hook errors. | Externalize via Vite's `rollupOptions.external` + data: URL aliasing (already in plugin-starter config). |
| CSS Modules, Tailwind, styled-components | No build pipeline at install time. Blob URL loading context means no CSS file resolution. | CSS injection pattern: `useEffect` + `document.createElement('style')` with a unique style ID. |
| Heavy npm libraries (lodash, moment, chart.js, etc.) | Bundles are loaded as strings over IPC then imported via Blob URL. Size matters. Every kb adds to load latency. The 10-second load timeout is hard. | Write the logic inline. Ship Studio plugins are small, focused tools. |
| Computationally expensive module-scope code | Plugin has a 10-second load timeout. Module-scope and `onActivate` run synchronously on load. | Defer everything to `useEffect` or event handlers inside components. |
| Adding `dist/` to `.gitignore` | Ship Studio installs plugins by `git clone` only — it does not run `npm install` or `npm run build`. Missing `dist/index.js` = "Plugin bundle not found" error for all users. | Commit `dist/index.js` after every build. Consider GitHub Actions auto-build (see CLAUDE.md in plugin-starter). |
| `window.__SHIPSTUDIO_REACT__` directly in components | Bypasses the React Context isolation layer. Multiple plugins rendering simultaneously each need their own context. | Always use `usePluginContext()` pattern via `React.useContext(window.__SHIPSTUDIO_PLUGIN_CONTEXT_REF__)`. |
| `invoke.call()` for commands not in `required_commands` | All `invoke.call()` calls are permission-gated. Commands not listed in `plugin.json`'s `required_commands` are rejected with an error. | List every needed Tauri command in `plugin.json`. For GSD plugin: filesystem operations use `shell.exec('cat', ...)` not `invoke.call`. |
| `actions.focusTerminal()` for GSD install | `focusTerminal` just focuses the existing terminal tab — it doesn't run a command. | Use `actions.openTerminal('npx', ['get-shit-done-cc@latest'], { title: 'Install GSD' })` for interactive installers that need user input. |

---

## Stack Patterns by Variant

**If the plugin has a single view (toolbar button → one modal):**
- Use single-file `src/index.tsx` pattern (plugin-starter, plugin-vercel)
- Keep `PluginContextValue` interface inline at top of file
- Keep CSS string inline in the same file

**If the plugin has multiple distinct views (install state, dashboard state, detail state):**
- Use multi-file structure (plugin-memberstack pattern):
  - `src/context.ts` — exports `usePluginContext` and convenience hooks
  - `src/types.ts` — exports `PluginContextValue` interface and domain types
  - `src/styles.ts` — exports CSS strings and STYLE_ID constant
  - `src/useGSD.ts` — custom hook encapsulating all detection/state logic
  - `src/index.tsx` — exports `name`, `slots`, `onActivate`, `onDeactivate`
  - `src/Modal.tsx` — shared modal wrapper component
  - `src/InstallView.tsx` — install flow view
  - `src/DashboardView.tsx` — plan overview view
  - `src/PlanDetailView.tsx` — individual file drill-down view
  - `src/GuideView.tsx` — GSD workflow explanation view

**If the plugin needs to read filesystem files (`.planning/` directory):**
- Use `shell.exec('cat', [absolutePath])` — this is the only filesystem read API
- Use `shell.exec('ls', ['-1', dirPath])` or `shell.exec('bash', ['-c', 'ls -1 dir/'])` for directory listing
- Use `shell.exec('test', ['-d', path])` to check if a directory exists
- Use `shell.exec('test', ['-f', path])` to check if a file exists
- All paths must be absolute: construct with `project.path + '/.planning/...'`

**If the plugin needs to detect a global installation (`~/.claude/get-shit-done/`):**
- Use `shell.exec('bash', ['-c', 'test -d "$HOME/.claude/get-shit-done" && echo yes || echo no'])`
- HOME expansion requires bash -c wrapper — direct `shell.exec('test', ...)` doesn't expand `~`

**If the plugin needs to run an interactive CLI installer:**
- Use `actions.openTerminal(command, args, { title })` — opens Ship Studio's terminal pane with the command running interactively
- The returned Promise resolves when the terminal closes (with exit code or null if user closed early)
- Re-detect state after the Promise resolves (same pattern as Vercel plugin's `handleLogin`)
- Example: `await ctx.actions.openTerminal('npx', ['get-shit-done-cc@latest'], { title: 'Install GSD' })`

**If the plugin needs to delete files/directories:**
- Use `shell.exec('rm', ['-rf', absolutePath])` for directories
- Use `shell.exec('rm', ['-f', absolutePath])` for files
- Always confirm with a UI dialog before calling — no undo

---

## Version Compatibility

| Package | Compatible With | Notes |
|---------|-----------------|-------|
| Vite ^6.0.0 | TypeScript ^5.6.0, @types/react ^19.0.0 | All plugins in the monorepo use this exact combination. Confirmed working. |
| React 19 (host-provided) | react/jsx-runtime via data: URL alias | The `jsxRuntimeDataUrl` in vite.config.ts must use `createElement` from `window.__SHIPSTUDIO_REACT__` — React 19 unified JSX runtime exports are satisfied this way. |
| `api_version: 1` in plugin.json | Ship Studio `min_app_version: 0.3.53` | Use `api_version: 1` for all new plugins. `api_version: 0` is the legacy API. The context ref pattern (`__SHIPSTUDIO_PLUGIN_CONTEXT_REF__`) is the api_version 1 pattern. |

---

## The Complete `plugin.json` for This Plugin

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

Note: `required_commands` is empty because this plugin uses `shell.exec` for all filesystem operations (cat, ls, test, rm). It does not need Tauri commands via `invoke.call`. Tauri commands would only be needed for git operations or IDE control — not required for GSD plan management.

---

## The Complete `vite.config.ts` for This Plugin

Use the plugin-starter version verbatim (more complete than plugin-vercel's version):

```typescript
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

---

## The Complete `tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "outDir": "dist",
    "declaration": false
  },
  "include": ["src"]
}
```

---

## Available Plugin Context API Reference

From the CLAUDE.md of plugin-starter (authoritative source):

```typescript
interface PluginContextValue {
  pluginId: string;
  project: {
    name: string;
    path: string;               // Absolute path — use this for all filesystem ops
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
```

Note: `openTerminal` is present in the Vercel plugin's interface definition and used by plugin-ralph for the `install()` action. It is NOT listed in the plugin-starter's interface (the starter's `actions` only lists `showToast`, `refreshGitStatus`, `refreshBranches`, `focusTerminal`, `openUrl`). **Confidence: HIGH** that it exists based on Vercel plugin and Ralph plugin usage. When inlining `PluginContextValue`, add `openTerminal` to the `actions` block.

---

## Host CSS Classes Available (No Injection Needed)

| Class | Description |
|-------|-------------|
| `toolbar-icon-btn` | Standard toolbar icon button — 32px height, border, rounded corners, hover states |
| `btn-primary` | Primary action button (accent background) |
| `btn-secondary` | Secondary button (tertiary background, border) |

Use these for all standard UI elements. Only inject custom CSS for layout structures not covered by host classes.

---

## Sources

- `/Users/juliangalluzzo/Desktop/Projects/shipstudio-plugins/plugin-starter/CLAUDE.md` — Official plugin development guide. PRIMARY authoritative source. Covers API, build system, constraints, patterns, styling, testing, publishing. **HIGH confidence.**
- `/Users/juliangalluzzo/Desktop/Projects/shipstudio-plugins/plugin-starter/src/index.tsx` — Reference implementation. Demonstrates all API features: shell, storage, invoke, theme, actions, useRef, useCallback, modal pattern. **HIGH confidence.**
- `/Users/juliangalluzzo/Desktop/Projects/shipstudio-plugins/plugin-starter/vite.config.ts` — Canonical Vite config with data: URL aliasing. **HIGH confidence.**
- `/Users/juliangalluzzo/Desktop/Projects/shipstudio-plugins/plugin-starter/package.json` — Confirmed versions: Vite ^6.0.0, TypeScript ^5.6.0, @types/react ^19.0.0, React 19 peer dep. **HIGH confidence.**
- `/Users/juliangalluzzo/Desktop/Projects/shipstudio-plugins/plugin-vercel/src/index.tsx` — Reference for `openTerminal` usage pattern (login flow) and `PluginContextValue` including `openTerminal` in actions. **HIGH confidence.**
- `/Users/juliangalluzzo/Desktop/Projects/shipstudio-plugins/plugin-ralph/src/useRalph.ts` — Reference for multi-file structure, filesystem reads via `shell.exec('cat', ...)`, and `openTerminal` for install flow. **HIGH confidence.**
- `/Users/juliangalluzzo/Desktop/Projects/shipstudio-plugins/plugin-memberstack/src/` — Reference for multi-file component structure (context.ts, types.ts, styles.ts, component files). **HIGH confidence.**
- `/Users/juliangalluzzo/Desktop/Projects/shipstudio-plugins/plugin-dependency-checker/src/index.tsx` — Confirms inline `PluginContextValue` pattern is standard when not splitting files. **HIGH confidence.**

---

*Stack research for: Ship Studio plugin development*
*Researched: 2026-02-28*
