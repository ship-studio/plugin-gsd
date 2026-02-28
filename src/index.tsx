import { useState, useEffect } from 'react';
import { STYLE_ID, PLUGIN_CSS } from './styles';
import { useGsd } from './useGsd';
import { InstallView } from './views/InstallView';
import { NoProjectView } from './views/NoProjectView';

function useInjectStyles() {
  useEffect(() => {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = PLUGIN_CSS;
    document.head.appendChild(style);
    return () => {
      document.getElementById(STYLE_ID)?.remove();
    };
  }, []);
}

function ToolbarButton() {
  const [modalOpen, setModalOpen] = useState(false);
  const gsd = useGsd();
  useInjectStyles();

  useEffect(() => {
    if (modalOpen) void gsd.redetect();
  }, [modalOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!modalOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setModalOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [modalOpen]);

  let content: React.ReactNode;
  switch (gsd.phase) {
    case 'loading':
      content = <div className="gsd-loading-indicator">Checking GSD status...</div>;
      break;
    case 'no-project':
      content = <NoProjectView />;
      break;
    case 'gsd-not-installed':
      content = <InstallView gsd={gsd} />;
      break;
    case 'no-planning':
      content = (
        <div>
          <h3>No Planning Directory</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
            GSD is installed but this project has no .planning/ directory. Run{' '}
            <code>/gsd:new-project</code> in Claude Code to start planning.
          </p>
        </div>
      );
      break;
    case 'has-planning':
      content = (
        <div>
          <h3>Dashboard</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
            Plan dashboard coming in Phase 2.
          </p>
        </div>
      );
      break;
    case 'error':
      content = <div className="gsd-error-state">Error: {gsd.error}</div>;
      break;
  }

  return (
    <>
      <button className="toolbar-icon-btn" title="GSD" onClick={() => setModalOpen(true)}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="9 11 12 14 22 4" />
          <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
        </svg>
      </button>
      {modalOpen && (
        <div className="gsd-modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="gsd-modal" onClick={e => e.stopPropagation()}>
            <div className="gsd-modal-header">
              <span>GSD</span>
              <button className="gsd-btn gsd-btn-secondary" onClick={() => setModalOpen(false)}>
                Close
              </button>
            </div>
            <div className="gsd-modal-body">{content}</div>
          </div>
        </div>
      )}
    </>
  );
}

export const name = 'GSD';
export const slots = { toolbar: ToolbarButton };
export function onActivate() { console.log('[gsd] Plugin activated'); }
export function onDeactivate() { console.log('[gsd] Plugin deactivated'); }
