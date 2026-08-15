// Minimal YAML subset parser. Zero dependencies, on purpose.
//
// Supported: nested maps, lists, 2-space indentation, scalars (string, number
// with _ separators, bool, null, dates), single/double quoted strings, inline
// arrays [a, b, c], block scalars (| and >), # comments, --- frontmatter.
//
// Not supported (and deliberately so — the data files in this repo do not use
// them): anchors, aliases, tags, flow maps spanning lines, multi-document
// streams. If you need those, the schema is too complicated.

function stripComment(s) {
  let out = '';
  let inSingle = false;
  let inDouble = false;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (c === "'" && !inDouble) inSingle = !inSingle;
    else if (c === '"' && !inSingle) inDouble = !inDouble;
    else if (c === '#' && !inSingle && !inDouble && (i === 0 || /\s/.test(s[i - 1]))) break;
    out += c;
  }
  return out.replace(/\s+$/, '');
}

function splitTop(s) {
  const parts = [];
  let depth = 0;
  let cur = '';
  let inSingle = false;
  let inDouble = false;
  for (const c of s) {
    if (c === "'" && !inDouble) inSingle = !inSingle;
    else if (c === '"' && !inSingle) inDouble = !inDouble;
    if (!inSingle && !inDouble) {
      if (c === '[' || c === '{') depth++;
      else if (c === ']' || c === '}') depth--;
      else if (c === ',' && depth === 0) {
        parts.push(cur);
        cur = '';
        continue;
      }
    }
    cur += c;
  }
  if (cur.trim() !== '') parts.push(cur);
  return parts;
}

export function parseScalar(raw) {
  const v = String(raw).trim();
  if (v === '') return null;

  if (v.length >= 2 && v[0] === '"' && v[v.length - 1] === '"') {
    return v
      .slice(1, -1)
      .replace(/\\n/g, '\n')
      .replace(/\\t/g, '\t')
      .replace(/\\"/g, '"')
      .replace(/\\\\/g, '\\');
  }
  if (v.length >= 2 && v[0] === "'" && v[v.length - 1] === "'") {
    return v.slice(1, -1).replace(/''/g, "'");
  }

  if (v === 'null' || v === '~') return null;
  if (v === 'true' || v === 'yes' || v === 'on') return true;
  if (v === 'false' || v === 'no' || v === 'off') return false;

  if (v[0] === '[' && v[v.length - 1] === ']') {
    const body = v.slice(1, -1).trim();
    return body === '' ? [] : splitTop(body).map(parseScalar);
  }
  if (v[0] === '{' && v[v.length - 1] === '}') {
    const body = v.slice(1, -1).trim();
    const obj = {};
    if (body === '') return obj;
    for (const pair of splitTop(body)) {
      const idx = pair.indexOf(':');
      if (idx === -1) continue;
      obj[pair.slice(0, idx).trim()] = parseScalar(pair.slice(idx + 1));
    }
    return obj;
  }

  if (/^-?\d[\d_]*$/.test(v)) return Number(v.replace(/_/g, ''));
  if (/^-?\d[\d_]*\.\d+$/.test(v)) return Number(v.replace(/_/g, ''));
  if (/^-?\d+(\.\d+)?[eE][-+]?\d+$/.test(v)) return Number(v);

  return v;
}

function classify(raw) {
  if (/^\s*$/.test(raw)) return { blank: true, raw };
  if (/^\s*#/.test(raw)) return { comment: true, raw, indent: raw.match(/^ */)[0].length };
  return { raw, indent: raw.match(/^ */)[0].length };
}

function nextIdx(ctx) {
  while (ctx.i < ctx.lines.length) {
    const l = ctx.lines[ctx.i];
    if (l.blank || l.comment) {
      ctx.i++;
      continue;
    }
    return ctx.i;
  }
  return -1;
}

function readBlockScalar(ctx, indent, marker) {
  const out = [];
  let childIndent = null;
  while (ctx.i < ctx.lines.length) {
    const l = ctx.lines[ctx.i];
    if (l.blank) {
      out.push('');
      ctx.i++;
      continue;
    }
    const ind = l.raw.match(/^ */)[0].length;
    if (ind <= indent) break;
    if (childIndent === null) childIndent = ind;
    out.push(l.raw.slice(childIndent));
    ctx.i++;
  }
  while (out.length && out[out.length - 1] === '') out.pop();
  const folded = marker[0] === '>';
  if (!folded) return out.join('\n');
  const paragraphs = out.join('\n').split(/\n{2,}/);
  return paragraphs.map((p) => p.split('\n').join(' ')).join('\n\n');
}

const MAP_KEY = /^([^:\n]+):(?:\s+([\s\S]*))?$/;

function looksLikeMapStart(s) {
  if (s[0] === '"' || s[0] === "'" || s[0] === '[' || s[0] === '{') return false;
  const m = s.match(/^([^:]+):(\s|$)/);
  return Boolean(m);
}

function parseMap(ctx, indent) {
  const obj = {};
  for (;;) {
    const i = nextIdx(ctx);
    if (i < 0) break;
    const l = ctx.lines[i];
    if (l.indent < indent) break;
    if (l.indent > indent) {
      throw new Error(`unexpected indent on line ${i + 1}: ${l.raw}`);
    }
    const content = stripComment(l.raw.slice(indent));
    if (content === '') {
      ctx.i = i + 1;
      continue;
    }
    if (content.startsWith('- ') || content === '-') break;

    const m = content.match(MAP_KEY);
    if (!m) throw new Error(`cannot parse line ${i + 1}: ${l.raw}`);

    const key = parseScalar(m[1]);
    const inline = m[2] === undefined ? '' : m[2].trim();
    ctx.i = i + 1;

    if (inline === '|' || inline === '|-' || inline === '>' || inline === '>-') {
      obj[key] = readBlockScalar(ctx, indent, inline);
      continue;
    }
    if (inline !== '') {
      obj[key] = parseScalar(inline);
      continue;
    }

    const j = nextIdx(ctx);
    if (j < 0) {
      obj[key] = null;
      continue;
    }
    const nl = ctx.lines[j];
    const nContent = stripComment(nl.raw.slice(Math.min(nl.indent, nl.raw.length)));
    if (nl.indent > indent) {
      obj[key] = parseBlock(ctx, nl.indent);
    } else if (nl.indent === indent && (nContent.startsWith('- ') || nContent === '-')) {
      obj[key] = parseList(ctx, indent);
    } else {
      obj[key] = null;
    }
  }
  return obj;
}

function parseList(ctx, indent) {
  const arr = [];
  for (;;) {
    const i = nextIdx(ctx);
    if (i < 0) break;
    const l = ctx.lines[i];
    if (l.indent < indent) break;
    if (l.indent > indent) throw new Error(`unexpected indent on line ${i + 1}: ${l.raw}`);

    const content = stripComment(l.raw.slice(indent));
    if (!content.startsWith('-')) break;
    if (content.length > 1 && content[1] !== ' ') break;

    let k = 1;
    while (content[k] === ' ') k++;
    const rest = content.slice(k);
    const childIndent = indent + k;

    if (rest === '') {
      ctx.i = i + 1;
      const j = nextIdx(ctx);
      if (j >= 0 && ctx.lines[j].indent > indent) arr.push(parseBlock(ctx, ctx.lines[j].indent));
      else arr.push(null);
      continue;
    }

    if (looksLikeMapStart(rest)) {
      // Rewrite "- key: value" as a plain map line at childIndent so the map
      // parser can pick up any continuation lines below it.
      ctx.lines[i] = { raw: ' '.repeat(childIndent) + rest, indent: childIndent };
      ctx.i = i;
      arr.push(parseMap(ctx, childIndent));
      continue;
    }

    ctx.i = i + 1;
    arr.push(parseScalar(rest));
  }
  return arr;
}

function parseBlock(ctx, indent) {
  const i = nextIdx(ctx);
  if (i < 0) return null;
  const content = stripComment(ctx.lines[i].raw.slice(indent));
  if (content.startsWith('- ') || content === '-') return parseList(ctx, indent);
  return parseMap(ctx, indent);
}

export function parseYaml(text) {
  let src = String(text).replace(/\r\n/g, '\n');
  src = src.replace(/^---\s*\n/, '');
  const lines = src.split('\n').map(classify);
  const ctx = { i: 0, lines };
  const out = parseBlock(ctx, 0);
  return out === null ? {} : out;
}

export function parseFrontmatter(text) {
  const src = String(text).replace(/\r\n/g, '\n');
  const m = src.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!m) return { data: {}, body: src };
  return { data: parseYaml(m[1]), body: src.slice(m[0].length) };
}
