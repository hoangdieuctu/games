// ── Chơi online: hình sao qua PeerJS. Chủ phòng giữ thế giới, khách gửi input/hành động. ──
import { ROOM_PREFIX, PEERJS_URL } from './config.js';

export const net = fresh();
function fresh() { return { on: false, host: false, code: null, peer: null, conn: null, conns: new Map(), timer: 0, left: false, gen: 0 }; }
export function randCode(n = 6) { return Array.from(crypto.getRandomValues(new Uint8Array(n)), b => 'abcdefghijkmnpqrstuvwxyz23456789'[b % 32]).join(''); }

function loadPeerJs() {
  if (window.Peer) return Promise.resolve();
  return new Promise((ok, bad) => {
    const s = document.createElement('script');
    s.src = PEERJS_URL; s.onload = ok; s.onerror = () => { s.remove(); bad(new Error('peerjs')); };
    document.head.appendChild(s);
  });
}
export const inviteUrl = () => location.href.split('#')[0] + '#room=' + net.code;
export function send(c, msg) { if (c && c.open) try { c.send(msg); } catch (e) {} }
export function broadcast(msg) { for (const c of net.conns.keys()) send(c, msg); }
export function guestSend(msg) { send(net.conn, msg); }

export function closeNet() {
  clearTimeout(net.timer);
  const bye = { t: 'bye' };
  if (net.conn) { send(net.conn, bye); try { net.conn.close(); } catch (e) {} }
  for (const c of net.conns.keys()) { try { c.send(bye); c.close(); } catch (e) {} }
  if (net.peer) try { net.peer.destroy(); } catch (e) {}
  Object.assign(net, fresh(), { gen: net.gen + 1 });
}
function start(host, code) {
  closeNet();
  Object.assign(net, { on: true, host, code });
  return net.gen;
}

// Chủ phòng. H = { onOpen(), onFail(title, msg, retry), onConn(c), onData(c, d), onLost(c) }
export async function hostOnline(code, H, tries = 0) {
  const g = start(true, code);
  try { await loadPeerJs(); } catch (e) {
    if (net.gen === g) H.onFail('Không tải được', 'Không tải được phần chơi online. Bạn vẫn chơi một mình được; kiểm tra mạng rồi bấm Mời lại nhé.', () => hostOnline(code, H));
    return;
  }
  if (net.gen !== g) return;
  const peer = net.peer = new Peer(ROOM_PREFIX + code, { debug: 0 });
  let opened = false;
  peer.on('open', () => { if (net.gen === g) { opened = true; H.onOpen(); } });
  peer.on('connection', c => {
    if (net.gen !== g) return c.close();
    c.on('open', () => { if (net.gen === g) H.onConn(c); });
    c.on('data', d => { if (net.gen === g) H.onData(c, d); });
    const lost = () => { if (net.gen === g) H.onLost(c); };
    c.on('close', lost); c.on('error', lost);
  });
  peer.on('disconnected', () => { setTimeout(() => { if (net.gen === g && !peer.destroyed && peer.disconnected) peer.reconnect(); }, 1500); });
  peer.on('error', err => {
    if (net.gen !== g || opened) return;
    if (err.type === 'unavailable-id') {
      if (tries < 2) return hostOnline(code, H, tries + 1);
      return H.onFail('Phòng đang mở ở nơi khác', 'Mã thế giới này đang được một máy khác làm chủ phòng. Đóng bên đó rồi thử lại, hoặc mở link mời để vào với tư cách khách.', () => hostOnline(code, H));
    }
    H.onFail('Không tạo được phòng', err.type === 'browser-incompatible'
      ? 'Trình duyệt này không hỗ trợ chơi online. Thử Chrome, Safari hoặc Firefox bản mới nhé.'
      : 'Không kết nối được máy chủ tìm bạn. Bạn vẫn chơi một mình được; kiểm tra mạng rồi bấm Mời lại.', () => hostOnline(code, H));
  });
}

// Khách. H = { onOpen(c), onData(d), onLost(hostLeft), onFail(title, msg, retry) }
export async function joinOnline(code, H) {
  const g = start(false, code);
  const retry = () => joinOnline(code, H);
  try { await loadPeerJs(); } catch (e) {
    if (net.gen === g) H.onFail('Không tải được', 'Không tải được phần chơi online. Kiểm tra mạng rồi thử lại nhé.', retry);
    return;
  }
  if (net.gen !== g) return;
  const peer = net.peer = new Peer({ debug: 0 });
  net.timer = setTimeout(() => {
    if (net.gen === g && !net.conn) H.onFail('Không nối được', 'Không nối được với máy chủ phòng. Có thể mạng một trong hai bên chặn kết nối trực tiếp — thử đổi wifi hoặc 4G nhé.', retry);
  }, 20000);
  peer.on('open', () => {
    if (net.gen !== g) return;
    const c = peer.connect(ROOM_PREFIX + code, { reliable: true });
    c.on('open', () => {
      if (net.gen !== g) return c.close();
      clearTimeout(net.timer); net.conn = c; H.onOpen(c);
    });
    c.on('data', d => { if (net.gen === g && net.conn === c) H.onData(d); });
    const lost = () => {
      if (net.gen !== g || net.conn !== c) return;
      net.conn = null; H.onLost(net.left);
    };
    c.on('close', lost); c.on('error', lost);
  });
  peer.on('error', err => {
    if (net.gen !== g || net.conn) return;
    clearTimeout(net.timer);
    if (err.type === 'peer-unavailable') H.onFail('Không tìm thấy phòng', 'Chủ phòng chưa mở thế giới này. Nhờ bạn ấy mở game rồi bấm Thử lại nhé.', retry);
    else H.onFail('Không vào được phòng', 'Không kết nối được máy chủ tìm bạn. Kiểm tra mạng rồi thử lại nhé.', retry);
  });
}
