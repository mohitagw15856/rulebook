#!/usr/bin/env node
// Twenty pre-written "add this game" issues, so a newcomer has an obvious
// first move rather than an empty issue tracker and a blank file.
//
//   node scripts/starter-issues.mjs           # print them
//   node scripts/starter-issues.mjs --gh      # print gh commands to create them
//
// Each names why the game is worth adding and one argument it is known for,
// because "add Bridge" is a chore and "settle whether you can psych in Bridge"
// is an invitation.

import { load } from '../lib/registry.mjs';

const WANTED = [
  ['Bridge', 'The most-played partnership card game in the world, and entirely absent here.', 'Is a psych — deliberately misdescribing your hand — legal, or cheating?'],
  ['Euchre', 'Dominant across the American Midwest and Ontario, unheard of elsewhere.', 'Does the dealer have to pick up the turned card if everyone passes twice?'],
  ['Canasta', 'A giant of mid-century card play still going strong in South America.', 'Can you go out without asking your partner first?'],
  ['Mahjong', 'Enormous globally, and the regional rule differences are vast.', 'Do you play Hong Kong, Riichi, or American scoring — and do they even agree on a winning hand?'],
  ['Carrom', 'Played across South Asia and the Middle East, with real regional variation.', 'Does the queen have to be covered immediately?'],
  ['Dominoes', 'Ancient, universal, and played to a dozen different scoring systems.', 'Do you score on multiples of five, or just count pips at the end?'],
  ['Risk', 'The war game everyone has abandoned halfway through.', 'Can you attack with one army left, and does anybody actually finish a game?'],
  ['Cheat / BS', 'The purest bluffing game, and every table has a different penalty.', 'What happens if you wrongly call cheat?'],
  ['Snap', 'A first game for most children in Britain.', 'Does a slow snap count, and who takes the pile on a tie?'],
  ['Old Maid', 'A children\'s classic built entirely on one uncomfortable moment.', 'Can you deliberately make the odd card obvious?'],
  ['Sevens / Fan Tan', 'A pub and family staple across Europe.', 'Must you play if you can, or may you pass to block?'],
  ['Kalooki', 'A rummy variant with a devoted following and contested jokers.', 'Can you take a joker back off the table once melded?'],
  ['Connect Four', 'Solved by computers, still argued about by people.', 'Does the first player always win with perfect play — and does that matter?'],
  ['Draughts / Checkers', 'Two continents, two different rule sets, one name.', 'Is capturing compulsory? British and American play disagree.'],
  ['Sushi Go', 'A gateway drafting game played constantly and taught badly.', 'Do you reveal chosen cards simultaneously, and what breaks a maki tie?'],
  ['Exploding Kittens', 'Enormously popular and full of ambiguous card interactions.', 'Can you play a Nope on a Nope, and how far does that go?'],
  ['Pandemic', 'The cooperative game most likely to be played wrong.', 'May one player simply tell everyone else what to do?'],
  ['Wingspan', 'Hugely popular, with genuinely fiddly card timing.', 'When exactly does a "when played" power trigger?'],
  ['Sequence', 'A family staple with wildly inconsistent jack rules.', 'Do one-eyed jacks remove and two-eyed jacks place, or the reverse?'],
  ['Rummikub', 'The tile game where every family has a different manipulation rule.', 'Can you rearrange the whole table to make your play?'],
];

const have = new Set(load().map((g) => g.name.toLowerCase()));
const todo = WANTED.filter(([name]) => !have.has(name.toLowerCase()));

const body = (name, why, argument) =>
  [
    `**Why this one:** ${why}`,
    '',
    `**An argument it is known for:** ${argument}`,
    '',
    '---',
    '',
    'One game is one folder: `game.yml`, `rules.md`, `rulings.yml`, `teach.md`.',
    'Copy the closest existing game — `npm run validate` names every missing field,',
    'so there is no schema to memorise.',
    '',
    '**The one rule:** write the rules in your own words. How a game is played is not',
    'copyrightable; a publisher\'s wording is. `npm run check` enforces it.',
    '',
    'You do not have to do the whole game. A single ruling is a genuinely useful',
    'contribution on its own — see the *Good first ruling* template.',
  ].join('\n');

if (process.argv.includes('--gh')) {
  for (const [name, why, argument] of todo) {
    const b = body(name, why, argument).replace(/'/g, `'\\''`);
    console.log(`gh issue create --title '[game] ${name}' --label game --label 'good first issue' --body '${b}'`);
  }
} else {
  console.log(`\n${todo.length} games worth adding (${WANTED.length - todo.length} already here)\n`);
  for (const [name, why, argument] of todo) {
    console.log(`  ${name}`);
    console.log(`    ${why}`);
    console.log(`    Argument: ${argument}\n`);
  }
  console.log('  node scripts/starter-issues.mjs --gh | sh   # create them all\n');
}
