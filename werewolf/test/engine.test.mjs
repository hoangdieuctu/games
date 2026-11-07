// Kiểm thử luật: node werewolf/test/engine.test.mjs
// Nạp roles.js + engine.js như trình duyệt (script thường), rồi chạy các tình huống riêng lẻ và hàng nghìn ván máy tự chơi.
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';

const dir = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = ['roles.js', 'engine.js'].map(f => readFileSync(join(dir, f), 'utf8')).join('\n');
const { ROLES, ROLE_LIST, WW } = Function(src + '\nreturn { ROLES, ROLE_LIST, WW };')();

let passed = 0, failed = 0;
function test(name, fn) {
  try { fn(); passed++; console.log('  ✓', name); }
  catch (e) { failed++; console.log('  ✗', name, '\n    ', e.message); }
}
const players = (n, humans = 0) => Array.from({ length: n }, (_, i) => ({ name: 'P' + i, cid: 'c' + i, bot: i >= humans }));
// chạy tới khi hết ván (hoặc quá số bước), thời gian ảo
function run(G, t = 0, maxSteps = 20000, until = () => false) {
  for (let k = 0; k < maxSteps && G.phase !== 'over'; k++) {
    if (until(G)) return t;
    t += 500; WW.tick(G, t);
  }
  return t;
}
// dựng ván với vai cố định theo thứ tự ghế
function rigged(roles, opts = {}, humans = roles.length) {
  const deck = {}; for (const r of roles) deck[r] = (deck[r] || 0) + 1;
  const G = WW.newGame({ players: players(roles.length, humans), deck, opts }, 0);
  G.players.forEach((p, i) => { p.role = roles[i]; p.name = 'P' + i; p.lives = p.role === 'elder' ? 2 : 1; p.heal = p.poison = p.role === 'witch'; p.fox = p.role === 'fox'; });
  G.log = []; // bỏ log vai của lần chia ngẫu nhiên
  return G;
}
// chuyển tới đầu một lượt đêm cụ thể (mọi người là người thật → không ai tự hành động)
function toStep(G, step, t = 0) {
  for (const id of G.actors) WW.act(G, id, { ok: 1 }, t);
  return run(G, t, 400, g => g.phase === 'night' && g.step === step);
}
function toPhase(G, phase, t) { return run(G, t, 2000, g => g.phase === phase); }
// ban ngày: mọi người bỏ phiếu trắng (để ván đi tiếp có kiểm soát)
function abstainDay(G, t) { t = toPhase(G, 'vote', t); for (const p of G.players) if (p.alive && p.canVote) WW.act(G, p.id, { t: -1 }, t); return t; }
const id = (G, r) => G.players.find(p => p.role === r).id;

console.log('Bộ bài');
test('preset đúng số lá với 5..20 người', () => {
  for (const name of ['beginner', 'classic', 'advanced', 'expanded'])
    for (let n = 5; n <= 20; n++) {
      const d = WW.presetDeck(name, n), v = WW.validateDeck(d, n);
      assert.equal(WW.deckSize(d), n, `${name} ${n}`);
      assert.ok(v.ok, `${name} ${n}: ${JSON.stringify(v.errs)}`);
    }
});
test('chặn bộ bài sai', () => {
  assert.ok(!WW.validateDeck({ villager: 5 }, 5).ok);
  assert.ok(!WW.validateDeck({ werewolf: 3, villager: 2 }, 5).ok);
  assert.ok(!WW.validateDeck({ werewolf: 1, villager: 3 }, 5).ok);
  assert.ok(!WW.validateDeck({ werewolf: 1, seer: 2, villager: 2 }, 5).ok);
});

console.log('Chia bài');
test('mỗi người một vai, khớp bộ bài, chỉ thấy vai của mình', () => {
  const deck = WW.presetDeck('classic', 12);
  const G = WW.newGame({ players: players(12), deck, opts: {} }, 0);
  const count = {}; for (const p of G.players) count[p.role] = (count[p.role] || 0) + 1;
  assert.deepEqual(count, deck);
  for (const p of G.players) {
    const v = WW.viewFor(G, p.id);
    for (const q of v.players) if (q.id !== p.id && q.role !== null) {
      assert.ok(q.role === 'mayor' || (WW.isWolfSide(p) && WW.isWolfSide(G.players[q.id])), `lộ vai ${q.id} cho ${p.id}`);
    }
    for (const e of v.log) assert.ok(!e.to || e.to.includes(p.id));
  }
});

console.log('Đêm');
test('Sói cắn, Bảo Vệ chặn', () => {
  const G = rigged(['werewolf', 'guard', 'villager', 'villager', 'villager']);
  let t = toStep(G, 'guard');
  assert.ok(WW.act(G, 1, { t: 2 }, t));
  t = run(G, t, 400, g => g.step === 'wolves');
  assert.ok(!WW.act(G, 0, { t: 0 }, t), 'Sói không cắn Sói');
  assert.ok(WW.act(G, 0, { t: 2 }, t));
  t = toPhase(G, 'morning', t);
  assert.ok(G.players[2].alive);
  assert.equal(G.morning.deaths.length, 0);
});
test('Bảo Vệ không canh một người hai đêm liền', () => {
  const G = rigged(['werewolf', 'guard', 'villager', 'villager', 'villager', 'villager', 'werewolf'], { guardRepeat: false });
  let t = toStep(G, 'guard');
  WW.act(G, 1, { t: 2 }, t);
  t = run(G, t, 400, g => g.step === 'wolves'); WW.act(G, 0, { t: 3 }, t); WW.act(G, 6, { t: 3 }, t);
  t = abstainDay(G, t); t = run(G, t, 2000, g => g.phase === 'night' && g.step === 'guard');
  assert.ok(!WW.options(G, 1).targets.includes(2));
});
test('Tiên Tri soi đúng phe, chỉ Tiên Tri thấy', () => {
  const G = rigged(['werewolf', 'seer', 'villager', 'villager', 'villager']);
  let t = toStep(G, 'seer');
  WW.act(G, 1, { t: 0 }, t);
  t = toPhase(G, 'morning', t);
  const e = G.log.find(x => x.k === 'seerSaw');
  assert.equal(e.p.wolf, true); assert.deepEqual(e.to, [1]);
  assert.ok(!WW.viewFor(G, 2).log.some(x => x.k === 'seerSaw'));
  assert.equal(WW.viewFor(G, 1).players[0].seen, 'wolf');
});
test('Phù Thủy cứu và độc, mỗi bình một lần', () => {
  const G = rigged(['werewolf', 'witch', 'villager', 'villager', 'villager', 'villager', 'werewolf']);
  let t = toStep(G, 'wolves');
  WW.act(G, 0, { t: 2 }, t); WW.act(G, 6, { t: 2 }, t);
  t = run(G, t, 400, g => g.step === 'witch');
  const o = WW.options(G, 1);
  assert.deepEqual(o.victims, [2]);
  assert.ok(!WW.act(G, 1, { heal: 2, poison: 3 }, t), 'không dùng hai bình một đêm');
  assert.ok(WW.act(G, 1, { heal: 2, poison: null }, t));
  t = toPhase(G, 'morning', t);
  assert.ok(G.players[2].alive);
  t = abstainDay(G, t);
  t = run(G, t, 3000, g => g.phase === 'night' && g.step === 'witch');
  const o2 = WW.options(G, 1);
  assert.deepEqual(o2.canHeal, []);
  assert.ok(WW.act(G, 1, { heal: null, poison: 0 }, t));
  t = toPhase(G, 'morning', t);
  assert.ok(!G.players[0].alive);
});
test('Thợ Săn chết thì bắn', () => {
  const G = rigged(['werewolf', 'hunter', 'villager', 'villager', 'villager', 'villager', 'werewolf']);
  let t = toStep(G, 'wolves');
  WW.act(G, 0, { t: 1 }, t); WW.act(G, 6, { t: 1 }, t);
  t = toPhase(G, 'hunter', t);
  assert.deepEqual(G.actors, [1]);
  WW.act(G, 1, { t: 0 }, t);
  t = run(G, t, 400, g => g.phase === 'day');
  assert.ok(!G.players[0].alive);
});
test('Cặp đôi chết theo nhau', () => {
  const G = rigged(['werewolf', 'cupid', 'villager', 'villager', 'villager', 'villager', 'werewolf']);
  let t = toStep(G, 'cupid');
  assert.ok(WW.act(G, 1, { t: [2, 3] }, t));
  t = run(G, t, 400, g => g.step === 'wolves');
  assert.equal(G.players[2].lover, 3);
  assert.ok(WW.viewFor(G, 2).players[3].role === 'villager');
  WW.act(G, 0, { t: 2 }, t); WW.act(G, 6, { t: 2 }, t);
  t = toPhase(G, 'morning', t);
  assert.ok(!G.players[2].alive && !G.players[3].alive);
});
test('Già Làng chịu được một lần Sói cắn', () => {
  const G = rigged(['werewolf', 'elder', 'villager', 'villager', 'villager']);
  let t = toStep(G, 'wolves');
  WW.act(G, 0, { t: 1 }, t);
  t = toPhase(G, 'morning', t);
  assert.ok(G.players[1].alive);
  t = run(G, t, 3000, g => g.phase === 'night' && g.step === 'wolves');
  if (G.players[1].alive && G.phase !== 'over') { WW.act(G, 0, { t: 1 }, t); t = toPhase(G, 'morning', t); assert.ok(!G.players[1].alive); }
});
test('Già Làng bị treo cổ → dân mất năng lực', () => {
  const G = rigged(['werewolf', 'elder', 'seer', 'villager', 'villager', 'villager', 'werewolf']);
  let t = toStep(G, 'wolves');
  WW.act(G, 0, { t: 3 }, t); WW.act(G, 6, { t: 3 }, t);
  t = toPhase(G, 'vote', t);
  for (const p of G.players) if (p.alive && p.canVote) WW.act(G, p.id, { t: p.id === 1 ? 2 : 1 }, t);
  t = toPhase(G, 'verdict', t);
  assert.ok(!G.players[1].alive); assert.ok(G.m.powersLost);
  t = run(G, t, 2000, g => g.phase === 'night' && g.step === 'seer');
  assert.deepEqual(G.actors, []);
});
test('Trưởng Làng phiếu x2', () => {
  const G = rigged(['werewolf', 'mayor', 'villager', 'villager', 'villager', 'werewolf', 'villager']);
  let t = toStep(G, 'wolves'); WW.act(G, 0, { t: 6 }, t); WW.act(G, 5, { t: 6 }, t);
  t = toPhase(G, 'vote', t);
  WW.act(G, 1, { t: 2 }, t); WW.act(G, 3, { t: 0 }, t);
  for (const k of [0, 2, 4, 5]) WW.act(G, k, { t: -1 }, t);
  t = toPhase(G, 'verdict', t);
  assert.equal(G.verdict.tally[2], 2);
  assert.equal(G.verdict.victim, 2);
});
test('Hoà phiếu → Vật Hy Sinh chết', () => {
  const G = rigged(['werewolf', 'scapegoat', 'villager', 'villager', 'villager', 'werewolf', 'villager']);
  let t = toStep(G, 'wolves'); WW.act(G, 0, { t: 6 }, t); WW.act(G, 5, { t: 6 }, t);
  t = toPhase(G, 'vote', t);
  WW.act(G, 1, { t: 0 }, t); WW.act(G, 2, { t: 0 }, t); WW.act(G, 3, { t: 5 }, t); WW.act(G, 4, { t: 5 }, t); WW.act(G, 0, { t: -1 }, t); WW.act(G, 5, { t: -1 }, t);
  t = toPhase(G, 'verdict', t);
  assert.equal(G.verdict.how, 'scapegoat'); assert.ok(!G.players[1].alive);
});
test('Thằng Ngốc bị treo thì sống, mất quyền bỏ phiếu', () => {
  const G = rigged(['werewolf', 'idiot', 'villager', 'villager', 'villager', 'werewolf', 'villager']);
  let t = toStep(G, 'wolves'); WW.act(G, 0, { t: 6 }, t); WW.act(G, 5, { t: 6 }, t);
  t = toPhase(G, 'vote', t);
  for (const p of G.players) if (p.alive) WW.act(G, p.id, { t: p.id === 1 ? 2 : 1 }, t);
  t = toPhase(G, 'verdict', t);
  assert.ok(G.players[1].alive && G.players[1].idiot && !G.players[1].canVote);
  t = run(G, t, 3000, g => g.phase === 'vote');
  if (G.phase === 'vote') assert.equal(WW.options(G, 1), null);
});
test('Đứa Trẻ Hoang Dã hoá Sói khi hình mẫu chết', () => {
  const G = rigged(['werewolf', 'wildchild', 'villager', 'villager', 'villager', 'villager', 'villager', 'werewolf']);
  let t = toStep(G, 'wildchild'); WW.act(G, 1, { t: 2 }, t);
  t = run(G, t, 400, g => g.step === 'wolves');
  WW.act(G, 0, { t: 2 }, t); WW.act(G, 7, { t: 2 }, t);
  t = toPhase(G, 'morning', t);
  assert.ok(G.players[1].turned && WW.isWolfSide(G.players[1]));
  assert.ok(WW.viewFor(G, 1).players[0].wolf);
});
test('Sói Con chết → đêm sau cắn hai người', () => {
  const G = rigged(['werewolf', 'cub', 'villager', 'villager', 'villager', 'villager', 'villager', 'villager', 'villager']);
  let t = toStep(G, 'wolves'); WW.act(G, 0, { t: 2 }, t); WW.act(G, 1, { t: 2 }, t);
  t = toPhase(G, 'vote', t);
  for (const p of G.players) if (p.alive) WW.act(G, p.id, { t: p.id === 1 ? 3 : 1 }, t);
  t = run(G, t, 3000, g => g.phase === 'night' && g.step === 'wolves');
  assert.equal(WW.options(G, 0).need, 2);
  assert.ok(WW.act(G, 0, { t: [3, 4] }, t));
  t = toPhase(G, 'morning', t);
  assert.ok(!G.players[3].alive && !G.players[4].alive);
});
test('Hiệp Sĩ bị cắn → Sói bên trái chết đêm sau', () => {
  const G = rigged(['villager', 'werewolf', 'knight', 'villager', 'villager', 'villager', 'werewolf', 'villager']);
  let t = toStep(G, 'wolves'); WW.act(G, 1, { t: 2 }, t); WW.act(G, 6, { t: 2 }, t);
  t = toPhase(G, 'morning', t);
  assert.equal(G.m.rust, 1);
  t = run(G, t, 4000, g => g.phase === 'morning' && g.day === 2);
  assert.ok(!G.players[1].alive);
});
test('Cáo đánh hơi, không thấy Sói thì mất năng lực', () => {
  const G = rigged(['villager', 'fox', 'villager', 'villager', 'werewolf', 'villager']);
  let t = toStep(G, 'fox'); WW.act(G, 1, { t: 2 }, t);
  t = toPhase(G, 'morning', t);
  const e = G.log.find(x => x.k === 'foxSaw'); assert.equal(e.p.found, false); assert.equal(G.players[1].fox, false);
});
test('Gấu gầm gừ khi cạnh chủ có Sói', () => {
  const G = rigged(['villager', 'bear', 'werewolf', 'villager', 'villager', 'villager']);
  let t = toStep(G, 'wolves'); WW.act(G, 2, { t: 4 }, t);
  t = toPhase(G, 'morning', t);
  assert.ok(G.morning.growl);
});
test('Thiên Sứ bị treo ở lần bỏ phiếu đầu → thắng', () => {
  const G = rigged(['angel', 'werewolf', 'villager', 'villager', 'villager', 'villager']);
  for (const p of G.players) WW.act(G, p.id, { ok: 1 }, 0);
  let t = toPhase(G, 'vote', 0);
  assert.equal(G.day, 0);
  for (const p of G.players) WW.act(G, p.id, { t: p.id === 0 ? 1 : 0 }, t);
  t = run(G, t, 400);
  assert.equal(G.winner.team, 'angel');
});
test('Người Thổi Sáo mê hoặc hết → thắng', () => {
  const G = rigged(['piper', 'werewolf', 'villager', 'villager', 'villager']);
  let t = toStep(G, 'wolves'); WW.act(G, 1, { t: 2 }, t);
  t = run(G, t, 400, g => g.step === 'piper');
  WW.act(G, 0, { t: [3, 4] }, t);
  t = toPhase(G, 'vote', t);
  for (const p of G.players) if (p.alive) WW.act(G, p.id, { t: -1 }, t);
  t = run(G, t, 3000, g => g.step === 'wolves');
  WW.act(G, 1, { t: 3 }, t);
  t = run(G, t, 3000, g => g.step === 'piper');
  assert.deepEqual(WW.options(G, 0).targets, [1]);
  WW.act(G, 0, { t: [1] }, t);
  t = run(G, t, 3000);
  assert.equal(G.winner.team, 'piper');
});
test('Cô Bé nhìn trộm (không bị bắt) biết con mồi', () => {
  const G = rigged(['girl', 'werewolf', 'villager', 'villager', 'villager'], { girlRisk: 0 });
  let t = toStep(G, 'wolves'); WW.act(G, 0, { peek: true }, t); WW.act(G, 1, { t: 3 }, t);
  t = toPhase(G, 'morning', t);
  const e = G.log.find(x => x.k === 'girlSaw'); assert.deepEqual(e.p.ids, [3]); assert.deepEqual(e.to, [0]);
});
test('Cô Bé bị bắt thì bị cắn thay', () => {
  const G = rigged(['girl', 'werewolf', 'villager', 'villager', 'villager'], { girlRisk: 100 });
  let t = toStep(G, 'wolves'); WW.act(G, 0, { peek: true }, t); WW.act(G, 1, { t: 3 }, t);
  t = toPhase(G, 'morning', t);
  assert.ok(!G.players[0].alive && G.players[3].alive);
});
test('Sói Lớn cắn thêm khi chưa Sói nào chết', () => {
  const G = rigged(['bigwolf', 'werewolf', 'villager', 'villager', 'villager', 'villager', 'villager', 'villager']);
  let t = toStep(G, 'wolves'); WW.act(G, 0, { t: 2 }, t); WW.act(G, 1, { t: 2 }, t);
  t = run(G, t, 400, g => g.step === 'bigwolf');
  assert.ok(!WW.options(G, 0).targets.includes(2));
  WW.act(G, 0, { t: 3 }, t);
  t = toPhase(G, 'morning', t);
  assert.ok(!G.players[2].alive && !G.players[3].alive);
});
test('Sói Trắng: bầy thấy như Sói thường, thắng khi còn một mình', () => {
  const G = rigged(['whitewolf', 'werewolf', 'villager', 'villager', 'villager', 'villager', 'villager']);
  assert.equal(WW.viewFor(G, 1).players[0].role, 'werewolf');
  G.players.forEach(p => { if (p.id !== 0) p.alive = false; });
  assert.equal(WW.checkWin(G).team, 'white');
});
test('Lượt của vai đã chết vẫn được gọi (giấu thông tin)', () => {
  const G = rigged(['werewolf', 'seer', 'villager', 'villager', 'villager']);
  G.players[1].alive = false;
  const t = toStep(G, 'seer');
  assert.equal(G.step, 'seer'); assert.deepEqual(G.actors, []);
  assert.ok(G.deadline - t >= 4000);
});

console.log('Bảo mật');
test('chặn hành động sai: chết, sai lượt, sai mục tiêu, bỏ phiếu hai lần', () => {
  const G = rigged(['werewolf', 'seer', 'villager', 'villager', 'villager', 'villager', 'werewolf']);
  let t = toStep(G, 'wolves');
  assert.ok(!WW.act(G, 1, { t: 0 }, t), 'Tiên Tri không được cắn');
  assert.ok(!WW.act(G, 0, { t: 99 }, t), 'mục tiêu không tồn tại');
  assert.ok(!WW.act(G, 0, 'x', t));
  WW.act(G, 0, { t: 2 }, t); WW.act(G, 6, { t: 2 }, t);
  t = run(G, t, 400, g => g.step === 'seer');
  WW.act(G, 1, { t: 0 }, t);
  assert.ok(!WW.act(G, 1, { t: 3 }, t), 'không soi hai lần');
  t = toPhase(G, 'vote', t);
  assert.ok(!WW.act(G, 2, { t: 0 }, t), 'người chết không bỏ phiếu');
  assert.ok(!WW.act(G, 3, { t: 3 }, t), 'không tự bỏ phiếu cho mình');
});
test('view không chứa vai người khác / hành động đêm của người khác', () => {
  const deck = WW.presetDeck('expanded', 16);
  const G = WW.newGame({ players: players(16), deck, opts: {} }, 0);
  let t = 0;
  for (let k = 0; k < 4000 && G.phase !== 'over'; k++) {
    t += 500; WW.tick(G, t);
    if (k % 7 || G.phase === 'over') continue;
    for (const p of G.players) {
      const v = WW.viewFor(G, p.id);
      for (const q of v.players) {
        const real = G.players[q.id];
        if (q.role && q.id !== p.id && real.alive && q.role !== 'mayor' && !real.idiot)
          assert.ok((WW.isWolfSide(p) && WW.isWolfSide(real)) || p.lover === q.id, `lộ vai ${real.role} cho ${p.role}`);
      }
      assert.ok(!v.wolfVotes || WW.isWolfSide(p));
      assert.ok(v.log.every(e => !e.to || e.to.includes(p.id)));
      assert.ok(!JSON.stringify(v).includes('"acts"'));
    }
  }
});

console.log('Ván tự chơi');
test('3000 ván máy tự chơi đều kết thúc hợp lệ', () => {
  const teams = {};
  for (let k = 0; k < 3000; k++) {
    const n = 5 + (k % 16), name = ['beginner', 'classic', 'advanced', 'expanded'][k % 4];
    const opts = { mayor: k % 3 ? 'double' : 'tie', tie: k % 5 ? 'none' : 'random', witchBoth: !!(k % 2), seer: k % 7 ? 'team' : 'role', wolfWin: k % 11 ? 'parity' : 'all', reveal: !!(k % 6) };
    const G = WW.newGame({ players: players(n), deck: WW.presetDeck(name, n), opts }, 0);
    run(G, 0, 60000);
    assert.equal(G.phase, 'over', `ván ${k} (${name} ${n}) không kết thúc, kẹt ở ${G.phase}/${G.step}`);
    const w = G.winner; teams[w.team] = (teams[w.team] || 0) + 1;
    if (w.team === 'village') assert.ok(!G.players.some(p => p.alive && WW.isWolfSide(p)));
    for (const id of w.ids) assert.ok(G.players[id]);
  }
  console.log('     kết quả:', JSON.stringify(teams));
});
test('mười người thật treo máy: máy chơi thay sau khi hết giờ', () => {
  const G = WW.newGame({ players: players(10, 10), deck: WW.presetDeck('classic', 10), opts: { talk: 30 } }, 0);
  run(G, 0, 60000);
  assert.equal(G.phase, 'over');
});

console.log(`\n${passed} đạt, ${failed} lỗi`);
if (failed) process.exit(1);
