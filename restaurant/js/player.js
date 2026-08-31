// ── Người chơi: vàng, kinh nghiệm, cấp độ, ngày đã mở khoá ──
// Lưu bằng localStorage để giữ tiến trình giữa các lần chơi.

let gold = 0;
let exp = 0;
let level = 1;

export function expNeed(lv) { return 80 + (lv - 1) * 70; }

export function loadPlayer() {
  gold = parseInt(localStorage.getItem('rest_gold') || '0', 10) || 0;
  exp = parseInt(localStorage.getItem('rest_exp') || '0', 10) || 0;
  level = parseInt(localStorage.getItem('rest_level') || '1', 10) || 1;
}

function save() {
  localStorage.setItem('rest_gold', String(gold));
  localStorage.setItem('rest_exp', String(exp));
  localStorage.setItem('rest_level', String(level));
}

export function getGold() { return gold; }
export function getExp() { return exp; }
export function getLevel() { return level; }

export function addGold(n) { gold += n; save(); }

export function spendGold(n) {
  if (gold < n) return false;
  gold -= n;
  save();
  return true;
}

// cộng kinh nghiệm, trả về số cấp vừa lên
export function addExp(n) {
  exp += n;
  let ups = 0;
  while (exp >= expNeed(level)) {
    exp -= expNeed(level);
    level++;
    ups++;
  }
  save();
  return ups;
}

// xoá sạch tiến trình: về Ngày 1, hết vàng, cấp 1
export function resetPlayer() {
  gold = 0; exp = 0; level = 1;
  for (const k of ['rest_gold', 'rest_exp', 'rest_level', 'rest_day'])
    localStorage.removeItem(k);
}

export function loadDay() {
  const d = parseInt(localStorage.getItem('rest_day') || '1', 10);
  return d >= 1 ? d : 1;
}

export function saveDayUnlocked(day) {
  const saved = loadDay();
  if (day > saved) localStorage.setItem('rest_day', String(day));
}

// mỗi cấp cho thêm chút tiền boa
export function levelTipBonus() { return 1 + (level - 1) * 0.06; }
