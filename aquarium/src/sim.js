/* ═══════════════════════ sim.js — mô phỏng nước, sức khỏe, bệnh, ép đẻ ═══════════════════════ */

const EVENTS = []; // sự kiện cho UI hiển thị (toast)
function emit(type, text, icon) { EVENTS.push({ type, text, icon }); addLog(text, icon); }

function ambientTemp(ts = now()) {
  const d = new Date(ts);
  const hour = d.getHours() + d.getMinutes() / 60;
  return 26.5 + 1.5 * Math.sin(((hour - 9) / 24) * Math.PI * 2);
}
function isNight(ts = now()) { const h = new Date(ts).getHours(); return h >= 19 || h < 6; }

/* Tổng hợp bối cảnh của một hồ: tải sinh học, cây, chỗ trốn, loài… */
function tankContext(t) {
  const fs = fishIn(t.id);
  const d = tankDims(t);
  let bioload = 0, plants = 0, hide = 0, bubbler = 0, dirtCleaners = 0, algaeEaters = 0;
  const count = {};
  for (const f of fs) {
    const sp = SPECIES[f.sp];
    count[f.sp] = (count[f.sp] || 0) + 1;
    if (!sp.invert) bioload += sp.size * sp.bioload * (0.3 + 0.7 * f.growth);
    if (sp.cleaner === 'dirt' || sp.cleaner === 'both') dirtCleaners++;
    if (sp.cleaner === 'algae' || sp.cleaner === 'both') algaeEaters++;
  }
  for (const dc of t.deco) {
    const D = DECO[dc.type]; if (!D) continue;
    if (D.plant) plants++;
    hide += D.hide || 0;
    if (D.kind === 'bubbler') bubbler++;
  }
  const aggr = fs.filter((f) => SPECIES[f.sp].temper === 'aggr');
  const nippers = fs.filter((f) => SPECIES[f.sp].nipper);
  const predators = fs.filter((f) => SPECIES[f.sp].temper === 'semi' && SPECIES[f.sp].size >= 12 && f.growth > 0.7);
  const medHarm = !!(t.med && MEDS[t.med.type].harmInverts);
  return { fs, d, litres: d.litres, bioload, ratio: bioload / d.litres, plants, hide, bubbler, dirtCleaners, algaeEaters, count, aggr, nippers, predators, medHarm };
}

/* Nguyên nhân căng thẳng của một con cá → [{text, val}] */
function stressReasons(f, t, c) {
  const sp = SPECIES[f.sp], w = t.water, k = sp.hardy, r = [];
  const add = (text, val) => { if (val > 0.5) r.push({ text, val }); };
  if (f.hunger > 50) add('Đói', (f.hunger - 50) * 0.4);
  if (w.ammonia > 10) add('Nước độc (ammonia ' + Math.round(w.ammonia) + ')', (w.ammonia - 10) * 0.55 * k);
  if (w.dirt > 45) add('Hồ bẩn', (w.dirt - 45) * 0.3 * k);
  const dev = w.temp < sp.temp[0] ? sp.temp[0] - w.temp : w.temp > sp.temp[1] ? w.temp - sp.temp[1] : 0;
  if (dev > 0.3) add(`Nhiệt độ ${w.temp.toFixed(1)}°C không phù hợp (cần ${sp.temp[0]}–${sp.temp[1]}°C)`, Math.min(40, dev * 9));
  if (w.o2 < 55) add('Thiếu oxy', (55 - w.o2) * 0.7);
  if (!sp.invert && c.ratio > 1) add('Hồ quá tải cá', Math.min(45, (c.ratio - 1) * 45));
  if (sp.school > 0 && (c.count[f.sp] || 0) < sp.school) add(`Thiếu đàn (${c.count[f.sp]}/${sp.school} con)`, c.count[f.sp] === 1 ? 22 : 14);
  if (sp.shy && c.hide < 1) add('Thiếu cây, chỗ trốn', 12);
  if (sp.minLitres && c.litres < sp.minLitres && t.kind === 'main') add(`Hồ quá nhỏ (cần ≥${sp.minLitres}L)`, 25);
  if (sp.temper === 'aggr' && c.count[f.sp] > 1) add('Đánh nhau với cá cùng loài', 30);
  const bully = c.aggr.find((o) => o.sp !== f.sp && !sp.invert && (sp.longFin || sp.size <= 5));
  if (bully) add(`Bị ${SPECIES[bully.sp].name} đuổi đánh`, 18);
  if (sp.longFin && c.nippers.some((o) => o.id !== f.id && o.sp !== f.sp)) add('Bị rỉa vây', 15);
  if (!sp.invert && sp.size <= 3 && c.predators.length) add('Bị cá lớn săn', 15);
  if (sp.invert && c.medHarm) add('Thuốc trong hồ gây hại', 60);
  if (sp.shy && t.eq.light === 2 && c.hide < 2) add('Đèn quá sáng', 5);
  const dm = (now() - f.movedAt) / 1000;
  if (dm < 600) add('Mới chuyển hồ', 12 * (1 - dm / 600));
  if (f.disease) add(DISEASES[f.disease.id].name, 10 + f.disease.sev * 15);
  if (!sp.invert && f.growth < 0.6 && t.kind === 'main' && c.predators.length) add('Cá con dễ bị ăn', 10);
  r.sort((a, b) => b.val - a.val);
  return r;
}

/* Cảnh báo thiết kế hồ */
function tankIssues(t) {
  const c = tankContext(t), out = [];
  const fishOnly = c.fs.filter((f) => !SPECIES[f.sp].invert);
  if (fishOnly.length && t.eq.filter === 0) out.push({ lvl: 'bad', text: 'Không có máy lọc: chất độc tích tụ nhanh.' });
  if (c.ratio > 1) out.push({ lvl: c.ratio > 1.5 ? 'bad' : 'warn', text: `Quá tải: ${Math.round(c.bioload)} cm cá cho ${c.litres}L (nên ≤ 1 cm/L).` });
  const seen = new Set();
  for (const f of c.fs) {
    const sp = SPECIES[f.sp]; if (seen.has(f.sp)) continue; seen.add(f.sp);
    if (sp.school > 0 && c.count[f.sp] < sp.school) out.push({ lvl: 'warn', text: `${sp.name} cần đàn ≥ ${sp.school} con (đang có ${c.count[f.sp]}).` });
    if (sp.shy && c.hide < 1) out.push({ lvl: 'warn', text: `${sp.name} nhút nhát, cần cây hoặc hang để trốn.` });
    if (sp.minLitres && c.litres < sp.minLitres && t.kind === 'main') out.push({ lvl: 'bad', text: `${sp.name} cần hồ ≥ ${sp.minLitres}L.` });
    if (sp.temper === 'aggr' && c.count[f.sp] > 1) out.push({ lvl: 'bad', text: `Hai ${sp.name} cùng hồ sẽ đánh nhau.` });
    if (sp.temp[0] > 27.5 && !t.eq.heater) out.push({ lvl: 'warn', text: `${sp.name} cần nước ${sp.temp[0]}°C+: nên bật máy sưởi.` });
    if (sp.temp[1] < 26 && ambientTemp() > sp.temp[1]) out.push({ lvl: 'warn', text: `${sp.name} thích nước mát (≤${sp.temp[1]}°C), trời đang nóng.` });
  }
  const ids = [...seen].map((id) => SPECIES[id]);
  for (let i = 0; i < ids.length; i++) for (let j = i + 1; j < ids.length; j++) {
    const a = ids[i], b = ids[j];
    if (a.invert || b.invert) continue;
    if (a.temp[0] > b.temp[1] || b.temp[0] > a.temp[1]) out.push({ lvl: 'bad', text: `${a.name} và ${b.name} cần nhiệt độ khác nhau, không thể cùng khoẻ.` });
  }
  for (const a of c.aggr) for (const o of c.fs) {
    if (o.sp === a.sp) continue; const so = SPECIES[o.sp];
    if (!so.invert && (so.longFin || so.size <= 5)) { out.push({ lvl: 'warn', text: `${SPECIES[a.sp].name} sẽ đuổi đánh ${so.name}.` }); break; }
  }
  if (c.nippers.length) { const v = c.fs.find((o) => SPECIES[o.sp].longFin && !SPECIES[o.sp].nipper); if (v) out.push({ lvl: 'warn', text: `${SPECIES[c.nippers[0].sp].name} sẽ rỉa vây ${SPECIES[v.sp].name}.` }); }
  if (c.predators.length) { const v = c.fs.find((o) => SPECIES[o.sp].size <= 3); if (v) out.push({ lvl: 'warn', text: `${SPECIES[c.predators[0].sp].name} lớn có thể ăn ${SPECIES[v.sp].name}.` }); }
  if (c.medHarm && c.fs.some((f) => SPECIES[f.sp].invert)) out.push({ lvl: 'bad', text: 'Thuốc đang dùng gây hại cho tép, ốc: chuyển chúng đi!' });
  if (c.plants && t.eq.light === 0) out.push({ lvl: 'warn', text: 'Cây thủy sinh cần đèn để sống tốt.' });
  if (t.eq.light === 2 && !c.algaeEaters) out.push({ lvl: 'warn', text: 'Đèn sáng mà không có ốc, cá lau kiếng: rêu sẽ mọc nhanh.' });
  if (!fishOnly.length && t.kind === 'main') out.push({ lvl: 'info', text: 'Hồ chưa có cá. Ghé Cửa hàng để mua.' });
  return out;
}

/* ── Nước ── */
function simWater(t, c, dt) {
  const w = t.water, h = dt / H;
  const filt = [0, 3, 8][t.eq.filter];
  w.dirt = clamp(w.dirt + (c.bioload * 0.06 - filt - c.dirtCleaners * 0.5 - (c.bioload ? 0 : 1)) * h, 0, 100);
  w.ammonia = clamp(w.ammonia + ((w.dirt / 100) * 4 + c.bioload * 0.03 - [0, 3, 8][t.eq.filter] - c.plants * 0.3) * h, 0, 100);
  const lightAlgae = t.eq.light * 1.4 * (1 + w.ammonia / 100);
  w.algae = clamp(w.algae + (lightAlgae - c.algaeEaters * 1.2 - (t.eq.light === 0 ? 1 : 0.2)) * h, 0, 100);
  const amb = ambientTemp();
  const target = t.eq.heater ? Math.max(amb, t.eq.heatTemp) : amb;
  w.temp += (target - w.temp) * Math.min(1, h * (t.eq.heater ? 2.5 : 1));
  const o2t = clamp(100 - c.ratio * 35 + (t.eq.air ? 15 : 0) + c.plants * 2.5 + c.bubbler * 6 - Math.max(0, w.temp - 28) * 4 - (isNight() ? w.algae * 0.1 : 0), 15, 100);
  w.o2 += (o2t - w.o2) * Math.min(1, dt / 600);
  if (t.med && t.med.until < now()) { t.med = null; }
}

function rotPellet(t) { t.water.dirt = clamp(t.water.dirt + 1.5, 0, 100); t.water.ammonia = clamp(t.water.ammonia + 0.8, 0, 100); }

/* Khi bù thời gian dài: mồi được ăn/rữa ngay */
function resolvePelletsCoarse(t, c) {
  if (!t.pellets.length) return;
  const eaters = c.fs.filter((f) => !SPECIES[f.sp].invert);
  for (const p of t.pellets) {
    eaters.sort((a, b) => b.hunger - a.hunger);
    const f = eaters[0];
    if (f && f.hunger > 8) eatPellet(f); else rotPellet(t);
  }
  t.pellets.length = 0;
}
function eatPellet(f) {
  if (f.hunger < 15) f.overfed = Math.min(6, f.overfed + 1);
  f.hunger = Math.max(0, f.hunger - 22);
}

/* ── Cá ── */
function simFish(f, t, c, dt, cheap) {
  const sp = SPECIES[f.sp], h = dt / H, w = t.water;
  // đói & tự kiếm ăn
  let hungerRate = 100 / (8 * H) * (f.growth < 0.6 ? 1.4 : 1);
  if ((sp.cleaner === 'dirt' || sp.cleaner === 'both') && w.dirt > 12) { hungerRate -= 100 / (12 * H); w.dirt = Math.max(0, w.dirt - 0.2 * h); }
  if ((sp.cleaner === 'algae' || sp.cleaner === 'both') && w.algae > 8) { hungerRate -= 100 / (12 * H); }
  if (sp.invert && w.dirt < 12 && w.algae < 8) hungerRate *= 0.5;
  f.hunger = clamp(f.hunger + hungerRate * dt, 0, 100);
  f.overfed = Math.max(0, f.overfed - h * 0.5);
  // lớn
  if (f.growth < 1) f.growth = Math.min(1, f.growth + dt / (45 * MIN) * (f.hunger < 70 ? 1 : 0.3));
  // căng thẳng (làm mượt, hằng số 2 phút)
  const reasons = cheap ? null : stressReasons(f, t, c);
  const target = reasons ? clamp(reasons.reduce((s, r) => s + r.val, 0), 0, 100) : f.stress;
  f.stress += (target - f.stress) * Math.min(1, dt / 120);
  // sức khỏe
  let dh = 0;
  if (f.stress < 30 && f.hunger < 70) dh += 6 * (1 - (f.stress / 30) * 0.5);
  if (f.stress > 55) dh -= ((f.stress - 55) / 45) * 9;
  if (f.hunger >= 95) dh -= 8;
  if (f.disease) dh -= f.disease.sev * (sp.invert ? 10 : 7);
  if (sp.invert && c.medHarm) dh -= 25;
  f.health = clamp(f.health + dh * h, 0, 100);
  // thu nhập (khách ngắm cá khoẻ)
  if (f.health >= 60 && f.stress < 50 && !sp.invert) {
    const inc = INCOME_MIN[sp.rarity] / 60 * (0.3 + 0.7 * f.growth) * dt;
    S.coins += inc; f.earned += inc; S.stats.earned += inc;
  }
  // bệnh
  if (!sp.invert) simDisease(f, t, c, dt, reasons);
  if (f.health <= 0) return 'dead';
  return null;
}

function simDisease(f, t, c, dt, reasons) {
  const sp = SPECIES[f.sp], w = t.water, h = dt / H;
  if (!f.disease) {
    const p = Math.pow(f.stress / 100, 2) * 0.8 * sp.hardy * h;
    if (Math.random() < p) {
      const dev = w.temp < sp.temp[0] ? sp.temp[0] - w.temp : w.temp > sp.temp[1] ? w.temp - sp.temp[1] : 0;
      const moved = (now() - f.movedAt) / 1000 < 900;
      const nipped = reasons ? reasons.some((r) => r.text.startsWith('Bị rỉa') || r.text.startsWith('Đánh nhau')) : false;
      const wts = {
        ich: 1 + dev * 3 + (moved ? 3 : 0),
        finrot: 0.5 + (w.dirt > 45 ? 3 : 0) + (nipped ? 4 : 0),
        fungus: 0.3 + (w.dirt > 60 ? 2 : 0),
        bloat: f.overfed >= 3 ? 4 : 0.1,
        velvet: 0.3 + (w.ammonia > 40 ? 3 : 0),
        swim: (sp.shape === 'fancy' || sp.shape === 'disc' ? 1 : 0.1) + (w.temp < sp.temp[0] ? 2 : 0) + (f.overfed >= 3 ? 1 : 0),
      };
      let sum = 0; for (const k in wts) sum += wts[k];
      let r = Math.random() * sum, id = 'ich';
      for (const k in wts) { r -= wts[k]; if (r <= 0) { id = k; break; } }
      f.disease = { id, sev: 0.1, since: now() };
      emit('disease', `${f.name} (${sp.name}) có dấu hiệu ${DISEASES[id].name}.`, '🤒');
    }
    return;
  }
  const D = DISEASES[f.disease.id];
  let rate = 1 / (4 * H); // nặng dần
  const medOK = t.med && t.med.type === D.med;
  if (medOK && w.dirt < 60) rate -= 1 / ((t.kind === 'hospital' ? 1.5 : 2.5) * H);
  else if (medOK) rate -= 1 / (5 * H);
  if (f.disease.id === 'ich' && w.temp >= 29) rate -= 1 / (6 * H);
  if ((f.disease.id === 'bloat' || f.disease.id === 'swim') && f.hunger > 60) rate -= 1 / (5 * H);
  if (f.disease.id === 'finrot' && w.dirt < 25 && w.ammonia < 15) rate -= 1 / (8 * H);
  if (f.stress < 25) rate -= 1 / (12 * H); // sức đề kháng
  f.disease.sev = clamp(f.disease.sev + rate * dt, 0, 1);
  if (f.disease.sev <= 0) {
    emit('cured', `${f.name} đã khỏi ${D.name}!`, '💚');
    f.disease = null; f.health = Math.min(100, f.health + 10);
    return;
  }
  if (D.contagious > 0) {
    const p = D.contagious * f.disease.sev * h;
    for (const o of c.fs) {
      if (o === f || o.disease || SPECIES[o.sp].invert) continue;
      if (Math.random() < p) { o.disease = { id: f.disease.id, sev: 0.08, since: now() }; emit('disease', `${o.name} bị lây ${D.name} từ ${f.name}.`, '🦠'); }
    }
  }
}

/* ── Ép đẻ ── */
function breedingInfo(a, b, t) {
  const sa = SPECIES[a.sp], sb = SPECIES[b.sp];
  if (sa.invert || sb.invert) return { ok: false, reason: 'Tép, ốc không ép đẻ được ở đây.' };
  const res = a.sp === b.sp ? sa : findRecipe(a.sp, b.sp);
  if (!res) return { ok: false, reason: `${sa.name} và ${sb.name} không lai được với nhau.` };
  if (!isAdult(a) || !isAdult(b)) return { ok: false, res, reason: 'Cả hai phải trưởng thành.' };
  if (a.disease || b.disease || a.health < 50 || b.health < 50) return { ok: false, res, reason: 'Cả hai phải khoẻ mạnh, không bệnh.' };
  if (a.sp === b.sp && a.sex === b.sex) return { ok: false, res, reason: 'Cùng loài cần một đực (♂) một cái (♀).' };
  const cd = 5 * MIN * 1000;
  if (now() - a.lastBreed < cd || now() - b.lastBreed < cd) return { ok: false, res, reason: 'Cá cần nghỉ ' + fmtDur((cd - Math.min(now() - a.lastBreed, now() - b.lastBreed)) / 1000) + ' nữa.' };
  const c = tankContext(t), w = t.water;
  const lines = [];
  const base = BREED_BASE[res.rarity]; lines.push({ text: `Cơ bản (${RARITY[res.rarity].name})`, v: pct(base) });
  let ch = base;
  const hm = 0.6 + 0.4 * ((a.health + b.health) / 200); ch *= hm; lines.push({ text: 'Sức khoẻ cha mẹ', v: '×' + hm.toFixed(2) });
  const q = 1 - clamp(w.ammonia / 100, 0, 0.5) - clamp(w.dirt / 200, 0, 0.25); ch *= q; lines.push({ text: 'Chất lượng nước', v: '×' + q.toFixed(2) });
  if (c.plants) { ch += 0.1; lines.push({ text: 'Có cây để đẻ trứng', v: '+10%' }); } else lines.push({ text: 'Không có cây đẻ trứng', v: '+0%' });
  const others = c.fs.length - 2;
  if (others > 0) { const pen = Math.min(0.3, others * 0.1); ch -= pen; lines.push({ text: `${others} cá khác quấy rầy`, v: '−' + pct(pen) }); }
  if (t.kind !== 'breed') { ch *= 0.5; lines.push({ text: 'Không phải hồ ép đẻ', v: '×0.5' }); }
  if (a.stress > 40 || b.stress > 40) { ch *= 0.8; lines.push({ text: 'Cha mẹ căng thẳng', v: '×0.8' }); }
  ch = clamp(ch, 0.02, 0.95);
  return { ok: true, res, chance: ch, duration: BREED_MIN[res.rarity] * 60, lines, discovered: !!S.discovered[res.id], same: a.sp === b.sp };
}

function startBreeding(t, a, b) {
  const info = breedingInfo(a, b, t);
  if (!info.ok) return info;
  t.breeding = { a: a.id, b: b.id, start: now(), end: now() + info.duration * 1000, chance: info.chance, result: info.res.id, same: info.same };
  a.lastBreed = b.lastBreed = now();
  addLog(`Bắt đầu ép ${a.name} × ${b.name} → ${info.discovered ? info.res.name : '???'} (${pct(info.chance)}, ${fmtDur(info.duration)})`, '🥚');
  return info;
}

function resolveBreeding(t) {
  const br = t.breeding; t.breeding = null;
  const a = fishById(br.a), b = fishById(br.b);
  const res = SPECIES[br.result];
  if (!a || !b || a.tankId !== t.id || b.tankId !== t.id) { emit('breedfail', 'Ép đẻ thất bại: cha mẹ không còn trong hồ.', '💔'); return; }
  if (Math.random() > br.chance) { emit('breedfail', `Trứng của ${a.name} × ${b.name} không nở. Thử lại sau nhé.`, '💔'); return; }
  const n = br.same ? randInt(2, 4) : res.rarity >= 4 ? 1 : randInt(1, 2);
  const first = !S.discovered[res.id];
  S.discovered[res.id] = true;
  for (let i = 0; i < n; i++) {
    const fry = newFish(res.id, t.id, { growth: 0.25, gen: Math.max(a.gen, b.gen) + 1, parents: [a.sp, b.sp] });
    fry.x = a.x + rand(-3, 3); fry.y = a.y + rand(-2, 2);
    S.fish.push(fry); S.stats.born++;
  }
  emit(first ? 'discover' : 'breed', first ? `🎉 Khám phá loài mới: ${res.name} (${RARITY[res.rarity].name})!` : `${n} cá con ${res.name} đã nở!`, first ? '✨' : '🐣');
}

/* ── Vòng mô phỏng ── */
function simulate(dt, cheap = false) {
  const dead = [];
  for (const t of S.tanks) {
    const c = tankContext(t);
    simWater(t, c, dt);
    if (cheap || dt > 5) resolvePelletsCoarse(t, c);
    for (const f of c.fs) if (simFish(f, t, c, dt, cheap) === 'dead') dead.push(f);
    if (t.breeding && now() >= t.breeding.end) resolveBreeding(t);
  }
  for (const f of dead) {
    S.fish.splice(S.fish.indexOf(f), 1); S.stats.died++;
    emit('death', `${f.name} (${SPECIES[f.sp].name}) đã chết${f.disease ? ' vì ' + DISEASES[f.disease.id].name : ''}.`, '🕊️');
  }
}

/* Bù thời gian khi mở lại: chạy mô phỏng thô theo bước 60s */
function catchUp() {
  const gap = Math.min(OFFLINE_CAP, (now() - S.lastSave) / 1000);
  if (gap < 30) return 0;
  const step = 60; let left = gap;
  const before = S.coins;
  // ép đẻ kết thúc trong lúc offline: resolveBreeding dùng now() nên vẫn đúng
  while (left > 0) { const dt = Math.min(step, left); simulate(dt, left > 3600); left -= dt; }
  return { gap, earned: S.coins - before };
}

/* ── Hành động ── */
function feedTank(t) {
  if (S.food <= 0) return false;
  const c = tankContext(t);
  const eaters = c.fs.filter((f) => !SPECIES[f.sp].invert).length;
  S.food--;
  const n = clamp(Math.round(eaters * 1.3) + 2, 3, 16);
  const d = tankDims(t);
  for (let i = 0; i < n; i++) t.pellets.push({ x: rand(d.W * 0.15, d.W * 0.85), y: rand(0.5, 2), vy: rand(0.8, 1.6), vx: rand(-0.3, 0.3), age: 0 });
  t.lastFed = now();
  return true;
}
function cleanTank(t, amt) {
  t.water.dirt = Math.max(0, t.water.dirt - amt);
  t.water.algae = Math.max(0, t.water.algae - amt * 0.9);
}
function waterChange(t) {
  const w = t.water;
  w.ammonia *= 0.7; w.dirt *= 0.85;
  w.temp = w.temp * 0.7 + 26 * 0.3;
  t.lastChange = now();
  for (const p of t.pellets) rotPellet(t); t.pellets.length = 0;
  addLog(`Thay 30% nước ${t.name}.`, '💧');
}
function applyMed(t, type) {
  if (!spend(MEDS[type].price)) return false;
  t.med = { type, until: now() + MED_HOURS * H * 1000 };
  addLog(`Dùng ${MEDS[type].name} cho ${t.name}.`, '💊');
  return true;
}
function moveFish(f, tankId) {
  const t = tankById(tankId); if (!t) return;
  const d = tankDims(t);
  f.tankId = tankId; f.movedAt = now();
  f.x = rand(d.W * 0.3, d.W * 0.7); f.y = SPECIES[f.sp].zone === 'bottom' ? d.H * 0.9 : d.H * 0.4; f.vx = 0; f.vy = 0;
  addLog(`Chuyển ${f.name} sang ${t.name}.`, '🫧');
}
function sellFish(f) {
  const v = fishValue(f);
  S.coins += v; S.stats.sold++;
  S.fish.splice(S.fish.indexOf(f), 1);
  addLog(`Bán ${f.name} (${SPECIES[f.sp].name}) được ${v} xu.`, '💰');
  return v;
}
function buyFish(spId, t) {
  const sp = SPECIES[spId];
  if (!spend(sp.price)) return null;
  const f = newFish(spId, t.id);
  S.fish.push(f);
  addLog(`Mua ${sp.name} "${f.name}" về ${t.name}.`, '🛒');
  return f;
}

/* ── Chẩn đoán ── */
function diagnose(f) {
  const t = tankById(f.tankId), c = tankContext(t), sp = SPECIES[f.sp];
  const reasons = stressReasons(f, t, c);
  const symptoms = [];
  let status, color;
  if (f.health < 25) { status = 'Nguy kịch'; color = '#ff4d4d'; }
  else if (f.disease) { status = 'Đang bệnh'; color = '#ff8a3d'; }
  else if (f.stress > 60) { status = 'Rất căng thẳng'; color = '#ffb347'; }
  else if (f.stress > 30) { status = 'Hơi căng thẳng'; color = '#ffd76a'; }
  else if (f.hunger > 70) { status = 'Đói'; color = '#ffd76a'; }
  else { status = 'Khoẻ mạnh'; color = '#5ad17a'; }
  if (f.disease) symptoms.push(...DISEASES[f.disease.id].symptoms);
  if (f.hunger > 70) symptoms.push('Đói, sục sạo tìm thức ăn');
  if (f.stress > 60 && !f.disease) symptoms.push('Kẹp vây, màu nhạt đi');
  if (f.health < 40) symptoms.push('Bơi lờ đờ, hay nằm gần đáy');
  if (t.water.o2 < 55) symptoms.push('Ngáp ở mặt nước');
  if (!symptoms.length) symptoms.push(sp.invert ? 'Đang chăm chỉ dọn hồ' : 'Bơi lội bình thường, ăn tốt');
  const steps = [];
  if (f.disease) {
    const D = DISEASES[f.disease.id];
    steps.push(...D.treat);
    if (t.kind !== 'hospital' && S.tanks.some((x) => x.kind === 'hospital')) steps.push('Chuyển sang hồ dưỡng bệnh để thuốc hiệu quả hơn và không lây lan');
  }
  for (const r of reasons.slice(0, 4)) {
    if (r.text === 'Đói') steps.push('Cho ăn (bấm Cho ăn ở thanh dưới)');
    else if (r.text.startsWith('Nước độc')) steps.push('Thay nước 30%, lắp/lên cấp máy lọc, thêm cây');
    else if (r.text === 'Hồ bẩn') steps.push('Dọn hồ (kéo tay lau qua hồ) và thêm cá chuột, tép dọn đáy');
    else if (r.text.startsWith('Nhiệt độ')) steps.push(t.water.temp < sp.temp[0] ? `Bật máy sưởi và đặt ${sp.temp[0]}–${sp.temp[1]}°C` : 'Tắt/hạ máy sưởi, hoặc chuyển sang hồ mát hơn');
    else if (r.text === 'Thiếu oxy') steps.push('Lắp máy sủi, thêm cây, giảm số cá');
    else if (r.text === 'Hồ quá tải cá') steps.push('Chuyển bớt cá sang hồ khác hoặc nâng cấp hồ lớn hơn');
    else if (r.text.startsWith('Thiếu đàn')) steps.push(`Mua thêm ${sp.name} cho đủ ${sp.school} con`);
    else if (r.text.startsWith('Thiếu cây')) steps.push('Vào Thiết kế, thêm cây thủy sinh hoặc hang đá');
    else if (r.text.startsWith('Hồ quá nhỏ')) steps.push('Nâng cấp hồ lớn hơn trong Thiết kế');
    else if (r.text.startsWith('Đánh nhau')) steps.push('Tách hai con hung dữ ra hai hồ');
    else if (r.text.startsWith('Bị ')) steps.push('Chuyển con này hoặc kẻ bắt nạt sang hồ khác');
    else if (r.text.startsWith('Thuốc')) steps.push('Chuyển tép, ốc sang hồ không có thuốc ngay');
  }
  return { status, color, symptoms, reasons, steps: [...new Set(steps)], disease: f.disease ? DISEASES[f.disease.id] : null };
}
