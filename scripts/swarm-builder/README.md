# Swarm Builder

**Point it at any repo, hand it any build brief — it decomposes the work into a
runnable ruflo swarm.**

Swarm Builder is the "front door" to ruflo's swarm engine. You give it a build
brief (a markdown/plain-text description of what needs to happen) and a target
repository; it returns an executable plan:

- **Phases → work packages** parsed from the brief
- **Task-type classification** per package (Security / Performance / Feature /
  Refactor / Docs / Bug Fix / Memory-Data), mapped to the right agent
- **An anti-drift agent roster** per phase — `hierarchical` topology,
  `specialized` strategy, `raft` consensus, `maxAgents ≤ 8` (the CLAUDE.md
  defaults)
- **A task dependency graph** — coordinator → doers (parallel) → tester → reviewer
- **Verification gates**, **global standards**, and **"needs a human" blockers**
  pulled out of the brief so they aren't silently skipped
- **Runnable output** — the exact `mcp__ruv-swarm__swarm_init` + `Task(...)` +
  `SendMessage(...)` block to paste into Claude Code, plus CLI equivalents

## CLI

```bash
# Human-readable plan
node scripts/swarm-builder/cli.mjs <brief.md> --repo github.com/acme/site

# Machine-readable plan (JSON)
node scripts/swarm-builder/cli.mjs <brief.md> --json

# Emit the runnable swarm for phase 1 (paste into Claude Code)
node scripts/swarm-builder/cli.mjs <brief.md> --repo <url> --commands --phase 1

# Read the brief from stdin
cat brief.md | node scripts/swarm-builder/cli.mjs - --commands
```

Exit codes: `0` success · `1` unreadable brief · `2` usage/help · `3` brief
yielded zero work packages (nothing to swarm).

### Try it on the shipped example

```bash
node scripts/swarm-builder/cli.mjs scripts/swarm-builder/examples/eco-matrix-brief.md \
  --repo github.com/paragon/paragon-site --commands
```

## Web UI (mission control)

Open `scripts/swarm-builder/web/index.html` in a browser (or serve the folder).
Paste a brief + repo and it renders the plan live — stat row, phase cards with
roster chips and work packages, the runnable swarm block with a copy button, and
the blockers/standards panels. The engine runs client-side; the same logic
mirrors `engine.mjs` / `render.mjs`.

## Programmatic

```js
import { buildPlan } from './scripts/swarm-builder/index.mjs';

const { plan, human, commands } = buildPlan(briefText, { repo: 'github.com/acme/site' });
console.log(human);          // readable report
console.log(commands.block); // paste-into-Claude-Code swarm block
// plan.phases[i].roster / .taskGraph / .verificationGates for programmatic use
```

## How the brief is parsed

| Brief section (heading keywords) | Becomes |
| :-- | :-- |
| `# Title` | Plan title (never a phase) |
| `## Build Queue` / `Roadmap` / `Tasks` | Container — its sub-sections become phases |
| `### Phase N — …` (or any H2 when no explicit phases) | A phase |
| `- **Name:** detail` or `- bullet` under a phase | A work package |
| `## Verification / Gates / Done when` | Verification gates |
| `## Standards / Guardrails / Do not break` | Global standards |
| `## Needs … / Decisions / Blocked` | Human blockers (flagged, never guessed) |
| `## Current State / Existing` | Current-state notes |

Briefs with no explicit `Phase` headings still decompose — each H2 section
becomes a phase and its bullets become work packages — so an arbitrary task list
works too.

## Files

| File | Role |
| :-- | :-- |
| `engine.mjs` | Pure parser + planner + classifier (no node deps; browser-portable) |
| `render.mjs` | Human report + runnable-command renderers |
| `cli.mjs` | Command-line entry |
| `index.mjs` | Programmatic `buildPlan()` |
| `web/index.html` | Mission-control web UI |
| `examples/eco-matrix-brief.md` | Worked example |
| `../__tests__/swarm-builder.test.mjs` | Test suite (`node scripts/__tests__/swarm-builder.test.mjs`) |

## What this does and doesn't do

It **plans and dispatches** — it turns intent into a correct, anti-drift swarm
and the commands to run it. It does **not** clone repos or execute agents itself;
execution happens where ruflo runs (Claude Code or the CLI), which is where the
API keys and tools live. Feed the generated block to Claude Code to actually
build.
