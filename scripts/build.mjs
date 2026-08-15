#!/usr/bin/env node
// Generates README.md and one page per game from the YAML.
//
// Everything below the marker in README.md is a build artifact. Edit the game
// files, run `npm run build`, commit both. CI fails if you forget — a README
// that disagrees with the data is worse than no README.

import { writeFileSync, readFileSync, mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { load, validate, fmtDuration, minutes, TYPES, PREVALENCE } from '../lib/registry.mjs';

const ROOT = fileURLToPath(new URL('../', import.meta.url));
const games = load();
const errs = validate(games);
if (errs.length) {
  console.error('Refusing to build from invalid data:\n');
  for (const e of errs) console.error(`  ${e}`);
  process.exit(1);
}

const allRulings = games.flatMap((g) => g.rulings.map((r) => ({ ...r, game: g })));
const houseRules = allRulings.filter((r) => !r.official);
const universal = houseRules.filter((r) => r.prevalence === 'near-universal');

const stars = (w) => '●'.repeat(Math.round(w)) + '○'.repeat(5 - Math.round(w));
const esc = (s) => String(s).replace(/\|/g, '\\|').replace(/\n/g, ' ').trim();
const oneLine = (s) => esc(s).replace(/\s+/g, ' ');

// ---------------------------------------------------------------------------
// Per-game pages
// ---------------------------------------------------------------------------
mkdirSync(`${ROOT}docs/games`, { recursive: true });

for (const g of games) {
  const p = [];
  p.push(`# ${g.name}`);
  p.push('');
  p.push(`> ${oneLine(g.objective)}`);
  p.push('');
  p.push('|  |  |');
  p.push('|---|---|');
  p.push(`| **Players** | ${g.players.min}–${g.players.max}${g.players.best ? `, best at ${g.players.best}` : ''} |`);
  p.push(`| **Box says** | ${fmtDuration(g.playtime_box)} |`);
  p.push(`| **Actually takes** | ${fmtDuration(g.playtime_actual)} |`);
  p.push(`| **Teach time** | ${fmtDuration(g.teach_time)} |`);
  p.push(`| **Between your turns** | ${fmtDuration(g.downtime)} |`);
  p.push(`| **Works at age** | ${g.min_age}+ |`);
  p.push(`| **Weight** | ${stars(g.weight)} ${g.weight} / 5 |`);
  p.push(`| **Luck** | ${g.luck}% chance, ${100 - g.luck}% skill |`);
  p.push(`| **Family** | ${g.family} |`);
  p.push('');

  p.push('## How many players changes what');
  p.push('');
  p.push('| Players | Setup | Notes |');
  p.push('|---|---|---|');
  for (const s of g.setup_by_players) {
    p.push(`| **${s.players}** | ${oneLine(s.setup)} | ${s.note ? oneLine(s.note) : '—'} |`);
  }
  p.push('');

  p.push('## Rules');
  p.push('');
  p.push(readFileSync(`${ROOT}${g.__dir}/rules.md`, 'utf8').trim().replace(/^# .*\n+/, ''));
  p.push('');

  if (g.rulings.length) {
    p.push('## Settle the argument');
    p.push('');
    for (const r of g.rulings) {
      p.push(`### ${r.question}`);
      p.push('');
      p.push(
        r.official
          ? `**Official rule.** ${PREVALENCE[r.prevalence]}.`
          : `**Not an official rule.** ${PREVALENCE[r.prevalence]}.`
      );
      p.push('');
      p.push(oneLine(r.verdict));
      if (r.house_rule) {
        p.push('');
        p.push(`*The house version:* ${oneLine(r.house_rule)}`);
      }
      if (r.effect) {
        p.push('');
        p.push(`*What it changes:* ${oneLine(r.effect)}`);
      }
      if (r.regions?.length && !r.regions.includes('global')) {
        p.push('');
        p.push(`*Played mostly in:* ${r.regions.join(', ')}`);
      }
      if (r.source) {
        p.push('');
        p.push(`Source: <${r.source}>`);
      }
      p.push('');
      p.push(`\`\`\`console\n$ rulebook ruling ${g.slug} "${(r.asked_as || [r.question])[0]}"\n\`\`\``);
      p.push('');
    }
  }

  p.push('## Teaching it');
  p.push('');
  p.push(readFileSync(`${ROOT}${g.__dir}/teach.md`, 'utf8').trim().replace(/^# .*\n+/, ''));
  p.push('');

  if (g.hasScore) {
    p.push('## Scoring');
    p.push('');
    p.push(`This game has a scorer. \`rulebook score ${g.slug} "..."\` works out the total for you.`);
    p.push('');
  }

  if (g.editions?.length) {
    p.push('## Editions');
    p.push('');
    p.push('| Edition | Year | What changed |');
    p.push('|---|---|---|');
    for (const e of g.editions) p.push(`| ${e.name} | ${e.year || '—'} | ${oneLine(e.changed)} |`);
    p.push('');
  }

  if (g.variants?.length) {
    p.push('## Variants worth knowing');
    p.push('');
    for (const v of g.variants) p.push(`**${v.name}** — ${oneLine(v.changed)}`, '');
  }

  p.push('## When it is fair to stop');
  p.push('');
  p.push(oneLine(g.concession));
  p.push('');

  p.push('## When a piece goes missing');
  p.push('');
  p.push(oneLine(g.substitutions));
  p.push('');
  p.push('## Accessibility');
  p.push('');
  p.push(oneLine(g.accessibility));
  p.push('');

  if (g.sources?.length) {
    p.push('## Sources');
    p.push('');
    for (const s of g.sources) p.push(`- <${s}>`);
    p.push('');
  }

  p.push('---');
  p.push('');
  p.push(`*Generated from [\`${g.__dir}/\`](../../${g.__dir}/). Fix it there, not here.*`);
  p.push('');

  writeFileSync(`${ROOT}docs/games/${g.slug}.md`, p.join('\n'));
}

// ---------------------------------------------------------------------------
// README
// ---------------------------------------------------------------------------
const out = [];

out.push('<!-- Everything below this line is generated by scripts/build.mjs. Edit games/, not this. -->');
out.push('');
out.push('## Every game on file');
out.push('');
out.push(`<details>`);
out.push(
  `<summary><b>All ${games.length} games</b> — who they suit, what they really take, and how many arguments each one starts</summary>`
);
out.push('');

for (const [type, label] of Object.entries(TYPES)) {
  const list = games.filter((g) => g.type === type);
  if (!list.length) continue;
  out.push(`### ${label}`);
  out.push('');
  out.push('| Game | Players | Box says | Actually | Teach | Weight | Luck | Rulings |');
  out.push('|---|---|---|---|---|---|---|---|');
  for (const g of list) {
    out.push(
      `| **[${g.name}](docs/games/${g.slug}.md)** | ${g.players.min}–${g.players.max}` +
        `${g.players.best ? ` (best ${g.players.best})` : ''} | ${fmtDuration(g.playtime_box)} | ` +
        `**${fmtDuration(g.playtime_actual)}** | ${fmtDuration(g.teach_time)} | ${stars(g.weight)} | ` +
        `${g.luck}% | ${g.rulings.length}${g.hasScore ? ' 🧮' : ''}${g.hasOdds ? ' 🎲' : ''} |`
    );
  }
  out.push('');
}
out.push('🧮 scorer · 🎲 odds table · **bold** playtime is the real one');
out.push('');
out.push('</details>');
out.push('');

// The headline table: rules everyone plays that are not rules at all.
out.push('## The wall of shame');
out.push('');
out.push('Every one of these is a house rule. **None of them is official.** Most people');
out.push('have played them their whole lives without ever knowing that.');
out.push('');
out.push('| Game | "Rule" | The actual rule |');
out.push('|---|---|---|');
for (const r of universal) {
  out.push(`| ${r.game.name} | ${esc(r.question)} | ${oneLine(r.verdict).slice(0, 150)}${oneLine(r.verdict).length > 150 ? '…' : ''} |`);
}
out.push('');

out.push('## Every ruling on file');
out.push('');
out.push('<details>');
out.push(`<summary><b>All ${allRulings.length} rulings</b> — every argument in the registry, official or not</summary>`);
out.push('');
out.push('| Game | Question | Official? | How widely played |');
out.push('|---|---|---|---|');
for (const r of allRulings) {
  out.push(
    `| [${r.game.name}](docs/games/${r.game.slug}.md) | ${esc(r.question)} | ` +
      `${r.official ? '✅ yes' : '❌ no'} | ${r.prevalence.replace('-', ' ')} |`
  );
}
out.push('');
out.push('</details>');
out.push('');

// Everyone who has ever landed a change, straight from git rather than a list
// somebody has to remember to update.
function contributors() {
  try {
    const raw = execFileSync('git', ['log', '--format=%aN|%aE'], { cwd: ROOT, encoding: 'utf8' });
    const seen = new Map();
    for (const line of raw.split('\n')) {
      const [name, email] = line.split('|');
      if (!name || /\[bot\]|noreply@/.test(email || '')) continue;
      seen.set(name, (seen.get(name) || 0) + 1);
    }
    return [...seen.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  } catch {
    return []; // a tarball with no git history is a perfectly valid checkout
  }
}

const people = contributors();
if (people.length) {
  out.push('## Who has settled an argument here');
  out.push('');
  // Names only, never commit counts. A number that changes with every commit
  // would make this generated file permanently stale against its own CI check.
  out.push(people.map(([name]) => `**${name}**`).join(' · '));
  out.push('');
  out.push(
    `${allRulings.length} rulings on file. ` +
      '[Add the one your table argues about](https://github.com/mohitagw15856/rulebook/issues/new?template=good-first-ruling.yml) — ' +
      'it is one entry, no code, and no build step.'
  );
  out.push('');
}

out.push('## By the numbers');
out.push('');
out.push('| | |');
out.push('|---|---|');
out.push(`| Games | ${games.length} |`);
out.push(`| Rulings | ${allRulings.length} |`);
out.push(`| Of those, not official rules | ${houseRules.length} |`);
out.push(`| Not official, yet played nearly everywhere | ${universal.length} |`);
out.push(`| Games with a runnable scorer | ${games.filter((g) => g.hasScore).length} |`);
out.push(`| Games with an odds table | ${games.filter((g) => g.hasOdds).length} |`);
out.push(`| Documented variants | ${games.reduce((a, g) => a + (g.variants?.length || 0), 0)} |`);
out.push(`| Rulings that are region-specific | ${allRulings.filter((r) => (r.regions || []).some((x) => x !== 'global')).length} |`);
out.push(`| Games playable with a six-year-old | ${games.filter((g) => g.min_age <= 6).length} |`);
out.push(`| Games needing nothing but people | ${games.filter((g) => /nothing at all|Slips of paper/i.test((g.components || []).join(' '))).length} |`);
// Compare in minutes, not in whatever unit each game happens to be written in.
const overrun = games.reduce((a, g) => a + (minutes(g.playtime_actual) - minutes(g.playtime_box)), 0);
const worst = games
  .map((g) => ({ g, over: minutes(g.playtime_actual) - minutes(g.playtime_box) }))
  .sort((a, b) => b.over - a.over)[0];
out.push(`| Minutes the boxes are collectively lying by | ${Math.round(overrun)} |`);
out.push(`| Worst offender | ${worst.g.name}, over by ${Math.round(worst.over)} min |`);
out.push('');

const generated = out.join('\n');
const MARK = '<!-- Everything below this line is generated';
const readmePath = `${ROOT}README.md`;
let readme = '';
try {
  readme = readFileSync(readmePath, 'utf8');
} catch {
  readme = '';
}
const head = readme.includes(MARK) ? readme.slice(0, readme.indexOf(MARK)) : readme;
writeFileSync(readmePath, head + generated);

console.log(
  `✓ built README.md and ${games.length} game pages — ${allRulings.length} rulings, ` +
    `${universal.length} of them universally played and entirely made up`
);
