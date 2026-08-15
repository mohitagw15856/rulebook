#!/usr/bin/env node
// Tests for the scoring engines and the ruling search.
//
// These are the two parts of this repo that can be objectively wrong, so they
// are the parts that get tested. Every case below is a real situation somebody
// has argued about at a table, or a bug that actually shipped.

import { parseHand, parseCard } from '../lib/cards.mjs';
import { evaluate, compare } from '../games/poker-texas-holdem/score.mjs';
import { analyse } from '../games/rummy-gin/score.mjs';
import { score as scrabble } from '../games/scrabble/score.mjs';
import { score as uno } from '../games/uno/score.mjs';
import { score as pablo } from '../games/pablo/score.mjs';
import { search, scoreMatch } from '../lib/search.mjs';
import { load, heat } from '../lib/registry.mjs';
import { encode, toSvg } from '../lib/qr.mjs';
import { shuffled, quizQuestions, planNight, hottest, rank } from '../lib/party.mjs';
import { tally } from '../lib/store.mjs';
import { referenceCard } from '../lib/refcard.mjs';

let pass = 0;
const fails = [];

const t = (name, fn) => {
  try {
    fn();
    pass++;
  } catch (e) {
    fails.push(`${name}\n    ${e.message}`);
  }
};
const eq = (a, b, msg = '') => {
  const [x, y] = [JSON.stringify(a), JSON.stringify(b)];
  if (x !== y) throw new Error(`${msg}expected ${y}, got ${x}`);
};
const throws = (fn, re) => {
  try {
    fn();
  } catch (e) {
    if (re && !re.test(e.message)) throw new Error(`wrong error: ${e.message}`);
    return;
  }
  throw new Error('expected it to throw, but it did not');
};

// --- cards -----------------------------------------------------------------
t('parses ten as both T and 10', () => {
  eq(parseCard('10h').label, 'Th');
  eq(parseCard('Th').label, 'Th');
});
t('rejects a hand with duplicate cards', () => throws(() => parseHand('As As Kh'), /twice/));
t('rejects nonsense', () => throws(() => parseCard('Zx'), /cannot read card/));

// --- poker -----------------------------------------------------------------
const hand = (s) => evaluate(parseHand(s));

t('names a royal flush', () => eq(hand('As Ks Qs Js Ts').name, 'Royal flush'));
t('names a straight flush below the royal', () => {
  const h = hand('9s 8s 7s 6s 5s');
  eq(h.name, 'Straight flush');
  eq(h.detail, 'nine-high');
});
t('the wheel is a five-high straight, not ace-high', () => {
  const h = hand('As 2h 3d 4c 5s');
  eq(h.name, 'Straight');
  eq(h.detail, 'five-high (the wheel)');
});
t('the wheel loses to a six-high straight', () => {
  eq(compare(hand('As 2h 3d 4c 5s'), hand('2s 3h 4d 5c 6s')), -1);
});
t('a straight flush beats four of a kind', () => {
  eq(compare(hand('9s 8s 7s 6s 5s'), hand('Ah Ad Ac As Kh')), 1);
});
t('full house beats a flush', () => {
  eq(compare(hand('Kh Kd Kc 2s 2h'), hand('Ah Jh 9h 5h 3h')), 1);
});
t('picks the best five out of seven', () => {
  // Seven cards containing a flush and a straight; the flush must win out.
  const h = hand('2h 5h 9h Jh Kh 3s 4d');
  eq(h.name, 'Flush');
});
t('kicker breaks a tied pair', () => {
  eq(compare(hand('Ah Ad Kc 7s 3h'), hand('As Ac Qd 7h 3s')), 1);
});
t('identical hands split the pot', () => {
  eq(compare(hand('Ah Ad Kc 7s 3h'), hand('As Ac Kd 7h 3s')), 0);
});
t('two pair reads the higher pair first', () => {
  eq(hand('Kh Kd 3c 3s 9h').detail, 'kings and threes');
});
t('sixes are pluralised properly', () => eq(hand('6h 6d 6c 2s 9h').detail, 'sixes'));
t('rejects a four-card hand', () => throws(() => hand('As Ks Qs Js'), /5 to 7/));

// --- gin rummy -------------------------------------------------------------
t('the ace runs low: A-2-3 of a suit is a meld', () => {
  const { melds, total } = analyse(parseHand('As 2s 3s 7h 7d 7c Kh Qd 4c 9s'));
  eq(melds.length, 2);
  eq(total, 33); // K 10 + Q 10 + 4 + 9
});
t('gin leaves no deadwood', () => {
  const { total, deadwood } = analyse(parseHand('4c 5c 6c 7c 9h 9d 9s Kh Kd Ks'));
  eq(total, 0);
  eq(deadwood.length, 0);
});
t('picks the arrangement with the least deadwood', () => {
  // 7h 8h 9h is a run and 9h 9d 9s is a set — the nine can only be in one.
  // Keeping the run leaves 9d 9s (18); keeping the set leaves 7h 8h (15).
  const { total } = analyse(parseHand('7h 8h 9h 9d 9s 2c'));
  eq(total, 17); // 7 + 8 + 2
});
t('a hand with no melds is all deadwood', () => {
  eq(analyse(parseHand('2h 5d 9c Js Kh')).total, 2 + 5 + 9 + 10 + 10);
});

// --- scrabble --------------------------------------------------------------
t('scores plain tiles', () => eq(scrabble('QUIZ').total, 10 + 1 + 1 + 10));
t('letter multiplier applies before the word multiplier', () => {
  // Q on a triple letter = 30, rest = 14, total 44, doubled = 88.
  eq(scrabble('QUARTZ', { tl: [1], dw: true }).total, 88);
});
t('the seven-tile bonus is added after multipliers, never multiplied', () => {
  eq(scrabble('QUARTZ', { tl: [1], dw: true, bingo: true }).total, 138);
});
t('a blank scores zero even on a premium square', () => {
  eq(scrabble('ZOO', { blank: [1], tl: [1] }).total, 0 + 1 + 1);
});
t('double and triple word stack multiplicatively', () => {
  eq(scrabble('CAT', { dw: true, tw: true }).total, 5 * 6);
});
t('rejects a non-letter', () => throws(() => scrabble('CA7'), /not a letter tile/));

// --- uno -------------------------------------------------------------------
t('action cards are 20, wilds are 50', () => eq(uno(['9', '5', 'skip', 'wild']).total, 9 + 5 + 20 + 50));
t('accepts the shorthand people actually type', () => eq(uno(['+2', '+4', 'draw2']).total, 20 + 50 + 20));
t('rejects an unknown card', () => throws(() => uno(['banana']), /cannot read/));

// --- pablo -----------------------------------------------------------------
t('black kings are worth zero', () => eq(pablo(parseHand('Ks Kc 3h 2d')).total, 5));
t('red kings are worth their full ten', () => eq(pablo(parseHand('Kh Kd')).total, 20));
t('ace is one', () => eq(pablo(parseHand('Ad 4s')).total, 5));

// --- ruling search ---------------------------------------------------------
// Every case here is a question somebody would actually type.
const games = load();
const g = (slug) => games.find((x) => x.slug === slug).rulings;
const top = (slug, q) => search(g(slug), q)[0]?.r.id;

t('finds the Uno stacking ruling from the phrase people use', () => {
  eq(top('uno', 'can I stack a draw 2'), 'stacking-draw-cards');
  eq(top('uno', 'stacking'), 'stacking-draw-cards');
  eq(top('uno', '+2 on +2'), 'stacking-draw-cards');
});
t('finds Free Parking from two words', () => {
  eq(top('monopoly', 'free parking'), 'free-parking-jackpot');
});
t('finds the draw-until-playable ruling', () => {
  eq(top('uno', 'do you keep drawing until you can play'), 'draw-until-playable');
});

// This one is here because CI caught it. The query shares only the word "do"
// with a Uno ruling, and an early version of the search called that a match.
t('an unrelated question matches nothing', () => {
  eq(search(g('uno'), 'how do I fold a paper crane').length, 0);
  eq(search(g('catan'), 'what should we have for dinner').length, 0);
  eq(search(g('chess'), 'is it going to rain').length, 0);
});
t('a query made entirely of function words matches nothing', () => {
  eq(search(g('uno'), 'can you do the what if').length, 0);
  eq(search(g('monopoly'), 'is it that they should').length, 0);
});
t('but a real content word still matches, even in a vague question', () => {
  // "what happens when you" is vague; "happens" is not a function word and it
  // hits a real question, so this should match rather than draw a blank.
  eq(search(g('monopoly'), 'what happens when you go bankrupt').length > 0, true);
});
t('a single word buried in one verdict is not a match', () => {
  // "internet" appears in the Uno stacking verdict and nowhere else.
  eq(scoreMatch(g('uno').find((r) => r.id === 'stacking-draw-cards'), 'internet'), 0);
});
t('an empty query matches nothing', () => eq(search(g('uno'), '').length, 0));


// --- QR encoder ------------------------------------------------------------
// Verified end to end against Chrome's BarcodeDetector when it was written;
// these guard the structure so a refactor cannot silently stop it scanning.
const qrAt = (m, r, c) => (r < 0 || c < 0 || r >= m.length || c >= m.length ? 0 : m[r][c]);
const hasFinder = (m, r, c) =>
  qrAt(m, r, c) === 1 && qrAt(m, r + 6, c) === 1 && qrAt(m, r, c + 6) === 1 &&
  qrAt(m, r + 3, c + 3) === 1 && qrAt(m, r + 1, c + 1) === 0;

t('QR picks the smallest version that fits', () => {
  eq((encode('hi').length - 17) / 4, 1);
  eq((encode('x'.repeat(40)).length - 17) / 4, 3);
});
t('QR emits only binary modules', () => {
  eq(encode('https://example.com/a/b').flat().filter((v) => v !== 0 && v !== 1).length, 0);
});
t('QR places all three finder patterns', () => {
  const m = encode('https://mohitagw15856.github.io/rulebook/#uno/stacking-draw-cards');
  eq([hasFinder(m, 0, 0), hasFinder(m, 0, m.length - 7), hasFinder(m, m.length - 7, 0)], [true, true, true]);
});
t('QR sets the dark module, which is never optional', () => {
  const m = encode('rulebook');
  eq(m[m.length - 8][8], 1);
});
t('QR timing patterns alternate from the finder', () => {
  const m = encode('rulebook');
  eq([m[6][8], m[6][9], m[8][6], m[9][6]], [1, 0, 1, 0]);
});
t('QR refuses input it cannot encode rather than truncating', () =>
  throws(() => encode('x'.repeat(400)), /too long/));
t('QR svg is self-contained and sized', () => {
  const svg = toSvg(encode('rulebook'));
  eq(svg.startsWith('<svg xmlns="http://www.w3.org/2000/svg"'), true);
  eq(/<script|href=|url\(/.test(svg), false);
});

// --- derived heat ----------------------------------------------------------
t('a universally played house rule is the hottest thing in the registry', () => {
  const universal = { official: false, prevalence: 'near-universal' };
  const officialRare = { official: true, prevalence: 'rare' };
  eq(heat(universal) > heat(officialRare), true);
});
t('official rules rank below house rules at equal prevalence', () => {
  eq(heat({ official: true, prevalence: 'common' }) < heat({ official: false, prevalence: 'common' }), true);
});

// --- party -----------------------------------------------------------------
t('the shuffle is deterministic for a given seed', () => {
  const a = shuffled([1, 2, 3, 4, 5, 6, 7, 8], 42);
  const b = shuffled([1, 2, 3, 4, 5, 6, 7, 8], 42);
  const c2 = shuffled([1, 2, 3, 4, 5, 6, 7, 8], 43);
  eq(a, b);
  eq(a.join() !== c2.join(), true);
});
t('the shuffle keeps every element', () => {
  eq(shuffled([1, 2, 3, 4, 5], 9).sort((x, y) => x - y), [1, 2, 3, 4, 5]);
});
t('a quiz mixes official rules in rather than being all trick questions', () => {
  const qs = quizQuestions(10, 5);
  eq(qs.length, 10);
  const official = qs.filter((q) => q.answer).length;
  eq(official > 0 && official < 10, true);
});
t('the night planner never exceeds its own budget', () => {
  for (const hours of [1, 2, 3, 4]) {
    for (const people of [2, 4, 6, 8]) {
      const p = planNight({ people, hours });
      eq(p.total <= p.budget, true, `${people}p/${hours}h overran: ${p.total} > ${p.budget} — `);
    }
  }
});
t('the night planner respects a youngest player', () => {
  const p = planNight({ people: 4, hours: 3, kids: 6 });
  const games = load();
  for (const s of p.slots) {
    const g = games.find((x) => x.slug === s.game.slug);
    eq(g.min_age <= 6, true, `${g.name} needs age ${g.min_age} — `);
  }
});
t('the night planner never repeats a game', () => {
  const p = planNight({ people: 4, hours: 4 });
  eq(new Set(p.slots.map((s) => s.game.slug)).size, p.slots.length);
});
t('the night planner returns nothing rather than lying when nothing fits', () => {
  eq(planNight({ people: 40, hours: 3 }).slots.length, 0);
});
t('hottest is sorted and non-empty', () => {
  const h = hottest(10);
  eq(h.length, 10);
  eq(h.every((r, i) => i === 0 || h[i - 1].heat >= r.heat), true);
});
t('rank gives a title at every score', () => {
  for (const p of [0, 25, 50, 70, 80, 100]) eq(typeof rank(p), 'string');
});

// --- scoreboard ------------------------------------------------------------
t('tally counts right and wrong per person', () => {
  const rows = [
    { called: 'Dave', right: false }, { called: 'Dave', right: false },
    { called: 'Priya', right: true }, { called: 'Dave', right: true },
  ];
  const table = tally(rows);
  eq(table[0].name, 'Priya');
  eq(table.find((p) => p.name === 'Dave'), { name: 'Dave', right: 1, wrong: 2, total: 3, pct: 33 });
});
t('tally ignores rows with no name', () => eq(tally([{ right: true }]).length, 0));

// --- reference card --------------------------------------------------------
t('every game produces a printable reference card', () => {
  for (const g of load()) {
    const svg = referenceCard(g);
    eq(svg.startsWith('<svg'), true, `${g.name}: `);
    eq(svg.endsWith('</svg>'), true, `${g.name}: `);
    // No external anything — it has to print from a plain file.
    eq(/<script|xlink:href|https?:\/\/[^"]*\.(png|jpg|svg)/.test(svg), false, `${g.name}: `);
  }
});
t('the reference card escapes game text rather than injecting it', () => {
  const g = { ...load()[0], name: 'Bad <script>alert(1)</script>' };
  eq(referenceCard(g).includes('<script>'), false);
});

// ---------------------------------------------------------------------------
if (fails.length) {
  console.error(`\n✗ ${fails.length} failing, ${pass} passing\n`);
  for (const f of fails) console.error(`  ✗ ${f}\n`);
  process.exit(1);
}
console.log(`✓ ${pass} tests passing`);
