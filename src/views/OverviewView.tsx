import { useState } from 'react';
import type { UseGsdReturn } from '../types';
import { ConfirmDialog } from './ConfirmDialog';

interface OverviewViewProps {
  gsd: UseGsdReturn;
}

/**
 * OverviewView -- Read-only dashboard showing roadmap phases with statuses,
 * plan counts, and expandable file accordions.
 *
 * CRITICAL: This component must NOT call shell.exec directly.
 * All data comes from the gsd prop. File reads are triggered via gsd.readFile().
 */
export function OverviewView({ gsd }: OverviewViewProps) {
  const [expandedPhases, setExpandedPhases] = useState<Set<number>>(new Set());
  const [confirmState, setConfirmState] = useState<
    null | { type: 'full' } | { type: 'item'; path: string; label: string }
  >(null);
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleConfirm() {
    setIsDeleting(true);
    try {
      if (confirmState?.type === 'full') {
        await gsd.deleteDirectory();
      } else if (confirmState?.type === 'item') {
        await gsd.deleteItem(confirmState.path);
      }
      setConfirmState(null);
    } finally {
      setIsDeleting(false);
    }
  }

  function togglePhase(index: number) {
    const next = new Set(expandedPhases);
    if (next.has(index)) {
      next.delete(index);
    } else {
      next.add(index);
    }
    setExpandedPhases(next);
  }

  const totalPhases = gsd.planningData.length;
  const completedPhases = gsd.planningData.filter(p => p.status === 'complete').length;
  const progressPct = totalPhases > 0 ? Math.round((completedPhases / totalPhases) * 100) : 0;

  if (confirmState !== null) {
    return (
      <ConfirmDialog
        friction={confirmState.type === 'full' ? 'high' : 'low'}
        targetLabel={confirmState.type === 'full' ? '.planning/' : confirmState.label}
        onConfirm={handleConfirm}
        onCancel={() => setConfirmState(null)}
        isDeleting={isDeleting}
      />
    );
  }

  return (
    <div>
      {/* Progress bar */}
      {totalPhases > 0 && (
        <div>
          <div className="gsd-progress-label">
            Phase {completedPhases} of {totalPhases} &mdash; {progressPct}% complete
          </div>
          <div className="gsd-progress-bar">
            <div
              className="gsd-progress-fill"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      )}

      {/* Loading indicator */}
      {gsd.planningLoading && (
        <div className="gsd-loading-indicator">Loading plans...</div>
      )}

      {/* Empty state */}
      {!gsd.planningLoading && gsd.planningData.length === 0 && (
        <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>
          No phases found in ROADMAP.md
        </div>
      )}

      {/* Phase list */}
      {gsd.planningData.map((phase, index) => {
        const isExpanded = expandedPhases.has(index);

        let badgeClass: string;
        let badgeLabel: string;
        if (phase.status === 'complete') {
          badgeClass = 'gsd-badge-complete';
          badgeLabel = 'Complete';
        } else if (phase.status === 'in-progress') {
          badgeClass = 'gsd-badge-in-progress';
          badgeLabel = 'In progress';
        } else {
          badgeClass = 'gsd-badge-not-started';
          badgeLabel = 'Not started';
        }

        return (
          <div key={phase.number}>
            {/* Phase row (accordion header) */}
            <div
              className="gsd-phase-row"
              onClick={() => togglePhase(index)}
              role="button"
              aria-expanded={isExpanded}
            >
              <span className={`gsd-phase-chevron${isExpanded ? ' gsd-phase-chevron-open' : ''}`} />
              <span className="gsd-phase-name">
                {phase.name}
              </span>
              {phase.dirName !== null && (
                <button
                  className="gsd-delete-btn"
                  title={`Delete ${phase.dirName}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    const dirName = phase.dirName as string;
                    setConfirmState({
                      type: 'item',
                      path: `.planning/phases/${dirName}`,
                      label: dirName,
                    });
                  }}
                >
                  Delete
                </button>
              )}
              <span className={`gsd-status-badge ${badgeClass}`}>
                {badgeLabel}
              </span>
              <span className="gsd-phase-plans">
                {phase.plansComplete}/{phase.plansTotal}
              </span>
            </div>

            {/* Accordion body — file list */}
            {isExpanded && (
              <div className="gsd-file-list">
                {phase.dirName === null || phase.files.length === 0 ? (
                  <div className="gsd-phase-plans" style={{ padding: '4px 8px' }}>
                    No files found
                  </div>
                ) : (
                  phase.files.map(fileName => (
                    <div
                      key={fileName}
                      className="gsd-file-item"
                      onClick={() =>
                        void gsd.readFile(
                          `.planning/phases/${phase.dirName}/${fileName}`,
                        )
                      }
                      role="button"
                    >
                      {fileName}
                      <button
                        className="gsd-delete-btn"
                        title={`Delete ${fileName}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setConfirmState({
                            type: 'item',
                            path: `.planning/phases/${phase.dirName}/${fileName}`,
                            label: fileName,
                          });
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* Delete all plans */}
      {gsd.planningData.length > 0 && (
        <div className="gsd-delete-all-section">
          <button
            className="gsd-btn gsd-btn-danger"
            style={{ fontSize: 12 }}
            onClick={() => setConfirmState({ type: 'full' })}
          >
            Delete all plans
          </button>
        </div>
      )}
    </div>
  );
}
