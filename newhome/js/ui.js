// ── HUD và các bảng (sheet). Không có luật game ở đây, chỉ hiển thị và gọi callback. ──
import { RES, RES_KEYS, BUILD, BUILD_ORDER, QUESTS, CAP, ENERGY, EMOTES, TILE } from './config.js';
import { S, $ } from './state.js';
import { invCount, hasBuilding, dist } from './sim.js';
import { inviteUrl, net } from './net.js';
import { charCanvas, LOOKS } from './char.js';

let H = {};
export function initUI(handlers) {
  H = handlers;
  $('sheet').addEventListener('click', e => { if (e.target === $('sheet') && !S.sheet?.modal) closeSheet(); });
  $('btnBuild').onclick = () => buildSheet();
  $('btnInvite').onclick = () => inviteSheet();
  $('btnQuest').onclick = () => { $('quest').classList.toggle('open'); };
  $('btnHome').onclick = () => leaveSheet();
  $('btnEmote').onclick = () => { $('emoteBar').hidden = !$('emoteBar').hidden; };
  const eb = $('emotes');
  for (const e of EMOTES) { const b = document.createElement('button'); b.textContent = e; b.onclick = () => { H.doAct({ a: 'emote', e }); $('emoteBar').hidden = true; }; eb.appendChild(b); }
  $('chatForm').onsubmit = ev => { ev.preventDefault(); const t = $('chatIn').value.trim(); if (t) H.doAct({ a: 'chat', text: t }); $('chatIn').value = ''; $('chatIn').blur(); $('emoteBar').hidden = true; };
  $('celebrateClose').onclick = () => { $('celebrate').hidden = true; };
}

// ── toast ──
export function toast(text, ms = 2800) {
  const box = $('toasts'), el = document.createElement('div');
  el.className = 'toast'; el.textContent = text; box.appendChild(el);
  while (box.children.length > 3) box.firstChild.remove();
  setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 300); }, ms);
}

// ── sheet chung ──
export function openSheet(kind, html, modal = false) {
  S.sheet = { kind, modal };
  $('panel').innerHTML = html; $('sheet').hidden = false;
  $('panel').querySelectorAll('[data-close]').forEach(b => b.onclick = closeSheet);
}
export function closeSheet() { S.sheet = null; $('sheet').hidden = true; }
export function netSheet(emoji, title, msg, rows = [], modal = true) {
  openSheet('net', `<div class="big-emoji">${emoji}</div><h2>${title}</h2><p class="msg">${msg}</p><div class="rows"></div>`, modal);
  const box = $('panel').querySelector('.rows');
  for (const r of rows) {
    const row = document.createElement('div'); row.className = 'row';
    for (const b of r) { const e = document.createElement('button'); e.textContent = b.label; e.className = b.go ? 'go' : ''; e.onclick = () => b.fn(e); row.appendChild(e); }
    box.appendChild(row);
  }
}
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const costHtml = (cost, have) => Object.entries(cost).map(([k, n]) => `<span class="${have && (have[k] || 0) >= n ? 'ok' : ''}">${RES[k].icon} ${n}</span>`).join(' ');

// ── menu xây ──
export function buildSheet() {
  const me = S.players[S.me]; if (!me) return;
  const fam = {}; for (const p of Object.values(S.players)) for (const k of RES_KEYS) fam[k] = (fam[k] || 0) + (p.inv[k] || 0);
  for (const k of RES_KEYS) fam[k] += S.W.store[k] || 0;
  let html = `<h2>🔨 Xây gì nào?</h2><p class="msg">Đặt nền rồi cả nhà cùng góp vật liệu. Ai góp cũng được, không cần đủ một mình.</p><div class="blist">`;
  for (const k of BUILD_ORDER) {
    const d = BUILD[k], locked = d.needs && !hasBuilding(S.W, d.needs), once = k === 'house' && hasBuilding(S.W, 'house');
    html += `<button class="bitem ${locked || once ? 'locked' : ''}" data-kind="${k}" ${locked || once ? 'disabled' : ''}>
      <span class="bicon">${d.icon}</span><span class="binfo"><b>${d.name}</b> <small>${d.w}×${d.h} ô</small><br><span class="cost">${costHtml(d.cost, fam)}</span><br><small>${locked ? `🔒 Cần có ${BUILD[d.needs].name} trước.` : once ? '✅ Đã xây.' : d.desc}</small></span></button>`;
  }
  html += `</div><p class="hint">Cả nhà đang có: ${RES_KEYS.map(k => `${RES[k].icon}${fam[k] || 0}`).join(' ')}</p><div class="row"><button data-close>Đóng</button></div>`;
  openSheet('build', html);
  $('panel').querySelectorAll('.bitem').forEach(b => b.onclick = () => { closeSheet(); H.startPlacing(b.dataset.kind); });
}

// ── kho chung / tặng ──
export function transferSheet(target) {
  S.transfer = target;
  openSheet('transfer', '');
  refreshTransfer();
}
export function refreshTransfer() {
  const t = S.transfer, me = S.players[S.me]; if (!t || !me || !S.sheet || S.sheet.kind !== 'transfer') return;
  const other = t.type === 'store' ? S.W.store : (S.players[t.pid] || {}).inv || {};
  const title = t.type === 'store' ? '📦 Kho chung' : `🎁 Tặng ${esc((S.players[t.pid] || {}).name || '')}`;
  let html = `<h2>${title}</h2><div class="tgrid"><div class="th">Túi của bạn <small>${invCount(me.inv)}/${CAP}</small></div><div class="th"></div><div class="th">${t.type === 'store' ? 'Trong kho' : 'Túi bạn ấy'}</div>`;
  for (const k of RES_KEYS) {
    const a = me.inv[k] || 0, b = other[k] || 0;
    html += `<div class="tc">${RES[k].icon} <b>${a}</b></div><div class="tb">
      <button data-k="${k}" data-n="1" data-dir="in" ${a ? '' : 'disabled'}>${t.type === 'store' ? '→ 1' : 'Tặng 1'}</button>
      <button data-k="${k}" data-n="5" data-dir="in" ${a ? '' : 'disabled'}>${t.type === 'store' ? '→ 5' : 'Tặng 5'}</button>
      ${t.type === 'store' ? `<button data-k="${k}" data-n="1" data-dir="out" ${b ? '' : 'disabled'}>1 ←</button><button data-k="${k}" data-n="5" data-dir="out" ${b ? '' : 'disabled'}>5 ←</button>` : ''}
    </div><div class="tc">${RES[k].icon} <b>${b}</b></div>`;
  }
  html += `</div><div class="row"><button data-close>Đóng</button></div>`;
  const panel = $('panel');
  const scroll = panel.scrollTop;
  panel.innerHTML = html; panel.scrollTop = scroll;
  panel.querySelectorAll('[data-close]').forEach(b => b.onclick = closeSheet);
  panel.querySelectorAll('.tb button').forEach(b => b.onclick = () => {
    const m = t.type === 'store' ? { a: 'stash', res: b.dataset.k, n: +b.dataset.n, dir: b.dataset.dir } : { a: 'give', pid: t.pid, res: b.dataset.k, n: +b.dataset.n };
    H.doAct(m);
  });
}

// ── mời bạn ──
export function inviteSheet() {
  const online = net.on && net.peer && !net.peer.disconnected && net.peer.open;
  let html = `<h2>🔗 Mời cả nhà</h2>`;
  if (S.host) {
    html += online
      ? `<p class="msg">Gửi link này cho người nhà. Mở link là vào thẳng thế giới của bạn. Link không đổi, lần sau vẫn dùng được khi bạn mở lại thế giới.</p>
         <div class="linkrow"><input id="lbLink" readonly value="${esc(inviteUrl())}"><button id="lbCopy" class="go">Copy</button></div>
         ${navigator.share ? '<div class="row"><button id="lbShare">Chia sẻ…</button></div>' : ''}
         ${location.protocol === 'file:' ? '<p class="hint">⚠️ Đang mở từ file trên máy; link chỉ dùng được khi game được đưa lên web.</p>' : ''}`
      : `<p class="msg">Chưa kết nối được máy chủ tìm bạn. Bạn vẫn chơi một mình bình thường.</p><div class="row"><button id="lbRetry" class="go">Thử kết nối lại</button></div>`;
  } else html += `<p class="msg">Bạn đang là khách trong thế giới <b>${esc(S.code)}</b>. Nhờ chủ phòng gửi link cho người khác nhé.</p>`;
  html += `<h3>Gia đình</h3><div class="plist">`;
  for (const p of Object.values(S.players)) {
    html += `<div class="pl"><span class="pav" style="--c:${p.color}" data-av="${p.avatar}"></span><span class="pn">${esc(p.name)}${p.pid === S.me ? ' (bạn)' : ''}</span><span class="tg">${p.online === false ? 'offline' : 'online'}</span><span class="ct">❤️ ${S.W.contrib[p.pid] || 0}</span></div>`;
  }
  html += `</div><p class="hint">❤️ = số vật liệu đã góp vào công trình hoặc tặng người nhà.</p><div class="row"><button data-close>Đóng</button></div>`;
  openSheet('invite', html);
  $('panel').querySelectorAll('.pav').forEach(el => { const p = Object.values(S.players).find(x => x.avatar === el.dataset.av && x.color === el.style.getPropertyValue('--c')); el.appendChild(charCanvas(el.dataset.av, (p || {}).color || '#888', 28, 32, .58)); });
  const copy = $('lbCopy'); if (copy) copy.onclick = async () => {
    try { await navigator.clipboard.writeText(inviteUrl()); } catch (e) { $('lbLink').select(); try { document.execCommand('copy'); } catch (e2) {} }
    copy.textContent = '✓ Đã copy'; setTimeout(() => { copy.textContent = 'Copy'; }, 1600);
  };
  const sh = $('lbShare'); if (sh) sh.onclick = () => navigator.share({ title: 'Nhà Mới Của Chúng Ta', text: 'Vào xây nhà chung với mình nhé!', url: inviteUrl() }).catch(() => {});
  const rt = $('lbRetry'); if (rt) rt.onclick = () => { closeSheet(); H.reconnectHost(); };
  const lk = $('lbLink'); if (lk) lk.onclick = () => lk.select();
}

export function leaveSheet() {
  netSheet('🏠', 'Rời thế giới?', S.host ? 'Thế giới được lưu trên máy này. Khi bạn thoát, người nhà đang chơi sẽ bị ngắt; mở lại là tiếp tục.' : 'Bạn có thể vào lại bằng link mời bất kỳ lúc nào.',
    [[{ label: 'Ở lại', fn: closeSheet }, { label: 'Rời', go: true, fn: () => H.leave() }]], false);
}

// ── HUD ──
let lastInvHtml = '';
export function renderInv(me) {
  const box = $('inv'); let html = '';
  for (const k of RES_KEYS) {
    const n = me.inv[k] || 0, act = k === 'food' ? 'eat' : k === 'water' ? 'drink' : '';
    html += `<button class="slot ${n ? '' : 'empty'} ${act ? 'use' : ''}" data-act="${act}" title="${RES[k].name}${act ? ' — bấm để dùng' : ''}"><span>${RES[k].icon}</span><b>${n}</b></button>`;
  }
  const c = invCount(me.inv);
  html += `<div class="cap ${c >= CAP ? 'full' : ''}">${c}/${CAP}</div>`;
  if (html === lastInvHtml) return; lastInvHtml = html;
  box.innerHTML = html;
  box.querySelectorAll('.use').forEach(b => b.onclick = () => H.doAct({ a: b.dataset.act }));
}
export function renderEnergy(e) {
  $('energyFill').style.width = (e / ENERGY.max * 100) + '%';
  $('energyFill').className = e < ENERGY.slowBelow ? 'low' : '';
  $('energyTxt').textContent = e < ENERGY.slowBelow ? 'Đói — ăn 🍎 hoặc uống 💧' : Math.round(e);
}
export function setAction(t, t2) {
  const b = $('btnAct');
  b.disabled = !t || t.disabled; b.classList.toggle('bad', !!(t && t.ok === false));
  $('actIcon').textContent = t ? t.icon : '✋'; $('actLabel').textContent = t ? t.label : '';
  const b2 = $('btnAct2'); b2.hidden = !t2; if (t2) b2.textContent = `${t2.icon} ${t2.label}`;
  $('btnCancel').hidden = !S.placing;
}
export function renderQuest() {
  const f = S.W.flags, done = QUESTS.every(q => f[q.key]);
  $('questList').innerHTML = QUESTS.map(q => `<li class="${f[q.key] ? 'done' : ''}">${f[q.key] ? '✅' : '⬜'} ${q.text}</li>`).join('')
    + (done ? '<li class="done">🎉 Xong! Giờ: thu hoạch lúa, xây kho và giếng, mở rộng rừng…</li>' : '');
  $('btnQuest').textContent = done ? '🎉' : `📜 ${QUESTS.filter(q => f[q.key]).length}/${QUESTS.length}`;
}
export function renderRoster() {
  const box = $('roster'); box.innerHTML = '';
  for (const p of Object.values(S.players)) {
    const el = document.createElement('button'); el.className = 'chip' + (p.online === false ? ' off' : '') + (p.pid === S.me ? ' me' : '');
    el.style.setProperty('--c', p.color); el.appendChild(charCanvas(p.avatar, p.color, 34, 38, .7)); el.title = p.name;
    el.onclick = () => {
      if (p.pid === S.me) return inviteSheet();
      const me = S.players[S.me];
      if (p.online === false) return toast(`${p.name} đang offline.`);
      if (dist(me, p) > TILE * 2.5) return toast(`Đến gần ${p.name} để tặng đồ nhé.`);
      transferSheet({ type: 'player', pid: p.pid });
    };
    box.appendChild(el);
  }
}
export function celebrate() {
  const el = $('celebrate'); el.hidden = false;
  const rain = $('rain'); rain.innerHTML = '';
  const em = ['🎉', '🎊', '✨', '🏠', '🌾', '❤️', '🌟'];
  for (let i = 0; i < 40; i++) { const s = document.createElement('span'); s.textContent = em[i % em.length]; s.style.left = Math.random() * 100 + '%'; s.style.animationDelay = Math.random() * 2 + 's'; s.style.animationDuration = 3 + Math.random() * 3 + 's'; s.style.fontSize = 18 + Math.random() * 22 + 'px'; rain.appendChild(s); }
  const names = Object.values(S.players).map(p => p.name).join(', ');
  $('celebrateNames').textContent = names;
}
