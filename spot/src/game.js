// ── Luật chơi: chạm, tìm điểm khác, tiền vàng, gợi ý ──
import { buildLevel } from './level.js';
import { sceneSVG, markFound, markWrong, markHint } from './render.js';
import { save, persist } from './state.js';
import { coinPerDiff, coinClearBonus, coinStarBonus, starsFor, HINT_COST, HINT_SECONDS, TOTAL_LEVELS } from './config.js';
import { sfx } from './sound.js';

export const G = { level: null, found: new Set(), wrong: 0, hints: 0, replay: false, earned: 0, done: false, hintClears: [] };
let cb = {}, panes = {};

function svgPoint(svg, e) {
  const pt = svg.createSVGPoint();
  pt.x = e.clientX; pt.y = e.clientY;
  const m = svg.getScreenCTM();
  if (!m) return null;
  return pt.matrixTransform(m.inverse());
}

export function initGame(elL, elR, callbacks) {
  panes = { L: elL, R: elR };
  cb = callbacks;
  for (const side of ['L', 'R']) {
    panes[side].addEventListener('click', (e) => {
      const svg = panes[side].querySelector('svg');
      if (!svg || !G.level) return;
      const p = svgPoint(svg, e);
      if (p) onTap(side, p.x, p.y);
    });
  }
}

function saveCur() {
  if (G.done || !G.level) return;
  save.cur = { L: G.level.L, found: [...G.found], wrong: G.wrong, hints: G.hints };
  persist();
}

export function startLevel(L, resume) {
  clearHints();
  G.level = buildLevel(L);
  G.found = new Set(resume && resume.found ? resume.found.filter((i) => i < G.level.diffs.length) : []);
  G.wrong = resume ? resume.wrong || 0 : 0;
  G.hints = resume ? resume.hints || 0 : 0;
  G.replay = !!save.stars[L];
  G.earned = 0;
  G.done = false;
  panes.L.innerHTML = sceneSVG(G.level, 'L');
  panes.R.innerHTML = sceneSVG(G.level, 'R');
  for (const i of G.found) drawFound(i);
  saveCur();
  cb.onChange();
}

function drawFound(i) {
  for (const h of G.level.diffs[i].hits) {
    markFound(panes.L.querySelector('svg'), h);
    markFound(panes.R.querySelector('svg'), h);
  }
}

function onTap(side, x, y) {
  if (G.done) return;
  const diffs = G.level.diffs;
  for (let i = 0; i < diffs.length; i++) {
    if (G.found.has(i)) continue;
    for (const h of diffs[i].hits) {
      const dx = x - h.x, dy = y - h.y;
      if (dx * dx + dy * dy <= (h.r + 8) * (h.r + 8)) { hit(i); return; }
    }
  }
  G.wrong++;
  markWrong(panes[side].querySelector('svg'), x, y);
  sfx.wrong();
  cb.onWrong(panes[side]);
  saveCur();
  cb.onChange();
}

function hit(i) {
  clearHints();
  G.found.add(i);
  drawFound(i);
  const per = coinPerDiff(G.level.L, G.replay);
  save.coins += per; G.earned += per;
  sfx.found();
  cb.onCoins(per);
  saveCur();
  cb.onChange();
  if (G.found.size === G.level.diffs.length) complete();
}

function complete() {
  G.done = true;
  clearHints();
  const L = G.level.L;
  const stars = starsFor(G.hints, G.wrong);
  const bonus = coinClearBonus(L, G.replay) + coinStarBonus(stars, G.replay);
  save.coins += bonus; G.earned += bonus;
  save.stars[L] = Math.max(save.stars[L] || 0, stars);
  save.unlocked = Math.max(save.unlocked, Math.min(TOTAL_LEVELS, L + 1));
  save.cur = null;
  persist();
  sfx.win();
  cb.onChange();
  setTimeout(() => cb.onWin({ L, stars, earned: G.earned, wrong: G.wrong, hints: G.hints }), 800);
}

function clearHints() { for (const f of G.hintClears) f(); G.hintClears = []; }

// Trả về true nếu mua được gợi ý.
export function useHint() {
  if (!G.level || G.done) return false;
  if (save.coins < HINT_COST) { cb.onNoCoins(); return false; }
  const left = [];
  for (let i = 0; i < G.level.diffs.length; i++) if (!G.found.has(i)) left.push(i);
  if (!left.length) return false;
  clearHints();
  const i = left[Math.floor(Math.random() * left.length)];
  save.coins -= HINT_COST; G.hints++;
  sfx.hint();
  for (const h of G.level.diffs[i].hits) {
    G.hintClears.push(markHint(panes.L.querySelector('svg'), h, HINT_SECONDS));
    G.hintClears.push(markHint(panes.R.querySelector('svg'), h, HINT_SECONDS));
  }
  saveCur();
  cb.onChange();
  return true;
}
