#!/usr/bin/env node
// What is missing, and how old the facts are.
//
// Several fields here are optional on purpose. Making them required would
// force every contributor to invent a tiebreak for Charades, and the registry
// would fill with filler rather than facts. Optional plus a visible coverage
// report is the honest trade: the gaps stay gaps, and everyone can see them.

import { load, isStale, verificationAge, STALE_AFTER_DAYS } from '../lib/registry.mjs';

const games = load();
const OPTIONAL = [
  ['setup_time', (g) => g.setup_time !== undefined, 'how long it takes to get on the table'],
  ['teardown_time', (g) => g.teardown_time !== undefined, 'how long it takes to pack away'],
  ['tiebreak', (g) => Boolean(g.tiebreak), 'what happens on a tied score'],
  ['cheats', (g) => (g.cheats || []).length > 0, 'how people cheat, and how to spot it'],
  ['handicaps', (g) => (g.handicaps || []).length > 0, 'how to level it between an expert and a beginner'],
  ['variants', (g) => (g.variants || []).length > 0, 'official and regional variants'],
  ['editions', (g) => (g.editions || []).length > 0, 'what changed between printings'],
  ['odds', (g) => g.hasOdds, 'a probability table'],
  ['score', (g) => g.hasScore, 'a runnable scorer'],
];

const bar = (n, total, width = 24) => {
  const filled = Math.round((n / total) * width);
  return '█'.repeat(filled) + '░'.repeat(width - filled);
};

console.log(`\nCoverage across ${games.length} games\n`);
for (const [name, has, why] of OPTIONAL) {
  const n = games.filter(has).length;
  const pct = Math.round((n / games.length) * 100);
  console.log(`  ${name.padEnd(14)} ${bar(n, games.length)} ${String(n).padStart(3)}/${games.length}  ${String(pct).padStart(3)}%`);
  console.log(`  ${' '.repeat(14)} ${why}`);
  const missing = games.filter((g) => !has(g)).map((g) => g.slug);
  if (missing.length && missing.length <= 8) console.log(`  ${' '.repeat(14)} missing: ${missing.join(', ')}`);
  console.log();
}

// --- verification ------------------------------------------------------------
const stale = games.filter((g) => isStale(g));
const verified = games.filter((g) => !isStale(g));
console.log(`Verification\n`);
console.log(`  ${verified.length}/${games.length} games checked against a source within ${STALE_AFTER_DAYS} days\n`);

if (stale.length) {
  console.log('  Needs checking:');
  for (const g of stale) {
    const age = verificationAge(g);
    console.log(`    ${g.slug.padEnd(22)} ${age === null ? 'never verified' : `${age} days ago`}`);
  }
  console.log();
}

const rulings = games.flatMap((g) => g.rulings);
const sourced = rulings.filter((r) => r.source || (r.sources || []).length);
const contested = rulings.filter((r) => (r.sources || []).some((x) => !x.agrees));
console.log(`Rulings\n`);
console.log(`  ${sourced.length}/${rulings.length} carry a source`);
console.log(`  ${contested.length} have a source that disagrees with the verdict, recorded rather than hidden`);
console.log(`  ${rulings.filter((r) => (r.interacts_with || []).length).length} are linked to another ruling they interact with\n`);

// Never exit non-zero. This is a map of the gaps, not a gate — failing a build
// over a missing tiebreak would just encourage somebody to invent one.
