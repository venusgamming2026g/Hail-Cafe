/* ==========================================================================
   HAIL OS — مولّد رمز QR
   ترميز كامل (Byte mode + Reed-Solomon + إخفاء تلقائي) بدون أي مكتبة خارجية.
   يدعم الإصدارات 1–10 ومستويات التصحيح L/M/Q/H — يكفي لروابط الطاولات وأكثر.
   ========================================================================== */

const EC = { L: 1, M: 0, Q: 3, H: 2 };   // ترميز المستويات كما في المواصفة
const EC_ORDER = { L: 0, M: 1, Q: 2, H: 3 };

/* [عدد الكتل, إجمالي الرموز, رموز البيانات] لكل إصدار ولكل مستوى تصحيح */
const RS_BLOCKS = {
  1:  { L:[[1,26,19]],            M:[[1,26,16]],            Q:[[1,26,13]],            H:[[1,26,9]] },
  2:  { L:[[1,44,34]],            M:[[1,44,28]],            Q:[[1,44,22]],            H:[[1,44,16]] },
  3:  { L:[[1,70,55]],            M:[[1,70,44]],            Q:[[2,35,17]],            H:[[2,35,13]] },
  4:  { L:[[1,100,80]],           M:[[2,50,32]],            Q:[[2,50,24]],            H:[[4,25,9]] },
  5:  { L:[[1,134,108]],          M:[[2,67,43]],            Q:[[2,33,15],[2,34,16]],  H:[[2,33,11],[2,34,12]] },
  6:  { L:[[2,86,68]],            M:[[4,43,27]],            Q:[[4,43,19]],            H:[[4,43,15]] },
  7:  { L:[[2,98,78]],            M:[[4,49,31]],            Q:[[2,32,14],[4,33,15]],  H:[[4,39,13],[1,40,14]] },
  8:  { L:[[2,121,97]],           M:[[2,60,38],[2,61,39]],  Q:[[4,40,18],[2,41,19]],  H:[[4,40,14],[2,41,15]] },
  9:  { L:[[2,146,116]],          M:[[3,58,36],[2,59,37]],  Q:[[4,36,16],[4,37,17]],  H:[[4,36,12],[4,37,13]] },
  10: { L:[[2,86,68],[2,87,69]],  M:[[4,69,43],[1,70,44]],  Q:[[6,43,19],[2,44,20]],  H:[[6,43,15],[2,44,16]] },
};

const ALIGN = {
  1:[], 2:[6,18], 3:[6,22], 4:[6,26], 5:[6,30],
  6:[6,34], 7:[6,22,38], 8:[6,24,42], 9:[6,26,46], 10:[6,28,50],
};

/* ── حقل جالوا GF(256) ───────────────────────────────────────────────── */
const EXP = new Uint8Array(256);
const LOG = new Uint8Array(256);
(() => {
  let x = 1;
  for (let i = 0; i < 255; i++) { EXP[i] = x; LOG[x] = i; x <<= 1; if (x & 0x100) x ^= 0x11d; }
  for (let i = 255; i < 256; i++) EXP[i] = EXP[i - 255];
})();
const gmul = (a, b) => (a === 0 || b === 0) ? 0 : EXP[(LOG[a] + LOG[b]) % 255];

function rsGenerator(degree) {
  let poly = [1];
  for (let i = 0; i < degree; i++) {
    const next = new Array(poly.length + 1).fill(0);
    for (let j = 0; j < poly.length; j++) {
      next[j] ^= gmul(poly[j], 1);
      next[j + 1] ^= gmul(poly[j], EXP[i]);
    }
    poly = next;
  }
  return poly;
}

function rsEncode(data, ecLen) {
  const gen = rsGenerator(ecLen);
  const res = new Array(data.length + ecLen).fill(0);
  data.forEach((b, i) => { res[i] = b; });
  for (let i = 0; i < data.length; i++) {
    const factor = res[i];
    if (factor === 0) continue;
    for (let j = 0; j < gen.length; j++) res[i + j] ^= gmul(gen[j], factor);
  }
  return res.slice(data.length);
}

/* ── مخزن البتات ─────────────────────────────────────────────────────── */
class BitBuffer {
  constructor() { this.buf = []; this.len = 0; }
  put(num, length) { for (let i = length - 1; i >= 0; i--) this.putBit(((num >>> i) & 1) === 1); }
  putBit(bit) {
    const idx = this.len >>> 3;
    if (this.buf.length <= idx) this.buf.push(0);
    if (bit) this.buf[idx] |= 0x80 >>> (this.len & 7);
    this.len += 1;
  }
}

/* ── معلومات النسق والإصدار ──────────────────────────────────────────── */
function bch(data, poly, bits) {
  let d = data << (bits - 1);
  const deg = (n) => { let c = 0; let v = n; while (v !== 0) { c++; v >>>= 1; } return c; };
  const polyDeg = deg(poly);
  while (deg(d) - polyDeg >= 0) d ^= poly << (deg(d) - polyDeg);
  return d;
}
const formatBits = (ecl, mask) => {
  const data = (EC[ecl] << 3) | mask;
  return ((data << 10) | bch(data, 0b10100110111, 11)) ^ 0b101010000010010;
};
const versionBits = (v) => (v << 12) | bch(v, 0b1111100100101, 13);

/* ── بناء المصفوفة ───────────────────────────────────────────────────── */
function buildMatrix(version, ecl, dataBytes, mask) {
  const size = version * 4 + 17;
  const m = Array.from({ length: size }, () => new Array(size).fill(null));

  const finder = (row, col) => {
    for (let r = -1; r <= 7; r++) for (let c = -1; c <= 7; c++) {
      const rr = row + r, cc = col + c;
      if (rr < 0 || rr >= size || cc < 0 || cc >= size) continue;
      const on = (r >= 0 && r <= 6 && (c === 0 || c === 6)) ||
                 (c >= 0 && c <= 6 && (r === 0 || r === 6)) ||
                 (r >= 2 && r <= 4 && c >= 2 && c <= 4);
      m[rr][cc] = on;
    }
  };
  finder(0, 0); finder(size - 7, 0); finder(0, size - 7);

  /* أنماط المحاذاة — تُوضع قبل التوقيت لأنها تتقاطع معه ولها الأولوية */
  const pos = ALIGN[version] || [];
  for (const r of pos) for (const c of pos) {
    if (m[r][c] !== null) continue;
    for (let dr = -2; dr <= 2; dr++) for (let dc = -2; dc <= 2; dc++) {
      m[r + dr][c + dc] = Math.max(Math.abs(dr), Math.abs(dc)) !== 1;
    }
  }

  /* أنماط التوقيت — تملأ ما تبقى فارغاً على الصف والعمود السادس */
  for (let i = 8; i < size - 8; i++) {
    if (m[6][i] === null) m[6][i] = i % 2 === 0;
    if (m[i][6] === null) m[i][6] = i % 2 === 0;
  }

  /* الوحدة الداكنة الثابتة */
  m[size - 8][8] = true;

  /* معلومات النسق (تُكتب مرتين) */
  const fmt = formatBits(ecl, mask);
  for (let i = 0; i < 15; i++) {
    const bit = ((fmt >> i) & 1) === 1;
    if (i < 6) m[i][8] = bit;
    else if (i < 8) m[i + 1][8] = bit;
    else m[size - 15 + i][8] = bit;

    if (i < 8) m[8][size - i - 1] = bit;
    else if (i < 9) m[8][15 - i - 1 + 1] = bit;
    else m[8][15 - i - 1] = bit;
  }

  /* معلومات الإصدار للإصدار 7 فأعلى */
  if (version >= 7) {
    const vb = versionBits(version);
    for (let i = 0; i < 18; i++) {
      const bit = ((vb >> i) & 1) === 1;
      m[Math.floor(i / 3)][size - 11 + (i % 3)] = bit;
      m[size - 11 + (i % 3)][Math.floor(i / 3)] = bit;
    }
  }

  /* وضع البيانات بمسار الأفعى + تطبيق قناع الإخفاء */
  const maskFn = [
    (r, c) => (r + c) % 2 === 0,
    (r) => r % 2 === 0,
    (r, c) => c % 3 === 0,
    (r, c) => (r + c) % 3 === 0,
    (r, c) => (Math.floor(r / 2) + Math.floor(c / 3)) % 2 === 0,
    (r, c) => ((r * c) % 2) + ((r * c) % 3) === 0,
    (r, c) => (((r * c) % 2) + ((r * c) % 3)) % 2 === 0,
    (r, c) => (((r + c) % 2) + ((r * c) % 3)) % 2 === 0,
  ][mask];

  let bitIdx = 0;
  let dir = -1;
  let row = size - 1;
  for (let col = size - 1; col > 0; col -= 2) {
    if (col === 6) col -= 1;
    for (;;) {
      for (let i = 0; i < 2; i++) {
        const c = col - i;
        if (m[row][c] === null) {
          let dark = false;
          if (bitIdx >>> 3 < dataBytes.length) {
            dark = ((dataBytes[bitIdx >>> 3] >>> (7 - (bitIdx & 7))) & 1) === 1;
          }
          if (maskFn(row, c)) dark = !dark;
          m[row][c] = dark;
          bitIdx += 1;
        }
      }
      row += dir;
      if (row < 0 || row >= size) { row -= dir; dir = -dir; break; }
    }
  }
  return m;
}

/* ── تقييم جودة القناع ───────────────────────────────────────────────── */
function penalty(m) {
  const n = m.length;
  let score = 0;

  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      /* قاعدة 1 — تتابع متجانس */
      if (c === 0 || m[r][c] !== m[r][c - 1]) {
        let run = 1;
        while (c + run < n && m[r][c + run] === m[r][c]) run++;
        if (run >= 5) score += 3 + (run - 5);
      }
      if (r === 0 || m[r][c] !== m[r - 1][c]) {
        let run = 1;
        while (r + run < n && m[r + run][c] === m[r][c]) run++;
        if (run >= 5) score += 3 + (run - 5);
      }
      /* قاعدة 2 — كتل 2×2 */
      if (r < n - 1 && c < n - 1) {
        const v = m[r][c];
        if (v === m[r][c + 1] && v === m[r + 1][c] && v === m[r + 1][c + 1]) score += 3;
      }
    }
  }

  /* قاعدة 3 — نمط 1:1:3:1:1 المضلّل */
  const seq = [true, false, true, true, true, false, true];
  const match = (get, i, len) => {
    if (i + 7 > len) return false;
    for (let k = 0; k < 7; k++) if (get(i + k) !== seq[k]) return false;
    return true;
  };
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
    if (match((i) => m[r][i], c, n)) score += 40;
    if (match((i) => m[i][c], r, n)) score += 40;
  }

  /* قاعدة 4 — توازن الداكن/الفاتح */
  let dark = 0;
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (m[r][c]) dark++;
  score += Math.floor(Math.abs((dark * 100) / (n * n) - 50) / 5) * 10;
  return score;
}

/* ── الترميز الكامل ──────────────────────────────────────────────────── */
function encodeData(text, version, ecl) {
  const bytes = new TextEncoder().encode(text);
  const groups = RS_BLOCKS[version][ecl];
  const totalData = groups.reduce((t, [count, , dataLen]) => t + count * dataLen, 0);

  const bb = new BitBuffer();
  bb.put(4, 4);                               // نمط البايت
  bb.put(bytes.length, version < 10 ? 8 : 16);
  bytes.forEach((b) => bb.put(b, 8));

  const capacityBits = totalData * 8;
  if (bb.len > capacityBits) return null;      // لا يتّسع في هذا الإصدار

  for (let i = 0; i < 4 && bb.len < capacityBits; i++) bb.putBit(false);
  while (bb.len % 8 !== 0) bb.putBit(false);
  const pad = [0xEC, 0x11];
  let p = 0;
  while (bb.buf.length < totalData) bb.buf.push(pad[p++ % 2]);

  /* تقسيم إلى كتل ثم تشابك البيانات ورموز التصحيح */
  const dataBlocks = [];
  const ecBlocks = [];
  let offset = 0;
  for (const [count, total, dataLen] of groups) {
    for (let i = 0; i < count; i++) {
      const chunk = bb.buf.slice(offset, offset + dataLen);
      offset += dataLen;
      dataBlocks.push(chunk);
      ecBlocks.push(rsEncode(chunk, total - dataLen));
    }
  }
  const out = [];
  const maxData = Math.max(...dataBlocks.map((b) => b.length));
  for (let i = 0; i < maxData; i++) for (const b of dataBlocks) if (i < b.length) out.push(b[i]);
  const maxEc = Math.max(...ecBlocks.map((b) => b.length));
  for (let i = 0; i < maxEc; i++) for (const b of ecBlocks) if (i < b.length) out.push(b[i]);
  return out;
}

/**
 * يبني مصفوفة منطقية (true = وحدة داكنة).
 * @param {string} text النص أو الرابط
 * @param {'L'|'M'|'Q'|'H'} ecl مستوى تصحيح الخطأ
 */
export function matrix(text, ecl = 'M') {
  if (!EC_ORDER.hasOwnProperty(ecl)) ecl = 'M';
  for (let version = 1; version <= 10; version++) {
    const data = encodeData(text, version, ecl);
    if (!data) continue;
    let best = null, bestScore = Infinity;
    for (let mask = 0; mask < 8; mask++) {
      const m = buildMatrix(version, ecl, data, mask);
      const s = penalty(m);
      if (s < bestScore) { bestScore = s; best = m; }
    }
    return best;
  }
  throw new Error('النص أطول من سعة رمز QR المدعومة');
}

/**
 * يرسم رمز QR كـ SVG قابل للطباعة والتكبير بلا فقدان جودة.
 */
export function toSvg(text, {
  ecl = 'M', size = 240, margin = 3, dark = '#0C0F13', light = '#FFFFFF',
  radius = 0.5, logo = null, logoSize = 0.22, gradient = null,
} = {}) {
  const m = matrix(text, ecl);
  const n = m.length;
  const total = n + margin * 2;
  const unit = size / total;
  const r = radius * unit * 0.5;

  let cells = '';
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    if (!m[y][x]) continue;
    const px = (x + margin) * unit, py = (y + margin) * unit;
    cells += `<rect x="${px.toFixed(2)}" y="${py.toFixed(2)}" width="${unit.toFixed(2)}" height="${unit.toFixed(2)}" rx="${r.toFixed(2)}"/>`;
  }

  const fillRef = gradient ? 'url(#qg)' : dark;
  const defs = gradient
    ? `<defs><linearGradient id="qg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${gradient[0]}"/><stop offset="100%" stop-color="${gradient[1]}"/>
      </linearGradient></defs>` : '';

  /* فتحة بيضاء وسط الرمز عند إضافة شعار — مستوى التصحيح يغطّي الفقد */
  const hole = logo ? (() => {
    const s = size * logoSize;
    const o = (size - s) / 2;
    return `<rect x="${o - 4}" y="${o - 4}" width="${s + 8}" height="${s + 8}" rx="${s * 0.24}" fill="${light}"/>
            <image href="${logo}" x="${o}" y="${o}" width="${s}" height="${s}" preserveAspectRatio="xMidYMid meet"/>`;
  })() : '';

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" shape-rendering="crispEdges">
    ${defs}<rect width="${size}" height="${size}" fill="${light}" rx="${size * 0.045}"/>
    <g fill="${fillRef}">${cells}</g>${hole}</svg>`;
}

/** رابط بيانات جاهز للاستخدام في src أو للتحميل */
export function toDataUrl(text, opts = {}) {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(toSvg(text, opts))}`;
}
