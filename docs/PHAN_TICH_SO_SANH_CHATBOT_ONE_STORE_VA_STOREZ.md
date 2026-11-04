# TÀI LIỆU KỸ THUẬT: PHÂN TÍCH VÀ SO SÁNH KIẾN TRÚC VẬN HÀNH CHATBOT AI
## HỆ THỐNG ONE - STORE ("TƯ VẤN ONE") VÀ STOREZ ("SPEEDY")
### (CẬP NHẬT THEO BẢN KIẾN TRÚC MỚI NHẤT: BẢN NÂNG CẤP CLOUDFLARE-NATIVE CỦA STOREZ)

---

## 1. TỔNG QUAN VÀ BỐI CẢNH ĐỐI SÁNH

Trong khuôn khổ môn học Chuyển đổi số Doanh nghiệp và Dự án Phát triển Hệ thống Thương mại Điện tử Hiện đại, việc tích hợp Trợ lý Trí tuệ Nhân tạo (AI Assistant / Chatbot) đóng vai trò then chốt trong việc tự động hóa khâu tư vấn bán hàng, nâng cao trải nghiệm khách hàng và tối ưu hóa tỷ lệ chuyển đổi đơn hàng.

Tài liệu này thực hiện phân tích chuyên sâu, so sánh đối chiếu kiến trúc kỹ thuật và cơ chế vận hành giữa hai hệ thống tiêu biểu được xây dựng trên nền tảng điện toán biên không máy chủ (Serverless Edge Computing) của Cloudflare:
1. **Hệ thống One - Store (Trợ lý "Tư vấn One"):** Hệ thống thương mại điện tử chuyên phân phối 70 mẫu giày thể thao và sneaker chính hãng từ 10 thương hiệu hàng đầu thế giới (Âu - Á).
2. **Hệ thống StoreZ (Trợ lý "Speedy"):** Hệ thống showroom thương mại điện tử chuyên kinh doanh phương tiện giao thông và phương tiện đặc chủng (Xe máy, Ô tô, Máy bay, Trực thăng, Xe tăng).

> Ghi chú cập nhật kiến trúc: StoreZ vừa hoàn tất việc sáp nhập nhánh `cloudflare-native` vào nhánh chính (`main`, commit `f9f08ac`). Theo đó, StoreZ đã loại bỏ toàn bộ các dịch vụ bên thứ ba (OpenAI-compatible LLM, TypeSafe JEV Classifier, Cloudinary) để chuyển dịch 100% sang Cloudflare Workers AI và Cloudflare KV/Images, chính thức hội tụ về cùng triết lý Cloudflare-Native mà One - Store đã tiên phong áp dụng ngay từ đầu.

---

## 2. BẢNG TỔNG HỢP ĐẶC TẢ KỸ THUẬT GIỮA HAI HỆ THỐNG (SAU CẬP NHẬT)

| Tiêu chí kỹ thuật | Hệ thống One - Store (Trợ lý Tư vấn One) | Hệ thống StoreZ (Trợ lý Speedy - Bản mới nhất) |
| :--- | :--- | :--- |
| **Lĩnh vực kinh doanh** | Giày thể thao & Sneaker chính hãng (70 mẫu, 10 thương hiệu Âu - Á). | Phương tiện giao thông và đặc chủng (Xe máy, ô tô, máy bay, xe tăng). |
| **Hạ tầng triển khai** | Cloudflare Workers Monorepo (Next.js 16 Static Export + Hono Gateway). | Cloudflare Workers Monorepo (`apps/api` Hono + `apps/web` Vite React 19). |
| **Cơ sở dữ liệu quan hệ** | Cloudflare D1 (`fashion_db` - SQLite Engine). | Cloudflare D1 (`store` - SQLite Engine). |
| **Lưu trữ đối tượng (R2 / KV)** | Cloudflare R2 (`one-store-images`) lưu trữ ảnh studio sneaker chất lượng cao. | Cloudflare KV (`MEDIA`) lưu trữ byte ảnh kết hợp binding Cloudflare Images để resize `?w=`. |
| **Bộ nhớ đệm phân tán (KV)** | Cloudflare KV (`CACHE`) đệm danh mục sản phẩm (TTL 60s). | Cloudflare KV (`CART`) quản lý bộ đếm Rate Limiting kép. |
| **Mô hình nhúng (Embedding)** | `@cf/baai/bge-m3` (1024 chiều, Workers AI nội bộ). | `@cf/baai/bge-m3` (1024 chiều, Workers AI nội bộ qua `env.AI`). |
| **Cơ sở dữ liệu Vector** | Cloudflare Vectorize (`ba-khi-knowledge`, metric cosine). | Cloudflare Vectorize (`store-policy`, metric cosine, 27 chunks). |
| **Mô hình ngôn ngữ (LLM)** | `@cf/google/gemma-4-26b-a4b-it` (Workers AI nội bộ Cloudflare). | `@cf/qwen/qwen3.8-27b` (Workers AI nội bộ Cloudflare qua `env.AI`). |
| **Mô hình Reranker** | Lọc xếp hạng kết hợp Cosine Similarity trong Vectorize. | `@cf/baai/bge-reranker-base` (Workers AI nội bộ qua `env.AI`). |
| **Truy xuất dữ liệu Sản phẩm** | D1 SQL query động kết hợp nạp trực tiếp danh mục vào Context Prompt. | **Tool Calling (Function Calling)** đọc trực tiếp D1 + Reranker lúc query. |
| **Truy xuất dữ liệu Chính sách** | RAG từ 6 nhóm văn bản băm thành 13 chunks chuyên sâu trong D1 & Vectorize. | RAG từ 7 tệp Markdown (`apps/api/policy/`), index vào Vectorize qua script. |
| **Định tuyến ý định (Router)** | Pipeline kiểm duyệt Zod + Prompt Guardrails phân vai chặt chẽ. | **Router 1 tầng Luật Cục Bộ (0ms)**: Regex + Teencode; Mơ hồ -> `catalog`. **(Đã xóa bỏ hoàn toàn tầng 2 JEV)**. |
| **Giao thức phản hồi** | REST API đồng bộ (`POST /api/chat`) trả về JSON chuẩn hóa. | **Server-Sent Events (SSE Streaming)** phát từng ký tự thời gian thực. |
| **Năng lực hành động (Action)** | **Agentic In-Chat Ordering:** Tự động chốt đơn COD trực tiếp trong chat. | **Read-Only / Info Bot:** Từ chối đặt hàng qua bot, chỉ hướng dẫn đến showroom. |
| **Nhập liệu giọng nói (Voice)** | Chưa tích hợp micro (chỉ hỗ trợ văn bản). | **Whisper AI** (`@cf/openai/whisper-large-v3-turbo`) tích hợp nút micro. |
| **Quản trị & Phân quyền** | Cổng `/admin` độc lập, xác thực PBKDF2, **Cơ chế Demo Sandbox (Chỉ Xem)**. | Cổng admin cơ bản, chưa có cơ chế cách ly quyền dữ liệu Sandbox. |
| **Hỗ trợ đa ngôn ngữ** | Đồng bộ song ngữ 1-1 **Tiếng Việt - Tiếng Anh (VI - EN)** toàn hệ thống. | Chỉ hỗ trợ duy nhất Tiếng Việt. |
| **Quy chuẩn thẩm mỹ** | **Zero-Emoji 100%**, phong cách Dark & Bred Athletic, Lucide vector icons. | Sử dụng phong cách hiện đại có kèm emoji trực tiếp trong văn bản. |

---

## 3. PHÂN TÍCH SÂU VỀ CẤU TRÚC VẬN HÀNH

### 3.1 Chiến lược Quản lý và Truy xuất Tri thức (Knowledge Strategy)

#### Cơ chế của StoreZ: Hoàn thiện 100% trên Cloudflare Workers AI
Trong bản cập nhật mới nhất, nhóm StoreZ đã hoàn thành việc loại bỏ các phụ thuộc API bên ngoài và đưa toàn bộ quy trình AI về Cloudflare:
- **Đối với sản phẩm:**
  - Vẫn duy trì nguyên lý **không vector hóa sản phẩm** để tránh dữ liệu cũ (stale data).
  - Vòng lặp đàm thoại cho phép mô hình ngôn ngữ `@cf/qwen/qwen3.8-27b` thực hiện tối đa 4 lượt gọi công cụ (tool calling: `search_products`, `get_product`, `compare_products`, `quote`, `get_showroom_info`, `track_order`, `search_policy`).
  - Điểm mới: Việc chấm điểm ngữ nghĩa cho các câu hỏi mở được chuyển sang mô hình **`@cf/baai/bge-reranker-base`** chạy trực tiếp trên `env.AI` của Cloudflare với thời gian phản hồi nhanh và chi phí 0 đồng trong hạn mức miễn phí.
- **Đối với chính sách cửa hàng:**
  - 7 tệp Markdown được cắt đoạn thành 27 chunks, nhúng vector bằng chính mô hình **`@cf/baai/bge-m3`** trên Workers AI (trước đây gọi endpoint ngoài) và lưu trữ trên Cloudflare Vectorize `store-policy`.

#### Cơ chế của One - Store: Context Injection kết hợp Vector RAG chuyên sâu
- **Đối với chính sách và cẩm nang kích thước:** Áp dụng quy trình **Smart Chunking 13 đoạn tri thức chuyên sâu** (độ dài 500 - 1100 ký tự có độ gối đầu 140 ký tự để duy trì liên kết ngữ nghĩa). Các đoạn này được lưu đồng thời trong bảng `chat_chunks` của CSDL D1 và nạp vector 1024 chiều vào Cloudflare Vectorize `ba-khi-knowledge`. Khi người dùng hỏi về phom chân bè, cự ly marathon, quy định đổi trả hay bảo hành, hệ thống quét Cosine Similarity để trích xuất Top-K tri thức đưa vào context.
- **Đối với danh mục sản phẩm:** One - Store truy vấn trực tiếp danh mục 20 mẫu sneaker nổi bật hoặc theo nhóm phân loại từ bảng `products` của CSDL D1, sau đó nạp trực tiếp danh mục kèm giá bán và kích thước sẵn có vào System Prompt.
- *Đánh giá so sánh:* Cả hai hệ thống hiện nay đều đã thống nhất sử dụng chung chuẩn mô hình nhúng `@cf/baai/bge-m3` trên Cloudflare Workers AI. One - Store với danh mục chuẩn hóa 70 mẫu sneaker tập trung vào khả năng cung cấp đầy đủ thông tin để AI đưa ra quyết định chốt đơn tức thì trong một bước đàm thoại.

---

### 3.2 Cơ chế Định tuyến Ý định (Intent Routing) — Bước ngoặt Loại bỏ JEV của StoreZ

Điểm thay đổi kiến trúc quan trọng nhất trong bản cập nhật mới của StoreZ nằm ở việc **tái cấu trúc toàn diện tầng Định tuyến ý định (Router)**:

```
[LUỒNG XỬ LÝ MỚI CỦA STOREZ (SAU KHI XÓA BỎ JEV)]
Người dùng gửi câu hỏi
        │
        ▼
Guardrails & Quick Reply (Thoát sớm nếu nhạy cảm / chào hỏi mẫu)
        │
        ▼
ROUTER TẦNG 1: Luật Cục bộ (0 ms) — Tiền xử lý chữ thường + Từ điển viết tắt
   ├─ Chứa từ khóa chính sách thuần -> Route: POLICY (Đã tra sẵn search_policy, max 450 tokens)
   ├─ Chứa câu chào phiếm đàm      -> Route: SMALLTALK (Không cấp tool, max 160 tokens)
   ├─ Chứa tên xe / mức giá        -> Route: CATALOG (Cung cấp đầy đủ công cụ)
   │
   │ (Nếu câu hỏi mơ hồ, luật cục bộ không xác định chắc chắn)
   ▼
MẶC ĐỊNH RƠI VỀ ROUTE: CATALOG (Không còn gọi mô hình tầng 2 JEV)
(Profile Catalog có đủ công cụ và có cả search_policy dự phòng để LLM tự quyết định)
```

- **Nguyên nhân StoreZ xóa bỏ Router tầng 2 (TypeSafe JEV Classifier):**
  1. *Chi phí và sự phụ thuộc:* Mô hình JEV yêu cầu tài khoản bên ngoài có nạp credit.
  2. *Độ trễ và rủi ro gián đoạn:* Mỗi lượt gọi JEV mất thêm 600 - 800ms mạng ngoài. Khi API ngoài gặp sự cố, hệ thống bị nghẽn mạng.
  3. *Quyền riêng tư dữ liệu (PII):* Trước đây gửi dữ liệu sang JEV đòi hỏi phải che số điện thoại, email bằng `maskPersonal`. Khi bỏ JEV, toàn bộ dữ liệu chỉ lưu chuyển nội bộ trên hạ tầng bảo mật của Cloudflare.
- **Đánh giá kiến trúc Router mới của StoreZ:**
  - Việc StoreZ chuyển sang Router 1 tầng thuần luật cục bộ (0ms) và cho câu hỏi mơ hồ rơi về `catalog` đã chứng minh tính thực tế cao của phương pháp xử lý quy tắc nhanh (rule-based pre-routing).
  - Đây chính là bằng chứng xác thực hoàn hảo cho giải pháp **Fast Local Pre-Router (0ms)** mà One - Store đã vạch ra trong bản kế hoạch nâng cấp Chatbot v2.0.

---

### 3.3 Giao thức Truyền tải Dữ liệu và Trải nghiệm Người dùng (Protocol & UI)

#### Giao thức Server-Sent Events (SSE) của StoreZ
- StoreZ sử dụng `streamSSE` của Hono kết hợp chế độ stream của Workers AI (`stream: true` trên `@cf/qwen/qwen3.8-27b`):
  - Sự kiện `status`: Cập nhật trạng thái đang xử lý cho người dùng ("Đang tìm sản phẩm phù hợp...", "Đang tra chính sách...").
  - Sự kiện `delta`: Truyền từng mảnh văn bản (streaming tokens) giúp văn bản xuất hiện lập tức trên màn hình sau 200 - 350ms.
  - Sự kiện `products`: Trả về danh sách thẻ sản phẩm do **Server tự động đối soát và dựng trực tiếp từ CSDL D1** dựa trên tên xe mà mô hình nhắc tới.
  - Sự kiện `policies`: Trả về các chip nguồn trích dẫn.

#### Giao thức REST JSON của One - Store
- One - Store sử dụng endpoint RESTful chuẩn hóa `POST /api/chat`, trả về gói JSON hoàn chỉnh gồm:
  - `answer`: Nội dung tư vấn chi tiết, logic suy luận mạch lạc.
  - `products`: Danh mục thẻ sản phẩm gợi ý kèm hình ảnh R2, mức giá VND và phân loại thể thao.
  - `sources`: Danh sách tên tài liệu chính sách căn cứ đã được đối soát.
  - `readyToConfirm` & `orderSummary`: Trạng thái thẩm định đơn hàng và bảng tóm tắt chốt đơn.
- *Đánh giá so sánh:* Trải nghiệm SSE Streaming của StoreZ mang lại cảm giác mượt mà về thị giác, giảm áp lực chờ đợi cho khách hàng. Đây là tính năng One - Store cần tiếp thu ngay trong bản nâng cấp v2.0.

---

### 3.4 Khả năng Hành động Nghiệp vụ (Agentic Capabilities: Info-Bot vs In-Chat Ordering)

Đây tiếp tục là khoảng cách phân hóa lớn nhất về mặt nghiệp vụ thương mại điện tử giữa hai hệ thống:

```
[CƠ CHẾ HOẠT ĐỘNG THUẦN TRA CỨU CỦA STOREZ - SPEEDY]
Khách hỏi mua xe -> Bot gọi tool tra cứu -> Báo giá lăn bánh -> Hướng dẫn khách tự đến showroom -> KẾT THÚC (Không hỗ trợ đặt hàng).
(Tài liệu StoreZ khẳng định: "Không tự đặt hàng, không hứa hẹn khuyến mãi ngoài bảng giá").

[CƠ CHẾ AGENTIC IN-CHAT ORDERING ĐỘC QUYỀN CỦA ONE - STORE]
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

- **Đánh giá bản chất:** StoreZ dù đã nâng cấp kiến trúc lên Cloudflare-Native nhưng vẫn giữ nguyên định vị là một **Chatbot tra cứu thông tin (Read-Only Information Bot)**.
- Trong khi đó, **One - Store là một Trợ lý Bán hàng Hành động (Agentic Conversational Commerce Agent)** thực thụ, trực tiếp mang lại doanh thu và tối ưu hóa tỷ lệ chuyển đổi cho cửa hàng.

---

### 3.5 Quản trị Hệ thống, Phân quyền và Bảo mật (Administration & Security)

#### Cơ chế của One - Store: Cổng Quản trị Chuyên biệt & Demo Sandbox
- **Hệ thống xác thực:** Sử dụng thuật toán PBKDF2 (100.000 iterations) kết hợp chuỗi muối ngẫu nhiên và quản lý phiên làm việc qua bảng `admin_sessions`.
- **Cơ chế Phân quyền Sandbox (Read-Only Data Isolation):**
  - Cung cấp nút truy cập nhanh 1-click vào tài khoản `demo` hiển thị trực tiếp trên trang đăng nhập `/admin`.
  - Tầng Backend Gateway ([`requireWritePermission`](file:///d:/HocTap/HK7/ChuyenDoiSo/project/one-store/backend/src/admin.ts)) chặn 100% các phương thức `POST`, `PATCH`, `DELETE`, trả về mã lỗi **HTTP 403 Forbidden**. Giao diện hiển thị Banner cảnh báo màu vàng cam và các thông báo Toast lịch sự.
  - Bảo vệ an toàn tuyệt đối dữ liệu sản xuất trong các buổi thanh tra, chấm thi và nghiệm thu dự án.

#### Cơ chế của StoreZ: Hoàn thiện Bảo mật Nội bộ
- Sau khi loại bỏ các dịch vụ ngoài, StoreZ đạt được tính toàn vẹn bảo mật cao:
  - Dữ liệu cá nhân của khách hàng không còn nguy cơ rò rỉ ra bên ngoài vì không còn gọi bất kỳ API bên thứ ba nào.
  - Duy trì kiểm soát tần suất kép qua Cloudflare KV: 20 tin nhắn / 10 phút / IP và trần 2000 tin nhắn / ngày.
  - Tuy nhiên, StoreZ vẫn chưa có cơ chế phân quyền Demo Sandbox để cách ly quyền ghi cho người dùng trải nghiệm quản trị.

---

## 4. MA TRẬN PHÂN TÍCH ĐIỂM MẠNH VÀ ĐIỂM YẾU (SWOT ANALYSIS CẬP NHẬT)

### 4.1 Dự án One - Store ("Tư vấn One")

#### Điểm mạnh (Strengths)
1. **Khả năng chốt đơn hàng tự động (Agentic In-Chat Ordering):** Tự động hoàn tất giao dịch đặt hàng COD, trừ tồn kho và tạo mã vận đơn ngay trong cửa sổ chat.
2. **Cơ chế Demo Sandbox an toàn tuyệt đối:** Phân quyền cách ly dữ liệu toàn diện ở cả Client và Server, cho phép trải nghiệm toàn bộ tính năng quản trị mà không làm biến động cơ sở dữ liệu.
3. **Độc lập và bảo mật cao:** Sử dụng 100% mô hình AI nội bộ trên hạ tầng Cloudflare Workers AI (Gemma 4 và BGE-M3), không phụ thuộc khóa API bên thứ ba, không rò rỉ dữ liệu khách hàng.
4. **Chuẩn hóa giao diện Zero-Emoji & Song ngữ toàn diện:** Thiết kế Dark & Bred Athletic chuyên nghiệp với 100% vector icons `lucide-react`, hỗ trợ song ngữ chuẩn mực Tiếng Việt - Tiếng Anh (VI - EN).
5. **Đồng bộ hóa hình ảnh Studio nội bộ:** Toàn bộ 70 mẫu sneaker được lưu trữ trực tiếp trên Cloudflare R2 Bucket của dự án (`one-store-images`), đảm bảo tính ổn định lâu dài.

#### Điểm yếu (Weaknesses)
1. **Chưa hỗ trợ truyền dữ liệu dạng Streaming (SSE):** Giao tiếp qua HTTP POST JSON truyền thống khiến người dùng phải chờ mô hình suy luận xong toàn bộ câu trả lời mới hiển thị trên màn hình.
2. **Chưa có tính năng nhập liệu bằng giọng nói:** Người dùng chỉ có thể tương tác bằng cách gõ phím, chưa có nút bấm micro thu âm trực tiếp.
3. **Chưa có bộ phân loại ý định phân tầng:** Mọi câu hỏi (kể cả câu chào hỏi đơn giản) đều đi qua pipeline xử lý chung, chưa tối ưu hóa thời gian phản hồi cho các câu phiếm đàm.

---

### 4.2 Dự án StoreZ ("Speedy" - Sau bản cập nhật)

#### Điểm mạnh (Strengths)
1. **100% Cloudflare-Native:** Đã xóa sạch mọi phụ thuộc bên thứ ba (OpenAI, Cloudinary, TypeSafe JEV), toàn bộ LLM, Embedding, Reranker, Whisper, KV Media đều chạy nội bộ trên Cloudflare.
2. **Phản hồi thời gian thực qua SSE Streaming:** Văn bản xuất hiện theo từng ký tự kèm các thông báo trạng thái trung gian, mang lại trải nghiệm tương tác mượt mà.
3. **Chiến lược dữ liệu sản phẩm thông minh (Tool Calling kết hợp Reranker nội bộ):** Tránh được hoàn toàn nguy cơ lệch giá và sai lệch tồn kho với chi phí 0 đồng.
4. **Bộ định tuyến ý định cục bộ tinh gọn (0ms):** Bỏ tầng 2 phức tạp, dùng luật cục bộ nhanh gọn và cho câu hỏi mơ hồ rơi về catalog an toàn.
5. **Tích hợp nhập liệu giọng nói (Whisper AI):** Tận dụng mô hình Whisper trên Cloudflare Workers AI hỗ trợ khách hàng nói tiếng Việt kèm prompt dẫn đường thương hiệu.

#### Điểm yếu (Weaknesses)
1. **Thuần túy là Chatbot tra cứu thông tin (Read-Only Info Bot):** Hoàn toàn không có khả năng chốt đơn, không tạo được giá trị chuyển đổi trực tiếp trên phiên hội thoại.
2. **Thiếu cơ chế Sandbox phân quyền quản trị:** Cổng admin chưa có chế độ cách ly dữ liệu phục vụ khách tham quan hoặc nghiệm thu an toàn.
3. **Chưa hỗ trợ đa ngôn ngữ:** Toàn bộ hệ thống giao diện và chatbot chỉ hỗ trợ Tiếng Việt, hạn chế khả năng tiếp cận khách hàng quốc tế.
4. **Nguy cơ kịch trần Neuron Workers AI:** Gói Workers AI miễn phí giới hạn 10.000 neurons/ngày; khi dùng đồng thời Qwen 27B + BGE-M3 + Reranker + Whisper với lưu lượng lớn có thể sớm chạm ngưỡng.

---

## 5. BÀI HỌC KINH NGHIỆM VÀ ĐỀ XUẤT NÂNG CẤP CHO ONE - STORE

Bản cập nhật Cloudflare-Native mới của StoreZ mang lại những bài học kinh nghiệm cực kỳ quý giá cho đội ngũ kỹ thuật **One - Store**:

### Bài học 1: Khẳng định tính đúng đắn của Triết lý Cloudflare-Native 100%
- Việc StoreZ phải loại bỏ các dịch vụ ngoài để quay về 100% Cloudflare Workers AI chứng minh rằng lựa chọn kiến trúc ban đầu của One - Store là hoàn toàn chuẩn xác và có tầm nhìn dài hạn.
- One - Store không cần phải thử nghiệm các API trả phí bên ngoài mà tiếp tục tối ưu hóa sâu các binding nội bộ của Cloudflare (`c.env.AI`, `c.env.VECTORIZE`, `c.env.DB`, `c.env.IMAGES`).

### Bài học 2: Xác thực Kiến trúc Fast Local Pre-Router (0ms)
- Quyết định xóa bỏ TypeSafe JEV của StoreZ khẳng định rằng việc dùng một LLM nhỏ hoặc API phân loại bên thứ ba cho bước định tuyến chỉ làm tăng độ trễ và chi phí.
- One - Store sẽ áp dụng bộ lọc Regex cục bộ (0ms) chia 4 nhánh: Smalltalk, Store Info, Policy, và Catalog/Order đúng như bản kế hoạch v2.0 đã đề ra.

### Bài học 3: Tăng tốc triển khai SSE Streaming và Whisper Voice Input
- Hai tính năng mang lại sự khác biệt lớn nhất về trải nghiệm người dùng của StoreZ là SSE Streaming và Voice Whisper STT.
- One - Store cần ưu tiên triển khai ngay hai tính năng này trên nền tảng sẵn có của dự án.

### Bài học 4: Khẳng định Vị thế Tiên phong của Agentic In-Chat Ordering
- Khả năng hoàn tất đơn hàng tự trị COD trực tiếp trong chat của One - Store là tính năng vượt trội mà StoreZ chưa thể chạm tới.
- Cần tiếp tục hoàn thiện trải nghiệm này bằng cách bổ sung gợi ý mua kèm phụ kiện (Cross-selling) và chăm sóc tra cứu đơn hàng sau bán.

---

## 6. KẾT LUẬN

Sự dịch chuyển của StoreZ sang kiến trúc Cloudflare-Native đã thu hẹp khoảng cách về mặt hạ tầng giữa hai hệ sinh thái, đồng thời chứng minh tính ưu việt của mô hình AI biên không máy chủ (Edge Serverless AI).

Trong bối cảnh đó, hệ thống **One - Store** sở hữu nền tảng vững chắc với năng lực **Agentic In-Chat Ordering** độc quyền, cơ chế **Demo Sandbox** chuẩn mực, và thẩm mỹ **Zero-Emoji Song ngữ**. Khi hoàn tất lộ trình nâng cấp **SSE Streaming, Whisper Voice Input và Fast Local Pre-Router**, Trợ lý "Tư vấn One" sẽ đạt tới đỉnh cao về cả hiệu năng thời gian thực lẫn giá trị thương mại chuyển đổi.
