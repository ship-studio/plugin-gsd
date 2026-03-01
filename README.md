# GSD

A [Ship Studio](https://shipstudio.dev) plugin that makes [Get Shit Done](https://github.com/get-shit-done-cc/get-shit-done-cc) accessible to people who'd never touch a CLI — install GSD, view project plans, and manage your `.planning/` directory, all from within Ship Studio.

## Features

- **One-click install** — opens an interactive terminal running `npx get-shit-done-cc@latest`
- **Project dashboard** — roadmap phases with status badges, plan counts, and progress bar
- **Accordion drill-down** — expand any phase to see its plans, summaries, and context files
- **Markdown file viewer** — read any `.planning/` file with rendered markdown
- **Delete flows** — remove individual phases/files (low friction) or the entire `.planning/` directory (high friction confirmation)
- **Guide tab** — explains the GSD workflow in simple terms with click-to-copy commands
- **Theme-aware** — inherits Ship Studio's active theme automatically

## Install

In Ship Studio: open a project, click the **Plugin Manager** (puzzle icon), and paste the repo URL:

```
https://github.com/ship-studio/plugin-gsd
```

Ship Studio clones the repo and loads the pre-built bundle. No build step required for end users.

### Requirements

- [Ship Studio](https://shipstudio.dev) v0.3.53+
- [Claude Code](https://docs.anthropic.com/en/docs/build-with-claude/claude-code/overview) (GSD runs inside Claude Code)

## Usage

1. Click the **GSD** button in the toolbar
2. The plugin detects whether GSD is installed and whether your project has plans
3. If GSD isn't installed, click **Install** to open the interactive installer
4. Once plans exist, browse the dashboard — expand phases, click files to read them
5. Switch to the **Guide** tab for a walkthrough of the GSD workflow

## How it works

The plugin uses Ship Studio's shell API to check the filesystem:

- **GSD detection**: checks if `~/.claude/get-shit-done/` exists
- **Planning detection**: checks if `.planning/` exists in the project directory
- **File reading**: reads `.planning/` files via shell and renders markdown
- **Install**: opens `npx get-shit-done-cc@latest` in Ship Studio's interactive terminal
- **Delete**: removes files/directories via shell with confirmation dialogs

All plan management (creating projects, planning phases, executing work) happens in Claude Code — this plugin is a read-only dashboard with install and delete capabilities.

## Development

```bash
git clone https://github.com/ship-studio/plugin-gsd.git
cd plugin-gsd
npm install
npm run build
```

Link the local folder in Ship Studio via **Plugin Manager > Link Dev Plugin**.

```bash
npm run dev      # watch mode — rebuilds on save
npm run build    # one-off production build
```

After making changes, click **Reload** in Plugin Manager to pick them up.

> **Note:** Ship Studio loads plugins from the committed `dist/index.js`. Always rebuild and commit the bundle before pushing.

## Project structure

```
plugin-gsd/
├── src/
│   ├── index.tsx          # entry point — toolbar slot export
│   ├── useGsd.ts          # all state management and shell interactions
│   ├── context.ts         # Ship Studio plugin context (dual-pattern)
│   ├── styles.ts          # CSS-in-JS style injection
│   ├── types.ts            # TypeScript types
│   ├── utils/             # markdown rendering
│   └── views/
│       ├── OverviewView.tsx   # phase dashboard with accordion
│       ├── FileViewer.tsx     # markdown file viewer
│       ├── GuideView.tsx      # GSD workflow guide
│       ├── InstallView.tsx    # install prompt
│       ├── NoProjectView.tsx  # empty state
│       └── ConfirmDialog.tsx  # delete confirmation
├── dist/
│   └── index.js           # built bundle (committed to repo)
├── plugin.json            # plugin manifest
├── package.json
├── tsconfig.json
└── vite.config.ts         # build config with Ship Studio React shims
```

## License

MIT
