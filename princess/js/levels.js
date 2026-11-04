// ── Sinh công chúa mẫu cho từng vòng (ngẫu nhiên có hạt giống → vòng nào cũng cố định) ──
import { SLOTS, SLOT_BY_ID, DEFAULT_LOOK, SKINS, activeSlots, poolSize, maxUnowned } from './config.js';
import { S, owns, save } from './state.js';

function rng(seed) {
  let t = (seed * 2654435761 + 12345) >>> 0;
  return () => {
    t += 0x6D2B79F5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

export function skinFor(level) { return SKINS[(level * 7) % SKINS.length]; }

export function getTarget(level) {
  if (S.targets[level]) return S.targets[level];
  const rand = rng(level * 97 + 13);
  const act = activeSlots(level);
  const look = Object.assign({}, DEFAULT_LOOK);
  let unowned = 0;
  const limit = maxUnowned(level);
  // Chọn ngẫu nhiên từng slot; ưu tiên khác mặc định để người chơi phải thao tác
  const order = act.slice().sort(() => rand() - 0.5);
  for (const sid of order) {
    const slot = SLOT_BY_ID[sid];
    const pool = slot.items.slice(0, poolSize(level, slot));
    let pick = pool[Math.floor(rand() * pool.length)];
    // 30% giữ mặc định ở vòng dễ, giảm dần khi khó
    const keepDefault = rand() < Math.max(0.08, 0.3 - level * 0.012);
    if (keepDefault) pick = slot.items[0];
    if (!owns(sid, pick.id)) {
      if (unowned >= limit) {
        // đã hết hạn mức món phải mua → ưu tiên món đã sở hữu nhưng khác mặc định
        const ownedPool = pool.filter((i) => owns(sid, i.id) && i.id !== slot.items[0].id);
        pick = ownedPool.length ? ownedPool[Math.floor(rand() * ownedPool.length)] : slot.items[0];
      } else unowned++;
    }
    look[sid] = pick.id;
  }
  // Đảm bảo khác mặc định ít nhất nửa số slot
  const diff = act.filter((sid) => look[sid] !== DEFAULT_LOOK[sid]).length;
  if (diff < Math.ceil(act.length / 2)) {
    for (const sid of order) {
      if (look[sid] !== DEFAULT_LOOK[sid]) continue;
      const slot = SLOT_BY_ID[sid];
      const cands = slot.items.slice(1, poolSize(level, slot)).filter((i) => owns(sid, i.id) || unowned < limit);
      if (cands.length) {
        const p = cands[Math.floor(rand() * cands.length)];
        if (!owns(sid, p.id)) unowned++;
        look[sid] = p.id;
      }
      if (act.filter((x) => look[x] !== DEFAULT_LOOK[x]).length >= Math.ceil(act.length / 2)) break;
    }
  }
  look.skin = skinFor(level);
  S.targets[level] = look;
  save();
  return look;
}

export function similarity(look, target, level) {
  const act = activeSlots(level);
  let ok = 0;
  for (const sid of act) if (look[sid] === target[sid]) ok++;
  return { pct: Math.round((ok / act.length) * 100), ok, total: act.length };
}

export function starsFor(pct) {
  return pct >= 100 ? 3 : pct >= 95 ? 2 : pct >= 90 ? 1 : 0;
}

export { SLOTS };
