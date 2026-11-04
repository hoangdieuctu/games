# Little World — Hình cho mini-game (Phase 2)

Sinh bởi `art/gen-play.mjs` (+ `art/lib/play-animals.mjs`, `art/lib/play-objects.mjs`), dùng chung
bảng màu, viền, gradient và vệt sáng của `art/lib/style.mjs` (xem `ART_GUIDELINES.md`).
Tất cả là PNG @2x (manifest `scale 0.5`). Dữ liệu trò chơi nằm ở `manifest.data.play`.

```
PLAYWRIGHT_CORE=<playwright-core> node little-world/art/gen-play.mjs   # PREVIEW=<file.png> để có ảnh tổng hợp
node little-world/art/build-manifest.mjs
```

Khác với tài sản đảo, các hình ở đây **giữ đúng khung cố định** (không cắt sát nội dung), vì mã game
dựa vào kích thước chính xác. Kênh màu được lượng tử hoá nhẹ (bước 4) để giảm dung lượng (~2,2 MB cho 73 hình).

| Nhóm (`play/…`) | Khung (đơn vị) | ID | Ghi chú |
|---|---|---|---|
| animals | 200×200 | `animal-cat, -dog, -cow, -pig, -duck, -chick, -sheep, -horse, -rabbit, -frog, -fish, -turtle, -elephant, -lion, -monkey, -owl` | Thú chibi như bộ thú cưng; bóng đất ở đáy; `data.play.animals` có tên, môi trường sống, tiếng kêu |
| habitats | 360×240 | `habitat-farm, -pond, -forest, -savanna` | Thẻ cảnh bo tròn, không có chữ |
| items | 120×120 | `item-apple, -orange, -banana, -strawberry, -carrot, -star, -flower, -mushroom` | Đồ để đếm, có bóng nhỏ |
| shapes | 160×160 (chữ nhật 200×120, bầu dục 180×130) | `shape-circle, -square, -triangle, -rectangle, -star, -heart, -oval, -diamond` | Hình lấp kín khung, **không** có bóng ngoài silhouette → dùng được với `setTintFill` làm ô bóng |
| shapes | 1000×620 | `play-board-wood` | Khay gỗ đặt các ô bóng |
| blocks | đúng kích thước thân vật lý | `block-cube-{red,yellow,blue,green}` 64×64, `block-plank` 192×32, `block-pillar-{orange,purple}` 32×128, `block-roof-{red,blue}` 128×64 (tam giác), `block-dome-yellow` 128×64 (nửa tròn), `block-window` 64×64, `block-door` 64×96, `block-ground` 1200×60 | Không đệm, không bóng; `data.play.blocks[].body` = `rect`/`triangle`/`semicircle` |
| cards | 160×200 | `card-back, card-front` | Lật thẻ ghi nhớ |
| rewards | 96×96 | `reward-star, -seed, -wood, -stone, -flower, -shell` | Dùng cả trong Phaser và `<img>` HTML |
| sort | 160×190 (origin [0.5,0.95]) | `bin-recycle, bin-organic` | Thùng phân loại rác |
| sort | 300×190 (origin [0.5,0.8]) | `sort-boat` | Thuyền dọn biển, mép nước ở 80% chiều cao |
| sort | 110×110 | `trash-bottle, -can, -paper, -box, -banana-peel, -apple-core, -leaf, -eggshell, -bag` | Rác tái chế / hữu cơ / rác biển |
| sort | 130×130 | `sea-crab, sea-jellyfish, sea-octopus` | Sinh vật biển (dùng cùng `animal-fish`, `animal-turtle`) |
| care | 120×120 | `care-food, -water, -sponge, -ball, -pillow, -brush` | Đồ chăm bạn thú (Phase 3); `data.play.care` nối nhu cầu → đồ, câu nói |
| care | 100×100 | `need-hungry, -thirsty, -dirty, -sleepy, -play, -messy` | Biểu tượng nhu cầu trong bong bóng ý nghĩ |

Tranh tô màu (Bé tô màu) không dùng PNG: vẽ bằng đa giác trong `src/data/Pictures.ts` (khung 600×600),
mỗi vùng là một Graphics có vùng chạm riêng, nên tô được từng ô và đổi kích thước không bị mờ.
