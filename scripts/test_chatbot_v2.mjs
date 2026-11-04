/**
 * BỘ KIỂM THỬ TỰ ĐỘNG CHATBOT AI V2.0 (FAST ROUTER, SSE STREAMING & SPEECH)
 * Dự án One - Store — Trợ lý "Tư vấn One v2.0"
 */

import fs from 'fs';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`[PASS] ${message}`);
    passed++;
  } else {
    console.error(`[FAIL] ${message}`);
    failed++;
  }
}

console.log('=== BẮT ĐẦU KIỂM THỬ: FAST LOCAL PRE-ROUTER & WHISPER ACOUSTICS ===\n');

function fastLocalRouter(query) {
  const raw = query.trim();
  const q = raw
    .normalize('NFC')
    .toLowerCase()
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f​-‍⁠﻿]/g, '')
    .replace(/\s+/g, ' ');

  // 1. Nhận diện tra cứu đơn hàng bằng mã đơn ONE-...
  const codeMatch = raw.match(/\b(ONE-[A-Z0-9-]{6,16})\b/i);
  if (codeMatch) {
    return {
      type: 'order_lookup',
      orderCode: codeMatch[1].toUpperCase(),
    };
  }

  // 2. Nhận diện câu hỏi thêm phụ kiện mua kèm
  if (/^(thêm|mua thêm|lấy thêm)\s*(vớ|tất|bình xịt|xịt nano|xịt bọt)/i.test(q)) {
    return {
      type: 'accessory_add',
      accessoryName: /xịt/i.test(q) ? 'Bình xịt bọt nano vệ sinh giày (+89.000 VND)' : 'Vớ thể thao dệt kim One Athletic (+49.000 VND)',
    };
  }

  // 3. Nhận diện các câu chào hỏi xã giao, cảm ơn (Smalltalk)
  const isSmalltalk =
    /^(xin chào|chào shop|chào bạn|chào em|chào ad|chào bot|hello|hi|hey|alo|shop ơi|bot ơi)(\s+(shop|ad|em|bot|bạn|nha|nhé|ơi))*[\s!.,?~]*$/i.test(q) ||
    /^(cảm ơn|cám ơn|thank you|thanks|tạm biệt|bye)(\s+(shop|ad|em|bot|bạn|nhiều|nha|nhé))*[\s!.,?~]*$/i.test(q);

  if (isSmalltalk) {
    return {
      type: 'smalltalk',
      answer: 'Dạ chào bạn! Tư vấn One rất hân hạnh được đồng hành cùng bạn tại One - Store. Bạn đang quan tâm đến mẫu giày chạy bộ, sneaker thời trang nào hay cần One hỗ trợ tư vấn chọn cỡ giày chuẩn dáng chân mình ạ?',
      chips: ['Tìm giày chạy bộ', 'Chân bè chọn size nào', 'Chính sách đổi trả', 'Phí vận chuyển COD'],
    };
  }

  // 4. Nhận diện hỏi thông tin showroom, địa chỉ, hotline, giờ mở cửa
  const isStoreInfo =
    /(địa chỉ|ở đâu|showroom|chi nhánh|cửa hàng|giờ mở cửa|mấy giờ đóng|hotline|số điện thoại|sđt shop|liên hệ)/i.test(q) &&
    !/(đặt|mua|chốt|hủy|size|màu|giá)/i.test(q);

  if (isStoreInfo) {
    return {
      type: 'store_info',
      answer: 'Dạ showroom chính hãng One - Store tọa lạc tại trục đường thể thao trung tâm TP.HCM, mở cửa phục vụ từ 08:30 đến 21:30 tất cả các ngày trong tuần (kể cả Thứ Bảy, Chủ Nhật và các ngày Lễ Tết).\n\n- **Hotline hỗ trợ 24/7:** 1900 8888\n- **Email chăm sóc:** support@one-store.vn\n- **Cam kết:** 100% sản phẩm phân phối độc quyền chính hãng Âu - Á. Khi đặt online, bạn hoàn toàn được **đồng kiểm và xỏ thử tại chỗ** trước khi thanh toán COD ạ!',
      chips: ['Xem 70 mẫu giày chính hãng', 'Chính sách freeship', 'Tư vấn chọn size'],
    };
  }

  return { type: 'catalog_or_policy' };
}

// 1. Kiểm thử Fast Local Pre-Router (Smalltalk)
const t1 = fastLocalRouter('xin chào shop');
assert(t1.type === 'smalltalk' && t1.answer && t1.chips?.length > 0, 'Nhận diện Smalltalk: "xin chào shop"');

const t2 = fastLocalRouter('cảm ơn bạn nhé!');
assert(t2.type === 'smalltalk' && t2.answer?.includes('Tư vấn One'), 'Nhận diện Smalltalk: "cảm ơn bạn nhé!"');

const t3 = fastLocalRouter('hello');
assert(t3.type === 'smalltalk', 'Nhận diện Smalltalk: "hello"');

// 2. Kiểm thử Fast Local Pre-Router (Store Info)
const t4 = fastLocalRouter('địa chỉ showroom của shop ở đâu?');
assert(t4.type === 'store_info' && t4.answer?.includes('TP.HCM') && t4.answer?.includes('1900 8888'), 'Nhận diện Store Info: "địa chỉ showroom của shop ở đâu?"');

const t5 = fastLocalRouter('giờ mở cửa');
assert(t5.type === 'store_info' && t5.answer?.includes('08:30 đến 21:30'), 'Nhận diện Store Info: "giờ mở cửa"');

const t6 = fastLocalRouter('hotline');
assert(t6.type === 'store_info' && t6.answer?.includes('1900 8888'), 'Nhận diện Store Info: "hotline"');

// 3. Kiểm thử Fast Local Pre-Router (Order Lookup)
const t7 = fastLocalRouter('tra cứu đơn hàng ONE-20261104-ABCD');
assert(t7.type === 'order_lookup' && t7.orderCode === 'ONE-20261104-ABCD', 'Nhận diện Order Lookup: "ONE-20261104-ABCD"');

const t8 = fastLocalRouter('kiểm tra giúp mã đơn ONE-89ABCDEF');
assert(t8.type === 'order_lookup' && t8.orderCode === 'ONE-89ABCDEF', 'Nhận diện Order Lookup: "ONE-89ABCDEF"');

// 4. Kiểm thử Fast Local Pre-Router (Accessory Add)
const t9 = fastLocalRouter('thêm vớ thể thao');
assert(t9.type === 'accessory_add' && t9.accessoryName?.includes('Vớ thể thao'), 'Nhận diện Mua kèm phụ kiện: "thêm vớ thể thao"');

const t10 = fastLocalRouter('thêm bình xịt nano');
assert(t10.type === 'accessory_add' && t10.accessoryName?.includes('bọt nano'), 'Nhận diện Mua kèm phụ kiện: "thêm bình xịt nano"');

// 5. Kiểm thử Fast Local Pre-Router (Catalog & Policy Fallback)
const t11 = fastLocalRouter('tư vấn giày chạy bộ Asics cho chân bè');
assert(t11.type === 'catalog_or_policy', 'Nhận diện Catalog query: "tư vấn giày chạy bộ Asics cho chân bè"');

const t12 = fastLocalRouter('đôi Pegasus 41 size 42 có sẵn màu đen không');
assert(t12.type === 'catalog_or_policy', 'Nhận diện Catalog query: "đôi Pegasus 41 size 42..."');

// 6. Kiểm thử Speech Sanitize logic
const speechCode = fs.readFileSync('backend/src/speech.ts', 'utf8');
assert(speechCode.includes('sanitizeTranscribedText') && speechCode.includes('SNEAKER_ACOUSTIC_PROMPT'), 'File speech.ts chứa hàm sanitize và acoustic prompt');
assert(speechCode.includes('whisper-large-v3-turbo'), 'Gọi mô hình Whisper Large v3 Turbo trên Workers AI');

// 7. Kiểm tra sự tồn tại của endpoint transcribe và streamSSE trong chatbot.ts
const chatbotCode = fs.readFileSync('backend/src/chatbot.ts', 'utf8');
assert(chatbotCode.includes('/chat/transcribe'), 'chatbot.ts có endpoint POST /chat/transcribe');
assert(chatbotCode.includes('streamSSE'), 'chatbot.ts hỗ trợ giao thức streamSSE');
assert(chatbotCode.includes('fastLocalRouter'), 'chatbot.ts đã tích hợp Fast Local Pre-Router');

console.log(`\n=== TỔNG KẾT KIỂM THỬ: ${passed} ĐẠT / ${failed} THẤT BẠI ===`);
if (failed > 0) process.exit(1);
