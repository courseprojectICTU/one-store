-- Migration 0010: Seed Bộ tài liệu chính sách Store & Thông số Sneaker cho Chatbot RAG
-- Khởi tạo bảng tri thức chuẩn cho hệ thống RAG nếu chưa tồn tại
CREATE TABLE IF NOT EXISTS chat_documents (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS chat_chunks (
  id TEXT PRIMARY KEY,
  document_id TEXT NOT NULL REFERENCES chat_documents(id) ON DELETE CASCADE,
  chunk_index INTEGER NOT NULL,
  content TEXT NOT NULL,
  UNIQUE(document_id, chunk_index)
);

CREATE INDEX IF NOT EXISTS idx_chat_chunks_document ON chat_chunks(document_id);

-- Làm sạch dữ liệu cũ
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
Sản phẩm đến tay khách hàng luôn trong tình trạng nguyên hộp nguyên bản của hãng (Full Box), đầy đủ tem mác phụ, tag niêm phong, giấy gói giày và phụ kiện chính hãng (dây giày dự phòng nếu có).');
INSERT INTO chat_chunks (id, document_id, chunk_index, content) VALUES ('doc-authentic-policy-1', 'doc-authentic-policy', 1, 'yên hộp nguyên bản của hãng (Full Box), đầy đủ tem mác phụ, tag niêm phong, giấy gói giày và phụ kiện chính hãng (dây giày dự phòng nếu có).

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
- Cước phí tiêu chuẩn cho đơn dưới 3 đôi: Đồng giá 30.000₫ trên toàn quốc.');
INSERT INTO chat_chunks (id, document_id, chunk_index, content) VALUES ('doc-shipping-inspection-policy-1', 'doc-shipping-inspection-policy', 1, 'ên (nhiều hơn 2 sản phẩm) hoặc đơn hàng có giá trị từ 5.000.000₫.
- Cước phí tiêu chuẩn cho đơn dưới 3 đôi: Đồng giá 30.000₫ trên toàn quốc.

3. Đặc quyền ĐỒNG KIỂM TẬN NƠI (Kiểm tra hàng trước khi trả tiền):
- Khách hàng có quyền mở hộp kiểm tra sản phẩm trước sự chứng kiến của nhân viên giao hàng (bưu tá) trước khi thanh toán tiền mặt (COD).
- Kiểm tra: Đúng mẫu mã, đúng màu sắc, đúng cỡ giày (size) đã đặt trên website.
- Khách hàng được phép xỏ thử nhẹ chân trên bề mặt sạch (đặt trên giấy hoặc thảm sạch trong nhà, không chạm đất ngoài trời).
- Nếu không đúng mẫu mã, bị lỗi hoặc không vừa vặn, khách hàng có quyền từ chối nhận hàng ngay tại chỗ và trả lại cho bưu tá mà KHÔNG MẤT BẤT KỲ KHOẢN PHÍ NÀO.');
INSERT INTO chat_documents (id, title, created_at) VALUES ('doc-returns-exchange-policy', 'Chính sách Đổi Trả & Đổi Cỡ Giày Trong Vòng 7 Ngày', CURRENT_TIMESTAMP);
INSERT INTO chat_chunks (id, document_id, chunk_index, content) VALUES ('doc-returns-exchange-policy-0', 'doc-returns-exchange-policy', 0, '[Chính sách Đổi Trả & Đổi Cỡ Giày One - Store]
1. Thời hạn hỗ trợ đổi trả:
- Áp dụng trong vòng 7 ngày kể từ thời điểm khách hàng nhận hàng thành công từ đơn vị vận chuyển.

2. Miễn phí vận chuyển đổi cỡ giày:
- One - Store hỗ trợ MIỄN PHÍ 100% CƯỚC VẬN CHUYỂN 2 CHIỀU cho lần đổi cỡ giày (size) đầu tiên đối với mọi đơn hàng mua tại cửa hàng.

3. Đổi sang mẫu sản phẩm khác:
- Khách hàng được quyền đổi sang mẫu giày khác theo sở thích: nếu sản phẩm mới có giá trị cao hơn, khách hàng thanh toán phần tiền chênh lệch; nếu thấp hơn, cửa hàng sẽ hoàn lại tiền thừa hoặc cấp mã giảm giá tương đương.

4. Điều kiện sản phẩm chấp nhận đổi trả:
- Sản phẩm còn nguyên tem mác, nhãn giá và tag niêm phong One - Store nguyên vẹn chưa bị cắt rời.
- Giày hoàn toàn chưa từng qua sử dụng ngoài trời, mặt đế sạch sẽ tinh tươm, không trầy xước, dính đất cát hay hóa chất tẩy rửa.
- Hộp giày nguyên bản (Full Box), không rách nát, biến dạng; còn đủ giấy gói giày và phụ kiện đi kèm (dây giày dự phòng, thẻ thương hiệu).
- Cung cấp số điện thoại đặt hàng hoặc mã đơn hàng (tiền tố ONE-...) để tra cứu trên hệ thống.');
INSERT INTO chat_chunks (id, document_id, chunk_index, content) VALUES ('doc-returns-exchange-policy-1', 'doc-returns-exchange-policy', 1, 'đi kèm (dây giày dự phòng, thẻ thương hiệu).
- Cung cấp số điện thoại đặt hàng hoặc mã đơn hàng (tiền tố ONE-...) để tra cứu trên hệ thống.

5. Quy trình 3 bước đổi giày tận nhà:
- Bước 1: Liên hệ hotline 0900-ONE-STORE hoặc nhắn tin cho Chatbot "Tư vấn One" báo cỡ giày cần đổi.
- Bước 2: Đóng gói sản phẩm cẩn thận vào hộp nguyên bản, bưu tá của One sẽ đến tận nhà thu hồi kiện hàng đổi.
- Bước 3: Ngay khi nhận được đơn đổi, One sẽ gửi đôi giày cỡ mới đến tận tay bạn trong vòng 24 – 48 giờ.');
INSERT INTO chat_documents (id, title, created_at) VALUES ('doc-warranty-care-policy', 'Chính sách Bảo Hành 6-12 Tháng & Vệ Sinh Sneaker Chuẩn Hãng', CURRENT_TIMESTAMP);
INSERT INTO chat_chunks (id, document_id, chunk_index, content) VALUES ('doc-warranty-care-policy-0', 'doc-warranty-care-policy', 0, '[Chính sách Bảo Hành & Chăm Sóc Sneaker One - Store]
1. Thời hạn bảo hành chất lượng chính hãng:
- Bảo hành 6 tháng: Áp dụng cho các dòng giày chạy bộ marathon đỉnh cao có đĩa đệm Carbon hoặc siêu bọt trợ lực tốc độ (Nike Vaporfly/Alphafly, Adidas Adizero Adios Pro, Asics Metaspeed, Li-Ning Feidian).
- Bảo hành 12 tháng: Áp dụng cho các dòng giày thể thao Lifestyle, dạo phố, bóng rổ và dã ngoại (Adidas Samba, Superstar, Nike Air Force 1, Dunk Low, New Balance 550, Salomon XT-6).
- Hỗ trợ dán keo ép nhiệt gia cố miễn phí trọn đời cho mọi khách hàng của One - Store.

2. Các trường hợp được bảo hành miễn phí:
- Bung keo viền, bong tróc keo dán giữa thân giày (upper) và bộ đệm đế (midsole/outsole).
- Đứt chỉ may, bung đường may kỹ thuật do lỗi của nhà sản xuất.
- Xẹp túi khí đệm (Nike Zoom Air, Air Max) hoặc vỡ kết cấu bọt đệm bất thường trong điều kiện sử dụng thể thao bình thường.');
INSERT INTO chat_chunks (id, document_id, chunk_index, content) VALUES ('doc-warranty-care-policy-1', 'doc-warranty-care-policy', 1, 'ủa nhà sản xuất.
- Xẹp túi khí đệm (Nike Zoom Air, Air Max) hoặc vỡ kết cấu bọt đệm bất thường trong điều kiện sử dụng thể thao bình thường.

3. Các trường hợp không thuộc diện bảo hành:
- Đế giày bị mòn vẹt tự nhiên do ma sát bề mặt sân bãi qua thời gian dài sử dụng.
- Rách thân giày do va quẹt vật nhọn, thú cưng cào cắn hoặc tiếp xúc hóa chất tẩy rửa mạnh.
- Giày bị biến dạng do sấy khô ở nhiệt độ cao (bếp lửa, máy sấy tóc nóng rực, phơi nắng gắt trực tiếp).

4. Quy trình tiếp nhận và xử lý bảo hành:
- Khách hàng mang trực tiếp đến cửa hàng hoặc gửi chuyển phát nhanh về trung tâm bảo hành của One. Thời gian xử lý kỹ thuật từ 3 – 5 ngày làm việc.');
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
- Nếu khách hàng chưa bấm "Đồng ý & tiếp tục" trên thanh thông báo cookie, hệ thống tuyệt đối không lưu mã đơn hàng, lịch sử mua sắm hay thông tin cá nhân vào Cookie hoặc LocalStorage của thiết bị.
- Dữ liệu giỏ hàng trong trường hợp chưa đồng ý cookie chỉ tồn tại tạm thời trong phiên duyệt web hiện tại.');
INSERT INTO chat_chunks (id, document_id, chunk_index, content) VALUES ('doc-privacy-cookie-policy-1', 'doc-privacy-cookie-policy', 1, 'hoặc LocalStorage của thiết bị.
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
- Bước 2: Dùng bút chì dựng thẳng đứng (vuông góc 90 độ), vạch một đường ngang tại điểm ngón chân dài nhất.
- Bước 3: Dùng thước kẻ đo khoảng cách từ mép giấy chạm tường đến vạch ngón chân vừa kẻ để có số đo Centimet (cm).');
INSERT INTO chat_chunks (id, document_id, chunk_index, content) VALUES ('doc-size-guide-fitting-1', 'doc-size-guide-fitting', 1, 'điểm ngón chân dài nhất.
- Bước 3: Dùng thước kẻ đo khoảng cách từ mép giấy chạm tường đến vạch ngón chân vừa kẻ để có số đo Centimet (cm).

3. Lời khuyên chọn giày theo dáng chân người Việt Nam:
- Bàn chân bè ngang (mu bàn chân dày - đặc trưng người Việt): Nên ưu tiên chọn các dòng giày có phom thoải mái như Asics (bản 2E), Mizuno, New Balance hoặc tăng thêm 0.5 - 1 size đối với các mẫu giày phom thon của Nike (Pegasus, Vaporfly) và Adidas (Samba, Adizero).
- Giày chạy bộ marathon: Nên cộng thêm 0.5 cm vào chiều dài chân thực tế để ngón chân có khoảng hở co giãn khi vận động liên tục, tránh bị tụ máu bầm móng chân.
- Giày thời trang dạo phố: Chọn đúng kích cỡ chuẩn (True to size).
- Thời điểm đo chân tốt nhất là vào buổi chiều hoặc tối vì bàn chân lúc này đã vận động và nở ra kích thước lớn nhất trong ngày.');
INSERT INTO chat_documents (id, title, created_at) VALUES ('doc-products-catalog-specs', 'Danh Mục & Thông Số Kỹ Thuật 70 Mẫu Sneaker 10 Thương Hiệu Âu - Á', CURRENT_TIMESTAMP);
INSERT INTO chat_chunks (id, document_id, chunk_index, content) VALUES ('doc-products-catalog-specs-0', 'doc-products-catalog-specs', 0, '[Danh Mục Sản Phẩm & Thông Số Kỹ Thuật One - Store]
1. Hệ thống 10 thương hiệu thể thao đối tác tại One - Store:
One - Store phân phối 70 mẫu sneaker chính hãng (mỗi hãng 7 mẫu) đến từ 10 thương hiệu hàng đầu thế giới:
- Nhóm Âu - Mỹ:
  + Nike (Hoa Kỳ): Dòng giày biểu tượng toàn cầu với đệm khí Air Zoom, bọt siêu nhẹ ZoomX hoàn trả lực vượt trội, bọt ReactX bền bỉ và đĩa carbon Flyplate nguyên khối (Pegasus 41, Vaporfly 3, Invincible 3, Vomero 17, Dunk Low Panda, Air Force 1 07, Pegasus Trail 4).
  + Adidas (Đức): Huyền thoại 3 sọc với đệm Light BOOST siêu êm ái, bọt Lightstrike Pro, thanh carbon Energyrods 2.0 và phong cách Terrace retro (Samba OG, Gazelle Indoor, Superstar 82, Ultraboost Light, Adizero Adios Pro 3, Boston 12, Terrex Free Hiker 2).
  + New Balance (Hoa Kỳ): Thiết kế dad shoes thanh lịch với đệm Fresh Foam X mềm như mây, bọt FuelCell trợ lực nảy, đệm ABZORB và khung nhựa Stability Web (550 White Grey, 530 Steel Grey, 2002R Protection Pack, 1906R Metallic, Fresh Foam X 1080v13, FuelCell Rebel v4, Hierro v8).');
INSERT INTO chat_chunks (id, document_id, chunk_index, content) VALUES ('doc-products-catalog-specs-1', 'doc-products-catalog-specs', 1, 'a Stability Web (550 White Grey, 530 Steel Grey, 2002R Protection Pack, 1906R Metallic, Fresh Foam X 1080v13, FuelCell Rebel v4, Hierro v8).
  + Puma (Đức): Đột phá tốc độ với bọt bơm khí nitơ Nitro Elite, đĩa carbon INNOPLATE, đế PUMAGRIP bám cả đường ướt và phong cách retro Palermo / Suede (Palermo Leather Gum, Suede Classic, Army Trainer, Deviate Nitro 2, Velocity Nitro 3, MB.03 LaMelo, Voyage Nitro 3).
  + Salomon (Pháp): Dẫn đầu xu hướng Gorpcore với khung đế Agile Chassis System (ACS) chống lật cổ chân, gai đế Contagrip bám sâu bùn đá, dây rút Quicklace và màng GORE-TEX chống nước (XT-6 Black Phantom, ACS Pro Advanced Metal, Speedcross 6, Pulsar Trail Pro, XT-4 OG, X Ultra 4 GTX, Speedverse PRG).');
INSERT INTO chat_chunks (id, document_id, chunk_index, content) VALUES ('doc-products-catalog-specs-2', 'doc-products-catalog-specs', 2, 'ng GORE-TEX chống nước (XT-6 Black Phantom, ACS Pro Advanced Metal, Speedcross 6, Pulsar Trail Pro, XT-4 OG, X Ultra 4 GTX, Speedverse PRG).

2. Nhóm thương hiệu Châu Á chuẩn phom chân người Việt:
  + Asics (Nhật Bản): Công nghệ PureGEL giấu trong gót êm hơn 65%, bọt FF BLAST+ ECO, hệ thống hỗ trợ 4D Guidance System điều chỉnh chống lệch cổ chân và bọt đua FF TURBO PLUS (Gel-Nimbus 26, Gel-Kayano 31, Novablast 4, GT-2000 12, Gel-NYC, Metaspeed Sky Paris, Gel-Trabuco 12).
  + Onitsuka Tiger (Nhật Bản): Tinh hoa thủ công xứ Phù Tang với da bò mềm mại, phiên bản Super Deluxe (SD) da thuộc cao cấp và thiết kế sọc hổ thanh mảnh bất hủ (Mexico 66 White Blue Red, Mexico 66 SD, Serrano Retro Gold, Tokuten Indoor Gum, GSM Court Vintage, Delegation EX Chunky, Mexico 66 Yellow Kill Bill).
  + Mizuno (Nhật Bản): Đĩa đệm cơ học Wave phân tán chấn động độc quyền, bọt MIZUNO ENERZY CORE siêu êm, hợp tác cùng lốp xe Michelin (Wave Rider 28, Wave Inspire 20, Wave Skyrise 5, Wave Rebellion Pro 2 Carbon, Wave Mujin 10 Michelin, Wave Momentum 3 Court, Contender Retro).');
INSERT INTO chat_chunks (id, document_id, chunk_index, content) VALUES ('doc-products-catalog-specs-3', 'doc-products-catalog-specs', 3, 'ave Rider 28, Wave Inspire 20, Wave Skyrise 5, Wave Rebellion Pro 2 Carbon, Wave Mujin 10 Michelin, Wave Momentum 3 Court, Contender Retro).
  + Li-Ning (Trung Quốc): Bọt đệm BOOM PEBA ép nhiệt siêu tới hạn nảy hơn 80%, đĩa carbon uốn cong toàn phần, cao su chống mài mòn TUFF RB gấp 5 lần và giày signature Dwyane Wade (Feidian 3.0 Elite Carbon, Yueying 3 Pro, Super Light 21, Way of Wade 10 Mint Blossom, YuShuai 18 V2, Shadow 2 Double Carbon, Rouge Rabbit 7 Pro).
  + Anta (Trung Quốc): Đệm NitroEdge siêu nảy, hệ thống hấp thụ lực SMART S.A.M đến 95%, khóa gót carbon 3D và giày bóng rổ cày sân bê tông Klay Thompson (KT8 Shock The Game, KT9 3D Carbon Stabilizer, Shock The Game 7 Cement King, C202 GT Pro Carbon, PG7 Nitro, Mach 4, Walker Retro).');
INSERT INTO chat_chunks (id, document_id, chunk_index, content) VALUES ('doc-products-catalog-specs-4', 'doc-products-catalog-specs', 4, 'Thompson (KT8 Shock The Game, KT9 3D Carbon Stabilizer, Shock The Game 7 Cement King, C202 GT Pro Carbon, PG7 Nitro, Mach 4, Walker Retro).

3. Phân loại theo mục đích sử dụng & Phổ giá:
- Running & Marathon (Giá từ 2.190.000₫ – 6.290.000₫): Giày chạy bộ hàng ngày êm ái (Pegasus, Nimbus, 1080v13, Novablast, Velocity) và giày đua marathon đĩa Carbon đỉnh cao (Vaporfly 3, Adios Pro 3, Metaspeed Paris, Feidian 3.0 Elite, C202 GT Pro).
- Lifestyle & Streetwear (Giá từ 1.890.000₫ – 3.990.000₫): Sneaker dạo phố thịnh hành nhất (Samba OG, AF1 Triple White, Dunk Low Panda, NB 550, NB 530, Mexico 66, Palermo).
- Basketball & Court Sports (Giá từ 2.390.000₫ – 4.990.000₫): Giày bóng rổ, cầu lông chịu lực va đập cao (Way of Wade 10, Anta KT8, KT9, Puma MB.03, Mizuno Wave Momentum 3).
- Outdoor & Trail (Giá từ 3.290.000₫ – 4.990.000₫): Giày dã ngoại, leo núi, việt dã chống nước (Salomon XT-6, ACS Pro, Speedcross 6, NB Hierro v8, Terrex Free Hiker 2).');
