#!/usr/bin/env node
// Checks every source URL in the registry.
//
// Two failure modes, and they are not the same thing:
//
//   dead     — 404, 410, or the host no longer resolves. The source is gone
//              and the claim it backed needs a new one.
//   blocked  — 403 or 429. The page is almost certainly fine; a bot filter
//              turned us away. Reported, never failed on.
//
// A 200 is also not proof. A publisher can redirect a retired rules page to
// their homepage, which answers 200 and contains none of the claim. This
// script cannot see that. It catches the links that are obviously broken.

import { load } from '../lib/registry.mjs';

const games = load();
const urls = new Map(); // url -> [where]
const add = (url, where) => {
  if (!/^https?:\/\//.test(String(url || ''))) return;
  if (!urls.has(url)) urls.set(url, []);
  urls.get(url).push(where);
};

for (const g of games) {
  for (const s of g.sources || []) add(s, `${g.__dir}/game.yml`);
  for (const r of g.rulings) {
    add(r.source, `${g.__dir}/rulings.yml#${r.id}`);
    for (const src of r.sources || []) add(src.url, `${g.__dir}/rulings.yml#${r.id}`);
  }
  // Somewhere to play is a promise too — a dead one wastes somebody's evening.
  for (const p of g.play_online || []) add(p.url, `${g.__dir}/game.yml (play: ${p.name})`);
}

const dead = [];
const blocked = [];
let ok = 0;

async function check(url) {
  const attempt = (method) =>
    fetch(url, {
      method,
      redirect: 'follow',
      signal: AbortSignal.timeout(20000),
      headers: {
        // Some hosts 403 anything without a browser-shaped UA.
        'user-agent': 'Mozilla/5.0 (compatible; rulebook-link-check/1.0; +https://github.com/mohitagw15856/rulebook)',
        accept: 'text/html,application/xhtml+xml,*/*',
      },
    });
  try {
    let res = await attempt('HEAD');
    // A fair number of servers do not implement HEAD properly.
    if (res.status === 405 || res.status === 501 || res.status === 404) res = await attempt('GET');
    return { status: res.status };
  } catch (e) {
    return { status: 0, error: e.message };
  }
}

const entries = [...urls.entries()];
console.log(`Checking ${entries.length} source URL(s) across ${games.length} games…\n`);

for (const [url, where] of entries) {
  const { status, error } = await check(url);
  if (status === 403 || status === 429) {
    blocked.push({ url, status, where });
    console.log(`  ~ ${status} ${url}  (bot filter, not a dead link)`);
  } else if (status === 0) {
    dead.push({ url, status: error, where });
    console.log(`  ✗ unreachable ${url}  (${error})`);
  } else if (status >= 400) {
    dead.push({ url, status, where });
    console.log(`  ✗ ${status} ${url}`);
  } else {
    ok++;
  }
}

console.log(`\n${ok} fine, ${blocked.length} blocked by bot filters, ${dead.length} dead.`);

if (dead.length) {
  console.error('\nDead sources:\n');
  for (const d of dead) console.error(`  ${d.url}\n    ${d.status}\n    cited by: ${d.where.join(', ')}`);
  console.error('\nA claim whose source is gone needs a new source, not a quiet deletion.\n');
  process.exit(1);
}
