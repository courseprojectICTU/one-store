/**
 * ONE - STORE DESIGN SYSTEM TOKENS & COLOR CONSTANTS
 * Single Source of Truth cho toàn bộ mã màu, typography, khoảng cách và hiệu ứng nổi (Card).
 * Cả CSS Variables và các React Component đều đồng bộ từ đây.
 */

export const COLORS = {
  // Màu chủ đạo: Trắng tinh khôi & nền xám studio
  white: '#ffffff',
  background: '#f8f9fa',
  backgroundPure: '#ffffff',
  surfaceCard: '#ffffff',
  surfaceSubtle: '#f3f4f6',
  surfaceHover: '#fafafa',

  // Màu phụ: Đỏ thể thao năng động (Sneaker Energy Accent)
  red: {
    primary: '#e11d48',
    hover: '#be123c',
    active: '#9f1239',
    light: '#ffe4e6',
    border: '#fecdd3',
    glow: 'rgba(225, 29, 72, 0.25)',
  },

  // Màu phụ: Đen sâu & Đen tuyền tương phản cao
  black: {
    pure: '#000000',
    primary: '#0a0a0a',
    surface: '#121212',
    card: '#18181b',
    hover: '#27272a',
    muted: '#3f3f46',
  },

  // Màu phụ: Hệ xám trung tính (Cool Grays)
  gray: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a',
  },

  // Màu chữ (Typography colors)
  text: {
    primary: '#0a0a0a', // Đen chữ chính
    secondary: '#475569', // Xám đậm chữ phụ
    muted: '#94a3b8', // Xám nhạt ghi chú
    inverse: '#ffffff', // Trắng nổi trên nền đen/đỏ
    accent: '#e11d48', // Đỏ điểm nhấn
  },

  // Đường viền (Borders)
  border: {
    subtle: '#f1f5f9',
    default: '#e2e8f0',
    strong: '#cbd5e1',
    dark: '#27272a',
    accent: '#e11d48',
  },

  // Trạng thái (Feedback status)
  status: {
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
  },
} as const;

export const SHADOWS = {
  subtle: '0 2px 8px rgba(0, 0, 0, 0.04)',
  card: '0 10px 30px -10px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.02)',
  cardHover: '0 20px 35px -10px rgba(0, 0, 0, 0.1), 0 8px 12px -3px rgba(0, 0, 0, 0.04)',
  cardFloating: '0 25px 50px -12px rgba(10, 10, 10, 0.08), 0 0 0 1px rgba(0, 0, 0, 0.03)',
  buttonRed: '0 8px 20px -4px rgba(225, 29, 72, 0.35)',
  buttonBlack: '0 8px 20px -4px rgba(10, 10, 10, 0.25)',
  modal: '0 25px 60px -15px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(0, 0, 0, 0.05)',
} as const;

export const RADII = {
  xs: '6px',
  sm: '10px',
  md: '16px',
  lg: '22px',
  xl: '30px',
  full: '9999px',
} as const;

export const FONTS = {
  sans: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  display: "'Outfit', 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif",
} as const;

export type ThemeColors = typeof COLORS;
