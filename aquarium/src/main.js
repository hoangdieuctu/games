/* ═══════════════════════ main.js — khởi động, vòng lặp ═══════════════════════ */

const cv = document.getElementById('cv');
const ctx = cv.getContext('2d');
let VW = 0, VH = 0, DPR = 1, lastFrame = 0, hudTimer = 0, saveTimer = 0, liveTimer = 0;

function viewRect() {
  const hud = document.getElementById('hud').getBoundingClientRect().bottom + 6;
  const bar = VH - document.getElementById('bar').getBoundingClientRect().top + 6;
  const panel = document.getElementById('panel');
  const wide = VW > 640 && !panel.hidden;
  return { x: 0, y: hud, w: wide ? VW - panel.getBoundingClientRect().width : VW, h: VH - hud - bar };
}
function resize() {
  DPR = Math.min(2, window.devicePixelRatio || 1);
  VW = window.innerWidth; VH = window.innerHeight;
  cv.width = Math.round(VW * DPR); cv.height = Math.round(VH * DPR);
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  onLayoutChange();
}
function onLayoutChange() { if (!S) return; R.layout = computeLayout(curTank(), viewRect()); }

function frame(ts) {
  requestAnimationFrame(frame);
  if (!lastFrame) lastFrame = ts;
  let dt = (ts - lastFrame) / 1000; lastFrame = ts;
  if (dt > 2) { // tab bị ẩn: bù thô
    let left = dt; while (left > 0) { const step = Math.min(60, left); simulate(step, left > 3600); left -= step; }
    dt = 0.016; flushEvents();
  }
  dt = Math.min(dt, 0.1);
  simulate(dt);
  const t = curTank();
  updateMovement(t, dt, R.time);
  if (!R.layout) onLayoutChange();
  renderFrame(ctx, VW, VH, t, dt);
  hudTimer += dt; saveTimer += dt; liveTimer += dt;
  if (hudTimer > 0.5) { hudTimer = 0; refreshHUD(); flushEvents(); }
  if (liveTimer > 2.5) { liveTimer = 0; if (UI.panel === 'fish' || UI.panel === 'breed' || (UI.panel === 'design' && UI.designTab === 'warn') || UI.panel === 'fishlist') { if (!document.activeElement || document.activeElement.tagName !== 'INPUT') renderPanel(); } }
  if (saveTimer > 8) { saveTimer = 0; saveState(); }
}

function intro() {
  modal(`<h2>🐠 Hồ Cá Thư Giãn</h2>
  <p>Chào mừng! Bạn có một hồ 40 lít với 3 chú cá bảy màu và 260 xu.</p>
  <p>Trò chơi chạy theo <b>thời gian thực</b>: cho cá ăn vài lần mỗi ngày, dọn hồ, thay nước, và ngắm chúng bơi. Chạm vào cá để xem sức khoẻ.</p>
  <p>Thiết kế hồ đẹp và <b>đúng cách</b> (lọc, cây, đủ đàn, đúng nhiệt độ) để cá khoẻ, rồi ghép đôi trong hồ ép đẻ để tạo ra những loài lai hiếm có.</p>`,
    [{ label: 'Bắt đầu thư giãn 🌿', cls: 'gold', fn: () => { S.seenIntro = true; saveState(); } }]);
}

function boot() {
  S = loadState() || freshState();
  const cu = S.lastSave ? catchUp() : 0;
  bindUI(); bindCanvas(cv);
  window.addEventListener('resize', resize); resize();
  document.addEventListener('visibilitychange', () => { if (document.hidden) saveState(); else lastFrame = 0; });
  window.addEventListener('pagehide', saveState);
  refreshHUD();
  requestAnimationFrame(frame);
  if (!S.seenIntro) intro();
  else if (cu && cu.gap > 60) {
    const died = EVENTS.filter((e) => e.type === 'death').length, born = EVENTS.filter((e) => e.type === 'breed' || e.type === 'discover').length;
    modal(`<h2>👋 Chào mừng trở lại</h2><p>Bạn đã đi ${fmtDur(cu.gap)}. Trong lúc đó:</p><ul class="list"><li>Cá khoẻ kiếm được <b style="color:var(--gold)">${fmtCoins(cu.earned)} xu</b></li>${born ? `<li>🐣 ${born} lứa cá nở</li>` : ''}${died ? `<li style="color:var(--bad)">🕊️ ${died} cá đã chết</li>` : ''}<li>Kiểm tra độ đói và nước nhé!</li></ul>`, [{ label: 'Xem hồ', cls: 'gold' }]);
    EVENTS.length = 0;
  }
}
// móc gỡ lỗi (dùng trong console): __hoca.add('dragon'), __hoca.discoverAll()
window.__hoca = { get S() { return S; }, SPECIES, add(id, n = 1) { const out = []; for (let i = 0; i < n; i++) { const f = newFish(id, S.current); S.fish.push(f); out.push(f); } return out; }, discoverAll() { for (const k in SPECIES) S.discovered[k] = true; }, coins(n) { S.coins += n; }, save: saveState, catchUp };
try { boot(); } catch (err) {
  document.body.insertAdjacentHTML('beforeend', `<div style="position:fixed;inset:0;background:#0d141d;color:#fff;padding:30px;font:14px monospace;z-index:99;overflow:auto"><h2>Không khởi động được</h2><pre>${String(err && err.stack || err).replace(/</g, '&lt;')}</pre><button onclick="localStorage.removeItem('${SAVE_KEY}');location.reload()" style="padding:10px 16px;margin-top:12px">Xoá bản lưu và thử lại</button></div>`);
  console.error(err);
}
