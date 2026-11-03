// ── Khách hàng: sinh ra, di chuyển, xếp việc, phục vụ, thanh toán, giận dỗi ──

import { G } from './state.js';
import { SERVICES, TYPES, ROBES, SKINS, HAIRS, HAIR_STYLES, pick } from './config.js';
import { anchorPos } from './layout.js';
import { sAssign, sDone, sBell, sAngry, sCash } from './audio.js';
import { spark, coin, puff, heartPop, textPop } from './particles.js';
import { setHint, advanceTutorial, updateCustPill, bump, closeMaskPickFor } from './ui.js';
import { tipMult, addToBank, holdBoostRate } from './upgrades.js';

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
  const look = {
    skin: pick(SKINS),
    hair: typeKey === 'granny' ? 'bun' : pick(HAIR_STYLES),
    hairColor: typeKey === 'granny' ? '#cdd2da' : pick(HAIRS),
    dress: 'robe',
    dressColor: pick(ROBES),
    apron: 'none',
    acc: typeKey === 'granny' ? 'glasses' : typeKey === 'star' ? 'crown' : 'none',
  };
  return {
    id: ++G.custId,
    type: typeKey,
    look,
    lookTowel: { ...look, towel: true }, // lúc thư giãn thì quấn khăn bông
    robe: look.dressColor,
    skin: look.skin,
    hair: look.hairColor,
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

/* ── đổi chỗ hai khách ──
   Chọn một khách rồi chạm khách kia: hai người tráo chỗ cho nhau. Dùng để
   nhường giường cho khách sắp hết tim, hoặc kéo khách đang chờ vào ô dịch vụ
   thay cho người còn nhiều tim hơn.
   Chỉ đổi khi cả hai đang chờ (chưa vào việc) và chỗ mới hợp điều họ muốn. */

const SWAPPABLE = ['sit', 'queue', 'awaitStaff', 'done'];

// khách c có ngồi được vào chỗ này không
function fitsAnchor(c, anchor) {
  if (anchor.kind !== 'station') return true; // ghế chờ / hàng ở quầy: ai cũng được
  const st = G.stations[anchor.idx];
  return !!st && currentWish(c) === st.key;
}

export function canSwap(a, b) {
  if (!a || !b || a === b || !a.anchor || !b.anchor) return false;
  if (!SWAPPABLE.includes(a.state) || !SWAPPABLE.includes(b.state)) return false;
  // đổi hai ghế chờ với nhau thì chẳng được gì — chỉ đổi khi có ít nhất
  // một bên đang ở ô dịch vụ, để nhường/giành giường cho đúng người
  if (a.anchor.kind !== 'station' && b.anchor.kind !== 'station') return false;
  return fitsAnchor(a, b.anchor) && fitsAnchor(b, a.anchor);
}

// ghi khách vào chỗ (cập nhật cả ô/ghế/hàng đang giữ ai)
function occupy(c, anchor) {
  c.anchor = anchor;
  if (anchor.kind === 'seat') G.seats[anchor.idx].taken = c;
  else if (anchor.kind === 'queue') G.queueSpots[anchor.idx].taken = c;
  else if (anchor.kind === 'station') {
    const st = G.stations[anchor.idx];
    if (st.slots) st.slots[anchor.slot || 0] = c;
    else st.occupant = c;
  }
}

// tới chỗ mới thì khách chuyển sang trạng thái nào
function stateAtAnchor(anchor) {
  if (anchor.kind === 'seat') return 'sit';
  if (anchor.kind === 'queue') return 'queue';
  return SERVICES[G.stations[anchor.idx].key].mode === 'room' ? 'service' : 'awaitStaff';
}

// đổi chỗ và trả về [{ stIdx, mode }] — chỗ gọi sẽ xếp việc cho nhân viên
export function swapCustomers(a, b) {
  const aAnchor = a.anchor, bAnchor = b.anchor;
  occupy(a, bAnchor);
  occupy(b, aAnchor);
  G.selected = null;
  sAssign();
  const needStaff = [];
  for (const c of [a, b]) {
    const p = anchorPos(c);
    const dest = stateAtAnchor(c.anchor);
    const kind = c.anchor.kind;
    walkTo(c, p.x, p.y, () => {
      if (kind === 'station') { c.workProgress = 0; c.serviceTimer = 0; }
      c.state = dest;
      setHint();
    });
    if (kind === 'station')
      needStaff.push({ stIdx: c.anchor.idx, mode: SERVICES[G.stations[c.anchor.idx].key].mode });
    for (let i = 0; i < 5; i++) spark(c.x + (Math.random() - 0.5) * 40, c.y - 50 * G.K);
  }
  return needStaff;
}

// đưa khách đang chờ về một ghế trống — dùng khi khách đã xong dịch vụ mà ô
// tiếp theo còn kín, để giải phóng giường cho người khác
export function moveToSeat(c, seatIdx) {
  const seat = G.seats[seatIdx];
  if (!seat || seat.taken) return false;
  if (!SWAPPABLE.includes(c.state)) return false;
  const wasQueue = c.anchor && c.anchor.kind === 'queue';
  freeAnchor(c);
  occupy(c, { kind: 'seat', idx: seatIdx });
  G.selected = null;
  sAssign();
  const p = anchorPos(c);
  walkTo(c, p.x, p.y, () => { c.state = 'sit'; setHint(); });
  if (wasQueue) shiftQueue(); // hàng ở quầy dồn lên cho khít
  return true;
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

// chạm một nhịp khi cô nhân viên đang mát-xa / làm móng → nhích tiến độ
export function cheerTap(c) {
  c.workProgress = Math.min(1, c.workProgress + 0.05);
  spark(c.x + (Math.random() - 0.5) * 24, c.y - 40 * G.K - Math.random() * 20);
}

// GIỮ ngón tay: tiến độ chạy nhanh thêm liên tục, không phải chạm liên tục nữa
export function holdBoost(c, dt) {
  c.workProgress = Math.min(1, c.workProgress + holdBoostRate() * dt);
  if (Math.random() < dt * 14)
    spark(c.x + (Math.random() - 0.5) * 40, c.y - 30 * G.K - Math.random() * 40 * G.K);
}

// tính tiền cho một khách, trả về số tiền thu được
function payOne(c) {
  const tip = Math.round(Math.ceil(Math.max(0, c.patience)) * 2 * tipMult());
  const total = Math.round(c.earned * c.payMult) + tip;
  G.money += total;
  G.tips += tip;
  addToBank(total);
  G.paidCount++;
  for (let i = 0; i < 6; i++) coin(c.x, c.y - 40 * G.K);
  for (let i = 0; i < 3; i++) heartPop(c.x + (Math.random() - 0.5) * 50 * G.K, c.y - 90 * G.K);
  freeAnchor(c);
  walkTo(c, G.door.x, G.door.y, () => { removeCustomer(c); });
  c.state = 'exitHappy';
  return total;
}

// một lượt ra quầy là tính tiền cho TẤT CẢ khách đang đứng chờ ở đó
export function payQueue() {
  const guests = G.queueSpots.map(q => q.taken).filter(c => c && c.state === 'queue');
  if (!guests.length) return 0;
  let sum = 0;
  for (const c of guests) sum += payOne(c);
  sCash();
  const many = guests.length > 1 ? ' (' + guests.length + ' khách)' : '';
  textPop(G.register.x, G.register.y - 50 * G.K, '+' + sum + ' 💰' + many, 26);
  bump('money-pill');
  shiftQueue();
  advanceTutorial(4);
  setHint();
  return sum;
}

export function customerAngry(c) {
  if (c.state === 'exitAngry' || c.state === 'pay') return;
  closeMaskPickFor(c); // đang mở bảng chọn mặt nạ cho khách này thì đóng lại
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
