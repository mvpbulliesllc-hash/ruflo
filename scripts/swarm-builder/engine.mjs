/**
 * Swarm Builder — engine (pure, dependency-free ESM).
 *
 * Turns ANY build brief (markdown or plain text) + a target repo into an
 * executable swarm plan: phases → work packages → an agent roster, a
 * hierarchical topology, a task dependency graph, and verification gates.
 *
 * This module has NO node imports on purpose — it runs unchanged in Node and
 * in the browser (the mission-control web UI inlines it). The CLI (cli.mjs)
 * layers filesystem/argv on top; the renderer (render.mjs) turns a plan into
 * human text and runnable ruflo/Task commands.
 *
 * Design mirrors the repo's own Anti-Drift defaults (CLAUDE.md):
 *   hierarchical topology · maxAgents 6-8 · specialized strategy · raft consensus.
 */

// --------------------------------------------------------------------------
// Task-type classification → agent routing (mirrors CLAUDE.md "Agent Routing")
// --------------------------------------------------------------------------

/**
 * Ordered rules — first keyword hit wins. Each maps a work package to a task
 * code, a primary "doer" agent, and any extra specialists the code implies.
 */
const ROUTING_RULES = [
  {
    code: 9,
    label: 'Security',
    match: /\b(security|compliance|vuln|vulnerab|cve|auth|oauth|dnc|consent|opt-?out|10dlc|threat|hardening|secrets?|injection)\b/i,
    primary: 'security-auditor',
    specialists: ['security-architect'],
  },
  {
    code: 7,
    label: 'Performance',
    match: /\b(perf|performance|lighthouse|cwv|core web vitals|lcp|cls|inp|optimi[sz]e|speed|latency|image[s]?|avif|webp|srcset|bundle|lazy|preload|budget)\b/i,
    primary: 'perf-analyzer',
    specialists: ['performance-benchmarker'],
  },
  {
    code: 11,
    label: 'Memory/Data',
    match: /\b(database|schema migration|supabase|postgres|sql|index(es|ing)?|data model|enrich(ment)?|etl|pipeline|vector|embedding)\b/i,
    primary: 'backend-dev',
    specialists: ['database-specialist'],
  },
  {
    code: 5,
    label: 'Refactor',
    match: /\b(refactor|migrate|convert|move|restructure|modernize|rename|reorganize|301|redirect)\b/i,
    primary: 'coder',
    specialists: ['system-architect'],
  },
  {
    code: 13,
    label: 'Docs',
    match: /\b(document(ation)?|readme|build-notes|changelog|explainer|api docs|write-?up|guide)\b/i,
    primary: 'api-docs',
    specialists: ['researcher'],
  },
  {
    code: 1,
    label: 'Bug Fix',
    match: /\b(fix|bug|broken|404|resolve|repair|patch|regression|error)\b/i,
    primary: 'coder',
    specialists: ['researcher'],
  },
  {
    // Default: treat as a feature (build something new).
    code: 3,
    label: 'Feature',
    match: /.*/,
    primary: 'coder',
    specialists: ['system-architect'],
  },
];

export function classifyPackage(text = '') {
  const rule = ROUTING_RULES.find((r) => r.match.test(text)) || ROUTING_RULES[ROUTING_RULES.length - 1];
  return { code: rule.code, label: rule.label, primary: rule.primary, specialists: rule.specialists.slice() };
}

// --------------------------------------------------------------------------
// Brief parsing
// --------------------------------------------------------------------------

const SECTION_RE = /^#{1,6}\s+(.*\S)\s*$/;
const PHASE_HEADING_RE = /\bphase\b/i;
const BULLET_RE = /^\s*[-*]\s+(.*\S)\s*$/;
// A work-package bullet like:  **P1.1 Images (biggest win):** move ...
const WP_BOLD_RE = /^\s*[-*]\s+\*\*(.+?)\*\*[:：]?\s*(.*)$/;
const GATE_HEADING_RE = /\b(verification|verify|acceptance|done when|definition of done|gates?)\b/i;
const STANDARDS_HEADING_RE = /\b(standards?|global standards?|constraints?|do not break|guardrails?|rules?)\b/i;
const HUMAN_HEADING_RE = /\b(needs?\s+\w+|decisions?|inputs?\s+required|blocked|human|stop and flag)\b/i;
const CURRENT_HEADING_RE = /\b(current state|what.?s already|status quo|existing)\b/i;

function stripMd(s = '') {
  return s
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .trim();
}

function slug(s, fallback) {
  const base = String(s || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 40);
  return base || fallback;
}

/**
 * Parse a build brief into structured data.
 *
 * Strategy: walk the document heading-by-heading. Headings mentioning "phase"
 * (or bullets under a "build queue" section) become phases; bulleted lines
 * inside them become work packages. Dedicated sections (verification,
 * standards, needs-human, current-state) are captured separately. If the brief
 * has no phase headings at all, every top-level section becomes its own phase
 * and its bullets become work packages — so an arbitrary task list still works.
 */
export function parseBrief(raw = '', opts = {}) {
  const lines = String(raw).replace(/\r\n/g, '\n').split('\n');

  const brief = {
    title: opts.title || '',
    mission: '',
    repo: opts.repo || '',
    currentState: [],
    phases: [],
    standards: [],
    needsHuman: [],
    verificationGates: [],
  };

  let mode = 'preamble'; // preamble | phase | gates | standards | human | current | ignore
  let currentPhase = null;
  let pendingPhaseFromSection = false;

  const ensureTitle = (t) => {
    if (!brief.title) brief.title = stripMd(t);
  };

  const startPhase = (title) => {
    const id = `phase-${brief.phases.length + 1}`;
    currentPhase = { id, title: stripMd(title), goal: '', workPackages: [], verificationGates: [] };
    brief.phases.push(currentPhase);
    mode = 'phase';
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const heading = line.match(SECTION_RE);

    if (heading) {
      const level = (line.match(/^#+/) || ['#'])[0].length;
      const text = heading[1];

      if (level === 1) ensureTitle(text);

      if (GATE_HEADING_RE.test(text)) { mode = 'gates'; continue; }
      if (STANDARDS_HEADING_RE.test(text)) { mode = 'standards'; continue; }
      if (HUMAN_HEADING_RE.test(text)) { mode = 'human'; continue; }
      if (CURRENT_HEADING_RE.test(text)) { mode = 'current'; continue; }

      if (PHASE_HEADING_RE.test(text)) { startPhase(text); continue; }

      // A "build queue" / "work" container: subsequent sub-headings are phases.
      if (/\b(build queue|work packages?|swarm|tasks?|roadmap|plan)\b/i.test(text)) {
        pendingPhaseFromSection = true;
        mode = 'preamble';
        continue;
      }

      // Generic section: promote a top-level (H2) section to a phase so
      // arbitrary briefs still decompose. H1 is the document title, not a
      // phase; H3+ are sub-sections of an existing phase.
      if (level === 2 && (pendingPhaseFromSection || brief.phases.length === 0)) {
        // Skip pure-meta sections we don't want as phases.
        if (/\b(spec library|table of contents|overview|frame)\b/i.test(text)) { mode = 'ignore'; continue; }
        startPhase(text);
        continue;
      }

      // Sub-heading inside a phase: fold into goal text, stay in phase mode.
      if (mode === 'phase' && currentPhase) continue;
      mode = 'ignore';
      continue;
    }

    const trimmed = line.trim();
    if (!trimmed) continue;

    if (mode === 'gates') { brief.verificationGates.push(...splitBullets(trimmed)); continue; }
    if (mode === 'standards') { brief.standards.push(...splitBullets(trimmed)); continue; }
    if (mode === 'human') { brief.needsHuman.push(...splitBullets(trimmed)); continue; }
    if (mode === 'current') { brief.currentState.push(...splitBullets(trimmed)); continue; }

    if (mode === 'preamble') {
      if (!brief.mission && BULLET_RE.test(line) === false && !/^>/.test(trimmed)) {
        brief.mission = stripMd(trimmed).slice(0, 300);
      }
      continue;
    }

    if (mode === 'phase' && currentPhase) {
      const wpBold = line.match(WP_BOLD_RE);
      if (wpBold) {
        addWorkPackage(currentPhase, wpBold[1], wpBold[2]);
        continue;
      }
      const bullet = line.match(BULLET_RE);
      if (bullet) {
        // Nested/continuation bullets → still a work package.
        addWorkPackage(currentPhase, bullet[1], '');
        continue;
      }
      // Prose under a phase heading → phase goal.
      if (!currentPhase.goal && !/^>/.test(trimmed)) {
        currentPhase.goal = stripMd(trimmed).slice(0, 300);
      }
    }
  }

  // Fallback: a brief with sections but no detected work packages — synthesize
  // one package per phase so the swarm still has something to do.
  for (const p of brief.phases) {
    if (p.workPackages.length === 0 && (p.goal || p.title)) {
      addWorkPackage(p, p.title, p.goal);
    }
  }

  return brief;
}

function splitBullets(s) {
  const m = s.match(BULLET_RE);
  if (m) return [stripMd(m[1])];
  // Table rows / plain lines: keep as one item.
  const cleaned = stripMd(s.replace(/^\|/, '').replace(/\|$/, '')).trim();
  return cleaned ? [cleaned] : [];
}

function addWorkPackage(phase, titleRaw, detailRaw) {
  const title = stripMd(titleRaw);
  if (!title) return;
  const detail = stripMd(detailRaw);
  const idFromTitle = (title.match(/^([A-Z]?\d+(?:\.\d+)*)/) || [])[1];
  const id = idFromTitle
    ? `wp-${slug(idFromTitle, String(phase.workPackages.length + 1))}`
    : `${phase.id}-wp-${phase.workPackages.length + 1}`;
  const cls = classifyPackage(`${title} ${detail}`);
  phase.workPackages.push({
    id,
    title,
    detail,
    taskCode: cls.code,
    taskLabel: cls.label,
    primaryAgent: cls.primary,
    specialists: cls.specialists,
  });
}

// --------------------------------------------------------------------------
// Swarm planning
// --------------------------------------------------------------------------

const ANTI_DRIFT = Object.freeze({
  topology: 'hierarchical',
  strategy: 'specialized',
  consensus: 'raft',
  maxAgentsCap: 8,
});

/**
 * Build a swarm plan from a parsed brief. One coordinated swarm per phase
 * (hierarchical, raft, specialized), each with a coordinator, per-package
 * doers, a tester and a reviewer — capped at 8 agents (Anti-Drift default).
 */
export function planSwarm(brief) {
  const phases = brief.phases.map((phase, pIdx) => {
    const roster = [];
    const seen = new Set();
    const add = (name, agentType, role, worksOn = []) => {
      if (seen.has(name)) {
        const existing = roster.find((r) => r.name === name);
        if (existing) existing.worksOn.push(...worksOn);
        return existing;
      }
      seen.add(name);
      const entry = { name, agentType, role, worksOn: worksOn.slice() };
      roster.push(entry);
      return entry;
    };

    // Coordinator (hierarchical lead).
    add('coordinator', 'hierarchical-coordinator', 'Owns the phase, assigns work, maintains authoritative state (raft leader).');

    // Doers — one specialist per work package, deduped by agent type to stay
    // under the cap. Packages sharing an agent type collapse onto one doer.
    const doersByType = new Map();
    for (const wp of phase.workPackages) {
      const type = wp.primaryAgent;
      const name = shortName(type, doersByType.size + 1);
      if (!doersByType.has(type)) {
        doersByType.set(type, add(name, type, `Implements ${wp.taskLabel.toLowerCase()} work.`, [wp.id]));
      } else {
        doersByType.get(type).worksOn.push(wp.id);
      }
    }

    // Verification lane — always present.
    add('tester', 'tester', 'Writes/runs tests for delivered packages, reports to reviewer.');
    add('reviewer', 'reviewer', 'Reviews quality, security, and enforces the phase verification gates.');

    // Enforce the anti-drift cap: if doers overflow, fold the least-critical
    // extra doers into the generic coder and note it.
    const overflow = roster.length > ANTI_DRIFT.maxAgentsCap;

    const taskGraph = buildTaskGraph(phase, roster);

    return {
      id: phase.id,
      title: phase.title,
      goal: phase.goal,
      swarm: {
        topology: ANTI_DRIFT.topology,
        strategy: ANTI_DRIFT.strategy,
        consensus: ANTI_DRIFT.consensus,
        maxAgents: Math.min(Math.max(roster.length, 4), ANTI_DRIFT.maxAgentsCap),
        cappedOverflow: overflow,
      },
      roster,
      taskGraph,
      workPackages: phase.workPackages,
      verificationGates: phase.verificationGates.length
        ? phase.verificationGates
        : brief.verificationGates.filter((g) => new RegExp(`phase\\s*${pIdx + 1}`, 'i').test(g)),
    };
  });

  return {
    title: brief.title,
    mission: brief.mission,
    repo: brief.repo,
    generatedFor: 'ruflo swarm',
    antiDrift: ANTI_DRIFT,
    phases,
    globalGates: brief.verificationGates,
    standards: brief.standards,
    needsHuman: brief.needsHuman,
    summary: {
      phaseCount: phases.length,
      packageCount: phases.reduce((n, p) => n + p.workPackages.length, 0),
      agentCount: phases.reduce((n, p) => n + p.roster.length, 0),
      blockers: brief.needsHuman.length,
    },
  };
}

function shortName(agentType, n) {
  const base = agentType.replace(/-(dev|auditor|architect|analyzer|benchmarker|specialist|coordinator)$/,'');
  return `${base || agentType}-${n}`;
}

/**
 * Task graph: coordinator → doers (parallel) → tester → reviewer, per phase.
 * Doers depend on the coordinator's kickoff; verification depends on all doers.
 */
function buildTaskGraph(phase, roster) {
  const doers = roster.filter((r) => r.role.startsWith('Implements'));
  const nodes = [];
  const kickoff = { id: `${phase.id}-kickoff`, wp: null, agent: 'coordinator', dependsOn: [] };
  nodes.push(kickoff);

  const doerNodes = [];
  for (const wp of phase.workPackages) {
    const doer = doers.find((d) => d.worksOn.includes(wp.id)) || doers[0] || { name: 'coder-1' };
    const node = { id: `${wp.id}-task`, wp: wp.id, agent: doer.name, dependsOn: [kickoff.id] };
    nodes.push(node);
    doerNodes.push(node.id);
  }

  const testNode = { id: `${phase.id}-test`, wp: null, agent: 'tester', dependsOn: doerNodes.length ? doerNodes : [kickoff.id] };
  const reviewNode = { id: `${phase.id}-review`, wp: null, agent: 'reviewer', dependsOn: [testNode.id] };
  nodes.push(testNode, reviewNode);
  return nodes;
}

export const _internals = { ANTI_DRIFT, ROUTING_RULES, slug, stripMd };
