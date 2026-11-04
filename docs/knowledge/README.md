# KHO TRI THỨC CHATBOT AI RAG — ONE - STORE

Tài liệu này tổng hợp cấu trúc, phân loại và nội dung chi tiết của toàn bộ kho tri thức (Knowledge Base) phục vụ hệ thống Chatbot AI RAG (**Tư vấn One**) thuộc cửa hàng phân phối sneaker chính hãng **One - Store**.

---

## 1. TỔNG QUAN KIẾN TRÚC TRI THỨC

Hệ thống RAG của One - Store vận hành theo cơ chế kết hợp đa tầng:
1. **Lớp Tri Thức Bán Cấu Trúc (CSDL Cloudflare D1)**:
   - Bảng `chat_documents`: Lưu trữ thông tin tài liệu nguồn, tiêu đề và ngày khởi tạo.
   - Bảng `chat_chunks`: Lưu trữ các đoạn trích dẫn (chunks) sau khi phân đoạn qua thuật toán Smart Chunking (`splitIntoChunks`: tối đa 1.100 ký tự, gối đầu 140 ký tự tại ranh giới xuống dòng tự nhiên).
2. **Lớp Vector Ngữ Nghĩa (Cloudflare Vectorize)**:
   - Index `ba-khi-knowledge`: Chứa 31 vector nhúng 1024 chiều được sinh bởi mô hình Workers AI `@cf/baai/bge-m3`.
   - Tìm kiếm Top-5 vector tương đồng nhất khi người dùng gửi câu hỏi tư vấn.
3. **Lớp Thuộc Tính Có Cấu Trúc (SQL Attribute Filter)**:
   - Bảng `products`: Truy vấn thời gian thực 70 mẫu sneaker authentic với giá tiền, tồn kho, kích cỡ (sizes) và màu sắc (colors).
4. **Lớp Thực Thi Nghiệp Vụ (Agentic In-Chat Ordering)**:
   - Tự động gom thông tin đơn hàng 1 bước, đối soát tồn kho CSDL D1 và tạo đơn hàng COD chính thức.

---

## 2. DANH MỤC TÀI LIỆU TRI THỨC TRONG HỆ THỐNG

| Mã Tài Liệu | Tên File | Tiêu Đề Tri Thức | Mục Đích Sử Dụng Trong Chatbot |
| :--- | :--- | :--- | :--- |
| `doc-authentic-policy` | [01_chinh_sach_hang_chinh_hang.md](./01_chinh_sach_hang_chinh_hang.md) | Chính sách Cam kết 100% Hàng Chính Hãng & Đền Bù 200% | Giải đáp về nguồn gốc hàng hóa, quy trình kiểm định 3 lớp, cam kết Full Box và chính sách bồi hoàn gấp đôi. |
| `doc-shipping-inspection-policy` | [02_chinh_sach_van_chuyen_dong_kiem.md](./02_chinh_sach_van_chuyen_dong_kiem.md) | Chính sách Vận Chuyển Toàn Quốc & Đồng Kiểm Tận Nơi | Tư vấn thời gian giao hàng, điều kiện Freeship (từ 3 đôi hoặc đơn từ 5 triệu), phí ship 30k và quyền xỏ thử đồng kiểm. |
| `doc-returns-exchange-policy` | [03_chinh_sach_doi_tra_doi_size.md](./03_chinh_sach_doi_tra_doi_size.md) | Chính sách Đổi Trả & Đổi Cỡ Giày Trong Vòng 7 Ngày | Hướng dẫn đổi size giày miễn phí cước 2 chiều lần đầu, điều kiện sản phẩm còn nguyên tem mác, quy trình thu hồi tại nhà. |
| `doc-warranty-care-policy` | [04_chinh_sach_bao_hanh_cham_soc.md](./04_chinh_sach_bao_hanh_cham_soc.md) | Chính sách Bảo Hành 6-12 Tháng & Chăm Sóc Sneaker | Giải đáp thời hạn bảo hành bọt đệm/đĩa carbon (6 tháng), lifestyle (12 tháng), dán keo ép nhiệt trọn đời. |
| `doc-privacy-cookie-policy` | [05_chinh_sach_bao_mat_cookie.md](./05_chinh_sach_bao_mat_cookie.md) | Chính sách Bảo Mật Thông Tin & Quản Lý Dữ Liệu Cookie | Tư vấn quyền riêng tư, trải nghiệm mua không cần tài khoản, cơ chế Cookie Consent Gating minh bạch. |
| `doc-size-guide-fitting` | [06_cam_nang_do_chan_chon_size.md](./06_cam_nang_do_chan_chon_size.md) | Cẩm Nang Hướng Dẫn Đo Chân & Chọn Cỡ Giày Chuẩn Âu - Á | Quy đổi 4 hệ size (EUR, US, UK, CM), cách đo chân tại nhà, tư vấn phom chân bè người Việt, quy tắc chạy marathon +0.5cm. |
| `doc-products-catalog-specs` | [07_danh_muc_70_mau_sneaker.md](./07_danh_muc_70_mau_sneaker.md) | Danh Mục & Thông Số Kỹ Thuật 70 Mẫu Sneaker 10 Thương Hiệu | Tra cứu công nghệ độc quyền (ZoomX, Boost, PureGEL, Wave, BOOM, NitroEdge...), phân loại theo 4 mục đích và mức giá. |
| `agentic-ordering` | [08_quy_trinh_chot_don_in_chat.md](./08_quy_trinh_chot_don_in_chat.md) | Quy Trình Chốt Đơn Tự Động In-Chat & Nghiệp Vụ COD | Cấu trúc form gom thông tin, quy tắc kiểm định kho CSDL D1, bảng tóm tắt chốt đơn, voucher ONE10 và tra cứu `/orders`. |

---

## 3. NGUYÊN TẮC CẬP NHẬT KHO TRI THỨC

1. **Đồng Bộ Hai Chiều (D1 & Vectorize)**:
   - Khi chỉnh sửa nội dung trong các file Markdown này, cần cập nhật tương ứng vào file nạp liệu `scripts/prepare_seed_knowledge.mjs` hoặc qua API quản trị `POST /api/admin/knowledge`.
   - Mỗi văn bản cần phân đoạn bằng thuật toán Smart Chunking để sinh lại vector nhúng 1024 chiều BGE-M3 tương thích.
2. **Quy Chuẩn Ngôn Từ & Nhận Diện**:
   - Sử dụng đúng tên thương hiệu: **One - Store**, tên ngắn **One**.
   - Định vị: Chuyên phân phối giày thể thao và sneaker chính hãng Âu - Á. Không bán quần áo, phụ kiện thời trang hay hàng trôi nổi.
   - Giữ nghiêm ngặt quy chuẩn Zero-Emoji và tính trung thực tuyệt đối (không bịa đặt giá cả hoặc số lượng tồn kho).
