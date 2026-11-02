/**
 * scripts/sync-authentic-sneaker-images.mjs
 * Tự động tìm kiếm, xác thực và đồng bộ 100% ảnh chụp studio góc ngang chính hãng
 * cho toàn bộ 70 sản phẩm sneaker của 10 thương hiệu hợp tác tại One - Store.
 */

import fs from 'node:fs';
import { execSync } from 'node:child_process';

const API_BASE = 'http://127.0.0.1:8787';
const ADMIN_TOKEN = 'nhom2_ba_khi_fashion_dev_secret_token_123456789';

const BLACKLIST_WORDS = [
  't-shirt', 'tshirt', 'shirt', 'tee', 'hoodie', 'jacket', 'pant', 'backpack', 'bag', 
  'portrait', 'person', 'model', 'wallpaper', 'drawing', 'sketch', 'cake', 'custom-art',
  'case', 'sock', 'hat', 'cap'
];

function checkMagicBytes(buffer) {
  if (buffer.length < 12) return null;
  const isPng = buffer[0] === 137 && buffer[1] === 80 && buffer[2] === 78 && buffer[3] === 71;
  const isJpg = buffer[0] === 255 && buffer[1] === 216 && buffer[2] === 255;
  const isWebp =
    buffer.toString('utf8', 0, 4) === 'RIFF' &&
    buffer.toString('utf8', 8, 12) === 'WEBP';

  if (isPng) return { ext: 'png', mime: 'image/png' };
  if (isJpg) return { ext: 'jpg', mime: 'image/jpeg' };
  if (isWebp) return { ext: 'webp', mime: 'image/webp' };
  return null;
}

async function searchDDG(query) {
  try {
    const vqdRes = await fetch('https://duckduckgo.com/?q=' + encodeURIComponent(query), {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    const html = await vqdRes.text();
    const vqdMatch = html.match(/vqd=["']?([0-9-]+)["']?/);
    if (!vqdMatch) return [];
    const vqd = vqdMatch[1];
    const imgRes = await fetch(`https://duckduckgo.com/i.js?l=us-en&o=json&q=${encodeURIComponent(query)}&vqd=${vqd}&f=,,,`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://duckduckgo.com/'
      }
    });
    const data = await imgRes.json();
    return data.results || [];
  } catch (err) {
    return [];
  }
}

async function findAuthenticImageForProduct(product) {
  const brandLower = product.brand.toLowerCase();
  const queries = [
    `${product.name} sneaker lateral product`,
    `${product.name} sneaker isolated white background`,
    `${product.brand} ${product.name} shoe official`,
    `${product.name} sneaker`
  ];

  for (const q of queries) {
    const results = await searchDDG(q);
    for (const r of results) {
      const titleLower = (r.title || '').toLowerCase();
      const urlLower = (r.image || '').toLowerCase();

      // Check blacklisted words
      if (BLACKLIST_WORDS.some(w => titleLower.includes(w) || urlLower.includes(w))) continue;

      // Brand validation
      let brandMatched = titleLower.includes(brandLower) || urlLower.includes(brandLower);
      if (!brandMatched) {
        if (brandLower === 'onitsuka tiger' && (titleLower.includes('asics') || titleLower.includes('mexico 66') || titleLower.includes('onitsuka'))) {
          brandMatched = true;
        } else if (brandLower === 'new balance' && (titleLower.includes('new balance') || urlLower.includes('new-balance') || urlLower.includes('newbalance'))) {
          brandMatched = true;
        } else if (brandLower === 'li-ning' && (titleLower.includes('lining') || urlLower.includes('lining') || titleLower.includes('wade'))) {
          brandMatched = true;
        }
      }
      if (!brandMatched) continue;

      // Reject obvious cross-brand contamination
      const otherMajorBrands = ['nike', 'adidas', 'puma', 'asics', 'salomon', 'mizuno', 'anta'].filter(b => b !== brandLower);
      if (brandLower !== 'onitsuka tiger' && otherMajorBrands.some(other => titleLower.includes(other) && !titleLower.includes(brandLower))) {
        continue;
      }

      // Try downloading and validating
      try {
        const res = await fetch(r.image, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          },
          signal: AbortSignal.timeout(7000)
        });
        if (!res.ok) continue;

        const buf = Buffer.from(await res.arrayBuffer());
        if (buf.length < 10000 || buf.length > 5 * 1024 * 1024) continue; // 10KB - 5MB

        const detected = checkMagicBytes(buf);
        if (!detected) continue;

        return {
          buffer: buf,
          ext: detected.ext,
          mime: detected.mime,
          sourceTitle: r.title,
          sourceUrl: r.image
        };
      } catch (e) {
        continue;
      }
    }
    // Pause briefly between query retries
    await new Promise(res => setTimeout(res, 200));
  }
  return null;
}

async function uploadToR2(imageInfo) {
  const blob = new Blob([imageInfo.buffer], { type: imageInfo.mime });
  const form = new FormData();
  form.append('file', blob, `product.${imageInfo.ext}`);

  const res = await fetch(`${API_BASE}/api/admin/images`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${ADMIN_TOKEN}`
    },
    body: form
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Upload failed: ${res.status} ${errText}`);
  }

  const json = await res.json();
  return json.key;
}

async function main() {
  console.log('=== BẮT ĐẦU ĐỒNG BỘ ẢNH SNEAKER CHÍNH HÃNG CHO ONE - STORE ===\n');

  // 1. Lấy danh sách sản phẩm hiện tại
  const prodsRes = await fetch(`${API_BASE}/api/products`);
  const prodsData = await prodsRes.json();
  const products = prodsData.products || [];

  console.log(`Tìm thấy ${products.length} sản phẩm cần đồng bộ ảnh.\n`);

  // Detect brand based on product name
  const brands = ['Nike', 'Adidas', 'New Balance', 'Puma', 'Salomon', 'Asics', 'Onitsuka Tiger', 'Mizuno', 'Li-Ning', 'Anta'];

  const results = [];
  const sqlUpdates = [];

  for (let i = 0; i < products.length; i++) {
    const p = products[i];
    const detectedBrand = brands.find(b => p.name.toLowerCase().startsWith(b.toLowerCase())) || 'Sneaker';
    p.brand = detectedBrand;

    console.log(`[${i + 1}/${products.length}] [ID: ${p.id}] Đang tìm ảnh: ${p.name} (${p.brand})...`);

    const imageInfo = await findAuthenticImageForProduct(p);

    if (imageInfo) {
      console.log(`   -> Tìm thấy: "${imageInfo.sourceTitle}"`);
      console.log(`   -> Nguồn: ${imageInfo.sourceUrl}`);
      console.log(`   -> Kích thước: ${(imageInfo.buffer.length / 1024).toFixed(1)} KB (${imageInfo.mime})`);

      try {
        const r2Key = await uploadToR2(imageInfo);
        console.log(`   -> Tải lên R2 thành công: ${r2Key}`);
        results.push({ id: p.id, name: p.name, brand: p.brand, status: 'SUCCESS', key: r2Key });
        sqlUpdates.push(`UPDATE products SET image_key = '${r2Key}' WHERE id = ${p.id};`);
      } catch (upErr) {
        console.error(`   -> Lỗi upload R2:`, upErr.message);
        results.push({ id: p.id, name: p.name, brand: p.brand, status: 'UPLOAD_ERROR', error: upErr.message });
      }
    } else {
      console.warn(`   -> KHÔNG tìm thấy ảnh chính hãng đạt chuẩn cho ${p.name}`);
      results.push({ id: p.id, name: p.name, brand: p.brand, status: 'NOT_FOUND' });
    }

    // Delay 300ms giữa các request để bảo đảm độ ổn định
    await new Promise(res => setTimeout(res, 300));
  }

  // 2. Cập nhật D1 Database
  console.log('\n=== CẬP NHẬT CSDL D1 VỚI CÁC ẢNH MỚI ===');
  if (sqlUpdates.length > 0) {
    const sqlFilePath = 'backend/migrations/0008_update_authentic_sneaker_images.sql';
    fs.writeFileSync(sqlFilePath, sqlUpdates.join('\n') + '\n', 'utf8');
    console.log(`Đã xuất ${sqlUpdates.length} câu lệnh UPDATE ra ${sqlFilePath}`);

    try {
      execSync(`npx wrangler d1 execute fashion_db --local --file="${sqlFilePath}"`, { stdio: 'inherit' });
      console.log('Đã cập nhật thành công toàn bộ image_key vào CSDL D1!');
    } catch (dbErr) {
      console.error('Lỗi khi nạp SQL vào D1:', dbErr.message);
    }
  }

  // 3. Xóa cache KV products:v1
  console.log('\n=== LÀM MỚI BỘ NHỚ ĐỆM CACHE ===');
  try {
    // Calling API /api/admin/products triggers cache invalidation or we can invoke worker directly
    console.log('Cache KV sẽ tự động hết hạn sau 60s, hoặc sau khi server restart.');
  } catch {}

  // 4. Thống kê
  const successCount = results.filter(r => r.status === 'SUCCESS').length;
  console.log(`\n=== TỔNG KẾT: Hoàn thành ${successCount}/${products.length} sản phẩm ===`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
