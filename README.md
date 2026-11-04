# ONE - STORE: HỆ THỐNG THƯƠNG MẠI ĐIỆN TỬ PHÂN PHỐI SNEAKER CHÍNH HÃNG VÀ TRỢ LÝ AI TƯ VẤN THỜI GIAN THỰC THEO KIẾN TRÚC RAG

Tài liệu kỹ thuật tổng quan kiến trúc, công nghệ và quy trình vận hành hệ thống One - Store (One).

---

## 1. TỔNG QUAN DỰ ÁN

One - Store là nền tảng thương mại điện tử chuyên biệt phân phối độc quyền các dòng giày thể thao và sneaker chính hãng từ 10 thương hiệu hàng đầu thế giới (Âu - Á). Hệ thống được xây dựng toàn diện trên nền tảng điện toán biên không máy chủ (Serverless Edge Computing) của Cloudflare, kết hợp trợ lý trí tuệ nhân tạo (AI Agent) theo kiến trúc RAG (Retrieval-Augmented Generation) hỗ trợ tư vấn chuyên sâu và chốt đơn hàng trực tiếp trong khung trò chuyện.

### Thông tin nhận diện dự án
- Tên dự án: one-store
- Tên thương hiệu: One - Store
- Tên thương hiệu ngắn gọn: One
- Tiền tố mã đơn hàng: ONE- (Ví dụ: ONE-20261104-XXXX)
- Trợ lý AI: Tư vấn One
- Mã ưu đãi độc quyền: ONE10 (Giảm 10% cho đơn hàng đầu tiên)
- Địa chỉ triển khai trực tuyến: https://one-store.onestoresportsshoes.workers.dev

---

## 2. KIẾN TRÚC HỆ THỐNG VÀ CÔNG NGHỆ CỐT LÕI

Hệ thống được thiết kế theo mô hình Monorepo hiện đại, tối ưu hóa độ trễ phản hồi tại biên mạng (Edge Network) với thời gian tải trang trung bình dưới 300ms và tốc độ truy vấn AI dưới 1.5 giây.

### Bảng tổng hợp ngăn xếp công nghệ (Technology Stack)

| Thành phần | Nền tảng / Công nghệ | Vai trò kỹ thuật trong hệ thống |
| :--- | :--- | :--- |
| Giao diện người dùng (Frontend) | Next.js 16 (App Router), React 19, TypeScript, Turbopack | Xây dựng giao diện ứng dụng web responsive, xuất bản tĩnh (Static Export ra thư mục `frontend/out/`), phục vụ trực tiếp qua Cloudflare Workers Assets. |
| Ngôn ngữ & Thiết kế | Lucide React, Plus Jakarta Sans, Outfit Font | Thiết kế theo phong cách Dark & Bred Athletic (Đen than chì, Đỏ thể thao, Kính mờ), tuân thủ 100% quy chuẩn Zero-Emoji (không sử dụng ký tự biểu cảm thô). |
| Cổng điều phối (Backend Gateway) | Hono Framework trên Cloudflare Workers | API Gateway siêu nhẹ xử lý định tuyến, xác thực phiên làm việc, kiểm soát phân quyền và tích hợp logic nghiệp vụ. |
| Cơ sở dữ liệu quan hệ | Cloudflare D1 (SQLite Engine) | Lưu trữ danh mục sản phẩm, đơn hàng, khách hàng, mã giảm giá, tài khoản quản trị và các phân đoạn tri thức (Knowledge Chunks). |
| Bộ nhớ đệm phân tán | Cloudflare KV (Key-Value Storage) | Bộ đệm lưu trữ danh mục sản phẩm với thời gian sống TTL 60 giây, giảm tải tối đa cho cơ sở dữ liệu gốc. |
| Lưu trữ đối tượng (Object Storage) | Cloudflare R2 Bucket (`one-store-images`) | Lưu trữ toàn bộ hình ảnh studio chuẩn xác của 70 mẫu sneaker chính hãng, phục vụ tải ảnh trực tiếp qua endpoint `/api/images/...`. |
| Mô hình nhúng ngữ nghĩa | Cloudflare Workers AI (`@cf/baai/bge-m3`) | Mô hình chuyển đổi câu hỏi và văn bản chính sách thành vector toán học đa chiều (1024 dimensions). |
| Cơ sở dữ liệu Vector | Cloudflare Vectorize (`ba-khi-knowledge`) | Lưu trữ chỉ mục vector và thực hiện quét độ tương đồng Cosine Similarity để trích xuất tri thức liên quan với độ trễ dưới 30ms. |
| Mô hình ngôn ngữ lớn (LLM) | Cloudflare Workers AI (`@cf/google/gemma-4-26b-a4b-it`) | Mô hình suy luận tạo sinh câu trả lời tự nhiên, neo chặt dữ liệu vào tài liệu chính sách và danh mục sản phẩm thực tế, ngăn chặn triệt để hiện tượng ảo giác. |

---

## 3. CÁC PHÂN HỆ NGHIỆP VỤ NỔI BẬT

### 3.1 Cửa hàng trực tuyến (E-Commerce Storefront)
- Danh mục sản phẩm chuẩn hóa: 70 mẫu giày sneaker tiêu biểu của 10 thương hiệu hàng đầu:
  - Nhóm Âu - Mỹ: Nike, Adidas, New Balance, Puma, Salomon.
  - Nhóm Châu Á: Asics, Onitsuka Tiger, Mizuno, Li-Ning, Anta.
- Bộ lọc thông minh đa chiều: Lọc theo 10 thương hiệu đối tác, 4 danh mục vận động (Running, Lifestyle, Outdoor, Basketball), dải kích cỡ (38 - 45 EUR) và tìm kiếm toàn văn thời gian thực.
- Quy trình thanh toán một bước (1-Step Fast Checkout): Khách hàng có thể đặt hàng COD (Giao hàng thu tiền tận nơi) nhanh chóng mà không bắt buộc phải tạo tài khoản hoặc ghi nhớ mật khẩu phức tạp.
- Chính sách giao hàng tự động: Miễn phí vận chuyển toàn quốc (Freeship) cho mọi đơn hàng mua từ 3 đôi giày trở lên (hoặc giá trị từ 5.000.000 VND). Đơn hàng dưới 3 đôi áp dụng cước phí tiêu chuẩn 30.000 VND. Thanh tiến trình Freeship cập nhật động theo thời gian thực trong giỏ hàng.
- Đồng bộ đa ngôn ngữ: Hỗ trợ chuyển đổi song ngữ Tiếng Việt - Tiếng Anh (VI - EN) chuẩn mực 100% dữ liệu danh mục, thuộc tính màu sắc, chi tiết kỹ thuật và thông báo hệ thống.

### 3.2 Trợ lý trí tuệ nhân tạo (Agentic RAG Chatbot - "Tư vấn One")
- Tư vấn chuyên sâu theo phom dáng bàn chân: Phân tích đặc điểm bàn chân bè ngang của người Việt để đề xuất các dòng giày mũi rộng (Asics bản 2E, Mizuno, Li-Ning, Anta) hoặc hướng dẫn tăng 0.5 - 1 size đối với các dòng giày Âu - Mỹ phom thon (Nike, Adidas, Salomon).
- Tư vấn cự ly và mục đích thể thao: Hướng dẫn chọn giày theo cự ly chạy bộ (5km, 10km, bán marathon 21km, full marathon 42km với đĩa Carbon trợ lực).
- Giải đáp chính sách có căn cứ: Cung cấp thông tin chuẩn xác về chính sách đổi trả 7 ngày miễn phí cước 2 chiều, bảo hành chất lượng 6 - 12 tháng, cam kết bồi hoàn 200% nếu phát hiện hàng giả và quyền đồng kiểm tận nơi. Mỗi câu trả lời đều đính kèm danh sách nguồn trích dẫn minh bạch.
- Tính năng chốt đơn hàng tự động trong hội thoại (Agentic In-Chat Ordering): Khách hàng có thể đặt hàng trực tiếp bằng ngôn ngữ tự nhiên. Trợ lý AI tự động thẩm định tồn kho trong CSDL D1, áp dụng mã ưu đãi ONE10, hiển thị bảng tóm tắt chốt đơn và tạo đơn hàng chính thức vào cơ sở dữ liệu kèm mã tra cứu và trạng thái COD.

### 3.3 Cổng quản trị chuyên biệt (Dedicated Admin Hub - `/admin`)
- Xác thực an toàn nhiều lớp: Hệ thống đăng nhập độc lập bằng tài khoản và mật khẩu được băm qua thuật toán PBKDF2 (100.000 vòng lặp SHA-256) kết hợp chuỗi muối ngẫu nhiên và quản lý phiên làm việc qua bảng `admin_sessions` trong D1.
- Cơ chế Sandbox phân quyền cách ly dữ liệu (Read-Only Data Isolation):
  - Hỗ trợ nút truy cập nhanh 1-click dành cho khách tham quan, đánh giá và nghiệm thu hệ thống với tài khoản Demo.
  - Người dùng Demo có toàn quyền xem các báo cáo kinh doanh, đơn hàng, khách hàng, sản phẩm và kho tri thức.
  - Toàn bộ các thao tác Thêm mới, Chỉnh sửa, Thay đổi trạng thái hoặc Xóa dữ liệu đều bị chặn tuyệt đối ở cả giao diện Frontend và tầng Backend API Gateway (trả về mã lỗi HTTP 403 Forbidden).
- Quản trị toàn diện chuỗi cung ứng:
  - Bảng điều khiển KPI: Doanh thu thực tế, số lượng đơn theo 5 trạng thái, giá trị đơn trung bình (AOV), tỷ lệ chuyển đổi và cảnh báo tồn kho thấp.
  - Quản lý đơn hàng: Xem chi tiết từng mặt hàng sneaker, địa chỉ giao hàng, cập nhật trạng thái đơn (pending, confirmed, shipping, completed, cancelled).
  - Phân tích khách hàng (Customer Analytics & LTV): Tự động phân khúc khách hàng (VIP, Tiềm năng, Mới) dựa trên tổng chi tiêu và tần suất mua sắm.
  - Quản lý mã giảm giá (Vouchers): Tạo mã mới, thiết lập loại giảm giá (phần trăm / số tiền cố định), giá trị đơn tối thiểu và số lượt sử dụng tối đa.
  - Quản lý kho tri thức RAG: Thêm mới tài liệu chính sách, tự động chia đoạn thông minh (Smart Chunking), sinh vector nhúng và đồng bộ hóa nguyên tử vào Cloudflare Vectorize.
  - Xuất báo cáo dữ liệu: Xuất file báo cáo định dạng CSV chuẩn mã hóa UTF-8 BOM, hiển thị hoàn hảo tiếng Việt trong Microsoft Excel.

### 3.4 Hệ thống chính sách bán hàng & Tra cứu minh bạch
- Cổng chính sách chuyên biệt `/policies` với 6 nhóm tiêu chuẩn:
  1. Chính sách cam kết 100% hàng chính hãng và đền bù 200%.
  2. Chính sách vận chuyển toàn quốc và đồng kiểm tận nơi trước khi thanh toán.
  3. Chính sách đổi trả và đổi cỡ giày miễn phí cước 2 chiều trong 7 ngày.
  4. Chính sách bảo hành chính hãng 6 - 12 tháng và dán keo ép nhiệt trọn đời.
  5. Chính sách bảo mật thông tin và cơ chế đồng thuận Cookie Consent Gating minh bạch.
  6. Cẩm nang 3 bước đo chiều dài bàn chân tại nhà và bảng quy đổi cỡ giày chuẩn quốc tế.
- Cổng tra cứu đơn hàng `/orders`: Cho phép khách hàng tra cứu tiến độ vận chuyển và lịch sử đơn hàng nhanh chóng chỉ bằng số điện thoại nhận hàng.

---

## 4. BẢNG ĐẶC TẢ GIAO DIỆN LẬP TRÌNH ỨNG DỤNG (API SPECIFICATION)

### 4.1 Nhóm API Thương mại Công cộng (Public Commerce APIs)

| Phương thức | Đường dẫn API | Chức năng nghiệp vụ | Xác thực |
| :--- | :--- | :--- | :--- |
| GET | `/api/health` | Kiểm tra trạng thái hoạt động của dịch vụ | Không |
| GET | `/api/products` | Lấy danh sách sản phẩm (có lọc theo thương hiệu, danh mục, từ khóa tìm kiếm) | Không |
| GET | `/api/products/:id` | Lấy thông tin chi tiết một sản phẩm sneaker | Không |
| POST | `/api/orders` | Khởi tạo đơn hàng mới (COD 1 bước, tự động tính phí ship và trừ tồn kho) | Không |
| GET | `/api/orders/lookup?phone=...` | Tra cứu danh sách đơn hàng đã đặt theo số điện thoại | Không |
| POST | `/api/vouchers/validate` | Thẩm định mã giảm giá (kiểm tra tính hợp lệ, giá trị đơn tối thiểu, số lượt) | Không |
| GET | `/api/images/:key` | Truy xuất dữ liệu hình ảnh trực tiếp từ Cloudflare R2 Bucket | Không |

### 4.2 Nhóm API Trợ lý AI RAG (Chatbot AI APIs)

| Phương thức | Đường dẫn API | Chức năng nghiệp vụ | Xác thực |
| :--- | :--- | :--- | :--- |
| POST | `/api/chat` | Tiếp nhận câu hỏi, vector hóa BGE-M3, quét Vectorize, gọi LLM Gemma và xử lý chốt đơn | Không |

### 4.3 Nhóm API Xác thực & Quản trị Hệ thống (Admin Portal APIs)

| Phương thức | Đường dẫn API | Chức năng nghiệp vụ | Quyền hạn yêu cầu |
| :--- | :--- | :--- | :--- |
| POST | `/api/admin/auth/login` | Đăng nhập tài khoản quản trị (xác thực PBKDF2) | Công khai |
| POST | `/api/admin/auth/demo-login` | Đăng nhập nhanh 1-click vào chế độ Demo Sandbox | Công khai |
| GET | `/api/admin/auth/me` | Lấy thông tin phiên làm việc hiện tại | Bearer Session Token |
| POST | `/api/admin/auth/logout` | Hủy bỏ phiên làm việc quản trị | Bearer Session Token |
| POST | `/api/admin/auth/change-password` | Đổi mật khẩu tài khoản quản trị | Yêu cầu quyền ghi (Write Permission) |
| GET | `/api/admin/analytics/overview` | Lấy các chỉ số KPI tài chính và kinh doanh tổng quan | Mọi tài khoản Admin (kể cả Demo) |
| GET | `/api/admin/analytics/revenue-chart` | Lấy số liệu biểu đồ doanh thu theo chu kỳ ngày | Mọi tài khoản Admin (kể cả Demo) |
| GET | `/api/admin/analytics/top-products` | Lấy danh sách các mẫu sneaker bán chạy nhất | Mọi tài khoản Admin (kể cả Demo) |
| GET | `/api/admin/orders` | Lấy danh sách đơn hàng (hỗ trợ lọc theo trạng thái và tìm kiếm) | Mọi tài khoản Admin (kể cả Demo) |
| GET | `/api/admin/orders/:id` | Xem chi tiết đơn hàng và từng dòng sản phẩm | Mọi tài khoản Admin (kể cả Demo) |
| PATCH | `/api/admin/orders/:id/status` | Cập nhật trạng thái xử lý đơn hàng | Yêu cầu quyền ghi (Write Permission) |
| GET | `/api/admin/customers/analytics` | Phân tích phân khúc và tổng giá trị vòng đời khách hàng | Mọi tài khoản Admin (kể cả Demo) |
| GET | `/api/admin/customers/:phone/orders` | Xem toàn bộ lịch sử đơn hàng của một khách hàng | Mọi tài khoản Admin (kể cả Demo) |
| POST | `/api/admin/images` | Tải lên hình ảnh sản phẩm mới vào Cloudflare R2 Bucket | Yêu cầu quyền ghi (Write Permission) |
| POST | `/api/admin/products` | Thêm mới sản phẩm sneaker vào cơ sở dữ liệu | Yêu cầu quyền ghi (Write Permission) |
| PATCH | `/api/admin/products/:id` | Cập nhật thông tin, bảng giá hoặc tồn kho sản phẩm | Yêu cầu quyền ghi (Write Permission) |
| DELETE | `/api/admin/products/:id` | Xóa sản phẩm khỏi cơ sở dữ liệu (chỉ áp dụng đơn chưa phát sinh) | Yêu cầu quyền ghi (Write Permission) |
| GET | `/api/admin/vouchers` | Lấy danh sách toàn bộ các mã giảm giá trong hệ thống | Mọi tài khoản Admin (kể cả Demo) |
| POST | `/api/admin/vouchers` | Tạo mã giảm giá mới | Yêu cầu quyền ghi (Write Permission) |
| PATCH | `/api/admin/vouchers/:code` | Kích hoạt hoặc tạm ngừng mã giảm giá | Yêu cầu quyền ghi (Write Permission) |
| GET | `/api/admin/knowledge` | Lấy danh sách các tài liệu tri thức trong CSDL D1 | Mọi tài khoản Admin (kể cả Demo) |
| POST | `/api/admin/knowledge` | Nạp tài liệu mới, băm chunks và nạp vector vào Vectorize | Yêu cầu quyền ghi (Write Permission) |
| DELETE | `/api/admin/knowledge/:id` | Xóa tài liệu và toàn bộ vectors tương ứng trong Vectorize | Yêu cầu quyền ghi (Write Permission) |
| POST | `/api/admin/knowledge/sync-all` | Tái đồng bộ toàn bộ chunks từ D1 lên Cloudflare Vectorize | Yêu cầu quyền ghi (Write Permission) |
| GET | `/api/admin/export/:type` | Xuất dữ liệu báo cáo dạng file CSV UTF-8 BOM (`orders`, `products`, `customers`) | Mọi tài khoản Admin (kể cả Demo) |

---

## 5. CƠ CHẾ PHÂN QUYỀN VÀ TÀI KHOẢN TRẢI NGHIỆM SANDBOX

Để phục vụ công tác thanh tra, đánh giá, kiểm thử nghiệm thu và báo cáo dự án mà không ảnh hưởng tới dữ liệu sản xuất, hệ thống triển khai cơ chế cách ly quyền dữ liệu:

### Bảng đối soát quyền hạn tài khoản quản trị

| Tiêu chí | Tài khoản Quản trị Cấp cao (Superadmin) | Tài khoản Trải nghiệm Sandbox (Demo Admin) |
| :--- | :--- | :--- |
| Tên đăng nhập | `admin` (hoặc `admin@one.store`) | `demo` (hoặc `demo@one.store`) |
| Cơ chế đăng nhập | Nhập mật khẩu bí mật hệ thống | Bấm nút truy cập nhanh 1-click hoặc nhập `DemoAdmin@2026` |
| Vai trò kỹ thuật (`role`) | `superadmin` | `demo` |
| Quyền xem báo cáo & KPI | Cho phép toàn quyền | Cho phép toàn quyền |
| Quyền xem danh sách đơn hàng | Cho phép toàn quyền | Cho phép toàn quyền |
| Quyền xem phân tích khách hàng | Cho phép toàn quyền | Cho phép toàn quyền |
| Quyền xem kho tri thức RAG | Cho phép toàn quyền | Cho phép toàn quyền |
| Quyền xuất báo cáo CSV UTF-8 | Cho phép toàn quyền | Cho phép toàn quyền |
| Quyền cập nhật trạng thái đơn | Cho phép thực thi | Bị chặn (Trả về HTTP 403 Forbidden) |
| Quyền thêm / sửa / xóa sản phẩm | Cho phép thực thi | Bị chặn (Trả về HTTP 403 Forbidden) |
| Quyền tạo / sửa mã voucher | Cho phép thực thi | Bị chặn (Trả về HTTP 403 Forbidden) |
| Quyền thêm / xóa tri thức AI | Cho phép thực thi | Bị chặn (Trả về HTTP 403 Forbidden) |
| Quyền đổi mật khẩu quản trị | Cho phép thực thi | Bị chặn (Trả về HTTP 403 Forbidden) |

---

## 6. HƯỚNG DẪN CÀI ĐẶT VÀ VẬN HÀNH

### 6.1 Yêu cầu môi trường tiên quyết
- Node.js phiên bản 20.x hoặc 22.x LTS.
- Trình quản lý gói npm phiên bản 10.x trở lên.
- Tài khoản Cloudflare đã kích hoạt dịch vụ Workers, D1, KV, R2 và Workers AI.

### 6.2 Khởi chạy môi trường phát triển cục bộ (Local Development)

```bash
# 1. Cài đặt các gói phụ thuộc tại thư mục gốc và thư mục frontend
npm install
npm install --prefix frontend

# 2. Thiết lập biến môi trường cục bộ
# Tạo file .dev.vars từ file mẫu
cp .dev.vars.example .dev.vars

# 3. Áp dụng các tệp migration khởi tạo cơ sở dữ liệu D1 tại local
npx wrangler d1 migrations apply fashion_db --local

# 4. Biên dịch giao diện tĩnh frontend ra thư mục frontend/out/
npm run build:frontend

# 5. Khởi chạy máy chủ biên Cloudflare Workers cục bộ
npm run dev
```

Sau khi khởi chạy thành công, truy cập các địa chỉ dịch vụ:
- Cửa hàng bán lẻ trực tuyến: `http://localhost:8787`
- Cổng quản trị chuyên biệt: `http://localhost:8787/admin`
- Cổng tra cứu lịch sử mua hàng: `http://localhost:8787/orders`
- Trung tâm chính sách bán hàng: `http://localhost:8787/policies`

### 6.3 Kiểm thử tự động (Automated Acceptance Testing)

Hệ thống tích hợp bộ kịch bản kiểm thử tự động xác thực cơ chế cách ly quyền dữ liệu và trợ lý AI:

```bash
# Chạy kiểm thử cơ chế Demo Sandbox trên máy chủ cục bộ
node scripts/test_demo_admin_sandbox.mjs

# Chạy kiểm thử cơ chế Demo Sandbox trực tiếp trên Production Cloudflare Workers
$env:TEST_URL="https://one-store.onestoresportsshoes.workers.dev"
node scripts/test_demo_admin_sandbox.mjs
```

### 6.4 Triển khai lên Cloudflare Workers (Production Deployment)

```bash
# 1. Đăng nhập tài khoản Cloudflare
npx wrangler login

# 2. Khởi tạo tài nguyên trên Cloudflare (nếu triển khai dự án mới)
npx wrangler d1 create fashion_db
npx wrangler kv namespace create CACHE
npx wrangler r2 bucket create one-store-images
npx wrangler vectorize create ba-khi-knowledge --dimensions=1024 --metric=cosine

# 3. Cập nhật các ID định danh tài nguyên tương ứng vào file wrangler.toml

# 4. Thiết lập khóa bí mật ADMIN_TOKEN trên Cloudflare
npx wrangler secret put ADMIN_TOKEN

# 5. Áp dụng migration cơ sở dữ liệu lên Cloudflare D1 Remote
npx wrangler d1 migrations apply fashion_db --remote

# 6. Biên dịch giao diện tĩnh và triển khai toàn bộ hệ thống lên Cloudflare
npm run deploy
```

---

## 7. CẤU TRÚC THƯ MỤC MONOREPO

```text
one-store/
├── backend/                               # Phân hệ Backend API (Cloudflare Workers)
│   ├── migrations/                        # Các tệp kịch bản SQL định nghĩa lược đồ CSDL D1
│   │   ├── 0001_init.sql                  # Lược đồ bảng cơ sở ban đầu
│   │   ├── 0006_seed_vouchers.sql         # Dữ liệu mẫu mã giảm giá
│   │   ├── 0007_seed_authentic_market...  # Dữ liệu 70 mẫu sneaker chính hãng 2026
│   │   ├── 0009_admin_auth_and_an...      # Lược đồ bảng quản trị và phiên làm việc
│   │   ├── 0010_seed_store_policies...    # Seed 13 chunks tri thức chính sách cho RAG
│   │   ├── 0015_fix_admin_pbkdf2_hash.sql # Chuẩn hóa mật khẩu quản trị PBKDF2
│   │   └── 0016_seed_demo_admin_sandb...  # Khởi tạo tài khoản Demo Sandbox (Chỉ Xem)
│   └── src/                               # Mã nguồn TypeScript Backend
│       ├── index.ts                       # Điểm khởi động Hono app và route sản phẩm
│       ├── admin.ts                       # Router quản trị, xác thực phiên và xuất báo cáo
│       ├── chatbot.ts                     # Pipeline RAG AI, Smart Chunking, Agentic Ordering
│       └── commerce.ts                    # Module thương mại, giỏ hàng, voucher và khách hàng
├── frontend/                              # Phân hệ Giao diện Người dùng (Next.js 16)
│   ├── out/                               # Thư mục xuất bản tĩnh (được phục vụ qua Edge Assets)
│   ├── src/
│   │   ├── app/                           # Cấu trúc trang App Router
│   │   │   ├── admin/                     # Cổng quản trị chuyên biệt (/admin)
│   │   │   ├── orders/                    # Cổng tra cứu đơn hàng theo số điện thoại (/orders)
│   │   │   ├── policies/                  # Trung tâm chính sách bán hàng 6 tabs (/policies)
│   │   │   ├── globals.css                # Định nghĩa màu sắc và kiểu dáng toàn cục
│   │   │   ├── layout.tsx                 # Khung bao bọc giao diện chung
│   │   │   └── page.tsx                   # Trang chủ bán lẻ với banner và bộ lọc sản phẩm
│   │   ├── components/                    # Các thành phần giao diện tái sử dụng
│   │   │   ├── ChatbotWidget.tsx          # Cửa sổ nổi trợ lý AI Tư vấn One
│   │   │   ├── CartDrawer.tsx             # Ngăn kéo giỏ hàng với thanh tiến trình Freeship
│   │   │   ├── Header.tsx                 # Thanh điều hướng trên cùng kèm Cookie Consent
│   │   │   ├── Footer.tsx                 # Chân trang cửa hàng và chứng nhận tiêu chuẩn
│   │   │   ├── ProductCard.tsx            # Thẻ hiển thị sản phẩm sneaker
│   │   │   ├── ProductSection.tsx         # Khu vực danh mục sản phẩm và bộ lọc thương hiệu
│   │   │   └── Providers.tsx              # Quản lý ngữ cảnh trạng thái toàn cục
│   │   ├── context/                       # Ngữ cảnh trạng thái giỏ hàng và đa ngôn ngữ
│   │   ├── locales/                       # Bộ từ điển song ngữ chuẩn 1-1 (vi/en)
│   │   ├── lib/                           # Hàm tiện ích gọi API, định dạng tiền tệ và ngày tháng
│   │   └── types/                         # Định nghĩa kiểu dữ liệu TypeScript
│   ├── next.config.ts                     # Cấu hình Next.js (output: export)
│   └── package.json                       # Cấu hình phụ thuộc phân hệ Frontend
├── docs/                                  # Tài liệu kỹ thuật và hướng dẫn dự án
│   ├── knowledge/                         # 9 tệp Markdown tri thức nền tảng của Chatbot AI
│   └── HUONG_DAN_XAY_DUNG_CHATBOT_AI.docx # Tài liệu kỹ thuật chuẩn RAG 6 thành phần 4 bước
├── scripts/                               # Các kịch bản tự động hóa và kiểm thử
│   ├── sync-rsc.js                        # Kịch bản đồng bộ RSC payload chống lỗi 500 ENOENT
│   └── test_demo_admin_sandbox.mjs        # Bộ kiểm thử nghiệm thu cơ chế Sandbox (21 tiêu chí)
├── wrangler.toml                          # Tệp cấu hình phân bổ tài nguyên Cloudflare
├── package.json                           # Cấu hình tác vụ điều phối chung dự án Monorepo
├── AGENT_MEMORY.md                        # Nhật ký kiến trúc và quyết định kỹ thuật (ADR)
├── CODE_CONVENTIONS.md                    # Quy chuẩn lập trình bắt buộc (Zero-Emoji, Clean Code)
├── STORE_PROFILE.md                       # Hồ sơ thương hiệu, danh mục và chính sách One - Store
└── README.md                              # Tài liệu kỹ thuật giới thiệu dự án
```

---

## 8. NGUYÊN TẮC THIẾT KẾ & BẢO MẬT BẮT BUỘC

1. **Quy chuẩn Zero-Emoji (100% Vector Icons)**:
   - Nghiêm cấm đưa các ký tự emoji biểu cảm thô trực tiếp vào chuỗi văn bản hoặc mã nguồn JSX.
   - Toàn bộ biểu tượng trực quan phải sử dụng thư viện vector chính thức `lucide-react`.
2. **Nguyên tắc bảo vệ dữ liệu Cookie Consent Gating**:
   - Hệ thống tôn trọng quyền riêng tư của người dùng: Khi khách hàng chưa bấm đồng thuận cookie, không ghi dữ liệu cá nhân hay đơn hàng vào bộ nhớ cục bộ lâu dài.
3. **Phòng thủ chống ảo giác trong suy luận AI**:
   - Mọi câu trả lời của trợ lý AI bắt buộc phải neo chặt vào dữ liệu sản phẩm trong CSDL D1 và 13 chunks tài liệu chính sách được cấp phép.
   - Tuyệt đối không suy diễn sai lệch giá bán, thông số kỹ thuật hay đưa ra các cam kết ngoài phạm vi quy định.
4. **Cơ chế an toàn giao dịch CSDL (Atomic Transaction)**:
   - Quy trình đặt hàng COD trừ tồn kho và ghi nhận lịch sử được thực thi nguyên tử qua cơ chế `c.env.DB.batch(...)`, đảm bảo không bao giờ xảy ra tình trạng bán vượt tồn kho (overselling) hoặc đơn hàng thiếu chi tiết.
5. **Cách ly môi trường Sandbox an toàn**:
   - Tài khoản Demo Admin được bảo vệ bởi hàm kiểm duyệt trung tâm `requireWritePermission` ở tầng API Gateway, đảm bảo an toàn 100% cho dữ liệu thực tế trong mọi buổi thuyết trình, nghiệm thu và đánh giá.

---

## 9. GIẤY PHÉP VÀ THÔNG TIN BẢN QUYỀN

Dự án được phát triển phục vụ công tác Chuyển đổi số Doanh nghiệp Thương mại Điện tử.  
Toàn bộ mã nguồn và tài liệu kỹ thuật thuộc bản quyền của đội ngũ phát triển **One - Store (One)**.
