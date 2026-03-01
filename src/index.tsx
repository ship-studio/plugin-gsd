import { useState, useEffect } from 'react';
import { STYLE_ID, PLUGIN_CSS } from './styles';
import { useGsd } from './useGsd';
import type { UseGsdReturn } from './types';
import { InstallView } from './views/InstallView';
import { NoProjectView } from './views/NoProjectView';
import { OverviewView } from './views/OverviewView';
import { FileViewer } from './views/FileViewer';
import { GuideView } from './views/GuideView';

function useInjectStyles() {
  useEffect(() => {
    const existing = document.getElementById(STYLE_ID);
    if (existing) {
      // Update content in case CSS changed between plugin versions.
      existing.textContent = PLUGIN_CSS;
      return;
    }
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = PLUGIN_CSS;
    document.head.appendChild(style);
    return () => {
      document.getElementById(STYLE_ID)?.remove();
    };
  }, []);
}

/**
 * Renders the dashboard content based on the current plugin phase.
 * Called when the Dashboard tab is active and no file is being viewed.
 */
function renderDashboardContent(gsd: UseGsdReturn, onCloseModal: () => void): React.ReactNode {
  switch (gsd.phase) {
    case 'loading':
      return <div className="gsd-loading-indicator">Checking GSD status...</div>;
    case 'no-project':
      return <NoProjectView />;
    case 'gsd-not-installed':
      return <InstallView gsd={gsd} onInstallStart={onCloseModal} />;
    case 'no-planning':
      return (
        <div>
          <h3>No Planning Directory</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
            GSD is installed but this project has no .planning/ directory. Run{' '}
            <code>/gsd:new-project</code> in Claude Code to start planning.
          </p>
        </div>
      );
    case 'has-planning':
      return <OverviewView gsd={gsd} />;
    case 'error':
      return <div className="gsd-error-state">Error: {gsd.error}</div>;
  }
}

function ToolbarButton() {
  const [modalOpen, setModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'guide'>('dashboard');
  const gsd = useGsd();
  useInjectStyles();

  // Reset to dashboard tab on every modal open, then redetect state
  useEffect(() => {
    if (modalOpen) {
      setActiveTab('dashboard');
      void gsd.redetect();
    }
  }, [modalOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!modalOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setModalOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [modalOpen]);

  // When switching to Guide, clear any open file so returning to Dashboard shows overview
  const handleTabChange = (tab: 'dashboard' | 'guide') => {
    setActiveTab(tab);
    if (tab === 'guide') gsd.clearFileView();
  };

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
              <div className="gsd-tabs">
                <button
                  className={`gsd-tab ${activeTab === 'dashboard' ? 'gsd-tab-active' : ''}`}
                  onClick={() => handleTabChange('dashboard')}
                >
                  Dashboard
                </button>
                <button
                  className={`gsd-tab ${activeTab === 'guide' ? 'gsd-tab-active' : ''}`}
                  onClick={() => handleTabChange('guide')}
                >
                  Guide
                </button>
              </div>
              <button className="gsd-btn gsd-btn-secondary" onClick={() => setModalOpen(false)}>
                Close
              </button>
            </div>
            <div className="gsd-modal-body">
              {activeTab === 'guide'
                ? <GuideView showToast={gsd.showToast} />
                : (gsd.activeFile || gsd.fileLoading)
                  ? <FileViewer gsd={gsd} />
                  : renderDashboardContent(gsd, () => setModalOpen(false))
              }
            </div>
          </div>
        </div>
      )}
      {gsd.installSuccess && (
        <div className="gsd-modal-overlay" onClick={() => gsd.dismissInstallSuccess()}>
          <div className="gsd-modal gsd-install-success-modal" onClick={e => e.stopPropagation()}>
            <div className="gsd-modal-body" style={{ textAlign: 'center', padding: '32px 24px' }}>
              <div style={{ fontSize: 40, marginBottom: 16 }}>&#10003;</div>
              <h3 style={{ marginBottom: 8 }}>You've just installed GSD!</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 20 }}>
                To start using it, open a new terminal window and type:
              </p>
              <code className="gsd-install-command">/gsd:new-project</code>
              <div style={{ marginTop: 24 }}>
                <button
                  className="gsd-btn gsd-btn-primary"
                  onClick={() => {
                    void navigator.clipboard.writeText('/gsd:new-project');
                    gsd.showToast('Copied to clipboard!', 'success');
                    gsd.dismissInstallSuccess();
                  }}
                >
                  Copy &amp; Close
                </button>
              </div>
            </div>
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
