# Kho trò chơi

Trang web tĩnh, chạy trên GitHub Pages. Mở `index.html` để vào trang chủ.

## Cấu trúc

```
index.html        trang chủ
icon.png          icon trang chủ khi thêm vào màn hình chính
<tên>/            mỗi game một thư mục, mở bằng index.html
shared/sounds/    âm thanh dùng chung
404.html          chuyển link cũ sang chỗ mới
```

## Thêm game mới

1. Tạo `<tên>/index.html` và `icon.png` (180×180), thêm
   `<link rel="apple-touch-icon" href="icon.png">` để có icon trên iPad.
2. Nút quay lại trỏ về `../index.html`.
3. Thêm thẻ game vào `index.html`.

## Game có thư mục `src/`

`colorsort`, `little-world`: sửa trong `src/`, rồi chạy

```
node <tên>/build.mjs
```

Đừng sửa trực tiếp `index.html` của các game này.
