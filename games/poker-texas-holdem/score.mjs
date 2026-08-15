// Evaluates a poker hand: give it five to seven cards and it names the best
// five-card hand available, with the kickers that decide ties.
//
// This exists because "who wins?" at a showdown is the single most common
// argument in the game, and the answer is mechanical.

import { parseHand, RANKS } from '../../lib/cards.mjs';

export const usage = 'rulebook score poker "<5-7 cards>" [vs "<5-7 cards>"]';
export const examples = [
  'rulebook score poker "As Ks Qs Js Ts"',
  'rulebook score poker "Ah Ad Kc Kh 2s" vs "Qs Qh Qd 7c 3d"',
];

const CATEGORIES = [
  'High card',
  'One pair',
  'Two pair',
  'Three of a kind',
  'Straight',
  'Flush',
  'Full house',
  'Four of a kind',
  'Straight flush',
];

const RANK_NAMES = {
  A: 'ace', K: 'king', Q: 'queen', J: 'jack', T: 'ten',
  9: 'nine', 8: 'eight', 7: 'seven', 6: 'six', 5: 'five', 4: 'four', 3: 'three', 2: 'two',
};
const plural = (r) => (r === '6' ? 'sixes' : RANK_NAMES[r] + 's');

// Returns the highest straight's top value, honouring the wheel (A-2-3-4-5),
// where the ace plays low and the straight is five-high.
function straightHigh(values) {
  const uniq = [...new Set(values)].sort((a, b) => b - a);
  // Ace also counts as 1 for the wheel.
  if (uniq.includes(14)) uniq.push(1);
  let run = 1;
  for (let i = 1; i < uniq.length; i++) {
    if (uniq[i] === uniq[i - 1] - 1) {
      run++;
      if (run >= 5) return uniq[i] + 4;
    } else {
      run = 1;
    }
  }
  return 0;
}

// Score is [category, ...tiebreakers] compared left to right — exactly how a
// real showdown is resolved.
export function evaluate(cards) {
  if (cards.length < 5 || cards.length > 7) {
    throw new Error(`a poker hand is 5 to 7 cards, got ${cards.length}`);
  }
  const counts = {};
  const suits = {};
  for (const c of cards) {
    counts[c.rank] = (counts[c.rank] || 0) + 1;
    (suits[c.suit] ||= []).push(c);
  }

  const flushSuit = Object.keys(suits).find((s) => suits[s].length >= 5);
  const values = cards.map((c) => c.value);

  if (flushSuit) {
    const fv = suits[flushSuit].map((c) => c.value);
    const sfHigh = straightHigh(fv);
    if (sfHigh) {
      return { rank: [8, sfHigh], name: sfHigh === 14 ? 'Royal flush' : 'Straight flush', detail: `${RANK_NAMES[RANKS[sfHigh - 2]]}-high` };
    }
  }

  // Group ranks by how many of each, then by rank value.
  const groups = Object.entries(counts)
    .map(([rank, n]) => ({ rank, n, v: RANKS.indexOf(rank) + 2 }))
    .sort((a, b) => b.n - a.n || b.v - a.v);

  const kickers = (exclude, take) =>
    values
      .filter((v) => !exclude.includes(v))
      .sort((a, b) => b - a)
      .slice(0, take);

  if (groups[0].n === 4) {
    return { rank: [7, groups[0].v, ...kickers([groups[0].v], 1)], name: 'Four of a kind', detail: plural(groups[0].rank) };
  }
  if (groups[0].n === 3 && groups[1]?.n >= 2) {
    return { rank: [6, groups[0].v, groups[1].v], name: 'Full house', detail: `${plural(groups[0].rank)} full of ${plural(groups[1].rank)}` };
  }
  if (flushSuit) {
    const top = suits[flushSuit].map((c) => c.value).sort((a, b) => b - a).slice(0, 5);
    return { rank: [5, ...top], name: 'Flush', detail: `${RANK_NAMES[RANKS[top[0] - 2]]}-high` };
  }
  const sHigh = straightHigh(values);
  if (sHigh) {
    return { rank: [4, sHigh], name: 'Straight', detail: sHigh === 5 ? 'five-high (the wheel)' : `${RANK_NAMES[RANKS[sHigh - 2]]}-high` };
  }
  if (groups[0].n === 3) {
    return { rank: [3, groups[0].v, ...kickers([groups[0].v], 2)], name: 'Three of a kind', detail: plural(groups[0].rank) };
  }
  if (groups[0].n === 2 && groups[1]?.n === 2) {
    const [hi, lo] = [groups[0].v, groups[1].v].sort((a, b) => b - a);
    return { rank: [2, hi, lo, ...kickers([hi, lo], 1)], name: 'Two pair', detail: `${plural(RANKS[hi - 2])} and ${plural(RANKS[lo - 2])}` };
  }
  if (groups[0].n === 2) {
    return { rank: [1, groups[0].v, ...kickers([groups[0].v], 3)], name: 'One pair', detail: plural(groups[0].rank) };
  }
  const top = [...values].sort((a, b) => b - a).slice(0, 5);
  return { rank: [0, ...top], name: 'High card', detail: `${RANK_NAMES[RANKS[top[0] - 2]]}-high` };
}

export function compare(a, b) {
  for (let i = 0; i < Math.max(a.rank.length, b.rank.length); i++) {
    const d = (a.rank[i] ?? 0) - (b.rank[i] ?? 0);
    if (d !== 0) return d > 0 ? 1 : -1;
  }
  return 0;
}

export function run(args) {
  const vs = args.findIndex((a) => a.toLowerCase() === 'vs');
  if (vs === -1) {
    const hand = evaluate(parseHand(args.join(' ')));
    return [`${hand.name} — ${hand.detail}`];
  }
  const a = evaluate(parseHand(args.slice(0, vs).join(' ')));
  const b = evaluate(parseHand(args.slice(vs + 1).join(' ')));
  const c = compare(a, b);
  return [
    `Hand 1: ${a.name} — ${a.detail}`,
    `Hand 2: ${b.name} — ${b.detail}`,
    '',
    c === 0
      ? 'Split pot. The hands are identical in rank, and suits never break ties in Hold\'em.'
      : `Hand ${c > 0 ? 1 : 2} wins.`,
  ];
}

export { CATEGORIES };
