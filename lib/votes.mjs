// Turning prevalence from an assertion into a measurement.
//
// Every `prevalence` in the registry is a judgement — mine, or a
// contributor's. This module reads the votes people have actually submitted
// and reports what they say, how many there are, and whether they contradict
// the asserted value.
//
// The important behaviour is the empty case. With no votes, this reports
// "asserted, not measured" rather than quietly showing 0%.

import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { parseYaml } from './yaml.mjs';

const FILE = fileURLToPath(new URL('../data/votes.yml', import.meta.url));

export const LEARNED_FROM = ['family', 'friends', 'club', 'online', 'published'];

export function loadVotes() {
  if (!existsSync(FILE)) return [];
  const raw = parseYaml(readFileSync(FILE, 'utf8'));
  return (raw.votes || []).filter((v) => v && v.ruling);
}

export function validateVotes(votes) {
  const errs = [];
  votes.forEach((v, i) => {
    const at = `data/votes.yml[${i}]`;
    if (!/^[a-z0-9-]+\/[a-z0-9-]+$/.test(String(v.ruling || ''))) {
      errs.push(`${at}: "ruling" must look like game-slug/ruling-id`);
    }
    if (typeof v.plays !== 'boolean') errs.push(`${at}: "plays" must be yes or no`);
    if (v.learned_from && !LEARNED_FROM.includes(v.learned_from)) {
      errs.push(`${at}: learned_from must be one of ${LEARNED_FROM.join(', ')}`);
    }
    if (v.decade && !/^\d{4}s$/.test(String(v.decade))) {
      errs.push(`${at}: decade should look like 1990s`);
    }
  });
  return errs;
}

// What the votes say about one ruling. Returns null when nobody has voted,
// which is a different statement from "nobody plays it".
export function measure(votes, rulingKey) {
  const mine = votes.filter((v) => v.ruling === rulingKey);
  if (!mine.length) return null;

  const plays = mine.filter((v) => v.plays).length;
  const n = mine.length;
  const pct = Math.round((plays / n) * 100);

  // A margin of error, so a single vote is never displayed as 100% of anything.
  // Normal approximation at ~95%, which is rough at small n and clamped so it
  // never claims more precision than it has.
  const p = plays / n;
  const margin = Math.min(50, Math.round(196 * Math.sqrt((p * (1 - p)) / n)) || (n < 5 ? 50 : 10));

  const byRegion = {};
  const byLearned = {};
  for (const v of mine) {
    if (v.region) {
      byRegion[v.region] ||= { plays: 0, n: 0 };
      byRegion[v.region].n++;
      if (v.plays) byRegion[v.region].plays++;
    }
    if (v.learned_from) byLearned[v.learned_from] = (byLearned[v.learned_from] || 0) + 1;
  }

  return { n, plays, pct, margin, byRegion, byLearned, confident: n >= 20 };
}

// The prevalence band a measurement implies, for comparison with the asserted
// value. Deliberately coarse — the bands are wide and the votes are few.
export function impliedPrevalence(m) {
  if (!m || m.n < 5) return null;
  if (m.pct >= 85) return 'near-universal';
  if (m.pct >= 45) return 'common';
  if (m.pct >= 15) return 'regional';
  return 'rare';
}

// Rulings where the votes and the asserted prevalence point different ways.
// These are the entries most worth a human looking at.
export function disagreements(games, votes) {
  const out = [];
  for (const g of games) {
    for (const r of g.rulings) {
      const key = `${g.slug}/${r.id}`;
      const m = measure(votes, key);
      const implied = impliedPrevalence(m);
      if (implied && implied !== r.prevalence) {
        out.push({ game: g, ruling: r, key, measured: m, implied });
      }
    }
  }
  return out;
}
