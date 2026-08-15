// Backgammon is a game of exact numbers, and most players guess them.
export const title = 'Chance of being hit at a given distance';
export function rows() {
  // Count the 36 ordered dice outcomes that can reach exactly n pips, allowing
  // combinations and doubles, ignoring blocked intermediate points.
  const hits = {};
  for (let a = 1; a <= 6; a++) {
    for (let b = 1; b <= 6; b++) {
      const reach = new Set([a, b, a + b]);
      if (a === b) { reach.add(a * 3); reach.add(a * 4); }
      for (const n of reach) hits[n] = (hits[n] || 0) + 1;
    }
  }
  return Object.entries(hits)
    .filter(([n]) => +n <= 12)
    .map(([n, w]) => ({ label: `Blot ${n} pips away`, pct: (w / 36) * 100, note: `${w} of 36 rolls` }))
    .sort((a, b) => b.pct - a.pct);
}
export const notes = [
  'Six away is the most dangerous single distance at direct-shot range, because 6-anything and several combinations all reach it.',
  'Anything beyond six can only be hit by a combination, which is why stepping seven or more away is so much safer than six.',
  'These figures ignore blocked intermediate points. A made point in the way removes the combination shots and can halve the real risk.',
];
