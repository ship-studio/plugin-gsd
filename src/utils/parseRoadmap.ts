import type { PhaseData } from '../types';

// Re-export PhaseData for consumers that import from this module.
export type { PhaseData };

/**
 * parseRoadmap -- pure function: ROADMAP.md string -> PhaseData[]
 *
 * Parses two sections from ROADMAP.md content:
 * 1. Phase bullets from the "## Phases" section
 * 2. Progress table rows with plan counts
 *
 * CRITICAL: Wrapped in try/catch — returns [] on any parse failure.
 * ROADMAP.md format may vary across user projects; never throw.
 *
 * dirName and files are initialized to null/[] — filled in by useGsd after
 * filesystem scan.
 */
export function parseRoadmap(content: string): PhaseData[] {
  try {
    if (!content || content.trim() === '') return [];

    // Step 1: Parse phase bullets from "## Phases" section.
    // Matches: - [x] **Phase N: Name** - description
    //       or - [ ] **Phase N: Name** - description
    const bulletRegex = /^- \[([ x])\] \*\*Phase (\d+(?:\.\d+)?): ([^*]+)\*\*/gm;
    const bullets: Array<{ checked: boolean; number: number; name: string }> = [];

    let match: RegExpExecArray | null;
    while ((match = bulletRegex.exec(content)) !== null) {
      bullets.push({
        checked: match[1] === 'x',
        number: parseFloat(match[2]),
        name: match[3].trim(),
      });
    }

    if (bullets.length === 0) return [];

    // Step 2: Parse progress table rows.
    // Matches: | N. Name | X/Y | Status | ... |
    const tableRegex = /^\|\s*(\d+(?:\.\d+)?)\.\s*[^|]+\|\s*(\d+)\/(\d+)\s*\|\s*([^|]+)\|/gm;
    const tableData = new Map<number, { plansComplete: number; plansTotal: number }>();

    while ((match = tableRegex.exec(content)) !== null) {
      const num = parseFloat(match[1]);
      tableData.set(num, {
        plansComplete: parseInt(match[2], 10),
        plansTotal: parseInt(match[3], 10),
      });
    }

    // Step 3: Build PhaseData[] by combining bullets and table data.
    const phases: PhaseData[] = bullets.map((bullet) => {
      const table = tableData.get(bullet.number);
      const plansComplete = table?.plansComplete ?? 0;
      const plansTotal = table?.plansTotal ?? 0;

      // Derive status:
      // - bullet.checked === true -> 'complete'
      // - not checked + plansComplete > 0 -> 'in-progress'
      // - not checked + plansComplete === 0 -> 'not-started'
      let status: PhaseData['status'];
      if (bullet.checked) {
        status = 'complete';
      } else if (plansComplete > 0) {
        status = 'in-progress';
      } else {
        status = 'not-started';
      }

      return {
        number: bullet.number,
        name: bullet.name,
        status,
        plansComplete,
        plansTotal,
        dirName: null,  // filled in by useGsd after filesystem scan
        files: [],      // filled in by useGsd after filesystem scan
      };
    });

    return phases;
  } catch {
    // Defensive: never throw — ROADMAP.md format may vary
    return [];
  }
}
