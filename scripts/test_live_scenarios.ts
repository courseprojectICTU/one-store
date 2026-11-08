// Script kiểm thử Live Production với các kịch bản thực tế của người dùng
const LIVE_URL = 'https://one-store.onestoresportsshoes.workers.dev/api/chat';

const testQuestions = [
  { q: 'đặt hàng', desc: 'Câu cụt đặt hàng' },
  { q: 'có bán tất không', desc: 'Hỏi phụ kiện bán kèm' },
  { q: 'có bán giày không', desc: 'Hỏi phạm vi bán giày' },
  { q: 'cỡ 38 là bao nhiêu cân', desc: 'Tư vấn size theo cân nặng' },
  { q: 'một năm có bao nhiêu ngày', desc: 'Bách khoa ngoài phạm vi' },
  { q: 'vậy chạy trời nắng thì sao', desc: 'Tình huống chạy trời nắng / thoáng khí' },
  { q: 'tôi chạy trong phòng tập gym', desc: 'Tình huống chạy máy phòng gym' },
  { q: 'vậy nếu tôi chọn giày thời trang', desc: 'Chuyển sang giày thời trang / lifestyle' },
  { q: '2 triệu thì mua được đôi giày nào', desc: 'Lọc ngân sách đơn lẻ 2 triệu' },
  { q: 'tìm cho tôi đôi giày đắt nhất', desc: 'Tìm mẫu giày đắt nhất' },
];

async function runLiveTest() {
  console.log(`=== BẮT ĐẦU KIỂM THỬ TRỰC TIẾP LIVE PRODUCTION (${LIVE_URL}) ===\n`);
  let successCount = 0;

  for (let i = 0; i < testQuestions.length; i++) {
    const item = testQuestions[i];
    const startTime = Date.now();
    try {
      const response = await fetch(LIVE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: item.q,
          history: [],
        }),
      });

      const elapsed = Date.now() - startTime;
      const data = await response.json() as any;

      console.log(`--- [${i + 1}/${testQuestions.length}] Câu hỏi: "${item.q}" (${item.desc}) ---`);
      console.log(`HTTP: ${response.status} | Thời gian: ${elapsed}ms`);
      console.log(`Bot:\n${data.answer || data.error || JSON.stringify(data)}`);
      if (data.products && data.products.length > 0) {
        console.log(`Sản phẩm đính kèm (${data.products.length}): ${data.products.map((p: any) => `${p.name} (${p.price?.toLocaleString()}đ)`).join(', ')}`);
      }
      console.log('');
      successCount++;
    } catch (err: any) {
      console.error(`[FAIL] Câu hỏi "${item.q}": ${err.message}`);
    }
  }

  console.log(`=== HOÀN TẤT: ${successCount}/${testQuestions.length} CÂU PHẢN HỒI THÀNH CÔNG ===`);
}

runLiveTest();
