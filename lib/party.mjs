// The party half of rulebook: the dispute tracker, the quiz, the evening
// planner and the turn timer.
//
// These all read the same registry as everything else. None of them needs new
// game data, which is the point — the interesting content was already there,
// it just had no way of reaching the table.

import { load, fmtDuration, minutes, PREVALENCE } from './registry.mjs';
import { read, update, tally, storePath } from './store.mjs';

// ---------------------------------------------------------------------------
// ref — who is actually right, over time
// ---------------------------------------------------------------------------
export function logDispute({ game, ruling, called, right, note }) {
  return update((d) => {
    d.disputes.push({
      at: new Date().toISOString().slice(0, 10),
      game,
      ruling,
      called,
      right: Boolean(right),
      note: note || null,
    });
    return d;
  });
}

export function record() {
  const d = read();
  return {
    disputes: d.disputes,
    table: tally(d.disputes),
    quizTable: tally(d.quiz, 'player', 'correct'),
    path: storePath(),
  };
}

// ---------------------------------------------------------------------------
// quiz — official rule, or something everybody made up?
// ---------------------------------------------------------------------------

// Deterministic shuffle, seeded, because Math.random makes a quiz impossible
// to reproduce when somebody disputes a question afterwards.
export function shuffled(list, seed) {
  const out = [...list];
  let s = seed >>> 0 || 1;
  const next = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(next() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export function quizQuestions(count = 10, seed = 1) {
  const games = load();
  const all = games.flatMap((g) => g.rulings.map((r) => ({ ...r, game: g })));

  // A quiz made only of near-universal house rules would be a trick quiz. Mix
  // genuinely official rules in at roughly the rate they occur.
  const house = shuffled(all.filter((r) => !r.official), seed);
  const official = shuffled(all.filter((r) => r.official), seed + 7);

  const wantHouse = Math.min(house.length, Math.round(count * 0.5));
  const picked = [...house.slice(0, wantHouse), ...official.slice(0, count - wantHouse)];

  return shuffled(picked, seed + 13).slice(0, count).map((r) => ({
    game: r.game.name,
    question: r.question,
    answer: r.official,
    verdict: r.verdict,
    prevalence: r.prevalence,
    prevalenceText: PREVALENCE[r.prevalence],
    id: `${r.game.slug}/${r.id}`,
  }));
}

export function logQuiz(player, correct, total) {
  return update((d) => {
    d.quiz.push({ at: new Date().toISOString().slice(0, 10), player, correct, total });
    return d;
  });
}

// A title for how well you did, because a bare number is not a party.
export function rank(pct) {
  if (pct >= 90) return 'Rules Lawyer, First Class';
  if (pct >= 75) return 'Reads The Rulebook';
  if (pct >= 60) return 'Reliable At The Table';
  if (pct >= 40) return 'Confidently Wrong';
  if (pct >= 20) return 'Has Been Playing It Wrong For Years';
  return 'Making It Up Entirely';
}

// ---------------------------------------------------------------------------
// night — plan the actual evening
// ---------------------------------------------------------------------------

// An evening has a shape: something short while people arrive and take their
// coats off, the main event once everyone is present and sober, and something
// light at the end when concentration has gone. Picking three good games is
// easy; picking three that fit together and fit the clock is the useful part.
export function planNight({ people, hours = 3, kids = null, avoid = [] }) {
  const games = load().filter(
    (g) =>
      people >= g.players.min &&
      people <= g.players.max &&
      (!kids || g.min_age <= kids) &&
      !avoid.includes(g.slug)
  );
  if (!games.length) return { slots: [], games: [], total: 0 };

  const budget = hours * 60;
  // Teaching costs real time and people forget it. Count it.
  const cost = (g) => minutes(g.playtime_actual) + minutes(g.teach_time);

  const pick = (pool, want, used) => {
    const free = pool.filter((g) => !used.has(g.slug));
    if (!free.length) return null;
    return free.sort((a, b) => Math.abs(cost(a) - want) - Math.abs(cost(b) - want))[0];
  };

  const used = new Set();
  const slots = [];

  // Opener: light, quick, high player count, forgiving of latecomers.
  const opener = pick(games.filter((g) => g.weight <= 2 && minutes(g.playtime_actual) <= 30), 25, used);
  if (opener) {
    used.add(opener.slug);
    slots.push({ role: 'Opener', why: 'light and short, so latecomers miss nothing', game: opener });
  }

  // Main: the heaviest thing that still fits the remaining time.
  const spent = slots.reduce((a, s) => a + cost(s.game), 0);
  const remaining = budget - spent;
  const mainPool = games
    .filter((g) => !used.has(g.slug) && cost(g) <= remaining - 25)
    .sort((a, b) => b.weight - a.weight);
  const main = mainPool[0];
  if (main) {
    used.add(main.slug);
    slots.push({ role: 'Main event', why: 'the heaviest game the evening has room for', game: main });
  }

  // Closer: short and light. Only if it genuinely fits — an evening plan that
  // overruns its own budget is worse than one with two entries.
  const left = budget - slots.reduce((a, s) => a + cost(s.game), 0);
  const closer = pick(
    games.filter((g) => !used.has(g.slug) && g.weight <= 2 && cost(g) <= left),
    Math.min(left, 30),
    used
  );
  if (closer) {
    used.add(closer.slug);
    slots.push({ role: 'Closer', why: 'nobody can think straight by now', game: closer });
  }

  return {
    slots,
    total: slots.reduce((a, s) => a + cost(s.game), 0),
    budget,
    candidates: games.length,
  };
}

// ---------------------------------------------------------------------------
// hottest — which rules cause the most arguments
// ---------------------------------------------------------------------------
export function hottest(limit = 12) {
  return load()
    .flatMap((g) => g.rulings.map((r) => ({ ...r, game: g })))
    .sort((a, b) => b.heat - a.heat || a.game.name.localeCompare(b.game.name))
    .slice(0, limit);
}

export { fmtDuration, minutes };
