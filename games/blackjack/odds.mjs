// The only game here where the correct play is a solved question.
export const title = 'Dealer outcomes and the cost of getting it wrong';
export function rows() {
  return [
    { label: 'Dealer busts showing 6', pct: 42.0, note: 'their worst card — stand on anything reasonable' },
    { label: 'Dealer busts showing 5', pct: 41.8, note: 'almost as bad for them' },
    { label: 'Dealer busts showing 4', pct: 40.3, note: '' },
    { label: 'Dealer busts showing 2', pct: 35.4, note: '' },
    { label: 'Dealer busts showing 10', pct: 21.2, note: 'you need a real hand' },
    { label: 'Dealer busts showing an ace', pct: 11.5, note: 'their strongest card by a distance' },
    { label: 'You are dealt a natural blackjack', pct: 4.8, note: 'roughly one hand in twenty-one' },
  ];
}
export const notes = [
  'House edge with perfect basic strategy is about 0.5%. Playing on instinct instead costs roughly 2% — four times as much.',
  'Never take insurance. It is a side bet on the dealer having a ten, and it pays 2:1 on an event that happens under a third of the time.',
  'Always split aces and eights. Never split tens or fives. Those four rules alone recover most of the gap between guessing and basic strategy.',
];
