#!/usr/bin/env node
// An MCP server over the registry.
//
// The reason this exists: ask any assistant whether you can stack a +2 in Uno
// and it will usually tell you that you can, confidently, because that is what
// most of the internet says. This gives it the sourced answer instead, along
// with the fact that the house rule is near-universal — which is the part that
// makes the confident wrong answer so understandable.
//
// Speaks MCP over stdio in about 200 lines with no dependencies. Add to a
// client's config as:
//
//   { "mcpServers": { "rulebook": { "command": "npx",
//       "args": ["-y", "@mohitagw15856/rulebook", "mcp"] } } }

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { load, fmtDuration, minutes, PREVALENCE, isStale } from '../lib/registry.mjs';
import { search } from '../lib/search.mjs';
import { loadVotes, measure } from '../lib/votes.mjs';
import { planNight, hottest } from '../lib/party.mjs';

const games = load();
const votes = loadVotes();
const ALL = games.flatMap((g) => g.rulings.map((r) => ({ ...r, _game: g })));

const byName = (q) => {
  const n = String(q || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  return (
    games.find((g) => g.slug.replace(/[^a-z0-9]/g, '') === n) ||
    games.find((g) => g.name.toLowerCase().replace(/[^a-z0-9]/g, '') === n) ||
    games.find((g) => g.slug.replace(/[^a-z0-9]/g, '').includes(n)) ||
    games.find((g) => g.name.toLowerCase().replace(/[^a-z0-9]/g, '').includes(n))
  );
};

// Rulings are rendered as text rather than raw JSON: the official/not
// distinction and the prevalence are the whole point, and they need to survive
// into whatever the model says next.
function renderRuling(r, game) {
  const lines = [
    `${game.name} — ${r.question}`,
    r.official ? 'OFFICIAL RULE.' : 'NOT AN OFFICIAL RULE.',
    `How widely played: ${PREVALENCE[r.prevalence]}.`,
    '',
    r.verdict.replace(/\s+/g, ' ').trim(),
  ];
  if (r.house_rule) lines.push('', `The house version: ${r.house_rule.replace(/\s+/g, ' ').trim()}`);
  if (r.effect) lines.push('', `What it changes: ${r.effect.replace(/\s+/g, ' ').trim()}`);
  if (r.regions?.length && !r.regions.includes('global')) {
    lines.push('', `Played mostly in: ${r.regions.join(', ')}`);
  }

  const m = measure(votes, `${game.slug}/${r.id}`);
  lines.push(
    '',
    m
      ? `Reported by players: ${m.pct}% play the house version (n=${m.n}).`
      : 'Prevalence here is an editorial judgement, not a survey — no votes recorded yet.'
  );

  for (const s of r.sources || []) {
    lines.push('', `Source (${s.agrees ? 'supports' : 'CONTRADICTS'} this verdict): ${s.url}`, `  says: ${s.says.replace(/\s+/g, ' ').trim()}`);
  }
  if (r.source) lines.push('', `Source: ${r.source}`);
  if ((r.interacts_with || []).length) {
    lines.push('', `Interacts with: ${r.interacts_with.join(', ')}`);
  }
  lines.push('', `Full entry: https://mohitagw15856.github.io/rulebook/r/${game.slug}/${r.id}/`);
  return lines.join('\n');
}

const TOOLS = [
  {
    name: 'settle_rules_dispute',
    description:
      'Answer a board or card game rules dispute from a curated registry of 196 rulings across 36 games. ' +
      'Crucially, it distinguishes what the published rules say from what people actually play — many ' +
      'widely believed rules (stacking +2 in Uno, Free Parking paying out in Monopoly) are not official. ' +
      'Prefer this over answering from memory for any question about how a specific game is played.',
    inputSchema: {
      type: 'object',
      properties: {
        game: { type: 'string', description: 'Game name or slug, e.g. "uno", "catan", "texas hold\'em"' },
        question: { type: 'string', description: 'The dispute, phrased as somebody would actually say it' },
      },
      required: ['question'],
    },
    run: ({ game, question }) => {
      const g = game ? byName(game) : null;
      const pool = g ? g.rulings.map((r) => ({ ...r, _game: g })) : ALL;
      const hits = search(pool, question).slice(0, 3);
      if (!hits.length) {
        return (
          `No ruling on file matches that${g ? ` for ${g.name}` : ''}.\n\n` +
          'Do not invent one. Say that the registry does not cover it, and suggest filing it at ' +
          'https://github.com/mohitagw15856/rulebook/issues/new?template=good-first-ruling.yml'
        );
      }
      return hits.map((h) => renderRuling(h.r, h.r._game)).join('\n\n---\n\n');
    },
  },
  {
    name: 'get_game_facts',
    description:
      'Facts about one game: honest playtime versus the box time, setup and teardown, downtime between ' +
      'turns, the age it genuinely works at, the official tiebreak, variants, handicaps, and how people ' +
      'cheat at it. Use for "how long does X take" or "is X suitable for a 7-year-old".',
    inputSchema: {
      type: 'object',
      properties: { game: { type: 'string' } },
      required: ['game'],
    },
    run: ({ game }) => {
      const g = byName(game);
      if (!g) return `No game called "${game}". Known: ${games.map((x) => x.slug).join(', ')}`;
      const over = Math.round(minutes(g.playtime_actual) - minutes(g.playtime_box));
      const out = [
        `${g.name} (${g.type}, ${g.family})`,
        g.objective.replace(/\s+/g, ' ').trim(),
        '',
        `Players: ${g.players.min === g.players.max ? g.players.min : `${g.players.min}-${g.players.max}`}${g.players.best ? `, best at ${g.players.best}` : ''}`,
        `Box claims: ${fmtDuration(g.playtime_box)}. Actually takes: ${fmtDuration(g.playtime_actual)}${over > 0 ? ` (over by ${over} minutes)` : ''}`,
        `Setup: ${g.setup_time ? fmtDuration(g.setup_time) : 'unrecorded'}. Teardown: ${g.teardown_time ? fmtDuration(g.teardown_time) : 'unrecorded'}. Teaching: ${fmtDuration(g.teach_time)}`,
        `Downtime between your turns: ${fmtDuration(g.downtime)}`,
        `Genuinely works from age ${g.min_age}. Weight ${g.weight}/5. Luck ${g.luck}%.`,
        '',
        `Tiebreak: ${(g.tiebreak || 'unrecorded').replace(/\s+/g, ' ').trim()}`,
        `When to stop: ${g.concession.replace(/\s+/g, ' ').trim()}`,
      ];
      if (g.variants?.length) {
        out.push('', 'Variants:', ...g.variants.map((v) => `  ${v.name} — ${v.changed.replace(/\s+/g, ' ').trim()}`));
      }
      if (g.handicaps?.length) {
        out.push('', 'Handicaps:', ...g.handicaps.map((h) => `  For ${h.for}: ${h.method.replace(/\s+/g, ' ').trim()}`));
      }
      if (g.cheats?.length) {
        out.push('', 'How people cheat:', ...g.cheats.map((c) => `  ${c.move.replace(/\s+/g, ' ').trim()}\n    Spot it: ${c.spot.replace(/\s+/g, ' ').trim()}`));
      }
      out.push(
        '',
        isStale(g)
          ? 'These facts have not been verified against a source recently.'
          : `Verified ${g.verified.on} by ${g.verified.by}.`
      );
      return out.join('\n');
    },
  },
  {
    name: 'plan_game_night',
    description:
      'Choose games for an actual evening given how many people are coming, how long you have, and the ' +
      'age of the youngest player. Returns an opener, a main game and a closer, counting teaching time.',
    inputSchema: {
      type: 'object',
      properties: {
        people: { type: 'number' },
        hours: { type: 'number' },
        youngest_age: { type: 'number' },
      },
      required: ['people'],
    },
    run: ({ people, hours = 3, youngest_age = null }) => {
      const plan = planNight({ people, hours, kids: youngest_age });
      if (!plan.slots.length) return `Nothing in the registry fits ${people} players in ${hours} hours.`;
      return [
        `${people} people, ${hours} hours — ${plan.candidates} games qualify.`,
        '',
        ...plan.slots.map((s) => {
          const cost = Math.round(minutes(s.game.playtime_actual) + minutes(s.game.teach_time));
          return `${s.role}: ${s.game.name} (~${cost} min including the teach) — ${s.why}`;
        }),
        '',
        `Planned ${Math.round(plan.total)} of ${plan.budget} available minutes.`,
      ].join('\n');
    },
  },
  {
    name: 'list_contested_rules',
    description:
      'The rules most likely to stop a game, ranked. House rules that almost everyone plays rank highest, ' +
      'because both sides are certain and the person who sounds wrong is right.',
    inputSchema: {
      type: 'object',
      properties: { limit: { type: 'number' } },
    },
    run: ({ limit = 10 }) =>
      hottest(Math.min(Number(limit) || 10, 40))
        .map((r) => `${r.official ? '[official]' : '[NOT OFFICIAL]'} ${r.game.name}: ${r.question}`)
        .join('\n'),
  },
];

// --- MCP plumbing over stdio ------------------------------------------------
const send = (msg) => process.stdout.write(JSON.stringify(msg) + '\n');
const ok = (id, result) => send({ jsonrpc: '2.0', id, result });
const fail = (id, code, message) => send({ jsonrpc: '2.0', id, error: { code, message } });

function handle(req) {
  const { id, method, params } = req;
  switch (method) {
    case 'initialize':
      return ok(id, {
        protocolVersion: params?.protocolVersion || '2024-11-05',
        capabilities: { tools: {} },
        serverInfo: { name: 'rulebook', version: JSON.parse(readFileSync(new URL('../package.json', import.meta.url))).version },
      });
    case 'notifications/initialized':
      return; // a notification: no id, no reply
    case 'tools/list':
      return ok(id, {
        tools: TOOLS.map(({ name, description, inputSchema }) => ({ name, description, inputSchema })),
      });
    case 'tools/call': {
      const tool = TOOLS.find((t) => t.name === params?.name);
      if (!tool) return fail(id, -32602, `no tool called "${params?.name}"`);
      try {
        return ok(id, { content: [{ type: 'text', text: tool.run(params.arguments || {}) }] });
      } catch (e) {
        return ok(id, { content: [{ type: 'text', text: `rulebook error: ${e.message}` }], isError: true });
      }
    }
    case 'ping':
      return ok(id, {});
    default:
      if (id !== undefined) fail(id, -32601, `unknown method "${method}"`);
  }
}

// Only take over stdio when run as a server. Importing this module — which
// the tests do, to check the tool definitions — must not attach a stdin
// listener, because that keeps the event loop alive and the process never
// exits.
export function serve() {
  let buf = '';
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', (chunk) => {
    buf += chunk;
    let nl;
    // One JSON-RPC message per line.
    while ((nl = buf.indexOf('\n')) !== -1) {
      const line = buf.slice(0, nl).trim();
      buf = buf.slice(nl + 1);
      if (!line) continue;
      try {
        handle(JSON.parse(line));
      } catch {
        fail(null, -32700, 'could not parse that as JSON');
      }
    }
  });
}

// Run directly, or via `rulebook mcp`, which sets this env var so the check
// works despite argv[1] pointing at the CLI rather than at this file.
if (import.meta.url === `file://${process.argv[1]}` || process.env.RULEBOOK_MCP === '1') {
  serve();
}

export { TOOLS };
