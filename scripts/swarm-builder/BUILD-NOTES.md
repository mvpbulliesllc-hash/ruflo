# BUILD-NOTES — Swarm Builder

## Context

The "ECO MATRIX — Master Build" brief was dispatched onto the `ruflo` tooling
repo (`mvpbulliesllc-hash/ruflo`, package `claude-flow`). That brief describes
building three *separate* deliverables — the Paragon Exteriors Astro site, the
ECO MATRIX agency site, and a Next.js/Supabase lead-gen platform — none of which
live in this repo, and whose referenced spec files are not present on disk.

Rather than scaffold a roofing site inside the orchestration monorepo (wrong
repo, absent specs, unreachable deploy targets), the request was reframed with
the requester to what they actually wanted:

> "I want this stood up as an app — give it any repo and swarm whatever tasks
> need to be accomplished for that build."

So the deliverable is the **front door to ruflo's swarm engine**: an app that
takes any repo + any build brief and produces a runnable, anti-drift swarm plan.
The ECO MATRIX brief is now just the first thing you feed it.

## What was built

`scripts/swarm-builder/` — a self-contained, dependency-free tool:

- `engine.mjs` — brief parser + task-type classifier + swarm planner (pure ESM)
- `render.mjs` — human report + runnable `swarm_init`/`Task`/`SendMessage` blocks
- `cli.mjs` — CLI (`--repo`, `--json`, `--commands`, `--phase`, stdin support)
- `index.mjs` — programmatic `buildPlan()`
- `web/index.html` — mission-control web UI (engine mirrored client-side)
- `examples/eco-matrix-brief.md` — worked example
- `../__tests__/swarm-builder.test.mjs` — 21-test suite

The planner applies the repo's documented Anti-Drift defaults: hierarchical
topology, specialized strategy, raft consensus, `maxAgents ≤ 8`, with a
coordinator + deduped per-package doers + tester + reviewer per phase, and a
`kickoff → doers → test → review` task graph. Classification maps to the
CLAUDE.md Agent Routing table.

## Verification (evidence, not confidence)

| Check | Result |
| :-- | :-- |
| Unit + integration tests (`node scripts/__tests__/swarm-builder.test.mjs`) | **21/21 pass** |
| CLI on ECO MATRIX example (`--repo … `) | 3 phases · 13 work packages · 21 agent slots · 4 blockers |
| CLI classification | Images/CWV→Performance, Compliance→Security, Enrichment→Memory/Data, Explainers→Docs |
| CLI `--commands` | Emits valid `mcp__ruv-swarm__swarm_init` + 5 `Task(...)` + `SendMessage(...)`; every Task prompt round-trips as JSON |
| Web UI (headless Chromium) | Renders 3 phases, 16 roster chips, valid swarm block, **0 console errors**; parity with CLI engine |

## Known scope boundary

Swarm Builder **plans and dispatches**; it does not clone repos or execute
agents itself — execution happens where ruflo runs (Claude Code / CLI), which is
where API keys and tools live. Building the actual Paragon / ECO MATRIX / lead-gen
deliverables is a separate effort in their own repositories, and several inputs
in the brief still require the client (GBP URL, service radius, template
licenses, API keys) — the tool surfaces these as "needs a human" blockers rather
than guessing them.
