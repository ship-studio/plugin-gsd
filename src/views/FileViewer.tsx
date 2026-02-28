import React from 'react';
import { UseGsdReturn } from '../types';
import { renderMarkdown } from '../utils/renderMarkdown';

interface FileViewerProps {
  gsd: UseGsdReturn;
}

/**
 * Parses a .planning/ file path into a human-readable breadcrumb string.
 *
 * Examples:
 *   ".planning/phases/01-scaffold-detection-install/01-01-PLAN.md"
 *     -> "Phase 1 > 01-01-PLAN.md"
 *   ".planning/ROADMAP.md"
 *     -> "ROADMAP.md"
 */
function parseBreadcrumb(filePath: string): string {
  const segments = filePath.split('/');
  const filename = segments[segments.length - 1];

  // Look for a segment matching the phases directory pattern (e.g. "01-scaffold-...")
  const phasesDirIndex = segments.indexOf('phases');
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

/**
 * Full-content file viewer panel.
 * Purely presentational — receives UseGsdReturn, never calls shell.exec directly.
 *
 * Shows:
 * - Header row: back button, breadcrumb path, copy-path button
 * - Loading state when fileLoading
 * - Rendered markdown content via renderMarkdown()
 * - Error state if no content could be loaded
 */
export function FileViewer({ gsd }: FileViewerProps) {
  const breadcrumb = gsd.activeFile ? parseBreadcrumb(gsd.activeFile) : '';

  function handleCopyPath() {
    if (!gsd.activeFile) return;
    navigator.clipboard.writeText(gsd.activeFile).then(
      () => gsd.showToast('Path copied to clipboard', 'success'),
      () => gsd.showToast('Failed to copy path', 'error')
    );
  }

  return React.createElement(
    'div',
    null,
    // Header row
    React.createElement(
      'div',
      { className: 'gsd-file-viewer-header' },
      // Back button
      React.createElement(
        'button',
        {
          className: 'gsd-btn gsd-btn-secondary',
          onClick: () => gsd.clearFileView(),
        },
        '\u2190 Back'
      ),
      // Breadcrumb
      React.createElement(
        'span',
        { className: 'gsd-file-viewer-breadcrumb' },
        breadcrumb
      ),
      // Copy-path button
      React.createElement(
        'button',
        {
          className: 'gsd-file-viewer-copy',
          onClick: handleCopyPath,
          title: 'Copy file path',
        },
        'Copy path'
      )
    ),

    // Loading state
    gsd.fileLoading &&
      React.createElement(
        'div',
        { className: 'gsd-loading-indicator' },
        'Loading file\u2026'
      ),

    // Content body
    !gsd.fileLoading &&
      gsd.fileContent !== null &&
      React.createElement(
        'div',
        { className: 'gsd-file-viewer-content' },
        renderMarkdown(gsd.fileContent)
      ),

    // Error state: active file set but no content loaded
    !gsd.fileLoading &&
      gsd.fileContent === null &&
      gsd.activeFile !== null &&
      React.createElement(
        'div',
        { className: 'gsd-error-state' },
        'Could not load file.'
      )
  );
}
