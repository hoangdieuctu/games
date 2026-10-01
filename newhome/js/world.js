// ── Sinh map từ seed và lưới chiếm chỗ (occupancy) ──
import { TILE, COLS, ROWS, T, NODES, BUILD, START } from './config.js';

export function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export const idx = (tx, ty) => ty * COLS + tx;
export const inMap = (tx, ty) => tx >= 0 && ty >= 0 && tx < COLS && ty < ROWS;

export function genWorld(code, seed) {
  const rnd = mulberry32(seed);
  const tiles = new Uint8Array(COLS * ROWS);
  for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
    let t;
    if (y < 10) t = T.FOREST;
    else if (y < 22) t = T.GRASS;
    else if (y < 25) t = (x >= 22 && x <= 25) ? T.FORD : T.WATER;
    else t = T.SAND;
    if (y === 10 && rnd() < .45) t = T.FOREST;         // bìa rừng lởm chởm
    if (y === 9 && rnd() < .3) t = T.GRASS;
    if (y === 25 && rnd() < .4) t = T.WATER;           // mép nước
    if (y === 21 && rnd() < .3) t = T.SAND;            // bờ sông
    tiles[idx(x, y)] = t;
  }
  // đất trống quanh điểm bắt đầu
  for (let y = START.ty - 1; y <= START.ty + 1; y++) for (let x = START.tx - 1; x <= START.tx + 1; x++) tiles[idx(x, y)] = T.DIRT;

  const W = { code, seed, t: 0, nextId: 1, nodes: {}, sites: {}, bld: {}, store: {}, flags: {}, contrib: {}, tiles };
  const used = new Set();
  const nearStart = (x, y) => Math.hypot(x - START.tx, y - START.ty) < 4.5;
  const put = (k, x, y) => {
    if (!inMap(x, y) || used.has(idx(x, y)) || nearStart(x, y)) return;
    const tt = tiles[idx(x, y)];
    if (tt === T.WATER || tt === T.FORD) return;
    used.add(idx(x, y));
    const id = 'n' + W.nextId++;
    W.nodes[id] = { id, k, tx: x, ty: y, hp: NODES[k].hits, re: 0 };
  };
  for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
    const tt = tiles[idx(x, y)], r = rnd();
    if (tt === T.FOREST) {
      const clearing = Math.abs(x - START.tx) <= 1 && y >= 7;     // lối vào rừng
      if (!clearing && r < .5) put('tree', x, y);
      else if (r < .56) put('bush', x, y);
      else if (r < .6) put('rock', x, y);
    } else if (tt === T.GRASS) {
      if (y <= 11 && r < .12) put('rock', x, y);
      else if (x >= 38 && y >= 12 && y <= 17 && r < .4) put('rock', x, y);
      else if (x <= 11 && y >= 12 && r < .2) put('wheat', x, y);
      else if (x >= 35 && y >= 13 && r < .08) put('oak', x, y);
      else if (r < .08) put('grass', x, y);
      else if (r < .105) put('bush', x, y);
      else if (r < .12) put('wheat', x, y);
    } else if (tt === T.SAND) {
      if (r < .05) put('drift', x, y);
      else if (r < .13) put('shell', x, y);
      else if (r < .16) put('rock', x, y);
    }
  }
  rebuildOcc(W);
  return W;
}

// occ[i] = id của node cản / công trình / nền đang chiếm ô đó, '' nếu trống
export function rebuildOcc(W) {
  const occ = W.occ = new Array(COLS * ROWS).fill('');
  for (const n of Object.values(W.nodes)) if (NODES[n.k].solid && n.hp > 0) occ[idx(n.tx, n.ty)] = n.id;
  const stamp = (o) => { const d = BUILD[o.kind]; for (let y = 0; y < d.h; y++) for (let x = 0; x < d.w; x++) if (inMap(o.tx + x, o.ty + y)) occ[idx(o.tx + x, o.ty + y)] = o.id; };
  for (const s of Object.values(W.sites)) stamp(s);
  for (const b of Object.values(W.bld)) stamp(b);
}

export function isSolid(W, tx, ty) {
  if (!inMap(tx, ty)) return true;
  const i = idx(tx, ty);
  if (W.tiles[i] === T.WATER) return true;
  const o = W.occ[i];
  if (!o) return false;
  // ruộng đi được (để đứng giữa ruộng trồng/tưới)
  const b = W.bld[o];
  return !(b && b.kind === 'farm');
}

export function canPlace(W, kind, tx, ty) {
  const d = BUILD[kind];
  for (let y = 0; y < d.h; y++) for (let x = 0; x < d.w; x++) {
    const X = tx + x, Y = ty + y;
    if (!inMap(X, Y)) return false;
    const tt = W.tiles[idx(X, Y)];
    if (tt === T.WATER || tt === T.FORD) return false;
    const o = W.occ[idx(X, Y)];
    if (o) return false;
    const n = Object.values(W.nodes).find(n => n.tx === X && n.ty === Y && n.hp > 0);
    if (n) return false;
  }
  return true;
}

export const isWaterTile = (W, tx, ty) => inMap(tx, ty) && (W.tiles[idx(tx, ty)] === T.WATER || W.tiles[idx(tx, ty)] === T.FORD);

// Snapshot để lưu/gửi: tiles sinh lại từ seed nên không cần gửi, occ tính lại
export function packWorld(W) {
  const { tiles, occ, ...rest } = W;
  return rest;
}
export function unpackWorld(p) {
  const W = genWorld(p.code, p.seed);
  Object.assign(W, p, { tiles: W.tiles });
  rebuildOcc(W);
  return W;
}
export const centerOf = (o, w = 1, h = 1) => ({ x: (o.tx + w / 2) * TILE, y: (o.ty + h / 2) * TILE });
