// Totals the cards left in a hand at the end of an Uno round — the number the
// player who went out actually scores.

export const usage = 'rulebook score uno "<cards>"';
export const examples = ['rulebook score uno "9 5 skip wild"', 'rulebook score uno "0 7 draw2 wild4"'];

const NAMED = {
  skip: 20, reverse: 20, rev: 20, draw2: 20, '+2': 20, drawtwo: 20,
  wild: 50, w: 50, wild4: 50, '+4': 50, drawfour: 50, wilddrawfour: 50,
};

export function score(tokens) {
  let total = 0;
  const rows = [];
  for (const raw of tokens) {
    const t = String(raw).toLowerCase().replace(/[\s_-]/g, '');
    let v;
    if (/^\d$/.test(t)) v = Number(t);
    else if (t in NAMED) v = NAMED[t];
    else throw new Error(`cannot read "${raw}" — use 0-9, skip, reverse, draw2, wild or wild4`);
    total += v;
    rows.push(`  ${raw} = ${v}`);
  }
  return { rows, total };
}

export function run(args) {
  const tokens = args.join(' ').split(/[\s,]+/).filter(Boolean);
  if (!tokens.length) throw new Error('give some cards, for example: rulebook score uno "9 5 skip wild"');
  const { rows, total } = score(tokens);
  return [...rows, '', `Total to the winner: ${total}`];
}
