# ONE - STORE CODE CONVENTIONS & CLEAN CODE STANDARDS

> **File:** `CODE_CONVENTIONS.md`  
> **Phiên bản:** 1.0.0 (Áp dụng chính thức từ 2026-10-31)  
> **Phạm vi:** Toàn bộ mã nguồn `backend/` và `frontend/` thuộc dự án **One - Store (One)**.  
> **Mục tiêu:** Đảm bảo mã nguồn luôn sạch (Clean Code), dễ bảo trì, dễ mở rộng tính năng, không phát sinh lỗi tiềm ẩn và đồng nhất 100% phong cách lập trình giữa người phát triển và Agent.

---

## 1. NGUYÊN TẮC CỐT LÕI (CORE PRINCIPLES)

1. **Single Source of Truth (SSOT)**: Mọi dữ liệu cấu hình, mã màu, font chữ, văn bản giao diện đều phải được tập trung tại một nơi duy nhất (`constants/`). Không phân tán rải rác trong các component.
2. **Zero-Emoji Policy (Tuyệt đối không emoji)**: Không chèn emoji hay ký tự unicode biểu cảm vào chuỗi text, log, comment hoặc mã nguồn (cả backend lẫn frontend). Toàn bộ biểu tượng trực quan bắt buộc dùng thư viện `lucide-react`.
3. **No Hardcoded Strings (Không chèn text thô)**: Mọi text hiển thị cho người dùng, thông báo lỗi, nhãn nút, placeholder phải nằm trong từ điển [strings.ts](file:///d:/HocTap/HK7/ChuyenDoiSo/project/nhom-2-ba-khi-shop/frontend/src/constants/strings.ts) để sẵn sàng mở rộng đa ngôn ngữ (Việt - Anh).
4. **Type Safety First**: 100% mã nguồn TypeScript phải có kiểu dữ liệu rõ ràng. Nghiêm cấm sử dụng kiểu `any` tùy tiện mà không có lý do chính đáng. Mọi request body phía backend bắt buộc validate qua Zod schema.
5. **Frictionless UX**: Trải nghiệm đặt hàng tối giản số bước, cho phép mua hàng COD ngay lập tức mà không bắt buộc người dùng phải đăng ký/đăng nhập tài khoản.

---

## 2. QUY CHUẨN BACKEND (CLOUDFLARE WORKERS + HONO + D1)

### 2.1. Cấu trúc thư mục & Module
```
backend/
├── src/
│   ├── index.ts        # App Hono chính, CORS, error handler, route mounting
│   ├── commerce.ts     # Router nghiệp vụ thương mại điện tử (Orders, Cart, Vouchers, Tracking)
│   └── chatbot.ts      # Router AI Assistant (Workers AI Gemma, BGE-M3 Vectorize RAG)
└── migrations/         # D1 SQLite migrations (đánh số theo thứ tự: 0001_..., 0002_...)
```

### 2.2. Quy tắc Routing & Request Validation
* **Xác thực dữ liệu đầu vào (Zod)**:
  * Mọi endpoint nhận `POST`, `PUT`, `PATCH` phải định nghĩa schema kiểm tra bằng `zod`.
  * Parse dữ liệu an toàn qua `schema.safeParse(await c.req.json().catch(() => null))`.
  ```ts
  // CHUẨN:
  const checkoutSchema = z.object({
    customer_name: z.string().trim().min(2).max(100),
    phone: z.string().trim().regex(/^0\d{9,10}$/),
    address: z.string().trim().min(5).max(255),
    items: z.array(z.object({
      product_id: z.number().int().positive(),
      quantity: z.number().int().positive(),
      size: z.string().min(1),
      color: z.string().min(1),
    })).min(1),
  });
  ```
* **Phản hồi API đồng nhất**:
  * Thành công: Trả về HTTP 200/201 kèm dữ liệu JSON có cấu trúc rõ ràng: `{ ok: true, data: ... }` hoặc `{ ...data }`.
  * Thất bại: Sử dụng hàm helper `fail(message, status = 400)` trả về `{ error: message }` với HTTP code thích hợp (400, 401, 404, 409, 500).

### 2.3. Quy tắc Truy vấn Cơ sở dữ liệu (D1 Database)
* **Tuyệt đối chống SQL Injection**: Bắt buộc dùng parameterized query với `.bind(...)`. Nghiêm cấm dùng string concatenation (cộng chuỗi) để tạo câu lệnh SQL.
  ```ts
  // ĐÚNG:
  await c.env.DB.prepare('SELECT * FROM products WHERE id = ?').bind(id).first();

  // SAI (NGHIÊM CẤM):
  await c.env.DB.prepare(`SELECT * FROM products WHERE id = ${id}`).first();
  ```
* **Bảo vệ toàn vẹn dữ liệu đơn hàng & kho**:
  * Kiểm tra tồn kho trước khi tạo đơn: `SELECT stock FROM products WHERE id = ?`.
  * Giảm tồn kho bằng câu lệnh an toàn: `UPDATE products SET stock = stock - ? WHERE id = ? AND stock >= ?`.
  * Nếu số lượng hàng bị thay đổi đồng thời, trả về HTTP 409 ngay lập tức.
* **Xóa cache (KV Invalidation)**: Bất kỳ thao tác thêm/sửa/xóa sản phẩm nào phải gọi `invalidate(c.env)` để đảm bảo KV Cache được làm mới.

### 2.4. Quy tắc AI & Cloudflare Bindings
* Tuyệt đối không tự ý đổi tên các binding trong [wrangler.toml](file:///d:/HocTap/HK7/ChuyenDoiSo/project/nhom-2-ba-khi-shop/wrangler.toml) (`AI`, `IMAGES`, `VECTORIZE`, `DB`, `CACHE`, `ASSETS`).
* AI Prompt phải được chuẩn hóa, không chứa emoji và chỉ tập trung tư vấn đúng dòng sản phẩm giày thể thao phân phối của One - Store.

---

## 3. QUY CHUẨN FRONTEND (NEXT.JS 16 + REACT 19 + TYPESCRIPT)

### 3.1. Cấu trúc thư mục Frontend
```
frontend/src/
├── app/
│   ├── layout.tsx       # Root Layout: Tải Google Fonts (Outfit & Plus Jakarta Sans), SEO metadata
│   ├── page.tsx         # Trang chủ chính tích hợp các section
│   └── globals.css      # CSS Variables, Design system tokens, Floating card styles, Responsive
├── components/          # Các React component chuyên biệt, tách nhỏ theo chức năng
│   ├── Header.tsx       # Thanh điều hướng, Logo, Giỏ hàng, Yêu thích
│   ├── Hero.tsx         # Floating Hero Card, CTA mua hàng, Hướng dẫn chọn size
│   ├── ProductSection.tsx # Bảng điều khiển bộ lọc & lưới sản phẩm
│   ├── ProductCard.tsx  # Thẻ sản phẩm nổi bật, ảnh sneaker, nút Mua ngay
│   ├── CartDrawer.tsx   # Ngăn kéo giỏ hàng & form đặt hàng COD rút gọn
│   ├── Logo.tsx         # Bộ nhận diện thương hiệu One - Store (SVG độc quyền)
│   └── ...
├── constants/           # Single Source of Truth của Frontend
│   ├── theme.ts         # Mã màu (COLORS), Đổ bóng (SHADOWS), Bo góc (RADII), Phông chữ (FONTS)
│   ├── strings.ts       # Toàn bộ từ điển văn bản hiển thị giao diện (Tiếng Việt & dự phòng Tiếng Anh)
│   └── index.ts         # Barrel export cho constants
└── context/
    └── ShopContext.tsx  # Quản lý trạng thái toàn cục (Cart, Favorites, Dict, Active Modal)
```

### 3.2. Quy tắc Không Dùng Emoji & Sử dụng Icon (`lucide-react`)
* **Quy tắc tuyệt đối**: Không bao giờ đưa emoji trực tiếp vào JSX hoặc chuỗi văn bản.
* **Bộ Icon chuẩn**: Chỉ sử dụng các component icon từ thư viện `lucide-react`.
* **Cấu hình icon chuẩn mực**:
  * Luôn truyền `size` (hoặc className), màu `color` hoặc kế thừa currentColor.
  * Cung cấp `aria-hidden="true"` nếu đi kèm nhãn text, hoặc `aria-label` nếu là nút bấm dạng icon đơn độc.
  ```tsx
  // ĐÚNG:
  import { ShoppingBag, ArrowRight } from 'lucide-react';
  <button type="button" className="btn-primary" aria-label="Mua hàng">
    <span>{dict.cart.checkout_btn}</span>
    <ArrowRight size={16} />
  </button>

  // SAI (NGHIÊM CẤM):
  <button>Mua hàng 👉 🛒</button>
  ```

### 3.3. Quy tắc Text & Đa ngôn ngữ (`strings.ts`)
* Không viết văn bản tiếng Việt/Anh trực tiếp vào JSX của component.
* Lấy văn bản từ hook `useShop()`: `const { dict } = useShop();`.
* Khi cần thêm text mới:
  1. Mở [frontend/src/constants/strings.ts](file:///d:/HocTap/HK7/ChuyenDoiSo/project/nhom-2-ba-khi-shop/frontend/src/constants/strings.ts).
  2. Thêm key mới vào cả nhánh `vi` và nhánh `en` tương ứng.
  3. Gọi qua `dict.category.key` trong component.

### 3.4. Quy tắc Mã màu & Design System Tokens (`theme.ts`)
* Không sử dụng mã màu hex ngẫu nhiên (`#123456`, `#ff0000`, `rgb(...)`) rải rác trong style inline.
* Mọi màu sắc phải lấy từ [frontend/src/constants/theme.ts](file:///d:/HocTap/HK7/ChuyenDoiSo/project/nhom-2-ba-khi-shop/frontend/src/constants/theme.ts) hoặc CSS variables trong [globals.css](file:///d:/HocTap/HK7/ChuyenDoiSo/project/nhom-2-ba-khi-shop/frontend/src/app/globals.css):
  * **Màu nền chủ đạo**: `COLORS.background` (`#f8f9fa`), thẻ `COLORS.white` (`#ffffff`).
  * **Màu phụ điểm nhấn (Accent Red)**: `COLORS.red.primary` (`#e11d48`), `COLORS.red.light` (`#ffe4e6`).
  * **Màu chữ chính**: `COLORS.black.primary` (`#0a0a0a`), màu chữ phụ: `COLORS.gray[500]` (`#64748b`).
  * **Đường viền**: `COLORS.border.default` (`#e2e8f0`).

### 3.5. Quy chuẩn Typography (Tránh lỗi chữ phình ngang / ngắn dọc)
* **Font tiêu đề (Display Font)**: Luôn dùng `'Outfit', 'Plus Jakarta Sans', sans-serif` thông qua `FONTS.display` hoặc `var(--font-display)`.
* **Font nội dung (Body Font)**: Luôn dùng `'Plus Jakarta Sans', sans-serif` thông qua `FONTS.sans` hoặc `var(--font-sans)`.
* **Tỷ lệ hình học**:
  * `line-height` cho tiêu đề H1-H3: **Từ `1.22` đến `1.28`** (đảm bảo dấu hỏi, ngã, nặng của tiếng Việt không bị cắt xén hoặc ép lùn).
  * `line-height` cho tên sản phẩm & thẻ con: **`1.35` đến `1.45`**.
  * `letter-spacing`:
    * Tiêu đề: **`-0.01em` đến `0`** (không dùng nhỏ hơn `-0.02em` để tránh co ép dính chữ).
    * Nhãn con uppercase (eyebrow, category pill): **`0.06em` đến `0.08em`**.

### 3.6. Bố cục Giao diện Thẻ Nổi (Floating Elevated Cards)
* Mọi khối nội dung quan trọng (`Hero`, `Perks`, `Filter Hub`, `Product Cards`, `Story Banner`, `Admin Panel`) đều tuân theo phong cách **Thẻ Nổi**:
  * Nền thẻ: Nền trắng (`#ffffff`), tách biệt rõ khỏi nền trang xám studio (`#f8f9fa`).
  * Viền mảnh: `1px solid #e2e8f0`.
  * Bo góc mềm mại: `16px` cho card nhỏ, `22px` - `28px` cho hero / banner.
  * Hiệu ứng nâng (hover lift): `transform: translateY(-4px)` đến `-6px` kết hợp `box-shadow` nhẹ nhàng.

---

## 4. QUY ƯỚC ĐẶT TÊN & ĐỊNH DẠNG (NAMING CONVENTIONS)

| Đối tượng | Quy ước | Ví dụ |
| :--- | :--- | :--- |
| **Thư mục Component** | kebab-case hoặc camelCase | `components/`, `context/` |
| **Tệp Component** | PascalCase | `ProductCard.tsx`, `CartDrawer.tsx` |
| **Tệp Utility / Hook** | camelCase | `useShop.ts`, `formatters.ts` |
| **Tệp Hằng số** | camelCase | `theme.ts`, `strings.ts` |
| **Component React** | PascalCase | `function ProductCard() {}` |
| **Hooks** | `use` + PascalCase | `useShop()` |
| **Biến hằng số toàn cục** | UPPER_SNAKE_CASE | `COLORS`, `FONTS`, `DEFAULT_LOCALE` |
| **Biến thông thường & Hàm** | camelCase | `fetchProducts()`, `selectedCategory` |
| **CSS Classes** | kebab-case | `.hero-wrapper`, `.product-card`, `.chip` |
| **Interface / Type** | PascalCase | `interface Product {}`, `type CartItem = ...` |
| **Bảng cơ sở dữ liệu** | snake_case (số nhiều) | `products`, `orders`, `chat_documents` |
| **Cột cơ sở dữ liệu** | snake_case | `customer_name`, `compare_at_price` |

---

## 5. QUY TRÌNH KIỂM THỬ & BUILD (WORKFLOW & INTEGRATION)

### 5.1. Các lệnh kiểm tra bắt buộc trước khi bàn giao
Mỗi khi chỉnh sửa mã nguồn, bắt buộc phải chạy các lệnh sau và đảm bảo thoát mã 0:
```bash
# 1. Kiểm tra toàn bộ kiểu TypeScript (Backend & Root)
npm run typecheck

# 2. Biên dịch Frontend tĩnh ra frontend/out/ và tự động làm mới Manifest cho Wrangler
npm run build:frontend
```

### 5.2. Cơ chế Đồng bộ Tài nguyên Tĩnh (Asset Manifest Hot-Reloading)
* Script `npm run build:frontend` trong [package.json](file:///d:/HocTap/HK7/ChuyenDoiSo/project/nhom-2-ba-khi-shop/package.json#L9) đã được tích hợp tự động cập nhật thời gian ghi tệp `backend/src/index.ts`.
* Điều này giúp tiến trình `wrangler dev` đang chạy nền nhận biết và lập chỉ mục lại toàn bộ mã băm (hash) của static chunk mới, triệt tiêu 100% lỗi `404 Not Found` trên tệp `.css` và `.js`.

---

## 6. DANH MỤC KIỂM TRA CLEAN CODE (CLEAN CODE CHECKLIST)

Trước khi coi một tác vụ là hoàn thành, hãy tự kiểm tra theo checklist sau:
- [ ] Không có bất kỳ emoji unicode nào trong code hoặc text.
- [ ] Không có text tiếng Việt/Anh hiển thị hardcode trong component (đã đưa vào `strings.ts`).
- [ ] Không có mã màu tùy tiện (đã dùng token `theme.ts` hoặc CSS variable).
- [ ] Các icon dùng đúng thư viện `lucide-react`.
- [ ] Đã chạy `npm run typecheck` đạt 0 lỗi.
- [ ] Đã chạy `npm run build:frontend` tạo thư mục `frontend/out/` mới nhất.
- [ ] Giao diện đáp ứng tốt trên cả Mobile, Tablet và Desktop.
