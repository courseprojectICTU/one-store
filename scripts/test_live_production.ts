/**
 * LIVE PRODUCTION VERIFICATION SCRIPT
 * Tests all 10 real-world customer queries against the deployed production worker:
 * https://one-store.onestoresportsshoes.workers.dev/api/chat
 */

const PROD_URL = 'https://one-store.onestoresportsshoes.workers.dev/api/chat';

const queries = [
  'chào',
  'tìm cho tôi đôi giày đắt nhất',
  'đôi giày rẻ nhất',
  'đôi giày dưới 1 triệu',
  'giày từ 9-10 triệu',
  'tôi có 30 triệu thì mua đôi giày nào',
  'chân tôi to đeo cỡ nào',
  'tôi 30 tuổi hay đi chạy bộ tôi có 3 bộ sưu tập giay nike rồi giờ tôi muốn đổi gió sang adidat thì mua đôi nào',
  'nay trời mưa thì đi đôi giày nào',
  'tôi cao m98 thì mua đôi giày nào',
];

async function runLiveTests() {
  console.log('=== BẮT ĐẦU KIỂM THỬ LIVE PRODUCTION TRỰC TIẾP TRÊN CLOUDFLARE WORKERS ===\n');

  for (let i = 0; i < queries.length; i++) {
    const q = queries[i];
    const start = Date.now();
    try {
      const res = await fetch(PROD_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: q, stream: false }),
      });
      const duration = Date.now() - start;
      const data = (await res.json()) as any;
      const answer = data?.answer || '';
      const products = data?.products || [];

      console.log(`[CÂU ${i + 1}] "${q}" (${duration}ms)`);
      console.log(`- Trả lời: ${answer.slice(0, 150).replace(/\n/g, ' ')}...`);
      console.log(`- Sản phẩm gợi ý (${products.length}): ${products.map((p: any) => p.name + ' (' + p.price?.toLocaleString('vi-VN') + 'đ)').join(', ')}`);
      console.log(`- Không chứa rập khuôn 10 thương hiệu: ${!answer.includes('phân phối độc quyền và chính hãng các dòng giày thể thao từ 10 thương hiệu')}`);
      console.log('');
    } catch (err: any) {
      console.error(`[LỖI CÂU ${i + 1}] "${q}":`, err?.message || err);
    }
  }

  console.log('=== HOÀN THÀNH KIỂM THỬ LIVE PRODUCTION ===');
}

runLiveTests();

