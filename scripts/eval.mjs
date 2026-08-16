#!/usr/bin/env node
// A benchmark for whether a model knows how games are actually played.
//
// This registry has an unusual property: it contains questions where the
// popular answer and the correct answer differ, and the popular answer is what
// the internet is made of. A model trained on the internet will tell you,
// confidently, that you can stack a +2 in Uno.
//
// That makes 196 rulings a genuinely hard eval rather than a trivia quiz. The
// interesting number is not the overall score — it is the gap between
// performance on official rules and performance on near-universal house rules,
// because that gap measures whether a model has learned the rules or learned
// what people say about them.
//
//   node scripts/eval.mjs build > bench.jsonl     # make the benchmark
//   node scripts/eval.mjs score answers.jsonl     # mark a model's answers
//   node scripts/eval.mjs leaderboard             # render results/
//
// It deliberately does NOT call any model API. Running the benchmark costs
// somebody money, and that somebody should be the person who decided to.

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { load } from '../lib/registry.mjs';

const RESULTS = fileURLToPath(new URL('../results/', import.meta.url));
const games = load();

// Two task types, both deterministically scoreable. Rulings whose answer is
// neither yes nor no — "What happens to tiles that do not fit?" — are excluded
// rather than fudged: a benchmark you cannot mark without a grader model is not
// a benchmark, it is a vibe.
//
// The `official` field classifies the *ruling*, not the answer. An official
// clarification can perfectly well answer "no". Conflating the two is the first
// thing I got wrong here, and it silently inverted the answer key.
export function benchmark() {
  const out = [];

  for (const g of games) {
    for (const r of g.rulings) {
      const verdict = r.verdict.trim();
      const tags = [
        r.official ? 'official' : 'house-rule',
        r.prevalence,
        !r.official && r.prevalence === 'near-universal' ? 'trap' : null,
      ].filter(Boolean);

      // Task 1 — answer the question as somebody would actually ask it.
      const opens = verdict.match(/^(yes|no)\b/i);
      if (opens) {
        out.push({
          id: `${g.slug}/${r.id}`,
          task: 'rule_qa',
          game: g.name,
          question: r.question,
          prompt:
            `In ${g.name}: ${r.question}\n` +
            `Answer according to the official published rules, not how people usually play. ` +
            `Reply with exactly one word: YES or NO.`,
          answer: opens[1].toUpperCase(),
          tags,
        });
      }

      // Task 2 — is this widespread practice actually in the rules? This is
      // the part the internet gets wrong, and the part worth measuring.
      if (!r.official && r.house_rule) {
        out.push({
          id: `${g.slug}/${r.id}#practice`,
          task: 'is_it_official',
          game: g.name,
          question: r.question,
          prompt:
            `Many ${g.name} players do the following:\n` +
            `"${r.house_rule.replace(/\s+/g, ' ').trim()}"\n\n` +
            `Is this part of the official published rules of ${g.name}? ` +
            `Reply with exactly one word: YES or NO.`,
          answer: 'NO',
          tags: [...tags, 'practice'],
        });
      }
    }
  }
  return out;
}

function normalise(s) {
  const t = String(s || '').trim().toLowerCase();
  if (/^(yes|y|true|correct)\b/.test(t)) return 'YES';
  if (/^(no|n|false|incorrect)\b/.test(t)) return 'NO';
  // Models often answer in a sentence despite instructions. Take the first
  // clear yes/no rather than scoring it wrong for being chatty.
  const m = t.match(/\b(yes|no)\b/);
  return m ? m[1].toUpperCase() : null;
}

export function score(answers) {
  const bench = new Map(benchmark().map((q) => [q.id, q]));
  const buckets = {};
  let right = 0;
  let unparsed = 0;
  const wrong = [];

  for (const a of answers) {
    const q = bench.get(a.id);
    if (!q) continue;
    const got = normalise(a.answer);
    if (got === null) unparsed++;
    const ok = got === q.answer;
    if (ok) right++;
    else wrong.push({ id: q.id, question: q.question, expected: q.answer, got: got ?? '(unparseable)', tags: q.tags });
    for (const tag of q.tags) {
      buckets[tag] ||= { n: 0, right: 0 };
      buckets[tag].n++;
      if (ok) buckets[tag].right++;
    }
  }

  const n = answers.filter((a) => bench.has(a.id)).length;
  const pct = (b) => (b && b.n ? Math.round((b.right / b.n) * 100) : null);

  return {
    n,
    right,
    pct: n ? Math.round((right / n) * 100) : 0,
    unparsed,
    by_tag: Object.fromEntries(Object.entries(buckets).map(([k, v]) => [k, { ...v, pct: pct(v) }])),
    // The headline: does it do worse on rules everybody gets wrong?
    consensus_gap:
      pct(buckets.official) !== null && pct(buckets.trap) !== null
        ? pct(buckets.official) - pct(buckets.trap)
        : null,
    wrong,
  };
}

export function loadResults() {
  if (!existsSync(RESULTS)) return [];
  return readdirSync(RESULTS)
    .filter((f) => f.endsWith('.json'))
    .map((f) => ({ file: f, ...JSON.parse(readFileSync(RESULTS + f, 'utf8')) }))
    .filter((r) => r.model && r.result)
    .sort((a, b) => b.result.pct - a.result.pct);
}

// --- CLI --------------------------------------------------------------------
// Only when run directly: importing this module (the tests do) must not print
// a banner or read argv.
const RUN_DIRECTLY = import.meta.url === `file://${process.argv[1]}`;
const [, , cmd, arg] = RUN_DIRECTLY ? process.argv : [];

if (!RUN_DIRECTLY) {
  // nothing — exports only
} else if (cmd === 'build') {
  for (const q of benchmark()) console.log(JSON.stringify(q));
} else if (cmd === 'score') {
  if (!arg) {
    console.error('usage: node scripts/eval.mjs score answers.jsonl');
    process.exit(2);
  }
  const answers = readFileSync(arg, 'utf8')
    .split('\n')
    .filter(Boolean)
    .map((l) => JSON.parse(l));
  const r = score(answers);
  console.log(JSON.stringify(r, null, 2));
} else if (cmd === 'leaderboard') {
  const rows = loadResults();
  if (!rows.length) {
    console.log('\nNo results yet. Run the benchmark and open a pull request adding results/<model>.json\n');
  } else {
    console.log(`\n${'model'.padEnd(28)} overall  official  trap   gap`);
    for (const r of rows) {
      const t = r.result.by_tag || {};
      console.log(
        `${r.model.padEnd(28)} ${String(r.result.pct).padStart(6)}% ` +
          `${String(t.official?.pct ?? '—').padStart(8)}% ${String(t.trap?.pct ?? '—').padStart(5)}% ` +
          `${String(r.result.consensus_gap ?? '—').padStart(5)}`
      );
    }
    console.log('\ngap = how much worse it does on rules everybody plays but nobody checked.\n');
  }
} else if (cmd) {
  console.error(`unknown command "${cmd}" — try build, score or leaderboard`);
  process.exit(2);
} else {
  const b = benchmark();
  const traps = b.filter((q) => q.tags.includes('trap'));
  console.log(`\nrulebook-bench — ${b.length} questions across ${games.length} games`);
  console.log(`  ${b.filter((q) => q.task === 'rule_qa').length} rule questions with an unambiguous yes/no answer`);
  console.log(`  ${b.filter((q) => q.task === 'is_it_official').length} "is this widespread practice actually official?"`);
  console.log(`  ${b.filter((q) => q.answer === 'YES').length} answer YES · ${b.filter((q) => q.answer === 'NO').length} answer NO`);
  console.log(`  ${traps.length} traps — not official, yet played almost everywhere\n`);
  console.log('  node scripts/eval.mjs build > bench.jsonl');
  console.log('  node scripts/eval.mjs score answers.jsonl');
  console.log('  node scripts/eval.mjs leaderboard\n');
}
