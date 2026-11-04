// ── Little World · Đảo cá nhân: hạ tầng chung cho generator đảo ──
// Mỗi tài sản được khai báo bằng sprite()/sheet(); generator gom lại, rasterize,
// kiểm tra lề trong suốt và ghi manifest. Toạ độ trong hàm vẽ = đơn vị thế giới,
// (ox, oy) = điểm đế chạm đất (origin).
import { Doc } from './style.mjs';

export const REG = [];

/**
 * sprite({ id, file, w, h, ox, oy, usage, tags, footprint, group, scale, draw(doc, ox, oy) })
 * file: tương đối với public/assets/ (vd 'island/trees/oak-1.png')
 */
export const PAD = 40;
export function sprite(o) {
  // vẽ trong canvas có đệm PAD; fitSprite() sẽ cắt sát nội dung + lề MARGIN
  const P = o.fixed ? 0 : (o.pad ?? PAD);
  const doc = new Doc(o.w + 2 * P, o.h + 2 * P, { prefix: o.id });
  const body = o.draw(doc, o.ox + P, o.oy + P);
  const a = { group: 'island', scale: 2, ...o, w: o.w + 2 * P, h: o.h + 2 * P, ox: o.ox + P, oy: o.oy + P, svg: doc.toString(body), kind: 'image' };
  REG.push(a);
  return a;
}

export const MARGIN = 6;
/** Cắt canvas sát nội dung (+MARGIN), giữ nguyên toạ độ đế. Sprite 'fixed' giữ kích thước gốc. */
export async function fitSprite(page, a) {
  if (a.kind !== 'image' || a.fixed) return a;
  const { bbox } = await checkSvg(page, a.svg, a.w, a.h, 0);
  let [x0, y0, x1, y1] = bbox;
  x0 = Math.max(0, Math.floor(x0 - MARGIN)); y0 = Math.max(0, Math.floor(y0 - MARGIN));
  x1 = Math.min(a.w, Math.ceil(x1 + 1 + MARGIN)); y1 = Math.min(a.h, Math.ceil(y1 + 1 + MARGIN));
  if (a.symmetric !== false) { // giữ đế ở giữa ngang (flipX trong Phaser không làm lệch vật)
    const half = Math.max(a.ox - x0, x1 - a.ox); x0 = Math.max(0, Math.floor(a.ox - half)); x1 = Math.min(a.w, Math.ceil(a.ox + half));
  }
  const w = x1 - x0, h = y1 - y0;
  a.svg = a.svg.replace(/width="[\d.]+" height="[\d.]+" viewBox="[^"]*"/, `width="${w}" height="${h}" viewBox="${x0} ${y0} ${w} ${h}"`);
  a.ox -= x0; a.oy -= y0; a.w = w; a.h = h;
  return a;
}

/**
 * sheet({ id, file, fw, fh, frames, cols, ox, oy, drawFrame(doc, i, ox, oy), animations, ... })
 * Khung xếp trái→phải, trên→dưới. Một Doc chung cho mọi khung (defs dùng lại được).
 */
export function sheet(o) {
  const cols = o.cols || o.frames;
  const rows = Math.ceil(o.frames / cols);
  const doc = new Doc(o.fw * cols, o.fh * rows, { prefix: o.id });
  let body = '';
  for (let i = 0; i < o.frames; i++) {
    const x = (i % cols) * o.fw, y = Math.floor(i / cols) * o.fh;
    // khung có clip để không tràn sang khung bên cạnh
    body += `<g transform="translate(${x},${y})">${o.drawFrame(doc, i, o.ox, o.oy)}</g>`;
  }
  const a = { group: 'island', scale: 2, ...o, w: o.fw, h: o.fh, svg: doc.toString(body), kind: 'sheet', cols, rows };
  REG.push(a);
  return a;
}

export const byId = (id) => REG.find((a) => a.id === id);

/** Vẽ sprite (SVG đầy đủ) vào trong một SVG khác tại điểm đế (x,y) – dùng cho ảnh tổng hợp. */
export function placeSvg(a, x, y, flipX = false, frame = 0) {
  const left = x - a.ox, top = y - a.oy;
  let inner = a.svg;
  if (a.kind === 'sheet') {
    // chỉ lấy khung đầu: viewBox cắt khung
    inner = inner.replace(/viewBox="[^"]*"/, `viewBox="${frame * a.fw} 0 ${a.fw} ${a.fh}"`)
      .replace(/width="[\d.]+" height="[\d.]+"/, `width="${a.fw}" height="${a.fh}"`);
  }
  inner = inner.replace('<svg ', `<svg x="${left}" y="${top}" `);
  if (!flipX) return inner;
  return `<g transform="translate(${2 * x},0) scale(-1,1)">${inner}</g>`;
}

/**
 * Kiểm tra trong trình duyệt: lề (≥ margin đơn vị) phải trong suốt, và trả về bbox nội dung.
 */
export async function checkSvg(page, svg, w, h, margin = 4) {
  return page.evaluate(async ({ svg, w, h, margin }) => {
    const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
    const img = new Image();
    await new Promise((ok, bad) => { img.onload = ok; img.onerror = bad; img.src = url; });
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    const ctx = c.getContext('2d'); ctx.drawImage(img, 0, 0, w, h);
    URL.revokeObjectURL(url);
    const d = ctx.getImageData(0, 0, w, h).data;
    let x0 = w, y0 = h, x1 = -1, y1 = -1, edge = 0;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const al = d[(y * w + x) * 4 + 3];
      if (al > 6) {
        if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
        if (x < margin || y < margin || x >= w - margin || y >= h - margin) edge++;
      }
    }
    return { bbox: [x0, y0, x1, y1], edge };
  }, { svg, w, h, margin });
}
