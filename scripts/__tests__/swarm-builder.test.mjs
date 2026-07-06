#!/usr/bin/env node
/**
 * Tests for scripts/swarm-builder — the brief → swarm-plan engine.
 *
 * Covers: parsing (phases, work packages, gates, standards, needs-human),
 * task-type classification, roster/anti-drift planning, the task graph, and the
 * CLI end-to-end on the shipped ECO MATRIX example.
 *
 * Run via:  node scripts/__tests__/swarm-builder.test.mjs
 * (also picked up by `npm test` / vitest via the *.test.mjs glob)
 */

import { execFileSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';

import { parseBrief, planSwarm, classifyPackage } from '../swarm-builder/engine.mjs';
import { renderHuman, renderCommands } from '../swarm-builder/render.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..', '..');
const CLI = join(REPO_ROOT, 'scripts', 'swarm-builder', 'cli.mjs');
const EXAMPLE = join(REPO_ROOT, 'scripts', 'swarm-builder', 'examples', 'eco-matrix-brief.md');

let failures = 0;
function test(name, fn) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
  } catch (err) {
    failures++;
    console.error(`  ✗ ${name}\n      ${err.message}`);
  }
}

const SAMPLE = `# My Product Build

Ship a fast, secure checkout flow.

## Current State

- Legacy checkout exists.

## Roadmap

### Phase 1 — Foundations

Set up the base.

- **Auth hardening:** add OAuth and fix the token-leak vulnerability.
- **Perf pass:** optimize the LCP image and cut bundle size.
- **Docs:** write the integration guide.

### Phase 2 — Data

- **Schema migration:** move the orders table to a new Postgres index.

## Standards

- Test before shipping.

## Verification Gates

- Phase 1 done when Lighthouse >= 95 and no auth vulns.

## Needs Human

- Production Stripe key.
`;

console.log('test: classifyPackage routes by keyword');
test('security keywords → Security/security-auditor', () => {
  const c = classifyPackage('fix the token-leak vulnerability in oauth');
  assert.equal(c.label, 'Security');
  assert.equal(c.primary, 'security-auditor');
});
test('perf keywords → Performance/perf-analyzer', () => {
  const c = classifyPackage('optimize the LCP image and bundle');
  assert.equal(c.label, 'Performance');
  assert.equal(c.primary, 'perf-analyzer');
});
test('data keywords → Memory/Data/backend-dev', () => {
  const c = classifyPackage('move the orders table to a new postgres index');
  assert.equal(c.label, 'Memory/Data');
  assert.equal(c.primary, 'backend-dev');
});
test('doc keywords → Docs/api-docs', () => {
  const c = classifyPackage('write the integration guide documentation');
  assert.equal(c.label, 'Docs');
});
test('unknown text → Feature default', () => {
  const c = classifyPackage('build a brand new widget gallery');
  assert.equal(c.label, 'Feature');
  assert.equal(c.primary, 'coder');
});

console.log('test: parseBrief structures the document');
const brief = parseBrief(SAMPLE, { repo: 'github.com/acme/shop' });
test('title comes from H1, not a phase', () => {
  assert.equal(brief.title, 'My Product Build');
});
test('only real phases are detected', () => {
  assert.equal(brief.phases.length, 2);
  assert.match(brief.phases[0].title, /Phase 1/);
  assert.match(brief.phases[1].title, /Phase 2/);
});
test('work packages parsed with detail', () => {
  assert.equal(brief.phases[0].workPackages.length, 3);
  const auth = brief.phases[0].workPackages[0];
  assert.match(auth.title, /Auth hardening/);
  assert.match(auth.detail, /OAuth/);
  assert.equal(auth.taskLabel, 'Security');
});
test('standards, gates, needs-human captured separately (not as phases)', () => {
  assert.equal(brief.standards.length, 1);
  assert.equal(brief.verificationGates.length, 1);
  assert.equal(brief.needsHuman.length, 1);
  assert.match(brief.needsHuman[0], /Stripe/);
});
test('current-state captured, not a phase', () => {
  assert.equal(brief.currentState.length, 1);
});

console.log('test: planSwarm applies anti-drift defaults');
const plan = planSwarm(brief);
test('every phase uses hierarchical/specialized/raft', () => {
  for (const p of plan.phases) {
    assert.equal(p.swarm.topology, 'hierarchical');
    assert.equal(p.swarm.strategy, 'specialized');
    assert.equal(p.swarm.consensus, 'raft');
    assert.ok(p.swarm.maxAgents <= 8, 'maxAgents capped at 8');
  }
});
test('roster has coordinator + tester + reviewer + deduped doers', () => {
  const p1 = plan.phases[0];
  const names = p1.roster.map((r) => r.name);
  assert.ok(names.includes('coordinator'));
  assert.ok(names.includes('tester'));
  assert.ok(names.includes('reviewer'));
  // 3 packages span security/perf/docs → 3 distinct doer types.
  const doerTypes = new Set(p1.roster.filter((r) => r.role.startsWith('Implements')).map((r) => r.agentType));
  assert.equal(doerTypes.size, 3);
});
test('same-agent packages collapse onto one doer', () => {
  // Two feature packages should share a single coder doer.
  const b = parseBrief('## Work\n\n- **A:** build a new page.\n- **B:** build another new page.\n');
  const pl = planSwarm(b);
  const coders = pl.phases[0].roster.filter((r) => r.agentType === 'coder');
  assert.equal(coders.length, 1);
  assert.equal(coders[0].worksOn.length, 2);
});
test('task graph wires kickoff → doers → test → review', () => {
  const p1 = plan.phases[0];
  const g = p1.taskGraph;
  const kickoff = g.find((n) => n.id.endsWith('-kickoff'));
  const review = g.find((n) => n.id.endsWith('-review'));
  const test = g.find((n) => n.id.endsWith('-test'));
  assert.ok(kickoff && review && test);
  assert.deepEqual(review.dependsOn, [test.id]);
  assert.ok(test.dependsOn.length >= 1);
});
test('summary counts are consistent', () => {
  assert.equal(plan.summary.phaseCount, 2);
  assert.equal(plan.summary.packageCount, 4);
  assert.equal(plan.summary.blockers, 1);
});

console.log('test: renderers produce usable output');
test('renderHuman includes phases, roster, gates, blockers', () => {
  const out = renderHuman(plan);
  assert.match(out, /SWARM BUILD PLAN/);
  assert.match(out, /PHASE 1/);
  assert.match(out, /NEEDS A HUMAN/);
  assert.match(out, /Stripe/);
});
test('renderCommands emits valid swarm_init + Task + kickoff', () => {
  const cmd = renderCommands(plan, 0);
  assert.match(cmd.mcp, /swarm_init/);
  assert.match(cmd.mcp, /hierarchical/);
  assert.ok(cmd.tasks.length >= 4);
  assert.match(cmd.block, /Task\(\{/);
  assert.match(cmd.kickoff, /SendMessage/);
  // Each Task prompt must be valid JSON-quoted (round-trips).
  for (const t of cmd.tasks) {
    const m = t.match(/prompt: (".*")\s*\}\)/s);
    assert.ok(m, 'task has a quoted prompt');
    assert.doesNotThrow(() => JSON.parse(m[1]));
  }
});

console.log('test: CLI end-to-end on the ECO MATRIX example');
function runCli(args) {
  try {
    return { code: 0, stdout: execFileSync('node', [CLI, ...args], { encoding: 'utf8', cwd: REPO_ROOT }) };
  } catch (err) {
    return { code: err.status ?? 1, stdout: err.stdout?.toString() ?? '', stderr: err.stderr?.toString() ?? '' };
  }
}
test('human output on the shipped example', () => {
  const r = runCli([EXAMPLE, '--repo', 'github.com/paragon/site']);
  assert.equal(r.code, 0);
  assert.match(r.stdout, /3 phases/);
  assert.match(r.stdout, /Paragon flagship/);
  assert.match(r.stdout, /\[Security\]/);
});
test('--json emits a parseable plan', () => {
  const r = runCli([EXAMPLE, '--json']);
  assert.equal(r.code, 0);
  const p = JSON.parse(r.stdout);
  assert.equal(p.phases.length, 3);
  assert.ok(p.summary.packageCount >= 13);
});
test('--commands emits a runnable block', () => {
  const r = runCli([EXAMPLE, '--commands', '--phase', '1']);
  assert.equal(r.code, 0);
  assert.match(r.stdout, /RUNNABLE SWARM/);
  assert.match(r.stdout, /mcp__ruv-swarm__swarm_init/);
});
test('empty brief exits non-zero (nothing to swarm)', () => {
  const r = runCli(['-']);
  // stdin is a TTY-less empty pipe here → help path (exit 2) or no-packages (3).
  assert.notEqual(r.code, 0);
});

if (failures) {
  console.error(`\n${failures} swarm-builder test(s) failed`);
  process.exit(1);
}
console.log('\nall swarm-builder tests passed');
