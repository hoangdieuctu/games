// Giao diện: menu, thiết lập bộ bài, bàn làng, lượt hành động, lớp phủ (lật bài, buổi sáng, kết quả bỏ phiếu, kết thúc),
// lịch sử, luật chơi, cài đặt. Mọi thứ trên bàn vẽ từ "view" (WW.viewFor) — chơi với máy, chủ phòng hay khách đều như nhau.
const $ = id => document.getElementById(id);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} },
  del(k) { try { localStorage.removeItem(k); } catch (e) {} },
};
const K = { settings: 'werewolf.settings', setup: 'werewolf.setup', presets: 'werewolf.presets', save: 'werewolf.offline', history: 'werewolf.history', lang: 'werewolf.lang' };

// ── ngôn ngữ ──
let lang = store.get(K.lang, 'vi') === 'en' ? 'en' : 'vi';
function t(k, p) {
  let s = (STR[lang] && STR[lang][k]) ?? STR.vi[k] ?? k;
  if (p) s = s.replace(/\{(\w+)\}/g, (m, x) => (p[x] !== undefined ? p[x] : m));
  return s;
}
const roleName = r => (ROLES[r] ? ROLES[r][lang] : '?');
const roleShort = r => (ROLES[r] ? ROLES[r].short[lang] : '');
function applyLang() {
  document.documentElement.lang = lang;
  document.title = t('title');
  for (const e of document.querySelectorAll('[data-t]')) e.innerHTML = t(e.dataset.t);
  $('bLang').textContent = lang.toUpperCase();
  $('topTitle').textContent = t('title');
  for (const b of $('stLang').children) b.classList.toggle('on', b.dataset.v === lang);
  refreshAll();
}
function setLang(l) { lang = l; store.set(K.lang, l); applyLang(); }
$('bLang').onclick = () => setLang(lang === 'vi' ? 'en' : 'vi');

// ── cài đặt ──
const settings = Object.assign({ sfx: true, music: true, narr: true, vol: 80, motion: false }, store.get(K.settings, {}));
function applySettings() {
  for (const k of ['sfx', 'music', 'narr']) Sound.set(k, settings[k]);
  Sound.set('vol', settings.vol / 100);
  document.body.classList.toggle('motion-off', settings.motion);
  store.set(K.settings, settings);
}
function openSettings() {
  $('stSfx').checked = settings.sfx; $('stMusic').checked = settings.music; $('stNarr').checked = settings.narr;
  $('stVol').value = settings.vol; $('stMotion').checked = settings.motion;
  $('ovSettings').hidden = false;
}
$('stSfx').onchange = e => { settings.sfx = e.target.checked; applySettings(); Sound.play('click'); };
$('stMusic').onchange = e => { settings.music = e.target.checked; applySettings(); };
$('stNarr').onchange = e => { settings.narr = e.target.checked; applySettings(); };
$('stVol').oninput = e => { settings.vol = +e.target.value; applySettings(); };
$('stMotion').onchange = e => { settings.motion = e.target.checked; applySettings(); };
for (const b of $('stLang').children) b.onclick = () => setLang(b.dataset.v);
$('stClose').onclick = () => { $('ovSettings').hidden = true; };
$('bSettings').onclick = openSettings; $('mSettings').onclick = openSettings;
// trình duyệt chỉ cho phát âm thanh sau lần chạm đầu tiên
document.addEventListener('pointerdown', () => Sound.unlock(), { once: true });

// ── thông báo nhỏ ──
function toast(html, cls = '', ms = 3200) {
  const e = document.createElement('div'); e.className = 'toast ' + cls; e.innerHTML = html;
  $('toasts').appendChild(e); setTimeout(() => e.remove(), ms);
  while ($('toasts').children.length > 4) $('toasts').firstChild.remove();
}
for (const ov of document.querySelectorAll('.ov')) ov.addEventListener('click', e => {
  if (e.target === ov && ['ovRules', 'ovSettings', 'ovHistory', 'ovRole'].includes(ov.id)) ov.hidden = true;
});

// ── màn hình ──
const SCREENS = ['scrMenu', 'scrSetup', 'scrLobby', 'scrGame'];
let screen = 'scrMenu';
function show(id) {
  screen = id;
  for (const s of SCREENS) $(s).hidden = s !== id;
  $('bLeave').hidden = id === 'scrMenu' || id === 'scrSetup';
  if (id !== 'scrGame') { document.body.classList.remove('nightmode', 'day', 'dawn'); Sound.setMood('menu'); }
  window.scrollTo(0, 0);
}

// ── lá bài ──
function cardHtml(r) {
  const R = ROLES[r];
  return `<div class="rcard"><div class="rart">${cardArt(r).replace('<svg ', '<svg preserveAspectRatio="xMidYMid slice" ')}</div><span class="rt tm ${R.team}">${t('team_' + R.team)}</span>`
    + `<div class="rn">${esc(roleName(r))}</div><div class="re">${esc(lang === 'vi' ? R.en : R.vi)}</div><div class="rd">${esc(roleShort(r))}</div></div>`;
}
function showRole(r) { $('roleBig').innerHTML = cardHtml(r) + `<p class="note" style="max-width:320px;margin:10px auto 0;text-align:center">${esc(ROLES[r].rule[lang])}</p>`; $('ovRole').hidden = false; }
$('roleClose').onclick = () => { $('ovRole').hidden = true; };
// mỗi lần vẽ một lá: đổi id gradient thành id riêng — cùng một vai xuất hiện nhiều chỗ (có chỗ đang ẩn)
// thì url(#id) trùng sẽ trỏ vào bản bị ẩn và mất màu
{
  let n = 0;
  const uniq = f => (...a) => { const k = ++n; return f(...a).replace(/(["#])ww-([\w-]+)/g, (m, q, x) => `${q}ww-${x}-u${k}`); };
  window.cardArt = uniq(cardArt); window.cardBack = uniq(cardBack);
}
$('logoCard').innerHTML = cardBack();

// ═══════════════════ bộ bài (dùng chung: chơi với máy & phòng online) ═══════════════════
const PRESETS = ['beginner', 'classic', 'advanced', 'expanded'];
const OPT_BOOL = ['reveal', 'abstain', 'witchSelf', 'witchBoth', 'guardSelf', 'guardRepeat', 'elderPenalty'];
const OPT_SEG = { mayor: ['double', 'tie'], seer: ['team', 'role'], tie: ['none', 'random'], wolfWin: ['parity', 'all'] };
const TALK_OPTS = [60, 90, 120, 180, 300], GIRL_OPTS = [10, 20, 35, 50];
function deckState(n, src) {
  const st = Object.assign({ preset: 'classic', deck: null, opts: {} }, src || {});
  st.opts = Object.assign({}, WW.DEFAULT_OPTS, st.opts);
  if (!st.deck || (st.preset !== 'custom' && WW.deckSize(st.deck) !== n)) st.deck = WW.presetDeck(PRESETS.includes(st.preset) ? st.preset : 'classic', n);
  return st;
}
function resizeDeck(st, n) {
  if (PRESETS.includes(st.preset)) st.deck = WW.presetDeck(st.preset, n);
  else { // tự thiết kế: thêm / bớt Dân Làng cho khớp số người
    const diff = n - WW.deckSize(st.deck);
    st.deck.villager = Math.max(0, (st.deck.villager || 0) + diff);
  }
}
// vẽ trình tạo bộ bài; editable=false: chỉ xem (khách trong phòng online)
function renderDeck(box, st, n, editable, onChange) {
  const v = WW.validateDeck(st.deck, n);
  const mine = store.get(K.presets, []);
  let h = `<div class="deck${editable ? '' : ' ro'}"><h3>${t('deck')}</h3>`;
  if (editable) {
    h += '<div class="presets">' + PRESETS.map(p => `<button data-p="${p}" class="${st.preset === p ? 'on' : ''}">${t('preset_' + p)}</button>`).join('')
      + `<button data-p="custom" class="${st.preset === 'custom' ? 'on' : ''}">${t('preset_custom')}</button>`
      + mine.map((m, i) => `<button class="mine" data-mine="${i}">💾 ${esc(m.name)}</button>`).join('') + '</div>';
  }
  h += `<div class="sum"><span class="cnt ${WW.deckSize(st.deck) === n ? 'ok' : 'bad'}">🃏 ${t('cardsCount', { total: WW.deckSize(st.deck), n })}</span><span>🐺 ${t('wolvesCount', { n: v.wolves })}</span>`
    + (editable ? `<button class="btn sm" data-save="1">${t('savePreset')}</button>` : '') + '</div><div class="msgs">';
  for (const [k, p] of v.errs) h += `<p class="err">⛔ ${t('e_' + k, Object.assign({}, p, { r: p.r ? roleName(p.r) : '' }))}</p>`;
  for (const [k, p] of v.warns) h += `<p class="warn">⚠️ ${t('w_' + k, p)}</p>`;
  if (v.ok && !v.warns.length) h += `<p class="okm">✓ ${t('balanced', { score: v.score })}</p>`;
  h += '</div><div class="roles">';
  for (const r of ROLE_LIST) {
    const c = st.deck[r] | 0;
    if (!editable && !c) continue;
    h += `<div class="rtile${c ? ' on' : ''}" data-r="${r}">${cardArt(r)}<span class="tm ${ROLES[r].team}">${t('team_' + ROLES[r].team)}</span><button class="info" data-info="${r}">i</button>`
      + `<div class="nm">${esc(roleName(r))}</div><div class="ctl"><button data-d="-1" ${c ? '' : 'disabled'}>−</button><b>${c}</b><button data-d="1" ${c >= ROLES[r].max ? 'disabled' : ''}>+</button></div></div>`;
  }
  h += '</div>';
  // luật phòng
  const o = st.opts;
  h += `<details class="ropts"${editable ? '' : ' open'}><summary>${t('rulesOpts')}</summary><div class="ro-grid">`;
  const segH = (k, vals, lab, fmt) => `<div class="fld"><span>${lab}</span><div class="seg" data-o="${k}">${vals.map(x => `<button data-v="${x}" class="${o[k] === x ? 'on' : ''}" ${editable ? '' : 'disabled'}>${fmt(x)}</button>`).join('')}</div></div>`;
  h += segH('talk', TALK_OPTS, t('o_talk'), x => (x % 60 ? t('sec', { n: x }) : t('min', { n: x / 60 })));
  for (const [k, vals] of Object.entries(OPT_SEG)) h += segH(k, vals, t('o_' + k), x => t(`o_${k}_${x}`));
  if (st.deck.girl) h += segH('girlRisk', GIRL_OPTS, t('o_girlRisk'), x => x + '%');
  for (const k of OPT_BOOL) h += `<label class="chk"><input type="checkbox" data-b="${k}" ${o[k] ? 'checked' : ''} ${editable ? '' : 'disabled'}><span>${t('o_' + k)}</span></label>`;
  h += '</div></details></div>';
  box.innerHTML = h;
  for (const b of box.querySelectorAll('[data-info]')) b.onclick = e => { e.stopPropagation(); showRole(b.dataset.info); };
  if (!editable) return;
  const changed = () => { Sound.play('click'); onChange(); };
  for (const b of box.querySelectorAll('[data-p]')) b.onclick = () => { st.preset = b.dataset.p; if (PRESETS.includes(st.preset)) st.deck = WW.presetDeck(st.preset, n); changed(); };
  for (const b of box.querySelectorAll('[data-mine]')) b.onclick = () => { const m = mine[+b.dataset.mine]; if (!m) return; st.preset = 'custom'; st.deck = Object.assign({}, m.deck); resizeDeck(st, n); changed(); };
  for (const tile of box.querySelectorAll('.rtile')) for (const b of tile.querySelectorAll('[data-d]')) b.onclick = () => {
    const r = tile.dataset.r, d = +b.dataset.d;
    st.deck[r] = Math.max(0, Math.min(ROLES[r].max, (st.deck[r] | 0) + d));
    if (!st.deck[r]) delete st.deck[r];
    st.preset = 'custom'; changed();
  };
  const sv = box.querySelector('[data-save]');
  if (sv) sv.onclick = () => {
    const name = (prompt(t('presetName'), t('preset_custom') + ' ' + (mine.length + 1)) || '').trim().slice(0, 20);
    if (!name) return;
    mine.push({ name, deck: Object.assign({}, st.deck) }); while (mine.length > 8) mine.shift();
    store.set(K.presets, mine); changed();
  };
  for (const s of box.querySelectorAll('.seg[data-o]')) for (const b of s.children) b.onclick = () => {
    const k = s.dataset.o, raw = b.dataset.v; st.opts[k] = isNaN(+raw) ? raw : +raw; changed();
  };
  for (const c of box.querySelectorAll('[data-b]')) c.onchange = () => { st.opts[c.dataset.b] = c.checked; changed(); };
  const det = box.querySelector('details'); if (det && renderDeck.open) det.open = true;
  if (det) det.ontoggle = () => { renderDeck.open = det.open; };
}

// ═══════════════════ chơi với máy: thiết lập ═══════════════════
const setup = Object.assign({ name: '', n: 8 }, store.get(K.setup, {}));
setup.n = Math.max(5, Math.min(20, setup.n | 0 || 8));
let offDeck = deckState(setup.n, setup.st);
function saveSetup() { setup.st = offDeck; store.set(K.setup, setup); }
function renderSetup() {
  $('suName').value = setup.name; $('suN').textContent = setup.n;
  renderDeck($('suDeck'), offDeck, setup.n, true, () => { saveSetup(); renderSetup(); });
  $('suStart').disabled = !WW.validateDeck(offDeck.deck, setup.n).ok;
}
$('suName').oninput = () => { setup.name = $('suName').value.replace(/\s+/g, ' ').trim().slice(0, 14); saveSetup(); };
const stepN = d => { setup.n = Math.max(5, Math.min(20, setup.n + d)); resizeDeck(offDeck, setup.n); saveSetup(); renderSetup(); Sound.play('click'); };
$('suMinus').onclick = () => stepN(-1); $('suPlus').onclick = () => stepN(1);
$('suBack').onclick = () => { show('scrMenu'); refreshMenu(); };
$('mOffline').onclick = () => {
  Sound.unlock();
  if (store.get(K.save, null)) return confirmBox('⚠️', t('contQ'), t('contMsg'), [[t('cancel'), null], [t('newGame'), () => { store.del(K.save); refreshMenu(); show('scrSetup'); renderSetup(); }]]);
  show('scrSetup'); renderSetup();
};
$('suStart').onclick = () => {
  if (!WW.validateDeck(offDeck.deck, setup.n).ok) return;
  saveSetup();
  const names = shuffleArr(BOT_NAMES).filter(x => x.toLowerCase() !== (setup.name || '').toLowerCase());
  const players = [{ name: setup.name || t('you_'), cid: 'me' }];
  for (let i = 1; i < setup.n; i++) players.push({ name: names[i - 1] || 'Bot ' + i, bot: true });
  const G = WW.newGame({ players, deck: offDeck.deck, opts: offDeck.opts }, Date.now());
  startLocal('off', G, G.players.find(p => p.cid === 'me').id);
};
const shuffleArr = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

// ── hộp xác nhận / thông báo mạng ──
function confirmBox(emoji, title, msg, btns, extra) {
  const p = $('netPanel');
  p.innerHTML = `<div class="emo">${emoji}</div><h2>${title}</h2><p class="msg">${msg}</p>`;
  if (extra) p.appendChild(extra);
  const row = document.createElement('div'); row.className = 'row';
  btns.forEach(([label, fn], i) => {
    const b = document.createElement('button'); b.className = 'btn' + (i === btns.length - 1 ? ' go' : ''); b.textContent = label;
    b.onclick = () => { $('ovNet').hidden = true; if (fn) fn(b); };
    row.appendChild(b);
  });
  p.appendChild(row);
  $('ovNet').hidden = false;
}

// ═══════════════════ điều khiển ván ═══════════════════
// mode: 'off' chơi với máy · 'host' chủ phòng (giữ ván) · 'guest' khách (chỉ nhận view)
const Ctl = { mode: null, G: null, me: -1, V: null, deadline: 0, lastSeq: 0, chat: [], onHostChange: null, sentOver: false };
function startLocal(mode, G, me) {
  Object.assign(Ctl, { mode, G, me, V: null, lastSeq: 0, chat: [], sentOver: false });
  resetGameUi();
  show('scrGame');
  hostChanged();
}
function hostChanged() {
  const G = Ctl.G; if (!G) return;
  Ctl.V = WW.viewFor(G, Ctl.me); Ctl.deadline = G.deadline;
  if (Ctl.mode === 'off') saveOffline();
  if (Ctl.mode === 'host' && Ctl.onHostChange) Ctl.onHostChange();
  renderGame();
}
function guestView(v) { // khách nhận view từ chủ phòng
  if (!v || !Array.isArray(v.players)) return;
  const first = !Ctl.V;
  Ctl.V = v; Ctl.me = v.me; Ctl.deadline = Date.now() + (v.left | 0);
  if (first || screen !== 'scrGame') { resetGameUi(); show('scrGame'); }
  renderGame();
}
function sendAct(a) {
  Sound.play('select');
  if (Ctl.mode === 'guest') { if (window.Net) Net.sendAct(a); return; }
  if (Ctl.G && WW.act(Ctl.G, Ctl.me, a, Date.now())) hostChanged();
}
setInterval(() => {
  if ((Ctl.mode === 'off' || Ctl.mode === 'host') && Ctl.G && screen === 'scrGame') {
    if (WW.tick(Ctl.G, Date.now())) hostChanged();
  }
  if (screen === 'scrGame' && Ctl.V) paintTimer();
}, 250);

// ── lưu / chơi tiếp ván với máy ──
function saveOffline() {
  if (!Ctl.G) return;
  if (Ctl.G.phase === 'over') { store.del(K.save); return; }
  store.set(K.save, { G: Ctl.G, me: Ctl.me, at: Date.now() });
}
function resumeOffline() {
  const s = store.get(K.save, null); if (!s || !s.G) return;
  const G = s.G, d = Math.max(0, Date.now() - (s.at || Date.now()));
  // dời mọi mốc thời gian theo khoảng thời gian đã nghỉ, cho lượt hiện tại thêm chút thời gian
  G.deadline += d + 5000; G.minEnd += d;
  for (const k in G.botAt) G.botAt[k] += d;
  if (G.botTalkAt) G.botTalkAt = G.botTalkAt.map(([id, at]) => [id, at + d]);
  startLocal('off', G, s.me);
}
$('mContinue').onclick = () => { Sound.unlock(); resumeOffline(); };
function refreshMenu() {
  const s = store.get(K.save, null);
  $('mContinue').hidden = !(s && s.G);
  if (s && s.G) $('mContinueSub').textContent = `${s.G.players.length} · ${s.G.phase === 'deal' ? t('deal') : s.G.night && ['nightfall', 'night'].includes(s.G.phase) ? t('night', { n: s.G.night }) : t('day', { n: s.G.day })}`;
}

// ── rời ván ──
$('bLeave').onclick = () => {
  if (Ctl.mode === 'off' && screen === 'scrGame') {
    if (Ctl.G && Ctl.G.phase === 'over') return quitLocal();
    return confirmBox('🚪', t('quitQ'), '', [[t('resume'), null], [t('menu'), () => { Ctl.mode = null; Ctl.G = null; Sound.stopVoice(); show('scrMenu'); refreshMenu(); }], [t('quit'), () => { store.del(K.save); quitLocal(); }]]);
  }
  if (window.Net && Net.on()) return Net.askLeave();
  show('scrMenu'); refreshMenu();
};
function quitLocal() { Ctl.mode = null; Ctl.G = null; Ctl.V = null; Sound.stopVoice(); for (const id of ['ovOver', 'ovMorning', 'ovVerdict', 'ovCard']) $(id).hidden = true; show('scrMenu'); refreshMenu(); }

// ═══════════════════ vẽ bàn làng ═══════════════════
const COLORS = ['#7a3b2e', '#2e5a7a', '#5a7a2e', '#6a2e7a', '#7a6a2e', '#2e7a6a', '#7a2e4a', '#3e4a8a', '#8a5a3e', '#4a7a4a', '#7a4a7a', '#3a6a8a', '#8a3a3a', '#5a5a8a', '#6a7a3a', '#3a7a5a', '#8a6a5a', '#5a3a6a', '#2a5a5a', '#7a5a2a'];
let sel = [], selKey = '', witchHeal = null, accSel = null;
const nm = id => { const p = Ctl.V && Ctl.V.players[id]; return p ? `<b>${esc(p.name)}</b>` : '?'; };
const names = ids => (ids || []).map(nm).join(', ');
function resetGameUi() {
  $('feed').innerHTML = ''; $('chat').innerHTML = ''; Ctl.lastSeq = 0; sel = []; selKey = ''; witchHeal = null; accSel = null;
  for (const id of ['ovOver', 'ovMorning', 'ovVerdict', 'ovCard']) $(id).hidden = true;
  setTab('feed');
  $('tabChat').hidden = Ctl.mode === 'off';
}
function phaseIcon(V) {
  return { deal: '🃏', nightfall: '🌙', night: '🌙', morning: '🌅', day: '☀️', vote: '🪢', verdict: '⚖️', hunter: '🏹', over: '🏁' }[V.phase] || '🌙';
}
function phaseTitle(V) {
  if (V.phase === 'night') return t('st_' + V.step);
  if (V.phase === 'over') return V.winner ? t('winTitle_' + V.winner.team) : t('ph_over');
  return t('ph_' + V.phase);
}
function dayLabel(V) {
  if (V.phase === 'deal') return t('deal');
  if (V.phase === 'over') return t('over');
  if (['nightfall', 'night'].includes(V.phase)) return t('night', { n: V.night });
  return V.day === 0 ? t('day0') : t('day', { n: V.day });
}
function renderGame() {
  const V = Ctl.V; if (!V) return;
  const night = ['nightfall', 'night'].includes(V.phase);
  document.body.classList.toggle('nightmode', night);
  document.body.classList.toggle('day', ['day', 'vote', 'verdict', 'hunter'].includes(V.phase) || (V.phase === 'over'));
  document.body.classList.toggle('dawn', V.phase === 'morning');
  Sound.setMood(night ? 'night' : 'day');
  $('hIco').textContent = phaseIcon(V); $('hDay').textContent = dayLabel(V); $('hTitle').textContent = phaseTitle(V);
  if (V.seq < Ctl.lastSeq) resetGameUi(); // khách: chủ phòng vừa mở ván mới
  const key = [V.phase, V.step, V.day, V.night].join('|');
  if (key !== selKey) { selKey = key; sel = []; witchHeal = null; accSel = null; }
  processLog(V);
  renderSeats(V); renderAct(V); renderCenter(V); renderMyCard(V); syncOverlays(V); paintTimer();
  if (window.Net) Net.syncVoice();
}
function paintTimer() {
  const V = Ctl.V; if (!V) return;
  const show = !['over', 'morning', 'verdict', 'nightfall'].includes(V.phase);
  $('hTimer').hidden = !show; if (!show) return;
  const left = Math.max(0, Ctl.deadline - Date.now()), total = V.phase === 'day' ? V.opts.talk * 1000 : V.phase === 'deal' ? 20000 : V.opts.act * 1000;
  const s = Math.ceil(left / 1000);
  if ($('hSec').textContent !== String(s)) {
    $('hSec').textContent = s;
    const low = s <= 5 && s > 0 && (V.opt && !V.mine || V.phase === 'day');
    $('hTimer').classList.toggle('low', low);
    if (low) Sound.play('tick');
  }
  $('hRing').style.strokeDashoffset = 106.8 * (1 - Math.min(1, left / total));
}
function canPick(V) {
  const o = V.opt; if (!o) return null;
  if (o.kind === 'witch') return { targets: o.canPoison, need: 1 };
  if (o.kind === 'talk') return { targets: o.targets, need: 1 };
  if (!o.targets || !o.need) return null;
  if (V.mine && !['bite', 'vote', 'shoot', 'bigbite', 'whitebite'].includes(o.kind)) return null;
  return { targets: o.targets, need: o.need };
}
function seatLayout(n) {
  const r = $('table').getBoundingClientRect(), w = r.width, h = r.height;
  const rx = w / 2 - Math.min(48, w * 0.09), ry = h / 2 - Math.min(48, h * 0.11);
  const circ = Math.PI * (rx + ry);
  const sz = Math.max(34, Math.min(70, circ / n * 0.5, h * 0.2));
  return { w, h, rx, ry, sz };
}
function renderSeats(V) {
  const box = $('seats'), n = V.players.length, L = seatLayout(n), pk = canPick(V);
  box.innerHTML = '';
  const accCount = {}; for (const tg of Object.values(V.acc || {})) accCount[tg] = (accCount[tg] || 0) + 1;
  const wolfCount = {}; if (V.wolfVotes) for (const ts of Object.values(V.wolfVotes)) for (const tg of ts) wolfCount[tg] = (wolfCount[tg] || 0) + 1;
  const asleep = ['nightfall', 'night'].includes(V.phase);
  V.players.forEach((p, i) => {
    const a = Math.PI / 2 + ((i - V.me) / n) * Math.PI * 2;
    const x = L.w / 2 + Math.cos(a) * L.rx, y = L.h / 2 + Math.sin(a) * L.ry;
    const s = document.createElement('div');
    s.className = 'seat' + (i === V.me ? ' me' : '') + (p.alive ? '' : ' dead') + (p.wolf && i !== V.me && V.phase !== 'over' ? ' wolfmate' : '') + (asleep && p.alive && i !== V.me ? ' sleep' : '');
    s.style.left = x + 'px'; s.style.top = y + 'px'; s.style.setProperty('--sz', L.sz + 'px'); s.style.setProperty('--c', COLORS[i % COLORS.length]);
    s.dataset.id = i;
    const inner = p.role ? cardArt(p.role) : `<span class="ini">${esc((p.name || '?').trim().charAt(0).toUpperCase())}</span>`;
    const bd = [];
    if (p.role === 'mayor' && p.alive) bd.push(`<span title="${t('mayorBadge')}">🎖️</span>`);
    if (p.lover) bd.push(`<span title="${t('loverBadge')}">❤️</span>`);
    if (p.charmed) bd.push(`<span title="${t('charmedBadge')}">🎵</span>`);
    if (p.idiot) bd.push(`<span title="${t('idiotBadge')}">🃏</span>`);
    if (p.seen) bd.push(p.seen === 'good' ? '<span>✅</span>' : p.seen === 'wolf' || (ROLES[p.seen] && ROLES[p.seen].wolf) ? '<span>🐺</span>' : '<span>🔮</span>');
    if (p.off) bd.push(`<span title="${t('offBadge')}">📴</span>`);
    const mk = [];
    if (accCount[i]) mk.push(`<span class="acc">☝️${accCount[i]}</span>`);
    if (wolfCount[i]) mk.push(`<span class="wv">🐺${wolfCount[i]}</span>`);
    if (V.phase === 'vote' && (V.voted || []).includes(i)) mk.push('<span class="vt">✓</span>');
    s.innerHTML = `<span class="no">${i + 1}</span><div class="fr">${inner}</div><div class="bdg">${bd.join('')}</div><div class="marks">${mk.join('')}</div><div class="nm">${esc(p.name)}${p.bot ? ' 🤖' : ''}</div>`;
    if (pk && pk.targets.includes(i)) { s.classList.add('can'); s.onclick = () => pickSeat(i); }
    if (sel.includes(i)) s.classList.add('sel');
    if (witchHeal === i) s.classList.add('sel', 'healsel');
    if (accSel === i) s.classList.add('sel');
    box.appendChild(s);
  });
  paintTalkSeats();
}
function pickSeat(i) {
  const V = Ctl.V, pk = canPick(V); if (!pk) return;
  Sound.play('click');
  if (V.opt.kind === 'talk') { accSel = accSel === i ? null : i; }
  else if (sel.includes(i)) sel = sel.filter(x => x !== i);
  else if (pk.need === 1) sel = [i];
  else if (sel.length < pk.need) sel.push(i);
  else sel = sel.slice(1).concat(i);
  renderSeats(V); renderAct(V);
}
function renderCenter(V) {
  let ic = phaseIcon(V), tx = phaseTitle(V);
  if (V.phase === 'hunter') tx = t('hunterWait', { name: esc(V.players[V.hunter] ? V.players[V.hunter].name : '?') });
  if (V.phase === 'vote') tx = t('votedN', { n: V.done, m: V.actorsN });
  if (V.phase === 'deal') tx = t('waitOthers') + ` · ${V.done}/${V.actorsN}`;
  $('cIcon').textContent = ic; $('cText').innerHTML = tx;
}
function renderMyCard(V) {
  const b = $('myCard');
  if (!V.role) { b.hidden = true; return; }
  b.hidden = false;
  b.innerHTML = cardArt(V.turned ? 'werewolf' : V.role) + `<span>${esc(roleName(V.role))}</span>`;
  b.onclick = () => showRole(V.role);
}

// ── ô hành động ──
function btn(label, fn, go, dis) { const b = document.createElement('button'); b.className = 'btn' + (go ? ' go' : ''); b.innerHTML = label; b.disabled = !!dis; b.onclick = fn; return b; }
function renderAct(V) {
  const box = $('act'); box.innerHTML = '';
  const msg = (h, sub) => { const d = document.createElement('div'); d.className = 'msg'; d.innerHTML = h; box.appendChild(d); if (sub) { const s = document.createElement('div'); s.className = 'sub'; s.innerHTML = sub; box.appendChild(s); } };
  const row = (...b) => { const r = document.createElement('div'); r.className = 'btns'; b.filter(Boolean).forEach(x => r.appendChild(x)); box.appendChild(r); };
  const me = V.players[V.me], o = V.opt;
  if (V.phase === 'over') { msg(V.winner ? t('winTitle_' + V.winner.team) : t('ph_over')); row(btn('🏁 ' + t('allCards'), () => { $('ovOver').hidden = false; }, true)); return; }
  if (!o) {
    if (me && !me.alive) msg(t('dead'));
    else if (['nightfall', 'night'].includes(V.phase)) msg(t('sleeping'));
    else if (V.phase === 'vote' && me && !me.canVote) msg(t('noVote'), t('votedN', { n: V.done, m: V.actorsN }));
    else if (V.phase === 'hunter') msg(t('hunterWait', { name: esc(V.players[V.hunter].name) }));
    else if (V.phase === 'deal') msg(t('waitOthers'), `${V.done}/${V.actorsN}`);
    else msg(t('waiting'));
    return;
  }
  const pickInfo = need => (need > 1 ? t('pickN', { n: sel.length, m: need }) : '');
  switch (o.kind) {
    case 'ack': msg(t('ph_deal')); row(btn(t('yourCard'), () => openDeal(), true)); return;
    case 'talk': {
      const mineAcc = V.acc && V.acc[V.me];
      msg(t('a_talk'), t('skipCount', { n: V.skip.length, m: V.players.filter(p => p.alive && !p.bot && !p.off).length }));
      row(accSel !== null && accSel !== mineAcc ? btn(`${t('accuse')} ${nm(accSel)}`, () => { sendAct({ acc: accSel }); accSel = null; }, true) : null,
        mineAcc !== undefined ? btn(t('unaccuse'), () => sendAct({ acc: -1 })) : null,
        btn(V.skip.includes(V.me) ? t('unskip') : t('skipTalk'), () => sendAct({ skip: !V.skip.includes(V.me) }), !V.skip.includes(V.me)));
      return;
    }
    case 'vote': {
      const mv = V.mine;
      msg(t('a_vote'), mv ? (mv.t >= 0 ? t('youVoted', { name: nm(mv.t) }) : t('youAbstained')) : t('votedN', { n: V.done, m: V.actorsN }));
      row(btn(t('voteBtn') + (sel.length ? ' ' + nm(sel[0]) : ''), () => { sendAct({ t: sel[0] }); Sound.play('vote'); }, true, !sel.length || (mv && mv.t === sel[0])),
        o.abstain ? btn(t('abstain'), () => sendAct({ t: -1 }), false, mv && mv.t === -1) : null);
      return;
    }
    case 'peek':
      if (V.mine) return msg(t('done'));
      msg(t('a_peek', { risk: o.risk })); row(btn(t('peek'), () => sendAct({ peek: true }), true), btn(t('noPeek'), () => sendAct({ peek: false })));
      return;
    case 'witch': {
      if (V.mine) return msg(t('done'));
      const pot = V.potions || {};
      msg(t('a_witch', { heal: pot.heal ? t('potionLeft') : t('potionUsed'), poison: pot.poison ? t('potionLeft') : t('potionUsed') }),
        (o.victims.length ? t('witchVictim', { names: names(o.victims) }) : t('witchNoVictim')) + (pot.poison ? ' · ' + t('poisonPick') : ''));
      const pots = document.createElement('div'); pots.className = 'pots';
      for (const v of o.canHeal) { const b = btn(`${t('healIt')} ${nm(v)}`, () => { witchHeal = witchHeal === v ? null : v; if (!o.both) sel = []; renderAct(V); renderSeats(V); }); b.className = 'pot' + (witchHeal === v ? ' on' : ''); pots.appendChild(b); }
      if (o.canHeal.length) box.appendChild(pots);
      if (!o.both && witchHeal !== null && sel.length) sel = [];
      const poison = sel[0] ?? null;
      row(btn(`${t('usePotion')}${witchHeal !== null ? ' 💚' : ''}${poison !== null ? ' ☠️ ' + nm(poison) : ''}`, () => sendAct({ heal: witchHeal, poison }), true, witchHeal === null && poison === null),
        btn(t('noPotion'), () => sendAct({ heal: null, poison: null })));
      return;
    }
  }
  const prompts = { cupid: t('a_cupid'), model: t('a_model'), guard: t('a_guard'), fox: t('a_fox'), bite: o.need > 1 ? t('a_bite2') : t('a_bite'), bigbite: t('a_bigbite'), whitebite: t('a_whitebite'), seer: t('a_seer'), charm: t('a_charm', { n: o.need }), shoot: t('a_shoot') };
  const again = ['bite', 'shoot', 'bigbite', 'whitebite'].includes(o.kind);
  if (V.mine && !again) return msg(t('done'));
  msg(prompts[o.kind] || t('waiting'), (V.mine ? t('done') + ' · ' : '') + pickInfo(o.need));
  const label = o.kind === 'shoot' ? t('shootBtn') : t('confirm');
  row(btn(`${label}${sel.length ? ' ' + names(sel) : ''}`, () => sendAct({ t: o.need > 1 || o.kind === 'bite' ? sel.slice() : sel[0] }), true, o.kind === 'bite' ? !sel.length : sel.length !== o.need),
    o.skip ? btn(o.kind === 'shoot' ? t('noShoot') : t('skipBtn'), () => sendAct({ skip: 1 })) : null);
}

// ── nhật ký & sự kiện ──
function roleSuffix(r) { return r ? t('L_roleIs', { role: esc(roleName(r)) }) : ''; }
function fmtLog(e, V) {
  const f = fmtLog1(e, V);
  // xem lại sau ván: dòng riêng tư của người khác thì ghi rõ của ai
  if (f && e.to && !e.to.includes(V.me)) {
    if (e.k === 'pack' && e.to[0] !== (e.p.ids || [])[0]) return null;
    if (e.k === 'yourRole') return { cls: 'priv', html: `🃏 ${nm(e.to[0])}: ${esc(roleName(e.p.r))}` };
    f.html = `🔒 ${names(e.to)} · ` + f.html;
  }
  return f;
}
function fmtLog1(e, V) {
  const p = e.p || {};
  const L = (k, x, cls = '') => ({ cls, html: t(k, x) });
  switch (e.k) {
    case 'start': return L('L_start', { n: p.n, deck: ROLE_LIST.filter(r => p.deck[r]).map(r => `${esc(roleName(r))}${p.deck[r] > 1 ? ' ×' + p.deck[r] : ''}`).join(', ') }, 'sys');
    case 'yourRole': return L('L_yourRole', { role: esc(roleName(p.r)) }, 'priv');
    case 'mayorIs': return L('L_mayorIs', { name: nm(p.p) });
    case 'pack': return L('L_pack', { names: names(p.ids) }, 'priv');
    case 'nightfall': return L('L_nightfall', { n: p.n }, 'sys');
    case 'wake': return L('L_wake', { st: t('st_' + p.s) }, 'bot');
    case 'cupidDone': return L('L_cupidDone', { names: names(p.ids) }, 'priv');
    case 'inLove': return L('L_inLove', { name: nm(p.p), role: esc(roleName(p.r)) }, 'priv');
    case 'modelPicked': return L('L_modelPicked', { name: nm(p.t) }, 'priv');
    case 'guarded': return L('L_guarded', { name: nm(p.t) }, 'priv');
    case 'foxSaw': return L(p.found ? 'L_foxYes' : 'L_foxNo', { names: names(p.ids) }, 'priv');
    case 'packChose': return L('L_packChose', { names: names(p.ids) }, 'priv');
    case 'girlSaw': return L('L_girlSaw', { names: names(p.ids) }, 'priv');
    case 'girlCaught': return L('L_girlCaught', {}, 'priv');
    case 'caughtGirl': return L('L_caughtGirl', { name: nm(p.t) }, 'priv');
    case 'bigChose': return L('L_bigChose', { name: nm(p.t) }, 'priv');
    case 'whiteChose': return L('L_whiteChose', { name: nm(p.t) }, 'priv');
    case 'seerSaw': return { cls: 'priv', html: p.r ? t('seerRole', { name: nm(p.t), role: esc(roleName(p.r)) }) : t(p.wolf ? 'seerWolf' : 'seerGood', { name: nm(p.t) }) };
    case 'witchHealed': return L('L_witchHealed', { name: nm(p.t) }, 'priv');
    case 'witchPoisoned': return L('L_witchPoisoned', { name: nm(p.t) }, 'priv');
    case 'piperDone': return L('L_piperDone', { names: names(p.ids) }, 'priv');
    case 'youCharmed': return L('L_youCharmed', {}, 'priv');
    case 'charmed': return L('L_charmed', { names: names(p.ids) }, 'priv');
    case 'wildTurn': return L('L_wildTurn', {}, 'priv');
    case 'deaths': return { cls: 'death', html: `<div class="ln sys">${t('L_dayHead', { n: e.d })}</div>` + (p.rs || []).map(d => t(d.love ? 'L_diedLove' : 'L_died', { name: nm(d.id), role: roleSuffix(d.r) })).join('<br>'), raw: true };
    case 'peaceful': return { cls: '', html: `<div class="ln sys">${t('L_dayHead', { n: e.d })}</div>` + t('L_peaceful'), raw: true };
    case 'growl': return L('L_growl', {}, 'death');
    case 'powersLost': return L('L_powers', {}, 'death');
    case 'accuse': return L('L_accuse', { name: nm(p.p), t: nm(p.t) }, 'bot');
    case 'botClaim': return L(p.wolf ? 'L_claimWolf' : 'L_claimGood', { name: nm(p.by), t: nm(p.t) }, 'bot');
    case 'botMuse': return L('L_muse', { name: nm(p.p), text: esc(BOT_MUSE[lang][p.k] || '') }, 'bot');
    case 'voteStart': return L('L_voteHead', { n: p.d }, 'sys');
    case 'verdict': {
      const lines = Object.entries(p.votes || {}).map(([a, b]) => t('L_voteLine', { name: nm(+a), t: b >= 0 ? nm(b) : t('L_abst') }));
      let res = p.idiot ? t('idiotTxt', { name: nm(p.victim) }) : Number.isInteger(p.victim) ? t('hanged', { name: nm(p.victim) }) + roleSuffix(p.r) : t('notHanged');
      if (p.how === 'scapegoat') res = t('scapeTxt') + ' ' + res; else if (p.how === 'mayor') res = t('mayorTxt') + ' ' + res; else if (p.how === 'random') res = t('randomTxt') + ' ' + res; else if (p.how === 'tie') res = t('tieTxt') + ' ' + res;
      const extra = (p.deaths || []).filter(d => d.love).map(d => t('L_diedLove', { name: nm(d.id), role: roleSuffix(d.r) }));
      return { cls: 'death', html: `<small>${lines.join(' · ')}</small><br>${res}${extra.length ? '<br>' + extra.join('<br>') : ''}` };
    }
    case 'hunterUp': return L('L_hunterUp', { name: nm(p.p) }, 'death');
    case 'shot': return { cls: 'death', html: (p.rs || []).map((d, k) => k ? t('L_diedLove', { name: nm(d.id), role: roleSuffix(d.r) }) : t('L_shot', { name: nm(p.p), t: nm(d.id), role: roleSuffix(d.r) })).join('<br>') };
    case 'noShot': return L('L_noShot', { name: nm(p.p) });
    case 'over': return L('L_over', { title: t('winTitle_' + p.team) }, 'sys');
  }
  return null;
}
function feedLine(e, V) {
  const f = fmtLog(e, V); if (!f) return null;
  const d = document.createElement('div'); d.className = 'ln ' + f.cls; d.innerHTML = f.html; return d;
}
// đọc log mới: thêm vào nhật ký, phát âm thanh / giọng quản trò, hiện thông báo riêng
function processLog(V) {
  const fresh = V.log.filter(e => e.s > Ctl.lastSeq);
  if (!fresh.length) return;
  const catchUp = Ctl.lastSeq === 0 && fresh.length > 6 && V.phase !== 'deal'; // vừa vào lại giữa ván: không phát lại hiệu ứng
  Ctl.lastSeq = V.seq;
  const feed = $('feed'), atBottom = feed.scrollHeight - feed.scrollTop - feed.clientHeight < 40;
  const narr = [];
  for (const e of fresh) {
    const ln = feedLine(e, V); if (ln) feed.appendChild(ln);
    if (catchUp) continue;
    const p = e.p || {};
    switch (e.k) {
      case 'start': Sound.play('shuffle'); narr.push('deal'); break;
      case 'nightfall': nightFx(); Sound.play('night'); narr.push('nightfall'); break;
      case 'wake': narr.push('wake_' + p.s); if (p.s === 'wolves') setTimeout(() => Sound.play('howl'), 600); break;
      case 'deaths': dawnFx(); Sound.play('birds'); narr.push('dawn_dead'); if (p.ids.length) setTimeout(() => Sound.play('death'), 1200); break;
      case 'peaceful': dawnFx(); Sound.play('birds'); narr.push('dawn_peace'); break;
      case 'growl': setTimeout(() => Sound.play('growl'), 2200); narr.push('growl'); break;
      case 'powersLost': toast(t('L_powers'), '', 5000); break;
      case 'talk': narr.push('talk'); break;
      case 'voteStart': Sound.play('bell'); narr.push('vote'); break;
      case 'verdict': Sound.play('gavel'); narr.push(p.idiot ? 'idiot' : Number.isInteger(p.victim) ? 'hang' : 'nohang'); if (Number.isInteger(p.victim) && !p.idiot) setTimeout(() => Sound.play('death'), 900); break;
      case 'hunterUp': narr.push('hunter'); break;
      case 'shot': Sound.play('shot'); break;
      case 'over': narr.push('win_' + p.team); gameOverFx(V); break;
      case 'accuse': case 'botClaim': if (e.p && e.p.t === V.me) Sound.play('vote'); break;
    }
    if (e.to && e.to.includes(V.me) && !['yourRole', 'pack'].includes(e.k)) { const f = fmtLog(e, V); if (f) toast(f.html, 'priv', 4500); }
  }
  if (narr.length) Sound.say(narr, lang);
  if (atBottom || !catchUp) feed.scrollTop = feed.scrollHeight;
  // ván mới: mở lá bài
  if (V.phase === 'deal' && fresh.some(e => e.k === 'yourRole') && !(V.mine)) openDeal();
}
function rerenderFeed() {
  const V = Ctl.V; if (!V) return;
  $('feed').innerHTML = '';
  for (const e of V.log) { const ln = feedLine(e, V); if (ln) $('feed').appendChild(ln); }
  $('feed').scrollTop = $('feed').scrollHeight;
  renderChat();
}
function nightFx() { const f = $('fade'); f.hidden = false; f.className = 'fade'; void f.offsetWidth; clearTimeout(nightFx.t); nightFx.t = setTimeout(() => { f.hidden = true; }, 2700); }
function dawnFx() { const f = $('fade'); f.hidden = false; f.className = 'fade dawnfx'; void f.offsetWidth; clearTimeout(nightFx.t); nightFx.t = setTimeout(() => { f.hidden = true; }, 2700); }

// ── lớp phủ theo pha ──
function openDeal() {
  const V = Ctl.V; if (!V || !V.role) return;
  $('flipBack').innerHTML = cardBack(); $('flipFront').innerHTML = cardHtml(V.role);
  const f = $('flip'); f.classList.remove('on', 'dealt'); void f.offsetWidth; f.classList.add('dealt');
  Sound.play('deal');
  $('flipHint').textContent = t('tapFlip'); $('flipOk').textContent = t('seen'); $('flipOk').disabled = true;
  f.onclick = () => { if (f.classList.contains('on')) return; f.classList.add('on'); Sound.play('flip'); $('flipOk').disabled = false; $('flipHint').textContent = roleShort(V.role); };
  $('flipOk').onclick = () => { $('ovCard').hidden = true; if (Ctl.V && Ctl.V.opt && Ctl.V.opt.kind === 'ack') sendAct({ ok: 1 }); };
  $('ovCard').hidden = false;
}
function miniDeath(d, cause) {
  const p = Ctl.V.players[d.id];
  return `<div class="dcard"><div class="mini">${d.r ? cardArt(d.r) : cardBack()}<span class="x">💀</span></div><b>${esc(p ? p.name : '?')}</b><small>${d.r ? esc(roleName(d.r)) : ''}${d.love ? ' · ' + t('diedLove') : ''}</small></div>`;
}
function syncOverlays(V) {
  // buổi sáng
  if (V.phase === 'morning' && V.morning) {
    if ($('ovMorning').hidden) {
      $('mnTitle').textContent = t('morningTitle', { n: V.day });
      $('mnList').innerHTML = V.morning.deaths.length ? V.morning.deaths.map(d => miniDeath(d)).join('') : `<p class="msg">🕊️ ${t('nobodyDied')}</p>`;
      $('mnGrowl').hidden = !V.morning.growl; $('mnGrowl').textContent = t('growlTxt');
      $('ovMorning').hidden = false;
    }
  } else $('ovMorning').hidden = true;
  // kết quả bỏ phiếu
  if (V.phase === 'verdict' && V.verdict) {
    if ($('ovVerdict').hidden) {
      const vd = V.verdict, total = Math.max(1, ...Object.values(vd.tally));
      const by = {}; for (const [a, b] of Object.entries(vd.votes)) (by[b] = by[b] || []).push(+a);
      $('vdTally').innerHTML = Object.keys(vd.tally).map(Number).sort((a, b) => vd.tally[b] - vd.tally[a]).map(id =>
        `<div class="tr"><span>${nm(id)}</span><div class="bar"><i style="width:${(vd.tally[id] / total) * 100}%"></i></div><b>${vd.tally[id]}</b><div class="who">← ${names(by[id])}</div></div>`).join('')
        + (by[-1] ? `<div class="tr"><span>${t('L_abst')}</span><div></div><b>${by[-1].length}</b></div>` : '');
      let txt = vd.idiot ? t('idiotTxt', { name: nm(vd.victim) }) : Number.isInteger(vd.victim) ? t('hanged', { name: nm(vd.victim) }) : t('notHanged');
      if (vd.how === 'scapegoat') txt = t('scapeTxt'); else if (vd.how === 'tie') txt = t('tieTxt') + ' ' + t('notHanged'); else if (vd.how === 'mayor') txt = t('mayorTxt') + ' ' + txt; else if (vd.how === 'random') txt = t('randomTxt') + ' ' + txt;
      $('vdText').innerHTML = txt;
      $('vdList').innerHTML = (vd.deaths || []).map(d => miniDeath(d)).join('');
      $('ovVerdict').hidden = false;
    }
  } else $('ovVerdict').hidden = true;
  if (V.phase !== 'deal') $('ovCard').hidden = true;
  if (V.phase === 'over' && $('ovOver').hidden && !syncOverlays.overShown) { syncOverlays.overShown = true; showOver(V); }
  if (V.phase !== 'over') syncOverlays.overShown = false;
}
function iWon(V) { return !!(V.winner && V.winner.ids.includes(V.me)); }
function showOver(V) {
  const w = V.winner || { team: 'none', ids: [] };
  $('ovWin').textContent = t('winTitle_' + w.team);
  $('ovYou').textContent = iWon(V) ? t('youWin') : t('youLose');
  $('ovCards').innerHTML = V.players.map(p => `<div class="ac${w.ids.includes(p.id) ? ' win' : ''}${p.alive ? '' : ' dead'}"><div class="mini">${cardArt(p.role)}</div><b>${esc(p.name)}</b><small>${esc(roleName(p.role))}${p.alive ? '' : ' ✝'}</small></div>`).join('');
  const b = $('ovBtns'); b.innerHTML = '';
  b.appendChild(btn(t('viewHistory'), () => { $('ovOver').hidden = true; openHistory(0); }));
  if (Ctl.mode === 'off') {
    b.appendChild(btn(t('menu'), () => quitLocal()));
    b.appendChild(btn(t('playAgain'), () => { $('ovOver').hidden = true; $('suStart').onclick(); }, true));
  } else if (window.Net) Net.overButtons(b);
  b.appendChild(btn(t('close'), () => { $('ovOver').hidden = true; }));
  $('ovOver').hidden = false;
}
function gameOverFx(V) {
  setTimeout(() => Sound.play(iWon(V) ? 'win' : 'lose'), 400);
  saveHistory(V);
}

// ── chat (online) ──
let tab = 'feed';
function setTab(x) {
  tab = x;
  for (const b of document.querySelectorAll('.tabs button')) b.classList.toggle('on', b.dataset.tab === x);
  $('feed').hidden = x !== 'feed'; $('chat').hidden = x !== 'chat';
  if (x === 'chat') $('tabChat').classList.remove('dot');
  syncSay();
}
for (const b of document.querySelectorAll('.tabs button')) b.onclick = () => setTab(b.dataset.tab);
function chatChannel() { // kênh mình được nói lúc này
  const V = Ctl.V; if (!V || Ctl.mode === 'off') return null;
  const me = V.players[V.me]; if (!me) return 'all';
  if (V.phase === 'over') return 'all';
  if (!me.alive) return 'dead';
  if (['nightfall', 'night'].includes(V.phase)) return me.wolf || ROLES[V.role].wolf || V.turned ? 'wolf' : null;
  return 'all';
}
function syncSay() {
  const ch = chatChannel(), inp = $('sayIn');
  $('sayForm').hidden = Ctl.mode === 'off' || tab !== 'chat';
  inp.disabled = !ch;
  inp.placeholder = !ch ? t('chatNo') : ch === 'wolf' ? t('chatWolf') : ch === 'dead' ? t('chatDead') : t('chatPh');
}
function addChat(m) {
  Ctl.chat.push(m); if (Ctl.chat.length > 200) Ctl.chat.shift();
  appendChat(m);
  if (tab !== 'chat') $('tabChat').classList.add('dot');
}
function appendChat(m) {
  const d = document.createElement('div');
  d.className = 'ln' + (m.ch === 'wolf' ? ' wolfch' : m.ch === 'dead' ? ' deadch' : '');
  d.innerHTML = `${m.ch !== 'all' ? `<span class="ch">${t('ch_' + m.ch)}</span>` : ''}<b>${esc(m.name)}</b>: ${esc(m.text)}`;
  const c = $('chat'), bottom = c.scrollHeight - c.scrollTop - c.clientHeight < 40;
  c.appendChild(d); if (bottom) c.scrollTop = c.scrollHeight;
}
function renderChat() { $('chat').innerHTML = ''; for (const m of Ctl.chat) appendChat(m); }
$('sayForm').onsubmit = e => {
  e.preventDefault();
  const tx = $('sayIn').value.replace(/\s+/g, ' ').trim().slice(0, 120); $('sayIn').value = '';
  const ch = chatChannel(); if (!tx || !ch || !window.Net) return;
  Net.say(ch, tx);
};

// ═══════════════════ lịch sử ═══════════════════
function saveHistory(V) {
  const h = store.get(K.history, []);
  const id = (V.log.find(e => e.k === 'start') || {}).s + ':' + V.players.map(p => p.name).join(',') + ':' + (V.log[V.log.length - 1] || {}).s;
  if (h.some(x => x.id === id)) return;
  h.unshift({ id, at: Date.now(), mode: Ctl.mode === 'off' ? 'off' : 'on', me: V.me, winner: V.winner, players: V.players.map(p => ({ name: p.name, role: p.role, alive: p.alive, bot: p.bot })), log: V.log });
  while (h.length > 25) h.pop();
  store.set(K.history, h);
}
function openHistory(idx) {
  const h = store.get(K.history, []);
  const body = $('hiBody');
  if (!h.length) body.innerHTML = `<p class="msg">${t('noHistory')}</p>`;
  else if (idx === undefined || idx === null) {
    body.innerHTML = '<div class="hist"></div>';
    h.forEach((g, i) => {
      const b = document.createElement('button'); b.className = 'hrow';
      const won = g.winner && g.winner.ids.includes(g.me);
      b.innerHTML = `<span><b>${t('winTitle_' + (g.winner ? g.winner.team : 'none'))}</b><br><small>${new Date(g.at).toLocaleString(lang === 'vi' ? 'vi-VN' : 'en-GB')} · ${g.players.length} · ${t(g.mode === 'off' ? 'modeOff' : 'modeOn')}</small></span><span>${won ? '🏆' : '💀'} ${esc(roleName(g.players[g.me] ? g.players[g.me].role : 'villager'))}</span>`;
      b.onclick = () => openHistory(i);
      body.firstChild.appendChild(b);
    });
  } else {
    const g = h[idx]; if (!g) return openHistory();
    const fakeV = { players: g.players.map((p, i) => Object.assign({ id: i }, p)), me: g.me };
    const save = Ctl.V; Ctl.V = fakeV;
    body.innerHTML = `<button class="btn sm" id="hiBack">← ${t('back')}</button><h3>${t('winTitle_' + (g.winner ? g.winner.team : 'none'))}</h3>`
      + `<div class="allcards">${g.players.map((p, i) => `<div class="ac${g.winner && g.winner.ids.includes(i) ? ' win' : ''}${p.alive ? '' : ' dead'}"><div class="mini">${cardArt(p.role)}</div><b>${esc(p.name)}</b><small>${esc(roleName(p.role))}</small></div>`).join('')}</div>`
      + `<h3>${t('timeline')}</h3><div class="tl feed">${g.log.map(e => { const f = fmtLog(e, fakeV); return f ? `<div class="ln ${f.cls}">${f.html}</div>` : ''; }).join('')}</div>`;
    Ctl.V = save;
    $('hiBack').onclick = () => openHistory();
  }
  $('ovHistory').hidden = false;
}
$('mHistory').onclick = () => openHistory();
$('hiClose').onclick = () => { $('ovHistory').hidden = true; };
$('hiClear').onclick = () => confirmBox('🗑️', t('clearHistory') + '?', '', [[t('cancel'), null], [t('del'), () => { store.del(K.history); openHistory(); }]]);

// ═══════════════════ luật chơi ═══════════════════
function openRules() {
  $('ruBody').innerHTML = `<h3>${t('howTo')}</h3><div class="rules-howto">${HOWTO[lang].map(([a, b]) => `<div><b>${a}</b><p>${esc(b)}</p></div>`).join('')}</div>`
    + `<h3>${t('rolesTitle')}</h3><div class="rroles">${ROLE_LIST.map(r => `<div class="rrole"><div class="mini">${cardArt(r)}</div><div><b>${esc(roleName(r))}</b> <i>· ${esc(lang === 'vi' ? ROLES[r].en : ROLES[r].vi)} · ${t('team_' + ROLES[r].team)}</i><p>${esc(ROLES[r].rule[lang])}</p></div></div>`).join('')}</div>`;
  $('ovRules').hidden = false;
}
$('bRules').onclick = openRules; $('mRules').onclick = openRules; $('ruClose').onclick = () => { $('ovRules').hidden = true; };

// vẽ lại khi đổi ngôn ngữ / đổi kích thước
function refreshAll() {
  refreshMenu();
  if (screen === 'scrSetup') renderSetup();
  if (screen === 'scrGame' && Ctl.V) { rerenderFeed(); renderGame(); }
  if (!$('ovRules').hidden) openRules();
  if (window.Net) Net.refresh();
  syncSay();
}
let rsT = 0;
window.addEventListener('resize', () => { clearTimeout(rsT); rsT = setTimeout(() => { if (screen === 'scrGame' && Ctl.V) renderSeats(Ctl.V); }, 120); });
function paintTalkSeats() {
  if (!window.Net) return;
  for (const s of document.querySelectorAll('#seats .seat')) s.classList.toggle('talk', Net.talking(Ctl.V.players[+s.dataset.id]));
}

applySettings();
applyLang();
