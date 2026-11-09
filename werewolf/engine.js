// Quản trò tự động: toàn bộ luật Ma Sói, chạy ở máy chủ phòng (hoặc máy mình khi chơi với máy).
// Trạng thái G là JSON thuần (lưu được vào localStorage). Người chơi chỉ nhận viewFor(G, id) —
// đã lọc bí mật: vai người khác, hành động ban đêm, kết quả soi... không bao giờ nằm trong view của người không được biết.
// Dùng được cả trong trình duyệt lẫn Node (test/engine.test.mjs) — cần ROLES, ROLE_LIST, POWER_ROLES từ roles.js.
const WW = (() => {
  const DEFAULT_OPTS = {
    witchBoth: false,   // Phù Thủy dùng cả hai bình trong một đêm
    witchSelf: true,    // Phù Thủy tự cứu mình
    guardSelf: true,    // Bảo Vệ tự bảo vệ
    guardRepeat: false, // Bảo Vệ canh một người hai đêm liền
    mayor: 'double',    // 'double' phiếu x2 | 'tie' phân xử khi hoà
    seer: 'team',       // 'team' chỉ biết Sói hay không | 'role' biết vai
    reveal: true,       // lật bài người chết
    tie: 'none',        // hoà phiếu (không có Vật Hy Sinh): 'none' không ai chết | 'random' bốc thăm
    abstain: true,      // cho phép bỏ phiếu trắng
    girlRisk: 20,       // % Cô Bé bị bắt khi nhìn trộm
    elderPenalty: true, // Già Làng chết vì dân → dân mất năng lực
    wolfWin: 'parity',  // 'parity' Sói ≥ phần còn lại | 'all' giết hết
    talk: 120,          // giây thảo luận
    act: 30,            // giây cho mỗi lượt hành động (hết giờ thì máy làm thay)
  };
  const NIGHT_ORDER = ['cupid', 'wildchild', 'guard', 'fox', 'wolves', 'bigwolf', 'whitewolf', 'seer', 'witch', 'piper'];
  const SEC = 1000;
  const rnd = (a, b) => a + Math.random() * (b - a);
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const isInt = v => Number.isInteger(v);

  // ── bộ bài ──
  function deckSize(deck) { return Object.values(deck || {}).reduce((s, n) => s + (n | 0), 0); }
  function wolfCount(n) { return Math.max(1, Math.round(n / 4.5)); }
  function presetDeck(name, n) {
    const d = {}; let wolves = wolfCount(n), left = n;
    const add = (r, k = 1) => { if (left <= 0) return; k = Math.min(k, left); d[r] = (d[r] || 0) + k; left -= k; };
    const specials = {
      beginner: ['seer', 'guard', 'hunter'],
      classic: ['seer', 'witch', 'hunter', 'guard', 'cupid'],
      advanced: ['seer', 'witch', 'hunter', 'guard', 'cupid', 'girl', 'elder', 'idiot', 'mayor', 'scapegoat', 'wildchild'],
      expanded: ['seer', 'witch', 'hunter', 'guard', 'fox', 'knight', 'bear', 'cupid', 'piper', 'angel', 'elder', 'idiot', 'girl', 'mayor'],
    }[name] || [];
    // bản nâng cao / mở rộng thay một Sói thường bằng Sói đặc biệt khi đủ đông
    if (name === 'advanced' && n >= 10 && wolves >= 2) { add('cub'); wolves--; }
    if (name === 'expanded' && n >= 12 && wolves >= 2) { add('bigwolf'); wolves--; }
    if (name === 'expanded' && n >= 15 && wolves >= 2) { add('whitewolf'); wolves--; }
    add('werewolf', wolves);
    const keepVillagers = n >= 8 ? (name === 'beginner' ? Math.ceil(n / 4) : 1) : 0;
    for (const r of specials) {
      if (left <= keepVillagers) break;
      if (r === 'guard' && name === 'beginner' && n < 6) continue;
      if (r === 'cupid' && n < 8) continue;
      if ((r === 'piper' || r === 'angel') && n < 10) continue;
      add(r);
    }
    add('villager', left);
    return d;
  }
  function wolfSideOfDeck(deck) { return ROLE_LIST.filter(r => ROLES[r].wolf).reduce((s, r) => s + (deck[r] | 0), 0); }
  function validateDeck(deck, n) {
    const errs = [], warns = [];
    const total = deckSize(deck);
    if (total !== n) errs.push(['cardsNeed', { n, total }]);
    for (const r of Object.keys(deck)) {
      if (!ROLES[r]) errs.push(['badRole', { r }]);
      else if ((deck[r] | 0) > ROLES[r].max) errs.push(['tooMany', { r, max: ROLES[r].max }]);
    }
    const wolves = wolfSideOfDeck(deck);
    if (!wolves) errs.push(['noWolf', {}]);
    else if (wolves * 2 >= total && total) errs.push(['tooManyWolves', {}]);
    let score = 0;
    for (const r of Object.keys(deck)) if (ROLES[r]) score += ROLES[r].w * (deck[r] | 0);
    if (!errs.length) {
      if (score > 7) warns.push(['favorVillage', { score }]);
      if (score < -7) warns.push(['favorWolves', { score }]);
      if (deck.cupid && total < 7) warns.push(['cupidSmall', {}]);
      if (deck.whitewolf && wolves < 2) warns.push(['whiteAlone', {}]);
      if (deck.wildchild && wolves < 2 && total > 8) warns.push(['fewWolves', {}]);
    }
    return { ok: !errs.length, errs, warns, score, wolves };
  }

  // ── tiện ích trạng thái ──
  const P = (G, i) => (isInt(i) ? G.players[i] : null);
  const alive = G => G.players.filter(p => p.alive);
  const auto = p => !!(p.bot || p.off);
  const isWolfSide = p => ROLES[p.role].wolf || p.turned;     // phe Sói (gồm Đứa Trẻ đã hoá Sói, Sói Trắng)
  const seenAsWolf = isWolfSide;
  const powerless = (G, p) => G.m.powersLost && POWER_ROLES.includes(p.role);
  const inDeck = (G, r) => (G.deck[r] | 0) > 0;
  function log(G, k, p = {}, to) { G.log.push({ s: ++G.seq, k, p, to: to || null, d: G.day, n: G.night, ph: G.phase }); }
  function neighbor(G, id, dir) { // người còn sống gần nhất về một phía (dir -1 trái, +1 phải)
    const n = G.players.length;
    for (let k = 1; k < n; k++) { const q = G.players[(id + dir * k + n * k) % n]; if (q.alive && q.id !== id) return q; }
    return null;
  }

  // ── tạo ván ──
  function newGame({ players, deck, opts }, now) {
    const o = Object.assign({}, DEFAULT_OPTS, opts || {});
    const n = players.length;
    const cards = shuffle(ROLE_LIST.flatMap(r => Array(deck[r] | 0).fill(r)));
    if (cards.length !== n) throw new Error('deck size');
    const seats = shuffle(players);
    const G = {
      v: 1, opts: o, deck: Object.assign({}, deck), seq: 0, log: [], day: 0, night: 0,
      phase: 'deal', step: null, steps: [], t0: now, deadline: now + 20 * SEC, minEnd: now + 4 * SEC,
      actors: [], acts: {}, botAt: {}, after: null, winner: null, skip: {}, acc: {},
      players: seats.map((x, i) => ({
        id: i, name: x.name, cid: x.cid || null, bot: !!x.bot, off: false, role: cards[i], alive: true,
        lover: null, charmed: false, lives: cards[i] === 'elder' ? 2 : 1, turned: false, idiot: false, canVote: true,
        heal: cards[i] === 'witch', poison: cards[i] === 'witch', fox: cards[i] === 'fox', seen: {}, died: null,
      })),
      m: { guardLast: null, wolfDied: false, cubRage: false, rust: null, powersLost: false, model: null, firstVote: false, lovers: null, charmed: [] },
      nt: null, vote: null, verdict: null, morning: null,
    };
    log(G, 'start', { n, deck: G.deck });
    for (const p of G.players) {
      log(G, 'yourRole', { r: p.role }, [p.id]);
      if (p.role === 'mayor') log(G, 'mayorIs', { p: p.id });
    }
    const wolves = G.players.filter(isWolfSide).map(p => p.id);
    for (const id of wolves) log(G, 'pack', { ids: wolves }, [id]);
    G.actors = G.players.map(p => p.id);
    planBots(G, now, 2, 5);
    return G;
  }

  // ── lượt đêm ──
  function stepActive(G, s) { // lượt này có được gọi không (gọi cả khi vai đã chết để không lộ thông tin)
    switch (s) {
      case 'cupid': return G.night === 1 && inDeck(G, 'cupid');
      case 'wildchild': return G.night === 1 && inDeck(G, 'wildchild');
      case 'guard': return inDeck(G, 'guard');
      case 'fox': return inDeck(G, 'fox');
      case 'wolves': return true;
      case 'bigwolf': return inDeck(G, 'bigwolf') && !G.m.wolfDied;
      case 'whitewolf': return inDeck(G, 'whitewolf') && G.night % 2 === 0;
      case 'seer': return inDeck(G, 'seer');
      case 'witch': return inDeck(G, 'witch');
      case 'piper': return inDeck(G, 'piper');
    }
    return false;
  }
  function stepActors(G, s) {
    const role = r => alive(G).filter(p => p.role === r && !powerless(G, p));
    switch (s) {
      case 'cupid': return role('cupid');
      case 'wildchild': return role('wildchild');
      case 'guard': return role('guard');
      case 'fox': return role('fox').filter(p => p.fox);
      case 'wolves': return alive(G).filter(p => isWolfSide(p) || (p.role === 'girl' && !powerless(G, p)));
      case 'bigwolf': return role('bigwolf');
      case 'whitewolf': return role('whitewolf').filter(() => alive(G).some(q => isWolfSide(q) && q.role !== 'whitewolf'));
      case 'seer': return role('seer');
      case 'witch': return role('witch').filter(p => p.heal || p.poison);
      case 'piper': return role('piper').filter(() => alive(G).some(q => q.role !== 'piper' && !q.charmed));
    }
    return [];
  }
  function beginNight(G, now) {
    G.night++; G.phase = 'nightfall'; G.step = null; G.actors = []; G.acts = {}; G.skip = {}; G.acc = {};
    G.nt = { guard: null, attacks: [], heal: null, poison: null, girl: null, wolfVotes: {} };
    G.steps = NIGHT_ORDER.filter(s => stepActive(G, s));
    G.deadline = now + 4.5 * SEC; G.minEnd = G.deadline;
    log(G, 'nightfall', { n: G.night });
  }
  function nextStep(G, now) {
    const s = G.steps.shift();
    if (!s) return resolveNight(G, now);
    G.phase = 'night'; G.step = s; G.acts = {}; G.botAt = {};
    G.actors = stepActors(G, s).map(p => p.id);
    if (s === 'wolves') {
      G.nt.need = G.m.cubRage ? 2 : 1; G.m.cubRage = false;
      G.nt.wolfVotes = {};
    }
    if (G.actors.length) { G.deadline = now + G.opts.act * SEC; G.minEnd = now + rnd(4, 6.5) * SEC; planBots(G, now, 2, 6); }
    else { G.deadline = now + rnd(4.5, 7.5) * SEC; G.minEnd = G.deadline; } // vai đã chết / hết năng lực: vẫn gọi để giấu thông tin
    log(G, 'wake', { s });
  }
  function planBots(G, now, a, b) { for (const id of G.actors) G.botAt[id] = now + rnd(a, b) * SEC; }

  // các lựa chọn hợp lệ cho người chơi lúc này (giao diện dùng để vẽ, act() dùng để kiểm tra)
  function options(G, id) {
    const p = P(G, id);
    if (!p || G.phase === 'over') return null;
    const others = alive(G).filter(q => q.id !== id).map(q => q.id);
    const all = alive(G).map(q => q.id);
    if (G.phase === 'deal') return G.actors.includes(id) && !G.acts[id] ? { kind: 'ack' } : null;
    if (G.phase === 'hunter') return G.actors.includes(id) ? { kind: 'shoot', targets: others, need: 1, skip: true } : null;
    if (G.phase === 'day') return p.alive ? { kind: 'talk', targets: others } : null;
    if (G.phase === 'vote') return p.alive && p.canVote ? { kind: 'vote', targets: others, need: 1, abstain: G.opts.abstain } : null;
    if (G.phase !== 'night' || !G.actors.includes(id)) return null;
    switch (G.step) {
      case 'cupid': return { kind: 'cupid', targets: all, need: 2 };
      case 'wildchild': return { kind: 'model', targets: others, need: 1 };
      case 'guard': {
        let t = G.opts.guardSelf ? all : others;
        if (!G.opts.guardRepeat && isInt(G.m.guardLast)) t = t.filter(x => x !== G.m.guardLast);
        return { kind: 'guard', targets: t, need: 1 };
      }
      case 'fox': return { kind: 'fox', targets: others, need: 1 };
      case 'wolves':
        if (p.role === 'girl' && !isWolfSide(p)) return { kind: 'peek', risk: G.opts.girlRisk };
        return { kind: 'bite', targets: alive(G).filter(q => !isWolfSide(q)).map(q => q.id), need: G.nt.need, votes: G.nt.wolfVotes };
      case 'bigwolf': return { kind: 'bigbite', targets: alive(G).filter(q => !isWolfSide(q) && !G.nt.attacks.some(a => a.t === q.id)).map(q => q.id), need: 1, skip: true };
      case 'whitewolf': return { kind: 'whitebite', targets: alive(G).filter(q => isWolfSide(q) && q.id !== id).map(q => q.id), need: 1, skip: true };
      case 'seer': return { kind: 'seer', targets: others, need: 1, seen: p.seen };
      case 'witch': {
        const victims = [...new Set(G.nt.attacks.map(a => a.t))].filter(t => P(G, t).alive);
        return { kind: 'witch', victims, canHeal: p.heal ? victims.filter(v => v !== id || G.opts.witchSelf) : [], canPoison: p.poison ? others : [], both: G.opts.witchBoth };
      }
      case 'piper': return { kind: 'charm', targets: alive(G).filter(q => q.id !== id && !q.charmed).map(q => q.id), need: Math.min(2, alive(G).filter(q => q.id !== id && !q.charmed).length) };
    }
    return null;
  }

  // ── nhận hành động (đã kiểm tra hợp lệ; sai thì bỏ qua) ──
  function act(G, id, a, now) {
    const p = P(G, id);
    if (!p || !a || typeof a !== 'object' || G.phase === 'over') return false;
    // nghi ngờ / xin bỏ phiếu sớm: ai còn sống cũng được, lúc ban ngày
    if (G.phase === 'day' && p.alive) {
      if (a.acc !== undefined) {
        const t = P(G, a.acc);
        if (a.acc === -1) { delete G.acc[id]; return true; }
        if (!t || !t.alive || t.id === id) return false;
        if (G.acc[id] === t.id) return false;
        G.acc[id] = t.id; log(G, 'accuse', { p: id, t: t.id }); return true;
      }
      if (a.skip !== undefined) { G.skip[id] = !!a.skip; return true; }
      return false;
    }
    const o = options(G, id); if (!o) return false;
    const okT = t => isInt(t) && o.targets && o.targets.includes(t);
    const list = v => (Array.isArray(v) ? v : [v]).filter(isInt);
    switch (o.kind) {
      case 'ack': G.acts[id] = { ok: 1 }; return true;
      case 'vote': {
        if (a.t === -1 && o.abstain) { G.acts[id] = { t: -1 }; return true; }
        if (!okT(a.t)) return false; G.acts[id] = { t: a.t }; return true;
      }
      case 'shoot': case 'bigbite': case 'whitebite':
        if (a.skip && o.skip) { G.acts[id] = { skip: 1 }; return true; }
        if (!okT(a.t)) return false; G.acts[id] = { t: a.t }; return true;
      case 'model': case 'guard': case 'fox': case 'seer':
        if (G.acts[id] || !okT(a.t)) return false; G.acts[id] = { t: a.t }; return true;
      case 'cupid': case 'charm': {
        if (G.acts[id]) return false;
        const t = [...new Set(list(a.t))];
        if (t.length !== o.need || !t.every(okT)) return false;
        G.acts[id] = { t }; return true;
      }
      case 'bite': {
        const t = [...new Set(list(a.t))];
        if (!t.length || t.length > o.need || !t.every(okT)) return false;
        G.acts[id] = { t }; G.nt.wolfVotes[id] = t; return true;
      }
      case 'peek': if (G.acts[id]) return false; G.acts[id] = { peek: !!a.peek }; return true;
      case 'witch': {
        if (G.acts[id]) return false;
        const heal = isInt(a.heal) && o.canHeal.includes(a.heal) ? a.heal : null;
        const poison = isInt(a.poison) && o.canPoison.includes(a.poison) ? a.poison : null;
        if (heal !== null && poison !== null && !o.both) return false;
        G.acts[id] = { heal, poison }; return true;
      }
    }
    return false;
  }

  // ── máy chơi (bot, hoặc người chơi treo máy quá 30 giây) ──
  function suspicion(G, id) { // điểm nghi ngờ của từng người theo góc nhìn của id (chỉ dùng thông tin id được biết)
    const me = P(G, id), s = {};
    for (const q of alive(G)) s[q.id] = Math.random() * 2;
    for (const [from, t] of Object.entries(G.acc)) if (s[t] !== undefined && +from !== id) s[t] += 1.2;
    for (const e of G.log) {
      if (e.to && !e.to.includes(id)) continue;
      if (e.k === 'seerSaw' && e.p.t !== undefined && s[e.p.t] !== undefined) s[e.p.t] += e.p.wolf ? 50 : -30;
      if (e.k === 'foxSaw' && !e.p.found) for (const t of e.p.ids) if (s[t] !== undefined) s[t] -= 8;
      if (e.k === 'botClaim' && e.p.t !== undefined && s[e.p.t] !== undefined && e.p.by !== id) s[e.p.t] += e.p.wolf ? 6 : -4;
      if (e.k === 'growl') { for (const t of e.p.near || []) if (s[t] !== undefined) s[t] += 3; }
    }
    if (me) { delete s[id]; if (me.lover !== null) delete s[me.lover]; }
    return s;
  }
  const best = (ids, score) => ids.slice().sort((a, b) => score[b] - score[a])[0];
  function botAct(G, id) {
    const p = P(G, id), o = options(G, id);
    if (!o) return null;
    const T = o.targets || [];
    const sus = suspicion(G, id);
    const nonWolfKnown = T.filter(t => !(isWolfSide(p) && isWolfSide(P(G, t))));
    switch (o.kind) {
      case 'ack': return { ok: 1 };
      case 'talk': return null;
      case 'vote': {
        if (isWolfSide(p) && p.role !== 'whitewolf') {
          const prey = T.filter(t => !isWolfSide(P(G, t)));
          const tally = {}; for (const v of Object.values(G.acts)) if (prey.includes(v.t)) tally[v.t] = (tally[v.t] || 0) + 1;
          const top = Object.keys(tally).map(Number).sort((a, b) => tally[b] - tally[a])[0];
          return { t: isInt(top) && Math.random() < 0.7 ? top : (best(prey, sus) ?? pick(T)) };
        }
        const t = best(T.filter(x => x !== p.lover), sus);
        if (!isInt(t)) return o.abstain ? { t: -1 } : { t: pick(T) };
        // theo số đông một phần
        const tally = {}; for (const v of Object.values(G.acts)) if (isInt(v.t) && v.t >= 0) tally[v.t] = (tally[v.t] || 0) + 1;
        const top = Object.keys(tally).map(Number).filter(x => T.includes(x) && x !== p.lover).sort((a, b) => tally[b] - tally[a])[0];
        if (isInt(top) && sus[t] < 20 && Math.random() < 0.35) return { t: top };
        return { t };
      }
      case 'shoot': { const t = best(T.filter(x => x !== p.lover), sus); return isInt(t) ? { t } : { skip: 1 }; }
      case 'cupid': { const s = shuffle(T); return { t: Math.random() < 0.3 && T.includes(id) ? [id, s.find(x => x !== id)] : s.slice(0, 2) }; }
      case 'model': return { t: pick(T) };
      case 'guard': {
        const claim = G.log.filter(e => e.k === 'botClaim' && !e.to && P(G, e.p.by).alive).map(e => e.p.by).filter(x => T.includes(x));
        return { t: claim.length && Math.random() < 0.7 ? claim[claim.length - 1] : T.includes(id) && Math.random() < 0.35 ? id : pick(T) };
      }
      case 'fox': return { t: pick(T) };
      case 'seer': { const fresh = T.filter(t => p.seen[t] === undefined); return { t: best(fresh.length ? fresh : T, sus) }; }
      case 'peek': return { peek: Math.random() < 0.4 };
      case 'bite': {
        const votes = Object.values(G.nt.wolfVotes).flat();
        const claims = G.log.filter(e => e.k === 'botClaim' && !e.to).map(e => e.p.by).filter(x => T.includes(x));
        const t = [];
        for (let k = 0; k < o.need; k++) {
          const pool = T.filter(x => !t.includes(x) && x !== p.lover);
          if (!pool.length) break;
          const follow = votes.filter(x => pool.includes(x));
          t.push(follow.length && Math.random() < 0.8 ? pick(follow) : claims.find(x => pool.includes(x)) ?? pick(pool));
        }
        return t.length ? { t } : null;
      }
      case 'bigbite': return T.length ? { t: pick(T) } : { skip: 1 };
      case 'whitebite': return T.length && Math.random() < 0.6 ? { t: pick(T) } : { skip: 1 };
      case 'witch': {
        let heal = null, poison = null;
        if (o.canHeal.length && (o.canHeal.includes(id) || Math.random() < (G.night === 1 ? 0.8 : 0.5))) heal = o.canHeal.includes(id) ? id : pick(o.canHeal);
        if ((heal === null || o.both) && o.canPoison.length && G.night >= 2) {
          const t = best(o.canPoison.filter(x => x !== p.lover), sus);
          if (isInt(t) && (sus[t] > 20 || Math.random() < 0.12)) poison = t;
        }
        return { heal, poison };
      }
      case 'charm': return { t: shuffle(T).slice(0, o.need) };
    }
    return null;
  }

  // ── chết & hiệu ứng dây chuyền ──
  function kill(G, id, cause, out) {
    const p = P(G, id); if (!p || !p.alive) return;
    p.alive = false; p.died = { cause, day: G.day, night: G.night };
    out.push({ id, cause });
    if (isWolfSide(p)) G.m.wolfDied = true;
    if (p.role === 'cub') G.m.cubRage = true;
    if (p.role === 'elder' && G.opts.elderPenalty && ['vote', 'poison', 'hunter'].includes(cause) && !G.m.powersLost) { G.m.powersLost = true; log(G, 'powersLost'); }
    if (p.role === 'hunter' && !powerless(G, p) && cause !== 'elderPenalty') (G.m.hunters = G.m.hunters || []).push(id);
    // Thiên Sứ thắng nếu chết trước khi qua hết lần bỏ phiếu đầu và đêm đầu
    if (p.role === 'angel' && !G.winner && !G.m.angelClosed) G.m.angelWin = id;
    if (p.role === 'knight' && cause === 'wolf' && !powerless(G, p)) {
      const n = G.players.length;
      for (let k = 1; k < n; k++) { const q = G.players[(id - k + n * 2) % n]; if (q.alive && isWolfSide(q)) { G.m.rust = q.id; break; } }
    }
    // Đứa Trẻ Hoang Dã: hình mẫu chết thì hoá Sói
    for (const w of G.players) if (w.role === 'wildchild' && w.alive && !w.turned && w.model === id) {
      w.turned = true;
      log(G, 'wildTurn', {}, [w.id]);
      const pack = G.players.filter(q => q.alive && isWolfSide(q)).map(q => q.id);
      for (const q of pack) log(G, 'pack', { ids: pack }, [q]);
    }
    if (isInt(p.lover)) { const l = P(G, p.lover); if (l && l.alive) kill(G, l.id, 'love', out); }
  }

  function resolveNight(G, now) {
    const nt = G.nt, deaths = [];
    // Hiệp Sĩ: con Sói bị kiếm gỉ đâm từ đêm trước chết đêm nay
    if (isInt(G.m.rust)) { const w = P(G, G.m.rust); G.m.rust = null; if (w && w.alive) kill(G, w.id, 'rust', deaths); }
    const done = new Set();
    for (const a of nt.attacks) {
      const t = P(G, a.t); if (!t || !t.alive || done.has(t.id)) continue;
      done.add(t.id);
      if (nt.guard === t.id) continue; // Bảo Vệ chặn mọi cú cắn của Sói (kể cả Sói Trắng cắn Sói)
      if (nt.heal === t.id) continue;
      if (t.role === 'elder' && t.lives > 1 && a.by !== 'white') { t.lives--; continue; }
      kill(G, t.id, 'wolf', deaths);
    }
    if (isInt(nt.poison)) kill(G, nt.poison, 'poison', deaths);
    finishDeaths(G, deaths, now, 'morning');
  }
  // sau một loạt chết: chờ Thợ Săn bắn (nếu có), xét thắng, rồi sang pha tiếp
  function finishDeaths(G, deaths, now, next) {
    if (next === 'morning') {
      G.day++;
      G.phase = 'morning'; G.step = null; G.actors = []; G.acts = {};
      const ids = deaths.map(d => d.id);
      G.morning = { deaths: deaths.map(d => ({ id: d.id, r: G.opts.reveal ? P(G, d.id).role : null, love: d.cause === 'love' })) };
      log(G, ids.length ? 'deaths' : 'peaceful', { ids, rs: G.morning.deaths });
      // Người Thuần Gấu
      const bear = G.players.find(q => q.role === 'bear' && q.alive && !powerless(G, q));
      if (bear) {
        const near = [neighbor(G, bear.id, -1), neighbor(G, bear.id, 1)].filter(Boolean);
        if (near.some(isWolfSide)) { G.morning.growl = true; log(G, 'growl', { near: near.map(q => q.id) }); }
      }
      // người bị mê hoặc biết nhau
      const charmed = G.players.filter(q => q.charmed && q.alive).map(q => q.id);
      if (G.nt && G.nt.newCharm && G.nt.newCharm.length) for (const id of charmed) log(G, 'charmed', { ids: charmed }, [id]);
      G.deadline = now + (6 + 1.5 * ids.length + (G.morning.growl ? 2 : 0)) * SEC; G.minEnd = G.deadline;
      G.after = 'day';
    } else {
      G.after = next;
    }
    G.pendingDeaths = deaths.map(d => d.id);
  }
  // xử lý Thợ Săn còn chờ bắn
  function startHunterIfAny(G, now) {
    const h = (G.m.hunters || []).shift();
    if (!isInt(h)) return false;
    G.phase = 'hunter'; G.step = null; G.actors = [h]; G.acts = {};
    G.deadline = now + G.opts.act * SEC; G.minEnd = now + 2.5 * SEC; planBots(G, now, 3, 7);
    log(G, 'hunterUp', { p: h, r: 'hunter' });
    return true;
  }

  function checkWin(G) {
    if (G.winner) return G.winner;
    const live = alive(G);
    const W = (team, ids, why) => (G.winner = { team, ids, why });
    if (isInt(G.m.angelWin)) return W('angel', [G.m.angelWin], 'angel');
    if (!live.length) return W('none', [], 'allDead');
    const lovers = G.m.lovers;
    if (lovers) {
      const [a, b] = lovers.map(i => P(G, i));
      const cross = isWolfSide(a) !== isWolfSide(b);
      if (cross && a.alive && b.alive && live.length === 2) return W('lovers', lovers, 'lovers');
    }
    if (live.length === 1 && live[0].role === 'whitewolf') return W('white', [live[0].id], 'white');
    const piper = live.find(q => q.role === 'piper');
    if (piper && live.every(q => q === piper || q.charmed)) return W('piper', [piper.id], 'piper');
    const wolves = live.filter(isWolfSide);
    if (!wolves.length) return W('village', G.players.filter(q => !isWolfSide(q) && (ROLES[q.role].team !== 'solo' || q.role === 'angel') && !crossLover(G, q)).map(q => q.id), 'village');
    const pack = wolves.filter(q => q.role !== 'whitewolf' && !crossLover(G, q));
    const rest = live.length - pack.length;
    if (pack.length && (G.opts.wolfWin === 'all' ? rest === 0 : pack.length >= rest)) {
      return W('wolf', G.players.filter(q => isWolfSide(q) && q.role !== 'whitewolf' && !crossLover(G, q)).map(q => q.id), 'wolf');
    }
    return null;
  }
  function crossLover(G, q) {
    const L = G.m.lovers; if (!L || !L.includes(q.id)) return false;
    const [a, b] = L.map(i => P(G, i)); return isWolfSide(a) !== isWolfSide(b);
  }

  // ── kết thúc từng lượt đêm ──
  function endStep(G, now) {
    const s = G.step, A = G.acts;
    const get = id => A[id] || {};
    switch (s) {
      case 'cupid': for (const id of G.actors) {
        const t = get(id).t; if (!Array.isArray(t) || t.length !== 2) break;
        const [a, b] = t.map(i => P(G, i)); a.lover = b.id; b.lover = a.id; G.m.lovers = [a.id, b.id];
        log(G, 'cupidDone', { ids: [a.id, b.id] }, [id]);
        log(G, 'inLove', { p: b.id, r: b.role }, [a.id]); log(G, 'inLove', { p: a.id, r: a.role }, [b.id]);
      } break;
      case 'wildchild': for (const id of G.actors) { const t = get(id).t; if (isInt(t)) { P(G, id).model = t; G.m.model = t; log(G, 'modelPicked', { t }, [id]); } } break;
      case 'guard': for (const id of G.actors) { const t = get(id).t; if (isInt(t)) { G.nt.guard = t; G.m.guardLast = t; log(G, 'guarded', { t }, [id]); } } break;
      case 'fox': for (const id of G.actors) {
        const t = get(id).t; if (!isInt(t)) continue;
        const grp = [P(G, t), neighbor(G, t, -1), neighbor(G, t, 1)].filter(Boolean);
        const ids = [...new Set(grp.map(q => q.id))], found = grp.some(seenAsWolf);
        if (!found) P(G, id).fox = false;
        log(G, 'foxSaw', { t, ids, found }, [id]);
      } break;
      case 'wolves': {
        const wolves = G.actors.filter(id => isWolfSide(P(G, id)));
        const tally = {};
        for (const id of wolves) for (const t of get(id).t || []) tally[t] = (tally[t] || 0) + 1;
        const ranked = shuffle(Object.keys(tally).map(Number)).sort((a, b) => tally[b] - tally[a]).slice(0, G.nt.need);
        let targets = ranked;
        const girl = G.actors.map(i => P(G, i)).find(q => q.role === 'girl' && !isWolfSide(q));
        if (girl && get(girl.id).peek) {
          const caught = Math.random() * 100 < G.opts.girlRisk;
          if (caught) { targets = [girl.id]; log(G, 'girlCaught', {}, [girl.id]); for (const w of wolves) log(G, 'caughtGirl', { t: girl.id }, [w]); }
          else log(G, 'girlSaw', { ids: targets }, [girl.id]);
        }
        for (const t of targets) G.nt.attacks.push({ t, by: 'pack' });
        if (targets.length) for (const w of wolves) log(G, 'packChose', { ids: targets }, [w]);
      } break;
      case 'bigwolf': for (const id of G.actors) { const t = get(id).t; if (isInt(t)) { G.nt.attacks.push({ t, by: 'big' }); log(G, 'bigChose', { t }, [id]); } } break;
      case 'whitewolf': for (const id of G.actors) { const t = get(id).t; if (isInt(t)) { G.nt.attacks.push({ t, by: 'white' }); log(G, 'whiteChose', { t }, [id]); } } break;
      case 'seer': for (const id of G.actors) {
        const t = get(id).t; if (!isInt(t)) continue;
        const q = P(G, t), wolf = seenAsWolf(q);
        P(G, id).seen[t] = G.opts.seer === 'role' ? q.role : wolf ? 'wolf' : 'good';
        log(G, 'seerSaw', { t, wolf, r: G.opts.seer === 'role' ? q.role : null }, [id]);
      } break;
      case 'witch': for (const id of G.actors) {
        const w = P(G, id), a = get(id);
        if (isInt(a.heal) && w.heal) { w.heal = false; G.nt.heal = a.heal; log(G, 'witchHealed', { t: a.heal }, [id]); }
        if (isInt(a.poison) && w.poison) { w.poison = false; G.nt.poison = a.poison; log(G, 'witchPoisoned', { t: a.poison }, [id]); }
      } break;
      case 'piper': for (const id of G.actors) {
        const t = get(id).t; if (!Array.isArray(t)) continue;
        G.nt.newCharm = t; for (const x of t) P(G, x).charmed = true;
        log(G, 'piperDone', { ids: t }, [id]);
        for (const x of t) log(G, 'youCharmed', {}, [x]);
      } break;
    }
    nextStep(G, now);
  }

  // ── ngày ──
  function beginDay(G, now) {
    G.phase = 'day'; G.step = null; G.actors = []; G.acts = {}; G.skip = {}; G.acc = {};
    if (G.day >= 1) G.m.angelClosed = true;
    G.deadline = now + G.opts.talk * SEC; G.minEnd = now + 8 * SEC;
    log(G, 'talk', { d: G.day });
    G.botTalkAt = alive(G).filter(auto).map(p => [p.id, now + rnd(6, Math.max(10, G.opts.talk * 0.6)) * SEC]);
  }
  function botTalk(G, now) {
    if (!G.botTalkAt) return false;
    let ch = false;
    G.botTalkAt = G.botTalkAt.filter(([id, at]) => {
      if (now < at) return true;
      const p = P(G, id); if (!p.alive) return false;
      ch = true;
      // Tiên Tri máy công bố kết quả soi khi đã tìm thấy Sói (hoặc thỉnh thoảng)
      const seen = Object.entries(p.seen).filter(([t]) => P(G, +t).alive);
      const wolfFound = seen.find(([, v]) => v === 'wolf' || (v !== 'good' && ROLES[v] && ROLES[v].wolf));
      if (p.role === 'seer' && wolfFound && Math.random() < 0.8) { const t = +wolfFound[0]; log(G, 'botClaim', { by: id, t, wolf: true, as: 'seer' }); G.acc[id] = t; return false; }
      if (p.role === 'seer' && seen.length && G.day >= 2 && Math.random() < 0.3) { const t = +seen[0][0]; log(G, 'botClaim', { by: id, t, wolf: false, as: 'seer' }); return false; }
      // Sói máy đôi khi vu khống một người dân
      if (isWolfSide(p) && Math.random() < 0.35) {
        const t = pick(alive(G).filter(q => !isWolfSide(q)).map(q => q.id));
        if (isInt(t)) { G.acc[id] = t; log(G, 'accuse', { p: id, t }); }
        return false;
      }
      const sus = suspicion(G, id);
      const t = best(alive(G).filter(q => q.id !== id && q.id !== p.lover && !(isWolfSide(p) && isWolfSide(q))).map(q => q.id), sus);
      if (isInt(t) && Math.random() < 0.75) { G.acc[id] = t; log(G, 'accuse', { p: id, t }); }
      else log(G, 'botMuse', { p: id, k: Math.floor(Math.random() * 4) });
      return false;
    });
    return ch;
  }
  function beginVote(G, now) {
    G.phase = 'vote'; G.step = null; G.acts = {}; G.botAt = {};
    G.actors = alive(G).filter(p => p.canVote).map(p => p.id);
    G.deadline = now + G.opts.act * SEC; G.minEnd = now + 3 * SEC;
    planBots(G, now, 3, Math.min(14, G.opts.act - 4));
    log(G, 'voteStart', { d: G.day });
  }
  function endVote(G, now) {
    const tally = {}, votes = {};
    const mayor = G.players.find(p => p.role === 'mayor' && p.alive);
    for (const id of G.actors) {
      const v = G.acts[id]; if (!v || !isInt(v.t)) continue;
      votes[id] = v.t; if (v.t < 0) continue;
      tally[v.t] = (tally[v.t] || 0) + (mayor && mayor.id === id && G.opts.mayor === 'double' ? 2 : 1);
    }
    const max = Math.max(0, ...Object.values(tally));
    let top = Object.keys(tally).map(Number).filter(t => tally[t] === max), victim = null, how = 'none';
    if (max > 0 && top.length === 1) { victim = top[0]; how = 'majority'; }
    else if (max > 0) {
      const goat = G.players.find(p => p.role === 'scapegoat' && p.alive);
      if (goat) { victim = goat.id; how = 'scapegoat'; }
      else if (G.opts.mayor === 'tie' && mayor && top.includes(votes[mayor.id])) { victim = votes[mayor.id]; how = 'mayor'; }
      else if (G.opts.tie === 'random') { victim = pick(top); how = 'random'; }
      else how = 'tie';
    }
    const deaths = [];
    let idiot = false;
    if (isInt(victim)) {
      const v = P(G, victim);
      if (v.role === 'idiot' && !v.idiot && !powerless(G, v)) { v.idiot = true; v.canVote = false; idiot = true; }
      else kill(G, victim, 'vote', deaths);
    }
    G.m.firstVote = true;
    G.verdict = { votes, tally, victim, how, idiot, r: isInt(victim) && (G.opts.reveal || idiot) ? P(G, victim).role : null, deaths: deaths.map(d => ({ id: d.id, r: G.opts.reveal ? P(G, d.id).role : null, love: d.cause === 'love' })) };
    log(G, 'verdict', G.verdict);
    G.phase = 'verdict'; G.actors = []; G.acts = {};
    G.deadline = now + (8 + deaths.length * 1.5) * SEC; G.minEnd = G.deadline;
    finishDeaths(G, deaths, now, 'night');
  }

  // ── nhịp chính ──
  function readyToEnd(G, now) {
    if (now >= G.deadline) return true;
    if (now < G.minEnd) return false;
    if (G.phase === 'day') { const hum = alive(G).filter(p => !auto(p)); return hum.length > 0 && hum.every(p => G.skip[p.id]); }
    if (['deal', 'night', 'vote', 'hunter'].includes(G.phase)) {
      if (G.phase === 'night' && G.step === 'wolves') {
        // bầy Sói phải thống nhất (mọi Sói chọn giống nhau) hoặc hết giờ
        const ws = G.actors.filter(id => isWolfSide(P(G, id)));
        if (!G.actors.every(id => G.acts[id])) return false;
        if (!ws.length) return true;
        const key = t => (t || []).slice().sort().join(',');
        return ws.every(id => key(G.acts[id].t) === key(G.acts[ws[0]].t)) || ws.every(id => auto(P(G, id)));
      }
      return G.actors.every(id => G.acts[id]);
    }
    return false;
  }
  function tick(G, now) {
    if (G.phase === 'over') return false;
    let ch = false;
    // máy làm thay đúng hẹn
    for (const id of G.actors) {
      const p = P(G, id);
      if (G.acts[id] || !auto(p) || now < (G.botAt[id] || 0)) continue;
      const a = botAct(G, id); if (a) { act(G, id, a, now); ch = true; } else { G.acts[id] = { skip: 1 }; ch = true; }
    }
    // Sói máy đổi phiếu theo Sói người để cả bầy thống nhất
    if (G.phase === 'night' && G.step === 'wolves') {
      const humanVote = G.actors.map(i => P(G, i)).filter(p => isWolfSide(p) && !auto(p) && G.acts[p.id]).map(p => G.acts[p.id].t).pop();
      if (humanVote) for (const id of G.actors) { const p = P(G, id); if (isWolfSide(p) && auto(p) && G.acts[id] && (!Array.isArray(G.acts[id].t) || G.acts[id].t.join() !== humanVote.join())) { G.acts[id] = { t: humanVote.slice() }; G.nt.wolfVotes[id] = humanVote.slice(); ch = true; } }
    }
    if (G.phase === 'day' && botTalk(G, now)) ch = true;
    if (!readyToEnd(G, now)) return ch;
    // hết giờ: ai chưa làm thì máy làm thay
    for (const id of G.actors) if (!G.acts[id]) { const a = botAct(G, id); if (!(a && act(G, id, a, now))) G.acts[id] = { skip: 1 }; }
    advance(G, now);
    return true;
  }
  function advance(G, now) {
    switch (G.phase) {
      case 'deal': {
        if (inDeck(G, 'angel')) beginDay(G, now); else beginNight(G, now); // có Thiên Sứ: bắt đầu bằng một buổi bỏ phiếu
        return;
      }
      case 'nightfall': return nextStep(G, now);
      case 'night': return endStep(G, now);
      case 'day': return beginVote(G, now);
      case 'vote': return endVote(G, now);
      case 'hunter': {
        const h = G.actors[0], a = G.acts[h] || {}, deaths = [];
        if (isInt(a.t) && P(G, a.t).alive) { kill(G, a.t, 'hunter', deaths); log(G, 'shot', { p: h, t: a.t, rs: deaths.map(d => ({ id: d.id, r: G.opts.reveal ? P(G, d.id).role : null })) }); }
        else log(G, 'noShot', { p: h });
        G.pendingDeaths = deaths.map(d => d.id);
        // fallthrough sang bước sau
      }
      // eslint-disable-next-line no-fallthrough
      case 'morning': case 'verdict': {
        if (checkWin(G)) return gameOver(G, now);
        if (startHunterIfAny(G, now)) return;
        if (G.after === 'day') return beginDay(G, now);
        return beginNight(G, now);
      }
    }
  }
  function gameOver(G, now) {
    G.phase = 'over'; G.step = null; G.actors = []; G.acts = {}; G.deadline = now; G.endedAt = now;
    log(G, 'over', Object.assign({}, G.winner, { roles: G.players.map(p => p.role) }));
  }

  // người chơi mất kết nối / quay lại: máy chơi thay trong lúc vắng
  function setOff(G, id, off, now) {
    const p = P(G, id); if (!p) return;
    p.off = !!off;
    if (off && G.actors.includes(id) && !G.acts[id]) G.botAt[id] = now + rnd(2, 4) * SEC;
  }

  // ── góc nhìn của một người chơi (đã lọc bí mật) ──
  function knownRole(G, me, q) {
    if (G.phase === 'over') return q.role;
    if (!me) return null;
    if (q.id === me.id) return q.role;
    if (!q.alive && G.opts.reveal) return q.role;
    if (q.role === 'mayor') return 'mayor';
    if (q.idiot) return 'idiot';
    if (isWolfSide(me) && isWolfSide(q) && me.role !== 'whitewolf' && q.role === 'whitewolf') return 'werewolf'; // bầy tưởng Sói Trắng là Sói thường
    if (isWolfSide(me) && isWolfSide(q)) return q.turned ? 'wildchild' : q.role;
    if (me.lover === q.id) return q.role;
    return null;
  }
  function viewFor(G, id) {
    const me = P(G, id);
    const over = G.phase === 'over';
    const players = G.players.map(q => ({
      id: q.id, name: q.name, cid: q.cid, bot: q.bot, off: q.off, alive: q.alive,
      role: knownRole(G, me, q),
      wolf: !!(me && (over || (isWolfSide(me) && isWolfSide(q)))),
      lover: !!(me && (over || me.id === q.id || me.lover === q.id) && isInt(q.lover)),
      charmed: !!((over || (me && me.charmed) || (me && me.role === 'piper')) && q.charmed),
      idiot: q.idiot, canVote: q.canVote, died: q.died ? { cause: G.opts.reveal || over ? q.died.cause : null, day: q.died.day } : null,
      seen: me && me.role === 'seer' && me.seen[q.id] !== undefined ? me.seen[q.id] : null,
    }));
    const v = {
      phase: G.phase, step: G.step, day: G.day, night: G.night, deadline: G.deadline, deck: G.deck, opts: G.opts,
      me: id, players, winner: G.winner, actorsN: G.actors.length,
      done: G.actors.filter(a => G.acts[a]).length,
      acc: G.phase === 'day' ? G.acc : {},
      skip: G.phase === 'day' ? Object.keys(G.skip).filter(k => G.skip[k]).map(Number) : [],
      morning: G.phase === 'morning' ? G.morning : null,
      verdict: G.phase === 'verdict' ? G.verdict : null,
      voted: G.phase === 'vote' ? G.actors.filter(a => G.acts[a]).map(Number) : [],
      powersLost: G.m.powersLost,
    };
    if (me) {
      v.role = me.role; v.turned = me.turned; v.opt = options(G, id);
      v.mine = G.acts[id] || null;
      v.potions = me.role === 'witch' ? { heal: me.heal, poison: me.poison } : null;
      v.fox = me.role === 'fox' ? me.fox : null;
      // Bảo Vệ: người đang canh (đêm nay, sau lượt Bảo Vệ) / người đã canh đêm trước (không được canh lại)
      if (me.role === 'guard' && me.alive) v.guardLast = isInt(G.m.guardLast) ? G.m.guardLast : null;
      if (G.phase === 'night' && G.step === 'wolves' && isWolfSide(me)) v.wolfVotes = G.nt.wolfVotes;
      if (G.phase === 'hunter') v.hunter = G.actors[0];
    }
    const vis = e => over || !e.to || (me && e.to.includes(id));
    v.log = G.log.filter(vis).slice(over ? 0 : -150);
    v.seq = G.seq;
    return v;
  }

  return { DEFAULT_OPTS, NIGHT_ORDER, newGame, tick, act, options, viewFor, setOff, validateDeck, presetDeck, deckSize, wolfCount, checkWin, botAct, isWolfSide };
})();
