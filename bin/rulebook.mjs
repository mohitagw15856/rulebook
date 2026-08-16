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

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createInterface } from 'node:readline';
import { load, fmtDuration, minutes, PREVALENCE } from '../lib/registry.mjs';
import { search } from '../lib/search.mjs';
import { loadConfig, tableRuling } from '../lib/config.mjs';
import { logDispute, record, quizQuestions, logQuiz, rank, planNight, hottest } from '../lib/party.mjs';
import { encode, toText, toSvg } from '../lib/qr.mjs';
import { loadVotes, measure, impliedPrevalence, LEARNED_FROM } from '../lib/votes.mjs';
import { isStale, verificationAge } from '../lib/registry.mjs';
import { referenceCard } from '../lib/refcard.mjs';

const SITE = 'https://mohitagw15856.github.io/rulebook';
const CONFIG = loadConfig();

// Prompting, without a dependency. Returns '' if stdin is not a terminal, so
// the party commands degrade to printing rather than hanging in CI.
const ask = (q) =>
  new Promise((resolve) => {
    if (!process.stdin.isTTY) return resolve('');
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    rl.question(q, (a) => {
      rl.close();
      resolve(a.trim());
    });
  });

const rawArgv = process.argv.slice(2);

// --lang is global, so pull it out before anything treats it as a command or a
// search term. Leaving it in argv made `rulebook --lang fr ruling uno` print
// the help text, because the first argument was no longer the command.
const LANG_FLAG = (() => {
  const i = rawArgv.indexOf('--lang');
  if (i === -1) return null;
  const value = rawArgv[i + 1] || null;
  rawArgv.splice(i, value ? 2 : 1);
  return value;
})();

const argv = rawArgv;
const COLOR = process.stdout.isTTY && !process.env.NO_COLOR;
const c = (code, s) => (COLOR ? `[${code}m${s}[0m` : s);
const bold = (s) => c(1, s);
const dim = (s) => c(90, s);

// --lang picks a translation where one exists, English everywhere else.
const games = load(LANG_FLAG);
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
  rulebook teach  <game> [--live]       how to explain it to a new player
  rulebook find   [filters]             what should we play?
  rulebook about  <game>                the honest facts, variants and all
  rulebook list                         every game

${bold('at the table')}
  rulebook night  --people N [--hours N]  plan the whole evening
  rulebook ref    <game> "<question>"     settle it, and log who was right
  rulebook record                         who has been right, over time
  rulebook quiz   [--questions N]         official rule, or made up?
  rulebook timer  [--minutes N]           shame the slow player
  rulebook odds   <game>                  the numbers people guess wrong
  rulebook hottest                        the rules that cause most arguments
  rulebook cheats <game>                  how people cheat, and how to catch it

${bold('take it with you')}
  rulebook card   <game> [--out f.svg]    printable fold-up reference card
  rulebook qr     <game> [--ruling id]    a QR code for the box lid

${bold('keep it honest')}
  rulebook vote   <game> "<question>"     report how YOUR table plays it
  rulebook verify                         which facts have been checked, and when
  rulebook mcp                            serve the registry to an AI assistant

${dim('find filters:')} --players N  --minutes N  --max-weight N  --type card|board|... --kids AGE

${games.length} games, ${games.reduce((a, g) => a + g.rulings.length, 0)} rulings. Works offline.${
    CONFIG ? `\n${dim('house rules: ' + CONFIG.path)}` : ''
  }`);
  process.exit(code);
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

  const ranked = search(game.rulings, query);

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
  // If this table has declared how they play it, that answers first — the
  // published rule is still shown, because knowing both is the point.
  const mine = tableRuling(CONFIG, game.slug, r.id);
  if (mine) {
    console.log(`\n${bold('  At ' + (mine.table || 'this table'))}\n`);
    if (mine.plays === true) console.log(wrap('You play the house version.', 76, '  '));
    else if (mine.plays === false) console.log(wrap('You play this by the published rule.', 76, '  '));
    if (mine.note) console.log(wrap(mine.note, 76, '  '));
  }

  // Sources that contradict the verdict are shown, not hidden. A ruling where
  // the sources disagree is a more useful thing to know than a tidy one.
  for (const src of r.sources || []) {
    console.log(
      `\n  ${src.agrees ? dim('Source (supports this):') : c(33, 'Source (CONTRADICTS this):')} ${dim(src.url)}`
    );
    console.log(dim(wrap(src.says, 72, '    ')));
  }

  if ((r.interacts_with || []).length) {
    console.log(`\n  ${dim('Interacts with: ' + r.interacts_with.join(', '))}`);
  }

  const m = measure(loadVotes(), `${game.slug}/${r.id}`);
  console.log(
    m
      ? `\n  ${dim(`Reported by players: ${m.pct}% ± ${m.margin} play the house version (n=${m.n}).`)}`
      : `\n  ${dim('Prevalence here is a judgement, not a survey. Add yours: rulebook vote')}`
  );

  if (r.source) console.log(`\n  ${dim('Source: ' + r.source)}`);
  console.log(`\n  ${dim('Link: ' + SITE + '/#' + game.slug + '/' + r.id)}`);

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
async function cmdTeach(args) {
  const game = byName(args[0]);
  if (!game) {
    console.error(`Unknown game "${args[0]}". Try: rulebook list`);
    process.exit(2);
  }
  const md = readFileSync(game.__teachFile, 'utf8').trim();

  if (!args.includes('--live')) {
    console.log('\n' + md + '\n');
    console.log(`  ${dim(`Teaching it now? rulebook teach ${game.slug} --live walks it step by step.`)}\n`);
    return;
  }

  // Live mode: one beat at a time, against the clock, because the whole point
  // of a teach script is that it should fit in the time you promised.
  const beats = md
    .split(/\n\n(?=\*\*)/)
    .map((b) => b.trim())
    .filter((b) => b.startsWith('**'));

  const budget = minutes(game.teach_time);
  console.log(`\n${bold(`Teaching ${game.name}`)}`);
  console.log(dim(`${beats.length} beats · aim for ${fmtDuration(game.teach_time)} · enter to advance, q to stop\n`));

  const started = Date.now();
  for (const [i, beat] of beats.entries()) {
    const elapsed = (Date.now() - started) / 60000;
    const pace = elapsed > budget ? c(31, `${elapsed.toFixed(1)}m`) : c(32, `${elapsed.toFixed(1)}m`);
    console.log(`${dim(`── ${i + 1}/${beats.length}`)}  ${pace} ${dim(`of ${budget}m`)}\n`);
    console.log(wrap(beat.replace(/\*\*/g, '').replace(/\s+/g, ' '), 74, '  '));
    console.log();
    const a = await ask(dim('  [enter] next · q quit  '));
    if (a.toLowerCase() === 'q') break;
    console.log();
  }
  const total = ((Date.now() - started) / 60000).toFixed(1);
  console.log(
    `\n  ${bold('Taught in ' + total + ' minutes.')} ${dim(`The registry says ${fmtDuration(game.teach_time)}.`)}\n`
  );
  console.log(`  ${dim('Now deal. Questions get answered as they come up, not in advance.')}\n`);
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
  const kids = num('kids');

  let out = games.slice();
  if (players) out = out.filter((g) => players >= g.players.min && players <= g.players.max);
  // Filter on the honest time, not the box time. That is the entire point of
  // recording both.
  if (mins) out = out.filter((g) => minutes(g.playtime_actual) <= mins);
  if (maxWeight) out = out.filter((g) => g.weight <= maxWeight);
  if (type) out = out.filter((g) => g.type === type);
  // The age a game genuinely works at, which is not the age on the box.
  if (kids) out = out.filter((g) => g.min_age <= kids);

  const filters = [
    players && `${players} players`,
    mins && `under ${mins} min`,
    maxWeight && `weight ≤ ${maxWeight}`,
    kids && `works at ${kids}`,
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
        `  ${bold(g.name.padEnd(18))} ${String(fmtDuration(g.playtime_actual)).padEnd(8)} ` +
          `${(g.players.min + '-' + g.players.max + 'p').padEnd(7)} ` +
          `${dim(`weight ${String(g.weight).padEnd(4)} age ${String(g.min_age).padEnd(3)} ${fmtDuration(g.downtime)} between turns  ${best}`)}`
      );
    });
  console.log();
}

function cmdList() {
  console.log();
  for (const g of games) {
    const extras = [
      `${g.rulings.length} rulings`,
      g.hasScore && 'scorer',
      g.hasOdds && 'odds',
      g.variants?.length && `${g.variants.length} variant${g.variants.length === 1 ? '' : 's'}`,
    ].filter(Boolean);
    console.log(`  ${bold(g.slug.padEnd(20))} ${g.name.padEnd(18)} ${dim(extras.join(' · '))}`);
  }
  console.log();
}


// ---------------------------------------------------------------------------
// night — plan the actual evening
// ---------------------------------------------------------------------------
function cmdNight(args) {
  const num = (f, d = null) => {
    const i = args.indexOf(`--${f}`);
    return i === -1 ? d : Number(args[i + 1]);
  };
  const people = num('people');
  if (!people) {
    console.error('How many people? Try: rulebook night --people 6 --hours 3');
    process.exit(2);
  }
  const hours = num('hours', 3);
  const kids = num('kids');

  const plan = planNight({ people, hours, kids });
  console.log(
    `\n${bold(`${people} people · ${hours} hours`)}${kids ? dim(`  · youngest is ${kids}`) : ''}` +
      dim(`  · ${plan.candidates} games fit`)
  );

  if (!plan.slots.length) {
    console.log('\n  Nothing in the registry fits that. Loosen the constraints —');
    console.log('  a lower player count or an older youngest player opens it up.\n');
    return;
  }

  console.log();
  for (const s of plan.slots) {
    const g = s.game;
    const cost = Math.round(minutes(g.playtime_actual) + minutes(g.teach_time));
    console.log(`  ${c(36, s.role.toUpperCase())}`);
    console.log(`  ${bold(g.name)}  ${dim(`${cost} min including the teach`)}`);
    console.log(`  ${dim(s.why)}`);
    console.log(`  ${dim(`${g.players.min}-${g.players.max}p · weight ${g.weight} · ${g.rulings.length} rulings on file`)}`);
    console.log();
  }
  const slack = Math.round(plan.budget - plan.total);
  console.log(
    `  ${dim(`Planned ${Math.round(plan.total)} of ${plan.budget} minutes.`)} ` +
      (slack > 25
        ? dim(`${slack} spare — that is your food break.`)
        : c(33, `Only ${slack} minutes spare. Expect to overrun.`))
  );
  console.log();
}

// ---------------------------------------------------------------------------
// ref — settle it, and remember who was right
// ---------------------------------------------------------------------------
async function cmdRef(args) {
  const game = byName(args[0]);
  if (!game) {
    console.error(`Unknown game "${args[0]}". Try: rulebook list`);
    process.exit(2);
  }
  const query = args.slice(1).filter((a) => !a.startsWith('--')).join(' ').trim();
  const ranked = query ? search(game.rulings, query) : [];
  if (!ranked.length) {
    console.error(`\nNothing in ${game.name} matches that. Try: rulebook ruling ${game.slug}\n`);
    process.exit(1);
  }
  const r = ranked[0].r;

  console.log(`\n${bold(r.question)}`);
  console.log(`${r.official ? c(32, '● OFFICIAL RULE') : c(33, '● NOT AN OFFICIAL RULE')}   ${dim(PREVALENCE[r.prevalence].toLowerCase())}\n`);
  console.log(wrap(r.verdict, 76, '  '));
  console.log();

  const who = await ask('  Who called it? ');
  if (!who) {
    console.log(dim('  (not logged — no name given)\n'));
    return;
  }
  const side = (await ask(`  Did ${who} say it was official? [y/n] `)).toLowerCase().startsWith('y');
  const right = side === r.official;

  logDispute({ game: game.name, ruling: `${game.slug}/${r.id}`, called: who, right });
  console.log(
    right
      ? `\n  ${c(32, `${who} was right.`)}\n`
      : `\n  ${c(31, `${who} was wrong.`)} ${dim('Logged.')}\n`
  );

  const { table } = record();
  const me = table.find((p) => p.name === who);
  if (me && me.total > 1) {
    console.log(dim(`  ${who} is now ${me.right}-${me.wrong} on rules disputes (${me.pct}%).\n`));
  }
}

function cmdRecord() {
  const { table, quizTable, disputes, path } = record();
  if (!table.length && !quizTable.length) {
    console.log(`\n  Nothing logged yet. Settle something with ${bold('rulebook ref <game> "<question>"')}.\n`);
    return;
  }

  if (table.length) {
    console.log(`\n${bold('Rules disputes')}  ${dim(`${disputes.length} logged`)}\n`);
    const w = Math.max(...table.map((p) => p.name.length), 6);
    for (const p of table) {
      const bar = '█'.repeat(Math.round(p.pct / 10)) + '░'.repeat(10 - Math.round(p.pct / 10));
      const colour = p.pct >= 60 ? 32 : p.pct >= 40 ? 33 : 31;
      console.log(`  ${p.name.padEnd(w)}  ${c(colour, bar)}  ${String(p.pct).padStart(3)}%  ${dim(`${p.right}-${p.wrong}`)}`);
    }
    const worst = table[table.length - 1];
    if (worst && worst.total >= 3 && worst.pct < 50) {
      console.log(`\n  ${dim(`${worst.name} has been wrong ${worst.wrong} times. Someone should tell them.`)}`);
    }
  }

  if (quizTable.length) {
    console.log(`\n${bold('Quiz')}\n`);
    for (const p of quizTable) {
      console.log(`  ${p.name}  ${dim(`${p.right}/${p.total} rounds passed`)}`);
    }
  }
  console.log(`\n  ${dim(path)}\n`);
}

// ---------------------------------------------------------------------------
// quiz — official rule, or something everyone made up?
// ---------------------------------------------------------------------------
async function cmdQuiz(args) {
  const i = args.indexOf('--questions');
  const count = i === -1 ? 10 : Number(args[i + 1]) || 10;
  const seedArg = args.indexOf('--seed');
  const seed = seedArg === -1 ? (Date.now() % 100000) + 1 : Number(args[seedArg + 1]);

  const qs = quizQuestions(count, seed);
  console.log(`\n${bold('Official rule, or something everybody made up?')}`);
  console.log(dim(`${qs.length} questions · answer o for official, h for house rule · seed ${seed}\n`));

  let right = 0;
  for (const [n, q] of qs.entries()) {
    console.log(`  ${bold(`${n + 1}. ${q.game}`)}`);
    console.log(`  ${q.question}`);
    const a = (await ask('  [o]fficial / [h]ouse rule? ')).toLowerCase();
    if (!a) {
      console.log(dim('\n  (no input — stopping here)\n'));
      return;
    }
    const said = a.startsWith('o');
    const correct = said === q.answer;
    if (correct) right++;
    console.log(
      correct
        ? `  ${c(32, '✓ correct.')} ${dim(q.answer ? 'It is official.' : 'Not a real rule.')}`
        : `  ${c(31, '✗ wrong.')} ${dim(q.answer ? 'It is genuinely official.' : 'It is not a real rule — ' + q.prevalenceText.toLowerCase() + '.')}`
    );
    console.log(`  ${dim(wrap(q.verdict, 74, '').split('\n')[0])}\n`);
  }

  const pct = Math.round((right / qs.length) * 100);
  console.log(`  ${bold(`${right} / ${qs.length}`)}  ${c(pct >= 60 ? 32 : 33, rank(pct))}\n`);

  const who = await ask('  Name for the scoreboard (enter to skip): ');
  if (who) {
    logQuiz(who, right, qs.length);
    console.log(dim(`  Logged. See it with: rulebook record\n`));
  }
}

// ---------------------------------------------------------------------------
// timer — for the player who takes four minutes over a two-minute turn
// ---------------------------------------------------------------------------
async function cmdTimer(args) {
  const i = args.indexOf('--minutes');
  const mins = i === -1 ? 2 : Number(args[i + 1]) || 2;
  const total = Math.round(mins * 60);
  console.log(`\n  ${bold(`${mins} minute turn timer`)}  ${dim('ctrl-c to stop')}\n`);

  for (let left = total; left >= 0; left--) {
    const m = String(Math.floor(left / 60)).padStart(2, '0');
    const s = String(left % 60).padStart(2, '0');
    const done = Math.round(((total - left) / total) * 30);
    const colour = left <= 10 ? 31 : left <= total * 0.25 ? 33 : 32;
    process.stdout.write(`\r  ${c(colour, `${m}:${s}`)}  ${'█'.repeat(done)}${'░'.repeat(30 - done)}  `);
    if (left) await new Promise((r) => setTimeout(r, 1000));
  }
  console.log(`\n\n  ${c(31, "Time. Play something.")}\n`);
}

// ---------------------------------------------------------------------------
function cmdOdds(args) {
  const game = byName(args[0]);
  if (!game) {
    const have = games.filter((g) => g.hasOdds).map((g) => g.slug);
    console.error(`Unknown game "${args[0]}". Odds available for: ${have.join(', ')}`);
    process.exit(2);
  }
  if (!game.hasOdds) {
    console.error(`No odds table for ${game.name}. Games with one: ${games.filter((g) => g.hasOdds).map((g) => g.slug).join(', ')}`);
    process.exit(2);
  }
  return import(new URL(`../games/${game.slug}/odds.mjs`, import.meta.url).href).then((mod) => {
    console.log(`\n${bold(mod.title)}\n`);
    const rows = mod.rows();
    const w = Math.max(...rows.map((r) => r.label.length));
    for (const r of rows) {
      const bar = '█'.repeat(Math.max(1, Math.round(r.pct / 2.5)));
      console.log(`  ${r.label.padEnd(w)}  ${String(r.pct.toFixed(1)).padStart(5)}%  ${c(36, bar)}`);
      if (r.note) console.log(`  ${' '.repeat(w)}  ${dim(r.note)}`);
    }
    console.log();
    for (const n of mod.notes || []) console.log(wrap(n, 76, '  ') + '\n');
  });
}

function cmdHottest() {
  const rows = hottest(15);
  console.log(`\n${bold('The rules that stop games')}`);
  console.log(dim('Ranked by how certain both sides tend to be. A house rule everybody\n plays is the hottest thing here, because nobody involved thinks it is one.\n'));
  for (const r of rows) {
    const flame = '▰'.repeat(Math.round(r.heat)) + '▱'.repeat(Math.max(0, 5 - Math.round(r.heat)));
    console.log(`  ${c(r.official ? 32 : 33, flame)}  ${bold(r.game.name.padEnd(16))} ${r.question}`);
  }
  console.log(`\n  ${dim('▰ hot = disputed and not official. Settle one: rulebook ref <game> "<question>"')}\n`);
}

// ---------------------------------------------------------------------------
function cmdQr(args) {
  const game = byName(args[0]);
  if (!game) {
    console.error(`Unknown game "${args[0]}". Try: rulebook list`);
    process.exit(2);
  }
  const ri = args.indexOf('--ruling');
  const rulingId = ri === -1 ? null : args[ri + 1];
  if (rulingId && !game.rulings.some((r) => r.id === rulingId)) {
    console.error(`No ruling "${rulingId}" in ${game.name}. Available: ${game.rulings.map((r) => r.id).join(', ')}`);
    process.exit(2);
  }
  const url = `${SITE}/#${game.slug}${rulingId ? '/' + rulingId : ''}`;

  const oi = args.indexOf('--out');
  if (oi !== -1) {
    const out = args[oi + 1];
    writeFileSync(out, toSvg(encode(url), { scale: 8 }));
    console.log(`\n  Wrote ${bold(out)}\n  ${dim(url)}\n`);
    return;
  }
  console.log();
  console.log(toText(encode(url)));
  console.log(`\n  ${dim(url)}\n`);
}

function cmdCard(args) {
  const game = byName(args[0]);
  if (!game) {
    console.error(`Unknown game "${args[0]}". Try: rulebook list`);
    process.exit(2);
  }
  const oi = args.indexOf('--out');
  const out = oi === -1 ? `${game.slug}-reference.svg` : args[oi + 1];
  writeFileSync(out, referenceCard(game));
  console.log(`\n  Wrote ${bold(out)}`);
  console.log(`  ${dim('A4 landscape, four panels. Print it, fold it twice, leave it in the box.')}\n`);
}


function cmdAbout(args) {
  const game = byName(args[0]);
  if (!game) {
    console.error(`Unknown game "${args[0]}". Try: rulebook list`);
    process.exit(2);
  }
  const g = game;
  const over = Math.round(minutes(g.playtime_actual) - minutes(g.playtime_box));

  console.log(`\n${bold(g.name)}  ${dim(g.type + ' · ' + g.family)}\n`);
  console.log(wrap(g.objective, 76, '  '));
  console.log();

  const row = (k, v) => console.log(`  ${dim(k.padEnd(18))} ${v}`);
  row('players', g.players.min === g.players.max ? String(g.players.min) : `${g.players.min}–${g.players.max}${g.players.best ? `, best at ${g.players.best}` : ''}`);
  row('box says', fmtDuration(g.playtime_box));
  row('actually takes', `${fmtDuration(g.playtime_actual)}${over > 0 ? c(33, `  — over by ${over} min`) : ''}`);
  row('teach time', fmtDuration(g.teach_time));
  row('between turns', `${fmtDuration(g.downtime)}${minutes(g.downtime) >= 3 ? c(33, '  — long enough to lose people') : ''}`);
  row('works at age', `${g.min_age}+`);
  row('weight', `${'●'.repeat(Math.round(g.weight))}${'○'.repeat(5 - Math.round(g.weight))}  ${g.weight} / 5`);
  row('luck', `${g.luck}% chance, ${100 - g.luck}% skill`);
  row('setup / pack away', `${g.setup_time ? fmtDuration(g.setup_time) : '—'} / ${g.teardown_time ? fmtDuration(g.teardown_time) : '—'}`);
  row('rulings', `${g.rulings.length}${g.hasScore ? ' · has a scorer' : ''}${g.hasOdds ? ' · has odds' : ''}`);
  row('verified', isStale(g)
    ? c(33, 'not checked against a source recently')
    : `${g.verified.on} by ${g.verified.by} ${dim(`(${verificationAge(g)} days ago)`)}`);

  if (g.tiebreak) {
    console.log(`\n${bold('  If the scores tie')}\n`);
    console.log(wrap(g.tiebreak, 74, '  '));
  }

  console.log(`\n${bold('  Setup by player count')}\n`);
  for (const sp of g.setup_by_players) {
    console.log(`  ${bold(sp.players.padEnd(6))} ${wrap(sp.setup, 68, '').split('\n').join('\n         ')}`);
    if (sp.note) console.log(`         ${dim(wrap(sp.note, 66, '').split('\n').join('\n         '))}`);
    console.log();
  }

  if (g.variants?.length) {
    console.log(`${bold('  Variants worth knowing')}\n`);
    for (const v of g.variants) {
      console.log(`  ${bold(v.name)}`);
      console.log(wrap(v.changed, 74, '    '));
      console.log();
    }
  }

  if (g.handicaps?.length) {
    console.log(`${bold('  Levelling it up')}\n`);
    for (const h of g.handicaps) {
      console.log(`  ${bold(h.for)}`);
      console.log(wrap(h.method, 74, '    '));
      console.log();
    }
  }

  if (g.cheats?.length) {
    console.log(`${bold('  How people cheat')}\n`);
    for (const ch of g.cheats) {
      console.log(wrap(ch.move, 74, '  '));
      console.log(c(36, wrap('Spot it: ' + ch.spot.replace(/\s+/g, ' ').trim(), 74, '    ')));
      console.log();
    }
  }

  console.log(`${bold('  When it is fair to stop')}\n`);
  console.log(wrap(g.concession, 74, '  '));

  console.log(`\n${bold('  If a piece is missing')}\n`);
  console.log(wrap(g.substitutions, 74, '  '));

  console.log(`\n${bold('  Accessibility')}\n`);
  console.log(wrap(g.accessibility, 74, '  '));
  console.log(`\n  ${dim(SITE + '/#' + g.slug)}\n`);
}


// ---------------------------------------------------------------------------
// vote — turn "prevalence" from my judgement into somebody's measurement
// ---------------------------------------------------------------------------
async function cmdVote(args) {
  const game = byName(args[0]);
  if (!game) {
    console.error(`Which game? Try: rulebook vote uno`);
    process.exit(2);
  }
  const query = args.slice(1).filter((a) => !a.startsWith('--')).join(' ').trim();
  const ranked = query ? search(game.rulings, query) : [];
  const r = ranked.length ? ranked[0].r : null;

  if (!r) {
    console.log(`\n${bold(game.name)} — which rule do you want to report on?\n`);
    for (const x of game.rulings) console.log(`  ${dim('·')} ${x.question}`);
    console.log(`\n${dim(`Then: rulebook vote ${game.slug} "<a few words from it>"`)}\n`);
    return;
  }

  console.log(`\n${bold(r.question)}`);
  console.log(`${dim(r.official ? 'Officially: yes.' : 'Officially: no — this is a house rule.')}\n`);
  if (r.house_rule) console.log(wrap('The house version: ' + r.house_rule.replace(/\s+/g, ' ').trim(), 74, '  ') + '\n');

  const plays = (await ask('  Does your table play the house version? [y/n] ')).toLowerCase();
  if (!plays) {
    console.log(dim('\n  (nothing recorded)\n'));
    return;
  }
  const region = await ask('  Where do you play? (country or region, enter to skip) ');
  const learned = await ask(`  Where did you learn it? [${LEARNED_FROM.join('/')}] `);
  const decade = await ask('  Roughly when? (e.g. 1990s, enter to skip) ');

  const entry = [
    `  - ruling: ${game.slug}/${r.id}`,
    `    plays: ${plays.startsWith('y') ? 'yes' : 'no'}`,
    region && `    region: ${region}`,
    LEARNED_FROM.includes(learned) && `    learned_from: ${learned}`,
    decade && `    decade: ${decade}`,
  ]
    .filter(Boolean)
    .join('\n');

  console.log(`\n${bold('  Add this to data/votes.yml:')}\n`);
  console.log(entry.split('\n').map((l) => '  ' + l).join('\n'));

  const url =
    'https://github.com/mohitagw15856/rulebook/issues/new?labels=vote&title=' +
    encodeURIComponent(`[vote] ${game.slug}/${r.id}`) +
    '&body=' +
    encodeURIComponent('```yaml\n' + entry + '\n```\n');
  console.log(`\n  ${dim('Or open a pre-filled issue:')}\n  ${dim(url)}\n`);
}

// ---------------------------------------------------------------------------
function cmdCheats(args) {
  const game = byName(args[0]);
  if (!game) {
    const have = games.filter((g) => g.cheats?.length);
    console.error(`Which game? Recorded for: ${have.map((g) => g.slug).join(', ')}`);
    process.exit(2);
  }
  if (!game.cheats?.length) {
    console.error(`Nothing recorded for ${game.name}. Games with cheats on file: ${games.filter((g) => g.cheats?.length).map((g) => g.slug).join(', ')}`);
    process.exit(2);
  }
  console.log(`\n${bold('How people cheat at ' + game.name)}\n`);
  for (const ch of game.cheats) {
    console.log(wrap(ch.move, 74, '  '));
    console.log(c(36, wrap('Spot it: ' + ch.spot.replace(/\s+/g, ' ').trim(), 74, '    ')));
    console.log();
  }
  console.log(`  ${dim('Recorded so you can catch it, not so you can do it.')}\n`);
}

function cmdVerify() {
  const stale = games.filter((g) => isStale(g));
  const fresh = games.filter((g) => !isStale(g));

  console.log(`\n${bold('Verification')}\n`);
  console.log(`  ${c(32, String(fresh.length))} of ${games.length} games checked against a source in the last year.\n`);

  for (const g of fresh) {
    console.log(`  ${c(32, '✓')} ${g.slug.padEnd(22)} ${dim(`${g.verified.on} · ${g.verified.checked.length} facts checked`)}`);
  }
  if (stale.length) {
    console.log();
    for (const g of stale) {
      const age = verificationAge(g);
      console.log(`  ${c(33, '·')} ${g.slug.padEnd(22)} ${dim(age === null ? 'never checked' : `${age} days ago`)}`);
    }
    console.log(
      `\n  ${dim('Unverified is not the same as wrong — it means nobody has re-read the')}\n` +
        `  ${dim('source recently. Pick one up at: npm run coverage')}\n`
    );
  } else {
    console.log();
  }
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
    await cmdTeach(argv.slice(1));
    break;
  case 'find':
    cmdFind(argv.slice(1));
    break;
  case 'list':
    cmdList();
    break;
  case 'night':
    cmdNight(argv.slice(1));
    break;
  case 'ref':
    await cmdRef(argv.slice(1));
    break;
  case 'record':
    cmdRecord();
    break;
  case 'quiz':
    await cmdQuiz(argv.slice(1));
    break;
  case 'timer':
    await cmdTimer(argv.slice(1));
    break;
  case 'odds':
    await cmdOdds(argv.slice(1));
    break;
  case 'hottest':
    cmdHottest();
    break;
  case 'about':
    cmdAbout(argv.slice(1));
    break;
  case 'vote':
    await cmdVote(argv.slice(1));
    break;
  case 'cheats':
    cmdCheats(argv.slice(1));
    break;
  case 'verify':
    cmdVerify();
    break;
  case 'mcp': {
    // Hand the process over to the MCP server; it owns stdio from here.
    const { serve } = await import('../mcp/server.mjs');
    serve();
    break;
  }
  case 'qr':
    cmdQr(argv.slice(1));
    break;
  case 'card':
    cmdCard(argv.slice(1));
    break;
  default:
    // Bare `rulebook uno "can I stack"` should just work.
    if (byName(cmd)) cmdRuling(argv);
    else usage(2);
}
