const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// 1. Lấy toàn bộ sản phẩm từ D1 local
console.log('1. Đang truy vấn danh sách sản phẩm từ D1 local...');
const rawProducts = execSync(
  'npx wrangler d1 execute fashion_db --local --command="SELECT id, name, category, price, sizes, colors FROM products ORDER BY id ASC"',
  { encoding: 'utf-8', cwd: path.resolve(__dirname, '..') }
);

const match = rawProducts.match(/\[\s*\{\s*"results":\s*(\[[\s\S]*?\])\s*,\s*"success":\s*true/);
if (!match) {
  console.error('Không thể parse dữ liệu sản phẩm từ wrangler output:\n', rawProducts);
  process.exit(1);
}

const products = JSON.parse(match[1]);
console.log(`Đã nạp thành công ${products.length} sản phẩm sneaker.`);

// Danh sách khách hàng mẫu chuẩn Việt Nam với thông tin thực tế
const customersPool = [
  // Khách VIP (sẽ được gán nhiều đơn)
  { name: 'Trần Phương Đoàn', phone: '0395724805', address: 'Số 12 Ngõ 84 Ngọc Khánh, Ba Đình, Hà Nội' },
  { name: 'Nguyễn Hoàng Nam', phone: '0903124567', address: '254/12 Lê Văn Sỹ, Phường 14, Quận 3, TP.HCM' },
  { name: 'Lê Thanh Tùng', phone: '0988654321', address: 'Số 45 Trần Phú, Phường Hải Châu 1, Hải Châu, Đà Nẵng' },
  { name: 'Đỗ Thị Mai Anh', phone: '0912334455', address: 'Tòa Landmark 2 - Vinhomes Central Park, Bình Thạnh, TP.HCM' },
  { name: 'Phạm Quốc Tuấn', phone: '0979888999', address: 'Biệt thự BT4, KĐT Ngoại Giao Đoàn, Bắc Từ Liêm, Hà Nội' },

  // Khách Tiềm năng (mua 2-3 đơn)
  { name: 'Vũ Minh Đức', phone: '0934567890', address: '78 Lạch Tray, Ngô Quyền, Hải Phòng' },
  { name: 'Bùi Ngọc Lan', phone: '0945678901', address: '120 Đường 30/4, Ninh Kiều, Cần Thơ' },
  { name: 'Hoàng Văn Hùng', phone: '0967890123', address: 'Đại Lộ Bình Dương, Thuận An, Bình Dương' },
  { name: 'Dương Thu Trang', phone: '0978901234', address: '56 Đồng Khởi, Biên Hòa, Đồng Nai' },
  { name: 'Ngô Kiến Huy', phone: '0989012345', address: '18 Hùng Vương, TP. Hạ Long, Quảng Ninh' },
  { name: 'Phan Bảo Châu', phone: '0909123456', address: 'Khu Phố 6, Phường Tam Hiệp, Biên Hòa, Đồng Nai' },

  // Khách hàng Mới (mua 1 đơn)
  { name: 'Đặng Đình Khoa', phone: '0918234567', address: '42 Nguyễn Huệ, TP. Huế, Thừa Thiên Huế' },
  { name: 'Lâm Hải Yến', phone: '0929345678', address: '89 Phan Chu Trinh, TP. Nha Trang, Khánh Hòa' },
  { name: 'Mai Tiến Dũng', phone: '0938456789', address: '15 Trần Hưng Đạo, TP. Quy Nhơn, Bình Định' },
  { name: 'Tạ Minh Tâm', phone: '0947567890', address: '33 Lê Lợi, TP. Vinh, Nghệ An' },
  { name: 'Cao Thái Sơn', phone: '0956678901', address: '67 Lê Duẩn, TP. Buôn Ma Thuột, Đắk Lắk' },
  { name: 'Đinh Trọng Thắng', phone: '0965789012', address: '102 Nguyễn Trãi, TP. Thanh Hóa' },
  { name: 'Hồ Quang Hiếu', phone: '0974890123', address: '88 Quang Trung, TP. Thái Nguyên' },
  { name: 'Lương Bích Hữu', phone: '0983901234', address: '24 Hoàng Văn Thụ, TP. Bắc Giang' },
  { name: 'Vương Gia Huy', phone: '0992012345', address: '50 Đào Xã, Thanh Thủy, Phú Thọ' },
  { name: 'Trịnh Thăng Bình', phone: '0908123456', address: '14 Bà Triệu, TP. Vũng Tàu, Bà Rịa - Vũng Tàu' },
  { name: 'Khổng Tú Quỳnh', phone: '0917234567', address: '29 Lý Thường Kiệt, TP. Long Xuyên, An Giang' },
  { name: 'Nguyễn Kiều Oanh', phone: '0926345678', address: '71 Cách Mạng Tháng 8, TP. Cà Mau' },
  { name: 'Tôn Nữ Diệu Thảo', phone: '0935456789', address: '82 Nguyễn Thái Học, TP. Rạch Giá, Kiên Giang' },
  { name: 'Phan Thanh Bình', phone: '0944567890', address: '47 Trương Định, Quận 1, TP.HCM' },
  { name: 'Đoàn Văn Hậu', phone: '0953678901', address: '63 Cầu Giấy, Quan Hoa, Cầu Giấy, Hà Nội' },
  { name: 'Nguyễn Quang Hải', phone: '0962789012', address: '10 Hàng Gai, Hoàn Kiếm, Hà Nội' },
  { name: 'Bùi Tiến Dũng', phone: '0971890123', address: '22 Thạch Hãn, Hải Lăng, Quảng Trị' },
  { name: 'Lê Công Vinh', phone: '0980901234', address: '39 Trần Phú, TP. Tam Kỳ, Quảng Nam' },
  { name: 'Phạm Thành Lương', phone: '0999012345', address: '18 Hàng Bạc, Hoàn Kiếm, Hà Nội' },
  { name: 'Văn Quyến', phone: '0901112233', address: '55 Nguyễn Văn Cừ, TP. Hưng Yên' },
  { name: 'Đỗ Hùng Dũng', phone: '0912223344', address: '91 Tôn Đức Thắng, Đống Đa, Hà Nội' },
  { name: 'Nguyễn Phong Hồng Duy', phone: '0923334455', address: '14 Hai Bà Trưng, TP. Pleiku, Gia Lai' },
  { name: 'Nguyễn Văn Toàn', phone: '0934445566', address: '77 Lê Hồng Phong, TP. Nam Định' },
  { name: 'Nguyễn Tuấn Anh', phone: '0945556677', address: '30 Lê Duẩn, TP. Thái Bình' }
];

// Hàm sinh mã hex ngẫu nhiên
function randomHex(len) {
  let res = '';
  const chars = '0123456789ABCDEF';
  for (let i = 0; i < len; i++) {
    res += chars[Math.floor(Math.random() * chars.length)];
  }
  return res;
}

// Hàm sinh ngày giờ ngẫu nhiên trong khoảng thời gian (trả về ISO UTC)
function randomDate(start, end) {
  const date = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  // Giờ ban ngày từ 8h sáng tới 22h tối theo giờ VN (+7)
  const vnHour = Math.floor(Math.random() * 15) + 8; // 8 đến 22
  const minute = Math.floor(Math.random() * 60);
  const second = Math.floor(Math.random() * 60);
  
  // Chuyển sang UTC (trừ 7 tiếng)
  date.setUTCHours(vnHour - 7, minute, second, Math.floor(Math.random() * 900) + 50);
  return date.toISOString();
}

// Bắt đầu tạo dữ liệu các đơn hàng
const ordersList = [];
const now = new Date('2026-11-02T12:00:00.000Z');
const startOfYear = new Date('2026-01-02T00:00:00.000Z');

// Cấu hình phân bổ tháng từ 01/2026 đến 11/2026
// Tổng khoảng 165 đơn hàng
const monthConfigs = [
  { month: 1, count: 14, days: 31 }, // T1 (Tết)
  { month: 2, count: 12, days: 28 }, // T2
  { month: 3, count: 16, days: 31 }, // T3
  { month: 4, count: 15, days: 30 }, // T4
  { month: 5, count: 17, days: 31 }, // T5 (Mùa chạy bộ hè)
  { month: 6, count: 18, days: 30 }, // T6
  { month: 7, count: 16, days: 31 }, // T7
  { month: 8, count: 19, days: 31 }, // T8 (Tựu trường)
  { month: 9, count: 18, days: 30 }, // T9
  { month: 10, count: 20, days: 31 }, // T10 (Thu đông)
  { month: 11, count: 10, days: 2 },  // T11 (1-2 ngày đầu tháng)
];

// Khách VIP sẽ được chọn thường xuyên hơn (xác suất 35%)
const vipCustomers = customersPool.slice(0, 5);
const potentialCustomers = customersPool.slice(5, 11);
const regularCustomers = customersPool.slice(11);

function pickCustomer() {
  const r = Math.random();
  if (r < 0.35) {
    return vipCustomers[Math.floor(Math.random() * vipCustomers.length)];
  } else if (r < 0.65) {
    return potentialCustomers[Math.floor(Math.random() * potentialCustomers.length)];
  } else {
    return regularCustomers[Math.floor(Math.random() * regularCustomers.length)];
  }
}

// Trọng số các sản phẩm bán chạy (Panda, Pegasus, Samba, Nimbus, 550, Salomon)
const popularKeywords = ['Pegasus', 'Samba', 'Nimbus', 'Panda', '550', 'Salomon', 'Vaporfly'];
const popularProducts = products.filter(p => popularKeywords.some(k => p.name.includes(k)));

function pickProduct() {
  if (popularProducts.length > 0 && Math.random() < 0.45) {
    return popularProducts[Math.floor(Math.random() * popularProducts.length)];
  }
  return products[Math.floor(Math.random() * products.length)];
}

let orderSeq = 1;

for (const mc of monthConfigs) {
  const mStart = new Date(Date.UTC(2026, mc.month - 1, 1, 1, 0, 0));
  const mEnd = new Date(Date.UTC(2026, mc.month - 1, mc.days, 15, 0, 0));

  for (let i = 0; i < mc.count; i++) {
    const cust = pickCustomer();
    const createdAt = randomDate(mStart, mEnd);

    // Xác định trạng thái đơn hàng
    let status = 'completed';
    if (mc.month < 10) {
      status = Math.random() < 0.08 ? 'cancelled' : 'completed';
    } else if (mc.month === 10) {
      const r = Math.random();
      if (r < 0.07) status = 'cancelled';
      else if (r < 0.15) status = 'shipping';
      else status = 'completed';
    } else {
      // Tháng 11 gần nhất (2 ngày đầu tháng)
      const r = Math.random();
      if (r < 0.35) status = 'pending';
      else if (r < 0.60) status = 'confirmed';
      else if (r < 0.85) status = 'shipping';
      else status = 'completed';
    }

    // Voucher ngẫu nhiên
    let voucherCode = null;
    let discount = 0;
    const hasVoucher = Math.random() < 0.25;
    if (hasVoucher) {
      if (Math.random() < 0.6) {
        voucherCode = 'ONE10';
      } else {
        voucherCode = 'ONE50';
      }
    }

    // Chi tiết sản phẩm trong đơn (1-3 món)
    const itemCount = Math.random() < 0.75 ? 1 : (Math.random() < 0.85 ? 2 : 3);
    const orderItems = [];
    let subtotal = 0;

    for (let j = 0; j < itemCount; j++) {
      const prod = pickProduct();
      let sizes = ['40', '41', '42', '43'];
      try { sizes = JSON.parse(prod.sizes); } catch (e) {}
      let colors = ['Tiêu chuẩn'];
      try { colors = JSON.parse(prod.colors); } catch (e) {}

      const size = sizes[Math.floor(Math.random() * sizes.length)] || '42';
      const color = colors[Math.floor(Math.random() * colors.length)] || 'Tiêu chuẩn';
      const quantity = Math.random() < 0.9 ? 1 : 2;
      const unitPrice = prod.price;

      subtotal += quantity * unitPrice;
      orderItems.push({
        product_id: prod.id,
        product_name: prod.name,
        size,
        color,
        quantity,
        unit_price: unitPrice
      });
    }

    if (voucherCode === 'ONE10') {
      discount = Math.round(subtotal * 0.1);
    } else if (voucherCode === 'ONE50') {
      discount = 50000;
    }
    const total = Math.max(0, subtotal - discount);

    const code = `ONE-${randomHex(8)}`;
    ordersList.push({
      id: orderSeq++,
      code,
      customer_name: cust.name,
      phone: cust.phone,
      address: cust.address,
      note: '[Hình thức: COD]',
      total,
      status,
      voucher_code: voucherCode,
      discount,
      created_at: createdAt,
      items: orderItems
    });
  }
}

// Sắp xếp đơn hàng theo thứ tự thời gian tăng dần
ordersList.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

// Cập nhật lại ID theo thứ tự thời gian
ordersList.forEach((ord, idx) => {
  ord.id = idx + 1;
});

console.log(`Đã tạo thành công danh sách ${ordersList.length} đơn hàng ảo trải dài từ 01/2026 đến 11/2026.`);

// 2. Tạo file SQL D1
let sqlContent = `-- Seed toàn bộ đơn hàng giả lập One - Store từ 01/2026 đến 11/2026
-- Xóa sạch dữ liệu đơn hàng cũ
DELETE FROM order_events;
DELETE FROM order_items;
DELETE FROM orders;

`;

for (const ord of ordersList) {
  const vCode = ord.voucher_code ? `'${ord.voucher_code}'` : 'NULL';
  sqlContent += `INSERT INTO orders (id, code, customer_name, phone, address, note, total, status, voucher_code, discount, created_at)
VALUES (${ord.id}, '${ord.code}', '${ord.customer_name.replace(/'/g, "''")}', '${ord.phone}', '${ord.address.replace(/'/g, "''")}', '${ord.note}', ${ord.total}, '${ord.status}', ${vCode}, ${ord.discount}, '${ord.created_at}');\n`;

  for (const item of ord.items) {
    sqlContent += `INSERT INTO order_items (order_id, product_id, product_name, size, color, quantity, unit_price)
VALUES (${ord.id}, ${item.product_id}, '${item.product_name.replace(/'/g, "''")}', '${item.size}', '${item.color.replace(/'/g, "''")}', ${item.quantity}, ${item.unit_price});\n`;
  }
}

const targetSqlPath = path.resolve(__dirname, '..', 'backend', 'migrations', 'seed_mock_orders_2026.sql');
fs.writeFileSync(targetSqlPath, sqlContent, 'utf-8');
console.log(`Đã xuất file SQL ra: ${targetSqlPath} (Kích thước: ${(sqlContent.length / 1024).toFixed(1)} KB)`);
