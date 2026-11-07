// Chơi online qua PeerJS (WebRTC), hình sao: chủ phòng nối với từng khách.
// Chủ phòng giữ toàn bộ ván (WW.*) và chỉ gửi cho mỗi khách view đã lọc của riêng họ ({t:'v'}) — vai người khác,
// hành động ban đêm, kết quả soi… không bao giờ rời máy chủ phòng nếu người đó không được biết.
// Khách gửi: hello, name, ready, vc, act, say, bye. Chủ gửi: welcome, room, v, chat, kicked, full, dup, bye.
// cid lưu trong sessionStorage nên tải lại trang vẫn về đúng ghế; khách rớt mạng / bị mời ra thì máy chơi thay.
// Voice chat: mỗi cặp nối trực tiếp; ai nghe được ai do từng máy tự quyết (vcGain) theo pha của ván.
const Net = (() => {
  const PEERJS_URL = 'https://cdn.jsdelivr.net/npm/peerjs@1.5.5/dist/peerjs.min.js';
  const ROOM_PREFIX = 'masoi-vibe-';
  const MAX_P = 20;
  const PEER_OPTS = { debug: 0, config: { sdpSemantics: 'unified-plan', iceServers: [
    { urls: ['stun:stun.l.google.com:19302', 'stun:stun.cloudflare.com:3478'] },
    { urls: ['turn:eu-0.turn.peerjs.com:3478', 'turn:us-0.turn.peerjs.com:3478', 'turn:eu-0.turn.peerjs.com:3478?transport=tcp', 'turn:us-0.turn.peerjs.com:3478?transport=tcp'], username: 'peerjs', credential: 'peerjsp' },
  ] } };
  const HB_MS = 2000, HB_DEAD = 8000, HB_DROP = 20000, LOBBY_GRACE = 15000, REJOIN_MAX = 20, REJOIN_MS = 3000;
  const DOTS = '<span class="dots"><span>.</span><span>.</span><span>.</span></span>';
  const freshNet = () => ({ on: false, host: false, code: null, peer: null, conn: null, conns: new Map(), timer: 0, left: false, dup: false, seen: new Map(), heard: 0, hbAt: 0, hbOk: false, hbT: 0, again: 0, kicked: false, banned: new Set() });
  let net = freshNet();
  let M = [], S = null, phase = 'none'; // phase: 'lobby' | 'game' | 'wait'
  function randCode() { return Array.from(crypto.getRandomValues(new Uint8Array(6)), b => 'abcdefghijkmnpqrstuvwxyz23456789'[b % 32]).join(''); }
  const myCid = (() => {
    try { let v = sessionStorage.getItem('werewolf.cid'); if (!v) { v = randCode() + randCode(); sessionStorage.setItem('werewolf.cid', v); } return v; }
    catch (e) { return randCode() + randCode(); }
  })();
  const myName = () => (setup.name || '').trim();
  const myMem = () => M.find(m => m.cid === myCid);
  const cleanName = v => String(v || '').replace(/\s+/g, ' ').trim().slice(0, 14);
  const showCode = c => String(c || '').toUpperCase();
  const inviteUrl = () => location.href.split('#')[0] + '#room=' + net.code;
  function watchIce(c, fn) { const pc = c.peerConnection; if (pc) pc.addEventListener('iceconnectionstatechange', () => { if (pc.iceConnectionState === 'failed') fn(); }); }
  function loadPeerJs() {
    if (window.Peer) return Promise.resolve();
    return new Promise((ok, bad) => { const s = document.createElement('script'); s.src = PEERJS_URL; s.onload = ok; s.onerror = () => { s.remove(); bad(new Error('peerjs')); }; document.head.appendChild(s); });
  }
  function parseCode(s) {
    s = String(s || '').trim();
    const m = /room=([a-z0-9]+)/i.exec(s);
    s = (m ? m[1] : s).toLowerCase().replace(/[^a-z0-9]/g, '').replace(/1/g, 'i');
    return /^[a-z0-9]{4,16}$/.test(s) ? s : null;
  }
  function netSend(msg) { if (net.conn && net.conn.open) try { net.conn.send(msg); } catch (e) {} }
  function sendTo(cid, msg) { for (const [c, id] of net.conns) if (id === cid && c.open) try { c.send(msg); } catch (e) {} }
  function broadcast(msg) { for (const c of net.conns.keys()) if (c.open) try { c.send(msg); } catch (e) {} }

  // ── bảng thông báo ──
  const sheet = (emoji, title, msg, btns, extra) => confirmBox(emoji, title, msg, btns, extra);
  const hideSheet = () => { $('ovNet').hidden = true; };
  function onlineMenu(val = '') {
    const box = document.createElement('div');
    box.innerHTML = `<div class="row"><button class="btn go" id="oCreate" style="width:100%">${t('createRoom')}</button></div><div class="or">${t('orJoin')}</div>`
      + `<input class="code-in" id="oCode" maxlength="60" placeholder="${t('codePh')}" autocomplete="off" autocapitalize="characters" spellcheck="false" enterkeyhint="go">`
      + `<p class="note" id="oCodeErr" hidden>${t('codeErr')}</p>`;
    const go = () => {
      const c = parseCode($('oCode').value);
      if (!c) { $('oCodeErr').hidden = false; $('oCode').focus(); return false; }
      history.replaceState(null, '', location.pathname + location.search + '#room=' + c);
      joinOnline(c);
    };
    sheet('🌐', t('online'), t('onlineIntro'), [[t('cancel'), null], [t('joinRoom'), () => { if (go() === false) setTimeout(() => onlineMenu($('oCode') ? $('oCode').value : ''), 0); }]], box);
    $('oCreate').onclick = () => { hideSheet(); hostOnline(); };
    const i = $('oCode'); i.value = val;
    i.onkeydown = e => { if (e.key === 'Enter') { hideSheet(); if (go() === false) onlineMenu(i.value); } };
    i.oninput = () => { $('oCodeErr').hidden = true; };
  }
  function fail(title, msg, retry) {
    const b = [[t('playBots'), () => leaveOnline()]];
    if (retry) b.push([t('retry'), retry]);
    sheet('😕', title, msg, b);
  }
  function waiting(title, msg) { sheet('🌐', title, msg + DOTS, [[t('cancel'), () => leaveOnline()]]); }
  function askLeave() {
    sheet('🚪', t('leaveQ'), net.host ? t('leaveHost') : t('leaveGuest'), [[t('stay'), null], [t('leave'), () => leaveOnline()]]);
  }
  function closeNet() {
    clearTimeout(net.timer); clearInterval(net.hbT);
    voiceLeave();
    const bye = { t: 'bye' };
    if (net.conn) { netSend(bye); try { net.conn.close(); } catch (e) {} }
    for (const c of net.conns.keys()) { try { c.send(bye); c.close(); } catch (e) {} }
    if (net.peer) try { net.peer.destroy(); } catch (e) {}
  }
  function startNet(host, code) { closeNet(); net = freshNet(); net.on = true; net.host = host; net.code = code; return net; }
  function leaveOnline() {
    closeNet();
    net = freshNet(); M = []; phase = 'none';
    if (location.hash) history.replaceState(null, '', location.pathname + location.search);
    Ctl.mode = null; Ctl.G = null; Ctl.V = null; Ctl.onHostChange = null;
    for (const id of ['ovNet', 'ovOver', 'ovMorning', 'ovVerdict', 'ovCard']) $(id).hidden = true;
    Sound.stopVoice(); syncVoiceUi();
    show('scrMenu'); refreshMenu();
  }

  // ── phòng chờ ──
  function humans() { return M.filter(m => m.online !== false); }
  function fixS() { S.n = Math.max(5, humans().length, Math.min(MAX_P, S.n | 0)); }
  function enterLobby() {
    phase = 'lobby'; Ctl.mode = net.host ? 'host' : 'guest'; Ctl.G = null; Ctl.V = null;
    for (const id of ['ovOver', 'ovMorning', 'ovVerdict', 'ovCard']) $(id).hidden = true;
    show('scrLobby'); renderLobby();
  }
  let kickArmed = null, kickT = 0;
  function kickBtn(cid) {
    const b = document.createElement('button');
    b.className = 'kick' + (kickArmed === cid ? ' armed' : '');
    b.textContent = kickArmed === cid ? t('kickQ') : t('kick');
    b.onclick = () => {
      clearTimeout(kickT);
      if (kickArmed === cid) { kickArmed = null; hostKick(cid); return; }
      kickArmed = cid; renderLobby();
      kickT = setTimeout(() => { kickArmed = null; renderLobby(); }, 4000);
    };
    return b;
  }
  function renderLobby() {
    if (!net.on || screen !== 'scrLobby' || !S) return;
    const host = net.host;
    $('lbHostBox').hidden = !host; $('lbHostCtl').hidden = !host; $('lbStart').hidden = !host; $('lbReady').hidden = host;
    if (host) {
      $('lbCodeTxt').textContent = showCode(net.code); $('lbLink').value = inviteUrl();
      $('lbNote').hidden = location.protocol !== 'file:'; $('lbShare').hidden = !navigator.share;
      $('lbN').textContent = S.n;
    }
    const hs = humans(), nb = Math.max(0, S.n - hs.length);
    $('lbCount').textContent = `${t('members')} · ${hs.length}${nb ? ` + ${nb} 🤖` : ''} = ${S.n}`;
    const box = $('lbMembers'); box.innerHTML = '';
    M.forEach((m, k) => {
      const row = document.createElement('div'); row.className = 'mem'; row.dataset.cid = m.cid;
      row.innerHTML = `<span class="av" style="background:${COLORS[k % COLORS.length]}">${esc(m.name.charAt(0).toUpperCase() || '?')}</span><span class="nm"></span>`;
      row.querySelector('.nm').textContent = m.name + (m.cid === myCid ? ` (${t('you')})` : '');
      if (m.vc) { const mi = document.createElement('span'); mi.textContent = m.mic ? '🎤' : '🔈'; row.appendChild(mi); }
      const tag = m.host ? [t('hostTag'), ''] : m.online === false ? [t('offTag'), ''] : m.wait ? [t('waitTag'), ''] : m.ready ? [t('readyTag'), 'ok'] : [t('notReadyTag'), ''];
      const tg = document.createElement('span'); tg.className = 'tag ' + tag[1]; tg.textContent = tag[0]; row.appendChild(tg);
      if (host && !m.host && m.cid !== myCid) row.appendChild(kickBtn(m.cid));
      box.appendChild(row);
    });
    for (let k = 0; k < nb; k++) { const row = document.createElement('div'); row.className = 'mem empty'; row.innerHTML = `<span class="nm">${t('botRow')}</span>`; box.appendChild(row); }
    const mine = myMem();
    if (document.activeElement !== $('lbName')) $('lbName').value = mine ? mine.name : myName();
    renderDeck($('lbDeck'), S.st, S.n, host, () => { roomChanged(); });
    const v = WW.validateDeck(S.st.deck, S.n);
    if (host) {
      const notReady = hs.filter(m => !m.host && !m.ready).length;
      $('lbStart').disabled = !v.ok || notReady > 0;
      $('lbHint').textContent = !v.ok ? t('hintDeck') : notReady ? t('hintNeedReady', { n: notReady }) : t('hintReady', { n: S.n });
    } else {
      const rd = !!(mine && mine.ready);
      $('lbReady').textContent = rd ? t('unready') : t('ready'); $('lbReady').classList.toggle('go', !rd); $('lbReady').disabled = !mine;
      $('lbHint').innerHTML = rd ? t('guestWait') + DOTS : t('guestHint');
    }
    paintTalk();
  }
  const roomMsg = () => ({ t: 'room', M: M.map(m => ({ cid: m.cid, name: m.name, host: !!m.host, ready: !!m.ready, online: m.online !== false, wait: !!m.wait, vc: !!m.vc, mic: !!m.mic, pid: m.pid || null })), S, ph: phase });
  function roomChanged() {
    if (!net.host) return;
    fixS();
    store.set('werewolf.room', { n: S.n, st: S.st });
    broadcast(roomMsg());
    if (phase === 'lobby') renderLobby();
    syncVoice();
  }
  $('lbName').oninput = () => {
    const nmv = cleanName($('lbName').value); if (!nmv) return;
    setup.name = nmv; saveSetup();
    if (net.host) { M[0].name = nmv; roomChanged(); } else { const m = myMem(); if (m) m.name = nmv; netSend({ t: 'name', name: nmv }); }
  };
  $('lbMinus').onclick = () => { S.n = Math.max(5, humans().length, S.n - 1); resizeDeck(S.st, S.n); roomChanged(); Sound.play('click'); };
  $('lbPlus').onclick = () => { S.n = Math.min(MAX_P, S.n + 1); resizeDeck(S.st, S.n); roomChanged(); Sound.play('click'); };
  $('lbReady').onclick = () => { const m = myMem(); if (!m) return; m.ready = !m.ready; netSend({ t: 'ready', v: m.ready }); renderLobby(); Sound.play('select'); };
  $('lbStart').onclick = () => hostStart();
  $('lbLeave').onclick = () => askLeave();
  $('lbCode').onclick = async () => { try { await navigator.clipboard.writeText(showCode(net.code)); } catch (e) {} $('lbCodeTip').textContent = t('copied'); setTimeout(() => { $('lbCodeTip').textContent = t('roomCode'); }, 1600); };
  $('lbCopy').onclick = async () => { const b = $('lbCopy'); try { await navigator.clipboard.writeText(inviteUrl()); } catch (e) { $('lbLink').select(); try { document.execCommand('copy'); } catch (e2) {} } b.textContent = t('copied'); setTimeout(() => { b.textContent = t('copyLink'); }, 1600); };
  $('lbLink').onclick = () => $('lbLink').select();
  $('lbShare').onclick = () => navigator.share({ title: t('title'), text: t('shareText'), url: inviteUrl() }).catch(() => {});

  // ── chủ phòng ──
  async function hostOnline(tries = 0) {
    const code = randCode(), n = startNet(true, code);
    M = [{ cid: myCid, name: myName() || t('hostName'), host: true, ready: true, online: true }];
    const saved = store.get('werewolf.room', null);
    S = { n: saved && saved.n ? saved.n : 8, st: null };
    S.st = deckState(S.n, saved && saved.st);
    waiting(t('online'), t('creating'));
    try { await loadPeerJs(); } catch (e) { if (net === n) fail(t('loadFail'), t('loadFailMsg'), () => hostOnline()); return; }
    if (net !== n) return;
    const peer = n.peer = new Peer(ROOM_PREFIX + code, PEER_OPTS);
    let opened = false;
    peer.on('open', () => {
      if (net !== n) return;
      opened = true; hideSheet();
      M[0].pid = peer.id;
      n.hbAt = Date.now();
      n.hbT = setInterval(() => {
        if (net !== n) return clearInterval(n.hbT);
        const now = Date.now(), slept = now - n.hbAt > HB_DROP; n.hbAt = now;
        for (const [c, at] of n.seen) {
          if (slept) n.seen.set(c, now);
          else if (now - at > HB_DROP && (c.hb || !n.conns.has(c))) { n.seen.delete(c); try { c.close(); } catch (e) {} if (c.lost) c.lost(); continue; }
          if (c.open) try { c.send({ t: 'hb' }); } catch (e) {}
        }
      }, HB_MS);
      history.replaceState(null, '', location.pathname + location.search + '#room=' + code);
      Ctl.onHostChange = sendViews;
      enterLobby(); syncVoiceUi();
    });
    peer.on('call', vcIncoming);
    peer.on('connection', c => {
      if (net !== n) return c.close();
      n.seen.set(c, Date.now());
      c.on('data', d => {
        if (net !== n) return;
        if (n.seen.has(c)) n.seen.set(c, Date.now());
        if (d && d.t === 'hb') { c.hb = true; try { c.send({ t: 'hbr' }); } catch (e) {} return; }
        if (d && d.t === 'hbr') return;
        hostMsg(c, d);
      });
      const lost = c.lost = () => {
        n.seen.delete(c);
        if (net !== n || !n.conns.has(c)) return;
        const cid = n.conns.get(c); n.conns.delete(c);
        if ([...n.conns.values()].includes(cid)) return;
        memberLost(cid);
      };
      c.on('close', lost); c.on('error', lost);
      c.on('open', () => watchIce(c, () => { try { c.close(); } catch (e) {} lost(); }));
    });
    peer.on('disconnected', () => { setTimeout(() => { if (net === n && !peer.destroyed && peer.disconnected) peer.reconnect(); }, 1500); });
    peer.on('error', err => {
      if (net !== n) return;
      if (err.type === 'unavailable-id' && tries < 3) return hostOnline(tries + 1);
      if (opened) return;
      fail(t('createFail'), err.type === 'browser-incompatible' ? t('browserFail') : t('serverFail'), () => hostOnline());
    });
  }
  const playerOf = cid => (Ctl.G ? Ctl.G.players.find(p => p.cid === cid) : null);
  function memberLost(cid) {
    const m = M.find(x => x.cid === cid); if (!m) return;
    Object.assign(m, { online: false, vc: false, mic: false });
    if (phase === 'lobby') {
      const n = net;
      setTimeout(() => { if (net === n && phase === 'lobby' && m.online === false) { M = M.filter(x => x !== m); roomChanged(); } }, LOBBY_GRACE);
    } else {
      const p = playerOf(cid);
      if (p && Ctl.G.phase !== 'over') { WW.setOff(Ctl.G, p.id, true, Date.now()); toast(t('gotOff', { name: esc(p.name) })); hostChangedSafe(); }
    }
    roomChanged();
  }
  function hostKick(cid) {
    if (!net.host || !cid || cid === myCid) return;
    const m = M.find(x => x.cid === cid); if (!m || m.host) return;
    net.banned.add(cid);
    for (const [c, id] of net.conns) if (id === cid) {
      net.conns.delete(c); net.seen.delete(c);
      try { c.send({ t: 'kicked' }); } catch (e) {}
      setTimeout(() => { try { c.close(); } catch (e) {} }, 500);
    }
    if (m.pid) { const vc = VC.calls.get(m.pid); if (vc) { try { vc.close(); } catch (e) {} vcDrop(m.pid, vc); } }
    M = M.filter(x => x !== m);
    const p = playerOf(cid);
    if (phase !== 'lobby' && p) { p.cid = null; p.bot = true; WW.setOff(Ctl.G, p.id, true, Date.now()); toast(t('gotKicked', { name: esc(p.name) })); hostChangedSafe(); }
    roomChanged();
  }
  function hostChangedSafe() { if (Ctl.G) hostChanged(); }
  const sayLast = {};
  function hostMsg(c, d) {
    if (!d || typeof d !== 'object') return;
    if (d.t === 'hello') {
      const cid = String(d.cid || '').slice(0, 40); if (!cid) return;
      if (net.banned.has(cid)) { try { c.send({ t: 'kicked' }); } catch (e) {} setTimeout(() => { try { c.close(); } catch (e) {} }, 500); return; }
      for (const [oc, ocid] of net.conns) if (ocid === cid && oc !== c) { net.conns.delete(oc); try { oc.send({ t: 'dup' }); } catch (e) {} setTimeout(() => { try { oc.close(); } catch (e) {} }, 500); }
      let m = M.find(x => x.cid === cid);
      if (!m) {
        if (phase === 'lobby' && humans().length >= MAX_P) { try { c.send({ t: 'full' }); } catch (e) {} setTimeout(() => c.close(), 500); return; }
        let base = cleanName(d.name) || 'Player ' + (M.length + 1), name = base, k = 2;
        while (M.some(x => x.name.toLowerCase() === name.toLowerCase())) name = `${base} ${k++}`; // tên trùng thì đánh số
        m = { cid, name, ready: false, wait: phase !== 'lobby' };
        M.push(m);
      }
      net.conns.set(c, cid);
      Object.assign(m, { online: true, pid: c.peer, vc: false, mic: false });
      try { c.send({ t: 'welcome' }); c.send(roomMsg()); } catch (e) {}
      const p = playerOf(cid);
      if (phase === 'game' && p) {
        if (p.off) { WW.setOff(Ctl.G, p.id, false, Date.now()); toast(t('gotBack', { name: esc(p.name) })); }
        hostChangedSafe();
      }
      roomChanged();
      return;
    }
    const cid = net.conns.get(c); if (!cid) return;
    const m = M.find(x => x.cid === cid); if (!m) return;
    switch (d.t) {
      case 'name': if (phase === 'lobby') { const nmv = cleanName(d.name); if (nmv && !M.some(x => x !== m && x.name.toLowerCase() === nmv.toLowerCase())) { m.name = nmv; } roomChanged(); } return;
      case 'ready': if (phase === 'lobby') { m.ready = !!d.v; roomChanged(); } return;
      case 'vc': Object.assign(m, { vc: !!d.on, mic: !!d.mic, pid: c.peer }); roomChanged(); return;
      case 'bye': net.conns.delete(c); if (phase === 'lobby') { M = M.filter(x => x !== m); roomChanged(); } else memberLost(cid); return;
      case 'act': {
        const p = playerOf(cid); if (!p || !Ctl.G || p.off) return;
        if (WW.act(Ctl.G, p.id, d.a, Date.now())) hostChanged();
        return;
      }
      case 'say': {
        const now = Date.now(); if (now - (sayLast[cid] || 0) < 700) return; sayLast[cid] = now; // chống spam
        const text = String(d.text || '').replace(/\s+/g, ' ').trim().slice(0, 120); if (!text) return;
        routeChat(cid, m.name, d.ch, text);
        return;
      }
    }
  }
  // kênh chat: 'all' (người sống, ban ngày), 'wolf' (bầy Sói ban đêm), 'dead' (hồn ma + người chờ ván sau)
  function allowedChannel(cid) {
    if (phase !== 'game' || !Ctl.G || Ctl.G.phase === 'over') return 'all';
    const p = playerOf(cid); if (!p || !p.alive) return 'dead';
    if (['nightfall', 'night'].includes(Ctl.G.phase)) return WW.isWolfSide(p) ? 'wolf' : null;
    return 'all';
  }
  function canRead(cid, ch) {
    if (ch === 'all') return true;
    const p = playerOf(cid), dead = !p || !p.alive;
    if (ch === 'dead') return dead;
    if (ch === 'wolf') return dead || (p && WW.isWolfSide(p));
    return false;
  }
  function routeChat(cid, name, ch, text) {
    if (allowedChannel(cid) !== ch) return;
    const msg = { t: 'chat', name, ch, text };
    for (const [c, id] of net.conns) if (canRead(id, ch) && c.open) try { c.send(msg); } catch (e) {}
    if (canRead(myCid, ch)) addChat(msg);
  }
  function say(ch, text) {
    if (net.host) routeChat(myCid, (myMem() || {}).name || myName(), ch, text);
    else netSend({ t: 'say', ch, text });
  }
  function hostStart() {
    if (!net.host || phase !== 'lobby') return;
    fixS();
    const hs = humans();
    if (hs.some(m => !m.host && !m.ready) || !WW.validateDeck(S.st.deck, S.n).ok) return;
    M = hs; M.forEach(m => { m.wait = false; });
    const botNames = shuffleArr(BOT_NAMES.filter(x => !hs.some(m => m.name.toLowerCase() === x.toLowerCase())));
    const players = hs.map(m => ({ name: m.name, cid: m.cid }));
    for (let i = 0; players.length < S.n; i++) players.push({ name: botNames[i] || 'Bot ' + (i + 1), bot: true });
    const G = WW.newGame({ players, deck: S.st.deck, opts: S.st.opts }, Date.now());
    phase = 'game';
    Ctl.chat = [];
    broadcast(roomMsg());
    startLocal('host', G, G.players.find(p => p.cid === myCid).id);
  }
  function sendViews() {
    const G = Ctl.G; if (!G) return;
    const now = Date.now();
    for (const [c, cid] of net.conns) {
      if (!c.open) continue;
      const p = G.players.find(q => q.cid === cid);
      if (!p) continue;
      const v = WW.viewFor(G, p.id); v.left = G.deadline - now;
      try { c.send({ t: 'v', v }); } catch (e) {}
    }
  }
  function hostToLobby() {
    M = M.filter(m => m.online !== false);
    M.forEach(m => { m.wait = false; if (!m.host) m.ready = false; });
    enterLobby(); roomChanged();
  }

  // ── khách ──
  async function joinOnline(code, again = 0) {
    const n = startNet(false, code); n.again = again;
    if (!again) M = [];
    waiting(again ? t('lost') : t('joinRoom'), again ? t('reconnecting', { n: again }) : t('connecting'));
    const retry = () => joinOnline(code);
    const rejoin = () => {
      if (net !== n || n.left || again >= REJOIN_MAX) return false;
      waiting(t('lost'), t('reconnecting', { n: again + 1 }));
      clearTimeout(n.timer);
      n.timer = setTimeout(() => { if (net === n) joinOnline(code, again + 1); }, again ? REJOIN_MS : 800);
      return true;
    };
    try { await loadPeerJs(); } catch (e) { if (net === n && !rejoin()) fail(t('loadFail'), t('loadFailMsg'), retry); return; }
    if (net !== n) return;
    const peer = n.peer = new Peer(PEER_OPTS);
    n.timer = setTimeout(() => { if (net === n && !n.conn && !rejoin()) fail(t('noReach'), t('noReachMsg'), retry); }, 20000);
    peer.on('call', vcIncoming);
    peer.on('open', () => {
      if (net !== n) return;
      const c = peer.connect(ROOM_PREFIX + code, { reliable: true });
      c.on('open', () => {
        if (net !== n) return c.close();
        clearTimeout(n.timer);
        n.conn = c;
        c.send({ t: 'hello', cid: myCid, name: myName() });
        n.heard = n.hbAt = Date.now();
        n.hbT = setInterval(() => {
          if (net !== n || n.conn !== c) return clearInterval(n.hbT);
          const now = Date.now();
          if (now - n.hbAt > HB_DEAD) n.heard = now;
          n.hbAt = now;
          if (n.hbOk && now - n.heard > HB_DEAD) { try { c.close(); } catch (e) {} lost(); return; }
          netSend({ t: 'hb' });
        }, HB_MS);
        watchIce(c, () => { try { c.close(); } catch (e) {} lost(); });
      });
      c.on('data', d => {
        if (net !== n || n.conn !== c) return;
        n.heard = Date.now();
        if (d && d.t === 'hb') { netSend({ t: 'hbr' }); return; }
        if (d && d.t === 'hbr') { n.hbOk = true; return; }
        guestMsg(d);
      });
      const lost = () => {
        if (net !== n || n.conn !== c || n.kicked) return;
        n.conn = null;
        if (n.left) { fail(t('roomClosed'), t('roomClosedMsg'), null); return; }
        if (n.dup) { fail(t('dup'), t('dupMsg'), retry); return; }
        again = 0;
        if (!rejoin()) fail(t('lost'), t('lostMsg'), retry);
      };
      c.on('close', lost); c.on('error', lost);
    });
    peer.on('disconnected', () => { setTimeout(() => { if (net === n && !peer.destroyed && peer.disconnected) peer.reconnect(); }, 1500); });
    peer.on('error', err => {
      if (net !== n || n.conn || n.kicked) return;
      clearTimeout(n.timer);
      if (again && rejoin()) return;
      if (err.type === 'peer-unavailable') sheet('😕', t('noRoom'), t('noRoomMsg', { code: `<b>${showCode(code)}</b>` }), [[t('playBots'), () => leaveOnline()], [t('reenter'), () => { leaveOnline(); onlineMenu(showCode(code)); }]]);
      else fail(t('joinFail'), t('serverFail'), retry);
    });
  }
  function netWake() {
    if (!net.on) return;
    const p = net.peer;
    if (p && !p.destroyed && p.disconnected) try { p.reconnect(); } catch (e) {}
    if (net.host || !net.conn) return;
    const now = Date.now(); net.hbAt = now; net.heard = Math.max(net.heard, now - HB_DEAD + 4000);
    netSend({ t: 'hb' });
  }
  document.addEventListener('visibilitychange', () => { if (!document.hidden) netWake(); });
  // đóng tab / tải lại: báo ngay cho bên kia thay vì đợi hết nhịp tim
  window.addEventListener('pagehide', () => { if (!net.on) return; if (net.host) broadcast({ t: 'bye' }); else netSend({ t: 'bye' }); });
  window.addEventListener('online', netWake);
  function guestMsg(d) {
    if (!d || typeof d !== 'object') return;
    switch (d.t) {
      case 'welcome': {
        const was = net.again > 0; net.again = 0; hideSheet();
        Ctl.mode = 'guest';
        if (was) toast(t('rejoined'));
        if (VC.wantMic) { VC.wantMic = false; voiceJoin(true); }
        syncVoiceUi();
        return;
      }
      case 'dup': net.dup = true; return;
      case 'full': net.kicked = true; fail(t('full'), t('fullMsg'), null); return;
      case 'kicked': {
        const n = net; n.kicked = true; n.conn = null;
        clearTimeout(n.timer); clearInterval(n.hbT);
        voiceLeave();
        if (n.peer) try { n.peer.destroy(); } catch (e) {}
        syncVoiceUi();
        sheet('🚪', t('kicked'), t('kickedMsg'), [[t('playBots'), () => leaveOnline()]]);
        return;
      }
      case 'bye': net.left = true; return;
      case 'room': {
        if (!Array.isArray(d.M)) return;
        M = d.M; if (d.S) S = d.S;
        const mine = myMem();
        if (d.ph === 'lobby') { if (phase !== 'lobby' || screen !== 'scrLobby') enterLobby(); else renderLobby(); }
        else if (mine && mine.wait) {
          if (phase !== 'wait') { phase = 'wait'; show('scrLobby'); sheet('⏳', t('inGame'), t('inGameMsg'), [[t('leave'), () => leaveOnline()]]); }
        } else phase = 'game';
        syncVoice(); syncVoiceUi(); paintTalk();
        return;
      }
      case 'v': phase = 'game'; hideSheet(); guestView(d.v); return;
      case 'chat': if (['all', 'wolf', 'dead'].includes(d.ch)) addChat({ name: String(d.name || '').slice(0, 20), ch: d.ch, text: String(d.text || '').slice(0, 120) }); return;
    }
  }
  function sendAct(a) { netSend({ t: 'act', a }); }
  function overButtons(box) {
    if (net.host) box.appendChild(btn(t('toLobby'), () => { $('ovOver').hidden = true; hostToLobby(); }, true));
    else { const b = btn(t('waitHost') + DOTS, () => {}, false, true); box.appendChild(b); }
  }

  // ── voice chat ──
  const VC = { joined: false, mic: false, stream: null, micTrack: null, silent: null, calls: new Map(), audios: new Map(), meters: new Map(), blocked: false, talk: new Set(), t: 0, wantMic: false };
  const myPid = () => (net.peer && !net.peer.destroyed && net.peer.id) || null;
  function silentTrack() {
    if (VC.silent && VC.silent.readyState === 'live') return VC.silent;
    const c = Sound.ctx(); if (!c) return null;
    const dst = c.createMediaStreamDestination(), g = c.createGain(); g.gain.value = 0;
    const o = c.createOscillator(); o.connect(g).connect(dst); o.start();
    return VC.silent = dst.stream.getAudioTracks()[0];
  }
  async function voiceJoin(wantMic) {
    if (!net.on || !net.peer || !myMem()) return;
    if (!VC.stream) { const tr = silentTrack(); if (!tr) return; VC.stream = new MediaStream([tr]); }
    VC.joined = true; syncVoiceUi();
    if (wantMic && !VC.micTrack) {
      try {
        const ms = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } });
        const tr = ms.getAudioTracks()[0];
        if (!net.on || !VC.joined) { tr.stop(); return; }
        VC.micTrack = tr; VC.mic = true;
        tr.onended = () => { if (VC.micTrack !== tr) return; VC.micTrack = null; VC.mic = false; voiceSwap(silentTrack()); meterOff('me'); voiceFlag(); syncVoiceUi(); };
        voiceSwap(tr); meterOn('me', new MediaStream([tr]));
        toast(t('micOn'));
      } catch (e) { toast(t('micFail'), '', 5000); }
    }
    voiceFlag(); syncVoice(); syncVoiceUi();
  }
  function voiceSwap(track) {
    if (!VC.stream || !track) return;
    for (const x of VC.stream.getAudioTracks()) if (x !== track) VC.stream.removeTrack(x);
    if (!VC.stream.getAudioTracks().includes(track)) VC.stream.addTrack(track);
    for (const c of VC.calls.values()) {
      const pc = c.peerConnection; if (!pc) continue;
      for (const sn of pc.getSenders()) if (!sn.track || sn.track.kind === 'audio') { try { sn.replaceTrack(track).catch(() => {}); } catch (e) {} }
    }
  }
  function voiceToggle() {
    if (!net.on || !net.peer || !myMem()) return;
    Sound.unlock();
    if (VC.blocked) { voiceUnblock(); return; }
    if (!VC.joined || !VC.micTrack) { voiceJoin(true); return; }
    VC.mic = !VC.mic; VC.micTrack.enabled = VC.mic;
    if (!VC.mic) VC.talk.delete('me');
    voiceFlag(); syncVoiceUi(); paintTalk(); Sound.play('click');
  }
  function voiceFlag() {
    const m = myMem(); if (!net.on || !m) return;
    const f = { vc: VC.joined, mic: VC.joined && VC.mic, pid: myPid() };
    Object.assign(m, f);
    if (net.host) roomChanged(); else { netSend({ t: 'vc', on: f.vc, mic: f.mic }); if (phase === 'lobby') renderLobby(); }
  }
  function syncVoice() {
    if (!net.on || !net.peer) return;
    const mine = myPid(); if (!mine) return;
    const live = new Set();
    for (const x of M) {
      if (x.cid === myCid || !x.vc || !x.pid || x.pid === mine || x.online === false) continue;
      live.add(x.pid);
      if (!VC.joined) { voiceJoin(false); return; }
      if (mine < x.pid && !VC.calls.has(x.pid)) voiceCall(x.pid);
    }
    for (const [pid, c] of VC.calls) if (!live.has(pid) && Date.now() - (c._t || 0) > 10000) { try { c.close(); } catch (e) {} vcDrop(pid, c); }
    syncVchip();
  }
  function voiceCall(pid) { let c = null; try { c = net.peer.call(pid, VC.stream); } catch (e) {} if (c) vcWire(pid, c); }
  function vcIncoming(c) {
    if (!net.on || !net.peer) { try { c.close(); } catch (e) {} return; }
    const pid = c.peer;
    if (!VC.joined) voiceJoin(false);
    const mine = myPid();
    if (!VC.stream || (mine && mine < pid && VC.calls.has(pid))) { try { c.close(); } catch (e) {} return; }
    vcWire(pid, c);
    try { c.answer(VC.stream); } catch (e) {}
  }
  function vcWire(pid, c) {
    const old = VC.calls.get(pid); if (old && old !== c) { try { old.close(); } catch (e) {} }
    c._t = Date.now(); VC.calls.set(pid, c);
    c.on('stream', st => { if (VC.calls.get(pid) === c) vcAttach(pid, st); });
    c.on('close', () => vcDrop(pid, c)); c.on('error', () => vcDrop(pid, c));
  }
  function vcDrop(pid, c) {
    if (VC.calls.get(pid) !== c) return;
    VC.calls.delete(pid);
    const a = VC.audios.get(pid); if (a) { a.srcObject = null; a.remove(); VC.audios.delete(pid); }
    meterOff(pid); paintTalk();
  }
  function vcAttach(pid, st) {
    let a = VC.audios.get(pid);
    if (!a) { a = document.createElement('audio'); a.autoplay = true; a.setAttribute('playsinline', ''); a.style.display = 'none'; document.body.appendChild(a); VC.audios.set(pid, a); }
    a.srcObject = st;
    const g = vcGain(pid); a.volume = g; a.muted = g < 0.03;
    const p = a.play(); if (p && p.catch) p.catch(() => { VC.blocked = true; syncVoiceUi(); toast(t('tapToHear'), '', 5000); });
    meterOn(pid, st);
  }
  function voiceUnblock() {
    VC.blocked = false;
    for (const a of VC.audios.values()) { const p = a.play(); if (p && p.catch) p.catch(() => { VC.blocked = true; syncVoiceUi(); }); }
    syncVoiceUi();
  }
  // ai nghe được ai: phòng chờ / hết ván nghe hết; ban ngày người sống nghe nhau; ban đêm chỉ bầy Sói nghe nhau;
  // hồn ma (và người chờ ván sau) nghe tất cả, nhưng người sống không nghe hồn ma
  function playerOfPid(pid) { const m = M.find(x => x.pid === pid); const V = Ctl.V; return m && V ? V.players.find(p => p.cid === m.cid) : null; }
  function vcGain(pid) {
    const V = Ctl.V;
    if (phase !== 'game' || !V || V.phase === 'over' || screen !== 'scrGame') return 1;
    const me = V.players[V.me]; if (!me) return 1;
    const s = playerOfPid(pid);
    if (!me.alive) return 1;
    if (!s || !s.alive) return 0;
    if (['nightfall', 'night'].includes(V.phase)) return me.wolf && s.wolf ? 1 : 0;
    return 1;
  }
  setInterval(() => {
    if (!net.on) return;
    for (const [pid, a] of VC.audios) { const g = Math.max(0, Math.min(1, vcGain(pid))); if (Math.abs(a.volume - g) > 0.02) a.volume = g; const mu = g < 0.03; if (a.muted !== mu) a.muted = mu; }
  }, 200);
  function syncVchip() {
    const b = $('bVoice'), V = Ctl.V;
    if (!net.on || !VC.joined || phase !== 'game' || !V) return;
    const me = V.players[V.me];
    b.title = !me || V.phase === 'over' ? '' : !me.alive ? t('vcDead') : ['nightfall', 'night'].includes(V.phase) ? (me.wolf ? t('vcNightWolf') : t('vcNight')) : t('vcDay');
  }
  function meterOn(key, st) {
    meterOff(key);
    const c = Sound.ctx(); if (!c) return;
    try { const src = c.createMediaStreamSource(st), an = c.createAnalyser(); an.fftSize = 512; src.connect(an); VC.meters.set(key, { src, an, buf: new Uint8Array(an.fftSize) }); } catch (e) {}
    if (!VC.t) VC.t = setInterval(meterTick, 200);
  }
  function meterOff(key) { const m = VC.meters.get(key); if (m) { try { m.src.disconnect(); } catch (e) {} VC.meters.delete(key); } VC.talk.delete(key); }
  function meterTick() {
    if (!VC.meters.size) { clearInterval(VC.t); VC.t = 0; return; }
    let changed = false;
    for (const [key, m] of VC.meters) {
      m.an.getByteTimeDomainData(m.buf);
      let sum = 0, n = 0;
      for (let i = 0; i < m.buf.length; i += 4) { const v = (m.buf[i] - 128) / 128; sum += v * v; n++; }
      const on = Math.sqrt(sum / n) > 0.04 && (key !== 'me' || VC.mic);
      if (on !== VC.talk.has(key)) { changed = true; if (on) VC.talk.add(key); else VC.talk.delete(key); }
    }
    if (changed) paintTalk();
  }
  function talking(p) {
    if (!p || !p.cid || !net.on) return false;
    if (p.cid === myCid) return VC.talk.has('me');
    const m = M.find(x => x.cid === p.cid);
    return !!(m && m.pid && VC.talk.has(m.pid) && vcGain(m.pid) > 0.03);
  }
  function paintTalk() {
    for (const r of document.querySelectorAll('#lbMembers .mem[data-cid]')) { const m = M.find(x => x.cid === r.dataset.cid); r.classList.toggle('talk', !!m && (m.cid === myCid ? VC.talk.has('me') : !!m.pid && VC.talk.has(m.pid))); }
    if (screen === 'scrGame' && Ctl.V) paintTalkSeats();
  }
  function voiceLeave() {
    for (const [pid, c] of [...VC.calls]) { try { c.close(); } catch (e) {} vcDrop(pid, c); }
    if (VC.micTrack) { try { VC.micTrack.stop(); } catch (e) {} }
    meterOff('me');
    VC.wantMic = VC.joined && VC.mic;
    Object.assign(VC, { joined: false, mic: false, stream: null, micTrack: null, blocked: false });
    VC.talk.clear(); syncVoiceUi();
  }
  function syncVoiceUi() {
    const b = $('bVoice');
    b.hidden = !(net.on && net.peer && !net.peer.destroyed);
    b.classList.toggle('live', VC.joined && VC.mic && !VC.blocked);
    b.classList.toggle('off', VC.joined && !VC.mic && !VC.blocked);
    b.classList.toggle('blocked', VC.blocked);
    b.textContent = VC.blocked ? '🔊' : VC.joined && !VC.mic ? '🎙️' : '🎤';
    syncVchip();
  }
  $('bVoice').onclick = voiceToggle;
  $('mOnline').onclick = () => { Sound.unlock(); onlineMenu(); };

  // mở link mời (#room=MÃ) là vào phòng luôn
  const hashRoom = parseCode((/room=([a-z0-9]+)/i.exec(location.hash) || [])[1]);
  if (hashRoom) setTimeout(() => joinOnline(hashRoom), 0);

  return {
    on: () => net.on, askLeave, sendAct, say, syncVoice, overButtons, talking,
    refresh() { if (screen === 'scrLobby') renderLobby(); syncVoiceUi(); },
  };
})();
window.Net = Net; // ui.js gọi qua window.Net (nạp sau ui.js)
