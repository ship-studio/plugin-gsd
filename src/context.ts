import type { PluginContextValue } from './types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const _w = window as any;

export function usePluginContext(): PluginContextValue {
  // Try React Context pattern first (newer API, plugin-starter)
  const React = _w.__SHIPSTUDIO_REACT__;
  const CtxRef = _w.__SHIPSTUDIO_PLUGIN_CONTEXT_REF__;

  if (CtxRef && React?.useContext) {
    const ctx = React.useContext(CtxRef) as PluginContextValue | null;
    if (ctx) return ctx;
  }

  // Fall back to direct window global (older API, plugin-vercel)
  const directCtx = _w.__SHIPSTUDIO_PLUGIN_CONTEXT__ as PluginContextValue | undefined;
  if (directCtx) return directCtx;

  throw new Error('Plugin context not available.');
}

// Convenience hooks -- all other files import these instead of usePluginContext() directly.
export function useShell()         { return usePluginContext().shell; }
export function useToast()         { return usePluginContext().actions.showToast; }
export function useProject()       { return usePluginContext().project; }
export function useAppActions()    { return usePluginContext().actions; }
export function useTheme()         { return usePluginContext().theme; }
export function usePluginStorage() { return usePluginContext().storage; }
