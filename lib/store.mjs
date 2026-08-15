// Where rulebook keeps the things it has to remember between runs: who won
// which argument, and how the quiz has gone.
//
// One JSON file under the user's home directory. No database, no config
// format, nothing to migrate. If it goes missing the tool still works and you
// have simply lost the scoreboard, which is the correct failure mode for a
// scoreboard.

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, dirname } from 'node:path';

export const STORE_DIR = process.env.RULEBOOK_HOME || join(homedir(), '.rulebook');
const FILE = join(STORE_DIR, 'record.json');

const EMPTY = { disputes: [], quiz: [], version: 1 };

export function read() {
  try {
    const raw = JSON.parse(readFileSync(FILE, 'utf8'));
    return { ...EMPTY, ...raw };
  } catch {
    return { ...EMPTY };
  }
}

export function write(data) {
  mkdirSync(dirname(FILE), { recursive: true });
  writeFileSync(FILE, JSON.stringify(data, null, 2) + '\n');
  return FILE;
}

export function update(fn) {
  const data = read();
  const next = fn(data) ?? data;
  write(next);
  return next;
}

export const storePath = () => FILE;
export const storeExists = () => existsSync(FILE);

// Win/loss per person, most-argumentative first. Used by both the dispute
// tracker and the quiz, which is why it lives here rather than in either.
export function tally(rows, nameKey = 'called', rightKey = 'right') {
  const people = new Map();
  for (const row of rows) {
    const name = row[nameKey];
    if (!name) continue;
    const p = people.get(name) || { name, right: 0, wrong: 0 };
    if (row[rightKey]) p.right++;
    else p.wrong++;
    people.set(name, p);
  }
  return [...people.values()]
    .map((p) => ({ ...p, total: p.right + p.wrong, pct: Math.round((p.right / (p.right + p.wrong)) * 100) }))
    .sort((a, b) => b.pct - a.pct || b.total - a.total);
}
