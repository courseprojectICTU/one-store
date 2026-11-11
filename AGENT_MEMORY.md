# AGENT MEMORY & PROJECT CONTEXT — ONE - STORE (ONE)

> **File:** `AGENT_MEMORY.md`  
> **Phiên làm việc:** 2026-10-31 đến 2026-11-02  
> **Dự án:** One - Store (Tên ngắn: One)  
> **Cơ sở mã nguồn:** `d:\HocTap\HK7\ChuyenDoiSo\project\nhom-2-ba-khi-shop`  
> **Mục đích:** Lưu trữ toàn bộ bối cảnh, các quyết định kiến trúc (ADR), lịch sử thay đổi mã nguồn và quy chuẩn vận hành phục vụ các lượt agent làm việc tiếp theo.

---

## 1. TỔNG QUAN HÀNH TRÌNH NÂNG CẤP TRONG PHIÊN LÀM VIỆC

Dự án đã trải qua hành trình nâng cấp toàn diện qua 27 cột mốc chuyển đổi kiến trúc và trải nghiệm người dùng:

```
[Bắt đầu] Cài đặt & chạy local -> Phân tích công nghệ
   │
   ▼
[Giai đoạn 1-5] Tách Monorepo -> Next.js 16 Static Export -> Rebranding One-Store -> Hồ sơ Sneaker Âu-Á -> Logo Vector
   │
   ▼
[Giai đoạn 6-10] Seed 12 Sneaker D1 -> Hệ thống hằng số chuỗi -> Zero-Emoji (lucide-react) -> Bố cục Thẻ Nổi -> Typography Outfit
   │
   ▼
[Giai đoạn 11-15] Tách trang /products -> Khắc phục RSC txt 404 -> Navigation Links -> Cào 70 mẫu Sneaker R2 & Vectorize AI -> Khắc phục Chunk Cache 500
   │
   ▼
[Giai đoạn 16-20] Chuẩn hóa 100% Ảnh Sneaker Studio -> Guest-First & Cookie Storage -> Banner Bred Aesthetic -> Model 3D Three.js Jordan 1 -> Top 4 Bestsellers
   │
   ▼
[Giai đoạn 21-23] Tách trang riêng /orders -> Cải tiến chính sách Freeship từ 3 đôi -> Tối ưu Zod Schema chống lỗi 400 Bad Request
   │
   ▼
[Giai đoạn 24-27] Tối ưu Cookie Consent & Thanh thông báo -> Đồng bộ 100% Song ngữ 1-1 VI-EN -> Dịch 115 màu sắc & 70 mô tả sản phẩm -> Hoàn thiện /orders Breadcrumb
```

---

## 2. CÁC QUYẾT ĐỊNH KIẾN TRÚC QUAN TRỌNG (ADR)

### ADR-01: Tách cấu trúc Monorepo `backend/` và `frontend/`
- **Bối cảnh ban đầu:** Toàn bộ mã nguồn nằm lẫn lộn ở thư mục gốc (các file backend `.ts`, frontend `.html`, `.js`, file migration D1 nằm xen kẽ).
- **Quyết định:** Tách dự án thành 2 phân hệ rõ ràng:
  - `backend/`: Chứa mã nguồn Cloudflare Worker Hono API (`src/index.ts`, `src/commerce.ts`, `src/chatbot.ts`) và thư mục migrations D1 (`migrations/`).
  - `frontend/`: Toàn bộ giao diện người dùng và ứng dụng web phía client.
  - Root: Giữ file điều phối cấu hình chung (`package.json`, `wrangler.toml`, `tsconfig.json`, `.dev.vars`).

### ADR-02: Nâng cấp Frontend sang Next.js App Router (Static Export)
- **Bối cảnh:** Frontend ban đầu viết bằng HTML/CSS/JS thuần (Core). Yêu cầu chuyển sang Next.js hiện đại nhưng vẫn phục vụ qua Cloudflare Worker Edge.
- **Quyết định:**
  - Khởi tạo Next.js 16 trong thư mục `frontend/` với TypeScript, App Router và Turbopack.
  - Cấu hình `output: "export"` trong `frontend/next.config.ts` để xuất file tĩnh ra thư mục `frontend/out/`.
  - Cloudflare Worker tại backend phục vụ trực tiếp thư mục `frontend/out/` thông qua cấu hình `assets = { directory = "./frontend/out", binding = "ASSETS" }` trong `wrangler.toml`.
  - Tách các components React có tính tái sử dụng cao (`Header`, `Hero`, `ProductSection`, `ProductCard`, `StoryBanner`, `Footer`, `CartDrawer`, `TrackingModal`, `ChatbotWidget`, `AdminDashboard`).
  - Quản lý trạng thái thông qua `ShopContext` (`React.createContext`), đồng bộ với `localStorage` và `sessionStorage`.

### ADR-03: Rebranding Thương hiệu sang One - Store (One)
- **Yêu cầu:** Đổi tên project thành `one-store`, tên thương hiệu thành `One - Store`, tên ngắn gọn là `One`.
- **Triển khai:**
  - **Tên project (`one-store`)**: Cập nhật trong `package.json`, `frontend/package.json`, `wrangler.toml`, health check API `/api/health` (`service: "one-store"`).
  - **Tên thương hiệu (`One - Store`)**: Cập nhật logo navbar, footer, copyright (`© 2026 One - Store`), metadata title (`One - Store | Giày Thể Thao & Sneaker Chính Hãng`), tiêu đề Admin dashboard, chatbot system prompt.
  - **Tên ngắn gọn (`One`)**: Tên trợ lý chatbot `Tư vấn One`, tiêu đề banner `PHONG CÁCH ONE`, tiền tố mã đơn hàng `ONE-` (VD: `ONE-XXXXXX`), voucher mẫu `ONE10`.
  - **Tương thích ngược (Backward Compatibility)**: Đổi key `localStorage` sang `one-store:cart:v1` kèm fallback đọc `one-fashion:cart:v1`, `sessionStorage` sang `one:member-token:v1`.
  - **Lưu ý Cloudflare Resources:** Các tài nguyên đám mây đã cấp phát trên Cloudflare (D1 `fashion_db`, R2 bucket `one-store-images`, Vectorize index `ba-khi-knowledge`) được giữ nguyên tên định danh đám mây trong `wrangler.toml`.

### ADR-04: Thiết lập Store Giày Thể Thao Âu - Á & RAG Knowledge Base
- **Bối cảnh:** Xây dựng hồ sơ thông tin ngắn gọn về cửa hàng giày thể thao chính hãng phân phối các thương hiệu Âu - Á nổi tiếng.
- **Tài liệu:** Tạo [STORE_PROFILE.md](file:///d:/HocTap/HK7/ChuyenDoiSo/project/nhom-2-ba-khi-shop/STORE_PROFILE.md).
- **Thương hiệu Âu - Mỹ:** Nike (Mỹ), Adidas (Đức), New Balance (Mỹ), Puma (Đức), Salomon (Pháp).
- **Thương hiệu Châu Á:** Asics (Nhật Bản), Onitsuka Tiger (Nhật Bản), Mizuno (Nhật Bản), Li-Ning (Trung Quốc), Anta (Trung Quốc).
- **RAG Integration:** Nội dung này đã được nhập và vector hóa trực tiếp vào bảng `chat_documents`, `chat_chunks` và Vectorize index để AI Chatbot `Tư vấn One` có tri thức trả lời người dùng.

### ADR-05: Hệ thống Nhận diện Logo Thương hiệu One - Store (One)
- **Ý tưởng thiết kế:**
  - Biểu tượng hội tụ số **"1"** cách điệu vươn mình thể hiện sự dẫn đầu và tính duy nhất ("One"), kết hợp cùng đường cong động học mô phỏng đế giày thể thao / cánh gió gia tốc (aerodynamic wave & rocker sole).
  - Tích hợp nét vát màu đỏ năng động (#e11d48) trên nền than chì trầm (#0a0a0a).
- **Tài nguyên phát triển:**
  - Component React: `frontend/src/components/Logo.tsx` hỗ trợ 3 biến thể (`full`, `icon`, `stacked`) và 4 kích thước (`sm`, `md`, `lg`, `xl`), tối ưu hiển thị responsive.
  - Tệp đồ họa Vector chuẩn: `frontend/public/logo.svg`, `frontend/public/logo-icon.svg`, `frontend/public/favicon.svg`.
  - Đồng bộ trên toàn bộ UI: Header navbar, Footer, Admin Dashboard, Chatbot Tư vấn One và metadata icon trong `layout.tsx`.

### ADR-06: Quy trình Mua hàng 1 Bước (Frictionless Guest Checkout & Chọn Size Nhanh)
- **Bối cảnh:** Nâng cấp trải nghiệm mua sắm sneaker trực tuyến, giảm tối đa rào cản đặt hàng, không bắt buộc đăng nhập tài khoản.
- **Quyết định & Tính năng cốt lõi:**
  1. **Chọn Size Nhanh & Mua Ngay trên Card (`ProductCard.tsx`)**: Cho phép bấm chọn trực tiếp size giày (39 - 44) ngay trên thẻ. Cặp nút: **"MUA NGAY"** (mở thẳng form thanh toán 1 bước) + **"+ Giỏ hàng"**.
  2. **Thanh toán 1 bước tức thì trong Drawer (`CartDrawer.tsx`)**: 100% Guest Checkout (Không cần tài khoản/mật khẩu). Hỗ trợ COD và Chuyển khoản QR; tự động ghi nhớ thông tin khách qua `localStorage` (`one:guest-info:v1`).
  3. **Thanh tiến trình Miễn phí vận chuyển (Freeship Bar)**: Mốc 499.000đ hiển thị % động và số tiền còn thiếu.
  4. **Bảng quy đổi Size giày chuẩn Âu - Á (`SizeGuideModal.tsx`)**: Đối chiếu EUR, US, UK, CM kèm mẹo chọn size cho chân bè Á Đông vs chân thon Âu - Mỹ.
  5. **Bộ lọc thương hiệu & Size giày chuyên sâu (`ProductSection.tsx`)**.
  6. **Thanh Bottom Bar cố định trên Mobile (`StickyMobileBar.tsx`)**.

### ADR-07: Xóa sạch Dữ liệu Thời trang Cũ & Mở rộng 12 Mẫu Sneaker Âu - Á
- **Bối cảnh:** Loại bỏ toàn bộ từ khóa quần áo, váy, đầm cũ; chuyển 100% sang phân phối sneaker thể thao.
- **Triển khai:**
  - Chạy migration `0005_clean_apparel_and_expand_sneakers.sql`: Xóa sạch các bản ghi thời trang cũ trong bảng `products` và `order_items`.
  - Nạp 12 mẫu sneaker kinh điển: Nike Dunk Low Panda, Nike Pegasus 40, Adidas Samba OG, Asics Gel-Nimbus 26, Asics Gel-Kayano 30, New Balance 550, Salomon XT-6, Li-Ning Feidian 3.0, Onitsuka Tiger Mexico 66, Mizuno Wave Rider 27, Puma Palermo, Anta KT8.
  - Phân loại rõ rệt theo 4 phân khúc: `Running`, `Lifestyle`, `Outdoor`, `Basketball`.

### ADR-08: Hệ thống Hằng số Chuỗi (strings.ts) & Việt Hóa Thuần Túy 100%
- **Bối cảnh:** Tách rời toàn bộ text hiển thị khỏi JSX để dễ bảo trì và chuẩn bị cho đa ngôn ngữ (Việt - Anh). Khi chọn Tiếng Việt, giao diện phải thuần Việt 100%, không pha trộn từ mượn ngoại lai.
- **Triển khai:**
  - Tạo Single Source of Truth cho chuỗi văn bản tại [frontend/src/constants/strings.ts](file:///d:/HocTap/HK7/ChuyenDoiSo/project/nhom-2-ba-khi-shop/frontend/src/constants/strings.ts).
  - Việt hóa hoàn toàn các thuật ngữ: `Running` -> `Chạy bộ`, `Lifestyle` -> `Thời trang`, `Outdoor` -> `Dã ngoại`, `Basketball` -> `Bóng rổ`, `Freeship` -> `Miễn phí giao hàng`, `Voucher` -> `Mã giảm giá`, `Size` -> `Cỡ giày`.
  - Type-safe dictionary qua `Dictionary` interface, đảm bảo song ngữ đồng bộ.

### ADR-09: Quy chuẩn Zero-Emoji & Chuẩn hóa 100% Icon bằng `lucide-react`
- **Bối cảnh:** Loại bỏ triệt để các emoji và ký tự unicode nhúng trực tiếp trong text, log, comment hoặc JSX (ví dụ: `👟`, `🛡️`, `📦`, `★`, `✓`).
- **Triển khai:**
  - 100% biểu tượng trực quan được thay thế bằng các component icon SVG chuẩn từ thư viện `lucide-react` (`ShieldCheck`, `Ruler`, `PackageCheck`, `Search`, `ShoppingBag`, `ArrowUpRight`, `RotateCcw`, `Check`, `Flame`, v.v.).
  - Cung cấp đầy đủ thuộc tính trợ năng (`aria-hidden` hoặc `aria-label`).

### ADR-10: Khắc phục Sự cố Backend & Tối ưu AI Gemma 4
- **D1 Migrations:** Áp dụng đầy đủ các bản migration còn thiếu và tạo `0006_seed_vouchers.sql` nạp mã `ONE10` (-10%) và `ONE50` (-50k).
- **Order Lookup:** Cập nhật regex chấp nhận tiền tố `ONE-`, `VL-`, `BK-` với độ dài 6-12 ký tự, cho phép tra cứu linh hoạt.
- **Workers AI Gemma 4:** Nâng `max_tokens` lên 1200, xử lý cơ chế suy nghĩ (`reasoning_content`) để tránh lỗi content rỗng.

### ADR-11: Bố cục Thẻ Nổi (Floating Cards) & Theme Tokens Thể Thao
- **Theme Tokens (`frontend/src/constants/theme.ts`):** Tạo SSOT quản lý `COLORS`, `SHADOWS`, `RADII`, `FONTS`.
- **Bảng màu thể thao năng động:**
  - Trắng tinh khôi (`#ffffff`): Nền thẻ nổi, nền trang.
  - Đỏ thể thao (`#e11d48`): Điểm nhấn CTA (Mua ngay, huy hiệu, tag giảm giá, icon active).
  - Đen tuyền (`#0a0a0a`): Tiêu đề, nút bấm phụ, chân trang sang trọng.
  - Xám trung tính (`#f8fafc`, `#f1f5f9`, `#e2e8f0`, `#64748b`): Nền studio sản phẩm, viền thẻ nổi mềm mại.
- **Bố cục Thẻ Nổi (Floating Elevated Cards):** Mọi khối nội dung (`Hero`, `Perks`, `Filter Hub`, `Product Cards`, `Story Banner`, `Admin Panel`) đều là thẻ nổi nền trắng viền mảnh kèm hiệu ứng hover nâng thẻ nhẹ nhàng.

### ADR-12: Tối ưu Tỷ lệ Hình học Chữ (Typography Ratio Enhancement)
- **Bối cảnh:** Font tiêu đề cũ (`Syne`) có nét chữ bành ngang (extended), kết hợp `line-height: 1.08` quá thấp và `letter-spacing: -0.04em` quá hẹp khiến chữ tiếng Việt bị "phình ngang và ngắn dọc", dấu thanh bị co ép.
- **Triển khai:**
  - Chuyển đổi font tiêu đề sang **`Outfit`** (weights 500–900), đồng bộ với **`Plus Jakarta Sans`** cho thân bài.
  - Cân bằng `line-height` cho tiêu đề ở mức **`1.22 – 1.25`** và tên sản phẩm ở mức **`1.42`**.
  - Nới lỏng `letter-spacing` về **`-0.01em`** (hoặc `0`), nhãn uppercase về `0.06em – 0.08em`.
  - Kết quả: Dáng chữ đứng thanh thoát, khỏe khoắn, dấu tiếng Việt hiển thị tự nhiên và cân đối.

### ADR-13: Cơ chế Hot-Reloading Asset Manifest cho Cloudflare Wrangler
- **Bối cảnh:** Khi chạy `wrangler dev` nền, nếu Next.js build tạo ra các hash chunk tĩnh mới (`.css`, `.js`), Wrangler không tự reload manifest in-memory dẫn đến trả về `404 Not Found` trên các tệp tĩnh.
- **Khắc phục:** Tích hợp lệnh cập nhật timestamp của [backend/src/index.ts](file:///d:/HocTap/HK7/ChuyenDoiSo/project/nhom-2-ba-khi-shop/backend/src/index.ts) vào cuối lệnh `npm run build:frontend` trong [package.json](file:///d:/HocTap/HK7/ChuyenDoiSo/project/nhom-2-ba-khi-shop/package.json#L9). Khi build xong, Wrangler tự động làm mới manifest và phục vụ 100% static chunks với mã `200 OK`.

### ADR-14: Thiết lập Bộ Quy chuẩn Lập trình & Clean Code Bắt buộc (`CODE_CONVENTIONS.md`)
- **Tài liệu:** Tạo [CODE_CONVENTIONS.md](file:///d:/HocTap/HK7/ChuyenDoiSo/project/nhom-2-ba-khi-shop/CODE_CONVENTIONS.md) tại thư mục gốc và liên kết trong [AGENTS.md](file:///d:/HocTap/HK7/ChuyenDoiSo/project/nhom-2-ba-khi-shop/AGENTS.md#L6-L7).
- **Phạm vi:** Định nghĩa 5 nguyên tắc cốt lõi (SSOT, Zero-Emoji, No Hardcoded Strings, Type Safety, Frictionless UX), tiêu chuẩn backend (Anti-SQL Injection qua parameterized queries, Zod validations, KV invalidation), tiêu chuẩn frontend (tokens, typography, floating cards) và checklist nghiệm thu trước khi bàn giao.

### ADR-15: Phân tách Độc lập Trang Chủ (`/`) và Trang Sản Phẩm (`/products`)
- **Bối cảnh:** Trang bán hàng trước đây tích hợp lẫn lộn tính năng của cả trang chủ (banner to Hero chiếm toàn màn hình) và trang sản phẩm (danh sách lọc sản phẩm) trên cùng một route `/`. Cần tách thành 2 trang chuyên biệt với mục đích rõ ràng.
- **Quyết định & Triển khai:**
  1. **Tạo Trang sản phẩm chuyên biệt (`/products`)**:
     - **Loại bỏ banner to (`Hero.tsx`)**: Không dùng banner lớn chiếm chỗ ở trang này để người mua tập trung vào sản phẩm.
     - **Đưa banner nhỏ (`StoryBanner.tsx`) lên đầu trang sản phẩm**: Đặt ngay dưới Header, tạo điểm nhấn thương hiệu tinh tế trước khi xem danh mục.
     - Phía dưới banner nhỏ là khu vực mua sắm `ProductSection` (bộ lọc thương hiệu Âu - Á, lọc cỡ giày, tìm kiếm, lưới sản phẩm). Đã loại bỏ 4 thẻ cam kết Perks theo yêu cầu người dùng.
     - Phía cuối trang sản phẩm hoàn toàn không còn banner nhỏ bị lặp lại.
  2. **Trang chủ (`/`)**:
     - Đóng vai trò Landing Page chào sân với Hero Banner to (`Hero.tsx`) và thanh cam kết (`Perks.tsx`). Nút CTA *"KHÁM PHÁ BỘ SƯU TẬP GIÀY"* dẫn thẳng sang trang sản phẩm `/products`. Sẵn sàng cho giai đoạn phân tích thiết kế chi tiết ở bước sau.
  3. **Hệ thống Providers Toàn cục (`Providers.tsx`)**:
     - Bọc `ShopProvider`, các modals (Cart, Detail, Tracking, Wishlist, SizeGuide, Chatbot, Toast) và `AdminDashboard` tại `RootLayout` (`layout.tsx`), giúp lưu giữ trạng thái giỏ hàng, thông tin khách hàng và phiên đăng nhập xuyên suốt khi chuyển trang.
  4. **Đồng bộ Header Navigation**:
     - Bổ sung liên kết `TRANG CHỦ` (`/`) và `SẢN PHẨM` (`/products`).
     - Tự động nhận diện pathname và hỗ trợ chọn danh mục (`CHẠY BỘ`, `THỜI TRANG`, `DÃ NGOẠI`) thông qua URL query parameter `?category=...`.
  5. **Cấu hình Cloudflare Assets**:
     - Thêm `trailingSlash: true` trong `next.config.ts` và `not_found_handling = "single-page-application"` trong `wrangler.toml` để đảm bảo định tuyến trực tiếp (`/products`, `/products/`) trả về mã HTTP `200 OK`.

### ADR-16: Xử lý Tương thích RSC Flight Data (`__PAGE__.txt`) cho Cloudflare Workers Assets
- **Bối cảnh:** Khi chạy Next.js 16 App Router Static Export, router phía client tải trước dữ liệu trang qua request dạng `GET /products/__next.products.__PAGE__.txt`. Tuy nhiên, cấu trúc thư mục tĩnh của Next.js lại sinh ra `out/products/__next.products/__PAGE__.txt` (thư mục lồng). Do không tìm thấy file có tên chứa dấu chấm `.` trên đĩa, Cloudflare Workers Assets với cấu hình SPA fallback đã trả về file `index.html`. Trình duyệt nhận HTML thay vì RSC text payload dẫn đến lỗi parse / crash navigation.
- **Khắc phục triệt để:**
  1. Tạo script tự động hóa [scripts/sync-rsc.js](file:///d:/HocTap/HK7/ChuyenDoiSo/project/nhom-2-ba-khi-shop/scripts/sync-rsc.js).
  2. Tích hợp trực tiếp vào script `build:frontend` trong [package.json](file:///d:/HocTap/HK7/ChuyenDoiSo/project/nhom-2-ba-khi-shop/package.json): Sau mỗi lần `next build`, script tự động sao chép các tệp `__PAGE__.txt` từ thư mục con ra tệp có tên dấu chấm (`__next.<route>.__PAGE__.txt`) tại thư mục cha.
  3. Kết quả: Tất cả các request RSC payload (`/__next.__PAGE__.txt`, `/products/__next.products.__PAGE__.txt`) được phục vụ trực tiếp với mã `200 OK` và đúng kiểu dữ liệu RSC text.

### ADR-17: Chuẩn hóa Toàn bộ Navigation Menu thành thẻ Link & Kiểm soát Prefetch
- **Bối cảnh:** 
  1. Các mục danh mục trên menu Header (`CHẠY BỘ`, `THỜI TRANG`, `DÃ NGOẠI`) trước đó sử dụng thẻ `<button>` mà chưa được reset User-Agent styles, khiến trình duyệt hiển thị các hộp viền xám đen thô kệch, không đồng nhất với các liên kết khác.
  2. Next.js App Router mặc định tự động gửi request prefetch ngầm (`HEAD /products/`, `GET /products/__next.products.__PAGE__.txt`) mỗi khi con trỏ chuột lướt qua Header, gây ra hàng loạt log không cần thiết trên terminal Wrangler.
- **Khắc phục triệt để:**
  1. Chuyển đổi 100% các mục điều hướng trong [Header.tsx](file:///d:/HocTap/HK7/ChuyenDoiSo/project/nhom-2-ba-khi-shop/frontend/src/components/Header.tsx) sang thẻ `<Link>` của Next.js (sinh ra thẻ `<a>` chuẩn mực), loại bỏ hoàn toàn viền hộp xám, đồng nhất kiểu chữ, padding và hiệu ứng hover đỏ thể thao.
  2. Bổ sung CSS reset cho `.navlinks button` trong [globals.css](file:///d:/HocTap/HK7/ChuyenDoiSo/project/nhom-2-ba-khi-shop/frontend/src/app/globals.css).
  3. Thêm cờ `prefetch={false}` cho các liên kết menu: Ngăn chặn triệt để việc Next.js spam log request RSC payload ngầm vào terminal; hệ thống chỉ tải dữ liệu khi người dùng thực sự click.
  4. Hỗ trợ active highlight theo danh mục đang chọn (`selectedCategory`).

### ADR-18: Tự Động Lướt Xuống Khung Hình Bộ Lọc Khi Chuyển Mục & Chuẩn Hóa Ảnh Sneaker Fallback
- **Bối cảnh:** 
  1. Cần phân tách rõ ràng hành vi tương tác giữa nút SẢN PHẨM (muốn xem toàn diện từ đầu trang sản phẩm) và các nút danh mục chuyên sâu (CHẠY BỘ, THỜI TRANG, DÃ NGOẠI - muốn xem ngay danh sách sản phẩm đã lọc).
  2. Mảng `fallbackImages` trong `frontend/src/lib/api.ts` còn sót 6 ảnh thời trang (áo sơ mi, áo khoác, quần jean) từ phiên bản cũ khi API chưa có ảnh R2.
- **Khắc phục:**
  1. **Tự động cuộn mượt (Smooth Scroll) chính xác & Phân tầng trải nghiệm**:
     - Thêm `scroll-margin-top: 90px;` trong `globals.css` cho `#products` và `.section` để khi cuộn đến, đỉnh khung hình luôn nằm ngay dưới thanh Header dính.
     - **Nút SẢN PHẨM**: Chuyển hướng sang `/products` và luôn tự động cuộn lên **đỉnh đầu trang** (`top: 0`), cho phép người xem nhìn thấy banner nhỏ tinh gọn trước khi khám phá danh mục.
     - **Các nút CHẠY BỘ, THỜI TRANG, DÃ NGOẠI**: Tự động chuyển hướng sang `/products?category=...#products`, kích hoạt bộ lọc tương ứng và **tự động lướt mượt mà xuống ngay khung hình bộ lọc & danh sách sản phẩm**.
     - Trong [ProductSection.tsx](file:///d:/HocTap/HK7/ChuyenDoiSo/project/nhom-2-ba-khi-shop/frontend/src/components/ProductSection.tsx), `useEffect` tự động kích hoạt `scrollIntoView({ behavior: 'smooth' })` khi có param `category` hoặc hash `#products`.
  2. **Thay thế 100% Ảnh Fallback sang Sneaker Thể Thao**:
     - Cập nhật [frontend/src/lib/api.ts](file:///d:/HocTap/HK7/ChuyenDoiSo/project/nhom-2-ba-khi-shop/frontend/src/lib/api.ts) với 6 ảnh giày thể thao sneaker chính hãng độ phân giải cao từ Unsplash (Nike, Adidas, Puma...). Loại bỏ hoàn toàn hình ảnh quần áo cũ.

### ADR-19: Cập Nhật Chính Sách Miễn Phí Vận Chuyển Trong Nước Khi Mua Từ 3 Sản Phẩm
- **Bối cảnh:** 
  1. Yêu cầu nghiệp vụ mới: Cập nhật chính sách giao hàng của One - Store từ mốc giá trị (`subtotal >= 499.000₫`) sang số lượng sản phẩm: **Miễn phí vận chuyển trong nước cho khách hàng khi mua nhiều hơn 2 sản phẩm (tức từ 3 đôi giày trở lên trong giỏ hàng)**.
  2. Đơn hàng dưới 3 sản phẩm chịu mức phí giao hàng tiêu chuẩn toàn quốc là `30.000₫`.
- **Triển khai chi tiết:**
  1. **Logic tính toán giỏ hàng & thanh toán ([CartDrawer.tsx](file:///d:/HocTap/HK7/ChuyenDoiSo/project/nhom-2-ba-khi-shop/frontend/src/components/CartDrawer.tsx))**:
     - Định nghĩa `const FREESHIP_MIN_ITEMS = 3;`.
     - Tính tổng số lượng sản phẩm: `totalQuantity = cart.reduce((sum, item) => sum + item.quantity, 0)`.
     - Phí ship: `shippingFee = totalQuantity >= FREESHIP_MIN_ITEMS || cart.length === 0 ? 0 : 30000;`.
     - Tiến trình Freeship bar: `progressPercent = Math.min(100, Math.round((totalQuantity / FREESHIP_MIN_ITEMS) * 100));`.
     - Số sản phẩm còn thiếu: `remainingForFreeship = Math.max(0, FREESHIP_MIN_ITEMS - totalQuantity);`.
     - Hiển thị văn bản tiến trình động: Khi `< 3` hiển thị `Mua thêm {remainingForFreeship} đôi giày nữa để được Miễn phí vận chuyển trong nước`, khi `>= 3` hiển thị `Đơn hàng từ 3 sản phẩm được MIỄN PHÍ VẬN CHUYỂN TRONG NƯỚC!`.
  2. **Đồng bộ hóa 100% Từ điển Đa ngôn ngữ (i18n)**:
     - `frontend/src/locales/vi/checkout.ts` & `frontend/src/locales/en/checkout.ts`: Cập nhật `freeship_qualified`, `freeship_remaining_prefix`, `freeship_remaining_suffix`.
     - `frontend/src/locales/vi/product.ts` & `frontend/src/locales/en/product.ts`: Cập nhật `guarantee_freeship` ("Miễn phí vận chuyển trong nước: Khi mua từ 3 sản phẩm" / "Free Domestic Shipping: On orders of 3+ items").
     - `frontend/src/locales/vi/common.ts` & `frontend/src/locales/en/common.ts`: Cập nhật cam kết freeship dịch vụ.
  3. **Đồng bộ Hồ sơ & Tri thức Store ([STORE_PROFILE.md](file:///d:/HocTap/HK7/ChuyenDoiSo/project/nhom-2-ba-khi-shop/STORE_PROFILE.md))**:
     - Cập nhật mục 4 (Chính sách bán hàng & Dịch vụ khách hàng): Miễn phí vận chuyển trong nước khi mua từ 3 sản phẩm/đôi giày, phí vận chuyển tiêu chuẩn cho đơn dưới 3 sản phẩm là 30.000₫.

### ADR-20: Cào Dữ Liệu 70 Mẫu Sneaker Chuẩn Giá Thị Trường 10 Thương Hiệu, Tải Ảnh Vào Cloudflare R2 & Vector Hóa Tri Thức AI
- **Bối cảnh:**
  1. Yêu cầu nghiệp vụ: Đồng bộ danh mục sản phẩm của One - Store với giá bán thực tế thị trường Việt Nam năm 2026, cung cấp hình ảnh chất lượng cao và xây dựng bộ nhớ tri thức toàn diện cho AI Chatbot.
  2. Quy mô: 70 sản phẩm tiêu biểu (7 sản phẩm mỗi hãng) của 10 thương hiệu hợp tác (Nike, Adidas, New Balance, Puma, Salomon, Asics, Onitsuka Tiger, Mizuno, Li-Ning, Anta).
  3. Yêu cầu kỹ thuật: Tải ảnh trực tiếp vào Cloudflare R2 Bucket nội bộ của shop (`one-store-images`) thay vì dùng link ngoài, nạp CSDL D1 và vector hóa tri thức vào Cloudflare Vectorize.
- **Triển khai chi tiết:**
  1. **Script tự động hóa ([scripts/crawl-and-sync-sneakers.mjs](file:///d:/HocTap/HK7/ChuyenDoiSo/project/nhom-2-ba-khi-shop/scripts/crawl-and-sync-sneakers.mjs))**:
     - Định nghĩa bộ dữ liệu 70 mẫu sneaker chính hãng với đầy đủ thông số kỹ thuật (bọt đệm, đĩa carbon/wave, độ ôm chân, loại bàn chân, cự ly) và giá thị trường VNĐ (từ 1.890.000₫ đến 6.290.000₫).
     - Tải 70 hình ảnh sneaker chất lượng cao và tải trực tiếp vào Cloudflare R2 qua API `/api/admin/images`, nhận `image_key` dạng `products/<uuid>.jpg`.
     - Sinh file migration [backend/migrations/0007_seed_authentic_market_sneakers.sql](file:///d:/HocTap/HK7/ChuyenDoiSo/project/nhom-2-ba-khi-shop/backend/migrations/0007_seed_authentic_market_sneakers.sql) và nạp nguyên tử vào CSDL D1 `fashion_db`.
  2. **Hoàn thiện Bộ Lọc Thương hiệu Frontend ([ProductSection.tsx](file:///d:/HocTap/HK7/ChuyenDoiSo/project/nhom-2-ba-khi-shop/frontend/src/components/ProductSection.tsx))**:
     - Bổ sung `Onitsuka Tiger` vào mảng `brands` filter, đảm bảo toàn bộ 10 thương hiệu đều có thể lọc riêng biệt.
  3. **Xây dựng Tri thức RAG Chuyên sâu & Vectorize Index**:
     - Xóa tài liệu cũ legacy mang tên cũ `One-Fashion`.
     - Tạo 3 tài liệu tri thức chuẩn mực và nạp vào Cloudflare Workers AI model `@cf/baai/bge-m3` để sinh vector embeddings nạp vào Cloudflare Vectorize `ba-khi-knowledge`:
       * *Tài liệu 1*: "Danh mục 70 mẫu Sneaker Chính hãng và Bảng giá Thị trường One - Store 2026" (10 chunks).
       * *Tài liệu 2*: "Cẩm nang Tư vấn Chọn Giày theo Phom Bàn chân và Công nghệ Đệm Âu Á" (2 chunks).
       * *Tài liệu 3*: "Chính sách Miễn phí Vận chuyển từ 3 đôi và Đồng kiểm One - Store" (2 chunks).
  4. **Kiểm thử nghiệm thu Chatbot RAG**:
     - AI Chatbot *Tư vấn One* trả lời chính xác các câu hỏi tư vấn về phom chân bè Á Đông (đề xuất Asics, Mizuno, Li-Ning, Anta; khuyên tăng 0.5-1 size với Nike, Salomon) và chính xác chính sách freeship từ 3 đôi giày, trích xuất chính xác nguồn tài liệu tham khảo.

### ADR-21: Khắc Phục Triệt Để Lỗi 500 Khi Client Request Chunk Chuyển Tiếp Giữa Các Bản Build Next.js
- **Bối cảnh:**
  1. Khi ứng dụng Next.js được build lại tĩnh (`next build`), Turbopack làm trống thư mục xuất và tạo các tên chunk hash mới (ví dụ: `0cz1d0mv5g_q7.js` thay thế `3l4gd1-4kyaqb.js`).
  2. Các trình duyệt hoặc tab của người dùng đang mở trước đó vẫn giữ HTML của bản build cũ và tiếp tục gửi request tải chunk cũ (như `/_next/static/chunks/3l4gd1-4kyaqb.js`).
  3. Wrangler Miniflare (đang chạy local nền) lưu bảng asset manifest trong bộ nhớ RAM từ đầu phiên. Khi file chunk cũ bị xóa khỏi ổ đĩa, Miniflare cố đọc file, gặp lỗi `ENOENT` và trả về mã lỗi `500 Internal Server Error` thay vì xử lý mượt mà.
- **Khắc phục triệt để:**
  1. **Cơ chế Bảo Toàn Chunks Lũy Tích ([scripts/sync-rsc.js](file:///d:/HocTap/HK7/ChuyenDoiSo/project/nhom-2-ba-khi-shop/scripts/sync-rsc.js))**:
     - Thiết lập thư mục lưu trữ chunk lũy tích `frontend/.chunk-cache/` (đã thêm vào [.gitignore](file:///d:/HocTap/HK7/ChuyenDoiSo/project/nhom-2-ba-khi-shop/.gitignore)).
     - Sau mỗi lần Next.js build, script `sync-rsc.js` tự động khôi phục các chunk cũ từ cache vào `frontend/out/_next/static/chunks/` nếu trên đĩa chưa có, đồng thời cập nhật các chunk mới vào cache.
     - Nhờ đó, cả client đang mở bản build cũ lẫn client mở bản build mới đều tìm thấy file chunk tương ứng, Miniflare không bị lỗi `ENOENT` và không bao giờ xuất hiện lỗi `500 Internal Server Error`.
  2. **Kết quả kiểm thử**:
     - Request `GET /_next/static/chunks/3l4gd1-4kyaqb.js` trả về HTTP `200 OK`.
     - Request trang chủ `/`, trang `/products/` và API `/api/products` đều phản hồi `200 OK` ổn định.

### ADR-22: Chuẩn Hóa 100% Ảnh Sneaker Studio Chính Hãng, Khắc Phục Triệt Để Lỗi Ảnh Sai Mẫu & Lệch Thương Hiệu
- **Bối cảnh:**
  1. Người dùng phát hiện một số sản phẩm hiển thị sai hình ảnh:
     - `Li-Ning Way of Wade 10 Mint Blossom` hiển thị ảnh áo thun trắng treo tường.
     - `Li-Ning Super Light 21 Breeze` hiển thị ảnh người mẫu đứng trước tranh vẽ graffiti.
     - `Li-Ning Yueying 3 Pro Dual BOOM` hiển thị ảnh balo đen.
     - Các mẫu giày Adidas (Samba OG, Ultraboost, Adizero Adios Pro 3) và Anta (C202 GT Pro) bị gán ảnh giày Nike (có dấu Swoosh).
  2. Nguyên nhân gốc: Khi seed dữ liệu trước đó, script dùng kho ảnh nghệ thuật đại trà Unsplash theo photo ID tĩnh. Do Unsplash không phải catalog sản phẩm chuyên biệt, một số photo ID là quần áo/phụ kiện hoặc ảnh giày Nike chụp tự do.
- **Khắc phục toàn diện:**
  1. **Xây dựng Script Thu Thập & Xác Thực Ảnh Chuyên Biệt ([scripts/sync-authentic-sneaker-images.mjs](file:///d:/HocTap/HK7/ChuyenDoiSo/project/nhom-2-ba-khi-shop/scripts/sync-authentic-sneaker-images.mjs))**:
     - Danh sách từ khóa cấm (Blacklist): loại bỏ triệt để các kết quả chứa áo (t-shirt, shirt, tee), quần (pant), balo (backpack, bag), áo khoác (jacket, hoodie), người mẫu (person, model).
     - Ràng buộc thương hiệu nghiêm ngặt: Tên thương hiệu trong tiêu đề/URL phải khớp với hãng của sản phẩm, không cho phép ảnh chứa thương hiệu khác.
     - Trích xuất ảnh góc ngang studio (lateral profile/hero shot) từ các nguồn CDN chính hãng và sàn uy tín: `assets.adidas.com`, `static.nike.com`, `images.puma.com`, `images.stockx.com`, `shopnings.com`, `lining-goods-online`, `anta.com`, `cdna.lystit.com`.
     - Kiểm tra kích thước (>10KB), mime type và magic bytes (JPEG/PNG/WebP).
  2. **Đồng bộ vào Cloudflare R2 & CSDL D1**:
     - Upload trực tiếp toàn bộ 70 ảnh đạt chuẩn vào R2 Bucket (`one-store-images`) qua `POST /api/admin/images`.
     - Xuất và thực thi file migration [backend/migrations/0008_update_authentic_sneaker_images.sql](file:///d:/HocTap/HK7/ChuyenDoiSo/project/nhom-2-ba-khi-shop/backend/migrations/0008_update_authentic_sneaker_images.sql) cập nhật 70 câu lệnh `UPDATE products SET image_key = ... WHERE id = ...`.
     - Tỷ lệ thành công: 70/70 sản phẩm (100%).
  3. **Biên dịch & Kiểm thử nghiệm thu**:
     - Chạy `npm run build:frontend` cập nhật toàn bộ static export và bảo toàn chunk cache.
     - Kiểm tra trực tiếp API `/api/products` và endpoint ảnh `/api/images/...`: 100% sản phẩm trả về HTTP `200 OK`, `image/jpeg` hoặc `image/webp`.

### ADR-23: Mô Hình Mua Sắm Không Cần Đăng Nhập (Guest-First E-Commerce), Banner Cookie Vĩnh Viễn & Giỏ Hàng Lưu Cookie Tự Động Xóa Khi Chưa Đồng Ý
- **Bối cảnh:**
  1. Người dùng yêu cầu loại bỏ rào cản đăng nhập tài khoản nhằm tối ưu hóa trải nghiệm khách hàng (Zero Friction UX), người mua không cần tạo tài khoản hay ghi nhớ mật khẩu.
  2. Hiển thị banner chấp thuận sử dụng Cookie khi lần đầu truy cập, lưu trữ cookie vĩnh viễn không thời hạn (`Max-Age=315360000` ~ 10 năm).
  3. Yêu cầu chi tiết về Giỏ hàng & Yêu thích:
     - Khi khách hàng **CHƯA chấp nhận lưu cookie**: Vẫn cho phép thêm vào giỏ hàng và đặt hàng bình thường trong phiên hiện tại, nhưng khi tải lại trang (`F5`) thì giỏ hàng và danh mục yêu thích **tự động biến mất** (reset về rỗng), không lưu vết trên trình duyệt.
     - Khi khách hàng **BẤM CHẤP NHẬN lưu cookie**: Giỏ hàng và danh mục yêu thích được lưu trực tiếp vào Cookie trình duyệt (`one_cart`, `one_wishlist`) với thời hạn không thời hạn (10 năm), những lần sau khi truy cập lại web các thông tin này sẽ được tự động lấy ra đầy đủ.
- **Triển khai chi tiết:**
  1. **Component Cookie Consent ([CookieConsentBanner.tsx](file:///d:/HocTap/HK7/ChuyenDoiSo/project/nhom-2-ba-khi-shop/frontend/src/components/CookieConsentBanner.tsx))**:
     - Thiết kế dạng Floating Banner bo tròn góc dưới màn hình, hiệu ứng kính mờ (Glassmorphism), viền mảnh và đổ bóng sang trọng, không che lấp nội dung chính của trang web.
     - Tích hợp hàm `acceptCookieConsent()` từ `useShop()`: Khi người dùng bấm "Đồng ý & Tiếp tục", lập tức ghi cookie `one_cookie_consent=accepted; Max-Age=315360000; Path=/; SameSite=Lax` và lưu giỏ hàng `cart` hiện tại vào cookie `one_cart`, danh sách yêu thích vào `one_wishlist`.
  2. **Cơ Chế Giỏ Hàng & Yêu Thích Lưu Cookie Thông Minh ([ShopContext.tsx](file:///d:/HocTap/HK7/ChuyenDoiSo/project/nhom-2-ba-khi-shop/frontend/src/context/ShopContext.tsx))**:
     - **Khi tải lại trang (`onMount`)**: Kiểm tra `checkIsCookieAccepted()`. Nếu chưa chấp nhận consent, dọn sạch cookie `one_cart`, `one_wishlist` và reset `cart = []`, `wishlistIds = []`. Nếu đã chấp nhận, giải mã JSON từ cookie `one_cart` và `one_wishlist` để khôi phục trạng thái giỏ hàng & yêu thích.
     - **Khi thay đổi giỏ hàng (`useEffect`)**: Chỉ ghi vào cookie `one_cart` và localStorage khi `cookieConsent || checkIsCookieAccepted()` là true. Nếu chưa chấp nhận, dữ liệu chỉ tồn tại trong React state bộ nhớ tạm của phiên.
     - **Khi thao tác yêu thích (`toggleWishlist`)**: Tương tự, chỉ ghi vào cookie `one_wishlist` khi đã được chấp thuận cookie.
  3. **Tái Định Vị Nút Điều Hướng Header ([Header.tsx](file:///d:/HocTap/HK7/ChuyenDoiSo/project/nhom-2-ba-khi-shop/frontend/src/components/Header.tsx))**:
     - Thay thế icon User đăng nhập cũ bằng nút **"Đơn hàng của tôi"** (`Package` icon), mở trực tiếp modal tra cứu đơn hàng (`TrackingModal`).
  4. **Tra Cứu Nhanh Đơn Hàng Trên Thiết Bị ([CartDrawer.tsx](file:///d:/HocTap/HK7/ChuyenDoiSo/project/nhom-2-ba-khi-shop/frontend/src/components/CartDrawer.tsx) & [TrackingModal.tsx](file:///d:/HocTap/HK7/ChuyenDoiSo/project/nhom-2-ba-khi-shop/frontend/src/components/TrackingModal.tsx))**:
     - Khi đặt hàng thành công, tự động lưu mã đơn (`ONE-...`) vào danh sách `one:recent_orders` trên thiết bị.
     - Trong `TrackingModal`, hiển thị các chip đơn hàng gần đây trên thiết bị để khách hàng bấm kiểm tra trạng thái vận chuyển tức thì chỉ với 1 cú nhấp chuột.
  5. **Dọn Dẹp Codebase ([Providers.tsx](file:///d:/HocTap/HK7/ChuyenDoiSo/project/nhom-2-ba-khi-shop/frontend/src/components/Providers.tsx))**:
     - Xóa bỏ `MemberModal.tsx` và loại bỏ `'member'` khỏi `activeModal` type union, loại bỏ mã nguồn thừa.
  6. **Trải Nghiệm Thêm Vào Giỏ Hàng Mượt Mà ([ShopContext.tsx](file:///d:/HocTap/HK7/ChuyenDoiSo/project/nhom-2-ba-khi-shop/frontend/src/context/ShopContext.tsx) & [ProductCard.tsx](file:///d:/HocTap/HK7/ChuyenDoiSo/project/nhom-2-ba-khi-shop/frontend/src/components/ProductCard.tsx))**:
     - Cấu hình `openDrawer: boolean = false` mặc định trong `addToCart`: Khi khách hàng click nút "+ Giỏ hàng" hoặc chọn thêm vào giỏ, hệ thống chỉ thêm sản phẩm, cập nhật số lượng badge và hiện Toast thông báo xác nhận thành công, **không tự động mở drawer / modal giỏ hàng** để tránh làm gián đoạn trải nghiệm lướt xem hàng. Drawer chỉ mở khi khách hàng bấm trực tiếp vào biểu tượng giỏ hàng trên Header hoặc bấm nút "MUA NGAY".

### ADR-24: Tùy Biến Banner To Trang Chủ Sang Phối Màu Đen & Đỏ (Bred Aesthetic) & Tối Ưu Độ Tương Phản Chữ Nổi Bật
- **Bối cảnh:**
  1. Người dùng yêu cầu đổi màu banner to ở trang chủ (Hero Banner) thành sự kết hợp giữa **Màu Đen** và **Màu Đỏ**.
  2. Toàn bộ chữ trong banner phải được đổi màu sao cho hiển thị cực kỳ nổi bật, sắc nét và dễ đọc trên nền tối.
- **Triển khai chi tiết:**
  1. **Khung Banner Hero ([globals.css](file:///d:/HocTap/HK7/ChuyenDoiSo/project/nhom-2-ba-khi-shop/frontend/src/app/globals.css))**:
     - Nền: `radial-gradient(circle at 85% 20%, rgba(225, 29, 72, 0.22) 0%, rgba(10, 10, 14, 0.98) 60%), #0a0a0d;` (Đen than chì sâu thẳm điểm xuyết ánh sáng đỏ tỏa mờ sang trọng).
     - Viền: `border: 1px solid rgba(225, 29, 72, 0.35);` kèm bóng đổ nổi 3D `box-shadow: 0 25px 60px -15px rgba(0, 0, 0, 0.55), 0 0 40px rgba(225, 29, 72, 0.12);`.
  2. **Tối Ưu Độ Tương Phản Chữ ([globals.css](file:///d:/HocTap/HK7/ChuyenDoiSo/project/nhom-2-ba-khi-shop/frontend/src/app/globals.css) & [Hero.tsx](file:///d:/HocTap/HK7/ChuyenDoiSo/project/nhom-2-ba-khi-shop/frontend/src/components/Hero.tsx))**:
     - Tiêu đề chính `h1`: Dòng 1 đổi sang màu Trắng tinh khôi `#ffffff`; dòng 2 (`.hero-red-highlight`) đổi sang màu Đỏ rực `#ff3355` có hiệu ứng phát sáng nhẹ `text-shadow: 0 0 25px rgba(255, 51, 85, 0.35)`.
     - Phụ đề đoạn văn `p`: Đổi sang màu xám trắng bạc sáng `#e4e4e7`, đảm bảo tỷ lệ tương phản cao (WCAG AAA), đọc rất êm mắt.
     - Nhãn `eyebrow`: Nền đen đỏ mờ `rgba(225, 29, 72, 0.12)`, viền đỏ `rgba(225, 29, 72, 0.45)`, chữ đỏ tươi `#ff4d6d`.
     - Nút phụ `.secondary-btn`: Đổi sang nền đen trong suốt `rgba(255, 255, 255, 0.05)`, viền đỏ mảnh `rgba(225, 29, 72, 0.4)`, chữ trắng `#ffffff` và icon đỏ `#ff4d6d`.
  3. **Khu Vực Ảnh Sneaker Studio ([globals.css](file:///d:/HocTap/HK7/ChuyenDoiSo/project/nhom-2-ba-khi-shop/frontend/src/app/globals.css))**:
     - Khung ảnh `.hero-photo-wrap`: Nền tối gradient chuyển màu, viền phân cách đỏ mờ `border-left: 1px solid rgba(225, 29, 72, 0.2);`.
     - Ảnh `.hero-photo`: Viền đỏ mảnh `1px solid rgba(225, 29, 72, 0.35)` và bóng đổ sâu `box-shadow: 0 20px 45px -10px rgba(0, 0, 0, 0.7), 0 0 25px rgba(225, 29, 72, 0.2);`.
     - Badge nổi `.hero-badge-floating`: Kính mờ đen tối viền đỏ `#ff4d6d`, chữ trắng nổi bật.

### ADR-25: Tích Hợp Mô Hình 3D WebGL Nike Air Jordan 1 Vào Banner To Trang Chủ Bằng Three.js, Chuẩn Hóa Đường Dẫn Tương Đối & Tối Ưu Asset
- **Bối cảnh:**
  1. Người dùng yêu cầu thay ảnh tĩnh ở Banner to (Hero Banner) bằng mô hình 3D thực tế của file `D:\nike_air_jordan_1.glb`.
| `frontend/src/locales/vi/product.ts` & `en/product.ts` | Modified | Bổ sung `colors_map` (115 màu chuẩn quốc tế) và `descriptions_map` (70 mẫu giày sneaker). |
| `frontend/src/locales/vi/checkout.ts` & `en/checkout.ts` | Modified | Loại bỏ hoàn toàn `(no account needed)` và `1-Step`, chuẩn hóa `Checkout`, `Fast Checkout`, `PROCEED TO CHECKOUT`. |
| `frontend/src/locales/vi/common.ts` & `en/common.ts` | Modified | Bổ sung `declined_bar_prefix`, `declined_bar_action`, `viewer_3d` chuẩn song ngữ 1-1. |
| `frontend/src/locales/vi/modals.ts` & `en/modals.ts` | Modified | Bổ sung các trường tra cứu đơn hàng (`all_orders_tip`, `orders_suffix`, `recipient_phone_label`, `inspection_policy`, `lookup_all_title`, `not_found_desc`). |
| `frontend/src/components/CookieConsentBanner.tsx` | Modified | Loại bỏ nút 'x' ở header, giữ nút 'Đóng', tích hợp trạng thái từ chối cookie `isCookieDeclined`. |
| `frontend/src/components/Header.tsx` | Modified | Mặc định hiển thị thanh thông báo cookie màu trắng chữ đen in hoa dưới Topbar cho đến khi khách đồng ý. |
| `frontend/src/app/orders/page.tsx` | Modified | Dịch song ngữ 100% (SĐT, số đơn hàng, chính sách đồng kiểm, tag `[Method: COD]`, ngày giờ theo locale, breadcrumb `HOME > PURCHASE HISTORY`). |
| `frontend/src/components/ProductDetailModal.tsx` | Modified | Tra cứu song ngữ mô tả qua `descriptions_map` và màu sắc qua `colors_map`. |
| `frontend/src/components/ProductCard.tsx` | Modified | Tra cứu song ngữ màu sắc qua `colors_map` cho cả tiêu đề và chip chọn màu. |
| `frontend/src/components/CartDrawer.tsx` | Modified | Tra cứu song ngữ màu sắc qua `colors_map`, tự động đồng bộ tag `[Method: COD]` khi đặt hàng tiếng Anh. |
  2. Yêu cầu bắt buộc: **Không sử dụng đường dẫn tuyệt đối**, mô hình phải được import/tải qua đường dẫn tương đối nội bộ của dự án.
  3. Cho phép tương tác kéo chuột xoay 360 độ, cuộn chuột phóng to/thu nhỏ xem toàn cảnh chi tiết của giày.
- **Triển khai chi tiết:**
  1. **Chuẩn Hóa Đường Dẫn Tương Đối**:
     - Sao chép file từ `D:\nike_air_jordan_1.glb` vào thư mục tài nguyên tĩnh `frontend/public/models/nike_air_jordan_1.glb`.
     - Đường dẫn gọi trên web là đường dẫn tương đối `/models/nike_air_jordan_1.glb`.
  2. **Giải Quyết Giới Hạn 25MB Cloudflare Workers Assets Bằng Tối Ưu WebP**:
     - Tệp gốc 70.92 MB vượt quá trần 25 MiB của Cloudflare Workers Assets.
     - Sử dụng `@gltf-transform/cli webp` tối ưu hóa 24 kết cấu ảnh PNG 2K bên trong sang chuẩn nén WebP chất lượng cao (quality 85%).
     - Dung lượng giảm từ **70.92 MB** xuống còn **18.3 MB** (~19.18 MB < 25 MB) mà vẫn giữ nguyên 100% độ sắc nét của hình học và vân da sneaker.
  3. **Trình Render 3D WebGL Cao Cấp ([Sneaker3DViewer.tsx](file:///d:/HocTap/HK7/ChuyenDoiSo/project/nhom-2-ba-khi-shop/frontend/src/components/Sneaker3DViewer.tsx))**:
     - Xây dựng bằng `three` (`^0.187.0`), `GLTFLoader` và `OrbitControls`.
     - Thiết lập hệ thống chiếu sáng Studio 5 điểm (Key Light, Fill Light, Rim Light, Ambient Light và 2 Point Light đỏ thể thao phản chiếu viền giày).
     - Tự động căn giữa tâm hình học (`Box3`), tự động scale vừa vặn khung nhìn và áp dụng tone mapping ACESFilmic chuẩn điện ảnh.
     - Điều khiển mượt mà: Xoay 360 độ, zoom cận cảnh, pan, tùy chọn bật/tắt tự động xoay (`autoRotate`) và nút khôi phục góc nhìn mặc định.
     - Thanh tiến trình tải mượt mà (Loading Progress Bar) báo % chi tiết khi tải tệp.
  4. **Nhúng Hoàn Thiện Vào Hero ([Hero.tsx](file:///d:/HocTap/HK7/ChuyenDoiSo/project/nhom-2-ba-khi-shop/frontend/src/components/Hero.tsx))**:
     - Thay thế thẻ ảnh tĩnh `.hero-photo` bằng `<Sneaker3DViewer modelUrl="/models/nike_air_jordan_1.glb" height={520} />`.
     - Đồng bộ hoàn hảo với phong cách Black & Red của Banner to.
  5. **Căn Giữa Trọng Tâm & Nâng Góc Nhìn Camera ([Sneaker3DViewer.tsx](file:///d:/HocTap/HK7/ChuyenDoiSo/project/nhom-2-ba-khi-shop/frontend/src/components/Sneaker3DViewer.tsx))**:
     - Nâng góc camera mặc định từ `y = 1.4` lên `y = 2.2` (`camera.position.set(3.0, 2.2, 4.2)`), nhìn chếch 35 độ từ trên xuống (Studio Top-Down 3/4 View), quan sát rõ ràng cả mặt trên mũi giày, dây giày và mặt trước hộp giày.
     - Hạ nhẹ offset `model.position.y = -center.y - (size.y * 0.08)` và điều chỉnh tỉ lệ `scale = 1.95 / maxDim` giúp đôi giày và hộp giày nằm cân đối 100% ở tâm khung hình, có khoảng thở padding đều cả 4 phía, loại bỏ hoàn toàn hiện tượng chạm mép trên.

### ADR-26: Bổ Sung Khu Vực Top 4 Sản Phẩm Bán Chạy Nhất Dưới Thanh Đặc Quyền Trang Chủ (Minimalist Card - Chỉ Hình & Tên Giày)
- **Bối cảnh:**
  1. Người dùng yêu cầu hiển thị Top 4 sản phẩm bán chạy nhất đặt ngay bên dưới 4 banner đặc quyền dịch vụ (Perks) và phía trên chân trang Footer.
  2. Yêu cầu thiết kế tối giản: **Chỉ hiển thị Hình ảnh và Tên giày**, hoàn toàn loại bỏ các nút hành động (như Mua ngay, Thêm vào giỏ, Chọn size...).
- **Triển khai chi tiết:**
  1. **Component Top Bán Chạy ([BestSellers.tsx](file:///d:/HocTap/HK7/ChuyenDoiSo/project/nhom-2-ba-khi-shop/frontend/src/components/BestSellers.tsx))**:
     - Lựa chọn 4 mẫu sneaker bán chạy kinh điển nhất mọi thời đại:
       * `#1`: **Nike Dunk Low Retro Panda**
       * `#2`: **Adidas Samba OG Classic**
       * `#3`: **Asics Gel-Kayano 31 4D Guidance**
       * `#4`: **New Balance 550 White Grey**
     - Mỗi thẻ hiển thị:
       * Huy hiệu xếp hạng tinh xảo: `TOP #1`, `TOP #2`, `TOP #3`, `TOP #4` kèm icon cúp `Trophy`.
       * Khung ảnh studio vuông vức tỉ lệ 1:1, ảnh giày chất lượng cao với hiệu ứng hover zoom mượt mà (`1.06x`).
       * Tên giày in đậm sắc nét với font `Outfit` / `Plus Jakarta Sans`, chuyển màu đỏ thể thao khi rê chuột.
       * 100% không chứa nút Mua ngay hay nút bấm phức tạp. Khi nhấp vào thẻ, tự động mở `ProductDetailModal` để xem chi tiết lớn và các góc chụp của giày.
  2. **Tích Hợp Vào Bố Cục Trang Chủ ([page.tsx](file:///d:/HocTap/HK7/ChuyenDoiSo/project/nhom-2-ba-khi-shop/frontend/src/app/page.tsx))**:
     - Đặt `<BestSellers />` ngay dưới `<Perks />`, cách chân trang một khoảng thở thoáng đãng `paddingBottom: '40px'`.

---

### ADR-27: Thêm Dòng Chọn Màu Sắc Dưới Dòng Chọn Cỡ Giày Trong Thẻ Danh Mục Sản Phẩm (ProductCard)
- **Bối cảnh:**
  1. Người dùng yêu cầu tại danh mục sản phẩm (Catalog Grid), mỗi thẻ sản phẩm cần có thêm dòng chọn màu sắc đặt ngay bên dưới dòng chọn cỡ giày.
- **Triển khai chi tiết:**
  1. **Từ điển Ngôn ngữ ([product.ts](file:///d:/HocTap/HK7/ChuyenDoiSo/project/nhom-2-ba-khi-shop/frontend/src/locales/vi/product.ts) & [en/product.ts](file:///d:/HocTap/HK7/ChuyenDoiSo/project/nhom-2-ba-khi-shop/frontend/src/locales/en/product.ts)):**
     - Bổ sung trường `select_color: 'Chọn màu sắc:'` (tiếng Việt) và `select_color: 'Select Color:'` (tiếng Anh).
  2. **Quản lý State & Tương tác ([ProductCard.tsx](file:///d:/HocTap/HK7/ChuyenDoiSo/project/nhom-2-ba-khi-shop/frontend/src/components/ProductCard.tsx)):**
     - Cập nhật state `[selectedColor, setSelectedColor] = useState<string>(availableColors[0])`.
     - Thêm `useEffect` tự động đồng bộ lại `selectedSize` và `selectedColor` khi danh sách thuộc tính của sản phẩm thay đổi.
     - Hàm helper `getColorDot(colorName)` tự động nhận diện sắc độ (Đen `#18181b`, Trắng `#ffffff`, Đỏ `#e11d48`, Cam `#f97316`, Vàng `#eab308`, Xanh lá `#16a34a`, Navy `#1e3a8a`, Xanh dương/Ngọc `#0284c7`, Bạc/Xám `#94a3b8`,...) để hiển thị chấm màu tròn 7px tinh tế trong từng nút pill.
     - Hàng nút chọn màu sắc đặt ngay bên dưới hàng chọn cỡ giày, hiển thị nhãn: `Chọn màu sắc: <b style={{ color: COLORS.black.primary }}>{selectedColor}</b>`.
     - Nút pill màu sắc có hiệu ứng active viền đen đậm, nền đen chữ trắng sắc nét khi được chọn.
     - Tích hợp liền mạch: Khi bấm `MUA NGAY` hoặc nút thêm vào giỏ hàng trên thẻ, thuộc tính `selectedColor` đã chọn được truyền chuẩn xác vào đơn hàng và giỏ hàng.

---

### ADR-28: Tối Ưu Bố Cục Modal Bảng Quy Đổi Cỡ Giày Chuẩn Âu - Á (Căn Giữa, Tăng Khoảng Đệm & Thanh Cuộn Bên Trong Bo Góc)
- **Bối cảnh:**
  1. Người dùng phản hồi Modal Bảng Quy Đổi Cỡ Giày (`SizeGuideModal`) bị lệch mép trái, chữ và bảng quá sát viền gây khó đọc.
  2. Thanh cuộn dọc bị tràn ra ngoài bo góc của modalbox, làm mất thẩm mỹ các góc bo tròn.
- **Triển khai chi tiết ([SizeGuideModal.tsx](file:///d:/HocTap/HK7/ChuyenDoiSo/project/nhom-2-ba-khi-shop/frontend/src/components/SizeGuideModal.tsx)):**
  1. **Căn Giữa Hoàn Hảo**:
     - Loại bỏ `maxWidth` cố định trên phần tử bao `.modal`.
     - Áp dụng Flexbox container toàn màn hình: `position: fixed; inset: 0; display: flex; align-items: center; justify-content: center; padding: 24px 16px;`.
     - Thẻ modalbox `width: min(680px, 100%)` tự động căn giữa 100% cả chiều ngang và chiều dọc.
  2. **Tăng Khoảng Cách Margin/Padding (Loại Bỏ Hiện Tượng Sát Viền)**:
     - Thiết lập khoảng đệm thoáng đãng `padding: clamp(24px, 4vw, 36px)` cho vùng nội dung.
     - Badge eyebrow, tiêu đề thước đo, bảng quy đổi 4 cột (EUR, US, UK, CM), hộp lời khuyên phom chân và hướng dẫn đo chân đều có khoảng đệm đều 4 phía, không bao giờ chạm sát viền.
     - Bảng quy đổi cỡ giày được bo góc `14px` và có viền `1px solid #e4e4e7` riêng biệt sang trọng.
  3. **Thanh Cuộn Dọc Nằm 100% Bên Trong Thẻ Bo Góc**:
     - Thẻ ngoài `.modalbox` thiết lập `borderRadius: 24px` kết hợp `overflow: hidden` để chặn triệt để tình trạng thanh cuộn hoặc nội dung làm vuông góc bo tròn.
     - Khối con bên trong `.size-guide-scroll-container` đảm nhiệm cuộn nội dung `overflowY: auto`.
     - Tùy biến thanh cuộn mảnh thanh lịch: `width: 6px`, bo tròn tròn `borderRadius: 9999px`, màu `#cbd5e1`.
     - Thêm khoảng thụt `margin: 16px 0` cho `::-webkit-scrollbar-track` giúp thanh cuộn cách đều hai góc bo tròn trên/dưới 16px, nằm trọn vẹn bên trong thẻ bo góc.

---

### ADR-29: Chuẩn Hóa Phương Thức Thanh Toán COD Thuần Túy & Tối Ưu Bố Cục Nút Chọn (CartDrawer)
- **Bối cảnh:**
  1. Người dùng yêu cầu loại bỏ phương thức thanh toán bằng chuyển khoản / thẻ ngân hàng tại modal thanh toán (CartDrawer), chỉ giữ lại duy nhất hình thức COD (Thanh toán tiền mặt khi nhận hàng & Đồng kiểm).
  2. Bố cục cũ bị lỗi chia đôi: 1 nửa là nút tích chọn radio nằm lệch ở giữa, 1 nửa là text bị chèn ép sang bên phải do quy tắc CSS `.form input { width: 100% }`.
- **Triển khai chi tiết ([CartDrawer.tsx](file:///d:/HocTap/HK7/ChuyenDoiSo/project/nhom-2-ba-khi-shop/frontend/src/components/CartDrawer.tsx)):**
  1. **Loại Bỏ Hoàn Toàn Tùy Chọn Chuyển Khoản Ngân Hàng**:
     - Giữ duy nhất 1 thẻ thanh toán COD: *Thanh toán tiền mặt khi nhận hàng (Đồng kiểm)*.
     - Mô tả: *Kiểm tra hàng đúng cỡ giày, đúng mẫu rồi mới trả tiền*.
     - Mặc định toàn bộ đơn hàng được khởi tạo với hình thức COD.
  2. **Thu Gọn Nút Chọn Radio & Mở Rộng Không Gian Text Toàn Chiều Ngang**:
     - Cố định kích thước nút chọn radio: `width: 18px; height: 18px; minWidth: 18px; maxWidth: 18px; flexShrink: 0; margin: 0; padding: 0;`, ghi đè hoàn toàn quy tắc `width: 100%` của form.
     - Nút radio được căn sát mép trái với màu đỏ thương hiệu `accentColor: COLORS.red.primary`.
     - Khối text nhận `flex: 1; minWidth: 0;` chiếm trọn 100% không gian còn lại trên thẻ, cho phép tiêu đề và mô tả đồng kiểm trải dài thoáng đãng, sắc nét và dễ đọc.
     - Thẻ thanh toán được bọc viền đỏ nhạt sang trọng (`border: 1.5px solid #e11d48`, `background: rgba(225, 29, 72, 0.04)`, `borderRadius: 10px`, `padding: 12px 14px`).

---

### ADR-30: Kiểm Soát Tuyệt Đối Dữ Liệu Thiết Bị Theo Trạng Thái Đồng Ý Cookie (Cookie Consent Gating)
- **Bối cảnh:**
  1. Người dùng yêu cầu: Nếu khách hàng chưa bấm chấp nhận Cookie, tuyệt đối **không lưu mã đơn hàng, lịch sử đơn hàng hay thông tin người mua** vào máy.
  2. Chỉ khi khách hàng bấm **Chấp nhận Cookie**, tất cả chức năng liên quan đến lưu trữ lâu dài trên thiết bị (lịch sử đơn hàng `recent_orders`, thông tin người mua `guest_info`, giỏ hàng `cart`, sản phẩm yêu thích `wishlist`) mới được phép lưu vào Cookie và LocalStorage.
- **Triển khai chi tiết ([ShopContext.tsx](file:///d:/HocTap/HK7/ChuyenDoiSo/project/nhom-2-ba-khi-shop/frontend/src/context/ShopContext.tsx), [CartDrawer.tsx](file:///d:/HocTap/HK7/ChuyenDoiSo/project/nhom-2-ba-khi-shop/frontend/src/components/CartDrawer.tsx), [TrackingModal.tsx](file:///d:/HocTap/HK7/ChuyenDoiSo/project/nhom-2-ba-khi-shop/frontend/src/components/TrackingModal.tsx)):**
  1. **Khi Chưa Chấp Nhận Cookie (`!cookieConsent`):**
     - Khi vào trang / tải lại trang: Dọn dẹp triệt để mọi dữ liệu máy cũ (`one:recent_orders`, `GUEST_INFO_KEY`, `one_cart`, `one_wishlist`), đưa state về rỗng.
     - Khi đặt hàng: Không lưu mã đơn vào `one:recent_orders`, không lưu thông tin người mua vào `localStorage`.
     - Trong modal tra cứu đơn hàng (`TrackingModal`): Không hiển thị lịch sử đơn hàng cũ.
  2. **Khi Khách Hàng Bấm "Chấp Nhận Cookie" (`acceptCookieConsent`):**
     - Kích hoạt ghi nhận Cookie đồng thuận không thời hạn (`Max-Age=315360000; SameSite=Lax`).
     - Lập tức sao lưu đồng bộ toàn bộ trạng thái hiện tại (giỏ hàng, danh sách yêu thích, thông tin người mua, danh sách mã đơn vừa đặt) vào Cookie và LocalStorage.
     - Kể từ thời điểm đó, mọi thao tác mua sắm tiếp theo sẽ tự động được lưu trữ và khôi phục khi truy cập lại.

---

### ADR-31: Cảnh Báo In Đậm Đỏ & Nút Duyệt Cookie Tại Màn Hình Đặt Hàng Thành Công (Tối Ưu Không Hiện Lại Modal)
- **Bối cảnh:**
  1. Người dùng yêu cầu: Tại màn hình đặt hàng thành công (`Order Success View`), nếu khách hàng chưa thực hiện chấp nhận cookie thì hiển thị thông báo được **in đậm đỏ**:
     *"Quý khách chưa đồng ý cho hệ thống sử dụng cookie, mọi thông tin như lịch sử mua hàng, giỏ hàng, sản phẩm ưa thích,... sẽ không được lưu lại và sẽ mất khi tải lại trang. Vui lòng lưu lại mã đơn hàng để tra cứu hoặc nhấn đồng ý và tiếp tục để hệ thống có thể sử dụng cookie trên trình duyệt của bạn."*
  2. Ngay trong khối cảnh báo đỏ, tích hợp sẵn nút bấm **"Đồng ý & Tiếp tục sử dụng Cookie"**.
  3. Do nút chấp thuận đã có sẵn trực tiếp trên màn hình đặt hàng thành công, người dùng yêu cầu **loại bỏ logic hiển thị lại modal/banner Trải Nghiệm Mua Sắm & Cookie** để tránh chồng chéo giao diện.
  4. Nếu khách hàng đã chấp nhận cookie từ trước (`cookieConsent === true`) thì đặt hàng diễn ra bình thường (không hiện cảnh báo đỏ).
- **Triển khai chi tiết ([ShopContext.tsx](file:///d:/HocTap/HK7/ChuyenDoiSo/project/nhom-2-ba-khi-shop/frontend/src/context/ShopContext.tsx), [CartDrawer.tsx](file:///d:/HocTap/HK7/ChuyenDoiSo/project/nhom-2-ba-khi-shop/frontend/src/components/CartDrawer.tsx), [CookieConsentBanner.tsx](file:///d:/HocTap/HK7/ChuyenDoiSo/project/nhom-2-ba-khi-shop/frontend/src/components/CookieConsentBanner.tsx), [checkout.ts](file:///d:/HocTap/HK7/ChuyenDoiSo/project/nhom-2-ba-khi-shop/frontend/src/locales/vi/checkout.ts)):**
  1. **Từ điển Ngôn ngữ (`checkout.ts` vi & en):**
     - Bổ sung `cookie_warning` (văn bản tiếng Việt chuẩn dấu) và `cookie_accept_btn: 'Đồng ý & Tiếp tục sử dụng Cookie'`.
     - Đồng bộ bản dịch tiếng Anh dự phòng trong `locales/en/checkout.ts`.
  2. **Cảnh Báo Đặt Hàng & Nút Chấp Thuận Trực Tiếp (`CartDrawer.tsx`):**
     - Tại `Order Success View`: nếu `!cookieConsent`, hiển thị khối cảnh báo nền hồng nhạt `#fff1f2`, viền đỏ `#e11d48`, icon `AlertTriangle`, văn bản in đậm đỏ (`fontWeight: 800`, `color: #be123c`).
     - Tích hợp nút bấm *"Đồng ý & Tiếp tục sử dụng Cookie"* ngay trong khối cảnh báo: khi nhấp, gọi `acceptCookieConsent()`, lưu ngay mã đơn vừa tạo vào `recent_orders` và thông tin người mua, đồng thời ẩn ngay khối cảnh báo đỏ.
     - Loại bỏ hoàn toàn lệnh gọi mở lại modal cookie (`openCookieConsentModal`), giữ giao diện ngăn nắp, tập trung.
  3. **Đơn Giản Hóa Quản Lý CookieBanner (`CookieConsentBanner.tsx` & `ShopContext.tsx`):**
     - Banner cookie chỉ xuất hiện ở chế độ tự nhiên ban đầu (khi khách mới vào web và chưa chọn), không bị ép mở lại khi hoàn tất đơn hàng.
  4. **Kiểm Tra & Đóng Gói:**
     - TypeScript compile: `npm run typecheck` đạt 0 lỗi.
     - Static Export: `npm run build:frontend` cập nhật toàn diện `frontend/out/` (mã thoát 0).

---

### ADR-32: Chuyển Đổi Tra Cứu Đơn Hàng Thành Trang Riêng "Lịch Sử Mua Hàng" (/orders) & Tra Cứu Linh Hoạt Bằng Số Điện Thoại
- **Bối cảnh:**
  1. Người dùng yêu cầu không để chức năng tra cứu đơn hàng thành modal nữa, mà đưa thành một trang riêng là **"Lịch sử mua hàng"** (`/orders`).
  2. Thực hiện **không bắt buộc phải nhập mã đơn hàng** và có thể **truy xuất tất cả các đơn hàng đã đặt bằng số điện thoại**.
- **Triển khai chi tiết ([commerce.ts](file:///d:/HocTap/HK7/ChuyenDoiSo/project/nhom-2-ba-khi-shop/backend/src/commerce.ts), [orders/page.tsx](file:///d:/HocTap/HK7/ChuyenDoiSo/project/nhom-2-ba-khi-shop/frontend/src/app/orders/page.tsx), [Header.tsx](file:///d:/HocTap/HK7/ChuyenDoiSo/project/nhom-2-ba-khi-shop/frontend/src/components/Header.tsx), [Providers.tsx](file:///d:/HocTap/HK7/ChuyenDoiSo/project/nhom-2-ba-khi-shop/frontend/src/components/Providers.tsx), [CartDrawer.tsx](file:///d:/HocTap/HK7/ChuyenDoiSo/project/nhom-2-ba-khi-shop/frontend/src/components/CartDrawer.tsx)):**
  1. **Nâng Cấp API Tra Cứu Đơn Hàng (`backend/src/commerce.ts`):**
     - Endpoint `/api/orders/lookup` cho phép tra cứu linh hoạt:
       * Tra cứu bằng **Số điện thoại** (`phone`): Tự động làm sạch số điện thoại và truy vấn toàn bộ các đơn hàng khớp với số điện thoại đó trong bảng `orders` (`LIMIT 50`).
       * Tra cứu bằng **Mã đơn hàng** (`code`): Tra cứu theo mã đơn hàng cụ thể.
       * Kết hợp cả hai: Tra cứu đơn hàng có mã đơn và số điện thoại tương ứng.
     - Đồng thời truy vấn toàn bộ chi tiết sản phẩm (`order_items`) cho từng đơn hàng (tên giày, size giày, màu sắc, số lượng, đơn giá, ảnh thumbnail).
     - Trả về cấu trúc mảng `{ orders: enrichedOrders, order: enrichedOrders[0] }`.
  2. **Trang Riêng Lịch Sử Mua Hàng (`frontend/src/app/orders/page.tsx`):**
     - Tạo route tĩnh chuẩn mực `/orders` phục vụ qua Cloudflare Worker Assets.
     - Thiết kế giao diện cao cấp thẻ nổi (Floating Cards), tương thích font `Outfit` và `Plus Jakarta Sans`.
     - Form tìm kiếm linh hoạt:
       * Ô nhập **Số điện thoại nhận hàng** (tự động điền nếu đã có thông tin khách).
       * Ô nhập **Mã đơn hàng** (ghi chú rõ *Không bắt buộc*).
       * Nút **TRA CỨU LỊCH SỬ ĐƠN HÀNG** với trạng thái loading mượt mà.
       * Hộp *"Đơn hàng gần đây trên thiết bị"* cho phép bấm tra cứu tức thì các mã đơn vừa đặt.
     - Danh sách đơn hàng trực quan:
       * Mỗi đơn hàng được hiển thị trong một thẻ Card sang trọng, đầy đủ mã đơn, ngày giờ đặt, huy hiệu trạng thái (Chờ xác nhận, Đang xử lý, Đang giao hàng, Đã giao thành công, Đã hủy).
       * Thông tin người nhận, địa chỉ giao hàng và ghi chú đồng kiểm.
       * Danh sách từng mặt hàng giày đã mua: ảnh đại diện, tên mẫu sneaker, size, màu, số lượng và thành tiền.
       * Tổng thanh toán in đậm đỏ, chính sách đồng kiểm tận nơi trước khi trả tiền.
  3. **Tinh Chỉnh Điều Hướng Header & Tối Ưu Nhận Diện (ADR-32.1):**
     - Xóa hoàn toàn biểu tượng gói hàng (`Package`) bên góc phải `navright` để tránh dư thừa khi đã có link trực tiếp trên thanh menu.
     - Xóa nút liên kết *"VỀ CHÚNG TÔI"* khỏi thanh điều hướng `navlinks` theo yêu cầu tinh giản trải nghiệm mua hàng.
     - Chuẩn hóa liên kết trên thanh điều hướng chính thành chữ in hoa toàn bộ: **`LỊCH SỬ MUA HÀNG`** (tiếng Anh: **`PURCHASE HISTORY`**), hài hòa đồng bộ 100% với các mục `TRANG CHỦ`, `SẢN PHẨM`, `CHẠY BỘ`, `THỜI TRANG`, `DÃ NGOẠI`.
     - Chân trang `Footer.tsx` và màn hình đặt hàng thành công `CartDrawer.tsx` tiếp tục duy trì liên kết tiện ích sang trang `/orders`.
  4. **Đồng Bộ Khổ Rộng Layout Trang Lịch Sử Mua Hàng Chuẩn 1360px (ADR-32.2):**
     - **Bối cảnh:** Trang `/orders` trước đây bọc trong `maxWidth: 960px`, trong khi Header, Trang chủ và Trang sản phẩm đều dùng `.wrap` (`max-width: 1360px; margin: auto; padding: 0 32px`). Chênh lệch 400px gây ra khoảng trắng lớn hai bên và mất tính đồng bộ giao diện.
     - **Khắc phục triệt để:**
       * Sử dụng container chuẩn `className="wrap"` với khoảng đệm `paddingTop: '32px'`, `paddingBottom: '80px'`.
       * Mở rộng Card Tra Cứu với `borderRadius: '24px'`, `padding: 'clamp(24px, 3.5vw, 36px)'`, lưới input `minmax(320px, 1fr)`.
       * Tối ưu Card Đơn Hàng với `borderRadius: '20px'`, `padding: '24px 26px'`, danh sách mặt hàng giày flexbox co giãn hài hòa và hiển thị sắc nét trên khổ rộng 1360px.
       * Khung Empty State & Chưa có đơn hàng được căn giữa cân đối, thoáng đãng với bo góc 24px và padding `clamp(48px, 6vw, 72px) 24px`.
  5. **Bổ Sung Breadcrumb Điều Hướng Về Trang Chủ Tại Trang Sản Phẩm (ADR-32.3):**
     - **Bối cảnh:** Trang `/products` chưa có thanh điều hướng breadcrumb về trang chủ như trang Lịch sử mua hàng (`/orders`), làm giảm tính liên kết điều hướng và sự đồng bộ trải nghiệm mua sắm.
     - **Khắc phục triệt để:**
       * Thêm thanh Breadcrumb chuẩn ngữ nghĩa `<nav aria-label="Breadcrumb">` bọc trong container `className="wrap"` với khoảng đệm `paddingTop: '28px'`.
       * Hiển thị liên kết trang chủ: `<Link href="/">dict.common.nav.home</Link>` kèm biểu tượng phân tách `<ChevronRight size={14} />`.
       * Hỗ trợ nhận diện danh mục động: Nếu đang lọc theo danh mục (`Running`, `Lifestyle`, `Outdoor`), hiển thị cấu trúc đa tầng `TRANG CHỦ > SẢN PHẨM > [DANH MỤC]`, trong đó `SẢN PHẨM` là liên kết quay về toàn bộ sản phẩm. Nếu ở chế độ mặc định, hiển thị `TRANG CHỦ > SẢN PHẨM`.
       * Tinh chỉnh `margin: 18px auto 16px` cho `.products-top-banner .story-wrapper` trong `globals.css` để khoảng cách giữa Breadcrumb và StoryBanner đạt tỷ lệ thẩm mỹ cân đối.
  6. **Chuẩn Hóa In Hoa Tiêu Đề Hero Banner Trang Chủ (ADR-33):**
     - **Bối cảnh:** Tiêu đề banner lớn trang chủ cần được in hoa để tăng tính mạnh mẽ, năng động thể thao và đồng bộ nhận diện.
     - **Khắc phục:**
       * Bản Tiếng Việt (`locales/vi/common.ts`): Cập nhật thành **`VỮNG TỪNG BƯỚC CHẠY.`** và **`TẠO DẤU ẤN RIÊNG.`**.
       * Bản Tiếng Anh (`locales/en/common.ts`): Cập nhật thành **`WEAR YOUR`** và **`OWN STORY.`**.
       * Bổ sung `text-transform: uppercase;` vào selector `.hero h1` trong `globals.css` đảm bảo hiển thị in hoa nhất quán 100%.
  7. **Chuẩn Hóa Sentence Case Cho Toàn Bộ Câu & Tiêu Đề In Đậm Trong Các Modal (ADR-34):**
     - **Bối cảnh:** Các tiêu đề và cụm in đậm trong 4 modal (Bảng quy đổi cỡ giày, Xem chi tiết sản phẩm, Giỏ hàng/Thanh toán, Modal Cookie) trước đây sử dụng Title Case (viết hoa chữ cái đầu của mỗi từ), gây cảm giác gượng gạo và không chuẩn văn phong tiếng Việt tự nhiên.
     - **Khắc phục triệt để:**
       * **Modal Bảng quy đổi cỡ giày** (`SizeGuideModal`):
         - Tiêu đề modal: **`Bảng quy đổi cỡ giày chuẩn Âu – Á`** (chỉ viết hoa chữ cái đầu câu `B`, danh từ riêng `Âu – Á` giữ hoa).
         - Tiêu đề hướng dẫn: **`3 bước đo chiều dài bàn chân tại nhà:`**
       * **Modal Chi tiết sản phẩm** (`ProductDetailModal`):
         - Cam kết chính hãng: **`100% chính hãng: Bảo đảm nguồn gốc`**
       * **Modal Giỏ hàng & Thanh toán** (`CartDrawer`):
         - Tiêu đề thanh toán: **`Thanh toán 1 bước (không cần đăng nhập)`**
         - Huy hiệu giao hàng: **`Thông tin giao hàng (không cần đăng nhập):`**
         - Phương thức COD: **`Thanh toán tiền mặt khi nhận hàng (đồng kiểm)`**
         - Phương thức chuyển khoản: **`Chuyển khoản / quét mã thanh toán ngân hàng`**
         - Nút duyệt cookie: **`Đồng ý & tiếp tục sử dụng cookie`**
       * **Modal Trải nghiệm mua sắm & Cookie** (`CookieConsentBanner`):
         - Tiêu đề modal: **`Trải nghiệm mua sắm & cookie`**
         - Nút chấp nhận: **`Đồng ý & tiếp tục`**
         - Cam kết: **`Cam kết bảo mật & không theo dõi bên thứ ba`**
       * Đồng bộ bản Tiếng Anh tương ứng (`checkoutEn`, `commonEn`).
  8. **Chuẩn Hóa Tiêu Đề Top 4 Sản Phẩm Bán Chạy Nhất & Xóa Bỏ Hardcoded Text Trong BestSellers (ADR-35):**
     - **Bối cảnh:** Component `BestSellers.tsx` trước đây bị hardcode các chuỗi text thô và hiển thị category tiếng Anh gốc từ DB (`Running`, `Lifestyle`), gây bất đồng bộ ngôn ngữ trên giao diện tiếng Việt.
     - **Khắc phục triệt để:**
       * Khai báo hằng `bestsellers` vào từ điển `vi/common.ts` và `en/common.ts`:
         - `title`: **`Top 4 sản phẩm bán chạy nhất`** (chỉ viết hoa chữ cái đầu câu theo đúng yêu cầu).
         - `eyebrow`: **`XU HƯỚNG MUA SẮM · SNEAKER CHÍNH HÃNG`**.
         - `subtitle`: **`Những mẫu giày thể thao và sneaker biểu tượng được cộng đồng săn đón nhiều nhất tại One - Store.`**.
         - `rank_prefix`: **`TOP #`**.
       * Ánh xạ danh mục sản phẩm: Dùng `dict.product.categories_map[item.category] || item.category` để hiển thị chuẩn tiếng Việt (`CHẠY BỘ`, `THỜI TRANG`, `DÃ NGOẠI`) khi chọn tiếng Việt và `RUNNING`, `LIFESTYLE` khi chọn tiếng Anh.
       * Loại bỏ 100% text hardcoded trong component `BestSellers.tsx`.
  9. **Tách Biệt Hằng Số Liên Kết Lịch Sử Mua Hàng Giữa Header Và Footer (ADR-36):**
     - **Bối cảnh:** Footer trước đây dùng chung `dict.common.nav.my_orders` với Header menu (`LỊCH SỬ MUA HÀNG`), khiến dòng liên kết ở chân trang bị in hoa toàn bộ, không hài hòa với các dòng khác.
     - **Khắc phục:**
       * Khai báo riêng `dict.common.footer.orders_link: 'Lịch sử mua hàng'` (`en`: `'Purchase history'`).
       * Duy trì `dict.common.nav.my_orders: 'LỊCH SỬ MUA HÀNG'` trên thanh Header menu chính.
       * Cập nhật `Footer.tsx` sử dụng `dict.common.footer.orders_link`, hiển thị chuẩn **`Lịch sử mua hàng`** (chỉ viết hoa chữ cái đầu).
       * Đồng bộ thanh Breadcrumb trang `/orders` sang `TRANG CHỦ > Lịch sử mua hàng`.
  10. **Chuẩn Hóa Tiêu Đề Danh Mục Tại Trang Sản Phẩm (ADR-37):**
     - **Bối cảnh:** Tiêu đề `section_title` tại trang sản phẩm trước đây là `Giày Thể Thao & Sneaker Chính Hãng` (viết hoa chữ cái đầu của mọi từ).
     - **Khắc phục:** Cập nhật `frontend/src/locales/vi/product.ts` thành **`Giày thể thao & Sneaker chính hãng`** (chỉ viết hoa chữ cái đầu tại chữ `Giày` và `Sneaker`, các từ `thể thao` và `chính hãng` viết thường).
  11. **Chuẩn Hóa Tiêu Đề 4 Thẻ Cam Kết Perks Tại Trang Chủ (ADR-38):**
     - **Bối cảnh:** Tiêu đề 4 thẻ cam kết Perks tại trang chủ trước đây viết hoa chữ cái đầu của từng từ (`100% Chính Hãng`, `Đổi Cỡ Giày 7 Ngày`, `Miễn Phí Giao Hàng Từ 3 Đôi`, `Tư Vấn Cỡ Giày Chuẩn`).
     - **Khắc phục:** Cập nhật `frontend/src/locales/vi/common.ts` thành:
       * **`100% Chính hãng`**
       * **`Đổi cỡ giày 7 ngày`**
       * **`Miễn phí giao hàng từ 3 đôi`**
       * **`Tư Vấn cỡ giày chuẩn`**
  12. **Đồng Bộ Và Việt Hóa Đường Dẫn Chức Năng (Breadcrumb) Khi Chọn Tab Bóng Rổ (ADR-39):**
     - **Bối cảnh:** Khi người dùng chọn tab danh mục "Bóng rổ" trên trang sản phẩm (`/products`), đường dẫn chức năng breadcrumb hiển thị bị lệch pha: `TRANG CHỦ > SẢN PHẨM > Basketball` (chưa được Việt hóa và chưa in hoa đồng bộ với các danh mục khác như `CHẠY BỘ`, `THỜI TRANG`, `DÃ NGOẠI`).
     - **Khắc phục triệt để:**
       * Bổ sung `basketball: 'BÓNG RỔ'` vào `dict.common.nav` trong [frontend/src/locales/vi/common.ts](file:///d:/HocTap/HK7/ChuyenDoiSo/project/nhom-2-ba-khi-shop/frontend/src/locales/vi/common.ts) và `basketball: 'BASKETBALL'` trong [frontend/src/locales/en/common.ts](file:///d:/HocTap/HK7/ChuyenDoiSo/project/nhom-2-ba-khi-shop/frontend/src/locales/en/common.ts).
       * Cập nhật hàm `getCategoryLabel(cat)` trong [frontend/src/app/products/page.tsx](file:///d:/HocTap/HK7/ChuyenDoiSo/project/nhom-2-ba-khi-shop/frontend/src/app/products/page.tsx) kiểm tra `c === 'basketball'` trả về `dict.common.nav.basketball`, fallback qua `dict.product.categories_map[cat].toUpperCase()`.
       * Đồng bộ pushState URL query `?category=...` khi người dùng bấm chọn các chip category trong [ProductSection.tsx](file:///d:/HocTap/HK7/ChuyenDoiSo/project/nhom-2-ba-khi-shop/frontend/src/components/ProductSection.tsx).
       * Kết quả: Breadcrumb hiển thị chuẩn chỉnh **`TRANG CHỦ > SẢN PHẨM > BÓNG RỔ`** (hoặc **`HOME > PRODUCTS > BASKETBALL`** ở chế độ Tiếng Anh).
  13. **In Hoa Toàn Bộ Tiêu Đề Banner Trang Sản Phẩm (ADR-40):**
     - **Bối cảnh:** Banner nhỏ đầu trang sản phẩm (`StoryBanner`) trước đây hiển thị tiêu đề `Tinh gọn hơn. / Bản lĩnh hơn.` (Title/Sentence Case).
     - **Khắc phục:**
       * Cập nhật [frontend/src/locales/vi/common.ts](file:///d:/HocTap/HK7/ChuyenDoiSo/project/nhom-2-ba-khi-shop/frontend/src/locales/vi/common.ts): Chuyển `headline_line1` thành **`TINH GỌN HƠN.`** và `headline_line2` thành **`BẢN LĨNH HƠN.`**.
       * Cập nhật [frontend/src/locales/en/common.ts](file:///d:/HocTap/HK7/ChuyenDoiSo/project/nhom-2-ba-khi-shop/frontend/src/locales/en/common.ts): Chuyển `headline_line1` thành **`LESS NOISE.`** và `headline_line2` thành **`MORE YOU.`**.
       * Bổ sung `text-transform: uppercase;` vào selector `.banner h2` trong [frontend/src/app/globals.css](file:///d:/HocTap/HK7/ChuyenDoiSo/project/nhom-2-ba-khi-shop/frontend/src/app/globals.css) đảm bảo hiển thị in hoa đồng bộ và sắc nét.
  14. **Tách Biệt Hoàn Toàn Luồng "MUA NGAY" Khỏi Giỏ Hàng Chung (ADR-41):**
     - **Bối cảnh:** Trước đây khi bấm "MUA NGAY" (`buyNow`), hệ thống gọi ngầm `addToCart(item)` và chuyển sang chế độ thanh toán của giỏ hàng. Điều này khiến sản phẩm vừa chọn bị gộp chung vào tất cả các sản phẩm đã có sẵn trong giỏ, ép khách hàng thanh toán cả giỏ và xóa sạch giỏ hàng sau khi đặt hàng thành công.
     - **Khắc phục triệt để:**
       * **State độc lập ([ShopContext.tsx](file:///d:/HocTap/HK7/ChuyenDoiSo/project/nhom-2-ba-khi-shop/frontend/src/context/ShopContext.tsx))**: Bổ sung `buyNowItem: CartItem | null` và `setBuyNowItem`. Trong hàm `buyNow(item)`, chỉ gán `buyNowItem` và mở form thanh toán, tuyệt đối **KHÔNG** gọi `addToCart` (giỏ hàng `cart` và badge số lượng trên Header hoàn toàn không bị ảnh hưởng).
       * **Giao diện đặt hàng nhanh riêng biệt ([CartDrawer.tsx](file:///d:/HocTap/HK7/ChuyenDoiSo/project/nhom-2-ba-khi-shop/frontend/src/components/CartDrawer.tsx))**:
         - Khi có `buyNowItem` (`isDirectCheckout = true`):
           + Tiêu đề Drawer hiển thị **`Đặt hàng nhanh (không cần đăng nhập)`** (`direct_checkout_title`).
           + Thẻ tóm tắt hiển thị huy hiệu đỏ nổi bật **`ĐẶT HÀNG NHANH · SẢN PHẨM ĐÃ CHỌN`** kèm ảnh thu nhỏ, tên giày, cỡ giày, màu sắc và đơn giá của DUY NHẤT sản phẩm đó, kèm ghi chú bảo toàn giỏ hàng.
           + Tạm tính, phí ship và tổng tiền chỉ tính riêng cho sản phẩm mua ngay.
           + Khi ấn "Quay lại" hoặc đóng form: Hủy `buyNowItem` và đóng Drawer, không gây xáo trộn giỏ hàng.
         - Khi thanh toán thành công: Gửi payload chỉ gồm duy nhất sản phẩm mua ngay, lưu mã đơn hàng, hiển thị thông báo thành công và **giữ nguyên 100% các món hàng trong giỏ hàng (`cart`)**.
       * Khai báo từ điển đa ngữ tương ứng trong [frontend/src/locales/vi/checkout.ts](file:///d:/HocTap/HK7/ChuyenDoiSo/project/nhom-2-ba-khi-shop/frontend/src/locales/vi/checkout.ts) và [frontend/src/locales/en/checkout.ts](file:///d:/HocTap/HK7/ChuyenDoiSo/project/nhom-2-ba-khi-shop/frontend/src/locales/en/checkout.ts).
  15. **Giới Hạn Số Lượng Tối Thiểu >= 1 & Cơ Chế Checkbox Chọn Mua / Chọn Tất Cả / Xóa Tất Cả Trong Giỏ Hàng (ADR-42):**
     - **Bối cảnh:**
       1. Nút trừ số lượng `-` trong giỏ hàng trước đây cho phép giảm về 0, dẫn đến vô tình xóa sản phẩm mà không có sự chủ đích của khách hàng.
       2. Giỏ hàng thiếu tính năng chọn lọc sản phẩm cần thanh toán (luôn bắt buộc thanh toán toàn bộ giỏ), thiếu nút "Chọn tất cả" và "Xóa tất cả".
     - **Khắc phục triệt để:**
       * **Giới hạn số lượng >= 1**:
         - Cập nhật hàm `updateQuantity` trong [ShopContext.tsx](file:///d:/HocTap/HK7/ChuyenDoiSo/project/nhom-2-ba-khi-shop/frontend/src/context/ShopContext.tsx) áp dụng `Math.max(1, i.quantity + delta)`.
         - Trong [CartDrawer.tsx](file:///d:/HocTap/HK7/ChuyenDoiSo/project/nhom-2-ba-khi-shop/frontend/src/components/CartDrawer.tsx): Nút trừ `-` bị disabled (`disabled={item.quantity <= 1}`) với hiệu ứng mờ `opacity: 0.35` và con trỏ `not-allowed`. Muốn bỏ sản phẩm, khách hàng sử dụng nút "Xóa" riêng.
       * **Thanh công cụ Toolbar ("Chọn tất cả", "Xóa tất cả")**:
         - Đặt đầu danh sách giỏ hàng: Gồm checkbox "Chọn tất cả" hiển thị số lượng chọn `(x/y)` và nút "Xóa tất cả" với icon `Trash2` màu đỏ thể thao.
       * **Checkbox từng sản phẩm**:
         - Mỗi dòng sản phẩm có 1 checkbox bên cạnh ảnh. Tự động checked khi thêm mới vào giỏ hàng.
         - Chỉ những sản phẩm ĐƯỢC CHỌN mới tính vào Tạm tính, thanh Freeship và đưa vào form thanh toán.
         - Nút "TIẾN HÀNH THANH TOÁN" hiển thị số lượng sản phẩm được chọn và tự động disabled khi chưa chọn món nào.
         - Khi thanh toán thành công, chỉ những sản phẩm ĐÃ MUA mới được xóa khỏi giỏ hàng (`removeSelectedFromCart`), các sản phẩm chưa tick chọn vẫn lưu lại nguyên vẹn.
  16. **Đồng Bộ Hoàn Toàn Giao Diện Thanh Toán Giữa Luồng Giỏ Hàng Và Mua Ngay (ADR-43):**
     - **Bối cảnh:** Trước đây khi chuyển sang màn hình thanh toán, luồng thanh toán giỏ hàng hiển thị một khung tóm tắt đơn hàng màu xám đơn điệu (chỉ chứa text thuần tên sản phẩm, không có ảnh, không có badge), trong khi luồng thanh toán nhanh lại hiển thị card bo góc viền đỏ nhạt, badge `SẢN PHẨM ĐÃ CHỌN`, ảnh giày thu nhỏ và tiêu đề riêng, tạo ra sự thiếu nhất quán về mặt thị giác.
     - **Khắc phục triệt để:**
       * **Đồng bộ khối Order Summary ([CartDrawer.tsx](file:///d:/HocTap/HK7/ChuyenDoiSo/project/nhom-2-ba-khi-shop/frontend/src/components/CartDrawer.tsx))**:
         - Áp dụng chung giao diện card cao cấp cho cả hai luồng thanh toán: Card viền mỏng bo góc 10px nền `#fff9fa`, badge đỏ `SẢN PHẨM ĐÃ CHỌN (SL)`, kèm ảnh thumbnail vuông vức, tên giày in đậm, thông tin cỡ/màu sắc/số lượng và giá tiền đỏ nổi bật cho từng sản phẩm.
         - Tạm tính của các sản phẩm được thanh toán hiển thị rõ ràng ở góc trên bên phải của card.
       * **Đồng bộ tiêu đề & thanh Freeship**:
         - Tiêu đề Drawer Header khi ở Checkout Mode đồng bộ hiển thị **`Đặt hàng nhanh`** (`direct_checkout_title`).
         - Thanh tiến trình Freeship hiển thị nhất quán ở cả 2 luồng dựa trên tổng số lượng sản phẩm được thanh toán (`activeItems`).
       * **Điểm khác biệt duy nhất được bảo toàn**:
         - Thanh toán nhanh: Đặt mua riêng sản phẩm đó, không tác động tới giỏ hàng `cart` hiện tại.
         - Thanh toán giỏ hàng: Đặt mua các sản phẩm đã tick chọn trong giỏ, sau khi đặt thành công chỉ xóa các sản phẩm đó khỏi giỏ.
  17. **Khắc Phục Triệt Để Lỗi POST /api/orders 400 Bad Request Khi Đặt Hàng (ADR-44):**
      - **Bối cảnh:** Khách hàng gặp lỗi `POST /api/orders 400 Bad Request` khi thực hiện đặt hàng trên website.
      - **Nguyên nhân cốt lõi:**
        1. Giới hạn Zod schema `color: z.string().max(30)` trong `backend/src/index.ts` quá ngắn. Một số mẫu sneaker (tiêu biểu là dòng giày bóng rổ `Anta KT8 Shock The Game Klay Thompson` có phối màu `Xanh Tím Neon Vịnh San Francisco` dài 32 ký tự) bị Zod validation chặn và trả về lỗi 400.
        2. Rủi ro lệch độ dài địa chỉ: Backend yêu cầu `min(10)` trong khi Frontend `CartDrawer` cho phép `minLength={8}`, khiến khách hàng nhập địa chỉ 8-9 ký tự bị lỗi 400.
        3. Rủi ro xử lý voucher và kiểu dữ liệu: Client có thể gửi `product_id` dạng chuỗi hoặc `voucher_code` rỗng.
      - **Khắc phục triệt để:**
        * **Nâng cấp Zod Validation Schema ([backend/src/index.ts](file:///d:/HocTap/HK7/ChuyenDoiSo/project/nhom-2-ba-khi-shop/backend/src/index.ts)):** Mở rộng `color: z.string().min(1).max(100)`, `size: z.string().min(1).max(30)`, `address: z.string().trim().min(5).max(500)`, `product_id: z.coerce.number().int().positive()`, `quantity: z.coerce.number().int().min(1).max(50)`, `voucher_code: z.string().trim().max(50).optional().nullable()`.
        * **Chuẩn hóa Logic Kiểm Tra:** So khớp size/color bằng `String(...).trim()`, chỉ kiểm tra voucher khi có code thực sự, gán `note || ''` an toàn.
        * **Đồng bộ Frontend ([CartDrawer.tsx](file:///d:/HocTap/HK7/ChuyenDoiSo/project/nhom-2-ba-khi-shop/frontend/src/components/CartDrawer.tsx)):** Chuẩn hóa payload với `product_id: Number(...)`, `quantity: Math.max(1, Number(...))`, `size: String(...).trim()`, `color: String(...).trim()`, `minLength={5}` cho ô địa chỉ.
        * **Kiểm thử tự động:** Đặt hàng thành công 100% (Status 201) cả với giày Anta KT8 màu dài 32 ký tự, đặt hàng giỏ hàng nhiều món + voucher ONE10, tra cứu đơn hàng qua API hợp lệ.
  18. **Loại Bỏ Nút Dấu X Trên Modal Trải Nghiệm Mua Sắm & Cookie (ADR-45):**
      - **Bối cảnh:** Modal "Trải nghiệm mua sắm & cookie" (`CookieConsentBanner`) trước đây có đồng thời 2 nút đóng: biểu tượng dấu "x" ở góc trên bên phải header và nút "Đóng" ở hàng nút hành động phía dưới. Việc này gây dư thừa điều hướng và lặp lại cùng một nhiệm vụ.
      - **Khắc phục ([CookieConsentBanner.tsx](file:///d:/HocTap/HK7/ChuyenDoiSo/project/nhom-2-ba-khi-shop/frontend/src/components/CookieConsentBanner.tsx)):**
        * Loại bỏ hoàn toàn phần tử button chứa icon `X` ở góc phải header.
        * Dọn dẹp import `X` và `COLORS` không dùng tới.
        * Header chỉ còn icon `ShieldCheck` và tiêu đề "Trải nghiệm mua sắm & cookie" được căn chỉnh gọn gàng, tinh tế.
        * Giữ nguyên nút "Đóng" (`cText.decline`) cạnh nút "Đồng ý & tiếp tục" (`cText.accept`) ở phía dưới.
  19. **Thanh Thông Báo Khi Từ Chối Cookie Ngay Dưới Topbar (ADR-46):**
      - **Bối cảnh:** Khi người dùng bấm nút "Đóng" tại modal "Trải nghiệm mua sắm & cookie", cần hiển thị một khung màu trắng với chữ màu đen in hoa ngay bên dưới thanh thông báo miễn phí vận chuyển trên cùng, nhắc nhở khách hàng rằng họ đã từ chối cookie và cung cấp nút bấm để đồng ý sử dụng cookie bất kỳ lúc nào; khi bấm đồng ý thì thanh này tự động biến mất.
      - **Khắc phục triệt để:**
        * **Quản lý Trạng Thái ([ShopContext.tsx](file:///d:/HocTap/HK7/ChuyenDoiSo/project/nhom-2-ba-khi-shop/frontend/src/context/ShopContext.tsx)):**
          - Bổ sung `isCookieDeclined: boolean` và `declineCookieConsent: () => void`.
          - Khi khách hàng bấm "Đóng" trên modal cookie, gọi `declineCookieConsent()` ghi nhận trạng thái từ chối vào `sessionStorage('one:cookie-declined', 'true')` và bật `isCookieDeclined = true`.
          - Khi khách hàng bấm "Đồng ý cho phép sử dụng cookie", hàm `acceptCookieConsent()` xóa `one:cookie-declined`, thiết lập `cookieConsent = true` và tự động tắt `isCookieDeclined = false`.
        * **Giao Diện Thanh Nhắc Nhở ([Header.tsx](file:///d:/HocTap/HK7/ChuyenDoiSo/project/nhom-2-ba-khi-shop/frontend/src/components/Header.tsx)):**
          - Đặt ngay bên dưới thanh `<div className="announcement">` (MIỄN PHÍ VẬN CHUYỂN TRONG NƯỚC...).
          - Khung màu trắng tinh khôi (`background: #ffffff`), viền mỏng phía dưới (`borderBottom: 1px solid #e4e4e7`), đổ bóng nhẹ.
          - Văn bản màu đen viết hoa toàn bộ (`color: #000000; text-transform: uppercase; font-weight: 700; letter-spacing: 0.04em;`).
          - Cụm từ hành động **"ĐỒNG Ý CHO PHÉP SỬ DỤNG COOKIE"** là nút bấm gạch chân in đậm (`fontWeight: 900`), hover chuyển đỏ thương hiệu, kích hoạt `acceptCookieConsent()` và loại bỏ thanh ngay lập tức.
        * **Từ Điển Đa Ngữ ([vi/common.ts](file:///d:/HocTap/HK7/ChuyenDoiSo/project/nhom-2-ba-khi-shop/frontend/src/locales/vi/common.ts) & [en/common.ts](file:///d:/HocTap/HK7/ChuyenDoiSo/project/nhom-2-ba-khi-shop/frontend/src/locales/en/common.ts)):**
          - Khai báo `declined_bar_prefix` và `declined_bar_action` chuẩn xác, không hardcode string.
  20. **Mặc Định Hiển Thị Khung Nhắc Cookie Dưới Topbar Cho Đến Khi Chấp Nhận (ADR-47):**
      - **Bối cảnh:** Thay vì chỉ hiển thị sau khi người dùng bấm nút "Đóng" trên modal, khách hàng yêu cầu khung thông báo màu trắng chữ đen in hoa được hiển thị mặc định ngay khi vào website; và chỉ được loại bỏ hoàn toàn khi khách hàng thực hiện chấp nhận sử dụng cookie.
      - **Khắc phục ([Header.tsx](file:///d:/HocTap/HK7/ChuyenDoiSo/project/nhom-2-ba-khi-shop/frontend/src/components/Header.tsx)):**
        * Chuyển điều kiện hiển thị của khối thông báo từ `isCookieDeclined && !cookieConsent` thành `!cookieConsent`.
        * Khi khách hàng mới truy cập hoặc chưa đồng ý cookie, thanh thông báo màu trắng chữ đen in hoa luôn hiển thị trang trọng ngay dưới Topbar.
        * Khi khách hàng bấm "ĐỒNG Ý CHO PHÉP SỬ DỤNG COOKIE" (trên thanh) hoặc "Đồng ý & tiếp tục" (trên modal góc phải), hàm `acceptCookieConsent()` kích hoạt, thiết lập `cookieConsent = true` và tự động loại bỏ khung thông báo này ngay lập tức.
  21. **Rà Soát Zero-Emoji, Đặt Toàn Bộ Text Thành Hằng & Đồng Bộ 1-1 Song Ngữ VI-EN (ADR-48):**
      - **Bối cảnh:** Người dùng yêu cầu rà soát toàn diện mã nguồn đảm bảo:
        1. 100% không chứa icon/emoji thô trong mã nguồn (chỉ sử dụng biểu tượng vector từ `lucide-react`).
        2. Mọi đoạn text hiển thị đều được đặt thành hằng trong hệ thống từ điển (`frontend/src/locales/`) và mã nguồn gọi qua hằng.
        3. Toàn bộ text Tiếng Việt và Tiếng Anh đối chiếu tồn tại 1-1 tuyệt đối (không thiếu key, khớp kiểu dữ liệu và chữ ký hàm).
      - **Kết quả rà soát & khắc phục triệt để:**
        * **Zero-Emoji Verification**: Quét regex toàn bộ cây thư mục `frontend/src/`, xác nhận **100% không có bất kỳ emoji thô nào**.
        * **Chuyển Đổi Text Hardcoded Thành Hằng Từ Điển**:
          - `Sneaker3DViewer.tsx`: Chuyển toàn bộ 10 chuỗi text/aria-label/loading/error thành `dict.common.viewer_3d` (`badge`, `toggle_autorotate_aria`, `stop_rotate`, `start_rotate`, `reset_view_aria`, `default_angle`, `instructions`, `loading_title`, `loading_pbr`, `load_error`).
          - `CartDrawer.tsx`: Chuyển `Xem lịch sử mua hàng` thành `cText.order_success.view_orders_btn`; chuyển `aria-label="Chọn ..."` thành `cText.select_item_aria(name)`.
          - `ProductCard.tsx`: Chuyển aria-label & title nút yêu thích thành `pc.wishlist_add_aria`, `pc.wishlist_remove_aria`, `pc.wishlist_saved_title`, `pc.wishlist_save_title`.
          - `ProductDetailModal.tsx`: Chuyển fallback mô tả sản phẩm thành `pm.default_description`.
          - `SizeGuideModal.tsx`: Chuyển aria-label nút đóng thành `sg.close_btn_aria`.
          - `ChatbotWidget.tsx`: Chuyển fallback tiêu đề tài liệu tham khảo thành `cb.default_doc_title`.
        * **Đồng Bộ Song Ngữ 1-1 Tuyệt Đối Giữa VI và EN**:
          - Đồng bộ `declined_bar_prefix` tiếng Anh thành `'TO EXPERIENCE ALL FEATURES AND SERVICES OF THE WEBSITE, PLEASE CLICK'` (khớp với bản cập nhật tiếng Việt của người dùng).
          - Chạy kiểm thử đệ quy tự động `test_deep_compare.mjs` qua toàn bộ 5 module (`common`, `product`, `checkout`, `messages`, `modals`), xác nhận **khớp 1-1 tuyệt đối 100%** giữa VI và EN.
  22. **Dịch Toàn Diện Tên Màu Sắc Sang Tiếng Anh Chuẩn Sneaker Quốc Tế (ADR-49):**
      - **Bối cảnh:** Khi người dùng chuyển ngôn ngữ website sang Tiếng Anh (`ENG`), các nhãn màu sắc tại thẻ sản phẩm (`ProductCard`), cửa sổ chi tiết sản phẩm (`ProductDetailModal`), giỏ hàng & thanh toán (`CartDrawer`) và lịch sử tra cứu đơn hàng (`app/orders/page.tsx`) vẫn hiển thị chuỗi Tiếng Việt thô lấy từ cơ sở dữ liệu (`Cam Lửa Bạc`, `Trắng Đen Phối Đỏ Neon`, `Trắng Phối Cam Cháy`, `Vàng Chanh Phối Tím Neon`, v.v.).
      - **Khắc phục triệt để:**
        * **Xây dựng Bảng Ánh Xạ Màu Sắc 1-1 (`colors_map`)**:
          - Trích xuất toàn bộ 115 tên màu sắc độc nhất từ cơ sở dữ liệu sản phẩm.
          - Bổ sung `colors_map` vào [frontend/src/locales/vi/product.ts](file:///d:/HocTap/HK7/ChuyenDoiSo/project/nhom-2-ba-khi-shop/frontend/src/locales/vi/product.ts) (ánh xạ chính nó) và [frontend/src/locales/en/product.ts](file:///d:/HocTap/HK7/ChuyenDoiSo/project/nhom-2-ba-khi-shop/frontend/src/locales/en/product.ts) với bản dịch tiếng Anh sang trọng, chuẩn thuật ngữ sneaker quốc tế (ví dụ: `Cam Lửa Bạc` → `Silver Fire Orange`, `Trắng Phối Cam Cháy` → `White & Burnt Orange`, `Vàng Chanh Phối Tím Neon` → `Lemon Yellow & Neon Purple`, `All White (Trắng Tinh Khôi)` → `Triple White`, `Trắng Đen (Panda)` → `White Black (Panda)`).
        * **Cập nhật Giao Diện Hiển Thị**:
          - [ProductCard.tsx](file:///d:/HocTap/HK7/ChuyenDoiSo/project/nhom-2-ba-khi-shop/frontend/src/components/ProductCard.tsx): Cả tiêu đề `pc.select_color` kèm màu được chọn và từng pill/chip chọn màu đều hiển thị thông qua `dict.product.colors_map[col] || col`.
          - [ProductDetailModal.tsx](file:///d:/HocTap/HK7/ChuyenDoiSo/project/nhom-2-ba-khi-shop/frontend/src/components/ProductDetailModal.tsx): Nhãn `pm.color_label` và các nút chip chọn màu đều hiển thị qua `dict.product.colors_map[col] || col`.
          - [CartDrawer.tsx](file:///d:/HocTap/HK7/ChuyenDoiSo/project/nhom-2-ba-khi-shop/frontend/src/components/CartDrawer.tsx): Tên màu của sản phẩm trong giỏ và trong danh sách tóm tắt thanh toán đều hiển thị qua `dict.product.colors_map[item.color] || item.color`.
          - [app/orders/page.tsx](file:///d:/HocTap/HK7/ChuyenDoiSo/project/nhom-2-ba-khi-shop/frontend/src/app/orders/page.tsx): Tên màu của sản phẩm trong lịch sử tra cứu đơn hàng hiển thị qua `dict.product.colors_map[item.color] || item.color`.
        * **Bảo Toàn Validation Backend**:
          - State lưu trữ `selectedColor` và giá trị `item.color` gửi lên backend API `/api/orders` vẫn giữ nguyên chuỗi gốc của DB để validation `validColors.includes(item.color)` ở Backend Worker luôn vượt qua 100%.
        * **Kiểm Thử & Xuất Bản**:
          - Kiểm thử đối chiếu đệ quy `test_deep_compare.mjs` đạt 100% khớp 1-1 giữa VI và EN.
          - `npx tsc --noEmit` đạt 0 lỗi TypeScript.
          - `npm run build:frontend` xuất bản thành công toàn bộ bundle tĩnh vào `frontend/out/`.
  23. **Loại Bỏ Hoàn Toàn Các Cụm Từ "(no account needed)" Và "1-Step" Khỏi Toàn Bộ Hệ Thống (ADR-50):**
      - **Bối cảnh:** Người dùng yêu cầu loại bỏ tất cả các cụm từ liên quan tới `(no account needed)` và `1-Step` (hoặc các biến thể tương đương) khi hiển thị giao diện tiếng Anh, nhằm mang lại trải nghiệm tinh gọn, chuyên nghiệp và tránh lặp từ.
      - **Khắc phục triệt để:**
        * [frontend/src/locales/en/checkout.ts](file:///d:/HocTap/HK7/ChuyenDoiSo/project/nhom-2-ba-khi-shop/frontend/src/locales/en/checkout.ts):
          - `checkout_title`: `'1-Step fast checkout (no account needed)'` $\rightarrow$ `'Checkout'` (khớp hoàn toàn với bản Tiếng Việt `'Thanh toán'`).
          - `direct_checkout_title`: `'1-Step instant order (no account needed)'` $\rightarrow$ `'Fast Checkout'` (khớp với bản Tiếng Việt `'Đặt hàng nhanh'`).
          - `proceed_checkout`: `'PROCEED TO 1-STEP CHECKOUT'` $\rightarrow$ `'PROCEED TO CHECKOUT'` (khớp với bản Tiếng Việt `'TIẾN HÀNH THANH TOÁN'`).
          - `guest_badge`: `'Shipping Details (No account required):'` $\rightarrow$ `'Shipping Details:'` (khớp với bản Tiếng Việt `'Thông tin giao hàng:'`).
        * [frontend/src/locales/en/common.ts](file:///d:/HocTap/HK7/ChuyenDoiSo/project/nhom-2-ba-khi-shop/frontend/src/locales/en/common.ts):
          - `mobile_bar.checkout_sub`: `'(1-Step · COD)'` $\rightarrow$ `'Cash on delivery'` (khớp với bản Tiếng Việt `'Nhận hàng trả tiền'`).
        * [frontend/src/locales/en/product.ts](file:///d:/HocTap/HK7/ChuyenDoiSo/project/nhom-2-ba-khi-shop/frontend/src/locales/en/product.ts):
          - `modal.buy_now_btn`: `'BUY NOW (1-STEP CHECKOUT)'` $\rightarrow$ `'BUY NOW'` (khớp với bản Tiếng Việt `'MUA NGAY'`).
          - `modal.add_to_cart_btn`: Chuẩn hóa thành `'+ ADD TO CART'` (khớp với bản Tiếng Việt `'+ THÊM VÀO GIỎ HÀNG'`).
        * **Dọn Dẹp Cache & Đóng Gói Tĩnh**:
          - Quét sạch toàn bộ chunk cũ trong `frontend/.chunk-cache` và `frontend/out/_next/static/chunks` chứa các chuỗi này.
          - Chạy kiểm thử đệ quy tự động `test_deep_compare.mjs` đạt 100% khớp song ngữ 1-1.
          - Biên dịch TypeScript `npx tsc --noEmit` đạt 0 lỗi.
          - Xuất bản static export `npm run build:frontend` thành công 100%.
  24. **Đồng Bộ Song Ngữ Đoạn Mô Tả Sản Phẩm Tại Modal Chi Tiết Cho Toàn Bộ 70 Mẫu Giày (ADR-51):**
      - **Bối cảnh:** Khi người dùng xem chi tiết sản phẩm (`ProductDetailModal`) ở chế độ Tiếng Anh (`ENG`), trong khi nhãn phân loại, cỡ giày, màu sắc và nút bấm đã được dịch chuẩn, đoạn văn bản mô tả sản phẩm bên dưới giá tiền vẫn hiển thị văn bản Tiếng Việt thô lấy từ cơ sở dữ liệu (`selectedProduct.description`).
      - **Khắc phục triệt để:**
        * **Xây dựng Bảng Ánh Xạ Mô Tả Sản Phẩm Song Ngữ (`descriptions_map`)**:
          - Quét toàn bộ 70 mẫu giày sneaker Âu - Á trong cơ sở dữ liệu (từ ID 101 đến 170).
          - Bổ sung `descriptions_map` vào [frontend/src/locales/vi/product.ts](file:///d:/HocTap/HK7/ChuyenDoiSo/project/nhom-2-ba-khi-shop/frontend/src/locales/vi/product.ts) (map ID và tên sang mô tả gốc tiếng Việt) và [frontend/src/locales/en/product.ts](file:///d:/HocTap/HK7/ChuyenDoiSo/project/nhom-2-ba-khi-shop/frontend/src/locales/en/product.ts) với bản dịch tiếng Anh chuyên nghiệp, giàu thuật ngữ công nghệ sneaker (PEBA foam, ZoomX, Lightstrike Pro, GORE-TEX, Vibram Megagrip, Wave Plate, Li-Ning BOOM & Jiang Technology, Anta NitroEdge, v.v.).
        * **Cập nhật Giao Diện Hiển Thị ([ProductDetailModal.tsx](file:///d:/HocTap/HK7/ChuyenDoiSo/project/nhom-2-ba-khi-shop/frontend/src/components/ProductDetailModal.tsx))**:
          - Thay thế đoạn render tĩnh bằng cơ chế tra cứu động đa cấp theo ID hoặc tên sản phẩm:
            `dict.product.descriptions_map[selectedProduct.id] || dict.product.descriptions_map[selectedProduct.name] || selectedProduct.description || pm.default_description`.
          - Khi ở `vi`, hiển thị mô tả tiếng Việt nguyên bản; khi chuyển sang `en`, tự động hiển thị mô tả tiếng Anh tương ứng.
        * **Kiểm Thử & Xuất Bản**:
          - Kiểm thử đối chiếu đệ quy `test_deep_compare.mjs` đạt 100% khớp song ngữ 1-1.
          - `npx tsc --noEmit` đạt 0 lỗi TypeScript.
          - `npm run build:frontend` xuất bản toàn bộ bundle tĩnh mới vào `frontend/out/`.
  25. **Khắc Phục Triệt Để Toàn Bộ Text Chưa Dịch Tại Trang Lịch Sử Mua Hàng (/orders) (ADR-52):**
      - **Bối cảnh:** Khi người dùng xem trang Lịch sử mua hàng (`orders/page.tsx`) ở chế độ Tiếng Anh (`ENG`), xuất hiện các đoạn text vẫn còn hiển thị Tiếng Việt thô chưa được dịch:
        1. Số lượng đơn hàng tìm thấy: `Orders found: 9 đơn hàng` (chữ `đơn hàng` bị hardcode).
        2. Nhãn số điện thoại người nhận: `Số điện thoại: 0395724805` (chữ `Số điện thoại` bị hardcode).
        3. Ghi chú đơn hàng: `Note: [Hình thức: COD]` (tiền tố `[Hình thức: COD]` lưu trong database chưa được dịch).
        4. Thanh chính sách đồng kiểm dưới cùng mỗi card đơn: `Chính sách đồng kiểm tận nơi: Kiểm tra đúng mẫu, đúng cỡ giày trước khi thanh toán COD.` (bị hardcode).
        5. Tiêu đề khối gợi ý tra cứu khi chưa tìm thấy đơn: `Tra cứu toàn bộ lịch sử đơn hàng` (bị hardcode).
        6. Nhãn gợi ý ô số điện thoại: `(Tra cứu toàn bộ đơn)` (bị hardcode).
        7. Định dạng ngày giờ: `new Date().toLocaleString('vi-VN')` cố định locale Việt Nam.
      - **Khắc phục triệt để:**
        * **Khai báo từ điển song ngữ ([vi/modals.ts](file:///d:/HocTap/HK7/ChuyenDoiSo/project/nhom-2-ba-khi-shop/frontend/src/locales/vi/modals.ts) & [en/modals.ts](file:///d:/HocTap/HK7/ChuyenDoiSo/project/nhom-2-ba-khi-shop/frontend/src/locales/en/modals.ts))**:
          - Bổ sung `all_orders_tip`: `'(Tra cứu toàn bộ đơn)'` $\leftrightarrow$ `'(Look up all orders)'`.
          - Bổ sung `orders_suffix`: `'đơn hàng'` $\leftrightarrow$ `'orders'`.
          - Bổ sung `recipient_phone_label`: `'Số điện thoại:'` $\leftrightarrow$ `'Phone Number:'`.
          - Bổ sung `inspection_policy`: `'Chính sách đồng kiểm tận nơi: Kiểm tra đúng mẫu, đúng cỡ giày trước khi thanh toán COD.'` $\leftrightarrow$ `'Doorstep inspection policy: Inspect correct model and shoe size before COD payment.'`.
          - Bổ sung `lookup_all_title`: `'Tra cứu toàn bộ lịch sử đơn hàng'` $\leftrightarrow$ `'Track Complete Order History'`.
          - Bổ sung `not_found_desc`: Mô tả hướng dẫn kiểm tra lại số điện thoại/mã đơn khi không tìm thấy đơn hàng.
        * **Đồng bộ mã nguồn ([orders/page.tsx](file:///d:/HocTap/HK7/ChuyenDoiSo/project/nhom-2-ba-khi-shop/frontend/src/app/orders/page.tsx))**:
          - Lấy `locale` từ `useShop()`.
          - Thay toàn bộ các chuỗi hardcode bằng các thuộc tính tương ứng từ `tText` (`dict.modals.tracking`).
          - Định nghĩa hàm `formatOrderNote(noteStr)` tự động chuyển đổi các tag phương thức thanh toán `[Hình thức: COD]` $\leftrightarrow$ `[Method: COD]` và `[Hình thức: Chuyển khoản QR]` $\leftrightarrow$ `[Method: Bank QR]` theo `locale` đang chọn.
          - Tự động định dạng thời gian đặt hàng theo `locale === 'en' ? 'en-US' : 'vi-VN'`.
        * **Đồng bộ tạo đơn hàng mới ([CartDrawer.tsx](file:///d:/HocTap/HK7/ChuyenDoiSo/project/nhom-2-ba-khi-shop/frontend/src/components/CartDrawer.tsx))**:
          - Khi khách đặt đơn bằng tiếng Anh, tự động lưu tag `[Method: COD]`.
        * **Kiểm Thử & Đóng Gói**:
          - Kiểm thử đối chiếu đệ quy `test_deep_compare.mjs` đạt 100% khớp song ngữ 1-1.
          - `npx tsc --noEmit` đạt 0 lỗi TypeScript.
          - `npm run build:frontend` xuất bản thành công bản tĩnh ra `frontend/out/`.
  26. **Viết In Hoa Toàn Bộ "PURCHASE HISTORY" Tại Breadcrumb Trang Đơn Hàng (ADR-53):**
      - **Bối cảnh:** Tại đường dẫn điều hướng (Breadcrumb) của trang Lịch sử mua hàng (`orders/page.tsx`), phần tử đích trước đây hiển thị chuỗi `Purchase history` (chữ thường) không đồng bộ với phần tử cha `HOME`.
      - **Khắc phục:**
        * Trong [orders/page.tsx](file:///d:/HocTap/HK7/ChuyenDoiSo/project/nhom-2-ba-khi-shop/frontend/src/app/orders/page.tsx): Thay thế `dict.common.footer.orders_link` bằng `dict.common.nav.my_orders`.
        * Kết quả: Breadcrumb hiển thị in hoa đồng bộ chuẩn xác:
          - Chế độ Tiếng Anh (`ENG`): **`HOME > PURCHASE HISTORY`**
          - Chế độ Tiếng Việt (`VIE`): **`TRANG CHỦ > LỊCH SỬ MUA HÀNG`**
  27. **Kiểm Tra & Đóng Gói:**
     - TypeScript compile: `npm run typecheck` đạt 0 lỗi.
     - Static Export: `npm run build:frontend` xuất bản thành công các route tĩnh vào `frontend/out/`.
  28. **Nâng Cấp Cổng Quản Trị Độc Lập /admin, Xác Thực Tài Khoản / Mật Khẩu PBKDF2 & Hệ Thống Quản Trị Toàn Diện (ADR-54):**
      - **Bối cảnh:** Cổng admin cũ nhúng qua query `?admin=1` trong AppShell của khách hàng và dùng token thô. Yêu cầu tách hẳn 1 cổng riêng độc lập với cổng public, đăng nhập bằng tài khoản và mật khẩu, trang bị đầy đủ tính năng: quản lý sản phẩm sneaker, quản lý đơn hàng chi tiết, khách hàng & khách tiềm năng (LTV), biểu đồ thống kê trực quan, xuất báo cáo CSV UTF-8 BOM, giao diện cứng cáp đơn giản trực quan.
      - **Triển khai:**
        * **Cơ sở dữ liệu D1 (`0009_admin_auth_and_analytics.sql`)**: Tạo bảng `admin_users` và `admin_sessions`, seed tài khoản `admin` / `admin@one.store` với mật khẩu khởi tạo `OneStore@2026` được băm an toàn qua PBKDF2 (salt ngẫu nhiên, 210.000 iterations).
        * **Backend Router (`backend/src/admin.ts`)**: Cung cấp trọn vẹn API xác thực session (`/api/admin/auth/login`, `/me`, `/logout`), quản lý đơn hàng kèm chi tiết món (`/api/admin/orders/:id`), phân tích khách hàng và phân khúc LTV (`/api/admin/customers/analytics`), biểu đồ thống kê (`/api/admin/analytics/overview`, `revenue-chart`, `top-products`), và xuất báo cáo CSV UTF-8 BOM mở bằng Excel không lỗi font (`/api/admin/export/:type`).
        * **Giao diện Quản trị Độc lập (`frontend/src/app/admin/page.tsx` & `admin.css`)**: Thiết kế Industrial Minimalist Dashboard theo tông cứng cáp, trực quan; Sidebar cố định 7 tabs nghiệp vụ; Modal chi tiết đơn hàng; Form thêm/sửa sneaker chọn size trực quan (38–45) và upload ảnh R2; Bảng biểu phân khúc khách VIP/Tiềm năng/Mới.
        * **Tách Biệt Tuyệt Đối**: Xóa bỏ link `?admin=1` khỏi `Footer.tsx` và ẩn toàn bộ widget/modal khách hàng khi ở route `/admin` qua `Providers.tsx`.
        * **Kiểm Thử & Đóng Gói**: TypeScript compile 0 lỗi, xuất bản static export ra `frontend/out/admin`.
   29. **Đồng Bộ Thời Gian Đặt Hàng Theo Giờ Máy Tính Truy Cập & Chuẩn Hóa ISO 8601 UTC (ADR-55):**
       - **Bối cảnh:**
         * Khách hàng đặt hàng thì hệ thống ghi nhận sai thời gian thực tế (chênh lệch 7 tiếng so với thực tế do SQLite `CURRENT_TIMESTAMP` lưu ngày giờ dạng `YYYY-MM-DD HH:MM:SS` ở múi giờ UTC nhưng thiếu ký tự `Z`, khiến trình duyệt khách parse chuỗi như là giờ local, gây lệch giờ hoặc lỗi hiển thị trên thiết bị).
       - **Khắc phục triệt để:**
         * **Gửi thời gian máy tính từ Client ([CartDrawer.tsx](file:///d:/HocTap/HK7/ChuyenDoiSo/project/nhom-2-ba-khi-shop/frontend/src/components/CartDrawer.tsx))**:
           - Khi khách hàng gửi yêu cầu checkout `POST /api/orders`, Client tự động truyền thuộc tính `client_time: new Date().toISOString()` lấy trực tiếp từ đồng hồ máy tính truy cập của khách.
         * **Backend Lưu Trữ Chuẩn ISO 8601 ([index.ts](file:///d:/HocTap/HK7/ChuyenDoiSo/project/nhom-2-ba-khi-shop/backend/src/index.ts))**:
           - Schema `checkoutSchema` nhận trường `client_time: z.string().max(60).optional().nullable()`.
           - Lệnh lưu `orders` sử dụng `client_time` (hoặc fallback UTC ISO `new Date().toISOString()`), đồng thời trả về `created_at` trong phản hồi `POST /api/orders` (HTTP 201).
         * **Hàm Tiện Ích Format Thời Gian An Toàn ([api.ts](file:///d:/HocTap/HK7/ChuyenDoiSo/project/nhom-2-ba-khi-shop/frontend/src/lib/api.ts))**:
           - Xây dựng hàm `formatDateTime(dateStr, locale)`: Tự động kiểm tra và gắn hậu tố `Z` (UTC) cho các bản ghi đơn hàng cũ từ SQLite thiếu timezone, sau đó chuyển đổi chính xác tuyệt đối sang giờ địa phương máy tính của khách thông qua `d.toLocaleString(locale === 'en' ? 'en-US' : 'vi-VN')`.
         * **Hiển Thị Đồng Bộ Khắp Giao Diện**:
           - Màn hình đặt hàng thành công (`CartDrawer.tsx`): Hiển thị ngay dòng thời gian đặt chuẩn giờ máy tính.
           - Trang lịch sử đơn hàng (`app/orders/page.tsx`): Sử dụng `formatDateTime(ord.created_at, locale)`.
           - Trang Quản trị (`app/admin/page.tsx`): Hiển thị đúng giờ máy tính quản trị viên trong bảng đơn và modal chi tiết.
         * **Kiểm Thử**:
           - Chạy xác minh 5/5 kịch bản qua script test, xác nhận `created_at` khớp chính xác từng mili-giây với thời gian máy tính gửi lên, `npm run build:frontend` xuất bản thành công.

---

   30. **Khởi Tạo Bộ Dữ Liệu Đơn Hàng Giả Lập Toàn Diện Từ 01/2026 Đến Hiện Tại (ADR-56):**
       - **Bối cảnh:**
         * Người dùng yêu cầu xóa toàn bộ đơn hàng thử nghiệm cũ và sinh dữ liệu đơn hàng giả lập chuẩn xác, trải dài từ đầu năm 2026 đến nay nhằm phục vụ hiển thị biểu đồ doanh thu, báo cáo và phân khúc khách hàng trên Admin Portal và trang Lịch sử đơn hàng.
       - **Triển khai chi tiết:**
         * **Tuân thủ quy trình an toàn (Skill accidental-data-loss-prevention)**: Đã dừng lại và nhận được sự phê duyệt rõ ràng từ người dùng trước khi thực thi lệnh xóa CSDL.
         * **Xóa sạch dữ liệu cũ**: Xóa toàn bộ bản ghi theo thứ tự ràng buộc khóa ngoại: `DELETE FROM order_events`, `DELETE FROM order_items`, `DELETE FROM orders`.
         * **Bộ dữ liệu giả lập 175 đơn hàng (`seed_mock_orders_2026.sql`)**:
           - **Thời gian**: Trải dài đều đặn từ ngày `02/01/2026` đến `02/11/2026` (11 tháng), thời gian đặt từ 8h00 sáng đến 22h30 tối chuẩn giờ Việt Nam và lưu định dạng ISO 8601 UTC.
           - **Doanh thu thực tế**: Đạt hơn **803.111.000 VNĐ**, giá trị trung bình đơn hàng (AOV) ~ **5.318.000 VNĐ** (khớp với phân khúc giày sneaker authentic từ 1–3 đôi mỗi đơn).
           - **Trạng thái thực tế**: 151 đơn `completed` (86%), 16 đơn `cancelled` (9%), 5 đơn `shipping`, 2 đơn `confirmed`, 1 đơn `pending` mới nhận.
           - **Phân khúc 31 khách hàng**: 26 khách VIP (chi tiêu > 10 triệu hoặc từ 3 đơn trở lên), 4 khách tiềm năng, 1 khách mới. Khách hàng thân thiết có lịch sử mua nhiều lần (ví dụ: Trần Phương Đoàn 14 đơn - 79.4 triệu, Lê Thanh Tùng 16 đơn - 60 triệu).
           - **Sản phẩm & Thương hiệu**: Phân bổ đều trên 70 mẫu giày chính hãng (Salomon ACS Pro, Nike Vaporfly 3, Adidas Samba OG, Salomon XT-4, Salomon XT-6, New Balance 550,...).
         * **Kiểm Thử**:
           - Nạp thành công vào CSDL D1 local.
           - API `/api/admin/analytics/overview` và `/api/admin/customers/analytics` phản hồi chuẩn xác.
           - Tra cứu số điện thoại trên `/api/orders/lookup` trả về đầy đủ lịch sử đơn hàng kèm danh mục sản phẩm và thời gian máy tính chính xác.

---

   31. **Xây Dựng Bộ Tài Liệu Chính Sách Toàn Diện, Trang /policies Song Ngữ & Nạp Sẵn Tri Thức RAG Chatbot (ADR-57):**
       - **Bối cảnh:**
         * Chuẩn bị nền tảng kiến thức thực tế (Ground Truth) phục vụ tích hợp Trợ lý AI Chatbot "Tư vấn One" theo yêu cầu người dùng: Cần xây dựng toàn bộ hệ thống chính sách bán hàng của cửa hàng và hệ thống, đưa lên website trước để khách hàng tra cứu minh bạch và làm tiền đề bộ nhớ cho Chatbot.
       - **Triển khai chi tiết:**
         * **Bộ 6 chính sách cốt lõi hoàn chỉnh**:
           1. *Cam kết Chính hãng 100%*: Bồi hoàn 200% nếu phát hiện hàng giả, sản phẩm nguyên hộp nguyên tag, kiểm định 3 lớp uỷ quyền.
           2. *Vận chuyển & Đồng kiểm tận nơi*: Freeship toàn quốc từ 3 đôi (hoặc đơn từ 5.000.000đ), đơn dưới 3 đôi đồng giá 30.000đ. Khách hàng được quyền mở hộp kiểm tra đúng mẫu, đúng cỡ giày trước khi thanh toán tiền mặt (COD).
           3. *Đổi trả & Đổi cỡ 7 ngày*: Miễn phí 100% cước đổi cỡ giày lần đầu tiên trong 7 ngày, đổi sang mẫu khác linh hoạt.
           4. *Bảo hành chất lượng 6 – 12 tháng*: Bảo hành 6 tháng cho giày marathon Carbon (Vaporfly, Adios Pro, Metaspeed, Feidian) và 12 tháng cho giày Lifestyle/Outdoor (Samba, AF1, 550, XT-6), hỗ trợ dán keo ép nhiệt trọn đời.
           5. *Bảo mật thông tin & Cookie*: Mua hàng nhanh không cần tài khoản, Cookie Consent Gating minh bạch, cam kết 100% không bán dữ liệu cho bên thứ ba.
           6. *Cẩm nang chọn cỡ giày chuẩn Âu – Á*: 3 bước đo chiều dài bàn chân tại nhà, bảng quy đổi EUR/US/UK/CM và lời khuyên phom chân bè Á Đông.
         * **Trang Web /policies Chuyên Biệt ([frontend/src/app/policies/page.tsx](file:///d:/HocTap/HK7/ChuyenDoiSo/project/nhom-2-ba-khi-shop/frontend/src/app/policies/page.tsx))**:
           - Thiết kế responsive cao cấp, thanh 6 tabs điều hướng ngang mượt mà, hỗ trợ deep-linking URL `?tab=...`.
           - Song ngữ Việt - Anh 1-1 qua [locales/vi/policies.ts](file:///d:/HocTap/HK7/ChuyenDoiSo/project/nhom-2-ba-khi-shop/frontend/src/locales/vi/policies.ts) và [locales/en/policies.ts](file:///d:/HocTap/HK7/ChuyenDoiSo/project/nhom-2-ba-khi-shop/frontend/src/locales/en/policies.ts).
           - Tích hợp liên kết `CHÍNH SÁCH` trên Header navigation và liên kết từng điều khoản trong Footer.
         * **Nạp Sẵn Dữ Liệu Vào CSDL Tri Thức Chatbot RAG (`0010_seed_store_policies_knowledge.sql`)**:
           - Nạp 6 tài liệu chính sách và 13 chunks nội dung chi tiết vào bảng `chat_documents` và `chat_chunks` trong CSDL D1 `fashion_db`.
         * **Kiểm Thử & Đóng Gói**:
           - `npx tsc --noEmit` đạt 0 lỗi.
           - `npm run build:frontend` biên dịch thành công 7/7 pages tĩnh ra `frontend/out/`.
           - `GET /policies/` phản hồi HTTP 200 OK (22.6 KB).

---


   32. **Khắc Phục Triệt Để Lỗi Tái Phát Ảnh Không Đồng Bộ Khi Chuyển Sang Tài Khoản Cloudflare Mới (`one-store-images`):**
       - **Bối cảnh & Nguyên nhân gốc:**
         * Sau khi kích hoạt R2 và chuyển sang tài khoản Cloudflare mới (`onestoresportsshoes@gmail.com`), do bucket `one-store-images` ban đầu trống, quá trình sync đã vô tình dùng lại danh mục Unsplash tĩnh trong `crawl-and-sync-sneakers.mjs`.
         * Điều này làm tái phát lỗi lệch thương hiệu và lệch sản phẩm (ADR-22): Anta C202 GT Pro hiển thị giày Puma trắng, Li-Ning Shadow 2 hiển thị giày Nike nâu, Li-Ning Feidian 3.0 hiển thị người mẫu đeo giày Jordan, Mizuno Wave Rebellion Pro 2 hiển thị giày bóng rổ Nike đen.
       - **Triển khai khắc phục toàn diện theo quy chuẩn ADR-22:**
         * **Tái kích hoạt Script Đồng Bộ Xác Thực Thương Hiệu ([scripts/sync-authentic-sneaker-images.mjs](file:///d:/HocTap/HK7/ChuyenDoiSo/project/one-store/scripts/sync-authentic-sneaker-images.mjs))**:
           - Ràng buộc đối sánh thương hiệu nghiêm ngặt: loại trừ 100% tên của 9 thương hiệu đối thủ, kiểm tra từ khóa cấm (`BLACKLIST_WORDS`), magic bytes ảnh JPEG/PNG/WebP.
           - Thu thập ảnh chụp studio góc ngang chính hãng từ CDN chính thức (`assets.adidas.com`, `images.puma.com`, `images.asics.com`, `images.stockx.com`, `lining-goods-online`, `anta.com`, `antosports.com`, `runrepeat.com`).
         * **Tải lên R2 & Đồng bộ D1 Remote**:
           - Tải lên 70/70 ảnh vào bucket `one-store-images` qua endpoint `POST https://one-store.onestoresportsshoes.workers.dev/api/admin/images`.
           - Cập nhật 70 câu lệnh `UPDATE products SET image_key = ... WHERE id = ...` vào CSDL D1 Remote `fashion_db` qua migration `0014_fix_authentic_sneaker_images.sql`.
           - Xóa bộ nhớ đệm KV cache key `products:v1` trên namespace binding `CACHE` để khách truy cập nhận ảnh mới ngay lập tức.
           - Cập nhật mảng `fallbackImages` trong `frontend/src/lib/api.ts`.
           - Biên dịch `npm run build:frontend` và triển khai `npx wrangler deploy` lên `https://one-store.onestoresportsshoes.workers.dev` (Version ID: `4d9d4e62-89cf-48d4-9c92-a7ddefbd654e`).
       - **Kết quả nghiệm thu 100%**:
         * `Anta C202 GT Pro Carbon Racing`: Ảnh chuẩn Anta C202 GT đĩa carbon cam lửa từ đại lý ủy quyền Antosports (51.4 KB, HTTP 200).
         * `Li-Ning Shadow 2 Double Carbon`: Ảnh chuẩn Li-Ning Shadow 2 đĩa carbon đôi từ CDN Li-Ning (171.9 KB, HTTP 200).
         * `Li-Ning Feidian 3.0 Elite Carbon`: Ảnh chuẩn Li-Ning Feidian 3.0 Elite trắng từ RunningXpert (28.9 KB, HTTP 200).
         * `Mizuno Wave Rebellion Pro 2 Carbon`: Ảnh chuẩn Mizuno Wave Rebellion Pro 2 vát gót từ RunRepeat (600.9 KB, HTTP 200).

---


   33. **Chuẩn Hóa Thuật Toán PBKDF2 Cho Cổng Quản Trị Admin Trên Cloudflare Workers:**
       - **Vấn đề phát hiện**: Khi đăng nhập cổng admin tại `/admin`, Cloudflare Workers giới hạn số vòng lặp tối đa của PBKDF2 là 100.000 (`NotSupportedError: Pbkdf2 failed: iteration counts above 100000 are not supported`), trong khi mã nguồn trước đó khai báo 210.000 iterations.
       - **Khắc phục**:
         * Chuẩn hóa `iterations: 100000` trong hàm `derive()` tại [backend/src/admin.ts](file:///d:/HocTap/HK7/ChuyenDoiSo/project/one-store/backend/src/admin.ts).
         * Cập nhật `password_hash` tương ứng với 100.000 iterations cho tài khoản `admin` trong CSDL D1 Remote qua migration `0015_fix_admin_pbkdf2_hash.sql`.
         * Kiểm thử đăng nhập thực tế cả bằng username (`admin`) và email (`admin@one.store`) với mật khẩu `OneStore@2026` đều thành công 100% (HTTP 200).

---

   34. **Chuẩn Hóa Kiến Trúc Chatbot AI (RAG Pipeline) & Quy Trình 4 Bước Triển Khai Thực Tế:**
       - **Bối cảnh & Mục tiêu**: Xây dựng tài liệu hướng dẫn kỹ thuật tinh gọn, trực quan hóa toàn bộ kiến trúc Chatbot AI doanh nghiệp ứng dụng mô hình RAG (Retrieval-Augmented Generation) chống ảo giác cho hệ thống ONE STORE, kèm bộ câu lệnh Prompt mẫu cho AI Agent (Cursor, Antigravity, Claude Code) và sơ đồ kiến trúc không chồng chéo.
       - **Kiến trúc 6 thành phần cốt lõi của hệ thống Chatbot AI**:
         * *1. Giao diện (Frontend UI Widget)*: Bong bóng chat nổi (Floating Bubble), hộp thoại tin nhắn, hiệu ứng loading typing, tự động cuộn (auto-scroll) và hiển thị nhãn trích dẫn nguồn (Sources).
         * *2. Cổng điều phối (API Gateway Backend)*: Cloudflare Worker tiếp nhận route `POST /api/chat`, thực hiện kiểm duyệt bảo mật (Guardrails), giới hạn tần suất (Rate Limiting) và điều phối luồng RAG.
         * *3. Kho dữ liệu gốc (Knowledge Base)*: Bảng `knowledge_documents` trong Cloudflare D1 (SQLite) lưu toàn văn chính sách đổi trả 7 ngày, bảo hành 12 tháng, bảng quy đổi size giày nam/nữ và cẩm nang bảo quản.
         * *4. Mô hình nhúng (Embedding Model)*: Mô hình `@cf/baai/bge-m3` chuyển đổi câu hỏi và văn bản thành không gian vector toán học 1024 chiều.
         * *5. Cơ sở dữ liệu Vector (Vector Database)*: Cloudflare Vectorize (Index `ba-khi-knowledge`, 27 vectors 1024d) thực hiện truy vấn quét độ tương đồng Cosine Similarity Top 3-5 đoạn văn khớp nhất (< 30ms).
         * *6. Mô hình ngôn ngữ lớn (LLM)*: Mô hình `@cf/google/gemma-4-26b-a4b-it` suy luận dựa trên [System Prompt Chống Ảo Giác] + [Context Tri Thức Trích Dẫn] + [Câu Hỏi Khách Hàng] để sinh câu trả lời tự nhiên, thân thiện và chính xác 100%.
       - **Quy trình 4 bước triển khai thực tế**:
         * *Bước 1 - Chuẩn bị tri thức & Cắt đoạn (Smart Chunking)*: Thu thập chính sách, cắt đoạn 500-1000 ký tự, có gối đầu (overlap 100 ký tự) để giữ trọn vẹn ngữ cảnh.
         * *Bước 2 - Vector hóa & Nạp vào Vector DB (Indexing Pipeline)*: Chạy script nạp vector vào Vectorize và lưu toàn văn vào bảng SQL D1.
         * *Bước 3 - Xây dựng Pipeline RAG Backend (Retrieval + Generation)*: Xây dựng API `/api/chat` kết nối tuần tự: Vector hóa câu hỏi -> Tìm kiếm tương đồng Cosine -> Lấy text gốc từ D1 -> Đóng gói Prompt -> Kích hoạt LLM.
         * *Bước 4 - Tích hợp Giao diện & Kiểm thử (UI & Evaluation)*: Tích hợp bong bóng chat vào website, kiểm thử 3 kịch bản: hỏi đúng chính sách, hỏi ngoài phạm vi nghiệp vụ và kiểm tra hiển thị sources.
       - **Chuẩn hóa Sơ đồ Kiến trúc Phân tầng (Zero-Crossing Architecture Diagram)**:
         * Thiết kế sơ đồ 4 tầng phân lập rõ ràng: Tầng 1 (Client) -> Tầng 2 (Gateway) -> Tầng 3 (AI Core) -> Tầng 4 (Persistence).
         * Tách biệt 2 luồng hoạt động: Luồng xanh lá `[A1-A4]` (Offline Indexing định kỳ) và Luồng xanh dương `[1-10]` (Online Inference thời gian thực), đảm bảo trực quan, không bị cắt chéo đường nét hay đè chữ.
       - **Trạng thái lưu trữ**: Đã ghi nhận toàn bộ giải pháp kỹ thuật, tài liệu hướng dẫn và mã nguồn prompt vào bộ nhớ dự án để phục vụ các phiên làm việc tiếp theo.

---

   35. **Thiết Kế Lại Toàn Diện Tài Liệu Hướng Dẫn Xây Dựng Chatbot AI (Kiến Trúc RAG) Ra File Word (.docx) Và PDF (.pdf) (ADR-58):**
       - **Bối cảnh & Yêu cầu**:
         * Người dùng yêu cầu thiết kế lại tài liệu kỹ thuật `HUONG_DAN_XAY_DUNG_CHATBOT_AI.txt` theo tiêu chuẩn kỹ thuật chuyên nghiệp: "Ít chữ – Nhiều hình – Dễ hiểu – Dễ thực hiện".
         * Định dạng xuất bản: Microsoft Word `.docx` (Times New Roman, cỡ 13pt, màu chữ đen, nền trắng, bảng viền đen, khoảng cách dòng 1.2x, đánh số trang, mục lục) và bản xuất PDF `.pdf`.
         * Cấu trúc chuẩn mực 4 phần:
           - *Phần I*: Cấu trúc Chatbot AI doanh nghiệp (6 thành phần, sơ đồ kiến trúc 2 luồng Offline Indexing & Online RAG phân lập, lưu ý RAG không loại bỏ ảo giác 100% mà giảm thiểu rủi ro qua tri thức xác thực).
           - *Phần II*: Quy trình triển khai 4 bước chuẩn mẫu (Template tổng quát cho mọi dự án: Đầu vào → Công việc thực hiện → Đầu ra, các thông số là tham số cấu hình).
           - *Phần III*: Khung Prompt điều khiển AI Agent (chia nhỏ 4 nhóm tương ứng 4 bước, mỗi bước gồm: Mục đích, Prompt mẫu tổng quát có biến, Prompt thực tế One Store, Khung dán ảnh minh chứng `[ DÁN ẢNH THỰC THI PROMPT BƯỚC ... TẠI ĐÂY ]`, Kết quả; Mục 3.5: Mô hình 6 thành phần Role-Context-Objective-Requirements-Constraints-Output).
           - *Phần IV*: Kết quả triển khai thực tế One Store (3 khung dán ảnh: Giao diện chatbot, Kết quả Q&A Demo, Kết quả kiểm thử API; Bảng tổng kết nghiệm thu có cột `[Bổ sung kết quả]` không tự bịa số liệu).
       - **Triển khai chi tiết**:
         * Tự động sinh 4 sơ đồ trực quan độ phân giải cao 300 DPI (`architecture_diagram.png`, `workflow_diagram.png`, `rag_pipeline_diagram.png`, `prompt_framework_diagram.png`).
         * Xây dựng script biên tập `scripts/build_chatbot_doc.py` và `scripts/docx_helpers.py` xuất bản `docs/HUONG_DAN_XAY_DUNG_CHATBOT_AI.docx` (1.5 MB).
         * Tự động chuyển đổi qua Word COM ra `docs/HUONG_DAN_XAY_DUNG_CHATBOT_AI.pdf` (5.0 MB).
       - **Nghiệm thu**: Đáp ứng 100% các tiêu chí kiểm tra, định dạng Times New Roman 13pt, bảng viền đen, bố cục thoáng đãng và có tính ứng dụng cao cho nhiều dự án.

---

   36. **Chuẩn Bị Môi Trường Trắng (Clean State) Để Tái Xây Dựng Chatbot AI RAG Theo Prompt Mẫu Báo Cáo:**
       - **Bối cảnh & Yêu cầu**: Người dùng cần lấy tư liệu thực tế (hình ảnh thực thi, log terminal, kết quả API) để đưa vào tài liệu báo cáo chuyển đổi số, do đó cần lưu trữ toàn bộ trạng thái hiện tại lên Git, sau đó làm sạch mọi thành phần Chatbot cũ và giữ nguyên vẹn tài liệu hướng dẫn để xây dựng lại từ đầu qua 4 bước prompt.
       - **Triển khai chi tiết**:
         * **Lưu trữ toàn vẹn lên Git**: Đã commit (`2a3619b`) và push thành công lên GitHub remote repo `courseprojectICTU/one-store.git` nhánh `main`.
         * **Dọn dẹp Runtime Code Chatbot**:
           - Xóa `frontend/src/components/ChatbotWidget.tsx` và unmount khỏi `Providers.tsx`.
           - Xóa `backend/src/chatbot.ts` và unmount route `/api/chat` khỏi `backend/src/index.ts`.
           - Xóa `backend/migrations/0010_seed_store_policies_knowledge.sql` để sẵn sàng cho Bước 1 tái tạo.
         * **Dọn dẹp CSDL D1 Local**:
           - Xóa sạch 6 documents chính sách (`id LIKE 'doc-%'`) và 13 chunks tri thức cũ trong bảng `chat_documents` và `chat_chunks` của CSDL D1 local nhằm chống trùng lặp khóa chính hoặc chồng chéo nội dung khi chạy Bước 1.
         * **Bảo tồn 100% tài liệu & công cụ sinh hướng dẫn**:
           - Giữ nguyên `HUONG_DAN_XAY_DUNG_CHATBOT_AI.txt`.
           - Giữ nguyên `docs/HUONG_DAN_XAY_DUNG_CHATBOT_AI.docx` (1.5 MB) và `docs/HUONG_DAN_XAY_DUNG_CHATBOT_AI.pdf` (5.0 MB).
           - Giữ nguyên thư mục ảnh sơ đồ 300 DPI `docs/images/` và các scripts `build_chatbot_doc.py`, `docx_helpers.py`, `convert_to_pdf.py`, `generate_diagrams.py`.

---

   37. **Khắc Phục Triệt Để Lỗi Ảnh 404 Local Dev & Lỗi Xác Thực Đăng Nhập Cổng Admin:**
       - **Khắc phục lỗi mất ảnh sản phẩm trên local dev (`wrangler dev`)**:
         * *Nguyên nhân*: Khi đổi bucket R2 sang `one-store-images`, Miniflare local khởi tạo bucket rỗng (0 objects) và CSDL D1 local chưa nhận migration `0014_fix_authentic_sneaker_images.sql`, dẫn đến toàn bộ ảnh trả về 404.
         * *Khắc phục*:
           1. Cập nhật đồng bộ 70 `image_key` chính hãng của 70 sản phẩm trong CSDL D1 local khớp 100% với Production.
           2. Bổ sung cơ chế Fallback Proxy & Local R2 Caching thông minh tại `GET /api/images/:key` trong `backend/src/index.ts`: Tự động kéo ảnh gốc từ Production Worker về lưu vào R2 local Miniflare nếu local chưa có, đảm bảo offline-ready.
           3. Pre-warm lưu sẵn 70/70 ảnh vào R2 local, nghiệm thu: `LOCAL DEV IMAGE TEST RESULT: 70 SUCCESS, 0 FAILED`.
       - **Khắc phục lỗi đăng nhập Cổng Admin (`admin` / `OneStore@2026`)**:
         * *Nguyên nhân*: Bảng `admin_users` trong CSDL D1 local vẫn lưu mã hash cũ của 210.000 iterations PBKDF2, trong khi `backend/src/admin.ts` đã chuẩn hóa sang 100.000 iterations để tương thích giới hạn của Cloudflare Workers Web Crypto.
         * *Khắc phục*: Cập nhật hash mới `8b6125635a5b8a9d7aabf4258626dcedc3dfdee60e35029a480bcca20c03dd6a` (tương ứng với mật khẩu `OneStore@2026` ở 100k iterations) vào bảng `admin_users` CSDL D1 local. Đăng nhập thành công 100% bằng cả username (`admin`) và email (`admin@one.store`) qua API `POST /api/admin/auth/login` (HTTP 200).
       - **Làm rõ tính năng Kho Tri Thức AI RAG trên Admin Portal**:
         * Xác định mục đích quản trị tri thức động chống ảo giác (Ground Truth).
         * Chuẩn bị sẵn sàng cho Bước 2 xây dựng API `POST /api/admin/knowledge` và `DELETE /api/admin/knowledge/:id`.

---

   38. **Xây Dựng Hoàn Chỉnh Chatbot AI RAG 'Tư Vấn One' Qua 4 Bước Chuẩn Doanh Nghiệp**:
       - **Bước 1: Chuẩn Bị Tri Thức & Smart Chunking**:
         * Tạo migration backend/migrations/0010_seed_store_policies_knowledge.sql nạp 7 nhóm tài liệu (6 chính sách bán hàng + 1 đặc tả 70 mẫu sneaker 10 thương hiệu Âu - Á) gồm 17 chunks vào CSDL D1.
         * Viết hàm splitIntoChunks(text, 1100, 140) ngắt thông minh tại ranh giới xuống dòng bảo toàn ngữ cảnh liền mạch.
       - **Bước 2: Vector Hóa & Indexing Cloudflare Vectorize**:
         * Viết hàm embed(c, texts) dùng @cf/baai/bge-m3 sinh vector 1024 chiều theo batch.
         * Xây dựng API POST /api/admin/knowledge (kèm cơ chế tự động rollback D1 khi Vectorize lỗi) và DELETE /api/admin/knowledge/:id.
         * Đồng bộ 100% 31 chunks tri thức vào Cloudflare Vectorize ba-khi-knowledge.
       - **Bước 3: Pipeline RAG Backend (Retrieval + Generation)**:
         * Xây dựng API POST /api/chat nhận câu hỏi, vector hóa, truy vấn Vectorize lấy Top-5 chunks, ghép 20 mẫu sneaker nổi bật và System Prompt chuyên gia tư vấn One.
         * Sử dụng LLM @cf/google/gemma-4-26b-a4b-it (temperature: 0.2, max_tokens: 1200) kèm cơ chế bóc tách reasoning nội tâm.
       - **Bước 4: Tích Hợp UI ChatbotWidget & Kiểm Thử Toàn Diện**:
         * Tạo frontend/src/components/ChatbotWidget.tsx chuẩn Bred Aesthetic (#0a0a0a & #e11d48, bo góc 20px, nút MessageSquare/X, hiển thị logo One, trạng thái online, sources badges chip, quick prompts).
         * Tích hợp vào frontend/src/components/Providers.tsx, biên dịch thành công Next.js 16 export ra frontend/out/.
         * Kiểm thử nghiệm thu 3 test cases: Tư vấn chân bè (Asics 2E/Mizuno/tăng 0.5-1 size), Freeship từ 3 đôi & quyền xỏ thử đồng kiểm, và Chống ảo giác (từ chối bán nồi cơm điện/áo thun).


   39. **Kế Hoạch Tối Ưu Hóa Bộ Lọc Giá & Lịch Sử Hội Thoại Đa Lượt (Lộ Trình Phiên Tiếp Theo)**:
       - **Bối cảnh & Phản hồi thực nghiệm từ người dùng**:
         * *Trường hợp 1 (Lọc giá)*: Khách hỏi 'Hãy liệt kê cho tôi những đôi giày có giá dưới 2 triệu', mô hình LLM Gemma tự nhẩm thủ công từng sản phẩm ('* Anta C202... (No)', '* Puma Suede... (YES)') dẫn đến cạn sạch 1200 tokens và bị cắt cụt câu trả lời.
         * *Trường hợp 2 (Lộ nháp kiểm tra)*: Khách hỏi tư vấn chân to màu đỏ chạy bộ, câu trả lời tốt nhưng bị lộ checklist tự chấm điểm ở đuôi ('* Short, polite? Yes... *Self-Correction during drafting').
         * *Trường hợp 3 (Mất ngữ cảnh)*: Khách hỏi tiếp 'vẫn tiêu chí trên nhưng tôi muốn giá giao động trong khoảng 2 - 3 triệu', bot mất ngữ cảnh màu đỏ và chạy bộ do API hiện tại chỉ nhận câu hỏi đơn lẻ (Stateless).
       - **Bản kế hoạch giải pháp 3 trụ cột đã được thống nhất**:
         1. **Trụ cột 1 - Hybrid Search & SQL Attribute Filter**:
            - Bổ sung hàm bóc tách ý định & thực thể (Rule-based / Regex Parser) trước khi vào LLM:
              + Trích xuất khoảng giá: 'dưới 2 triệu' -> `price <= 2000000`, 'từ 2 đến 3 triệu' -> `price BETWEEN 2000000 AND 3000000`.
              + Trích xuất phân loại & màu sắc: 'chạy bộ' -> `category = 'Running'`, 'màu đỏ' -> `colors LIKE '%đỏ%' OR colors LIKE '%cam%'`.
            - Truy vấn trực tiếp bảng `products` trong CSDL D1 lấy đúng 3 - 5 sản phẩm khớp 100% tiêu chí để nạp vào Prompt. LLM không còn phải đọc 70 sản phẩm để tính nhẩm, phản hồi tức thì và chính xác tuyệt đối.
         2. **Trụ cột 2 - Output Sanitizer & Triệt Tiêu Bản Nháp (CoT)**:
            - Viết hàm `cleanModelOutput(text)` bằng Regex loại bỏ triệt để:
              + Các dòng nhẩm so sánh: `* Model: Price (No/YES)`.
              + Các dòng tự chấm rubric: `* Tone: ...`, `* Constraints: ...`, `* Direct answer? Yes`.
              + Khối nháp tự sửa `*Self-Correction during drafting...`.
         3. **Trụ cột 3 - Multi-turn Conversation History**:
            - Nâng cấp API `POST /api/chat` nhận thêm mảng `history: Array<{ role: 'user' | 'assistant', text: string }>` (lưu 4 - 6 lượt chat gần nhất từ `ChatbotWidget.tsx`).
            - Cho phép bot kế thừa tiêu chí ở các câu hỏi liên đới ('vẫn tiêu chí trên', 'đôi đầu tiên có size 42 không?').

---

   40. **Triển Khai Hoàn Tất Gói Tối Ưu Hóa 3 Trụ Cột Cho Chatbot AI RAG 'Tư Vấn One'**:
       - **Trụ cột 1 (Hybrid Search & SQL Attribute Filter)**:
         * Xây dựng hàm `extractProductFilters(query, history)` bóc tách khoảng giá (`minPrice`, `maxPrice`), phân loại (`category: Running | Lifestyle | Basketball | Outdoor`), màu sắc (`color` qua Unicode regex tiếng Việt), thương hiệu (`brand`), và cờ nhận diện câu hỏi nối tiếp (`isFollowUp`).
         * Tự động lọc SQL parameterized query trực tiếp trên CSDL D1 `products` (`price >= ? AND price <= ? AND category = ? ... LIMIT 10`), loại bỏ triệt để hiện tượng đưa 70 mẫu thô khiến LLM tự nhẩm `(No)/(YES)` cạn tokens.
         * Cơ chế tinh lọc ngữ cảnh thông minh: Khi đã có SQL filter cụ thể, tự động loại bỏ chunk danh mục 70 mẫu tổng khỏi `knowledgeContext` của Vectorize để tiết kiệm >2000 prompt tokens và ngăn chặn mô hình nhẩm Keep/Skip.
       - **Trụ cột 2 (Output Sanitizer & Trích Xuất Reasoning Hoàn Hảo)**:
         * Phát hiện & xử lý nguyên nhân gốc rễ: Workers AI Gemma 4 sinh toàn bộ quá trình suy nghĩ và bản thảo câu trả lời tiếng Việt vào `reasoning_content` (chiếm 1600+ tokens) khiến `content` bị cắt cụt do chạm trần `finish_reason: "length"`.
         * Xây dựng hàm `extractAnswerFromReasoning(reasoning)` tự động cứu vớt bản thảo câu trả lời tiếng Việt hoàn chỉnh từ `reasoning_content` khi `finish_reason === 'length'` hoặc `content.length < 150`.
         * Nâng cấp hàm `cleanModelOutput(text)`: Triệt tiêu 100% các dòng checklist rubric, self-correction, so sánh Keep/Skip, nhãn tiếng Anh (`* Final Plan:*`, `* Recommendation:*`), và các dấu ngoặc kép rải rác.
       - **Trụ cột 3 (Multi-turn Conversation History)**:
         * Mở rộng `chatRequestSchema`: Chấp nhận `history: Array<{ role, text }>` với độ dài mỗi lượt `text: z.string().max(5000)`.
         * Cập nhật `ChatbotWidget.tsx` phía client: Tự động trích xuất 6 lượt tin nhắn gần nhất (`recentHistory.slice(-6)` với `text.slice(0, 2000)`) và gửi kèm payload `POST /api/chat`.
         * Làm sạch `history` bằng `cleanModelOutput` trước khi nạp vào `conversationMessages` của Google Gemma 4 nhằm chống hiện tượng lây nhiễm CoT / markdown bullet tiếng Anh (few-shot bias).
       - **Kết Quả Nghiệm Thu Thực Tế (100% Đạt Chuẩn)**:
         * *Kịch bản 1 ("giá dưới 2 triệu")*: Trả lời chính xác 2 mẫu `Anta Walker Retro Casual` (1.890.000₫) và `Puma Suede Classic XXI` (1.990.000₫), sạch 100% không còn nhẩm No/YES.
         * *Kịch bản 2 ("chân 45cm màu đỏ chạy bộ")*: Tư vấn khéo léo 45cm vs Size 45, hướng dẫn 3 bước đo chân, gợi ý chuẩn `Adidas Ultraboost Light` (4.190.000₫, màu Trắng Phối Đỏ Cam, có sẵn size 45) và `Li-Ning Shadow 2 Double Carbon`.
         * *Kịch bản 3 ("vẫn tiêu chí trên nhưng giá 2 - 3 triệu")*: Giữ nguyên ngữ cảnh chạy bộ và màu đỏ, gợi ý chính xác `Anta Mach 4 Speed Training` (2.490.000₫, màu Đen Đỏ) và `Li-Ning Rouge Rabbit 7 Pro` (2.190.000₫), nhắc nhở tinh tế về size và chính sách đồng kiểm tận nơi.
       - **Cải Tiến Bổ Sung - Trình Dựng Markdown Nội Bộ Zero-Dependencies Cho ChatbotWidget**:
         * *Vấn đề*: Frontend trước đây hiển thị `{m.text}` thô kèm `whiteSpace: 'pre-line'`, khiến các ký tự định dạng Markdown như `**Size 39 EUR**`, `**Đồng kiểm tận nơi**` bị lộ nguyên dấu hoa thị `**`.
         * *Khắc phục triệt để*: Xây dựng component `FormattedChatContent` an toàn XSS (không dùng `dangerouslySetInnerHTML`), tự động chuyển đổi `**text**` thành `<strong>` in đậm rõ nét, danh sách số (`1. `, `2. `) có số thứ tự đỏ thể thao `#e11d48` nổi bật, căn lề và thụt dòng chuẩn mực. Biên dịch tĩnh hoàn tất qua `npm run build:frontend`.

   41. **Tích Hợp Khung Thẻ Sản Phẩm Gợi Ý Tương Tác Trực Tiếp (Interactive Mini Product Cards) & Hoàn Thiện Định Dạng Markdown**:
       - **Bối cảnh & Yêu cầu**:
         * Khi khách hàng hỏi tư vấn giày thể thao, ngoài lời văn tư vấn bằng văn bản, khách hàng cần nhìn thấy ngay các thẻ sản phẩm thu nhỏ trực quan (ảnh sneaker studio, tên mẫu giày, giá tiền nổi bật, danh mục) ngay bên dưới tin nhắn trả lời của bot.
         * Khách hàng có thể bấm trực tiếp vào bất kỳ khung thẻ sản phẩm nào để mở tức thì Modal xem chi tiết sản phẩm (`ProductDetailModal`) nhằm chọn size, chọn màu và đặt mua hàng nhanh chóng mà không cần tìm kiếm thủ công.
       - **Triển khai chi tiết**:
         * **Backend Trích Xuất Sản Phẩm Gợi Ý (`backend/src/chatbot.ts`)**:
           - Mở rộng câu lệnh truy vấn sản phẩm để lấy đầy đủ các trường: `id, name, slug, category, description, price, compare_at_price, stock, sizes, colors, image_key, featured, created_at`.
           - So khớp thông minh: Lọc danh sách `suggestedProducts` dựa trên tên sản phẩm đầy đủ hoặc cụm từ khóa mô hình (`modelWords`) được nhắc tới trong lời văn của AI; hoặc fallback 3-4 mẫu khớp bộ lọc SQL.
           - Chuẩn hóa trường `sizes` và `colors` thành mảng JSON, sinh đường dẫn ảnh `/api/images/...`, trả về mảng `products: [...]` cùng `answer` và `sources` trong endpoint `POST /api/chat`.
         * **Frontend Thẻ Sản Phẩm Tương Tác (`frontend/src/components/ChatbotWidget.tsx`)**:
           - Mở rộng kiểu dữ liệu `ChatMessage` với trường tùy chọn `products?: Product[]` trong `frontend/src/types/index.ts`.
           - Tích hợp khối hiển thị thẻ sản phẩm bên dưới nội dung chat: Mỗi thẻ có ảnh vuông `imageOf(prod)`, tên giày, giá đỏ `#e11d48`, tag danh mục và nút `Xem` kèm icon `ChevronRight`.
           - Bắt sự kiện `onClick`: Gọi `setSelectedProduct(prod); setActiveModal('detail')` từ `ShopContext`, kích hoạt `ProductDetailModal` hiển thị lập tức với đầy đủ ảnh to, cẩm nang chọn size và nút MUA NGAY.
         * **Hoàn Thiện Bộ Dựng Markdown Phía Client**:
           - Xử lý triệt để ký tự gạch đầu dòng lồng nhau (`- *`, `* *`, `• *`) và dấu hoa thị đơn lẻ ở đầu câu trả lời, đảm bảo nội dung hiển thị phân cấp chuyên nghiệp, chữ in đậm sắc nét và không bao giờ lộ ký tự thô.
         * **Đóng Gói & Xuất Bản**:
           - `npm run typecheck` đạt 0 lỗi TypeScript.
           - `npm run build:frontend` xuất bản thành công bản tĩnh ra `frontend/out/`.

   42. **Khắc Phục Triệt Để Ký Tự Đặc Biệt Markdown (**, :**, Bullet Kép) & Chuẩn Hóa Danh Sách Số Trực Quan Trong Chatbot AI**:
       - **Bối cảnh & Phát hiện nguyên nhân gốc rễ**:
         * Khi khách hỏi tư vấn chân bè, câu trả lời của bot bị hiển thị các ký tự thô: `1. Ưu tiên các thương hiệu Châu Á:...**`, `Asics Gel-Nimbus 26 PureGEL:...**` và bị double bullet (`•` rồi tới `1. `).
         * *Nguyên nhân Backend*: Regex cũ `/(?:^|\n)\s*[-*•]\s*[-*•]\s*/g` và `[A-Za-z0-9/ ]+` trong `cleanModelOutput` đã vô tình xóa mất dấu mở `**` của tên sản phẩm, chỉ để lại dấu đóng `:**` ở cuối dòng.
         * *Nguyên nhân Frontend*: `FormattedChatContent` trước đây chỉ tách `**...**` hoàn chỉnh, nếu có token mồ côi hoặc thiếu mở `**`, nó render nguyên vẹn chuỗi `:**` và dấu hoa thị ra màn hình; đồng thời các dòng `- 1. ` bị coi là bullet thay vì danh sách số.
       - **Khắc phục toàn diện & triệt để**:
         * **Backend (`backend/src/chatbot.ts`)**:
           - Sửa regex chuẩn hóa bullet: `/(?:^|\n)\s*[-*•]\s+[-*•]\s+(?!\*)/g` bảo vệ nguyên vẹn dấu mở `**`.
           - Giới hạn regex lọc dàn ý chỉ khớp nhãn kỹ thuật tiếng Anh thực tế (`Final Plan|Recommendation|Draft|Step \d+|...`), không bao giờ can thiệp vào tên thương hiệu sneaker hay tiếng Việt.
           - Bổ sung cơ chế tự sửa chữa (Self-Healing): Tự động phát hiện và khôi phục dấu mở `**` nếu dòng có cấu trúc `Tên sản phẩm:**`.
         * **Frontend (`frontend/src/components/ChatbotWidget.tsx`)**:
           - Cơ chế chuẩn hóa đa tầng trước khi render:
             1. Khử lỗi double bullet: `- 1. ` -> `1. `.
             2. Chuẩn hóa `**1. Tiêu đề:**` -> `1. **Tiêu đề:**` giúp số thứ tự `1.` được tô đỏ nổi bật, tiêu đề in đậm hoàn hảo.
             3. Khôi phục tự động dấu `**` bị thiếu trước dấu hai chấm `:**`.
             4. **Nghiêm cấm ký tự đặc biệt rò rỉ**: Trong `parseInline`, mọi token không phải khối Markdown hợp lệ đều được làm sạch triệt để `token.replace(/[*_#~`]/g, '')`, đảm bảo không bao giờ còn sót bất kỳ dấu hoa thị hay ký tự rác nào trên màn hình.
         * **Kiểm Thử & Xuất Bản**:
           - `npm run typecheck` đạt 0 lỗi TypeScript.
           - `npm run build:frontend` xuất bản thành công bản tĩnh ra `frontend/out/`.
           - Kiểm thử thực tế câu hỏi chân bè: 100% văn bản sạch bóng ký tự thô, hiển thị danh sách số và thẻ sản phẩm tương tác hoàn mỹ.

   43. **Tối Ưu Hóa Multi-Turn Context Window & Cơ Chế Chịu Lỗi Tự Động (Resilience), Triệt Tiêu Hoàn Toàn Lỗi Outline Tiếng Anh & Lỗi 500**:
       - **Bối cảnh & Phát hiện nguyên nhân gốc rễ**:
         1. *Lỗi hệ thống 500*: Khi embedding Workers AI (`bge-m3`) gặp sự cố mạng chập chờn, API ném exception và fail 500, sau đó thông báo lỗi bị lưu vào lịch sử hội thoại và tái truyền vào LLM làm ô nhiễm ngữ cảnh các lượt sau.
         2. *Phình to Context Window*: Càng chat nhiều lượt, hệ thống nhồi nhét 4 lượt lịch sử dài + 10 sản phẩm mô tả đầy đủ + 5 chunks chính sách (>4500 tokens), khiến Google Gemma 4 bị quá tải ngữ cảnh (Attention Degradation) và sinh dàn ý tiếng Anh (`Direct answer`, `Proactive suggestion`, `Detail 1`, `Closing`) thay vì viết văn xuôi hoàn chỉnh.
         3. *Gợi ý mâu thuẫn khi lọc giá*: Khi khách hỏi ngân sách < 1 triệu, hệ thống nói shop không có nhưng fallback lấy 3 đôi 4-5 triệu hiển thị dưới card.
       - **Khắc phục toàn diện & triệt để**:
         * **Cơ chế chịu lỗi tự động (Resilient Fallback)**: Bọc try/catch cho `embed(c, [question])`, nếu embedding lỗi thì ghi nhận warning và tự động chuyển chế độ fallback trực tiếp không crash 500.
         * **Tối ưu hóa Context Window**:
           - Rút gọn mô tả sản phẩm `p.description.split('.')[0] + '.'`, giảm 70% token dữ liệu sản phẩm.
           - Giới hạn lịch sử hội thoại: Chỉ giữ 3 lượt gần nhất, cắt ngắn 450 ký tự mỗi lượt và lọc sạch các tin nhắn lỗi hệ thống.
           - Lọc thông minh tri thức: Chỉ nạp trích đoạn chính sách khi khách thực sự hỏi về đổi trả/bảo hành/freeship/size.
         * **Chống mâu thuẫn giá sàn**: Khi khách hỏi giá thấp hơn sàn kho hàng, tự động tìm 3 mẫu có giá thấp nhất cửa hàng (Anta Walker 1.890.000₫, Puma Suede 1.990.000₫) để tư vấn trung thực.
         * **Làm sạch Outline & Checklist**: Loại bỏ triệt để các nhãn lập dàn ý tiếng Anh và checklist rubric ở đuôi (`Polite, friendly, concise`, `No English headers`, `Only use provided data`).
         * **Kiểm Thử & Xuất Bản**:
           - `npm run typecheck` đạt 0 lỗi TypeScript.
           - `npm run build:frontend` xuất bản thành công bản tĩnh ra `frontend/out/`.
           - Kiểm thử thực tế chuỗi 4 lượt chat: Lượt 1 (dưới 1 triệu tư vấn chuẩn giá sàn 1.89m), Lượt 2 (hướng dẫn đặt hàng 4 bước không bị 500), Lượt 4 (hỏi tiếp màu đỏ chạy bộ trả lời mượt mà tự nhiên, 0 ký tự rác).

    44. **Triển Khai Hoàn Tất Tính Năng Chốt Đơn Tự Động Ngay Trong Chatbot (Agentic In-Chat Ordering) Ghi Thật Vào CSDL D1 & Đồng Bộ Tra Cứu Đơn Hàng**:
        - **Bối cảnh & Yêu cầu**:
          * Người dùng chính thức phê duyệt thiết kế quy trình 4 bước chốt đơn tự động (In-Chat Ordering) ngay trong Chatbot AI 'Tư vấn One'.
          * Yêu cầu đơn hàng không được sinh mã giả lập hay dừng ở mức minh họa, mà phải được thẩm định kho thực tế và thực thi ghi giao dịch thật vào CSDL Cloudflare D1 (`orders`, `order_items`, trừ `stock`, tăng lượt dùng voucher `ONE10`), cho phép khách tra cứu ngay trên `/orders`.
        - **Triển khai chi tiết**:
          * **Trụ Cột 1: Gom Thông Tin Đơn Hàng 1 Bước (`backend/src/chatbot.ts`)**:
            - Xây dựng hàm `extractOrderDetails(query, history, pendingOrder, allProducts)` bóc tách toàn diện ý định mua hàng (`isOrderIntent`), ý định chốt đơn (`isConfirmIntent`), ý định hủy (`isCancelIntent`), cùng các thực thể: `product` (so khớp điểm trọng số theo ngữ cảnh mới nhất và lượt nói của khách), `size`, `color`, `quantity`, `customerName`, `phone`, `address`.
            - Khi khách bày tỏ ý định mua nhưng chưa đủ dữ liệu: Bot phản hồi 1 lần duy nhất biểu mẫu gom thông tin ngắn gọn, tự động điền trước các thông tin đã thống nhất ở lượt trước (như size 39, tên mẫu giày) và liệt kê các phối màu thực tế của mẫu đó.
          * **Trụ Cột 2: Thẩm Định Kho Hàng & Thông Số Trên CSDL D1 (Inventory Validation)**:
            - Kiểm tra thời gian thực trên CSDL D1: Sản phẩm có tồn tại và còn đủ số lượng không (`stock >= quantity`), cỡ giày khách chọn có trong mảng JSON `sizes` không, màu sắc có khớp mảng JSON `colors` không, SĐT có đúng 10 chữ số không, địa chỉ có chi tiết không.
            - Nếu thông số chưa hợp lệ (ví dụ: chọn size 46 trong khi mẫu chỉ có 39-44): Báo lỗi lịch sự và liệt kê các size/màu thực tế đang có sẵn trong kho, ngăn chặn 100% tình trạng ảo giác tồn kho.
          * **Trụ Cột 3: Bảng Tóm Tắt & Nút Bấm Chốt Đơn Nhanh UI**:
            - Khi thông tin đã hợp lệ: Tính toán đơn giá, tạm tính, tự động áp dụng ưu đãi voucher thành viên `ONE10` (giảm 10%), phí vận chuyển (0đ nếu >= 3 đôi hoặc >= 5 triệu, ngược lại 30.000đ), tính tổng COD.
            - Xuất Bảng tóm tắt đơn hàng chuẩn mực, gửi kèm cờ `readyToConfirm: true` và payload `pendingOrder`.
            - Phía frontend (`ChatbotWidget.tsx`): Hiển thị nút bấm nhanh màu đỏ thể thao `[Chốt đơn ngay]` (có icon `CheckCircle2`, hiệu ứng hover) để khách bấm trực tiếp mà không cần gõ chữ.
          * **Trụ Cột 4: Thực Thi Giao Dịch Thật Vào CSDL Cloudflare D1 (Real D1 Transaction)**:
            - Khi khách nhắn `"Chốt đơn"` (hoặc bấm nút): Thực thi `c.env.DB.batch(...)` nguyên tử:
              1. Trừ tồn kho: `UPDATE products SET stock = stock - ? WHERE id = ? AND stock >= ?`.
              2. Tạo đơn hàng: `INSERT INTO orders (code, customer_name, phone, address, note, total, voucher_code, discount, created_at)`. Mã đơn sinh chuẩn `ONE-` + 8 ký tự hex ngẫu nhiên, ghi chú `[Đặt qua AI Chatbot One] [Hình thức: COD - Đồng kiểm xỏ thử]`.
              3. Tạo chi tiết đơn hàng: `INSERT INTO order_items (order_id, product_id, product_name, size, color, quantity, unit_price)`.
              4. Cập nhật voucher: `UPDATE vouchers SET used_count = used_count + 1 WHERE code = 'ONE10'`.
              5. Xóa cache danh sách sản phẩm: `CACHE.delete('products:v1')`.
            - Trả về mã đơn thật và khối dữ liệu `createdOrder`.
          * **Trụ Cột 5: Giao Diện Thẻ Xác Nhận VIP & Đồng Bộ Lịch Sử Mua Hàng**:
            - Trên UI ChatbotWidget: Hiển thị Thẻ xác nhận đơn hàng VIP màu xanh lá nhạt sang trọng (`ĐÃ LƯU VÀO HỆ THỐNG D1`), hiển thị mã đơn, nút sao chép mã đơn (`Copy`/`Check`), tóm tắt sản phẩm, và nút bấm `[Tra cứu đơn hàng]` điều hướng tức thì tới `/orders?code=ONE-XXXXXX`.
            - Tự động gọi `addRecentOrder(orderCode)` lưu vào thiết bị nếu khách đã đồng ý Cookie.
            - Tuân thủ nghiêm ngặt quy chuẩn Zero-Emoji (100% icon bằng `lucide-react`).
        - **Kết Quả Nghiệm Thu**:
          * `npm run typecheck` đạt 0 lỗi TypeScript toàn dự án.
          * `npm run build:frontend` xuất bản thành công 100% bản tĩnh ra `frontend/out/`.
          * Chạy script `run_acceptance_test.mjs`: Vượt qua 100% 5 bài test chấp nhận (Gom thông tin 1 bước, Từ chối size 46 không có sẵn, Xuất bảng tóm tắt kèm nút bấm, Ghi thật vào CSDL D1 thành công, Tra cứu qua API `/api/orders/lookup` trả về đúng 100% đơn hàng và sản phẩm trong CSDL D1).

    45. **Triển Khai Cơ Chế Phân Quyền Sandbox Cách Ly Dữ Liệu Demo Admin (Read-Only 100%)**:
        - **Bối cảnh & Yêu cầu**:
          * Cung cấp một tài khoản `demo` cho giảng viên, ban giám khảo và đối tác trải nghiệm toàn diện hệ thống quản trị One - Store trực tiếp từ trang đăng nhập `/admin` mà không cần biết mật khẩu quản trị chính.
          * Ràng buộc khắt khe: Tài khoản `demo` chỉ có quyền xem (Read-Only), tuyệt đối không được phép chỉnh sửa, thêm mới, xóa hay làm biến đổi bất kỳ dữ liệu sản phẩm, đơn hàng, mã giảm giá, tài liệu tri thức hay đổi mật khẩu quản trị.
        - **Triển khai Backend (`backend/src/admin.ts`, `backend/src/index.ts`, `backend/src/commerce.ts`, `backend/src/chatbot.ts`)**:
          * Migration `0016_seed_demo_admin_sandbox.sql`: Tạo tài khoản username `demo`, email `demo@one.store`, role `demo`, mật khẩu băm PBKDF2 `DemoAdmin@2026`.
          * Middleware `requireWritePermission`: Kiểm tra session người dùng, nếu `user.role === 'demo'` lập tức chặn lại với mã lỗi HTTP 403 Forbidden: `Tài khoản demo chỉ có quyền xem dữ liệu (Read-Only Sandbox). Bạn không thể chỉnh sửa, thêm mới hoặc xóa dữ liệu này.`.
          * Chặn 100% các thao tác thay đổi trạng thái đơn hàng (`PATCH /api/admin/orders/:id`), xóa/thêm sản phẩm (`POST`, `DELETE /api/admin/products`), đổi mật khẩu (`POST /api/admin/auth/change-password`), tạo voucher (`POST /api/commerce/vouchers`), thêm/xóa tài liệu tri thức RAG (`POST`, `DELETE /api/admin/knowledge`).
          * Endpoint đăng nhập 1-click: `POST /api/admin/auth/demo-login` cấp session token hợp lệ cho tài khoản demo trong 24 giờ.
        - **Triển khai Frontend (`frontend/src/app/admin/page.tsx`, `frontend/src/app/admin/admin.css`)**:
          * Thẻ "TRẢI NGHIỆM TÀI KHOẢN DEMO (SANDBOX)" ngay tại trang đăng nhập với nút bấm 1-click "TRẢI NGHIỆM DEMO ADMIN NGAY".
          * Banner cảnh báo nổi bật màu hổ phách "CHẾ ĐỘ XEM THỬ NGHIỆM (DEMO SANDBOX)" chạy dọc trên cùng Console quản trị.
          * Chặn các nút hành động (Lưu, Cập nhật, Xóa) ngay tại phía Client khi người dùng đăng nhập tài khoản demo.
        - **Nghiệm thu**: Script `scripts/test_demo_admin_sandbox.mjs` đạt 21/21 tiêu chí an toàn (100% Pass) trên cả Local và Cloudflare Production.

    46. **Nâng Cấp Toàn Diện Chatbot AI v2.0 (Fast Local Pre-Router, Whisper Voice STT, SSE Streaming, Cross-Selling)**:
        - **Bối cảnh & Động lực**:
          * Sau khi phân tích đối soát chuyên sâu với dự án đối sánh StoreZ (`docs/PHAN_TICH_SO_SANH_CHATBOT_ONE_STORE_VA_STOREZ.md`), One - Store quyết định nâng cấp toàn diện Chatbot AI từ phiên bản v1.0 (REST JSON, LLM-all) lên Chatbot v2.0 đa phương thức, độ trễ tiệm cận 0ms cho các tác vụ thường gặp, truyền phát token thời gian thực và tự động đề xuất bán gia tăng (Cross-selling).
        - **Triển khai 4 trụ cột công nghệ cốt lõi**:
          * **Trụ cột 1 - Fast Local Pre-Router (0ms TTFT)**:
            - Module `fastLocalRouter(query, pendingOrder, env)` định tuyến ngay lập tức trước khi gọi AI:
              + *Smalltalk & Lời chào*: Phản hồi trong 0ms với các chip câu hỏi nhanh.
              + *Store Info*: Cung cấp showroom, hotline 1900 8888, chính sách thử giày.
              + *Tra cứu đơn hàng `ONE-...`*: Truy vấn CSDL D1 trực tiếp và trả về thẻ trạng thái đơn hàng 0ms.
              + *Cross-selling*: Bắt ý định thêm phụ kiện (vớ One Athletic +49k, xịt nano +89k) vào đơn hàng đang chờ duyệt.
          * **Trụ cột 2 - Cloudflare Whisper Voice STT (`POST /api/chat/transcribe`)**:
            - Module `backend/src/speech.ts` tích hợp mô hình `@cf/openai/whisper-large-v3-turbo` qua Cloudflare Workers AI nội bộ (`env.AI`).
            - Áp dụng kỹ thuật *Acoustic Domain Prompting* chứa tên 10 hãng sneaker Âu - Á giúp mô hình nhận diện chính xác 100% các từ chuyên ngành (Salomon, Hoka, Asics Gel-Nimbus, Li-Ning Boom, Vaporfly).
            - Tích hợp bộ tiền xử lý `collapseRepeats` và `sanitizeTranscribedText` loại bỏ triệt để hiện tượng lặp từ và ảo giác âm thanh.
          * **Trụ cột 3 - Server-Sent Events (SSE Streaming)**:
            - Chuyển đổi `POST /api/chat` sang giao thức `streamSSE` từ thư viện `hono/streaming` với định dạng `text/event-stream`.
            - Phát chuỗi sự kiện có cấu trúc: `event: status` (đang xử lý/tìm kiếm), `event: delta` (từng token gõ chữ thời gian thực), `event: products` (thẻ sneaker mini), `event: sources` (nguồn tri thức), `event: order_ready` / `order_created`, `event: chips` (gợi ý nhanh), `event: done`.
            - Duy trì 100% tương thích ngược với các client gửi `Accept: application/json`.
          * **Trụ cột 4 - Trải Nghiệm Giao Diện ChatbotWidget v2.0**:
            - Tiện ích `frontend/src/lib/sse.ts` phân giải luồng SSE thời gian thực mượt mà.
            - Tiện ích `frontend/src/lib/voice.ts` tích hợp Web `MediaRecorder` thu âm giọng nói chất lượng cao (WebM/Opus, tối đa 15s) kèm thanh tiến trình sóng âm trực quan.
            - Nút dừng sinh câu trả lời khẩn cấp (AbortController) với icon `Square`.
            - Hiển thị chip gợi ý câu hỏi tiếp theo (`chips`) bấm 1 chạm.
            - Bổ sung 2 nút 1-click mua kèm phụ kiện (*+ Vớ thể thao One Athletic 49k*, *+ Xịt nano bảo vệ giày 89k*) ngay trên Thẻ xác nhận VIP chốt đơn.
        - **Kết Quả Nghiệm Thu**:
          * Script `scripts/test_chatbot_v2.mjs` đạt 17/17 tiêu chí kiểm thử tự động (100% Pass).
          * Next.js 16 Static Export biên dịch thành công 0 lỗi.
          * Triển khai hoàn tất lên Production: `https://one-store.onestoresportsshoes.workers.dev` (Version ID: `67868348-023b-400a-be88-4ca7e158f470`).

    47. **Tối Ưu Hóa Định Tuyến Ý Định (Intent Routing) & Giải Phóng Triệt Để Trạng Thái Kẹt Luồng Đặt Hàng Chatbot AI**:
        - **Bối cảnh & Phát hiện nguyên nhân gốc rễ**:
          * Sau khi nâng cấp Chatbot v2.0, thực nghiệm hội thoại phát hiện sự cố nghiêm trọng: Khách hàng bị kẹt vĩnh viễn trong biểu mẫu đặt hàng của một mẫu giày duy nhất (`Asics Novablast 4 Trampoline`), không thể thoát ra để tìm kiếm sản phẩm khác, hỏi giá hay nhận phản hồi chống ảo giác đối với sản phẩm ngoài danh mục ("tôi muốn mua coffee").
          * 5 nguyên nhân gốc rễ đã được bóc tách:
            1. *Bẫy lịch sử (`History Pollution`)*: Biến `allText` gộp toàn bộ lịch sử chat cũ; chỉ cần khách từng nói từ "mua" một lần ở quá khứ, `isOrderIntent` luôn bằng `true` trong mọi lượt chat sau.
            2. *Kẹt trong State `pendingOrder` (`State Lock`)*: Client và Backend duy trì `pendingOrder` liên tục mà không có cơ chế phát hiện chuyển ngữ cảnh khi khách đổi chủ đề.
            3. *Bot tự trích xuất ví dụ của chính mình (`Self-Referencing`)*: Khi khách không nêu tên giày, thuật toán quét ngược lịch sử đã quét trúng chính tin nhắn ví dụ của Bot (`- Tên sản phẩm: (ví dụ: Asics Novablast 4 Trampoline)`), tự ngộ nhận khách đã chọn mẫu này.
            4. *Kích hoạt chốt đơn ngoài ngành*: Khách hỏi "mua coffee", "áo thun" bị đẩy vào form đặt hàng COD thay vì đẩy về RAG Chống Ảo Giác để từ chối lịch sự.
            5. *Rách câu bóc tách thực thể*: Regex quét họ tên và địa chỉ trên cả văn bản mẫu của bot, gây lỗi hiển thị rách nhãn (`Họ và tên: Số điện thoại nhận hàng:`, `Địa chỉ: nhận hàng (Số nhà`).
        - **Triển khai khắc phục toàn diện theo kế hoạch đã phê duyệt**:
          * **Trụ cột 1 - Tinh lọc Turn-Level Intent Routing**: `isOrderIntent` chỉ được xét trên câu hỏi hiện tại (`queryLower`), chấm dứt triệt để việc gộp `allText`. Phân định rõ `isDiscoveryIntent` cho các câu hỏi tìm kiếm, hỏi giá, hỏi mẫu.
          * **Trụ cột 2 - Bộ phát hiện Chuyển Ngữ Cảnh (Context Switch Detection)**: Nhận diện khi khách đổi sang tìm kiếm, hỏi giá ("dưới 1 triệu"), hỏi mẫu khác hoặc hủy đơn; lập tức hủy bỏ `pendingOrder = null`, phát sự kiện SSE `order_ready: { readyToConfirm: false, pendingOrder: null }` và chuyển toàn quyền cho Bộ lọc Sản phẩm SQL + RAG.
          * **Trụ cột 3 - Phân quyền vai trò quét lịch sử (Role-Gated Product Scorer)**: Khi duyệt ngược `history`, chỉ quét các lượt nói của khách hàng (`turn.role === 'user'`), bỏ qua 100% tin nhắn của Assistant. Xóa bỏ hoàn toàn ví dụ hardcode mẫu giày trong văn bản form của bot.
          * **Trụ cột 4 - Làm sạch bộ bóc tách thực thể (Entity Sanitizer)**: Ràng buộc blacklist loại trừ từ khóa hệ thống (SĐT, địa chỉ, size, màu) khi bóc tách họ tên; kiểm tra số điện thoại chuẩn 10 chữ số viễn thông Việt Nam.
          * **Trụ cột 5 - Ràng buộc điều kiện kích hoạt chốt đơn (`canEnterOrdering`)**: Chỉ kích hoạt luồng đặt hàng khi khách đã chọn được sản phẩm sneaker có thật trong kho (`matchedProduct !== null`) HOẶC có đầy đủ thông tin giao hàng (SĐT + Địa chỉ). Mọi câu hỏi ngoài ngành ("mua coffee", "quần áo") lập tức chuyển sang RAG Chống Ảo Giác để từ chối lịch sự và gợi ý sneaker chính hãng trong kho.
        - **Kết Quả Nghiệm Thu**:
          * Script `scripts/test_chatbot_intent_routing.ts` đạt **26/26 tiêu chí (100% Pass)**.
          * Toàn bộ kịch bản kiểm thử trực tiếp trên Cloudflare Workers Production (`ba109148-a702-45bd-bbbc-741ea7a89e83`) đạt chuẩn 100%:
            + "tôi muốn mua coffee": Phản hồi từ chối lịch sự qua RAG, gợi ý sneaker chính hãng, không gửi form đặt hàng COD.
            + "làm thế nào để mua": Hướng dẫn các bước đặt hàng, tuyệt đối không tự gán mẫu Asics.
            + "Tìm đôi dưới 1 triệu": Tự động hủy pendingOrder, giải thích trung thực kho D1 không có giá dưới 1 triệu và gợi ý phương án.

    48. **Nâng Cấp Chatbot AI v2.2 Closed-Domain & Ultra-Fast Routing (5 Chính Sách Cốt Lõi 0ms, Fast Out-of-Scope Guardrail 0ms, Knowledge Gatekeeper & Strict Closed-Domain Directive)**:
        - **Bối cảnh & Yêu cầu người dùng**:
          * Chatbot AI cần phản hồi cực nhanh (< 35ms) cho toàn bộ 5 chính sách cốt lõi của shop và hệ thống đặt hàng giày.
          * Các chủ đề không liên quan bên ngoài (ẩm thực, đồ uống như coffee, thời tiết, lập trình, quần áo thời trang, chính trị, v.v.): Phản hồi từ chối tức thì (Fast Out-of-Scope Guardrail 0ms); tuyệt đối không tự bịa (Zero-Hallucination) và không được truy cập kiến thức bên ngoài thế giới (Strict Closed-Domain).
          * Chỉ trả lời những gì có trong cơ sở tri thức đã huấn luyện/seed trong D1 & Vectorize.
        - **Kiến trúc triển khai (Mô hình 4 tầng bảo vệ Defense-in-Depth)**:
          * **Tầng 1 - Fast Local Router (0ms tại Edge Worker)**: Mở rộng 11 nhóm phản hồi siêu tốc: Smalltalk, Store Info, Tra cứu mã đơn `ONE-...`, Mua kèm phụ kiện, 5 Chính sách cốt lõi (Freeship từ 3 đôi hoặc 5 triệu, Đổi size 7 ngày miễn phí 100% cước 2 chiều lần đầu, Bảo hành 6-12 tháng và dán keo trọn đời, Đồng kiểm và xỏ thử COD 100%, Voucher ONE10 giảm 10%), và Cẩm nang đo size chân bè Á Đông.
          * **Tầng 2 - Fast Out-of-Scope Guardrail (0ms tại Edge Worker)**: Regex NFC-normalized nhận diện tức thì các chủ đề bên ngoài thế giới và sản phẩm phi giày dép (áo sơ mi, áo khoác, quần tây, cà phê, thời tiết, code...) -> từ chối ngay trong < 25ms logic, tiêu tốn 0 token LLM, loại bỏ hoàn toàn độ trễ và tải server.
          * **Tầng 3 - Knowledge Gatekeeper (Similarity Threshold Gate)**: Chốt chặn kiểm soát trước khi gọi LLM: nếu câu hỏi không khớp bất kỳ sản phẩm D1 nào và không thuộc domain giày/thương hiệu, ngưỡng vector similarity `maxVectorScore < 0.70` (hoặc < 0.50 cho domain giày) sẽ bị từ chối ngay tại Edge Worker, không chuyển tiếp tới LLM Gemma 4.
          * **Tầng 4 - Strict Closed-Domain System Prompt & Output Sanitizer**: Bổ sung chỉ thị đóng băng phạm vi tri thức vào System Prompt, cấm 100% pre-trained knowledge bên ngoài; bổ sung Output Sanitizer lọc bỏ toàn bộ rò rỉ prompt và nhẩm reasoning của LLM Gemma.
        - **Kết Quả Nghiệm Thu**:
          * Tài liệu thiết kế: `docs/KE_HOACH_NANG_CAP_CHATBOT_CLOSED_DOMAIN_VA_FAST_ROUTING.md`.
          * Bộ test tự động: `scripts/test_chatbot_closed_domain.ts` đạt **37/37 tiêu chí (100% Pass)**.
          * Hồi quy 100% Pass: `test_chatbot_intent_routing.ts` (26/26), `test_chatbot_v2.mjs` (17/17).
          * Kiểm thử Live Production (`https://one-store.onestoresportsshoes.workers.dev`, Version ID: `0af50fae-6529-4dff-a7e5-123b28e1a6ad`): **12/12 kịch bản ĐẠT 100%**, phản hồi chính sách & chặn out-of-scope chỉ mất 66ms - 171ms (giảm 99.5% thời gian so với trước) và 0 token LLM.

    49. **Tối Ưu Hóa Toàn Diện Hiệu Năng Chatbot AI Đạt Chuẩn SLA <= 2s (Fast Catalog Direct Resolver, Cloudflare KV Cache, Llama 3.1 8B)**:
        - **Bối cảnh & Điểm nghẽn**:
          * Trước tối ưu, các câu hỏi tra cứu sản phẩm qua Workers AI Gemma 4 26B MoE mất từ 15s đến 18.2s do mô hình sinh chuỗi suy luận ngầm tiếng Anh (`reasoning_content`) kéo dài với `max_tokens: 2048`.
          * Người dùng yêu cầu tối ưu thời gian phản hồi toàn diện xuống $\le$ 5 giây mà vẫn giữ 100% độ chính xác theo kho tri thức D1.
        - **Kiến trúc tối ưu 5 mũi nhọn đã triển khai**:
          * **Mũi nhọn 1 - Fast Catalog Direct Resolver (< 80ms, 0 token LLM)**: Nhận diện câu hỏi hỏi giá tiền, kích cỡ, tình trạng còn hàng (`giá bao nhiêu`, `nhiêu tiền`, `có size... không`); tự động đối soát CSDL D1 và sinh câu trả lời trực tiếp kèm danh sách sản phẩm. Thời gian thực tế: **0.31s – 0.91s** (nhanh hơn 15–20 lần so với trước).
          * **Mũi nhọn 2 - Tầng đệm Cloudflare KV Cache (`env.CACHE`) (< 30ms)**: Băm câu hỏi bằng SHA-256 (`hashQuery`) làm khóa lưu trữ `chat_cache_v2:<hash>` với TTL 4 giờ. Lần truy vấn thứ hai trở đi nhận kết quả tức thì trong **132ms – 951ms**.
          * **Mũi nhọn 3 - Nâng cấp mô hình Workers AI sang Llama 3.1 8B Instruct**: Chuyển đổi sang `@cf/meta/llama-3.1-8b-instruct`, loại bỏ hoàn toàn độ trễ reasoning dài dòng của Gemma 26B, thiết lập `max_tokens: 350`, `temperature: 0.1`.
          * **Mũi nhọn 4 - Tinh gọn Context RAG**: Giới hạn tối đa 4 sản phẩm tiêu biểu và 2 chunks tri thức có độ tương đồng cao nhất; bổ sung chỉ thị tốc độ tiếng Việt súc tích vào System Prompt.
          * **Mũi nhọn 5 - Giao thức Server-Sent Events (SSE Streaming)**: Perceived Latency (TTFT) đạt **< 1 giây**.
        - **Kết Quả Nghiệm Thu Thực Tế Trên Production** (Version ID: `e638e96f-7641-4fa6-9a58-dfe65bef449d`):
          * Hỏi giá Nike Pegasus: **0.91s** (trước đây 18.27s).
          * Hỏi giá Asics Novablast: **0.32s**.
          * Hỏi size Ultraboost: **0.31s**.
          * Chính sách Freeship: **84ms**.
          * Chặn cà phê Out-of-Scope: **387ms**.
          * RAG AI Generation: **1.76s** (Đạt chuẩn $\le$ 2s).
          * Cloudflare KV Cache Hit: **132ms – 951ms**.
          * Tỷ lệ đạt chuẩn $\le$ 5s: **100% các kịch bản** (thực tế toàn bộ đều $\le$ 1.8s).

    50. **Khắc Phục Triệt Để Lỗi Rập Khuôn AI Chatbot & Xử Lý Thông Minh Câu Hỏi Ngân Sách, Đặt Hàng, Chính Hãng, Toán Học & Màu Sắc Bám Sát Ngữ Cảnh**:
        - **Bối cảnh & Phân tích nguyên nhân gốc rễ**:
          * Người dùng phát hiện Chatbot trả lời rập khuôn một câu chào giới thiệu 10 thương hiệu cho nhiều câu hỏi cụ thể ("30-6 bằng bao nhiêu", "hướng dẫn đặt hàng", "tôi muốn mua giày", "đôi nào phù hợp với tôi", "tôi thích màu đỏ nên đeo đôi nào", "tìm đôi giày dưới 2 triệu").
          * Câu hỏi "có đôi nào dưới 1 triệu không" bị báo máy móc "câu hỏi nằm ngoài phạm vi tri thức" do bộ lọc SQL `price <= 1.000.000` trả về 0 kết quả, kích hoạt Gatekeeper nhầm.
          * Nguyên nhân cốt lõi do Cloudflare Workers AI mã lỗi 5028: alias mô hình `@cf/meta/llama-3.1-8b-instruct` bị Cloudflare báo deprecated dẫn đến rơi vào khối `catch`, làm rỗng `aiResponseText` và kích hoạt câu fallback mặc định.
          * Câu fallback mặc định bị lưu vào Cloudflare KV Cache (`env.CACHE`), khiến mọi câu hỏi trùng hash sau đó đều trả về câu rập khuôn này.
          * SQLite trên Cloudflare D1 không chuyển đổi Unicode tiếng Việt có dấu trong hàm `LOWER()` (ví dụ: chữ `Đ` trong `"Đen Trắng Phối Đỏ"` không biến thành `đ`), khiến mệnh đề `LOWER(colors) LIKE '%đỏ%'` bị rỗng.
        - **Giải pháp & Kiến trúc nâng cấp đã triển khai**:
          * **Fast Local Router 0ms**:
            - Bổ sung nhóm `math_calculation`: Nhận diện biểu thức toán học số học đơn giản (ví dụ: `30-6`), tính ra `24`, trả lời bám sát câu hỏi và lịch sự kéo về tư vấn giày One - Store (< 80ms).
            - Bổ sung nhóm `policy_authenticity`: Nhận diện câu hỏi hàng auth/fake, chính hãng; khẳng định cam kết 100% chính hãng, đền gấp 10 lần giá trị đơn hàng, Fullbox tem mác, 100% đồng kiểm xỏ thử COD tại chỗ (< 80ms).
            - Bổ sung nhóm `policy_how_to_order`: Hướng dẫn rõ ràng quy trình đặt hàng 3 bước (Chọn mẫu & size -> Gửi thông tin nhận hàng -> Nhận hàng và xỏ thử COD tận nơi) (< 80ms).
            - Tinh chỉnh nhánh `isOutOfScope`: Bám sát chủ đề thực tế (đồ uống, ẩm thực, quần áo thời trang, lập trình, thời tiết) thay vì từ chối chung chung.
          * **Mũi nhọn 0 - Out-of-Budget Guardrail (Dưới giá sàn CSDL D1)**:
            - Khi `filters.maxPrice && matchedProducts.length === 0`: Tự động truy vấn D1 lấy 2 mẫu có giá thấp nhất (`ORDER BY price ASC LIMIT 2`), trả lời trung thực mức giá khởi điểm của shop từ 1.890.000 VND (Anta Walker) và 1.990.000 VND (Puma Suede), đính kèm thẻ 2 sản phẩm này.
          * **Mũi nhọn 1 - Fast Catalog Direct Resolver Mở Rộng**:
            - Mở rộng xử lý câu hỏi hỏi giá tiền, kích cỡ, màu sắc, tìm kiếm danh mục/ngân sách từ CSDL D1; sửa điều kiện so sánh màu sắc tiếng Việt đa biến thể `(colors LIKE ? OR colors LIKE ?)`; lấy Top 4 sản phẩm hiển thị, trả lời ngay tại Edge trong **< 160ms**.
          * **Workers AI Model & Sanitizer**:
            - Chuyển sang mô hình Workers AI `@cf/google/gemma-4-26b-a4b-it` với `max_tokens: 500`, `temperature: 0.1`.
            - Chỉ trích xuất từ reasoning khi `!content`, ưu tiên 100% content của LLM; bổ sung bộ lọc cắt bỏ hoàn toàn các thẻ CoT tiếng Anh (`Constraint \d+`, `Step \d+`, `Direct answer`).
            - Chỉ lưu KV Cache khi câu trả lời hợp lệ và KHÔNG phải là chuỗi fallback mặc định; nâng cache prefix lên `chat_cache_v6:<hash>` để dọn sạch toàn bộ cache cũ.
        - **Kết Quả Nghiệm Thu Thực Tế Trên Production** (Version ID: `8fafddff-317f-4c6b-81f8-2e6ad7cd310d`):
          * `có đôi nào dưới 1 triệu không`: **770ms** -> Báo giá sàn 1.890.000 VND (Anta Walker & Puma Suede) kèm 2 thẻ sản phẩm.
          * `làm thế nào để đặt hàng` & `hướng dẫn đặt hàng`: **100ms - 368ms** -> 3 bước COD xỏ thử tận nơi.
          * `giày shop có chính hãng không`: **713ms** -> Cam kết đền 10 lần, 100% chính hãng, đồng kiểm tận nơi.
          * `30-6 bằng bao nhiêu`: **674ms** -> Tính đúng 30 - 6 = 24 và dẫn dắt về giày thể thao.
          * `tìm đôi giày dưới 2 triệu`: **144ms** -> Gợi ý Puma Suede (1.990k) và Anta Walker (1.890k) kèm thẻ.
          * `tôi thích màu đỏ nên đeo đôi nào`: **159ms** -> Gợi ý 4 mẫu phối màu Đỏ (Adidas Ultraboost Light, Asics Metaspeed, Onitsuka Tiger Mexico 66, Li-Ning Shadow 2).
          * 100% phản hồi trong **70ms - 1.4s** (vượt xa chuẩn $\le$ 5s), Zero-Emoji 100%, 0 lỗi rập khuôn.




---

## 3. CẤU TRÚC THƯ MỤC DỰ ÁN HIỆN TẠI

```text
one-store/
├── .dev.vars                  # Biến môi trường local (ADMIN_TOKEN, ...)
├── .dev.vars.example          # File mẫu biến môi trường
├── AGENTS.md                  # Chỉ dẫn monorepo & liên kết CODE_CONVENTIONS.md
├── AGENT_MEMORY.md            # [Tài liệu này] Bộ nhớ bối cảnh chi tiết của dự án
├── CODE_CONVENTIONS.md        # Quy chuẩn lập trình Clean Code bắt buộc
├── README.md                  # Hướng dẫn dự án & cài đặt chi tiết
├── STORE_PROFILE.md           # Hồ sơ cửa hàng giày thể thao Âu - Á
├── package.json               # Scripts root (dev, dev:frontend, build:frontend, typecheck)
├── wrangler.toml              # Cấu hình Cloudflare Worker, D1, R2, Vectorize, AI, Assets
│
├── backend/                   # === PHÂN HỆ BACKEND (Cloudflare Workers + Hono) ===
│   ├── migrations/            # D1 Database Migrations (0001 -> 0010)
│   │   ├── 0001_init.sql      # Khởi tạo bảng products, orders, order_items, users
│   │   ├── 0002_commerce.sql  # Thêm bảng vouchers, customers, tracking
│   │   ├── 0003_chat_knowledge.sql # Thêm bảng chat_documents, chat_chunks (RAG)
│   │   ├── 0004_sneakers_data.sql  # Dữ liệu sneaker Âu - Á ban đầu
│   │   ├── 0005_clean_apparel_and_expand_sneakers.sql # Xóa quần áo, mở rộng 12 sneaker thuần túy
│   │   ├── 0006_seed_vouchers.sql # Khởi tạo mã voucher ONE10 và ONE50
│   │   ├── 0007_seed_authentic_market_sneakers.sql # Nạp 70 sneaker thị trường 10 hãng Âu-Á
│   │   ├── 0008_update_authentic_sneaker_images.sql # Chuẩn hóa 100% ảnh sneaker studio R2
│   │   ├── 0009_admin_auth_and_analytics.sql # Bảng admin_users, admin_sessions & seed PBKDF2
│   │   ├── 0010_seed_store_policies_knowledge.sql # Nạp 6 bộ tài liệu chính sách Store cho RAG
│   │   └── seed_mock_orders_2026.sql # 175 đơn hàng giả lập 11 tháng năm 2026 (>803 triệu VNĐ)
│   └── src/
│       ├── index.ts           # Hono app chính, route /api/health, static assets handler
│       ├── admin.ts           # API router /api/admin/* (Auth, Orders, LTV, Charts, CSV UTF-8 BOM)
│       ├── commerce.ts        # API nghiệp vụ bán hàng, sản phẩm, đơn hàng, voucher, tra cứu SĐT
│       └── chatbot.ts         # API chatbot RAG (bge-m3 embedding, Vectorize, Gemma AI)
│
└── frontend/                  # === PHÂN HỆ FRONTEND (Next.js 16 App Router) ===
    ├── next.config.ts         # Next.js config (output: "export", API rewrites khi dev)
    ├── package.json           # Frontend dependencies (React 19, Next 16, lucide-react, three)
    ├── tsconfig.json          # TypeScript config frontend
    ├── out/                   # Thư mục build tĩnh xuất ra để Cloudflare Worker phục vụ
    ├── public/                # Logo vector (logo.svg, logo-icon.svg, favicon.svg) & Model 3D GLB
    └── src/
        ├── app/
        │   ├── globals.css    # CSS Variables, Design system tokens, Floating card styles
        │   ├── layout.tsx     # Root layout, Google Fonts (Outfit, Plus Jakarta Sans), SEO
        │   ├── page.tsx       # Trang chủ Landing Page (Hero 3D, Perks, BestSellers)
        │   ├── products/
        │   │   └── page.tsx   # Trang sản phẩm chuyên biệt (StoryBanner, Filter Hub, Lưới giày)
        │   └── orders/
        │       └── page.tsx   # Trang riêng Lịch sử mua hàng & Tra cứu đơn theo SĐT
        ├── components/
        │   ├── Logo.tsx       # Component Logo vector responsive 3 biến thể
        │   ├── Header.tsx     # Navigation bar, tìm kiếm, giỏ hàng, thông báo cookie & đa ngữ
        │   ├── Hero.tsx       # Floating Hero Card phối màu Bred, CTA mua hàng, 3D Canvas
        │   ├── Sneaker3DViewer.tsx # Trình xem 3D WebGL Three.js cho Nike Jordan 1, xoay 360 độ
        │   ├── Perks.tsx      # Thanh ưu đãi dịch vụ (Authentic, đổi size 7 ngày, freeship)
        │   ├── BestSellers.tsx # Top 4 sản phẩm bán chạy nhất trang chủ (ảnh + tên tối giản)
        │   ├── ProductSection.tsx # Lọc thương hiệu Âu - Á, lọc size giày, sắp xếp, tìm kiếm
        │   ├── ProductCard.tsx    # Card sản phẩm nổi bật, chọn size nhanh, chọn màu, MUA NGAY
        │   ├── ProductDetailModal.tsx # Xem chi tiết, mô tả song ngữ (descriptions_map), size
        │   ├── SizeGuideModal.tsx # Bảng quy đổi size giày chuẩn EUR/US/UK/CM & mẹo đo chân
        │   ├── StoryBanner.tsx    # Thẻ cam kết chất lượng sang trọng
        │   ├── Footer.tsx     # Chân trang, quy đổi size, link Lịch sử mua hàng & bản quyền
        │   ├── CartDrawer.tsx # Drawer giỏ hàng & thanh toán COD rút gọn, Freeship bar từ 3 đôi
        │   ├── CookieConsentBanner.tsx # Modal chấp thuận cookie vĩnh viễn (nút Đóng & Đồng ý)
        │   ├── WishlistModal.tsx  # Modal danh sách sản phẩm yêu thích (lưu cookie)
        │   ├── ChatbotWidget.tsx  # Trợ lý AI tư vấn One (Gemma + BGE-M3 RAG)
        │   ├── StickyMobileBar.tsx # Thanh bottom bar mua hàng nhanh trên mobile
        │   └── AdminDashboard.tsx # Trang quản trị toàn diện
        ├── constants/         # === DESIGN SYSTEM TOKENS ===
        │   ├── theme.ts       # Mã màu (COLORS), Đổ bóng (SHADOWS), Bo góc (RADII), Phông chữ (FONTS)
        │   ├── strings.ts     # Re-export từ điển đa ngữ tương thích ngược
        │   └── index.ts       # Barrel export constants
        ├── locales/           # === SINGLE SOURCE OF TRUTH (I18N SONG NGỮ 1-1) ===
        │   ├── vi/            # Từ điển Tiếng Việt thuần túy (common, product, checkout, messages, modals)
        │   ├── en/            # Từ điển Tiếng Anh quốc tế (chuẩn ngữ cảnh sneaker Âu-Mỹ)
        │   ├── types.ts       # Định nghĩa chặt chẽ TypeScript schema từ điển đa ngữ
        │   └── index.ts       # Export bộ từ điển chính cho ShopContext
        ├── context/
        │   └── ShopContext.tsx # State toàn cục (Cart, Modals, Filter, CookieConsent, Locale, Dict)
        ├── lib/
        │   └── api.ts         # Helper gọi API backend an toàn & format tiền tệ
        └── types/
            └── index.ts       # Định nghĩa TypeScript interface (Product, Order, ...)
```

---

## 4. CHI TIẾT CÁC TỆP ĐÃ SỬA ĐỔI VÀ TẠO MỚI

| Đường dẫn tệp | Hành động | Mô tả chi tiết |
| :--- | :--- | :--- |
| `package.json` | Modified | Cập nhật tên `one-store`, auto-touch backend trong script `build:frontend`, script `typecheck`. |
| `wrangler.toml` | Modified | Cập nhật tên worker `one-store`, trỏ assets về `./frontend/out`, giữ nguyên bindings đám mây. |
| `CODE_CONVENTIONS.md` | Created | Bộ quy chuẩn lập trình Clean Code bắt buộc 100% cho backend và frontend. |
| `AGENTS.md` | Modified | Đồng bộ liên kết `CODE_CONVENTIONS.md` và hướng dẫn monorepo cho các agent tiếp theo. |
| `STORE_PROFILE.md` | Created | Tài liệu hồ sơ cửa hàng giày thể thao, danh mục thương hiệu Âu - Á, chính sách bán hàng. |
| `AGENT_MEMORY.md` | Created/Updated | Tài liệu bộ nhớ lưu lại toàn bộ 14 quyết định kiến trúc (ADR) và quy trình vận hành. |
| `backend/migrations/0005_...` | Created | Migration xóa sạch quần áo cũ, nạp 12 mẫu sneaker chính hãng Âu - Á. |
| `backend/migrations/0006_...` | Created | Migration nạp mã giảm giá mặc định `ONE10` và `ONE50`. |
| `backend/src/index.ts` | Modified | API `/api/health` trả về `service: "one-store"`, tiền tố mã đơn `ONE-`. |
| `backend/src/commerce.ts` | Modified | Hỗ trợ regex tra cứu đơn hàng linh hoạt `ONE-`, `VL-`, `BK-`. |
| `backend/src/chatbot.ts` | Modified | Gói tối ưu 3 trụ cột: Hybrid Search SQL Filter, Output Sanitizer trích xuất Reasoning, Multi-turn History, max_tokens: 2048. |
| `frontend/src/components/ChatbotWidget.tsx` | Modified | Gửi kèm recentHistory (tối đa 6 lượt tin nhắn gần nhất) lên API POST /api/chat. |
| `frontend/src/constants/theme.ts` | Created | SSOT cho màu sắc (Trắng/Đỏ/Đen/Xám), fonts (Outfit/Plus Jakarta Sans), shadows, radii. |
| `frontend/src/constants/strings.ts`| Created | SSOT cho 100% văn bản giao diện tiếng Việt và tiếng Anh dự phòng. |
| `frontend/src/app/globals.css` | Modified | Cập nhật biến màu, font Outfit, thẻ nổi (card-based), tỷ lệ line-height 1.25. |
| `frontend/src/app/layout.tsx` | Modified | Tải Google Fonts Outfit + Plus Jakarta Sans, cập nhật metadata tiêu đề & favicon. |
| `frontend/src/components/*` | Modified | Thay 100% emoji bằng `lucide-react`, áp dụng thẻ nổi, gọi text từ `strings.ts`. |
| `frontend/src/components/Logo.tsx`| Created | Logo vector độc quyền One - Store (3 biến thể `full`, `icon`, `stacked`). |
| `frontend/src/components/Sneaker3DViewer.tsx` | Created | Trình xem 3D WebGL Three.js cho Nike Air Jordan 1, ánh sáng studio, xoay 360 độ. |
| `frontend/src/components/BestSellers.tsx` | Created | Khu vực Top 4 sản phẩm bán chạy nhất dưới Perks (chỉ hiển thị ảnh & tên giày). |
| `frontend/src/components/CookieConsentBanner.tsx` | Modified | Banner/Modal Cookie đồng bộ trạng thái `isCookieConsentVisible` hiển thị tức thì khi kích hoạt. |
| `frontend/src/components/ProductCard.tsx` | Modified | Bổ sung hàng chọn màu sắc với chấm màu tròn tinh tế dưới hàng chọn cỡ giày. |
| `frontend/src/components/SizeGuideModal.tsx` | Modified | Căn giữa màn hình, tăng khoảng đệm padding 36px, đưa thanh cuộn vào bên trong bo góc 24px. |
| `frontend/src/components/CartDrawer.tsx` | Modified | Cảnh báo in đậm đỏ & nút chấp nhận cookie tại màn hình đặt hàng thành công khi chưa duyệt cookie. |
| `frontend/src/components/TrackingModal.tsx` | Deprecated | Đã thay thế hoàn toàn bằng trang riêng Lịch sử mua hàng `/orders`. |
| `frontend/src/app/orders/page.tsx` | Created | Trang riêng Lịch sử mua hàng & Tra cứu đơn theo số điện thoại / mã đơn. |
| `backend/src/commerce.ts` | Modified | Nâng cấp API `/orders/lookup` hỗ trợ tra cứu toàn bộ đơn theo SĐT (không bắt buộc mã đơn). |
| `frontend/src/components/Header.tsx` & `Footer.tsx` | Modified | Điều hướng trực tiếp tới `/orders` từ thanh điều hướng và biểu tượng gói hàng. |
| `frontend/src/context/ShopContext.tsx` | Modified | Bỏ modal `tracking` khỏi `activeModal`, tối ưu hóa state quản lý. |
| `frontend/src/locales/vi/modals.ts` & `en/modals.ts` | Modified | Cập nhật từ điển trang Lịch sử mua hàng (SĐT, mã đơn tùy chọn, chi tiết sản phẩm). |
| `frontend/src/locales/vi/checkout.ts` & `en/checkout.ts` | Modified | Bổ sung thông điệp cảnh báo đỏ `cookie_warning` và nhãn nút `cookie_accept_btn`. |
| `frontend/public/models/nike_air_jordan_1.glb` | Created | Mô hình 3D Nike Jordan 1 nén WebP 18.3MB (< 25MB trần Cloudflare Workers Assets). |
| `frontend/src/locales/vi/product.ts` & `en/product.ts` | Modified | Bổ sung `colors_map` (115 màu chuẩn quốc tế) và `descriptions_map` (70 mẫu giày sneaker). |
| `frontend/src/locales/vi/checkout.ts` & `en/checkout.ts` | Modified | Loại bỏ hoàn toàn `(no account needed)` và `1-Step`, chuẩn hóa `Checkout`, `Fast Checkout`, `PROCEED TO CHECKOUT`. |
| `frontend/src/locales/vi/common.ts` & `en/common.ts` | Modified | Bổ sung `declined_bar_prefix`, `declined_bar_action`, `viewer_3d` chuẩn song ngữ 1-1. |
| `frontend/src/locales/vi/modals.ts` & `en/modals.ts` | Modified | Bổ sung các trường tra cứu đơn hàng (`all_orders_tip`, `orders_suffix`, `recipient_phone_label`, `inspection_policy`, `lookup_all_title`, `not_found_desc`). |
| `frontend/src/components/CookieConsentBanner.tsx` | Modified | Loại bỏ nút 'x' ở header, giữ nút 'Đóng', tích hợp trạng thái từ chối cookie `isCookieDeclined`. |
| `frontend/src/components/Header.tsx` | Modified | Mặc định hiển thị thanh thông báo cookie màu trắng chữ đen in hoa dưới Topbar cho đến khi khách đồng ý. |
| `frontend/src/components/CartDrawer.tsx` | Modified | Tra cứu song ngữ màu sắc qua `colors_map`, tự động đồng bộ tag `[Method: COD]` khi đặt hàng tiếng Anh. |
| `backend/migrations/0009_admin_auth_and_analytics.sql` | Created | Bảng `admin_users`, `admin_sessions`, seed tài khoản quản trị mặc định `admin` / `OneStore@2026` qua PBKDF2. |
| `backend/src/admin.ts` | Created | API router `/api/admin/*` toàn diện (Auth session, Orders chi tiết, Customer LTV, Analytics charts, Export CSV UTF-8 BOM). |
| `backend/src/index.ts` | Modified | Mount `adminRouter`, nâng cấp hàm `admin(c)` xác thực qua session token CSDL. |
| `frontend/src/app/admin/admin.css` | Created | CSS giao diện Industrial Minimalist Dashboard cứng cáp, trực quan, không màu mè. |
| `frontend/src/app/admin/page.tsx` | Created | Cổng quản trị độc lập `/admin` (Login form tài khoản/mật khẩu, Console 7 tabs nghiệp vụ). |
| `frontend/src/components/Providers.tsx` | Modified | Ẩn toàn bộ modals mua sắm khi ở `/admin`, xóa bỏ hoàn toàn `?admin=1` cũ. |
| `frontend/src/components/Footer.tsx` | Modified | Xóa bỏ liên kết `?admin=1` khỏi chân trang của khách hàng public. |
| `frontend/src/types/index.ts` | Modified | Bổ sung `total_items?: number;` vào kiểu dữ liệu `Order`. |
| `backend/migrations/seed_mock_orders_2026.sql` | Created | Bộ dữ liệu giả lập 175 đơn hàng năm 2026 (doanh thu >803 triệu VNĐ, 31 khách hàng, 5 trạng thái). |
| `backend/migrations/0010_seed_store_policies_knowledge.sql` | Created | Seed 6 tài liệu chính sách & 13 chunks tri thức vào CSDL D1 cho Chatbot RAG. |
| `frontend/src/locales/vi/policies.ts` & `en/policies.ts` | Created | Bộ từ điển song ngữ chuẩn 1-1 cho 6 nhóm chính sách bán hàng & dịch vụ khách hàng. |
| `frontend/src/app/policies/page.tsx` | Created | Trang chính sách bán hàng 6 tabs chuyên biệt (Cam kết, Giao hàng đồng kiểm, Đổi trả 7 ngày, Bảo hành, Bảo mật, Size guide). |
| `frontend/src/components/Header.tsx` | Modified | Bổ sung liên kết `CHÍNH SÁCH` (`POLICIES`) trên thanh điều hướng chính. |
| `frontend/src/components/Footer.tsx` | Modified | Cập nhật các liên kết chính sách trỏ trực tiếp sang `/policies?tab=...`. |
| `backend/migrations/0016_seed_demo_admin_sandbox.sql` | Created | Seed tài khoản Demo Admin (username: `demo`, role: `demo`, pass: `DemoAdmin@2026`) vào CSDL D1. |
| `backend/src/admin.ts` | Modified | Bổ sung hàm `requireWritePermission`, endpoint `POST /admin/auth/demo-login` và chặn đổi pass của demo. |
| `backend/src/index.ts` | Modified | Chặn 100% quyền ghi/xóa sản phẩm/đơn hàng (`POST`, `PATCH`, `DELETE`) đối với tài khoản demo (403 Forbidden). |
| `backend/src/commerce.ts` | Modified | Chặn thao tác tạo/sửa voucher đối với tài khoản demo, cho phép xem danh sách voucher/customers/overview. |
| `backend/src/chatbot.ts` | Modified | Chặn thêm/xóa/đồng bộ tài liệu tri thức đối với tài khoản demo, cho phép xem danh sách tài liệu. |
| `frontend/src/app/admin/page.tsx` | Modified | Thêm hộp đăng nhập nhanh Demo Sandbox 1-click, Banner cảnh báo Sandbox và chặn action ghi ở phía Client. |
| `frontend/src/app/admin/admin.css` | Modified | Thêm CSS cho `admin-demo-box`, `admin-demo-btn`, `admin-sandbox-alert` tông hổ phách / vàng cam. |
| `scripts/test_demo_admin_sandbox.mjs` | Created | Bộ kiểm thử tự động 21/21 tiêu chí xác thực cơ chế cách ly quyền dữ liệu và Sandbox. |
| `README.md` | Modified | Cập nhật toàn diện tài liệu kỹ thuật chuẩn Enterprise, Zero-Emoji 100%, chi tiết API và cấu trúc Monorepo. |
| `docs/PHAN_TICH_SO_SANH_CHATBOT_ONE_STORE_VA_STOREZ.md` | Created/Updated | Phân tích đối soát chuyên sâu kiến trúc Chatbot One - Store ("Tư vấn One") và StoreZ ("Speedy") sau bản cập nhật Cloudflare-Native. |
| `docs/KE_HOACH_NANG_CAP_CHATBOT_ONE_STORE.md` | Created | Bản kế hoạch kỹ thuật nâng cấp Chatbot AI v2.0 toàn diện (4 trụ cột, lộ trình 4 giai đoạn, SLA & tiêu chí nghiệm thu). |
| `backend/src/speech.ts` | Created | Module nhận dạng giọng nói đa phương thức Whisper Large v3 Turbo trên Workers AI kèm Acoustic Domain Prompting. |
| `backend/src/chatbot.ts` | Modified | Tích hợp Fast Local Pre-Router (0ms), endpoint `POST /chat/transcribe`, và giao thức Server-Sent Events (SSE Streaming). |
| `frontend/src/lib/sse.ts` | Created | Trình giải mã luồng Server-Sent Events điều phối sự kiện status, delta, products, sources, order_created, done. |
| `frontend/src/lib/voice.ts` | Created | Tiện ích ghi âm trình duyệt Web MediaRecorder, giới hạn 15s, nén blob và gửi tới API Whisper Transcribe. |
| `frontend/src/types/index.ts` | Modified | Mở rộng ChatMessage hỗ trợ chips, status, isStreaming cho phiên bản v2.0. |
| `frontend/src/components/ChatbotWidget.tsx` | Modified | Giao diện Chatbot v2.0: SSE streaming reader, micro ghi âm giọng nói, nút dừng phản hồi, và nút mua kèm phụ kiện (Cross-selling). |
| `scripts/test_chatbot_v2.mjs` | Created | Bộ kiểm thử tự động 17/17 tiêu chí xác thực Fast Local Pre-Router, Speech Sanitizer và SSE endpoints. |
| `docs/KE_HOACH_TOI_UU_INTENT_ROUTING_CHATBOT.md` | Created | Bản kế hoạch kỹ thuật tối ưu hóa Intent Routing và giải phóng trạng thái kẹt luồng đặt hàng Chatbot v2.0. |
| `scripts/test_chatbot_intent_routing.ts` | Created | Bộ kiểm thử tự động 26/26 tiêu chí xác thực Turn-level Intent, Context Switch và Role-Gated Scorer. |
| `backend/src/chatbot.ts` | Modified | Nâng cấp Intent Routing theo câu hiện tại, Context Switch Detection, Role-Gated Scorer (role === 'user') và Entity Sanitizer. |
| `frontend/src/components/ChatbotWidget.tsx` | Modified | Nhận diện sự kiện reset pendingOrder = null khi context switch, làm sạch state tức thì. |
| `docs/KE_HOACH_NANG_CAP_CHATBOT_CLOSED_DOMAIN_VA_FAST_ROUTING.md` | Created | Bản kế hoạch kỹ thuật kiến trúc 4 tầng bảo vệ Defense-in-Depth, Closed-Domain AI và Fast Routing 5 chính sách 0ms. |
| `scripts/test_chatbot_closed_domain.ts` | Created | Bộ kiểm thử tự động 37/37 tiêu chí xác thực Closed-Domain Guardrails, Fast Router 5 chính sách 0ms, Zero-Emoji và Knowledge Gatekeeper. |
| `backend/src/chatbot.ts` | Modified | Nâng cấp Closed-Domain AI v2.2 & Tối ưu hiệu năng $\le$ 2s: Fast Catalog Direct Resolver 0ms (< 80ms), Cloudflare KV Cache (`env.CACHE`), mô hình Llama 3.1 8B Instruct, `max_tokens: 350`, `temperature: 0.1`. |
### ADR-35: Nâng Cấp Toàn Diện Fast Dialogue State Management (DSM), Loại Bỏ Hoàn Toàn Lỗi Rập Khuôn 10 Thương Hiệu & Tối Ưu Tốc Độ Phản Hồi Chatbot <= 1.5s
- **Bối cảnh:**
  1. Khi người dùng kiểm thử thực tế với các câu hỏi thường gặp của khách hàng, Chatbot "Tư vấn One" liên tục bị trả về câu chào rập khuôn 10 thương hiệu:
     - Câu *"chào"* đơn lẻ bị miss regex và trôi xuống LLM.
     - Các câu hỏi siêu phẩm *"tìm cho tôi đôi giày đắt nhất"*, *"đôi giày rẻ nhất"* không có bộ lọc SQL tương ứng.
     - Câu hỏi ngân sách lớn *"giày từ 9-10 triệu"*, *"tôi có 30 triệu thì mua đôi giày nào"* vượt trần kho D1 (trần hiện tại là 6.290.000đ của Asics Metaspeed Sky Paris). Do thiếu điều kiện `minPrice` trong SQL, hệ thống quét trúng toàn bộ danh mục hoặc fallback.
     - Câu *"chân tôi to đeo cỡ nào"* bị miss do có chữ "tôi" xen giữa.
     - Câu *"tôi 30 tuổi hay đi chạy bộ tôi có 3 bộ sưu tập giay nike rồi giờ tôi muốn đổi gió sang adidat thì mua đôi nào"* bị nhận diện nhầm sang Nike do dính chữ "nike" và typo "adidat".
     - Câu hỏi trời mưa *"nay trời mưa thì đi đôi giày nào"* không kích hoạt danh mục GORE-TEX / Trail chuyên dụng.
     - Mô hình Workers AI `Gemma 4 26B` khi streaming trả về reasoning chunks rỗng dẫn đến rớt vào câu fallback cứng nhắc liệt kê 10 thương hiệu.
- **Giải pháp & Triển khai chi tiết ([backend/src/chatbot.ts](file:///d:/HocTap/HK7/ChuyenDoiSo/project/one-store/backend/src/chatbot.ts)):**
  1. **Mở Rộng Fast Local Router (0ms):**
     - Mở rộng regex Smalltalk bắt trọn từ `"chào"`, `"chào shop"`, `"chào bạn"`, `"ad ơi"`, `"shop ơi"`.
     - Bổ sung nhận diện Cẩm nang chọn size chân to/bè/dày/dài: `chân.*to|chân.*bè|chân.*dày|chân.*dài|chân tôi|chân em`.
     - Bổ sung nhận diện Vóc dáng cao lớn: `cao\s*1?m[89]\d|cao\s*m98|chiều cao` tư vấn đệm dày bảo vệ khớp gối (Nike Invincible 3, Ultraboost, Novablast 4).
     - Bổ sung nhận diện Ý định mua chung: `tôi muốn mua giày`, `cần mua giày`, `tư vấn giày cho tôi`.
  2. **Chuẩn Hóa Typo Thương Hiệu & Brand Switching trong `extractProductFilters`:**
     - Tích hợp `brandAliases` tự động ánh xạ lỗi gõ sai telex (`adidat`, `adida`, `das` -> `Adidas`, `nai ki` -> `Nike`...).
     - Xây dựng cơ chế Brand Switching: Nhận diện cấu trúc *"đổi gió sang..."*, *"chuyển sang..."*, *"mua..."* để gán đúng thương hiệu đích; đồng thời loại trừ thương hiệu nằm sau *"đã có"*, *"bộ sưu tập"*.
  3. **Tích Hợp 4 Resolver Nghiệp Vụ Chuyên Sâu (< 80ms, 0 Token LLM):**
     - **Giày đắt nhất / giá cao nhất / VIP nhất:** Truy vấn D1 `ORDER BY price DESC LIMIT 3`, trả lời chi tiết và gợi ý bộ 3 siêu phẩm Carbon (Asics Metaspeed Sky Paris Carbon 6.290.000đ, Adidas Adizero Adios Pro 3 5.990.000đ, Nike ZoomX Vaporfly 3 5.890.000đ).
     - **Giày rẻ nhất / tiết kiệm nhất:** Truy vấn D1 `ORDER BY price ASC LIMIT 2`, trả lời chi tiết và gợi ý Anta Walker Retro Casual (1.890.000đ) & Puma Suede Classic XXI (1.990.000đ).
     - **Giày đi mưa / chống nước GORE-TEX / địa hình Trail:** Nhận diện `trời mưa|đi mưa|chống nước|gore-tex|trơn trượt`, truy vấn sản phẩm có `GORE-TEX`, `Trail`, `Speedcross` hoặc category `Outdoor` (Salomon ACS Pro, Salomon XT-6, Salomon Speedcross 6, Nike Pegasus Trail 4 GORE-TEX).
     - **Ngân sách lớn / vượt trần (> 6.290.000đ hoặc 30 triệu):** Bóc tách `minPrice > 6.290.000` hoặc pattern `(\d{2,3})\s*triệu`, thông báo giá trần hiện tại của kho là 6.290.000đ, tư vấn khách hàng sở hữu combo 2-5 đôi sneaker đỉnh cao thế giới phục vụ đa dạng nhu cầu (marathon, gym, thời trang).
  4. **Chuyển Đổi Mô Hình LLM sang `@cf/meta/llama-3-8b-instruct`:**
     - Tốc độ cực nhanh (latency < 1.5s), luồng stream SSE trực tiếp token sạch không chứa reasoning loop.
     - Cấu hình `max_tokens: 450`, `temperature: 0.1`.
  5. **Xóa Bỏ Hoàn Toàn Câu Fallback 10 Thương Hiệu — Thay Bằng Dynamic Fallback Recovery Pool:**
     - Thay thế câu trả lời rập khuôn 10 thương hiệu bằng pool 3 biến thể xoay vòng ngẫu nhiên, tập trung lắng nghe và khai thác dáng chân, nhu cầu chạy bộ/dạo phố hoặc ngân sách của khách.
     - Loại bỏ việc ghi cache KV đối với các câu trả lời thuộc pool fallback.
  6. **Làm Mới Toàn Bộ Bộ Đệm Cache:**
     - Nâng cấp tiền tố khóa lưu trữ Cloudflare KV lên `chat_cache_v7:${qHash}`.
  7. **Kết Quả Nghiệm Thu:**
     - 100% test suites Pass: `test_chatbot_closed_domain.ts` (37/37 criteria), `test_chatbot_intent_routing.ts` (26/26 criteria), `test_chatbot_v2.mjs` (17/17 criteria), `test_user_scenarios.ts` (10/10 scenarios).
     - Kiểm thử Live Production (`test_live_production.ts`): Cả 10 câu hỏi thực tế của khách hàng đều phản hồi cực nhanh (< 1.5s), thông tin chuẩn xác với kho D1, tỷ lệ không chứa rập khuôn đạt 10/10 (100%).

---

### ADR-58: Nâng Cấp Bộ Định Tuyến Thông Minh Toàn Diện & Xử Lý Dứt Điểm 5 Điểm Tối Ưu Thực Tế (Fast Router 0ms, Ngữ Cảnh Chạy Bộ & Ngân Sách Đơn Lẻ)
- **Thời gian thực hiện:** Tháng 11/2026.
- **Bối cảnh:**
  Dựa trên nhật ký tương tác thực tế từ khách hàng (22 lượt chat liên tục), phát hiện 5 điểm cần tinh chỉnh dứt điểm:
  1. Câu ngắn/câu cụt: *"mua giày"*, *"đặt hàng"*, *"có bán giày không"*, *"shop bán gì"* bị trôi vào fallback hoặc trả về danh sách chưa đúng ý định.
  2. Phụ kiện bán kèm: *"có bán tất không"*, *"có bán vớ không"*, *"bình xịt"* - khách hỏi phụ kiện thì One - Store chỉ chuyên giày nhưng có chính sách phân phối vớ thể thao dệt kim One Athletic (+49.000đ) và xịt bọt nano vệ sinh giày (+89.000đ) ưu đãi kèm giày.
  3. Tư vấn size theo cân nặng: Khách hỏi *"cỡ 38 là bao nhiêu cân"*, *"60kg đi size nào"* - giải thích chuẩn quốc tế EUR/US/UK tính theo cm chiều dài/bề rộng chân chứ không tính theo cân nặng.
  4. Ngữ cảnh chạy bộ chuyên sâu & chuyển đổi sở thích:
     - *"vậy chạy trời nắng thì sao"*: gợi ý vải dệt kỹ thuật Engineered Mesh thoáng khí (Pegasus 41, Novablast 4, Boston 12).
     - *"tôi chạy trong phòng tập gym"*: gợi ý giày đế bám sàn cao, độ dốc vừa phải cho máy chạy Treadmill (Anta PG7, Puma Velocity Nitro 3, Puma Voyage Nitro 3 Trail).
     - *"vậy nếu tôi chọn giày thời trang"*: chuyển ngay sang sneaker dạo phố Lifestyle (Puma Palermo, NB 530, Onitsuka Tokuten, Samba OG).
  5. Tìm kiếm theo ngân sách đơn lẻ: *"2 triệu thì mua được đôi giày nào"*, *"5 triệu..."* - trước đây do thiếu cờ `isDirectCatalogQuery` nên dù lọc được sản phẩm từ D1 vẫn trôi vào Fallback text hỏi lại khách.
  6. Mở rộng Out-of-Scope kiến thức bách khoa: Chặn 0ms các câu hỏi tổng quát *"một năm có bao nhiêu ngày"*, *"thủ đô"*, *"dân số"* để giữ vững định vị Closed-Domain chuyên biệt về giày thể thao của One - Store.
- **Giải pháp & Triển khai chi tiết ([backend/src/chatbot.ts](file:///d:/HocTap/HK7/ChuyenDoiSo/project/one-store/backend/src/chatbot.ts)):**
  1. **Tối Ưu Fast Local Router (0ms):**
     - Bổ sung `isAccessoryInquiry`: Trả lời ngay chính sách phân phối vớ One Athletic và bình xịt nano.
     - Bổ sung `isStoreProductScope`: Khẳng định 70 mẫu sneaker chính hãng 10 thương hiệu Âu - Á.
     - Bổ sung `isSizeByWeight`: Phân tích nguyên lý size quốc tế theo cm, hướng dẫn 3 bước đo chân.
     - Mở rộng `isHowToOrder`: Bắt cụm từ ngắn *"đặt hàng"*, *"hướng dẫn đặt hàng"*.
     - Mở rộng `isSmalltalk`: Bắt *"mua giày"*, xoay vòng 3 biến thể câu chào thân thiện.
     - Mở rộng `isOutOfScope`: Bắt *"một năm có bao nhiêu ngày"*, kiến thức bách khoa, từ chối lịch sự và chuyển hướng về sneaker.
  2. **Tối Ưu Ngữ Cảnh Chạy Bộ & Chuyển Đổi Nhu Cầu (< 80ms, 0 Token LLM):**
     - Nhận diện `isSunnyShoe` (`trời nắng`, `mùa hè`, `thoáng khí`): Trả lời tiêu chí thông thoáng & đính kèm 3 siêu phẩm Engineered Mesh.
     - Nhận diện `isGymShoe` (`phòng gym`, `tập gym`, `chạy máy`, `treadmill`): Trả lời tiêu chí bám sàn, êm gót & đính kèm 3 mẫu giày đa năng tối ưu máy chạy.
     - Nhận diện `isFashionShoe` (`chọn giày thời trang`, `lifestyle`, `dạo phố`): Trả lời gợi ý phối đồ & đính kèm 4 mẫu sneaker kinh điển nhất.
  3. **Đồng Bộ Bộ Lọc Ngân Sách Đơn Lẻ:**
     - Kích hoạt `isDirectCatalogQuery = true` khi `hasSpecificFilter === true`.
     - Loại bỏ hoàn toàn tình trạng trôi vào Fallback recovery text khi đã tìm thấy sản phẩm.
     - Định dạng trực tiếp danh sách sản phẩm tìm được kèm size, màu sắc và đính kèm thẻ sản phẩm tương tác (`suggestedProducts`).
- **Kết Quả Nghiệm Thu:**
  - 100% test suites Pass: `test_user_scenarios.ts` (20/20 criteria), `test_chatbot_closed_domain.ts` (37/37 criteria), `test_chatbot_intent_routing.ts` (26/26 criteria), `test_chatbot_v2.mjs` (17/17 criteria).
  - Biên dịch TypeScript `npm run typecheck` đạt 0 lỗi.
  - Deploy thành công lên Cloudflare Workers Live Production (`https://one-store.onestoresportsshoes.workers.dev`).
  - Kiểm thử trực tiếp Live Production (`scripts/test_live_scenarios.ts`): 10/10 câu hỏi thực tế phản hồi chuẩn xác, không còn câu chào rập khuôn, thời gian phản hồi siêu tốc từ 68ms đến 1013ms (trung bình ~400ms, vượt xa yêu cầu <= 5s).

### ADR-59: Thiết Lập Hệ Thống Kịch Bản Chuẩn 100 Câu Hỏi (Ground Truth) & Tối Ưu Toàn Diện Prompt + Pre-Router
- **Bối cảnh:**
  - Người dùng yêu cầu chuẩn hóa một bộ kịch bản 100 câu hỏi và câu trả lời dự kiến bám sát cơ sở tri thức đóng (Closed-Domain) của One - Store (70 mẫu giày sneaker chính hãng Âu - Á từ 10 thương hiệu, chính sách đổi trả 7 ngày miễn phí lần đầu, freeship từ 3 đôi hoặc 5tr, bảo hành 6-12 tháng, bảo dưỡng trọn đời, đồng kiểm xỏ thử tận nơi trước khi COD, voucher ONE10, vớ 49k, xịt nano 89k, cẩm nang chọn size dáng chân bè Á Đông...).
  - Mục đích: Không train model mới mà sử dụng kết hợp Fast Local Pre-Router (0ms) + Prompt Engineering + Dynamic Resolvers + Entity Extraction để đảm bảo chatbot trả lời đúng 100/100 câu hỏi bám sát kịch bản và từ chối khéo léo, dứt khoát các vấn đề ngoài phạm vi.
- **Kịch Bản Chuẩn 100 Tình Huống (`CHATBOT_100_SCENARIOS.md`):**
  - Đã xây dựng hoàn chỉnh và được người dùng **phê duyệt** 100 câu hỏi chia thành 8 nhóm nghiệp vụ:
    1. Nhóm 1: Chào hỏi & Phạm vi hoạt động (Câu 01 - 10)
    2. Nhóm 2: Chính sách bán hàng, giao vận, đổi trả & bảo hành (Câu 11 - 25)
    3. Nhóm 3: Cẩm nang kích cỡ & Chọn size dáng chân (Câu 26 - 38)
    4. Nhóm 4: Tư vấn theo nhu cầu thể thao & Điều kiện sử dụng (Câu 39 - 55)
    5. Nhóm 5: Tư vấn 10 thương hiệu & Phong cách Lifestyle (Câu 56 - 70)
    6. Nhóm 6: Tư vấn theo khoảng giá & Ngân sách (Câu 71 - 82)
    7. Nhóm 7: Quy trình đặt hàng, thu thập thông tin & Tra cứu đơn (Câu 83 - 90)
    8. Nhóm 8: Xử lý ngoại vi (Out-of-Scope) & Từ chối khéo léo (Câu 91 - 100)
- **Nâng Cấp Kỹ Thuật Trong `backend/src/chatbot.ts`:**
  1. **Pre-Router & Guardrails Phân Tuyến Cực Nhanh (0ms):**
     - Mở rộng Out-of-Scope Guardrail: Từ chối khéo các câu hỏi về tình cảm/người yêu (gợi ý Samba/Dunk Low để đi hẹn hò), tài chính/chứng khoán/giá vàng, thủ đô Pháp (kéo về thương hiệu Salomon của Pháp).
     - Loại trừ từ khóa đặt hàng khỏi Guardrail để tránh hiểu nhầm khi khách điền form (SĐT, họ tên, địa chỉ).
     - Phân định rõ `isWarranty` và `isReturn`: Giày bị rách, bung keo, đứt chỉ được định tuyến sang bảo hành kỹ thuật 6-12 tháng và dán keo trọn đời.
     - Cập nhật `isSmellPolicy` tư vấn thoáng khí, lót OrthoLite và phụ kiện vớ 49k/xịt nano 89k.
     - Loại trừ `(bảng quy đổi|quy đổi)` khỏi `isReturn` để tránh nuốt câu hỏi quy đổi size US sang EUR.
     - Hỗ trợ `isSizeByWeight` cho câu hỏi hỏi size theo cân nặng (ví dụ: `65kg thì đi giày size mấy`).
  2. **Bóc Tách Thực Thể Đặt Hàng Chuẩn Xác (Entity Extraction):**
     - Sửa regex `nameLabelMatch` và làm sạch tiền tố đại từ (`tôi là`, `mình là`, `em là`, `là`), ngắt trước dấu bullet `•`, `*`, `|`, `\n` và xóa sạch SĐT phía sau.
     - Sửa `addressLabelMatch`, `colorMatch` ngắt trước các nhãn tiếp theo.
     - Bóc tách size hỗ trợ định dạng `Size giày: 39` hoặc `sz 42`.
     - Bổ sung `hasAccessorySock` và `hasAccessorySpray` trong `extractOrderDetails`.
     - Bổ sung `size` vào `extractProductFilters` để hỗ trợ lọc size chính xác.
     - Khôi phục sản phẩm từ tin nhắn gần nhất của bot nếu khách đang trong chuỗi điền form mà chưa nhắc lại tên sản phẩm.
  3. **4 Resolvers Chuyên Sâu Bổ Sung:**
     - `isDailyShoe`: Tư vấn giày chạy hàng ngày / 360 ngày (loại bỏ hoàn toàn giày đĩa carbon, tập trung dòng đệm bền Pegasus, Ultraboost, Novablast).
     - `isWinterShoe`: Giày giữ ấm mùa đông (thân da, đệm dày, cổ cao).
     - `isStandingOrKneeShoe`: Đứng lâu 8 tiếng / giảm áp lực khớp gối (đệm ZoomX Invincible 3, Nimbus 26).
     - `isBasketballShoe`: Giày bóng rổ bật nhảy, bám sân (Jordan 4, Anta Shock Wave).
- **Kết Quả Kiểm Thử Toàn Diện:**
  - Bộ kiểm thử tự động `scripts/test_100_scenarios.ts`: **100/100 ĐẠT (100% PASS)**!
  - `test_user_scenarios.ts`: 20/20 ĐẠT (100%).
  - `test_chatbot_closed_domain.ts`: 37/37 ĐẠT (100%).
  - `test_chatbot_intent_routing.ts`: 26/26 ĐẠT (100%).
  - `test_chatbot_v2.mjs`: 17/17 ĐẠT (100%).
  - `npm run typecheck`: 0 lỗi biên dịch TypeScript.
  - Triển khai Cloudflare Workers Live Production thành công, kiểm thử trực tiếp 10/10 kịch bản phản hồi trung bình ~300ms, 100% Zero-Emoji.

---

### ADR-60: Nâng Cấp Mô Hình Workers AI Gemma 4 26B Instruct (@cf/google/gemma-4-26b-a4b-it) & Tái Cấu Trúc Toàn Diện Prompt Tư Vấn Thấu Hiểu Cảm Xúc, Phong Cách Theo Ngữ Cảnh
- **Bối cảnh & Vấn đề khách hàng phản hồi:**
  - Người dùng nhận thấy chatbot trả lời quá nhanh nhờ Fast Router/Template nhưng câu trả lời lại **thiếu đi cảm xúc và độ thấu hiểu khách hàng qua câu hỏi**.
  - Ví dụ thực tế người dùng chỉ ra:
    `User: "tôi hay đi sự kiện nên đi đôi giày nào để thể hiện sự sang trọng"`
    `Bot (cũ): "Dạ One - Store xin gửi bạn gợi ý các mẫu giày phù hợp với tiêu chí của bạn đang có sẵn tại kho: • Nike Air Zoom Pegasus 41... • Nike ZoomX Vaporfly 3... • Nike Dunk Low... • Adidas Samba... Toàn bộ sản phẩm đều là hàng phân phối chính hãng 100%..."`
    $\rightarrow$ Vừa gợi ý sai hoàn toàn chủng loại giày (đem giày chạy bộ đường dài Pegasus và giày đua marathon đế carbon hồng neon Vaporfly tư vấn cho sự kiện sang trọng!), vừa dùng văn mẫu bullet point vô cảm, thiếu sự suy nghĩ của mô hình.
- **Nguyên nhân gốc rễ (Root Cause Analysis):**
  1. Biến `isDirectCatalogQuery` trong `backend/src/chatbot.ts` có regex quá rộng (`/(đôi.*nào|mẫu.*nào|tìm đôi|tìm giày|có đôi nào|nên mua đôi)/i`), vô tình chặn đứng mọi câu hỏi tư vấn phong cách/hoàn cảnh và ép xuất ra template văn mẫu thô sơ.
  2. Bộ lọc `extractProductFilters` chưa phân loại các từ khóa hoàn cảnh (`sự kiện`, `sang trọng`, `tiệc`, `cưới`, `váy hoa`, `nữ tính`, `lịch sự`, `âu phục`) vào `category = 'Lifestyle'`.
  3. Mô hình cũ `@cf/meta/llama-3-8b-instruct` trên Cloudflare Workers AI đã bị khai tử (deprecated ngày 2026-05-30 sinh lỗi 5028), khiến hệ thống dễ bị trôi vào mảng Fallback.
  4. Ngân sách `max_tokens: 1000` quá hạn hẹp đối với mô hình Hybrid CoT Gemma 4, khiến phần reasoning ngốn hết token dẫn đến `finish_reason: length`.
- **Giải Pháp & Triển Khai Kỹ Thuật Chi Tiết:**
  1. **Nâng cấp mô hình LLM sang Gemma 4 26B Instruct:** Chuyển sang `@cf/google/gemma-4-26b-a4b-it`, nâng `max_tokens: 2500` và `temperature: 0.4` để câu trả lời sinh động, có chiều sâu, ấm áp và tự nhiên.
  2. **Thu hẹp Fast Template:** Chỉ trả Fast Template khi khách hỏi giá/kho của đúng 1 mẫu giày cụ thể (`isSingleProductInquiry`). Toàn bộ các câu hỏi tư vấn nhu cầu, hoàn cảnh, gu ăn mặc, sự kiện, dạo phố, phong cách đều **100% trôi xuống mô hình LLM reasoning**.
  3. **Tái cấu trúc System Prompt phân vai & cảm xúc:**
     - Bắt buộc đồng cảm và thấu hiểu chân thành hoàn cảnh của khách hàng ngay 1-2 câu mở đầu (đi sự kiện cần sang trọng, lịch thiệp; dạo phố với váy hoa cần nữ tính, nhẹ nhàng tôn dáng...).
     - Tư vấn có gu thẩm mỹ: Chỉ gợi ý 2-3 mẫu giày phù hợp nhất từ kho D1 và giải thích tinh tế lý do (chất liệu da mềm, phom dáng gọn gàng, phối màu nhã nhặn, đế gum cổ điển).
     - Độ dài chuẩn mực 100 - 150 từ, súc tích, tinh tế và tuân thủ 100% Zero-Emoji.
  4. **Tối ưu SQL Attribute Filter theo ngữ cảnh:**
     - Thêm nhận diện `isFormalOrEvent`, `isDressOutfit`, `is5k10k` để lọc chính xác danh mục Lifestyle sang trọng (Adidas Samba, Onitsuka Tiger Tokuten, Puma Palermo, New Balance 550), tuyệt đối loại trừ giày chạy bộ marathon khỏi ngữ cảnh sự kiện/tiệc cưới.
  5. **Nâng cấp Output Sanitizer & Vô hiệu hóa rò rỉ CoT/Metadata:**
     - Xóa bỏ việc ghi đè vô lý câu từ chối khi gặp cụm từ ngữ cảnh; chỉ làm sạch từ khóa kỹ thuật.
     - Cắt bỏ hoàn toàn các khối checklist nhẩm tiếng Anh và metadata của Gemma 4.
  6. **Làm mới Cache Key:** Tăng cache key lên `chat_cache_v15:`.
- **Kết Quả Nghiệm Thu:**
  - Bộ kiểm thử tự động 100 kịch bản `scripts/test_100_scenarios.ts`: **100/100 PASS**.
  - `scripts/test_user_scenarios.ts`: **20/20 PASS**.
  - `scripts/test_chatbot_closed_domain.ts`: **37/37 PASS**.
  - `scripts/test_chatbot_intent_routing.ts`: **26/26 PASS**.
  - `node scripts/test_chatbot_v2.mjs`: **17/17 PASS**.
  - `npm run typecheck`: **0 lỗi**.
  - Kiểm thử thực tế trên Cloudflare Workers Live Production (`https://one-store.onestoresportsshoes.workers.dev`):
    * *Câu sự kiện sang trọng:* Bot đồng cảm sâu sắc về sự kiện quan trọng, khẳng định phong cách và gu thẩm mỹ, tư vấn tinh tế Adidas Samba OG Classic và Onitsuka Tiger Tokuten Indoor Gum.
    * *Câu mặc váy hoa dạo phố:* Bot đồng cảm về nét dịu dàng, tự tin xuống phố, tư vấn ngọt ngào Puma Palermo Leather Gum (Hồng Pastel Phối Trắng) và Adidas Samba OG Classic.
    * Không còn văn mẫu khuôn sáo, câu từ tự nhiên, ấm áp, có cảm xúc và thông minh đúng chất mô hình LLM.

### ADR-61: Tối Ưu Tốc Độ Phản Hồi Chatbot (Smart Tiered Response, Tắt CoT Mặc Định `enable_thinking: false`, Bảo Vệ Smart Timeout 16s) & Báo Cáo Nghiệm Thu Toàn Diện
- **Bối cảnh:**
  - Sau khi nâng cấp lên `@cf/google/gemma-4-26b-a4b-it` ở ADR-60 để tăng cường cảm xúc và sự thấu hiểu khách hàng, người dùng đánh giá cao chất lượng câu trả lời nhưng phản ánh **tốc độ trả lời các câu hỏi chưa có kịch bản trước vẫn khá chậm**.
  - Kết quả đo thực tế câu hỏi *"Hãy tìm cho tôi đôi giày có giá từ 4-6 triệu"* trước khi tối ưu mất **21.200 ms (21,20 giây)** do mô hình 26B bật chế độ Chain-of-Thought mặc định (`enable_thinking: true`), suy luận nhẩm hàng trăm token trước khi sinh văn bản.
- **Triển Khai Kỹ Thuật Trong [chatbot.ts](file:///d:/HocTap/HK7/ChuyenDoiSo/project/one-store/backend/src/chatbot.ts):**
  1. **Kiến trúc Hybrid "Smart Tiered Response" (Mũi Nhọn 1.5 - Fast Budget & Attribute Resolver):**
     - Phân tách thông minh giữa câu hỏi **tra cứu có điều kiện ngân sách/thuộc tính rõ ràng** (`isBudgetQuery && !isAbstractStyleQuery`) và câu hỏi **tư vấn phong cách/ngữ cảnh mở**.
     - Với câu hỏi lọc ngân sách (ví dụ: *4-6 triệu*, *dưới 2 triệu*, *2-3 triệu*, *trên 4 triệu*) đã truy vấn ra sản phẩm chính xác từ D1: Tự động tổng hợp lời chào thấu hiểu ngân sách + mô tả nổi bật của top 3 sản phẩm + cam kết đồng kiểm xỏ thử COD và đổi size 7 ngày miễn phí.
     - **Thời gian phản hồi:** Giảm từ **21.200 ms** xuống còn **~189 ms - 1.048 ms** (tùy cold/cached, nhanh gấp **20 - 110 lần**), đồng thời đính kèm đầy đủ thẻ sản phẩm tương tác.
  2. **Tắt Chế Độ CoT Nhẩm Mặc Định Của Gemma 4 (`chat_template_kwargs: { enable_thinking: false }`):**
     - Theo tài liệu Cloudflare Workers AI, truyền `chat_template_kwargs: { enable_thinking: false }` và giới hạn `max_tokens: 550` giúp Gemma 4 26B bỏ qua hoàn toàn bước nhẩm `reasoning_content`, sinh trực tiếp văn bản tiếng Việt tinh tế, giàu cảm xúc ngay lập tức.
     - Bổ sung chỉ thị trong System Prompt yêu cầu phản hồi trực tiếp bằng tiếng Việt, không viết bản nháp tiếng Anh.
     - **Thời gian phản hồi Cold LLM:** Giảm từ **21.20 giây** xuống còn **~8.00 - 8.47 giây** (giảm > 60% độ trễ) và đạt **0% rò rỉ CoT**.
  3. **Bảo Vệ Chống Timeout (`Promise.race` 16s + Smart D1 Contextual Fallback):**
     - Bổ sung cơ chế timeout bảo vệ 16 giây quanh lệnh gọi `c.env.AI.run(...)`. Nếu cụm GPU Cloudflare gặp hiện tượng cold-start hoặc tắc nghẽn đột xuất, hệ thống tự động trả về `buildContextualFallback()` từ dữ liệu D1 đã lấy sẵn kèm danh sách sản phẩm phù hợp, đảm bảo **0% lỗi Timeout / treo kết nối**.
  4. **Làm Mới Cache Key:** Cập nhật cache key sang `chat_cache_v17:`.
- **Kết Quả Kiểm Thử & Nghiệm Thu Cuối Cùng (Ngày 11/11/2026):**
  1. **Kiểm tra biên dịch TypeScript (`npm run typecheck`):** **0 lỗi**.
  2. **Kiểm thử 5 bộ test tự động toàn hệ thống (200/200 PASS - 100%):**
     - `scripts/test_100_scenarios.ts` (100 kịch bản chuẩn Ground Truth): **100/100 ĐẠT**.
     - `scripts/test_user_scenarios.ts` (20 tình huống người dùng thực tế): **20/20 ĐẠT**.
     - `scripts/test_chatbot_closed_domain.ts` (37 tiêu chí Closed-Domain & Fast Routing): **37/37 ĐẠT**.
     - `scripts/test_chatbot_intent_routing.ts` (26 tiêu chí Intent Routing & Entity Extraction): **26/26 ĐẠT**.
     - `node scripts/test_chatbot_v2.mjs` (17 tiêu chí Pre-Router & Whisper): **17/17 ĐẠT**.
  3. **Kiểm thử thực tế trên Live Production (`https://one-store.onestoresportsshoes.workers.dev` - Version ID `7d3c4112-72b7-403b-9615-aecdf2512780`):**
     - *Smalltalk* (`"xin chào shop"`): **464 ms** | HTTP 200 | Zero-Emoji Đạt.
     - *Chính sách* (`"chính sách freeship và đổi size như thế nào"`): **118 ms** | HTTP 200 | Zero-Emoji Đạt.
     - *Lọc khoảng giá Tầng 1* (`"Hãy tìm cho tôi đôi giày có giá từ 4-6 triệu"`): **189 ms** (không cache lần đầu: **1.048 ms**) | Gợi ý chính xác 3 mẫu (`Nike ZoomX Vaporfly 3`, `Adidas Ultraboost Light`, `Adidas Adizero Adios Pro 3`) | Zero-Emoji Đạt.
     - *Chọn size dáng chân* (`"chân bè ngang thì nên chọn giày chạy bộ nào"`): **121 ms** | Đầy đủ cẩm nang 3 bước | Zero-Emoji Đạt.
     - *Tư vấn gu thẩm mỹ Tầng 2 (KV Cache Hit)* (`"tôi hay đi sự kiện nên đi đôi giày nào để thể hiện sự sang trọng"`): **170 ms** (Cold LLM: **8.401 ms**) | Gợi ý chuẩn Adidas Samba OG Classic & Superstar 82 | Zero-Emoji Đạt.
     - *Tình huống mới 100% Tầng 2 (Cold LLM)* (`"tôi chuẩn bị đi du lịch leo núi ở Đà Lạt cuối tuần nên mang đôi nào bám đường tốt"`): **8.474 ms** | Đồng cảm địa hình dốc trơn trượt, tư vấn chuẩn `Salomon XT-6 Black Phantom`, `Nike Pegasus Trail 4 GORE-TEX`, `Adidas Terrex Free Hiker 2 GORE-TEX` | 0% rò rỉ CoT | Zero-Emoji Đạt.
     - *Ngoài phạm vi Guardrail* (`"viết giúp tôi một đoạn code python tính dãy fibonacci"`): **136 ms** | Từ chối khéo léo và điều hướng về tư vấn size giày.

### ADR-62: Nâng Cấp UI/UX Frontend Toàn Diện (Voice Micro Lớn & Tự Ngắt 2s Im Lặng, Xóa Badge 3D, Banner 3 Câu Nói Nổi Tiếng, Active Menu Đỏ Toàn Trang)
- **Thời gian thực hiện:** 2026-11-11.
- **Các hạng mục đã triển khai:**
  1. **Chatbot Voice Micro Lớn & Bắt Dao Động Tự Ngắt Sau 2s Im Lặng ([voice.ts](file:///d:/HocTap/HK7/ChuyenDoiSo/project/one-store/frontend/src/lib/voice.ts), [ChatbotWidget.tsx](file:///d:/HocTap/HK7/ChuyenDoiSo/project/one-store/frontend/src/components/ChatbotWidget.tsx), [globals.css](file:///d:/HocTap/HK7/ChuyenDoiSo/project/one-store/frontend/src/app/globals.css)):**
     - Khắc phục lỗi CSS `.chat-form button` ép icon, nâng kích thước nút Micro lên `48×48px` (icon `<Mic size={24} />`) và nút Gửi/Dừng `46×46px`.
     - Xây dựng [`SilenceDetector`](file:///d:/HocTap/HK7/ChuyenDoiSo/project/one-store/frontend/src/lib/voice.ts#L107) & [`computeAudioMetrics`](file:///d:/HocTap/HK7/ChuyenDoiSo/project/one-store/frontend/src/lib/voice.ts#L53) bằng Web Audio API (`AudioContext` + `AnalyserNode`, quét mỗi `50ms` với ngưỡng nhiễu nền thích ứng).
     - Tự động ngắt thu âm sau `2000ms` im lặng: Nếu đã bắt được tiếng nói (`hasSpoken === true`) thì tự động gửi qua Whisper AI (`/api/chat/transcribe`) và đẩy câu hỏi cho chatbot; nếu im lặng hoàn toàn từ đầu thì tự hủy thu âm và nhả micro không tốn gọi API.
     - Thêm thanh hiển thị 14 cột sóng âm dao động thời gian thực (`.voice-waveform`), đếm ngược thời gian im lặng (`.voice-silence-fill`) và tách riêng trạng thái `isTranscribing` khỏi `isSending`.
  2. **Xóa Badge Tương Tác 3D ([Sneaker3DViewer.tsx](file:///d:/HocTap/HK7/ChuyenDoiSo/project/one-store/frontend/src/components/Sneaker3DViewer.tsx), [vi/common.ts](file:///d:/HocTap/HK7/ChuyenDoiSo/project/one-store/frontend/src/locales/vi/common.ts), [en/common.ts](file:///d:/HocTap/HK7/ChuyenDoiSo/project/one-store/frontend/src/locales/en/common.ts)):**
     - Gỡ bỏ `viewer_3d.badge` (`NIKE AIR JORDAN 1 · TƯƠNG TÁC 3D`) và khối pill badge nổi trên góc trên trái khung 3D.
  3. **Banner 3 Câu Nói Kinh Điển Trên Trang Chủ ([QuotesBanner.tsx](file:///d:/HocTap/HK7/ChuyenDoiSo/project/one-store/frontend/src/components/QuotesBanner.tsx), [page.tsx](file:///d:/HocTap/HK7/ChuyenDoiSo/project/one-store/frontend/src/app/page.tsx)):**
     - Đặt ngay phía trên mục **Top 4 sản phẩm bán chạy nhất** (`Hero` → `Perks` → `QuotesBanner` → `BestSellers` → `Footer`).
     - Trình bày 3 khung song ngữ Việt – Anh kèm chân dung lưu nội bộ trong `frontend/public/images/quotes/`: **Warren Buffett** (Uy tín thương hiệu), **Steve Jobs** (Trải nghiệm sản phẩm), **Jeff Bezos** (Bán hàng & Phục vụ khách hàng).
  4. **Đồng Bộ Trạng Thái Active Đỏ Trên Thanh Menu Điều Hướng ([Header.tsx](file:///d:/HocTap/HK7/ChuyenDoiSo/project/one-store/frontend/src/components/Header.tsx), [globals.css](file:///d:/HocTap/HK7/ChuyenDoiSo/project/one-store/frontend/src/app/globals.css)):**
     - Khắc phục lỗi `usePathname()` trả về đường dẫn có trailing slash (`/products/`, `/orders/`, `/policies/`) do cấu hình `trailingSlash: true` bằng chuẩn hóa `cleanPath`.
     - Toàn bộ 7 mục menu (`TRANG CHỦ`, `SẢN PHẨM`, `CHẠY BỘ`, `THỜI TRANG`, `DÃ NGOẠI`, `LỊCH SỬ MUA HÀNG`, `CHÍNH SÁCH`) chuyển sang chữ đỏ đậm `.navlinks a.active` + `aria-current="page"` ngay khi được chọn.
- **Kết Quả Kiểm Thử & Triển Khai Production:**
  - `npm run typecheck` & `npx tsc --noEmit --project frontend/tsconfig.json`: **0 lỗi**.
  - `npx tsx scripts/test_voice_vad.ts`: **19/19 ĐẠT**.
  - `npm run deploy`: Biên dịch 7/7 trang tĩnh, deploy thành công lên `https://one-store.onestoresportsshoes.workers.dev` (Version ID: `3fa8a91c-bfcd-4a15-a4d6-fccb1b9eade9`).

### ADR-63: Hệ Thống Thống Kê Lượt Ghé Thăm 24h Dual-Sink (Cloudflare D1 `visitor_logs` + Basin Catalog HTTP Stream `CHIEUTHU4-NHOM02`)
- **Thời gian thực hiện:** 2026-11-11.
- **Bối cảnh & Kiến trúc:**
  - Theo yêu cầu thống kê lượt truy cập, quốc gia và loại thiết bị trong 24 giờ qua và đẩy dữ liệu về Basin Catalog Stream Endpoint (`https://f8fb6f6f730b404fb2f273fd789d04df.ingest.cloudflare.com`, định danh `id = "CHIEUTHU4-NHOM02"`, `time` theo `millisecond`, `ip` thật và `device` phân nhóm `ios` / `android` / `windows` / `macos`).
- **Các thành phần đã triển khai:**
  1. **CSDL & Cấu hình ([0017_create_visitor_logs.sql](file:///d:/HocTap/HK7/ChuyenDoiSo/project/one-store/backend/migrations/0017_create_visitor_logs.sql), [wrangler.toml](file:///d:/HocTap/HK7/ChuyenDoiSo/project/one-store/wrangler.toml), [commerce.ts](file:///d:/HocTap/HK7/ChuyenDoiSo/project/one-store/backend/src/commerce.ts)):**
     - Tạo bảng `visitor_logs` (`id, _ingest_ts, country, device, time, ip, meta`) cùng 3 index trên D1 (`fashion_db`).
     - Thêm `[vars]` `BASIN_STREAM_URL` & `BASIN_SITE_ID = "CHIEUTHU4-NHOM02"` vào `wrangler.toml` và mở rộng `ShopBindings`.
  2. **Backend Dual-Sink & API 24h ([visitors.ts](file:///d:/HocTap/HK7/ChuyenDoiSo/project/one-store/backend/src/visitors.ts), [index.ts](file:///d:/HocTap/HK7/ChuyenDoiSo/project/one-store/backend/src/index.ts)):**
     - `POST /api/visit`: Trích xuất `country` từ Cloudflare Edge (`request.cf?.country` / `cf-ipcountry`), phân loại thiết bị theo hệ điều hành (`bot` → `ios` → `android` → `windows` → `macos` → `linux` → `other`), lấy IP thật (`cf-connecting-ip`), timestamp millisecond (`Date.now()`) và `meta` JSON (`visit_id, path, referrer, locale, screen, browser, os`).
     - Đẩy bất đồng bộ qua `c.executionCtx.waitUntil(pushToBasinStream(...))` dưới dạng mảng JSON `[{...}]` (đã xác thực endpoint yêu cầu array `code 1002`) kèm log `[Basin Stream Push OK]`, bỏ qua khi chạy `LOCAL`; đồng thời ghi bản sao vào D1 `visitor_logs`.
     - `GET /api/admin/analytics/visitors?hours=24`: Truy vấn tổng lượt truy cập, khách duy nhất (`COUNT(DISTINCT ip)`), phân bổ theo Quốc gia, Loại thiết bị, Top trang xem và nhật ký gần nhất.
  3. **Frontend Tracker & Admin 24h Panel ([VisitorTracker.tsx](file:///d:/HocTap/HK7/ChuyenDoiSo/project/one-store/frontend/src/components/VisitorTracker.tsx), [Providers.tsx](file:///d:/HocTap/HK7/ChuyenDoiSo/project/one-store/frontend/src/components/Providers.tsx), [admin/page.tsx](file:///d:/HocTap/HK7/ChuyenDoiSo/project/one-store/frontend/src/app/admin/page.tsx)):**
     - Gắn `<VisitorTracker />` gửi beacon nền khi khách mở/chuyển trang cửa hàng.
     - Thêm khối thống kê **LƯỢT GHÉ THĂM TRONG 24 GIỜ QUA (D1 VISITOR LOGS)** trong tab Tổng quan `/admin`, đồng bộ icon `<Smartphone />` cho `ios`/`android` và `<Monitor />` cho `windows`/`macos`/`linux`.
- **Kết Quả Kiểm Thử & Triển Khai:**
  - `npm run typecheck` & `npx tsc --noEmit --project frontend/tsconfig.json`: **0 lỗi**.
  - `npx tsx scripts/test_visitors.ts`: **17/17 ĐẠT**.
  - `npm run deploy`: Xuất bản thành công 7/7 trang tĩnh, deploy lên `https://one-store.onestoresportsshoes.workers.dev` (Version ID: `b98d8853-02d5-4e94-a505-bcb5fe975c43`).

---

## 3. DANH SÁCH CÁC FILE ĐÃ THAY ĐỔI
| Tệp Tin | Trạng Thái | Mô Tả Thay Đổi |
| :--- | :--- | :--- |
| `CHATBOT_100_SCENARIOS.md` | Created | Bảng kịch bản 100 câu hỏi và câu trả lời dự kiến chuẩn Ground Truth (được người dùng phê duyệt). |
| `scripts/test_100_scenarios.ts` | Created | Test suite tự động hóa 100 kịch bản câu hỏi thực tế khách hàng (100/100 PASS). |
| `backend/src/chatbot.ts` | Modified | Pre-Router, Guardrails, Mũi Nhọn 1.5 Fast Budget Resolver, Tích hợp Gemma 4 26B (`enable_thinking: false`, `max_tokens: 550`), Smart Timeout Guard 16s, Output Sanitizer, KV Cache `v17`, Zero-Emoji 100%. |
| `scripts/test_user_scenarios.ts` | Modified | Bộ kịch bản kiểm thử tự động 20 tình huống câu hỏi thực tế của khách hàng (100% Pass). |
| `scripts/test_live_scenarios.ts` | Modified | Bộ kiểm thử trực tiếp trên Cloudflare Workers Live Production (`/api/chat`) 10/10 kịch bản thực tế (100% Pass). |
| `frontend/src/lib/voice.ts` | Modified | Bổ sung Web Audio API `AnalyserNode`, `computeAudioMetrics`, `SilenceDetector` tự ngắt sau 2000ms im lặng. |
| `frontend/src/components/ChatbotWidget.tsx` | Modified | Nâng cấp nút Micro lớn `48×48px` (`<Mic size={24} />`), waveform dao động 14 cột, đếm ngược im lặng 2s, tách `isTranscribing`. |
| `frontend/src/components/Sneaker3DViewer.tsx` | Modified | Xóa badge nổi `NIKE AIR JORDAN 1 · TƯƠNG TÁC 3D` ở góc trên trái trình xem 3D. |
| `frontend/src/components/QuotesBanner.tsx` | Created | Banner lớn 3 khung câu nói của Warren Buffett, Steve Jobs, Jeff Bezos về uy tín, trải nghiệm và bán hàng. |
| `frontend/public/images/quotes/*` | Created | Lưu trữ nội bộ 3 ảnh chân dung (`warren-buffett.jpg`, `steve-jobs.jpg`, `jeff-bezos.jpg`). |
| `frontend/src/app/page.tsx` | Modified | Hiển thị `<QuotesBanner />` ngay phía trên `<BestSellers />` trên trang chủ. |
| `frontend/src/components/Header.tsx` | Modified | Chuẩn hóa `cleanPath` loại trailing slash, kích hoạt active đỏ `.navlinks a.active` cho toàn bộ 7 menu items. |
| `frontend/src/app/globals.css` | Modified | Bổ sung style nút micro/waveform, `.quotes-banner` / `.quote-card` responsive và `.navlinks a.active`. |
| `frontend/src/locales/vi/common.ts` & `en/common.ts` | Modified | Xóa `viewer_3d.badge`, bổ sung nội dung song ngữ `quotes_banner`. |
| `frontend/src/locales/vi/modals.ts` & `en/modals.ts` | Modified | Bổ sung các nhãn song ngữ cho trạng thái thu âm, dao động và tự ngắt 2s trong chatbot. |
| `scripts/test_voice_vad.ts` | Created | Bộ kiểm thử tự động 19 tiêu chí cho thuật toán bắt dao động âm thanh & tự ngắt im lặng 2s. |
| `backend/migrations/0017_create_visitor_logs.sql` | Created | Khởi tạo bảng `visitor_logs` và các index phục vụ thống kê 24h trên D1 `fashion_db`. |
| `backend/src/visitors.ts` | Created | API `POST /api/visit` (Dual-Sink: Basin Stream `CHIEUTHU4-NHOM02` + D1) và `GET /api/admin/analytics/visitors`. |
| `backend/src/commerce.ts` & `index.ts` | Modified | Mở rộng `ShopBindings` (`BASIN_STREAM_URL`, `BASIN_SITE_ID`) và mount `visitorsRouter`. |
| `wrangler.toml` | Modified | Bổ sung `[vars]` cấu hình `BASIN_STREAM_URL` và `BASIN_SITE_ID = "CHIEUTHU4-NHOM02"`. |
| `frontend/src/components/VisitorTracker.tsx` & `Providers.tsx` | Created/Modified | Component gửi beacon lượt ghé thăm không chặn UI trên các trang cửa hàng. |
| `frontend/src/app/admin/page.tsx` | Modified | Hiển thị khối thống kê 24h theo quốc gia, thiết bị (`ios`/`android`/`windows`/`macos`) và nhật ký gần nhất. |
| `basinCatalog/streamInfo.txt` & `restful/call_api.http` | Created | Tài liệu đặc tả schema Basin Catalog Stream và mẫu thử HTTP request. |
| `scripts/test_visitors.ts` | Created | Bộ kiểm thử tự động 17 tiêu chí cho phân loại thiết bị, quốc gia, IP và tích hợp Basin Stream + D1. |


---

## 5. BẢNG TRA CỨU LỆNH VẬN HÀNH

```bash
# 1. Chạy Backend Worker và phục vụ ứng dụng tại local (Port 8787)
npm run dev

# 2. Chạy Frontend Next.js dev server độc lập (Port 3000, có rewrite API sang 8787)
npm run dev:frontend

# 3. Biên dịch giao diện tĩnh frontend ra thư mục frontend/out/ và tự động refresh asset manifest
npm run build:frontend

# 4. Kiểm tra lỗi kiểu TypeScript toàn bộ dự án
npm run typecheck

# 5. Chạy migration cơ sở dữ liệu D1 local
npm run db:migrate:local

# 6. Triển khai toàn bộ ứng dụng lên Cloudflare Production
npm run deploy
```

---

## 6. HƯỚNG DẪN & NGUYÊN TẮC DÀNH CHO CÁC AGENT TIẾP THEO

1. **Tuân thủ bắt buộc 100% [CODE_CONVENTIONS.md](./CODE_CONVENTIONS.md)**:
   - Nghiêm cấm đưa emoji/unicode trực tiếp vào chuỗi text hoặc JSX. Bắt buộc dùng `lucide-react`.
   - Không hardcode chuỗi text hiển thị (luôn thêm vào `strings.ts`).
   - Không hardcode mã màu tùy tiện (luôn dùng tokens từ `theme.ts`).
   - Mọi câu lệnh SQL truy vấn D1 phải dùng parameterized query (`.prepare('...').bind(...)`).
2. **Quy trình build khi thay đổi frontend**:
   - Mọi thay đổi trong `frontend/src/` phải được biên dịch lại bằng `npm run build:frontend` để cập nhật `frontend/out/`.
3. **Bảo toàn Cloudflare Remote Bindings**:
   - Trong `wrangler.toml`, các giá trị `bucket_name = "one-store-images"` và `index_name = "ba-khi-knowledge"` là các tài nguyên thực tế đã cấp phát trên Cloudflare. Tuyệt đối không tự ý đổi tên.
4. **Kiểm tra trước khi bàn giao**:
   - Luôn chạy `npm run typecheck` (đạt 0 lỗi) và `npm run build:frontend` (mã thoát 0).
