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

/* Progress bar */
.gsd-progress-bar { width: 100%; height: 6px; border-radius: 3px; background: var(--bg-tertiary); margin-bottom: 16px; overflow: hidden; }
.gsd-progress-fill { height: 100%; border-radius: 3px; background: var(--action); transition: width 0.3s ease; }
.gsd-progress-label { font-size: 12px; color: var(--text-muted); margin-bottom: 6px; }

/* Phase rows */
.gsd-phase-row { display: flex; align-items: center; gap: 8px; padding: 8px 0; cursor: pointer; border-bottom: 1px solid var(--border); }
.gsd-phase-row:hover { background: var(--bg-secondary); margin: 0 -24px; padding: 8px 24px; }
.gsd-phase-chevron { flex-shrink: 0; font-size: 10px; color: var(--text-muted); width: 14px; transition: transform 0.15s; }
.gsd-phase-chevron-open { transform: rotate(90deg); }
.gsd-phase-name { flex: 1; font-weight: 500; font-size: 13px; }
.gsd-phase-plans { font-size: 11px; color: var(--text-muted); flex-shrink: 0; }

/* Status badge */
.gsd-status-badge { font-size: 10px; font-weight: 600; padding: 2px 8px; border-radius: 10px; text-transform: uppercase; letter-spacing: 0.5px; flex-shrink: 0; }

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
.gsd-tabs { display: flex; gap: 0; }
.gsd-tab { padding: 0 14px; font-size: 13px; font-weight: 500; color: var(--text-muted); background: transparent; border: none; border-bottom: 2px solid transparent; cursor: pointer; transition: color 0.15s; }
.gsd-tab:hover { color: var(--text-secondary); }
.gsd-tab-active { color: var(--text-primary); border-bottom-color: var(--text-primary); }

/* Guide view */
.gsd-guide-intro { font-size: 13px; color: var(--text-secondary); line-height: 1.6; margin-bottom: 20px; }
.gsd-guide-section-title { font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: var(--text-muted); margin: 20px 0 10px; }
.gsd-guide-step { display: flex; align-items: flex-start; gap: 10px; padding: 8px 0; }
.gsd-guide-step-number { width: 22px; height: 22px; border-radius: 50%; background: var(--action); color: var(--action-text); font-size: 11px; font-weight: 700; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.gsd-guide-step-body { flex: 1; }
.gsd-guide-command { font-family: monospace; font-size: 12px; background: var(--bg-tertiary); padding: 2px 8px; border-radius: 4px; cursor: pointer; display: inline-block; margin-bottom: 2px; border: 1px solid var(--border); }
.gsd-guide-command:hover { background: var(--bg-secondary); border-color: var(--text-muted); }
.gsd-guide-desc { font-size: 12px; color: var(--text-secondary); }
`;
