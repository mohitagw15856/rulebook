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
import { load } from '../lib/registry.mjs';

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

// ---------------------------------------------------------------------------
if (fails.length) {
  console.error(`\n✗ ${fails.length} failing, ${pass} passing\n`);
  for (const f of fails) console.error(`  ✗ ${f}\n`);
  process.exit(1);
}
console.log(`✓ ${pass} tests passing`);
