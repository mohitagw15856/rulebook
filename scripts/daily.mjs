#!/usr/bin/env node
// Rule of the day.
//
// 196 rulings is more than six months of daily posts that already exist. The
// choice is deterministic from the date, so the same day always produces the
// same rule — reruns do not repost something different, and anybody can check
// what tomorrow will be.

import { load } from '../lib/registry.mjs';

const games = load();
// Interesting first: a house rule everybody plays beats an obscure
// clarification, so the rotation is ordered by heat rather than alphabetically.
const pool = games
  .flatMap((g) => g.rulings.map((r) => ({ ...r, game: g })))
  .sort((a, b) => b.heat - a.heat || `${a.game.slug}/${a.id}`.localeCompare(`${b.game.slug}/${b.id}`));

const day = Math.floor(
  (process.env.RULEBOOK_DATE ? new Date(process.env.RULEBOOK_DATE) : new Date()).setHours(0, 0, 0, 0) / 86400000
);
const r = pool[day % pool.length];
const url = `https://mohitagw15856.github.io/rulebook/r/${r.game.slug}/${r.id}/`;
const trim = (s, n) => (s.length <= n ? s : s.slice(0, n - 1).replace(/\s\S*$/, '') + '…');
const verdict = r.verdict.replace(/\s+/g, ' ').trim();

// Under 280 characters, so it can be posted as-is.
const post = `${r.game.name}: ${r.question}\n\n${r.official ? '✅ Official.' : '❌ Not a real rule.'} ${trim(
  verdict.replace(/^(No|Yes)[.,]\s*/i, ''),
  280 - r.game.name.length - r.question.length - url.length - 40
)}\n\n${url}`;

console.log(`## Rule of the day\n`);
console.log(`**${r.game.name} — ${r.question}**\n`);
console.log(`${r.official ? 'OFFICIAL RULE' : 'NOT AN OFFICIAL RULE'} · ${r.prevalence.replace('-', ' ')}\n`);
console.log(`${verdict}\n`);
console.log(`${url}\n`);
console.log(`### Ready to post (${post.length} characters)\n`);
console.log('```');
console.log(post);
console.log('```');
