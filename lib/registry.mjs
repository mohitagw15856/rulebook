// Loads and validates every game. Imported by the build script, the CLI and the
// tests, so it must have no side effects.
//
// The schema is doing real work here. Each required field exists because a game
// entry without it fails to answer a question somebody actually has:
//   - setup_by_players  → "how many cards for five people?"
//   - playtime_actual   → box times are marketing
//   - rulings           → "that's not a real rule" at 9pm on a Friday
//   - teach.md          → explaining it to someone who has never played
//   - substitutions     → the cat ate a meeple

import { readdirSync, readFileSync, existsSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { parseYaml } from './yaml.mjs';

const DIR = new URL('../games/', import.meta.url).pathname;

export const TYPES = {
  card: 'Card games',
  board: 'Board games',
  word: 'Word games',
  party: 'Party games',
  abstract: 'Abstract strategy',
};

// How widely a house rule is actually played. This is the column that makes the
// registry interesting — "not official" and "everybody does it" are different
// facts, and most of the fun is in the gap.
export const PREVALENCE = {
  'near-universal': 'Played by almost everyone, almost everywhere',
  common: 'Widespread but far from universal',
  regional: 'Standard in some places, unheard of in others',
  rare: 'Occasional, or specific to one group',
};

export const KINDS = {
  'house-rule': 'Not in the published rules, but widely played',
  clarification: 'Genuinely official, and routinely played wrong',
};

// Seconds are allowed because a good teach time really can be under a minute.
const DURATION = /^\d+(\.\d+)?(s|m|h)$/;

export function load() {
  return readdirSync(DIR)
    .filter((f) => statSync(join(DIR, f)).isDirectory())
    .sort()
    .map((slug) => {
      const dir = join(DIR, slug);
      const g = parseYaml(readFileSync(join(dir, 'game.yml'), 'utf8'));
      g.slug = slug;
      g.__dir = `games/${slug}`;
      g.rulings = existsSync(join(dir, 'rulings.yml'))
        ? parseYaml(readFileSync(join(dir, 'rulings.yml'), 'utf8')).rulings || []
        : [];
      g.hasRules = existsSync(join(dir, 'rules.md'));
      g.hasTeach = existsSync(join(dir, 'teach.md'));
      g.hasScore = existsSync(join(dir, 'score.mjs'));
      return g;
    });
}

export function validate(games) {
  const errs = [];
  const seen = new Set();

  for (const g of games) {
    const at = g.__dir;
    const need = (cond, msg) => {
      if (!cond) errs.push(`${at}: ${msg}`);
    };

    need(g.name, 'missing "name"');
    need(!seen.has(g.name), `duplicate game name "${g.name}"`);
    seen.add(g.name);
    need(TYPES[g.type], `type "${g.type}" not in: ${Object.keys(TYPES).join(', ')}`);
    need(g.family, 'missing "family" (shedding, trick-taking, worker placement, …)');

    // Player counts
    need(g.players && Number.isInteger(g.players.min), 'players.min must be an integer');
    need(g.players && Number.isInteger(g.players.max), 'players.max must be an integer');
    if (g.players?.min && g.players?.max) {
      need(g.players.min <= g.players.max, 'players.min is greater than players.max');
      need(
        !g.players.best || (g.players.best >= g.players.min && g.players.best <= g.players.max),
        'players.best sits outside the supported range'
      );
    }

    // The honesty columns
    need(DURATION.test(String(g.playtime_box || '')), 'playtime_box must look like 30m or 1.5h');
    need(DURATION.test(String(g.playtime_actual || '')), 'playtime_actual must look like 45m or 2h');
    need(DURATION.test(String(g.teach_time || '')), 'teach_time must look like 90s, 3m or 1h');
    need(
      typeof g.weight === 'number' && g.weight >= 1 && g.weight <= 5,
      'weight must be a number from 1 (trivial) to 5 (brain-melting)'
    );
    need(
      typeof g.luck === 'number' && g.luck >= 0 && g.luck <= 100,
      'luck must be 0 (pure skill) to 100 (pure chance)'
    );

    need(Array.isArray(g.components) && g.components.length, 'components must list what is in the box');
    need(g.objective, 'missing "objective" — one sentence on what winning looks like');
    need(Array.isArray(g.turn_structure) && g.turn_structure.length, 'turn_structure must have at least one step');
    need(g.win_condition, 'missing "win_condition"');

    // Setup by player count — the most-searched fact about most games
    need(
      Array.isArray(g.setup_by_players) && g.setup_by_players.length,
      'setup_by_players is required — "how many cards for five?" is the question people arrive with'
    );
    for (const [i, s] of (g.setup_by_players || []).entries()) {
      need(s.players, `setup_by_players[${i}] needs a "players" range like "2" or "3-6"`);
      need(s.setup, `setup_by_players[${i}] needs "setup" describing what changes`);
    }

    // Missing pieces is the most common reason a game does not get played
    need(g.substitutions, 'missing "substitutions" — what to do when a piece is lost');
    need(g.accessibility, 'missing "accessibility" — colour, print size, dexterity');

    need(g.hasRules, 'missing rules.md');
    need(g.hasTeach, 'missing teach.md — how to explain this to someone who has never played');

    // Rulings
    for (const [i, r] of (g.rulings || []).entries()) {
      const rat = `${at}/rulings.yml[${i}]`;
      if (!r.id) errs.push(`${rat}: missing "id"`);
      if (!r.question) errs.push(`${rat}: missing "question"`);
      if (!KINDS[r.kind]) errs.push(`${rat}: kind must be one of ${Object.keys(KINDS).join(', ')}`);
      if (typeof r.official !== 'boolean') errs.push(`${rat}: "official" must be true or false`);
      if (!PREVALENCE[r.prevalence]) {
        errs.push(`${rat}: prevalence must be one of ${Object.keys(PREVALENCE).join(', ')}`);
      }
      if (!r.verdict) errs.push(`${rat}: missing "verdict" — the answer to read out at the table`);
      if (!Array.isArray(r.asked_as) || !r.asked_as.length) {
        errs.push(`${rat}: "asked_as" needs the phrasings people actually use, or search will not find it`);
      }
      // A house rule with no description of the house version is half an entry.
      if (r.kind === 'house-rule' && !r.house_rule) {
        errs.push(`${rat}: a house-rule entry must describe the house version in "house_rule"`);
      }
    }
  }
  return errs;
}

export const fmtDuration = (d) => {
  const m = String(d).match(/^(\d+(?:\.\d+)?)(s|m|h)$/);
  if (!m) return String(d);
  return { s: `${m[1]} sec`, m: `${m[1]} min`, h: `${m[1]} hr` }[m[2]];
};

export const minutes = (d) => {
  const m = String(d).match(/^(\d+(?:\.\d+)?)(s|m|h)$/);
  if (!m) return Infinity;
  const n = Number(m[1]);
  return { s: n / 60, m: n, h: n * 60 }[m[2]];
};
