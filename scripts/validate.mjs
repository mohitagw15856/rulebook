#!/usr/bin/env node
// Schema check for every game. Run: node scripts/validate.mjs
import { load, validate } from '../lib/registry.mjs';

const games = load();
const errs = validate(games);
if (errs.length) {
  console.error(`✗ ${errs.length} problem(s):\n`);
  for (const e of errs) console.error('  ' + e);
  process.exit(1);
}
const rulings = games.reduce((a, g) => a + g.rulings.length, 0);
const wrong = games.flatMap((g) => g.rulings).filter((r) => !r.official && r.prevalence === 'near-universal');
console.log(
  `✓ ${games.length} game(s) valid — ${rulings} rulings, ${wrong.length} of which are house rules almost everyone plays`
);
