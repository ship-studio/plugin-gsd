/**
 * GuideView — Static GSD workflow guide with click-to-copy slash commands.
 *
 * CRITICAL: No shell.exec, no context imports. Purely presentational.
 * Only external interaction: navigator.clipboard for copy-to-clipboard.
 */

interface GuideViewProps {
  showToast: (message: string, type?: 'success' | 'error') => void;
}

const CORE_STEPS: Array<{ command: string; description: string }> = [
  { command: '/gsd:new-project', description: 'Set up a new project with requirements and roadmap' },
  { command: '/gsd:discuss-phase', description: 'Discuss implementation decisions for the next phase' },
  { command: '/gsd:plan-phase', description: 'Create executable plans with task breakdown' },
  { command: '/gsd:execute-phase', description: 'Run plans to build the phase' },
  { command: '/gsd:verify-phase', description: 'Verify all must-haves are met' },
];

const UTILITY_COMMANDS: Array<{ command: string; description: string }> = [
  { command: '/gsd:progress', description: 'Check overall project progress' },
  { command: '/gsd:research-phase', description: 'Deep research before planning' },
  { command: '/gsd:debug', description: 'Debug issues in the current phase' },
  { command: '/gsd:add-todo', description: 'Add a todo to the project backlog' },
];

export function GuideView({ showToast }: GuideViewProps) {
  const handleCopy = (command: string) => {
    navigator.clipboard.writeText(command).then(
      () => showToast(`Copied ${command}`, 'success'),
      () => showToast('Failed to copy', 'error'),
    );
  };

  return (
    <div>
      {/* Intro */}
      <p className="gsd-guide-intro">
        Get Shit Done (GSD) is a structured planning system for Claude Code projects. It breaks
        work into phases with discussion, planning, execution, and verification steps. Start by
        running <code>/gsd:new-project</code> in Claude Code to set up your project.
      </p>

      {/* Core workflow steps */}
      <div className="gsd-guide-section-title">Core Workflow</div>
      {CORE_STEPS.map((step, index) => (
        <div key={step.command} className="gsd-guide-step">
          <div className="gsd-guide-step-number">{index + 1}</div>
          <div className="gsd-guide-step-body">
            <div
              className="gsd-guide-command"
              onClick={() => handleCopy(step.command)}
              role="button"
              title="Click to copy"
            >
              {step.command}
            </div>
            <div className="gsd-guide-desc">{step.description}</div>
          </div>
        </div>
      ))}

      {/* Utility commands */}
      <div className="gsd-guide-section-title">Utility Commands</div>
      {UTILITY_COMMANDS.map(item => (
        <div key={item.command} className="gsd-guide-step">
          <div className="gsd-guide-step-number" style={{ background: 'var(--bg-tertiary)', color: 'var(--text-muted)' }}>
            &mdash;
          </div>
          <div className="gsd-guide-step-body">
            <div
              className="gsd-guide-command"
              onClick={() => handleCopy(item.command)}
              role="button"
              title="Click to copy"
            >
              {item.command}
            </div>
            <div className="gsd-guide-desc">{item.description}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
