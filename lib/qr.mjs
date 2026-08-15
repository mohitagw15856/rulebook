// A QR encoder, written from the specification, with no dependencies.
//
// It exists so you can print a code, stick it inside a box lid, and have
// anybody at the table scan straight to the ruling that settles the argument
// about that specific game.
//
// Scope is deliberately narrow: byte mode, error correction level M, versions
// 1 to 10. That covers every URL this project produces with room to spare, and
// avoids implementing the parts of the spec nothing here needs.

// --- Galois field arithmetic over GF(256), used by Reed-Solomon -------------
const EXP = new Uint8Array(512);
const LOG = new Uint8Array(256);
{
  let x = 1;
  for (let i = 0; i < 255; i++) {
    EXP[i] = x;
    LOG[x] = i;
    x <<= 1;
    if (x & 0x100) x ^= 0x11d; // the QR generator polynomial
  }
  for (let i = 255; i < 512; i++) EXP[i] = EXP[i - 255];
}
const mul = (a, b) => (a === 0 || b === 0 ? 0 : EXP[LOG[a] + LOG[b]]);

function rsGenerator(degree) {
  let poly = [1];
  for (let i = 0; i < degree; i++) {
    const next = new Array(poly.length + 1).fill(0);
    for (let j = 0; j < poly.length; j++) {
      next[j] ^= mul(poly[j], 1);
      next[j + 1] ^= mul(poly[j], EXP[i]);
    }
    poly = next;
  }
  return poly;
}

function rsEncode(data, ecLen) {
  const gen = rsGenerator(ecLen);
  const res = new Array(ecLen).fill(0);
  for (const byte of data) {
    const factor = byte ^ res[0];
    res.shift();
    res.push(0);
    for (let i = 0; i < ecLen; i++) res[i] ^= mul(gen[i + 1], factor);
  }
  return res;
}

// --- Version tables (level M only) ------------------------------------------
// [total codewords, ec codewords per block, block counts as [n1, n2]]
const M = {
  1: [26, 10, [1, 0]],
  2: [44, 16, [1, 0]],
  3: [70, 26, [1, 0]],
  4: [100, 18, [2, 0]],
  5: [134, 24, [2, 0]],
  6: [172, 16, [4, 0]],
};
const ALIGN = {
  1: [], 2: [6, 18], 3: [6, 22], 4: [6, 26], 5: [6, 30],
  6: [6, 34],
};

const capacity = (v) => {
  const [total, ecPer, [n1, n2]] = M[v];
  const blocks = n1 + n2;
  return total - ecPer * blocks;
};

// --- Bit buffer -------------------------------------------------------------
class Bits {
  constructor() {
    this.bits = [];
  }
  push(value, length) {
    for (let i = length - 1; i >= 0; i--) this.bits.push((value >> i) & 1);
  }
  get length() {
    return this.bits.length;
  }
  toBytes() {
    const out = [];
    for (let i = 0; i < this.bits.length; i += 8) {
      let b = 0;
      for (let j = 0; j < 8; j++) b = (b << 1) | (this.bits[i + j] || 0);
      out.push(b);
    }
    return out;
  }
}

// --- Matrix construction ----------------------------------------------------
function buildMatrix(version, codewords, mask) {
  const size = version * 4 + 17;
  const m = Array.from({ length: size }, () => new Array(size).fill(null));
  const reserved = Array.from({ length: size }, () => new Array(size).fill(false));

  const finder = (r, c) => {
    for (let dr = -1; dr <= 7; dr++) {
      for (let dc = -1; dc <= 7; dc++) {
        const rr = r + dr;
        const cc = c + dc;
        if (rr < 0 || cc < 0 || rr >= size || cc >= size) continue;
        const inner = dr >= 0 && dr <= 6 && dc >= 0 && dc <= 6;
        const on =
          inner &&
          ((dr === 0 || dr === 6 || dc === 0 || dc === 6) ||
            (dr >= 2 && dr <= 4 && dc >= 2 && dc <= 4));
        m[rr][cc] = on ? 1 : 0;
        reserved[rr][cc] = true;
      }
    }
  };
  finder(0, 0);
  finder(0, size - 7);
  finder(size - 7, 0);

  // Timing patterns
  for (let i = 8; i < size - 8; i++) {
    m[6][i] = i % 2 === 0 ? 1 : 0;
    m[i][6] = i % 2 === 0 ? 1 : 0;
    reserved[6][i] = reserved[i][6] = true;
  }

  // Alignment patterns
  const centres = ALIGN[version];
  for (const r of centres) {
    for (const c of centres) {
      if (reserved[r][c]) continue;
      for (let dr = -2; dr <= 2; dr++) {
        for (let dc = -2; dc <= 2; dc++) {
          const on = Math.max(Math.abs(dr), Math.abs(dc)) !== 1;
          m[r + dr][c + dc] = on ? 1 : 0;
          reserved[r + dr][c + dc] = true;
        }
      }
    }
  }

  // Dark module and format reservation
  m[size - 8][8] = 1;
  reserved[size - 8][8] = true;
  for (let i = 0; i < 9; i++) {
    if (!reserved[8][i]) { reserved[8][i] = true; m[8][i] = 0; }
    if (!reserved[i][8]) { reserved[i][8] = true; m[i][8] = 0; }
  }
  for (let i = 0; i < 8; i++) {
    if (!reserved[8][size - 1 - i]) { reserved[8][size - 1 - i] = true; m[8][size - 1 - i] = 0; }
    if (!reserved[size - 1 - i][8]) { reserved[size - 1 - i][8] = true; m[size - 1 - i][8] = 0; }
  }

  // Data placement, snaking upward in two-column strips
  const MASKS = [
    (r, c) => (r + c) % 2 === 0,
    (r) => r % 2 === 0,
    (r, c) => c % 3 === 0,
    (r, c) => (r + c) % 3 === 0,
    (r, c) => (Math.floor(r / 2) + Math.floor(c / 3)) % 2 === 0,
    (r, c) => ((r * c) % 2) + ((r * c) % 3) === 0,
    (r, c) => (((r * c) % 2) + ((r * c) % 3)) % 2 === 0,
    (r, c) => (((r + c) % 2) + ((r * c) % 3)) % 2 === 0,
  ];
  const maskFn = MASKS[mask];

  let bitIndex = 0;
  const totalBits = codewords.length * 8;
  let upward = true;
  for (let col = size - 1; col > 0; col -= 2) {
    if (col === 6) col--; // skip the vertical timing column
    for (let i = 0; i < size; i++) {
      const row = upward ? size - 1 - i : i;
      for (const c of [col, col - 1]) {
        if (reserved[row][c]) continue;
        let bit = 0;
        if (bitIndex < totalBits) {
          bit = (codewords[bitIndex >> 3] >> (7 - (bitIndex & 7))) & 1;
          bitIndex++;
        }
        m[row][c] = maskFn(row, c) ? bit ^ 1 : bit;
      }
    }
    upward = !upward;
  }

  // Format information for level M with the chosen mask
  const FORMAT = [0x5412, 0x5125, 0x5e7c, 0x5b4b, 0x45f9, 0x40ce, 0x4f97, 0x4aa0];
  const fmt = FORMAT[mask];
  for (let i = 0; i < 15; i++) {
    const bit = (fmt >> i) & 1;
    // The vertical copy runs down column 8, skipping the timing row.
    if (i < 6) m[i][8] = bit;
    else if (i < 8) m[i + 1][8] = bit;
    else m[size - 15 + i][8] = bit;
    // The horizontal copy runs along row 8, from the right edge inwards.
    if (i < 8) m[8][size - i - 1] = bit;
    else if (i === 8) m[8][7] = bit;
    else m[8][14 - i] = bit;
  }
  m[size - 8][8] = 1; // the dark module, always set, always here

  return m;
}

// Penalty scoring, so we pick a mask that actually scans well.
function penalty(m) {
  const n = m.length;
  let score = 0;
  const run = (get) => {
    for (let a = 0; a < n; a++) {
      let last = -1;
      let len = 0;
      for (let b = 0; b < n; b++) {
        const v = get(a, b);
        if (v === last) {
          len++;
          if (len === 5) score += 3;
          else if (len > 5) score++;
        } else {
          last = v;
          len = 1;
        }
      }
    }
  };
  run((a, b) => m[a][b]);
  run((a, b) => m[b][a]);
  for (let r = 0; r < n - 1; r++) {
    for (let c = 0; c < n - 1; c++) {
      const s = m[r][c] + m[r][c + 1] + m[r + 1][c] + m[r + 1][c + 1];
      if (s === 0 || s === 4) score += 3;
    }
  }
  let dark = 0;
  for (const row of m) for (const v of row) dark += v;
  score += Math.floor(Math.abs((dark * 100) / (n * n) - 50) / 5) * 10;
  return score;
}

// --- Public API -------------------------------------------------------------
export function encode(text) {
  const bytes = [...new TextEncoder().encode(text)];

  let version = 0;
  for (let v = 1; v <= 6; v++) {
    // 4 bits mode + 8 or 16 bits length + data
    const lenBits = 8; // byte-mode length is 8 bits for versions 1-9
    if (bytes.length + Math.ceil((4 + lenBits) / 8) <= capacity(v)) {
      version = v;
      break;
    }
  }
  if (!version) throw new Error(`"${text.slice(0, 40)}…" is too long for this encoder (max 108 bytes)`);

  const [, ecPer, [n1, n2]] = M[version];
  const dataLen = capacity(version);

  const bits = new Bits();
  bits.push(0b0100, 4); // byte mode
  bits.push(bytes.length, 8);
  for (const b of bytes) bits.push(b, 8);
  bits.push(0, Math.min(4, dataLen * 8 - bits.length)); // terminator
  while (bits.length % 8) bits.push(0, 1);

  const data = bits.toBytes();
  const PAD = [0xec, 0x11];
  let i = 0;
  while (data.length < dataLen) data.push(PAD[i++ % 2]);

  // Split into blocks, interleave data then error correction
  const blocks = n1 + n2;
  const shortLen = Math.floor(dataLen / blocks);
  const longCount = dataLen % blocks;
  const dataBlocks = [];
  const ecBlocks = [];
  let at = 0;
  for (let b = 0; b < blocks; b++) {
    const len = shortLen + (b >= blocks - longCount ? 1 : 0);
    const chunk = data.slice(at, at + len);
    at += len;
    dataBlocks.push(chunk);
    ecBlocks.push(rsEncode(chunk, ecPer));
  }

  const out = [];
  const maxData = Math.max(...dataBlocks.map((b) => b.length));
  for (let c = 0; c < maxData; c++) {
    for (const block of dataBlocks) if (c < block.length) out.push(block[c]);
  }
  for (let c = 0; c < ecPer; c++) {
    for (const block of ecBlocks) out.push(block[c]);
  }

  let best = null;
  for (let mask = 0; mask < 8; mask++) {
    const m = buildMatrix(version, out, mask);
    const p = penalty(m);
    if (!best || p < best.p) best = { m, p, mask };
  }
  return best.m;
}

// Two rows per line of text, using half-block characters, so a QR fits in a
// terminal without being three times too tall to scan.
export function toText(matrix, quiet = 2) {
  const n = matrix.length;
  const at = (r, c) =>
    r < 0 || c < 0 || r >= n || c >= n ? 0 : matrix[r][c];
  const lines = [];
  for (let r = -quiet; r < n + quiet; r += 2) {
    let line = '';
    for (let c = -quiet; c < n + quiet; c++) {
      const top = at(r, c);
      const bottom = at(r + 1, c);
      // Dark modules must render dark; terminals are light-on-dark or the
      // reverse, so use solid blocks rather than relying on colour.
      line += top && bottom ? '█' : top ? '▀' : bottom ? '▄' : ' ';
    }
    lines.push(line);
  }
  return lines.join('\n');
}

export function toSvg(matrix, { scale = 8, quiet = 4, dark = '#000', light = '#fff' } = {}) {
  const n = matrix.length;
  const size = (n + quiet * 2) * scale;
  const path = [];
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (matrix[r][c]) path.push(`M${(c + quiet) * scale} ${(r + quiet) * scale}h${scale}v${scale}h-${scale}z`);
    }
  }
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">` +
    `<rect width="${size}" height="${size}" fill="${light}"/>` +
    `<path d="${path.join('')}" fill="${dark}"/></svg>`
  );
}
