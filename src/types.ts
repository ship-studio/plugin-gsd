// Discriminated union for all possible plugin states.
// Each phase maps 1:1 to a distinct view component.
// CRITICAL: Do NOT collapse these into booleans -- each state renders a different component.
export type PluginPhase =
  | 'loading'           // Initial detection in progress
  | 'no-project'        // Ship Studio has no project open (project === null)
  | 'gsd-not-installed' // ~/.claude/get-shit-done/ does not exist
  | 'no-planning'       // GSD installed, but project has no .planning/ directory
  | 'has-planning'      // GSD installed + .planning/ exists -- show dashboard
  | 'error';            // Detection failed with an unexpected error

// The full plugin context value (inlined, no SDK dependency).
// Sourced from plugin-starter CLAUDE.md -- authoritative reference.
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

// Return type of useGsd() hook (Phase 1 subset).
// Phase 2 will extend this with planning data and file reading.
export interface UseGsdReturn {
  phase: PluginPhase;
  loading: boolean;
  error: string | null;
  install: () => Promise<void>;
  redetect: () => Promise<void>;
}
