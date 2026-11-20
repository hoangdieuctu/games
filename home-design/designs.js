/* Các phương án nội thất cho cùng một mặt bằng.
   Mỗi món đồ: [loại, x, z, r, tuỳ chọn] — (x, z) là tâm, r là số lần xoay 90° (0: mặt trước quay về nam,
   1: đông, 2: bắc, 3: tây). Đồ treo tường thì (x, z) là điểm trên mặt tường. */
(function (root) {
  const HD = root.HD = root.HD || {};

  /* Kích thước mặc định [rộng, sâu] */
  HD.SIZES = {
    bed: [1.6, 2.05], crib: [1.2, 0.65], floorbed: [1.0, 1.9], daybed: [2.0, 0.9], wardrobe: [1.8, 0.6],
    sofa: [2.0, 0.85], sofaL: [2.3, 1.5], bench: [1.9, 0.65], armchair: [0.75, 0.75], pouf: [0.45, 0.45],
    ctable: [0.56, 0.56], teatable: [0.9, 0.5], tvunit: [2.0, 0.35], table: [1.4, 0.8], chair: [0.42, 0.42],
    stool: [0.36, 0.36], highchair: [0.5, 0.5], banq: [1.8, 0.45], counter: [1.6, 0.6], fridge: [0.7, 0.7],
    cabinet: [1.2, 0.35], shelf: [0.9, 0.3], lowshelf: [1.0, 0.3], desk: [1.2, 0.55], ochair: [0.5, 0.5],
    plant: [0.35, 0.35], planter: [1.0, 0.3], tent: [1.0, 1.0], toybox: [0.6, 0.4], lamp: [0.3, 0.3],
    nightstand: [0.42, 0.4], changer: [0.9, 0.5], washer: [0.6, 0.6], toilet: [0.4, 0.65], vanity: [0.9, 0.45],
    glass: [0.72, 0.04], rug: [1.6, 2.2], playmat: [1.5, 1.5], shower: [0.93, 1.36], dryrack: [1.2, 0.5],
    art: [0.9, 0.6], panel: [1, 0.02], mirror: [0.7, 0.02], wallaltar: [0.8, 0.45], pendant: [0.4, 0.4], mam: [0.8, 0.8]
  };
  /* Đồ không cản đường đi */
  HD.NOBLOCK = { rug: 1, playmat: 1, shower: 1, dryrack: 1, art: 1, panel: 1, mirror: 1, wallaltar: 1, pendant: 1, mam: 1 };
  /* Đồ gắn trần (ẩn khi nhìn từ trên cao) */
  HD.CEIL = { dryrack: 1, pendant: 1 };

  function rot(x, z, r) {
    r = ((r % 4) + 4) % 4;
    return r === 1 ? [z, -x] : r === 2 ? [-x, -z] : r === 3 ? [-z, x] : [x, z];
  }
  HD.sizeOf = function (it) {
    const o = it[4] || {}, s = HD.SIZES[it[0]];
    return [o.w || s[0], o.d || s[1]];
  };
  /* Vùng chiếm chỗ trên sàn (các hình chữ nhật theo trục) của một món đồ */
  HD.footprints = function (it) {
    const kind = it[0], x = it[1], z = it[2], r = it[3] || 0, o = it[4] || {};
    if (HD.NOBLOCK[kind]) return [];
    const [w, d] = HD.sizeOf(it);
    const rect = (cx, cz, rw, rd) => {
      const [wx, wz] = rot(cx, cz, r);
      const ww = r % 2 ? rd : rw, dd = r % 2 ? rw : rd;
      return { x0: x + wx - ww / 2, x1: x + wx + ww / 2, z0: z + wz - dd / 2, z1: z + wz + dd / 2 };
    };
    if (kind === 'sofaL') {
      const sgn = o.side === 'R' ? 1 : -1;
      return [rect(0, -d / 2 + 0.425, w, 0.85), rect(sgn * (w / 2 - 0.45), 0, 0.9, d)];
    }
    return [rect(0, 0, w, d)];
  };

  /* ───── Cụm đồ dùng chung ───── */
  const baths = p => [
    ['shower', 0.535, 3.95, 0, { c: p.bath1 }], ['glass', 1.0, 3.63, 1], ['toilet', 1.6, 3.6, 0],
    ['vanity', 2.6, 3.5, 0, { w: 0.9 }], ['mirror', 2.6, 3.275, 0, { w: 0.7, h: 0.8, y: 1.5 }],
    ['shower', 3.735, 3.95, 0, { c: p.bath2 }], ['glass', 4.2, 3.63, 1], ['toilet', 4.6, 3.6, 0],
    ['vanity', 5.55, 3.5, 0, { w: 0.85 }], ['mirror', 5.55, 3.275, 0, { w: 0.65, h: 0.8, y: 1.5 }]
  ];
  const logia = () => [
    ['washer', 5.6, 0.42, 0], ['cabinet', 5.08, 0.42, 0, { w: 0.4, d: 0.6, h: 0.85 }],
    ['dryrack', 5.45, 1.5, 1], ['plant', 5.08, 2.5, 0, { kind: 'bush', h: 0.7 }]
  ];
  const shoe = () => [['cabinet', 6.335, 0.95, 1, { w: 1.4, d: 0.33, h: 1.0, vase: 1 }]];
  const kPen = (stools) => [
    ['fridge', 8.58, 0.45, 3],
    ['counter', 8.63, 1.625, 3, { w: 1.65, stove: 1, upper: 1 }],
    ['counter', 8.065, 2.775, 2, { w: 1.73, d: 0.65, sink: 1, island: 1 }]
  ].concat(stools ? [['stool', 7.65, 3.32, 2], ['stool', 8.4, 3.32, 2]] : []);
  const kGalley = () => [
    ['fridge', 8.58, 0.45, 3],
    ['counter', 8.63, 2.05, 3, { w: 2.5, stove: 1, sink: 1, upper: 1 }]
  ];
  /* Bàn chữ nhật áp tường đông, ghế hai phía bắc – nam, ghế ăn dặm đầu bàn */
  const dWall = (n, o) => {
    const w = n === 4 ? 1.4 : 1.2, cx = 8.93 - w / 2 - 0.03, xs = n === 4 ? [cx - 0.35, cx + 0.35] : [cx];
    const a = [['table', cx, 4.4, 0, { w, d: 0.8 }], ['highchair', cx - w / 2 - 0.28, 4.4, 1],
      ['pendant', cx, 4.4, 0, { kind: (o && o.pendant) || 'dome' }]];
    xs.forEach(x => a.push(['chair', x, 3.78, 0, o], ['chair', x, 5.03, 2, o]));
    return a;
  };
  /* Bàn tròn 2 ghế + ghế ăn dặm */
  const dRound = (z, o) => [
    ['table', 8.05, z, 0, { w: 1.0, d: 1.0, round: 1, c: o && o.top }],
    ['chair', 8.05, z - 0.76, 0, o], ['chair', 8.05, z + 0.76, 2, o], ['highchair', 7.26, z, 1],
    ['pendant', 8.05, z, 0, { kind: (o && o.pendant) || 'dome' }]
  ];
  /* Ghế băng sát tường + bàn dài */
  const dBanq = () => [
    ['banq', 8.7, 4.5, 3, { w: 1.8 }], ['table', 8.05, 4.5, 1, { w: 1.4, d: 0.75 }],
    ['chair', 7.42, 4.15, 1], ['chair', 7.42, 4.85, 1], ['highchair', 8.0, 3.5, 0],
    ['pendant', 8.05, 4.5, 0, { kind: 'lantern' }]
  ];
  /* Phòng ngủ chính A: giường kê đầu tường tây, tủ thay tã ở chân giường */
  const masterA = (o) => [
    ['wardrobe', 1.13, 5.075, 0, { w: 2.1 }],
    ['bed', 1.1, 7.0, 1, Object.assign({ w: 1.6 }, o)],
    ['nightstand', 0.29, 5.98, 0], ['nightstand', 0.29, 8.02, 0],
    ['rug', 1.75, 7.0, 0, { w: 2.5, d: 2.3, pat: 'plain' }]
  ];
  const changerA = () => [['changer', 2.88, 6.9, 3]];
  /* Phòng ngủ chính B: giường kê đầu về cửa sổ */
  const masterB = (o) => [
    ['wardrobe', 1.13, 5.075, 0, { w: 2.1 }],
    ['bed', 1.6, 7.6, 2, Object.assign({ w: 1.6 }, o)],
    ['nightstand', 2.64, 8.4, 2]
  ];

  const BASE = {
    wall: '#f3eee4', ceil: '#fbfaf7', trim: '#ebe5d9', door: '#d2b48a',
    wood: '#c8a67a', wood2: '#9b7a55', fabric: '#d9cfbf', accent: '#8fa58a', accent2: '#c98b62',
    cab: '#f4f1eb', top: '#e7e2d9', splash: '#e9e4da', steel: '#c9ccd0', curtain: '#f1ece2', blind: false,
    bedding: '#9a9082', bath1: '#d57a4e', bath2: '#5f9a6a',
    floor: { living: ['tile', '#e7dfd2', '#cfc4b3'], bed: ['wood', '#c9a878'], bath: ['tile', '#e2ddd4', '#c9c2b6'], logia: ['tile', '#d5cdbf', '#bdb4a4'] }
  };

  const DEFS = [
    {
      name: 'Nhà Trống', style: 'Lúc nhận nhà',
      desc: 'Căn hộ như lúc mới nhận: chưa có món nội thất nào, chưa treo rèm, nhà vệ sinh cũng chưa lắp thiết bị. Đi một vòng để cảm nhận kích thước thật của từng phòng trước khi xem các phương án bên dưới.',
      points: ['Thấy rõ phòng nào rộng, phòng nào hẹp khi chưa có đồ che.',
        'Dễ hình dung nắng từ cửa hướng nam chiếu sâu tới đâu.',
        'Dùng làm mốc so sánh: chuyển sang thiết kế khác để xem cùng chỗ đứng đó thay đổi thế nào.'],
      bed2: 'Phòng ngủ 2', bare: true, pal: { nocurtain: true },
      items: () => []
    },
    {
      name: 'Tối Giản Ấm', style: 'Tối giản',
      desc: 'Bản gần với nhà mẫu nhất: tường trắng ngà, gỗ sồi sáng, đồ đạc vừa đủ. Bé ngủ chung giường với bố mẹ, phòng ngủ 2 làm phòng chơi và để dành cho bé khi lớn.',
      points: ['Phòng bố mẹ không kê cũi: bé ngủ chung giường, đêm dậy cho bú không phải ra khỏi phòng.',
        'Tủ thay tã ở chân giường, đứng thay không phải cúi.',
        'Ghế ăn dặm đặt đầu bàn, phía lối đi nên dễ bế bé ra vào.',
        'Phòng ngủ 2 đã có sẵn giường đơn và thảm chơi, sau này bé ra riêng không phải mua lại.'],
      bed2: 'Phòng chơi của bé', pal: {},
      items: p => [].concat(shoe(), kPen(), dWall(4), [
        ['art', 8.925, 4.4, 3, { w: 0.8, h: 0.55, y: 1.55, kind: 'hills' }],
        ['sofa', 6.6, 7.2, 1], ['rug', 7.75, 7.2, 0, { w: 1.5, d: 2.3, pat: 'border' }], ['ctable', 7.8, 7.2, 0],
        ['tvunit', 8.755, 7.1, 3], ['plant', 8.72, 8.42, 0, { kind: 'palm', h: 1.3 }], ['lamp', 6.42, 8.44, 0],
        ['art', 6.175, 7.2, 1, { w: 1.2, h: 0.6, y: 1.5, kind: 'lines' }],
        ['art', 4.6, 5.825, 2, { w: 0.5, h: 0.7, y: 1.45, kind: 'sun' }]
      ], masterA(), changerA(), [
        ['art', 0.075, 7.0, 1, { w: 1.0, h: 0.5, y: 1.55, kind: 'hills' }],
        ['wardrobe', 4.08, 6.275, 0, { w: 1.6 }], ['bed', 3.78, 7.6, 2, { w: 1.0, d: 2.0, blanket: p.accent }],
        ['playmat', 5.15, 7.45, 0, { w: 1.5, d: 1.5 }], ['lowshelf', 5.15, 8.47, 2, { w: 1.4 }]
      ])
    },
    {
      name: 'Japandi Việt', style: 'Tối giản',
      desc: 'Nhật – Bắc Âu pha chất Việt: giường thấp, chiếu cói, mành tre, đèn mây. Bếp chạy một hàng thẳng để nhường chỗ cho góc ăn có ghế băng.',
      points: ['Giường bố mẹ và giường của bé đều thấp sát sàn, bé có lăn xuống cũng không đau.',
        'Phòng bố mẹ chỉ có giường, tủ áo và một tủ đầu giường — thoáng, dễ dọn.',
        'Ghế băng sát tường: bé ngồi không ngã ngửa, bên dưới là chỗ cất đồ.',
        'Chiếu cói trải sàn phòng khách — mát, dễ lau khi bé làm đổ.'],
      bed2: 'Phòng của bé',
      pal: { wall: '#efe8db', wood: '#b78f62', wood2: '#3a3530', fabric: '#cdbfa7', accent: '#b5694a', accent2: '#6f7d5c',
        cab: '#b78f62', top: '#f1ede6', splash: '#efe9dd', door: '#b78f62', bedding: '#b9ad98', blind: true,
        bath1: '#6f7d5c', bath2: '#b5694a',
        floor: { living: ['wood', '#cdb08a'], bed: ['wood', '#cdb08a'], bath: ['concrete', '#cfc9bf'], logia: ['concrete', '#bdb7ad'] } },
      fans: ['master'],
      items: p => [].concat(shoe(), kGalley(), dBanq(), [
        ['sofa', 6.6, 7.2, 1, { low: 1 }], ['rug', 7.75, 7.2, 0, { w: 1.5, d: 2.3, pat: 'chieu' }],
        ['ctable', 7.8, 7.2, 0, { c: p.wood }], ['tvunit', 8.755, 7.1, 3],
        ['plant', 8.72, 8.42, 0, { kind: 'palm', h: 1.4 }], ['lamp', 6.42, 8.44, 0],
        ['art', 6.175, 7.2, 1, { w: 0.6, h: 0.8, y: 1.5, kind: 'sun' }],
        ['panel', 8.925, 4.5, 3, { w: 1.8, h: 1.1, y0: 0.9, kind: 'rattan' }]
      ], masterB({ low: 1, head: 'wood' }), [
        ['rug', 1.6, 5.95, 0, { w: 2.2, d: 0.9, pat: 'chieu' }],
        ['wardrobe', 3.98, 6.275, 0, { w: 1.4 }], ['floorbed', 3.8, 7.65, 2],
        ['lowshelf', 5.2, 8.47, 2, { w: 1.2 }], ['rug', 5.0, 7.4, 0, { w: 1.5, d: 1.5, round: 1, c: p.accent2 }],
        ['pouf', 5.72, 7.9, 0]
      ])
    },
    {
      name: 'Hiện Đại Xám Trắng', style: 'Hiện đại',
      desc: 'Gam xám – trắng – đen, điểm vàng mù tạt. Bàn đảo có ghế quầy, sofa góc chữ L, vách lam gỗ sau tivi. Bé có phòng riêng ngay từ đầu.',
      points: ['Phòng ngủ 2 là phòng em bé đầy đủ: cũi, tủ thay tã, ghế bành cho mẹ ngồi cho bú.',
        'Phòng bố mẹ không kê cũi nên rộng, thêm được tủ ngăn kéo và gương.',
        'Hai ghế quầy ở bàn đảo: ăn sáng nhanh, người nấu vẫn nhìn thấy bé ngồi ghế ăn dặm.',
        'Sofa chữ L đủ chỗ cả nhà nằm đọc sách.'],
      bed2: 'Phòng em bé',
      pal: { wall: '#eceeef', trim: '#dfe2e4', door: '#6e4e3a', wood: '#6e4e3a', wood2: '#2d3035', fabric: '#878c93',
        accent: '#d9a441', accent2: '#2f3338', cab: '#2f3338', top: '#f2f2f0', splash: '#d9dcde', steel: '#4a4e54',
        curtain: '#cfd3d6', bedding: '#5d646d', bath1: '#3d4a57', bath2: '#d9a441',
        floor: { living: ['terrazzo', '#e3e2de'], bed: ['wood', '#9c7a5c'], bath: ['tile', '#d7d9da', '#b9bdbf'], logia: ['concrete', '#b9bbbd'] } },
      items: p => [].concat(shoe(), kPen(1), dRound(4.75, { top: '#f2f2f0', c: p.wood2 }), [
        ['sofaL', 6.925, 7.4, 1, { side: 'L' }], ['rug', 7.7, 7.1, 0, { w: 1.5, d: 2.0, pat: 'geo' }],
        ['ctable', 7.6, 6.9, 0, { c: p.wood2 }], ['tvunit', 8.755, 7.15, 3, { slat: 1 }],
        ['plant', 8.72, 8.42, 0, { kind: 'monstera', h: 1.1 }],
        ['art', 6.175, 7.2, 1, { w: 1.2, h: 0.7, y: 1.55, kind: 'abstract' }]
      ], masterA({ head: 'pad' }), [
        ['cabinet', 2.93, 6.9, 3, { w: 1.2, d: 0.4, h: 0.8, vase: 1 }],
        ['mirror', 3.125, 6.9, 3, { w: 0.6, h: 0.9, y: 1.5 }],
        ['art', 0.075, 7.0, 1, { w: 1.1, h: 0.5, y: 1.6, kind: 'lines' }],
        ['wardrobe', 4.08, 6.275, 0, { w: 1.6 }], ['crib', 5.7, 7.6, 1, { c: '#f4f4f2' }],
        ['changer', 3.53, 7.3, 1], ['armchair', 3.7, 8.2, 2, { c: p.accent }], ['lamp', 4.35, 8.42, 0],
        ['rug', 4.75, 7.5, 0, { w: 1.4, d: 1.4, round: 1, c: '#d7d9da' }], ['lowshelf', 5.02, 8.47, 2, { w: 0.9 }],
        ['art', 6.025, 7.6, 3, { w: 0.6, h: 0.45, y: 1.5, kind: 'sun' }]
      ])
    },
    {
      name: 'Đông Dương', style: 'Việt Nam',
      desc: 'Tường vàng kem, gỗ nâu sẫm, gạch bông ở bếp và lô gia, mây tre đan, quạt trần và mành tre — không khí nhà Việt xưa trong một căn hộ.',
      points: ['Bé ngủ chung giường bố mẹ, quạt trần gió nhẹ thay điều hoà cho bé.',
        'Trường kỷ gỗ và bàn trà thấp: tiếp khách kiểu Việt, lau chùi nhanh.',
        'Gạch bông ở bếp chịu nước, vết bẩn khó lộ.',
        'Phòng của bé có giường đơn để mẹ nằm cùng những đêm bé ốm.'],
      bed2: 'Phòng của bé',
      pal: { wall: '#f2e4c0', trim: '#5e3d27', door: '#5e3d27', wood: '#5e3d27', wood2: '#3b2618', fabric: '#e6dcc6',
        accent: '#2f6b5a', accent2: '#b5532f', cab: '#5e3d27', top: '#efe6d3', splash: '#2f6b5a', blind: true,
        bedding: '#2f6b5a', bath1: '#2f6b5a', bath2: '#c9a24a',
        floor: { living: ['wood', '#8b5e3c'], kitchen: ['bong', '#efe6d0', '#2f6b5a', '#b5532f'], bed: ['wood', '#8b5e3c'],
          bath: ['bong', '#efe6d0', '#34506b', '#c9a24a'], logia: ['bong', '#efe6d0', '#b5532f', '#2f6b5a'] } },
      fans: ['living', 'master'],
      items: p => [].concat(shoe(), kPen(), dRound(4.6, { rattan: 1, pendant: 'lantern' }), [
        ['bench', 6.5, 7.2, 1], ['teatable', 7.65, 7.2, 1], ['tvunit', 8.755, 7.1, 3],
        ['armchair', 7.6, 8.2, 2, { rattan: 1 }], ['rug', 7.6, 7.2, 0, { w: 1.4, d: 2.0, pat: 'geo', c: p.accent2 }],
        ['plant', 8.72, 8.42, 0, { kind: 'palm', h: 1.5 }], ['plant', 6.4, 8.44, 0, { kind: 'monstera', h: 1.0 }],
        ['art', 6.175, 7.2, 1, { w: 0.7, h: 0.9, y: 1.6, kind: 'lotus' }],
        ['art', 4.6, 5.825, 2, { w: 0.5, h: 0.7, y: 1.45, kind: 'lotus' }]
      ], masterB({ head: 'rattan' }), [
        ['rug', 1.6, 5.95, 0, { w: 2.2, d: 0.9, pat: 'geo', c: p.accent }],
        ['wardrobe', 4.08, 6.275, 0, { w: 1.6 }], ['bed', 3.78, 7.6, 2, { w: 1.0, d: 2.0, head: 'rattan', blanket: p.accent2 }],
        ['lowshelf', 4.97, 8.47, 2, { w: 1.2 }], ['toybox', 5.8, 7.4, 3],
        ['rug', 5.1, 7.4, 0, { w: 1.3, d: 1.6, pat: 'chieu' }]
      ])
    },
    {
      name: 'Nếp Nhà Việt', style: 'Việt Nam',
      desc: 'Nhà Việt hiện đại có bàn thờ treo, trường kỷ cách tân, đèn nón lá trên bàn ăn. Phòng ngủ 2 dành cho ông bà lên ở chăm cháu.',
      points: ['Phòng ông bà ngay cạnh phòng bố mẹ, đêm nghe tiếng bé là sang đỡ được.',
        'Bàn thờ treo cao ở góc yên tĩnh cuối phòng khách, bên dưới để trống, ngoài tầm với của bé.',
        'Tủ thay tã ở chân giường bố mẹ, bé ngủ chung giường.',
        'Bàn ăn 4 ghế đủ cho bố mẹ và ông bà, thêm ghế ăn dặm cho bé.'],
      bed2: 'Phòng ông bà',
      pal: { wall: '#f6f0e4', door: '#8c5b38', wood: '#8c5b38', wood2: '#5a3a22', fabric: '#e2d6c0', accent: '#9e3b2c',
        accent2: '#c9a24a', cab: '#f1ebde', top: '#d9cfbd', splash: '#e8dcc6', curtain: '#ede3cf', bedding: '#b78a6a',
        bath1: '#9e3b2c', bath2: '#6d8a6a',
        floor: { living: ['tile', '#e9dcc6', '#d3c2a4'], bed: ['wood', '#a9764d'], bath: ['tile', '#e6dfd2', '#cbbfa9'], logia: ['tile', '#c9a98a', '#b08c6a'] } },
      fans: ['living'],
      items: p => [].concat(shoe(), kPen(), dWall(4, { pendant: 'nonla' }), [
        ['bench', 6.5, 7.2, 1], ['teatable', 7.6, 7.0, 1], ['rug', 7.6, 7.1, 0, { w: 1.4, d: 2.0, pat: 'chieu' }],
        ['tvunit', 8.755, 6.85, 3, { w: 1.5 }], ['wallaltar', 8.925, 8.1, 3, { y: 1.9 }],
        ['pouf', 7.6, 8.25, 0, { c: p.accent }], ['plant', 6.4, 8.44, 0, { kind: 'palm', h: 1.3 }],
        ['art', 6.175, 7.2, 1, { w: 1.2, h: 0.6, y: 1.6, kind: 'lotus' }],
        ['art', 4.6, 5.825, 2, { w: 0.5, h: 0.7, y: 1.45, kind: 'hills' }]
      ], masterA(), changerA(), [
        ['wardrobe', 4.08, 6.275, 0, { w: 1.6 }], ['bed', 3.88, 7.6, 2, { w: 1.2, d: 2.0 }],
        ['nightstand', 4.72, 8.4, 2], ['armchair', 5.6, 8.2, 2], ['rug', 5.1, 7.3, 0, { w: 1.2, d: 1.5, pat: 'border' }],
        ['art', 6.025, 7.5, 3, { w: 0.6, h: 0.45, y: 1.5, kind: 'lotus' }]
      ])
    },
    {
      name: 'Montessori Của Bé', style: 'Tối giản',
      desc: 'Cả nhà lấy bé làm trung tâm: mọi thứ của bé đặt thấp ngang tầm tay, màu pastel dịu. Phòng khách bỏ bàn trà và tivi, nhường sàn cho thảm chơi.',
      points: ['Giường ghép 1m8 + 1m2 sát sàn: cả nhà ngủ chung, không lo bé rơi.',
        'Phòng của bé có giường nhà sát sàn, kệ thấp, gương thấp và lều — bé tự lấy, tự cất đồ chơi.',
        'Phòng khách không bàn trà, không cạnh nhọn, thảm xốp phủ giữa phòng.',
        'Kệ sách bìa quay ra ngoài ngang tầm mắt bé thay cho kệ tivi.'],
      bed2: 'Phòng Montessori',
      pal: { wall: '#f8f4ec', door: '#e6d3b3', wood: '#dcc39c', wood2: '#b89a70', fabric: '#e9e1d4', accent: '#f0b49c',
        accent2: '#9cc5c1', cab: '#ffffff', top: '#dcc39c', splash: '#f3e7dc', curtain: '#fbf7f0', bedding: '#9cc5c1',
        bath1: '#9cc5c1', bath2: '#f0b49c',
        floor: { living: ['wood', '#dfc7a2'], bed: ['wood', '#dfc7a2'], bath: ['tile', '#eef0ee', '#d5dedc'], logia: ['tile', '#dfe6e3', '#c6d2ce'] } },
      items: p => [].concat(shoe(), kGalley(), dRound(4.5), [
        ['sofa', 6.6, 7.2, 1], ['playmat', 7.85, 7.2, 0, { w: 1.5, d: 2.0 }],
        ['lowshelf', 8.77, 6.75, 3, { w: 1.3 }], ['shelf', 8.77, 7.95, 3, { w: 0.9, h: 1.2 }],
        ['pouf', 7.35, 8.35, 0, { c: p.accent }], ['plant', 8.72, 5.85, 0, { kind: 'bush', h: 0.9 }],
        ['art', 6.175, 7.2, 1, { w: 1.0, h: 0.6, y: 1.5, kind: 'hills' }],
        ['wardrobe', 1.13, 5.075, 0, { w: 2.1 }],
        ['bed', 1.0, 7.6, 2, { w: 1.8, low: 1, head: 'pad' }], ['bed', 2.52, 7.6, 2, { w: 1.2, low: 1, head: 'pad', blanket: p.accent }],
        ['rug', 1.6, 5.97, 0, { w: 2.4, d: 0.9, pat: 'plain', c: p.accent2 }],
        ['wardrobe', 3.88, 6.275, 0, { w: 1.2, h: 1.4 }], ['mirror', 4.85, 5.975, 0, { w: 0.55, h: 1.0, y: 0.62 }],
        ['floorbed', 3.8, 7.65, 2], ['tent', 4.95, 8.0, 2], ['lowshelf', 5.87, 7.6, 3, { w: 1.4 }],
        ['playmat', 5.0, 7.0, 0, { w: 1.5, d: 1.0 }]
      ])
    },
    {
      name: 'Làm Việc Tại Nhà', style: 'Hiện đại',
      desc: 'Dành cho bố hoặc mẹ làm việc ở nhà: phòng ngủ 2 thành phòng làm việc có bàn dưới cửa sổ, kệ sách và giường băng cho khách hay giấc trưa của bé.',
      points: ['Phòng làm việc đóng cửa được, họp trực tuyến không vướng tiếng bé.',
        'Giường băng trong phòng làm việc: bé ngủ trưa cạnh bố mẹ, khách đến có chỗ ngủ.',
        'Tủ thay tã vẫn nằm trong phòng ngủ chính, bé ngủ chung giường bố mẹ.',
        'Bàn ăn nhỏ 2 ghế + ghế ăn dặm, phòng khách thoáng hơn.'],
      bed2: 'Phòng làm việc',
      pal: { wall: '#eef0ec', door: '#b9966e', wood: '#a9825a', wood2: '#2f4858', fabric: '#b9c0c4', accent: '#2f4858',
        accent2: '#d98a5b', cab: '#f3f4f1', top: '#a9825a', splash: '#dfe4e2', curtain: '#e3e7e6', bedding: '#2f4858',
        bath1: '#2f4858', bath2: '#7d9aa5',
        floor: { living: ['concrete', '#d9d7d1'], bed: ['wood', '#b08a62'], bath: ['tile', '#e0e3e1', '#c3cac8'], logia: ['concrete', '#c2c2bd'] } },
      items: p => [].concat(shoe(), kPen(), dWall(2), [
        ['sofa', 6.6, 7.2, 1], ['rug', 7.75, 7.2, 0, { w: 1.5, d: 2.3, pat: 'stripe', c: p.accent }],
        ['ctable', 7.8, 7.2, 0], ['tvunit', 8.755, 7.1, 3],
        ['plant', 8.72, 8.42, 0, { kind: 'monstera', h: 1.1 }], ['lamp', 6.42, 8.44, 0],
        ['art', 6.175, 7.2, 1, { w: 1.2, h: 0.6, y: 1.5, kind: 'abstract' }],
        ['art', 8.925, 4.4, 3, { w: 0.6, h: 0.6, y: 1.6, kind: 'lines' }]
      ], masterA({ head: 'pad' }), changerA(), [
        ['shelf', 4.08, 6.13, 0, { w: 1.6, h: 2.0 }], ['daybed', 3.73, 7.6, 1],
        ['desk', 5.15, 8.34, 2, { w: 1.5 }], ['ochair', 5.15, 7.72, 0], ['plant', 5.82, 7.2, 0, { kind: 'bush', h: 0.9 }],
        ['art', 6.025, 7.9, 3, { w: 0.5, h: 0.7, y: 1.55, kind: 'abstract' }]
      ])
    },
    {
      name: 'Xanh Nhiệt Đới', style: 'Việt Nam',
      desc: 'Nhiều cây xanh, tủ bếp xanh lá, mây đan và gạch nung. Lô gia thành vườn nhỏ trồng rau thơm, nhà lúc nào cũng mát mắt.',
      points: ['Cây lớn đặt ở góc phòng sau sofa và kệ tivi, ngoài lối bé bò.',
        'Phòng của bé có cả cũi lẫn giường đơn: mẹ ngủ cùng lúc bé còn nhỏ, sau này bé dùng giường.',
        'Quạt trần phòng khách, cửa kính lớn hướng nam đón gió.',
        'Bồn cây ở lô gia: chỗ để bé tập tưới cây, nhổ rau.'],
      bed2: 'Phòng của bé',
      pal: { wall: '#f5f1e6', door: '#b9895a', wood: '#b9895a', wood2: '#7a5536', fabric: '#4f8061', accent: '#3f7d5c',
        accent2: '#c96f4a', cab: '#3f6f57', top: '#efe7d6', splash: '#f0e9da', curtain: '#f4efe2', bedding: '#3f7d5c',
        bath1: '#3f7d5c', bath2: '#c96f4a',
        floor: { living: ['tile', '#eadfcd', '#d6c7ad'], bed: ['wood', '#b9895a'], bath: ['terrazzo', '#e9e4d8'], logia: ['bong', '#efe6d0', '#3f7d5c', '#c96f4a'] } },
      fans: ['living'],
      items: p => [].concat(shoe(), kPen(), dRound(4.6, { rattan: 1, pendant: 'lantern' }), [
        ['sofa', 6.6, 7.2, 1], ['rug', 7.75, 7.2, 0, { w: 1.5, d: 2.3, pat: 'border', c: '#e9dfc9' }],
        ['ctable', 7.8, 7.2, 0, { c: p.wood }], ['tvunit', 8.755, 7.1, 3],
        ['plant', 8.72, 8.42, 0, { kind: 'palm', h: 1.7 }], ['plant', 6.4, 8.44, 0, { kind: 'monstera', h: 1.2 }],
        ['plant', 8.72, 5.85, 0, { kind: 'bush', h: 1.0 }],
        ['art', 6.175, 7.2, 1, { w: 1.2, h: 0.6, y: 1.5, kind: 'hills' }],
        ['planter', 5.03, 1.6, 1, { w: 1.2 }]
      ], masterB({ head: 'rattan' }), [
        ['plant', 2.93, 6.15, 0, { kind: 'monstera', h: 1.1 }],
        ['wardrobe', 4.08, 6.275, 0, { w: 1.6 }], ['bed', 3.78, 7.6, 2, { w: 1.0, d: 2.0 }],
        ['crib', 5.7, 7.6, 1, { c: p.wood }], ['lowshelf', 4.82, 8.47, 2, { w: 1.0 }],
        ['rug', 4.8, 7.4, 0, { w: 1.1, d: 1.1, round: 1, c: p.accent2 }]
      ])
    },
    {
      name: 'Không Gian Mở', style: 'Hiện đại',
      desc: 'Mở nửa bức tường giữa phòng khách và phòng ngủ 2 để thành phòng chơi thông với phòng khách. Ngồi sofa hay đứng bếp đều thấy bé.',
      points: ['Bỏ đoạn tường phía cửa sổ: phòng chơi và phòng khách liền một khối, sáng hơn hẳn.',
        'Sofa quay mặt về phía phòng chơi, tivi treo trên đoạn tường còn lại.',
        'Lều, kệ thấp, thảm chơi nằm gọn trong phòng chơi — đồ chơi không tràn ra phòng khách.',
        'Bé ngủ chung giường bố mẹ; khi bé lớn có thể xây lại tường để bé có phòng riêng.'],
      bed2: 'Phòng chơi mở', remove: ['bl-s'],
      pal: { wall: '#f6f6f2', door: '#c9a57b', wood: '#c9a57b', wood2: '#8b6b4a', fabric: '#a7b6c2', accent: '#5b8fb9',
        accent2: '#f0c35a', cab: '#f7f7f4', top: '#c9a57b', splash: '#dfe8ee', curtain: '#ffffff', bedding: '#5b8fb9',
        bath1: '#5b8fb9', bath2: '#f0c35a',
        floor: { living: ['wood', '#d2b48c'], bed: ['wood', '#d2b48c'], bath: ['tile', '#e8ecee', '#cdd6da'], logia: ['tile', '#d0d6d8', '#b9c2c6'] } },
      items: p => [].concat(shoe(), kPen(), dBanq(), [
        ['sofa', 8.5, 7.2, 3], ['tvunit', 6.345, 6.6, 1, { w: 1.1 }], ['ctable', 7.3, 7.5, 0],
        ['rug', 7.25, 7.4, 0, { w: 1.5, d: 2.0, pat: 'stripe', c: p.accent }],
        ['plant', 8.72, 8.42, 0, { kind: 'palm', h: 1.3 }],
        ['art', 8.925, 7.2, 3, { w: 1.2, h: 0.6, y: 1.55, kind: 'abstract' }]
      ], masterB({ head: 'pad' }), [
        ['rug', 1.6, 5.95, 0, { w: 2.2, d: 0.9, pat: 'plain', c: p.fabric }],
        ['wardrobe', 3.98, 6.275, 0, { w: 1.4 }], ['lowshelf', 3.43, 7.6, 1, { w: 1.6 }],
        ['tent', 4.4, 8.05, 1], ['playmat', 5.2, 7.3, 0, { w: 1.5, d: 1.5 }], ['toybox', 5.4, 8.4, 2],
        ['art', 3.275, 7.6, 1, { w: 0.9, h: 0.5, y: 1.4, kind: 'sun' }]
      ])
    },
    {
      name: 'Gỗ Óc Chó Sang Trọng', style: 'Hiện đại',
      desc: 'Gỗ óc chó nâu sẫm, đá tối màu, điểm kim loại đồng. Vách lam gỗ sau tivi và đầu giường, đèn ấm — sang nhưng vẫn đủ chỗ cho em bé.',
      points: ['Phòng bố mẹ không kê cũi, tủ thay tã ngay chân giường.',
        'Phòng em bé có cũi, giường băng để mẹ nằm cạnh và ghế bành cho bú.',
        'Bàn ăn tròn không góc nhọn.',
        'Bàn đảo có ghế quầy, sofa chữ L rộng cho cả nhà.'],
      bed2: 'Phòng em bé',
      pal: { wall: '#e4ded4', trim: '#d9d2c6', door: '#5d4030', wood: '#5d4030', wood2: '#2a2423', fabric: '#cfc4b4',
        accent: '#b9975b', accent2: '#3b3f47', cab: '#5d4030', top: '#2b2b2e', splash: '#3a3a3d', steel: '#3b3d41',
        curtain: '#bfb5a6', bedding: '#6b5d52', bath1: '#2b2b2e', bath2: '#b9975b',
        floor: { living: ['tile', '#ddd6cb', '#b9ae9e'], bed: ['wood', '#7a5a44'], bath: ['tile', '#cfc9c0', '#a79f93'], logia: ['concrete', '#b5b0a8'] } },
      items: p => [].concat(shoe(), kPen(1), dRound(4.75, { top: '#ece8e1', c: p.wood }), [
        ['sofaL', 6.925, 7.4, 1, { side: 'L' }], ['rug', 7.7, 7.1, 0, { w: 1.5, d: 2.0, pat: 'border', c: '#8a7d6e' }],
        ['ctable', 7.6, 6.9, 0, { c: p.top }], ['tvunit', 8.755, 7.15, 3, { slat: 1 }],
        ['plant', 8.72, 8.42, 0, { kind: 'palm', h: 1.4 }],
        ['art', 6.175, 7.2, 1, { w: 1.3, h: 0.6, y: 1.6, kind: 'lines' }],
        ['panel', 0.075, 7.0, 1, { w: 2.6, h: 2.5, kind: 'slat' }]
      ], masterA({ head: 'pad' }), changerA(), [
        ['wardrobe', 4.08, 6.275, 0, { w: 1.6 }], ['daybed', 3.73, 7.6, 1], ['crib', 4.9, 8.3, 0, { c: p.wood }],
        ['armchair', 5.6, 7.3, 3, { c: p.accent }], ['rug', 4.8, 7.2, 0, { w: 1.3, d: 1.3, round: 1, c: '#cfc4b4' }],
        ['art', 6.025, 7.9, 3, { w: 0.5, h: 0.5, y: 1.6, kind: 'sun' }]
      ])
    },
    {
      name: 'Chiếu Trải Giữa Nhà', style: 'Việt Nam',
      desc: 'Phòng khách không sofa, không bàn trà: chỉ một tấm chiếu cói lớn giữa nhà như nếp ngồi bệt của người Việt. Cả nhà ngồi, nằm, ăn trái cây ngay trên chiếu, bé bò thoải mái.',
      points: ['Giữa phòng khách trống hoàn toàn — không cạnh bàn, không chân ghế cho bé va vào.',
        'Chiếu cói mát, cuốn lại là lau sàn được ngay.',
        'Kệ tivi và cây đặt sát tường, sát góc, không lấn vào lối bò của bé.',
        'Bé ngủ chung giường bố mẹ, quạt trần phòng khách.'],
      bed2: 'Phòng của bé',
      pal: { wall: '#f5efe2', door: '#9a6b43', wood: '#9a6b43', wood2: '#5a3a22', fabric: '#e4d8c2', accent: '#a8392b',
        accent2: '#2f6b5a', cab: '#f2ecdf', top: '#d9cdb8', splash: '#e9dfca', blind: true, bedding: '#c9a878',
        bath1: '#2f6b5a', bath2: '#a8392b',
        floor: { living: ['wood', '#b98a5e'], bed: ['wood', '#b98a5e'], bath: ['tile', '#e6dfd2', '#cbbfa9'], logia: ['tile', '#c9a98a', '#b08c6a'] } },
      fans: ['living'],
      items: p => [].concat(shoe(), kPen(), dWall(4, { pendant: 'nonla' }), [
        ['rug', 7.4, 7.25, 0, { w: 2.3, d: 2.4, pat: 'chieu' }], ['tvunit', 8.755, 7.1, 3],
        ['plant', 8.72, 8.42, 0, { kind: 'palm', h: 1.5 }], ['plant', 6.4, 8.44, 0, { kind: 'monstera', h: 1.1 }],
        ['art', 6.175, 7.2, 1, { w: 1.3, h: 0.7, y: 1.55, kind: 'lotus' }]
      ], masterB({ head: 'rattan' }), [
        ['rug', 1.6, 5.95, 0, { w: 2.2, d: 0.9, pat: 'chieu' }],
        ['wardrobe', 4.08, 6.275, 0, { w: 1.6 }], ['bed', 3.78, 7.6, 2, { w: 1.0, d: 2.0, blanket: p.accent2 }],
        ['lowshelf', 4.97, 8.47, 2, { w: 1.2 }], ['rug', 5.1, 7.4, 0, { w: 1.3, d: 1.6, pat: 'border' }]
      ])
    },
    {
      name: 'Sân Chơi Giữa Nhà', style: 'Tối giản',
      desc: 'Phòng khách thành sân chơi: bỏ hết sofa, bàn trà và tivi, trải thảm xốp kín sàn. Đồ chơi và sách nằm trên kệ thấp sát tường, giữa phòng để trống cho bé bò, tập đi.',
      points: ['Thảm xốp 2,5 × 2,5 m phủ gần kín phòng khách, ngã không đau.',
        'Không tivi, không bàn ghế: không có gì để bé vịn kéo đổ hay va đầu.',
        'Kệ thấp ngang tầm tay bé, tự lấy tự cất.',
        'Bàn ăn tròn ngay cạnh, bố mẹ ngồi ăn vẫn trông được bé chơi.'],
      bed2: 'Phòng của bé',
      pal: { wall: '#f7f5ee', door: '#e2cda8', wood: '#d8bd94', wood2: '#a98d66', fabric: '#e6ded0', accent: '#f2c14e',
        accent2: '#7fb6a8', cab: '#ffffff', top: '#d8bd94', splash: '#eef1ec', curtain: '#fbf9f3', bedding: '#7fb6a8',
        bath1: '#7fb6a8', bath2: '#f2c14e',
        floor: { living: ['wood', '#dcc49f'], bed: ['wood', '#dcc49f'], bath: ['tile', '#eef0ee', '#d5dedc'], logia: ['tile', '#dfe6e3', '#c6d2ce'] } },
      items: p => [].concat(shoe(), kGalley(), dRound(4.5), [
        ['playmat', 7.5, 7.25, 0, { w: 2.5, d: 2.5 }], ['lowshelf', 8.77, 6.9, 3, { w: 1.5 }],
        ['shelf', 8.77, 8.05, 3, { w: 0.6, h: 1.2 }],
        ['art', 6.175, 7.2, 1, { w: 1.2, h: 0.6, y: 1.5, kind: 'hills' }]
      ], masterA(), changerA(), [
        ['wardrobe', 3.98, 6.275, 0, { w: 1.4 }], ['floorbed', 3.8, 7.65, 2],
        ['lowshelf', 5.2, 8.47, 2, { w: 1.2 }], ['rug', 5.0, 7.4, 0, { w: 1.5, d: 1.5, round: 1, c: p.accent2 }]
      ])
    },
    {
      name: 'Phòng Khách Trống', style: 'Hiện đại',
      desc: 'Hiện đại và thật thoáng: phòng khách chỉ có một tấm thảm lớn, tivi treo trên vách lam gỗ, một cây đèn và một chậu cây ở góc. Không sofa, không bàn — ngồi bệt xem phim, trải nệm khi có khách.',
      points: ['Lối từ bàn ăn ra cửa kính thông suốt, xe đẩy và xe chòi chân đi thẳng được.',
        'Thảm dày giữa phòng cho bé nằm sấp, tập lẫy, tập bò.',
        'Bé có phòng riêng với cũi, tủ thay tã và ghế bành cho mẹ.',
        'Sau này cần thì thêm sofa lúc nào cũng được — tường và ổ điện tivi đã sẵn.'],
      bed2: 'Phòng em bé',
      pal: { wall: '#f1f0ec', trim: '#e2e0da', door: '#8a6748', wood: '#8a6748', wood2: '#30302f', fabric: '#c9c6bf',
        accent: '#7d8f7a', accent2: '#c47a52', cab: '#30302f', top: '#efeeea', splash: '#dcdad4', steel: '#4a4c4f',
        curtain: '#dedcd6', bedding: '#7d8f7a', bath1: '#30302f', bath2: '#7d8f7a',
        floor: { living: ['concrete', '#d6d3cc'], bed: ['wood', '#a98463'], bath: ['tile', '#d9d8d4', '#bbb9b3'], logia: ['concrete', '#bdbbb5'] } },
      items: p => [].concat(shoe(), kPen(1), dRound(4.75, { top: '#efeeea', c: p.wood2 }), [
        ['rug', 7.45, 7.25, 0, { w: 2.2, d: 2.3, pat: 'border' }], ['tvunit', 8.755, 7.15, 3, { slat: 1 }],
        ['lamp', 6.42, 8.44, 0], ['plant', 8.72, 8.42, 0, { kind: 'palm', h: 1.5 }],
        ['art', 6.175, 7.2, 1, { w: 1.3, h: 0.7, y: 1.55, kind: 'abstract' }]
      ], masterA({ head: 'pad' }), [
        ['cabinet', 2.93, 6.9, 3, { w: 1.2, d: 0.4, h: 0.8, vase: 1 }],
        ['wardrobe', 4.08, 6.275, 0, { w: 1.6 }], ['crib', 5.7, 7.6, 1, { c: '#f4f4f2' }],
        ['changer', 3.53, 7.3, 1], ['armchair', 3.7, 8.2, 2, { c: p.accent }],
        ['rug', 4.75, 7.5, 0, { w: 1.4, d: 1.4, round: 1, c: '#d9d8d4' }]
      ])
    },
    {
      name: 'Mâm Cơm Trên Chiếu', style: 'Việt Nam',
      desc: 'Cả dãy bếp – ăn – khách không còn một bộ bàn ghế nào. Bữa cơm dọn bằng mâm trên chiếu như nhà Việt xưa, ăn xong cất mâm là có ngay một khoảng sàn dài gần 6 mét.',
      points: ['Không bàn ăn, không ghế, không sofa: bé bò một mạch từ bếp ra tới cửa kính.',
        'Ngồi ăn trên chiếu, bé ngồi ngang tầm với cả nhà, không lo ngã ghế.',
        'Hai tấm chiếu cuốn lại được, lau sàn rất nhanh.',
        'Phòng ngủ 2 dành cho ông bà lên chăm cháu.'],
      bed2: 'Phòng ông bà',
      pal: { wall: '#f3e9d2', trim: '#7a4f30', door: '#7a4f30', wood: '#7a4f30', wood2: '#4a2f1c', fabric: '#e6dcc6',
        accent: '#a8392b', accent2: '#2f6b5a', cab: '#7a4f30', top: '#efe6d3', splash: '#e9dfca', blind: true,
        bedding: '#b5694a', bath1: '#a8392b', bath2: '#2f6b5a',
        floor: { living: ['wood', '#9c6c44'], kitchen: ['bong', '#efe6d0', '#a8392b', '#2f6b5a'], bed: ['wood', '#9c6c44'],
          bath: ['tile', '#e6dfd2', '#cbbfa9'], logia: ['bong', '#efe6d0', '#2f6b5a', '#a8392b'] } },
      fans: ['living', 'master'],
      items: p => [].concat(shoe(), kPen(), [
        ['rug', 7.55, 4.5, 0, { w: 2.0, d: 1.8, pat: 'chieu' }], ['mam', 7.55, 4.5, 0],
        ['pendant', 7.55, 4.5, 0, { kind: 'nonla', y: 1.95 }],
        ['art', 8.925, 4.5, 3, { w: 0.9, h: 0.6, y: 1.5, kind: 'lotus' }],
        ['rug', 7.4, 7.25, 0, { w: 2.3, d: 2.4, pat: 'chieu' }], ['tvunit', 8.755, 7.1, 3],
        ['plant', 8.72, 8.42, 0, { kind: 'palm', h: 1.5 }], ['plant', 6.4, 8.44, 0, { kind: 'monstera', h: 1.1 }],
        ['art', 6.175, 7.2, 1, { w: 1.3, h: 0.7, y: 1.55, kind: 'hills' }]
      ], masterA(), changerA(), [
        ['wardrobe', 4.08, 6.275, 0, { w: 1.6 }], ['bed', 3.88, 7.6, 2, { w: 1.2, d: 2.0 }],
        ['nightstand', 4.72, 8.4, 2], ['rug', 5.1, 7.3, 0, { w: 1.2, d: 1.5, pat: 'chieu' }]
      ])
    },
    {
      name: 'Trống Hoàn Toàn', style: 'Tối giản',
      desc: 'Tối giản đến tận cùng: từ quầy bếp ra tới cửa kính không có bàn, ghế, sofa hay kệ tivi. Chỉ còn một tấm thảm, một cây đèn, một chậu cây và tranh trên tường. Ăn uống ngay tại quầy bếp.',
      points: ['Khoảng sàn trống lớn nhất trong tất cả các thiết kế — chỗ cho bé bò, tập đi, đạp xe chòi chân.',
        'Không có món đồ nào để bé vịn kéo đổ hay va đầu.',
        'Dọn nhà chỉ mất vài phút vì gần như không có gì để lau quanh.',
        'Bé ngủ chung giường bố mẹ lúc nhỏ, sau có giường nhà sát sàn ở phòng riêng.'],
      bed2: 'Phòng của bé',
      pal: { wall: '#f4f3ef', door: '#cdb08a', wood: '#c2a27c', wood2: '#8f7556', fabric: '#dcd8cf', accent: '#8aa39b',
        accent2: '#d08a5f', cab: '#fafaf7', top: '#c2a27c', splash: '#e9ebe8', curtain: '#fafaf7', bedding: '#8aa39b',
        bath1: '#8aa39b', bath2: '#d08a5f',
        floor: { living: ['wood', '#d3b890'], bed: ['wood', '#d3b890'], bath: ['tile', '#eceeed', '#d2d8d6'], logia: ['tile', '#dadfdd', '#c2cac7'] } },
      items: p => [].concat(shoe(), kPen(), [
        ['rug', 7.5, 7.2, 0, { w: 2.3, d: 2.4, pat: 'plain' }], ['lamp', 6.42, 8.44, 0],
        ['plant', 8.72, 8.42, 0, { kind: 'palm', h: 1.5 }],
        ['art', 8.925, 7.0, 3, { w: 1.4, h: 0.8, y: 1.5, kind: 'hills' }],
        ['art', 8.925, 4.5, 3, { w: 0.6, h: 0.8, y: 1.5, kind: 'sun' }],
        ['art', 6.175, 7.2, 1, { w: 0.9, h: 0.6, y: 1.5, kind: 'lines' }]
      ], masterB({ head: 'pad' }), [
        ['rug', 1.6, 5.95, 0, { w: 2.2, d: 0.9, pat: 'plain' }],
        ['wardrobe', 3.98, 6.275, 0, { w: 1.4 }], ['floorbed', 3.8, 7.65, 2],
        ['lowshelf', 5.2, 8.47, 2, { w: 1.2 }], ['rug', 5.0, 7.4, 0, { w: 1.5, d: 1.5, round: 1, c: p.accent }]
      ])
    }
  ];

  HD.DESIGNS = DEFS.map((d, i) => {
    const pal = Object.assign({}, BASE, d.pal);
    pal.floor = Object.assign({}, BASE.floor, d.pal.floor);
    return {
      id: i, name: d.name, style: d.style, desc: d.desc, points: d.points, bed2: d.bed2,
      remove: d.remove || [], fans: d.fans || [], pal,
      items: d.bare ? d.items(pal) : d.items(pal).concat(baths(pal), logia())
    };
  });
})(typeof window !== 'undefined' ? window : globalThis);
