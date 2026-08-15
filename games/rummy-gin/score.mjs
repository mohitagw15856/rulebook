// Works out the melds in a Gin Rummy hand and reports the deadwood left over.
//
// Finding the *best* arrangement matters: the same ten cards can often be
// grouped several ways, and the one with the lowest deadwood is the one that
// decides whether you may knock.

import { parseHand, deadwoodValue, byRank, bySuit } from '../../lib/cards.mjs';

export const usage = 'rulebook score gin "<cards>"';
export const examples = [
  'rulebook score gin "As 2s 3s 7h 7d 7c Kh Qd 4c 9s"',
  'rulebook score gin "4c 5c 6c 7c 9h 9d 9s Kh Kd Ks"',
];

// Every set (3-4 of a rank) and run (3+ in suit) that the hand contains.
function candidateMelds(cards) {
  const melds = [];

  for (const [, group] of Object.entries(byRank(cards))) {
    if (group.length >= 3) {
      melds.push(group.slice(0, 3));
      if (group.length >= 4) melds.push(group.slice());
      // With four of a rank, any three of them is also a legal set.
      if (group.length === 4) {
        for (let skip = 0; skip < 4; skip++) melds.push(group.filter((_, i) => i !== skip));
      }
    }
  }

  // In rummy the ace is low: A-2-3 is a run, Q-K-A is not. The shared card
  // values put the ace at 14 for poker's sake, so it gets remapped here.
  const runValue = (c) => (c.rank === 'A' ? 1 : c.value);

  for (const [, group] of Object.entries(bySuit(cards))) {
    const sorted = [...group].sort((a, b) => runValue(a) - runValue(b));
    for (let i = 0; i < sorted.length; i++) {
      let run = [sorted[i]];
      for (let j = i + 1; j < sorted.length; j++) {
        if (runValue(sorted[j]) === runValue(run[run.length - 1]) + 1) {
          run.push(sorted[j]);
          if (run.length >= 3) melds.push(run.slice());
        } else break;
      }
    }
  }
  return melds;
}

// Exhaustive over meld combinations, which is tractable because a ten-card hand
// never has many candidates. Returns the arrangement with the least deadwood.
export function analyse(cards) {
  const melds = candidateMelds(cards);
  let best = { melds: [], deadwood: cards, total: cards.reduce((a, c) => a + deadwoodValue(c), 0) };

  const search = (i, used, chosen) => {
    if (i === melds.length) {
      const left = cards.filter((c) => !used.has(c.label));
      const total = left.reduce((a, c) => a + deadwoodValue(c), 0);
      if (total < best.total) best = { melds: chosen.slice(), deadwood: left, total };
      return;
    }
    search(i + 1, used, chosen);
    const m = melds[i];
    if (m.every((c) => !used.has(c.label))) {
      const next = new Set(used);
      for (const c of m) next.add(c.label);
      chosen.push(m);
      search(i + 1, next, chosen);
      chosen.pop();
    }
  };
  search(0, new Set(), []);
  return best;
}

export function run(args) {
  const cards = parseHand(args.join(' '));
  const { melds, deadwood, total } = analyse(cards);
  const out = [];

  if (melds.length) {
    out.push('Melds:');
    for (const m of melds) out.push('  ' + m.map((c) => c.label).join(' '));
  } else {
    out.push('No melds.');
  }

  out.push('');
  out.push(
    deadwood.length
      ? `Deadwood: ${deadwood.map((c) => c.label).join(' ')} = ${total}`
      : 'Deadwood: none'
  );
  out.push('');

  if (total === 0 && cards.length >= 10) out.push('That is gin — every card is melded. Bonus of 25 on top of their deadwood.');
  else if (total <= 10) out.push(`You may knock: ${total} is within the limit of 10.`);
  else out.push(`You may not knock: ${total} is above the limit of 10. You need to shed ${total - 10} more.`);

  return out;
}
