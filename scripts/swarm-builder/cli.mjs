#!/usr/bin/env node
/**
 * Swarm Builder CLI — turn ANY build brief + repo into a runnable swarm plan.
 *
 *   node scripts/swarm-builder/cli.mjs <brief.md|-> [options]
 *
 * Options:
 *   --repo <url|path>   Target repository the swarm will build against.
 *   --json              Emit the full plan as JSON (machine-readable).
 *   --commands          Emit runnable ruflo MCP + Task-tool spawn blocks.
 *   --phase <n>         Which phase to emit commands for (1-based, default 1).
 *   --title <text>      Override the brief title.
 *   -h, --help          Show help.
 *
 * Reads the brief from a file path, or from stdin when the path is "-".
 * Exits non-zero if the brief yields zero work packages (nothing to swarm).
 *
 * Examples:
 *   node scripts/swarm-builder/cli.mjs brief.md --repo github.com/acme/site
 *   cat brief.md | node scripts/swarm-builder/cli.mjs - --commands
 */

import { readFileSync } from 'node:fs';
import { parseBrief, planSwarm } from './engine.mjs';
import { renderHuman, renderCommands } from './render.mjs';

function parseArgs(argv) {
  const args = { _: [], repo: '', json: false, commands: false, phase: 1, title: '', help: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    switch (a) {
      case '-h': case '--help': args.help = true; break;
      case '--json': args.json = true; break;
      case '--commands': args.commands = true; break;
      case '--repo': args.repo = argv[++i] || ''; break;
      case '--title': args.title = argv[++i] || ''; break;
      case '--phase': args.phase = Math.max(1, parseInt(argv[++i] || '1', 10) || 1); break;
      default:
        if (a.startsWith('--repo=')) args.repo = a.slice(7);
        else if (a.startsWith('--title=')) args.title = a.slice(8);
        else if (a.startsWith('--phase=')) args.phase = Math.max(1, parseInt(a.slice(8), 10) || 1);
        else args._.push(a);
    }
  }
  return args;
}

const HELP = `Swarm Builder — brief → executable ruflo swarm plan

Usage:
  node scripts/swarm-builder/cli.mjs <brief.md|-> [--repo <url>] [--json] [--commands] [--phase N]

Give it any repo and any build brief; it decomposes the brief into phases and
work packages, assigns an anti-drift agent roster (hierarchical/specialized/raft),
builds the task graph + verification gates, and prints the swarm — including the
exact Task()/MCP spawn block to paste into Claude Code.`;

function readInput(pathArg) {
  if (!pathArg || pathArg === '-') return readFileSync(0, 'utf8'); // stdin
  return readFileSync(pathArg, 'utf8');
}

export function buildPlanFromText(text, { repo = '', title = '' } = {}) {
  const brief = parseBrief(text, { repo, title });
  return { brief, plan: planSwarm(brief) };
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || args._.length === 0) {
    process.stdout.write(HELP + '\n');
    process.exit(args.help ? 0 : 2);
  }

  let text;
  try {
    text = readInput(args._[0]);
  } catch (err) {
    process.stderr.write(`swarm-builder: cannot read brief "${args._[0]}": ${err.message}\n`);
    process.exit(1);
  }

  const { plan } = buildPlanFromText(text, { repo: args.repo, title: args.title });

  if (plan.summary.packageCount === 0) {
    process.stderr.write('swarm-builder: no work packages found in brief — nothing to swarm.\n');
    process.exit(3);
  }

  if (args.json) {
    process.stdout.write(JSON.stringify(plan, null, 2) + '\n');
    return;
  }

  process.stdout.write(renderHuman(plan) + '\n');

  if (args.commands) {
    const cmd = renderCommands(plan, args.phase - 1);
    process.stdout.write('\n' + '='.repeat(72) + '\n');
    process.stdout.write(`RUNNABLE SWARM — phase ${args.phase} (paste into Claude Code, one message)\n`);
    process.stdout.write('='.repeat(72) + '\n');
    process.stdout.write(cmd.block + '\n\n');
    process.stdout.write('CLI equivalents (per phase):\n' + cmd.cli.join('\n') + '\n');
  }
}

// Only run when invoked directly (not when imported by tests).
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
