import React from 'react';

interface ConfirmDialogProps {
  friction: 'high' | 'low';
  targetLabel: string;       // e.g., ".planning/" or "phases/01-scaffold/01-01-PLAN.md"
  onConfirm: () => void;
  onCancel: () => void;
  isDeleting: boolean;
}

export function ConfirmDialog({ friction, targetLabel, onConfirm, onCancel, isDeleting }: ConfirmDialogProps) {
  const title = friction === 'high' ? 'Delete all plans?' : 'Delete this item?';

  const body = friction === 'high' ? (
    <>
      <strong>{targetLabel}</strong>
      {' and all its contents will be permanently deleted. This cannot be undone. All phases, plans, research, and context will be lost.'}
    </>
  ) : (
    <>
      <strong>{targetLabel}</strong>
      {' will be permanently deleted. This cannot be undone.'}
    </>
  );

  return (
    <div className="gsd-confirm-dialog">
      <div className="gsd-confirm-title">{title}</div>
      <div className="gsd-confirm-body">{body}</div>
      <div className="gsd-confirm-actions">
        <button
          className="gsd-btn gsd-btn-secondary"
          onClick={onCancel}
          disabled={isDeleting}
        >
          Cancel
        </button>
        <button
          className="gsd-btn gsd-btn-danger"
          onClick={onConfirm}
          disabled={isDeleting}
        >
          {isDeleting ? 'Deleting...' : 'Delete'}
        </button>
      </div>
    </div>
  );
}
