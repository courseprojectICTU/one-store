import { Product } from '@/types';

export const fallbackImages = [
  '/api/images/products%2Fef07f4af-f26d-46cf-b134-2db1d920e5a1.jpg',
  '/api/images/products%2F49c4e8c0-06d5-4dd0-932c-78b39de6e9e2.jpg',
  '/api/images/products%2F7351f872-5b0d-4454-9202-a80fd9cd9199.jpg',
  '/api/images/products%2F3dc3f640-b618-4aef-97a5-16f0926a64b2.jpg',
  '/api/images/products%2Fac357fb3-0b0b-45d1-81bc-3dc1e2b80ac8.jpg',
  '/api/images/products%2Fce6de2f8-ad8d-455e-8714-7f3c722af26d.jpg',
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

