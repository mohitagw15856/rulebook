#!/usr/bin/env node
// Snapshots of generated output.
//
// The README, the API and the feed are all generated. A refactor that quietly
// changes their shape passes every other check — the data is still valid, the
// tests still pass — and only shows up when somebody's parser breaks. These
// snapshots turn that into a diff.
//
//   node scripts/golden.mjs          # compare
//   node scripts/golden.mjs --update # accept the current output
//
// Snapshots are structural rather than literal: exact prose changes constantly
// and would make this a nuisance, while the *shape* changing is the thing
// worth catching.

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { load } from '../lib/registry.mjs';
import { benchmark } from './eval.mjs';

const DIR = fileURLToPath(new URL('../tests/golden/', import.meta.url));
const UPDATE = process.argv.includes('--update');
mkdirSync(DIR, { recursive: true });

const games = load();

// Shape, not content: which keys exist, of what type, never the prose itself.
const shape = (v, depth = 0) => {
  if (v === null) return 'null';
  if (Array.isArray(v)) return depth > 3 ? 'array' : [shape(v[0], depth + 1)];
  if (typeof v === 'object') {
    return Object.fromEntries(
      Object.keys(v)
        .filter((k) => !k.startsWith('__'))
        .sort()
        .map((k) => [k, shape(v[k], depth + 1)])
    );
  }
  return typeof v;
};

const snapshots = {
  'game-shape.json': () => {
    // The union of every key any game uses, so a dropped field is visible.
    const keys = new Set();
    for (const g of games) for (const k of Object.keys(g)) if (!k.startsWith('__')) keys.add(k);
    const uno = games.find((g) => g.slug === 'uno');
    return { all_keys: [...keys].sort(), example_uno: shape(uno) };
  },
  'ruling-shape.json': () => {
    const keys = new Set();
    for (const g of games) for (const r of g.rulings) for (const k of Object.keys(r)) if (!k.startsWith('__')) keys.add(k);
    return { all_keys: [...keys].sort() };
  },
  'readme-headings.json': () => {
    const md = readFileSync(new URL('../README.md', import.meta.url), 'utf8');
    return { headings: [...md.matchAll(/^##+ (.+)$/gm)].map((m) => m[1].replace(/&nbsp;/g, '').trim()) };
  },
  'bench-shape.json': () => {
    const b = benchmark();
    return {
      tasks: [...new Set(b.map((q) => q.task))].sort(),
      question_keys: Object.keys(b[0]).sort(),
      answers: [...new Set(b.map((q) => q.answer))].sort(),
      tags: [...new Set(b.flatMap((q) => q.tags))].sort(),
    };
  },
  'cli-commands.json': () => {
    const bin = readFileSync(new URL('../bin/rulebook.mjs', import.meta.url), 'utf8');
    return { commands: [...bin.matchAll(/^\s+case '([a-z]+)':/gm)].map((m) => m[1]).sort() };
  },
};

let failed = 0;
for (const [name, build] of Object.entries(snapshots)) {
  const current = JSON.stringify(build(), null, 2);
  const path = DIR + name;

  if (UPDATE || !existsSync(path)) {
    writeFileSync(path, current + '\n');
    console.log(`  ${existsSync(path) ? 'updated' : 'created'}  ${name}`);
    continue;
  }

  const saved = readFileSync(path, 'utf8').trim();
  if (saved === current) {
    console.log(`  ✓ ${name}`);
  } else {
    failed++;
    console.error(`  ✗ ${name} changed shape`);
    const a = saved.split('\n');
    const b = current.split('\n');
    for (let i = 0; i < Math.max(a.length, b.length); i++) {
      if (a[i] !== b[i]) {
        console.error(`      line ${i + 1}`);
        console.error(`        was: ${a[i] ?? '(nothing)'}`);
        console.error(`        now: ${b[i] ?? '(nothing)'}`);
      }
    }
  }
}

if (failed) {
  console.error(
    `\n${failed} snapshot(s) changed. If the change is intended — a new field, a new command —\n` +
      `run: node scripts/golden.mjs --update  and commit the result.\n`
  );
  process.exit(1);
}
console.log(`\n✓ ${Object.keys(snapshots).length} snapshots match\n`);
