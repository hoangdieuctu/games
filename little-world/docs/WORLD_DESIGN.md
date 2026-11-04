# Little World — Thiết kế Bản đồ Thế giới & 6 Vùng

Bản đồ thế giới là **một vùng địa lý liền mạch**: một lục địa hình chữ C ôm lấy **Vịnh Trung Tâm**,
giữa vịnh là **Đảo Nhà** của bé. Vịnh mở ra **Đại Dương Phiêu Lưu** ở phía đông; **Đảo Động Vật**
là một đảo lớn tách riêng ở phía tây nam, nối bằng cầu gỗ qua eo biển. Các vùng nối nhau bằng
đường cát uốn lượn, cầu gỗ, sông và tuyến thuyền.

Generator: `art/gen-world.mjs` (mã vẽ trong `art/lib/world-*.mjs`), tất định, chạy lại được:

```
PLAYWRIGHT_CORE=<thư mục playwright-core> node little-world/art/gen-world.mjs
# lặp nhanh một phần (KHÔNG ghi manifest): ONLY=base | landmarks | ui | bg (có thể ghép bằng dấu phẩy)
```

| File mã | Nội dung |
|---|---|
| `art/lib/world-layout.mjs` | Toàn bộ địa lý: bờ biển, đảo nhỏ, sông, hồ, đường, cầu, polygon vùng, vị trí mốc |
| `art/lib/world-geo.mjs` | Spline, dải sông, rải điểm, khoảng cách |
| `art/lib/world-kit.mjs` | Đạo cụ vẽ chung: cây, thông, cọ, nấm, nhà, núi, mây, thuyền, cầu, cửa, mái… |
| `art/lib/world-map.mjs` + `world-map-detail.mjs` | Ảnh nền bản đồ: biển, bờ 2.5D, sắc độ vùng, sông, đường, rừng, ruộng, phố, san hô |
| `art/lib/world-landmarks-a.mjs` / `-b.mjs` | 26 sprite mốc + Đảo Nhà |
| `art/lib/world-ui.mjs` | Icon vùng, cổng vào, mây khoá vùng, UI bản đồ, trang trí động |
| `art/lib/world-scenes.mjs` | 6 ảnh nền cảnh bên trong vùng |

## 1. Bố cục bản đồ (3840 × 2160, toạ độ px ở scale 1)

```
 ┌────────────────────────────────────── biển ────────────────────────────────────────┐
 │  RỪNG CÂU ĐỐ (tím/bạc hà)   │  NÚI TOÁN HỌC (cam đào)    │ THỊ TRẤN SÁNG TẠO (hồng)│ la bàn
 │  mê cung · cây phép ·       │ tháp xúc xắc · ĐỈNH NÚI ·  │ xưởng vẽ · cần cẩu ·     │
 │  cổng ghép hình · nấm ·     │ khối bay · vườn trái cây   │ dãy nhà màu · xưởng mộc  │  đảo dừa
 │  vòng đá   ~~sông Rừng~~    │     ~~sông Toán~~ ↓        │        ~~sông Phố~~ ↓    │
 │        ╲________ đường vòng quanh vịnh ______________________________╱  CẦU KÊNH  │
 │ ĐẢO ĐỘNG VẬT    ╲     VỊNH TRUNG TÂM   ( ĐẢO NHÀ )  thuyền ~~~~~~~~~~~~~~~~~~~~~~~~ │
 │ thác nước ·  ═cầu═ ╲______________ cầu ↓ _______________╱   ĐẠI DƯƠNG PHIÊU LƯU    │
 │ cây cổ thụ ·        LÀNG KỸ NĂNG (vàng ruộng lúa)           bến tàu ngầm · rạn san │
 │ nhà thú · chuồng    trường · tạp hoá · bếp · sân chơi ·     hô · hang biển · cá voi │
 │ trại                vườn rau cộng đồng                      đảo nhỏ, phao, tuyến tàu│
 └─────────────────────────────────────────────────────────────────────────────────────┘
```

- Hướng nhìn **3/4 từ trên xuống**: mặt đất nhìn từ trên, vật đứng (núi, nhà, cây) nhìn chính diện.
  Núi được xếp ở **mép trên** (xa người xem) nên đọc tự nhiên.
- Lục địa có **vách đất 2.5D** (bản sao bờ lệch xuống 26px màu cát sẫm), viền cát, vệt bọt sóng và hai
  dải nước nông màu ngọc quanh mọi bờ.
- Ánh sáng trên-trái; bóng lavender; viền màu (xem `ART_GUIDELINES.md`). Nét trên bản đồ 1× dày 2.4–5px.

## 2. Các vùng

Toạ độ đầy đủ (polygon, tâm, nhãn, cổng, mốc) nằm trong `world-map/world-map.json`. Màu chủ đạo
(`color`) là màu dùng cho viền hover, nhãn và icon.

### 2.1 Đảo Động Vật — Animal Island · `animal-island` · `#6cc46a` (mở khoá trong demo)
- **Vị trí**: đảo lớn tây nam (x 110–1000, y 1150–2010), nối lục địa bằng cầu gỗ dài qua eo biển (1150→985, y 1560).
- **Không khí**: xanh lá tươi, rừng tròn + thông, ao lá sen, đồng cỏ có hàng rào và đàn cừu, sông chảy từ thác ra biển phía nam.
- **Mốc**: `waterfall` thác nước trên vách đá (ao + cầu vồng, đổ vào sông), `big-tree` cây cổ thụ có nhà trên cây
  (thang dây, xích đu lốp xe), `animal-houses` hang thỏ + nhà gấu + chuồng chim, `barn` chuồng trại đỏ + silo + gà.
- **Gameplay tương lai**: chăm sóc thú, nhận biết môi trường sống (rừng/ao/đồng cỏ), cho thú ăn, đếm thú.

### 2.2 Rừng Câu Đố — Puzzle Forest · `puzzle-forest` · `#9b85d9` (khoá)
- **Vị trí**: tây bắc (x 250–1470, y 120–1190).
- **Không khí**: phép thuật dịu dàng — cây tán tím/xanh dương/ngọc, nấm nhiều màu phát sáng, quả cầu ánh sáng,
  cỏ ngả bạc hà–tím; đường mòn nhỏ chia nhánh như mê lộ, nhiều cầu gỗ qua suối.
- **Mốc**: `magic-tree` cây phép (đèn lồng, quả sáng), `mushrooms` cụm nấm khổng lồ (nấm lớn có cửa),
  `jigsaw-arch` cổng vòm đá ghép hình, `maze` mê cung hàng rào (chòi sao ở giữa), `rune-stones` vòng đá ký hiệu
  hình học phát sáng + tinh thể (không có chữ).
- **Gameplay tương lai**: ghép hình, tìm đường trong mê cung, tìm quy luật ký hiệu, trò "tìm vật ẩn".

### 2.3 Núi Toán Học — Math Mountain · `math-mountain` · `#ff9d5c` (mở khoá trong demo)
- **Vị trí**: bắc trung tâm (x 1400–2650, y 80–860), dãy núi tròn hiền màu đào/cam (núi xa tím hồng), hồ trên núi
  là nguồn sông Toán chảy xuống vịnh.
- **Không khí**: ấm áp, nắng sớm; rải xúc xắc, kim tự tháp, quả cầu — chủ đề hình khối và số lượng (chấm xúc xắc),
  không dùng chữ số.
- **Mốc**: `peak` đỉnh núi chính (bậc khối màu leo zíc zắc, rào hạt bàn tính, cờ đỉnh, đài quan sát),
  `floating-blocks` các đảo khối hình học bay, `dice-tower` tháp xúc xắc (mặt 5-3-6), `fruit-garden` vườn trái cây.
- **Gameplay tương lai**: đếm, so sánh, nhận dạng hình, xếp khối, hái/đếm trái cây.

### 2.4 Thị Trấn Sáng Tạo — Creative Town · `creative-town` · `#f58aa8` (khoá)
- **Vị trí**: đông bắc (x 2600–3640, y 90–1050).
- **Không khí**: nhà nhiều màu mái tròn/nhọn, quảng trường lát gạch hồng có đài phun nước, luống hoa, cây hoa anh đào,
  giá vẽ ngoài trời.
- **Mốc**: `art-studio` xưởng vẽ mái hình bảng màu + cây cọ khổng lồ, `houses` dãy nhà cao nhiều màu có cờ dây,
  `crane` công trường (cần cẩu, giàn giáo, cọc giao thông), `workshop` xưởng mộc biển bánh răng.
- **Gameplay tương lai**: tô màu, vẽ, lắp ghép/xây dựng, trang trí nhà.

### 2.5 Làng Kỹ Năng — Life Skills Village · `life-skills-village` · `#f5c242` (mở khoá trong demo)
- **Vị trí**: bán đảo phía nam (x 1100–3010, y 1140–2060), sát bờ nam vịnh — cầu từ Đảo Nhà đổ thẳng vào quảng trường làng.
- **Không khí**: ruộng chắp vá vàng/xanh, đống rơm, vườn cây ăn quả, nhà mái cam, hàng rào.
- **Mốc**: `school` trường học có tháp chuông và đồng hồ (không số), `grocery` tạp hoá mái hiên sọc + thùng trái cây,
  `kitchen` nhà bếp cộng đồng (ống khói bốc khói, biển hình nồi), `playground` sân chơi (cầu trượt, xích đu, bập bênh,
  hố cát), `garden` vườn rau cộng đồng (bắp cải, cà chua, cà rốt, bù nhìn).
- **Gameplay tương lai**: đi chợ, nấu ăn, chuẩn bị đến trường, trồng rau, an toàn khi chơi.

### 2.6 Đại Dương Phiêu Lưu — Adventure Ocean · `adventure-ocean` · `#3d9ad6` (khoá)
- **Vị trí**: biển phía đông/đông nam (x 2350–3810, y 930–2130), gồm cửa vịnh.
- **Không khí**: biển xanh sâu dần, nhiều đảo nhỏ có dừa, rạn san hô dưới nước (san hô cành, san hô não, rong),
  phao, tuyến tàu nét đứt nối bến với các đảo.
- **Mốc**: `submarine-dock` bến gỗ + tàu ngầm vàng (bờ đông bán đảo Làng), `coral-reef` rạn san hô có cá và rùa,
  `sea-cave` hang biển phát sáng trên đảo đá, `palm-hut` chòi sàn lá dừa + rương báu.
- **Gameplay tương lai**: khám phá dưới nước bằng tàu ngầm, nhận biết sinh vật biển, dọn rác biển.

### 2.7 Đảo Nhà (Personal Island)
- `world-map-home-island` đặt tại `homeIsland` (1960, 1105) — điểm neo là **tâm đảo**. Gồm nền đảo (cát, vách, cỏ),
  nhà mái hồng, 3 ô xây dựng trống (nét đứt), cây, hòm thư, bến gỗ nhỏ. Vùng nước nông quanh đảo đã nướng sẵn ở nền.
- Cầu gỗ dài nối đảo với quảng trường Làng Kỹ Năng.

## 3. Kết nối & đường đi
- **Đường vòng quanh vịnh**: Làng → bờ tây vịnh → chân Núi Toán → Thị Trấn; nhánh vào Rừng Câu Đố, lên đỉnh núi,
  qua các khu trong làng, tới bến tàu ngầm.
- **Cầu lớn**: Đảo Nhà ↔ bờ nam; cầu qua cửa kênh (Thị Trấn ↔ Làng); cầu qua eo biển sang Đảo Động Vật.
- **Cầu nhỏ** được tính **tự động** ở mọi chỗ đường cắt sông (`riverCrossings()`).
- **Tuyến thuyền** (nét đứt trắng): Đảo Nhà → cửa vịnh → đảo dừa; bến tàu ngầm → các đảo.

## 4. Khoá / mở khoá
- **Khoá**: sprite `regions/<id>/locked-overlay.png` — mây phép bông, viền lavender ngả màu vùng, có các đám mây
  nổi và lấp lánh, phủ **đúng hình polygon** vùng. Đặt ở `lockedOverlay.x, y` (tâm sprite), scale 1, depth trên mốc.
  Thêm `ui/lock-badge.png` cạnh nhãn tên. Mây hơi trong (≈0.9) để vẫn thấy thoáng sắc màu vùng.
- **Mở khoá**: bỏ overlay (tween alpha → 0, có thể phóng nhẹ), phát `ui/unlocked-sparkle.png` tại `label`.
- Demo: mở `animal-island`, `math-mountain`, `life-skills-village`; khoá `puzzle-forest`, `creative-town`, `adventure-ocean`.

## 5. Thứ tự lớp (depth) gợi ý trong Phaser
1. `world-map-base` (0,0) — depth 0.
2. Trang trí mặt nước: `wave-sparkle`, `fish-jump`, `whale`, `boat` — depth 10.
3. `homeIsland` và mọi `landmarks` — `setDepth(100 + y)` (y = đế).
4. `decorations` có `drift` (mây, mòng biển) — depth 3000.
5. `lockedOverlay` — depth 4000; nhãn tên + icon + ổ khoá — 5000; UI (la bàn, ghim) — 6000.
6. `cloud-transition` — trên cùng khi chuyển cảnh.
- Hover/hit-test: dùng `polygon` (Phaser `Geom.Polygon.Contains`), vẽ viền `color` khi hover.

## 6. Hệ toạ độ & manifest
- Bản đồ: 1 px = 1 đơn vị, gốc trên-trái, kích thước 3840 × 2160.
- Sprite mốc/icon/cổng/UI xuất **@2x**, manifest `scale: 0.5`; `origin` tính tự động từ điểm đế (mốc, cổng)
  hoặc tâm (icon, overlay, đảo nhà). `width/height` trong manifest là **kích thước texture (px)**.
- Overlay khoá và `cloud-transition` xuất 1×, `scale: 1`.
- Ảnh nền vùng 1920 × 1080 WebP, `origin [0,0]`.
- Dữ liệu: `manifest.data.world` (nhóm `world`) và bản sao `public/assets/world-map/world-map.json`, cấu trúc
  `{ width, height, background, homeIsland, regions[], decorations[] }`.
- Spritesheet (1 hàng): `world-map-seagull` (4 khung, `seagull-flap`), `world-map-whale` (6 khung, `whale-spout`),
  `world-map-wave-sparkle` (4 khung), `world-map-fish-jump` (5 khung).

## 7. Ảnh nền vùng (`regions/<id>/background.webp`)
Mỗi cảnh: trời → lớp xa → đồi/mặt đất → vật đứng (sắp theo y) → khung bụi hoa tiền cảnh. Vùng giữa-dưới
(x ≈ 480–1440, y ≈ 700–1000) để thoáng (đồng cỏ, quảng trường, lối đi, mặt biển).

| Vùng | Cảnh |
|---|---|
| Đảo Động Vật | trời xanh, thác nước, cây cổ thụ, nhà thú, chuồng trại, lối đi cát |
| Rừng Câu Đố | hoàng hôn tím có sao và trăng, rừng tím, cây phép, cổng ghép hình, nấm, đá ký hiệu, đốm sáng |
| Núi Toán Học | dãy núi đào/tím, khối bay, tháp xúc xắc, vườn trái cây, suối, khối hình học |
| Thị Trấn Sáng Tạo | dãy nhà màu xa, cần cẩu, xưởng vẽ, dãy nhà cao, quảng trường gạch hồng |
| Làng Kỹ Năng | ruộng và nhà xa, trường, tạp hoá, bếp, sân chơi, vườn cây, lối đi |
| Đại Dương Phiêu Lưu | biển và đảo, hang biển, chòi dừa, bến tàu ngầm, rạn san hô, bãi cát tiền cảnh |

## 8. Danh sách tài sản

| Nhóm | File |
|---|---|
| Bản đồ | `world-map/world-map-base.webp` (~1.2 MB), `world-map/home-island.png`, `world-map/world-map.json` |
| Mỗi vùng (×6) | `icon.png`, `entrance.png`, `background.webp`, `locked-overlay.png`, 4–5 mốc `<key>.png` |
| UI | `ui/lock-badge.png`, `ui/unlocked-sparkle.png`, `ui/map-pin.png`, `ui/compass.png` |
| Trang trí | `world-map/cloud-1..3.png`, `boat.png`, `seagull.png`, `whale.png`, `wave-sparkle.png`, `fish-jump.png` |
| Đường & chuyển cảnh | `world-map/footprints.png`, `path-dash.png`, `bridge-wood.png`, `bridge-stone.png`, `cloud-transition.png` |

## 9. Còn thiếu / hạn chế (thành thật)
- **Nhãn tên** chưa có khung/bảng riêng — Phaser tự vẽ (biển trống trên cổng có sẵn để in tên).
- Cổng vào (`entrance`) thiết kế cho cảnh vùng (~300 đơn vị ở scale 0.5); trên bản đồ cần thu nhỏ (~0.2) nên khá bé.
- Overlay khoá là PNG lớn (0.5–0.85 MB mỗi vùng, ~3.6 MB tổng). Có thể chuyển sang WebP có alpha nếu cần nhẹ hơn.
- Ảnh nền vùng là cảnh tĩnh một lớp (đã gộp); **chưa tách lớp parallax** riêng.
- Mốc trên bản đồ chưa có trạng thái "highlight" riêng — dùng tint/glow của Phaser (hoặc `unlocked-sparkle`).
- Chưa có hoạt ảnh nước chảy cho thác/sông (chỉ có sprite tĩnh + trang trí động trên biển).
- Một vài vật nhỏ nướng sẵn (nhà nhỏ, cây) có thể bị mốc che một phần ở rìa — chấp nhận được nhưng chưa tinh chỉnh từng chỗ.
- Viền hover/hit-test vùng chỉ dựa trên polygon thô (10–19 điểm), không bám sát từng khúc bờ biển.
