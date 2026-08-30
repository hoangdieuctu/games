// ── Khách hàng: sinh ra, di chuyển, xếp việc, phục vụ, thanh toán, giận dỗi ──

import { G } from './state.js';
import { SERVICES, TYPES, ROBES, SKINS, HAIRS, pick } from './config.js';
import { anchorPos } from './layout.js';
import { sAssign, sDone, sBell, sAngry, sCash } from './audio.js';
import { spark, coin, puff, heartPop, textPop } from './particles.js';
import { setHint, advanceTutorial, updateCustPill, bump } from './ui.js';
import { tipMult, addToBank } from './upgrades.js';

export function makeCustomer() {
  const typeKey = pick(G.cfg.types);
  const t = TYPES[typeKey];
  const nW = G.cfg.minW + Math.floor(Math.random() * (G.cfg.maxW - G.cfg.minW + 1));
  const pool = [...new Set(G.cfg.stations)];
  const wishes = [];
  for (let i = 0; i < nW && pool.length; i++) {
    const j = Math.floor(Math.random() * pool.length);
    wishes.push(pool.splice(j, 1)[0]);
  }
  return {
    id: ++G.custId,
    type: typeKey,
    robe: pick(ROBES),
    skin: pick(SKINS),
    hair: typeKey === 'granny' ? '#cdd2da' : pick(HAIRS),
    wishes, wishIndex: 0,
    earned: 0,
    patience: t.patience, maxPatience: t.patience,
    speed: t.speed, payMult: t.payMult,
    state: 'enter',
    x: G.door.x, y: G.door.y,
    tx: G.door.x, ty: G.door.y,
    anchor: null,
    bobT: Math.random() * 6,
    workProgress: 0,
    serviceTimer: 0,
    arrive: null,
  };
}

export function currentWish(c) {
  return c.wishIndex < c.wishes.length ? c.wishes[c.wishIndex] : 'pay';
}

export function walkTo(c, x, y, then) {
  c.state = 'walk';
  c.tx = x; c.ty = y;
  c.arrive = then;
}

export function freeAnchor(c) {
  if (!c.anchor) return;
  if (c.anchor.kind === 'seat') { const s = G.seats[c.anchor.idx]; if (s && s.taken === c) s.taken = null; }
  if (c.anchor.kind === 'station') {
    const s = G.stations[c.anchor.idx];
    if (s) {
      if (s.slots) { const i = s.slots.indexOf(c); if (i !== -1) s.slots[i] = null; }
      if (s.occupant === c) s.occupant = null;
    }
  }
  if (c.anchor.kind === 'queue') { const q = G.queueSpots[c.anchor.idx]; if (q && q.taken === c) q.taken = null; }
  c.anchor = null;
}

export function shiftQueue() {
  for (let i = 0; i < G.queueSpots.length - 1; i++) {
    if (!G.queueSpots[i].taken && G.queueSpots[i + 1].taken) {
      const c = G.queueSpots[i + 1].taken;
      if (c.state !== 'queue' && c.state !== 'walk') continue;
      G.queueSpots[i + 1].taken = null;
      G.queueSpots[i].taken = c;
      c.anchor = { kind: 'queue', idx: i };
      walkTo(c, G.queueSpots[i].x, G.queueSpots[i].y, () => { c.state = 'queue'; });
    }
  }
}

export function spawnCustomer(seatIdx) {
  G.spawned++;
  const c = makeCustomer();
  G.customers.push(c);
  G.seats[seatIdx].taken = c;
  c.anchor = { kind: 'seat', idx: seatIdx };
  const a = anchorPos(c);
  sBell();
  walkTo(c, a.x, a.y, () => { c.state = 'sit'; if (G.tutorialStep === 0) setHint(); });
  updateCustPill();
}

// ô còn nhận được khách không (phòng xông tính theo suất trống)
export function stationFree(st) {
  if (st.slots) return st.slots.some(s => !s);
  return !st.occupant;
}

export function assignToStation(c, st) {
  freeAnchor(c);
  const idx = G.stations.indexOf(st);
  if (st.slots) {
    const slot = st.slots.findIndex(s => !s);
    st.slots[slot] = c;
    c.anchor = { kind: 'station', idx, slot };
  } else {
    st.occupant = c;
    c.anchor = { kind: 'station', idx };
  }
  const a = anchorPos(c);
  G.selected = null;
  sAssign();
  advanceTutorial(2);
  const mode = SERVICES[st.key].mode;
  walkTo(c, a.x, a.y, () => {
    c.workProgress = 0;
    c.serviceTimer = 0;
    // phòng xông tự chạy; các dịch vụ khác chờ cô nhân viên đến
    c.state = mode === 'room' ? 'service' : 'awaitStaff';
    setHint();
  });
}

export function assignToQueue(c, qi) {
  freeAnchor(c);
  G.queueSpots[qi].taken = c;
  c.anchor = { kind: 'queue', idx: qi };
  G.selected = null;
  sAssign();
  walkTo(c, G.queueSpots[qi].x, G.queueSpots[qi].y, () => { c.state = 'queue'; setHint(); });
}

export function finishService(c) {
  const st = G.stations[c.anchor.idx];
  c.earned += SERVICES[st.key].price;
  c.wishIndex++;
  c.state = 'done';
  sDone();
  for (let i = 0; i < 7; i++) spark(c.x + (Math.random() - 0.5) * 60 * G.K, c.y - Math.random() * 90 * G.K);
  advanceTutorial(3);
  setHint();
}

// chạm cổ vũ khi cô nhân viên đang mát-xa / làm móng → nhanh xong hơn
export function cheerTap(c) {
  c.workProgress = Math.min(1, c.workProgress + 0.06);
  spark(c.x + (Math.random() - 0.5) * 24, c.y - 40 * G.K - Math.random() * 20);
}

export function completePay(c) {
  const tip = Math.round(Math.ceil(Math.max(0, c.patience)) * 2 * tipMult());
  const total = Math.round(c.earned * c.payMult) + tip;
  G.money += total;
  addToBank(total);
  G.paidCount++;
  sCash();
  textPop(G.register.x, G.register.y - 50 * G.K, '+' + total + ' 💰', 26);
  for (let i = 0; i < 6; i++) coin(c.x, c.y - 40 * G.K);
  for (let i = 0; i < 3; i++) heartPop(c.x + (Math.random() - 0.5) * 50 * G.K, c.y - 90 * G.K);
  bump('money-pill');
  freeAnchor(c);
  shiftQueue();
  walkTo(c, G.door.x, G.door.y, () => { removeCustomer(c); });
  c.state = 'exitHappy';
  advanceTutorial(4);
  setHint();
}

export function customerAngry(c) {
  if (c.state === 'exitAngry' || c.state === 'pay') return;
  freeAnchor(c);
  if (G.selected === c) G.selected = null;
  G.angryCount++;
  sAngry();
  puff(c.x, c.y - 70 * G.K, '#8a8a92');
  textPop(c.x, c.y - 90 * G.K, '💢', 30);
  shiftQueue();
  walkTo(c, G.door.x, G.door.y, () => { removeCustomer(c); });
  c.state = 'exitAngry';
  setHint();
}

export function removeCustomer(c) {
  G.customers = G.customers.filter(x => x !== c);
  updateCustPill();
}
