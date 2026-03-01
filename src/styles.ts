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
.gsd-phase-row { display: flex; align-items: center; gap: 8px; padding: 8px 8px; cursor: pointer; border: 1px solid var(--border); border-radius: 6px; margin-bottom: 6px; transition: background 0.1s; }
.gsd-phase-row:hover { background: var(--bg-secondary); }
.gsd-phase-chevron { flex-shrink: 0; width: 6px; height: 6px; border-right: 1.5px solid var(--text-muted); border-bottom: 1.5px solid var(--text-muted); transform: rotate(-45deg); transition: transform 0.15s; margin-left: 2px; }
.gsd-phase-chevron-open { transform: rotate(45deg); }
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
  justify-content: flex-start;
}
`;
