// ── Hằng số & bảng màu cho trò "Sắp Xếp Sắc Màu" ──

// Bảng màu xếp theo thứ tự "dễ phân biệt trước" để vòng đầu thật rõ ràng cho bé.
export const COLORS = [
  { name: 'Đỏ',    base: '#ff3355', light: '#ffb3c0', dark: '#8e0c26' },
  { name: 'Xanh',  base: '#2f7dff', light: '#b6d4ff', dark: '#0d2f80' },
  { name: 'Vàng',  base: '#ffcc1a', light: '#fff0b0', dark: '#9a6b00' },
  { name: 'Lá',    base: '#2ec25f', light: '#b6f0c8', dark: '#0b5c27' },
  { name: 'Tím',   base: '#a34cf0', light: '#e0c2ff', dark: '#4d0f80' },
  { name: 'Cam',   base: '#ff861a', light: '#ffd5aa', dark: '#8f3d00' },
  { name: 'Hồng',  base: '#ff6ec7', light: '#ffd0ee', dark: '#93196a' },
  { name: 'Ngọc',  base: '#12cfd0', light: '#b3f6f6', dark: '#046264' },
  { name: 'Mạ',    base: '#9ad61f', light: '#e2f7a8', dark: '#4a6a05' },
  { name: 'Nâu',   base: '#a7673c', light: '#e6c3a8', dark: '#4f2a12' },
  { name: 'Bạc',   base: '#c9d4e2', light: '#ffffff', dark: '#6a7688' },
];

export const CAP_MAX = 5;          // số bóng tối đa trong một ống
export const BALL_DUR = 340;       // thời gian bay của một quả bóng (ms)
export const BALL_STAGGER = 72;    // độ trễ giữa các quả trong cùng một nước đi

// Vật phẩm hỗ trợ: giá bằng 💎 và mô tả ngắn.
// (Đánh dấu chỗ quay lại không nằm ở đây — đó là nút dùng thoải mái, không mất 💎.)
export const ITEMS = {
  tube: { icon: '🧪', name: 'Ống thêm',  price: 30, desc: 'Thêm một ống trống cho vòng này' },
};

export const SAVE_KEY = 'colorsort_save_v1';

// ── Độ khó tăng dần, chơi không dừng ──
export function levelPlan(n) {
  // Vòng "thử thách" (cứ 7 vòng một lần): ít màu hơn nhưng chỉ có MỘT ống trống.
  const challenge = n >= 14 && n % 7 === 0;
  if (challenge) {
    const colors = Math.min(9, 6 + Math.floor(n / 21));   // 6…9 màu, khó dần
    return { colors, cap: 4, empties: 1, challenge: true };
  }
  const colors = Math.min(11, 3 + Math.floor((n - 1) / 2));
  const cap = n >= 26 ? 5 : 4;                    // bàn chơi cao thêm một bậc
  return { colors, cap, empties: 2, challenge: false };
}
