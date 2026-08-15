// A reference card you can print, fold, and leave in the box lid.
//
// One A4 sheet, four panels, folded twice. Panel one is the cover with a QR
// code to that game's rulings; the rest carry the facts you actually need
// mid-game — setup by player count, the turn, and the two or three rules your
// table gets wrong.
//
// SVG rather than PDF because SVG is text, prints fine from any browser, and
// needs no library to produce.

import { encode, toSvg } from './qr.mjs';
import { fmtDuration } from './registry.mjs';

const esc = (s) =>
  String(s ?? '').replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));

// Naive greedy wrap at an approximate character width. Good enough for a
// printed card, and it avoids needing font metrics.
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

function textBlock(lines, x, y, { size = 8, fill = '#222', lead = 11, weight = 'normal' } = {}) {
  return lines
    .map(
      (l, i) =>
        `<text x="${x}" y="${y + i * lead}" font-family="Helvetica, Arial, sans-serif" font-size="${size}" font-weight="${weight}" fill="${fill}">${esc(l)}</text>`
    )
    .join('');
}

export function referenceCard(game, { url } = {}) {
  // A4 landscape, four equal vertical panels.
  const W = 842;
  const H = 595;
  const P = W / 4;
  const link = url || `https://mohitagw15856.github.io/rulebook/#${game.slug}`;

  const parts = [];
  parts.push(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">`,
    `<rect width="${W}" height="${H}" fill="#ffffff"/>`
  );

  // Fold lines
  for (let i = 1; i < 4; i++) {
    parts.push(
      `<line x1="${P * i}" y1="0" x2="${P * i}" y2="${H}" stroke="#cccccc" stroke-width="1" stroke-dasharray="4 4"/>`
    );
  }

  // ---- Panel 1: cover -----------------------------------------------------
  const qr = toSvg(encode(link), { scale: 3, quiet: 2 });
  const qrInner = qr.replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '');
  const qrSize = (encode(link).length + 4) * 3;

  parts.push(`<g>`);
  parts.push(
    `<text x="20" y="60" font-family="Georgia, serif" font-size="30" font-weight="bold" fill="#111">${esc(game.name)}</text>`
  );
  parts.push(
    `<line x1="20" y1="72" x2="${P - 20}" y2="72" stroke="#111" stroke-width="2"/>`
  );
  parts.push(
    ...[
      [`${game.players.min}–${game.players.max} players`, 96],
      [`${fmtDuration(game.playtime_actual)} (box says ${fmtDuration(game.playtime_box)})`, 112],
      [`${fmtDuration(game.teach_time)} to teach · age ${game.min_age}+`, 128],
      [`weight ${game.weight}/5 · ${game.luck}% luck`, 144],
    ].map(([t, y]) => `<text x="20" y="${y}" font-family="Helvetica, Arial, sans-serif" font-size="10" fill="#555">${esc(t)}</text>`)
  );
  parts.push(...textBlock(wrap(game.objective, 34), 20, 176, { size: 9.5, fill: '#222', lead: 13 }));

  parts.push(`<g transform="translate(20 ${H - qrSize - 70})">${qrInner}</g>`);
  parts.push(
    `<text x="${qrSize + 32}" y="${H - qrSize - 46}" font-family="Helvetica, Arial, sans-serif" font-size="8" fill="#555">Scan for every</text>`,
    `<text x="${qrSize + 32}" y="${H - qrSize - 35}" font-family="Helvetica, Arial, sans-serif" font-size="8" fill="#555">ruling on file</text>`
  );
  parts.push(
    `<text x="20" y="${H - 34}" font-family="Helvetica, Arial, sans-serif" font-size="7" fill="#888">rulebook · ${esc(game.rulings.length)} rulings on file</text>`,
    `<text x="20" y="${H - 22}" font-family="Helvetica, Arial, sans-serif" font-size="7" fill="#888">mohitagw15856.github.io/rulebook</text>`
  );
  parts.push(`</g>`);

  // ---- Panel 2: setup by player count -------------------------------------
  let y = 44;
  const x2 = P + 20;
  parts.push(
    `<text x="${x2}" y="${y}" font-family="Helvetica, Arial, sans-serif" font-size="10" font-weight="bold" fill="#111" letter-spacing="1.5">SETUP</text>`
  );
  y += 20;
  for (const s of game.setup_by_players) {
    parts.push(
      `<text x="${x2}" y="${y}" font-family="Helvetica, Arial, sans-serif" font-size="11" font-weight="bold" fill="#111">${esc(s.players)} players</text>`
    );
    y += 14;
    const lines = wrap(s.setup, 36);
    parts.push(...textBlock(lines, x2, y, { size: 8, fill: '#444', lead: 10 }));
    y += lines.length * 10 + 12;
    if (y > H - 60) break;
  }

  // ---- Panel 3: the turn ---------------------------------------------------
  const x3 = P * 2 + 20;
  y = 44;
  parts.push(
    `<text x="${x3}" y="${y}" font-family="Helvetica, Arial, sans-serif" font-size="10" font-weight="bold" fill="#111" letter-spacing="1.5">A TURN</text>`
  );
  y += 20;
  game.turn_structure.forEach((step, i) => {
    if (y > H - 120) return;
    parts.push(
      `<text x="${x3}" y="${y}" font-family="Georgia, serif" font-size="11" font-weight="bold" fill="#999">${i + 1}</text>`
    );
    const lines = wrap(step, 33);
    parts.push(...textBlock(lines, x3 + 14, y, { size: 8, fill: '#333', lead: 10 }));
    y += Math.max(lines.length * 10, 12) + 8;
  });

  y = Math.max(y + 10, H - 150);
  parts.push(
    `<text x="${x3}" y="${y}" font-family="Helvetica, Arial, sans-serif" font-size="10" font-weight="bold" fill="#111" letter-spacing="1.5">WINNING</text>`
  );
  parts.push(...textBlock(wrap(game.win_condition, 36), x3, y + 16, { size: 8, fill: '#333', lead: 10 }));

  // ---- Panel 4: the arguments ---------------------------------------------
  const x4 = P * 3 + 20;
  y = 44;
  parts.push(
    `<text x="${x4}" y="${y}" font-family="Helvetica, Arial, sans-serif" font-size="10" font-weight="bold" fill="#111" letter-spacing="1.5">SETTLE IT</text>`
  );
  y += 20;
  // Hottest first: the rules most likely to stop the game.
  const top = [...game.rulings].sort((a, b) => b.heat - a.heat).slice(0, 4);
  for (const r of top) {
    if (y > H - 70) break;
    const qLines = wrap(r.question, 34);
    parts.push(...textBlock(qLines, x4, y, { size: 8.5, fill: '#111', lead: 10, weight: 'bold' }));
    y += qLines.length * 10 + 3;
    parts.push(
      `<text x="${x4}" y="${y}" font-family="Helvetica, Arial, sans-serif" font-size="7" font-weight="bold" fill="${r.official ? '#1a7f5a' : '#b8860b'}" letter-spacing="0.8">${r.official ? 'OFFICIAL' : 'NOT AN OFFICIAL RULE'}</text>`
    );
    y += 11;
    // Truncated text must look truncated, or a cut-off sentence reads as a bug.
    const all = wrap(r.verdict, 40);
    const vLines = all.slice(0, 4);
    if (all.length > 4) vLines[3] = vLines[3].replace(/[,.;:]?$/, '') + ' …';
    parts.push(...textBlock(vLines, x4, y, { size: 7.5, fill: '#444', lead: 9 }));
    y += vLines.length * 9 + 14;
  }

  parts.push(
    `<text x="${x4}" y="${H - 22}" font-family="Helvetica, Arial, sans-serif" font-size="7" fill="#888">Fold twice. Leave in the box.</text>`
  );

  parts.push('</svg>');
  return parts.join('');
}
