/* ═══════════════════════ ui.js — giao diện DOM, thao tác chạm ═══════════════════════ */

const $ = (s) => document.querySelector(s);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const UI = { panel: null, arg: null, mode: null, placing: null, designSel: null, shopTab: 'fish', designTab: 'tank', bookTab: 'all', breedPick: [], listAll: false, lastLive: 0 };
const rarBadge = (r) => `<span class="rar" style="background:${withAlpha(RARITY[r].color, .22)};color:${RARITY[r].color}">${RARITY[r].name}</span>`;

/* ── toast & modal ── */
function toast(text, cls = '') {
  const d = document.createElement('div'); d.className = 'toast ' + cls; d.textContent = text;
  $('#toasts').appendChild(d);
  setTimeout(() => d.classList.add('out'), 3200); setTimeout(() => d.remove(), 3700);
}
function modal(html, buttons) {
  const box = $('#modalBox'); box.innerHTML = html;
  const row = document.createElement('div'); row.className = 'row';
  for (const b of buttons) { const bt = document.createElement('button'); bt.className = 'pbtn ' + (b.cls || ''); bt.textContent = b.label; bt.onclick = () => { $('#modal').hidden = true; b.fn && b.fn(); }; row.appendChild(bt); }
  box.appendChild(row); $('#modal').hidden = false;
}
const confirmModal = (title, text, ok, fn, cls = 'red') => modal(`<h2>${esc(title)}</h2><p>${text}</p>`, [{ label: 'Huỷ', cls: 'ghost' }, { label: ok, cls, fn }]);
function promptModal(title, value, fn) {
  modal(`<h2>${esc(title)}</h2><input type="text" id="mInput" value="${esc(value)}" maxlength="18" style="width:100%;font-size:16px;padding:10px">`, [{ label: 'Huỷ', cls: 'ghost' }, { label: 'Lưu', fn: () => fn($('#mInput').value.trim() || value) }]);
  setTimeout(() => $('#mInput')?.focus(), 50);
}

/* ── biểu tượng loài ── */
const ICON_CACHE = new Map();
function speciesIcon(spId, size = 46, silhouette = false) {
  const key = spId + '|' + size + '|' + silhouette;
  if (ICON_CACHE.has(key)) { const src = ICON_CACHE.get(key), c2 = document.createElement('canvas'); c2.width = src.width; c2.height = src.height; c2.getContext('2d').drawImage(src, 0, 0); return c2; }
  const sp = SPECIES[spId], c = document.createElement('canvas'); const dpr = Math.min(2, devicePixelRatio || 1);
  c.width = c.height = size * dpr; const ctx = c.getContext('2d'); ctx.scale(dpr, dpr);
  const extra = sp.shape === 'veil' || sp.shape === 'fan' || sp.shape === 'phoenix' ? 1.9 : sp.shape === 'dragon' ? 1.2 : 1.35;
  const s = (size * 0.86) / (sp.size * extra);
  const L = { x: 0, y: 0, s, W: 100, H: 100 };
  const f = { id: spId, sp: spId, x: (size / 2 + (sp.shape === 'veil' || sp.shape === 'fan' ? size * 0.12 : 0)) / s, y: size / 2 / s, vx: 1, vy: 0, growth: 1, health: 100, disease: null, variant: 0 };
  drawFish(ctx, f, L, 1.3, { face: 1, phase: 0.6, speedN: 0.3 });
  if (silhouette) { ctx.globalCompositeOperation = 'source-atop'; ctx.fillStyle = '#233043'; ctx.fillRect(0, 0, size, size); }
  ICON_CACHE.set(key, c); return c;
}
function decoIcon(type, w = 90, h = 56) {
  const c = document.createElement('canvas'); const dpr = Math.min(2, devicePixelRatio || 1);
  c.width = w * dpr; c.height = h * dpr; const ctx = c.getContext('2d'); ctx.scale(dpr, dpr);
  const D = DECO[type]; const s = Math.min((w * 0.8) / D.w, (h * 0.85) / D.h);
  const L = { x: 0, y: 0, s, w, h }; // groundY dùng L.y+L.h
  drawDeco(ctx, { id: type, type, x: (w / 2) / s, flip: false }, { ...L, y: 0, h: h - 4 }, 1);
  return c;
}

/* ── HUD ── */
function refreshHUD() {
  $('#coinsV').textContent = fmtCoins(S.coins);
  $('#foodV').textContent = S.food;
  const t = curTank();
  renderTabs(); renderGauges(t);
  const issues = tankIssues(t).filter((i) => i.lvl !== 'info');
  const sick = fishIn(t.id).filter((f) => f.disease).length;
  const wb = $('#warnBadge'); const n = issues.length + sick;
  wb.hidden = n === 0; wb.querySelector('span').textContent = n;
  const bb = $('#breedBadge');
  if (t.breeding) { bb.hidden = false; bb.querySelector('span').textContent = fmtDur((t.breeding.end - now()) / 1000); } else bb.hidden = true;
  document.querySelector('[data-act=clean]').classList.toggle('on', UI.mode === 'clean');
  document.querySelector('[data-act=design]').classList.toggle('on', UI.panel === 'design');
}
function renderTabs() {
  const box = $('#tankTabs'); box.innerHTML = '';
  for (const t of S.tanks) {
    const b = document.createElement('button'); b.className = 'tab' + (t.id === S.current ? ' on' : '');
    const bad = tankIssues(t).some((i) => i.lvl === 'bad') || fishIn(t.id).some((f) => f.disease || f.health < 40);
    if (bad) b.classList.add('warn');
    b.innerHTML = `${KIND_ICON[t.kind]} <span>${esc(t.name)}</span><i class="dot"></i>`;
    b.onclick = () => switchTank(t.id); box.appendChild(b);
  }
  if (S.tanks.length < MAX_TANKS) { const b = document.createElement('button'); b.className = 'tab add'; b.textContent = '+'; b.title = 'Thêm hồ'; b.onclick = () => openPanel('tanks'); box.appendChild(b); }
}
function switchTank(id) {
  if (S.current === id) return;
  S.current = id; R.bubbles.length = 0; R.debris.length = 0; R.selected = null; UI.breedPick = []; UI.designSel = null;
  if (UI.panel === 'fish') closePanel(); else if (UI.panel) renderPanel();
  onLayoutChange(); refreshHUD();
}
function renderGauges(t) {
  const w = t.water, box = $('#gauges');
  const fs = fishIn(t.id).filter((f) => !SPECIES[f.sp].invert);
  let lo = -Infinity, hi = Infinity; for (const f of fs) { lo = Math.max(lo, SPECIES[f.sp].temp[0]); hi = Math.min(hi, SPECIES[f.sp].temp[1]); }
  const tempCls = !fs.length ? '' : w.temp < lo - 0.5 || w.temp > hi + 0.5 ? 'bad' : w.temp < lo || w.temp > hi ? 'warn' : '';
  const g = (label, val, text, cls) => `<div class="gauge ${cls}"><span>${label}</span><b>${text}</b><div class="bar"><i style="width:${clamp(val, 0, 100)}%"></i></div></div>`;
  const cl = (v, warn, bad) => (v >= bad ? 'bad' : v >= warn ? 'warn' : '');
  box.innerHTML =
    g('🌡 Nhiệt', ((w.temp - 15) / 20) * 100, w.temp.toFixed(1) + '°', tempCls) +
    g('✨ Sạch', 100 - w.dirt, Math.round(100 - w.dirt) + '%', cl(w.dirt, 45, 70)) +
    g('☠ Độc', w.ammonia, Math.round(w.ammonia), cl(w.ammonia, 25, 50)) +
    g('💨 Oxy', w.o2, Math.round(w.o2) + '%', w.o2 < 45 ? 'bad' : w.o2 < 60 ? 'warn' : '') +
    g('🟢 Rêu', w.algae, Math.round(w.algae) + '%', cl(w.algae, 40, 70));
}

/* ── bảng bên ── */
function openPanel(kind, arg) {
  UI.panel = kind; UI.arg = arg; $('#panel').hidden = false; renderPanel(); refreshHUD();
  if (kind !== 'design') exitMode();
  onLayoutChange();
}
function closePanel() { UI.panel = null; $('#panel').hidden = true; R.selected = null; exitMode(); refreshHUD(); onLayoutChange(); }
function exitMode() { UI.mode = null; UI.placing = null; R.ghost = null; R.clean = null; $('#cleanHint').hidden = true; $('#placeHint').hidden = true; }
function renderPanel() {
  const body = $('#panelBody'); const st = body.scrollTop;
  const map = { fish: fishPanel, shop: shopPanel, fishlist: fishListPanel, design: designPanel, breed: breedPanel, book: bookPanel, tanks: tanksPanel, issues: issuesPanel, log: logPanel, help: helpPanel };
  const fn = map[UI.panel]; if (!fn) return;
  const out = fn(); if (!out) return;
  $('#panelTitle').textContent = out.title; body.innerHTML = out.html;
  out.bind && out.bind(body); body.scrollTop = st;
}
const bar = (label, v, color) => `<div class="stat"><span>${label}</span><div class="bar"><i style="width:${clamp(v, 0, 100)}%;background:${color}"></i></div><span>${Math.round(v)}</span></div>`;
const hcol = (v) => (v > 60 ? '#5ad17a' : v > 30 ? '#ffb347' : '#ff5e5e');

/* Cá */
function fishPanel() {
  const f = fishById(UI.arg); if (!f) { closePanel(); return null; }
  const sp = SPECIES[f.sp], t = tankById(f.tankId), dg = diagnose(f);
  const others = S.tanks.filter((x) => x.id !== f.tankId);
  const html = `
  <div class="card"><div class="ic" id="fIcon"></div><div class="info"><b>${esc(f.name)} <button class="pbtn ghost" id="rename" style="padding:2px 8px">✏️</button></b>
    <small>${esc(sp.name)} · ${esc(sp.sub)} ${rarBadge(sp.rarity)}</small>
    <small>${f.sex === 'M' ? '♂ Đực' : '♀ Cái'} · ${isAdult(f) ? 'Trưởng thành' : 'Cá con ' + Math.round(f.growth * 100) + '%'} · ${fmtDur(ageSec(f))} tuổi${f.gen ? ' · Đời F' + f.gen : ''}</small></div></div>
  <div class="status" style="color:${dg.color}">● ${dg.status}</div>
  ${bar('Sức khoẻ', f.health, hcol(f.health))}${bar('Đói', f.hunger, hcol(100 - f.hunger))}${bar('Căng thẳng', f.stress, hcol(100 - f.stress))}
  <div class="sec"><h3>Biểu hiện</h3><ul class="list">${dg.symptoms.map((s) => `<li>${esc(s)}</li>`).join('')}</ul></div>
  ${dg.disease ? `<div class="sec"><h3>Chẩn đoán</h3><div class="card" style="border-color:var(--bad)"><div class="info"><b>${esc(dg.disease.name)} · mức ${Math.round(f.disease.sev * 100)}%</b><small>${esc(dg.disease.causes)}</small></div></div></div>` : ''}
  ${dg.reasons.length ? `<div class="sec"><h3>Nguyên nhân căng thẳng</h3><ul class="list">${dg.reasons.map((r) => `<li class="${r.val > 15 ? 'bad' : 'warn'}">${esc(r.text)} <small style="color:var(--muted)">(+${Math.round(r.val)})</small></li>`).join('')}</ul></div>` : ''}
  ${dg.steps.length ? `<div class="sec"><h3>Hướng xử lý</h3><ul class="list">${dg.steps.map((s) => `<li>${esc(s)}</li>`).join('')}</ul></div>` : ''}
  ${dg.disease ? `<div class="row"><button class="pbtn gold" id="medNow">💊 ${esc(MEDS[dg.disease.med].name)} · ${MEDS[dg.disease.med].price} xu${t.med && t.med.type === dg.disease.med ? ' (đang dùng)' : ''}</button></div>` : ''}
  <div class="sec"><h3>Chuyển hồ</h3><div class="row">${others.map((o) => `<button class="pbtn ghost" data-move="${o.id}">${KIND_ICON[o.kind]} ${esc(o.name)}</button>`).join('') || '<span class="note">Chưa có hồ khác. Thêm hồ bằng nút + phía trên.</span>'}</div></div>
  <div class="sec"><div class="kv"><span>Đã kiếm được</span><b>${fmtCoins(f.earned)} xu</b></div><div class="kv"><span>Giá bán</span><b>${fishValue(f)} xu</b></div>${f.parents ? `<div class="kv"><span>Cha mẹ</span><span>${esc(SPECIES[f.parents[0]]?.name || '?')} × ${esc(SPECIES[f.parents[1]]?.name || '?')}</span></div>` : ''}</div>
  <p class="note">${esc(sp.desc)} Nhiệt độ ${sp.temp[0]}–${sp.temp[1]}°C${sp.school ? ` · đàn ≥ ${sp.school}` : ''}${sp.minLitres ? ` · hồ ≥ ${sp.minLitres}L` : ''}.</p>
  <button class="pbtn red big" id="sell">💰 Bán ${fishValue(f)} xu</button>`;
  return { title: 'Thông tin cá', html, bind(b) {
    b.querySelector('#fIcon').appendChild(speciesIcon(f.sp));
    b.querySelector('#rename').onclick = () => promptModal('Đặt tên cá', f.name, (v) => { f.name = v; renderPanel(); });
    b.querySelector('#sell').onclick = () => confirmModal('Bán cá?', `Bán <b>${esc(f.name)}</b> (${esc(sp.name)}) được <b>${fishValue(f)} xu</b>.`, 'Bán', () => { const v = sellFish(f); toast(`+${v} xu`, 'gold'); closePanel(); });
    b.querySelectorAll('[data-move]').forEach((bt) => bt.onclick = () => { moveFish(f, bt.dataset.move); toast(`Đã chuyển ${f.name}`); switchTank(bt.dataset.move); openPanel('fish', f.id); });
    const m = b.querySelector('#medNow'); if (m) m.onclick = () => useMed(t, dg.disease.med);
  } };
}
function useMed(t, type) {
  const M = MEDS[type];
  const inv = fishIn(t.id).filter((f) => SPECIES[f.sp].invert);
  const go = () => { if (applyMed(t, type)) { toast(`Đã dùng ${M.name}`, 'good'); refreshHUD(); renderPanel(); } else toast('Không đủ xu', 'bad'); };
  if (M.harmInverts && inv.length) confirmModal('Thuốc hại tép, ốc!', `Trong hồ có ${inv.length} tép/ốc. ${esc(M.name)} sẽ làm chúng chết dần. Chuyển chúng sang hồ khác trước, hoặc vẫn dùng?`, 'Vẫn dùng', go);
  else go();
}

/* Danh sách cá */
function fishCard(f, extra = '') {
  const sp = SPECIES[f.sp], dg = diagnose(f);
  return `<div class="card fcard" data-id="${f.id}"><div class="ic" data-ic="${f.sp}"></div><div class="info"><b>${esc(f.name)} <span style="color:${dg.color};font-size:12px">● ${dg.status}</span></b>
    <small>${esc(sp.name)} ${rarBadge(sp.rarity)} · ${isAdult(f) ? 'Trưởng thành' : 'Cá con'} ${f.sex === 'M' ? '♂' : '♀'}</small>
    <div class="stat" style="grid-template-columns:1fr;margin:4px 0 0"><div class="bar"><i style="width:${f.health}%;background:${hcol(f.health)}"></i></div></div></div>${extra}</div>`;
}
function bindIcons(b) { b.querySelectorAll('[data-ic]').forEach((d) => d.appendChild(speciesIcon(d.dataset.ic))); }
function fishListPanel() {
  const t = curTank();
  const list = UI.listAll ? S.fish : fishIn(t.id);
  const c = tankContext(t);
  const html = `<div class="tabs"><button class="${UI.listAll ? '' : 'on'}" id="lCur">Hồ này (${fishIn(t.id).length})</button><button class="${UI.listAll ? 'on' : ''}" id="lAll">Tất cả (${S.fish.length})</button></div>
  <p class="note">Tải cá: ${Math.round(c.bioload)} / ${c.litres} cm·L ${c.ratio > 1 ? '<span style="color:var(--bad)">— quá tải!</span>' : ''}</p>
  ${list.map((f) => fishCard(f, UI.listAll ? `<div class="act"><small style="color:var(--muted)">${esc(tankById(f.tankId).name)}</small></div>` : '')).join('') || '<p class="note">Chưa có cá nào. Ghé Cửa hàng nhé!</p>'}`;
  return { title: 'Đàn cá', html, bind(b) {
    bindIcons(b);
    b.querySelector('#lCur').onclick = () => { UI.listAll = false; renderPanel(); };
    b.querySelector('#lAll').onclick = () => { UI.listAll = true; renderPanel(); };
    b.querySelectorAll('.fcard').forEach((d) => d.onclick = () => { const f = fishById(d.dataset.id); if (f.tankId !== S.current) switchTank(f.tankId); R.selected = f.id; openPanel('fish', f.id); });
  } };
}

/* Cửa hàng */
function shopPanel() {
  const t = curTank(), tab = UI.shopTab;
  let html = `<div class="tabs">${[['fish', '🐟 Cá'], ['inv', '🦐 Tép, ốc'], ['sup', '🧴 Đồ dùng']].map(([k, n]) => `<button class="${tab === k ? 'on' : ''}" data-tab="${k}">${n}</button>`).join('')}</div>`;
  if (tab === 'fish' || tab === 'inv') {
    const list = BUYABLE.filter((s) => !!s.invert === (tab === 'inv'));
    html += `<p class="note">Mua vào: <b>${KIND_ICON[t.kind]} ${esc(t.name)}</b> (${tankDims(t).litres}L)</p>`;
    html += list.map((s) => {
      const bad = (s.minLitres && tankDims(t).litres < s.minLitres && t.kind === 'main') ? `Cần hồ ≥ ${s.minLitres}L` : '';
      return `<div class="card ${S.coins < s.price ? 'dis' : ''}"><div class="ic" data-ic="${s.id}"></div><div class="info"><b>${esc(s.name)} ${rarBadge(s.rarity)}</b>
        <small>${esc(s.sub)} · ${s.size} cm · ${s.temp[0]}–${s.temp[1]}°C${s.school ? ` · đàn ≥ ${s.school}` : ''}${s.temper === 'aggr' ? ' · hung dữ' : s.nipper ? ' · rỉa vây' : ''}</small>
        <small>${esc(s.desc)}</small>${bad ? `<small style="color:var(--warn)">⚠ ${bad}</small>` : ''}</div>
        <div class="act"><button class="pbtn gold" data-buy="${s.id}">${s.price} xu</button>${s.school >= 3 ? `<button class="pbtn ghost" data-buy="${s.id}" data-n="${s.school}">×${s.school} · ${s.price * s.school}</button>` : ''}</div></div>`;
    }).join('');
  } else {
    html += `<div class="sec"><h3>Thức ăn</h3><div class="card"><div class="ic" style="font-size:30px">🥣</div><div class="info"><b>Hộp thức ăn (20 lần)</b><small>Đang có ${S.food} lần cho ăn. Cho ăn quá nhiều làm nước bẩn và cá sình bụng.</small></div><div class="act"><button class="pbtn gold" id="buyFood">20 xu</button></div></div></div>
    <div class="sec"><h3>Thuốc (dùng ngay cho hồ ${esc(t.name)})</h3>${Object.entries(MEDS).map(([k, m]) => `<div class="card"><div class="ic" style="font-size:28px">💊</div><div class="info"><b>${esc(m.name)}</b><small>${esc(m.desc)} Hiệu lực ${MED_HOURS} giờ.</small>${t.med?.type === k ? `<small style="color:var(--good)">Đang dùng, còn ${fmtDur((t.med.until - now()) / 1000)}</small>` : ''}</div><div class="act"><button class="pbtn gold" data-med="${k}">${m.price} xu</button></div></div>`).join('')}</div>`;
  }
  return { title: 'Cửa hàng', html, bind(b) {
    bindIcons(b);
    b.querySelectorAll('[data-tab]').forEach((bt) => bt.onclick = () => { UI.shopTab = bt.dataset.tab; renderPanel(); });
    b.querySelectorAll('[data-buy]').forEach((bt) => bt.onclick = () => {
      const n = +(bt.dataset.n || 1), sp = SPECIES[bt.dataset.buy];
      if (S.coins < sp.price * n) return toast('Không đủ xu', 'bad');
      let last; for (let i = 0; i < n; i++) last = buyFish(sp.id, t);
      toast(`Đã mua ${n > 1 ? n + ' ' : ''}${sp.name}`, 'good'); refreshHUD(); renderPanel();
      const iss = tankIssues(t).filter((i) => i.lvl === 'bad'); if (iss.length) toast('⚠ ' + iss[0].text, 'bad');
    });
    const bf = b.querySelector('#buyFood'); if (bf) bf.onclick = () => { if (spend(20)) { S.food += 20; toast('+20 lần cho ăn', 'good'); refreshHUD(); renderPanel(); } else toast('Không đủ xu', 'bad'); };
    b.querySelectorAll('[data-med]').forEach((bt) => bt.onclick = () => useMed(t, bt.dataset.med));
  } };
}

/* Thiết kế */
function designPanel() {
  const t = curTank(), tab = UI.designTab, d = tankDims(t);
  let html = `<div class="tabs">${[['tank', '🫙 Hồ'], ['deco', '🌿 Trang trí'], ['eq', '⚙️ Thiết bị'], ['warn', `⚠ Cảnh báo`]].map(([k, n]) => `<button class="${tab === k ? 'on' : ''}" data-tab="${k}">${n}</button>`).join('')}</div>`;
  if (tab === 'tank') {
    html += `<div class="sec"><h3>Tên hồ</h3><div class="row"><span class="opt on" style="flex:1">${esc(t.name)}</span><button class="pbtn ghost" id="renameT">✏️</button></div></div>`;
    if (t.kind === 'main') {
      const cur = TANK_KINDS.main[t.size].price;
      html += `<div class="sec"><h3>Kích cỡ (${d.W}×${d.H} cm · ${d.litres}L)</h3><div class="grid3">${Object.entries(TANK_KINDS.main).map(([k, s]) => { const up = s.price - cur; return `<button class="opt ${t.size === k ? 'on' : ''}" data-size="${k}" ${s.price <= cur && t.size !== k ? 'disabled style="opacity:.4"' : ''}>${esc(s.name)}<small>${t.size === k ? 'đang dùng' : up > 0 ? 'nâng cấp ' + up + ' xu' : 'nhỏ hơn'}</small></button>`; }).join('')}</div><p class="note">Hồ lớn hơn chứa được nhiều cá, nước ổn định hơn. 1 cm cá cần khoảng 1 lít nước.</p></div>`;
    }
    html += `<div class="sec"><h3>Nền đáy</h3><div class="grid2">${Object.entries(SUBSTRATES).map(([k, s]) => `<button class="opt ${t.substrate === k ? 'on' : ''}" data-sub="${k}"><div class="swatch" style="background:${s.c1 ? `linear-gradient(${s.c1},${s.c2})` : 'transparent;border:1px dashed var(--line)'}"></div>${esc(s.name)}<small>${t.substrate === k ? 'đang dùng' : s.price + ' xu'}</small></button>`).join('')}</div></div>
    <div class="sec"><h3>Phông nền</h3><div class="grid2">${Object.entries(BACKGROUNDS).map(([k, s]) => `<button class="opt ${t.bg === k ? 'on' : ''}" data-bg="${k}"><div class="swatch" style="background:linear-gradient(${s.top},${s.bot})"></div>${esc(s.name)}<small>${t.bg === k ? 'đang dùng' : s.price + ' xu'}</small></button>`).join('')}</div></div>`;
    if (S.tanks.length > 1) html += `<button class="pbtn red big" id="delTank" ${fishIn(t.id).length ? 'disabled' : ''}>🗑 Bỏ hồ này ${fishIn(t.id).length ? '(hồ phải trống)' : ''}</button>`;
  } else if (tab === 'deco') {
    const sel = t.deco.find((x) => x.id === UI.designSel);
    html += `<p class="note">Chạm vào món trong hồ để chọn, kéo để di chuyển. Chọn món bên dưới rồi chạm vào hồ để đặt.</p>`;
    if (sel) { const D = DECO[sel.type]; html += `<div class="card sel"><div class="ic">${''}</div><div class="info"><b>${esc(D.name)}</b><small>${D.plant ? 'Cây thủy sinh: thêm oxy, hút độc, chỗ trốn' : D.hide ? 'Chỗ trốn cho cá nhút nhát' : 'Trang trí'}</small></div><div class="act"><button class="pbtn ghost" id="flipD">↔ Lật</button><button class="pbtn red" id="delD">🗑 Bỏ (+${Math.floor(D.price / 2)})</button></div></div>`; }
    const groups = [['plant', '🌿 Cây thủy sinh'], ['other', '🪨 Đá, gỗ, vật trang trí']];
    for (const [g, name] of groups) {
      const items = Object.entries(DECO).filter(([, D]) => (g === 'plant') === !!D.plant);
      html += `<div class="sec"><h3>${name}</h3><div class="deco-grid">${items.map(([k, D]) => `<button class="opt ${UI.placing === k ? 'on' : ''} ${S.coins < D.price ? 'dis' : ''}" data-deco="${k}"><canvas data-dc="${k}"></canvas>${esc(D.name)}<small>${D.price} xu${D.hide >= 1 ? ' · trốn' : ''}${D.o2 ? ' · O₂' : ''}</small></button>`).join('')}</div></div>`;
    }
    html += `<div class="sec"><h3>Đang có trong hồ (${t.deco.length})</h3><div class="row">${t.deco.map((x) => `<button class="pbtn ghost ${x.id === UI.designSel ? 'on' : ''}" data-selD="${x.id}" style="${x.id === UI.designSel ? 'border-color:var(--accent);color:#fff' : ''}">${esc(DECO[x.type]?.name || '?')}</button>`).join('') || '<span class="note">Trống</span>'}</div></div>`;
  } else if (tab === 'eq') {
    const E = EQUIPMENT, eq = t.eq;
    html += `<div class="sec"><h3>${E.filter.name}</h3><div class="grid3">${E.filter.levels.map((n, i) => `<button class="opt ${eq.filter === i ? 'on' : ''}" data-filter="${i}">${n}<small>${eq.filter === i ? 'đang dùng' : i > eq.filter ? (E.filter.price[i] - E.filter.price[eq.filter]) + ' xu' : 'hạ cấp'}</small></button>`).join('')}</div><p class="note">Lọc hút cặn và chuyển hoá chất độc. Hồ càng nhiều cá càng cần lọc lớn.</p></div>
    <div class="sec"><h3>${E.heater.name} ${eq.heater ? `· đặt ${eq.heatTemp}°C` : ''}</h3><div class="grid2"><button class="opt ${!eq.heater ? 'on' : ''}" data-heater="0">Tắt<small>nhiệt theo phòng ~${ambientTemp().toFixed(1)}°C</small></button><button class="opt ${eq.heater ? 'on' : ''}" data-heater="1">Bật<small>${eq.heaterBought ? 'giữ ấm nước' : E.heater.price + ' xu'}</small></button></div>
    ${eq.heater ? `<input type="range" min="22" max="32" step="0.5" value="${eq.heatTemp}" id="heatTemp"><p class="note">Sưởi chỉ làm ấm, không làm mát. Tăng lên 29–30°C giúp trị nấm trắng.</p>` : ''}</div>
    <div class="sec"><h3>${E.air.name}</h3><div class="grid2"><button class="opt ${!eq.air ? 'on' : ''}" data-air="0">Tắt</button><button class="opt ${eq.air ? 'on' : ''}" data-air="1">Bật<small>${eq.airBought ? 'thêm oxy' : E.air.price + ' xu'}</small></button></div></div>
    <div class="sec"><h3>${E.light.name}</h3><div class="grid3">${E.light.levels.map((n, i) => `<button class="opt ${eq.light === i ? 'on' : ''}" data-light="${i}">${n}<small>${eq.light === i ? 'đang dùng' : i > (eq.lightMax || 1) ? E.light.price[i] + ' xu' : 'miễn phí'}</small></button>`).join('')}</div><p class="note">Đèn giúp cây phát triển nhưng cũng nuôi rêu. Tắt đèn ban đêm để cá nghỉ.</p></div>`;
  } else {
    const iss = tankIssues(t);
    html += `<ul class="list">${iss.map((i) => `<li class="${i.lvl}">${i.lvl === 'bad' ? '⛔' : i.lvl === 'warn' ? '⚠️' : 'ℹ️'} ${esc(i.text)}</li>`).join('') || '<li class="info">✅ Hồ được thiết kế tốt, không có cảnh báo.</li>'}</ul>
    <div class="sec"><h3>Cá đang bệnh / căng thẳng</h3>${fishIn(t.id).filter((f) => f.disease || f.stress > 50).map((f) => fishCard(f)).join('') || '<p class="note">Không có.</p>'}</div>`;
  }
  return { title: '🎨 Thiết kế · ' + t.name, html, bind(b) {
    bindIcons(b);
    b.querySelectorAll('[data-tab]').forEach((bt) => bt.onclick = () => { UI.designTab = bt.dataset.tab; exitMode(); renderPanel(); });
    b.querySelectorAll('[data-dc]').forEach((c) => c.replaceWith(decoIcon(c.dataset.dc)));
    const rt = b.querySelector('#renameT'); if (rt) rt.onclick = () => promptModal('Tên hồ', t.name, (v) => { t.name = v; renderPanel(); refreshHUD(); });
    b.querySelectorAll('[data-size]').forEach((bt) => bt.onclick = () => { const k = bt.dataset.size, up = TANK_KINDS.main[k].price - TANK_KINDS.main[t.size].price; if (up <= 0) return; if (!spend(up)) return toast('Không đủ xu', 'bad'); t.size = k; for (const f of fishIn(t.id)) { f.x = Math.min(f.x, tankDims(t).W - 2); } for (const dc of t.deco) dc.x = Math.min(dc.x, tankDims(t).W - 3); toast('Đã nâng cấp hồ!', 'good'); onLayoutChange(); renderPanel(); refreshHUD(); });
    b.querySelectorAll('[data-sub]').forEach((bt) => bt.onclick = () => { const k = bt.dataset.sub; if (t.substrate === k) return; if (!spend(SUBSTRATES[k].price)) return toast('Không đủ xu', 'bad'); t.substrate = k; renderPanel(); });
    b.querySelectorAll('[data-bg]').forEach((bt) => bt.onclick = () => { const k = bt.dataset.bg; if (t.bg === k) return; if (!spend(BACKGROUNDS[k].price)) return toast('Không đủ xu', 'bad'); t.bg = k; renderPanel(); });
    const dt = b.querySelector('#delTank'); if (dt) dt.onclick = () => confirmModal('Bỏ hồ?', `Bỏ <b>${esc(t.name)}</b> và hoàn lại một nửa giá trị.`, 'Bỏ hồ', () => { const spec = tankSpec(t.kind, t.size); S.coins += Math.floor(spec.price / 2); S.tanks.splice(S.tanks.indexOf(t), 1); S.current = S.tanks[0].id; closePanel(); onLayoutChange(); });
    b.querySelectorAll('[data-deco]').forEach((bt) => bt.onclick = () => { const k = bt.dataset.deco; if (S.coins < DECO[k].price) return toast('Không đủ xu', 'bad'); UI.mode = 'place'; UI.placing = k; $('#placeHint').hidden = false; $('#placeHint b').textContent = DECO[k].name; renderPanel(); });
    b.querySelectorAll('[data-selD]').forEach((bt) => bt.onclick = () => { UI.designSel = bt.dataset.selD; renderPanel(); });
    const fd = b.querySelector('#flipD'); if (fd) fd.onclick = () => { const x = t.deco.find((z) => z.id === UI.designSel); if (x) x.flip = !x.flip; };
    const dd = b.querySelector('#delD'); if (dd) dd.onclick = () => { const i = t.deco.findIndex((z) => z.id === UI.designSel); if (i >= 0) { S.coins += Math.floor(DECO[t.deco[i].type].price / 2); t.deco.splice(i, 1); UI.designSel = null; renderPanel(); refreshHUD(); } };
    b.querySelectorAll('[data-filter]').forEach((bt) => bt.onclick = () => { const i = +bt.dataset.filter; if (i === t.eq.filter) return; const cost = i > t.eq.filter ? EQUIPMENT.filter.price[i] - EQUIPMENT.filter.price[t.eq.filter] : 0; if (!spend(cost)) return toast('Không đủ xu', 'bad'); t.eq.filter = i; renderPanel(); refreshHUD(); });
    b.querySelectorAll('[data-heater]').forEach((bt) => bt.onclick = () => { const on = bt.dataset.heater === '1'; if (on && !t.eq.heaterBought) { if (!spend(EQUIPMENT.heater.price)) return toast('Không đủ xu', 'bad'); t.eq.heaterBought = true; } t.eq.heater = on; renderPanel(); });
    const ht = b.querySelector('#heatTemp'); if (ht) ht.oninput = () => { t.eq.heatTemp = +ht.value; b.querySelector('h3:nth-of-type(1)'); renderPanelSoft(); };
    b.querySelectorAll('[data-air]').forEach((bt) => bt.onclick = () => { const on = bt.dataset.air === '1'; if (on && !t.eq.airBought) { if (!spend(EQUIPMENT.air.price)) return toast('Không đủ xu', 'bad'); t.eq.airBought = true; } t.eq.air = on; renderPanel(); });
    b.querySelectorAll('[data-light]').forEach((bt) => bt.onclick = () => { const i = +bt.dataset.light; if (i > (t.eq.lightMax || 1)) { if (!spend(EQUIPMENT.light.price[i])) return toast('Không đủ xu', 'bad'); t.eq.lightMax = i; } t.eq.light = i; renderPanel(); });
  } };
}
let softTimer = 0;
function renderPanelSoft() { clearTimeout(softTimer); softTimer = setTimeout(renderPanel, 400); }

/* Ép đẻ */
function breedPanel() {
  const t = curTank();
  if (t.breeding) {
    const br = t.breeding, a = fishById(br.a), b = fishById(br.b), res = SPECIES[br.result];
    const prog = clamp((now() - br.start) / (br.end - br.start), 0, 1);
    const known = S.discovered[res.id];
    const html = `<div class="card"><div class="ic" data-ic="${res.id}" ${known ? '' : 'data-sil="1"'}></div><div class="info"><b>${known ? esc(res.name) : '???'} ${rarBadge(res.rarity)}</b><small>${a ? esc(a.name) : '?'} × ${b ? esc(b.name) : '?'}</small></div></div>
    <div class="chance">${pct(br.chance)}<small>tỉ lệ thành công</small></div>
    <div class="prog"><i style="width:${prog * 100}%"></i></div><p class="note" style="text-align:center">Còn ${fmtDur((br.end - now()) / 1000)} · Giữ nước sạch, đừng chuyển cha mẹ đi.</p>
    <button class="pbtn red big" id="cancelB">Huỷ ép đẻ</button>`;
    return { title: '🥚 Đang ấp trứng', html, bind(bb) { bb.querySelectorAll('[data-ic]').forEach((d) => d.appendChild(speciesIcon(d.dataset.ic, 46, !!d.dataset.sil))); bb.querySelector('#cancelB').onclick = () => { t.breeding = null; renderPanel(); refreshHUD(); }; } };
  }
  const fs = fishIn(t.id).filter((f) => !SPECIES[f.sp].invert);
  const pk = UI.breedPick.filter((id) => fs.some((f) => f.id === id)); UI.breedPick = pk;
  let info = null;
  if (pk.length === 2) info = breedingInfo(fishById(pk[0]), fishById(pk[1]), t);
  let html = '';
  if (t.kind !== 'breed') html += `<p class="note">⚠ Đây không phải hồ ép đẻ: tỉ lệ giảm một nửa và cá khác quấy rầy. ${S.tanks.some((x) => x.kind === 'breed') ? 'Hãy chuyển hai cá sang hồ ép đẻ.' : '<a href="#" id="addBreed" style="color:var(--accent)">Thêm hồ ép đẻ (90 xu)</a>'}</p>`;
  html += `<p class="note">Chọn <b>hai</b> cá trưởng thành, khoẻ mạnh. Cùng loài (đực + cái) cho ra cá con cùng loài; hai loài khác nhau có thể tạo <b>loài lai mới</b>. Xem gợi ý trong Sổ tay.</p>`;
  if (pk.length === 2) {
    const res = info.res;
    html += `<div class="card" style="border-color:var(--gold)"><div class="ic">${res ? `<span data-ic="${res.id}" ${S.discovered[res.id] ? '' : 'data-sil=1'}></span>` : '❓'}</div><div class="info"><b>${res ? (S.discovered[res.id] ? esc(res.name) : '??? (chưa khám phá)') : 'Không lai được'} ${res ? rarBadge(res.rarity) : ''}</b><small>${info.ok ? `Thời gian: ${fmtDur(info.duration)}` : esc(info.reason)}</small></div></div>`;
    if (info.ok) html += `<div class="chance">${pct(info.chance)}<small>tỉ lệ thành công</small></div>${info.lines.map((l) => `<div class="kv"><span>${esc(l.text)}</span><b>${esc(l.v)}</b></div>`).join('')}<button class="pbtn gold big" id="startB">🥚 Bắt đầu ép đẻ</button>`;
  }
  html += `<div class="sec"><h3>Cá trong hồ (${fs.length})</h3>${fs.map((f) => fishCard(f, `<div class="act"><button class="pbtn ${pk.includes(f.id) ? '' : 'ghost'}" data-pick="${f.id}">${pk.includes(f.id) ? '✓ Chọn' : 'Chọn'}</button></div>`)).join('') || '<p class="note">Chưa có cá. Chuyển cá vào hồ này từ Thông tin cá.</p>'}</div>`;
  return { title: '🥚 Ép đẻ · ' + t.name, html, bind(bb) {
    bb.querySelectorAll('[data-ic]').forEach((d) => d.appendChild(speciesIcon(d.dataset.ic, 46, !!d.dataset.sil)));
    bb.querySelectorAll('[data-pick]').forEach((bt) => bt.onclick = (e) => { e.stopPropagation(); const id = bt.dataset.pick; if (UI.breedPick.includes(id)) UI.breedPick = UI.breedPick.filter((x) => x !== id); else { UI.breedPick.push(id); if (UI.breedPick.length > 2) UI.breedPick.shift(); } renderPanel(); });
    const sb = bb.querySelector('#startB'); if (sb) sb.onclick = () => { const r = startBreeding(t, fishById(pk[0]), fishById(pk[1])); if (r.ok) { toast('Bắt đầu ấp trứng 🥚', 'gold'); UI.breedPick = []; renderPanel(); refreshHUD(); } else toast(r.reason, 'bad'); };
    const ab = bb.querySelector('#addBreed'); if (ab) ab.onclick = (e) => { e.preventDefault(); openPanel('tanks'); };
  } };
}

/* Sổ tay */
function bookPanel() {
  const groups = [4, 3, 2, 1, 0];
  let html = `<p class="note">Đã khám phá ${Object.keys(S.discovered).length}/${Object.keys(SPECIES).length} loài · Sinh ${S.stats.born} · Bán ${S.stats.sold} · Kiếm ${fmtCoins(S.stats.earned)} xu</p>`;
  for (const r of groups) {
    const list = Object.values(SPECIES).filter((s) => s.rarity === r);
    html += `<div class="sec"><h3 style="color:${RARITY[r].color}">${RARITY[r].name}</h3>${list.map((s) => {
      const known = S.discovered[s.id];
      const par = s.parents ? s.parents.map((p) => (S.discovered[p] ? SPECIES[p].name : '???')).join(' × ') : 'Mua ở cửa hàng';
      return `<div class="card ${known ? '' : 'dis'}"><div class="ic" data-ic="${s.id}" ${known ? '' : 'data-sil=1'}></div><div class="info"><b>${known ? esc(s.name) : '???'} ${rarBadge(s.rarity)}</b><small>${s.parents ? '🥚 ' : ''}${esc(par)}</small>${known ? `<small>${esc(s.desc)}</small>` : `<small>Ép đẻ hai loài trên để khám phá. Tỉ lệ cơ bản ${pct(BREED_BASE[s.rarity])}, ${BREED_MIN[s.rarity]} phút.</small>`}</div></div>`;
    }).join('')}</div>`;
  }
  return { title: '📖 Sổ tay loài', html, bind(b) { b.querySelectorAll('[data-ic]').forEach((d) => d.appendChild(speciesIcon(d.dataset.ic, 46, !!d.dataset.sil))); } };
}

/* Thêm hồ */
function tanksPanel() {
  const opts = [['main', 'S'], ['main', 'M'], ['main', 'L'], ['breed', null], ['hospital', null]];
  const html = `<p class="note">Bạn có ${S.tanks.length}/${MAX_TANKS} hồ. Hồ phụ giúp nhân giống và cách ly cá bệnh, đúng như chơi hồ cá thật.</p>
  ${opts.map(([k, sz]) => { const s = tankSpec(k, sz); const price = k === 'main' && sz === 'S' ? 60 : s.price; return `<div class="card ${S.coins < price ? 'dis' : ''}"><div class="ic" style="font-size:30px">${KIND_ICON[k]}</div><div class="info"><b>${esc(s.name)}</b><small>${k === 'breed' ? 'Có rêu sẵn, tỉ lệ ép đẻ đầy đủ. Đặt 2 cá vào rồi bấm Ép đẻ.' : k === 'hospital' ? 'Không nền, có lọc. Thuốc hiệu quả hơn, không lây cho đàn.' : `${s.W}×${s.H} cm · ${s.litres} lít`}</small></div><div class="act"><button class="pbtn gold" data-k="${k}" data-sz="${sz || ''}" data-p="${price}">${price} xu</button></div></div>`; }).join('')}`;
  return { title: 'Thêm hồ mới', html, bind(b) {
    b.querySelectorAll('[data-k]').forEach((bt) => bt.onclick = () => {
      if (S.tanks.length >= MAX_TANKS) return toast('Đã đủ 6 hồ', 'bad');
      if (!spend(+bt.dataset.p)) return toast('Không đủ xu', 'bad');
      const k = bt.dataset.k, sz = bt.dataset.sz || null;
      const n = S.tanks.filter((x) => x.kind === k).length;
      const t = newTank(k, sz, k === 'main' ? `Hồ ${S.tanks.length + 1}` : tankSpec(k, sz).name.split(' ').slice(0, 3).join(' ') + (n ? ' ' + (n + 1) : ''));
      S.tanks.push(t); toast('Đã thêm hồ mới!', 'good'); switchTank(t.id); openPanel('design');
    });
  } };
}
function issuesPanel() { UI.designTab = 'warn'; return designPanel(); }
function logPanel() {
  const html = S.log.map((l) => `<div class="logline"><span>${l.icon}</span><span style="flex:1">${esc(l.text)}</span><small>${new Date(l.t).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</small></div>`).join('') || '<p class="note">Chưa có gì.</p>';
  return { title: '📜 Nhật ký', html: html + `<button class="pbtn red big" id="resetAll">Chơi lại từ đầu</button>`, bind(b) { b.querySelector('#resetAll').onclick = () => confirmModal('Xoá toàn bộ?', 'Mọi hồ, cá và xu sẽ mất. Không thể khôi phục.', 'Xoá và chơi lại', () => { resetState(); location.reload(); }); } };
}
function helpPanel() {
  return { title: '❔ Hướng dẫn', html: `<div class="help">
  <h4>🌊 Thời gian thực</h4><p class="note">Hồ chạy theo giờ thật: cá đói dần sau vài giờ, nước bẩn theo ngày, trứng nở sau vài phút đến vài chục phút. Khi bạn đóng game, mọi thứ vẫn tiếp diễn (tối đa 8 giờ).</p>
  <h4>🥣 Chăm sóc</h4><p class="note"><b>Cho ăn</b> khi cá đói (biểu tượng 🍽️). Cho ăn quá nhiều làm nước bẩn, cá sình bụng. <b>Dọn hồ</b>: kéo tay qua kính để lau rêu, hút cặn. <b>Thay nước 30%</b> giảm độc nhưng làm nhiệt độ dao động.</p>
  <h4>🎨 Thiết kế</h4><p class="note">Máy lọc là thứ quan trọng nhất. Cây thủy sinh thêm oxy, hút độc và là chỗ trốn. Mỗi loài có nhiệt độ, kích cỡ hồ, bạn cùng hồ phù hợp. Xem tab Cảnh báo trong Thiết kế.</p>
  <h4>🩺 Sức khoẻ</h4><p class="note">Chạm vào cá để xem sức khoẻ, biểu hiện, chẩn đoán và hướng xử lý. Cá căng thẳng lâu sẽ đổ bệnh; bệnh lây lan trong hồ. Hồ dưỡng bệnh giúp cách ly và thuốc hiệu quả hơn.</p>
  <h4>🥚 Lai tạo</h4><p class="note">Đưa hai cá trưởng thành vào hồ ép đẻ và bấm Ép đẻ. Cùng loài cần đực + cái. Hai loài khác nhau có thể ra loài lai hiếm với hình dạng đặc biệt. Loài càng hiếm, tỉ lệ càng thấp, ấp càng lâu. Lai loài lai với nhau để tạo loài huyền thoại!</p>
  <h4>💰 Xu</h4><p class="note">Cá khoẻ mạnh kiếm xu đều đặn (khách đến ngắm). Bán cá con để có vốn. Cá hiếm đáng giá hơn nhiều.</p>
  <h4>🐟 Tập tính</h4><p class="note">Cá đàn (neon, ngựa vằn, chuột) bơi theo nhóm và sợ khi lẻ loi. Cá nhút nhát trốn trong cây. Cá xiêm đuổi cá vây dài; tứ vân rỉa vây. Cá chuột, tép dọn đáy; ốc, lau kiếng ăn rêu.</p></div>` };
}

/* ── thao tác trên canvas ── */
function bindCanvas(cv) {
  let down = null, moved = false, lastPt = null;
  const pos = (e) => [e.clientX, e.clientY];
  cv.addEventListener('pointerdown', (e) => {
    const [x, y] = pos(e); const L = R.layout; if (!L) return; const t = curTank();
    down = { x, y }; moved = false; lastPt = [x, y];
    cv.setPointerCapture(e.pointerId);
    if (UI.mode === 'clean') { R.clean = { x, y }; return; }
    if (UI.mode === 'place' && UI.placing) {
      const [cx] = toCm(L, x, y); const D = DECO[UI.placing];
      if (x < L.x - 20 || x > L.x + L.w + 20 || y < L.y - 20 || y > L.y + L.h + 20) return;
      if (!spend(D.price)) return toast('Không đủ xu', 'bad');
      const dc = { id: uid(), type: UI.placing, x: clamp(cx, D.w / 2, L.W - D.w / 2), flip: Math.random() < 0.5 };
      t.deco.push(dc); UI.designSel = dc.id; toast(`Đã đặt ${D.name}`, 'good');
      exitMode(); renderPanel(); refreshHUD(); return;
    }
    if (UI.panel === 'design') {
      const hit = hitDeco(t, L, x, y);
      if (hit) { R.dragDeco = hit; UI.designSel = hit.id; return; }
    }
  });
  cv.addEventListener('pointermove', (e) => {
    const [x, y] = pos(e); const L = R.layout; if (!L) return;
    if (UI.mode === 'place' && UI.placing) { const [cx] = toCm(L, x, y); const D = DECO[UI.placing]; R.ghost = { id: 'ghost', type: UI.placing, x: clamp(cx, D.w / 2, L.W - D.w / 2), flip: false }; }
    if (!down) return;
    if (Math.hypot(x - down.x, y - down.y) > 6) moved = true;
    if (UI.mode === 'clean' && R.clean) {
      const dist = Math.hypot(x - lastPt[0], y - lastPt[1]);
      if (x > L.x && x < L.x + L.w && y > L.y && y < L.y + L.h) cleanTank(curTank(), (dist / L.w) * 22);
      R.clean = { x, y };
    }
    if (R.dragDeco) { const [cx] = toCm(L, x, y); const D = DECO[R.dragDeco.type]; R.dragDeco.x = clamp(cx, D.w / 2, L.W - D.w / 2); }
    lastPt = [x, y];
  });
  const up = (e) => {
    if (!down) return;
    const [x, y] = pos(e); const L = R.layout; const t = curTank();
    if (R.dragDeco) { R.dragDeco = null; renderPanel(); down = null; return; }
    if (UI.mode === 'clean') { down = null; return; }
    if (UI.mode === 'place') { down = null; return; }
    if (!moved && L) {
      const f = hitFish(t, L, x, y);
      if (f) { R.selected = f.id; openPanel('fish', f.id); }
      else if (UI.panel && UI.panel !== 'design') closePanel();
      else if (UI.panel === 'design') { UI.designSel = null; renderPanel(); }
    }
    down = null;
  };
  cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', () => { down = null; R.dragDeco = null; });
}
function hitFish(t, L, x, y) {
  let best = null, bd = 1e9;
  for (const f of fishIn(t.id)) {
    const [fx, fy] = toPx(L, f.x, f.y); const sp = SPECIES[f.sp];
    const r = Math.max(22, visSize(sp.size) * (0.35 + 0.65 * f.growth) * L.s * 0.6);
    const d = Math.hypot(fx - x, fy - y); if (d < r && d < bd) { bd = d; best = f; }
  }
  return best;
}
function hitDeco(t, L, x, y) {
  const gy = groundY(L);
  for (const dc of [...t.deco].reverse()) {
    const D = DECO[dc.type]; if (!D) continue; const [dx] = toPx(L, dc.x, 0);
    const w = Math.max(30, D.w * L.s), h = Math.max(30, D.h * L.s);
    if (Math.abs(x - dx) < w / 2 && y < gy + 8 && y > gy - h) return dc;
  }
  return null;
}

/* ── âm thanh nhẹ ── */
const Snd = { ctx: null, on: false, nodes: null };
function soundToggle() {
  if (!Snd.ctx) {
    try { Snd.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return toast('Thiết bị không hỗ trợ âm thanh', 'bad'); }
    const c = Snd.ctx, sr = c.sampleRate, buf = c.createBuffer(1, sr * 4, sr), d = buf.getChannelData(0);
    let last = 0; for (let i = 0; i < d.length; i++) { const w = Math.random() * 2 - 1; last = (last + 0.02 * w) / 1.02; d[i] = last * 3.5; }
    const src = c.createBufferSource(); src.buffer = buf; src.loop = true;
    const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 420;
    const g = c.createGain(); g.gain.value = 0;
    const lfo = c.createOscillator(); lfo.frequency.value = 0.18; const lg = c.createGain(); lg.gain.value = 0.05; lfo.connect(lg); lg.connect(g.gain);
    src.connect(lp); lp.connect(g); g.connect(c.destination); src.start(); lfo.start();
    Snd.nodes = { g };
    setInterval(() => { if (!Snd.on || Snd.ctx.state !== 'running') return; const o = c.createOscillator(), og = c.createGain(); const f0 = 500 + Math.random() * 900; o.frequency.setValueAtTime(f0, c.currentTime); o.frequency.exponentialRampToValueAtTime(f0 * 1.6, c.currentTime + 0.12); og.gain.setValueAtTime(0.03, c.currentTime); og.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + 0.15); o.connect(og); og.connect(c.destination); o.start(); o.stop(c.currentTime + 0.16); }, 900 + Math.random() * 1200);
  }
  Snd.on = !Snd.on; S.muted = !Snd.on;
  if (Snd.on) Snd.ctx.resume();
  Snd.nodes.g.gain.setTargetAtTime(Snd.on ? 0.16 : 0, Snd.ctx.currentTime, 0.4);
  $('#btnSound').textContent = Snd.on ? '🔊' : '🔇';
}

/* ── nút ── */
function bindUI() {
  $('#panelClose').onclick = closePanel;
  $('#btnHelp').onclick = () => openPanel('help');
  $('#btnLog').onclick = () => openPanel('log');
  $('#btnSound').onclick = soundToggle;
  $('#warnBadge').onclick = () => openPanel('issues');
  $('#breedBadge').onclick = () => openPanel('breed');
  $('#cleanDone').onclick = () => { exitMode(); refreshHUD(); };
  $('#placeCancel').onclick = () => { exitMode(); renderPanel(); };
  $('#modal').onclick = (e) => { if (e.target.id === 'modal') $('#modal').hidden = true; };
  document.querySelectorAll('#actions button').forEach((b) => b.onclick = () => {
    const act = b.dataset.act, t = curTank();
    if (act === 'feed') {
      if (!fishIn(t.id).some((f) => !SPECIES[f.sp].invert)) return toast('Hồ chưa có cá để cho ăn');
      if (!feedTank(t)) return toast('Hết thức ăn! Mua ở Cửa hàng → Đồ dùng', 'bad');
      const full = fishIn(t.id).every((f) => f.hunger < 20); if (full) toast('Cá đã no, cho ăn thêm sẽ hại cá & bẩn nước', 'bad');
      refreshHUD(); return;
    }
    if (act === 'clean') { if (UI.mode === 'clean') exitMode(); else { if (UI.panel) closePanel(); UI.mode = 'clean'; $('#cleanHint').hidden = false; } refreshHUD(); return; }
    if (act === 'water') { waterChange(t); toast('Đã thay 30% nước 💧', 'good'); refreshHUD(); return; }
    if (UI.panel === act) closePanel(); else openPanel(act);
  });
}

/* Sự kiện mô phỏng → toast */
function flushEvents() {
  for (const e of EVENTS.splice(0)) {
    const cls = e.type === 'death' || e.type === 'disease' || e.type === 'breedfail' ? 'bad' : e.type === 'discover' || e.type === 'breed' ? 'gold' : 'good';
    toast(`${e.icon} ${e.text}`, cls);
    if (e.type === 'breed' || e.type === 'discover' || e.type === 'death') { refreshHUD(); if (UI.panel) renderPanel(); }
  }
}
