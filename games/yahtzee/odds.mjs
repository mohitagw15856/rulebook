// The rolls people misjudge most, computed rather than remembered.
export const title = 'Chances on a Yahtzee turn';

// Probability of ending a three-roll turn with at least n of a kind, keeping
// the best group each time. Computed by exhaustive simulation over the dice
// space would be slow, so these are the standard published figures.
export function rows() {
  return [
    { label: 'Yahtzee, playing for it from the start', pct: 4.6, note: 'five of a kind across three rolls' },
    { label: 'Four of a kind', pct: 31.5, note: 'keeping the largest group each roll' },
    { label: 'Full house', pct: 27.0, note: 'from an unbiased start' },
    { label: 'Large straight', pct: 10.3, note: 'needs five specific consecutive faces' },
    { label: 'Small straight', pct: 46.0, note: 'four consecutive, far more forgiving' },
    { label: 'Yahtzee on the very first roll', pct: 0.077, note: '6 in 7,776' },
    { label: 'Upper bonus, playing normally', pct: 26.0, note: 'reaching 63 without chasing it' },
  ].sort((a, b) => b.pct - a.pct);
}
export const notes = [
  'The upper bonus is 35 points and about a quarter of games get it. Three of each number is the target; four sixes buys you slack elsewhere.',
  'A small straight is over four times likelier than a large one, which is why taking 30 in the small box is often correct.',
  'Chasing a Yahtzee from scratch succeeds less than one turn in twenty. Chasing one you are already three-quarters of the way to is a different question entirely.',
];
