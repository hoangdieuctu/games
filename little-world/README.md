# Thế Giới Nhỏ (Little World)

Game phiêu lưu 2D hoạt hình nguyên bản cho trẻ em, chạy trên Phaser 3. Game được làm qua 4 phase;
thư mục này hiện có **Phase 1 (hình ảnh, thế giới)**, **Phase 2 (gameplay)** và **Phase 3 (thêm hoạt động)**: hồ sơ bé, đảo tự lưu,
11 hoạt động chơi được (mới: Tìm quy luật, Bé tô màu, Chăm bạn thú), phần thưởng, túi đồ, cửa hàng, luống hoa, huy hiệu, âm thanh và góc phụ huynh.
Thiết kế gốc: `docs/design-conversation.html` (hội thoại với ChatGPT) và `docs/GAMEPLAY.md`.

Tất cả hình ảnh được **vẽ bằng code** (SVG sinh từ các script trong `art/`), dùng chung một
bảng màu và quy chuẩn (`docs/ART_GUIDELINES.md`), rồi xuất ra PNG hoặc WebP cho Phaser.
Không có ảnh stock, emoji hay ảnh tạo bằng AI.
Giọng đọc là clip sinh sẵn bằng giọng nơ-ron tiếng Việt (`art/gen-voice.mjs`); câu nào chưa có clip thì dùng giọng đọc của máy.
Khi sửa/thêm lời thoại trong `src/`, thêm mẫu câu tương ứng vào `art/gen-voice.mjs` rồi chạy lại (console in `[voice] chưa có clip` nếu thiếu).

## Cấu trúc

```
index.html               bản demo đã gộp (TỰ ĐỘNG SINH — đừng sửa tay)
build.mjs                gộp src/**/*.ts → index.html
icon.png, thumb.webp     icon iPad và ảnh thẻ trang chủ
src/
  main.ts
  scenes/                BootScene, WorldMapPreviewScene, IslandPreviewScene, CharacterGalleryScene
  services/              AssetLoader (đọc manifest), LayeredAvatar (nhân vật ghép lớp), CameraControls, Ui
  page.html, style.css
public/assets/           toàn bộ tài sản + asset-manifest.json
  world-map/  regions/<6 vùng>/  characters/{avatar,fox,bunny,bear}/
  island/{buildings,trees,plants,decorations,terrain}/  environment/  ui/
art/                     script sinh hình (gen-world, gen-island, gen-characters, gen-icon)
  lib/style.mjs          bảng màu, viền, bóng, gradient dùng chung
  manifest/*.json        manifest từng nhóm → gộp bởi build-manifest.mjs
docs/                    ART_GUIDELINES, ASSET_INVENTORY, WORLD_DESIGN, ISLAND_DESIGN, CHARACTER_DESIGN, screenshots/
```

## Chạy demo

Phaser tải ảnh bằng XHR, nên **không mở được bằng file://**. Cần mở qua máy chủ http:

```
python3 -m http.server 8000      # ở thư mục gốc repo
# rồi mở http://localhost:8000/little-world/   (#island, #map, #wardrobe, #play/<hoạt động>)
```

Demo có ba màn:

- **Bản đồ:**
  - Phóng to và kéo bằng chuột hoặc hai ngón tay.
  - Rê chuột hoặc chạm vào vùng để làm nổi vùng đó.
  - Thẻ thông tin vùng có nút khoá/mở khoá thử và nút xem cảnh bên trong vùng.
- **Đảo của bé:**
  - Ở chế độ *Dạo chơi*, chạm mặt đất để bé đi tới, thú cưng đi theo.
  - Ở chế độ *Sắp xếp*, kéo đồ để di chuyển, chọn đồ trong túi rồi chạm để đặt, có thể lật, nhân bản hoặc cất đồ đi.
  - Có nút bật/tắt lưới.
- **Nhân vật:**
  - Bé được xem ở 4 góc nhìn và có 15 animation.
  - Tuỳ biến được kiểu tóc, gương mặt, áo, quần/váy, giày, phụ kiện, cùng màu da, tóc và quần áo.
  - Ba thú cưng, mỗi con có 10 animation.

## Sinh lại

```
npm i --prefix /tmp/lw-tools playwright-core@1.49.1        # một lần, ngoài repo
export PLAYWRIGHT_CORE=/tmp/lw-tools/node_modules/playwright-core
node little-world/art/build-all.mjs                  # sinh mọi tài sản + manifest + ASSET_INVENTORY.md
node little-world/art/gen-icon.mjs                   # icon.png + thumb.webp
node little-world/build.mjs                          # gộp src → index.html (Node ≥ 22.13, không cần cài gì)

# giọng đọc: mọi câu thú cưng nói → clip giọng nơ-ron vi-VN-HoaiMyNeural (public/assets/voice/)
python3 -m venv /tmp/lw-tts && /tmp/lw-tts/bin/pip install edge-tts     # một lần, ngoài repo; cần ffmpeg
EDGE_TTS=/tmp/lw-tts/bin/edge-tts npx -y node@22 little-world/art/gen-voice.mjs   # chỉ sinh câu mới/đổi
```

## Phase 1: những gì đã có và còn thiếu

| Hạng mục | Trạng thái |
|---|---|
| Bản đồ thế giới liền mạch 3840×2160, 6 vùng nối bằng đường, cầu, sông | ✅ |
| Mỗi vùng: icon, cổng vào, ảnh nền 1920×1080, mây khoá, 3–6 công trình | ✅ |
| Đồ trang trí bản đồ: mây, thuyền, hải âu, cá voi, cá nhảy, la bàn, ghim | ✅ |
| Đảo của bé: nền, lưới tham chiếu, bố cục 73 vật, 61 ô trống để xây | ✅ |
| Thư viện: 16 toà nhà, 10 cây, 19 cây cỏ/hoa, 14 địa hình, 24 đồ trang trí, 14 môi trường | ✅ |
| Bé: 4 góc nhìn, 15 animation, 8 lớp ghép (27 sheet), tô màu theo bảng | ✅ |
| Cáo Cam, Thỏ Bông, Gấu Mật: 3 góc nhìn, 10 animation mỗi con | ✅ |
| Manifest, tài liệu, demo Phaser, ảnh chụp (`docs/screenshots/`) | ✅ |

**Còn thiếu hoặc còn yếu** (chi tiết trong từng tài liệu thiết kế):

- **Ảnh nền vùng:** mỗi ảnh là một lớp phẳng, chưa tách lớp parallax. Ảnh nền đơn giản hơn bản đồ.
- **Nhân vật:**
  - Tay hơi ngắn, nên khi ăn mừng hay vẫy tay, tay chưa giơ cao qua đầu.
  - Khi đi trước/sau, chuyển động chủ yếu là nhún người.
  - Chưa có các tư thế ngồi/ngủ, biểu cảm buồn/ngạc nhiên, hiệu ứng (bụi, tim, sao) và đi chéo.
  - Thú cưng chưa có biến thể màu.
- **Đảo và đồ vật:**
  - Hàng rào dọc khó nhìn, cầu ván hơi phẳng, đài phun nước chưa có animation.
  - Chưa có bản ban đêm/theo mùa và cửa sổ sáng đèn.
- **Bản đồ:**
  - Vùng chọn (polygon) còn thô.
  - Vài nhà vẽ sẵn trên nền ló ra dưới công trình ở Thị Trấn Sáng Tạo.
  - Chưa có nước chảy động.
- **Demo:** di chuyển trên đảo chưa tránh vật cản; đây là phần của phase gameplay sau.
