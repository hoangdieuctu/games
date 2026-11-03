// ── Tiện ích giao diện dùng chung ──
import { S } from './state.js';

export const $ = (id) => document.getElementById(id);

export function refreshGems() {
  for (const id of ['g-gems', 'map-gems']) { const el = $(id); if (el) el.textContent = S.gems; }
  for (const id of ['g-hints', 'map-hints']) { const el = $(id); if (el) el.textContent = S.hints; }
}

export function bump(el) {
  if (typeof el === 'string') el = $(el);
  if (!el) return;
  el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump');
}

let toastTimer = 0;
export function toast(msg, ms = 2200) {
  const t = $('toast');
  t.textContent = msg; t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), ms);
}

export function showOverlay(id) { $(id).classList.add('show'); }
export function hideOverlay(id) { $(id).classList.remove('show'); }

export function confetti(container, n = 40) {
  container.innerHTML = '';
  const em = ['💖', '✨', '⭐', '🌸', '💜', '💎', '🎀'];
  for (let i = 0; i < n; i++) {
    const s = document.createElement('span');
    s.textContent = em[i % em.length];
    s.style.left = Math.random() * 100 + '%';
    s.style.animationDuration = (2 + Math.random() * 2) + 's';
    s.style.animationDelay = (Math.random() * 1.2) + 's';
    s.style.fontSize = (16 + Math.random() * 16) + 'px';
    container.appendChild(s);
  }
}

export function sparkle(container, n = 8, em = ['✨', '💖', '⭐']) {
  for (let i = 0; i < n; i++) {
    const s = document.createElement('span');
    s.textContent = em[i % em.length];
    s.style.left = (15 + Math.random() * 70) + '%';
    s.style.top = (15 + Math.random() * 70) + '%';
    s.style.animationDelay = (Math.random() * 0.25) + 's';
    container.appendChild(s);
    setTimeout(() => s.remove(), 1300);
  }
}
