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
  social: 'Social deduction',
  dice: 'Dice games',
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

// Where a rule came from and how somebody learned it. Rules travel through
// families and clubs far more than through countries, which is why "where did
// you learn it" is a better question than "where are you from".
export const LEARNED_FROM = {
  family: 'Learned at home',
  friends: 'Learned from a group of friends',
  club: 'Learned at a club or society',
  online: 'Learned from the internet',
  published: 'Read it in the actual rulebook',
};

export const KINDS = {
  'house-rule': 'Not in the published rules, but widely played',
  clarification: 'Genuinely official, and routinely played wrong',
};

// Seconds are allowed because a good teach time really can be under a minute.
const DURATION = /^\d+(\.\d+)?(s|m|h)$/;

// How much of an argument a ruling actually causes, derived rather than
// recorded. A house rule that almost everyone plays is the hottest thing in
// the registry: both sides are certain, and the person who is "obviously
// wrong" is right. Nobody has to guess a number into a YAML file.
const PREVALENCE_HEAT = { 'near-universal': 2, common: 1.4, regional: 1, rare: 0.4 };
export const heat = (r) => Math.round((r.official ? 1 : 2.5) * PREVALENCE_HEAT[r.prevalence] * 10) / 10;

// Translations are parallel files, and anything missing falls back to English
// rather than failing — a half-finished language is still useful, and demanding
// completeness before merging is how translations never land.
export function load(lang = null) {
  const pick = (dir, base, ext) => {
    if (lang) {
      const localised = join(dir, `${base}.${lang}.${ext}`);
      if (existsSync(localised)) return localised;
    }
    return join(dir, `${base}.${ext}`);
  };
  return readdirSync(DIR)
    .filter((f) => statSync(join(DIR, f)).isDirectory())
    .sort()
    .map((slug) => {
      const dir = join(DIR, slug);
      // A folder with no game.yml is a contributor mid-flight, not a crash.
      if (!existsSync(join(dir, 'game.yml'))) {
        return { slug, __dir: `games/${slug}`, __missing: true, rulings: [] };
      }
      const g = parseYaml(readFileSync(join(dir, 'game.yml'), 'utf8'));
      // A localised game.yml carries only the prose fields; everything factual
      // is inherited from the English file so the two can never diverge.
      if (lang && existsSync(join(dir, `game.${lang}.yml`))) {
        Object.assign(g, parseYaml(readFileSync(join(dir, `game.${lang}.yml`), 'utf8')));
        g.__lang = lang;
      }
      g.slug = slug;
      g.__dir = `games/${slug}`;
      // Rulings merge by id rather than replace wholesale. A translation with
      // three of seven rulings should give you three translated and four in
      // English, not four missing entries.
      const englishRulings = existsSync(join(dir, 'rulings.yml'))
        ? parseYaml(readFileSync(join(dir, 'rulings.yml'), 'utf8')).rulings || []
        : [];
      let translated = [];
      if (lang && existsSync(join(dir, `rulings.${lang}.yml`))) {
        translated = parseYaml(readFileSync(join(dir, `rulings.${lang}.yml`), 'utf8')).rulings || [];
      }
      const byId = new Map(translated.map((r) => [r.id, r]));
      g.rulings = englishRulings.map((r) => (byId.has(r.id) ? { ...r, ...byId.get(r.id), __lang: lang } : r));
      // A translated ruling with no English counterpart is a mistake worth
      // surfacing rather than silently dropping.
      for (const r of translated) {
        if (!englishRulings.some((e) => e.id === r.id)) g.rulings.push({ ...r, __orphan: true });
      }
      g.__rulesFile = pick(dir, 'rules', 'md');
      g.__teachFile = pick(dir, 'teach', 'md');
      g.hasRules = existsSync(g.__rulesFile);
      g.hasTeach = existsSync(g.__teachFile);
      g.hasScore = existsSync(join(dir, 'score.mjs'));
      g.hasOdds = existsSync(join(dir, 'odds.mjs'));
      for (const r of g.rulings) r.heat = heat(r);
      return g;
    });
}

// A game whose facts nobody has checked against a source in over a year is
// not wrong, but it is unverified, and the difference should be visible.
export const STALE_AFTER_DAYS = 365;

export function verificationAge(g, today = new Date()) {
  if (!g.verified || !g.verified.on) return null;
  const then = new Date(g.verified.on);
  if (Number.isNaN(then.getTime())) return null;
  return Math.floor((today - then) / 86400000);
}

export function isStale(g, today = new Date()) {
  const age = verificationAge(g, today);
  return age === null || age > STALE_AFTER_DAYS;
}

export function validate(games) {
  const errs = [];
  const seen = new Set();

  for (const g of games) {
    const at = g.__dir;
    if (g.__missing) {
      errs.push(`${at}: no game.yml. Every game folder needs one — copy the closest existing game and edit it.`);
      continue;
    }
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

    // Downtime is the honest measure of whether a game is fun to sit through.
    // It is the reason Monopoly is hated and Codenames is not.
    need(DURATION.test(String(g.downtime || '')), 'downtime must look like 30s or 4m — how long between your turns');
    need(
      Number.isInteger(g.min_age) && g.min_age >= 3 && g.min_age <= 18,
      'min_age must be the age this genuinely works at, not the age on the box'
    );
    need(g.concession, 'missing "concession" — when it is fair to end this game early');

    // Setup and teardown are real friction that no box prints. A twenty-minute
    // setup quietly ruins a thirty-minute game.
    if (g.setup_time !== undefined) {
      need(DURATION.test(String(g.setup_time)), 'setup_time must look like 90s or 5m');
    }
    if (g.teardown_time !== undefined) {
      need(DURATION.test(String(g.teardown_time)), 'teardown_time must look like 60s or 4m');
    }

    // The verification block is the answer to "who checked this, and when?".
    if (g.verified !== null && g.verified !== undefined) {
      need(g.verified.on, 'verified.on must be a date like 2026-08-16');
      need(
        !g.verified.on || /^\d{4}-\d{2}-\d{2}$/.test(String(g.verified.on)),
        `verified.on "${g.verified?.on}" must be YYYY-MM-DD`
      );
      need(g.verified.by, 'verified.by must say who checked it');
      need(
        Array.isArray(g.verified.checked) && g.verified.checked.length,
        'verified.checked must list what was checked against the source'
      );
    }

    for (const [i, c] of (g.cheats || []).entries()) {
      need(c.move, `cheats[${i}] needs "move" — what people actually do`);
      need(c.spot, `cheats[${i}] needs "spot" — how to catch it`);
    }
    for (const [i, h] of (g.handicaps || []).entries()) {
      need(h.for, `handicaps[${i}] needs "for" — who it levels the game for`);
      need(h.method, `handicaps[${i}] needs "method"`);
    }
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

    for (const [i, v] of (g.variants || []).entries()) {
      need(v.name, `variants[${i}] needs a "name"`);
      need(v.changed, `variants[${i}] needs "changed" describing what is different`);
    }

    need(g.hasRules, 'missing rules.md');
    need(g.hasTeach, 'missing teach.md — how to explain this to someone who has never played');

    // Rulings
    for (const [i, r] of (g.rulings || []).entries()) {
      const rat = `${at}/rulings.yml[${i}]`;
      if (r.__orphan) {
        errs.push(`${rat}: translated ruling "${r.id}" has no English original — add it to rulings.yml first`);
      }
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

      // Two sources are allowed to contradict each other. Recording the
      // disagreement is more honest than quietly picking a winner.
      for (const [j, src] of (r.sources || []).entries()) {
        if (!src.url) errs.push(`${rat}: sources[${j}] needs a "url"`);
        if (!src.says) errs.push(`${rat}: sources[${j}] needs "says" — what that source actually claims`);
        if (typeof src.agrees !== 'boolean') {
          errs.push(`${rat}: sources[${j}].agrees must be true or false — does it support the verdict?`);
        }
      }
      if ((r.sources || []).length && !r.sources.some((x) => x.agrees)) {
        errs.push(`${rat}: every source disagrees with the verdict. Either the verdict is wrong or a supporting source is missing.`);
      }

      for (const id of r.interacts_with || []) {
        if (!/^[a-z0-9-]+\/[a-z0-9-]+$/.test(String(id))) {
          errs.push(`${rat}: interacts_with "${id}" must look like game-slug/ruling-id`);
        }
      }
    }
  }
  // Second pass: cross-references can only be checked once every game is known.
  const allIds = new Set(games.flatMap((g) => (g.rulings || []).map((r) => `${g.slug}/${r.id}`)));
  for (const g of games) {
    for (const r of g.rulings || []) {
      for (const id of r.interacts_with || []) {
        if (!allIds.has(String(id))) {
          errs.push(`${g.__dir}/rulings.yml#${r.id}: interacts_with "${id}" does not exist`);
        }
        if (String(id) === `${g.slug}/${r.id}`) {
          errs.push(`${g.__dir}/rulings.yml#${r.id}: interacts_with points at itself`);
        }
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
