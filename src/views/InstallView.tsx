import type { UseGsdReturn } from '../types';

interface InstallViewProps {
  gsd: UseGsdReturn;
}

export function InstallView({ gsd }: InstallViewProps) {
  return (
    <div>
      <h3>GSD Not Installed</h3>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 16, fontSize: 13 }}>
        Get Shit Done (GSD) is a planning system for Claude Code projects. Install it to start
        managing your project plans from Ship Studio.
      </p>
      <button
        className="gsd-btn gsd-btn-primary"
        onClick={() => void gsd.install()}
        disabled={gsd.loading}
      >
        {gsd.loading ? 'Installing...' : 'Install GSD'}
      </button>
      {gsd.error && (
        <div className="gsd-error-state" style={{ marginTop: 8 }}>
          {gsd.error}
        </div>
      )}
    </div>
  );
}
