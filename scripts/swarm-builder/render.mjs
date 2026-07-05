/**
 * Swarm Builder — renderers (pure, dependency-free ESM).
 *
 * Turn a plan (from engine.planSwarm) into:
 *   - renderHuman(plan)     → a readable phase/roster/task-graph report
 *   - renderCommands(plan)  → runnable ruflo MCP + Task-tool spawn blocks and
 *                             CLI equivalents, matching CLAUDE.md's Auto-Start
 *                             Swarm Protocol.
 * Shared by the CLI and the web UI, so no node imports here.
 */

export function renderHuman(plan) {
  const L = [];
  L.push(`SWARM BUILD PLAN — ${plan.title || 'Untitled brief'}`);
  if (plan.repo) L.push(`Repo:     ${plan.repo}`);
  if (plan.mission) L.push(`Mission:  ${plan.mission}`);
  L.push(
    `Summary:  ${plan.summary.phaseCount} phases · ${plan.summary.packageCount} work packages · ` +
      `${plan.summary.agentCount} agent slots · ${plan.summary.blockers} human blockers`,
  );
  L.push(`Defaults: ${plan.antiDrift.topology} · ${plan.antiDrift.strategy} · ${plan.antiDrift.consensus} consensus · maxAgents ≤ ${plan.antiDrift.maxAgentsCap}`);
  L.push('');

  plan.phases.forEach((phase, i) => {
    L.push(`── PHASE ${i + 1}: ${phase.title} ${'─'.repeat(Math.max(0, 48 - phase.title.length))}`);
    if (phase.goal) L.push(`   goal: ${phase.goal}`);
    L.push(`   swarm: ${phase.swarm.topology}/${phase.swarm.strategy}, maxAgents ${phase.swarm.maxAgents}, ${phase.swarm.consensus} consensus`);
    if (phase.swarm.cappedOverflow) L.push(`   ⚠ roster exceeds ${plan.antiDrift.maxAgentsCap}; extra doers should be folded/serialized`);

    L.push('   work packages:');
    for (const wp of phase.workPackages) {
      L.push(`     • [${wp.taskLabel}] ${wp.title}  → ${wp.primaryAgent}`);
      if (wp.detail) L.push(`         ${truncate(wp.detail, 100)}`);
    }

    L.push('   roster:');
    for (const r of phase.roster) {
      const on = r.worksOn.length ? `  (${r.worksOn.join(', ')})` : '';
      L.push(`     - ${r.name} <${r.agentType}>${on}`);
    }

    if (phase.verificationGates.length) {
      L.push('   verification gates:');
      for (const g of phase.verificationGates) L.push(`     ✓ ${truncate(g, 110)}`);
    }
    L.push('');
  });

  if (plan.standards?.length) {
    L.push('GLOBAL STANDARDS (apply to every phase):');
    for (const s of plan.standards) L.push(`   • ${truncate(s, 110)}`);
    L.push('');
  }
  if (plan.needsHuman?.length) {
    L.push('⛔ NEEDS A HUMAN (do not guess — flag these):');
    for (const h of plan.needsHuman) L.push(`   ! ${truncate(h, 110)}`);
    L.push('');
  }
  return L.join('\n');
}

/**
 * Emit the runnable orchestration for the FIRST phase (the one to start now),
 * plus CLI equivalents for every phase. Matches CLAUDE.md's documented pattern:
 * MCP swarm_init + one Task() per named agent, kicked off via SendMessage.
 */
export function renderCommands(plan, phaseIndex = 0) {
  const phase = plan.phases[phaseIndex];
  if (!phase) return { mcp: '', tasks: [], kickoff: '', cli: [], block: '// no phases in plan' };

  const mcp =
    `mcp__ruv-swarm__swarm_init({ topology: "${phase.swarm.topology}", ` +
    `maxAgents: ${phase.swarm.maxAgents}, strategy: "${phase.swarm.strategy}" })`;

  const doers = phase.roster.filter((r) => r.name !== 'coordinator');
  const tasks = phase.roster.map((r, idx) => {
    const next = phase.roster[idx + 1];
    const handoff = next ? ` When done, SendMessage your output to "${next.name}".` : '';
    const wpText = r.worksOn.length ? ` Work packages: ${r.worksOn.join(', ')}.` : '';
    const prompt =
      `You are "${r.name}" for phase "${phase.title}" in repo ${plan.repo || '<repo>'}. ` +
      `${r.role}${wpText}${handoff}`;
    return (
      `Task({ subagent_type: "${r.agentType}", name: "${r.name}", run_in_background: true,\n` +
      `      prompt: ${jsStr(prompt)} })`
    );
  });

  const first = phase.roster[0];
  const kickoff =
    `SendMessage({ to: "${first?.name || 'coordinator'}", summary: "Start ${phase.id}", ` +
    `message: ${jsStr(`Begin ${phase.title}. Coordinate the roster, enforce the verification gates, report to the lead.`)} })`;

  const cli = plan.phases.map(
    (p) =>
      `npx ruflo swarm init --topology ${p.swarm.topology} --max-agents ${p.swarm.maxAgents} ` +
      `--strategy ${p.swarm.strategy} --consensus ${p.swarm.consensus}  # ${p.title}`,
  );

  const block = [
    `// ── Phase ${phaseIndex + 1}: ${phase.title} — paste into Claude Code (ONE message) ──`,
    '// STEP 1: init swarm coordination',
    mcp,
    '',
    '// STEP 2: spawn named agents (all in one message, background)',
    ...tasks,
    '',
    '// STEP 3: kick off the pipeline',
    kickoff,
  ].join('\n');

  return { mcp, tasks, kickoff, cli, block, doerCount: doers.length };
}

function jsStr(s) {
  return JSON.stringify(String(s));
}
function truncate(s, n) {
  s = String(s || '');
  return s.length > n ? `${s.slice(0, n - 1)}…` : s;
}
