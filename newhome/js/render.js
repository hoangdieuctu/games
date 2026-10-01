// ── Vẽ thế giới top-down lên canvas. Chỉ đọc S, không đổi luật. ──
import { TILE, COLS, ROWS, T, NODES, BUILD, CROP, RES, ENERGY } from './config.js';
import { idx } from './world.js';
import { S, clamp } from './state.js';
import { drawChar } from './char.js';

const EMOJI_FONT = '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';
let cv, ctx, cw = 0, ch = 0, dpr = 1, scale = 1;
const cam = { x: 0, y: 0, init: false, last: 0 };
let ground = null, groundSeed = null;

export function initRender(canvas) {
  cv = canvas; ctx = cv.getContext('2d');
  resize(); addEventListener('resize', resize);
}
export function resize() {
  cw = cv.clientWidth; ch = cv.clientHeight; dpr = Math.min(2, devicePixelRatio || 1);
  cv.width = Math.round(cw * dpr); cv.height = Math.round(ch * dpr);
  scale = clamp(Math.min(cw, ch) / (12 * TILE), .62, 1.05);
}
export const worldToScreen = (x, y) => ({ x: (x - cam.x) * scale + cw / 2, y: (y - cam.y) * scale + ch / 2 });
export const screenToWorld = (sx, sy) => ({ x: (sx - cw / 2) / scale + cam.x, y: (sy - ch / 2) / scale + cam.y });

// sprite cache cho emoji (vẽ chữ emoji mỗi frame rất chậm)
const sprites = new Map();
function sprite(e, size) {
  const key = e + size;
  let s = sprites.get(key);
  if (s) return s;
  const pad = Math.ceil(size * 1.3), c = document.createElement('canvas');
  c.width = c.height = Math.ceil(pad * dpr);
  const g = c.getContext('2d'); g.scale(dpr, dpr);
  g.font = `${size}px ${EMOJI_FONT}`; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText(e, pad / 2, pad / 2 + size * .05);
  s = { c, pad }; sprites.set(key, s); return s;
}
function emoji(e, x, y, size, alpha = 1, rot = 0) {
  if (!e) return;
  const s = sprite(e, Math.round(size));
  ctx.save(); ctx.globalAlpha = alpha; ctx.translate(x, y); if (rot) ctx.rotate(rot);
  ctx.drawImage(s.c, -s.pad / 2, -s.pad / 2, s.pad, s.pad); ctx.restore();
}

// ── nền đất vẽ sẵn một lần ──
const TILE_COLOR = { [T.GRASS]: '#8ecb62', [T.FOREST]: '#6aa94e', [T.SAND]: '#efdca6', [T.WATER]: '#5cb3e6', [T.FORD]: '#8fcfeb', [T.DIRT]: '#c9a56d' };
function hash(x, y, s) { let h = (x * 374761393 + y * 668265263 + s * 97) | 0; h = (h ^ (h >> 13)) * 1274126177; return ((h ^ (h >> 16)) >>> 0) / 4294967296; }
function buildGround(W) {
  ground = document.createElement('canvas'); ground.width = COLS * TILE; ground.height = ROWS * TILE;
  const g = ground.getContext('2d');
  for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
    const t = W.tiles[idx(x, y)], h = hash(x, y, W.seed);
    g.fillStyle = TILE_COLOR[t]; g.fillRect(x * TILE, y * TILE, TILE, TILE);
    g.fillStyle = `rgba(0,0,0,${(h * .06).toFixed(3)})`; g.fillRect(x * TILE, y * TILE, TILE, TILE);
    // hoa văn nhỏ
    if (t === T.GRASS || t === T.FOREST) {
      g.fillStyle = 'rgba(40,90,30,.22)';
      for (let i = 0; i < 4; i++) { const px = x * TILE + hash(x, y, i + 9) * TILE, py = y * TILE + hash(x, y, i + 19) * TILE; g.fillRect(px, py, 2, 5); }
      if (t === T.GRASS && h > .9) emojiOn(g, hash(x, y, 7) > .5 ? '🌼' : '🌸', x * TILE + TILE / 2, y * TILE + TILE / 2, 14);
    } else if (t === T.SAND) {
      g.fillStyle = 'rgba(160,120,60,.25)';
      for (let i = 0; i < 5; i++) g.fillRect(x * TILE + hash(x, y, i + 3) * TILE, y * TILE + hash(x, y, i + 13) * TILE, 2, 2);
    } else if (t === T.FORD) {
      g.fillStyle = 'rgba(255,255,255,.35)';
      for (let i = 0; i < 4; i++) { g.beginPath(); g.ellipse(x * TILE + hash(x, y, i + 3) * TILE, y * TILE + hash(x, y, i + 13) * TILE, 4, 2.5, 0, 0, 7); g.fill(); }
    } else if (t === T.DIRT) {
      g.fillStyle = 'rgba(90,60,20,.18)';
      for (let i = 0; i < 3; i++) g.fillRect(x * TILE + hash(x, y, i + 3) * TILE, y * TILE + hash(x, y, i + 13) * TILE, 3, 3);
    }
  }
  groundSeed = W.seed;
}
function emojiOn(g, e, x, y, size) { g.font = `${size}px ${EMOJI_FONT}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(e, x, y); }

// ── frame ──
export function render(now) {
  const W = S.W; if (!W || !ctx) return;
  if (!ground || groundSeed !== W.seed) buildGround(W);
  const me = S.players[S.me];
  if (me) {
    if (!cam.init) { cam.x = me.x; cam.y = me.y; cam.init = true; }
    const dt = Math.min(100, now - (cam.last || now)), k = 1 - Math.exp(-dt / 110);   // mượt theo thời gian thật, không theo số frame
    cam.x += (me.x - cam.x) * k; cam.y += (me.y - cam.y) * k;
  }
  const halfW = cw / 2 / scale, halfH = ch / 2 / scale;
  cam.x = clamp(cam.x, Math.min(halfW, COLS * TILE / 2), Math.max(COLS * TILE - halfW, COLS * TILE / 2));
  cam.y = clamp(cam.y, Math.min(halfH, ROWS * TILE / 2), Math.max(ROWS * TILE - halfH, ROWS * TILE / 2));

  cam.last = now;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.fillStyle = '#3f8fc8'; ctx.fillRect(0, 0, cw, ch);
  ctx.translate(cw / 2, ch / 2); ctx.scale(scale, scale); ctx.translate(-cam.x, -cam.y);
  const vx0 = cam.x - halfW, vy0 = cam.y - halfH, vx1 = cam.x + halfW, vy1 = cam.y + halfH;
  const tx0 = Math.max(0, Math.floor(vx0 / TILE)), ty0 = Math.max(0, Math.floor(vy0 / TILE));
  const tx1 = Math.min(COLS - 1, Math.ceil(vx1 / TILE)), ty1 = Math.min(ROWS - 1, Math.ceil(vy1 / TILE));
  const sx = tx0 * TILE, sy = ty0 * TILE, sw = (tx1 - tx0 + 1) * TILE, sh = (ty1 - ty0 + 1) * TILE;
  if (sw > 0 && sh > 0) ctx.drawImage(ground, sx, sy, sw, sh, sx, sy, sw, sh);

  // sóng nước
  ctx.strokeStyle = 'rgba(255,255,255,.45)'; ctx.lineWidth = 2; ctx.lineCap = 'round';
  for (let y = ty0; y <= ty1; y++) for (let x = tx0; x <= tx1; x++) {
    if (W.tiles[idx(x, y)] !== T.WATER) continue;
    const ph = now / 900 + x * .7 + y * 1.3, ox = Math.sin(ph) * 6;
    ctx.beginPath(); ctx.moveTo(x * TILE + 10 + ox, y * TILE + 18 + Math.cos(ph) * 3); ctx.lineTo(x * TILE + 26 + ox, y * TILE + 18 + Math.cos(ph) * 3); ctx.stroke();
  }

  const inView = (x, y, m = TILE * 2) => x > vx0 - m && x < vx1 + m && y > vy0 - m && y < vy1 + m;
  const items = [];
  for (const n of Object.values(W.nodes)) { const x = (n.tx + .5) * TILE, y = (n.ty + .5) * TILE; if (inView(x, y)) items.push({ y: y + 8, draw: () => drawNode(n, x, y, now) }); }
  for (const s of Object.values(W.sites)) { const d = BUILD[s.kind]; const x = (s.tx + d.w / 2) * TILE, y = (s.ty + d.h / 2) * TILE; if (inView(x, y, TILE * 3)) items.push({ y: (s.ty + d.h) * TILE - 6, draw: () => drawSite(s, d) }); }
  for (const b of Object.values(W.bld)) { const d = BUILD[b.kind]; const x = (b.tx + d.w / 2) * TILE, y = (b.ty + d.h / 2) * TILE; if (inView(x, y, TILE * 3)) items.push({ y: b.kind === 'farm' ? b.ty * TILE - 1000 : (b.ty + d.h) * TILE - 6, draw: () => drawBuilding(b, d, now) }); }
  for (const p of Object.values(S.players)) if (p.online !== false && inView(p.x, p.y)) items.push({ y: p.y + 15, draw: () => drawPlayer(p, now) });
  items.sort((a, b) => a.y - b.y);

  if (S.goTo) { const g = S.goTo, k = ((now - g.at) % 900) / 900; ctx.strokeStyle = `rgba(255,255,255,${(.9 - k * .7).toFixed(2)})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(g.x, g.y, 8 + k * 14, 4 + k * 7, 0, 0, 7); ctx.stroke(); ctx.fillStyle = 'rgba(255,255,255,.9)'; ctx.beginPath(); ctx.ellipse(g.x, g.y, 4, 2, 0, 0, 7); ctx.fill(); }
  if (S.placing) drawGhost(S.placing);
  if (S.target && S.target.x != null) { ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = 3; ctx.setLineDash([6, 5]); ctx.beginPath(); ctx.arc(S.target.x, S.target.y, 24 + Math.sin(now / 200) * 2, 0, 7); ctx.stroke(); ctx.setLineDash([]); }
  for (const it of items) it.draw();

  // chữ bay
  S.fx = S.fx.filter(f => now - f.born < 1200);
  for (const f of S.fx) {
    const k = (now - f.born) / 1200;
    ctx.globalAlpha = 1 - k * k;
    ctx.font = `800 ${f.kind === 'note' ? 15 : 16}px "Baloo 2", sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.strokeText(f.text, f.x, f.y - k * 46);
    ctx.fillStyle = f.kind === 'give' ? '#d6336c' : f.kind === 'note' ? '#2f6fb3' : '#2d5a1b'; ctx.fillText(f.text, f.x, f.y - k * 46);
  }
  ctx.globalAlpha = 1;
}

function drawNode(n, x, y, now) {
  const d = NODES[n.k];
  const sh = S.shake[n.id] > now ? Math.sin(now / 25) * 3 : 0;
  if (d.solid) { ctx.fillStyle = 'rgba(0,0,0,.14)'; ctx.beginPath(); ctx.ellipse(x, y + d.size * .36, d.size * .36, d.size * .14, 0, 0, 7); ctx.fill(); }
  if (n.hp > 0) {
    const k = .72 + .28 * n.hp / d.hits;
    emoji(d.icon, x + sh, y - d.size * .15 * k, d.size * k, 1, sh * .02);
  } else if (d.empty) emoji(d.empty, x, y + 4, d.size * .55, .8);
  else { ctx.fillStyle = 'rgba(80,60,20,.12)'; ctx.beginPath(); ctx.ellipse(x, y + 6, 10, 5, 0, 0, 7); ctx.fill(); }
}

function siteProgress(s, d) { let need = 0, have = 0; for (const k in d.cost) { need += d.cost[k]; have += Math.min(d.cost[k], s.have[k] || 0); } return have / need; }
function drawSite(s, d) {
  const x = s.tx * TILE, y = s.ty * TILE, w = d.w * TILE, h = d.h * TILE, f = siteProgress(s, d);
  ctx.fillStyle = 'rgba(214,180,120,.75)'; ctx.fillRect(x + 3, y + 3, w - 6, h - 6);
  ctx.strokeStyle = '#8a6a3c'; ctx.lineWidth = 2.5; ctx.setLineDash([8, 6]); ctx.strokeRect(x + 3, y + 3, w - 6, h - 6); ctx.setLineDash([]);
  if (f >= .33) { ctx.fillStyle = '#e9d9b6'; ctx.fillRect(x + 8, y + 8, w - 16, h - 16); ctx.strokeStyle = '#a0804e'; ctx.strokeRect(x + 8, y + 8, w - 16, h - 16); }
  if (f >= .66) { ctx.fillStyle = 'rgba(200,90,70,.8)'; ctx.beginPath(); ctx.moveTo(x + 4, y + h * .45); ctx.lineTo(x + w / 2, y + 4); ctx.lineTo(x + w - 4, y + h * .45); ctx.closePath(); ctx.fill(); }
  // thanh tiến độ + icon
  emoji(d.icon, x + w / 2, y + h / 2 - 4, Math.min(w, h) * .45, .55);
  const bw = Math.max(w - 12, 36);
  ctx.fillStyle = 'rgba(0,0,0,.25)'; roundRect(x + w / 2 - bw / 2, y + h - 11, bw, 7, 3); ctx.fill();
  ctx.fillStyle = '#ffb300'; roundRect(x + w / 2 - bw / 2, y + h - 11, bw * f, 7, 3); ctx.fill();
  const need = Object.entries(d.cost).map(([k, n]) => `${RES[k].icon}${s.have[k] || 0}/${n}`).join(' ');
  label(need, x + w / 2, y - 10, 'rgba(255,255,255,.92)', '#5a4426', 12);
}

function drawBuilding(b, d, now) {
  const x = b.tx * TILE, y = b.ty * TILE, w = d.w * TILE, h = d.h * TILE;
  if (b.kind === 'farm') {
    for (let i = 0; i < 9; i++) {
      const pl = b.plots[i], px = x + (i % 3) * TILE, py = y + Math.floor(i / 3) * TILE;
      const wet = pl.w > S.W.t;
      ctx.fillStyle = wet ? '#7a5230' : '#a8784a'; ctx.fillRect(px + 2, py + 2, TILE - 4, TILE - 4);
      ctx.strokeStyle = 'rgba(60,35,10,.35)'; ctx.lineWidth = 1.5; ctx.strokeRect(px + 2, py + 2, TILE - 4, TILE - 4);
      ctx.strokeStyle = 'rgba(0,0,0,.12)'; for (let r = 1; r < 4; r++) { ctx.beginPath(); ctx.moveTo(px + 6, py + r * 11); ctx.lineTo(px + TILE - 6, py + r * 11); ctx.stroke(); }
      if (pl.s > 0) {
        const sz = [0, 18, 26, 34, 38][pl.s], sway = Math.sin(now / 600 + i) * .05;
        emoji(CROP.icons[pl.s], px + TILE / 2, py + TILE / 2 - sz * .15, sz, 1, sway);
        if (pl.s === 4) emoji('✨', px + TILE - 10, py + 10, 14, .6 + Math.sin(now / 300) * .4);
        else if (!wet) emoji('💧', px + TILE - 10, py + 10, 13, .5 + Math.sin(now / 400) * .3);
      }
    }
    ctx.strokeStyle = '#6b4a2a'; ctx.lineWidth = 4; ctx.strokeRect(x + 1, y + 1, w - 2, h - 2);
    return;
  }
  ctx.fillStyle = 'rgba(0,0,0,.16)'; ctx.beginPath(); ctx.ellipse(x + w / 2, y + h - 4, w * .45, h * .14, 0, 0, 7); ctx.fill();
  if (b.kind === 'house') {
    ctx.fillStyle = '#f3e3bf'; ctx.fillRect(x + 8, y + h * .42, w - 16, h * .55);
    ctx.strokeStyle = '#9a7a50'; ctx.lineWidth = 2; ctx.strokeRect(x + 8, y + h * .42, w - 16, h * .55);
    ctx.fillStyle = '#d9574a'; ctx.beginPath(); ctx.moveTo(x, y + h * .46); ctx.lineTo(x + w / 2, y + 4); ctx.lineTo(x + w, y + h * .46); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#7a4a2a'; roundRect(x + w / 2 - 9, y + h * .66, 18, h * .31, 4); ctx.fill();
    ctx.fillStyle = '#9fd8f5'; ctx.fillRect(x + 16, y + h * .52, 16, 14); ctx.fillRect(x + w - 32, y + h * .52, 16, 14);
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.strokeRect(x + 16, y + h * .52, 16, 14); ctx.strokeRect(x + w - 32, y + h * .52, 16, 14);
    emoji('🪴', x + w - 12, y + h - 10, 16);
  } else if (b.kind === 'campfire') {
    for (let i = 0; i < 7; i++) { const a = i / 7 * Math.PI * 2; ctx.fillStyle = '#9a9a9a'; ctx.beginPath(); ctx.arc(x + TILE / 2 + Math.cos(a) * 17, y + TILE / 2 + 6 + Math.sin(a) * 11, 4.5, 0, 7); ctx.fill(); }
    const fl = 1 + Math.sin(now / 90) * .08;
    ctx.fillStyle = 'rgba(255,160,40,.18)'; ctx.beginPath(); ctx.arc(x + TILE / 2, y + TILE / 2, 48 + Math.sin(now / 150) * 3, 0, 7); ctx.fill();
    emoji('🔥', x + TILE / 2, y + TILE / 2 - 4, 30 * fl);
  } else if (b.kind === 'storage') emoji('📦', x + TILE / 2, y + TILE / 2 - 4, 38);
  else if (b.kind === 'well') emoji('⛲', x + TILE / 2, y + TILE / 2 - 4, 38);
}

function drawGhost(g) {
  const d = BUILD[g.kind], x = g.tx * TILE, y = g.ty * TILE, w = d.w * TILE, h = d.h * TILE;
  ctx.fillStyle = g.ok ? 'rgba(90,200,110,.4)' : 'rgba(230,80,70,.4)'; ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = g.ok ? '#2e8f45' : '#c0392b'; ctx.lineWidth = 3; ctx.setLineDash([8, 6]); ctx.strokeRect(x + 1.5, y + 1.5, w - 3, h - 3); ctx.setLineDash([]);
  emoji(d.icon, x + w / 2, y + h / 2, Math.min(w, h) * .55, .8);
}

function drawPlayer(p, now) {
  const me = p.pid === S.me;
  // hướng và nhịp bước suy từ quãng đường thật sự đi được (host, khách, người khác đều dùng chung)
  const dx = p.x - (p._lx ?? p.x), dy = p.y - (p._ly ?? p.y); p._lx = p.x; p._ly = p.y;
  const d = Math.hypot(dx, dy);
  if (d > .15) { p._phase = (p._phase || 0) + d / 13;   // ~2 bước/giây ở tốc độ thường p._fx = dx / d; p._fy = dy / d; p._movedAt = now; }
  const moving = now - (p._movedAt || 0) < 130;
  const feet = p.y + 14;
  if (me) { ctx.strokeStyle = 'rgba(255,255,255,.85)'; ctx.lineWidth = 2.5; ctx.setLineDash([5, 4]); ctx.beginPath(); ctx.ellipse(p.x, feet, 19, 8, 0, 0, 7); ctx.stroke(); ctx.setLineDash([]); }
  drawChar(ctx, p.x, feet, { avatar: p.avatar, color: p.color, fx: p._fx ?? 0, fy: p._fy ?? 1, phase: p._phase || 0, moving, working: p.wk > (S.W.t || 0), now });
  const top = feet - 50;
  label(p.name, p.x, top - 8, p.color, '#fff', 12, true);
  if (p.e < 60) {
    ctx.fillStyle = 'rgba(0,0,0,.3)'; roundRect(p.x - 16, top, 32, 4, 2); ctx.fill();
    ctx.fillStyle = p.e < ENERGY.slowBelow ? '#e74c3c' : '#ffd54f'; roundRect(p.x - 16, top, 32 * p.e / ENERGY.max, 4, 2); ctx.fill();
  }
  const bb = S.bubbles[p.pid];
  if (bb && bb.until > now) bubble(bb.text, p.x, top - 28, Math.min(1, (bb.until - now) / 300));
}

function label(text, x, y, bg, fg, size = 12, bold) {
  ctx.font = `${bold ? 800 : 700} ${size}px "Baloo 2", sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  const w = ctx.measureText(text).width + 12;
  ctx.fillStyle = bg; roundRect(x - w / 2, y - size * .75, w, size * 1.5, size * .75); ctx.fill();
  ctx.fillStyle = fg; ctx.fillText(text, x, y + 1);
}
function bubble(text, x, y, a) {
  ctx.globalAlpha = a;
  ctx.font = `700 ${text.length <= 2 ? 24 : 14}px "Baloo 2", ${EMOJI_FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  const w = Math.max(34, ctx.measureText(text).width + 18), h = text.length <= 2 ? 36 : 26;
  ctx.fillStyle = '#fff'; roundRect(x - w / 2, y - h / 2, w, h, 12); ctx.fill();
  ctx.beginPath(); ctx.moveTo(x - 6, y + h / 2 - 1); ctx.lineTo(x, y + h / 2 + 7); ctx.lineTo(x + 6, y + h / 2 - 1); ctx.fill();
  ctx.fillStyle = '#23324a'; ctx.fillText(text, x, y + 1);
  ctx.globalAlpha = 1;
}
function roundRect(x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2); ctx.beginPath();
  ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}
