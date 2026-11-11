import { Hono } from 'hono';
import { z } from 'zod';
import type { ShopBindings } from './commerce';
import { getAdminUser } from './admin';

export const visitorsRouter = new Hono<{ Bindings: ShopBindings }>();

export type DeviceCategory = 'ios' | 'android' | 'windows' | 'macos' | 'linux' | 'bot' | 'other';

const visitSchema = z.object({
  path: z.string().trim().min(1).max(200).default('/'),
  referrer: z.string().trim().max(500).optional().default(''),
  locale: z.string().trim().max(16).optional().default('vi'),
  screen: z.string().trim().max(32).optional().default(''),
});

/**
 * Phân loại loại thiết bị từ chuỗi User-Agent
 */

export function detectDeviceType(userAgent: string): DeviceCategory {
  const ua = (userAgent || '').toLowerCase();
  if (!ua) return 'other';

  if (
    /bot|crawl|spider|slurp|curl|wget|python-requests|go-http|headless|lighthouse|pingdom|uptime|facebookexternalhit|twitterbot|whatsapp|telegrambot/i.test(
      ua,
    )
  ) {
    return 'bot';
  }

  // Kiểm tra iOS trước macOS vì UA iOS chứa "like Mac OS X"
  if (/iphone|ipad|ipod/i.test(ua)) {
    return 'ios';
  }

  // Kiểm tra Android trước Linux vì UA Android chứa "Linux"
  if (/android/i.test(ua)) {
    return 'android';
  }

  if (/windows nt|win32|win64/i.test(ua)) {
    return 'windows';
  }

  if (/macintosh|mac os x/i.test(ua)) {
    return 'macos';
  }

  if (/linux/i.test(ua)) {
    return 'linux';
  }

  return 'other';
}

/**
 * Phân tích thông tin trình duyệt & hệ điều hành phục vụ cột meta
 */
export function parseClientMeta(userAgent: string): { browser: string; os: string } {
  const ua = userAgent || '';

  let browser = 'Other';
  if (/Edg\//i.test(ua)) browser = 'Edge';
  else if (/OPR\/|Opera/i.test(ua)) browser = 'Opera';
  else if (/Chrome\/|CriOS\//i.test(ua) && !/Edg\//i.test(ua)) browser = 'Chrome';
  else if (/Firefox\/|FxiOS\//i.test(ua)) browser = 'Firefox';
  else if (/Safari\//i.test(ua) && !/Chrome\/|CriOS\//i.test(ua)) browser = 'Safari';

  let os = 'Other';
  if (/Windows NT/i.test(ua)) os = 'Windows';
  else if (/iPhone|iPad|iPod/i.test(ua)) os = 'iOS';
  else if (/Android/i.test(ua)) os = 'Android';
  else if (/Mac OS X|Macintosh/i.test(ua)) os = 'macOS';
  else if (/Linux/i.test(ua)) os = 'Linux';

  return { browser, os };
}

/**
 * Trích xuất mã quốc gia ISO 2 ký tự từ Cloudflare Edge request
 */
export function extractCountry(req: Request): string {
  const cfCountry = (req as unknown as { cf?: { country?: string } }).cf?.country;
  const headerCountry = req.headers.get('cf-ipcountry');
  const raw = (cfCountry || headerCountry || '').trim().toUpperCase();
  if (raw && raw !== 'XX' && raw !== 'T1') return raw;
  return 'LOCAL';
}

/**
 * Băm địa chỉ IP bằng SHA-256 (16 ký tự hex đầu) để đếm unique visitor mà bảo mật quyền riêng tư
 */
export async function anonymizeIp(rawIp: string): Promise<string> {
  const cleanIp = (rawIp || 'unknown').trim();
  const data = new TextEncoder().encode(`one-store-salt:${cleanIp}`);
  const hashBuf = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuf))
    .slice(0, 8)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * POST /api/visit — Ghi nhận lượt ghé thăm vào bảng D1 visitor_logs
 */
visitorsRouter.post('/visit', async (c) => {
  const rawBody = await c.req.json().catch(() => ({}));
  const parsed = visitSchema.safeParse(rawBody || {});
  if (!parsed.success) {
    return c.json({ ok: false, error: 'Dữ liệu truy cập không hợp lệ' }, 400);
  }

  const ua = c.req.header('user-agent') || '';
  const device = detectDeviceType(ua);
  const country = extractCountry(c.req.raw);

  const rawIp =
    c.req.header('cf-connecting-ip') ||
    c.req.header('x-forwarded-for')?.split(',')[0]?.trim() ||
    '127.0.0.1';

  const ingestTs = Date.now(); // 13 chữ số (millisecond) khớp schema streamInfo.txt
  const isoTime = new Date(ingestTs).toISOString();
  const { browser, os } = parseClientMeta(ua);
  const visitUuid = crypto.randomUUID();
  const siteId = c.env.BASIN_SITE_ID || 'nhom02';

  const metaObj = {
    visit_id: visitUuid,
    path: parsed.data.path,
    referrer: parsed.data.referrer,
    locale: parsed.data.locale,
    screen: parsed.data.screen,
    browser,
    os,
  };
  const metaJson = JSON.stringify(metaObj);

  // 1. Đẩy lên Basin Catalog Stream ở nền (chỉ đẩy khi chạy thật qua Cloudflare Edge, tránh rác từ LOCAL)
  if (c.env.BASIN_STREAM_URL && country !== 'LOCAL') {
    const streamTask = pushToBasinStream(c.env.BASIN_STREAM_URL, {
      id: siteId,
      country,
      device,
      time: ingestTs,
      ip: rawIp,
      meta: metaObj,
    });
    try {
      c.executionCtx.waitUntil(streamTask);
    } catch {
      await streamTask;
    }
  }

  // 2. Vẫn ghi bản sao vào D1 visitor_logs để /admin xem tức thì
  try {
    await c.env.DB.prepare(
      `INSERT INTO visitor_logs (id, _ingest_ts, country, device, time, ip, meta)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    )
      .bind(visitUuid, ingestTs, country, device, isoTime, rawIp, metaJson)
      .run();

    return c.json({ ok: true, id: visitUuid }, 201);
  } catch (err) {
    console.warn('[Visitor Log Insert Warning]', err);
    return c.json({ ok: false, error: 'Không thể ghi nhận lượt truy cập' }, 202);
  }
});

/**
 * GET /api/admin/analytics/visitors?hours=24
 * Thống kê lượt truy cập, quốc gia, thiết bị trong 24h (hoặc N giờ) cho Admin Dashboard
 */
visitorsRouter.get('/admin/analytics/visitors', async (c) => {
  const user = await getAdminUser(c);
  if (!user) {
    return c.json({ error: 'Không có quyền truy cập' }, 401);
  }

  const rawHours = Number(c.req.query('hours') || 24);
  const hours = Number.isFinite(rawHours) ? Math.min(720, Math.max(1, Math.round(rawHours))) : 24;
  const sinceTs = Date.now() - hours * 3600 * 1000;

  try {
    const [summaryRes, countriesRes, devicesRes, pagesRes, recentRes] = await Promise.all([
      c.env.DB.prepare(
        `SELECT
           COUNT(*) as total_visits,
           COUNT(DISTINCT ip) as unique_visitors,
           SUM(CASE WHEN device != 'bot' THEN 1 ELSE 0 END) as human_visits,
           SUM(CASE WHEN device = 'bot' THEN 1 ELSE 0 END) as bot_visits
         FROM visitor_logs
         WHERE _ingest_ts >= ?`,
      )
        .bind(sinceTs)
        .first<{
          total_visits: number;
          unique_visitors: number;
          human_visits: number;
          bot_visits: number;
        }>(),
      c.env.DB.prepare(
        `SELECT
           country,
           COUNT(*) as visits,
           COUNT(DISTINCT ip) as unique_visitors
         FROM visitor_logs
         WHERE _ingest_ts >= ?
         GROUP BY country
         ORDER BY visits DESC
         LIMIT 20`,
      )
        .bind(sinceTs)
        .all<{ country: string; visits: number; unique_visitors: number }>(),
      c.env.DB.prepare(
        `SELECT
           device,
           COUNT(*) as visits,
           COUNT(DISTINCT ip) as unique_visitors
         FROM visitor_logs
         WHERE _ingest_ts >= ?
         GROUP BY device
         ORDER BY visits DESC`,
      )
        .bind(sinceTs)
        .all<{ device: string; visits: number; unique_visitors: number }>(),
      c.env.DB.prepare(
        `SELECT
           COALESCE(json_extract(meta, '$.path'), '/') as path,
           COUNT(*) as visits
         FROM visitor_logs
         WHERE _ingest_ts >= ?
         GROUP BY path
         ORDER BY visits DESC
         LIMIT 10`,
      )
        .bind(sinceTs)
        .all<{ path: string; visits: number }>(),
      c.env.DB.prepare(
        `SELECT id, _ingest_ts, country, device, time, meta
         FROM visitor_logs
         WHERE _ingest_ts >= ?
         ORDER BY _ingest_ts DESC
         LIMIT 15`,
      )
        .bind(sinceTs)
        .all<{
          id: string;
          _ingest_ts: number;
          country: string;
          device: string;
          time: string;
          meta: string | null;
        }>(),
    ]);

    return c.json({
      hours,
      summary: {
        total_visits: Number(summaryRes?.total_visits || 0),
        unique_visitors: Number(summaryRes?.unique_visitors || 0),
        human_visits: Number(summaryRes?.human_visits || 0),
        bot_visits: Number(summaryRes?.bot_visits || 0),
      },
      countries: countriesRes.results || [],
      devices: devicesRes.results || [],
      top_pages: pagesRes.results || [],
      recent: recentRes.results || [],
    });
  } catch (err) {
    console.warn('[Visitor Analytics Query Warning]', err);
    return c.json({
      hours,
      summary: { total_visits: 0, unique_visitors: 0, human_visits: 0, bot_visits: 0 },
      countries: [],
      devices: [],
      top_pages: [],
      recent: [],
    });
  }
});

async function pushToBasinStream(
  streamUrl: string,
  payload: {
    id: string;
    country: string;
    device: string;
    time: number;
    ip: string;
    meta: Record<string, unknown>;
  },
) {
  try {
    const res = await fetch(streamUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      // Lưu ý: Chuẩn HTTP ingest của Cloudflare Pipelines nhận mảng JSON [{...}]
      // Nếu khi test endpoint chỉ nhận object đơn thì đổi thành JSON.stringify(payload)
      body: JSON.stringify([payload]),
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      console.warn('[Basin Stream Push Failed]', res.status, errText);
    }
  } catch (err) {
    console.warn('[Basin Stream Push Error]', err);
  }
}