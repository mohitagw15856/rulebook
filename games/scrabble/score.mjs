// Scores a Scrabble word, including premium squares and the seven-tile bonus.
//
// Letter multipliers are applied to individual tiles, word multipliers to the
// finished total — in that order, which is where hand-scoring usually goes
// wrong.

export const usage = 'rulebook score scrabble <word> [--dl=N] [--tl=N] [--dw] [--tw] [--blank=N] [--bingo]';
export const examples = [
  'rulebook score scrabble QUIZ',
  'rulebook score scrabble QUARTZ --tl=1 --dw --bingo',
];

export const TILE = {
  A: 1, B: 3, C: 3, D: 2, E: 1, F: 4, G: 2, H: 4, I: 1, J: 8, K: 5, L: 1, M: 3,
  N: 1, O: 1, P: 3, Q: 10, R: 1, S: 1, T: 1, U: 1, V: 4, W: 4, X: 8, Y: 4, Z: 10,
};

export function score(word, opts = {}) {
  const letters = String(word).toUpperCase().split('');
  for (const l of letters) {
    if (!(l in TILE)) throw new Error(`"${l}" is not a letter tile — words are A to Z only`);
  }

  // 1-indexed positions, because people count letters from one.
  const blanks = new Set((opts.blank || []).map(Number));
  const dl = new Set((opts.dl || []).map(Number));
  const tl = new Set((opts.tl || []).map(Number));

  let total = 0;
  const breakdown = [];
  letters.forEach((l, i) => {
    const pos = i + 1;
    // A blank scores zero no matter what square it lands on.
    let v = blanks.has(pos) ? 0 : TILE[l];
    let note = blanks.has(pos) ? ' (blank, 0)' : '';
    if (dl.has(pos)) {
      v *= 2;
      note += ' ×2 letter';
    }
    if (tl.has(pos)) {
      v *= 3;
      note += ' ×3 letter';
    }
    total += v;
    breakdown.push(`  ${l}  ${v}${note}`);
  });

  const wordMult = (opts.dw ? 2 : 1) * (opts.tw ? 3 : 1);
  const beforeBonus = total * wordMult;
  const bingo = opts.bingo ? 50 : 0;

  return { letters, breakdown, base: total, wordMult, beforeBonus, bingo, total: beforeBonus + bingo };
}

export function run(args) {
  const word = args.find((a) => !a.startsWith('--'));
  if (!word) throw new Error('give a word, for example: rulebook score scrabble QUIZ');

  const nums = (flag) => {
    const a = args.find((x) => x.startsWith(`--${flag}=`));
    return a ? a.split('=')[1].split(',').map(Number) : [];
  };
  const r = score(word, {
    dl: nums('dl'),
    tl: nums('tl'),
    blank: nums('blank'),
    dw: args.includes('--dw'),
    tw: args.includes('--tw'),
    bingo: args.includes('--bingo'),
  });

  const out = [`${word.toUpperCase()}`, '', ...r.breakdown, ''];
  out.push(`Letters:      ${r.base}`);
  if (r.wordMult > 1) out.push(`Word ×${r.wordMult}:      ${r.beforeBonus}`);
  if (r.bingo) out.push(`Seven tiles:  +${r.bingo}`);
  out.push(`Total:        ${r.total}`);
  return out;
}
