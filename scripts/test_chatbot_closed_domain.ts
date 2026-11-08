/**
 * BỘ KIỂM THỬ TỰ ĐỘNG CHATBOT CLOSED-DOMAIN & ULTRA-FAST ROUTING (V2.2)
 * Dự án One - Store — Trợ lý "Tư vấn One"
 */

import fs from 'fs';
import { fastLocalRouter, extractOrderDetails } from '../backend/src/chatbot';
import type { ProductRecord } from '../backend/src/chatbot';

console.log('=== BẮT ĐẦU KIỂM THỬ: CLOSED-DOMAIN AI & ULTRA-FAST ROUTING ===\n');

let passed = 0;
let total = 0;

function check(desc: string, condition: boolean, detail: string = '') {
  total++;
  if (condition) {
    console.log(`[PASS] ${desc}`);
    passed++;
  } else {
    console.error(`[FAIL] ${desc} ${detail ? '(' + detail + ')' : ''}`);
  }
}

// 1. Kiểm tra tĩnh trong mã nguồn
const chatbotSrc = fs.readFileSync('backend/src/chatbot.ts', 'utf8');
check('Có Fast Out-of-Scope Guardrail trong fastLocalRouter', chatbotSrc.includes('type: \'out_of_scope\''));
check('Có phản hồi nhanh Chính sách Freeship', chatbotSrc.includes('type: \'policy_freeship\''));
check('Có phản hồi nhanh Chính sách Đổi size 7 ngày', chatbotSrc.includes('type: \'policy_return\''));
check('Có phản hồi nhanh Chính sách Bảo hành', chatbotSrc.includes('type: \'policy_warranty\''));
check('Có phản hồi nhanh Chính sách Đồng kiểm COD', chatbotSrc.includes('type: \'policy_inspection\''));
check('Có phản hồi nhanh Voucher ONE10', chatbotSrc.includes('type: \'policy_voucher\''));
check('Có phản hồi nhanh Cẩm nang đo size chân bè', chatbotSrc.includes('type: \'policy_sizeguide\''));
check('Có Tầng 3 Knowledge Gatekeeper kiểm tra maxVectorScore', chatbotSrc.includes('TẦNG 3: KNOWLEDGE GATEKEEPER'));
check('System Prompt chứa chỉ thị Strict Closed-Domain Directive', chatbotSrc.includes('CLOSED-DOMAIN STRICT GROUNDING'));
check('System Prompt cấm 100% tri thức ngoài thế giới', chatbotSrc.includes('NGHIÊM CẤM 100% SỬ DỤNG KIẾN THỨC BÊN NGOÀI THẾ GIỚI'));

// --- TEST CASE 1: Kiểm thử Fast Out-of-Scope Guardrail 0ms ---
console.log('\n--- 1. Kiểm thử Fast Out-of-Scope Guardrail (Chặn chủ đề ngoài phạm vi 0ms) ---');
{
  const out1 = fastLocalRouter('tôi muốn mua coffee');
  check('Từ chối cà phê tức thì 0ms (out_of_scope)', out1.type === 'out_of_scope');
  check('Nội dung từ chối nêu rõ giới hạn One - Store', Boolean(out1.answer?.includes('nằm ngoài phạm vi hoạt động của One - Store')));

  const out2 = fastLocalRouter('dự báo thời tiết hôm nay thế nào');
  check('Từ chối thời tiết tức thì 0ms', out2.type === 'out_of_scope');

  const out3 = fastLocalRouter('viết cho tôi đoạn code python giải toán');
  check('Từ chối viết code / giải toán tức thì 0ms', out3.type === 'out_of_scope');

  const out4 = fastLocalRouter('shop có bán áo thun hay quần jean không');
  check('Từ chối quần áo thời trang tức thì 0ms', out4.type === 'out_of_scope');

  const out5 = fastLocalRouter('có bán áo sơ mi không shop');
  check('Từ chối áo sơ mi phi giày dép tức thì 0ms', out5.type === 'out_of_scope');
}

// --- TEST CASE 2: Kiểm thử Fast Router 5 Chính sách cốt lõi 0ms ---
console.log('\n--- 2. Kiểm thử Fast Router 5 Chính sách cốt lõi 0ms ---');
{
  const ship1 = fastLocalRouter('phí ship của shop tính thế nào');
  check('Bắt chính sách Freeship tức thì 0ms', ship1.type === 'policy_freeship');
  check('Freeship nêu rõ mốc từ 3 đôi hoặc 5.000.000 VND', Boolean(ship1.answer?.includes('3 đôi') && ship1.answer?.includes('5.000.000 VND')));

  const ret1 = fastLocalRouter('nếu đi chật quá có được đổi size không');
  check('Bắt chính sách Đổi size 7 ngày tức thì 0ms', ret1.type === 'policy_return');
  check('Đổi size nêu rõ miễn phí 100% cước 2 chiều lần đầu', Boolean(ret1.answer?.toLowerCase().includes('miễn phí 100% cước 2 chiều') && ret1.answer?.includes('7 ngày')));

  const war1 = fastLocalRouter('chính sách bảo hành bao lâu');
  check('Bắt chính sách Bảo hành tức thì 0ms', war1.type === 'policy_warranty');
  check('Bảo hành nêu rõ 6 tháng Carbon, 12 tháng Lifestyle và dán keo trọn đời', Boolean(war1.answer?.includes('6 tháng') && war1.answer?.includes('12 tháng') && war1.answer?.includes('dán keo')));

  const insp1 = fastLocalRouter('có cho xem hàng và thử giày trước khi trả tiền không');
  check('Bắt chính sách Đồng kiểm COD tức thì 0ms', insp1.type === 'policy_inspection');
  check('Khẳng định 100% quyền mở hộp xỏ thử tại chỗ', Boolean(insp1.answer?.includes('mở hộp') && insp1.answer?.includes('xỏ thử trực tiếp')));

  const vouch1 = fastLocalRouter('shop có mã giảm giá voucher nào không');
  check('Bắt chính sách Voucher tức thì 0ms', vouch1.type === 'policy_voucher');
  check('Cung cấp chuẩn mã ONE10 giảm 10%', Boolean(vouch1.answer?.includes('ONE10') && vouch1.answer?.includes('10%')));

  const size1 = fastLocalRouter('hướng dẫn cách đo chân và chọn size cho chân bè');
  check('Bắt Cẩm nang đo size chân bè tức thì 0ms', size1.type === 'policy_sizeguide');
  check('Có 3 bước đo chân và lời khuyên tăng 0.5-1 size cho chân bè Á Đông', Boolean(size1.answer?.includes('3 bước') && size1.answer?.includes('tăng từ 0.5 đến 1 size')));
}

// --- TEST CASE 3: Kiểm thử Smalltalk, Showroom, Tra cứu đơn ---
console.log('\n--- 3. Kiểm thử Smalltalk, Showroom & Tra cứu đơn ---');
{
  const st = fastLocalRouter('xin chào shop');
  check('Smalltalk chào hỏi tức thì', st.type === 'smalltalk');

  const info = fastLocalRouter('địa chỉ showroom và hotline ở đâu');
  check('Store info hotline 1900 8888 tức thì', info.type === 'store_info' && Boolean(info.answer?.includes('1900 8888')));

  const lookup = fastLocalRouter('ONE-20261108-ABCD');
  check('Order Lookup mã ONE-... tức thì', lookup.type === 'order_lookup' && lookup.orderCode === 'ONE-20261108-ABCD');
}

// --- TEST CASE 4: Rà soát Zero-Emoji 100% trên toàn bộ câu trả lời Fast Router ---
console.log('\n--- 4. Kiểm tra tuân thủ quy chuẩn Zero-Emoji 100% ---');
{
  const testQueries = [
    'xin chào shop',
    'địa chỉ showroom ở đâu',
    'phí ship thế nào',
    'chính sách đổi size',
    'bảo hành bao lâu',
    'có cho thử giày không',
    'có voucher không',
    'cách đo chân cho chân bè',
    'tôi muốn mua coffee',
  ];

  const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;
  let allZeroEmoji = true;

  for (const q of testQueries) {
    const r = fastLocalRouter(q);
    if (r.answer && emojiRegex.test(r.answer)) {
      console.error(`  Phát hiện emoji trong câu trả lời của: "${q}"`);
      allZeroEmoji = false;
    }
  }

  check('100% câu trả lời Fast Router không chứa emoji', allZeroEmoji);
}

// --- TEST CASE 5: Kiểm thử bóc tách đặt hàng & chuyển ngữ cảnh ---
console.log('\n--- 5. Kiểm thử bóc tách đặt hàng & Context Switch ---');
{
  const mockProducts: ProductRecord[] = [
    {
      id: 101,
      name: 'Asics Novablast 4 Trampoline',
      category: 'Running',
      description: 'Giày chạy bộ Asics đệm đàn hồi Trampoline.',
      price: 3690000,
      stock: 25,
      sizes: JSON.stringify(['39', '40', '41', '42', '43', '44']),
      colors: JSON.stringify(['Đen', 'Trắng Phối Xanh Neon']),
    },
  ];

  const resOrder = extractOrderDetails(
    'tôi tên là Lê Hoàng Nam, sđt: 0912345678, giao về 24 Nguyễn Huệ Quận 1 TP.HCM, lấy đôi Asics Novablast size 42 màu Đen',
    [],
    null,
    mockProducts
  );
  check('Bóc tách đúng tên khách', resOrder.customerName === 'Lê Hoàng Nam');
  check('Bóc tách đúng số điện thoại', resOrder.phone === '0912345678');
  check('Bóc tách đúng địa chỉ', Boolean(resOrder.address?.includes('Nguyễn Huệ')));
  check('Bóc tách đúng sản phẩm Asics', resOrder.product?.id === 101);

  // Chuyển ngữ cảnh khi có pendingOrder nhưng khách hỏi giá rẻ
  const resSwitch = extractOrderDetails('có đôi nào rẻ hơn không', [], { productId: 101 }, mockProducts);
  check('Nhận diện chuyển ngữ cảnh khi hỏi mẫu rẻ hơn', resSwitch.isContextSwitch === true && resSwitch.product === null);
}

console.log(`\n========================================`);
console.log(`KẾT QUẢ KIỂM THỬ: ${passed}/${total} TIÊU CHÍ ĐẠT (${Math.round((passed / total) * 100)}%)`);
console.log(`========================================\n`);

if (passed !== total) {
  process.exit(1);
}

