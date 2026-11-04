// ── Lưu tiến trình trên máy (localStorage) ──
// Một bản lưu chứa nhiều hồ sơ bé. Có số phiên bản; dữ liệu hỏng/thiếu được bỏ qua an toàn.
import { ACTIVITIES, ACHIEVEMENTS, RES_LIST, STARTER_ITEMS, STARTER_RES, REGION_STARS, actById, Res, Cost } from '../data/Content.js';

const KEY = 'little-world-save';
const VERSION = 2;

export type AgeBand = 'toddler' | 'preschool' | 'explorer';
export interface IslandObj { a: string; x: number; y: number; f?: boolean; seed?: number; }
export interface HistoryRow { act: string; t: number; ms: number; level: number; mistakes: number; }
export interface Profile {
  id: string; name: string; age: AgeBand; pet: string; look: any | null; created: number;
  res: Record<Res, number>; earned: Record<Res, number>;     // đang có / tổng đã nhận
  items: Record<string, number>;                              // đồ trong túi (chưa đặt)
  island: IslandObj[] | null;                                 // null = bố cục ban đầu
  level: Record<string, number>;                              // cấp độ theo hoạt động (1–5)
  plays: Record<string, number>;
  ach: Record<string, number>;                                // id → thời điểm đạt
  counters: Record<string, number>;                           // placed, harvest, builds…
  history: HistoryRow[];
  sessions: number; playMs: number; lastSeen: number;
  seenIntro: boolean;
}
export interface Settings { sound: boolean; music: boolean; volume: number; voice: boolean; lang: 'vi'; }
interface SaveFile { v: number; current: string | null; profiles: Profile[]; settings: Settings; }

const emptyRes = (): Record<Res, number> => Object.fromEntries(RES_LIST.map((r) => [r, 0])) as Record<Res, number>;
const defaultSettings = (): Settings => ({ sound: true, music: true, volume: 0.7, voice: true, lang: 'vi' });
const startLevel = (age: AgeBand) => (age === 'toddler' ? 1 : age === 'preschool' ? 2 : 3);

function freshProfile(name: string, age: AgeBand, pet: string): Profile {
  const res = emptyRes();
  for (const [k, v] of Object.entries(STARTER_RES)) res[k as Res] = v as number;
  return {
    id: 'p' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    name: name.trim().slice(0, 16) || 'Bé', age, pet, look: null, created: Date.now(),
    res, earned: emptyRes(), items: { ...STARTER_ITEMS }, island: null,
    level: {}, plays: {}, ach: {}, counters: {}, history: [], sessions: 0, playMs: 0, lastSeen: 0, seenIntro: false,
  };
}

/** Sửa một hồ sơ đọc từ bộ nhớ: bổ sung trường thiếu, bỏ giá trị sai kiểu. */
function repairProfile(p: any): Profile | null {
  if (!p || typeof p !== 'object' || typeof p.id !== 'string') return null;
  const base = freshProfile(String(p.name || 'Bé'), ['toddler', 'preschool', 'explorer'].includes(p.age) ? p.age : 'preschool', ['fox', 'bunny', 'bear'].includes(p.pet) ? p.pet : 'fox');
  const num = (o: any) => Object.fromEntries(Object.entries(o && typeof o === 'object' ? o : {}).filter(([, v]) => typeof v === 'number' && isFinite(v as number) && (v as number) >= 0));
  const out: Profile = {
    ...base, id: p.id, created: +p.created || Date.now(),
    look: p.look && typeof p.look === 'object' ? p.look : null,
    res: { ...emptyRes(), ...num(p.res) }, earned: { ...emptyRes(), ...num(p.earned) },
    items: num(p.items), level: num(p.level), plays: num(p.plays), ach: num(p.ach), counters: num(p.counters),
    island: Array.isArray(p.island) ? p.island.filter((o: any) => o && typeof o.a === 'string' && isFinite(o.x) && isFinite(o.y)) : null,
    history: Array.isArray(p.history) ? p.history.filter((h: any) => h && typeof h.act === 'string').slice(-200) : [],
    sessions: +p.sessions || 0, playMs: +p.playMs || 0, lastSeen: +p.lastSeen || 0, seenIntro: !!p.seenIntro,
  };
  return out;
}

function load(): SaveFile {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const s = JSON.parse(raw);
      if (s && typeof s === 'object' && Array.isArray(s.profiles)) {
        const profiles = s.profiles.map(repairProfile).filter(Boolean) as Profile[];
        return {
          v: VERSION, profiles,
          current: profiles.some((p) => p.id === s.current) ? s.current : (profiles[0]?.id ?? null),
          settings: { ...defaultSettings(), ...(s.settings && typeof s.settings === 'object' ? s.settings : {}) },
        };
      }
    }
  } catch (e) { console.warn('Little World: bản lưu bị hỏng, bắt đầu mới', e); }
  // Mang diện mạo đã chỉnh ở bản Phase 1 (nếu có) sang hồ sơ đầu tiên
  return { v: VERSION, current: null, profiles: [], settings: defaultSettings() };
}

let save: SaveFile = load();
let saveTimer: any = null;
const listeners = new Set<() => void>();

function persist() {
  try { localStorage.setItem(KEY, JSON.stringify(save)); } catch (e) { /* bộ nhớ đầy / chế độ riêng tư: vẫn chơi được */ }
}

export interface FinishResult { reward: Cost; levelBefore: number; levelAfter: number; newAch: string[]; unlocked: string[]; }

export const Store = {
  get settings(): Settings { return save.settings; },
  get profiles(): Profile[] { return save.profiles; },
  get p(): Profile | null { return save.profiles.find((x) => x.id === save.current) || null; },

  /** Lưu ngay (gọi sau thay đổi quan trọng) hoặc gom lại (soon). */
  commit(soon = false) {
    if (soon) { clearTimeout(saveTimer); saveTimer = setTimeout(persist, 400); } else persist();
    for (const f of listeners) f();
  },
  onChange(f: () => void) { listeners.add(f); return () => listeners.delete(f); },

  createProfile(name: string, age: AgeBand, pet: string): Profile {
    const p = freshProfile(name, age, pet);
    if (!save.profiles.length) {
      try { const old = JSON.parse(localStorage.getItem('lw-look') || 'null'); if (old && old.variants) p.look = old; } catch (e) { /* bỏ qua */ }
    }
    save.profiles.push(p);
    save.current = p.id;
    this.commit();
    return p;
  },
  selectProfile(id: string) { if (save.profiles.some((p) => p.id === id)) { save.current = id; this.commit(); } },
  deleteProfile(id: string) {
    save.profiles = save.profiles.filter((p) => p.id !== id);
    if (save.current === id) save.current = save.profiles[0]?.id ?? null;
    this.commit();
  },
  resetProfile(id: string) {
    const i = save.profiles.findIndex((p) => p.id === id); if (i < 0) return;
    const o = save.profiles[i];
    const n = freshProfile(o.name, o.age, o.pet); n.id = o.id; n.look = o.look; n.seenIntro = true;
    save.profiles[i] = n; this.commit();
  },
  resetAll() { save = { v: VERSION, current: null, profiles: [], settings: defaultSettings() }; this.commit(); },

  startSession() { const p = this.p; if (!p) return; p.sessions++; p.lastSeen = Date.now(); this.commit(); },
  tickPlaytime(ms: number) { const p = this.p; if (!p) return; p.playMs += ms; p.lastSeen = Date.now(); this.commit(true); },

  // ───── tài nguyên ─────
  has(cost: Cost): boolean { const p = this.p; if (!p) return false; return Object.entries(cost).every(([k, v]) => p.res[k as Res] >= (v as number)); },
  pay(cost: Cost): boolean {
    const p = this.p; if (!p || !this.has(cost)) return false;
    for (const [k, v] of Object.entries(cost)) p.res[k as Res] -= v as number;
    this.commit(); return true;
  },
  give(r: Cost) {
    const p = this.p; if (!p) return;
    for (const [k, v] of Object.entries(r)) { p.res[k as Res] += v as number; p.earned[k as Res] += v as number; }
  },
  addItem(asset: string, n = 1) { const p = this.p; if (!p) return; p.items[asset] = (p.items[asset] || 0) + n; if (p.items[asset] <= 0) delete p.items[asset]; this.commit(true); },
  count(k: string, n = 1) { const p = this.p; if (!p) return; p.counters[k] = (p.counters[k] || 0) + n; },

  level(act: string): number { const p = this.p; return Math.max(1, Math.min(5, p?.level[act] || (p ? startLevel(p.age) : 1))); },
  setLevel(act: string, l: number) { const p = this.p; if (!p) return; p.level[act] = Math.max(1, Math.min(5, l)); this.commit(); },

  starsTotal(): number { return this.p?.earned.star || 0; },
  regionOpen(id: string): boolean { return this.starsTotal() >= (REGION_STARS[id] ?? 0); },

  /** Kết thúc một hoạt động: phần thưởng + điều chỉnh độ khó + huy hiệu. */
  finish(actId: string, info: { mistakes: number; ms: number; rounds: number; noAdapt?: boolean }): FinishResult {
    const p = this.p!; const act = actById(actId)!;
    const before = this.level(actId);
    const openBefore = Object.keys(REGION_STARS).filter((r) => this.regionOpen(r));
    let after = before;
    if (!info.noAdapt) {
      // Ít nhầm → lên cấp; nhầm nhiều → nhẹ hơn một chút. Không bao giờ "thua".
      if (info.mistakes <= Math.max(1, Math.floor(info.rounds / 3))) after = Math.min(5, before + 1);
      else if (info.mistakes >= info.rounds * 2 + 2) after = Math.max(1, before - 1);
    }
    p.level[actId] = after;
    const reward: Cost = { ...act.reward };
    if (!p.plays[actId]) reward.star = (reward.star || 0) + 2;   // lần đầu chơi: thêm 2 sao
    this.give(reward);
    p.plays[actId] = (p.plays[actId] || 0) + 1;
    p.history.push({ act: actId, t: Date.now(), ms: Math.round(info.ms), level: before, mistakes: info.mistakes });
    if (p.history.length > 200) p.history.splice(0, p.history.length - 200);
    if (actId === 'builder') this.count('builds');
    const newAch = this.checkAchievements();
    const unlocked = Object.keys(REGION_STARS).filter((r) => this.regionOpen(r) && !openBefore.includes(r));
    this.commit();
    return { reward, levelBefore: before, levelAfter: after, newAch, unlocked };
  },

  /** Kiểm tra & ghi huy hiệu mới. Trả về id các huy hiệu vừa đạt. */
  checkAchievements(): string[] {
    const p = this.p; if (!p) return [];
    const plays = Object.values(p.plays).reduce((a, b) => a + b, 0);
    const regionsPlayed = new Set(Object.keys(p.plays).filter((k) => p.plays[k] > 0).map((k) => actById(k)?.region));
    const animalPlays = (p.plays['animal-match'] || 0) + (p.plays['animal-habitat'] || 0);
    const c = p.counters;
    const rules: Record<string, boolean> = {
      'first-play': plays >= 1, 'plays-10': plays >= 10, 'plays-30': plays >= 30,
      'all-regions': ACTIVITIES.map((a) => a.region).every((r) => regionsPlayed.has(r)),
      'stars-50': p.earned.star >= 50,
      'first-place': (c.placed || 0) >= 1, 'place-15': (c.placed || 0) >= 15,
      'harvest-1': (c.harvest || 0) >= 1, 'harvest-5': (c.harvest || 0) >= 5,
      'animal-friend': animalPlays >= 5,
      'memory-5': (p.level['memory'] || 0) >= 5 && (p.plays['memory'] || 0) > 0,
      'math-4': (p.level['count'] || 0) >= 4 && (p.plays['count'] || 0) > 0,
      'builder-3': (c.builds || 0) >= 3,
      'eco-hero': (p.plays['sort-trash'] || 0) > 0 && (p.plays['ocean-clean'] || 0) > 0,
      'new-pet-friend': (c.petSwitch || 0) >= 1,
      'pattern-4': (p.level['pattern'] || 0) >= 4 && (p.plays['pattern'] || 0) > 0,
      'artist-3': (p.plays['coloring'] || 0) >= 3,
      'pet-care-3': (p.plays['pet-care'] || 0) >= 3,
    };
    const got: string[] = [];
    for (const a of ACHIEVEMENTS) if (rules[a.id] && !p.ach[a.id]) { p.ach[a.id] = Date.now(); got.push(a.id); }
    return got;
  },

  setIsland(objs: IslandObj[]) { const p = this.p; if (!p) return; p.island = objs; this.commit(true); },
  setLook(look: any) { const p = this.p; if (!p) return; p.look = look; this.commit(true); },
  setPet(pet: string) { const p = this.p; if (!p || p.pet === pet) return; p.pet = pet; this.count('petSwitch'); this.checkAchievements(); this.commit(); },
  setSettings(s: Partial<Settings>) { Object.assign(save.settings, s); this.commit(); },
};
