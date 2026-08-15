// What the numbers on the hexes actually mean.
export const title = 'Two-dice probability, and what a number token is worth';
export function rows() {
  const ways = {};
  for (let a = 1; a <= 6; a++) for (let b = 1; b <= 6; b++) ways[a + b] = (ways[a + b] || 0) + 1;
  return Object.entries(ways)
    .filter(([n]) => +n !== 7)
    .map(([n, w]) => ({
      label: `Number ${n}`,
      pct: (w / 36) * 100,
      note: `${w} of 36 rolls · ${'●'.repeat(w > 3 ? 6 - Math.abs(7 - +n) : w)} pips on the token`,
    }))
    .sort((a, b) => b.pct - a.pct);
}
export const notes = [
  'A 7 comes up on 6 of 36 rolls — more often than any resource number, which is why the robber dominates the early game.',
  'A settlement on 6, 8 and 5 collects on 16 of 36 rolls. One on 3, 11 and 12 collects on 6.',
  'The pips printed under each number are the probability. Counting pips rather than numbers is the single fastest way to improve.',
];
