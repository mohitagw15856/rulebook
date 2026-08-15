// Shared card parsing for the scoring modules.
//
// Cards are written the way people say them out loud: rank then suit, so "As"
// is the ace of spades and "10h" or "Th" is the ten of hearts.

export const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A'];
export const SUITS = { s: 'spades', h: 'hearts', d: 'diamonds', c: 'clubs' };

const RANK_ALIASES = { '10': 'T', '1': 'A' };

export function parseCard(text) {
  const t = String(text).trim();
  const m = t.match(/^(10|[2-9TJQKA])\s*([shdc])$/i);
  if (!m) throw new Error(`cannot read card "${t}" — write rank then suit, like As, Kh, 10d, 7c`);
  const rank = RANK_ALIASES[m[1].toUpperCase()] || m[1].toUpperCase();
  return { rank, suit: m[2].toLowerCase(), value: RANKS.indexOf(rank) + 2, label: rank + m[2].toLowerCase() };
}

export function parseHand(text) {
  const parts = String(text).trim().split(/[\s,]+/).filter(Boolean);
  const cards = parts.map(parseCard);
  const seen = new Set();
  for (const c of cards) {
    if (seen.has(c.label)) throw new Error(`"${c.label}" appears twice — a hand cannot hold duplicate cards`);
    seen.add(c.label);
  }
  return cards;
}

// Rummy-style deadwood values: face cards 10, ace 1, everything else pips.
export function deadwoodValue(card) {
  if (card.rank === 'A') return 1;
  if (['T', 'J', 'Q', 'K'].includes(card.rank)) return 10;
  return card.value;
}

export const bySuit = (cards) => {
  const out = {};
  for (const c of cards) (out[c.suit] ||= []).push(c);
  return out;
};

export const byRank = (cards) => {
  const out = {};
  for (const c of cards) (out[c.rank] ||= []).push(c);
  return out;
};
