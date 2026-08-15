// Your table's constitution.
//
// A .rulebookrc file declares which house rules your group actually plays, so
// that `rulebook ruling` answers with *your* version first and the published
// rule second. Commit it to a repo, drop it in a group chat, or keep it in your
// home directory — it is the answer to "how do you lot play it?"
//
// Searched upward from the working directory, then in ~/.rulebook/, so a
// project folder can override a personal default.

import { readFileSync, existsSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { STORE_DIR } from './store.mjs';
import { parseYaml } from './yaml.mjs';

export const FILENAMES = ['.rulebookrc', '.rulebookrc.yml'];

export function findConfig(from = process.cwd()) {
  let dir = resolve(from);
  for (;;) {
    for (const name of FILENAMES) {
      const p = join(dir, name);
      if (existsSync(p)) return p;
    }
    const up = dirname(dir);
    if (up === dir) break;
    dir = up;
  }
  for (const name of FILENAMES) {
    const p = join(STORE_DIR, name);
    if (existsSync(p)) return p;
  }
  return null;
}

// Shape:
//   table: The Thursday Lot
//   house_rules:
//     uno/stacking-draw-cards: yes      # we play the house version
//     monopoly/free-parking-jackpot: no # we play it properly
//   notes:
//     uno/draw-until-playable: We draw three, not until playable.
export function loadConfig(from) {
  const path = findConfig(from);
  if (!path) return null;
  let raw;
  try {
    raw = parseYaml(readFileSync(path, 'utf8'));
  } catch (e) {
    return { path, error: `could not read ${path}: ${e.message}`, houseRules: {}, notes: {} };
  }
  // The Norway problem again: `no` is a perfectly reasonable answer to "do you
  // play this house rule?", so coerce rather than demand quoting.
  const houseRules = {};
  for (const [k, v] of Object.entries(raw.house_rules || {})) {
    houseRules[k] = v === true || v === 'yes' || v === 'true' || v === 1;
  }
  return {
    path,
    table: raw.table || null,
    houseRules,
    notes: raw.notes || {},
  };
}

// What does this table do about this ruling? Returns null when the config says
// nothing, which is different from saying no.
export function tableRuling(config, gameSlug, rulingId) {
  if (!config) return null;
  const key = `${gameSlug}/${rulingId}`;
  const plays = key in config.houseRules ? config.houseRules[key] : null;
  const note = config.notes?.[key] || null;
  if (plays === null && !note) return null;
  return { plays, note, table: config.table };
}
