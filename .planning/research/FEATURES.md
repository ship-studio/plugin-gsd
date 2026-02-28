# Feature Research

**Domain:** CLI tool management / GUI bridge plugin (Ship Studio toolbar plugin)
**Researched:** 2026-02-28
**Confidence:** HIGH — grounded in direct inspection of 5 reference plugins (Vercel, Cloudflare, Figma, Memberstack, Dependency Checker) plus VS Code UX guidelines

---

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist. Missing these = product feels incomplete or broken.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Toolbar button entry point | Every Ship Studio plugin uses this slot; deviating confuses users | LOW | `className="toolbar-icon-btn"` — established host pattern |
| GSD installation detection on load | Users need to know immediately if GSD is ready or needs setup | LOW | Check `~/.claude/get-shit-done/` existence via `shell.exec('test', ['-d', path])` |
| One-click interactive install | Installing a CLI via a GUI means zero terminal knowledge required; anything less defeats the purpose | MEDIUM | `actions.openTerminal('npx', ['get-shit-done-cc@latest'], { title: 'Install GSD' })` — mirrors Vercel plugin's `vercel login` pattern exactly |
| Project plan detection | Users expect the plugin to know if the current project has GSD plans | LOW | Check `.planning/` existence via `shell.exec('test', ['-d', '.planning'])` |
| Plan dashboard overview | Any dashboard plugin shows the primary data; a plan viewer that can't show plans is broken | MEDIUM | Read ROADMAP.md and phase dirs; parse phase names + statuses |
| Drill-down file reading | Clicking a plan item must show the content; a list without detail is just an index | MEDIUM | `shell.exec('cat', [filePath])` — display raw markdown in scrollable panel |
| Delete with confirmation | Destructive actions require an explicit confirm step; all reference plugins (Memberstack logout, Cloudflare disconnect) use this pattern | LOW | Two-step: "Delete" → confirm dialog → execute `rm -rf` |
| Toast feedback on actions | Ship Studio provides `actions.showToast()`; users expect all significant actions to produce visible feedback | LOW | On install success/fail, on delete complete, on load errors |
| Loading states | Users need to know the plugin is working, not frozen | LOW | Spinner or disabled state during `shell.exec` calls |
| Error state handling | If GSD is not installed, if `.planning/` is missing, or if a file read fails — each needs a distinct, clear state | LOW | Not showing an error is worse than showing the wrong one |

### Differentiators (Competitive Advantage)

Features that set this plugin apart. Not baseline expectations, but aligned with the core value: *make GSD approachable to CLI-averse users*.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| GSD workflow guide page | Users who've never used GSD need a mental model before they touch the CLI; in-plugin education removes the README dependency entirely | MEDIUM | Static view with discuss → plan → execute → verify illustrated simply; no external links required for basic understanding |
| Contextual next-step hints | Surfaces the exact GSD command to run based on current project state (e.g., "No phases started — run `/gsd:plan-phase 1` next") | MEDIUM | Requires parsing STATE.md and ROADMAP.md; conditional rendering based on plan state. Depends on: plan dashboard |
| Phase status visualization | Shows which phases are pending / in-progress / complete at a glance, without requiring the user to open files | MEDIUM | Parse phase folder names and plan file headers; present as visual list with status badges |
| Granular delete (file or folder) | Users may want to delete a stale phase plan without nuking the entire `.planning/` dir | MEDIUM | Depends on: plan dashboard (must know what exists before offering to delete it) |
| Install state persistence across sessions | Caching whether GSD is installed avoids a filesystem check on every plugin open | LOW | `storage.write({ gsdInstalled: true })` — invalidate on project change. Mirrors Vercel plugin's project status caching approach |
| "What's next" empty state | When no `.planning/` exists, show a helpful prompt ("No plans yet — run /gsd:new-project in Claude Code to get started") rather than a blank panel | LOW | Replaces generic "no data" message with actionable guidance |

### Anti-Features (Deliberately NOT Building)

Features that seem reasonable but create problems for this specific plugin's scope and constraints.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Editing `.planning/` files from the plugin | Users want to adjust plans without switching to a text editor | Turns a read-only viewer into a full editor: requires conflict handling, encoding, autosave, undo — scope doubles minimum. GSD files are meant to be edited by the AI, not by hand. | Users edit in Ship Studio's built-in editor; plugin stays read-only |
| Running GSD slash commands from the plugin | "Just run `/gsd:plan-phase 1` for me" sounds convenient | GSD commands require Claude Code's full context (the AI session, conversation history, project awareness) — they cannot be triggered from a shell exec. Running them would produce nothing or an error. | Contextual hints tell the user *which* command to run; they execute it themselves in Claude Code |
| Multi-runtime support (OpenCode, Gemini CLI, Codex) | Future-proofing the plugin for other AI agents | Ship Studio is a Claude Code tool. Supporting other runtimes requires different install paths, different file formats, different detection logic — scope multiplies for zero current users | Hard-scope to Claude Code; document this in the plugin's description |
| Auto-refresh polling for plan changes | Keeps the view up-to-date without manual refresh | Constant `shell.exec` polling on a modal plugin creates unnecessary I/O and battery drain when users aren't actively using the plugin | Manual refresh button; re-check on modal open |
| Plan creation from the plugin | "Start a new project" button in the plugin | Plugin can't run `/gsd:new-project` — that's a Claude Code slash command requiring the AI. Adding a fake button confuses users about what the plugin can actually do. | Link users to the Claude Code terminal with a hint to run `/gsd:new-project` |
| Embedded terminal in the plugin | Show the installer running inline | Ship Studio's `openTerminal()` already does this with a real, interactive terminal. Reimplementing it inside the modal adds complexity with no improvement. | Use `openTerminal()` as intended |
| Version checking / GSD update notifications | "Your GSD is outdated" banner | GSD installs via npx, which always fetches latest. There is no persistent version to compare against — the installed copy is whatever was there when `npx` last ran. | Not applicable; npx handles this |

---

## Feature Dependencies

```
[GSD Installation Detection]
    └──required by──> [Plan Dashboard]
                           └──required by──> [Contextual Next-Step Hints]
                           └──required by──> [Granular Delete]
                           └──required by──> [Phase Status Visualization]
                           └──required by──> [Drill-Down File Reading]

[One-Click Install]
    └──requires──> [GSD Installation Detection] (to know when install is needed)

[Delete with Confirmation]
    └──requires──> [GSD Installation Detection]
    └──requires──> [Plan Dashboard] (to know what exists)

[GSD Workflow Guide]
    ──independent──> (no dependencies; always displayable as a tab/view)

[Install State Persistence]
    └──enhances──> [GSD Installation Detection] (skips redundant filesystem check)
```

### Dependency Notes

- **Plan Dashboard requires GSD Installation Detection:** No point rendering plan data if GSD isn't installed; detection must happen first and gate the dashboard view.
- **Contextual hints require Plan Dashboard:** Hints are derived from current plan state (STATE.md, ROADMAP.md contents) — the dashboard must load that data first.
- **Granular delete requires Plan Dashboard:** The plugin must know what files/folders exist before it can offer to delete individual items.
- **One-click install requires Detection:** The install CTA is only shown when detection confirms GSD is absent.
- **Workflow Guide is independent:** It explains GSD conceptually and has no runtime dependencies — it can be shown regardless of install state. This makes it useful as the "no GSD yet" fallback view.

---

## MVP Definition

### Launch With (v1)

Minimum viable product — validates the core premise that the plugin makes GSD accessible.

- [ ] **Toolbar button + modal shell** — entry point consistent with Ship Studio plugin conventions
- [ ] **GSD installation detection** — the binary decision that gates everything else
- [ ] **One-click interactive install** — the primary "before GSD" action; without this, non-CLI users are stuck
- [ ] **Project plan detection** — know if `.planning/` exists
- [ ] **Plan dashboard overview** — show phases and statuses; the primary "after GSD" view
- [ ] **Drill-down file reading** — click a phase/file and see its contents
- [ ] **Delete entire `.planning/` with confirmation** — the one destructive action called out in requirements
- [ ] **GSD workflow guide page** — makes the plugin self-contained for new users; directly serves core value
- [ ] **Toast feedback + loading + error states** — table stakes; without these the plugin feels broken

### Add After Validation (v1.x)

Add when core is working and users confirm the basic flow has value.

- [ ] **Contextual next-step hints** — trigger: users report not knowing what to do after opening the plugin; requires plan dashboard to be solid first
- [ ] **Granular file/folder delete** — trigger: users report needing to delete specific phases without nuking everything
- [ ] **Install state persistence** — trigger: perceived slowness on detection; low complexity, high polish payoff

### Future Consideration (v2+)

Defer until product-market fit is established.

- [ ] **Phase status visualization badges** — depends on stable ROADMAP.md/STATE.md format; defer until GSD's file format stabilizes
- [ ] **"What's next" empty state refinements** — iterate based on actual user confusion patterns observed post-launch

---

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Toolbar button + modal shell | HIGH | LOW | P1 |
| GSD installation detection | HIGH | LOW | P1 |
| One-click interactive install | HIGH | LOW | P1 |
| Project plan detection | HIGH | LOW | P1 |
| Plan dashboard overview | HIGH | MEDIUM | P1 |
| Drill-down file reading | HIGH | MEDIUM | P1 |
| Delete `.planning/` with confirmation | MEDIUM | LOW | P1 |
| GSD workflow guide page | HIGH | MEDIUM | P1 |
| Toast / loading / error states | HIGH | LOW | P1 |
| Contextual next-step hints | HIGH | MEDIUM | P2 |
| Granular delete (file/folder) | MEDIUM | MEDIUM | P2 |
| Install state persistence | LOW | LOW | P2 |
| Phase status visualization badges | MEDIUM | MEDIUM | P3 |

**Priority key:**
- P1: Must have for launch
- P2: Should have, add when possible
- P3: Nice to have, future consideration

---

## Competitor Feature Analysis

The relevant reference point is not traditional "competitors" but analogous CLI bridge plugins within the Ship Studio ecosystem. These inform what's table stakes vs. differentiating.

| Feature | Vercel Plugin | Cloudflare Plugin | Memberstack Plugin | GSD Plugin Approach |
|---------|---------------|-------------------|--------------------|---------------------|
| CLI install detection | `shell.exec('vercel', ['--version'])` on every open | `wrangler --version` check | N/A (API token-based) | `test -d ~/.claude/get-shit-done/` — filesystem check, not CLI version |
| Interactive install | `openTerminal('vercel', ['login'])` | Inline flow | N/A | `openTerminal('npx', ['get-shit-done-cc@latest'])` — same pattern as Vercel |
| State persistence | Stores project.json path, connection status | Stores linked project config | Stores API token + user | Cache `gsdInstalled` flag to skip repeated FS checks |
| Confirmation for destructive actions | "Disconnect" requires confirm | "Remove" requires confirm | "Log Out" requires confirm | Delete `.planning/` requires confirm; same 2-step pattern |
| Data dashboard | Deployment status, URL, age | Deployment status, project link | App list with roles | Phase list with statuses and file drill-down |
| In-plugin education | None (assumes Vercel knowledge) | None (assumes Cloudflare knowledge) | None (assumes Memberstack knowledge) | Workflow guide page — **differentiator**, no reference plugin has this |
| Contextual hints | None | None | None | Next-step hints based on plan state — **differentiator** |

---

## Sources

- Direct code inspection: `/Users/juliangalluzzo/Desktop/Projects/shipstudio-plugins/plugin-vercel/src/index.tsx` — Vercel plugin reference implementation (installation detection, `openTerminal`, state management patterns)
- Direct code inspection: `/Users/juliangalluzzo/Desktop/Projects/shipstudio-plugins/plugin-cloudflare/src/index.tsx` — Cloudflare plugin (disconnect/confirm pattern, project linking)
- Direct code inspection: `/Users/juliangalluzzo/Desktop/Projects/shipstudio-plugins/plugin-figma/src/` — Figma plugin (multi-view routing: Setup / Main / Settings; token persistence)
- Direct code inspection: `/Users/juliangalluzzo/Desktop/Projects/shipstudio-plugins/plugin-memberstack/src/ConnectedView.tsx` — Memberstack (confirmLogout two-step pattern, refresh button)
- Direct code inspection: `/Users/juliangalluzzo/Desktop/Projects/shipstudio-plugins/plugin-dependency-checker/src/index.tsx` — Dependency Checker (scan + update action pattern, multi-stack detection)
- Direct code inspection: `/Users/juliangalluzzo/Desktop/Projects/shipstudio-plugins/plugin-starter/src/index.tsx` — Plugin starter (canonical API surface: shell, storage, invoke, actions, theme)
- Project context: `/Users/juliangalluzzo/Desktop/Projects/shipstudio-plugins/plugin-gsd/.planning/PROJECT.md`
- VS Code UX Guidelines: https://code.visualstudio.com/api/ux-guidelines/overview (MEDIUM confidence — VS Code patterns, not Ship Studio, but toolbar/status/onboarding principles transfer)
- Dev tool onboarding research: https://evilmartians.com/chronicles/easy-and-epiphany-4-ways-to-stop-misguided-dev-tools-users-onboarding (MEDIUM confidence — general principle: progressive disclosure, contextual guidance over upfront tutorials)

---

*Feature research for: CLI tool management / GUI bridge plugin (GSD + Ship Studio)*
*Researched: 2026-02-28*
