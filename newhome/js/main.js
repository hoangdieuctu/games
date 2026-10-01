// ── Nối mọi thứ: màn hình, host loop, khách, hành động ngữ cảnh, lưu/tải ──
import { TILE, COLS, REACH, NODES, BUILD, AVATARS, COLORS, MAX_PLAYERS, ENERGY, RES } from './config.js';
import { genWorld, packWorld, unpackWorld, rebuildOcc, canPlace, isWaterTile, centerOf } from './world.js';
import { createGame, step, act, setInput, newPlayer, moveEntity, packTick, unpackInv, roster, playerMeta, dist, invCount } from './sim.js';
import { net, hostOnline, joinOnline, closeNet, broadcast, send, guestSend, randCode } from './net.js';
import { initRender, render, screenToWorld, resize } from './render.js';
import { initInput, input } from './input.js';
import { S, $ } from './state.js';
import * as UI from './ui.js';
import { charCanvas, LOOKS } from './char.js';

// ── hồ sơ máy này ──
const store = { get: (k, d) => { try { const v = localStorage.getItem('newhome.' + k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } }, set: (k, v) => { try { localStorage.setItem('newhome.' + k, JSON.stringify(v)); } catch (e) {} }, del: k => { try { localStorage.removeItem('newhome.' + k); } catch (e) {} } };
const profile = Object.assign({ name: '', avatar: AVATARS[0] }, store.get('profile', {}));
let myCid = store.get('cid', null); if (!myCid) { myCid = randCode(12); store.set('cid', myCid); }
const myName = () => profile.name.trim() || (S.host ? 'Chủ nhà' : 'Người nhà');
const cleanName = v => String(v || '').replace(/\s+/g, ' ').trim().slice(0, 14);

// ── màn tiêu đề ──
function renderTitle() {
  const av = $('avatars'); av.innerHTML = '';
  AVATARS.forEach((a, i) => {
    const b = document.createElement('button'); b.className = a === profile.avatar ? 'sel' : '';
    b.appendChild(charCanvas(a, COLORS[i % COLORS.length], 60, 62, 1.05));
    const nm = document.createElement('span'); nm.textContent = LOOKS[a].name; b.appendChild(nm);
    b.onclick = () => { profile.avatar = a; store.set('profile', profile); renderTitle(); }; av.appendChild(b);
  });
  $('nameIn').value = profile.name;
  const codes = store.get('worlds', []), box = $('savedList'); box.innerHTML = '';
  if (codes.length) {
    box.innerHTML = '<h3>Thế giới đã lưu trên máy này</h3>';
    for (const code of codes) {
      const sv = store.get('world.' + code, null); if (!sv) continue;
      const row = document.createElement('div'); row.className = 'sv';
      const n = Object.keys(sv.players || {}).length, b = Object.keys(sv.W.bld || {}).length;
      row.innerHTML = `<span class="ic">${sv.W.flags?.house ? '🏠' : sv.W.flags?.fire ? '🔥' : '🏕️'}</span><div class="in"><b>Thế giới ${code}</b><small>${n} người · ${b} công trình · lưu ${ago(sv.savedAt)}</small></div>`;
      const go = document.createElement('button'); go.textContent = 'Tiếp tục'; go.onclick = () => hostWorld(code, sv);
      const del = document.createElement('button'); del.textContent = '✕'; del.className = 'del'; del.onclick = () => { if (confirm(`Xoá thế giới ${code}? Không khôi phục được.`)) { store.del('world.' + code); store.set('worlds', codes.filter(c => c !== code)); renderTitle(); } };
      row.appendChild(go); row.appendChild(del); box.appendChild(row);
    }
  }
  const code = roomFromHash();
  $('joinBox').hidden = !code;
}
function ago(t) { const m = Math.round((Date.now() - t) / 60000); return m < 1 ? 'vừa xong' : m < 60 ? `${m} phút trước` : m < 1440 ? `${Math.round(m / 60)} giờ trước` : `${Math.round(m / 1440)} ngày trước`; }
const roomFromHash = () => (location.hash.match(/room=([a-z0-9]{4,12})/i) || [])[1] || null;
$('nameIn').oninput = () => { profile.name = cleanName($('nameIn').value); store.set('profile', profile); };
$('btnNew').onclick = () => hostWorld(randCode(), null);
$('btnJoin').onclick = () => { const c = roomFromHash(); if (c) join(c); };
addEventListener('hashchange', renderTitle);

function showGame() {
  showGameShell();
  UI.renderQuest(); UI.renderRoster();
  if (!loopOn) { loopOn = true; schedule(); }
}

// ── sự kiện từ luật game → hiệu ứng (host và khách dùng chung) ──
function uiEvent(e) {
  const now = performance.now();
  switch (e.t) {
    case 'fx': S.fx.push({ x: e.x, y: e.y, text: e.text, kind: e.kind, born: now }); break;
    case 'node': if (e.hit) S.shake[e.n.id] = now + 300; break;
    case 'toast': UI.toast(e.text); break;
    case 'emote': S.bubbles[e.pid] = { text: e.e, until: now + 2500 }; break;
    case 'chat': { const p = S.players[e.pid]; S.bubbles[e.pid] = { text: e.text, until: now + 4500 }; if (p) UI.toast(`${p.name}: ${e.text}`, 4000); break; }
    case 'flags': UI.renderQuest(); break;
    case 'celebrate': UI.celebrate(); break;
    case 'store': case 'contrib': UI.refreshTransfer(); break;
    case 'siteDone': case 'bld': case 'site': if (S.sheet?.kind === 'build') UI.buildSheet(); break;
  }
}
// khách: áp thay đổi thế giới vào bản sao
function applyWorldEvent(W, e) {
  switch (e.t) {
    case 'node': W.nodes[e.n.id] = e.n; if (NODES[e.n.k].solid) rebuildOcc(W); break;
    case 'site': W.sites[e.s.id] = e.s; rebuildOcc(W); break;
    case 'siteDone': delete W.sites[e.id]; rebuildOcc(W); break;
    case 'bld': W.bld[e.b.id] = e.b; rebuildOcc(W); break;
    case 'plot': if (W.bld[e.id]) W.bld[e.id].plots[e.i] = e.pl; break;
    case 'store': W.store = e.store; break;
    case 'flags': W.flags = e.flags; break;
    case 'contrib': W.contrib = e.contrib; break;
  }
}

// ── hành động tại chỗ ──
function doAct(m) {
  if (S.host) { act(S.G, S.me, m); flush(); }
  else guestSend(Object.assign({ t: 'act' }, m));
}
function flush() {
  const evs = S.G.evq.splice(0);
  if (!evs.length) return;
  if (net.conns.size) broadcast({ t: 'ev', evs });
  evs.forEach(uiEvent);
}

// ══════════════ CHỦ PHÒNG ══════════════
let hostTimer = 0, lastStep = 0, lastTick = 0, lastSave = 0, loopOn = false;
function hostWorld(code, saved) {
  S.host = true; S.code = code;
  let W, players;
  if (saved) {
    W = unpackWorld(saved.W); players = saved.players || {};
    for (const p of Object.values(players)) { p.online = false; p.in = { mx: 0, my: 0, at: 0 }; p.wk = 0; p.cd = 0; }
    W.createdAt = saved.createdAt;
  } else { W = genWorld(code, (Math.random() * 2 ** 31) | 0); players = {}; W.createdAt = Date.now(); }
  S.G = createGame(W, players); S.W = W; S.players = players;
  let me = Object.values(players).find(p => p.cid === myCid) || newPlayer(S.G, myCid, myName(), profile.avatar);
  me.online = true; me.name = myName(); me.avatar = profile.avatar; S.me = me.pid;
  history.replaceState(null, '', location.pathname + location.search);
  showGame(); saveWorld();
  lastStep = performance.now();
  startHostTicker();
  connectHost();
  UI.toast(saved ? 'Chào mừng trở lại! Bấm 🔗 Mời để gọi cả nhà.' : 'Chào mừng đến nhà mới! Đi tìm gỗ 🪵 và đá 🪨 nhé.', 4000);
}
// Đồng hồ cho host loop chạy trong Worker: tab ở nền vẫn giữ nhịp (main thread bị throttle về 1 lần/giây).
let ticker = null;
function startHostTicker() {
  stopHostTicker();
  try {
    const url = URL.createObjectURL(new Blob(['setInterval(() => postMessage(0), 50)'], { type: 'text/javascript' }));
    ticker = new Worker(url); ticker.onmessage = () => { if (performance.now() - lastStep >= 70) hostStep(); };   // chỉ bù khi frame loop đứng (tab ẩn)
  } catch (e) { hostTimer = setInterval(() => { if (performance.now() - lastStep >= 70) hostStep(); }, 50); }
}
function stopHostTicker() { if (ticker) { ticker.terminate(); ticker = null; } clearInterval(hostTimer); }
function hostStep() {
  const now = performance.now(); let dt = Math.min(2000, now - lastStep); lastStep = now;
  setInput(S.G, S.me, input.mx, input.my, S.goTo);
  // bình thường gọi mỗi frame (dt ~16ms, chuyển động mượt); tab ở nền thì Worker gọi với dt lớn → chia nhỏ để không xuyên tường
  while (dt > 0) { step(S.G, Math.min(50, dt)); dt -= 50; }
  if (now - lastTick >= 100) { lastTick = now; if (net.conns.size) broadcast(packTick(S.G)); }
  flush();
  if (now - lastSave >= 5000) { lastSave = now; saveWorld(); }
}
function saveWorld() {
  if (!S.host || !S.W) return;
  const players = {}; for (const p of Object.values(S.players)) { const { in: _i, ...rest } = p; players[p.pid] = rest; }
  store.set('world.' + S.code, { code: S.code, createdAt: S.W.createdAt, savedAt: Date.now(), W: packWorld(S.W), players });
  const list = store.get('worlds', []).filter(c => c !== S.code); list.unshift(S.code); store.set('worlds', list.slice(0, 8));
}
function connectHost() {
  hostOnline(S.code, {
    onOpen: () => { if (S.sheet?.kind === 'invite') UI.inviteSheet(); },
    onFail: (title, msg) => UI.toast(`${title}: chơi một mình cũng được, bấm 🔗 Mời để thử lại.`, 4000),
    onConn: () => {},
    onData: hostMsg,
    onLost: c => {
      const pid = net.conns.get(c); if (!pid) return;
      net.conns.delete(c);
      if ([...net.conns.values()].includes(pid)) return;
      const p = S.players[pid]; if (!p) return;
      p.online = false; p.in = { mx: 0, my: 0, at: 0 };
      broadcast(roster(S.G)); UI.renderRoster(); UI.toast(`${p.name} đã rời đi.`);
    },
  });
}
function hostMsg(c, d) {
  if (!d || typeof d !== 'object') return;
  const G = S.G;
  if (d.t === 'hello') {
    const cid = String(d.cid || '').slice(0, 40), name = cleanName(d.name) || 'Người nhà', avatar = AVATARS.includes(d.avatar) ? d.avatar : AVATARS[1];
    if (!cid) return;
    for (const [oc, opid] of net.conns) if (S.players[opid]?.cid === cid && oc !== c) { net.conns.delete(oc); try { oc.close(); } catch (e) {} }
    let p = Object.values(S.players).find(x => x.cid === cid);
    if (!p) {
      if (Object.keys(S.players).length >= MAX_PLAYERS) { send(c, { t: 'full' }); setTimeout(() => { try { c.close(); } catch (e) {} }, 500); return; }
      p = newPlayer(G, cid, name, avatar);
    }
    p.online = true; p.name = name; p.avatar = avatar; p.in = { mx: 0, my: 0, at: G.W.t };
    net.conns.set(c, p.pid);
    send(c, { t: 'welcome', pid: p.pid, W: packWorld(G.W), players: S.players });
    broadcast(roster(G)); UI.renderRoster();
    UI.toast(`👋 ${p.name} đã vào!`);
    return;
  }
  const pid = net.conns.get(c); if (!pid) return;
  if (d.t === 'in') setInput(G, pid, d.mx, d.my, d.go);
  else if (d.t === 'act') { act(G, pid, d); flush(); }
  else if (d.t === 'bye') { const p = S.players[pid]; if (p) { p.online = false; broadcast(roster(G)); UI.renderRoster(); } }
}

// ══════════════ KHÁCH ══════════════
let lastIn = 0, lastSent = { mx: 0, my: 0, go: null };
const curMove = { mx: 0, my: 0 };
function sendInput() { if (S.host || !S.W) return; lastIn = performance.now(); lastSent = { mx: input.mx, my: input.my, go: S.goTo }; guestSend({ t: 'in', mx: input.mx, my: input.my, go: S.goTo ? { x: S.goTo.x, y: S.goTo.y, stop: S.goTo.stop } : null }); }
function onInputChange() { if (input.mx || input.my) { S.goTo = null; curMove.mx = input.mx; curMove.my = input.my; } else if (!S.goTo) { curMove.mx = 0; curMove.my = 0; } sendInput(); }

// Hướng đi mỗi frame: phím/joystick ưu tiên; không có thì đi tới điểm đã chạm (S.goTo)
function computeMove(me, now) {
  if (input.mx || input.my) { S.goTo = null; curMove.mx = input.mx; curMove.my = input.my; return; }
  const g = S.goTo;
  if (!g) { curMove.mx = 0; curMove.my = 0; return; }
  const dx = g.x - me.x, dy = g.y - me.y, d = Math.hypot(dx, dy);
  if (d <= g.stop) { S.goTo = null; curMove.mx = 0; curMove.my = 0; if (g.autoAct) S.autoActAt = now + 120; return; }
  if (d < (g.best ?? 1e9) - .4) { g.best = d; g.progressAt = now; }
  else if (now - (g.progressAt || g.at) > 700) { S.goTo = null; curMove.mx = 0; curMove.my = 0; return; }   // bị cản (cây, sông)
  curMove.mx = dx / d; curMove.my = dy / d;
}
function join(code) {
  S.host = false; S.code = code; S.W = null; S.players = {}; S.me = null;
  showGameShell();
  UI.netSheet('🌐', 'Vào thế giới', 'Đang kết nối với chủ nhà…', [[{ label: 'Huỷ', fn: () => leave() }]]);
  joinOnline(code, {
    onOpen: () => guestSend({ t: 'hello', cid: myCid, name: myName(), avatar: profile.avatar }),
    onData: guestMsg,
    onLost: hostLeft => UI.netSheet('😕', 'Mất kết nối', hostLeft ? 'Chủ nhà đã đóng thế giới. Khi bạn ấy mở lại, link này vẫn dùng được.' : 'Mất kết nối với chủ nhà. Thử vào lại nhé.',
      [[{ label: 'Về trang đầu', fn: () => leave() }, { label: 'Vào lại', go: true, fn: () => join(code) }]]),
    onFail: (title, msg, retry) => UI.netSheet('😕', title, msg, [[{ label: 'Về trang đầu', fn: () => leave() }, { label: 'Thử lại', go: true, fn: retry }]]),
  });
}
function showGameShell() { $('scr-title').classList.remove('show'); $('scr-game').classList.add('show'); resize(); }
function guestMsg(d) {
  if (!d || typeof d !== 'object') return;
  if (d.t === 'welcome') {
    if (!d.W || !d.players || typeof d.pid !== 'string') return;
    S.me = d.pid; S.W = unpackWorld(d.W); S.players = d.players;
    for (const p of Object.values(S.players)) p.snaps = [];
    UI.closeSheet(); showGame();
    UI.toast('Đã vào! Đi tìm gỗ 🪵 và đá 🪨 cùng cả nhà nhé.', 3500);
  } else if (!S.W) return;
  else if (d.t === 'roster') {
    for (const pid in d.players) {
      const m = d.players[pid], p = S.players[pid];
      if (p) Object.assign(p, m); else S.players[pid] = Object.assign({ x: -1e4, y: -1e4, snaps: [], e: 100, inv: {}, wk: 0 }, m);
    }
    UI.renderRoster();
  } else if (d.t === 'tick') {
    S.W.t = d.wt;
    for (const pid in d.ps) {
      const p = S.players[pid]; if (!p) continue;
      const [x, y, e, wk, inv] = d.ps[pid];
      p.e = e; p.wk = wk; p.inv = unpackInv(inv); p.online = true;
      if (pid === S.me) { p.sx = x; p.sy = y; if (p.x < 0) { p.x = x; p.y = y; } }
      else {
        const now = performance.now();
        if (p.x < 0 || !p.snaps) { p.x = x; p.y = y; p.snaps = []; }
        p.snaps.push({ t: now, x, y }); if (p.snaps.length > 5) p.snaps.shift();
      }
    }
    for (const p of Object.values(S.players)) if (!(p.pid in d.ps) && p.pid !== S.me) p.online = false;
  } else if (d.t === 'ev') { for (const e of d.evs || []) { applyWorldEvent(S.W, e); uiEvent(e); } }
  else if (d.t === 'full') UI.netSheet('🙏', 'Thế giới đã đủ người', `Bản này tối đa ${MAX_PLAYERS} người một gia đình.`, [[{ label: 'Về trang đầu', fn: () => leave() }]]);
  else if (d.t === 'bye') net.left = true;
}

// ── rời ──
function leave() {
  saveWorld(); closeNet(); stopHostTicker();
  history.replaceState(null, '', location.pathname + location.search);
  location.reload();
}
addEventListener('beforeunload', () => { saveWorld(); if (!S.host) guestSend({ t: 'bye' }); });
addEventListener('visibilitychange', () => { if (document.hidden) saveWorld(); if (loopOn) schedule(); });

// ══════════════ HÀNH ĐỘNG NGỮ CẢNH ══════════════
function computeTargets() {
  const me = S.players[S.me], W = S.W; if (!me || !W) return [null, null];
  if (S.placing) { const d = BUILD[S.placing.kind]; return [{ label: 'Đặt ' + d.name, icon: d.icon, ok: S.placing.ok, msg: { a: 'place', kind: S.placing.kind, tx: S.placing.tx, ty: S.placing.ty } }, null]; }
  const cands = [];
  for (const s of Object.values(W.sites)) { const d = BUILD[s.kind], c = centerOf(s, d.w, d.h), dd = dist(me, c) - (Math.max(d.w, d.h) - 1) * TILE * .5; if (dd <= TILE * 2) cands.push({ d: dd - 30, label: 'Góp vật liệu', icon: '🧱', msg: { a: 'contribute', id: s.id }, x: c.x, y: c.y }); }
  for (const b of Object.values(W.bld)) if (b.kind === 'farm') b.plots.forEach((pl, i) => {
    const c = { x: (b.tx + i % 3 + .5) * TILE, y: (b.ty + Math.floor(i / 3) + .5) * TILE }, dd = dist(me, c); if (dd > REACH) return;
    if (pl.s === 4) cands.push({ d: dd - 40, label: 'Thu hoạch', icon: '🌾', msg: { a: 'harvest', id: b.id, i }, x: c.x, y: c.y });
    else if (pl.s === 0) cands.push({ d: dd + (me.inv.seeds ? 0 : 25), label: 'Trồng hạt', icon: '🌱', msg: { a: 'plant', id: b.id, i }, x: c.x, y: c.y });
    else if (pl.w <= W.t) cands.push({ d: dd - 10, label: 'Tưới nước', icon: '💧', msg: { a: 'waterPlot', id: b.id, i }, x: c.x, y: c.y });
  });
  for (const n of Object.values(W.nodes)) { if (n.hp <= 0) continue; const c = centerOf(n), dd = dist(me, c); if (dd <= REACH) cands.push({ d: dd, label: NODES[n.k].verb, icon: NODES[n.k].icon, msg: { a: 'gather', id: n.id }, x: c.x, y: c.y }); }
  cands.sort((a, b) => a.d - b.d);
  const extra = [];
  const tx = Math.floor(me.x / TILE), ty = Math.floor(me.y / TILE);
  let water = false; for (let y = -1; y <= 1; y++) for (let x = -1; x <= 1; x++) if (isWaterTile(W, tx + x, ty + y)) water = true;
  for (const b of Object.values(W.bld)) {
    const c = centerOf(b); if (dist(me, c) > REACH) continue;
    if (b.kind === 'well') water = true;
    if (b.kind === 'storage') extra.push({ label: 'Mở kho', icon: '📦', fn: () => UI.transferSheet({ type: 'store' }) });
  }
  if (water) extra.unshift({ label: 'Lấy nước', icon: '💧', msg: { a: 'water' } });
  for (const p of Object.values(S.players)) if (p !== me && p.online !== false && dist(me, p) <= TILE * 2.5) extra.push({ label: `Tặng ${p.name}`, icon: '🎁', fn: () => UI.transferSheet({ type: 'player', pid: p.pid }) });
  const primary = cands[0] || extra.shift() || null;
  return [primary, extra[0] || null];
}
function startPlacing(kind) { S.placing = { kind, tx: 0, ty: 0, ok: false, fixed: null }; UI.toast(`Đi tới chỗ muốn đặt ${BUILD[kind].name} rồi bấm Đặt. Chạm vào đất để chọn ô.`, 3500); }
function updatePlacing(me) {
  const g = S.placing; if (!g) return;
  const d = BUILD[g.kind];
  if (g.fixed) { g.tx = g.fixed.tx; g.ty = g.fixed.ty; }
  else {
    const fx = me.fdx ?? 0, fy = me.fdy ?? 1, r = TILE * (.7 + Math.max(d.w, d.h) / 2);
    g.tx = Math.round((me.x + fx * r) / TILE - d.w / 2); g.ty = Math.round((me.y + fy * r) / TILE - d.h / 2);
  }
  g.ok = canPlace(S.W, g.kind, g.tx, g.ty) && dist(me, centerOf(g, d.w, d.h)) <= TILE * 3 && !(d.needs && !Object.values(S.W.bld).some(b => b.kind === d.needs));
}
function primaryAction() {
  const t = S.target; if (!t) return;
  if (t.fn) return t.fn();
  if (t.msg) { doAct(t.msg); if (t.msg.a === 'place') { if (S.placing?.ok) S.placing = null; } }
}
function onTap(sx, sy) {
  if (!S.W) return;
  const w = screenToWorld(sx, sy), tx = Math.floor(w.x / TILE), ty = Math.floor(w.y / TILE);
  if (S.placing) {
    const d = BUILD[S.placing.kind];
    S.placing.fixed = { tx: tx - Math.floor((d.w - 1) / 2), ty: ty - Math.floor((d.h - 1) / 2) };
    return;
  }
  const me = S.players[S.me]; if (!me) return;
  const now = performance.now();
  // chạm vào cây/đá/nền/ruộng/kho: đi tới rồi làm luôn
  const node = Object.values(S.W.nodes).find(n => n.hp > 0 && n.tx === tx && n.ty === ty);
  const occ = S.W.occ[ty * COLS + tx], site = S.W.sites[occ], bld = S.W.bld[occ];
  if (node) S.goTo = { x: (tx + .5) * TILE, y: (ty + .5) * TILE, stop: REACH - 14, autoAct: true, at: now };
  else if (site || (bld && bld.kind !== 'farm')) { const d = BUILD[(site || bld).kind], o = site || bld; S.goTo = { x: (o.tx + d.w / 2) * TILE, y: (o.ty + d.h / 2) * TILE, stop: TILE * 1.3 + (Math.max(d.w, d.h) - 1) * TILE * .5, autoAct: true, at: now }; }
  else if (bld) S.goTo = { x: (tx + .5) * TILE, y: (ty + .5) * TILE, stop: REACH - 20, autoAct: true, at: now };   // ô ruộng
  else if (isWaterTile(S.W, tx, ty)) S.goTo = { x: w.x, y: w.y, stop: TILE * 1.1, autoAct: true, at: now };
  else S.goTo = { x: w.x, y: w.y, stop: 5, at: now };
  if (Math.hypot(S.goTo.x - me.x, S.goTo.y - me.y) <= S.goTo.stop) S.goTo = null;
}

// ══════════════ FRAME LOOP ══════════════
function interpolate(p, rt) {
  const sn = p.snaps, n = sn.length;
  if (rt <= sn[0].t) { p.x = sn[0].x; p.y = sn[0].y; return; }
  for (let i = 0; i < n - 1; i++) if (rt <= sn[i + 1].t) {
    const a = sn[i], b = sn[i + 1], k = (rt - a.t) / Math.max(1, b.t - a.t);
    p.x = a.x + (b.x - a.x) * k; p.y = a.y + (b.y - a.y) * k; return;
  }
  const a = sn[n - 2] || sn[n - 1], b = sn[n - 1], span = Math.max(1, b.t - a.t), k = Math.min(rt - b.t, 120) / span;   // ngoại suy tối đa 120ms rồi đứng chờ
  p.x = b.x + (b.x - a.x) * k; p.y = b.y + (b.y - a.y) * k;
}
let lastFrame = 0, lastHud = 0;
let rafId = 0, toId = 0;
// tab ẩn: rAF dừng hẳn, chuyển sang setTimeout để khách vẫn gửi input/nhận tick đều
function schedule() {
  cancelAnimationFrame(rafId); clearTimeout(toId);
  if (document.hidden) toId = setTimeout(() => frame(performance.now()), 100); else rafId = requestAnimationFrame(frame);
}
function frame(now) {
  schedule();
  const dt = Math.min(50, now - (lastFrame || now)); lastFrame = now; S.now = now;
  const me = S.W && S.players[S.me];
  if (me) {
    const ox = me.x, oy = me.y;
    computeMove(me, now);
    if (S.host) hostStep();
    else {
      moveEntity(S.W, me, curMove.mx, curMove.my, dt, me.e < ENERGY.slowBelow);
      // sửa lệch với host từ từ theo frame; chỉ nhảy khi lệch quá một ô rưỡi
      if (me.sx != null) {
        const err = Math.hypot(me.sx - me.x, me.sy - me.y);
        if (err > TILE * 1.5) { me.x = me.sx; me.y = me.sy; }
        else if (err > 14) { const k = Math.min(1, dt / 220); me.x += (me.sx - me.x) * k; me.y += (me.sy - me.y) * k; }
      }
      const changed = input.mx !== lastSent.mx || input.my !== lastSent.my || S.goTo !== lastSent.go;
      if ((changed && now - lastIn >= 80) || now - lastIn >= 400) sendInput();
      // người khác: nội suy tuyến tính giữa hai snapshot, vẽ trễ 130ms để chuyển động đều
      for (const p of Object.values(S.players)) if (p !== me && p.snaps && p.snaps.length) interpolate(p, now - 130);
    }
    if (curMove.mx || curMove.my) { const l = Math.hypot(curMove.mx, curMove.my); me.fdx = me._fx = curMove.mx / l; me.fdy = me._fy = curMove.my / l; if (S.placing && (input.mx || input.my)) S.placing.fixed = null; }
    if (S.autoActAt && now >= S.autoActAt) { S.autoActAt = 0; const [t, t2] = computeTargets(); S.target = t; S.target2 = t2; primaryAction(); }
    updatePlacing(me);
    if (now - lastHud >= 100) {
      lastHud = now;
      const [t, t2] = computeTargets(); S.target = t; S.target2 = t2;
      UI.setAction(t, t2); UI.renderInv(me); UI.renderEnergy(me.e);
      if (S.sheet?.kind === 'transfer') UI.refreshTransfer();
    }
  }
  render(now);
}

// ══════════════ KHỞI ĐỘNG ══════════════
initRender($('game'));
initInput($('game'), { onAction: primaryAction, onTap, onMove: onInputChange, onEscape: () => { if (S.placing) S.placing = null; else UI.closeSheet(); }, onBuild: () => { if (S.W) UI.buildSheet(); } });
$('btnAct').onclick = primaryAction;
$('btnAct2').onclick = () => { const t = S.target2; if (!t) return; if (t.fn) t.fn(); else if (t.msg) doAct(t.msg); };
$('btnCancel').onclick = () => { S.placing = null; };
UI.initUI({ doAct, startPlacing, leave, reconnectHost: connectHost });
renderTitle();
document.addEventListener('gesturestart', e => e.preventDefault());
document.addEventListener('dblclick', e => e.preventDefault(), { passive: false });

// móc gỡ lỗi trong console
window.__nh = { S, net, input };
