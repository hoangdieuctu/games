// ── State dùng chung giữa các module (một đối tượng, không framework) ──
export const S = {
  W: null,          // thế giới (host: authoritative; khách: bản sao)
  players: {},      // pid → player (host: object thật; khách: bản sao + nội suy)
  me: null,         // pid của mình
  host: false,
  G: null,          // game host (createGame) hoặc null trên khách
  code: null,
  placing: null,    // {kind, tx, ty, ok} khi đang chọn chỗ đặt nền
  target: null,     // hành động ngữ cảnh hiện tại {label, msg, x, y}
  fx: [],           // chữ bay
  bubbles: {},      // pid → {text, until}
  shake: {},        // nodeId → until
  now: 0,
};
export const $ = id => document.getElementById(id);
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
