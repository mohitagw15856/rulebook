#!/usr/bin/env node
// Guards the one legal line this repo must not cross.
//
// How a game is played is not copyrightable — that is the idea/expression
// split, settled in the US since Baker v. Selden (1879) and stated plainly in
// 37 CFR 202.1(b): "the idea for a game" is not subject to copyright. What IS
// copyrightable is the publisher's *wording*: their rulebook text, their
// diagrams, their card text, their box copy.
//
// So the rule for this repo is simple. Read the official rules, understand
// them, then write them in your own words. Never paste.
//
// This script cannot read a publisher's rulebook and diff against it, so it
// does not pretend to. It checks the things that are checkable and that catch
// real mistakes:
//
//   1. Every game cites where its rules were checked against.
//   2. No copyright or trademark notices got carried across with a paste.
//   3. No long verbatim quotations.
//   4. No sentence appears in two games — the fingerprint of a copy-paste.
//   5. No blocks of shouting caps, which is what scanned rulebooks look like.
//
// A clean run is not a legal opinion. It means nothing obvious is wrong.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { load } from '../lib/registry.mjs';

const ROOT = fileURLToPath(new URL('../', import.meta.url));
const games = load();
const problems = [];
const warnings = [];

const MARKERS = [
  [/©|\(c\)\s*\d{4}|copyright\s+\d{4}/i, 'a copyright notice'],
  [/all rights reserved/i, 'an "all rights reserved" notice'],
  [/®|™/, 'a ® or ™ symbol (describe the game, do not reproduce its branding)'],
  [/reprinted (from|with)|excerpted from|used with permission/i, 'reprint language'],
  [/^\s*(official )?rules? (of|for) play\b.*\bversion \d/im, 'a rulebook version header'],
];

// Sentences seen so far, mapped to where. Two games sharing a sentence means
// one was pasted from the other, or both from somewhere else.
const seen = new Map();

const sentences = (text) =>
  text
    // Strip code, links and headings — shared boilerplate there is fine.
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`]*`/g, ' ')
    .replace(/^#{1,6} .*$/gm, ' ')
    .replace(/https?:\/\/\S+/g, ' ')
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.replace(/\s+/g, ' ').trim())
    .filter((s) => s.split(' ').length >= 8);

for (const g of games) {
  const at = g.__dir;

  if (!Array.isArray(g.sources) || !g.sources.length) {
    problems.push(`${at}/game.yml: no "sources" — every game must say what its rules were checked against`);
  }

  for (const file of ['rules.md', 'teach.md']) {
    const path = `${ROOT}${at}/${file}`;
    let text;
    try {
      text = readFileSync(path, 'utf8');
    } catch {
      continue;
    }

    for (const [re, what] of MARKERS) {
      const m = text.match(re);
      if (m) problems.push(`${at}/${file}: contains ${what} — "${m[0].trim()}"`);
    }

    // Long verbatim quotations *from a publisher*. Quotation marks alone mean
    // nothing here — a teach script is mostly lines to say out loud, and
    // "Priya, do you have any sevens?" is the author's own writing. What
    // matters is a long quote presented as somebody else's text, so the check
    // only fires when there is an attribution just before it.
    const ATTRIBUTION = /(according to|the rulebook|official rules?|the rules? (state|say)|publisher|Mattel|Hasbro|Ravensburger|Kosmos|states:|reads:|quote:)[^.]{0,80}$/i;
    for (const m of text.matchAll(/[“"]([^”"\n]{40,})[”"]/g)) {
      const before = text.slice(Math.max(0, m.index - 200), m.index);
      if (!ATTRIBUTION.test(before)) continue;
      const words = m[1].split(/\s+/).length;
      if (words > 25) {
        problems.push(
          `${at}/${file}: a ${words}-word quotation of somebody else's text. ` +
            'Quote a line to make a point; do not reproduce a passage.'
        );
      } else if (words > 15) {
        warnings.push(`${at}/${file}: a ${words}-word attributed quotation — check it is doing necessary work.`);
      }
    }

    // Shouting. Real rulebooks are full of it; original prose is not.
    for (const line of text.split('\n')) {
      const caps = line.replace(/[^A-Za-z]/g, '');
      if (caps.length > 25 && caps === caps.toUpperCase()) {
        warnings.push(`${at}/${file}: an all-caps line, which is how pasted rulebook text usually looks.`);
      }
    }

    for (const s of sentences(text)) {
      const key = s.toLowerCase().replace(/[^a-z0-9 ]/g, '');
      const prior = seen.get(key);
      if (prior && prior.slug !== g.slug) {
        problems.push(`${at}/${file}: this sentence also appears in ${prior.where} — "${s.slice(0, 70)}…"`);
      } else if (!prior) {
        seen.set(key, { slug: g.slug, where: `${at}/${file}` });
      }
    }
  }
}

for (const w of warnings) console.log(`  ! ${w}`);
if (problems.length) {
  console.error(`\n✗ ${problems.length} problem(s):\n`);
  for (const p of problems) console.error(`  ✗ ${p}`);
  console.error(
    '\nRules are not copyrightable. Somebody\'s wording is. Read it, close it, then write it yourself.\n'
  );
  process.exit(1);
}
console.log(
  `✓ ${games.length} games written in their own words` +
    (warnings.length ? ` (${warnings.length} warning(s) above)` : '')
);
