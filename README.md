# Kho trò chơi

Trang web tĩnh (GitHub Pages), không cần build để chạy: mở `index.html` là vào kho trò chơi.

## Cấu trúc thư mục

```
index.html            Trang chủ: danh sách thẻ game (thẻ có `hidden` là game đang ẩn)
404.html              Chuyển link cũ (caro.html, tiger/…) sang games/<tên>/, giữ ?… và #room=…
games/<tên>/          Mỗi game một thư mục, luôn mở bằng games/<tên>/index.html
  index.html          Trang game (đa số game là một tệp tự chứa)
  icon.png            Biểu tượng 180×180 khi thêm vào màn hình chính (nếu có)
  img/ sounds/        Ảnh, âm thanh riêng của game
  src/ + build.mjs    Game viết tách tệp, gộp thành index.html (xem dưới)
  js/ css/            Game dùng ES module chạy trực tiếp (cần mở qua web, không chạy bằng file://)
shared/sounds/        Âm thanh dùng chung (xúc xắc, vó ngựa) — cangua, typhu, typhu6
tools/bundle.mjs      Bộ gộp dùng chung cho các game có src/
```

## Các game

| Thư mục | Tên | Loại |
|---|---|---|
| amongus-online | Kẻ Giả Mạo Online | online |
| amongus | Kẻ Giả Mạo · Phi Hành Đoàn | offline, ẩn |
| animals | 100 Động Vật (có service worker `sw.js` cache ảnh) | offline |
| aquarium | Hồ Cá Thư Giãn — `src/` | offline |
| battleship | Hải Chiến | online |
| bubbles | Bong Bóng Vui | offline |
| cangua | Cờ Cá Ngựa | online |
| caro | Cờ Caro | online |
| colorsort | Sắp Xếp Sắc Màu 3D — `src/` | offline |
| dichua | Đi Chùa Online | online |
| dongnuoc | Đong Nước | offline, ẩn |
| duaxe | Đua Xe Gõ Chữ | online |
| duaxega | Đua Xe Gà | online, ẩn |
| fish | Bể Cá | offline |
| flags | Cờ Các Nước | offline |
| gate-of-life | Game Of Life | offline |
| jewel | Jewel Pop | offline |
| matching | Ghép Đôi | offline |
| meono | Mèo Nổ | offline, ẩn |
| mole | Chuột Chũi Thò Lên | chưa có trên trang chủ |
| newhome | Nhà Mới Của Chúng Ta — `js/`, xem DESIGN.md | offline, ẩn |
| numbers | Học Đếm Số | offline |
| pikachu | Nối Hình Pikachu | offline |
| princess | Công Chúa Lấp Lánh — `js/` | chưa có trên trang chủ |
| restaurant | Nhà Hàng Vui Vẻ — `js/` | chưa có trên trang chủ |
| spa | Spa Bờ Biển Xanh — `js/` | chưa có trên trang chủ |
| spot | Tìm Điểm Khác Nhau — `src/` | offline |
| tetris | Tetris | offline |
| tienlen | Tiến Lên Miền Nam | online |
| tiger | Bé Yêu Hổ | offline |
| typhu | Cờ Tỷ Phú | online |
| typhu6 | Cờ Tỷ Phú Lục Giác · 6 người | online |
| umbala | Úm Ba La! | offline |
| xito | Xì Tố | online |

## Game có `src/` (aquarium, colorsort, spot)

Sửa trong `games/<tên>/src/`, rồi gộp lại thành `index.html` tự chứa (chạy được cả khi
nháy đúp / AirDrop sang iPad):

```
node games/colorsort/build.mjs
```

`index.html` của các game này là tệp sinh ra — đừng sửa trực tiếp.

## Thêm game mới

1. Tạo `games/<tên>/index.html` (+ `icon.png` nếu muốn biểu tượng riêng).
2. Nút quay lại trỏ về `../../index.html`; âm thanh chung lấy từ `../../shared/sounds/`.
3. Thêm thẻ vào `index.html` với `href="games/<tên>/index.html"`.
