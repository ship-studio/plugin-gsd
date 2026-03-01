import { useState, useRef, useCallback, useEffect } from 'react';
import { useProject, useShell, useAppActions } from './context';
import type { PhaseData, PluginPhase, UseGsdReturn } from './types';
import { parseRoadmap } from './utils/parseRoadmap';

/**
 * useGsd() -- core logic layer for the GSD plugin.
 *
 * Walks a sequential detection chain:
 *   1. project null guard  -->  'no-project'
 *   2. GSD global install  -->  'gsd-not-installed'
 *   3. .planning/ present  -->  'no-planning' | 'has-planning'
 *
 * Phase 2 extends this with planning data loading and file reading.
 * View components consume this hook's return value without making any shell
 * calls themselves.
 */
export function useGsd(): UseGsdReturn {
  const project = useProject();
  const shell   = useShell();
  const actions = useAppActions();

  // Store unstable context values in refs so that useCallback closures
  // have stable identity but always read the latest values at call time.
  const shellRef   = useRef(shell);
  shellRef.current = shell;

  const actionsRef   = useRef(actions);
  actionsRef.current = actions;

  // Phase 1 state
  const [phase,   setPhase]   = useState<PluginPhase>('loading');
  const [loading, setLoading] = useState<boolean>(true);
  const [error,   setError]   = useState<string | null>(null);
  const [installSuccess, setInstallSuccess] = useState<boolean>(false);

  // Phase 2: planning data state
  const [planningData,    setPlanningData]    = useState<PhaseData[]>([]);
  const [planningLoading, setPlanningLoading] = useState<boolean>(false);

  // Phase 2: file viewing state
  const [activeFile,  setActiveFile]  = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [fileLoading, setFileLoading] = useState<boolean>(false);

  // Race condition guard for file reads: each request gets a unique ID,
  // and results from stale requests are discarded.
  const fileReadIdRef = useRef(0);

  /**
   * loadPlanning() -- read ROADMAP.md, parse phases, scan phase directories,
   * and populate planningData. Called at end of detect() when phase is 'has-planning'.
   *
   * Manages its own planningLoading state independently of the main loading state.
   */
  const loadPlanning = useCallback(async (): Promise<void> => {
    if (project === null) return;

    setPlanningLoading(true);
    try {
      // Step 1: Read ROADMAP.md
      const roadmapResult = await shellRef.current.exec(
        'bash',
        ['-c', `cat "${project.path}/.planning/ROADMAP.md" 2>/dev/null`],
      );

      // Step 2: Parse phase data from ROADMAP.md content
      const phases = parseRoadmap(roadmapResult.stdout);

      // Step 3: List phase directories
      const dirsResult = await shellRef.current.exec(
        'bash',
        ['-c', `ls -1 "${project.path}/.planning/phases" 2>/dev/null || echo ""`],
      );

      const dirs = dirsResult.stdout
        .split('\n')
        .map(d => d.trim())
        .filter(d => d.length > 0);

      // Step 4: Match directories to phases by leading number
      for (const dir of dirs) {
        const dirMatch = dir.match(/^(\d+)-/);
        if (!dirMatch) continue;
        const dirPhaseNum = parseInt(dirMatch[1], 10);
        const matchedPhase = phases.find(
          p => Math.floor(p.number) === dirPhaseNum,
        );
        if (matchedPhase) {
          matchedPhase.dirName = dir;
        }
      }

      // Step 5: For each phase with a dirName, list its .md files
      for (const phase of phases) {
        if (!phase.dirName) continue;
        const filesResult = await shellRef.current.exec(
          'bash',
          ['-c', `ls -1 "${project.path}/.planning/phases/${phase.dirName}" 2>/dev/null || echo ""`],
        );
        const files = filesResult.stdout
          .split('\n')
          .map(f => f.trim())
          .filter(f => f.endsWith('.md'));
        phase.files = files;
      }

      setPlanningData(phases);
    } catch {
      // Defensive: planning load errors are non-fatal
      setPlanningData([]);
    } finally {
      setPlanningLoading(false);
    }
  }, [project]); // eslint-disable-line react-hooks/exhaustive-deps

  /**
   * detect() -- run the full detection chain and update state.
   *
   * Only [project] is listed as a dependency: it gates the first check and
   * provides the absolute path used in the .planning/ check.
   */
  const detect = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      // Step 1: Ship Studio must have a project open.
      if (project === null) {
        setPhase('no-project');
        return;
      }

      // Step 2: Check GSD global installation.
      // CRITICAL: use bash -c with $HOME -- tilde does NOT expand in direct
      // shell.exec args.
      const gsdCheck = await shellRef.current.exec(
        'bash',
        ['-c', 'test -d "$HOME/.claude/get-shit-done" && echo yes || echo no'],
      );

      if (gsdCheck.stdout.trim() !== 'yes' || gsdCheck.exit_code !== 0) {
        setPhase('gsd-not-installed');
        return;
      }

      // Step 3: Check project has a .planning/ directory.
      // CRITICAL: use absolute path from project.path -- CWD is not guaranteed.
      const planningCheck = await shellRef.current.exec(
        'bash',
        ['-c', `test -d "${project.path}/.planning" && echo yes || echo no`],
      );

      if (planningCheck.stdout.trim() !== 'yes') {
        setPhase('no-planning');
        return;
      }

      // All checks passed.
      setPhase('has-planning');

      // Phase 2: Load planning data immediately after detecting has-planning.
      // loadPlanning manages its own planningLoading state independently.
      void loadPlanning();
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
      setPhase('error');
    } finally {
      setLoading(false);
    }
  }, [project, loadPlanning]); // eslint-disable-line react-hooks/exhaustive-deps

  /**
   * Run detection on mount and whenever project changes.
   * The cancellation flag prevents stale state updates on rapid re-renders.
   */
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      await detect();
    };
    void run();
    return () => {
      cancelled = true;
    };
    // `cancelled` is intentionally declared but only checked in Phase 2
    // when intermediate async awaits are added between state updates.
    void cancelled;
  }, [detect]);

  /**
   * install() -- open an interactive terminal to run the GSD installer,
   * then re-check the filesystem to determine outcome.
   */
  const install = useCallback(async (): Promise<void> => {
    setLoading(true);
    try {
      // Open an interactive terminal session for the installer.
      // The Promise resolves when the terminal window is closed by the user.
      await actionsRef.current.openTerminal(
        'npx',
        ['get-shit-done-cc@latest'],
        { title: 'Install GSD' },
      );

      // CRITICAL: do NOT assume success. The user may have closed the terminal
      // early. Always re-check the filesystem.
      const postCheck = await shellRef.current.exec(
        'bash',
        ['-c', 'test -d "$HOME/.claude/get-shit-done" && echo yes || echo no'],
      );

      if (postCheck.stdout.trim() === 'yes') {
        setInstallSuccess(true);
        await detect();
      } else {
        actionsRef.current.showToast('GSD installation was not completed', 'error');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      actionsRef.current.showToast('Failed to open installer terminal', 'error');
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [detect]);

  /**
   * readFile() -- read a file at the given relative path (relative to project root).
   * Uses a request ID guard to discard stale results from concurrent reads.
   */
  const readFile = useCallback(async (relativePath: string): Promise<void> => {
    if (project === null) return;

    // Increment and capture request ID for stale-result detection
    fileReadIdRef.current += 1;
    const requestId = fileReadIdRef.current;

    setFileLoading(true);
    setActiveFile(null);
    setFileContent(null);

    try {
      const result = await shellRef.current.exec(
        'bash',
        ['-c', `cat "${project.path}/${relativePath}" 2>/dev/null`],
        { timeout: 10000 },
      );

      // Guard against stale request
      if (requestId !== fileReadIdRef.current) return;

      if (result.exit_code !== 0 || result.stdout.trim() === '') {
        actionsRef.current.showToast('Could not read file', 'error');
        return;
      }

      setActiveFile(relativePath);
      setFileContent(result.stdout);
    } catch {
      if (requestId !== fileReadIdRef.current) return;
      actionsRef.current.showToast('Failed to read file', 'error');
    } finally {
      // Only clear loading if this is still the active request
      if (requestId === fileReadIdRef.current) {
        setFileLoading(false);
      }
    }
  }, [project]); // eslint-disable-line react-hooks/exhaustive-deps

  /**
   * clearFileView() -- reset file viewing state, returning to the overview.
   */
  const clearFileView = useCallback((): void => {
    setActiveFile(null);
    setFileContent(null);
  }, []);

  /**
   * deleteDirectory() -- delete the entire .planning/ directory for the current project.
   * Calls detect() afterwards to transition phase to 'no-planning'.
   */
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
      await detect();
    } catch {
      actionsRef.current.showToast('Failed to delete .planning/ directory', 'error');
    }
  }, [project, detect]); // eslint-disable-line react-hooks/exhaustive-deps

  /**
   * deleteItem() -- delete an individual file or directory within .planning/.
   * Validates the path, calls loadPlanning() afterwards to refresh the dashboard.
   */
  const deleteItem = useCallback(async (relativePath: string): Promise<void> => {
    if (project === null) return;
    if (!relativePath.startsWith('.planning/')) {
      actionsRef.current.showToast('Invalid path', 'error');
      return;
    }
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
      await loadPlanning();
    } catch {
      actionsRef.current.showToast(`Failed to delete ${relativePath}`, 'error');
    }
  }, [project, loadPlanning]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    // Phase 1
    phase,
    loading,
    error,
    install,
    redetect: detect,
    installSuccess,
    dismissInstallSuccess: () => setInstallSuccess(false),
    // Phase 2: planning data
    planningData,
    planningLoading,
    // Phase 2: file viewing
    activeFile,
    fileContent,
    fileLoading,
    readFile,
    clearFileView,
    // Phase 2: toast passthrough
    showToast: actionsRef.current.showToast,
    // Phase 3: delete actions
    deleteDirectory,
    deleteItem,
  };
}
