import React from 'react';

/**
 * Converts inline markdown (`**bold**`, `` `code` ``) to React nodes.
 * Returns an array of React nodes — strings interleaved with <strong>/<code>.
 */
function inlineMarkdown(text: string, baseKey: string): React.ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return React.createElement('strong', { key: `${baseKey}-b${i}` }, part.slice(2, -2));
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return React.createElement('code', {
        key: `${baseKey}-c${i}`,
        style: {
          background: 'var(--bg-tertiary)',
          padding: '1px 4px',
          borderRadius: '3px',
          fontFamily: 'monospace',
          fontSize: '11px',
        },
      }, part.slice(1, -1));
    }
    return part;
  });
}

/**
 * Lightweight regex-based markdown to React elements renderer.
 * Handles GSD-relevant markdown subset: headings, bold, inline code,
 * fenced code blocks, unordered/ordered lists, HR, blank lines, paragraphs.
 *
 * NEVER throws — wraps in try/catch and returns <pre> with raw content on any error.
 *
 * @param content Raw markdown string
 * @returns React.ReactNode suitable for rendering inside a container
 */
export function renderMarkdown(content: string): React.ReactNode {
  try {
    const lines = content.split('\n');
    const elements: React.ReactNode[] = [];
    let i = 0;

    while (i < lines.length) {
      const line = lines[i];

      // --- Fenced code block (``` ... ```) ---
      if (line.trim().startsWith('```')) {
        const codeLines: string[] = [];
        i++; // skip the opening fence
        while (i < lines.length && !lines[i].trim().startsWith('```')) {
          codeLines.push(lines[i]);
          i++;
        }
        i++; // skip the closing fence
        elements.push(
          React.createElement(
            'pre',
            {
              key: `line-${i}`,
              style: {
                background: 'var(--bg-tertiary)',
                fontFamily: 'monospace',
                fontSize: '11px',
                borderRadius: '6px',
                padding: '12px',
                overflowX: 'auto',
                margin: '8px 0',
              },
            },
            React.createElement('code', null, codeLines.join('\n'))
          )
        );
        continue;
      }

      // --- H1 ---
      if (/^# /.test(line)) {
        elements.push(
          React.createElement(
            'h1',
            {
              key: `line-${i}`,
              style: {
                color: 'var(--text-primary)',
                fontSize: '18px',
                fontWeight: 700,
                margin: '16px 0 8px',
                lineHeight: 1.3,
              },
            },
            inlineMarkdown(line.slice(2), `line-${i}`)
          )
        );
        i++;
        continue;
      }

      // --- H2 ---
      if (/^## /.test(line)) {
        elements.push(
          React.createElement(
            'h2',
            {
              key: `line-${i}`,
              style: {
                color: 'var(--text-primary)',
                fontSize: '15px',
                fontWeight: 600,
                margin: '14px 0 6px',
                lineHeight: 1.3,
              },
            },
            inlineMarkdown(line.slice(3), `line-${i}`)
          )
        );
        i++;
        continue;
      }

      // --- H3 ---
      if (/^### /.test(line)) {
        elements.push(
          React.createElement(
            'h3',
            {
              key: `line-${i}`,
              style: {
                color: 'var(--text-primary)',
                fontSize: '13px',
                fontWeight: 600,
                margin: '12px 0 4px',
                lineHeight: 1.3,
              },
            },
            inlineMarkdown(line.slice(4), `line-${i}`)
          )
        );
        i++;
        continue;
      }

      // --- Unordered list item (- item or * item) ---
      if (/^[-*] /.test(line)) {
        elements.push(
          React.createElement(
            'div',
            {
              key: `line-${i}`,
              style: {
                display: 'flex',
                gap: '6px',
                padding: '2px 0',
                color: 'var(--text-primary)',
              },
            },
            React.createElement('span', { style: { flexShrink: 0 } }, '\u2022'),
            React.createElement('span', null, inlineMarkdown(line.slice(2), `line-${i}`))
          )
        );
        i++;
        continue;
      }

      // --- Ordered list item (1. item, 2. item, etc.) ---
      const orderedMatch = line.match(/^(\d+)\. (.+)/);
      if (orderedMatch) {
        elements.push(
          React.createElement(
            'div',
            {
              key: `line-${i}`,
              style: {
                display: 'flex',
                gap: '6px',
                padding: '2px 0',
                color: 'var(--text-primary)',
              },
            },
            React.createElement(
              'span',
              { style: { flexShrink: 0, minWidth: '20px' } },
              `${orderedMatch[1]}.`
            ),
            React.createElement('span', null, inlineMarkdown(orderedMatch[2], `line-${i}`))
          )
        );
        i++;
        continue;
      }

      // --- Horizontal rule (---) ---
      if (/^---+$/.test(line.trim())) {
        elements.push(
          React.createElement('hr', {
            key: `line-${i}`,
            style: {
              borderTop: '1px solid var(--border)',
              borderBottom: 'none',
              margin: '12px 0',
            },
          })
        );
        i++;
        continue;
      }

      // --- Markdown table row (| col | col |) — render as plain styled text ---
      if (/^\|/.test(line)) {
        // Skip separator rows (|---|---|)
        if (/^\|[\s\-|:]+\|$/.test(line)) {
          i++;
          continue;
        }
        const cells = line
          .split('|')
          .slice(1, -1)
          .map((c) => c.trim());
        elements.push(
          React.createElement(
            'div',
            {
              key: `line-${i}`,
              style: {
                display: 'flex',
                gap: '16px',
                padding: '3px 0',
                fontSize: '12px',
                color: 'var(--text-secondary)',
              },
            },
            cells.map((cell, ci) =>
              React.createElement(
                'span',
                { key: `cell-${ci}`, style: { flex: 1 } },
                inlineMarkdown(cell, `line-${i}-cell-${ci}`)
              )
            )
          )
        );
        i++;
        continue;
      }

      // --- Blank line ---
      if (line.trim() === '') {
        elements.push(
          React.createElement('div', {
            key: `line-${i}`,
            style: { height: '8px' },
          })
        );
        i++;
        continue;
      }

      // --- Plain paragraph ---
      elements.push(
        React.createElement(
          'p',
          {
            key: `line-${i}`,
            style: {
              color: 'var(--text-primary)',
              margin: '0 0 4px',
            },
          },
          inlineMarkdown(line, `line-${i}`)
        )
      );
      i++;
    }

    return React.createElement(React.Fragment, null, ...elements);
  } catch (_err) {
    // Never throw — return raw content as fallback
    return React.createElement(
      'pre',
      {
        style: {
          fontFamily: 'monospace',
          fontSize: '11px',
          whiteSpace: 'pre-wrap',
          color: 'var(--text-primary)',
        },
      },
      content
    );
  }
}
