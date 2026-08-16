#!/usr/bin/env node
// A Slack and Discord bot, in one file, with no dependencies.
//
// The argument is usually already happening in a group chat by the time
// anybody thinks to look a rule up. This puts the verdict in the channel.
//
//   Slack:   /rulebook uno stacking
//   Discord: /rulebook game:uno question:stacking
//
// Run it anywhere that can expose a port:
//
//   SLACK_SIGNING_SECRET=... DISCORD_PUBLIC_KEY=... node bots/server.mjs
//
// Both platforms require request signature verification, and both are
// satisfied by node:crypto — HMAC-SHA256 for Slack, Ed25519 for Discord — so
// there is still nothing to install.

import { createServer } from 'node:http';
import { createHmac, timingSafeEqual, verify as cryptoVerify, createPublicKey } from 'node:crypto';
import { load, PREVALENCE } from '../lib/registry.mjs';
import { search } from '../lib/search.mjs';

const PORT = Number(process.env.PORT) || 3000;
const SITE = 'https://mohitagw15856.github.io/rulebook';
const games = load();
const ALL = games.flatMap((g) => g.rulings.map((r) => ({ ...r, _game: g })));

const byName = (q) => {
  const n = String(q || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  if (!n) return null;
  return (
    games.find((g) => g.slug.replace(/[^a-z0-9]/g, '') === n) ||
    games.find((g) => g.name.toLowerCase().replace(/[^a-z0-9]/g, '') === n) ||
    games.find((g) => g.slug.replace(/[^a-z0-9]/g, '').includes(n))
  );
};

// --- the shared answer ------------------------------------------------------
export function answer(text) {
  const words = String(text || '').trim();
  if (!words) {
    return {
      title: 'rulebook',
      body: `Ask me about a rule. For example: \`/rulebook uno can I stack a draw 2\`\n\n${games.length} games, ${ALL.length} rulings.`,
      official: null,
    };
  }

  // The first word is often the game. If it names one, search only that game;
  // if not, search everything, because "free parking" needs no game name.
  const first = words.split(/\s+/)[0];
  const game = byName(first);
  const rest = game ? words.slice(first.length).trim() : words;
  const pool = game ? game.rulings.map((r) => ({ ...r, _game: game })) : ALL;
  const hits = search(pool, rest || words);

  if (!hits.length) {
    return {
      title: 'Nothing on file matches that',
      body:
        `No ruling for “${words}”${game ? ` in ${game.name}` : ''}.\n` +
        `If it is a real dispute, it is worth adding: ${SITE}`,
      official: null,
    };
  }

  const r = hits[0].r;
  const g = r._game;
  const parts = [
    r.official ? '✅ *This is an official rule.*' : '⚠️ *This is NOT an official rule.*',
    `_${PREVALENCE[r.prevalence]}._`,
    '',
    r.verdict.replace(/\s+/g, ' ').trim(),
  ];
  if (r.house_rule) parts.push('', `*The house version:* ${r.house_rule.replace(/\s+/g, ' ').trim()}`);
  parts.push('', `${SITE}/r/${g.slug}/${r.id}/`);

  return { title: `${g.name} — ${r.question}`, body: parts.join('\n'), official: r.official };
}

// --- Slack ------------------------------------------------------------------
// Signature is HMAC-SHA256 over "v0:timestamp:rawbody".
export function verifySlack(rawBody, timestamp, signature, secret) {
  if (!secret || !timestamp || !signature) return false;
  // Reject anything older than five minutes, which is Slack's own guidance
  // and what stops a captured request being replayed.
  if (Math.abs(Date.now() / 1000 - Number(timestamp)) > 300) return false;
  const mine = 'v0=' + createHmac('sha256', secret).update(`v0:${timestamp}:${rawBody}`).digest('hex');
  const a = Buffer.from(mine);
  const b = Buffer.from(signature);
  return a.length === b.length && timingSafeEqual(a, b);
}

// --- Discord ----------------------------------------------------------------
// Signature is Ed25519 over timestamp + rawbody, against the app's public key.
export function verifyDiscord(rawBody, timestamp, signature, publicKeyHex) {
  if (!publicKeyHex || !timestamp || !signature) return false;
  try {
    // Node needs a DER-wrapped key; the 12-byte prefix is the Ed25519 SPKI header.
    const der = Buffer.concat([
      Buffer.from('302a300506032b6570032100', 'hex'),
      Buffer.from(publicKeyHex, 'hex'),
    ]);
    const key = createPublicKey({ key: der, format: 'der', type: 'spki' });
    return cryptoVerify(null, Buffer.from(timestamp + rawBody), key, Buffer.from(signature, 'hex'));
  } catch {
    return false;
  }
}

// --- HTTP -------------------------------------------------------------------
const readBody = (req) =>
  new Promise((resolve) => {
    let b = '';
    req.on('data', (c) => (b += c));
    req.on('end', () => resolve(b));
  });

const server = createServer(async (req, res) => {
  const send = (code, body, type = 'application/json') => {
    res.writeHead(code, { 'content-type': type });
    res.end(typeof body === 'string' ? body : JSON.stringify(body));
  };

  if (req.method === 'GET' && req.url === '/health') {
    return send(200, { ok: true, games: games.length, rulings: ALL.length });
  }
  if (req.method !== 'POST') return send(405, { error: 'post only' });

  const raw = await readBody(req);

  // ---- Slack slash command
  if (req.url === '/slack') {
    const ok = verifySlack(
      raw,
      req.headers['x-slack-request-timestamp'],
      req.headers['x-slack-signature'],
      process.env.SLACK_SIGNING_SECRET
    );
    if (!ok) return send(401, { error: 'bad signature' });

    const text = decodeURIComponent((raw.match(/(?:^|&)text=([^&]*)/) || [, ''])[1].replace(/\+/g, ' '));
    const a = answer(text);
    return send(200, {
      response_type: 'in_channel', // the whole table should see it
      blocks: [
        { type: 'header', text: { type: 'plain_text', text: a.title.slice(0, 150) } },
        { type: 'section', text: { type: 'mrkdwn', text: a.body.slice(0, 2900) } },
      ],
    });
  }

  // ---- Discord interaction
  if (req.url === '/discord') {
    const ok = verifyDiscord(
      raw,
      req.headers['x-signature-timestamp'],
      req.headers['x-signature-ed25519'],
      process.env.DISCORD_PUBLIC_KEY
    );
    if (!ok) return send(401, 'invalid request signature', 'text/plain');

    const body = JSON.parse(raw || '{}');
    if (body.type === 1) return send(200, { type: 1 }); // Discord's PING handshake

    const opts = body.data?.options || [];
    const get = (n) => opts.find((o) => o.name === n)?.value || '';
    const a = answer([get('game'), get('question')].filter(Boolean).join(' '));
    return send(200, {
      type: 4,
      data: {
        embeds: [
          {
            title: a.title.slice(0, 250),
            description: a.body.replace(/\*/g, '**').slice(0, 4000),
            color: a.official === null ? 0x6a7383 : a.official ? 0x4ff0c0 : 0xffc861,
          },
        ],
      },
    });
  }

  send(404, { error: 'try /slack, /discord or /health' });
});

// Only listen when run directly, so the module can be imported by tests.
if (import.meta.url === `file://${process.argv[1]}`) {
  server.listen(PORT, () => {
    console.log(`rulebook bot on :${PORT}`);
    console.log(`  POST /slack    ${process.env.SLACK_SIGNING_SECRET ? 'ready' : 'set SLACK_SIGNING_SECRET'}`);
    console.log(`  POST /discord  ${process.env.DISCORD_PUBLIC_KEY ? 'ready' : 'set DISCORD_PUBLIC_KEY'}`);
  });
}

export { server };
