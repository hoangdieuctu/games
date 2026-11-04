# Little World — Thiết kế Đảo cá nhân (Personal Island)

Đảo cá nhân là nơi quan trọng nhất của bé: **yên bình, có chút phép thuật, luôn chào đón**
và **tuỳ biến được**. Mọi thứ đứng trên mặt đất (nhà, cây, đèn, hàng rào…) là sprite riêng
để người chơi có thể di chuyển; ảnh nền chỉ chứa mặt đất.

Generator: `art/gen-island.mjs` (mã vẽ trong `art/lib/island-*.mjs`), chạy lại được, kết quả
giống nhau mỗi lần:

```
PLAYWRIGHT_CORE=<thư mục playwright-core> node games/little-world/art/gen-island.mjs
# tuỳ chọn: PREVIEW_DIR=<thư mục> để xuất thêm ảnh tham chiếu thu nhỏ (có/không lưới)
```

## 1. Bố cục đảo

Nền `island/terrain/island-base.webp` có kích thước **2560 × 1600** đơn vị (xuất 1×), gồm
40 × 25 ô lưới 64 đơn vị.

```
 ┌──────────────────────────────── biển (sóng lấp lánh) ───────────────────────────────┐
 │        rừng thông          cây sồi        [ KHU A: ô xây ]      cây sồi            │
 │   thông    CÂY CỔ THỤ (xích đu,     NHÀ CHÍNH      hoa anh đào                    │
 │            sàn nhà cây)          ═══ quảng trường ═══ nhà thú cưng ── AO (lá súng)  │
 │ [KHU D]  nhà chim  ghế ─────┘        │        đệm thú cưng          cây táo        │
 │                    ┌──── đường ──────┤                         [ KHU C: ô xây ]    │
 │  VƯỜN RAU (3 luống) biển gỗ          │                                             │
 │  hàng rào + cổng    [ KHU B: ô xây ] └──── đường ──┐                    đá lớn     │
 │ dừa   ─── vách đất (2.5D) ─────────────────── bậc gỗ ───────────────── dừa        │
 │              bãi cát · sao biển · vỏ sò          CẦU CẢNG ↓                         │
 └──────────────────────────────────────────────────────────────────────────────────────┘
```

| Vùng | Vị trí (đơn vị thế giới) | Nội dung |
|---|---|---|
| Nhà chính (tiêu điểm) | đế tại (1284, 652), hơi trên-giữa | `island-building-house-main`, quảng trường đá lát trước cửa, hòm thư, đèn đường, 2 chậu hoa |
| Cây cổ thụ | (790, 590) | `island-tree-great-tree` (xích đu + sàn nhà cây), ghế gỗ, nấm phát sáng |
| Ao | tâm (1930, 660) | `island-terrain-pond` (lá súng, cỏ nến, viền đá) |
| Vườn rau | (520–662, 986–1086) | 3 luống (đang lớn, mầm, trống) + hàng rào trắng có cổng, biển gỗ |
| Khu thú cưng | (1516–1600, 700–760) | `island-building-pet-house`, `island-deco-pet-bed` (= `petArea`) |
| Bến | (1716, 1222 → 1596) | bậc thang gỗ (vẽ sẵn trong nền) → `env-pier-segment` → `env-pier-end` |
| Bãi biển | dải cát quanh đảo, rộng nhất ở phía trước | dừa, sao biển, vỏ sò, đá biển |
| Ô xây trống | khu A, B, C, D | 61 ô (`buildCells`), không có vật nào |

Đường đất được **vẽ sẵn trong nền**: bến → quảng trường trước nhà (đường chính), và 3 nhánh
tới vườn rau, cây cổ thụ, ao. Người chơi có thể đặt thêm đường bằng các decal `path-*`.

Chiều sâu 2.5D: mép trước của mặt cỏ có **vách đất** cao khoảng 62 đơn vị (có vân lớp đất, đá
nhỏ và mép cỏ rủ). Phía sau đảo, mặt cỏ chạm bãi cát mỏng. Lối duy nhất từ mặt cỏ xuống bến
là bậc thang gỗ.

## 2. Dữ liệu bố cục (`island/island-layout.json` = `manifest.data.island`)

```js
{ width:2560, height:1600, tile:64,
  terrain:'island-terrain-base', gridOverlay:'island-terrain-grid',
  walkArea:[[x,y],...],      // đa giác đi lại: mặt cỏ (thu vào ~2.5%) + bậc thang + vịnh cát + cầu cảng
  buildCells:[[col,row],...],// 61 ô trống để xây sau (chỉ những ô nằm trọn trong walkArea, không đè vật)
  objects:[{asset,x,y,flipX}],// 73 vật ban đầu; x,y = điểm đế (trùng origin sprite)
  spawn:{avatar:[1284,760], pet:[1470,790]},
  petArea:[1516,746],
  placeable:[...30 id]       // cây, bụi, hoa, đá, luống, ghế, đèn, rào, chậu, tượng, đài phun, xích đu…
}
```

## 3. Lưới và quy tắc đặt vật

- **1 ô = 64 × 64 đơn vị**; ô (col,row) phủ `[col·64, (col+1)·64) × [row·64, (row+1)·64)`.
- `island/terrain/island-grid.png` (2560×1600, 1×): chấm & nét đứt trắng mờ trong `walkArea`,
  ô xây trống tô vàng nhạt bo góc, viền `walkArea` nét đứt. Chỉ bật khi ở chế độ xây/trang trí.
- **Origin = đế chạm đất.** Mọi sprite đứng có `origin` trong manifest (ví dụ nhà `[0.5, 0.92]`).
  Đặt sprite tại `(x, y)` của đế → bóng đổ và chân vật nằm đúng chỗ. Canvas luôn **cân giữa
  quanh đế theo chiều ngang** nên `flipX` không làm lệch vật.
- **Footprint** `[cols, rows]`: vật chiếm `cols` ô ngang, căn giữa theo x của đế, và `rows` ô
  *phía trên* đế (đế = mép trước footprint). Ví dụ nhà chính 4×3 đặt ở (1284, 652) chiếm
  x 1156–1412, y 460–652.
- **Lớp vẽ** (`layer` trong manifest):
  - `background`: nền đảo, depth thấp nhất.
  - `ground`: decal mặt đất (ao, đường, cát, thảm hoa, cầu ván, cầu cảng, sông, vỏ sò, lá súng) —
    vẽ ngay trên nền, dưới mọi vật đứng (ví dụ depth = 1 + y·0.001).
  - `object`: vật đứng — `setDepth(y)` theo y của đế.
  - `overlay`: lưới tham chiếu, luôn trên cùng khi bật.
- Đèn có thêm `lightSource {x, y, radius, color}` (toạ độ tương đối với đế, đơn vị thế giới) để
  Phaser vẽ quầng sáng ban đêm (additive). Quầng sáng mềm ban ngày đã vẽ sẵn trong sprite.
- Texture @2x: hiển thị với `scale 0.5` (đã ghi trong manifest). `worldSize` = kích thước theo
  đơn vị thế giới.
- Mảnh ghép (tile): `fence-h`/`fence-gate` có origin ở **chân cột trái**, đoạn kế tiếp đặt ở
  `x + 64`, kết thúc bằng `fence-post`. `fence-v` có origin ở chân cột dưới, đoạn kế tiếp ở
  `y − 64`. `path-straight` (128×64) và `river-straight` (128×128) ghép liền hai đầu;
  `pier-segment` ghép theo trục y mỗi 128 đơn vị.

## 4. Thư viện tài sản

### Công trình (`island/buildings/`, 16)

| id | Footprint | Ghi chú |
|---|---|---|
| `house-main`, `house-main-blue`, `house-main-lavender` | 4×3 | Nhà của bé: mái vảy cá, mặt hồi với cửa sổ tròn, ống khói có khói, cửa sổ chớp + hộp hoa, hiên gỗ, đèn tường, bụi hoa. 3 phối màu |
| `cottage-1` / `-2` / `-3` | 3×2 | Mái dốc xanh ngọc · mái tròn lợp rơm · nhà chữ A mái tím |
| `bunny-hutch` | 2×1 | Chuồng thỏ trên chân, lưới, thỏ nhìn ra, cà rốt, cỏ khô |
| `pet-house` | 2×1 | Nhà gỗ thú cưng, cửa vòm, biển xương (không chữ), bát ăn |
| `barn` | 3×2 | Kho thóc/chuồng gà đỏ hồng, mái hai tầng, cửa chữ X, gà con |
| `school` | 4×3 | Tháp chuông, cờ, đồng hồ (không số), cửa đôi |
| `grocery` | 4×2 | Mái hiên sọc hồng-trắng, bảng hiệu hình trái cây (không chữ), kệ trái cây |
| `workshop` | 3×2 | Tường gỗ, cửa kho, bánh răng, đống gỗ, ngựa cưa |
| `art-studio` | 3×2 | Ô kính mái, bảng màu, vết sơn, giá vẽ |
| `greenhouse` | 3×2 | Khung trắng, mái vòm kính, cây và chậu bên trong |
| `lighthouse` | 2×2 | Tháp sọc đỏ-trắng, phòng đèn phát sáng, nhà nhỏ ở chân |
| `submarine-station` | 4×3 | Nhà trạm trên cầu cảng + tàu ngầm vàng; đặt ở mép nước |

### Cây (`island/trees/`, 10)

`oak-1`, `oak-2` (sồi tròn), `pine-1`, `pine-2` (thông/linh sam), `apple-tree`, `orange-tree`,
`blossom-tree` (hoa hồng phấn), `palm` (dừa), `great-tree` (cổ thụ 3×2: xích đu, sàn nhà cây,
thang dây, cờ đuôi nheo), `magic-tree` (tán lavender phát sáng, quả cầu sáng). Footprint 1×1
trừ cổ thụ.

### Cây bụi, hoa, cỏ (`island/plants/`, 19)

`bush-1` (tròn), `bush-2` (quả mọng), `bush-3` (cẩm tú cầu); hoa `flower-pink`, `-yellow`,
`-lavender`, `-white`, `-tulip`, `-blue`; cỏ `grass-1..3`; nấm `mushroom-red`,
`mushroom-brown`, `mushroom-glow`; `hedge-long` (2×1), `hedge-small`; `lilypad-1`, `lilypad-2`
(lớp ground, đặt trên mặt nước).

### Địa hình (`island/terrain/`, 14 sprite + nền/lưới/tham chiếu)

Đá `rock-1..3`, `rock-mossy`; `pond`; luống vườn 2×1 theo 3 trạng thái `plot-empty` →
`plot-sprout` → `plot-growing`; decal `path-stones`, `path-straight`, `path-curve`, `path-end`,
`sand-patch`, `meadow`.

### Trang trí (`island/decorations/`, 24)

Ghế `bench-wood`, `bench-garden`; đèn `lamp-street`, `lamp-mushroom`; rào `fence-h`, `fence-v`,
`fence-post`, `fence-gate`; biển trống `sign-board`, `sign-arrow`; cầu `bridge-arch`,
`bridge-plank`; `mailbox`; `birdhouse`; `windmill` (**spritesheet 4 khung**, animation
`windmill-spin`); tượng `statue-bunny`, `fountain`; `pet-bed`; `picnic-blanket`;
`flower-pot-1`, `flower-pot-2`; `swing`; `well`; `lantern-string`.

### Môi trường dùng chung (`environment/`, 14)

`waterfall` (**spritesheet 4 khung**, animation `waterfall-flow`, 8 fps), `river-straight`,
`river-curve` (decal ghép), san hô `coral-pink`, `coral-orange`, `coral-lavender`, `sea-rock`,
ao `pond-round`, `pond-long`, cầu cảng `pier-segment`, `pier-end`, `shell-pink`, `starfish`,
`shells-cluster`.

## 5. Kiểm soát chất lượng

- Mọi sprite được vẽ trên canvas có đệm rồi **tự cắt sát nội dung + lề 6 đơn vị** (kể cả bóng
  và quầng sáng); generator kiểm tra lại lề 4 đơn vị và in cảnh báo nếu chạm mép (mảnh ghép
  tile được miễn vì phải chạm mép để nối liền).
- Kiểm tra từng khung spritesheet không tràn sang khung bên cạnh.
- Nền trong suốt, không có viền trắng (vẽ trực tiếp lên canvas trong suốt).
- Ảnh tham chiếu `island/terrain/island-reference.webp`: nền + toàn bộ 73 vật theo bố cục, sắp
  theo y. Chỉ để duyệt, không dùng trong game.
- Kích thước: nền ≈ 130 KB; phần lớn sprite < 100 KB.

## 6. Còn thiếu / điểm yếu (thật thà)

- `great-tree.png` khoảng 290 KB và `windmill.png` (4 khung) khoảng 210 KB, vượt mốc 200 KB
  (nhiều gradient). Có thể nén lại bằng công cụ lượng tử hoá PNG nếu cần.
- `fence-v` (rào chạy dọc) chỉ là một cột cọc nhọn chồng lên nhau, khó đọc hơn rào ngang. Chưa
  có mảnh góc rào riêng (dùng `fence-post` làm góc).
- Thác nước và đài phun chỉ có chuyển động đơn giản (thác 4 khung; đài phun tĩnh). Chưa có
  khói ống khói động hay lá rơi.
- `submarine-station` vẽ sẵn một mảng nước nhỏ dưới tàu ngầm; khi đặt trên cỏ sẽ trông lạc chỗ,
  nên chỉ đặt ở mép nước.
- Chưa có biến thể theo mùa/ban đêm cho nền đảo; chưa có cửa sổ sáng đèn ban đêm cho nhà (kit
  `windowBox({lit:true})` đã hỗ trợ, chỉ cần thêm biến thể).
- Nhà chưa có nội thất/cửa mở; cầu `bridge-plank` trông khá phẳng.
- Vùng `walkArea` là đa giác thủ công: bãi cát phía trước (ngoài vịnh cầu cảng) chưa đi được,
  vì vách đất chặn.
