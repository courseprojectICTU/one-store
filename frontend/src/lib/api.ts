import { Product } from '@/types';

export const fallbackImages = [
  '/api/images/products%2Fdbe88ec4-c0af-4188-91bf-bae4737859a4.jpg',
  '/api/images/products%2F36241c9b-7e41-4f97-810a-79875c53c0c8.jpg',
  '/api/images/products%2F5383bf7c-9ce6-421b-934e-5c2d7b7e72d5.webp',
  '/api/images/products%2F4ebee8ae-452a-4883-b303-ba171b71f089.jpg',
  '/api/images/products%2Fab1d6056-6664-4b17-8df7-a3d81cac5168.jpg',
  '/api/images/products%2F3c6f9fea-4f0d-4c80-8404-1f12e31e8f0d.jpg',
];

export function money(n: number | string | undefined | null): string {
  return Number(n || 0).toLocaleString('vi-VN') + '₫';
}

export function imageOf(p?: Partial<Product> | null): string {
  if (!p) return fallbackImages[0];
  if (p.image_url) return p.image_url;
  const idNum = Number(p.id) || 1;
  return fallbackImages[(idNum - 1) % fallbackImages.length] || fallbackImages[0];
}

export async function api<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
  // If running locally in development and accessing /api, options can pass credentials or headers
  const url = endpoint.startsWith('http') ? endpoint : endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const res = await fetch(url, options);
  let data: any;
  try {
    data = await res.json();
  } catch {
    data = { error: 'Phản hồi không hợp lệ' };
  }
  if (!res.ok) {
    throw new Error(data.error || 'Có lỗi xảy ra');
  }
  return data;
}

/**
 * Định dạng thời gian theo chuẩn múi giờ và thiết bị của máy tính truy cập
 * Xử lý an toàn chuỗi SQLite UTC (thêm T và Z nếu chưa có)
 */
export function formatDateTime(
  dateStr: string | null | undefined,
  locale: string = 'vi-VN',
): string {
  if (!dateStr) return '';
  let s = String(dateStr).trim();
  // Nếu là chuỗi SQLite 'YYYY-MM-DD HH:MM:SS' không có timezone, thêm T và Z để trình duyệt parse chuẩn UTC
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(s)) {
    s = s.replace(' ', 'T') + 'Z';
  }
  const d = new Date(s);
  if (isNaN(d.getTime())) return String(dateStr);

  return d.toLocaleString(locale === 'en' ? 'en-US' : 'vi-VN', {
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

