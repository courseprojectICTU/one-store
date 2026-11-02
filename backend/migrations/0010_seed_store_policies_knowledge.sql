-- Migration 0010: Seed Bộ tài liệu chính sách Store làm tiền đề cho Chatbot RAG
-- Xóa tài liệu chính sách cũ nếu có
DELETE FROM chat_chunks WHERE document_id LIKE 'doc-%';
DELETE FROM chat_documents WHERE id LIKE 'doc-%';

INSERT INTO chat_documents (id, title, created_at) VALUES ('doc-authentic-policy', 'Chính sách Cam kết 100% Hàng Chính Hãng & Đền Bù 200%', CURRENT_TIMESTAMP);
INSERT INTO chat_chunks (id, document_id, chunk_index, content) VALUES ('doc-authentic-policy-0', 'doc-authentic-policy', 0, '[Chính sách Cam kết Hàng Chính Hãng One - Store]
1. Cam kết chất lượng 100% Authentic:
Toàn bộ sản phẩm giày thể thao và sneaker phân phối tại One - Store đều là hàng chính hãng 100%, có nguồn gốc xuất xứ rõ ràng từ các nhà phân phối chính thức của 10 thương hiệu hàng đầu thế giới:
- Nhóm thương hiệu Âu - Mỹ: Nike (Mỹ), Adidas (Đức), New Balance (Mỹ), Puma (Đức), Salomon (Pháp).
- Nhóm thương hiệu Châu Á: Asics (Nhật Bản), Onitsuka Tiger (Nhật Bản), Mizuno (Nhật Bản), Li-Ning (Trung Quốc), Anta (Trung Quốc).

2. Chính sách bồi hoàn gấp đôi:
Nếu khách hàng phát hiện bất kỳ sản phẩm nào do One - Store cung cấp là hàng giả, hàng nhái (Fake/Replica), One - Store cam kết hoàn tiền 200% (gấp đôi giá trị đơn hàng) và xin lỗi công khai.

3. Tình trạng sản phẩm khi nhận:
Sản phẩm đến tay khách hàng');
INSERT INTO chat_chunks (id, document_id, chunk_index, content) VALUES ('doc-authentic-policy-1', 'doc-authentic-policy', 1, 'iá trị đơn hàng) và xin lỗi công khai.

3. Tình trạng sản phẩm khi nhận:
Sản phẩm đến tay khách hàng luôn trong tình trạng nguyên hộp nguyên bản của hãng (Full Box), đầy đủ tem mác phụ, tag niêm phong, giấy gói giày và phụ kiện chính hãng (dây giày dự phòng nếu có).

4. Quy trình kiểm định 3 lớp khắt khe:
- Lớp 1: Kiểm định hồ sơ chứng từ nhập khẩu và hóa đơn đại lý ủy quyền.
- Lớp 2: Kiểm định vật lý chuyên sâu: chất liệu da, công nghệ đệm bọt (ZoomX, Boost, FF BLAST+, BOOM), đĩa Carbon, đường may kỹ thuật và tem nhiệt.
- Lớp 3: Đối chiếu mã vạch và SKU quốc tế trên hệ thống dữ liệu toàn cầu của thương hiệu.');
INSERT INTO chat_documents (id, title, created_at) VALUES ('doc-shipping-inspection-policy', 'Chính sách Vận Chuyển Toàn Quốc & Đồng Kiểm Tận Nơi', CURRENT_TIMESTAMP);
INSERT INTO chat_chunks (id, document_id, chunk_index, content) VALUES ('doc-shipping-inspection-policy-0', 'doc-shipping-inspection-policy', 0, '[Chính sách Vận chuyển & Đồng kiểm tận nơi One - Store]
1. Phạm vi và thời gian giao hàng:
- One - Store giao hàng tận nơi trên toàn quốc (63 tỉnh thành).
- Thời gian giao hàng tiêu chuẩn:
  + Khu vực nội thành Hà Nội và TP.HCM: 1 – 2 ngày làm việc.
  + Các tỉnh thành khác: 2 – 4 ngày làm việc.
  + Hỗ trợ giao hàng hỏa tốc trong 2 – 4 giờ tại Hà Nội và TP.HCM khi khách hàng liên hệ hotline 0900-ONE-STORE.

2. Cước phí vận chuyển:
- MIỄN PHÍ VẬN CHUYỂN TOÀN QUỐC (Freeship): Áp dụng cho mọi đơn hàng mua từ 3 đôi giày/sản phẩm trở lên (nhiều hơn 2 sản phẩm) hoặc đơn hàng có giá trị từ 5.000.000₫.
- Cước phí tiêu chuẩn cho đơn dưới 3 đôi: Đồng giá 30.000₫ trên toàn quốc.

3. Đặc quyền ĐỒNG KIỂM TẬN NƠI (Kiểm tra hàng trước khi trả tiền):
- Khách hàng có quyền mở hộp kiểm tra sản phẩm trước sự');
INSERT INTO chat_chunks (id, document_id, chunk_index, content) VALUES ('doc-shipping-inspection-policy-1', 'doc-shipping-inspection-policy', 1, 'TẬN NƠI (Kiểm tra hàng trước khi trả tiền):
- Khách hàng có quyền mở hộp kiểm tra sản phẩm trước sự chứng kiến của nhân viên giao hàng (bưu tá) trước khi thanh toán tiền mặt (COD).
- Kiểm tra: Đúng mẫu mã, đúng màu sắc, đúng cỡ giày (size) đã đặt trên website.
- Khách hàng được phép xỏ thử nhẹ chân trên bề mặt sạch (đặt trên giấy hoặc thảm sạch trong nhà, không chạm đất ngoài trời).
- Nếu không đúng mẫu mã, bị lỗi hoặc không vừa vặn, khách hàng có quyền từ chối nhận hàng ngay tại chỗ và trả lại cho bưu tá mà KHÔNG MẤT BẤT KỲ KHOẢN PHÍ NÀO.');
INSERT INTO chat_documents (id, title, created_at) VALUES ('doc-returns-exchange-policy', 'Chính sách Đổi Trả & Đổi Cỡ Giày Trong Vòng 7 Ngày', CURRENT_TIMESTAMP);
INSERT INTO chat_chunks (id, document_id, chunk_index, content) VALUES ('doc-returns-exchange-policy-0', 'doc-returns-exchange-policy', 0, '[Chính sách Đổi trả & Đổi size giày One - Store]
1. Thời hạn đổi trả:
Khách hàng được quyền đổi cỡ giày (size) hoặc đổi sang mẫu giày khác trong vòng 7 ngày kể từ ngày nhận hàng thành công theo biên bản của đơn vị vận chuyển.

2. Chi phí đổi cỡ giày:
One - Store hỗ trợ MIỄN PHÍ 100% CHI PHÍ VẬN CHUYỂN 2 CHIỀU cho lần đổi cỡ giày đầu tiên đối với đơn hàng mua tại cửa hàng.

3. Điều kiện đổi trả hợp lệ:
- Giày còn nguyên tem mác, nhãn giá và tag niêm phong của One - Store.
- Giày chưa từng qua sử dụng ngoài trời, mặt đế giày sạch sẽ, không trầy xước hay dính đất cát, không có mùi lạ hoặc dấu vết tẩy rửa hóa chất.
- Hộp giày nguyên vẹn, không bị xé rách móp méo, đầy đủ phụ kiện kèm theo (dây giày dự phòng, túi đựng, giấy lót).
- Có thông tin đơn hàng (số điện thoại người nhận hoặc mã đơn hàng');
INSERT INTO chat_chunks (id, document_id, chunk_index, content) VALUES ('doc-returns-exchange-policy-1', 'doc-returns-exchange-policy', 1, 'ày dự phòng, túi đựng, giấy lót).
- Có thông tin đơn hàng (số điện thoại người nhận hoặc mã đơn hàng ONE-...).

4. Quy trình đổi hàng 3 bước nhanh chóng:
- Bước 1: Liên hệ hotline 0900-ONE-STORE hoặc nhắn tin qua Chatbot "Tư vấn One" để thông báo mã đơn và cỡ giày cần đổi.
- Bước 2: Đóng gói giày cẩn thận vào hộp nguyên bản. Bưu tá của One sẽ đến tận nhà thu hồi kiện hàng đổi.
- Bước 3: One sẽ gửi ngay đôi giày cỡ mới đến tận tay bạn trong vòng 24 – 48 giờ sau khi nhận được yêu cầu đổi.');
INSERT INTO chat_documents (id, title, created_at) VALUES ('doc-warranty-policy', 'Chính sách Bảo Hành Chất Lượng Keo Đế 6 – 12 Tháng', CURRENT_TIMESTAMP);
INSERT INTO chat_chunks (id, document_id, chunk_index, content) VALUES ('doc-warranty-policy-0', 'doc-warranty-policy', 0, '[Chính sách Bảo hành Sản phẩm One - Store]
1. Thời hạn bảo hành:
- Bảo hành 6 tháng: Áp dụng cho các dòng giày chạy bộ thi đấu marathon chuyên nghiệp có đĩa Carbon hoặc siêu bọt trợ lực tốc độ (Nike Vaporfly/Alphafly, Adidas Adizero Adios Pro, Asics Metaspeed, Li-Ning Feidian).
- Bảo hành 12 tháng: Áp dụng cho toàn bộ các dòng giày thể thao Lifestyle, dạo phố, bóng rổ và dã ngoại (Adidas Samba, Superstar, Gazelle, Nike Air Force 1, Dunk Low, New Balance 550, Salomon XT-6).
- Hỗ trợ dán keo ép nhiệt gia cố miễn phí trọn đời cho mọi khách hàng của One - Store.

2. Phạm vi bảo hành miễn phí:
- Hở keo viền, bong tróc keo dán giữa thân giày (upper) và bộ đệm đế (midsole/outsole).
- Đứt chỉ may, bung đường may kỹ thuật do nhà sản xuất.
- Xẹp hoặc thủng túi khí đệm (Nike Zoom Air, Air Max) trong');
INSERT INTO chat_chunks (id, document_id, chunk_index, content) VALUES ('doc-warranty-policy-1', 'doc-warranty-policy', 1, 'bung đường may kỹ thuật do nhà sản xuất.
- Xẹp hoặc thủng túi khí đệm (Nike Zoom Air, Air Max) trong điều kiện vận động bình thường.
- Gãy vỡ kết cấu bọt đệm bất thường không do tác động ngoại lực sắc nhọn.

3. Các trường hợp từ chối bảo hành:
- Đế giày bị mòn vẹt tự nhiên do quá trình ma sát tập luyện hoặc ngả màu theo thời gian.
- Rách thân giày do va quẹt vật nhọn, động vật cắn hoặc ngâm trong chất tẩy rửa mạnh.
- Làm khô giày bằng nhiệt độ cao (máy sấy nóng, lửa than, phơi nắng gắt) gây co rúm biến dạng vật liệu.');
INSERT INTO chat_documents (id, title, created_at) VALUES ('doc-privacy-cookie-policy', 'Chính sách Bảo Mật Thông Tin & Quản Lý Dữ Liệu Cookie', CURRENT_TIMESTAMP);
INSERT INTO chat_chunks (id, document_id, chunk_index, content) VALUES ('doc-privacy-cookie-policy-0', 'doc-privacy-cookie-policy', 0, '[Chính sách Bảo mật Quyền Riêng Tư & Cookie One - Store]
1. Tôn chỉ mua hàng nhanh không cần tài khoản:
One - Store tôn trọng tối đa quyền riêng tư của khách hàng. Quý khách có thể mua sắm và thanh toán 1 bước mà không bắt buộc phải đăng ký tài khoản hay ghi nhớ mật khẩu.

2. Mục đích thu thập thông tin:
Hệ thống chỉ thu thập họ tên, số điện thoại và địa chỉ giao hàng với mục đích duy nhất:
- Xử lý đóng gói và giao hàng đến tận tay quý khách.
- Cập nhật thông báo mã vận đơn để quý khách theo dõi trạng thái đơn hàng.
- Hỗ trợ tra cứu lịch sử mua hàng, đổi size và bảo hành khi có yêu cầu.

3. Cơ chế Cookie Consent Gating minh bạch:
- Nếu khách hàng chưa bấm "Đồng ý & tiếp tục" trên thanh thông báo cookie, hệ thống tuyệt đối không lưu mã đơn hàng, lịch sử mua sắm hay thông tin cá nhân vào');
INSERT INTO chat_chunks (id, document_id, chunk_index, content) VALUES ('doc-privacy-cookie-policy-1', 'doc-privacy-cookie-policy', 1, 'hông báo cookie, hệ thống tuyệt đối không lưu mã đơn hàng, lịch sử mua sắm hay thông tin cá nhân vào Cookie hoặc LocalStorage của thiết bị.
- Dữ liệu giỏ hàng trong trường hợp chưa đồng ý cookie chỉ tồn tại tạm thời trong phiên duyệt web hiện tại.

4. Cam kết bảo mật tuyệt đối:
One - Store cam kết 100% KHÔNG BAO GIỜ bán, cho thuê, thương mại hóa hay chia sẻ số điện thoại, thông tin khách hàng cho bất kỳ bên thứ ba hay mạng lưới quảng cáo theo dõi nào.');
INSERT INTO chat_documents (id, title, created_at) VALUES ('doc-size-guide-fitting', 'Cẩm Nang Hướng Dẫn Đo Chân & Chọn Cỡ Giày Chuẩn Âu – Á', CURRENT_TIMESTAMP);
INSERT INTO chat_chunks (id, document_id, chunk_index, content) VALUES ('doc-size-guide-fitting-0', 'doc-size-guide-fitting', 0, '[Cẩm nang Hướng dẫn Đo Chân & Chọn Cỡ Giày Chuẩn Âu - Á]
1. Bảng quy đổi cỡ giày chuẩn quốc tế:
- Size 38 EUR = 5.5 US Men = 5.0 UK = Chiều dài bàn chân 24.0 cm
- Size 39 EUR = 6.5 US Men = 6.0 UK = Chiều dài bàn chân 24.5 cm
- Size 40 EUR = 7.0 US Men = 6.5 UK = Chiều dài bàn chân 25.0 cm
- Size 41 EUR = 8.0 US Men = 7.5 UK = Chiều dài bàn chân 26.0 cm
- Size 42 EUR = 8.5 US Men = 8.0 UK = Chiều dài bàn chân 26.5 cm
- Size 43 EUR = 9.5 US Men = 9.0 UK = Chiều dài bàn chân 27.5 cm
- Size 44 EUR = 10.0 US Men = 9.5 UK = Chiều dài bàn chân 28.0 cm
- Size 45 EUR = 11.0 US Men = 10.5 UK = Chiều dài bàn chân 29.0 cm

2. 3 bước đo chiều dài bàn chân chính xác tại nhà:
- Bước 1: Đặt tờ giấy A4 sát vào chân tường phẳng. Đứng thẳng người, đặt bàn chân lên giấy, gót chân chạm sát vào tường.
- Bước');
INSERT INTO chat_chunks (id, document_id, chunk_index, content) VALUES ('doc-size-guide-fitting-1', 'doc-size-guide-fitting', 1, 't vào chân tường phẳng. Đứng thẳng người, đặt bàn chân lên giấy, gót chân chạm sát vào tường.
- Bước 2: Dùng bút chì dựng thẳng đứng (vuông góc 90 độ), vạch một đường ngang tại điểm ngón chân dài nhất.
- Bước 3: Dùng thước kẻ đo khoảng cách từ mép giấy chạm tường đến vạch ngón chân vừa kẻ để có số đo Centimet (cm).

3. Lời khuyên chọn giày theo dáng chân người Việt Nam:
- Bàn chân bè ngang (mu bàn chân dày - đặc trưng người Việt): Nên ưu tiên chọn các dòng giày có phom thoải mái như Asics (bản 2E), Mizuno, New Balance hoặc tăng thêm 0.5 - 1 size đối với các mẫu giày phom thon của Nike (Pegasus, Vaporfly) và Adidas (Samba, Adizero).
- Giày chạy bộ marathon: Nên cộng thêm 0.5 cm vào chiều dài chân thực tế để ngón chân có khoảng hở co giãn khi vận động liên tục, tránh bị tụ máu bầm móng chân.');
INSERT INTO chat_chunks (id, document_id, chunk_index, content) VALUES ('doc-size-guide-fitting-2', 'doc-size-guide-fitting', 2, 'chân thực tế để ngón chân có khoảng hở co giãn khi vận động liên tục, tránh bị tụ máu bầm móng chân.
- Giày thời trang dạo phố: Chọn đúng kích cỡ chuẩn (True to size).
- Thời điểm đo chân tốt nhất là vào buổi chiều hoặc tối vì bàn chân lúc này đã vận động và nở ra kích thước lớn nhất trong ngày.');
