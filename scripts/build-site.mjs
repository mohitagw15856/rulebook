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

// Jekyll would otherwise swallow anything it does not recognise.
writeFileSync(`${OUT}/.nojekyll`, '');

const rulings = games.reduce((a, g) => a + g.rulings.length, 0);
const kb = Math.round(JSON.stringify(payload).length / 1024);
console.log(
  `✓ built site/ — ${games.length} games, ${rulings} rulings (${kb} kB of data), ` +
    `${scorers} scorers client-side, ${sharePages} share pages, offline-ready`
);
