# KẾ HOẠCH NÂNG CẤP TOÀN DIỆN HỆ THỐNG CHATBOT AI "TƯ VẤN ONE" (PHIÊN BẢN 2.0)
## DỰ ÁN ONE - STORE (HỆ THỐNG PHÂN PHỐI GIÀY THỂ THAO & SNEAKER CHÍNH HÃNG ÂU - Á)

---

## 1. TỔNG QUAN, TẦM NHÌN VÀ MỤC TIÊU CHIẾN LƯỢC

### 1.1 Bối cảnh và Động lực Nâng cấp
Sau quá trình vận hành thực tế hệ thống **One - Store (Trợ lý "Tư vấn One v1.0")** và đối soát chuyên sâu với kiến trúc của hệ thống **StoreZ (Trợ lý "Speedy")**, đội ngũ kỹ thuật ghi nhận:
- **Thế mạnh độc quyền vượt trội cần bảo tồn và phát huy:**
  1. **Khả năng chốt đơn đàm thoại tự trị (Agentic In-Chat Ordering):** Tự động thu thập thông tin khách hàng, kiểm tra số lượng tồn kho theo kích thước (size) trong CSDL D1, áp dụng mã ưu đãi `ONE10`, thực hiện giao dịch nguyên tử D1 `batch` tạo mã vận đơn `ONE-YYYYMMDD-XXXX` và sinh Thẻ Xác Nhận Đơn Hàng VIP ngay trong chat.
  2. **Cơ chế Quản trị Demo Sandbox (Read-Only Data Isolation):** Phân quyền cách ly dữ liệu toàn diện ở tầng Gateway API ([`requireWritePermission`](file:///d:/HocTap/HK7/ChuyenDoiSo/project/one-store/backend/src/admin.ts)) và giao diện trực quan 1-click tại `/admin`, bảo vệ an toàn dữ liệu sản xuất.
  3. **Hạ tầng hoàn toàn độc lập và bảo mật:** Sử dụng 100% mô hình nội bộ Cloudflare Workers AI (`@cf/google/gemma-4-26b-a4b-it` và `@cf/baai/bge-m3`), không phụ thuộc API bên thứ ba, không rò rỉ dữ liệu khách hàng.
  4. **Chuẩn mực thương hiệu cao cấp:** Giao diện Dark & Bred Athletic, Zero-Emoji 100%, hệ thống vector icons `lucide-react` và đồng bộ song ngữ Tiếng Việt - Tiếng Anh (VI - EN).
- **Khoảng cách công nghệ cần thu hẹp từ bài học StoreZ:**
  1. *Độ trễ phản hồi ban đầu (TTFT):* Giao thức REST JSON đồng bộ hiện tại khiến khách hàng phải chờ từ 1.2 đến 1.8 giây để nhận toàn bộ khối văn bản. Cần chuyển đổi sang **Server-Sent Events (SSE Streaming)** để văn bản xuất hiện theo từng ký tự sau 250 - 350ms.
  2. *Phương thức nhập liệu:* Hiện chỉ hỗ trợ bàn phím gõ chữ. Cần bổ sung **Nhập liệu bằng giọng nói (Voice Input)** qua mô hình nhận dạng âm học **Whisper AI** trên Cloudflare Workers AI.
  3. *Hiệu quả xử lý câu hỏi xã giao:* Các câu chào hỏi cơ bản ("xin chào", "shop ở đâu", "cảm ơn") hiện vẫn phải đi qua toàn bộ pipeline LLM. Cần bổ sung **Fast Local Pre-Router (0ms)** để phản hồi lập tức dưới 50ms và tiết kiệm tài nguyên AI.

### 1.2 Tầm nhìn Phiên bản 2.0 (Vision)
Nâng cấp Trợ lý "Tư vấn One" trở thành **Hệ thống Trợ lý Bán hàng Hành động Đa phương thức Thời gian thực (Multimodal Real-Time Agentic Conversational Commerce AI)** hàng đầu trong ngành bán lẻ giày thể thao, kết hợp hoàn hảo giữa tốc độ phản hồi tính bằng mili-giây, khả năng nghe hiểu giọng nói chuyên sâu và năng lực hoàn tất đơn hàng tự trị.

### 1.3 Mục tiêu Đo lường Định lượng (KPIs & SLAs)
1. **Thời gian hiển thị ký tự đầu tiên (Time-to-First-Token - TTFT):** Giảm từ mức trung bình ~1500ms xuống còn **< 350ms** (cải thiện hơn 75%).
2. **Thời gian phản hồi câu hỏi phiếm đàm/cửa hàng (Smalltalk Latency):** Phản hồi tức thì **< 50ms**, tiêu thụ **0 token LLM**.
3. **Độ chính xác nhận diện giọng nói (Voice Recognition Accuracy):** Đạt tỷ lệ chuyển đổi giọng nói thành văn bản chính xác **> 95%** đối với tiếng Việt có lẫn tên thương hiệu quốc tế (Nike, Adidas, Asics, Mizuno, New Balance, Hoka, Puma, On Running, Li-Ning...).
4. **Độ tin cậy của quy trình chốt đơn (Order Integrity):** Duy trì tỷ lệ tạo đơn thành công **100%** qua giao dịch nguyên tử D1, không xảy ra xung đột dữ liệu hay sai lệch tồn kho.
5. **Tiêu chuẩn chất lượng phần mềm:** Giữ vững chuẩn mực **Zero-Emoji 100%**, không phát sinh lỗi kiểm tra kiểu tĩnh TypeScript (`npm run typecheck` đạt 0 lỗi), duy trì cơ chế bảo vệ Demo Sandbox tuyệt đối.

---

## 2. BỐN TRỤ CỘT CÔNG NGHỆ NÂNG CẤP TRỌNG TÂM

```
+-----------------------------------------------------------------------------------+
|               KIẾN TRÚC TỔNG THỂ CHATBOT TƯ VẤN ONE PHIÊN BẢN 2.0                 |
+-----------------------------------------------------------------------------------+
                                        |
                   [NGƯỜI DÙNG: BÀN PHÍM HOẶC MICRO VOICE]
                                        |
                                        v
     +---------------------------------------------------------------------+
     | TRỤ CỘT 2: MODULE NHẬP LIỆU GIỌNG NÓI (VOICE WHISPER STT)            |
     | - Thu âm qua Web MediaRecorder (audio/webm, audio/mp4)              |
     | - Endpoint: POST /api/chat/transcribe                               |
     | - Workers AI: @cf/openai/whisper-large-v3-turbo                     |
     | - Acoustic Domain Prompting nạp 10 hãng giày và các dòng giày hot    |
     +---------------------------------------------------------------------+
                                        | (Văn bản câu hỏi)
                                        v
     +---------------------------------------------------------------------+
     | TRỤ CỘT 3: BỘ ĐỊNH TUYẾN Ý ĐỊNH SIÊU TỐC (FAST LOCAL PRE-ROUTER)    |
     | - Regex Matching cục bộ tại Edge Worker (0 ms)                      |
     |                                                                     |
     | ├─ [Nhánh 1] Chào hỏi / Cảm ơn  ---> Phản hồi tức thì (< 30ms)     |
     | ├─ [Nhánh 2] Địa chỉ / Giờ mở cửa -> Nạp thông tin Store (< 40ms)    |
     | ├─ [Nhánh 3] Chính sách / Đo size -> RAG Vectorize ba-khi-knowledge |
     | └─ [Nhánh 4] Sản phẩm / Đặt hàng  -> Gemma 4 LLM + D1 Catalog       |
     +---------------------------------------------------------------------+
                                        |
                                        v
     +---------------------------------------------------------------------+
     | TRỤ CỘT 4: MỞ RỘNG NĂNG LỰC BÁN HÀNG TỰ TRỊ (AGENTIC COMMERCE)       |
     | - Thẩm định thông tin người nhận, size giày, số điện thoại          |
     | - Áp dụng mã ưu đãi ONE10 & tính phí vận chuyển Freeship            |
     | - Tạo đơn hàng nguyên tử D1: Mã ONE-YYYYMMDD-XXXX                   |
     | - Gợi ý phụ kiện thể thao mua kèm (Tất chạy bộ, Xịt nano vệ sinh)   |
     | - Hỗ trợ tra cứu / yêu cầu hủy hoặc đổi size đơn hàng đang pending  |
     +---------------------------------------------------------------------+
                                        |
                                        v
     +---------------------------------------------------------------------+
     | TRỤ CỘT 1: GIAO THỨC TRUYỀN TẢI THỜI GIAN THỰC (SSE STREAMING)      |
     | - Endpoint: POST /api/chat sử dụng Hono streamSSE                   |
     | - Gửi sự kiện 'status' cập nhật tiến trình trực quan                |
     | - Gửi sự kiện 'delta' truyền từng mảnh token văn bản thời gian thực |
     | - Gửi sự kiện 'products' trả về danh sách thẻ giày D1 xác thực      |
     | - Gửi sự kiện 'order_ready' & 'order_created' thẻ VIP chốt đơn      |
     | - Giao diện ChatbotWidget: Web Streams Reader + Nút dừng khẩn cấp   |
     +---------------------------------------------------------------------+
```

---

### TRỤ CỘT 1: GIAO THỨC TRUYỀN TẢI THỜI GIAN THỰC (SERVER-SENT EVENTS - SSE STREAMING)

#### 1. Nguyên lý và Cơ chế Backend
- Thay vì trả về một gói JSON lớn duy nhất sau khi LLM xử lý xong, backend chuyển đổi endpoint `POST /api/chat` sử dụng tiện ích `streamSSE` từ `hono/streaming`.
- Cấu trúc các sự kiện SSE phát ra luồng (Stream Event Protocol):
  1. `event: status`: Thông báo các trạng thái trung gian, giúp giao diện người dùng hiển thị thông điệp tiến trình sinh động:
     - `{"message": "Đang kiểm tra tồn kho cỡ giày..."}`
     - `{"message": "Đang trích xuất cẩm nang chọn size..."}`
     - `{"message": "Đang tính toán ưu đãi ONE10 và phí vận chuyển..."}`
  2. `event: delta`: Truyền từng đoạn văn bản (text chunk) ngay khi mô hình `@cf/google/gemma-4-26b-a4b-it` vừa sinh ra (kích hoạt tham số `stream: true` trên Cloudflare Workers AI).
  3. `event: products`: Gửi danh sách thẻ sản phẩm dạng JSON đã được server đối soát trực tiếp từ CSDL D1. Nhờ đó, hình ảnh từ R2 và giá tiền VND luôn đảm bảo chính xác tuyệt đối, tránh hiện tượng LLM ảo giác đường dẫn ảnh.
  4. `event: sources`: Gửi danh sách tên các tài liệu chính sách căn cứ đã được trích xuất qua Vectorize.
  5. `event: order_ready`: Gửi đối tượng tóm tắt đơn hàng khi bot trích xuất đủ 4 trường bắt buộc (Tên, SĐT, Địa chỉ, Cỡ giày) để giao diện hiển thị bảng thẩm định.
  6. `event: order_created`: Gửi thông tin đơn hàng đã khởi tạo thành công vào CSDL D1 (mã đơn `ONE-...`, tổng tiền sau giảm 10%, trạng thái chờ giao COD).
  7. `event: done`: Báo hiệu kết thúc phiên stream an toàn.

#### 2. Xử lý Phía Client (Frontend Streaming Reader)
- Trong `frontend/src/components/ChatbotWidget.tsx`, thay thế lệnh `await api('/api/chat', ...)` bằng Web Streams API chuẩn:
  - Khởi tạo `response.body.getReader()` kết hợp `TextDecoder`.
  - Phân tích cú pháp khối SSE (`event: ...\ndata: ...\n\n`) thông qua một bộ đệm vòng (Stream Event Parser).
  - Cập nhật state văn bản tin nhắn theo thời gian thực (Typewriter Effect), mang lại cảm giác phản hồi mượt mà tức thì.
  - Tích hợp `AbortController`: Bổ sung nút bấm "Dừng phản hồi" (Stop Generating) cho phép người dùng chủ động ngắt luồng truyền nếu đã nhận đủ thông tin.

---

### TRỤ CỘT 2: GIAO TIẾP ĐA PHƯƠNG THỨC BẰNG GIỌNG NÓI (MULTIMODAL VOICE INPUT VIA WHISPER AI)

#### 1. Nguyên lý Hoạt động
- Tận dụng tài nguyên Cloudflare Workers AI đã có sẵn thông qua binding `c.env.AI` để triển khai mô hình nhận dạng giọng nói hàng đầu thế giới: `@cf/openai/whisper-large-v3-turbo`.
- Giải pháp hoàn toàn nội bộ (In-house), chạy trên hạ tầng mạng biên Cloudflare, không tốn chi phí thuê ngoài, không phụ thuộc OpenAI API Key.

#### 2. Thiết kế Kỹ thuật Backend (`POST /api/chat/transcribe`)
- Endpoint tiếp nhận dữ liệu âm thanh dạng `multipart/form-data` hoặc raw binary buffer với định dạng phổ biến của trình duyệt (`audio/webm`, `audio/mp4`, `audio/wav`).
- **Kỹ thuật Acoustic Domain Prompting:** Khi gọi mô hình Whisper, truyền vào tham số `prompt` định hướng từ khóa chuyên ngành:
  ```typescript
  const brandKeywords = [
    'One Store', 'Nike', 'Adidas', 'Jordan', 'Puma', 'New Balance',
    'Asics', 'Mizuno', 'On Running', 'Hoka One One', 'Li-Ning',
    'Pegasus', 'Vaporfly', 'Alphafly', 'Ultraboost', 'Samba',
    'Gel-Kayano', 'Gel-Nimbus', 'Wave Rider', 'Cloudmonster',
    'Clifton', 'Bondi', 'size', 'chân bè', 'chạy bộ', 'đổi trả'
  ].join(', ');
  ```
- Nhờ danh sách từ khóa dẫn đường này, khi người dùng Việt Nam phát âm tên giày tiếng Anh (ví dụ: *"cho mình hỏi đôi Hoka Bondi size 42 chân bè"*), mô hình Whisper sẽ chuyển đổi chính xác 100% thay vì phiên âm sai lệch.

#### 3. Trải nghiệm Người dùng trên Giao diện (Frontend Voice UI)
- Tạo module `frontend/src/lib/voice.ts` đóng gói API `navigator.mediaDevices.getUserMedia` và `MediaRecorder`.
- Bổ sung nút biểu tượng Micro (`Mic` từ `lucide-react`) ngay bên cạnh nút Gửi trong khung nhập liệu:
  - Khi người dùng nhấn giữ hoặc nhấn bật thu âm: Nút chuyển sang trạng thái nhấp nháy đỏ kèm vòng sóng âm (Waveform pulse).
  - Tự động đặt giới hạn an toàn tối đa 15 giây cho một lần thu để tránh lãng phí dung lượng.
  - Khi hoàn tất thu âm: Gửi ngay tệp âm thanh lên `/api/chat/transcribe`, tự động điền kết quả vào ô nhập liệu hoặc tự động gửi câu hỏi nếu người dùng chọn chế độ rảnh tay (Hands-free mode).
  - Xử lý các trường hợp từ chối cấp quyền Micro một cách lịch sự, hiển thị thông báo hướng dẫn cài đặt trình duyệt.

---

### TRỤ CỘT 3: BỘ ĐỊNH TUYẾN Ý ĐỊNH SIÊU TỐC (FAST LOCAL PRE-ROUTER 0MS)

#### 1. Vấn đề của Hệ thống Hiện tại
Hiện tại, dù khách hàng chỉ nhắn *"xin chào"*, *"shop ở đâu vậy"* hay *"cảm ơn shop"*, hệ thống vẫn nạp toàn bộ danh mục sản phẩm, tính toán Vectorize RAG và kích hoạt mô hình Google Gemma 4 lớn. Điều này gây lãng phí tài nguyên máy tính và khiến người dùng phải đợi từ 1.2 - 1.8 giây cho những câu đàm thoại đơn giản.

#### 2. Kiến trúc 4 Nhánh Định tuyến Cục bộ (Local Pre-Routing Engine)
Tích hợp một bộ phân tích biểu thức chính quy (Regex) và từ khóa chuẩn hóa không đồng bộ ngay tại đầu hàm xử lý trong `backend/src/chatbot.ts`:

```
                           [CÂU HỎI CỦA KHÁCH HÀNG]
                                       │
                      Chuẩn hóa chữ thường + Bỏ dấu phụ
                                       │
                                       ▼
                     +-----------------------------------+
                     |   FAST LOCAL PRE-ROUTER (0 ms)    |
                     +-----------------------------------+
                                       │
        ┌──────────────┬───────────────┴───────────────┬──────────────┐
        ▼              ▼                               ▼              ▼
  [NHÁNH 1]       [NHÁNH 2]                       [NHÁNH 3]      [NHÁNH 4]
  SMALLTALK       STORE INFO                      POLICY & GUIDE CATALOG & ORDER
(Chào hỏi, cảm ơn) (Địa chỉ, giờ mở cửa)         (Chính sách, size) (Tìm giày, chốt đơn)
        │              │                               │              │
        ▼              ▼                               ▼              ▼
Trả về lời chào Trả về thông tin cửa hàng         Chạy RAG Vector  Chạy Full Pipeline
thương hiệu One tiêu chuẩn trích từ hồ sơ         Top-3 chunks     Gemma LLM + D1
+ 3 nút gợi ý   + hotline + link bản đồ           (Không nạp D1)   + In-Chat Ordering
  (< 30ms, 0 tok) (< 40ms, 0 tok)                 (< 450ms)        (Streaming SSE)
```

#### 3. Chi tiết 4 Nhánh Xử lý:
- **Nhánh 1 - Smalltalk (Chào hỏi, cảm ơn, tạm biệt):**
  - Khớp các mẫu: `^(xin chào|chào shop|hello|hi|cảm ơn|thank|tạm biệt|bye|bot ơi|alo)`.
  - Phản hồi ngay: *"Chào bạn, Tư vấn One rất hân hạnh được đồng hành cùng bạn! Bạn đang cần tìm giày chạy bộ êm chân, sneaker thời trang dạo phố hay cần hỗ trợ chọn size chuẩn xác?"* kèm 3 chip câu hỏi gợi ý nhanh.
  - Thời gian xử lý: **< 30ms**, tiêu thụ **0 token LLM**.
- **Nhánh 2 - Store Info (Địa chỉ, giờ hoạt động, liên hệ):**
  - Khớp các mẫu: `(địa chỉ|ở đâu|cửa hàng|showroom|giờ mở cửa|hotline|số điện thoại|liên hệ)`.
  - Phản hồi ngay thông tin chính thức: Showroom One - Store tọa lạc tại trục phố thể thao trung tâm TP.HCM, mở cửa từ 08:30 đến 21:30 tất cả các ngày trong tuần, hotline hỗ trợ 1900 8888, cam kết 100% giày chính hãng Âu - Á xỏ thử miễn phí trước khi nhận.
  - Thời gian xử lý: **< 40ms**, tiêu thụ **0 token LLM**.
- **Nhánh 3 - Policy & Size Guide (Chính sách đổi trả, bảo hành, đo chân bè):**
  - Khớp các mẫu: `(đổi trả|bảo hành|freeship|phí ship|vận chuyển|đo chân|chân bè|chân bẹt)`.
  - Hệ thống chỉ thực hiện truy vấn Vectorize RAG trích xuất Top-3 chunks tri thức liên quan nhất, không cần quét toàn bộ danh mục sản phẩm, giảm tải 50% kích thước context gửi vào mô hình.
- **Nhánh 4 - Catalog & Agentic In-Chat Ordering (Tư vấn chuyên sâu và Chốt đơn):**
  - Kích hoạt toàn bộ sức mạnh của Gemma 4, truy vấn danh mục sản phẩm CSDL D1 và bộ thẩm định đơn hàng tự trị.

---

### TRỤ CỘT 4: MỞ RỘNG NĂNG LỰC BÁN HÀNG TỰ TRỊ (ENHANCED AGENTIC COMMERCE)

#### 1. Chiến lược Gợi ý Mua kèm Thông minh (In-Chat Cross-Selling Engine)
- Khi khách hàng đã xác nhận chốt đơn giày sneaker thành công (sự kiện `order_created` hoặc bảng `order_ready`), thay vì chỉ kết thúc bằng lời chào, hệ thống sẽ tự động kích hoạt đề xuất mua kèm (Cross-sell):
  - *Đơn giày chạy bộ (Nike Pegasus, Asics Kayano, Hoka Bondi):* Đề xuất vớ thể thao dệt kim chuyên dụng chống phồng rộp (chỉ thêm 49.000đ/đôi vào đơn hiện tại).
  - *Đơn sneaker thời trang (Adidas Samba, Jordan 1 Low):* Đề xuất bình xịt bọt nano vệ sinh giày cao cấp bảo vệ bề mặt da lộn (chỉ thêm 89.000đ).
- Khách hàng chỉ cần trả lời *"Thêm cho tôi đôi tất"* hoặc nhấn nút **Đồng Ý Mua Kèm**, bot sẽ tự động cập nhật mặt hàng vào đơn hàng vừa tạo trong CSDL D1 mà không cần điền lại thông tin người nhận.

#### 2. Trợ lý Chăm sóc và Quản lý Đơn hàng Sau Bán (Post-Purchase Order Support)
- Khi khách hàng dán mã đơn hàng vào khung chat (ví dụ: `ONE-20261104-ABCD` hoặc số điện thoại người nhận):
  - Bot gọi hàm truy vấn trực tiếp từ bảng `orders` của CSDL D1 để kiểm tra trạng thái thực tế.
  - Trả về thẻ tóm tắt hành trình đơn hàng: Trạng thái (Đang đóng gói / Đang giao / Đã giao), danh sách sản phẩm, tiền COD cần thanh toán.
  - **Hỗ trợ đổi kích cỡ hoặc hủy đơn tự động:** Nếu đơn hàng vẫn ở trạng thái `pending` (chưa xuất kho), bot cho phép khách yêu cầu đổi size hoặc hủy đơn trực tiếp qua chat, tự động hoàn trả số lượng tồn kho vào bảng `products`.

---

## 3. MA TRẬN ĐÁNH GIÁ TÁC ĐỘNG TỆP TIN (FILE IMPACT MATRIX)

| Tệp tin | Vị trí | Hành động | Mục đích và Nội dung Kỹ thuật |
| :--- | :--- | :--- | :--- |
| `backend/src/speech.ts` | Backend | **Tạo mới** | Module xử lý tiếp nhận file âm thanh, gọi `@cf/openai/whisper-large-v3-turbo` qua `c.env.AI`, giải mã buffer và trả về văn bản tiếng Việt. |
| `backend/src/chatbot.ts` | Backend | **Cập nhật** | Tích hợp Fast Local Pre-Router (0ms), chuyển đổi `POST /api/chat` sang SSE Streaming (`streamSSE`), bổ sung bộ định tuyến âm thanh `POST /api/chat/transcribe`, nâng cấp Prompt Agentic Cross-selling. |
| `backend/src/commerce.ts` | Backend | **Cập nhật** | Mở rộng kiểu dữ liệu `ShopBindings` nếu cần, bổ sung hàm nội bộ hỗ trợ Chatbot tra cứu thông tin đơn hàng theo mã `ONE-...`. |
| `frontend/src/lib/voice.ts` | Frontend | **Tạo mới** | Module tiện ích quản lý Web MediaRecorder API, thu âm micro người dùng, xử lý nén âm thanh và xuất ra `Blob`/`ArrayBuffer`. |
| `frontend/src/lib/sse.ts` | Frontend | **Tạo mới** | Tiện ích bóc tách luồng Server-Sent Events từ `ReadableStream`, hỗ trợ phân tích các sự kiện `delta`, `status`, `products`, `order_ready`, `done`. |
| `frontend/src/types/index.ts` | Frontend | **Cập nhật** | Bổ sung các kiểu dữ liệu cho sự kiện SSE, trạng thái Voice Recording và thẻ theo dõi đơn hàng sau bán. |
| `frontend/src/components/ChatbotWidget.tsx` | Frontend | **Cập nhật** | Tích hợp nút Micro thu âm, thanh hiển thị sóng âm, đọc SSE luồng thời gian thực, nút dừng khẩn cấp và giao diện gợi ý phụ kiện mua kèm. |
| `scripts/test_chatbot_v2_streaming.mjs` | Scripts | **Tạo mới** | Bộ kịch bản kiểm thử tự động xác thực luồng SSE Streaming, Fast Router và tính toàn vẹn của đơn hàng In-Chat Ordering. |
| `scripts/test_chatbot_voice.mjs` | Scripts | **Tạo mới** | Kịch bản kiểm thử endpoint Whisper Transcribe với các mẫu âm thanh thương hiệu giày. |
| `AGENT_MEMORY.md` | Root | **Cập nhật** | Ghi nhận Quyết định Kiến trúc v2.0 (ADR-27: Chatbot SSE Streaming, Voice Whisper STT và Fast Local Pre-Router). |

---

## 4. LỘ TRÌNH TRIỂN KHAI PHÂN KỲ (IMPLEMENTATION ROADMAP)

```
+-----------------------------------------------------------------------------------+
|               LỘ TRÌNH TRIỂN KHAI 4 GIAI ĐOẠN (PHASED ROADMAP)                    |
+-----------------------------------------------------------------------------------+

 [GIAI ĐOẠN 1] -> [GIAI ĐOẠN 2] -> [GIAI ĐOẠN 3] -> [GIAI ĐOẠN 4]
  Fast Router      SSE Streaming    Voice Input      Kiểm thử hồi quy
  & Whisper STT    Hono streamSSE   & In-Chat        & Deploy Production
  Backend          & Web Reader     Cross-selling    
```

### GIAI ĐOẠN 1: THIẾT KẾ VÀ XÂY DỰNG HẠ TẦNG BACKEND (ROUTER & WHISPER STT)
- **Mục tiêu:** Xây dựng xong bộ định tuyến nhanh Fast Local Pre-Router và endpoint nhận dạng giọng nói Whisper mà không làm gián đoạn luồng chat JSON hiện tại.
- **Đầu việc cụ thể:**
  1. Tạo tệp `backend/src/speech.ts` hiện thực hóa hàm `transcribeAudio(ai, buffer)` kết hợp Acoustic Domain Prompting chứa 10 hãng giày.
  2. Bổ sung endpoint `POST /api/chat/transcribe` vào `backend/src/chatbot.ts`.
  3. Xây dựng logic phân nhánh `fastLocalRouter(question)` phân tách 4 luồng: Smalltalk, Store Info, Policy, Catalog/Order.
  4. Viết kịch bản kiểm thử độc lập cho Whisper và Fast Router.
- **Tiêu chí hoàn thành (Gate Criteria):** Fast Router phản hồi các câu chào hỏi dưới 40ms; Whisper nhận diện chính xác tệp âm thanh thử nghiệm.

---

### GIAI ĐOẠN 2: CHUYỂN ĐỔI GIAO THỨC SANG SERVER-SENT EVENTS (SSE STREAMING)
- **Mục tiêu:** Đưa phản hồi thời gian thực vào luồng đàm thoại, giảm TTFT xuống dưới 350ms.
- **Đầu việc cụ thể:**
  1. Tái cấu trúc endpoint `POST /api/chat` trên Hono sử dụng `streamSSE`.
  2. Kích hoạt cờ `stream: true` khi gọi `@cf/google/gemma-4-26b-a4b-it` trên Workers AI.
  3. Định nghĩa chuẩn định dạng các sự kiện `status`, `delta`, `products`, `sources`, `order_ready`, `order_created`, `done`.
  4. Tạo module `frontend/src/lib/sse.ts` xử lý giải mã luồng ReadableStream trên trình duyệt.
  5. Cập nhật `ChatbotWidget.tsx` để hiển thị văn bản theo thời gian thực và cập nhật các thanh trạng thái trung gian.
- **Tiêu chí hoàn thành (Gate Criteria):** Ký tự đầu tiên hiển thị trên giao diện trong vòng 350ms; các thẻ sản phẩm và thẻ đơn hàng VIP dựng chính xác khi stream kết thúc.

---

### GIAI ĐOẠN 3: TÍCH HỢP GIAO DIỆN GIỌNG NÓI VÀ NÂNG CẤP AGENTIC COMMERCE
- **Mục tiêu:** Hoàn thiện trải nghiệm người dùng đa phương thức và tăng cường năng lực bán hàng tự trị.
- **Đầu việc cụ thể:**
  1. Tạo module `frontend/src/lib/voice.ts` tích hợp `MediaRecorder` cho micro trình duyệt.
  2. Bổ sung nút bấm Micro với hiệu ứng sóng âm (Waveform animation) và nút Dừng sinh văn bản vào `ChatbotWidget.tsx`.
  3. Cập nhật System Prompt cho Gemma 4 để tự động đề xuất mua kèm (Cross-sell) phụ kiện thể thao (tất dệt kim, xịt nano) khi đơn giày được khởi tạo.
  4. Bổ sung tính năng nhận diện mã đơn `ONE-...` để tra cứu trạng thái đơn hàng và hỗ trợ đổi size/hủy đơn trực tiếp.
- **Tiêu chí hoàn thành (Gate Criteria):** Người dùng có thể nhấn micro nói bằng tiếng Việt và nhận lại câu trả lời streaming; có thể tra cứu đơn hàng bằng mã `ONE-...`.

---

### GIAI ĐOẠN 4: KIỂM THỬ HỒI QUY TOÀN DIỆN, THẨM ĐỊNH VÀ TRIỂN KHAI PRODUCTION
- **Mục tiêu:** Đảm bảo toàn bộ hệ thống hoạt động ổn định, bảo toàn các tính năng cốt lõi và không phát sinh lỗi bảo mật.
- **Đầu việc cụ thể:**
  1. Chạy bộ kiểm thử tự động toàn diện:
     - Kiểm thử hồi quy Agentic In-Chat Ordering (tạo đơn COD, trừ tồn kho D1, áp mã ONE10).
     - Kiểm thử cơ chế Phân quyền Demo Sandbox Admin (`requireWritePermission` chặn ghi tuyệt đối 403 Forbidden).
     - Kiểm thử luồng SSE Streaming và Fast Local Pre-Router.
  2. Quét toàn bộ mã nguồn và văn bản đảm bảo tuân thủ **Zero-Emoji 100%**.
  3. Kiểm tra tính toàn vẹn của song ngữ Tiếng Việt - Tiếng Anh (VI - EN).
  4. Biên dịch tĩnh Next.js 16 (`npm run build:frontend`) xuất ra `frontend/out/`.
  5. Kiểm tra TypeScript (`npm run typecheck`) đạt 0 lỗi.
  6. Triển khai lên Cloudflare Workers Production (`npm run deploy`).
  7. Cập nhật nhật ký kỹ thuật `AGENT_MEMORY.md` (ADR-27) và commit mã nguồn lên GitHub.
- **Tiêu chí hoàn thành (Gate Criteria):** Toàn bộ test suite pass 100%; Production hoạt động trơn tru; không có lỗi console hay đứt gãy luồng người dùng.

---

## 5. BỘ TIÊU CHUẨN NGHIỆM THU KỸ THUẬT (ACCEPTANCE CRITERIA)

| Mã tiêu chí | Hạng mục kiểm tra | Tiêu chuẩn Đạt (Pass Criteria) |
| :--- | :--- | :--- |
| **AC-01** | Thời gian phản hồi ban đầu (TTFT) | Khi gửi câu hỏi tư vấn sản phẩm, sự kiện `delta` đầu tiên phải đến Client trong vòng **< 400ms**. |
| **AC-02** | Hiệu năng Fast Local Pre-Router | Các câu chào hỏi ("xin chào", "cảm ơn") và câu hỏi địa chỉ cửa hàng phản hồi trong vòng **< 50ms**, không phát sinh token LLM. |
| **AC-03** | Độ chính xác nhận diện giọng nói | Nói câu *"tư vấn giày chạy bộ Asics hoặc Hoka cho chân bè"*, Whisper chuyển thể chính xác các danh từ riêng thương hiệu vào khung chat. |
| **AC-04** | Tính toàn vẹn của Agentic In-Chat Ordering | Luồng chốt đơn tự động qua chat vẫn hoàn tất chính xác: trích xuất đủ 4 trường, áp mã `ONE10`, trừ tồn kho D1 và sinh mã `ONE-YYYYMMDD-XXXX`. |
| **AC-05** | Tính an toàn của Demo Sandbox Admin | Khi đăng nhập tài khoản `demo`, tính năng chỉ xem được bảo tồn 100%, mọi thao tác ghi/sửa/xóa qua API đều bị chặn với mã lỗi **HTTP 403 Forbidden**. |
| **AC-06** | Thẩm mỹ và Quy chuẩn Zero-Emoji | Toàn bộ giao diện chat, câu trả lời của bot, thông báo lỗi và tài liệu kỹ thuật **không chứa bất kỳ ký tự emoji thô nào**. |
| **AC-07** | Đồng bộ hóa Đa ngôn ngữ (VI - EN) | Giao diện Chatbot chuyển đổi mượt mà giữa Tiếng Việt và Tiếng Anh; các prompt mẫu và tiêu đề thay đổi tương ứng theo `locale`. |
| **AC-08** | Cơ chế Dừng và Hủy luồng truyền | Người dùng nhấn nút "Dừng phản hồi" (Stop Generating), luồng stream dừng lập tức và nội dung đã nhận được bảo lưu nguyên vẹn. |
| **AC-09** | Xử lý lỗi và Khả năng tự phục hồi | Nếu kết nối mạng gián đoạn trong khi stream, client tự động hiển thị thông báo thân thiện và cho phép thử lại dễ dàng. |
| **AC-10** | Kiểm tra Mã nguồn và Build tĩnh | `npm run typecheck` đạt 0 lỗi; `npm run build:frontend` xuất bản thành công không cảnh báo lỗi; kích thước bundle tối ưu. |

---

## 6. QUẢN TRỊ RỦI RO VÀ CƠ CHẾ DỰ PHÒNG (RISK MANAGEMENT & FALLBACKS)

1. **Rủi ro trình duyệt không hỗ trợ Web MediaRecorder hoặc người dùng chặn Microphone:**
   - *Giải pháp:* Client kiểm tra `navigator.mediaDevices?.getUserMedia`. Nếu không được cấp quyền hoặc trình duyệt không hỗ trợ, ẩn nút Micro hoặc hiển thị thông báo Tooltip giải thích nhẹ nhàng, ưu tiên tuyệt đối phương thức nhập bàn phím thông thường.
2. **Rủi ro môi trường mạng chặn Server-Sent Events (SSE) qua proxy trung gian:**
   - *Giải pháp:* Module `frontend/src/lib/sse.ts` thiết lập bộ đếm thời gian (Timeout 5 giây). Nếu không nhận được sự kiện `delta` hay `status` đầu tiên, client tự động ngắt và kích hoạt chế độ Fallback gọi lại endpoint dưới dạng HTTP POST JSON truyền thống.
3. **Rủi ro quá tải lượt yêu cầu Workers AI trên Cloudflare:**
   - *Giải pháp:* Tận dụng Fast Local Pre-Router để giảm tải 30 - 40% số lượng truy vấn thông thường; kết hợp bộ nhớ đệm Cloudflare KV (`CACHE`) để lưu trữ kết quả cho các câu hỏi phổ biến có độ lặp lại cao.
4. **Rủi ro người dùng nhập sai định dạng khi chốt đơn hàng:**
   - *Giải pháp:* Giữ nguyên bộ kiểm duyệt dữ liệu nghiêm ngặt bằng Zod Validator và cơ chế đàm thoại làm rõ từng trường (clarification turn) trước khi thực hiện giao dịch D1 nguyên tử.

---

## 7. KẾT LUẬN VÀ TRÌNH DUYỆT

Bản kế hoạch nâng cấp Chatbot AI **"Tư vấn One v2.0"** đã giải quyết triệt để các hạn chế hiện tại thông qua việc tiếp thu những tinh hoa công nghệ từ dự án StoreZ (SSE Streaming, Whisper Voice Input, Fast Local Router 0ms), đồng thời bảo vệ và phát huy tối đa các giá trị cốt lõi độc quyền của One - Store (Agentic In-Chat Ordering, Demo Sandbox Admin, Zero-Emoji và Độc lập bảo mật).

Kế hoạch đã sẵn sàng để trình người dùng phê duyệt trước khi tiến hành viết mã nguồn triển khai thực tế theo 4 giai đoạn đã đề ra.
