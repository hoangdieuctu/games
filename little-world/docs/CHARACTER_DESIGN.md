# Little World — Thiết kế nhân vật

Tài liệu mô tả bé (nhân vật chính) và ba thú cưng đồng hành, cách dựng lớp tuỳ biến và thông
số spritesheet. Mọi hình đều được **vẽ bằng code** (SVG sinh từ `art/gen-characters.mjs`) rồi
xuất PNG qua Chromium, theo đúng `ART_GUIDELINES.md` (viền màu, sáng trên-trái, bóng lavender,
góc nhìn 3/4 từ trên xuống, texture @2x hiển thị scale 0.5).

```
PLAYWRIGHT_CORE=/path/to/playwright-core node little-world/art/gen-characters.mjs
```

| Mã nguồn | Vai trò |
|---|---|
| `art/lib/characters-rig.mjs` | Phép chiếu giả 3D (yaw), tay/chân dạng ống, mắt, miệng, má hồng, ghép lớp có mặt nạ |
| `art/lib/characters-avatar.mjs` | Rig của bé + mọi biến thể lớp (tóc, áo, quần, giày, phụ kiện) |
| `art/lib/characters-avatar-anims.mjs` | Tư thế từng animation + ghép lớp từng khung |
| `art/lib/characters-pets.mjs` | Rig + animation của Cáo, Thỏ, Gấu |
| `art/lib/characters-png.mjs` | Bộ nén PNG riêng (lọc từng hàng, zlib 9; PNG8 khi tệp vượt 600 KB) |

Tham chiếu gốc (xem trước khi vẽ thêm): `public/assets/characters/<avatar|fox|bunny|bear>/reference-sheet.png`.

---

## 1. Bé (nhân vật chính)

**Tính cách.** Một bạn nhỏ 6–8 tuổi tò mò, vui vẻ, thích giúp đỡ. Thiết kế trung tính giới tính:
mặc định tóc ngắn rối màu nâu, áo phông vàng in ngôi sao, quần soóc xanh denim, giày thể thao san hô.

**Dáng (silhouette).** Chibi: đầu tròn to (rộng 38, cao 34 đơn vị), thân ngắn hình chuông, tay chân
tròn ngắn, bàn tay "găng" có ngón cái. Một lọn tóc dựng (ahoge) trên đỉnh làm dấu nhận diện.

| Thông số | Giá trị (đơn vị thế giới) |
|---|---|
| Khung | 96 × 96 (PNG 192 × 192 @2x), đế chân y = 88, origin `[0.5, 0.92]` |
| Chiều cao | ~77–80 (đỉnh tóc y ≈ 9–11) · đầu ≈ 43% chiều cao |
| Mắt | thấp trên mặt (~60% chiều cao đầu), tròng mực `#4b3a5e` ánh tím `#9077cf` ở đáy, 2 chấm sáng trắng |
| Má | `PAL.pink #ffb8cb` (60%) + chấm sáng nhỏ |
| Viền | thân/đầu 2.3, tay/chân 1.9, chi tiết 1.1–1.3; mặt `PAL.ink` 1.8 |
| Lề | ≥ 4 đơn vị mọi phía ở mọi khung (đã kiểm tra tự động, kể cả lúc nhảy) |

**Góc nhìn.** `front` (xuống), `back` (lên), `side` (quay **phải**; sang trái dùng `flipX`),
`threequarter` (3/4 chếch phải). Toàn bộ rig dùng toạ độ 3D (X, Y lên, Z trước) và góc yaw
0/32/90/180°, nên mặt, tai, tóc, tay chân ở mọi góc đều khớp nhau.

### 1.1 Hệ thống lớp (layered customization)

Mỗi lớp là một spritesheet **cùng bố cục khung** (10 cột × 9 hàng, 90 khung, 1920 × 1728 px).
Phaser xếp chồng các sprite theo thứ tự dưới đây và đặt **cùng chỉ số khung** cho mọi lớp
(`src/services/LayeredAvatar.ts`).

| # | Slot | Tô màu? | Nội dung | Biến thể |
|---|---|---|---|---|
| 1 | `hairBack` | có (tóc) | tóc nằm sau đầu/thân: đuôi ngựa, gáy bob, màn tóc dài, búi xa | Tóc buộc đuôi ngựa · Tóc bob · Tóc hai búi xoăn · Tóc dài · Không |
| 2 | `body` | có (da) | đầu, tai, cổ, tay, bàn tay, chân **+ bóng đất** | Dáng bé |
| 3 | `face` | không | mắt, mày, mũi, miệng, má (đổi theo khung); quay lưng = trống | Mắt tròn lấp lánh · Tàn nhang đáng yêu |
| 4 | `bottom` | có (quần) | quần/váy | Quần soóc · Chân váy xoè · Quần dài |
| 5 | `top` | có (áo) | áo + tay áo | Áo phông ngôi sao · Áo hoodie · Áo váy bèo · Áo len kẻ sọc |
| 6 | `shoes` | có (giày) | giày | Giày thể thao · Ủng đi mưa · Giày búp bê |
| 7 | `hairFront` | có (tóc) | mái, đỉnh đầu; khi quay lưng che gáy và chứa đuôi/màn tóc | Tóc ngắn rối · Tóc bob · Tóc buộc đuôi ngựa · Tóc hai búi xoăn · Tóc dài |
| 8 | `accessory` | không | phụ kiện đủ màu | Không · Mũ lưỡi trai · Kẹp hoa · Kính tròn · Ba lô nhỏ · Khăn quàng |

Mã asset: `avatar-<slot>-<biến thể>` (vd. `avatar-hairfront-short`, `avatar-top-hoodie`,
`avatar-acc-cap`), riêng da là `avatar-body`. Tệp: `characters/avatar/layers/*.png`.

**Kiểu tóc đi theo cặp.** Một kiểu tóc gồm `hairFront` + `hairBack` cùng tên (tóc ngắn không có
`hairBack`). Danh sách cặp nằm ở `manifest.data.characters.avatar.hairstyles`. Ghép lệch cặp vẫn
hiển thị được nhưng (vd.) đuôi ngựa sẽ không hiện khi quay lưng, vì khi quay lưng đuôi/màn tóc nằm
ở lớp `hairFront` (phải nằm TRÊN áo).

**Chiều sâu đúng dù thứ tự lớp cố định.** Thứ tự lớp không đổi, nhưng có lúc một phần của lớp
dưới phải nằm *trước* lớp trên (bàn tay trước áo, tay chống cằm trước mặt và tóc, chân gần che giày
chân xa khi nhìn nghiêng, cằm che cổ áo, ba lô nhìn nghiêng nằm sau lưng). Generator gán độ sâu z
cho từng phần và **khoét lỗ (mask)** trên các lớp trên đúng hình bóng phần đó. Lỗ chỉ được tạo từ
lớp `body` (luôn có, một biến thể) và từ hình bóng thân/tay áo cố định của rig, nên mọi tổ hợp biến
thể đều khớp, không hở.

### 1.2 Tô màu (tint)

Lớp tô được vẽ bằng **xám trung tính hơi tím**: nền `#f2f0f5`, sáng `#ffffff`, bóng
`#dcd7e4`/`#c4bdd0`, viền `#8f8a9c` (tóc nền `#e9e5ef`, viền `#857f97`). Phaser `setTint(hex)`
nhân màu (multiply), nên nền ≈ đúng màu chọn, bóng tối dần cùng tông, viền ≈ 56% màu chọn,
tức là "viền màu" theo quy chuẩn. Đã kiểm tra bằng cách chồng chính các PNG xuất ra với
multiply trên canvas (y hệt Phaser): màu, bóng và viền đều đọc tốt trên các màu da sáng, trung bình và tối.

| Bảng (manifest `palettes`) | Màu |
|---|---|
| `skin` (= `PAL.skin`) | `#ffe3cf` `#f9cfae` `#e7b08a` `#c68a63` `#94603f` |
| `hair` (= `PAL.hair`) | `#4a3426` `#7a4b2e` `#c98c4f` `#f2cf7a` `#e86f5a` `#2f2c3d` `#b49ae6` `#ff9fbf` |
| `cloth` | `#ffd96b` `#ff8f8f` `#ffac6b` `#9fd67c` `#7cc3ee` `#7b8fd1` `#c7b5f0` `#ffb8cb` |
| `shoes` | `#ff8f8f` `#7cc3ee` `#fffaf2` `#9b85d9` `#cf9161` |

`tintSlots`: `body→skin`, `hairBack/hairFront→hair`, `top/bottom→cloth` (màu riêng cho từng lớp),
`shoes→shoes`. Trong `defaults`, `top`/`bottom`/`shoes` là asset id; màu mặc định nằm ở
`topColor`/`bottomColor`/`shoesColor` (JSON không cho một khoá vừa là id vừa là màu); `skin`/`hair` là chỉ số trong bảng. Mặt và phụ kiện **không** tô (`clearTint`).

```ts
// mỗi lớp: một sprite, cùng origin/scale, cùng frame
const s = scene.add.sprite(x, y, 'avatar-top-hoodie').setOrigin(0.5, 0.92).setScale(0.5);
s.setTint(0x9fd67c);          // multiply
s.setFrame(cfg.anims['walk-side'].start + i);
s.setFlipX(goingLeft);        // nhìn nghiêng trái
```

`avatar-default` là bản **ghép sẵn đủ màu** (mặc định) cùng bố cục khung, có sẵn animation
`avatar-<tên>` trong manifest, dùng cho NPC/khi không cần tuỳ biến.

### 1.3 Animation của bé

Sheet: 10 cột, khung 192 × 192 px, 90 khung (`avatar-default` và mọi lớp đều vậy).

| Tên (`anims`) | Góc nhìn | Khung | Số khung | fps | Lặp |
|---|---|---|---|---|---|
| `idle-down` | trước | 0–3 | 4 | 5 | lặp |
| `idle-up` | sau | 4–7 | 4 | 5 | lặp |
| `idle-side` | bên phải | 8–11 | 4 | 5 | lặp |
| `idle-threequarter` | 3/4 | 12–15 | 4 | 5 | lặp |
| `walk-down` | trước | 16–23 | 8 | 10 | lặp |
| `walk-up` | sau | 24–31 | 8 | 10 | lặp |
| `walk-side` | bên phải | 32–39 | 8 | 10 | lặp |
| `run-down` | trước | 40–45 | 6 | 12 | lặp |
| `run-up` | sau | 46–51 | 6 | 12 | lặp |
| `run-side` | bên phải | 52–57 | 6 | 12 | lặp |
| `happy` | trước | 58–63 | 6 | 10 | lặp |
| `celebrate` | trước | 64–71 | 8 | 12 | 1 lần |
| `think` | trước | 72–77 | 6 | 6 | 1 lần |
| `wave` | trước | 78–83 | 6 | 9 | lặp |
| `interact` | trước | 84–89 | 6 | 9 | 1 lần |

`views`: `front` 0, `back` 4, `side` 8, `threequarter` 12. Chân luôn chạm đường đế khi đứng/đi
(rig tự hạ người cho bàn chân thấp nhất chạm đất); nhấp nhô khi đi là hệ quả của dáng chân.

---

## 2. Thú cưng đồng hành

Cả ba là "thú bông chibi" đứng hai chân: đầu rất to, thân tròn như bánh mochi, chân ngắn, tay nhỏ.
Mỗi bạn có dáng riêng để nhận ra ngay cả khi nhỏ: **Cáo = tai nhọn + đuôi bông khổng lồ**,
**Thỏ = tai dài (một bên cụp) + thân tròn + đuôi bông**, **Gấu = tai tròn + thân mập + mõm to**.

| Thông số | Giá trị |
|---|---|
| Khung | 80 × 80 đơn vị (PNG 160 × 160 @2x), đế chân y = 73.6, origin `[0.5, 0.92]`, scale 0.5 |
| Chiều cao | Gấu ~49, Cáo ~56, Thỏ ~61 (tính cả tai) |
| Đầu / thân | đầu ≈ 55% chiều cao (không tính tai) |

### 2.1 Cáo Cam (`fox`)
- **Tính cách:** tò mò, lanh lợi, thích phiêu lưu; luôn chạy trước dẫn đường, đánh hơi bí mật.
- **Dáng:** tai nhọn to có chóp nâu, túm lông má nhọn hai bên, mõm kem nhô ra khi nhìn nghiêng,
  đuôi bông to cong lên có chóp kem (luôn ló ra bên phải khi nhìn trước, che lưng khi quay sau).
- **Phụ kiện:** khăn quàng thám hiểm màu ngọc bạc hà, nút buộc lệch một bên.
- **Màu:** thân `#ffac6b`, kem `#fff3dc`, chân `#e0804e`, trong tai `#ffe2c4`, chóp tai `#a8614a`,
  viền `#b15b3c`, khăn `#6fc7b0`, ánh mắt hổ phách `#f3a453`.

### 2.2 Thỏ Bông (`bunny`)
- **Tính cách:** hiền lành, thân thiện, tinh nghịch; thích nhảy lò cò, an ủi và reo vui cùng bạn.
- **Dáng:** thân tròn nhất, tai dài hồng (tai phải cụp xuống), đuôi bông trắng, má phúng, mũi hồng.
  Đi bằng cách **nhảy lò cò** (cả hai chân cùng nhún).
- **Phụ kiện:** nơ lavender ở chân tai trái.
- **Màu:** thân `#fbf1f6`, bụng `#ffffff`, chân `#fbe3ee`, trong tai `#ffb8cb`, mũi `#f58aa8`,
  viền `#b394bd`, nơ `#c7b5f0`, ánh mắt hồng `#ea8db5`.

### 2.3 Gấu Mật (`bear`)
- **Tính cách:** điềm tĩnh, chu đáo, che chở; thích chăm cây, ôm bạn thật chặt, nhắc bạn nghỉ ngơi.
- **Dáng:** to ngang nhất, tai tròn, mõm cát lớn với mũi nâu bóng, mắt nhỏ hiền.
- **Dấu nhận diện:** mầm lá xanh trên đỉnh đầu, miếng vá trái tim khâu chỉ ở bụng.
- **Màu:** thân `#d99a5b`, mõm/bụng `#f6e0ae`, chân `#c98a50`, viền `#8e5a3c`, tim `#ff8f8f`,
  lá `#7cc96a`, ánh mắt mật ong `#e9a65a`.

### 2.4 Animation thú cưng

Mỗi bạn một sheet đủ màu: `fox-sheet`, `bunny-sheet`, `bear-sheet` (8 cột × 7 hàng, 56 khung,
1280 × 1120 px). Manifest có animation `<pet>-<tên>` (vd. `fox-walk-side`) và `data.pets.<pet>`.

| Tên | Góc nhìn | Khung | Số khung | fps | Lặp | Ghi chú |
|---|---|---|---|---|---|---|
| `idle-front` | trước | 0–3 | 4 | 5 | lặp | thở, ve vẩy đuôi, giật tai, chớp mắt |
| `idle-side` | bên phải | 4–7 | 4 | 5 | lặp | |
| `idle-back` | sau | 8–9 | 2 | 3 | lặp | khung tĩnh quay lưng |
| `walk-side` | bên phải | 10–17 | 8 | 10 | lặp | Thỏ: nhảy lò cò |
| `walk-front` | trước | 18–23 | 6 | 9 | lặp | |
| `walk-back` | sau | 24–29 | 6 | 9 | lặp | |
| `happy` | trước | 30–35 | 6 | 10 | lặp | nảy, mắt cười, vẫy đuôi nhanh |
| `greet` | trước | 36–41 | 6 | 8 | 1 lần | Cáo/Gấu vẫy tay; Thỏ ngoáy tai + vẫy |
| `celebrate` | xoay 360° | 42–49 | 8 | 12 | 1 lần | nhảy và xoay một vòng |
| `interact` | bên phải | 50–55 | 6 | 8 | 1 lần | Cáo đánh hơi · Thỏ dụi má · Gấu vỗ nhẹ |

`views`: `front` 0, `side` 4, `back` 8. Nhìn nghiêng quay phải; sang trái dùng `flipX`.

---

## 3. Bảng thông số spritesheet

| Asset id | Tệp | Kích thước | Khung | Số khung | Lưới |
|---|---|---|---|---|---|
| `avatar-<slot>-<v>` (27 lớp) | `characters/avatar/layers/*.png` | 1920 × 1728 | 192 × 192 | 90 | 10 × 9 |
| `avatar-default` | `characters/avatar/avatar-default.png` | 1920 × 1728 | 192 × 192 | 90 | 10 × 9 |
| `fox-sheet` / `bunny-sheet` / `bear-sheet` | `characters/<pet>/<pet>-sheet.png` | 1280 × 1120 | 160 × 160 | 56 | 8 × 7 |
| `avatar-portrait`, `<pet>-portrait` | `characters/<x>/portrait.png` | 256 × 256 | — | — | huy hiệu tròn cho UI (128 đơn vị @2x) |
| `avatar-reference`, `<pet>-reference` | `characters/<x>/reference-sheet.png` | ~1900 × 1440 / 1650 × 1140 | — | — | tham chiếu, không dùng trong game |

Mọi tệp < 600 KB (lớp có nhiều chi tiết nhất ~540 KB). Khi một sheet vượt 600 KB, generator tự
chuyển sang PNG 8-bit (bảng 256 màu, median-cut), mắt thường gần như không thấy khác biệt
(hiện là `avatar-body` và `avatar-default`).

---

## 4. Còn thiếu / giới hạn

- **Không có ảnh vẽ tay hay mô hình sinh ảnh.** Toàn bộ là hình học tham số, nên nét có phần
  "sạch" và đều. Chi tiết vải, sợi tóc, lông thú được tối giản.
- **`walk-down` / `walk-up` nhìn chính diện** chủ yếu thể hiện bằng nhún người, đung đưa và nhấc
  bàn chân, vì chân vung theo hướng nhìn nên bị rút ngắn.
- **`interact` của bé** (với tay chạm phía trước, nhìn chính diện) khá kín đáo vì tay vươn về phía
  camera. Nếu cần rõ hơn, nên làm thêm bản nhìn nghiêng.
- **Tay chibi ngắn:** khi giơ tay (`celebrate`, `wave`), bàn tay chỉ lên tới ngang má, đặt rộng
  ra hai bên đầu chứ không giơ cao quá đầu.
- **Ghép lệch cặp tóc** (vd. mái bob + đuôi ngựa) vẫn chạy nhưng không đúng ở góc quay lưng (xem 1.1).
- **Mũ lưỡi trai** chụp lên mọi kiểu tóc. Hai búi xoăn bị mũ che gần hết, và lọn tóc dựng của tóc
  ngắn có thể ló lên trên mũ.
- **Bóng đất** nằm trong lớp `body` nên cũng bị tô theo màu da (da tối cho bóng đậm hơn một chút).
  Nếu cần bóng tách rời, Phaser có thể tự vẽ elip.
- **Thú cưng không có biến thể màu.** Animation `celebrate` xoay 360° dùng các góc trung gian
  (45°, 135°…) do rig chiếu tự động, chưa được tinh chỉnh tay từng khung.
- **Chưa có:** khung ngồi/ngủ, cảm xúc buồn/ngạc nhiên riêng, hiệu ứng (bụi chân, tim, sao) và
  hướng chéo cho đi/chạy (chỉ có idle 3/4).
