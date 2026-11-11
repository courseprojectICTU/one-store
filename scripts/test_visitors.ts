/**
 * Kiểm thử tự động module ghi nhận & thống kê lượt truy cập (Basin Stream + D1 visitor_logs)
 * Dự án One - Store
 */

import fs from 'fs';
import {
  detectDeviceType,
  parseClientMeta,
  anonymizeIp,
  extractCountry,
} from '../backend/src/visitors';

let passed = 0;
let failed = 0;

function check(desc: string, condition: boolean, detail = '') {
  if (condition) {
    console.log(`[PASS] ${desc}`);
    passed++;
  } else {
    console.error(`[FAIL] ${desc}${detail ? ' -> ' + detail : ''}`);
    failed++;
  }
}

async function main() {
  console.log('=== KIỂM THỬ VISITOR TRACKING (BASIN STREAM + D1) ===\n');

  // 1. Phân loại thiết bị theo hệ điều hành (ios / android / windows / macos / linux / bot)
  check(
    'Phân loại Windows Desktop Chrome là windows',
    detectDeviceType('Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/130.0.0.0 Safari/537.36') === 'windows',
  );
  check(
    'Phân loại iPhone iOS (có chuỗi like Mac OS X) là ios chứ không nhầm macos',
    detectDeviceType('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1') === 'ios',
  );
  check(
    'Phân loại iPad iOS là ios',
    detectDeviceType('Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Safari/604.1') === 'ios',
  );
  check(
    'Phân loại Android (có chuỗi Linux) là android chứ không nhầm linux',
    detectDeviceType('Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Chrome/130.0.0.0 Mobile Safari/537.36') === 'android',
  );
  check(
    'Phân loại macOS Safari là macos',
    detectDeviceType('Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) AppleWebKit/605.1.15 Version/17.5 Safari/605.1.15') === 'macos',
  );
  check(
    'Phân loại Linux Desktop là linux',
    detectDeviceType('Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:128.0) Gecko/20100101 Firefox/128.0') === 'linux',
  );
  check(
    'Phân loại Googlebot / curl là bot',
    detectDeviceType('Googlebot/2.1 (+http://www.google.com/bot.html)') === 'bot' &&
      detectDeviceType('curl/8.4.0') === 'bot',
  );

  // 2. Phân tích Browser & OS trong meta
  const edgeMeta = parseClientMeta('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/130.0.0.0 Safari/537.36 Edg/130.0.0.0');
  check('Nhận diện đúng Edge + Windows trong meta', edgeMeta.browser === 'Edge' && edgeMeta.os === 'Windows');

  const iosSafariMeta = parseClientMeta('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Version/17.0 Mobile/15E148 Safari/604.1');
  check('Nhận diện đúng Safari + iOS trong meta', iosSafariMeta.browser === 'Safari' && iosSafariMeta.os === 'iOS');

  // 3. Băm IP ẩn danh helper
  const h1 = await anonymizeIp('203.113.152.10');
  const h2 = await anonymizeIp('203.113.152.10');
  check('anonymizeIp hoạt động nhất quán 16 ký tự hex', h1 === h2 && /^[a-f0-9]{16}$/.test(h1));

  // 4. Trích xuất quốc gia từ header Cloudflare / fallback LOCAL
  const reqVn = new Request('https://one-store.onestoresportsshoes.workers.dev/api/visit', {
    headers: { 'cf-ipcountry': 'vn' },
  });
  check('Trích xuất chuẩn mã quốc gia VN từ cf-ipcountry', extractCountry(reqVn) === 'VN');

  const reqLocal = new Request('http://127.0.0.1:8787/api/visit');
  check('Fallback mã LOCAL khi chạy local dev không có cf-ipcountry', extractCountry(reqLocal) === 'LOCAL');

  // 5. Kiểm tra cấu hình Basin Stream & tích hợp D1 trong mã nguồn
  const wranglerSrc = fs.readFileSync('wrangler.toml', 'utf8');
  const visitorsSrc = fs.readFileSync('backend/src/visitors.ts', 'utf8');
  const indexSrc = fs.readFileSync('backend/src/index.ts', 'utf8');
  const providersSrc = fs.readFileSync('frontend/src/components/Providers.tsx', 'utf8');
  const adminSrc = fs.readFileSync('frontend/src/app/admin/page.tsx', 'utf8');

  check('wrangler.toml khai báo BASIN_STREAM_URL và BASIN_SITE_ID = CHIEUTHU4-NHOM02', wranglerSrc.includes('BASIN_STREAM_URL') && wranglerSrc.includes('BASIN_SITE_ID = "CHIEUTHU4-NHOM02"'));
  check('visitors.ts đẩy mảng [payload] lên Basin Stream và ghi D1 visitor_logs bằng .bind', visitorsSrc.includes('JSON.stringify([payload])') && visitorsSrc.includes('INSERT INTO visitor_logs') && visitorsSrc.includes("return c.json({ ok: true, id: visitUuid }, 201)"));
  check('index.ts đã mount visitorsRouter', indexSrc.includes("app.route('/api', visitorsRouter)"));
  check('Providers.tsx đã gắn <VisitorTracker />', providersSrc.includes('<VisitorTracker />'));
  check('admin/page.tsx chỉ render 1 khối 24h và kiểm tra icon ios/android', (adminSrc.match(/LƯỢT GHÉ THĂM TRONG 24 GIỜ QUA/g) || []).length === 1 && adminSrc.includes("dItem.device === 'ios' || dItem.device === 'android'"));

  console.log(`\n=== KẾT QUẢ KIỂM THỬ VISITORS: ${passed} ĐẠT / ${failed} THẤT BẠI ===`);
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
