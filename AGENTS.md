# AGENTS.md — ONE - STORE PROJECT GUIDELINES & MEMORY

Chào mừng agent đến với dự án **One - Store (One)**.

Toàn bộ lịch sử nâng cấp kiến trúc, các quyết định quan trọng (ADR), cấu trúc thư mục và quy tắc làm việc đã được tổng hợp chi tiết tại:
👉 **[AGENT_MEMORY.md](./AGENT_MEMORY.md)**  
👉 **[CODE_CONVENTIONS.md](./CODE_CONVENTIONS.md)** — Quy chuẩn lập trình & Clean Code bắt buộc tuân thủ 100%.

---

## Tóm tắt nhanh bối cảnh dự án:

1. **Nhận diện thương hiệu**:
   - Tên Project: `one-store`
   - Tên Thương hiệu: `One - Store`
   - Tên Ngắn gọn: `One` (Chatbot: *Tư vấn One*, Tiền tố đơn hàng: `ONE-`, Voucher: `ONE10`)
   - Định vị: Chuyên phân phối độc quyền giày thể thao & sneaker chính hãng Âu - Á. Không kinh doanh quần áo hay phụ kiện thời trang khác.
2. **Kiến trúc Monorepo**:
   - `backend/`: Cloudflare Worker (Hono framework, D1 Database `fashion_db`, R2 Bucket, Vectorize, Workers AI Gemma + BGE-M3).
   - `frontend/`: Next.js 16 (App Router, Turbopack, TypeScript, Static Export ra `frontend/out/`).
   - Root: Quản lý build và phối hợp chung (`package.json`, `wrangler.toml`).
3. **Quy tắc quan trọng**:
   - **Frontend Build**: Khi sửa đổi code trong `frontend/src/`, luôn chạy `npm run build:frontend` để cập nhật `frontend/out/`.
   - **Thẩm mỹ giao diện**: Giữ nguyên tính nhất quán, độ tương phản cao, micro-animations và layout responsive chuẩn mực.
   - **Cloudflare Bindings**: Không tùy ý đổi tên Cloudflare cloud bindings (`one-store-images`, `ba-khi-knowledge`) trong `wrangler.toml`.
   - **Hồ sơ cửa hàng**: Tham khảo [STORE_PROFILE.md](./STORE_PROFILE.md) cho các thương hiệu giày thể thao Âu - Á và chính sách bán hàng.
