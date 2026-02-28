import { jsxs, jsx, Fragment } from "data:text/javascript,const R=window.__SHIPSTUDIO_REACT__;function jsx(t,p,k){const{children:c,...r}=p;if(k!==undefined)r.key=k;return c!==undefined?Array.isArray(c)?R.createElement(t,r,...c):R.createElement(t,r,c):R.createElement(t,r)}export{jsx,jsx as jsxs};export const Fragment=R.Fragment;";
import React, { useRef, useState, useCallback, useEffect } from "data:text/javascript,export default window.__SHIPSTUDIO_REACT__;export const useState=window.__SHIPSTUDIO_REACT__.useState;export const useEffect=window.__SHIPSTUDIO_REACT__.useEffect;export const useCallback=window.__SHIPSTUDIO_REACT__.useCallback;export const useMemo=window.__SHIPSTUDIO_REACT__.useMemo;export const useRef=window.__SHIPSTUDIO_REACT__.useRef;export const useContext=window.__SHIPSTUDIO_REACT__.useContext;export const createElement=window.__SHIPSTUDIO_REACT__.createElement;export const Fragment=window.__SHIPSTUDIO_REACT__.Fragment;";
const STYLE_ID = "gsd-plugin-styles";
const PLUGIN_CSS = `
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

/* Progress bar */
.gsd-progress-bar { width: 100%; height: 6px; border-radius: 3px; background: var(--bg-tertiary); margin-bottom: 16px; overflow: hidden; }
.gsd-progress-fill { height: 100%; border-radius: 3px; background: var(--action); transition: width 0.3s ease; }
.gsd-progress-label { font-size: 12px; color: var(--text-muted); margin-bottom: 6px; }

/* Phase rows */
.gsd-phase-row { display: flex; align-items: center; gap: 8px; padding: 8px 8px; cursor: pointer; border: 1px solid var(--border); border-radius: 6px; margin-bottom: 6px; transition: background 0.1s; }
.gsd-phase-row:hover { background: var(--bg-secondary); }
.gsd-phase-chevron { flex-shrink: 0; font-size: 8px; color: var(--text-muted); width: 12px; transition: transform 0.15s; }
.gsd-phase-chevron-open { transform: rotate(90deg); }
.gsd-phase-name { flex: 1; font-weight: 500; font-size: 13px; }
.gsd-phase-plans { font-size: 11px; color: var(--text-muted); flex-shrink: 0; }

/* Status badge */
.gsd-status-badge { font-size: 10px; font-weight: 500; padding: 2px 7px; border-radius: 4px; flex-shrink: 0; letter-spacing: 0; }
.gsd-badge-complete { background: color-mix(in srgb, var(--success) 15%, transparent); color: var(--success); }
.gsd-badge-in-progress { background: color-mix(in srgb, var(--action) 15%, transparent); color: var(--action); }
.gsd-badge-not-started { background: var(--bg-tertiary); color: var(--text-muted); }

/* File list (accordion body) */
.gsd-file-list { padding: 4px 0 4px 22px; }
.gsd-file-item { display: flex; align-items: center; gap: 6px; padding: 4px 8px; font-size: 12px; cursor: pointer; border-radius: 4px; color: var(--text-secondary); }
.gsd-file-item:hover { background: var(--bg-tertiary); color: var(--text-primary); }

/* File viewer */
.gsd-file-viewer-header { display: flex; align-items: center; gap: 8px; margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px solid var(--border); }
.gsd-file-viewer-breadcrumb { flex: 1; font-size: 12px; color: var(--text-secondary); font-weight: 500; }
.gsd-file-viewer-copy { font-size: 11px; padding: 2px 8px; border-radius: 4px; border: 1px solid var(--border); background: var(--bg-tertiary); color: var(--text-secondary); cursor: pointer; }
.gsd-file-viewer-copy:hover { color: var(--text-primary); }
.gsd-file-viewer-content { font-size: 13px; line-height: 1.6; }

/* Tabs */
.gsd-tabs { display: flex; gap: 2px; background: var(--bg-tertiary); border-radius: 6px; padding: 2px; }
.gsd-tab { padding: 4px 12px; font-size: 12px; font-weight: 500; color: var(--text-muted); background: transparent; border: none; border-radius: 4px; cursor: pointer; transition: color 0.15s, background 0.15s; }
.gsd-tab:hover { color: var(--text-secondary); }
.gsd-tab-active { color: var(--text-primary); background: var(--bg-secondary); }

/* Guide view */
.gsd-guide-intro { font-size: 13px; color: var(--text-secondary); line-height: 1.6; margin-bottom: 20px; }
.gsd-guide-section-title { font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: var(--text-muted); margin: 20px 0 10px; }
.gsd-guide-step { display: flex; align-items: flex-start; gap: 10px; padding: 8px 0; }
.gsd-guide-step-number { width: 22px; height: 22px; border-radius: 50%; background: var(--action); color: var(--action-text); font-size: 11px; font-weight: 700; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.gsd-guide-step-body { flex: 1; }
.gsd-guide-command { font-family: monospace; font-size: 12px; background: var(--bg-tertiary); padding: 2px 8px; border-radius: 4px; cursor: pointer; display: inline-block; margin-bottom: 2px; border: 1px solid var(--border); }
.gsd-guide-command:hover { background: var(--bg-secondary); border-color: var(--text-muted); }
.gsd-guide-desc { font-size: 12px; color: var(--text-secondary); }

/* Delete buttons (hover-reveal on phase rows and file items) */
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

/* Confirm dialog (inline in modal body) */
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

/* Delete all button (bottom of overview) */
.gsd-delete-all-section {
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid var(--border);
  display: flex;
  justify-content: center;
}
`;
const _w = window;
function usePluginContext() {
  const React2 = _w.__SHIPSTUDIO_REACT__;
  const CtxRef = _w.__SHIPSTUDIO_PLUGIN_CONTEXT_REF__;
  if (CtxRef && (React2 == null ? void 0 : React2.useContext)) {
    const ctx = React2.useContext(CtxRef);
    if (ctx) return ctx;
  }
  const directCtx = _w.__SHIPSTUDIO_PLUGIN_CONTEXT__;
  if (directCtx) return directCtx;
  throw new Error("Plugin context not available.");
}
function useShell() {
  return usePluginContext().shell;
}
function useProject() {
  return usePluginContext().project;
}
function useAppActions() {
  return usePluginContext().actions;
}
function parseRoadmap(content) {
  try {
    if (!content || content.trim() === "") return [];
    const bulletRegex = /^- \[([ x])\] \*\*Phase (\d+(?:\.\d+)?): ([^*]+)\*\*/gm;
    const bullets = [];
    let match;
    while ((match = bulletRegex.exec(content)) !== null) {
      bullets.push({
        checked: match[1] === "x",
        number: parseFloat(match[2]),
        name: match[3].trim()
      });
    }
    if (bullets.length === 0) return [];
    const tableRegex = /^\|\s*(\d+(?:\.\d+)?)\.\s*[^|]+\|\s*(\d+)\/(\d+)\s*\|\s*([^|]+)\|/gm;
    const tableData = /* @__PURE__ */ new Map();
    while ((match = tableRegex.exec(content)) !== null) {
      const num = parseFloat(match[1]);
      tableData.set(num, {
        plansComplete: parseInt(match[2], 10),
        plansTotal: parseInt(match[3], 10)
      });
    }
    const phases = bullets.map((bullet) => {
      const table = tableData.get(bullet.number);
      const plansComplete = (table == null ? void 0 : table.plansComplete) ?? 0;
      const plansTotal = (table == null ? void 0 : table.plansTotal) ?? 0;
      let status;
      if (bullet.checked) {
        status = "complete";
      } else if (plansComplete > 0) {
        status = "in-progress";
      } else {
        status = "not-started";
      }
      return {
        number: bullet.number,
        name: bullet.name,
        status,
        plansComplete,
        plansTotal,
        dirName: null,
        // filled in by useGsd after filesystem scan
        files: []
        // filled in by useGsd after filesystem scan
      };
    });
    return phases;
  } catch {
    return [];
  }
}
function useGsd() {
  const project = useProject();
  const shell = useShell();
  const actions = useAppActions();
  const shellRef = useRef(shell);
  shellRef.current = shell;
  const actionsRef = useRef(actions);
  actionsRef.current = actions;
  const [phase, setPhase] = useState("loading");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [planningData, setPlanningData] = useState([]);
  const [planningLoading, setPlanningLoading] = useState(false);
  const [activeFile, setActiveFile] = useState(null);
  const [fileContent, setFileContent] = useState(null);
  const [fileLoading, setFileLoading] = useState(false);
  const fileReadIdRef = useRef(0);
  const loadPlanning = useCallback(async () => {
    if (project === null) return;
    setPlanningLoading(true);
    try {
      const roadmapResult = await shellRef.current.exec(
        "bash",
        ["-c", `cat "${project.path}/.planning/ROADMAP.md" 2>/dev/null`]
      );
      const phases = parseRoadmap(roadmapResult.stdout);
      const dirsResult = await shellRef.current.exec(
        "bash",
        ["-c", `ls -1 "${project.path}/.planning/phases" 2>/dev/null || echo ""`]
      );
      const dirs = dirsResult.stdout.split("\n").map((d) => d.trim()).filter((d) => d.length > 0);
      for (const dir of dirs) {
        const dirMatch = dir.match(/^(\d+)-/);
        if (!dirMatch) continue;
        const dirPhaseNum = parseInt(dirMatch[1], 10);
        const matchedPhase = phases.find(
          (p) => Math.floor(p.number) === dirPhaseNum
        );
        if (matchedPhase) {
          matchedPhase.dirName = dir;
        }
      }
      for (const phase2 of phases) {
        if (!phase2.dirName) continue;
        const filesResult = await shellRef.current.exec(
          "bash",
          ["-c", `ls -1 "${project.path}/.planning/phases/${phase2.dirName}" 2>/dev/null || echo ""`]
        );
        const files = filesResult.stdout.split("\n").map((f) => f.trim()).filter((f) => f.endsWith(".md"));
        phase2.files = files;
      }
      setPlanningData(phases);
    } catch {
      setPlanningData([]);
    } finally {
      setPlanningLoading(false);
    }
  }, [project]);
  const detect = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (project === null) {
        setPhase("no-project");
        return;
      }
      const gsdCheck = await shellRef.current.exec(
        "bash",
        ["-c", 'test -d "$HOME/.claude/get-shit-done" && echo yes || echo no']
      );
      if (gsdCheck.stdout.trim() !== "yes" || gsdCheck.exit_code !== 0) {
        setPhase("gsd-not-installed");
        return;
      }
      const planningCheck = await shellRef.current.exec(
        "bash",
        ["-c", `test -d "${project.path}/.planning" && echo yes || echo no`]
      );
      if (planningCheck.stdout.trim() !== "yes") {
        setPhase("no-planning");
        return;
      }
      setPhase("has-planning");
      void loadPlanning();
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
      setPhase("error");
    } finally {
      setLoading(false);
    }
  }, [project, loadPlanning]);
  useEffect(() => {
    const run = async () => {
      await detect();
    };
    void run();
    return () => {
    };
  }, [detect]);
  const install = useCallback(async () => {
    setLoading(true);
    try {
      await actionsRef.current.openTerminal(
        "npx",
        ["get-shit-done-cc@latest"],
        { title: "Install GSD" }
      );
      const postCheck = await shellRef.current.exec(
        "bash",
        ["-c", 'test -d "$HOME/.claude/get-shit-done" && echo yes || echo no']
      );
      if (postCheck.stdout.trim() === "yes") {
        actionsRef.current.showToast("GSD installed successfully!", "success");
        await detect();
      } else {
        actionsRef.current.showToast("GSD installation was not completed", "error");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      actionsRef.current.showToast("Failed to open installer terminal", "error");
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [detect]);
  const readFile = useCallback(async (relativePath) => {
    if (project === null) return;
    fileReadIdRef.current += 1;
    const requestId = fileReadIdRef.current;
    setFileLoading(true);
    setActiveFile(null);
    setFileContent(null);
    try {
      const result = await shellRef.current.exec(
        "bash",
        ["-c", `cat "${project.path}/${relativePath}" 2>/dev/null`],
        { timeout: 1e4 }
      );
      if (requestId !== fileReadIdRef.current) return;
      if (result.exit_code !== 0 || result.stdout.trim() === "") {
        actionsRef.current.showToast("Could not read file", "error");
        return;
      }
      setActiveFile(relativePath);
      setFileContent(result.stdout);
    } catch {
      if (requestId !== fileReadIdRef.current) return;
      actionsRef.current.showToast("Failed to read file", "error");
    } finally {
      if (requestId === fileReadIdRef.current) {
        setFileLoading(false);
      }
    }
  }, [project]);
  const clearFileView = useCallback(() => {
    setActiveFile(null);
    setFileContent(null);
  }, []);
  const deleteDirectory = useCallback(async () => {
    if (project === null) return;
    try {
      const result = await shellRef.current.exec(
        "bash",
        ["-c", `rm -rf "${project.path}/.planning"`]
      );
      if (result.exit_code !== 0) {
        actionsRef.current.showToast("Failed to delete .planning/ directory", "error");
        return;
      }
      actionsRef.current.showToast("Deleted .planning/ directory", "success");
      await detect();
    } catch {
      actionsRef.current.showToast("Failed to delete .planning/ directory", "error");
    }
  }, [project, detect]);
  const deleteItem = useCallback(async (relativePath) => {
    if (project === null) return;
    if (!relativePath.startsWith(".planning/")) {
      actionsRef.current.showToast("Invalid path", "error");
      return;
    }
    try {
      const result = await shellRef.current.exec(
        "bash",
        ["-c", `rm -rf "${project.path}/${relativePath}"`]
      );
      if (result.exit_code !== 0) {
        actionsRef.current.showToast(`Failed to delete ${relativePath}`, "error");
        return;
      }
      actionsRef.current.showToast(`Deleted ${relativePath}`, "success");
      await loadPlanning();
    } catch {
      actionsRef.current.showToast(`Failed to delete ${relativePath}`, "error");
    }
  }, [project, loadPlanning]);
  return {
    // Phase 1
    phase,
    loading,
    error,
    install,
    redetect: detect,
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
    deleteItem
  };
}
function InstallView({ gsd }) {
  return /* @__PURE__ */ jsxs("div", { children: [
    /* @__PURE__ */ jsx("h3", { children: "GSD Not Installed" }),
    /* @__PURE__ */ jsx("p", { style: { color: "var(--text-secondary)", marginBottom: 16, fontSize: 13 }, children: "Get Shit Done (GSD) is a planning system for Claude Code projects. Install it to start managing your project plans from Ship Studio." }),
    /* @__PURE__ */ jsx(
      "button",
      {
        className: "gsd-btn gsd-btn-primary",
        onClick: () => void gsd.install(),
        disabled: gsd.loading,
        children: gsd.loading ? "Installing..." : "Install GSD"
      }
    ),
    gsd.error && /* @__PURE__ */ jsx("div", { className: "gsd-error-state", style: { marginTop: 8 }, children: gsd.error })
  ] });
}
function NoProjectView() {
  return /* @__PURE__ */ jsxs("div", { children: [
    /* @__PURE__ */ jsx("h3", { children: "No Project Open" }),
    /* @__PURE__ */ jsx("p", { style: { color: "var(--text-secondary)", fontSize: 13 }, children: "Open a project in Ship Studio to use the GSD plugin." })
  ] });
}
function ConfirmDialog({ friction, targetLabel, onConfirm, onCancel, isDeleting }) {
  const title = friction === "high" ? "Delete all plans?" : "Delete this item?";
  const body = friction === "high" ? /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx("strong", { children: targetLabel }),
    " and all its contents will be permanently deleted. This cannot be undone. All phases, plans, research, and context will be lost."
  ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx("strong", { children: targetLabel }),
    " will be permanently deleted. This cannot be undone."
  ] });
  return /* @__PURE__ */ jsxs("div", { className: "gsd-confirm-dialog", children: [
    /* @__PURE__ */ jsx("div", { className: "gsd-confirm-title", children: title }),
    /* @__PURE__ */ jsx("div", { className: "gsd-confirm-body", children: body }),
    /* @__PURE__ */ jsxs("div", { className: "gsd-confirm-actions", children: [
      /* @__PURE__ */ jsx(
        "button",
        {
          className: "gsd-btn gsd-btn-secondary",
          onClick: onCancel,
          disabled: isDeleting,
          children: "Cancel"
        }
      ),
      /* @__PURE__ */ jsx(
        "button",
        {
          className: "gsd-btn gsd-btn-danger",
          onClick: onConfirm,
          disabled: isDeleting,
          children: isDeleting ? "Deleting..." : "Delete"
        }
      )
    ] })
  ] });
}
function OverviewView({ gsd }) {
  const [expandedPhases, setExpandedPhases] = useState(/* @__PURE__ */ new Set());
  const [confirmState, setConfirmState] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  async function handleConfirm() {
    setIsDeleting(true);
    try {
      if ((confirmState == null ? void 0 : confirmState.type) === "full") {
        await gsd.deleteDirectory();
      } else if ((confirmState == null ? void 0 : confirmState.type) === "item") {
        await gsd.deleteItem(confirmState.path);
      }
      setConfirmState(null);
    } finally {
      setIsDeleting(false);
    }
  }
  function togglePhase(index) {
    const next = new Set(expandedPhases);
    if (next.has(index)) {
      next.delete(index);
    } else {
      next.add(index);
    }
    setExpandedPhases(next);
  }
  const totalPhases = gsd.planningData.length;
  const completedPhases = gsd.planningData.filter((p) => p.status === "complete").length;
  const progressPct = totalPhases > 0 ? Math.round(completedPhases / totalPhases * 100) : 0;
  if (confirmState !== null) {
    return /* @__PURE__ */ jsx(
      ConfirmDialog,
      {
        friction: confirmState.type === "full" ? "high" : "low",
        targetLabel: confirmState.type === "full" ? ".planning/" : confirmState.label,
        onConfirm: handleConfirm,
        onCancel: () => setConfirmState(null),
        isDeleting
      }
    );
  }
  return /* @__PURE__ */ jsxs("div", { children: [
    totalPhases > 0 && /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsxs("div", { className: "gsd-progress-label", children: [
        "Phase ",
        completedPhases,
        " of ",
        totalPhases,
        " — ",
        progressPct,
        "% complete"
      ] }),
      /* @__PURE__ */ jsx("div", { className: "gsd-progress-bar", children: /* @__PURE__ */ jsx(
        "div",
        {
          className: "gsd-progress-fill",
          style: { width: `${progressPct}%` }
        }
      ) })
    ] }),
    gsd.planningLoading && /* @__PURE__ */ jsx("div", { className: "gsd-loading-indicator", children: "Loading plans..." }),
    !gsd.planningLoading && gsd.planningData.length === 0 && /* @__PURE__ */ jsx("div", { style: { color: "var(--text-muted)", fontSize: 12 }, children: "No phases found in ROADMAP.md" }),
    gsd.planningData.map((phase, index) => {
      const isExpanded = expandedPhases.has(index);
      let badgeClass;
      let badgeLabel;
      if (phase.status === "complete") {
        badgeClass = "gsd-badge-complete";
        badgeLabel = "Complete";
      } else if (phase.status === "in-progress") {
        badgeClass = "gsd-badge-in-progress";
        badgeLabel = "In progress";
      } else {
        badgeClass = "gsd-badge-not-started";
        badgeLabel = "Not started";
      }
      return /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsxs(
          "div",
          {
            className: "gsd-phase-row",
            onClick: () => togglePhase(index),
            role: "button",
            "aria-expanded": isExpanded,
            children: [
              /* @__PURE__ */ jsx("span", { className: `gsd-phase-chevron${isExpanded ? " gsd-phase-chevron-open" : ""}`, children: "▶" }),
              /* @__PURE__ */ jsx("span", { className: "gsd-phase-name", children: phase.name }),
              /* @__PURE__ */ jsx("span", { className: `gsd-status-badge ${badgeClass}`, children: badgeLabel }),
              /* @__PURE__ */ jsxs("span", { className: "gsd-phase-plans", children: [
                phase.plansComplete,
                "/",
                phase.plansTotal
              ] }),
              phase.dirName !== null && /* @__PURE__ */ jsx(
                "button",
                {
                  className: "gsd-delete-btn",
                  title: `Delete ${phase.dirName}`,
                  onClick: (e) => {
                    e.stopPropagation();
                    const dirName = phase.dirName;
                    setConfirmState({
                      type: "item",
                      path: `.planning/phases/${dirName}`,
                      label: dirName
                    });
                  },
                  children: "Delete"
                }
              )
            ]
          }
        ),
        isExpanded && /* @__PURE__ */ jsx("div", { className: "gsd-file-list", children: phase.dirName === null || phase.files.length === 0 ? /* @__PURE__ */ jsx("div", { className: "gsd-phase-plans", style: { padding: "4px 8px" }, children: "No files found" }) : phase.files.map((fileName) => /* @__PURE__ */ jsxs(
          "div",
          {
            className: "gsd-file-item",
            onClick: () => void gsd.readFile(
              `.planning/phases/${phase.dirName}/${fileName}`
            ),
            role: "button",
            children: [
              fileName,
              /* @__PURE__ */ jsx(
                "button",
                {
                  className: "gsd-delete-btn",
                  title: `Delete ${fileName}`,
                  onClick: (e) => {
                    e.stopPropagation();
                    setConfirmState({
                      type: "item",
                      path: `.planning/phases/${phase.dirName}/${fileName}`,
                      label: fileName
                    });
                  },
                  children: "Delete"
                }
              )
            ]
          },
          fileName
        )) })
      ] }, phase.number);
    }),
    gsd.planningData.length > 0 && /* @__PURE__ */ jsx("div", { className: "gsd-delete-all-section", children: /* @__PURE__ */ jsx(
      "button",
      {
        className: "gsd-btn gsd-btn-danger",
        style: { fontSize: 12 },
        onClick: () => setConfirmState({ type: "full" }),
        children: "Delete all plans"
      }
    ) })
  ] });
}
function inlineMarkdown(text, baseKey) {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return React.createElement("strong", { key: `${baseKey}-b${i}` }, part.slice(2, -2));
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return React.createElement("code", {
        key: `${baseKey}-c${i}`,
        style: {
          background: "var(--bg-tertiary)",
          padding: "1px 4px",
          borderRadius: "3px",
          fontFamily: "monospace",
          fontSize: "11px"
        }
      }, part.slice(1, -1));
    }
    return part;
  });
}
function renderMarkdown(content) {
  try {
    const lines = content.split("\n");
    const elements = [];
    let i = 0;
    while (i < lines.length) {
      const line = lines[i];
      if (line.trim().startsWith("```")) {
        const codeLines = [];
        i++;
        while (i < lines.length && !lines[i].trim().startsWith("```")) {
          codeLines.push(lines[i]);
          i++;
        }
        i++;
        elements.push(
          React.createElement(
            "pre",
            {
              key: `line-${i}`,
              style: {
                background: "var(--bg-tertiary)",
                fontFamily: "monospace",
                fontSize: "11px",
                borderRadius: "6px",
                padding: "12px",
                overflowX: "auto",
                margin: "8px 0"
              }
            },
            React.createElement("code", null, codeLines.join("\n"))
          )
        );
        continue;
      }
      if (/^# /.test(line)) {
        elements.push(
          React.createElement(
            "h1",
            {
              key: `line-${i}`,
              style: {
                color: "var(--text-primary)",
                fontSize: "18px",
                fontWeight: 700,
                margin: "16px 0 8px",
                lineHeight: 1.3
              }
            },
            inlineMarkdown(line.slice(2), `line-${i}`)
          )
        );
        i++;
        continue;
      }
      if (/^## /.test(line)) {
        elements.push(
          React.createElement(
            "h2",
            {
              key: `line-${i}`,
              style: {
                color: "var(--text-primary)",
                fontSize: "15px",
                fontWeight: 600,
                margin: "14px 0 6px",
                lineHeight: 1.3
              }
            },
            inlineMarkdown(line.slice(3), `line-${i}`)
          )
        );
        i++;
        continue;
      }
      if (/^### /.test(line)) {
        elements.push(
          React.createElement(
            "h3",
            {
              key: `line-${i}`,
              style: {
                color: "var(--text-primary)",
                fontSize: "13px",
                fontWeight: 600,
                margin: "12px 0 4px",
                lineHeight: 1.3
              }
            },
            inlineMarkdown(line.slice(4), `line-${i}`)
          )
        );
        i++;
        continue;
      }
      if (/^[-*] /.test(line)) {
        elements.push(
          React.createElement(
            "div",
            {
              key: `line-${i}`,
              style: {
                display: "flex",
                gap: "6px",
                padding: "2px 0",
                color: "var(--text-primary)"
              }
            },
            React.createElement("span", { style: { flexShrink: 0 } }, "•"),
            React.createElement("span", null, inlineMarkdown(line.slice(2), `line-${i}`))
          )
        );
        i++;
        continue;
      }
      const orderedMatch = line.match(/^(\d+)\. (.+)/);
      if (orderedMatch) {
        elements.push(
          React.createElement(
            "div",
            {
              key: `line-${i}`,
              style: {
                display: "flex",
                gap: "6px",
                padding: "2px 0",
                color: "var(--text-primary)"
              }
            },
            React.createElement(
              "span",
              { style: { flexShrink: 0, minWidth: "20px" } },
              `${orderedMatch[1]}.`
            ),
            React.createElement("span", null, inlineMarkdown(orderedMatch[2], `line-${i}`))
          )
        );
        i++;
        continue;
      }
      if (/^---+$/.test(line.trim())) {
        elements.push(
          React.createElement("hr", {
            key: `line-${i}`,
            style: {
              borderTop: "1px solid var(--border)",
              borderBottom: "none",
              margin: "12px 0"
            }
          })
        );
        i++;
        continue;
      }
      if (/^\|/.test(line)) {
        if (/^\|[\s\-|:]+\|$/.test(line)) {
          i++;
          continue;
        }
        const cells = line.split("|").slice(1, -1).map((c) => c.trim());
        elements.push(
          React.createElement(
            "div",
            {
              key: `line-${i}`,
              style: {
                display: "flex",
                gap: "16px",
                padding: "3px 0",
                fontSize: "12px",
                color: "var(--text-secondary)"
              }
            },
            cells.map(
              (cell, ci) => React.createElement(
                "span",
                { key: `cell-${ci}`, style: { flex: 1 } },
                inlineMarkdown(cell, `line-${i}-cell-${ci}`)
              )
            )
          )
        );
        i++;
        continue;
      }
      if (line.trim() === "") {
        elements.push(
          React.createElement("div", {
            key: `line-${i}`,
            style: { height: "8px" }
          })
        );
        i++;
        continue;
      }
      elements.push(
        React.createElement(
          "p",
          {
            key: `line-${i}`,
            style: {
              color: "var(--text-primary)",
              margin: "0 0 4px"
            }
          },
          inlineMarkdown(line, `line-${i}`)
        )
      );
      i++;
    }
    return React.createElement(React.Fragment, null, ...elements);
  } catch (_err) {
    return React.createElement(
      "pre",
      {
        style: {
          fontFamily: "monospace",
          fontSize: "11px",
          whiteSpace: "pre-wrap",
          color: "var(--text-primary)"
        }
      },
      content
    );
  }
}
function parseBreadcrumb(filePath) {
  const segments = filePath.split("/");
  const filename = segments[segments.length - 1];
  const phasesDirIndex = segments.indexOf("phases");
  if (phasesDirIndex !== -1 && phasesDirIndex + 1 < segments.length) {
    const phaseDirName = segments[phasesDirIndex + 1];
    const match = phaseDirName.match(/^(\d+)-/);
    if (match) {
      const phaseNum = parseInt(match[1], 10);
      return `Phase ${phaseNum} > ${filename}`;
    }
  }
  return filename;
}
function FileViewer({ gsd }) {
  const breadcrumb = gsd.activeFile ? parseBreadcrumb(gsd.activeFile) : "";
  function handleCopyPath() {
    if (!gsd.activeFile) return;
    navigator.clipboard.writeText(gsd.activeFile).then(
      () => gsd.showToast("Path copied to clipboard", "success"),
      () => gsd.showToast("Failed to copy path", "error")
    );
  }
  return React.createElement(
    "div",
    null,
    // Header row
    React.createElement(
      "div",
      { className: "gsd-file-viewer-header" },
      // Back button
      React.createElement(
        "button",
        {
          className: "gsd-btn gsd-btn-secondary",
          onClick: () => gsd.clearFileView()
        },
        "← Back"
      ),
      // Breadcrumb
      React.createElement(
        "span",
        { className: "gsd-file-viewer-breadcrumb" },
        breadcrumb
      ),
      // Copy-path button
      React.createElement(
        "button",
        {
          className: "gsd-file-viewer-copy",
          onClick: handleCopyPath,
          title: "Copy file path"
        },
        "Copy path"
      )
    ),
    // Loading state
    gsd.fileLoading && React.createElement(
      "div",
      { className: "gsd-loading-indicator" },
      "Loading file…"
    ),
    // Content body
    !gsd.fileLoading && gsd.fileContent !== null && React.createElement(
      "div",
      { className: "gsd-file-viewer-content" },
      renderMarkdown(gsd.fileContent)
    ),
    // Error state: active file set but no content loaded
    !gsd.fileLoading && gsd.fileContent === null && gsd.activeFile !== null && React.createElement(
      "div",
      { className: "gsd-error-state" },
      "Could not load file."
    )
  );
}
const CORE_STEPS = [
  { command: "/gsd:new-project", description: "Set up a new project with requirements and roadmap" },
  { command: "/gsd:discuss-phase", description: "Discuss implementation decisions for the next phase" },
  { command: "/gsd:plan-phase", description: "Create executable plans with task breakdown" },
  { command: "/gsd:execute-phase", description: "Run plans to build the phase" },
  { command: "/gsd:verify-phase", description: "Verify all must-haves are met" }
];
const UTILITY_COMMANDS = [
  { command: "/gsd:progress", description: "Check overall project progress" },
  { command: "/gsd:research-phase", description: "Deep research before planning" },
  { command: "/gsd:debug", description: "Debug issues in the current phase" },
  { command: "/gsd:add-todo", description: "Add a todo to the project backlog" }
];
function GuideView({ showToast }) {
  const handleCopy = (command) => {
    navigator.clipboard.writeText(command).then(
      () => showToast(`Copied ${command}`, "success"),
      () => showToast("Failed to copy", "error")
    );
  };
  return /* @__PURE__ */ jsxs("div", { children: [
    /* @__PURE__ */ jsxs("p", { className: "gsd-guide-intro", children: [
      "Get Shit Done (GSD) is a structured planning system for Claude Code projects. It breaks work into phases with discussion, planning, execution, and verification steps. Start by running ",
      /* @__PURE__ */ jsx("code", { children: "/gsd:new-project" }),
      " in Claude Code to set up your project."
    ] }),
    /* @__PURE__ */ jsx("div", { className: "gsd-guide-section-title", children: "Core Workflow" }),
    CORE_STEPS.map((step, index) => /* @__PURE__ */ jsxs("div", { className: "gsd-guide-step", children: [
      /* @__PURE__ */ jsx("div", { className: "gsd-guide-step-number", children: index + 1 }),
      /* @__PURE__ */ jsxs("div", { className: "gsd-guide-step-body", children: [
        /* @__PURE__ */ jsx(
          "div",
          {
            className: "gsd-guide-command",
            onClick: () => handleCopy(step.command),
            role: "button",
            title: "Click to copy",
            children: step.command
          }
        ),
        /* @__PURE__ */ jsx("div", { className: "gsd-guide-desc", children: step.description })
      ] })
    ] }, step.command)),
    /* @__PURE__ */ jsx("div", { className: "gsd-guide-section-title", children: "Utility Commands" }),
    UTILITY_COMMANDS.map((item) => /* @__PURE__ */ jsxs("div", { className: "gsd-guide-step", children: [
      /* @__PURE__ */ jsx("div", { className: "gsd-guide-step-number", style: { background: "var(--bg-tertiary)", color: "var(--text-muted)" }, children: "—" }),
      /* @__PURE__ */ jsxs("div", { className: "gsd-guide-step-body", children: [
        /* @__PURE__ */ jsx(
          "div",
          {
            className: "gsd-guide-command",
            onClick: () => handleCopy(item.command),
            role: "button",
            title: "Click to copy",
            children: item.command
          }
        ),
        /* @__PURE__ */ jsx("div", { className: "gsd-guide-desc", children: item.description })
      ] })
    ] }, item.command))
  ] });
}
function useInjectStyles() {
  useEffect(() => {
    const existing = document.getElementById(STYLE_ID);
    if (existing) {
      existing.textContent = PLUGIN_CSS;
      return;
    }
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = PLUGIN_CSS;
    document.head.appendChild(style);
    return () => {
      var _a;
      (_a = document.getElementById(STYLE_ID)) == null ? void 0 : _a.remove();
    };
  }, []);
}
function renderDashboardContent(gsd) {
  switch (gsd.phase) {
    case "loading":
      return /* @__PURE__ */ jsx("div", { className: "gsd-loading-indicator", children: "Checking GSD status..." });
    case "no-project":
      return /* @__PURE__ */ jsx(NoProjectView, {});
    case "gsd-not-installed":
      return /* @__PURE__ */ jsx(InstallView, { gsd });
    case "no-planning":
      return /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h3", { children: "No Planning Directory" }),
        /* @__PURE__ */ jsxs("p", { style: { color: "var(--text-secondary)", fontSize: 13 }, children: [
          "GSD is installed but this project has no .planning/ directory. Run",
          " ",
          /* @__PURE__ */ jsx("code", { children: "/gsd:new-project" }),
          " in Claude Code to start planning."
        ] })
      ] });
    case "has-planning":
      return /* @__PURE__ */ jsx(OverviewView, { gsd });
    case "error":
      return /* @__PURE__ */ jsxs("div", { className: "gsd-error-state", children: [
        "Error: ",
        gsd.error
      ] });
  }
}
function ToolbarButton() {
  const [modalOpen, setModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");
  const gsd = useGsd();
  useInjectStyles();
  useEffect(() => {
    if (modalOpen) {
      setActiveTab(
        gsd.phase === "gsd-not-installed" || gsd.phase === "no-project" ? "guide" : "dashboard"
      );
      void gsd.redetect();
    }
  }, [modalOpen]);
  useEffect(() => {
    if (!modalOpen) return;
    const handler = (e) => {
      if (e.key === "Escape") setModalOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [modalOpen]);
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === "guide") gsd.clearFileView();
  };
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx("button", { className: "toolbar-icon-btn", title: "GSD", onClick: () => setModalOpen(true), children: /* @__PURE__ */ jsxs("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [
      /* @__PURE__ */ jsx("polyline", { points: "9 11 12 14 22 4" }),
      /* @__PURE__ */ jsx("path", { d: "M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" })
    ] }) }),
    modalOpen && /* @__PURE__ */ jsx("div", { className: "gsd-modal-overlay", onClick: () => setModalOpen(false), children: /* @__PURE__ */ jsxs("div", { className: "gsd-modal", onClick: (e) => e.stopPropagation(), children: [
      /* @__PURE__ */ jsxs("div", { className: "gsd-modal-header", children: [
        /* @__PURE__ */ jsx("span", { children: "GSD" }),
        /* @__PURE__ */ jsxs("div", { className: "gsd-tabs", children: [
          /* @__PURE__ */ jsx(
            "button",
            {
              className: `gsd-tab ${activeTab === "dashboard" ? "gsd-tab-active" : ""}`,
              onClick: () => handleTabChange("dashboard"),
              children: "Dashboard"
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              className: `gsd-tab ${activeTab === "guide" ? "gsd-tab-active" : ""}`,
              onClick: () => handleTabChange("guide"),
              children: "Guide"
            }
          )
        ] }),
        /* @__PURE__ */ jsx("button", { className: "gsd-btn gsd-btn-secondary", onClick: () => setModalOpen(false), children: "Close" })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "gsd-modal-body", children: activeTab === "guide" ? /* @__PURE__ */ jsx(GuideView, { showToast: gsd.showToast }) : gsd.activeFile || gsd.fileLoading ? /* @__PURE__ */ jsx(FileViewer, { gsd }) : renderDashboardContent(gsd) })
    ] }) })
  ] });
}
const name = "GSD";
const slots = { toolbar: ToolbarButton };
function onActivate() {
  console.log("[gsd] Plugin activated");
}
function onDeactivate() {
  console.log("[gsd] Plugin deactivated");
}
export {
  name,
  onActivate,
  onDeactivate,
  slots
};
