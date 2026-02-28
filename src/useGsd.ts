import { useState, useRef, useCallback, useEffect } from 'react';
import { useProject, useShell, useAppActions } from './context';
import type { PluginPhase, UseGsdReturn } from './types';

/**
 * useGsd() -- core logic layer for the GSD plugin.
 *
 * Walks a sequential detection chain:
 *   1. project null guard  -->  'no-project'
 *   2. GSD global install  -->  'gsd-not-installed'
 *   3. .planning/ present  -->  'no-planning' | 'has-planning'
 *
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

  const [phase,   setPhase]   = useState<PluginPhase>('loading');
  const [loading, setLoading] = useState<boolean>(true);
  const [error,   setError]   = useState<string | null>(null);

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
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
      setPhase('error');
    } finally {
      setLoading(false);
    }
  }, [project]); // eslint-disable-line react-hooks/exhaustive-deps

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
        actionsRef.current.showToast('GSD installed successfully!', 'success');
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

  return { phase, loading, error, install, redetect: detect };
}
