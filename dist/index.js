import { jsxs, jsx, Fragment } from "data:text/javascript,export const jsx=window.__SHIPSTUDIO_REACT__.createElement;export const jsxs=window.__SHIPSTUDIO_REACT__.createElement;export const Fragment=window.__SHIPSTUDIO_REACT__.Fragment;";
import { useRef, useState, useCallback, useEffect } from "data:text/javascript,export default window.__SHIPSTUDIO_REACT__;export const useState=window.__SHIPSTUDIO_REACT__.useState;export const useEffect=window.__SHIPSTUDIO_REACT__.useEffect;export const useCallback=window.__SHIPSTUDIO_REACT__.useCallback;export const useMemo=window.__SHIPSTUDIO_REACT__.useMemo;export const useRef=window.__SHIPSTUDIO_REACT__.useRef;export const useContext=window.__SHIPSTUDIO_REACT__.useContext;export const createElement=window.__SHIPSTUDIO_REACT__.createElement;export const Fragment=window.__SHIPSTUDIO_REACT__.Fragment;";
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
`;
const _w = window;
function usePluginContext() {
  const React = _w.__SHIPSTUDIO_REACT__;
  const CtxRef = _w.__SHIPSTUDIO_PLUGIN_CONTEXT_REF__;
  if (CtxRef && (React == null ? void 0 : React.useContext)) {
    const ctx = React.useContext(CtxRef);
    if (ctx) return ctx;
  }
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
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
      setPhase("error");
    } finally {
      setLoading(false);
    }
  }, [project]);
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
  return { phase, loading, error, install, redetect: detect };
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
function useInjectStyles() {
  useEffect(() => {
    if (document.getElementById(STYLE_ID)) return;
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
function ToolbarButton() {
  const [modalOpen, setModalOpen] = useState(false);
  const gsd = useGsd();
  useInjectStyles();
  useEffect(() => {
    if (modalOpen) void gsd.redetect();
  }, [modalOpen]);
  useEffect(() => {
    if (!modalOpen) return;
    const handler = (e) => {
      if (e.key === "Escape") setModalOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [modalOpen]);
  let content;
  switch (gsd.phase) {
    case "loading":
      content = /* @__PURE__ */ jsx("div", { className: "gsd-loading-indicator", children: "Checking GSD status..." });
      break;
    case "no-project":
      content = /* @__PURE__ */ jsx(NoProjectView, {});
      break;
    case "gsd-not-installed":
      content = /* @__PURE__ */ jsx(InstallView, { gsd });
      break;
    case "no-planning":
      content = /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h3", { children: "No Planning Directory" }),
        /* @__PURE__ */ jsxs("p", { style: { color: "var(--text-secondary)", fontSize: 13 }, children: [
          "GSD is installed but this project has no .planning/ directory. Run",
          " ",
          /* @__PURE__ */ jsx("code", { children: "/gsd:new-project" }),
          " in Claude Code to start planning."
        ] })
      ] });
      break;
    case "has-planning":
      content = /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h3", { children: "Dashboard" }),
        /* @__PURE__ */ jsx("p", { style: { color: "var(--text-secondary)", fontSize: 13 }, children: "Plan dashboard coming in Phase 2." })
      ] });
      break;
    case "error":
      content = /* @__PURE__ */ jsxs("div", { className: "gsd-error-state", children: [
        "Error: ",
        gsd.error
      ] });
      break;
  }
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx("button", { className: "toolbar-icon-btn", title: "GSD", onClick: () => setModalOpen(true), children: /* @__PURE__ */ jsxs("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [
      /* @__PURE__ */ jsx("polyline", { points: "9 11 12 14 22 4" }),
      /* @__PURE__ */ jsx("path", { d: "M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" })
    ] }) }),
    modalOpen && /* @__PURE__ */ jsx("div", { className: "gsd-modal-overlay", onClick: () => setModalOpen(false), children: /* @__PURE__ */ jsxs("div", { className: "gsd-modal", onClick: (e) => e.stopPropagation(), children: [
      /* @__PURE__ */ jsxs("div", { className: "gsd-modal-header", children: [
        /* @__PURE__ */ jsx("span", { children: "GSD" }),
        /* @__PURE__ */ jsx("button", { className: "gsd-btn gsd-btn-secondary", onClick: () => setModalOpen(false), children: "Close" })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "gsd-modal-body", children: content })
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
