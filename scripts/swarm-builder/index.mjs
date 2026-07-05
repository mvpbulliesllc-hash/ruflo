/**
 * Swarm Builder — programmatic entry point.
 *
 * Point it at any repo + any build brief; get back a runnable ruflo swarm plan.
 *
 *   import { buildPlan } from './scripts/swarm-builder/index.mjs';
 *   const { brief, plan, human, commands } = buildPlan(briefText, { repo });
 */

import { parseBrief, planSwarm, classifyPackage } from './engine.mjs';
import { renderHuman, renderCommands } from './render.mjs';

export { parseBrief, planSwarm, classifyPackage, renderHuman, renderCommands };

/**
 * One-call convenience: text → { brief, plan, human, commands }.
 * @param {string} text  The build brief (markdown or plain text).
 * @param {{repo?: string, title?: string, phase?: number}} [opts]
 */
export function buildPlan(text, opts = {}) {
  const brief = parseBrief(text, { repo: opts.repo || '', title: opts.title || '' });
  const plan = planSwarm(brief);
  return {
    brief,
    plan,
    human: renderHuman(plan),
    commands: renderCommands(plan, (opts.phase || 1) - 1),
  };
}
