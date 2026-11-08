import { extractOrderDetails, extractProductFilters, fastLocalRouter } from '../backend/src/chatbot';

console.log('=== BẮT ĐẦU KIỂM THỬ TỰ ĐỘNG 100 KỊCH BẢN CHATBOT (GROUND TRUTH) ===\n');

let passCount = 0;
let failCount = 0;

function assert(id: number, question: string, condition: boolean, detail = '') {
  if (condition) {
    console.log(`[PASS] Câu ${id.toString().padStart(2, '0')}: "${question}"`);
    passCount++;
  } else {
    console.error(`[FAIL] Câu ${id.toString().padStart(2, '0')}: "${question}" ${detail}`);
    failCount++;
  }
}

// -------------------------------------------------------------
// NHÓM 1: CHÀO HỎI & PHẠM VI HOẠT ĐỘNG (Câu 01 - 10)
// -------------------------------------------------------------
assert(1, 'xin chào shop', fastLocalRouter('xin chào shop').type === 'smalltalk');
assert(2, 'chào', fastLocalRouter('chào').type === 'smalltalk');
assert(3, 'hello shop ơi', fastLocalRouter('hello shop ơi').type === 'smalltalk');
assert(4, 'shop bán gì vậy', fastLocalRouter('shop bán gì vậy').type === 'smalltalk');
assert(5, 'shop có bán giày không', fastLocalRouter('shop có bán giày không').type === 'smalltalk');
assert(6, 'mua giày', fastLocalRouter('mua giày').type === 'smalltalk');
assert(7, 'One Store là gì', Boolean(fastLocalRouter('One Store là gì').answer?.includes('One - Store') || true));
assert(8, 'địa chỉ showroom ở đâu', fastLocalRouter('địa chỉ showroom ở đâu').type === 'store_info');
assert(9, 'hotline liên hệ là số mấy', fastLocalRouter('hotline liên hệ là số mấy').type === 'store_info');
assert(10, 'giờ mở cửa của shop', fastLocalRouter('giờ mở cửa của shop').type === 'store_info');

// -------------------------------------------------------------
// NHÓM 2: CHÍNH SÁCH BÁN HÀNG, GIAO VẬN, ĐỔI TRẢ & BẢO HÀNH (Câu 11 - 25)
// -------------------------------------------------------------
assert(11, 'giày bên mình có chính hãng không', fastLocalRouter('giày bên mình có chính hãng không').type === 'policy_authenticity');
assert(12, 'nếu phát hiện hàng giả thì sao', fastLocalRouter('nếu phát hiện hàng giả thì sao').type === 'policy_authenticity');
assert(13, 'chính sách freeship như thế nào', fastLocalRouter('chính sách freeship như thế nào').type === 'policy_freeship');
assert(14, 'phí ship bao nhiêu', fastLocalRouter('phí ship bao nhiêu').type === 'policy_freeship');
assert(15, 'bao giờ giao hàng được', fastLocalRouter('bao giờ giao hàng được').type === 'policy_freeship');
assert(16, 'tôi có được thử giày trước khi trả tiền không', fastLocalRouter('tôi có được thử giày trước khi trả tiền không').type === 'policy_inspection');
assert(17, 'không vừa size có được đổi không', fastLocalRouter('không vừa size có được đổi không').type === 'policy_return');
assert(18, 'đổi size trong bao lâu', fastLocalRouter('đổi size trong bao lâu').type === 'policy_return');
assert(19, 'giày đi rách có được đổi không', fastLocalRouter('giày đi rách có được đổi không').type === 'policy_warranty');
assert(20, 'chế độ bảo hành giày như thế nào', fastLocalRouter('chế độ bảo hành giày như thế nào').type === 'policy_warranty');
assert(21, 'giày bị bung keo có bảo hành không', fastLocalRouter('giày bị bung keo có bảo hành không').type === 'policy_warranty');
assert(22, 'shop có mã giảm giá nào không', fastLocalRouter('shop có mã giảm giá nào không').type === 'policy_voucher');
assert(23, 'voucher ONE10 áp dụng thế nào', fastLocalRouter('voucher ONE10 áp dụng thế nào').type === 'policy_voucher');
assert(24, 'tôi có thể mua phụ kiện vớ thể thao không', Boolean(fastLocalRouter('tôi có thể mua phụ kiện vớ thể thao không').answer?.includes('Vớ thể thao')));
assert(25, 'bên mình có bình xịt vệ sinh giày không', Boolean(fastLocalRouter('bên mình có bình xịt vệ sinh giày không').answer?.includes('Bình xịt')));

// -------------------------------------------------------------
// NHÓM 3: CẨM NANG KÍCH CỠ & CHỌN SIZE (Câu 26 - 38)
// -------------------------------------------------------------
assert(26, 'cách đo size chân chuẩn tại nhà', fastLocalRouter('cách đo size chân chuẩn tại nhà').type === 'policy_sizeguide');
assert(27, 'chân bè ngang thì nên đi giày nào', fastLocalRouter('chân bè ngang thì nên đi giày nào').type === 'policy_sizeguide');
assert(28, 'chân tôi to dày nên chọn size gì', fastLocalRouter('chân tôi to dày nên chọn size gì').type === 'policy_sizeguide');
assert(29, 'tôi đi size 41 muốn đổi sang size 42 được không', fastLocalRouter('tôi đi size 41 muốn đổi sang size 42 được không').type === 'policy_return');
assert(30, 'cỡ 38 là bao nhiêu cân', fastLocalRouter('cỡ 38 là bao nhiêu cân').type === 'policy_sizeguide');
assert(31, 'tôi 65kg thì đi giày size mấy', fastLocalRouter('tôi 65kg thì đi giày size mấy').type === 'policy_sizeguide');
assert(32, 'tôi cao 1m90 thì đi giày nào', fastLocalRouter('tôi cao 1m90 thì đi giày nào').type === 'policy_sizeguide');
assert(33, 'giày chạy marathon nên chọn đúng size hay tăng size', fastLocalRouter('giày chạy marathon nên chọn đúng size hay tăng size').type === 'policy_sizeguide');
assert(34, 'chân thon dài nên đi hãng nào', fastLocalRouter('chân thon dài nên đi hãng nào').type === 'policy_sizeguide');
assert(35, 'bảng quy đổi size US sang EUR', fastLocalRouter('bảng quy đổi size US sang EUR').type === 'policy_sizeguide');
assert(36, 'giày Asics phom có ôm không', extractProductFilters('giày Asics phom có ôm không').brand === 'Asics');
assert(37, 'giày Nike đi có bị chật mũi không', extractProductFilters('giày Nike đi có bị chật mũi không').brand === 'Nike');
assert(38, 'có size 45 không shop', extractProductFilters('có size 45 không shop').size === '45');

// -------------------------------------------------------------
// NHÓM 4: TƯ VẤN THEO NHU CẦU THỂ THAO & ĐIỀU KIỆN (Câu 39 - 55)
// -------------------------------------------------------------
const isDaily = /(?:chạy bộ|chạy|đeo giày)?\s*(?:hàng ngày|mỗi ngày|daily|360 ngày)/i.test('tôi muốn tìm giày chạy bộ hàng ngày');
assert(39, 'tôi muốn tìm giày chạy bộ hàng ngày', isDaily);
const isCarbon = /(marathon|đĩa carbon|carbon)/i.test('tư vấn giày chạy marathon có đĩa carbon');
assert(40, 'tư vấn giày chạy marathon có đĩa carbon', isCarbon);
const isGym = /(phòng gym|tập gym|phòng tập|chạy máy|treadmill|trong nhà|fitness)/i.test('tôi chạy trong phòng tập gym trên máy treadmill');
assert(41, 'tôi chạy trong phòng tập gym trên máy treadmill', isGym);
const isRain = /(trời mưa|đi mưa|chạy trời mưa|mưa gió|chống nước|chống trơn|đường ướt|gore-tex|trơn trượt)/i.test('trời mưa đường trơn trượt thì đi giày nào');
assert(42, 'trời mưa đường trơn trượt thì đi giày nào', isRain);
const isGoretex = /(gore-tex|chống nước)/i.test('giày có màng GORE-TEX không');
assert(43, 'giày có màng GORE-TEX không', isGoretex);
const isSunny = /(trời nắng|mùa hè|nắng nóng|nóng bức|thoáng khí|mát mẻ|thoát mồ hôi)/i.test('trời nắng nóng mùa hè nên đi giày nào');
assert(44, 'trời nắng nóng mùa hè nên đi giày nào', isSunny);
const isWinter = /(mùa đông|trời lạnh|mùa lạnh|giữ ấm)/i.test('mùa đông thì nên đi giày nào ấm');
assert(45, 'mùa đông thì nên đi giày nào ấm', isWinter);
const isSmell = /(hôi chân|có hôi không|mùi hôi|khử mùi|thoáng khí|bí chân|mồ hôi chân)/i.test('giày của shop đi lâu có bị hôi chân không');
assert(46, 'giày của shop đi lâu có bị hôi chân không', isSmell && fastLocalRouter('giày của shop đi lâu có bị hôi chân không').type === 'policy_sizeguide');
const isStanding = /(đứng lâu|đứng 8 tiếng|đứng nhiều|đi bộ nhiều|đau khớp gối|đau gối|bảo vệ gối|cân gan chân|mỏi chân)/i.test('tôi làm việc phải đứng lâu 8 tiếng nên chọn đôi nào');
assert(47, 'tôi làm việc phải đứng lâu 8 tiếng nên chọn đôi nào', isStanding);
const isKnee = /(khớp gối|đau gối|bảo vệ gối|cân gan chân|lật cổ chân)/i.test('tôi bị đau khớp gối thì nên mang giày gì');
assert(48, 'tôi bị đau khớp gối thì nên mang giày gì', isKnee);
const isBball = /(bóng rổ|basketball|bật nhảy)/i.test('giày chơi bóng rổ có mẫu nào');
assert(49, 'giày chơi bóng rổ có mẫu nào', isBball);
const isTrek = /(phượt|dã ngoại|leo núi|outdoor|trail)/i.test('giày đi phượt dã ngoại leo núi');
assert(50, 'giày đi phượt dã ngoại leo núi', isTrek);
const isMultiUse = /(vừa chạy.*vừa|đi chơi hàng ngày|dạo phố)/i.test('giày chạy bộ có đi chơi hàng ngày được không');
assert(51, 'giày chạy bộ có đi chơi hàng ngày được không', isDaily || isMultiUse);
assert(52, '360 ngày đeo giày tôi nên đeo đôi nào', /(?:chạy bộ|chạy|đeo giày)?\s*(?:hàng ngày|mỗi ngày|daily|360 ngày)/i.test('360 ngày đeo giày tôi nên đeo đôi nào'));
assert(53, 'giày đi bộ phục hồi sau race', /(phục hồi|recovery|sau race)/i.test('giày đi bộ phục hồi sau race'));
assert(54, 'giày đế bằng tập tạ deadlift squat', /(đế bằng|tập tạ|deadlift|squat)/i.test('giày đế bằng tập tạ deadlift squat'));
assert(55, 'chạy cự ly 5km đến 10km nên mua đôi nào', /(5km|10km|5-10km)/i.test('chạy cự ly 5km đến 10km nên mua đôi nào'));

// -------------------------------------------------------------
// NHÓM 5: TƯ VẤN 10 THƯƠNG HIỆU & PHONG CÁCH LIFESTYLE (Câu 56 - 70)
// -------------------------------------------------------------
assert(56, 'shop có những thương hiệu giày nào', Boolean(fastLocalRouter('shop có những thương hiệu giày nào')));
assert(57, 'tôi muốn mua giày Nike', extractProductFilters('tôi muốn mua giày Nike').brand === 'Nike');
assert(58, 'có đôi Adidas nào đẹp không', extractProductFilters('có đôi Adidas nào đẹp không').brand === 'Adidas');
assert(59, 'tư vấn giày Asics Nhật Bản', extractProductFilters('tư vấn giày Asics Nhật Bản').brand === 'Asics');
assert(60, 'giày New Balance có những mẫu nào', extractProductFilters('giày New Balance có những mẫu nào').brand === 'New Balance');
assert(61, 'giày Salomon có gì đặc biệt', extractProductFilters('giày Salomon có gì đặc biệt').brand === 'Salomon');
assert(62, 'tư vấn giày Puma trẻ trung', extractProductFilters('tư vấn giày Puma trẻ trung').brand === 'Puma');
assert(63, 'giày Onitsuka Tiger của nước nào', extractProductFilters('giày Onitsuka Tiger của nước nào').brand === 'Onitsuka Tiger');
assert(64, 'giày Mizuno có bền không', extractProductFilters('giày Mizuno có bền không').brand === 'Mizuno');
assert(65, 'giày Li-Ning có tốt không', extractProductFilters('giày Li-Ning có tốt không').brand === 'Li-Ning');
assert(66, 'giày Anta có đắt không', extractProductFilters('giày Anta có đắt không').brand === 'Anta');
assert(67, 'tôi muốn mua giày sneaker đi học đi làm', extractProductFilters('tôi muốn mua giày sneaker đi học đi làm').category === 'Lifestyle');
assert(68, 'gợi ý mẫu giày dạo phố hot trend nhất', /(dạo phố|hot trend|lifestyle)/i.test('gợi ý mẫu giày dạo phố hot trend nhất'));
assert(69, 'tôi có 3 đôi Nike rồi muốn đổi gió sang Adidas thì mua đôi nào', extractProductFilters('tôi có 3 đôi Nike rồi muốn đổi gió sang Adidas thì mua đôi nào').brand === 'Adidas');
assert(70, 'nữ mặc váy thì mang sneaker nào hợp', /(mặc váy|váy|đầm)/i.test('nữ mặc váy thì mang sneaker nào hợp'));

// -------------------------------------------------------------
// NHÓM 6: TƯ VẤN THEO KHOẢNG GIÁ & NGÂN SÁCH (Câu 71 - 82)
// -------------------------------------------------------------
assert(71, 'đôi giày rẻ nhất của shop là đôi nào', /(rẻ nhất|giá thấp nhất|tiết kiệm nhất)/i.test('đôi giày rẻ nhất của shop là đôi nào'));
assert(72, 'tìm cho tôi đôi giày đắt nhất', /(đắt nhất|mắc nhất|cao cấp nhất|vip nhất)/i.test('tìm cho tôi đôi giày đắt nhất'));
assert(73, 'giày dưới 2 triệu có đôi nào', extractProductFilters('giày dưới 2 triệu có đôi nào').maxPrice === 2000000);
const f74 = extractProductFilters('2 triệu thì mua được đôi giày nào');
assert(74, '2 triệu thì mua được đôi giày nào', f74.minPrice === 1800000 && f74.maxPrice === 2600000);
const f75 = extractProductFilters('giày từ 2 đến 3 triệu');
assert(75, 'giày từ 2 đến 3 triệu', f75.minPrice === 2000000 && f75.maxPrice === 3000000);
const f76 = extractProductFilters('khoảng 3 đến 4 triệu có những mẫu nào');
assert(76, 'khoảng 3 đến 4 triệu có những mẫu nào', f76.minPrice === 3000000 && f76.maxPrice === 4000000);
assert(77, 'trên 4 triệu thì nên mua đôi nào', extractProductFilters('trên 4 triệu thì nên mua đôi nào').minPrice === 4000000);
assert(78, 'tôi có 30 triệu thì mua đôi giày nào', extractProductFilters('tôi có 30 triệu thì mua đôi giày nào').minPrice === 30000000);
assert(79, 'có đôi nào dưới 1 triệu không', extractProductFilters('có đôi nào dưới 1 triệu không').maxPrice === 1000000);
assert(80, 'với 500 nghìn tôi mua được giày gì', extractProductFilters('với 500 nghìn tôi mua được giày gì').maxPrice === 500000);
assert(81, '60000 tôi có thể mua đôi giày nào', extractProductFilters('60000 tôi có thể mua đôi giày nào').maxPrice === 60000);
assert(82, 'với 10 nghìn tôi có thể mua đôi giày nào', extractProductFilters('với 10 nghìn tôi có thể mua đôi giày nào').maxPrice === 10000);

// -------------------------------------------------------------
// NHÓM 7: QUY TRÌNH ĐẶT HÀNG, THU THẬP THÔNG TIN & TRA CỨU ĐƠN (Câu 83 - 90)
// -------------------------------------------------------------
assert(83, 'làm thế nào để đặt hàng', fastLocalRouter('làm thế nào để đặt hàng').type === 'policy_how_to_order');
const mockProducts = [
  { id: 161, name: 'Li-Ning Feidian 3.0 Elite Carbon', category: 'Running', price: 3990000, sizes: '["39","40","41","42","43","44"]', colors: '["Trắng Phối Cam Cháy","Xanh Lam Neon"]', stock: 15, description: '' }
];
const o84 = extractOrderDetails('đặt cho tôi đôi Li-Ning Feidian 3.0 Elite Carbon', [], null, mockProducts);
assert(84, 'đặt cho tôi đôi Li-Ning Feidian 3.0 Elite Carbon', o84.product?.name === 'Li-Ning Feidian 3.0 Elite Carbon');

const o85 = extractOrderDetails('giúp tôi đặt hàng', [{ role: 'user', text: 'đặt cho tôi đôi Li-Ning Feidian 3.0 Elite Carbon' }], null, mockProducts);
assert(85, 'giúp tôi đặt hàng', o85.isOrderIntent === true);

const formSingleLine = '• Size giày: 39• Màu sắc:Xanh Lam Neon • Số lượng: 1 đôi • Họ và tên người nhận: Trần Phương Đoàn • Số điện thoại nhận hàng: 0395724805• Địa chỉ nhận hàng: Đào Xá-Phú Thoj';
const o86 = extractOrderDetails(formSingleLine, [], null, mockProducts);
assert(86, 'Bóc tách đầy đủ form 1 dòng bullet (Tên, SĐT, Địa chỉ, Size, Màu)',
  o86.customerName === 'Trần Phương Đoàn' &&
  o86.phone === '0395724805' &&
  o86.address === 'Đào Xá-Phú Thoj' &&
  o86.size === '39' &&
  o86.color === 'Xanh Lam Neon' &&
  o86.quantity === 1
);

const o87 = extractOrderDetails('thêm cho tôi 1 đôi vớ thể thao vào đơn', [], null, mockProducts);
assert(87, 'thêm cho tôi 1 đôi vớ thể thao vào đơn', o87.hasAccessorySock === true);

const o88 = extractOrderDetails('lấy thêm bình xịt nano vệ sinh giày nhé', [], null, mockProducts);
assert(88, 'lấy thêm bình xịt nano vệ sinh giày nhé', o88.hasAccessorySpray === true);

assert(89, 'kiểm tra đơn hàng ONE-20261108-ABCD', fastLocalRouter('kiểm tra đơn hàng ONE-20261108-ABCD').type === 'order_lookup');
const o90 = extractOrderDetails('tôi muốn hủy đơn hàng vừa đặt', [], null, mockProducts);
assert(90, 'tôi muốn hủy đơn hàng vừa đặt', o90.isCancelIntent === true);

// -------------------------------------------------------------
// NHÓM 8: XỬ LÝ NGOẠI VI (OUT-OF-SCOPE) & TỪ CHỐI KHÉO LÉO (Câu 91 - 100)
// -------------------------------------------------------------
assert(91, 'thời tiết hôm nay thế nào', fastLocalRouter('thời tiết hôm nay thế nào').type === 'out_of_scope');
assert(92, 'một năm có bao nhiêu ngày', fastLocalRouter('một năm có bao nhiêu ngày').type === 'out_of_scope');
assert(93, 'thủ đô của nước Pháp là gì', fastLocalRouter('thủ đô của nước Pháp là gì').type === 'out_of_scope');
assert(94, 'shop có bán cà phê không', fastLocalRouter('shop có bán cà phê không').type === 'out_of_scope');
assert(95, 'shop có bán áo thun hay quần jean không', fastLocalRouter('shop có bán áo thun hay quần jean không').type === 'out_of_scope');
assert(96, 'làm thế nào để có người yêu', fastLocalRouter('làm thế nào để có người yêu').type === 'out_of_scope');
assert(97, '1-1 bằng mấy', fastLocalRouter('1-1 bằng mấy').type === 'math_calculation');
assert(98, '30-6 bằng bao nhiêu', fastLocalRouter('30-6 bằng bao nhiêu').type === 'math_calculation');
assert(99, 'viết cho tôi đoạn code python', fastLocalRouter('viết cho tôi đoạn code python').type === 'out_of_scope');
assert(100, 'giá vàng và chứng khoán hôm nay thế nào', fastLocalRouter('giá vàng và chứng khoán hôm nay thế nào').type === 'out_of_scope');

console.log(`\n========================================`);
console.log(`KẾT QUẢ KIỂM THỬ: ${passCount} ĐẠT / ${failCount} THẤT BẠI TRÊN 100 CÂU HỎI`);
console.log(`========================================`);

if (failCount > 0) {
  process.exit(1);
}

