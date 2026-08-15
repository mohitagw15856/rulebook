// The handful of numbers that decide most hands, and that most players guess.
export const title = 'Hold\'em probabilities worth knowing';
export function rows() {
  return [
    { label: 'Flush draw completes by the river', pct: 35.0, note: 'nine outs, two cards to come' },
    { label: 'Open-ended straight draw completes', pct: 31.5, note: 'eight outs' },
    { label: 'You are dealt a pocket pair', pct: 5.9, note: 'about one hand in seventeen' },
    { label: 'You flop a set holding a pocket pair', pct: 11.8, note: 'roughly one time in eight' },
    { label: 'You are dealt pocket aces', pct: 0.45, note: 'one hand in 221' },
    { label: 'Flopping a flush with suited cards', pct: 0.84, note: 'suited hands are worth less than people think' },
    { label: 'Overpair holds against one opponent to showdown', pct: 80.0, note: 'approximate, against a random hand' },
  ];
}
export const notes = [
  'The rule of four and two: multiply your outs by four on the flop for both cards to come, or by two for a single card. Nine outs is roughly 36% then 18%.',
  'Suited cards gain only about 2% in equity over the same cards offsuit. They are worth playing, not worth overplaying.',
  'A pocket pair flops a set about one time in eight, which is why small pairs need cheap flops rather than raised pots.',
];
