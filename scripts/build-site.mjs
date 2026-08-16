#!/usr/bin/env node
// Assembles site/ for GitHub Pages.
//
// The site is not a separate copy of the data — it is the same registry, the
// same matcher and the same scoring modules the CLI uses, inlined and copied
// verbatim. Nothing here can drift from the terminal, because there is only
// one source of truth and no bundler in between.

import { writeFileSync, readFileSync, mkdirSync, copyFileSync, rmSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { load, validate, fmtDuration, minutes, isStale } from '../lib/registry.mjs';
import { loadVotes, measure } from '../lib/votes.mjs';
import { deckHtml } from '../lib/deck.mjs';

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
const votes = loadVotes();
const payload = {
  games: games.map(({ __dir, __rulesFile, __teachFile, ...g }) => ({
    ...g,
    stale: isStale(g),
    rulings: g.rulings.map((r) => ({ ...r, votes: measure(votes, `${g.slug}/${r.id}`) })),
  })),
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

// -----------------------------------------------------------------------------
// One page per ruling, so a link pasted into a group chat unfurls with the
// actual verdict rather than the site title. That is where most arguments
// happen, and a link that says nothing gets ignored.
//
// There is no per-ruling preview image: generating one would mean rasterising
// text, which needs a font renderer and therefore a dependency. Text unfurls
// work everywhere and are what people read anyway.
// -----------------------------------------------------------------------------
const trim = (s2, n) => {
  const t = String(s2).replace(/\s+/g, ' ').trim();
  return t.length <= n ? t : t.slice(0, n - 1).replace(/\s\S*$/, '') + '…';
};
const attr = (s2) =>
  String(s2).replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));

let sharePages = 0;
for (const g of games) {
  for (const r of g.rulings) {
    const dir = `${OUT}/r/${g.slug}/${r.id}`;
    mkdirSync(dir, { recursive: true });
    const title = `${r.question} — ${g.name}`;
    const badge = r.official ? 'OFFICIAL RULE' : 'NOT AN OFFICIAL RULE';
    const desc = `${badge}. ${trim(r.verdict, 240)}`;
    const target = `../../../#${g.slug}/${r.id}`;
    writeFileSync(
      `${dir}/index.html`,
      `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${attr(title)}</title>
<meta name="description" content="${attr(desc)}">
<meta property="og:title" content="${attr(title)}">
<meta property="og:description" content="${attr(desc)}">
<meta property="og:type" content="article">
<meta name="twitter:card" content="summary">
<meta name="twitter:title" content="${attr(title)}">
<meta name="twitter:description" content="${attr(desc)}">
<link rel="canonical" href="https://mohitagw15856.github.io/rulebook/#${g.slug}/${r.id}">
<meta http-equiv="refresh" content="0; url=${target}">
<link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🃏</text></svg>">
<style>body{background:#06070b;color:#f4f6fa;font-family:system-ui,sans-serif;padding:3rem 1.5rem;max-width:38rem;margin:0 auto;line-height:1.6}
a{color:#4ff0c0}.b{font:600 .72rem/1 ui-monospace,monospace;letter-spacing:.1em;color:${r.official ? '#4ff0c0' : '#ffc861'}}</style>
</head>
<body>
<p class="b">${badge}</p>
<h1>${attr(r.question)}</h1>
<p>${attr(trim(r.verdict, 400))}</p>
<p><a href="${target}">Open in rulebook →</a></p>
<script>location.replace(${JSON.stringify(target)});</script>
</body>
</html>
`
    );
    sharePages++;
  }
}

// -----------------------------------------------------------------------------
// A static JSON API. No server, no rate limit, no key — just files on a CDN.
// Anyone can build on the registry without asking, and it cannot go down
// independently of the site itself.
// -----------------------------------------------------------------------------
mkdirSync(`${OUT}/api/games`, { recursive: true });

const apiGame = (g) => ({
  ...g,
  url: `https://mohitagw15856.github.io/rulebook/#${g.slug}`,
  rulings: g.rulings.map((r) => ({
    ...r,
    url: `https://mohitagw15856.github.io/rulebook/r/${g.slug}/${r.id}/`,
  })),
});

writeFileSync(
  `${OUT}/api/index.json`,
  JSON.stringify(
    {
      name: 'rulebook',
      description: 'Board and card game rules, the house rules everyone plays, and which of them are real.',
      docs: 'https://github.com/mohitagw15856/rulebook#the-json-api',
      licence: { code: 'MIT', data: 'CC BY 4.0' },
      counts: {
        games: games.length,
        rulings: games.reduce((a, g) => a + g.rulings.length, 0),
        house_rules: games.flatMap((g) => g.rulings).filter((r) => !r.official).length,
      },
      endpoints: {
        all_games: '/api/games.json',
        one_game: '/api/games/{slug}.json',
        all_rulings: '/api/rulings.json',
        contested: '/api/hottest.json',
      },
      games: games.map((g) => ({ slug: g.slug, name: g.name, rulings: g.rulings.length })),
    },
    null,
    2
  )
);

writeFileSync(`${OUT}/api/games.json`, JSON.stringify(games.map(apiGame), null, 2));
for (const g of games) {
  writeFileSync(`${OUT}/api/games/${g.slug}.json`, JSON.stringify(apiGame(g), null, 2));
}
writeFileSync(
  `${OUT}/api/rulings.json`,
  JSON.stringify(
    games.flatMap((g) =>
      g.rulings.map((r) => ({
        ...r,
        game: g.slug,
        game_name: g.name,
        url: `https://mohitagw15856.github.io/rulebook/r/${g.slug}/${r.id}/`,
      }))
    ),
    null,
    2
  )
);
writeFileSync(
  `${OUT}/api/hottest.json`,
  JSON.stringify(
    games
      .flatMap((g) => g.rulings.map((r) => ({ ...r, game: g.slug, game_name: g.name })))
      .sort((a, b) => b.heat - a.heat)
      .slice(0, 40),
    null,
    2
  )
);

// -----------------------------------------------------------------------------
// Offline. The wifi at somebody else's flat is exactly where this has to work.
// -----------------------------------------------------------------------------
const scorerPaths = games.filter((g) => g.hasScore).map((g) => `./games/${g.slug}/score.mjs`);
const buildHash = createHash('sha256')
  .update(JSON.stringify(payload))
  .update(readFileSync(`${ROOT}web/app.js`))
  .update(readFileSync(`${ROOT}web/style.css`))
  .update(readFileSync(`${ROOT}web/index.html`))
  .digest('hex')
  .slice(0, 12);
writeFileSync(
  `${OUT}/sw.js`,
  `// Generated by scripts/build-site.mjs — do not edit.
// The cache name is a hash of everything cached. Keying it on anything
// coarser — a version number, a game count — means a corrected ruling never
// reaches anyone who has already visited, which is the worst possible failure
// for a project whose whole point is being right.
const CACHE = 'rulebook-${buildHash}';
const ASSETS = ${JSON.stringify(['./', './index.html', './style.css', './app.js', './lib/search.mjs', './lib/cards.mjs', ...scorerPaths], null, 2)};

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  // Drop caches from earlier builds; the name carries the content count.
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  // Cache first: the registry never changes between deploys, and being fast
  // with no signal matters more here than being seconds-fresh.
  e.respondWith(
    caches.match(e.request).then((hit) => hit || fetch(e.request).then((res) => {
      const copy = res.clone();
      caches.open(CACHE).then((c) => c.put(e.request, copy)).catch(() => {});
      return res;
    }).catch(() => caches.match('./index.html')))
  );
});
`
);

writeFileSync(
  `${OUT}/manifest.webmanifest`,
  JSON.stringify(
    {
      name: 'rulebook — settle the argument',
      short_name: 'rulebook',
      description: 'Board and card game rules, the house rules everyone plays, and which of them are real.',
      start_url: './',
      display: 'standalone',
      background_color: '#06070b',
      theme_color: '#06070b',
      icons: [{ src: './assets/logo.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' }],
    },
    null,
    2
  )
);

mkdirSync(`${OUT}/assets`, { recursive: true });
for (const a of ['banner.svg', 'logo.svg', 'demo.gif']) {
  copyFileSync(`${ROOT}assets/${a}`, `${OUT}/assets/${a}`);
}

// -----------------------------------------------------------------------------
// Print. A booklet of the whole registry, and a deck of ruling cards. Both are
// plain HTML with @page rules, so a browser is the only tool required.
// -----------------------------------------------------------------------------
mkdirSync(`${OUT}/print`, { recursive: true });

const esc2 = (s2) => String(s2 ?? '').replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
const para = (s2) => esc2(String(s2).replace(/\s+/g, ' ').trim());

// A very small markdown renderer — headings, bold, italic, lists, paragraphs.
// Enough for rules.md, and far less than a dependency.
function mdToHtml(md) {
  const inline = (t) =>
    esc2(t)
      .replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>')
      .replace(/\*([^*]+)\*/g, '<i>$1</i>')
      .replace(/`([^`]+)`/g, '<code>$1</code>');

  const out = [];
  let buf = [];       // the block being accumulated
  let mode = null;    // 'p' | 'li'
  let inList = false;

  // Source files are hard-wrapped, so a list item or paragraph routinely spans
  // several lines. Flushing per line splits them mid-sentence, which is how a
  // bullet became a bullet plus an orphaned paragraph.
  const flush = () => {
    if (!buf.length) return;
    const t = inline(buf.join(' ').replace(/\s+/g, ' ').trim());
    if (mode === 'li') out.push(`<li>${t}</li>`);
    else out.push(`<p>${t}</p>`);
    buf = [];
  };
  const closeList = () => {
    if (inList) { flush(); out.push('</ul>'); inList = false; }
  };

  for (const raw of md.split('\n')) {
    const line = raw.replace(/^# .*$/, '');
    const h = line.match(/^(#{2,4})\s+(.*)$/);
    const li = line.match(/^[-*]\s+(.*)$/);

    if (!line.trim()) { flush(); closeList(); mode = null; continue; }
    if (h) {
      flush();
      closeList();
      mode = null;
      out.push(`<h${h[1].length + 1}>${inline(h[2])}</h${h[1].length + 1}>`);
      continue;
    }
    if (li) {
      flush();
      if (!inList) { out.push('<ul>'); inList = true; }
      mode = 'li';
      buf.push(li[1]);
      continue;
    }
    // A continuation line: keep it with whatever block is open.
    if (mode === null) mode = 'p';
    buf.push(line.trim());
  }
  flush();
  closeList();
  return out.join('\n');
}

const booklet = `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<title>rulebook — the whole thing, on paper</title>
<style>
  @page { size: A4; margin: 18mm 16mm; }
  body { font: 10.5pt/1.55 Georgia, 'Times New Roman', serif; color: #1b1b1b; max-width: 46em; margin: 0 auto; padding: 2em 1em; }
  h1 { font-size: 30pt; margin: 0 0 .1em; letter-spacing: -.02em; }
  h1 + p { color: #666; font-style: italic; margin-top: 0; }
  h2 { font-size: 17pt; margin: 2.4em 0 .3em; page-break-before: always; border-bottom: 2px solid #1b1b1b; padding-bottom: .15em; }
  h2:first-of-type { page-break-before: avoid; }
  h3 { font-size: 11pt; text-transform: uppercase; letter-spacing: .1em; color: #7a7364; margin: 1.6em 0 .4em; font-family: Helvetica, Arial, sans-serif; }
  h4 { font-size: 11pt; margin: 1em 0 .2em; }
  p, li { orphans: 3; widows: 3; }
  table { width: 100%; border-collapse: collapse; font-size: 9.5pt; margin: .6em 0; }
  td { padding: .25em .5em .25em 0; border-bottom: 1px solid #eae5da; vertical-align: top; }
  td:first-child { color: #7a7364; white-space: nowrap; width: 30%; font-family: Helvetica, Arial, sans-serif; font-size: 8.5pt; }
  .rul { border-left: 3px solid #b8860b; padding-left: .8em; margin: .9em 0; page-break-inside: avoid; }
  .rul.off { border-left-color: #1a7f5a; }
  .k { font: bold 8pt Helvetica, Arial, sans-serif; letter-spacing: .08em; text-transform: uppercase; color: #b8860b; }
  .rul.off .k { color: #1a7f5a; }
  .toc { columns: 2; font-size: 10pt; }
  .toc a { color: #1b1b1b; text-decoration: none; }
  .fine { color: #7a7364; font-size: 9pt; }
  @media print { a { color: inherit; text-decoration: none; } }
</style></head>
<body>
<h1>rulebook</h1>
<p>The rules, the house rules, and which of them are actually real.</p>
<p class="fine">${games.length} games · ${games.reduce((a, g) => a + g.rulings.length, 0)} rulings ·
mohitagw15856.github.io/rulebook · Code MIT, data CC BY 4.0. Game names and
trademarks belong to their owners.</p>

<h3>Contents</h3>
<div class="toc">${games.map((g) => `<div><a href="#${g.slug}">${esc2(g.name)}</a></div>`).join('')}</div>

${games
  .map((g) => {
    const over = Math.round(minutes(g.playtime_actual) - minutes(g.playtime_box));
    return `
<h2 id="${g.slug}">${esc2(g.name)}</h2>
<p><i>${para(g.objective)}</i></p>
<table>
  <tr><td>players</td><td>${g.players.min === g.players.max ? g.players.min : `${g.players.min}–${g.players.max}`}${g.players.best ? `, best at ${g.players.best}` : ''}</td></tr>
  <tr><td>box says / really takes</td><td>${fmtDuration(g.playtime_box)} / <b>${fmtDuration(g.playtime_actual)}</b>${over > 0 ? ` (over by ${over} min)` : ''}</td></tr>
  <tr><td>setup / teach / pack away</td><td>${g.setup_time ? fmtDuration(g.setup_time) : '—'} / ${fmtDuration(g.teach_time)} / ${g.teardown_time ? fmtDuration(g.teardown_time) : '—'}</td></tr>
  <tr><td>between your turns</td><td>${fmtDuration(g.downtime)}</td></tr>
  <tr><td>works from age</td><td>${g.min_age}</td></tr>
  <tr><td>weight / luck</td><td>${g.weight} of 5 · ${g.luck}% chance</td></tr>
</table>

${mdToHtml(readFileSync(g.__rulesFile, 'utf8'))}

<h3>Settle the argument</h3>
${g.rulings
  .map(
    (r) => `<div class="rul ${r.official ? 'off' : ''}">
  <h4>${esc2(r.question)}</h4>
  <div class="k">${r.official ? 'official rule' : 'not an official rule'}</div>
  <p>${para(r.verdict)}</p>
  ${r.house_rule ? `<p><b>The house version:</b> ${para(r.house_rule)}</p>` : ''}
</div>`
  )
  .join('')}

${g.tiebreak ? `<h3>If the scores tie</h3><p>${para(g.tiebreak)}</p>` : ''}
<h3>When it is fair to stop</h3><p>${para(g.concession)}</p>
${g.handicaps?.length ? `<h3>Levelling it up</h3>${g.handicaps.map((h) => `<p><b>${esc2(h.for)}</b> — ${para(h.method)}</p>`).join('')}` : ''}
${g.cheats?.length ? `<h3>How people cheat</h3>${g.cheats.map((ch) => `<p>${para(ch.move)}<br><i>Spot it: ${para(ch.spot)}</i></p>`).join('')}` : ''}
<h3>If a piece is missing</h3><p>${para(g.substitutions)}</p>
<h3>Accessibility</h3><p>${para(g.accessibility)}</p>
`;
  })
  .join('')}
</body></html>`;

writeFileSync(`${OUT}/print/index.html`, booklet);
writeFileSync(`${OUT}/print/deck.html`, deckHtml(games));

// Jekyll would otherwise swallow anything it does not recognise.
writeFileSync(`${OUT}/.nojekyll`, '');

const rulings = games.reduce((a, g) => a + g.rulings.length, 0);
const kb = Math.round(JSON.stringify(payload).length / 1024);
console.log(
  `✓ built site/ — ${games.length} games, ${rulings} rulings (${kb} kB of data), ` +
    `${scorers} scorers client-side, ${sharePages} share pages, ${games.length + 4} API files, ` +
    `a ${Math.round(booklet.length / 1024)} kB booklet and a printable deck, offline-ready`
);
