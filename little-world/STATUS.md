# Thế Giới Nhỏ — trạng thái làm việc (cập nhật 2026-11-04)

Ghi lại để làm tiếp sau khi tắt máy. Thiết kế gốc: `docs/design-conversation.html`.

## Đã xong
- **Phase 1 (hình ảnh):** bản đồ 6 vùng, đảo, bé ghép lớp, 3 thú cưng (commit cc8f533).
- **Phase 2 (gameplay), commit này:**
  - Hồ sơ bé (nhiều bé/1 máy), chọn tuổi + bạn đồng hành; lưu localStorage có phiên bản (`src/services/Store.ts`).
  - Đảo: dạo chơi, trang trí từ túi đồ, cửa hàng đổi tài nguyên, luống đất gieo hạt → nở hoa → thu hoạch, tự lưu.
  - Bản đồ: vùng mở theo số sao (`REGION_STARS` trong `src/data/Content.ts`), thẻ vùng liệt kê hoạt động.
  - 8 hoạt động (`src/games/`): Tìm bạn thú, Nhà của thú, Lật thẻ, Ghép hình, Đếm và hái (đếm/so sánh/cộng),
    Bé xây dựng (vật lý Matter), Phân loại rác, Biển sạch. Độ khó cấp 1–5 tự điều chỉnh.
  - Phần thưởng, huy hiệu (15), thú cưng nói + đọc tiếng Việt (Speech Synthesis), âm thanh/nhạc tự tổng hợp.
  - Góc phụ huynh (nút ⚙, cổng phép nhân): thống kê, hồ sơ, cài đặt âm thanh/giọng đọc, xoá dữ liệu.
  - Service worker `sw.js` cho chơi ngoại tuyến.
  - Hình gameplay mới vẽ bằng code: `art/gen-play.mjs` (73 tài sản, `docs/GAMEPLAY_ART.md`).
- Đã kiểm thử trên trình duyệt (1280×800 và 390×844): mọi màn hiện đúng, chơi hết 1 game ra bảng thưởng,
  xây khối có trọng lực, thu hoạch hoa, phụ huynh, tải lại trang vẫn giữ tiến trình. Không có lỗi JS.

- **Phase 3 (thêm hoạt động):**
  - 3 trò mới (tổng 11): **Tìm quy luật** (Núi Toán Học, `games/Pattern.ts`: AB → ABCD, ô trống giữa dãy, 2 ô trống),
    **Bé tô màu** (Thị Trấn Sáng Tạo, `games/Coloring.ts` + 6 tranh vẽ bằng đa giác `data/Pictures.ts`; cấp 1–2 tô tự do,
    cấp 3–5 tô theo tranh mẫu), **Chăm bạn thú** (Ngôi Làng Kỹ Năng, `games/PetCare.ts`: đói/khát/buồn ngủ/muốn chơi,
    lấm bùn → chà bọt biển, lông rối → chải lược).
  - 12 hình mới `play/care/*` (đồ chăm thú + biểu tượng nhu cầu) trong `art/lib/play-objects.mjs`; `data.play.care`.
  - 3 huy hiệu mới (tổng 18), 4 tiếng mới (munch, bubble, splash, yawn), `Audio.tone()`; `bigButton` chuyển vào `MiniGame`.
  - Sửa: nút "Về kho trò chơi" đè lên thanh trò chơi (ẩn khi đang chơi — đã có nút ✕). Thẻ trang chủ đã cập nhật.
  - Đã chạy thử tự động cả 3 trò ở 1280×800, 390×844, 768×1024 (cấp 1–5): ra bảng thưởng, không lỗi JS.

## Việc khác của kho (đã đẩy lên main)
- Game chuyển từ `/games/<tên>/` lên `/<tên>/` (commit 0968a1a). Mọi game có link về trang chủ (66376ba).
- Ẩn khỏi trang chủ (bọc `<template data-hidden>` trong `index.html`): spot, aquarium, tetris, umbala,
  gate-of-life, gunny, pikachu. Đổi tên: Little World → Thế Giới Nhỏ, Sắp Xếp Sắc Màu 3D → Xếp Bi.
- Icon Sinh Tử Môn = vũ khí mặc định Kiếm Đơn (7fa531c).

## Đang dở / làm tiếp
1. ~~Nút back thống nhất kiểu Xếp Bi~~ — xong cho mọi game (2f633f1) và Thế Giới Nhỏ. Lỗi có sẵn, chưa sửa:
   chữ "TỔNG" của spa tràn màn hình 390px (typhu/typhu6 nay chặn chơi trên điện thoại); ~13 game có hộp thoại mở đầu che nút back.
2. ~~Cập nhật thẻ trang chủ~~ — xong (Phase 3).
3. Kiểm tra thêm trên iPad dọc (768×1024) các màn chơi; ảnh chụp mới cho `docs/screenshots/`.
4. Ý tưởng tiếp: nấu ăn, bộ sưu tập thú / album tranh đã tô, mùa/ban đêm cho đảo, tiếng Anh.
5. Build cần Node ≥ 22.13 (máy này có Node 20 → `npx -y node@22 little-world/build.mjs`).
   Chromium của playwright-core 1.49.1 không còn trong cache; đã dùng playwright-core 1.60.0 + `PLAYWRIGHT_BROWSERS_PATH`
   trỏ tới thư mục có symlink `chromium_headless_shell-1223` → bản 1228 có sẵn.

## Lệnh hay dùng
```
node little-world/build.mjs                  # gộp src → index.html (sửa trong src/, không sửa index.html)
python3 -m http.server 8765                  # ở thư mục gốc repo
npm i --prefix /tmp/lw-tools playwright-core@1.49.1
PLAYWRIGHT_CORE=/tmp/lw-tools/node_modules/playwright-core node little-world/test/lwtest.mjs 390 844 m
PLAYWRIGHT_CORE=... node little-world/test/lwplay.mjs 1280 800 d   # chơi thử + kiểm tra lưu
PLAYWRIGHT_CORE=... node little-world/art/build-all.mjs            # sinh lại toàn bộ hình
```
Trong trình duyệt: `__lwStore` (bản lưu), `__lw` (Phaser game) để kiểm thử nhanh.

- **Sau Phase 3 (2026-11-04):**
  - Nút toàn màn hình (góc phải trên, cạnh ⚙); tự ẩn nếu trình duyệt không hỗ trợ (iPhone) hoặc đã mở từ màn hình chính.
  - Giọng đọc mới: 753 câu đơn sinh sẵn bằng giọng nơ-ron `vi-VN-HoaiMyNeural` (edge-tts) → `public/assets/voice/*.mp3` + `index.json`.
    `Audio.say()` tách câu theo . ! ?, phát nối các clip, nhạc nền nhỏ lại khi đọc; tên bé được đọc là "bé"; thiếu clip → Speech Synthesis.
  - Chọn bạn đồng hành dời ra góc dưới phải (`#pet-dock`); trên điện thoại là cột ảnh nhỏ ở mép phải.
  - Trò Đếm và hái rút gọn lời thoại cho đỡ tổ hợp (vẫn đọc số): "Hái quả táo bỏ vào giỏ nhé! Cần đủ ba.", "Ba thêm hai là mấy?",
    "Bên này nhiều hơn!"; mở vùng: "X chưa mở. Cần thêm N ngôi sao nữa nhé!"; quy luật tách hai câu → còn 753 câu cần giọng.
  - Luống đất đang lớn: thú cưng nói "Hoa sẽ nở sớm thôi" / "Chờ thêm chút xíu nhé" thay vì đọc số giây.
  - Đảo: bé không đi xuyên vật cản nữa — lưới 16px (đất liền trừ chân nhà, gốc cây, đá, bụi, hồ…; hoa/cỏ/nấm nhỏ đi qua được),
    tìm đường A* rồi làm mượt; chạm vào giữa nhà/hồ → đi tới chỗ gần nhất. Thú cưng trượt dọc vật cản.
