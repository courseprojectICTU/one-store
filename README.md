# One - Store (One) — Sneaker Store trên Cloudflare

Bộ source gồm giao diện cửa hàng responsive, UX mua hàng giày thể thao (lọc hãng/size/tìm kiếm/xem chi tiết/size/màu/giỏ hàng/checkout COD 1 bước không cần đăng nhập), cổng quản trị độc lập /admin (đăng nhập tài khoản/mật khẩu PBKDF2, quản lý đơn hàng, sneaker, phân tích LTV khách hàng, biểu đồ KPI, xuất báo cáo CSV UTF-8 BOM), trang chính sách /policies và kho tri thức chatbot RAG; Hono API chạy trên Cloudflare D1 + KV + R2 + Workers AI + Vectorize.

## Công nghệ
- FE: Next.js (App Router, React 19, TypeScript), xuất tĩnh sang `frontend/out/` phục vụ qua Cloudflare Assets
- BE: Hono + TypeScript trên Cloudflare Workers (`backend/src/index.ts`)
- D1: danh mục sản phẩm, tồn kho, đơn hàng và chi tiết đơn (`backend/migrations/0001_init.sql`)
- KV: cache danh sách sản phẩm (60 giây); giỏ hàng demo nằm ở localStorage trình duyệt
- R2: ảnh sản phẩm qua `/api/admin/images` và `/api/images/...`
- Chatbot RAG: Workers AI `@cf/baai/bge-m3` tạo embedding, Cloudflare Vectorize tìm các đoạn tri thức gần nhất, `@cf/google/gemma-4-26b-a4b-it` tạo câu trả lời có căn cứ từ tài liệu và danh sách sản phẩm.
- D1 lưu tài liệu gốc và các đoạn văn bản; mỗi đoạn khoảng 1.100 ký tự, chồng lấn 140 ký tự để giữ ngữ cảnh khi chia tài liệu dài.

> Cloudflare dùng **R2**, không có dịch vụ ảnh tên G2. Bộ ảnh Unsplash ban đầu chỉ mang tính demo, chưa nằm trong R2. Có thể thay bằng ảnh thật qua trang quản trị.

## Cài và chạy local
Yêu cầu Node.js 20+ và tài khoản Cloudflare.

```bash
npm install
cp .dev.vars.example .dev.vars  # Windows CMD: copy .dev.vars.example .dev.vars
# chỉnh ADMIN_TOKEN trong .dev.vars thành chuỗi bí mật ít nhất 20 ký tự
npx wrangler d1 migrations apply fashion_db --local
npm run dev
```

Mở địa chỉ do Wrangler in ra (thường `http://localhost:8787`). - Cửa hàng trực tuyến: `http://localhost:8787`
- Cổng quản trị chuyên biệt: `http://localhost:8787/admin` (Tài khoản: `admin`, Mật khẩu: `OneStore@2026`)
- Lịch sử mua hàng & Tra cứu: `http://localhost:8787/orders`
- Hệ thống chính sách bán hàng: `http://localhost:8787/policies` Trong môi trường local, nếu bindings chưa được cấu hình đầy đủ, Wrangler có thể tạo bản D1/KV/R2 giả lập tuỳ phiên bản.

## Triển khai lên Cloudflare

1. Đăng nhập: `npx wrangler login`.
2. Tạo D1: `npx wrangler d1 create fashion_db` và sao chép `database_id` vào `wrangler.toml`.
3. Tạo KV: `npx wrangler kv namespace create CACHE` (hoặc với CLI mới `npx wrangler kv namespace create CACHE`); sao chép namespace ID vào `wrangler.toml`.
4. Tạo R2: `npx wrangler r2 bucket create nhom2-ba-khi-images`. **R2 có thể yêu cầu kích hoạt thanh toán trong tài khoản Cloudflare**.
5. Tạo Vectorize index cho embedding BGE-M3 (1024 chiều): `npx wrangler vectorize create ba-khi-knowledge --dimensions=1024 --metric=cosine`. Binding `VECTORIZE` trong `wrangler.toml` trỏ tới tên index này.
6. Workers AI binding được khai báo trong `wrangler.toml`; bật Workers AI cho tài khoản Cloudflare đang deploy.
7. Tạo secret không đưa vào Git: `npx wrangler secret put ADMIN_TOKEN` rồi nhập chuỗi ngẫu nhiên dài ít nhất 20 ký tự.
8. Chạy schema + dữ liệu mẫu lên remote: `npm run db:migrate:remote`.
9. Deploy: `npm run deploy`. Wrangler sẽ trả URL `*.workers.dev` hoặc dùng custom domain.
10. Mở `https://your-url.workers.dev/?admin=1`, nhập ADMIN_TOKEN, thêm chính sách/FAQ vào mục “Kho tri thức chatbot”; tài liệu được chia đoạn và vector hóa khi lưu.

Trong local, hãy tạo Vectorize index trên Cloudflare và đăng nhập Wrangler để sử dụng AI/Vectorize; các lời gọi này đi tới tài nguyên remote và có thể phát sinh phí. D1 local cần chạy migration `0003_chat_knowledge.sql`. Nội dung tri thức có thể chứa chính sách giao hàng, đổi trả, hướng dẫn chọn size và thông tin thương hiệu. Chatbot không dùng lịch sử hội thoại làm bộ nhớ dài hạn.

**Lưu ý**: một số phiên bản Wrangler có cú pháp KV khác (`npx wrangler kv:namespace create CACHE`); chạy `npx wrangler kv --help` để xem cú pháp phù hợp. Với local, hãy thay ID giả trong `wrangler.toml` bằng ID tạo thực.

## API chính
| Method | Path | Tác dụng |
|---|---|---|
| GET | `/api/health` | Kiểm tra API |
| GET | `/api/products?q=&category=` | Danh sách và lọc sản phẩm |
| GET | `/api/products/:id` | Chi tiết sản phẩm |
| POST | `/api/orders` | Gửi đơn COD, tính giá từ D1 |
| GET | `/api/images/:key` | Đọc ảnh từ R2 |
| POST | `/api/admin/images` | Upload file ảnh, cần Bearer ADMIN_TOKEN |
| POST | `/api/admin/products` | Tạo sản phẩm |
| PATCH | `/api/admin/products/:id` | Sửa sản phẩm |
| DELETE | `/api/admin/products/:id` | Xóa sản phẩm chưa có đơn |
| GET | `/api/admin/orders` | Danh sách 100 đơn mới nhất |
| PATCH | `/api/admin/orders/:id` | Cập nhật trạng thái đơn |
| POST | `/api/chat` | Hỏi đáp RAG dựa trên sản phẩm và kho tri thức |
| POST | `/api/admin/auth/login` | Đăng nhập quản trị viên (tài khoản/mật khẩu băm PBKDF2) |
| GET | `/api/admin/auth/me` | Lấy thông tin phiên làm việc admin |
| POST | `/api/admin/auth/logout` | Đăng xuất phiên làm việc admin |
| GET | `/api/admin/orders/:id` | Xem chi tiết đơn hàng và từng mặt hàng sneaker |
| GET | `/api/admin/customers/analytics` | Phân tích phân khúc khách hàng (VIP, Tiềm năng, Mới) & LTV |
| GET | `/api/admin/analytics/overview` | Thống kê KPI tổng quan (Doanh thu, Đơn hàng, AOV, Tồn kho) |
| GET | `/api/admin/analytics/revenue-chart` | Biểu đồ doanh thu và số lượng đơn theo ngày |
| GET | `/api/admin/analytics/top-products` | Top sản phẩm sneaker bán chạy nhất |
| GET | `/api/admin/export/:type` | Xuất báo cáo CSV UTF-8 BOM (orders, products, customers) |
| GET | `/api/admin/knowledge` | Liệt kê tài liệu, cần Bearer ADMIN_TOKEN |
| POST | `/api/admin/knowledge` | Thêm tài liệu và vector hóa, cần Bearer ADMIN_TOKEN |
| DELETE | `/api/admin/knowledge/:id` | Xóa tài liệu và vector liên quan, cần Bearer ADMIN_TOKEN |

## Ranh giới demo / cần bổ sung trước production
- Admin dùng shared secret: **nên thay bằng Cloudflare Access hoặc hệ thống xác thực nhân viên phân quyền**, kèm CSRF/đăng nhập/chống brute force phù hợp.
- Chưa tích hợp thanh toán trực tuyến (VNPay, MoMo), hãng vận chuyển, voucher, thuế, email, xác nhận thanh toán và quy trình hoàn kho khi hủy.
- Cần anti-bot/rate limit (Cloudflare WAF/Turnstile) ở `/api/orders`, hạn chế spam đơn; xử lý dữ liệu cá nhân theo quy định.
- `/api/chat` hiện chưa có rate limit; cần cấu hình Cloudflare Rate Limiting/Turnstile trước khi mở rộng production. Nội dung đưa vào kho tri thức chỉ nên là thông tin được phép công khai cho khách hàng.
- D1 lưu hàng tồn theo sản phẩm, chưa tách tồn kho theo biến thể size/màu. Có trigger chống trừ âm và D1 batch transactional.
- Bảng orders chưa có đăng nhập khách, lịch sử đơn và phân trang; ảnh cũ không tự xóa khỏi R2 khi cập nhật/xóa sản phẩm.
- Cần ảnh thương hiệu/chính sách thật, kiểm thử đơn hàng, kiểm thử phụ tải và backup D1 trước vận hành kinh doanh.
- Mức miễn ship trên banner chỉ là nội dung demo; chưa có logic phí vận chuyển tự động.

## Cấu trúc
```text
one-fashion/
├── backend/
│   ├── src/
│   │   ├── index.ts          # Hono API core
│   │   ├── commerce.ts       # Module thương mại nâng cao
│   │   └── chatbot.ts        # RAG, knowledge documents, embedding
│   └── migrations/
│       ├── 0001_init.sql
│       ├── 0002_commerce.sql
│       └── 0003_chat_knowledge.sql
├── frontend/
│   ├── src/
│   │   ├── app/              # Next.js App Router (layout.tsx, page.tsx, globals.css)
│   │   ├── components/       # Header, Hero, ProductSection, Modals, Chatbot, Admin
│   │   ├── context/          # ShopContext (Cart, Auth, Wishlist, Toast)
│   │   ├── lib/              # API fetch utility & formatting
│   │   └── types/            # TypeScript data models
│   ├── next.config.ts        # Cấu hình Next.js (static export)
│   └── package.json
├── wrangler.toml
├── package.json
└── .dev.vars.example
```
