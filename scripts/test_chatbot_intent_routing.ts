/**
 * BỘ KIỂM THỬ TỰ ĐỘNG INTENT ROUTING & CONTEXT SWITCH CHATBOT V2.0 (TYPESCRIPT)
 * Dự án One - Store — Trợ lý "Tư vấn One"
 */

import fs from 'fs';
import { extractOrderDetails, fastLocalRouter } from '../backend/src/chatbot';
import type { ProductRecord } from '../backend/src/chatbot';

console.log('=== BẮT ĐẦU KIỂM THỬ: TỐI ƯU INTENT ROUTING & CONTEXT SWITCH CHATBOT ===\n');

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
check('extractOrderDetails nhận diện isDiscoveryIntent', chatbotSrc.includes('const isDiscoveryIntent ='));
check('extractOrderDetails nhận diện isContextSwitch', chatbotSrc.includes('const isContextSwitch ='));
check('extractOrderDetails chỉ quét role === user trong lịch sử', chatbotSrc.includes("if (turn.role !== 'user') continue;"));
check('isOrderIntent chỉ kiểm tra trên queryLower hiện tại', chatbotSrc.includes('const isOrderIntent =') && !chatbotSrc.includes('.test(allText)'));
check('Đã loại bỏ ví dụ hardcode Asics Novablast 4 trong form hướng dẫn', !chatbotSrc.includes('ví dụ: Asics Novablast 4 Trampoline'));
check('Nhánh 1 có phát sự kiện reset pendingOrder khi context switch', chatbotSrc.includes('if (orderDetails.isContextSwitch && pendingOrder)'));

// Mock danh mục sản phẩm từ CSDL D1
const mockProducts: ProductRecord[] = [
  {
    id: 101,
    name: 'Asics Novablast 4 Trampoline',
    slug: 'asics-novablast-4-trampoline',
    category: 'Running',
    description: 'Giày chạy bộ Asics đệm đàn hồi Trampoline.',
    price: 3690000,
    compare_at_price: null,
    stock: 25,
    sizes: JSON.stringify(['39', '40', '41', '42', '43', '44']),
    colors: JSON.stringify(['Đen', 'Trắng Phối Xanh Neon']),
    image_key: 'asics_novablast_4.webp',
    featured: 1,
    created_at: new Date().toISOString(),
  },
  {
    id: 102,
    name: 'Nike Air Zoom Pegasus 41 ReactX',
    slug: 'nike-air-zoom-pegasus-41-reactx',
    category: 'Running',
    description: 'Giày chạy bộ quốc dân Nike Pegasus 41 đệm ReactX.',
    price: 3890000,
    compare_at_price: null,
    stock: 30,
    sizes: JSON.stringify(['39', '40', '41', '42', '43', '44', '45']),
    colors: JSON.stringify(['Trắng Đen', 'Xanh Volt']),
    image_key: 'nike_pegasus_41.webp',
    featured: 1,
    created_at: new Date().toISOString(),
  },
  {
    id: 103,
    name: 'Anta Walker Retro Casual',
    slug: 'anta-walker-retro-casual',
    category: 'Lifestyle',
    description: 'Sneaker phong cách retro đường phố Anta.',
    price: 1890000,
    compare_at_price: null,
    stock: 15,
    sizes: JSON.stringify(['39', '40', '41', '42', '43']),
    colors: JSON.stringify(['Trắng Ngà', 'Xám Bạc']),
    image_key: 'anta_walker_retro.webp',
    featured: 0,
    created_at: new Date().toISOString(),
  },
];

// --- TEST CASE 1: Khách hỏi ngoài danh mục sneaker ("tôi muốn mua coffee") ---
console.log('\n--- 1. Kiểm thử sản phẩm ngoài danh mục ("tôi muốn mua coffee") ---');
{
  const query = 'tôi muốn mua coffee';
  const history = [
    { role: 'user' as const, text: 'chào' },
    { role: 'assistant' as const, text: 'Dạ chào bạn! One - Store chuyên phân phối giày thể thao và sneaker chính hãng...' },
  ];
  const res = extractOrderDetails(query, history, null, mockProducts);

  check('Không khớp sản phẩm giày nào trong kho (product === null)', res.product === null, `product: ${res.product?.name}`);
  check('Không có thông tin liên hệ', !res.customerName && !res.phone && !res.address);
  const canEnterOrdering = Boolean(res.product && (res.isOrderIntent || res.isConfirmIntent)) || Boolean(res.phone && res.address);
  check('Không kích hoạt luồng đặt hàng (canEnterOrdering === false)', canEnterOrdering === false);
}

// --- TEST CASE 2: Khách hỏi chung chung ("làm thế nào để mua") sau khi bot đưa ví dụ ---
console.log('\n--- 2. Kiểm thử chống tự ngộ nhận sản phẩm từ ví dụ của bot ---');
{
  const query = 'làm thế nào để mua';
  const history = [
    { role: 'user' as const, text: 'tôi muốn mua coffee' },
    {
      role: 'assistant' as const,
      text: 'Dạ chào bạn! Để One - Store lên đơn và giao hàng tận nơi cho bạn, bạn vui lòng gửi giúp One các thông tin đơn hàng theo mẫu sau nhé:\n- Tên mẫu giày bạn muốn đặt: (Tên mẫu giày sneaker bạn muốn mua)\n- Size giày: 39\n...',
    },
  ];
  const res = extractOrderDetails(query, history, null, mockProducts);

  check('Tuyệt đối không tự gán mẫu Asics Novablast 4', res.product === null, `matched: ${res.product?.name}`);
  check('Không có cờ chốt đơn (isConfirmIntent === false)', res.isConfirmIntent === false);
}

// --- TEST CASE 3: Chuyển ngữ cảnh linh hoạt khi khách hỏi lọc giá ("Tìm đôi dưới 1 triệu") ---
console.log('\n--- 3. Kiểm thử chuyển ngữ cảnh (Context Switch Detection) ---');
{
  const pendingAsics = {
    productId: 101,
    productName: 'Asics Novablast 4 Trampoline',
    size: '42',
    color: 'Đen',
    quantity: 1,
    total: 3690000,
  };

  const query = 'Tìm đôi dưới 1 triệu';
  const history = [
    { role: 'user' as const, text: 'đặt hàng' },
    { role: 'assistant' as const, text: 'Dạ bạn vui lòng bổ sung thông tin size và màu...' },
  ];

  const res = extractOrderDetails(query, history, pendingAsics, mockProducts);

  check('Phát hiện ý định tìm kiếm/lọc (isDiscoveryIntent === true)', res.isDiscoveryIntent === true);
  check('Kích hoạt chuyển ngữ cảnh (isContextSwitch === true)', res.isContextSwitch === true);
  check('Hủy bỏ liên kết với pendingOrder Asics cũ (product === null)', res.product === null, `matched: ${res.product?.name}`);
}

// --- TEST CASE 4: Bóc tách thực thể đầy đủ và chính xác ---
console.log('\n--- 4. Kiểm thử bộ bóc tách thực thể hợp lệ ---');
{
  const query = 'tên tôi là Nguyễn Văn Tuấn, số điện thoại 0987654321, giao về 45 Đường Trần Phú Quận Ba Đình Hà Nội, lấy đôi Asics Novablast size 42 màu Đen';
  const res = extractOrderDetails(query, [], null, mockProducts);

  check('Bóc tách đúng tên khách hàng', res.customerName === 'Nguyễn Văn Tuấn', `name: ${res.customerName}`);
  check('Bóc tách đúng số điện thoại 10 số', res.phone === '0987654321', `phone: ${res.phone}`);
  check('Bóc tách đúng địa chỉ', Boolean(res.address?.includes('Trần Phú')), `addr: ${res.address}`);
  check('Bóc tách đúng sản phẩm Asics Novablast 4', res.product?.id === 101, `prod: ${res.product?.name}`);
  check('Bóc tách đúng size 42', res.size === '42', `size: ${res.size}`);
  check('Bóc tách đúng màu Đen', res.color === 'Đen', `color: ${res.color}`);
}

// --- TEST CASE 5: Kiểm thử phòng ngừa nuốt nhãn và rách câu ---
console.log('\n--- 5. Kiểm thử phòng ngừa nuốt nhãn và rách câu ---');
{
  const query = 'tôi tên: Số điện thoại nhận hàng:';
  const res = extractOrderDetails(query, [], null, mockProducts);

  check('Loại bỏ chuỗi tên nếu dính từ khóa nhãn hệ thống (customerName === null)', res.customerName === null, `actual: ${res.customerName}`);
}

// --- TEST CASE 6: Khách hỏi hủy đơn ---
console.log('\n--- 6. Kiểm thử lệnh hủy đơn hàng ---');
{
  const resCancel = extractOrderDetails('thôi không mua nữa', [], null, mockProducts);
  check('Nhận diện chính xác ý định hủy đơn', resCancel.isCancelIntent === true);
  check('isContextSwitch bật khi hủy', resCancel.isContextSwitch === true);
}

// --- TEST CASE 7: Fast Local Router và Tra cứu đơn ---
console.log('\n--- 7. Kiểm thử Fast Local Pre-Router ---');
{
  const smalltalk = fastLocalRouter('xin chào shop');
  check('Fast Router bắt Smalltalk tức thì', Boolean(smalltalk?.answer?.includes('Tư vấn One')));

  const storeInfo = fastLocalRouter('địa chỉ showroom ở đâu');
  check('Fast Router bắt Showroom Hotline tức thì', Boolean(storeInfo?.answer?.includes('1900 8888')));

  const orderLookup = fastLocalRouter('ONE-20261104-ABCD');
  check('Fast Router bắt Order Lookup 0ms', Boolean(orderLookup?.type === 'order_lookup'));
}

console.log(`\n========================================`);
console.log(`KẾT QUẢ KIỂM THỬ: ${passed}/${total} TIÊU CHÍ ĐẠT (${Math.round((passed / total) * 100)}%)`);
console.log(`========================================\n`);

if (passed !== total) {
  process.exit(1);
}
