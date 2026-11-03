# Kho trò chơi

Trang web tĩnh, chạy trên GitHub Pages. Mở `index.html` để vào trang chủ.

## Cấu trúc

```
index.html        trang chủ
games/<tên>/      mỗi game một thư mục, mở bằng index.html
shared/sounds/    âm thanh dùng chung
tools/            bộ gộp mã nguồn
404.html          chuyển link cũ sang chỗ mới
```

## Thêm game mới

1. Tạo `games/<tên>/index.html`.
2. Nút quay lại trỏ về `../../index.html`.
3. Thêm thẻ game vào `index.html`.

## Game có thư mục `src/`

`aquarium`, `colorsort`, `spot`: sửa trong `src/`, rồi chạy

```
node games/<tên>/build.mjs
```

Đừng sửa trực tiếp `index.html` của các game này.
