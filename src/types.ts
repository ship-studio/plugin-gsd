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

// Phase data entry parsed from ROADMAP.md and enriched by filesystem scan.
export interface PhaseData {
  number: number;          // e.g., 1 from "Phase 1" or 2.1 from "Phase 2.1"
  name: string;            // e.g., "Scaffold, Detection & Install"
  status: 'complete' | 'in-progress' | 'not-started';
  plansComplete: number;
  plansTotal: number;
  dirName: string | null;  // e.g., "01-scaffold-detection-install" (matched from filesystem)
  files: string[];         // e.g., ["01-01-PLAN.md", "01-RESEARCH.md"]
}

// Return type of useGsd() hook.
// Phase 1 fields are preserved unchanged; Phase 2 extends with planning data and file reading.
export interface UseGsdReturn {
  // Phase 1 (unchanged)
  phase: PluginPhase;
  loading: boolean;
  error: string | null;
  install: () => Promise<void>;
  redetect: () => Promise<void>;

  // Phase 2: planning data
  planningData: PhaseData[];
  planningLoading: boolean;

  // Phase 2: file viewing
  activeFile: string | null;     // relative path of file being viewed
  fileContent: string | null;    // raw content of activeFile
  fileLoading: boolean;
  readFile: (relativePath: string) => Promise<void>;
  clearFileView: () => void;

  // Phase 2: toast passthrough (for views that need it)
  showToast: (message: string, type?: 'success' | 'error') => void;

  // Phase 3: delete actions
  deleteDirectory: () => Promise<void>;
  deleteItem: (relativePath: string) => Promise<void>;
}
