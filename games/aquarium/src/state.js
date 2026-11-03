/* ═══════════════════════ state.js — dữ liệu trò chơi, lưu/tải ═══════════════════════ */

let S = null; // trạng thái toàn cục

function tankSpec(kind, size) {
  return kind === 'main' ? TANK_KINDS.main[size] : TANK_KINDS[kind];
}

function newTank(kind, size, name) {
  const spec = tankSpec(kind, size);
  const t = {
    id: uid(), kind, size: kind === 'main' ? size : null,
    name: name || spec.name,
    substrate: kind === 'hospital' ? 'bare' : 'sand',
    bg: 'blue',
    deco: [],
    eq: { filter: kind === 'hospital' ? 1 : 0, heater: false, heatTemp: 27, air: kind !== 'main', light: 1 },
    water: { temp: 27, dirt: 8, ammonia: 4, algae: 3, o2: 90 },
    med: null,          // { type, until }
    breeding: null,     // { a, b, start, end, chance, result }
    pellets: [],        // { x, y, vy, age }
    lastFed: 0,
    lastChange: now(),
    created: now(),
  };
  if (kind === 'breed') t.deco.push({ id: uid(), type: 'moss', x: spec.W * 0.5, flip: false });
  return t;
}
const tankDims = (t) => tankSpec(t.kind, t.size);

function newFish(spId, tankId, opts = {}) {
  const sp = SPECIES[spId];
  const t = S.tanks.find((x) => x.id === tankId);
  const d = tankDims(t);
  const f = {
    id: uid(), sp: spId, name: opts.name || pick(FISH_NAMES), tankId,
    born: now(), growth: opts.growth ?? 1, sex: Math.random() < 0.5 ? 'M' : 'F',
    health: 100, hunger: rand(20, 40), stress: 8,
    disease: null,            // { id, sev, since }
    variant: sp.variants ? randInt(0, sp.variants.length - 1) : 0,
    hue: rand(-8, 8),
    x: rand(d.W * 0.2, d.W * 0.8), y: rand(d.H * 0.3, d.H * 0.7), vx: rand(-2, 2), vy: 0,
    gen: opts.gen || 0, parents: opts.parents || null,
    lastBreed: 0, movedAt: now(), overfed: 0, earned: 0,
  };
  if (sp.zone === 'bottom') f.y = d.H * 0.9;
  if (sp.zone === 'top') f.y = d.H * 0.2;
  return f;
}

function freshState() {
  const main = newTank('main', 'S', 'Hồ đầu tiên');
  main.eq.filter = 1;
  main.deco.push({ id: uid(), type: 'rock_s', x: 8, flip: false });
  main.deco.push({ id: uid(), type: 'anubias', x: 30, flip: true });
  const st = {
    v: 1, coins: 260, food: 40, meds: {}, tanks: [main], fish: [],
    current: main.id, discovered: {}, log: [], lastSave: now(), muted: true,
    stats: { born: 0, died: 0, sold: 0, earned: 0 }, seenIntro: false,
  };
  S = st;
  for (let i = 0; i < 3; i++) S.fish.push(newFish('guppy', main.id));
  for (const s of BUYABLE) S.discovered[s.id] = true;
  return st;
}

function loadState() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const st = JSON.parse(raw);
    if (!st || !st.tanks || !st.fish) return null;
    // vá thiếu trường của phiên bản cũ
    st.meds ||= {}; st.log ||= []; st.stats ||= { born: 0, died: 0, sold: 0, earned: 0 }; st.discovered ||= {};
    for (const t of st.tanks) { t.pellets ||= []; t.water.o2 ??= 90; t.eq.heatTemp ??= 27; t.deco ||= []; }
    for (const f of st.fish) { f.earned ??= 0; f.overfed ??= 0; if (!SPECIES[f.sp]) f.sp = 'guppy'; }
    st.fish = st.fish.filter((f) => st.tanks.some((t) => t.id === f.tankId));
    if (!st.tanks.some((t) => t.id === st.current)) st.current = st.tanks[0].id;
    return st;
  } catch (e) { console.warn('Không đọc được bản lưu', e); return null; }
}

function saveState() {
  if (!S) return;
  S.lastSave = now();
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } catch (e) { /* đầy bộ nhớ: bỏ qua */ }
}

function resetState() { localStorage.removeItem(SAVE_KEY); }

const curTank = () => S.tanks.find((t) => t.id === S.current) || S.tanks[0];
const tankById = (id) => S.tanks.find((t) => t.id === id);
const fishIn = (tankId) => S.fish.filter((f) => f.tankId === tankId);
const fishById = (id) => S.fish.find((f) => f.id === id);

function addLog(text, icon = '•') {
  S.log.unshift({ t: now(), text, icon });
  if (S.log.length > 60) S.log.length = 60;
}

function spend(n) {
  if (S.coins < n) return false;
  S.coins -= n; return true;
}

function fishValue(f) {
  const sp = SPECIES[f.sp];
  const base = sp.parents ? sp.price : sp.price * 0.6;
  return Math.max(1, Math.round(base * (0.4 + 0.6 * f.growth) * (0.5 + 0.5 * f.health / 100)));
}
const isAdult = (f) => f.growth >= 0.6;
const ageSec = (f) => (now() - f.born) / 1000;
