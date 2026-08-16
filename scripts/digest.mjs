#!/usr/bin/env node
// What changed, built from git rather than from anybody remembering.
//
//   node scripts/digest.mjs            # since last month
//   node scripts/digest.mjs 2026-08-01 # since a date

import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { load } from '../lib/registry.mjs';

const ROOT = fileURLToPath(new URL('../', import.meta.url));
const since =
  process.argv[2] ||
  new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);

const git = (...args) => {
  try {
    return execFileSync('git', args, { cwd: ROOT, encoding: 'utf8' }).trim();
  } catch {
    return '';
  }
};

const changed = git('log', `--since=${since}`, '--name-only', '--pretty=format:').split('\n').filter(Boolean);
const commits = git('log', `--since=${since}`, '--pretty=format:%s').split('\n').filter(Boolean);

const slugsTouched = new Set(
  changed.filter((f) => f.startsWith('games/')).map((f) => f.split('/')[1])
);
const newGames = changed
  .filter((f) => /^games\/[^/]+\/game\.yml$/.test(f))
  .map((f) => f.split('/')[1]);
const games = load();
const byName = (slug) => games.find((g) => g.slug === slug)?.name || slug;

console.log(`# rulebook digest — since ${since}\n`);

if (!commits.length) {
  console.log('Nothing changed. Not every month has an argument in it.\n');
} else {
  console.log(`${commits.length} commit${commits.length === 1 ? '' : 's'}, touching ${slugsTouched.size} game${slugsTouched.size === 1 ? '' : 's'}.\n`);

  if (slugsTouched.size) {
    console.log('## Games updated\n');
    for (const slug of [...slugsTouched].sort()) {
      const g = games.find((x) => x.slug === slug);
      console.log(`- **${byName(slug)}** — ${g ? `${g.rulings.length} rulings on file` : 'removed'}`);
    }
    console.log();
  }

  console.log('## What happened\n');
  for (const c of commits.slice(0, 20)) console.log(`- ${c}`);
  if (commits.length > 20) console.log(`- …and ${commits.length - 20} more`);
  console.log();
}

const all = games.flatMap((g) => g.rulings);
console.log('## Where things stand\n');
console.log(`| | |`);
console.log(`|---|---|`);
console.log(`| Games | ${games.length} |`);
console.log(`| Rulings | ${all.length} |`);
console.log(`| Not official | ${all.filter((r) => !r.official).length} |`);
console.log(`| Verified within a year | ${games.filter((g) => g.verified?.on).length} of ${games.length} |`);
console.log();
