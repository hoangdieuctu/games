// ── Nhà bếp: anh đầu bếp nhận đơn, nấu lần lượt, đặt món lên quầy ──

import { G } from './state.js';
import { DISHES } from './config.js';
import { N_PLATES, plateSpot } from './layout.js';
import { cookMult, cookSlots } from './upgrades.js';
import { findCustomer } from './customers.js';
import { steam, spark, puff } from './particles.js';
import { sBell } from './audio.js';
import { setHint } from './ui.js';

export function initKitchen() {
  G.orders = [];
  G.cooking = [];
  G.plates = new Array(N_PLATES).fill(null);
  G.chef.bobT = 0;
}

function freePlateSlot() {
  return G.plates.findIndex(p => !p);
}

export function updateKitchen(dt) {
  // nhận đơn mới lên bếp
  while (G.cooking.length < cookSlots() && G.orders.length) {
    const o = G.orders.shift();
    const c = findCustomer(o.custId);
    if (!c || c.state.startsWith('exit')) continue; // khách đã về thì bỏ đơn
    G.cooking.push({ dish: o.dish, custId: o.custId, t: 0, dur: DISHES[o.dish].cook * cookMult(), done: false });
  }

  const p = G.pass;
  for (const k of G.cooking) {
    if (!k.done) {
      k.t += dt;
      if (Math.random() < dt * 2.2) steam(G.chef.x + (Math.random() - 0.5) * 40 * G.K, G.chef.y - 30 * G.K);
      if (k.t >= k.dur) { k.done = true; sBell(); setHint(); }
    }
  }

  // món chín được bày ra quầy khi còn ô trống
  for (const k of [...G.cooking]) {
    if (!k.done) continue;
    const c = findCustomer(k.custId);
    if (!c || c.state.startsWith('exit')) {
      G.cooking = G.cooking.filter(x => x !== k);
      continue;
    }
    const slot = freePlateSlot();
    if (slot === -1) break; // quầy đầy, món nằm chờ trên bếp
    G.plates[slot] = { dish: k.dish, custId: k.custId, t: 0 };
    G.cooking = G.cooking.filter(x => x !== k);
    const sp = plateSpot(slot);
    for (let i = 0; i < 5; i++) spark(sp.x + (Math.random() - 0.5) * 30 * G.K, sp.y - Math.random() * 20 * G.K);
    setHint();
  }

  // dọn món của khách đã bỏ về
  G.plates.forEach((pl, i) => {
    if (!pl) return;
    pl.t += dt;
    const c = findCustomer(pl.custId);
    if (!c || c.state.startsWith('exit')) {
      const sp = plateSpot(i);
      puff(sp.x, sp.y, '#c8b0a0');
      G.plates[i] = null;
    }
  });

  G.chef.bobT += dt * (G.cooking.length ? 11 : 3);
}

// chạm vào bếp để cổ vũ đầu bếp nấu nhanh hơn một chút
export function cheerCook() {
  const k = G.cooking.find(x => !x.done);
  if (!k) return false;
  k.t = Math.min(k.dur, k.t + k.dur * 0.05);
  spark(G.chef.x + (Math.random() - 0.5) * 40 * G.K, G.chef.y - 40 * G.K - Math.random() * 20 * G.K);
  return true;
}

export function cookingProgress() {
  const k = G.cooking.find(x => !x.done);
  return k ? k.t / k.dur : null;
}
