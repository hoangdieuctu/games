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

## Việc khác của kho (đã đẩy lên main)
- Game chuyển từ `/games/<tên>/` lên `/<tên>/` (commit 0968a1a). Mọi game có link về trang chủ (66376ba).
- Ẩn khỏi trang chủ (bọc `<template data-hidden>` trong `index.html`): spot, aquarium, tetris, umbala,
  gate-of-life, gunny, pikachu. Đổi tên: Little World → Thế Giới Nhỏ, Sắp Xếp Sắc Màu 3D → Xếp Bi.
- Icon Sinh Tử Môn = vũ khí mặc định Kiếm Đơn (7fa531c).

## Đang dở / làm tiếp
1. **Thống nhất nút back theo kiểu Xếp Bi (colorsort) cho mọi game** — đang giao cho agent phụ lúc tắt máy.
   Kiểm tra `git log` xem đã có commit "Thống nhất nút về trang chủ…" chưa; nếu chưa, làm lại.
   Sau đó áp dụng cùng nút cho Thế Giới Nhỏ (hiện là nút ‹ tròn ở `src/page.html`, `.back` trong `src/style.css`).
2. Cập nhật thẻ trang chủ (`../index.html`): tag "Phase 1" và mô tả → mô tả gameplay mới.
3. Kiểm tra thêm trên iPad dọc (768×1024) các màn chơi; ảnh chụp mới cho `docs/screenshots/`.
4. Ý tưởng tiếp: thêm hoạt động (tô màu, nấu ăn, chăm thú), bộ sưu tập thú, mùa/ban đêm cho đảo, tiếng Anh.

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
