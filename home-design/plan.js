/* Mặt bằng căn hộ (đơn vị: mét). Gốc toạ độ ở góc tây-bắc, x sang đông, z xuống nam. */
(function (root) {
  const HD = root.HD = root.HD || {};

  HD.PLAN = {
    W: 9, D: 8.7, H: 2.75, T: 0.14,
    spawn: { x: 7.0, z: 0.9, yaw: Math.PI },

    /* axis 'x': tường chạy dọc trục x tại z = at; axis 'z': chạy dọc trục z tại x = at.
       open: door (đi qua được, cánh mở), entry (cửa chính, đóng), window, glass (vách kính kín từ sàn tới trần). */
    walls: [
      { id: 'n', axis: 'x', at: 0, a: 4.8, b: 9, open: [{ a: 6.55, b: 7.5, y0: 0, y1: 2.15, type: 'entry' }] },
      { id: 'n2', axis: 'x', at: 3.2, a: 0, b: 4.8, open: [
        { a: 1.45, b: 2.15, y0: 1.5, y1: 2.1, type: 'window' },
        { a: 4.3, b: 4.7, y0: 1.5, y1: 2.1, type: 'window' }] },
      { id: 'tech', axis: 'x', at: 3.0, a: 4.8, b: 6.1, thick: 0.4 },
      { id: 'bath-s', axis: 'x', at: 4.7, a: 0, b: 6.1, open: [
        { a: 2.3, b: 3.05, y0: 0, y1: 2.1, type: 'door', hinge: 'b', side: -1 },
        { a: 5.2, b: 5.95, y0: 0, y1: 2.1, type: 'door', hinge: 'b', side: -1 }] },
      { id: 'bed2-n', axis: 'x', at: 5.9, a: 3.2, b: 6.1, open: [
        { a: 5.15, b: 5.95, y0: 0, y1: 2.1, type: 'door', hinge: 'b', side: 1 }] },
      { id: 's', axis: 'x', at: 8.7, a: 0, b: 9, open: [
        { a: 0.95, b: 3.0, y0: 0, y1: 2.75, type: 'glass' },
        { a: 3.9, b: 5.95, y0: 0, y1: 2.75, type: 'glass' },
        { a: 6.17, b: 8.93, y0: 0, y1: 2.75, type: 'glass' }] },
      { id: 'w', axis: 'z', at: 0, a: 3.2, b: 8.7 },
      { id: 'logia-w', axis: 'z', at: 4.8, a: 0, b: 3.2, open: [{ a: 0.8, b: 2.2, y0: 1.0, y1: 2.2, type: 'window' }] },
      { id: 'logia-e', axis: 'z', at: 6.1, a: 0, b: 4.7, open: [
        { a: 1.85, b: 2.6, y0: 0, y1: 2.1, type: 'door', hinge: 'b', side: -1 }] },
      { id: 'bl-n', axis: 'z', at: 6.1, a: 5.9, b: 7.2 },
      { id: 'bl-s', axis: 'z', at: 6.1, a: 7.2, b: 8.7 },
      { id: 'e', axis: 'z', at: 9, a: 0, b: 8.7 },
      { id: 'bath-mid', axis: 'z', at: 3.2, a: 3.2, b: 4.7 },
      { id: 'mb-b2', axis: 'z', at: 3.2, a: 5.9, b: 8.7 },
      { id: 'mb-hall', axis: 'z', at: 4.1, a: 4.7, b: 5.9, open: [
        { a: 4.9, b: 5.7, y0: 0, y1: 2.1, type: 'door', hinge: 'a', side: -1 }] }
    ],

    /* rects: [x0, z0, x1, z1]; floor: nhóm vật liệu sàn; light: vị trí đèn trần */
    rooms: [
      { id: 'kitchen', name: 'Bếp', floor: 'living', rects: [[6.1, 0, 9, 3.2]] },
      { id: 'dining', name: 'Bàn ăn', floor: 'living', rects: [[6.1, 3.2, 9, 5.9]] },
      { id: 'living', name: 'Phòng khách', floor: 'living', rects: [[6.1, 5.9, 9, 8.7]] },
      { id: 'hall', name: 'Hành lang', floor: 'living', rects: [[4.1, 4.7, 6.1, 5.9]] },
      { id: 'logia', name: 'Lô gia giặt phơi', floor: 'logia', rects: [[4.8, 0, 6.1, 3.2]] },
      { id: 'bath1', name: 'WC phòng ngủ chính', floor: 'bath', rects: [[0, 3.2, 3.2, 4.7]] },
      { id: 'bath2', name: 'WC chung', floor: 'bath', rects: [[3.2, 3.2, 6.1, 4.7]] },
      { id: 'master', name: 'Phòng ngủ chính', floor: 'bed', rects: [[0, 4.7, 4.1, 5.9], [0, 5.9, 3.2, 8.7]] },
      { id: 'bed2', name: 'Phòng ngủ 2', floor: 'bed', rects: [[3.2, 5.9, 6.1, 8.7]] }
    ],

    lights: [[7.55, 1.6], [7.55, 4.5], [7.55, 7.2], [5.1, 5.3], [5.45, 1.4], [1.9, 4.05], [4.9, 4.05], [1.6, 7.2], [2.9, 5.3], [4.65, 7.4]],
    /* Công tắc trên tường: (x, z) là điểm trên mặt tường, r là hướng mặt công tắc (như đồ đạc),
       lights: thứ tự các đèn trần nó điều khiển, fan: quạt trần của phòng (nếu thiết kế có gắn) */
    switches: [
      { x: 7.75, z: 0.07, r: 0, lights: [0] },
      { x: 6.17, z: 3.6, r: 1, lights: [1] },
      { x: 6.17, z: 6.25, r: 1, lights: [2], fan: 'living' },
      { x: 4.5, z: 5.83, r: 2, lights: [3] },
      { x: 6.03, z: 2.85, r: 3, lights: [4] },
      { x: 2.1, z: 4.63, r: 2, lights: [5] },
      { x: 5.0, z: 4.63, r: 2, lights: [6] },
      { x: 3.7, z: 4.77, r: 0, lights: [7, 8], fan: 'master' },
      { x: 4.95, z: 5.83, r: 2, lights: [9], fan: 'bed2' }
    ],
    fanAt: { living: [7.55, 7.2], master: [1.6, 7.2], bed2: [4.65, 7.4] }
  };

  HD.roomAt = function (x, z) {
    for (const r of HD.PLAN.rooms) {
      for (const q of r.rects) if (x >= q[0] && x <= q[2] && z >= q[1] && z <= q[3]) return r;
    }
    return null;
  };
})(typeof window !== 'undefined' ? window : globalThis);
