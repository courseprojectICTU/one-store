import { extractProductFilters, fastLocalRouter } from '../backend/src/chatbot';

console.log('=== TEST ALL 10 USER SCENARIOS ===');

// 1. "chào"
const r1 = fastLocalRouter('chào');
console.log('1. "chào": type =', r1.type);
if (r1.type !== 'smalltalk') console.error('FAIL 1: expected smalltalk, got', r1.type);

// 2. "tìm cho tôi đôi giày đắt nhất"
const isHighest = /(?:đôi|giày|mẫu)?\s*(?:nào\s+)?(?:đắt nhất|mắc nhất|cao cấp nhất|giá cao nhất|vip nhất)/i.test('tìm cho tôi đôi giày đắt nhất'.toLowerCase());
console.log('2. "tìm cho tôi đôi giày đắt nhất": isHighest =', isHighest);

// 3. "đôi giày rẻ nhất"
const isLowest = /(?:đôi|giày|mẫu)?\s*(?:nào\s+)?(?:rẻ nhất|giá thấp nhất|giá rẻ nhất|bình dân nhất|tiết kiệm nhất)/i.test('đôi giày rẻ nhất'.toLowerCase());
console.log('3. "đôi giày rẻ nhất": isLowest =', isLowest);

// 4. "đôi giày dưới 1 triệu"
const f4 = extractProductFilters('đôi giày dưới 1 triệu');
console.log('4. "đôi giày dưới 1 triệu": maxPrice =', f4.maxPrice);

// 5. "giày từ 9-10 triệu"
const f5 = extractProductFilters('giày từ 9-10 triệu');
console.log('5. "giày từ 9-10 triệu": minPrice =', f5.minPrice, 'maxPrice =', f5.maxPrice);

// 6. "tôi có 30 triệu thì mua đôi giày nào"
const f6 = extractProductFilters('tôi có 30 triệu thì mua đôi giày nào');
console.log('6. "tôi có 30 triệu thì mua đôi giày nào": minPrice =', f6.minPrice, 'maxPrice =', f6.maxPrice);

// 7. "chân tôi to đeo cỡ nào"
const r7 = fastLocalRouter('chân tôi to đeo cỡ nào');
console.log('7. "chân tôi to đeo cỡ nào": type =', r7.type);
if (r7.type !== 'policy_sizeguide') console.error('FAIL 7: expected policy_sizeguide, got', r7.type);

// 8. "tôi 30 tuổi hay đi chạy bộ tôi có 3 bộ sưu tập giay nike rồi giờ tôi muốn đổi gió sang adidat thì mua đôi nào"
const q8 = 'tôi 30 tuổi hay đi chạy bộ tôi có 3 bộ sưu tập giay nike rồi giờ tôi muốn đổi gió sang adidat thì mua đôi nào';
const f8 = extractProductFilters(q8);
console.log('8. Brand switching test: brand =', f8.brand, 'category =', f8.category);
if (f8.brand !== 'Adidas') console.error('FAIL 8: expected Adidas, got', f8.brand);

// 9. "nay trời mưa thì đi đôi giày nào"
const isRain = /(trời mưa|đi mưa|chạy trời mưa|mưa gió|chống nước|chống trơn|đường ướt|gore-tex|trơn trượt)/i.test('nay trời mưa thì đi đôi giày nào'.toLowerCase());
console.log('9. "nay trời mưa thì đi đôi giày nào": isRain =', isRain);

// 10. "tôi cao m98 thì mua đôi giày nào"
const r10 = fastLocalRouter('tôi cao m98 thì mua đôi giày nào');
console.log('10. "tôi cao m98 thì mua đôi giày nào": type =', r10.type);
if (r10.type !== 'policy_sizeguide') console.error('FAIL 10: expected policy_sizeguide, got', r10.type);

console.log('=== TEST COMPLETED ===');
