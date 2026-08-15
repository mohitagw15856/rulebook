#!/usr/bin/env node
// Assembles site/ for GitHub Pages.
//
// The site is not a separate copy of the data — it is the same registry, the
// same matcher and the same scoring modules the CLI uses, inlined and copied
// verbatim. Nothing here can drift from the terminal, because there is only
// one source of truth and no bundler in between.

import { writeFileSync, readFileSync, mkdirSync, copyFileSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { load, validate } from '../lib/registry.mjs';

const ROOT = fileURLToPath(new URL('../', import.meta.url));
const OUT = `${ROOT}site`;

const games = load();
const errs = validate(games);
if (errs.length) {
  console.error('Refusing to build a site from invalid data:\n');
  for (const e of errs) console.error(`  ${e}`);
  process.exit(1);
}

rmSync(OUT, { recursive: true, force: true });
mkdirSync(`${OUT}/lib`, { recursive: true });

// The page only needs the data, not the internal bookkeeping.
const payload = {
  games: games.map(({ __dir, ...g }) => g),
};

const html = readFileSync(`${ROOT}web/index.html`, 'utf8').replace(
  '__DATA__',
  JSON.stringify(payload).replace(/</g, '\\u003c') // never let data close the script tag
);
writeFileSync(`${OUT}/index.html`, html);

copyFileSync(`${ROOT}web/style.css`, `${OUT}/style.css`);
copyFileSync(`${ROOT}web/app.js`, `${OUT}/app.js`);

// The shared modules, byte for byte. They are plain ESM with no Node imports,
// which is exactly why they load in a browser with no build step.
for (const f of ['search.mjs', 'cards.mjs']) {
  copyFileSync(`${ROOT}lib/${f}`, `${OUT}/lib/${f}`);
}
let scorers = 0;
for (const g of games.filter((x) => x.hasScore)) {
  mkdirSync(`${OUT}/games/${g.slug}`, { recursive: true });
  copyFileSync(`${ROOT}games/${g.slug}/score.mjs`, `${OUT}/games/${g.slug}/score.mjs`);
  scorers++;
}

mkdirSync(`${OUT}/assets`, { recursive: true });
for (const a of ['banner.svg', 'logo.svg', 'demo.gif']) {
  copyFileSync(`${ROOT}assets/${a}`, `${OUT}/assets/${a}`);
}

// Jekyll would otherwise swallow anything it does not recognise.
writeFileSync(`${OUT}/.nojekyll`, '');

const rulings = games.reduce((a, g) => a + g.rulings.length, 0);
const kb = Math.round(JSON.stringify(payload).length / 1024);
console.log(`✓ built site/ — ${games.length} games, ${rulings} rulings (${kb} kB of data), ${scorers} scorers running client-side`);
