# Little World — Quy chuẩn hình ảnh (Art Guidelines)

Tài liệu này là "luật" cho mọi tài sản hình ảnh của Little World. Mọi generator trong
`art/` đều dùng chung `art/lib/style.mjs` (bảng màu, viền, bóng, gradient) để toàn bộ
thế giới giữ **một** phong cách.

## 1. Phong cách

Tranh minh hoạ hoạt hình 2D nguyên bản cho trẻ em, độ sâu 2.5D nhẹ.

- Hình khối **tròn, mềm**, không có góc nhọn sắc (bo góc tối thiểu 3 đơn vị).
- **Viền màu** chứ không dùng đen: viền = `ramp(màu).line`, tức cùng tông với vật nhưng tối và đậm hơn.
- Tô màu bằng **gradient mềm**: `doc.vgrad()` cho vật phẳng, `doc.sphere()` cho khối tròn.
- **Vệt sáng bóng** (`gloss`) ở phía trên bên trái của khối tròn: tán cây, quả, đầu nhân vật, mái vòm.
- Chi tiết vừa đủ để nhận ra vật ngay cả khi nhỏ. Không vẽ chi tiết li ti.
- Không dùng emoji, ảnh chụp hay ảnh stock. Không chèn chữ vào tài sản dùng lại; tên và nhãn do Phaser vẽ.

## 2. Bảng màu (`PAL` trong `style.mjs`)

| Nhóm | Màu chính |
|---|---|
| Trời | `sky #a8dcf7`, `skyLight #dff3fd`, `skyDeep #7cc3ee` |
| Biển | `ocean #5ab4e0`, `oceanLight #8fd6f0`, `oceanDeep #3d8ccc`, `oceanAbyss #2f6fae`, `foam #f2fbff` |
| Cỏ/lá | `grass #9fd67c`, `grassLight #c8eb9c`, `grassDark #72b85e`, `leaf #7cc96a`, `mint #a6e3c4` |
| Vàng/cam | `yellow #ffd96b`, `orange #ffac6b`, `peach #ffc9a3`, `coral #ff8f8f` |
| Hồng/tím | `pink #ffb8cb`, `rose #f58aa8`, `lavender #c7b5f0`, `purple #9b85d9` |
| Đất/đá/gỗ | `sand #f6e0ae`, `earth #c99f74`, `soil #a97a57`, `wood #cf9161`, `stone #bdb8ca` |
| Trung tính | `white #fffaf2`, `cream #fff3dc`, `ink #4b3a5e` (nét tối nhất: mắt, miệng) |
| Bóng | `shadow rgba(76,56,118,.22)`: bóng màu tím lavender, **không bao giờ** dùng đen |

Màu sáng ngả về vàng ấm, màu tối ngả về tím (`lighten`/`darken`). Nhờ vậy mọi vật dùng
chung một "ánh sáng chiều" ấm áp.

## 3. Ánh sáng và bóng

- Nguồn sáng đặt ở **trên, bên trái**. Mặt trên và mặt trái sáng hơn, mặt phải và đáy tối hơn.
- Mọi vật đứng trên mặt đất đều có **bóng elip** (`groundShadow`) ngay dưới đế,
  `ry ≈ 0.32·rx`, và lệch nhẹ sang phải.
- Bóng bên trong vật (ví dụ dưới mái hiên, dưới tán lá) dùng `ramp().lo` hoặc `PAL.shadowSoft`.
- Ánh sáng phát ra (đèn, nấm phát sáng, cửa sổ) dùng gradient tròn màu `yellowLight`
  hoặc `lavenderLight`, mờ dần tới trong suốt.

## 4. Góc nhìn

**Nhìn từ trên xuống 3/4 (top-down oblique).** Đây là góc dễ đọc nhất cho việc đặt đồ và di chuyển.

- Mặt đất (cỏ, đường, ao, đảo) được nhìn từ trên xuống, hơi chếch.
- Vật đứng (nhà, cây, đèn, nhân vật) vẽ **nhìn chính diện**, thấy một chút mặt trên
  (khoảng 25–35% chiều sâu: mái nhà và mặt trên bàn ghế đều thấy được).
- Toàn bộ game không dùng isometric. Không trộn các góc nhìn với nhau.
- Thứ tự vẽ theo chiều sâu: sắp theo **y của đế vật** (`setDepth(y)` trong Phaser).
- Điểm neo (`origin`) của vật đứng đặt **ở đế chạm đất**, thường là `[0.5, ~0.9]`.

## 5. Lưới và kích thước

- **1 ô lưới đảo = 64 × 64 đơn vị thế giới.** Đơn vị SVG chính là đơn vị thế giới.
- Texture được xuất ở **@2x** (`scale: 2` khi rasterize); Phaser hiển thị với `scale 0.5`.
  Nhờ vậy ảnh vẫn nét khi camera phóng tới 2×.
- Kích thước tham chiếu (đơn vị thế giới):

| Vật | Rộng × cao (đơn vị) | Số ô chiếm đế |
|---|---|---|
| Nhân vật chính | cao ~84 (khung 96×96) | 1 |
| Thú cưng | cao ~50–60 (khung 80×80) | 1 |
| Hoa, cỏ, nấm | 24–40 | ¼–½ |
| Bụi cây, đá nhỏ | 40–70 | ½–1 |
| Ghế, đèn, hòm thư | 40–90 | 1 |
| Cây | 110–200 cao | 1–2 |
| Nhà nhỏ | ~160–200 rộng | 2×2 |
| Nhà chính, trường, cửa hàng | ~220–300 rộng | 3×2 – 4×3 |
| Hải đăng | ~120 rộng × 280 cao | 2×2 |

- Bản đồ thế giới: **3840 × 2160** đơn vị, xuất 1× WebP. Ảnh nền vùng: **1920 × 1080** WebP.
- Đảo cá nhân: nền **2560 × 1600** đơn vị, xuất 1× WebP; vật trên đảo xuất @2x PNG.

## 6. Độ dày viền (`LINE`)

| Hằng | Đơn vị | Dùng cho |
|---|---|---|
| `xl` | 5 | Núi, nền đảo, toà nhà rất lớn |
| `lg` | 4 | Nhà, cây lớn |
| `md` | 3 | Đồ vật vừa, thân nhân vật và thú cưng |
| `sm` | 2 | Chi tiết nhỏ, mặt và tay nhân vật |
| `xs` | 1.25 | Nét trang trí bên trong (vân gỗ, gạch) |

Trên bản đồ thế giới (ảnh 1×), các nét được nhân thêm khoảng 1.5–2 để vẫn rõ khi thu nhỏ.

## 7. Tỉ lệ nhân vật

- **Chibi**: đầu chiếm khoảng **42%** chiều cao, thân ngắn, tay chân tròn và ngắn.
- Mắt to, đặt thấp trên mặt (khoảng 55% chiều cao đầu), có chấm sáng trắng. Má hồng `PAL.pink`.
- Nét mặt dùng `PAL.ink`, đậm `LINE.sm`.
- Thú cưng có **dáng (silhouette) riêng** để nhận ra ngay cả khi nhỏ:
  - Cáo: tai nhọn, đuôi to.
  - Thỏ: tai dài, thân tròn.
  - Gấu: tai tròn, thân mập.

## 8. Thiết kế môi trường

- Mỗi vùng có **màu chủ đạo** riêng nhưng vẫn nằm trong bảng màu chung (xem `WORLD_DESIGN.md`).
- Giữa các vùng có đường đi, cầu và sông nối liền. Bản đồ là **một vùng địa lý liền mạch**, không phải các thẻ ghép lại.
- Chừa khoảng trống: đảo cá nhân luôn để lại các ô xây dựng trống, đánh dấu nhẹ trên lưới tham chiếu.

## 9. Kỹ thuật

- PNG trong suốt cho sprite, WebP cho ảnh nền lớn. Bản SVG gốc được giữ cạnh PNG khi hữu ích.
- Không có viền trắng thừa, không bị cắt mất (mỗi canvas chừa lề ≥ 4 đơn vị, kể cả cho bóng).
- Spritesheet: khung đều nhau, xếp theo hàng từ trái qua phải, từ trên xuống.
  Thông số khung và animation nằm trong manifest.
- Mọi tài sản phải có mục trong manifest: `art/manifest/<nhóm>.json`, được gộp thành
  `public/assets/asset-manifest.json`.

## 10. Quy trình

```
npm i --prefix /tmp/lw-tools playwright-core@1.49.1      # một lần, ngoài repo
export PLAYWRIGHT_CORE=/tmp/lw-tools/node_modules/playwright-core
node art/build-all.mjs        # chạy mọi generator → public/assets + manifest
node build.mjs                # gộp src/*.ts → index.html
```
