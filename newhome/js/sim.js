// ── Luật game. Chạy trên máy chủ phòng; moveEntity dùng chung cho khách dự đoán. ──
import { TILE, COLS, ROWS, SPEED, PR, CAP, REACH, ENERGY, RES, RES_KEYS, NODES, BUILD, CROP, COLORS, START, MAX_PLAYERS } from './config.js';
import { idx, inMap, isSolid, canPlace, isWaterTile, rebuildOcc, centerOf } from './world.js';

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const invCount = inv => RES_KEYS.reduce((s, k) => s + (inv[k] || 0), 0);
export const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const walkable = (W, x, y) => !isSolid(W, Math.floor(x / TILE), Math.floor(y / TILE));

// Di chuyển hình tròn bán kính PR, kiểm tra 4 góc, trượt theo từng trục.
export function moveEntity(W, p, mx, my, dt, slow) {
  const len = Math.hypot(mx, my);
  if (len < .01) return false;
  if (len > 1) { mx /= len; my /= len; }
  const v = SPEED * (slow ? .6 : 1) * dt / 1000;
  const free = (x, y) => walkable(W, x - PR, y - PR) && walkable(W, x + PR, y - PR) && walkable(W, x - PR, y + PR) && walkable(W, x + PR, y + PR);
  let nx = clamp(p.x + mx * v, PR, COLS * TILE - PR), ny = p.y;
  if (free(nx, ny)) p.x = nx;
  ny = clamp(p.y + my * v, PR, ROWS * TILE - PR);
  if (free(p.x, ny)) p.y = ny;
  return true;
}

export function newPlayer(G, cid, name, avatar) {
  const n = Object.keys(G.players).length;
  const pid = 'p' + (G.W.nextId++);
  const a = (n * 1.7), r = n ? 40 : 0;
  return G.players[pid] = {
    pid, cid, name, avatar, color: COLORS[n % COLORS.length], online: true,
    x: (START.tx + .5) * TILE + Math.cos(a) * r, y: (START.ty + .5) * TILE + Math.sin(a) * r,
    e: ENERGY.max, inv: {}, cd: 0, wk: 0, in: { mx: 0, my: 0, at: 0 },
  };
}

function give(p, items, mul = 1) {
  let room = CAP - invCount(p.inv), got = {};
  for (const k in items) {
    const n = Math.min(room, items[k] * mul);
    if (n > 0) { p.inv[k] = (p.inv[k] || 0) + n; room -= n; got[k] = n; }
  }
  return got;
}
const fmtItems = o => Object.entries(o).map(([k, n]) => `+${n} ${RES[k].icon}`).join(' ');

export function createGame(W, players) {
  return { W, players, evq: [] };
}
const ev = (G, e) => G.evq.push(e);
const fx = (G, x, y, text, kind = 'gain') => ev(G, { t: 'fx', x, y, text, kind });
const toast = (G, text) => ev(G, { t: 'toast', text });
const setFlag = (G, k) => { if (!G.W.flags[k]) { G.W.flags[k] = true; ev(G, { t: 'flags', flags: G.W.flags }); } };
const nearFire = (G, p) => Object.values(G.W.bld).some(b => b.kind === 'campfire' && dist(p, centerOf(b)) < TILE * 3);
export const hasBuilding = (W, kind) => Object.values(W.bld).some(b => b.kind === kind);

// Một bước mô phỏng (dt ms)
export function step(G, dt) {
  const W = G.W; W.t += dt;
  for (const p of Object.values(G.players)) {
    if (!p.online) continue;
    const i = p.in; let mx = i.mx, my = i.my;
    if (i.go) {   // đi tới điểm đã chạm: host tự lái, không phụ thuộc nhịp frame của client
      const g = i.go, dx = g.x - p.x, dy = g.y - p.y, d = Math.hypot(dx, dy);
      if (d <= g.stop) i.go = null;
      else { if (d < g.best - .4) { g.best = d; g.pt = W.t; } else if (W.t - g.pt > 700) i.go = null; }   // bị cản thì thôi
      if (i.go) { mx = dx / d; my = dy / d; } else { mx = 0; my = 0; }
    } else if (W.t - i.at > 700) { mx = 0; my = 0; }   // khách im lặng (tab ẩn, rớt mạng) thì đứng lại
    moveEntity(W, p, mx, my, dt, p.e < ENERGY.slowBelow);
    p.e = Math.min(ENERGY.max, p.e + ENERGY.regen * dt * (nearFire(G, p) ? ENERGY.fireMul : 1));
  }
  for (const n of Object.values(W.nodes)) if (n.hp <= 0 && n.re && W.t >= n.re) {
    n.hp = NODES[n.k].hits; n.re = 0; ev(G, { t: 'node', n });
    if (NODES[n.k].solid) rebuildOcc(W);
  }
  for (const b of Object.values(W.bld)) if (b.kind === 'farm') b.plots.forEach((pl, i) => {
    if (pl.s >= 1 && pl.s < 4 && pl.w > W.t && W.t - pl.at >= CROP.stageMs) {
      pl.s++; pl.at = W.t; ev(G, { t: 'plot', id: b.id, i, pl });
      if (pl.s === 4) fx(G, (b.tx + i % 3 + .5) * TILE, (b.ty + Math.floor(i / 3) + .3) * TILE, 'chín rồi!', 'note');
    }
  });
}

export function setInput(G, pid, mx, my, go) {
  const p = G.players[pid]; if (!p) return;
  p.in.mx = clamp(+mx || 0, -1, 1); p.in.my = clamp(+my || 0, -1, 1); p.in.at = G.W.t;
  if (!go || !Number.isFinite(+go.x) || !Number.isFinite(+go.y) || p.in.mx || p.in.my) p.in.go = null;
  else if (!p.in.go || p.in.go.x !== +go.x || p.in.go.y !== +go.y) p.in.go = { x: +go.x, y: +go.y, stop: clamp(+go.stop || 5, 2, 200), best: 1e9, pt: G.W.t };
}

// Hành động từ người chơi (đã qua mạng hoặc tại chỗ). Host kiểm tra mọi thứ ở đây.
export function act(G, pid, m) {
  const W = G.W, p = G.players[pid];
  if (!p || !m || typeof m !== 'object') return;
  const near = (o, w = 1, h = 1, r = REACH) => dist(p, centerOf(o, w, h)) <= r + (Math.max(w, h) - 1) * TILE * .5;
  const ptile = { tx: Math.floor(p.x / TILE), ty: Math.floor(p.y / TILE) };
  const work = (cost) => { p.wk = W.t + 420; p.cd = W.t + 450; p.e = Math.max(0, p.e - cost); };
  const busy = () => W.t < p.cd;

  switch (m.a) {
    case 'gather': {
      const n = W.nodes[m.id]; const d = n && NODES[n.k];
      if (!n || n.hp <= 0 || busy() || !near(n)) return;
      if (invCount(p.inv) >= CAP) return toast(G, 'Túi của bạn đầy rồi, cất vào kho hoặc góp vào công trình nhé.');
      n.hp--; if (n.hp <= 0) { n.re = W.t + d.respawn; if (d.solid) rebuildOcc(W); }
      const got = give(p, d.gives); work(ENERGY.gather);
      ev(G, { t: 'node', n, hit: pid });
      fx(G, (n.tx + .5) * TILE, n.ty * TILE, fmtItems(got));
      for (const k in got) if (k === 'wood' || k === 'stone') setFlag(G, k);
      return;
    }
    case 'water': {
      let ok = false;
      for (let y = -1; y <= 1 && !ok; y++) for (let x = -1; x <= 1 && !ok; x++) if (isWaterTile(W, ptile.tx + x, ptile.ty + y)) ok = true;
      if (!ok) ok = Object.values(W.bld).some(b => b.kind === 'well' && near(b));
      if (!ok || busy()) return;
      if (invCount(p.inv) >= CAP) return toast(G, 'Túi đầy rồi.');
      const got = give(p, { water: 3 }); work(1);
      fx(G, p.x, p.y - 30, fmtItems(got));
      return;
    }
    case 'eat': if ((p.inv.food || 0) > 0 && p.e < ENERGY.max) { p.inv.food--; p.e = Math.min(ENERGY.max, p.e + ENERGY.eat); fx(G, p.x, p.y - 30, '🍎 ngon!', 'note'); } return;
    case 'drink': if ((p.inv.water || 0) > 0 && p.e < ENERGY.max) { p.inv.water--; p.e = Math.min(ENERGY.max, p.e + ENERGY.drink); fx(G, p.x, p.y - 30, '💧 mát!', 'note'); } return;

    case 'place': {
      const d = BUILD[m.kind]; const tx = m.tx | 0, ty = m.ty | 0;
      if (!d || !canPlace(W, m.kind, tx, ty)) return toast(G, 'Chỗ này không đặt được.');
      if (d.needs && !hasBuilding(W, d.needs)) return toast(G, `Cần có ${BUILD[d.needs].name} trước.`);
      if (dist(p, centerOf({ tx, ty }, d.w, d.h)) > TILE * 3) return toast(G, 'Đứng gần hơn để đặt nền.');
      if (m.kind === 'house' && hasBuilding(W, 'house')) return toast(G, 'Mỗi gia đình một ngôi nhà thôi (bản này).');
      const id = 's' + W.nextId++;
      const s = W.sites[id] = { id, kind: m.kind, tx, ty, have: {}, by: pid };
      rebuildOcc(W); ev(G, { t: 'site', s });
      toast(G, `${p.name} đặt nền ${d.name}. Cả nhà cùng góp vật liệu nhé!`);
      // tự góp luôn phần mình mang
      return act(G, pid, { a: 'contribute', id, auto: true });
    }
    case 'contribute': {
      const s = W.sites[m.id]; if (!s) return;
      const d = BUILD[s.kind];
      if (!m.auto && !near(s, d.w, d.h, TILE * 2)) return;   // nền to, cho với xa hơn node
      let total = 0, got = {};
      for (const k in d.cost) {
        const n = Math.min(p.inv[k] || 0, d.cost[k] - (s.have[k] || 0));
        if (n > 0) { p.inv[k] -= n; s.have[k] = (s.have[k] || 0) + n; total += n; got[k] = n; }
      }
      if (!total) return toast(G, `Cần: ${Object.entries(d.cost).map(([k, n]) => `${RES[k].icon} ${s.have[k] || 0}/${n}`).join('  ')}`);
      p.wk = W.t + 420; p.e = Math.max(0, p.e - ENERGY.build);
      W.contrib[pid] = (W.contrib[pid] || 0) + total;
      ev(G, { t: 'contrib', contrib: W.contrib });
      fx(G, p.x, p.y - 30, Object.entries(got).map(([k, n]) => `${RES[k].icon} ${n}`).join(' '), 'give');
      const done = Object.keys(d.cost).every(k => (s.have[k] || 0) >= d.cost[k]);
      if (!done) { ev(G, { t: 'site', s }); return; }
      delete W.sites[s.id];
      const b = W.bld[s.id] = { id: s.id, kind: s.kind, tx: s.tx, ty: s.ty, at: W.t };
      if (b.kind === 'farm') b.plots = Array.from({ length: 9 }, () => ({ s: 0, w: 0, at: 0 }));
      rebuildOcc(W);
      ev(G, { t: 'siteDone', id: s.id }); ev(G, { t: 'bld', b });
      fx(G, (b.tx + d.w / 2) * TILE, b.ty * TILE, `${d.icon} xong!`, 'note');
      toast(G, `🎊 ${d.name} đã hoàn thành!`);
      if (b.kind === 'campfire') setFlag(G, 'fire');
      if (b.kind === 'house') setFlag(G, 'house');
      checkGoal(G);
      return;
    }
    case 'plant': case 'waterPlot': case 'harvest': {
      const b = W.bld[m.id]; const i = m.i | 0;
      if (!b || b.kind !== 'farm' || i < 0 || i > 8) return;
      const pl = b.plots[i], c = { x: (b.tx + i % 3 + .5) * TILE, y: (b.ty + Math.floor(i / 3) + .5) * TILE };
      if (dist(p, c) > REACH || busy()) return;
      if (m.a === 'plant') {
        if (pl.s !== 0) return;
        if (!(p.inv.seeds > 0)) return toast(G, 'Cần hạt giống 🌾 — tìm lúa hoang ở đồng cỏ phía tây.');
        p.inv.seeds--; pl.s = 1; pl.at = W.t; pl.w = 0; work(1);
        fx(G, c.x, c.y - 20, '🌱', 'note'); setFlag(G, 'plant'); checkGoal(G);
      } else if (m.a === 'waterPlot') {
        if (pl.s < 1 || pl.s > 3) return;
        if (!(p.inv.water > 0)) return toast(G, 'Cần nước 💧 — lấy ở sông hoặc giếng.');
        p.inv.water--; pl.w = W.t + CROP.waterMs; work(1);
        fx(G, c.x, c.y - 20, '💧', 'note');
      } else {
        if (pl.s !== 4) return;
        if (invCount(p.inv) >= CAP - 1) return toast(G, 'Túi đầy rồi.');
        const got = give(p, { food: CROP.yieldFood, seeds: CROP.yieldSeeds });
        pl.s = 0; pl.w = 0; work(1);
        fx(G, c.x, c.y - 20, fmtItems(got));
      }
      ev(G, { t: 'plot', id: b.id, i, pl });
      return;
    }
    case 'stash': {
      if (!Object.values(W.bld).some(b => b.kind === 'storage' && near(b))) return;
      const k = m.res, n = Math.max(0, m.n | 0);
      if (!RES[k] || !n) return;
      if (m.dir === 'in') { const q = Math.min(n, p.inv[k] || 0); if (!q) return; p.inv[k] -= q; W.store[k] = (W.store[k] || 0) + q; }
      else { const q = Math.min(n, W.store[k] || 0, CAP - invCount(p.inv)); if (q <= 0) return; W.store[k] -= q; p.inv[k] = (p.inv[k] || 0) + q; }
      ev(G, { t: 'store', store: W.store });
      return;
    }
    case 'give': {
      const q = G.players[m.pid]; const k = m.res, n = Math.max(0, m.n | 0);
      if (!q || q === p || !q.online || !RES[k] || !n || dist(p, q) > TILE * 2.5) return;
      const amt = Math.min(n, p.inv[k] || 0, CAP - invCount(q.inv));
      if (amt <= 0) return toast(G, 'Túi của bạn ấy đầy rồi.');
      p.inv[k] -= amt; q.inv[k] = (q.inv[k] || 0) + amt;
      W.contrib[pid] = (W.contrib[pid] || 0) + amt; ev(G, { t: 'contrib', contrib: W.contrib });
      fx(G, q.x, q.y - 30, `+${amt} ${RES[k].icon}`, 'give');
      toast(G, `❤️ ${p.name} tặng ${q.name} ${amt} ${RES[k].name.toLowerCase()}`);
      return;
    }
    case 'emote': { const e = String(m.e || '').slice(0, 4); if (e) ev(G, { t: 'emote', pid, e }); return; }
    case 'chat': { const text = String(m.text || '').replace(/\s+/g, ' ').trim().slice(0, 80); if (text) ev(G, { t: 'chat', pid, text }); return; }
  }
}

function checkGoal(G) {
  const W = G.W;
  if (W.flags.celebrated || !W.flags.house || !W.flags.plant) return;
  W.flags.celebrated = true; ev(G, { t: 'flags', flags: W.flags }); ev(G, { t: 'celebrate' });
}

// Gói tick gửi 10Hz
export function packTick(G) {
  const ps = {};
  for (const p of Object.values(G.players)) if (p.online) ps[p.pid] = [Math.round(p.x), Math.round(p.y), Math.round(p.e), p.wk, RES_KEYS.map(k => p.inv[k] || 0)];
  return { t: 'tick', wt: G.W.t, ps };
}
export function unpackInv(arr) { const inv = {}; RES_KEYS.forEach((k, i) => { if (arr[i]) inv[k] = arr[i]; }); return inv; }
export const playerMeta = p => ({ pid: p.pid, name: p.name, avatar: p.avatar, color: p.color, online: p.online });
export const roster = G => ({ t: 'roster', players: Object.fromEntries(Object.values(G.players).map(p => [p.pid, playerMeta(p)])) });
