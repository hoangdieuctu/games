// ── Khách: vào cửa, xếp chỗ, gọi món, ăn, trả tiền hoặc giận bỏ về ──

import { G } from './state.js';
import { DISHES, TYPES, SKINS, HAIRS, CLOTHES, pick } from './config.js';
import { anchorPos } from './layout.js';
import { sDoor, sDone, sAngry, sCash } from './audio.js';
import { spark, coin, puff, heartPop, textPop } from './particles.js';
import { setHint, updateCustPill, bump } from './ui.js';
import { tipMult, menuTime } from './upgrades.js';
import { addGold, addExp, levelTipBonus } from './player.js';

const HAIR_STYLES = ['bun', 'pony', 'long', 'twin', 'bob'];

function makeLook(typeKey) {
  const look = {
    skin: pick(SKINS),
    hair: pick(HAIR_STYLES),
    hairColor: typeKey === 'granny' ? '#cdd2da' : pick(HAIRS),
    dress: 'classic',
    dressColor: pick(CLOTHES),
    apron: 'none',
    acc: 'none',
  };
  if (typeKey === 'business') { look.dress = 'suit'; look.dressColor = '#4a5a72'; look.hair = 'bob'; }
  if (typeKey === 'star') { look.acc = 'glasses'; look.dress = 'flare'; }
  if (typeKey === 'granny') { look.hair = 'bun'; look.acc = 'glasses'; }
  return look;
}

export function makeCustomer() {
  const typeKey = pick(G.cfg.types);
  const t = TYPES[typeKey];
  const nOrd = G.cfg.minOrd + Math.floor(Math.random() * (G.cfg.maxOrd - G.cfg.minOrd + 1));
  const orders = [];
  for (let i = 0; i < nOrd; i++) orders.push(pick(G.cfg.menu));
  return {
    id: ++G.custId,
    type: typeKey,
    look: makeLook(typeKey),
    orders, served: 0, earned: 0,
    patience: t.patience, maxPatience: t.patience,
    speed: t.speed, payMult: t.payMult, exp: t.exp,
    state: 'walk',
    x: G.door.x, y: G.door.y,
    tx: G.door.x, ty: G.door.y,
    anchor: null,
    bobT: Math.random() * 6,
    timer: 0,
    arrive: null,
  };
}

export function walkTo(c, x, y, then) {
  c.state = 'walk';
  c.tx = x; c.ty = y;
  c.arrive = then;
}

export function freeAnchor(c) {
  if (!c.anchor) return;
  if (c.anchor.kind === 'wait') {
    const s = G.waitSpots[c.anchor.idx];
    if (s && s.taken === c) s.taken = null;
  }
  if (c.anchor.kind === 'table') {
    const t = G.tables[c.anchor.idx];
    if (t && t.cust === c) t.cust = null;
  }
  c.anchor = null;
}

// dồn hàng chờ lên phía cửa khi có chỗ trống
export function shiftWaitLine() {
  for (let i = 0; i < G.waitSpots.length - 1; i++) {
    if (G.waitSpots[i].taken || !G.waitSpots[i + 1].taken) continue;
    const c = G.waitSpots[i + 1].taken;
    if (c.state !== 'wait' && c.state !== 'walk') continue;
    G.waitSpots[i + 1].taken = null;
    G.waitSpots[i].taken = c;
    c.anchor = { kind: 'wait', idx: i };
    const a = anchorPos(c);
    walkTo(c, a.x, a.y, () => { c.state = 'wait'; });
  }
}

export function spawnCustomer(spotIdx) {
  G.spawned++;
  const c = makeCustomer();
  G.customers.push(c);
  G.waitSpots[spotIdx].taken = c;
  c.anchor = { kind: 'wait', idx: spotIdx };
  const a = anchorPos(c);
  sDoor();
  walkTo(c, a.x, a.y, () => { c.state = 'wait'; setHint(); });
  updateCustPill();
}

export function seatCustomer(c, table) {
  freeAnchor(c);
  const idx = G.tables.indexOf(table);
  table.cust = c;
  c.anchor = { kind: 'table', idx };
  const a = anchorPos(c);
  G.selected = null;
  walkTo(c, a.x, a.y, () => {
    c.state = 'menu';
    c.timer = menuTime();
    setHint();
  });
}

// bạn phục vụ ghi món: đơn bay vào bếp
export function takeOrder(c) {
  for (const dish of c.orders) G.orders.push({ dish, custId: c.id });
  c.state = 'waitFood';
  c.served = 0;
  textPop(c.x, c.y - 96 * G.K, '📝', 26);
  setHint();
}

// đưa được một món ra bàn
export function deliverDish(c, dish) {
  c.served++;
  c.earned += DISHES[dish].price;
  for (let i = 0; i < 5; i++) spark(c.x + (Math.random() - 0.5) * 50 * G.K, c.y - Math.random() * 70 * G.K);
  if (c.served >= c.orders.length) {
    c.state = 'eating';
    c.timer = 3.4 + c.orders.length * 1.2;
    sDone();
  }
  setHint();
}

export function finishEating(c) {
  c.state = 'bill';
  heartPop(c.x, c.y - 90 * G.K);
  setHint();
}

export function payCustomer(c) {
  const tip = Math.round(Math.ceil(Math.max(0, c.patience)) * 2 * tipMult() * levelTipBonus());
  const total = Math.round(c.earned * c.payMult) + tip;
  const exp = c.exp + c.orders.length * 2;
  G.money += total;
  G.dayExp += exp;
  addGold(total);
  const ups = addExp(exp);
  G.paidCount++;
  sCash();
  textPop(c.x, c.y - 100 * G.K, '+' + total + ' 💰', 26);
  textPop(c.x + 40 * G.K, c.y - 70 * G.K, '+' + exp + ' ⭐', 19, '#7a5ad0');
  for (let i = 0; i < 6; i++) coin(c.x, c.y - 40 * G.K);
  for (let i = 0; i < 3; i++) heartPop(c.x + (Math.random() - 0.5) * 50 * G.K, c.y - 90 * G.K);
  bump('money-pill');
  bump('exp-pill');
  if (ups > 0) G.levelUpPending = (G.levelUpPending || 0) + ups;

  // bàn bẩn cần dọn trước khi đón khách mới
  const t = c.anchor && c.anchor.kind === 'table' ? G.tables[c.anchor.idx] : null;
  freeAnchor(c);
  if (t) { t.dirty = true; t.cust = null; }
  walkTo(c, G.door.x, G.door.y, () => { removeCustomer(c); });
  c.state = 'exitHappy';
  shiftWaitLine();
  setHint();
}

export function customerAngry(c) {
  if (c.state === 'exitAngry' || c.state === 'exitHappy') return;
  const t = c.anchor && c.anchor.kind === 'table' ? G.tables[c.anchor.idx] : null;
  freeAnchor(c);
  if (t) { t.dirty = true; t.cust = null; }
  if (G.selected === c) G.selected = null;
  G.angryCount++;
  sAngry();
  puff(c.x, c.y - 70 * G.K, '#8a8a92');
  textPop(c.x, c.y - 95 * G.K, '💢', 30, '#c03a4a');
  // huỷ mọi món của khách này
  G.orders = G.orders.filter(o => o.custId !== c.id);
  shiftWaitLine();
  walkTo(c, G.door.x, G.door.y, () => { removeCustomer(c); });
  c.state = 'exitAngry';
  setHint();
}

export function removeCustomer(c) {
  G.customers = G.customers.filter(x => x !== c);
  updateCustPill();
}

export function findCustomer(id) {
  return G.customers.find(c => c.id === id) || null;
}
