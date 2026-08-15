// Totals a Pablo layout. Low is good, and the black kings are the trap — they
// are worth zero, which is the whole reason people hold them.

export const usage = 'rulebook score pablo "<cards>"';
export const examples = ['rulebook score pablo "Ks Kc 3h 2d"', 'rulebook score pablo "Qh 9c Ad 4s"'];

import { parseHand } from '../../lib/cards.mjs';

export function score(cards) {
  let total = 0;
  const rows = [];
  for (const c of cards) {
    let v;
    // Black kings are the zero cards; red kings are worth their full ten.
    if (c.rank === 'K' && (c.suit === 's' || c.suit === 'c')) v = 0;
    else if (c.rank === 'A') v = 1;
    else if (['T', 'J', 'Q', 'K'].includes(c.rank)) v = 10;
    else v = c.value;
    total += v;
    rows.push(`  ${c.label} = ${v}${v === 0 ? '  (black king)' : ''}`);
  }
  return { rows, total };
}

export function run(args) {
  const cards = parseHand(args.join(' '));
  const { rows, total } = score(cards);
  const out = [...rows, '', `Total: ${total}`, ''];
  out.push(
    total <= 5
      ? 'Low enough to call Pablo with some confidence.'
      : total <= 12
        ? 'Borderline. Calling is a gamble unless you know what the others are holding.'
        : 'Too high to call — you would almost certainly be undercut.'
  );
  return out;
}
