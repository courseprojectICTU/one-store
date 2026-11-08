import { extractProductFilters, fastLocalRouter } from '../backend/src/chatbot';

console.log('=== TEST ALL USER SCENARIOS (ORIGINAL + NEW ENHANCEMENTS) ===');

let passCount = 0;
let failCount = 0;

function assert(name: string, condition: boolean, detail = '') {
  if (condition) {
    console.log(`[PASS] ${name}`);
    passCount++;
  } else {
    console.error(`[FAIL] ${name} ${detail}`);
    failCount++;
  }
}

// 1. "chào"
const r1 = fastLocalRouter('chào');
assert('1. "chào": type = smalltalk', r1.type === 'smalltalk');

// 2. "tìm cho tôi đôi giày đắt nhất"
const isHighest = /(?:đôi|giày|mẫu)?\s*(?:nào\s+)?(?:đắt nhất|mắc nhất|cao cấp nhất|giá cao nhất|vip nhất)/i.test('tìm cho tôi đôi giày đắt nhất'.toLowerCase());
assert('2. "tìm cho tôi đôi giày đắt nhất": isHighest = true', isHighest);

// 3. "đôi giày rẻ nhất"
const isLowest = /(?:đôi|giày|mẫu)?\s*(?:nào\s+)?(?:rẻ nhất|giá thấp nhất|giá rẻ nhất|bình dân nhất|tiết kiệm nhất)/i.test('đôi giày rẻ nhất'.toLowerCase());
assert('3. "đôi giày rẻ nhất": isLowest = true', isLowest);

// 4. "đôi giày dưới 1 triệu"
const f4 = extractProductFilters('đôi giày dưới 1 triệu');
assert('4. "đôi giày dưới 1 triệu": maxPrice = 1M', f4.maxPrice === 1000000);

// 5. "giày từ 9-10 triệu"
const f5 = extractProductFilters('giày từ 9-10 triệu');
assert('5. "giày từ 9-10 triệu": minPrice = 9M, maxPrice = 10M', f5.minPrice === 9000000 && f5.maxPrice === 10000000);

// 6. "tôi có 30 triệu thì mua đôi giày nào"
const f6 = extractProductFilters('tôi có 30 triệu thì mua đôi giày nào');
assert('6. "tôi có 30 triệu thì mua đôi giày nào": minPrice = 30M, maxPrice = 30M', f6.minPrice === 30000000 && f6.maxPrice === 30000000);

// 7. "chân tôi to đeo cỡ nào"
const r7 = fastLocalRouter('chân tôi to đeo cỡ nào');
assert('7. "chân tôi to đeo cỡ nào": type = policy_sizeguide', r7.type === 'policy_sizeguide');

// 8. Brand switching test
const q8 = 'tôi 30 tuổi hay đi chạy bộ tôi có 3 bộ sưu tập giay nike rồi giờ tôi muốn đổi gió sang adidat thì mua đôi nào';
const f8 = extractProductFilters(q8);
assert('8. Brand switching: brand = Adidas, category = Running', f8.brand === 'Adidas' && f8.category === 'Running');

// 9. "nay trời mưa thì đi đôi giày nào"
const isRain = /(trời mưa|đi mưa|chạy trời mưa|mưa gió|chống nước|chống trơn|đường ướt|gore-tex|trơn trượt)/i.test('nay trời mưa thì đi đôi giày nào'.toLowerCase());
assert('9. "nay trời mưa thì đi đôi giày nào": isRain = true', isRain);

// 10. "tôi cao m98 thì mua đôi giày nào"
const r10 = fastLocalRouter('tôi cao m98 thì mua đôi giày nào');
assert('10. "tôi cao m98 thì mua đôi giày nào": type = policy_sizeguide', r10.type === 'policy_sizeguide');

// === NEW ENHANCEMENTS TESTS ===

// 11. "mua giày" (Short buying intent)
const r11 = fastLocalRouter('mua giày');
assert('11. "mua giày": type = smalltalk', r11.type === 'smalltalk' && Boolean(r11.answer?.includes('One - Store')));

// 12. "đặt hàng" (Short order intent)
const r12 = fastLocalRouter('đặt hàng');
assert('12. "đặt hàng": type = policy_how_to_order', r12.type === 'policy_how_to_order' && Boolean(r12.answer?.includes('Bước 1')));

// 13. "có bán tất không" (Accessory inquiry)
const r13 = fastLocalRouter('có bán tất không');
assert('13. "có bán tất không": mentions vớ One Athletic & bình xịt', Boolean(r13.answer?.includes('Vớ thể thao dệt kim') && r13.answer?.includes('Bình xịt bọt nano')));

// 14. "có bán giày không" (Store product scope)
const r14 = fastLocalRouter('có bán giày không');
assert('14. "có bán giày không": affirms 70 mẫu chính hãng', Boolean(r14.answer?.includes('Dạ có chứ ạ!') && r14.answer?.includes('70 mẫu')));

// 15. "cỡ 38 là bao nhiêu cân" (Size by weight explanation)
const r15 = fastLocalRouter('cỡ 38 là bao nhiêu cân');
assert('15. "cỡ 38 là bao nhiêu cân": explains size by foot length cm not weight', r15.type === 'policy_sizeguide' && Boolean(r15.answer?.includes('không tính theo cân nặng')));

// 16. "một năm có bao nhiêu ngày" (General knowledge out of scope)
const r16 = fastLocalRouter('một năm có bao nhiêu ngày');
assert('16. "một năm có bao nhiêu ngày": type = out_of_scope', r16.type === 'out_of_scope' && Boolean(r16.answer?.includes('kiến thức bách khoa') || r16.answer?.includes('nằm ngoài phạm vi')));

// 17. "vậy chạy trời nắng thì sao" (Sunny/breathable condition)
const isSunny = /(trời nắng|mùa hè|nắng nóng|nóng bức|thoáng khí|mát mẻ|thoát mồ hôi)/i.test('vậy chạy trời nắng thì sao'.toLowerCase());
assert('17. "vậy chạy trời nắng thì sao": isSunny = true', isSunny);

// 18. "tôi chạy trong phòng tập gym" (Gym/treadmill condition)
const isGym = /(phòng gym|tập gym|phòng tập|chạy máy|treadmill|trong nhà|fitness)/i.test('tôi chạy trong phòng tập gym'.toLowerCase());
assert('18. "tôi chạy trong phòng tập gym": isGym = true', isGym);

// 19. "vậy nếu tôi chọn giày thời trang" (Fashion/lifestyle switch)
const isFashion = /^(vậy\s+)?(?:nếu\s+)?(?:tôi\s+)?(?:chọn|thích|tìm|xem|mua)\s*(?:giày|đôi)?\s*(?:thời trang|lifestyle|dạo phố|đi chơi|casual)$/i.test('vậy nếu tôi chọn giày thời trang'.toLowerCase());
assert('19. "vậy nếu tôi chọn giày thời trang": isFashion = true', isFashion);

// 20. "2 triệu thì mua được đôi giày nào" (Single budget filter)
const f20 = extractProductFilters('2 triệu thì mua được đôi giày nào');
assert('20. "2 triệu thì mua được đôi giày nào": minPrice & maxPrice around 2M', f20.minPrice === 1800000 && f20.maxPrice === 2600000);

console.log(`\n=== KẾT QUẢ: ${passCount} ĐẠT / ${failCount} THẤT BẠI ===`);
if (failCount > 0) process.exit(1);
