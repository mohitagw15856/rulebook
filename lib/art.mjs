// Illustrations for every game, generated rather than collected.
//
// The obvious way to show somebody what a game looks like is a photograph of
// the box. Every one of those is copyrighted, and this project already refuses
// to paste a publisher's words — pasting their photographs instead would be a
// strange place to draw the line.
//
// So these are drawn from primitives: a fanned hand, a chequered board, a hex
// field, a rack of tiles. They are stylised on purpose. Somebody who has never
// seen Catan will recognise a hex field with numbers on it, and nobody will
// mistake this for a photograph of the box.
//
// Every illustration is a self-contained SVG with no external references, so it
// renders on GitHub, in the printed booklet, and offline.

const PALETTE = {
  ink: '#0b0d12',
  paper: '#fffdf7',
  line: '#d9d2c2',
  dark: '#1b1b1b',
  red: '#c02b2b',
  gold: '#e8b93f',
  mint: '#2f9e7e',
  violet: '#6d5bb5',
  felt: '#0f5138',
  slate: '#7a7364',
};

const W = 400;
const H = 240;

// Game names go into both an attribute and a text node, so they need escaping
// in both places. The attribute is the one that matters: an unescaped quote
// there closes aria-label and everything after it becomes markup.
const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// --- primitives -------------------------------------------------------------

const card = (x, y, rot, { w = 54, h = 78, fill = PALETTE.paper, mark = '', markFill = PALETTE.dark, small = '' } = {}) => `
  <g transform="translate(${x} ${y}) rotate(${rot})">
    <rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" rx="6" fill="${fill}" stroke="${PALETTE.line}" stroke-width="1.5"/>
    ${small ? `<text x="${-w / 2 + 6}" y="${-h / 2 + 16}" font-family="Georgia, serif" font-size="12" font-weight="bold" fill="${markFill}">${small}</text>` : ''}
    ${mark ? `<text x="0" y="10" text-anchor="middle" font-family="Georgia, serif" font-size="26" fill="${markFill}">${mark}</text>` : ''}
  </g>`;

const die = (x, y, rot, pips) => {
  const spots = {
    1: [[0, 0]],
    2: [[-8, -8], [8, 8]],
    3: [[-8, -8], [0, 0], [8, 8]],
    4: [[-8, -8], [8, -8], [-8, 8], [8, 8]],
    5: [[-8, -8], [8, -8], [0, 0], [-8, 8], [8, 8]],
    6: [[-8, -8], [8, -8], [-8, 0], [8, 0], [-8, 8], [8, 8]],
  }[pips];
  return `
  <g transform="translate(${x} ${y}) rotate(${rot})">
    <rect x="-18" y="-18" width="36" height="36" rx="8" fill="${PALETTE.paper}" stroke="${PALETTE.line}" stroke-width="1.5"/>
    ${spots.map(([dx, dy]) => `<circle cx="${dx}" cy="${dy}" r="3.4" fill="${PALETTE.dark}"/>`).join('')}
  </g>`;
};

const hex = (cx, cy, r, fill) => {
  const pts = Array.from({ length: 6 }, (_, i) => {
    const a = (Math.PI / 180) * (60 * i - 30);
    return `${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`;
  }).join(' ');
  return `<polygon points="${pts}" fill="${fill}" stroke="${PALETTE.paper}" stroke-width="1.5" fill-opacity="0.85"/>`;
};

const tile = (x, y, fill, label = '', sub = '') => `
  <g transform="translate(${x} ${y})">
    <rect x="-19" y="-19" width="38" height="38" rx="5" fill="${fill}" stroke="${PALETTE.line}" stroke-width="1.2"/>
    ${label ? `<text x="0" y="7" text-anchor="middle" font-family="Georgia, serif" font-size="20" font-weight="bold" fill="${PALETTE.dark}">${label}</text>` : ''}
    ${sub ? `<text x="13" y="15" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="9" fill="${PALETTE.slate}">${sub}</text>` : ''}
  </g>`;

const person = (x, y, fill, hidden = false) => `
  <g transform="translate(${x} ${y})">
    <circle cx="0" cy="-14" r="11" fill="${fill}"/>
    <path d="M-16 16 a16 18 0 0 1 32 0 z" fill="${fill}"/>
    ${hidden ? `<rect x="-12" y="-20" width="24" height="9" rx="3" fill="${PALETTE.ink}" fill-opacity="0.75"/>` : ''}
  </g>`;

const board = (x, y, cells, size, light, dark) => {
  const out = [];
  for (let r = 0; r < cells; r++) {
    for (let c = 0; c < cells; c++) {
      out.push(
        `<rect x="${x + c * size}" y="${y + r * size}" width="${size}" height="${size}" fill="${(r + c) % 2 ? dark : light}"/>`
      );
    }
  }
  return out.join('');
};

// --- motifs -----------------------------------------------------------------

const MOTIFS = {
  cards: () => `
    ${card(150, 130, -16, { small: 'K', mark: '♠' })}
    ${card(200, 122, -2, { small: 'A', mark: '♥', markFill: PALETTE.red })}
    ${card(250, 130, 13, { small: 'Q', mark: '♦', markFill: PALETTE.red })}`,

  uno: () => `
    ${card(150, 130, -16, { fill: '#d64545', small: '7', mark: '', markFill: PALETTE.paper })}
    ${card(200, 122, -2, { fill: '#3b7dd8', small: '+2', markFill: PALETTE.paper })}
    ${card(250, 130, 13, { fill: '#1b1b1b', small: '', markFill: PALETTE.paper })}
    <circle cx="250" cy="130" r="17" fill="${PALETTE.gold}" fill-opacity="0.85"/>`,

  chess: () => `
    ${board(140, 55, 8, 16, '#efe6d2', '#7d6b52')}
    <text x="180" y="140" text-anchor="middle" font-family="Georgia, serif" font-size="34" fill="${PALETTE.dark}">♞</text>
    <text x="228" y="108" text-anchor="middle" font-family="Georgia, serif" font-size="34" fill="${PALETTE.paper}">♚</text>`,

  xiangqi: () => `
    <rect x="130" y="55" width="140" height="130" fill="#efe0bd" stroke="${PALETTE.line}"/>
    ${Array.from({ length: 8 }, (_, i) => `<line x1="${130 + i * 20}" y1="55" x2="${130 + i * 20}" y2="185" stroke="#a08f6d" stroke-width="1"/>`).join('')}
    ${Array.from({ length: 8 }, (_, i) => `<line x1="130" y1="${55 + i * 18.5}" x2="270" y2="${55 + i * 18.5}" stroke="#a08f6d" stroke-width="1"/>`).join('')}
    <rect x="130" y="106" width="140" height="28" fill="#dcc9a0"/>
    <text x="200" y="125" text-anchor="middle" font-family="Georgia, serif" font-size="15" fill="#8a7550">楚河　漢界</text>
    <rect x="180" y="55" width="40" height="37" fill="none" stroke="#a08f6d" stroke-width="1"/>
    <path d="M180 55 L220 92 M220 55 L180 92" stroke="#a08f6d" stroke-width="1"/>
    <rect x="180" y="148" width="40" height="37" fill="none" stroke="#a08f6d" stroke-width="1"/>
    <path d="M180 148 L220 185 M220 148 L180 185" stroke="#a08f6d" stroke-width="1"/>
    <circle cx="200" cy="166" r="14" fill="${PALETTE.paper}" stroke="${PALETTE.red}" stroke-width="2"/>
    <text x="200" y="172" text-anchor="middle" font-family="Georgia, serif" font-size="16" fill="${PALETTE.red}">帥</text>
    <circle cx="200" cy="73" r="14" fill="${PALETTE.paper}" stroke="${PALETTE.dark}" stroke-width="2"/>
    <text x="200" y="79" text-anchor="middle" font-family="Georgia, serif" font-size="16" fill="${PALETTE.dark}">將</text>
    <circle cx="160" cy="152" r="12" fill="${PALETTE.paper}" stroke="${PALETTE.red}" stroke-width="1.6"/>
    <text x="160" y="157" text-anchor="middle" font-family="Georgia, serif" font-size="13" fill="${PALETTE.red}">炮</text>`,

  hexes: () => {
    const colours = ['#8aa84a', '#c9a227', '#7d9a5f', '#b0784a', '#9aa7ad', '#8aa84a', '#c9a227'];
    const spots = [
      [200, 80], [163, 101], [237, 101],
      [163, 143], [200, 122], [237, 143], [200, 164],
    ];
    return spots.map(([x, y], i) => hex(x, y, 24, colours[i])).join('') +
      `<circle cx="200" cy="122" r="9" fill="${PALETTE.paper}"/><text x="200" y="126" text-anchor="middle" font-family="Georgia, serif" font-size="11" font-weight="bold" fill="${PALETTE.red}">8</text>`;
  },

  tiles: () => `
    ${tile(140, 122, '#efe0bd', 'W', '4')}
    ${tile(182, 122, '#efe0bd', 'O', '1')}
    ${tile(224, 122, '#efe0bd', 'R', '1')}
    ${tile(266, 122, '#efe0bd', 'D', '2')}`,

  azul: () => {
    const cols = ['#3f7fb5', '#d8b24a', '#c05a4a', '#3b3b3b', '#6fa88a'];
    return cols.map((c, i) => tile(140 + i * 32, 105, c)).join('') +
      cols.slice(0, 4).map((c, i) => tile(156 + i * 32, 145, c)).join('');
  },

  dice: () => `
    ${die(160, 120, -12, 5)}
    ${die(205, 132, 8, 3)}
    ${die(248, 116, -4, 6)}`,

  track: () => `
    <path d="M120 170 C 170 90, 230 190, 285 95" fill="none" stroke="${PALETTE.slate}" stroke-width="3" stroke-dasharray="1 11" stroke-linecap="round"/>
    ${[[130, 160], [180, 128], [230, 150], [275, 105]].map((p, i) =>
      `<rect x="${p[0] - 11}" y="${p[1] - 6}" width="22" height="12" rx="3" fill="${[PALETTE.red, PALETTE.gold, PALETTE.mint, PALETTE.violet][i]}" transform="rotate(${[-28, 20, -22, 30][i]} ${p[0]} ${p[1]})"/>`
    ).join('')}`,

  grid: () => {
    const out = [];
    for (let r = 0; r < 5; r++)
      for (let c = 0; c < 5; c++) {
        const hit = (r * 5 + c) % 7 === 0;
        out.push(`<rect x="${142 + c * 24}" y="${62 + r * 24}" width="20" height="20" rx="3" fill="${hit ? PALETTE.red : '#e8e2d4'}" fill-opacity="${hit ? 0.9 : 0.75}"/>`);
      }
    return out.join('');
  },

  words: () => {
    const w = ['SPY', 'RIVER', 'BOND', 'KIWI'];
    return w.map((t, i) =>
      `<g transform="translate(${145 + (i % 2) * 78} ${100 + Math.floor(i / 2) * 40})">
        <rect x="-34" y="-14" width="68" height="28" rx="4" fill="${i === 1 ? '#6fa88a' : '#e8e2d4'}"/>
        <text x="0" y="5" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="11" font-weight="bold" fill="${PALETTE.dark}">${t}</text>
      </g>`
    ).join('');
  },

  people: () => `
    ${person(150, 130, '#8aa2c8')}
    ${person(200, 122, '#c8a06f', true)}
    ${person(250, 130, '#9ec8a2')}
    <path d="M186 82 q14 -16 28 0 q-6 10 -14 10 q-8 0 -14 -10z" fill="${PALETTE.paper}" fill-opacity="0.9"/>`,

  discs: () => `
    ${[0, 1, 2].map((i) => `<circle cx="${160 + i * 40}" cy="130" r="22" fill="${PALETTE.paper}" stroke="${PALETTE.line}" stroke-width="2"/>`).join('')}
    <path d="M154 126 a6 6 0 1 1 12 0 v6 h-12z" fill="${PALETTE.red}"/>
    <circle cx="200" cy="130" r="9" fill="${PALETTE.mint}"/>
    <g transform="translate(240 130)"><circle cx="0" cy="-3" r="7" fill="${PALETTE.dark}"/><rect x="-6" y="2" width="12" height="6" rx="2" fill="${PALETTE.dark}"/></g>`,

  hive: () => {
    const cols = ['#d8b24a', '#3b3b3b', '#d8b24a', '#3b3b3b', '#d8b24a'];
    const spots = [[178, 105], [218, 105], [158, 138], [198, 138], [238, 138]];
    return spots.map(([x, y], i) => hex(x, y, 23, cols[i])).join('');
  },

  polyomino: () => {
    const cells = [
      [0, 0], [1, 0], [2, 0], [0, 1],
      [3, 1], [4, 1], [4, 0],
      [1, 2], [2, 2], [3, 2],
    ];
    return cells.map(([c, r], i) =>
      `<rect x="${150 + c * 24}" y="${86 + r * 24}" width="21" height="21" rx="3" fill="${i < 4 ? '#b0784a' : i < 7 ? '#6fa88a' : '#8aa2c8'}"/>`
    ).join('');
  },

  points: () => {
    const out = [];
    for (let i = 0; i < 8; i++) {
      const x = 140 + i * 20;
      out.push(`<polygon points="${x},60 ${x + 16},60 ${x + 8},130" fill="${i % 2 ? '#b0784a' : '#e8e2d4'}" fill-opacity="0.9"/>`);
      out.push(`<polygon points="${x},185 ${x + 16},185 ${x + 8},115" fill="${i % 2 ? '#e8e2d4' : '#b0784a'}" fill-opacity="0.9"/>`);
    }
    out.push(`<circle cx="156" cy="72" r="9" fill="${PALETTE.paper}"/><circle cx="156" cy="88" r="9" fill="${PALETTE.paper}"/>`);
    out.push(`<circle cx="276" cy="172" r="9" fill="${PALETTE.dark}"/><circle cx="276" cy="156" r="9" fill="${PALETTE.dark}"/>`);
    return out.join('');
  },

  money: () => `
    <rect x="140" y="80" width="120" height="86" rx="4" fill="#e8e2d4" transform="rotate(-6 200 123)"/>
    <rect x="150" y="72" width="120" height="86" rx="4" fill="#cfe0cf" transform="rotate(4 210 115)"/>
    <circle cx="210" cy="115" r="20" fill="${PALETTE.paper}" stroke="${PALETTE.slate}" stroke-width="1.5"/>
    <text x="210" y="123" text-anchor="middle" font-family="Georgia, serif" font-size="20" font-weight="bold" fill="${PALETTE.dark}">£</text>
    <g transform="translate(268 152)"><rect x="-14" y="-9" width="28" height="18" rx="3" fill="${PALETTE.red}"/><rect x="-9" y="-16" width="18" height="8" rx="2" fill="${PALETTE.red}"/></g>`,
};

// Which motif each game gets. Explicit rather than inferred: a lookup you can
// read and correct beats a rule that is nearly right.
const ASSIGNED = {
  uno: 'uno',
  'crazy-eights': 'cards',
  'go-fish': 'cards',
  hearts: 'cards',
  spades: 'cards',
  blackjack: 'cards',
  'poker-texas-holdem': 'cards',
  'rummy-gin': 'cards',
  'rummy-indian': 'cards',
  pablo: 'cards',
  cribbage: 'cards',
  'love-letter': 'cards',
  coup: 'cards',
  'the-mind': 'cards',
  dominion: 'cards',
  chess: 'chess',
  xiangqi: 'xiangqi',
  catan: 'hexes',
  hive: 'hive',
  scrabble: 'tiles',
  azul: 'azul',
  yahtzee: 'dice',
  ludo: 'track',
  'ticket-to-ride': 'track',
  battleship: 'grid',
  codenames: 'words',
  'codenames-duet': 'words',
  cluedo: 'grid',
  werewolf: 'people',
  charades: 'people',
  fishbowl: 'people',
  skull: 'discs',
  backgammon: 'points',
  monopoly: 'money',
  jaipur: 'money',
  patchwork: 'polyomino',
  'seven-wonders-duel': 'cards',
};

const FALLBACK = { card: 'cards', board: 'grid', word: 'words', party: 'people', social: 'people', dice: 'dice', abstract: 'chess' };

export function motifFor(game) {
  return ASSIGNED[game.slug] || FALLBACK[game.type] || 'cards';
}

export function illustration(game, { dark = true } = {}) {
  const motif = motifFor(game);
  const draw = MOTIFS[motif] || MOTIFS.cards;
  const bg = dark
    ? `<rect width="${W}" height="${H}" fill="#0a0c11"/>
       <circle cx="90" cy="40" r="120" fill="#1c5c4d" fill-opacity="0.30"/>
       <circle cx="330" cy="215" r="130" fill="#3b2a72" fill-opacity="0.30"/>`
    : `<rect width="${W}" height="${H}" fill="#f6f3ea"/>`;

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" ` +
    `role="img" aria-label="A stylised illustration of ${esc(game.name)}">` +
    bg +
    `<g filter="none">${draw()}</g>` +
    `<text x="20" y="${H - 18}" font-family="Helvetica, Arial, sans-serif" font-size="13" font-weight="bold" ` +
    `fill="${dark ? '#f4f6fa' : PALETTE.dark}">${esc(game.name)}</text>` +
    `<text x="${W - 20}" y="${H - 18}" text-anchor="end" font-family="Helvetica, Arial, sans-serif" font-size="9" ` +
    `fill="${dark ? '#6a7383' : PALETTE.slate}">illustration, not a photograph</text>` +
    `</svg>`
  );
}

export { MOTIFS, PALETTE };
