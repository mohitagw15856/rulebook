// A printable deck of ruling cards.
//
// Poker-sized, nine to an A4 sheet, one ruling per card. Cut them out and you
// have a physical object you can deal: hold one up, everyone guesses official
// or house rule, then turn it over. It is the quiz from the CLI, without the
// CLI.
//
// The front carries the question and the game. The back carries the verdict
// and, in large type, whether it is real — because that is the reveal.

import { fmtDuration } from './registry.mjs';

const esc = (s) =>
  String(s ?? '').replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));

function wrap(text, chars) {
  const words = String(text).replace(/\s+/g, ' ').trim().split(' ');
  const lines = [];
  let line = '';
  for (const w of words) {
    if ((line + ' ' + w).trim().length > chars) {
      if (line) lines.push(line.trim());
      line = w;
    } else line += ' ' + w;
  }
  if (line.trim()) lines.push(line.trim());
  return lines;
}

const text = (lines, x, y, { size = 9, fill = '#1b1b1b', lead = 12, weight = 'normal', anchor = 'start', family = 'Helvetica, Arial, sans-serif' } = {}) =>
  lines
    .map(
      (l, i) =>
        `<text x="${x}" y="${y + i * lead}" text-anchor="${anchor}" font-family="${family}" font-size="${size}" font-weight="${weight}" fill="${fill}">${esc(l)}</text>`
    )
    .join('');

// A4 at 72dpi, nine poker-sized cards (63x88mm ≈ 179x249pt) in a 3x3 grid.
const PAGE = { w: 842, h: 595 }; // landscape fits 4 across more comfortably
const CARD = { w: 179, h: 249 };
const COLS = 4;
const ROWS = 2;
const PER_PAGE = COLS * ROWS;

function cardFront(r, game, x, y) {
  const q = wrap(r.question, 24);
  return `
  <g transform="translate(${x} ${y})">
    <rect width="${CARD.w}" height="${CARD.h}" rx="10" fill="#fffdf7" stroke="#c9c2b2" stroke-width="1"/>
    ${text([game.name.toUpperCase()], 16, 30, { size: 8, fill: '#7a7364', weight: 'bold' })}
    <line x1="16" y1="38" x2="${CARD.w - 16}" y2="38" stroke="#e0dacb" stroke-width="1"/>
    ${text(q.slice(0, 8), 16, 66, { size: 13, lead: 17, weight: 'bold' })}
    ${text(['official rule,'], 16, CARD.h - 40, { size: 10, fill: '#7a7364' })}
    ${text(['or made up?'], 16, CARD.h - 26, { size: 10, fill: '#7a7364' })}
  </g>`;
}

function cardBack(r, game, x, y) {
  const v = wrap(r.verdict, 30).slice(0, 9);
  const badge = r.official ? 'OFFICIAL' : 'NOT A REAL RULE';
  const colour = r.official ? '#1a7f5a' : '#b8860b';
  return `
  <g transform="translate(${x} ${y})">
    <rect width="${CARD.w}" height="${CARD.h}" rx="10" fill="#fffdf7" stroke="#c9c2b2" stroke-width="1"/>
    <rect x="0" y="0" width="${CARD.w}" height="34" rx="10" fill="${colour}"/>
    <rect x="0" y="24" width="${CARD.w}" height="10" fill="${colour}"/>
    ${text([badge], CARD.w / 2, 22, { size: 11, fill: '#fffdf7', weight: 'bold', anchor: 'middle' })}
    ${text([game.name], 16, 52, { size: 8, fill: '#7a7364', weight: 'bold' })}
    ${text(v, 16, 70, { size: 8.5, lead: 11, fill: '#3a3a3a' })}
    ${text([`${r.prevalence.replace('-', ' ')}`], 16, CARD.h - 18, { size: 7.5, fill: '#7a7364' })}
  </g>`;
}

// Backs are laid out mirrored left-to-right so that duplex printing lines them
// up with their fronts. Getting this wrong is the classic way to produce a
// deck where every answer belongs to the wrong question.
export function deckSheets(games, { backs = true } = {}) {
  const rulings = games.flatMap((g) => g.rulings.map((r) => ({ r, g })));
  const pages = [];

  for (let i = 0; i < rulings.length; i += PER_PAGE) {
    const slice = rulings.slice(i, i + PER_PAGE);
    const marginX = (PAGE.w - COLS * CARD.w) / (COLS + 1);
    const marginY = (PAGE.h - ROWS * CARD.h) / (ROWS + 1);

    const place = (fn, mirror) =>
      slice
        .map(({ r, g }, n) => {
          const col = n % COLS;
          const row = Math.floor(n / COLS);
          const c = mirror ? COLS - 1 - col : col;
          return fn(r, g, marginX + c * (CARD.w + marginX), marginY + row * (CARD.h + marginY));
        })
        .join('');

    pages.push(
      `<svg xmlns="http://www.w3.org/2000/svg" width="${PAGE.w}" height="${PAGE.h}" viewBox="0 0 ${PAGE.w} ${PAGE.h}">` +
        `<rect width="${PAGE.w}" height="${PAGE.h}" fill="#ffffff"/>${place(cardFront, false)}</svg>`
    );
    if (backs) {
      pages.push(
        `<svg xmlns="http://www.w3.org/2000/svg" width="${PAGE.w}" height="${PAGE.h}" viewBox="0 0 ${PAGE.w} ${PAGE.h}">` +
          `<rect width="${PAGE.w}" height="${PAGE.h}" fill="#ffffff"/>${place(cardBack, true)}</svg>`
      );
    }
  }
  return pages;
}

// One HTML file holding every sheet, with page breaks, so it prints straight
// from a browser without anything else installed.
export function deckHtml(games, opts) {
  const sheets = deckSheets(games, opts);
  const total = games.reduce((a, g) => a + g.rulings.length, 0);
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<title>rulebook — ${total} ruling cards</title>
<style>
  @page { size: A4 landscape; margin: 0; }
  body { margin: 0; background: #eee; font-family: Helvetica, Arial, sans-serif; }
  .sheet { page-break-after: always; background: #fff; margin: 12px auto; width: 842px; height: 595px; box-shadow: 0 2px 12px rgba(0,0,0,.15); }
  .note { max-width: 842px; margin: 24px auto; padding: 0 16px; color: #333; line-height: 1.6; }
  @media print { .note { display: none; } .sheet { margin: 0; box-shadow: none; } }
</style></head>
<body>
<div class="note">
  <h1>${total} ruling cards</h1>
  <p>Print double-sided, flipping on the <b>short edge</b>. Backs are laid out
  mirrored so each answer lands behind its own question. Cut along the card
  edges — they are standard poker size, so they fit sleeves if you are that
  sort of person.</p>
  <p>Hold one up. Everyone guesses official or made up. Turn it over.</p>
</div>
${sheets.map((s) => `<div class="sheet">${s}</div>`).join('\n')}
</body></html>`;
}

export { fmtDuration };
