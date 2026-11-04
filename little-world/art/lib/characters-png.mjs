// ── Xuất PNG gọn hơn: lấy điểm ảnh từ Chromium rồi tự nén (lọc từng hàng + zlib mức 9) ──
// Tuỳ chọn `quantize`: làm tròn bớt bit thấp của kênh màu (posterize nhẹ, mắt thường không thấy)
// giúp PNG nén tốt hơn nhiều với ảnh có gradient mềm.
import { deflateSync } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

const CRC = new Int32Array(256).map((_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c; });
function crc32(buf) { let c = -1; for (let i = 0; i < buf.length; i++) c = CRC[(c ^ buf[i]) & 255] ^ (c >>> 8); return (c ^ -1) >>> 0; }
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}
export function encodePNG(W, H, px) {
  const bpp = 4, stride = W * bpp;
  const raw = Buffer.alloc((stride + 1) * H);
  const cand = [0, 1, 2, 3, 4].map(() => Buffer.alloc(stride));
  for (let y = 0; y < H; y++) {
    const o = y * stride, po = o - stride;
    let best = 0, bestSum = Infinity;
    for (let f = 0; f < 5; f++) {
      const c = cand[f]; let sum = 0;
      for (let i = 0; i < stride; i++) {
        const x = px[o + i], a = i >= bpp ? px[o + i - bpp] : 0, b = y ? px[po + i] : 0, cc = y && i >= bpp ? px[po + i - bpp] : 0;
        let v;
        if (f === 0) v = x; else if (f === 1) v = x - a; else if (f === 2) v = x - b; else if (f === 3) v = x - ((a + b) >> 1);
        else { const p = a + b - cc, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - cc); v = x - (pa <= pb && pa <= pc ? a : pb <= pc ? b : cc); }
        v &= 255; c[i] = v; sum += v < 128 ? v : 256 - v;
        if (sum >= bestSum) break;
      }
      if (sum < bestSum) { bestSum = sum; best = f; }
    }
    raw[y * (stride + 1)] = best;
    // tính lại hàng tốt nhất đầy đủ (vòng trên có thể dừng sớm)
    const c = cand[best];
    for (let i = 0; i < stride; i++) {
      const x = px[o + i], a = i >= bpp ? px[o + i - bpp] : 0, b = y ? px[po + i] : 0, cc = y && i >= bpp ? px[po + i - bpp] : 0;
      let v;
      if (best === 0) v = x; else if (best === 1) v = x - a; else if (best === 2) v = x - b; else if (best === 3) v = x - ((a + b) >> 1);
      else { const p = a + b - cc, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - cc); v = x - (pa <= pb && pa <= pc ? a : pb <= pc ? b : cc); }
      c[i] = v & 255;
    }
    c.copy(raw, y * (stride + 1) + 1);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(W, 0); ihdr.writeUInt32BE(H, 4); ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw, { level: 9, memLevel: 9 })), chunk('IEND', Buffer.alloc(0))]);
}

/** Rasterize SVG (qua page Chromium của openRasterizer) → RGBA. */
export async function rasterRGBA(page, svg, scale) {
  const m = svg.match(/<svg[^>]*\swidth="([\d.]+)"[^>]*\sheight="([\d.]+)"/);
  const W = Math.round(+m[1] * scale), H = Math.round(+m[2] * scale);
  const b64 = await page.evaluate(async ({ svg, W, H }) => {
    const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
    const img = new Image();
    await new Promise((ok, bad) => { img.onload = ok; img.onerror = () => bad(new Error('SVG không hợp lệ')); img.src = url; });
    const c = document.createElement('canvas'); c.width = W; c.height = H;
    const ctx = c.getContext('2d'); ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, W, H); URL.revokeObjectURL(url);
    const d = ctx.getImageData(0, 0, W, H).data;
    let s = ''; const CH = 0x8000;
    for (let i = 0; i < d.length; i += CH) s += String.fromCharCode.apply(null, d.subarray(i, i + CH));
    return btoa(s);
  }, { svg, W, H });
  return { W, H, px: Buffer.from(b64, 'base64') };
}

/** Lưu PNG đã tối ưu. quantize: số bit bỏ ở kênh màu (0..2) — alpha giữ nguyên. */
export async function savePNG(page, svg, out, { scale = 2, quantize = 1 } = {}) {
  const { W, H, px } = await rasterRGBA(page, svg, scale);
  for (let i = 0; i < px.length; i += 4) {
    const a = px[i + 3];
    if (a === 0) { px[i] = px[i + 1] = px[i + 2] = 0; continue; }
    if (quantize) {
      const q = 1 << quantize, h = q >> 1;
      for (let k = 0; k < 3; k++) px[i + k] = Math.min(255, ((px[i + k] + h) >> quantize) << quantize);
      if (a < 255 && a > 0) px[i + 3] = Math.min(255, ((a + 1) >> 1) << 1);
    }
  }
  const buf = encodePNG(W, H, px);
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, buf);
  return { W, H, bytes: buf.length };
}

// ───────────── PNG8 (bảng 256 màu, median-cut, không dither) ─────────────
export function quantize256(px) {
  const hist = new Map();
  const key = (i) => ((px[i] >> 3) << 15) | ((px[i + 1] >> 3) << 10) | ((px[i + 2] >> 3) << 5) | (px[i + 3] >> 3);
  for (let i = 0; i < px.length; i += 4) {
    if (px[i + 3] === 0) continue;
    const k = key(i);
    let e = hist.get(k);
    if (!e) { e = [0, 0, 0, 0, 0]; hist.set(k, e); }
    e[0] += px[i]; e[1] += px[i + 1]; e[2] += px[i + 2]; e[3] += px[i + 3]; e[4]++;
  }
  const cols = [...hist.values()].map((e) => [e[0] / e[4], e[1] / e[4], e[2] / e[4], e[3] / e[4], e[4]]);
  const W = [1, 1.2, 0.9, 1.4]; // trọng số kênh (alpha quan trọng ở viền)
  let boxes = [cols];
  const score = (b) => {
    let best = 0, axis = 0;
    for (let a = 0; a < 4; a++) { let mn = 1e9, mx = -1e9; for (const c of b) { if (c[a] < mn) mn = c[a]; if (c[a] > mx) mx = c[a]; } const r = (mx - mn) * W[a]; if (r > best) { best = r; axis = a; } }
    const n = b.reduce((s, c) => s + c[4], 0);
    return { s: best * Math.sqrt(n), axis };
  };
  while (boxes.length < 255) {
    let bi = -1, bs = 0, ba = 0;
    boxes.forEach((b, i) => { if (b.length < 2) return; const { s, axis } = score(b); if (s > bs) { bs = s; bi = i; ba = axis; } });
    if (bi < 0) break;
    const b = boxes[bi].sort((p, q) => p[ba] - q[ba]);
    const tot = b.reduce((s, c) => s + c[4], 0);
    let acc = 0, cut = 1;
    for (let i = 0; i < b.length; i++) { acc += b[i][4]; if (acc >= tot / 2) { cut = Math.max(1, Math.min(b.length - 1, i + 1)); break; } }
    boxes.splice(bi, 1, b.slice(0, cut), b.slice(cut));
  }
  const pal = [[0, 0, 0, 0]].concat(boxes.map((b) => {
    const n = b.reduce((s, c) => s + c[4], 0);
    return [0, 1, 2, 3].map((a) => Math.round(b.reduce((s, c) => s + c[a] * c[4], 0) / n));
  }));
  const cache = new Map();
  const idx = new Uint8Array(px.length / 4);
  for (let i = 0, j = 0; i < px.length; i += 4, j++) {
    if (px[i + 3] === 0) { idx[j] = 0; continue; }
    const k = (px[i] << 24 | px[i + 1] << 16 | px[i + 2] << 8 | px[i + 3]) >>> 0;
    let v = cache.get(k);
    if (v === undefined) {
      let bd = Infinity;
      for (let p = 1; p < pal.length; p++) {
        const c = pal[p];
        const d = (c[0] - px[i]) ** 2 * W[0] + (c[1] - px[i + 1]) ** 2 * W[1] + (c[2] - px[i + 2]) ** 2 * W[2] + (c[3] - px[i + 3]) ** 2 * W[3] * 1.5;
        if (d < bd) { bd = d; v = p; }
      }
      cache.set(k, v);
    }
    idx[j] = v;
  }
  return { pal, idx };
}
export function encodePNG8(W, H, pal, idx) {
  const raw = Buffer.alloc((W + 1) * H);
  for (let y = 0; y < H; y++) { raw[y * (W + 1)] = 0; for (let x = 0; x < W; x++) raw[y * (W + 1) + 1 + x] = idx[y * W + x]; }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(W, 0); ihdr.writeUInt32BE(H, 4); ihdr[8] = 8; ihdr[9] = 3;
  const plte = Buffer.alloc(pal.length * 3), trns = Buffer.alloc(pal.length);
  pal.forEach((c, i) => { plte[i * 3] = c[0]; plte[i * 3 + 1] = c[1]; plte[i * 3 + 2] = c[2]; trns[i] = c[3]; });
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('PLTE', plte), chunk('tRNS', trns), chunk('IDAT', deflateSync(raw, { level: 9, memLevel: 9 })), chunk('IEND', Buffer.alloc(0))]);
}
/** Lưu PNG: thử cả truecolor (posterize nhẹ) và PNG8; chọn PNG8 nếu nhỏ hơn đáng kể và ảnh vượt ngưỡng. */
export async function saveSmallPNG(page, svg, out, { scale = 2, budget = 600 * 1024, allow8 = true } = {}) {
  const { W, H, px } = await rasterRGBA(page, svg, scale);
  for (let i = 0; i < px.length; i += 4) if (px[i + 3] === 0) px[i] = px[i + 1] = px[i + 2] = 0;
  let buf = encodePNG(W, H, px), kind = 'rgba';
  if (buf.length > budget) {
    const q = Buffer.from(px);
    for (let i = 0; i < q.length; i += 4) for (let k = 0; k < 3; k++) q[i + k] = Math.min(255, ((q[i + k] + 1) >> 1) << 1);
    const b2 = encodePNG(W, H, q);
    if (b2.length < buf.length) { buf = b2; kind = 'rgba-q1'; }
  }
  if (buf.length > budget && allow8) {
    const { pal, idx } = quantize256(px);
    const b3 = encodePNG8(W, H, pal, idx);
    if (b3.length < buf.length) { buf = b3; kind = 'png8'; }
  }
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, buf);
  return { W, H, bytes: buf.length, kind };
}
