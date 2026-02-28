import { useState } from 'react';
import type { UseGsdReturn } from '../types';

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

        // Status badge styles
        let badgeStyle: React.CSSProperties;
        let badgeLabel: string;
        if (phase.status === 'complete') {
          badgeStyle = { background: 'var(--success)', color: '#fff' };
          badgeLabel = 'Complete';
        } else if (phase.status === 'in-progress') {
          badgeStyle = { background: 'var(--action)', color: 'var(--action-text)' };
          badgeLabel = 'In Progress';
        } else {
          badgeStyle = { background: 'var(--bg-tertiary)', color: 'var(--text-muted)' };
          badgeLabel = 'Not Started';
        }

        return (
          <div key={phase.number}>
            {/* Phase row (accordion header) */}
            <div
              className="gsd-phase-row"
              onClick={() => togglePhase(index)}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0', cursor: 'pointer', borderBottom: '1px solid var(--border)' }}
              role="button"
              aria-expanded={isExpanded}
            >
              <span
                className={`gsd-phase-chevron${isExpanded ? ' gsd-phase-chevron-open' : ''}`}
                style={{ flexShrink: 0, fontSize: 10, color: 'var(--text-muted)', width: 14, transition: 'transform 0.15s', transform: isExpanded ? 'rotate(90deg)' : undefined }}
              >
                &#9654;
              </span>
              <span style={{ flex: 1, fontWeight: 500, fontSize: 13 }}>
                Phase {phase.number}: {phase.name}
              </span>
              <span className="gsd-status-badge" style={{ ...badgeStyle, fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 10, textTransform: 'uppercase' as const, letterSpacing: 0.5, flexShrink: 0 }}>
                {badgeLabel}
              </span>
              <span style={{ fontSize: 11, color: 'var(--text-muted)', flexShrink: 0 }}>
                {phase.plansComplete}/{phase.plansTotal} plans
              </span>
            </div>

            {/* Accordion body — file list */}
            {isExpanded && (
              <div className="gsd-file-list">
                {phase.dirName === null || phase.files.length === 0 ? (
                  <div style={{ color: 'var(--text-muted)', fontSize: 11, padding: '4px 8px' }}>
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
                      style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 8px', fontSize: 12, cursor: 'pointer', borderRadius: 4, color: 'var(--text-secondary)' }}
                      role="button"
                    >
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>&#128196;</span>
                      {fileName}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
