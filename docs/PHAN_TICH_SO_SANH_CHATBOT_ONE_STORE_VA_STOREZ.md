# TÀI LIỆU KỸ THUẬT: PHÂN TÍCH VÀ SO SÁNH KIẾN TRÚC VẬN HÀNH CHATBOT AI
## HỆ THỐNG ONE - STORE ("TƯ VẤN ONE") VÀ STOREZ ("SPEEDY")

---

## 1. TỔNG QUAN VÀ BỐI CẢNH ĐỐI SÁNH

Trong khuôn khổ môn học Chuyển đổi số Doanh nghiệp và Dự án Phát triển Hệ thống Thương mại Điện tử Hiện đại, việc tích hợp Trợ lý Trí tuệ Nhân tạo (AI Assistant / Chatbot) đóng vai trò then chốt trong việc tự động hóa khâu tư vấn bán hàng, nâng cao trải nghiệm khách hàng và tối ưu hóa tỷ lệ chuyển đổi đơn hàng.

Tài liệu này thực hiện phân tích chuyên sâu, so sánh đối chiếu kiến trúc kỹ thuật và cơ chế vận hành giữa hai hệ thống tiêu biểu cùng được xây dựng trên nền tảng điện toán biên không máy chủ (Serverless Edge Computing) của Cloudflare:
1. **Hệ thống One - Store (Trợ lý "Tư vấn One"):** Hệ thống thương mại điện tử chuyên phân phối 70 mẫu giày thể thao và sneaker chính hãng từ 10 thương hiệu hàng đầu thế giới (Âu - Á).
2. **Hệ thống StoreZ (Trợ lý "Speedy"):** Hệ thống showroom thương mại điện tử chuyên kinh doanh phương tiện giao thông và phương tiện đặc chủng (Xe máy, Ô tô, Máy bay, Trực thăng, Xe tăng).

---

## 2. BẢNG TỔNG HỢP ĐẶC TẢ KỸ THUẬT GIỮA HAI HỆ THỐNG

| Tiêu chí kỹ thuật | Hệ thống One - Store (Trợ lý Tư vấn One) | Hệ thống StoreZ (Trợ lý Speedy) |
| :--- | :--- | :--- |
| **Lĩnh vực kinh doanh** | Giày thể thao & Sneaker chính hãng (70 mẫu, 10 thương hiệu Âu - Á). | Phương tiện giao thông và đặc chủng (Xe máy, ô tô, máy bay, xe tăng). |
| **Hạ tầng triển khai** | Cloudflare Workers Monorepo (Next.js 16 Static Export + Hono Gateway). | Cloudflare Workers Monorepo (`apps/api` Hono + `apps/web` Vite React 19). |
| **Cơ sở dữ liệu quan hệ** | Cloudflare D1 (`fashion_db` - SQLite Engine). | Cloudflare D1 (`store` - SQLite Engine). |
| **Lưu trữ đối tượng (R2)** | Cloudflare R2 (`one-store-images`) lưu trữ ảnh studio sneaker chất lượng cao. | Dùng Cloudflare R2 / CDN cho hình ảnh phương tiện. |
| **Bộ nhớ đệm phân tán (KV)** | Cloudflare KV (`CACHE`) đệm danh mục sản phẩm (TTL 60s). | Cloudflare KV (`CART`) quản lý bộ đếm Rate Limiting kép. |
| **Mô hình nhúng (Embedding)** | `@cf/baai/bge-m3` (1024 chiều, Workers AI nội bộ). | Mô hình bên ngoài (`POST /embeddings`, 1024 chiều). |
| **Cơ sở dữ liệu Vector** | Cloudflare Vectorize (`ba-khi-knowledge`, metric cosine). | Cloudflare Vectorize (`store-policy`, metric cosine, 27 chunks). |
| **Mô hình ngôn ngữ (LLM)** | `@cf/google/gemma-4-26b-a4b-it` (Workers AI nội bộ Cloudflare). | Mô hình bên ngoài qua endpoint OpenAI-compatible (`AI_BASE_URL`). |
| **Truy xuất dữ liệu Sản phẩm** | D1 SQL query động kết hợp nạp trực tiếp danh mục vào Context Prompt. | **Tool Calling (Function Calling)** đọc trực tiếp D1 + Reranker lúc query. |
| **Truy xuất dữ liệu Chính sách** | RAG từ 6 nhóm văn bản băm thành 13 chunks chuyên sâu trong D1 & Vectorize. | RAG từ 7 tệp Markdown (`apps/api/policy/`), index vào Vectorize qua script. |
| **Định tuyến ý định (Router)** | Pipeline kiểm duyệt Zod + Prompt Guardrails phân vai chặt chẽ. | **Router 2 tầng:** Tầng 1 Regex (0ms) -> Tầng 2 TypeSafe JEV AI (800ms). |
| **Giao thức phản hồi** | REST API đồng bộ (`POST /api/chat`) trả về JSON chuẩn hóa. | **Server-Sent Events (SSE Streaming)** phát từng ký tự thời gian thực. |
| **Năng lực hành động (Action)** | **Agentic In-Chat Ordering:** Tự động chốt đơn COD trực tiếp trong chat. | **Read-Only / Info Bot:** Từ chối đặt hàng qua bot, chỉ hướng dẫn đến showroom. |
| **Nhập liệu giọng nói (Voice)** | Chưa tích hợp micro (chỉ hỗ trợ văn bản). | **Whisper AI** (`@cf/openai/whisper-large-v3-turbo`) tích hợp nút micro. |
| **Quản trị & Phân quyền** | Cổng `/admin` độc lập, xác thực PBKDF2, **Cơ chế Demo Sandbox (Chỉ Xem)**. | Cổng admin cơ bản, chưa có cơ chế cách ly quyền dữ liệu Sandbox. |
| **Hỗ trợ đa ngôn ngữ** | Đồng bộ song ngữ 1-1 **Tiếng Việt - Tiếng Anh (VI - EN)** toàn hệ thống. | Chỉ hỗ trợ duy nhất Tiếng Việt. |
| **Quy chuẩn thẩm mỹ** | **Zero-Emoji 100%**, phong cách Dark & Bred Athletic, Lucide vector icons. | Sử dụng phong cách hiện đại có kèm emoji trực tiếp trong văn bản. |

---

## 3. PHÂN TÍCH SÂU VỀ CẤU TRÚC VẬN HÀNH

### 3.1 Chiến lược Quản lý và Truy xuất Tri thức (Knowledge Strategy)

#### Cơ chế của StoreZ: Phân lập triệt để giữa Sản phẩm và Chính sách
Nhóm StoreZ áp dụng một triết lý thiết kế rất chặt chẽ:
- **Đối với sản phẩm:** Nhóm quyết định **không vector hóa sản phẩm vào Vector DB**.
  - *Lý do kỹ thuật:* Giá bán, các gói tùy chọn, chương trình khuyến mãi và tồn kho xe thay đổi liên tục. Nếu vector hóa, mỗi biến động nhỏ đều đòi hỏi re-index vector, dễ gây ra tình trạng dữ liệu cũ (stale data) hoặc sai lệch giá bán.
  - *Giải pháp:* Chuyển toàn bộ việc tra cứu sản phẩm sang cơ chế **Tool Calling** (Function Calling). Mô hình ngôn ngữ sẽ gọi các hàm như `search_products`, `get_product`, `compare_products`, `quote` để SELECT trực tiếp từ CSDL D1 tại thời điểm hỏi. Nhằm hiểu các câu hỏi mơ hồ ("tìm xe đi làm trong phố"), họ sử dụng **mô hình Reranker tại thời điểm truy vấn** (`POST /rerank`) để chấm điểm ngữ nghĩa trên danh sách sản phẩm đã lọc từ SQL mà không lưu bất kỳ vector tĩnh nào.
- **Đối với chính sách cửa hàng:** Áp dụng mô hình **RAG truyền thống**.
  - Bảy tệp văn bản Markdown chứa quy định bảo hành, đổi trả, đặt cọc, cứu hộ... được cắt thành 27 đoạn văn bản (chunks), nhúng vector 1024 chiều và lưu vào Cloudflare Vectorize `store-policy`.

#### Cơ chế của One - Store: Context Injection kết hợp Vector RAG chuyên sâu
- **Đối với chính sách và cẩm nang kích thước:** Áp dụng quy trình **Smart Chunking 13 đoạn tri thức chuyên sâu** (độ dài 500 - 1100 ký tự có độ gối đầu 140 ký tự để duy trì liên kết ngữ nghĩa). Các đoạn này được lưu đồng thời trong bảng `chat_chunks` của CSDL D1 và nạp vector 1024 chiều vào Cloudflare Vectorize `ba-khi-knowledge`. Khi người dùng hỏi về phom chân bè, cự ly marathon, quy định đổi trả hay bảo hành, hệ thống quét Cosine Similarity để trích xuất Top-K tri thức đưa vào context.
- **Đối với danh mục sản phẩm:** One - Store truy vấn trực tiếp danh mục 20 mẫu sneaker nổi bật hoặc theo nhóm phân loại từ bảng `products` của CSDL D1, sau đó nạp trực tiếp danh mục kèm giá bán và kích thước sẵn có vào System Prompt.
- *Đánh giá so sánh:* Giải pháp Tool Calling của StoreZ tối ưu rất tốt cho các sàn có hàng nghìn sản phẩm biến động giá liên tục. Tuy nhiên, cách tiếp cận nạp Context trực tiếp của One - Store lại phát huy sức mạnh vượt trội khi danh mục được chuẩn hóa (70 mẫu sneaker), cho phép AI nắm trọn vẹn toàn cảnh sản phẩm để tư vấn phối đồ và đặc biệt là phục vụ tác vụ **chốt đơn hàng trực tiếp ngay trong một bước**.

---

### 3.2 Cơ chế Định tuyến Ý định (Intent Routing)

```
[LUỒNG XỬ LÝ CÂU HỎI CỦA STOREZ - SPEEDY]
Người dùng gửi câu hỏi
        │
        ▼
Guardrails & Quick Reply (Thoát sớm nếu nhạy cảm / chào hỏi mẫu)
        │
        ▼
ROUTER TẦNG 1: Luật Regex cục bộ (0 ms)
   ├─ Chứa từ khóa chính sách thuần -> Route: POLICY (Bỏ qua tool catalog)
   ├─ Chứa tên xe / mức giá -> Route: CATALOG (Cung cấp 7 tools)
   └─ Chứa câu chào phiếm đàm -> Route: SMALLTALK (Không cấp tool, max 160 tokens)
        │ (Nếu câu hỏi mơ hồ, không rõ ý định)
        ▼
ROUTER TẦNG 2: TypeSafe JEV AI Classifier (Timeout 800 ms)
   Chạy song song: Phân loại JEV  ||  Truy xuất đoán trước Vectorize
   -> Quyết định chuyển về Smalltalk, Policy hoặc Catalog
```

- **Ưu điểm kiến trúc của StoreZ:**
  - Nhờ có Router 2 tầng, các câu hỏi chào hỏi xã giao (`smalltalk`) không phải nạp danh sách công cụ hay tài liệu dài dòng, phản hồi gần như tức thì với chi phí token tối thiểu (`max_tokens: 160`).
  - Phân loại rõ ràng giúp giới hạn số vòng lặp LLM (`smalltalk`: 1 vòng, `policy`: tối đa 2 vòng, `catalog`: tối đa 4 vòng).
- **Hạn chế của StoreZ:** Phụ thuộc vào dịch vụ bên thứ ba (TypeSafe JEV API). Nếu mất mạng hoặc API ngoài gặp sự cố, hệ thống buộc phải fallback về cấu hình mặc định.
- **Cách tiếp cận của One - Store:**
  - One - Store sử dụng một **Pipeline xử lý trực tiếp thống nhất (Unified Single Pipeline)** được bảo vệ bởi Zod Validator (2 - 600 ký tự) và System Prompt phân vai toàn diện.
  - Nhờ sử dụng mô hình Google Gemma 4 (26B parameters) chạy trực tiếp trên Cloudflare Workers AI với độ trễ thấp và băng thông nội bộ, hệ thống không cần qua tầng phân loại trung gian mà vẫn xử lý trọn vẹn cả tư vấn kỹ thuật chọn giày lẫn đàm thoại chốt đơn một cách tự nhiên.

---

### 3.3 Giao thức Truyền tải Dữ liệu và Trải nghiệm Người dùng (Protocol & UI)

#### Giao thức Server-Sent Events (SSE) của StoreZ
- StoreZ sử dụng `streamSSE` của Hono để mở luồng truyền dữ liệu liên tục:
  - Sự kiện `status`: Cập nhật trạng thái đang xử lý cho người dùng ("Đang tìm sản phẩm phù hợp...", "Đang tra chính sách...").
  - Sự kiện `delta`: Truyền từng mảnh văn bản (streaming tokens) giúp văn bản xuất hiện lập tức trên màn hình sau 200 - 400ms (Time-to-First-Token cực thấp).
  - Sự kiện `products`: Trả về danh sách thẻ sản phẩm. Đáng chú ý, thẻ sản phẩm do **Server tự động đối soát và dựng trực tiếp từ CSDL D1** dựa trên tên xe mà mô hình nhắc tới, ngăn ngừa triệt để việc LLM tự sinh đường dẫn ảnh hỏng hoặc viết sai giá niêm yết.
  - Sự kiện `policies`: Trả về các chip nguồn trích dẫn.

#### Giao thức REST JSON của One - Store
- One - Store sử dụng endpoint RESTful chuẩn hóa `POST /api/chat`, trả về gói JSON hoàn chỉnh gồm:
  - `answer`: Nội dung tư vấn chi tiết, logic suy luận mạch lạc.
  - `products`: Danh mục thẻ sản phẩm gợi ý kèm hình ảnh R2, mức giá VND và phân loại thể thao.
  - `sources`: Danh sách tên tài liệu chính sách căn cứ đã được đối soát.
  - `readyToConfirm` & `orderSummary`: Trạng thái thẩm định đơn hàng và bảng tóm tắt chốt đơn.
- *Đánh giá so sánh:* Cơ chế SSE Streaming của StoreZ mang lại cảm giác mượt mà về mặt thị giác. Ngược lại, cơ chế REST JSON của One - Store lại cực kỳ ổn định, dễ dàng viết kịch bản kiểm thử tự động (Automated Acceptance Testing) và kiểm soát hoàn hảo tính toàn vẹn của các đối tượng phức tạp như bảng thanh toán hay thẻ xác nhận đơn hàng VIP.

---

### 3.4 Khả năng Hành động Nghiệp vụ (Agentic Capabilities: Info-Bot vs In-Chat Ordering)

Đây là điểm khác biệt mang tính chiến lược và bản chất nhất giữa hai hệ thống:

```
[CƠ CHẾ HOẠT ĐỘNG THUẦN TRA CỨU CỦA STOREZ]
Khách hỏi mua xe -> Bot gọi tool tra cứu -> Báo giá lăn bánh -> Hướng dẫn khách tự đến showroom đặt cọc -> KẾT THÚC (Không tạo đơn).

[CƠ CHẾ AGENTIC IN-CHAT ORDERING CỦA ONE - STORE]
Khách yêu cầu đặt giày -> Bot phân tích thông tin (Tên, SĐT, Địa chỉ, Size)
       │
       ▼
Thẩm định dữ liệu sống trên CSDL D1 (Kiểm tra tồn kho theo size, tính phí freeship)
       │
       ▼
Tự động áp dụng mã ưu đãi ONE10 (Giảm 10%) -> Xuất bảng tóm tắt chốt đơn
       │
       ▼
Khách xác nhận -> Giao dịch nguyên tử c.env.DB.batch(...)
   ├─ Tạo bản ghi đơn hàng bảng orders (Mã ONE-YYYYMMDD-XXXX)
   ├─ Tạo danh sách mặt hàng bảng order_items
   └─ Trừ số lượng tồn kho sản phẩm
       │
       ▼
Trả về Thẻ Xác Nhận Đơn Hàng VIP kèm nút liên kết tra cứu nhanh sang /orders.
```

- **StoreZ chọn mô hình "Chỉ Cung Cấp Thông Tin (Information Provider)":**
  - Prompt hệ thống của StoreZ quy định rõ ràng: *"Không tự đặt hàng, không hứa hẹn khuyến mãi ngoài bảng giá"*. Khi khách hàng bày tỏ mong muốn mua xe, bot chỉ đóng vai trò hướng dẫn quy trình (đến showroom, xem xe, thanh toán cọc).
- **One - Store chọn mô hình "Trợ Lý Bán Hàng Hành Động (Agentic In-Chat Ordering)":**
  - Tư vấn One không chỉ trả lời câu hỏi mà đóng vai trò như một chuyên viên bán hàng độc lập:
    1. Thu thập và trích xuất thông tin khách hàng trong một bước đàm thoại.
    2. Thẩm định số lượng tồn kho thực tế của cỡ giày (size) trong CSDL D1.
    3. Áp dụng mã giảm giá độc quyền `ONE10` và tính toán biểu phí giao hàng (miễn phí từ 3 đôi).
    4. Khởi tạo đơn hàng thực tế vào cơ sở dữ liệu và trừ tồn kho tự động.
  - Năng lực này nâng tầm Chatbot từ một công cụ giải đáp thắc mắc thông thường thành một **kênh bán hàng trực tiếp (Conversational Commerce Channel)** tạo ra doanh thu thực tế cho doanh nghiệp.

---

### 3.5 Quản trị Hệ thống, Phân quyền và Bảo mật (Administration & Security)

#### Cơ chế của One - Store: Cổng Quản trị Chuyên biệt & Demo Sandbox
- **Hệ thống xác thực:** Sử dụng thuật toán PBKDF2 (100.000 iterations) kết hợp chuỗi muối ngẫu nhiên và quản lý phiên làm việc qua bảng `admin_sessions`.
- **Cơ chế Phân quyền Sandbox (Read-Only Data Isolation):**
  - Cung cấp nút truy cập nhanh 1-click vào tài khoản `demo` hiển thị trực tiếp trên trang đăng nhập `/admin`.
  - Người dùng Demo được cấp toàn quyền xem báo cáo doanh thu, danh sách đơn hàng, phân khúc khách hàng VIP/LTV, danh mục 70 mẫu sneaker và kho tri thức AI.
  - Tầng Backend Gateway ([`requireWritePermission`](file:///d:/HocTap/HK7/ChuyenDoiSo/project/one-store/backend/src/admin.ts)) chặn 100% các phương thức `POST`, `PATCH`, `DELETE`, trả về mã lỗi **HTTP 403 Forbidden**. Giao diện hiển thị Banner cảnh báo màu vàng cam và các thông báo Toast lịch sự.
  - Điều này giải quyết trọn vẹn bài toán bảo vệ an toàn dữ liệu sản xuất trong các buổi thanh tra, chấm thi và nghiệm thu dự án.

#### Cơ chế của StoreZ: Rate Limiting & Guardrails
- StoreZ chú trọng đặc biệt vào việc chống lạm dụng chi phí AI:
  - Quản lý bộ đếm tần suất kép trong Cloudflare KV: Giới hạn 20 tin nhắn / 10 phút / IP và trần tối đa 2000 tin nhắn / ngày trên toàn bộ cửa hàng.
  - Bộ lọc an toàn (`guard.ts`): Nhận diện và từ chối các chủ đề độc hại, tự hại, bạo lực.
  - Che giấu dữ liệu cá nhân (`PII Masking`): Tự động che số điện thoại, mã đơn hàng và email thành các thẻ `[sđt]`, `[mã đơn]`, `[email]` trước khi gửi qua API bên ngoài (JEV).

---

## 4. MA TRẬN PHÂN TÍCH ĐIỂM MẠNH VÀ ĐIỂM YẾU (SWOT ANALYSIS)

### 4.1 Dự án One - Store ("Tư vấn One")

#### Điểm mạnh (Strengths)
1. **Khả năng chốt đơn hàng tự động (Agentic In-Chat Ordering):** Tự động hoàn tất giao dịch đặt hàng COD, trừ tồn kho và tạo mã vận đơn ngay trong cửa sổ chat.
2. **Cơ chế Demo Sandbox an toàn tuyệt đối:** Phân quyền cách ly dữ liệu toàn diện ở cả Client và Server, cho phép trải nghiệm toàn bộ tính năng quản trị mà không làm biến động cơ sở dữ liệu.
3. **Độc lập và bảo mật cao:** Sử dụng 100% mô hình AI nội bộ trên hạ tầng Cloudflare Workers AI (Gemma 4 và BGE-M3), không phụ thuộc khóa API bên thứ ba, không rò rỉ dữ liệu khách hàng ra ngoài.
4. **Chuẩn hóa giao diện Zero-Emoji & Song ngữ toàn diện:** Thiết kế Dark & Bred Athletic chuyên nghiệp với 100% vector icons `lucide-react`, hỗ trợ song ngữ chuẩn mực Tiếng Việt - Tiếng Anh (VI - EN).
5. **Đồng bộ hóa hình ảnh Studio nội bộ:** Toàn bộ 70 mẫu sneaker được lưu trữ trực tiếp trên Cloudflare R2 Bucket của dự án (`one-store-images`), đảm bảo tính ổn định lâu dài.

#### Điểm yếu (Weaknesses)
1. **Chưa hỗ trợ truyền dữ liệu dạng Streaming (SSE):** Giao tiếp qua HTTP POST JSON truyền thống khiến người dùng phải chờ mô hình suy luận xong toàn bộ câu trả lời mới hiển thị trên màn hình.
2. **Chưa có tính năng nhập liệu bằng giọng nói:** Người dùng chỉ có thể tương tác bằng cách gõ phím, chưa có nút bấm micro thu âm trực tiếp.
3. **Chưa có bộ phân loại ý định phân tầng:** Mọi câu hỏi (kể cả câu chào hỏi đơn giản) đều đi qua pipeline xử lý chung, chưa tối ưu hóa thời gian phản hồi cho các câu phiếm đàm.

---

### 4.2 Dự án StoreZ ("Speedy")

#### Điểm mạnh (Strengths)
1. **Phản hồi thời gian thực qua SSE Streaming:** Văn bản xuất hiện theo từng ký tự kèm các thông báo trạng thái trung gian, mang lại trải nghiệm tương tác mượt mà và giảm cảm giác chờ đợi.
2. **Chiến lược dữ liệu sản phẩm thông minh (Tool Calling thay vì Vectorize):** Tránh được hoàn toàn nguy cơ lệch giá và sai lệch tồn kho đối với các mặt hàng có thuộc tính biến động cao.
3. **Bộ định tuyến ý định 2 tầng (Intent Router):** Phân loại câu hỏi thông minh giúp tiết kiệm tối đa lượng token tiêu thụ và giảm độ trễ cho các câu chào hỏi xã giao.
4. **Tích hợp nhập liệu giọng nói (Whisper AI):** Tận dụng mô hình Whisper miễn phí trên Cloudflare Workers AI để hỗ trợ khách hàng nói tiếng Việt thay vì gõ văn bản.
5. **Hiệu ứng vật lý giao diện tinh tế:** Cửa sổ chat có cơ chế lò xo giảm chấn (spring physics) và các nút điều khiển thu nhỏ/đóng kiểu hệ điều hành macOS.

#### Điểm yếu (Weaknesses)
1. **Thuần túy là Chatbot tra cứu thông tin (Read-Only Info Bot):** Hoàn toàn không có khả năng chốt đơn, không tạo được giá trị chuyển đổi trực tiếp trên phiên hội thoại.
2. **Thiếu cơ chế Sandbox phân quyền quản trị:** Cổng admin chưa có chế độ cách ly dữ liệu phục vụ khách tham quan hoặc nghiệm thu an toàn.
3. **Phụ thuộc vào các dịch vụ API bên ngoài:** Cần cấu hình nhiều biến môi trường (`AI_BASE_URL`, `AI_API_KEY`, `JEV_BASE_URL`, `JEV_API_KEY`), tiềm ẩn rủi ro gián đoạn dịch vụ khi bên thứ ba gặp sự cố hoặc hết hạn ngạch.
4. **Chưa hỗ trợ đa ngôn ngữ:** Toàn bộ hệ thống giao diện và chatbot chỉ hỗ trợ Tiếng Việt, hạn chế khả năng tiếp cận khách hàng quốc tế.

---

## 5. BÀI HỌC KINH NGHIỆM VÀ ĐỀ XUẤT NÂNG CẤP CHO ONE - STORE

Từ kết quả khảo sát và phân tích chuyên sâu dự án StoreZ, đội ngũ kỹ thuật dự án **One - Store** có thể rút ra 4 bài học giá trị và xây dựng lộ trình nâng cấp hệ thống như sau:

### Bài học 1: Nâng cấp Giao thức Truyền tải sang Server-Sent Events (SSE Streaming)
- **Vấn đề hiện tại:** Trợ lý Tư vấn One đang phản hồi qua REST JSON. Mặc dù tốc độ xử lý của Gemma 4 trên Cloudflare Workers AI khá nhanh (khoảng 1.2 - 1.8 giây), nhưng người dùng vẫn phải nhìn hiệu ứng chờ (typing indicator) trong suốt khoảng thời gian đó.
- **Giải pháp kiến tạo:**
  - Chuyển đổi endpoint `POST /api/chat` sang giao thức `streamSSE` của Hono.
  - Phía Client (`ChatbotWidget.tsx`) sử dụng `ReadableStreamDefaultReader` để đọc và hiển thị văn bản theo từng từ ngay khi mô hình vừa sinh ra.
  - Gửi kèm các sự kiện trung gian như `status` ("Đang kiểm tra size giày...", "Đang tính toán ưu đãi ONE10...") để tăng tính sinh động.

### Bài học 2: Bổ sung Tính năng Nhập liệu bằng Giọng nói (Voice Input qua Whisper AI)
- **Cơ hội sẵn có:** Dự án One - Store đã có sẵn binding `c.env.AI` trỏ tới Cloudflare Workers AI.
- **Giải pháp kiến tạo:**
  - Bổ sung endpoint `POST /api/chat/transcribe` tiếp nhận tệp âm thanh thu từ trình duyệt (`audio/webm` hoặc `audio/mp4`).
  - Kích hoạt mô hình `@cf/openai/whisper-large-v3-turbo` có sẵn trên Cloudflare (hoàn toàn miễn phí, không phát sinh chi phí bản quyền).
  - Cung cấp `initial_prompt` chứa tên các thương hiệu sneaker lớn (Nike, Adidas, Asics, Mizuno, Li-Ning, Anta, Salomon...) để Whisper nhận diện chính xác tên riêng tiếng nước ngoài khi khách phát âm.

### Bài học 3: Tích hợp Bộ định tuyến Ý định Nhanh (Fast Local Pre-Router)
- **Giải pháp kiến tạo:**
  - Không cần tích hợp thêm API bên ngoài phức tạp như JEV của StoreZ, One - Store có thể xây dựng một bộ lọc Regex cục bộ (0ms) ở đầu hàm xử lý.
  - Nếu khách chỉ gửi các câu chào xã giao ("Xin chào", "Hello", "Shop ở đâu", "Cảm ơn"), hệ thống lập tức trả về câu chào thương hiệu tiêu chuẩn mà không cần kích hoạt pipeline LLM và quét Vectorize, giúp tiết kiệm tài nguyên xử lý và phản hồi dưới 50ms.

### Bài học 4: Duy trì và Phát huy Tối đa Thế mạnh Chốt Đơn Đàm Thoại (Agentic Ordering)
- **Khẳng định giá trị cốt lõi:**
  - Tính năng **Agentic In-Chat Ordering** kết hợp **Cơ chế Phân quyền Demo Sandbox** của One - Store là những điểm sáng kỹ thuật vượt trội hoàn toàn so với StoreZ.
  - Cần tiếp tục duy trì và hoàn thiện quy trình này: bổ sung thêm tính năng gợi ý các mẫu tất/vớ thể thao đi kèm (Cross-selling) hoặc tự động gửi email thông báo mã vận đơn khi đơn hàng COD được khởi tạo thành công.

---

## 6. KẾT LUẬN

Hệ thống Chatbot của **StoreZ ("Speedy")** là một ví dụ xuất sắc về việc tối ưu hóa hiệu năng, giảm độ trễ (Streaming SSE, Router 2 tầng) và tương tác đa phương thức (Whisper Voice Input). Trong khi đó, hệ thống Chatbot của **One - Store ("Tư vấn One")** lại là một giải pháp thương mại điện tử thực chiến đỉnh cao với khả năng chốt đơn hàng tự động, kiến trúc bảo mật độc lập trên Cloudflare Workers AI và cơ chế quản trị Demo Sandbox chuẩn mực.

Việc tiếp thu những điểm sáng về mặt trải nghiệm thời gian thực (SSE Streaming) và giao tiếp giọng nói (Voice Input) từ StoreZ sẽ giúp hệ thống **One - Store** hoàn thiện toàn diện, khẳng định vị thế dẫn đầu về giải pháp công nghệ thương mại điện tử thông minh.

