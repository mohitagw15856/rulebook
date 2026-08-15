#!/usr/bin/env node
// rulebook — settle it, score it, teach it, or pick it.
//
//   rulebook ruling uno "can I stack a +2"
//   rulebook score poker "As Ks Qs Js Ts"
//   rulebook teach catan
//   rulebook find --players 5 --minutes 30
//   rulebook list
//
// Works offline. The whole registry ships inside the package, because the
// moment you need a ruling is the moment somebody has already picked up the
// cards and is waiting.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { load, fmtDuration, minutes, PREVALENCE } from '../lib/registry.mjs';

const argv = process.argv.slice(2);
const COLOR = process.stdout.isTTY && !process.env.NO_COLOR;
const c = (code, s) => (COLOR ? `[${code}m${s}[0m` : s);
const bold = (s) => c(1, s);
const dim = (s) => c(90, s);

const games = load();
const byName = (q) => {
  const n = String(q).toLowerCase().replace(/[^a-z0-9]/g, '');
  return (
    games.find((g) => g.slug.replace(/[^a-z0-9]/g, '') === n) ||
    games.find((g) => g.name.toLowerCase().replace(/[^a-z0-9]/g, '') === n) ||
    games.find((g) => g.slug.replace(/[^a-z0-9]/g, '').includes(n)) ||
    games.find((g) => g.name.toLowerCase().replace(/[^a-z0-9]/g, '').includes(n))
  );
};

function usage(code = 0) {
  console.log(`${bold('rulebook')} — the rules, the house rules, and who is right

  rulebook ruling <game> "<question>"   settle an argument
  rulebook score  <game> "<cards>"      work out the score
  rulebook teach  <game>                how to explain it to a new player
  rulebook find   [filters]             what should we play?
  rulebook list                         every game

${dim('find filters:')} --players N  --minutes N  --max-weight N  --type card|board|word|party|abstract

${games.length} games, ${games.reduce((a, g) => a + g.rulings.length, 0)} rulings. Works offline.`);
  process.exit(code);
}

// ---------------------------------------------------------------------------
// ruling — the reason this CLI exists
// ---------------------------------------------------------------------------
function scoreMatch(ruling, query) {
  const q = query.toLowerCase().replace(/[^a-z0-9+ ]/g, ' ').split(/\s+/).filter((w) => w.length > 1);
  if (!q.length) return 0;
  const haystacks = [
    [ruling.question, 3],
    [(ruling.asked_as || []).join(' | '), 4],
    [ruling.id.replace(/-/g, ' '), 3],
    [ruling.verdict, 1],
    [ruling.house_rule || '', 1],
  ];
  let total = 0;
  for (const [text, weight] of haystacks) {
    const t = String(text).toLowerCase();
    for (const word of q) if (t.includes(word)) total += weight;
    // An exact phrase match in the asked-as list is worth a lot.
    if (weight === 4 && t.includes(query.toLowerCase())) total += 25;
  }
  return total;
}

function cmdRuling(args) {
  const game = byName(args[0]);
  if (!game) {
    console.error(`Unknown game "${args[0]}". Try: rulebook list`);
    process.exit(2);
  }
  const query = args.slice(1).join(' ').trim();
  if (!query) {
    console.log(`\n${bold(game.name)} — ${game.rulings.length} rulings\n`);
    for (const r of game.rulings) console.log(`  ${dim('·')} ${r.question}`);
    console.log(`\n${dim('Ask one: rulebook ruling ' + game.slug + ' "..."')}\n`);
    return;
  }

  const ranked = game.rulings
    .map((r) => ({ r, s: scoreMatch(r, query) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s);

  if (!ranked.length) {
    console.log(`\nNothing in ${game.name} matches ${bold(query)}.\n`);
    console.log(`Rulings on file for ${game.name}:\n`);
    for (const r of game.rulings) console.log(`  ${dim('·')} ${r.question}`);
    console.log(
      `\n${dim('If this is a real dispute and it is missing, that is a gap worth filing:')}\n` +
        `${dim('https://github.com/mohitagw15856/rulebook/issues/new')}\n`
    );
    process.exit(1);
  }

  const { r } = ranked[0];
  const badge = r.official ? c(32, '● OFFICIAL RULE') : c(33, '● NOT AN OFFICIAL RULE');

  console.log(`\n${bold(r.question)}`);
  console.log(`${badge}   ${dim(PREVALENCE[r.prevalence].toLowerCase())}\n`);
  console.log(wrap(r.verdict, 76, '  '));

  if (r.house_rule) {
    console.log(`\n${bold('  The house version')}\n`);
    console.log(wrap(r.house_rule, 76, '  '));
  }
  if (r.effect) {
    console.log(`\n${bold('  What it changes')}\n`);
    console.log(wrap(r.effect, 76, '  '));
  }
  if (r.regions?.length && !r.regions.includes('global')) {
    console.log(`\n  ${dim('Mostly played in: ' + r.regions.join(', '))}`);
  }
  if (r.source) console.log(`\n  ${dim('Source: ' + r.source)}`);

  if (ranked.length > 1) {
    console.log(`\n${dim('Also matched: ' + ranked.slice(1, 4).map((x) => x.r.question).join(' · '))}`);
  }
  console.log();
}

function wrap(text, width, indent = '') {
  const words = String(text).trim().replace(/\s+/g, ' ').split(' ');
  const lines = [];
  let line = '';
  for (const w of words) {
    if ((line + ' ' + w).trim().length > width) {
      lines.push(indent + line.trim());
      line = w;
    } else line += ' ' + w;
  }
  if (line.trim()) lines.push(indent + line.trim());
  return lines.join('\n');
}

// ---------------------------------------------------------------------------
async function cmdScore(args) {
  const game = byName(args[0]);
  if (!game) {
    const scorable = games.filter((g) => g.hasScore);
    console.error(`Unknown game "${args[0]}". Scoring is available for: ${scorable.map((g) => g.slug).join(', ')}`);
    process.exit(2);
  }
  if (!game.hasScore) {
    console.error(`No scorer for ${game.name} yet. Games with one: ${games.filter((g) => g.hasScore).map((g) => g.slug).join(', ')}`);
    process.exit(2);
  }
  const mod = await import(new URL(`../games/${game.slug}/score.mjs`, import.meta.url).href);
  const rest = args.slice(1);
  if (!rest.length) {
    console.log(`\n${bold(mod.usage)}\n`);
    for (const e of mod.examples || []) console.log(`  ${dim(e)}`);
    console.log();
    return;
  }
  try {
    console.log('\n' + mod.run(rest).join('\n') + '\n');
  } catch (e) {
    console.error(`\n${c(31, 'Cannot score that')}: ${e.message}\n`);
    console.error(`${dim(mod.usage)}\n`);
    process.exit(1);
  }
}

// ---------------------------------------------------------------------------
function cmdTeach(args) {
  const game = byName(args[0]);
  if (!game) {
    console.error(`Unknown game "${args[0]}". Try: rulebook list`);
    process.exit(2);
  }
  const path = fileURLToPath(new URL(`../games/${game.slug}/teach.md`, import.meta.url));
  console.log('\n' + readFileSync(path, 'utf8').trim() + '\n');
}

// ---------------------------------------------------------------------------
function cmdFind(args) {
  const num = (flag) => {
    const i = args.indexOf(`--${flag}`);
    return i === -1 ? null : Number(args[i + 1]);
  };
  const str = (flag) => {
    const i = args.indexOf(`--${flag}`);
    return i === -1 ? null : args[i + 1];
  };
  const players = num('players');
  const mins = num('minutes');
  const maxWeight = num('max-weight');
  const type = str('type');

  let out = games.slice();
  if (players) out = out.filter((g) => players >= g.players.min && players <= g.players.max);
  // Filter on the honest time, not the box time. That is the entire point of
  // recording both.
  if (mins) out = out.filter((g) => minutes(g.playtime_actual) <= mins);
  if (maxWeight) out = out.filter((g) => g.weight <= maxWeight);
  if (type) out = out.filter((g) => g.type === type);

  const filters = [
    players && `${players} players`,
    mins && `under ${mins} min`,
    maxWeight && `weight ≤ ${maxWeight}`,
    type,
  ].filter(Boolean);

  console.log(`\n${bold(filters.length ? filters.join(' · ') : 'Everything')} — ${out.length} game(s)\n`);
  if (!out.length) {
    console.log('  Nothing fits. Loosen a filter — the times here are real playtimes,');
    console.log('  not the numbers on the box, so they run longer than you expect.\n');
    return;
  }
  out
    .sort((a, b) => minutes(a.playtime_actual) - minutes(b.playtime_actual))
    .forEach((g) => {
      const best = g.players.best ? `best ${g.players.best}` : '';
      console.log(
        `  ${bold(g.name.padEnd(16))} ${String(fmtDuration(g.playtime_actual)).padEnd(8)} ` +
          `${(g.players.min + '-' + g.players.max + 'p').padEnd(7)} ${dim(`weight ${g.weight}  ${best}`)}`
      );
    });
  console.log();
}

function cmdList() {
  console.log();
  for (const g of games) {
    console.log(
      `  ${bold(g.slug.padEnd(20))} ${g.name.padEnd(16)} ${dim(
        `${g.rulings.length} rulings${g.hasScore ? ' · scorer' : ''}`
      )}`
    );
  }
  console.log();
}

// ---------------------------------------------------------------------------
const cmd = argv[0];
if (!cmd || argv.includes('--help') || argv.includes('-h')) usage(cmd ? 0 : 2);

switch (cmd) {
  case 'ruling':
  case 'rule':
    cmdRuling(argv.slice(1));
    break;
  case 'score':
    await cmdScore(argv.slice(1));
    break;
  case 'teach':
    cmdTeach(argv.slice(1));
    break;
  case 'find':
    cmdFind(argv.slice(1));
    break;
  case 'list':
    cmdList();
    break;
  default:
    // Bare `rulebook uno "can I stack"` should just work.
    if (byName(cmd)) cmdRuling(argv);
    else usage(2);
}
