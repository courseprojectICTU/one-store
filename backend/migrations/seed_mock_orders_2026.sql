-- Seed toàn bộ đơn hàng giả lập One - Store từ 01/2026 đến 11/2026
-- Xóa sạch dữ liệu đơn hàng cũ
DELETE FROM order_events;
DELETE FROM order_items;
DELETE FROM orders;

INSERT INTO orders (id, code, customer_name, phone, address, note, total, status, voucher_code, discount, created_at)
VALUES (1, 'ONE-911E6E81', 'Tạ Minh Tâm', '0947567890', '33 Lê Lợi, TP. Vinh, Nghệ An', '[Hình thức: COD]', 4590000, 'completed', NULL, 0, '2026-01-02T07:37:45.285Z');
INSERT INTO order_items (order_id, product_id, product_name, size, color, quantity, unit_price)
VALUES (1, 133, 'Salomon XT-4 OG Fiery Red', '43', 'Trắng Đen', 1, 4590000);
INSERT INTO orders (id, code, customer_name, phone, address, note, total, status, voucher_code, discount, created_at)
VALUES (2, 'ONE-32151444', 'Nguyễn Hoàng Nam', '0903124567', '254/12 Lê Văn Sỹ, Phường 14, Quận 3, TP.HCM', '[Hình thức: COD]', 4190000, 'completed', NULL, 0, '2026-01-04T04:17:53.351Z');
INSERT INTO order_items (order_id, product_id, product_name, size, color, quantity, unit_price)
VALUES (2, 136, 'Asics Gel-Nimbus 26 PureGEL', '42', 'Xanh Biển Phối Trắng', 1, 4190000);
INSERT INTO orders (id, code, customer_name, phone, address, note, total, status, voucher_code, discount, created_at)
VALUES (3, 'ONE-30CB66E6', 'Dương Thu Trang', '0978901234', '56 Đồng Khởi, Biên Hòa, Đồng Nai', '[Hình thức: COD]', 6380000, 'completed', NULL, 0, '2026-01-04T10:20:48.166Z');
INSERT INTO order_items (order_id, product_id, product_name, size, color, quantity, unit_price)
VALUES (3, 105, 'Nike Dunk Low Retro Panda', '44', 'Trắng Đen (Panda)', 2, 3190000);
INSERT INTO orders (id, code, customer_name, phone, address, note, total, status, voucher_code, discount, created_at)
VALUES (4, 'ONE-BF6BB1D6', 'Dương Thu Trang', '0978901234', '56 Đồng Khởi, Biên Hòa, Đồng Nai', '[Hình thức: COD]', 3390000, 'completed', NULL, 0, '2026-01-05T13:02:20.561Z');
INSERT INTO order_items (order_id, product_id, product_name, size, color, quantity, unit_price)
VALUES (4, 127, 'Puma MB.03 Toxic LaMelo Ball', '42', 'Tím Neon Độc Lạ', 1, 3390000);
INSERT INTO orders (id, code, customer_name, phone, address, note, total, status, voucher_code, discount, created_at)
VALUES (5, 'ONE-6AE52B3D', 'Phạm Thành Lương', '0999012345', '18 Hàng Bạc, Hoàn Kiếm, Hà Nội', '[Hình thức: COD]', 14670000, 'completed', NULL, 0, '2026-01-06T09:44:40.420Z');
INSERT INTO order_items (order_id, product_id, product_name, size, color, quantity, unit_price)
VALUES (5, 102, 'Nike ZoomX Vaporfly 3', '42', 'Hồng Neon Bạc', 1, 5890000);
INSERT INTO order_items (order_id, product_id, product_name, size, color, quantity, unit_price)
VALUES (5, 130, 'Salomon ACS Pro Advanced Metal', '41', 'Kim Loại Bạc Trắng', 1, 4990000);
INSERT INTO order_items (order_id, product_id, product_name, size, color, quantity, unit_price)
VALUES (5, 134, 'Salomon X Ultra 4 GORE-TEX', '40', 'Xanh Rêu Xám', 1, 3790000);
INSERT INTO orders (id, code, customer_name, phone, address, note, total, status, voucher_code, discount, created_at)
VALUES (6, 'ONE-528DAA1A', 'Vũ Minh Đức', '0934567890', '78 Lạch Tray, Ngô Quyền, Hải Phòng', '[Hình thức: COD]', 4990000, 'completed', NULL, 0, '2026-01-08T03:52:38.313Z');
INSERT INTO order_items (order_id, product_id, product_name, size, color, quantity, unit_price)
VALUES (6, 130, 'Salomon ACS Pro Advanced Metal', '44', 'Kim Loại Bạc Trắng', 1, 4990000);
INSERT INTO orders (id, code, customer_name, phone, address, note, total, status, voucher_code, discount, created_at)
VALUES (7, 'ONE-1ACB8A8F', 'Phan Bảo Châu', '0909123456', 'Khu Phố 6, Phường Tam Hiệp, Biên Hòa, Đồng Nai', '[Hình thức: COD]', 3990000, 'cancelled', NULL, 0, '2026-01-13T06:01:21.260Z');
INSERT INTO order_items (order_id, product_id, product_name, size, color, quantity, unit_price)
VALUES (7, 107, 'Nike Pegasus Trail 4 GORE-TEX', '43', 'Đen Tuyển', 1, 3990000);
INSERT INTO orders (id, code, customer_name, phone, address, note, total, status, voucher_code, discount, created_at)
VALUES (8, 'ONE-EC0FA665', 'Trần Phương Đoàn', '0395724805', 'Số 12 Ngõ 84 Ngọc Khánh, Ba Đình, Hà Nội', '[Hình thức: COD]', 4390000, 'completed', NULL, 0, '2026-01-21T15:57:41.424Z');
INSERT INTO order_items (order_id, product_id, product_name, size, color, quantity, unit_price)
VALUES (8, 137, 'Asics Gel-Kayano 31 4D Guidance', '44', 'Xám Bạc Băng Giá', 1, 4390000);
INSERT INTO orders (id, code, customer_name, phone, address, note, total, status, voucher_code, discount, created_at)
VALUES (9, 'ONE-59575EF6', 'Lê Thanh Tùng', '0988654321', 'Số 45 Trần Phú, Phường Hải Châu 1, Hải Châu, Đà Nẵng', '[Hình thức: COD]', 1890000, 'completed', NULL, 0, '2026-01-22T06:59:33.107Z');
INSERT INTO order_items (order_id, product_id, product_name, size, color, quantity, unit_price)
VALUES (9, 170, 'Anta Walker Retro Casual', '42', 'Trắng Sọc Xanh Navy', 1, 1890000);
INSERT INTO orders (id, code, customer_name, phone, address, note, total, status, voucher_code, discount, created_at)
VALUES (10, 'ONE-C3C0B61E', 'Phan Bảo Châu', '0909123456', 'Khu Phố 6, Phường Tam Hiệp, Biên Hòa, Đồng Nai', '[Hình thức: COD]', 8180000, 'completed', NULL, 0, '2026-01-24T14:49:20.655Z');
INSERT INTO order_items (order_id, product_id, product_name, size, color, quantity, unit_price)
VALUES (10, 131, 'Salomon Speedcross 6 Grip', '43', 'Đen Đỏ Rực', 1, 3690000);
INSERT INTO order_items (order_id, product_id, product_name, size, color, quantity, unit_price)
VALUES (10, 114, 'Adidas Terrex Free Hiker 2 GORE-TEX', '42', 'Xanh Rêu Đen', 1, 4490000);
INSERT INTO orders (id, code, customer_name, phone, address, note, total, status, voucher_code, discount, created_at)
VALUES (11, 'ONE-8E9375CF', 'Trần Phương Đoàn', '0395724805', 'Số 12 Ngõ 84 Ngọc Khánh, Ba Đình, Hà Nội', '[Hình thức: COD]', 7180000, 'completed', NULL, 0, '2026-01-28T10:33:59.774Z');
INSERT INTO order_items (order_id, product_id, product_name, size, color, quantity, unit_price)
VALUES (11, 108, 'Adidas Samba OG Classic', '43', 'Trắng Sọc Đen Mũi Xám', 1, 2790000);
INSERT INTO order_items (order_id, product_id, product_name, size, color, quantity, unit_price)
VALUES (11, 119, 'New Balance Fresh Foam X 1080v13', '41', 'Đen Bạc', 1, 4390000);
INSERT INTO orders (id, code, customer_name, phone, address, note, total, status, voucher_code, discount, created_at)
VALUES (12, 'ONE-2AAF69E4', 'Trần Phương Đoàn', '0395724805', 'Số 12 Ngõ 84 Ngọc Khánh, Ba Đình, Hà Nội', '[Hình thức: COD]', 7452000, 'completed', 'ONE10', 828000, '2026-01-28T12:22:33.754Z');
INSERT INTO order_items (order_id, product_id, product_name, size, color, quantity, unit_price)
VALUES (12, 103, 'Nike Invincible 3', '43', 'Xám Bạc', 1, 4290000);
INSERT INTO order_items (order_id, product_id, product_name, size, color, quantity, unit_price)
VALUES (12, 135, 'Salomon Speedverse PRG', '41', 'Đen Tuyền', 1, 3990000);
INSERT INTO orders (id, code, customer_name, phone, address, note, total, status, voucher_code, discount, created_at)
VALUES (13, 'ONE-6585AC08', 'Vũ Minh Đức', '0934567890', '78 Lạch Tray, Ngô Quyền, Hải Phòng', '[Hình thức: COD]', 4690000, 'completed', NULL, 0, '2026-01-28T12:50:55.943Z');
INSERT INTO order_items (order_id, product_id, product_name, size, color, quantity, unit_price)
VALUES (13, 129, 'Salomon XT-6 Black Phantom', '42', 'Trắng Be Bạc', 1, 4690000);
INSERT INTO orders (id, code, customer_name, phone, address, note, total, status, voucher_code, discount, created_at)
VALUES (14, 'ONE-61331ED7', 'Phan Bảo Châu', '0909123456', 'Khu Phố 6, Phường Tam Hiệp, Biên Hòa, Đồng Nai', '[Hình thức: COD]', 7980000, 'completed', NULL, 0, '2026-01-30T13:05:35.385Z');
INSERT INTO order_items (order_id, product_id, product_name, size, color, quantity, unit_price)
VALUES (14, 157, 'Li-Ning Feidian 3.0 Elite Carbon', '43', 'Trắng Phối Cam Cháy', 2, 3990000);
INSERT INTO orders (id, code, customer_name, phone, address, note, total, status, voucher_code, discount, created_at)
VALUES (15, 'ONE-D4DCAB1E', 'Bùi Ngọc Lan', '0945678901', '120 Đường 30/4, Ninh Kiều, Cần Thơ', '[Hình thức: COD]', 2790000, 'completed', NULL, 0, '2026-02-02T14:38:38.437Z');
INSERT INTO order_items (order_id, product_id, product_name, size, color, quantity, unit_price)
VALUES (15, 108, 'Adidas Samba OG Classic', '42', 'Trắng Sọc Đen Mũi Xám', 1, 2790000);
INSERT INTO orders (id, code, customer_name, phone, address, note, total, status, voucher_code, discount, created_at)
VALUES (16, 'ONE-59830CBA', 'Đỗ Thị Mai Anh', '0912334455', 'Tòa Landmark 2 - Vinhomes Central Park, Bình Thạnh, TP.HCM', '[Hình thức: COD]', 3890000, 'completed', NULL, 0, '2026-02-04T12:40:18.209Z');
INSERT INTO order_items (order_id, product_id, product_name, size, color, quantity, unit_price)
VALUES (16, 132, 'Salomon Pulsar Trail Pro', '41', 'Đỏ Cam Hoàng Hôn', 1, 3890000);
INSERT INTO orders (id, code, customer_name, phone, address, note, total, status, voucher_code, discount, created_at)
VALUES (17, 'ONE-5C8319E0', 'Đinh Trọng Thắng', '0965789012', '102 Nguyễn Trãi, TP. Thanh Hóa', '[Hình thức: COD]', 2241000, 'completed', 'ONE10', 249000, '2026-02-09T01:35:12.285Z');
INSERT INTO order_items (order_id, product_id, product_name, size, color, quantity, unit_price)
VALUES (17, 156, 'Mizuno Contender Retro Sport', '42', 'Xanh Navy Trắng', 1, 2490000);
INSERT INTO orders (id, code, customer_name, phone, address, note, total, status, voucher_code, discount, created_at)
VALUES (18, 'ONE-A59400D4', 'Bùi Ngọc Lan', '0945678901', '120 Đường 30/4, Ninh Kiều, Cần Thơ', '[Hình thức: COD]', 3390000, 'completed', NULL, 0, '2026-02-11T03:33:58.439Z');
INSERT INTO order_items (order_id, product_id, product_name, size, color, quantity, unit_price)
VALUES (18, 127, 'Puma MB.03 Toxic LaMelo Ball', '45', 'Trắng Đen', 1, 3390000);
INSERT INTO orders (id, code, customer_name, phone, address, note, total, status, voucher_code, discount, created_at)
VALUES (19, 'ONE-1D2A7BAC', 'Đỗ Thị Mai Anh', '0912334455', 'Tòa Landmark 2 - Vinhomes Central Park, Bình Thạnh, TP.HCM', '[Hình thức: COD]', 6580000, 'completed', NULL, 0, '2026-02-11T11:55:48.311Z');
INSERT INTO order_items (order_id, product_id, product_name, size, color, quantity, unit_price)
VALUES (19, 125, 'Puma Deviate Nitro 2 Carbon', '43', 'Trắng Bạc', 1, 3990000);
INSERT INTO order_items (order_id, product_id, product_name, size, color, quantity, unit_price)
VALUES (19, 147, 'Onitsuka Tiger GSM Court Vintage', '42', 'Trắng Sọc Đỏ Rượu', 1, 2590000);
INSERT INTO orders (id, code, customer_name, phone, address, note, total, status, voucher_code, discount, created_at)
VALUES (20, 'ONE-7418B39B', 'Đoàn Văn Hậu', '0953678901', '63 Cầu Giấy, Quan Hoa, Cầu Giấy, Hà Nội', '[Hình thức: COD]', 5980000, 'completed', NULL, 0, '2026-02-11T15:35:52.797Z');
INSERT INTO order_items (order_id, product_id, product_name, size, color, quantity, unit_price)
VALUES (20, 149, 'Onitsuka Tiger Mexico 66 Yellow Kill Bill', '38', 'Vàng Sọc Đen (Kill Bill)', 1, 2990000);
INSERT INTO order_items (order_id, product_id, product_name, size, color, quantity, unit_price)
VALUES (20, 115, 'New Balance 550 White Grey', '40', 'Trắng Xám Bạc', 1, 2990000);
INSERT INTO orders (id, code, customer_name, phone, address, note, total, status, voucher_code, discount, created_at)
VALUES (21, 'ONE-AB5D72FC', 'Trần Phương Đoàn', '0395724805', 'Số 12 Ngõ 84 Ngọc Khánh, Ba Đình, Hà Nội', '[Hình thức: COD]', 4590000, 'completed', NULL, 0, '2026-02-14T14:38:08.793Z');
INSERT INTO order_items (order_id, product_id, product_name, size, color, quantity, unit_price)
VALUES (21, 133, 'Salomon XT-4 OG Fiery Red', '40', 'Trắng Đen', 1, 4590000);
INSERT INTO orders (id, code, customer_name, phone, address, note, total, status, voucher_code, discount, created_at)
VALUES (22, 'ONE-7230C78E', 'Đỗ Thị Mai Anh', '0912334455', 'Tòa Landmark 2 - Vinhomes Central Park, Bình Thạnh, TP.HCM', '[Hình thức: COD]', 12573000, 'completed', 'ONE10', 1397000, '2026-02-15T12:51:22.636Z');
INSERT INTO order_items (order_id, product_id, product_name, size, color, quantity, unit_price)
VALUES (22, 136, 'Asics Gel-Nimbus 26 PureGEL', '40', 'Đen Platinum', 2, 4190000);
INSERT INTO order_items (order_id, product_id, product_name, size, color, quantity, unit_price)
VALUES (22, 153, 'Mizuno Wave Rebellion Pro 2 Carbon', '42', 'Vàng Chanh Phối Tím Neon', 1, 5590000);
INSERT INTO orders (id, code, customer_name, phone, address, note, total, status, voucher_code, discount, created_at)
VALUES (23, 'ONE-D2312840', 'Ngô Kiến Huy', '0989012345', '18 Hùng Vương, TP. Hạ Long, Quảng Ninh', '[Hình thức: COD]', 3990000, 'completed', NULL, 0, '2026-02-21T15:47:34.123Z');
INSERT INTO order_items (order_id, product_id, product_name, size, color, quantity, unit_price)
VALUES (23, 157, 'Li-Ning Feidian 3.0 Elite Carbon', '44', 'Trắng Phối Cam Cháy', 1, 3990000);
INSERT INTO orders (id, code, customer_name, phone, address, note, total, status, voucher_code, discount, created_at)
VALUES (24, 'ONE-223D3C63', 'Nguyễn Kiều Oanh', '0926345678', '71 Cách Mạng Tháng 8, TP. Cà Mau', '[Hình thức: COD]', 4390000, 'completed', NULL, 0, '2026-02-26T02:50:27.434Z');
INSERT INTO order_items (order_id, product_id, product_name, size, color, quantity, unit_price)
VALUES (24, 137, 'Asics Gel-Kayano 31 4D Guidance', '40', 'Đen Phối Vàng Đồng', 1, 4390000);
INSERT INTO orders (id, code, customer_name, phone, address, note, total, status, voucher_code, discount, created_at)
VALUES (25, 'ONE-60D63909', 'Đinh Trọng Thắng', '0965789012', '102 Nguyễn Trãi, TP. Thanh Hóa', '[Hình thức: COD]', 3190000, 'completed', NULL, 0, '2026-02-26T08:24:12.411Z');
INSERT INTO order_items (order_id, product_id, product_name, size, color, quantity, unit_price)
VALUES (25, 105, 'Nike Dunk Low Retro Panda', '43', 'Trắng Đen (Panda)', 1, 3190000);
INSERT INTO orders (id, code, customer_name, phone, address, note, total, status, voucher_code, discount, created_at)
VALUES (26, 'ONE-9CC58539', 'Lương Bích Hữu', '0983901234', '24 Hoàng Văn Thụ, TP. Bắc Giang', '[Hình thức: COD]', 1971000, 'completed', 'ONE10', 219000, '2026-02-27T09:44:52.467Z');
INSERT INTO order_items (order_id, product_id, product_name, size, color, quantity, unit_price)
VALUES (26, 163, 'Li-Ning Rouge Rabbit 7 Pro', '43', 'Xanh Biển Nhạt', 1, 2190000);
INSERT INTO orders (id, code, customer_name, phone, address, note, total, status, voucher_code, discount, created_at)
VALUES (27, 'ONE-7073EAFE', 'Bùi Tiến Dũng', '0971890123', '22 Thạch Hãn, Hải Lăng, Quảng Trị', '[Hình thức: COD]', 3990000, 'completed', NULL, 0, '2026-03-01T05:09:46.699Z');
INSERT INTO order_items (order_id, product_id, product_name, size, color, quantity, unit_price)
VALUES (27, 157, 'Li-Ning Feidian 3.0 Elite Carbon', '39', 'Trắng Phối Cam Cháy', 1, 3990000);
INSERT INTO orders (id, code, customer_name, phone, address, note, total, status, voucher_code, discount, created_at)
VALUES (28, 'ONE-86A7EF60', 'Lê Công Vinh', '0980901234', '39 Trần Phú, TP. Tam Kỳ, Quảng Nam', '[Hình thức: COD]', 2890000, 'completed', NULL, 0, '2026-03-02T07:53:09.789Z');
INSERT INTO order_items (order_id, product_id, product_name, size, color, quantity, unit_price)
VALUES (28, 106, 'Nike Air Force 1 07 Triple White', '40', 'All White (Trắng Tinh Khôi)', 1, 2890000);
INSERT INTO orders (id, code, customer_name, phone, address, note, total, status, voucher_code, discount, created_at)
VALUES (29, 'ONE-304910CF', 'Trần Phương Đoàn', '0395724805', 'Số 12 Ngõ 84 Ngọc Khánh, Ba Đình, Hà Nội', '[Hình thức: COD]', 5890000, 'completed', NULL, 0, '2026-03-03T03:56:06.801Z');
INSERT INTO order_items (order_id, product_id, product_name, size, color, quantity, unit_price)
VALUES (29, 102, 'Nike ZoomX Vaporfly 3', '42', 'Trắng Ngọc', 1, 5890000);
INSERT INTO orders (id, code, customer_name, phone, address, note, total, status, voucher_code, discount, created_at)
VALUES (30, 'ONE-83158C89', 'Hoàng Văn Hùng', '0967890123', 'Đại Lộ Bình Dương, Thuận An, Bình Dương', '[Hình thức: COD]', 9980000, 'completed', NULL, 0, '2026-03-06T13:24:25.409Z');
INSERT INTO order_items (order_id, product_id, product_name, size, color, quantity, unit_price)
VALUES (30, 160, 'Li-Ning Way of Wade 10 Mint Blossom', '41', 'Xanh Bạc Hà Mint Blossom', 2, 4990000);
INSERT INTO orders (id, code, customer_name, phone, address, note, total, status, voucher_code, discount, created_at)
VALUES (31, 'ONE-F6C539CB', 'Phạm Quốc Tuấn', '0979888999', 'Biệt thự BT4, KĐT Ngoại Giao Đoàn, Bắc Từ Liêm, Hà Nội', '[Hình thức: COD]', 5980000, 'completed', NULL, 0, '2026-03-08T10:49:35.687Z');
INSERT INTO order_items (order_id, product_id, product_name, size, color, quantity, unit_price)
VALUES (31, 115, 'New Balance 550 White Grey', '44', 'Trắng Xanh Navy', 1, 2990000);
INSERT INTO order_items (order_id, product_id, product_name, size, color, quantity, unit_price)
VALUES (31, 115, 'New Balance 550 White Grey', '42', 'Trắng Xanh Navy', 1, 2990000);
INSERT INTO orders (id, code, customer_name, phone, address, note, total, status, voucher_code, discount, created_at)
VALUES (32, 'ONE-08069B46', 'Nguyễn Văn Toàn', '0934445566', '77 Lê Hồng Phong, TP. Nam Định', '[Hình thức: COD]', 14660000, 'completed', NULL, 0, '2026-03-09T13:30:58.801Z');
INSERT INTO order_items (order_id, product_id, product_name, size, color, quantity, unit_price)
VALUES (32, 129, 'Salomon XT-6 Black Phantom', '42', 'Đen Toàn Diện (Black Phantom)', 1, 4690000);
INSERT INTO order_items (order_id, product_id, product_name, size, color, quantity, unit_price)
VALUES (32, 115, 'New Balance 550 White Grey', '42', 'Trắng Xanh Navy', 1, 2990000);
INSERT INTO order_items (order_id, product_id, product_name, size, color, quantity, unit_price)
VALUES (32, 101, 'Nike Air Zoom Pegasus 41', '39', 'Đen Bạc', 2, 3490000);
INSERT INTO orders (id, code, customer_name, phone, address, note, total, status, voucher_code, discount, created_at)
VALUES (33, 'ONE-D7BCFF92', 'Lê Thanh Tùng', '0988654321', 'Số 45 Trần Phú, Phường Hải Châu 1, Hải Châu, Đà Nẵng', '[Hình thức: COD]', 2590000, 'completed', NULL, 0, '2026-03-13T12:10:02.506Z');
INSERT INTO order_items (order_id, product_id, product_name, size, color, quantity, unit_price)
VALUES (33, 147, 'Onitsuka Tiger GSM Court Vintage', '44', 'Trắng Sọc Đỏ Rượu', 1, 2590000);
INSERT INTO orders (id, code, customer_name, phone, address, note, total, status, voucher_code, discount, created_at)
VALUES (34, 'ONE-9DB9321F', 'Phạm Quốc Tuấn', '0979888999', 'Biệt thự BT4, KĐT Ngoại Giao Đoàn, Bắc Từ Liêm, Hà Nội', '[Hình thức: COD]', 3990000, 'completed', NULL, 0, '2026-03-17T13:08:56.514Z');
INSERT INTO order_items (order_id, product_id, product_name, size, color, quantity, unit_price)
VALUES (34, 135, 'Salomon Speedverse PRG', '40', 'Đen Tuyền', 1, 3990000);
INSERT INTO orders (id, code, customer_name, phone, address, note, total, status, voucher_code, discount, created_at)
VALUES (35, 'ONE-67640386', 'Lê Thanh Tùng', '0988654321', 'Số 45 Trần Phú, Phường Hải Châu 1, Hải Châu, Đà Nẵng', '[Hình thức: COD]', 11780000, 'completed', NULL, 0, '2026-03-18T07:51:08.694Z');
INSERT INTO order_items (order_id, product_id, product_name, size, color, quantity, unit_price)
VALUES (35, 102, 'Nike ZoomX Vaporfly 3', '41', 'Hồng Neon Bạc', 2, 5890000);
INSERT INTO orders (id, code, customer_name, phone, address, note, total, status, voucher_code, discount, created_at)
VALUES (36, 'ONE-0B10D7F2', 'Đặng Đình Khoa', '0918234567', '42 Nguyễn Huệ, TP. Huế, Thừa Thiên Huế', '[Hình thức: COD]', 2790000, 'completed', NULL, 0, '2026-03-18T08:13:33.489Z');
INSERT INTO order_items (order_id, product_id, product_name, size, color, quantity, unit_price)
VALUES (36, 108, 'Adidas Samba OG Classic', '41', 'Trắng Sọc Đen Mũi Xám', 1, 2790000);
INSERT INTO orders (id, code, customer_name, phone, address, note, total, status, voucher_code, discount, created_at)
VALUES (37, 'ONE-F8445E25', 'Bùi Ngọc Lan', '0945678901', '120 Đường 30/4, Ninh Kiều, Cần Thơ', '[Hình thức: COD]', 3490000, 'completed', NULL, 0, '2026-03-20T03:23:52.817Z');
INSERT INTO order_items (order_id, product_id, product_name, size, color, quantity, unit_price)
VALUES (37, 101, 'Nike Air Zoom Pegasus 41', '44', 'Đen Bạc', 1, 3490000);
INSERT INTO orders (id, code, customer_name, phone, address, note, total, status, voucher_code, discount, created_at)
VALUES (38, 'ONE-B163311D', 'Phạm Quốc Tuấn', '0979888999', 'Biệt thự BT4, KĐT Ngoại Giao Đoàn, Bắc Từ Liêm, Hà Nội', '[Hình thức: COD]', 2990000, 'completed', NULL, 0, '2026-03-20T13:12:07.242Z');
INSERT INTO order_items (order_id, product_id, product_name, size, color, quantity, unit_price)
VALUES (38, 149, 'Onitsuka Tiger Mexico 66 Yellow Kill Bill', '38', 'Vàng Sọc Đen (Kill Bill)', 1, 2990000);
INSERT INTO orders (id, code, customer_name, phone, address, note, total, status, voucher_code, discount, created_at)
VALUES (39, 'ONE-C4729BF5', 'Phạm Quốc Tuấn', '0979888999', 'Biệt thự BT4, KĐT Ngoại Giao Đoàn, Bắc Từ Liêm, Hà Nội', '[Hình thức: COD]', 6980000, 'completed', NULL, 0, '2026-03-22T10:56:40.774Z');
INSERT INTO order_items (order_id, product_id, product_name, size, color, quantity, unit_price)
VALUES (39, 140, 'Asics Gel-NYC Cream Oyster Grey', '40', 'Kem Xám Bạc (Cream Oyster)', 2, 3490000);
INSERT INTO orders (id, code, customer_name, phone, address, note, total, status, voucher_code, discount, created_at)
VALUES (40, 'ONE-9ED7155D', 'Bùi Ngọc Lan', '0945678901', '120 Đường 30/4, Ninh Kiều, Cần Thơ', '[Hình thức: COD]', 3501000, 'completed', 'ONE10', 389000, '2026-03-28T10:28:15.387Z');
INSERT INTO order_items (order_id, product_id, product_name, size, color, quantity, unit_price)
VALUES (40, 118, 'New Balance 1906R Metallic Silver', '42', 'Bạc Metallic Ánh Vàng', 1, 3890000);
INSERT INTO orders (id, code, customer_name, phone, address, note, total, status, voucher_code, discount, created_at)
VALUES (41, 'ONE-47B15766', 'Tôn Nữ Diệu Thảo', '0935456789', '82 Nguyễn Thái Học, TP. Rạch Giá, Kiên Giang', '[Hình thức: COD]', 5840000, 'completed', 'ONE50', 50000, '2026-03-29T10:33:37.284Z');
INSERT INTO order_items (order_id, product_id, product_name, size, color, quantity, unit_price)
VALUES (41, 102, 'Nike ZoomX Vaporfly 3', '44', 'Trắng Ngọc', 1, 5890000);
INSERT INTO orders (id, code, customer_name, phone, address, note, total, status, voucher_code, discount, created_at)
VALUES (42, 'ONE-E4DE185A', 'Phan Thanh Bình', '0944567890', '47 Trương Định, Quận 1, TP.HCM', '[Hình thức: COD]', 8930000, 'completed', 'ONE50', 50000, '2026-03-30T09:43:15.902Z');
INSERT INTO order_items (order_id, product_id, product_name, size, color, quantity, unit_price)
VALUES (42, 135, 'Salomon Speedverse PRG', '41', 'Đen Tuyền', 1, 3990000);
INSERT INTO order_items (order_id, product_id, product_name, size, color, quantity, unit_price)
VALUES (42, 130, 'Salomon ACS Pro Advanced Metal', '43', 'Đen Tuyển', 1, 4990000);
INSERT INTO orders (id, code, customer_name, phone, address, note, total, status, voucher_code, discount, created_at)
VALUES (43, 'ONE-A081AE4C', 'Tôn Nữ Diệu Thảo', '0935456789', '82 Nguyễn Thái Học, TP. Rạch Giá, Kiên Giang', '[Hình thức: COD]', 3141000, 'completed', 'ONE10', 349000, '2026-04-01T06:36:25.433Z');
INSERT INTO order_items (order_id, product_id, product_name, size, color, quantity, unit_price)
VALUES (43, 101, 'Nike Air Zoom Pegasus 41', '42', 'Đen Bạc', 1, 3490000);
INSERT INTO orders (id, code, customer_name, phone, address, note, total, status, voucher_code, discount, created_at)
VALUES (44, 'ONE-4B67B298', 'Bùi Ngọc Lan', '0945678901', '120 Đường 30/4, Ninh Kiều, Cần Thơ', '[Hình thức: COD]', 4590000, 'completed', NULL, 0, '2026-04-02T13:17:21.517Z');
INSERT INTO order_items (order_id, product_id, product_name, size, color, quantity, unit_price)
VALUES (44, 133, 'Salomon XT-4 OG Fiery Red', '41', 'Trắng Đen', 1, 4590000);
INSERT INTO orders (id, code, customer_name, phone, address, note, total, status, voucher_code, discount, created_at)
VALUES (45, 'ONE-4367503A', 'Phạm Quốc Tuấn', '0979888999', 'Biệt thự BT4, KĐT Ngoại Giao Đoàn, Bắc Từ Liêm, Hà Nội', '[Hình thức: COD]', 9180000, 'completed', NULL, 0, '2026-04-04T09:17:06.673Z');
INSERT INTO order_items (order_id, product_id, product_name, size, color, quantity, unit_price)
VALUES (45, 165, 'Anta KT9 3D Carbon Stabilizer', '41', 'Đen Phantom Phối Vàng Kim', 1, 3290000);
INSERT INTO order_items (order_id, product_id, product_name, size, color, quantity, unit_price)
VALUES (45, 102, 'Nike ZoomX Vaporfly 3', '42', 'Hồng Neon Bạc', 1, 5890000);
INSERT INTO orders (id, code, customer_name, phone, address, note, total, status, voucher_code, discount, created_at)
VALUES (46, 'ONE-7BCB775F', 'Nguyễn Hoàng Nam', '0903124567', '254/12 Lê Văn Sỹ, Phường 14, Quận 3, TP.HCM', '[Hình thức: COD]', 3990000, 'completed', NULL, 0, '2026-04-06T14:13:15.810Z');
INSERT INTO order_items (order_id, product_id, product_name, size, color, quantity, unit_price)
VALUES (46, 157, 'Li-Ning Feidian 3.0 Elite Carbon', '42', 'Xanh Lam Neon', 1, 3990000);
INSERT INTO orders (id, code, customer_name, phone, address, note, total, status, voucher_code, discount, created_at)
VALUES (47, 'ONE-FBBAC7D0', 'Hồ Quang Hiếu', '0974890123', '88 Quang Trung, TP. Thái Nguyên', '[Hình thức: COD]', 2790000, 'completed', NULL, 0, '2026-04-12T15:30:29.578Z');
INSERT INTO order_items (order_id, product_id, product_name, size, color, quantity, unit_price)
VALUES (47, 108, 'Adidas Samba OG Classic', '39', 'Đen Sọc Trắng', 1, 2790000);
INSERT INTO orders (id, code, customer_name, phone, address, note, total, status, voucher_code, discount, created_at)
VALUES (48, 'ONE-DA067B85', 'Nguyễn Hoàng Nam', '0903124567', '254/12 Lê Văn Sỹ, Phường 14, Quận 3, TP.HCM', '[Hình thức: COD]', 8880000, 'completed', NULL, 0, '2026-04-15T07:07:23.417Z');
INSERT INTO order_items (order_id, product_id, product_name, size, color, quantity, unit_price)
VALUES (48, 104, 'Nike Air Zoom Vomero 17', '41', 'Xanh Navy Bạc', 1, 3890000);
INSERT INTO order_items (order_id, product_id, product_name, size, color, quantity, unit_price)
VALUES (48, 130, 'Salomon ACS Pro Advanced Metal', '41', 'Đen Tuyển', 1, 4990000);
INSERT INTO orders (id, code, customer_name, phone, address, note, total, status, voucher_code, discount, created_at)
VALUES (49, 'ONE-E0AFA590', 'Đoàn Văn Hậu', '0953678901', '63 Cầu Giấy, Quan Hoa, Cầu Giấy, Hà Nội', '[Hình thức: COD]', 2961000, 'completed', 'ONE10', 329000, '2026-04-17T01:35:09.498Z');
INSERT INTO order_items (order_id, product_id, product_name, size, color, quantity, unit_price)
VALUES (49, 152, 'Mizuno Wave Skyrise 5 Floating', '44', 'Trắng Xanh Bạc', 1, 3290000);
INSERT INTO orders (id, code, customer_name, phone, address, note, total, status, voucher_code, discount, created_at)
VALUES (50, 'ONE-3BE52D72', 'Hoàng Văn Hùng', '0967890123', 'Đại Lộ Bình Dương, Thuận An, Bình Dương', '[Hình thức: COD]', 4690000, 'completed', NULL, 0, '2026-04-18T09:42:09.558Z');
INSERT INTO order_items (order_id, product_id, product_name, size, color, quantity, unit_price)
VALUES (50, 129, 'Salomon XT-6 Black Phantom', '42', 'Đen Toàn Diện (Black Phantom)', 1, 4690000);
INSERT INTO orders (id, code, customer_name, phone, address, note, total, status, voucher_code, discount, created_at)
VALUES (51, 'ONE-B1991DD9', 'Vũ Minh Đức', '0934567890', '78 Lạch Tray, Ngô Quyền, Hải Phòng', '[Hình thức: COD]', 5922000, 'cancelled', 'ONE10', 658000, '2026-04-19T02:34:07.877Z');
INSERT INTO order_items (order_id, product_id, product_name, size, color, quantity, unit_price)
VALUES (51, 134, 'Salomon X Ultra 4 GORE-TEX', '40', 'Đen Xám Bạc', 1, 3790000);
INSERT INTO order_items (order_id, product_id, product_name, size, color, quantity, unit_price)
VALUES (51, 164, 'Anta KT8 Shock The Game Klay Thompson', '40', 'Xanh Tím Neon Vịnh San Francisco', 1, 2790000);
INSERT INTO orders (id, code, customer_name, phone, address, note, total, status, voucher_code, discount, created_at)
VALUES (52, 'ONE-94D55143', 'Trần Phương Đoàn', '0395724805', 'Số 12 Ngõ 84 Ngọc Khánh, Ba Đình, Hà Nội', '[Hình thức: COD]', 2790000, 'completed', NULL, 0, '2026-04-21T06:55:56.609Z');
INSERT INTO order_items (order_id, product_id, product_name, size, color, quantity, unit_price)
VALUES (52, 158, 'Li-Ning Yueying 3 Pro Dual BOOM', '42', 'Trắng Tím Hologram', 1, 2790000);
INSERT INTO orders (id, code, customer_name, phone, address, note, total, status, voucher_code, discount, created_at)
VALUES (53, 'ONE-2DDE775A', 'Hoàng Văn Hùng', '0967890123', 'Đại Lộ Bình Dương, Thuận An, Bình Dương', '[Hình thức: COD]', 3590000, 'completed', NULL, 0, '2026-04-23T06:10:09.892Z');
INSERT INTO order_items (order_id, product_id, product_name, size, color, quantity, unit_price)
VALUES (53, 120, 'New Balance FuelCell Rebel v4', '43', 'Trắng Phối Đỏ Neon', 1, 3590000);
INSERT INTO orders (id, code, customer_name, phone, address, note, total, status, voucher_code, discount, created_at)
VALUES (54, 'ONE-3990B9E9', 'Phan Bảo Châu', '0909123456', 'Khu Phố 6, Phường Tam Hiệp, Biên Hòa, Đồng Nai', '[Hình thức: COD]', 7380000, 'completed', NULL, 0, '2026-04-23T12:05:30.490Z');
INSERT INTO order_items (order_id, product_id, product_name, size, color, quantity, unit_price)
VALUES (54, 119, 'New Balance Fresh Foam X 1080v13', '41', 'Đen Bạc', 1, 4390000);
INSERT INTO order_items (order_id, product_id, product_name, size, color, quantity, unit_price)
VALUES (54, 115, 'New Balance 550 White Grey', '41', 'Trắng Xanh Navy', 1, 2990000);
INSERT INTO orders (id, code, customer_name, phone, address, note, total, status, voucher_code, discount, created_at)
VALUES (55, 'ONE-400A9344', 'Trần Phương Đoàn', '0395724805', 'Số 12 Ngõ 84 Ngọc Khánh, Ba Đình, Hà Nội', '[Hình thức: COD]', 3771000, 'completed', 'ONE10', 419000, '2026-04-26T06:46:56.691Z');
INSERT INTO order_items (order_id, product_id, product_name, size, color, quantity, unit_price)
VALUES (55, 111, 'Adidas Ultraboost Light', '43', 'Đen Core Black', 1, 4190000);
INSERT INTO orders (id, code, customer_name, phone, address, note, total, status, voucher_code, discount, created_at)
VALUES (56, 'ONE-3DCEAF19', 'Đỗ Thị Mai Anh', '0912334455', 'Tòa Landmark 2 - Vinhomes Central Park, Bình Thạnh, TP.HCM', '[Hình thức: COD]', 8680000, 'completed', NULL, 0, '2026-04-26T08:32:57.590Z');
INSERT INTO order_items (order_id, product_id, product_name, size, color, quantity, unit_price)
VALUES (56, 117, 'New Balance 2002R Protection Pack', '41', 'Xám Khói Rain Cloud', 1, 3990000);
INSERT INTO order_items (order_id, product_id, product_name, size, color, quantity, unit_price)
VALUES (56, 129, 'Salomon XT-6 Black Phantom', '42', 'Đen Toàn Diện (Black Phantom)', 1, 4690000);
INSERT INTO orders (id, code, customer_name, phone, address, note, total, status, voucher_code, discount, created_at)
VALUES (57, 'ONE-DADF48C9', 'Phạm Quốc Tuấn', '0979888999', 'Biệt thự BT4, KĐT Ngoại Giao Đoàn, Bắc Từ Liêm, Hà Nội', '[Hình thức: COD]', 11980000, 'completed', NULL, 0, '2026-04-27T15:25:15.461Z');
INSERT INTO order_items (order_id, product_id, product_name, size, color, quantity, unit_price)
VALUES (57, 112, 'Adidas Adizero Adios Pro 3', '44', 'Xanh Ngọc Solar Red', 2, 5990000);
INSERT INTO orders (id, code, customer_name, phone, address, note, total, status, voucher_code, discount, created_at)
VALUES (58, 'ONE-C8D55E39', 'Ngô Kiến Huy', '0989012345', '18 Hùng Vương, TP. Hạ Long, Quảng Ninh', '[Hình thức: COD]', 7530000, 'completed', 'ONE50', 50000, '2026-05-02T06:23:50.739Z');
INSERT INTO order_items (order_id, product_id, product_name, size, color, quantity, unit_price)
VALUES (58, 134, 'Salomon X Ultra 4 GORE-TEX', '44', 'Đen Xám Bạc', 2, 3790000);
INSERT INTO orders (id, code, customer_name, phone, address, note, total, status, voucher_code, discount, created_at)
VALUES (59, 'ONE-07BB865B', 'Lê Thanh Tùng', '0988654321', 'Số 45 Trần Phú, Phường Hải Châu 1, Hải Châu, Đà Nẵng', '[Hình thức: COD]', 2601000, 'completed', 'ONE10', 289000, '2026-05-06T03:51:20.230Z');
INSERT INTO order_items (order_id, product_id, product_name, size, color, quantity, unit_price)
VALUES (59, 161, 'Li-Ning YuShuai 18 V2 Streetball', '40', 'Đen Tuyền', 1, 2890000);
INSERT INTO orders (id, code, customer_name, phone, address, note, total, status, voucher_code, discount, created_at)
VALUES (60, 'ONE-3ECAE64E', 'Ngô Kiến Huy', '0989012345', '18 Hùng Vương, TP. Hạ Long, Quảng Ninh', '[Hình thức: COD]', 12770000, 'completed', NULL, 0, '2026-05-06T12:12:32.264Z');
INSERT INTO order_items (order_id, product_id, product_name, size, color, quantity, unit_price)
VALUES (60, 142, 'Asics Gel-Trabuco 12 Trail', '42', 'Xám Rừng', 1, 3590000);
INSERT INTO order_items (order_id, product_id, product_name, size, color, quantity, unit_price)
VALUES (60, 133, 'Salomon XT-4 OG Fiery Red', '44', 'Đỏ Rực Phối Vàng Cam', 2, 4590000);
INSERT INTO orders (id, code, customer_name, phone, address, note, total, status, voucher_code, discount, created_at)
VALUES (61, 'ONE-40FBE305', 'Nguyễn Quang Hải', '0962789012', '10 Hàng Gai, Hoàn Kiếm, Hà Nội', '[Hình thức: COD]', 11780000, 'completed', NULL, 0, '2026-05-07T08:41:29.584Z');
INSERT INTO order_items (order_id, product_id, product_name, size, color, quantity, unit_price)
VALUES (61, 102, 'Nike ZoomX Vaporfly 3', '42', 'Hồng Neon Bạc', 2, 5890000);
INSERT INTO orders (id, code, customer_name, phone, address, note, total, status, voucher_code, discount, created_at)
VALUES (62, 'ONE-2DE8D2F0', 'Dương Thu Trang', '0978901234', '56 Đồng Khởi, Biên Hòa, Đồng Nai', '[Hình thức: COD]', 2690000, 'completed', NULL, 0, '2026-05-07T13:50:49.177Z');
INSERT INTO order_items (order_id, product_id, product_name, size, color, quantity, unit_price)
VALUES (62, 146, 'Onitsuka Tiger Tokuten Indoor Gum', '40', 'Xám Bạc', 1, 2690000);
INSERT INTO orders (id, code, customer_name, phone, address, note, total, status, voucher_code, discount, created_at)
VALUES (63, 'ONE-68471A21', 'Ngô Kiến Huy', '0989012345', '18 Hùng Vương, TP. Hạ Long, Quảng Ninh', '[Hình thức: COD]', 13120000, 'completed', 'ONE50', 50000, '2026-05-08T14:24:17.899Z');
INSERT INTO order_items (order_id, product_id, product_name, size, color, quantity, unit_price)
VALUES (63, 132, 'Salomon Pulsar Trail Pro', '43', 'Đỏ Cam Hoàng Hôn', 1, 3890000);
INSERT INTO order_items (order_id, product_id, product_name, size, color, quantity, unit_price)
VALUES (63, 139, 'Asics GT-2000 12 Stability', '43', 'Xanh Navy Trắng', 1, 3390000);
INSERT INTO order_items (order_id, product_id, product_name, size, color, quantity, unit_price)
VALUES (63, 102, 'Nike ZoomX Vaporfly 3', '43', 'Trắng Ngọc', 1, 5890000);
INSERT INTO orders (id, code, customer_name, phone, address, note, total, status, voucher_code, discount, created_at)
VALUES (64, 'ONE-30C756E4', 'Trần Phương Đoàn', '0395724805', 'Số 12 Ngõ 84 Ngọc Khánh, Ba Đình, Hà Nội', '[Hình thức: COD]', 3490000, 'completed', NULL, 0, '2026-05-10T04:01:25.332Z');
INSERT INTO order_items (order_id, product_id, product_name, size, color, quantity, unit_price)
VALUES (64, 101, 'Nike Air Zoom Pegasus 41', '43', 'Trắng Phối Cam Volt', 1, 3490000);
INSERT INTO orders (id, code, customer_name, phone, address, note, total, status, voucher_code, discount, created_at)
VALUES (65, 'ONE-3AB17014', 'Ngô Kiến Huy', '0989012345', '18 Hùng Vương, TP. Hạ Long, Quảng Ninh', '[Hình thức: COD]', 3790000, 'completed', NULL, 0, '2026-05-10T13:35:41.686Z');
INSERT INTO order_items (order_id, product_id, product_name, size, color, quantity, unit_price)
VALUES (65, 134, 'Salomon X Ultra 4 GORE-TEX', '40', 'Xanh Rêu Xám', 1, 3790000);
INSERT INTO orders (id, code, customer_name, phone, address, note, total, status, voucher_code, discount, created_at)
VALUES (66, 'ONE-BE4029D9', 'Vũ Minh Đức', '0934567890', '78 Lạch Tray, Ngô Quyền, Hải Phòng', '[Hình thức: COD]', 8230000, 'completed', 'ONE50', 50000, '2026-05-12T13:34:46.072Z');
INSERT INTO order_items (order_id, product_id, product_name, size, color, quantity, unit_price)
VALUES (66, 160, 'Li-Ning Way of Wade 10 Mint Blossom', '45', 'Đen Vàng Kim', 1, 4990000);
INSERT INTO order_items (order_id, product_id, product_name, size, color, quantity, unit_price)
VALUES (66, 165, 'Anta KT9 3D Carbon Stabilizer', '40', 'Đen Phantom Phối Vàng Kim', 1, 3290000);
INSERT INTO orders (id, code, customer_name, phone, address, note, total, status, voucher_code, discount, created_at)
VALUES (67, 'ONE-12B502DD', 'Bùi Tiến Dũng', '0971890123', '22 Thạch Hãn, Hải Lăng, Quảng Trị', '[Hình thức: COD]', 2790000, 'completed', NULL, 0, '2026-05-12T15:17:59.375Z');
INSERT INTO order_items (order_id, product_id, product_name, size, color, quantity, unit_price)
VALUES (67, 108, 'Adidas Samba OG Classic', '40', 'Trắng Sọc Đen Mũi Xám', 1, 2790000);
INSERT INTO orders (id, code, customer_name, phone, address, note, total, status, voucher_code, discount, created_at)
VALUES (68, 'ONE-61BED67F', 'Vũ Minh Đức', '0934567890', '78 Lạch Tray, Ngô Quyền, Hải Phòng', '[Hình thức: COD]', 3940000, 'completed', 'ONE50', 50000, '2026-05-15T13:30:25.129Z');
INSERT INTO order_items (order_id, product_id, product_name, size, color, quantity, unit_price)
VALUES (68, 107, 'Nike Pegasus Trail 4 GORE-TEX', '41', 'Đen Tuyển', 1, 3990000);
INSERT INTO orders (id, code, customer_name, phone, address, note, total, status, voucher_code, discount, created_at)
VALUES (69, 'ONE-7DA3E167', 'Lê Thanh Tùng', '0988654321', 'Số 45 Trần Phú, Phường Hải Châu 1, Hải Châu, Đà Nẵng', '[Hình thức: COD]', 6580000, 'completed', NULL, 0, '2026-05-16T11:06:30.165Z');
INSERT INTO order_items (order_id, product_id, product_name, size, color, quantity, unit_price)
VALUES (69, 128, 'Puma Voyage Nitro 3 Trail', '42', 'Đen Phối Xanh Olive', 2, 3290000);
INSERT INTO orders (id, code, customer_name, phone, address, note, total, status, voucher_code, discount, created_at)
VALUES (70, 'ONE-902C1185', 'Nguyễn Hoàng Nam', '0903124567', '254/12 Lê Văn Sỹ, Phường 14, Quận 3, TP.HCM', '[Hình thức: COD]', 3890000, 'completed', NULL, 0, '2026-05-22T02:18:21.447Z');
INSERT INTO order_items (order_id, product_id, product_name, size, color, quantity, unit_price)
VALUES (70, 118, 'New Balance 1906R Metallic Silver', '42', 'Bạc Metallic Ánh Vàng', 1, 3890000);
INSERT INTO orders (id, code, customer_name, phone, address, note, total, status, voucher_code, discount, created_at)
VALUES (71, 'ONE-2E10A8C9', 'Đặng Đình Khoa', '0918234567', '42 Nguyễn Huệ, TP. Huế, Thừa Thiên Huế', '[Hình thức: COD]', 3140000, 'completed', 'ONE50', 50000, '2026-05-25T04:38:12.864Z');
INSERT INTO order_items (order_id, product_id, product_name, size, color, quantity, unit_price)
VALUES (71, 105, 'Nike Dunk Low Retro Panda', '43', 'Trắng Đen (Panda)', 1, 3190000);
INSERT INTO orders (id, code, customer_name, phone, address, note, total, status, voucher_code, discount, created_at)
VALUES (72, 'ONE-B8F279D3', 'Đỗ Hùng Dũng', '0912223344', '91 Tôn Đức Thắng, Đống Đa, Hà Nội', '[Hình thức: COD]', 3890000, 'completed', NULL, 0, '2026-05-26T09:12:59.102Z');
INSERT INTO order_items (order_id, product_id, product_name, size, color, quantity, unit_price)
VALUES (72, 132, 'Salomon Pulsar Trail Pro', '42', 'Trắng Bạc', 1, 3890000);
INSERT INTO orders (id, code, customer_name, phone, address, note, total, status, voucher_code, discount, created_at)
VALUES (73, 'ONE-F38191F7', 'Trần Phương Đoàn', '0395724805', 'Số 12 Ngõ 84 Ngọc Khánh, Ba Đình, Hà Nội', '[Hình thức: COD]', 4590000, 'completed', NULL, 0, '2026-05-30T11:04:54.322Z');
INSERT INTO order_items (order_id, product_id, product_name, size, color, quantity, unit_price)
VALUES (73, 133, 'Salomon XT-4 OG Fiery Red', '42', 'Trắng Đen', 1, 4590000);
INSERT INTO orders (id, code, customer_name, phone, address, note, total, status, voucher_code, discount, created_at)
VALUES (74, 'ONE-B82453FC', 'Lê Công Vinh', '0980901234', '39 Trần Phú, TP. Tam Kỳ, Quảng Nam', '[Hình thức: COD]', 1990000, 'completed', NULL, 0, '2026-05-30T13:01:06.357Z');
INSERT INTO order_items (order_id, product_id, product_name, size, color, quantity, unit_price)
VALUES (74, 123, 'Puma Suede Classic XXI', '43', 'Đỏ Sọc Trắng', 1, 1990000);
INSERT INTO orders (id, code, customer_name, phone, address, note, total, status, voucher_code, discount, created_at)
VALUES (75, 'ONE-13BF965F', 'Bùi Ngọc Lan', '0945678901', '120 Đường 30/4, Ninh Kiều, Cần Thơ', '[Hình thức: COD]', 3990000, 'completed', NULL, 0, '2026-06-02T05:39:42.728Z');
INSERT INTO order_items (order_id, product_id, product_name, size, color, quantity, unit_price)
VALUES (75, 135, 'Salomon Speedverse PRG', '40', 'Đen Tuyền', 1, 3990000);
INSERT INTO orders (id, code, customer_name, phone, address, note, total, status, voucher_code, discount, created_at)
VALUES (76, 'ONE-CA2A3BC3', 'Lê Thanh Tùng', '0988654321', 'Số 45 Trần Phú, Phường Hải Châu 1, Hải Châu, Đà Nẵng', '[Hình thức: COD]', 2690000, 'completed', NULL, 0, '2026-06-04T01:33:18.269Z');
INSERT INTO order_items (order_id, product_id, product_name, size, color, quantity, unit_price)
VALUES (76, 146, 'Onitsuka Tiger Tokuten Indoor Gum', '42', 'Xám Bạc', 1, 2690000);
INSERT INTO orders (id, code, customer_name, phone, address, note, total, status, voucher_code, discount, created_at)
VALUES (77, 'ONE-F393FE55', 'Đỗ Thị Mai Anh', '0912334455', 'Tòa Landmark 2 - Vinhomes Central Park, Bình Thạnh, TP.HCM', '[Hình thức: COD]', 3690000, 'completed', NULL, 0, '2026-06-09T06:18:03.214Z');
INSERT INTO order_items (order_id, product_id, product_name, size, color, quantity, unit_price)
VALUES (77, 131, 'Salomon Speedcross 6 Grip', '39', 'Đen Đỏ Rực', 1, 3690000);
INSERT INTO orders (id, code, customer_name, phone, address, note, total, status, voucher_code, discount, created_at)
VALUES (78, 'ONE-D1D4B731', 'Trần Phương Đoàn', '0395724805', 'Số 12 Ngõ 84 Ngọc Khánh, Ba Đình, Hà Nội', '[Hình thức: COD]', 7380000, 'completed', NULL, 0, '2026-06-09T10:24:52.692Z');
INSERT INTO order_items (order_id, product_id, product_name, size, color, quantity, unit_price)
VALUES (78, 131, 'Salomon Speedcross 6 Grip', '42', 'Xanh Biển Phối Đen', 2, 3690000);
INSERT INTO orders (id, code, customer_name, phone, address, note, total, status, voucher_code, discount, created_at)
VALUES (79, 'ONE-F42A0CC3', 'Nguyễn Hoàng Nam', '0903124567', '254/12 Lê Văn Sỹ, Phường 14, Quận 3, TP.HCM', '[Hình thức: COD]', 6380000, 'completed', NULL, 0, '2026-06-12T09:57:58.568Z');
INSERT INTO order_items (order_id, product_id, product_name, size, color, quantity, unit_price)
VALUES (79, 105, 'Nike Dunk Low Retro Panda', '44', 'Trắng Đen (Panda)', 2, 3190000);
INSERT INTO orders (id, code, customer_name, phone, address, note, total, status, voucher_code, discount, created_at)
VALUES (80, 'ONE-B9318653', 'Trịnh Thăng Bình', '0908123456', '14 Bà Triệu, TP. Vũng Tàu, Bà Rịa - Vũng Tàu', '[Hình thức: COD]', 6080000, 'completed', NULL, 0, '2026-06-13T01:58:33.238Z');
INSERT INTO order_items (order_id, product_id, product_name, size, color, quantity, unit_price)
VALUES (80, 118, 'New Balance 1906R Metallic Silver', '40', 'Bạc Metallic Ánh Vàng', 1, 3890000);
INSERT INTO order_items (order_id, product_id, product_name, size, color, quantity, unit_price)
VALUES (80, 168, 'Anta PG7 Nitro Daily Cushion', '41', 'Xanh Dương Đậm', 1, 2190000);
INSERT INTO orders (id, code, customer_name, phone, address, note, total, status, voucher_code, discount, created_at)
VALUES (81, 'ONE-0D74B15D', 'Vũ Minh Đức', '0934567890', '78 Lạch Tray, Ngô Quyền, Hải Phòng', '[Hình thức: COD]', 3790000, 'completed', NULL, 0, '2026-06-13T15:04:23.838Z');
INSERT INTO order_items (order_id, product_id, product_name, size, color, quantity, unit_price)
VALUES (81, 134, 'Salomon X Ultra 4 GORE-TEX', '43', 'Đen Xám Bạc', 1, 3790000);
INSERT INTO orders (id, code, customer_name, phone, address, note, total, status, voucher_code, discount, created_at)
VALUES (82, 'ONE-23F07950', 'Phan Bảo Châu', '0909123456', 'Khu Phố 6, Phường Tam Hiệp, Biên Hòa, Đồng Nai', '[Hình thức: COD]', 3990000, 'cancelled', NULL, 0, '2026-06-14T05:45:29.750Z');
INSERT INTO order_items (order_id, product_id, product_name, size, color, quantity, unit_price)
VALUES (82, 135, 'Salomon Speedverse PRG', '43', 'Đen Tuyền', 1, 3990000);
INSERT INTO orders (id, code, customer_name, phone, address, note, total, status, voucher_code, discount, created_at)
VALUES (83, 'ONE-4A120B0D', 'Đỗ Thị Mai Anh', '0912334455', 'Tòa Landmark 2 - Vinhomes Central Park, Bình Thạnh, TP.HCM', '[Hình thức: COD]', 2990000, 'completed', NULL, 0, '2026-06-15T15:56:58.106Z');
INSERT INTO order_items (order_id, product_id, product_name, size, color, quantity, unit_price)
VALUES (83, 149, 'Onitsuka Tiger Mexico 66 Yellow Kill Bill', '39', 'Vàng Sọc Đen (Kill Bill)', 1, 2990000);
INSERT INTO orders (id, code, customer_name, phone, address, note, total, status, voucher_code, discount, created_at)
VALUES (84, 'ONE-344D2E61', 'Tôn Nữ Diệu Thảo', '0935456789', '82 Nguyễn Thái Học, TP. Rạch Giá, Kiên Giang', '[Hình thức: COD]', 4590000, 'cancelled', NULL, 0, '2026-06-16T10:00:31.573Z');
INSERT INTO order_items (order_id, product_id, product_name, size, color, quantity, unit_price)
VALUES (84, 133, 'Salomon XT-4 OG Fiery Red', '41', 'Đỏ Rực Phối Vàng Cam', 1, 4590000);
INSERT INTO orders (id, code, customer_name, phone, address, note, total, status, voucher_code, discount, created_at)
VALUES (85, 'ONE-B055D356', 'Dương Thu Trang', '0978901234', '56 Đồng Khởi, Biên Hòa, Đồng Nai', '[Hình thức: COD]', 7180000, 'completed', NULL, 0, '2026-06-16T14:33:36.873Z');
INSERT INTO order_items (order_id, product_id, product_name, size, color, quantity, unit_price)
VALUES (85, 136, 'Asics Gel-Nimbus 26 PureGEL', '43', 'Xanh Biển Phối Trắng', 1, 4190000);
INSERT INTO order_items (order_id, product_id, product_name, size, color, quantity, unit_price)
VALUES (85, 115, 'New Balance 550 White Grey', '40', 'Trắng Xám Bạc', 1, 2990000);
INSERT INTO orders (id, code, customer_name, phone, address, note, total, status, voucher_code, discount, created_at)
VALUES (86, 'ONE-BF6A6F89', 'Bùi Ngọc Lan', '0945678901', '120 Đường 30/4, Ninh Kiều, Cần Thơ', '[Hình thức: COD]', 3790000, 'completed', NULL, 0, '2026-06-20T07:09:06.616Z');
INSERT INTO order_items (order_id, product_id, product_name, size, color, quantity, unit_price)
VALUES (86, 134, 'Salomon X Ultra 4 GORE-TEX', '41', 'Đen Xám Bạc', 1, 3790000);
INSERT INTO orders (id, code, customer_name, phone, address, note, total, status, voucher_code, discount, created_at)
VALUES (87, 'ONE-ECAA899D', 'Đặng Đình Khoa', '0918234567', '42 Nguyễn Huệ, TP. Huế, Thừa Thiên Huế', '[Hình thức: COD]', 3890000, 'completed', NULL, 0, '2026-06-20T07:52:27.767Z');
INSERT INTO order_items (order_id, product_id, product_name, size, color, quantity, unit_price)
VALUES (87, 132, 'Salomon Pulsar Trail Pro', '41', 'Trắng Bạc', 1, 3890000);
INSERT INTO orders (id, code, customer_name, phone, address, note, total, status, voucher_code, discount, created_at)
VALUES (88, 'ONE-A007A68B', 'Đỗ Thị Mai Anh', '0912334455', 'Tòa Landmark 2 - Vinhomes Central Park, Bình Thạnh, TP.HCM', '[Hình thức: COD]', 7680000, 'completed', NULL, 0, '2026-06-22T13:35:46.703Z');
INSERT INTO order_items (order_id, product_id, product_name, size, color, quantity, unit_price)
VALUES (88, 131, 'Salomon Speedcross 6 Grip', '42', 'Đen Đỏ Rực', 1, 3690000);
INSERT INTO order_items (order_id, product_id, product_name, size, color, quantity, unit_price)
VALUES (88, 135, 'Salomon Speedverse PRG', '43', 'Trắng Ngà Phối Xám', 1, 3990000);
INSERT INTO orders (id, code, customer_name, phone, address, note, total, status, voucher_code, discount, created_at)
VALUES (89, 'ONE-FA54AD7B', 'Tạ Minh Tâm', '0947567890', '33 Lê Lợi, TP. Vinh, Nghệ An', '[Hình thức: COD]', 3890000, 'cancelled', NULL, 0, '2026-06-24T06:48:39.510Z');
INSERT INTO order_items (order_id, product_id, product_name, size, color, quantity, unit_price)
VALUES (89, 104, 'Nike Air Zoom Vomero 17', '42', 'Trắng Platinum', 1, 3890000);
INSERT INTO orders (id, code, customer_name, phone, address, note, total, status, voucher_code, discount, created_at)
VALUES (90, 'ONE-8F161CE7', 'Lê Thanh Tùng', '0988654321', 'Số 45 Trần Phú, Phường Hải Châu 1, Hải Châu, Đà Nẵng', '[Hình thức: COD]', 4990000, 'completed', NULL, 0, '2026-06-25T10:11:07.096Z');
INSERT INTO order_items (order_id, product_id, product_name, size, color, quantity, unit_price)
VALUES (90, 130, 'Salomon ACS Pro Advanced Metal', '44', 'Kim Loại Bạc Trắng', 1, 4990000);
INSERT INTO orders (id, code, customer_name, phone, address, note, total, status, voucher_code, discount, created_at)
VALUES (91, 'ONE-9665F265', 'Tạ Minh Tâm', '0947567890', '33 Lê Lợi, TP. Vinh, Nghệ An', '[Hình thức: COD]', 4290000, 'completed', NULL, 0, '2026-06-26T10:59:46.211Z');
INSERT INTO order_items (order_id, product_id, product_name, size, color, quantity, unit_price)
VALUES (91, 103, 'Nike Invincible 3', '45', 'Xám Bạc', 1, 4290000);
INSERT INTO orders (id, code, customer_name, phone, address, note, total, status, voucher_code, discount, created_at)
VALUES (92, 'ONE-95A8BAAF', 'Phạm Quốc Tuấn', '0979888999', 'Biệt thự BT4, KĐT Ngoại Giao Đoàn, Bắc Từ Liêm, Hà Nội', '[Hình thức: COD]', 2990000, 'completed', NULL, 0, '2026-06-27T01:44:50.259Z');
INSERT INTO order_items (order_id, product_id, product_name, size, color, quantity, unit_price)
VALUES (92, 109, 'Adidas Gazelle Indoor', '41', 'Xanh Lá Đậm Sọc Trắng', 1, 2990000);
INSERT INTO orders (id, code, customer_name, phone, address, note, total, status, voucher_code, discount, created_at)
VALUES (93, 'ONE-3F46D3D1', 'Nguyễn Hoàng Nam', '0903124567', '254/12 Lê Văn Sỹ, Phường 14, Quận 3, TP.HCM', '[Hình thức: COD]', 12320000, 'completed', 'ONE50', 50000, '2026-07-03T03:14:15.862Z');
INSERT INTO order_items (order_id, product_id, product_name, size, color, quantity, unit_price)
VALUES (93, 130, 'Salomon ACS Pro Advanced Metal', '44', 'Kim Loại Bạc Trắng', 2, 4990000);
INSERT INTO order_items (order_id, product_id, product_name, size, color, quantity, unit_price)
VALUES (93, 166, 'Anta Shock The Game 7 Cement King', '40', 'Xám Bê Tông Phối Đỏ Lửa', 1, 2390000);
INSERT INTO orders (id, code, customer_name, phone, address, note, total, status, voucher_code, discount, created_at)
VALUES (94, 'ONE-A232E6B1', 'Lê Thanh Tùng', '0988654321', 'Số 45 Trần Phú, Phường Hải Châu 1, Hải Châu, Đà Nẵng', '[Hình thức: COD]', 3141000, 'completed', 'ONE10', 349000, '2026-07-04T06:58:40.333Z');
INSERT INTO order_items (order_id, product_id, product_name, size, color, quantity, unit_price)
VALUES (94, 148, 'Onitsuka Tiger Delegation EX Chunky', '38', 'Trắng Phối Đỏ Xanh', 1, 3490000);
INSERT INTO orders (id, code, customer_name, phone, address, note, total, status, voucher_code, discount, created_at)
VALUES (95, 'ONE-A7C6A9C1', 'Nguyễn Hoàng Nam', '0903124567', '254/12 Lê Văn Sỹ, Phường 14, Quận 3, TP.HCM', '[Hình thức: COD]', 2140000, 'completed', 'ONE50', 50000, '2026-07-04T09:33:12.538Z');
INSERT INTO order_items (order_id, product_id, product_name, size, color, quantity, unit_price)
VALUES (95, 163, 'Li-Ning Rouge Rabbit 7 Pro', '39', 'Xanh Biển Nhạt', 1, 2190000);
INSERT INTO orders (id, code, customer_name, phone, address, note, total, status, voucher_code, discount, created_at)
VALUES (96, 'ONE-0E498A80', 'Nguyễn Hoàng Nam', '0903124567', '254/12 Lê Văn Sỹ, Phường 14, Quận 3, TP.HCM', '[Hình thức: COD]', 4690000, 'cancelled', NULL, 0, '2026-07-04T11:43:25.083Z');
INSERT INTO order_items (order_id, product_id, product_name, size, color, quantity, unit_price)
VALUES (96, 129, 'Salomon XT-6 Black Phantom', '40', 'Đen Toàn Diện (Black Phantom)', 1, 4690000);
INSERT INTO orders (id, code, customer_name, phone, address, note, total, status, voucher_code, discount, created_at)
VALUES (97, 'ONE-B24771A1', 'Trần Phương Đoàn', '0395724805', 'Số 12 Ngõ 84 Ngọc Khánh, Ba Đình, Hà Nội', '[Hình thức: COD]', 9070000, 'completed', NULL, 0, '2026-07-08T04:56:04.613Z');
INSERT INTO order_items (order_id, product_id, product_name, size, color, quantity, unit_price)
VALUES (97, 168, 'Anta PG7 Nitro Daily Cushion', '43', 'Trắng Xám Bạc', 2, 2190000);
INSERT INTO order_items (order_id, product_id, product_name, size, color, quantity, unit_price)
VALUES (97, 129, 'Salomon XT-6 Black Phantom', '43', 'Trắng Be Bạc', 1, 4690000);
INSERT INTO orders (id, code, customer_name, phone, address, note, total, status, voucher_code, discount, created_at)
VALUES (98, 'ONE-A3EEAF8A', 'Tạ Minh Tâm', '0947567890', '33 Lê Lợi, TP. Vinh, Nghệ An', '[Hình thức: COD]', 4221000, 'completed', 'ONE10', 469000, '2026-07-09T02:37:02.823Z');
INSERT INTO order_items (order_id, product_id, product_name, size, color, quantity, unit_price)
VALUES (98, 129, 'Salomon XT-6 Black Phantom', '43', 'Đen Toàn Diện (Black Phantom)', 1, 4690000);
INSERT INTO orders (id, code, customer_name, phone, address, note, total, status, voucher_code, discount, created_at)
VALUES (99, 'ONE-6A71DC6D', 'Vũ Minh Đức', '0934567890', '78 Lạch Tray, Ngô Quyền, Hải Phòng', '[Hình thức: COD]', 3940000, 'completed', 'ONE50', 50000, '2026-07-13T14:25:06.357Z');
INSERT INTO order_items (order_id, product_id, product_name, size, color, quantity, unit_price)
VALUES (99, 135, 'Salomon Speedverse PRG', '41', 'Đen Tuyền', 1, 3990000);
INSERT INTO orders (id, code, customer_name, phone, address, note, total, status, voucher_code, discount, created_at)
VALUES (100, 'ONE-52F7C12A', 'Phạm Quốc Tuấn', '0979888999', 'Biệt thự BT4, KĐT Ngoại Giao Đoàn, Bắc Từ Liêm, Hà Nội', '[Hình thức: COD]', 6280000, 'completed', NULL, 0, '2026-07-15T02:01:13.340Z');
INSERT INTO order_items (order_id, product_id, product_name, size, color, quantity, unit_price)
VALUES (100, 159, 'Li-Ning Super Light 21 Breeze', '41', 'Xanh Băng Tuyết', 1, 2290000);
INSERT INTO order_items (order_id, product_id, product_name, size, color, quantity, unit_price)
VALUES (100, 107, 'Nike Pegasus Trail 4 GORE-TEX', '40', 'Đen Tuyển', 1, 3990000);
INSERT INTO orders (id, code, customer_name, phone, address, note, total, status, voucher_code, discount, created_at)
VALUES (101, 'ONE-2AFE1E0B', 'Nguyễn Hoàng Nam', '0903124567', '254/12 Lê Văn Sỹ, Phường 14, Quận 3, TP.HCM', '[Hình thức: COD]', 13570000, 'cancelled', NULL, 0, '2026-07-15T06:10:37.331Z');
INSERT INTO order_items (order_id, product_id, product_name, size, color, quantity, unit_price)
VALUES (101, 162, 'Li-Ning Shadow 2 Double Carbon', '40', 'Trắng Đen Phối Đỏ Neon', 2, 5290000);
INSERT INTO order_items (order_id, product_id, product_name, size, color, quantity, unit_price)
VALUES (101, 115, 'New Balance 550 White Grey', '42', 'Trắng Xám Bạc', 1, 2990000);
INSERT INTO orders (id, code, customer_name, phone, address, note, total, status, voucher_code, discount, created_at)
VALUES (102, 'ONE-A9A9371C', 'Phan Bảo Châu', '0909123456', 'Khu Phố 6, Phường Tam Hiệp, Biên Hòa, Đồng Nai', '[Hình thức: COD]', 3590000, 'completed', NULL, 0, '2026-07-17T08:05:14.651Z');
INSERT INTO order_items (order_id, product_id, product_name, size, color, quantity, unit_price)
VALUES (102, 142, 'Asics Gel-Trabuco 12 Trail', '44', 'Xanh Đen Cam', 1, 3590000);
INSERT INTO orders (id, code, customer_name, phone, address, note, total, status, voucher_code, discount, created_at)
VALUES (103, 'ONE-7AEABA55', 'Đinh Trọng Thắng', '0965789012', '102 Nguyễn Trãi, TP. Thanh Hóa', '[Hình thức: COD]', 3940000, 'completed', 'ONE50', 50000, '2026-07-17T11:17:17.911Z');
INSERT INTO order_items (order_id, product_id, product_name, size, color, quantity, unit_price)
VALUES (103, 135, 'Salomon Speedverse PRG', '42', 'Đen Tuyền', 1, 3990000);
INSERT INTO orders (id, code, customer_name, phone, address, note, total, status, voucher_code, discount, created_at)
VALUES (104, 'ONE-630AF2D6', 'Phạm Quốc Tuấn', '0979888999', 'Biệt thự BT4, KĐT Ngoại Giao Đoàn, Bắc Từ Liêm, Hà Nội', '[Hình thức: COD]', 4990000, 'completed', NULL, 0, '2026-07-21T02:56:04.228Z');
INSERT INTO order_items (order_id, product_id, product_name, size, color, quantity, unit_price)
VALUES (104, 130, 'Salomon ACS Pro Advanced Metal', '42', 'Kim Loại Bạc Trắng', 1, 4990000);
INSERT INTO orders (id, code, customer_name, phone, address, note, total, status, voucher_code, discount, created_at)
VALUES (105, 'ONE-7CC7213A', 'Trần Phương Đoàn', '0395724805', 'Số 12 Ngõ 84 Ngọc Khánh, Ba Đình, Hà Nội', '[Hình thức: COD]', 2790000, 'completed', NULL, 0, '2026-07-22T05:20:17.909Z');
INSERT INTO order_items (order_id, product_id, product_name, size, color, quantity, unit_price)
VALUES (105, 108, 'Adidas Samba OG Classic', '39', 'Trắng Sọc Đen Mũi Xám', 1, 2790000);
INSERT INTO orders (id, code, customer_name, phone, address, note, total, status, voucher_code, discount, created_at)
VALUES (106, 'ONE-4CF157A8', 'Nguyễn Kiều Oanh', '0926345678', '71 Cách Mạng Tháng 8, TP. Cà Mau', '[Hình thức: COD]', 7280000, 'completed', NULL, 0, '2026-07-28T04:40:13.560Z');
INSERT INTO order_items (order_id, product_id, product_name, size, color, quantity, unit_price)
VALUES (106, 110, 'Adidas Superstar 82 Originals', '40', 'Trắng Sọc Đen Gót Đen', 1, 2590000);
INSERT INTO order_items (order_id, product_id, product_name, size, color, quantity, unit_price)
VALUES (106, 129, 'Salomon XT-6 Black Phantom', '41', 'Đen Toàn Diện (Black Phantom)', 1, 4690000);
INSERT INTO orders (id, code, customer_name, phone, address, note, total, status, voucher_code, discount, created_at)
VALUES (107, 'ONE-E64741D2', 'Nguyễn Hoàng Nam', '0903124567', '254/12 Lê Văn Sỹ, Phường 14, Quận 3, TP.HCM', '[Hình thức: COD]', 4690000, 'completed', NULL, 0, '2026-07-29T04:16:30.155Z');
INSERT INTO order_items (order_id, product_id, product_name, size, color, quantity, unit_price)
VALUES (107, 129, 'Salomon XT-6 Black Phantom', '44', 'Trắng Be Bạc', 1, 4690000);
INSERT INTO orders (id, code, customer_name, phone, address, note, total, status, voucher_code, discount, created_at)
VALUES (108, 'ONE-7167B3D9', 'Đỗ Thị Mai Anh', '0912334455', 'Tòa Landmark 2 - Vinhomes Central Park, Bình Thạnh, TP.HCM', '[Hình thức: COD]', 4590000, 'completed', NULL, 0, '2026-07-31T10:33:14.650Z');
INSERT INTO order_items (order_id, product_id, product_name, size, color, quantity, unit_price)
VALUES (108, 133, 'Salomon XT-4 OG Fiery Red', '44', 'Trắng Đen', 1, 4590000);
INSERT INTO orders (id, code, customer_name, phone, address, note, total, status, voucher_code, discount, created_at)
VALUES (109, 'ONE-97623516', 'Đỗ Hùng Dũng', '0912223344', '91 Tôn Đức Thắng, Đống Đa, Hà Nội', '[Hình thức: COD]', 4780000, 'cancelled', NULL, 0, '2026-08-02T15:43:09.312Z');
INSERT INTO order_items (order_id, product_id, product_name, size, color, quantity, unit_price)
VALUES (109, 166, 'Anta Shock The Game 7 Cement King', '40', 'Đen Tím', 2, 2390000);
INSERT INTO orders (id, code, customer_name, phone, address, note, total, status, voucher_code, discount, created_at)
VALUES (110, 'ONE-F7F0BFC0', 'Hoàng Văn Hùng', '0967890123', 'Đại Lộ Bình Dương, Thuận An, Bình Dương', '[Hình thức: COD]', 4980000, 'cancelled', NULL, 0, '2026-08-03T05:01:18.843Z');
INSERT INTO order_items (order_id, product_id, product_name, size, color, quantity, unit_price)
VALUES (110, 122, 'Puma Palermo Leather Gum', '40', 'Hồng Pastel Phối Trắng', 2, 2490000);
INSERT INTO orders (id, code, customer_name, phone, address, note, total, status, voucher_code, discount, created_at)
VALUES (111, 'ONE-99B4AD77', 'Đỗ Thị Mai Anh', '0912334455', 'Tòa Landmark 2 - Vinhomes Central Park, Bình Thạnh, TP.HCM', '[Hình thức: COD]', 2790000, 'completed', NULL, 0, '2026-08-04T12:44:03.767Z');
INSERT INTO order_items (order_id, product_id, product_name, size, color, quantity, unit_price)
VALUES (111, 108, 'Adidas Samba OG Classic', '41', 'Trắng Sọc Đen Mũi Xám', 1, 2790000);
INSERT INTO orders (id, code, customer_name, phone, address, note, total, status, voucher_code, discount, created_at)
VALUES (112, 'ONE-EC957095', 'Trịnh Thăng Bình', '0908123456', '14 Bà Triệu, TP. Vũng Tàu, Bà Rịa - Vũng Tàu', '[Hình thức: COD]', 13620000, 'completed', 'ONE50', 50000, '2026-08-05T02:51:53.130Z');
INSERT INTO order_items (order_id, product_id, product_name, size, color, quantity, unit_price)
VALUES (112, 134, 'Salomon X Ultra 4 GORE-TEX', '43', 'Xanh Rêu Xám', 1, 3790000);
INSERT INTO order_items (order_id, product_id, product_name, size, color, quantity, unit_price)
VALUES (112, 133, 'Salomon XT-4 OG Fiery Red', '42', 'Trắng Đen', 1, 4590000);
INSERT INTO order_items (order_id, product_id, product_name, size, color, quantity, unit_price)
VALUES (112, 162, 'Li-Ning Shadow 2 Double Carbon', '40', 'Trắng Đen Phối Đỏ Neon', 1, 5290000);
INSERT INTO orders (id, code, customer_name, phone, address, note, total, status, voucher_code, discount, created_at)
VALUES (113, 'ONE-E79DDCE7', 'Bùi Ngọc Lan', '0945678901', '120 Đường 30/4, Ninh Kiều, Cần Thơ', '[Hình thức: COD]', 8530000, 'cancelled', 'ONE50', 50000, '2026-08-05T04:38:37.416Z');
INSERT INTO order_items (order_id, product_id, product_name, size, color, quantity, unit_price)
VALUES (113, 133, 'Salomon XT-4 OG Fiery Red', '42', 'Đỏ Rực Phối Vàng Cam', 1, 4590000);
INSERT INTO order_items (order_id, product_id, product_name, size, color, quantity, unit_price)
VALUES (113, 107, 'Nike Pegasus Trail 4 GORE-TEX', '41', 'Xám Than Cam Rực', 1, 3990000);
INSERT INTO orders (id, code, customer_name, phone, address, note, total, status, voucher_code, discount, created_at)
VALUES (114, 'ONE-E757CE4D', 'Lê Thanh Tùng', '0988654321', 'Số 45 Trần Phú, Phường Hải Châu 1, Hải Châu, Đà Nẵng', '[Hình thức: COD]', 7730000, 'completed', 'ONE50', 50000, '2026-08-06T15:11:37.467Z');
INSERT INTO order_items (order_id, product_id, product_name, size, color, quantity, unit_price)
VALUES (114, 108, 'Adidas Samba OG Classic', '43', 'Trắng Sọc Đen Mũi Xám', 1, 2790000);
INSERT INTO order_items (order_id, product_id, product_name, size, color, quantity, unit_price)
VALUES (114, 130, 'Salomon ACS Pro Advanced Metal', '42', 'Đen Tuyển', 1, 4990000);
INSERT INTO orders (id, code, customer_name, phone, address, note, total, status, voucher_code, discount, created_at)
VALUES (115, 'ONE-3052E4C5', 'Phan Bảo Châu', '0909123456', 'Khu Phố 6, Phường Tam Hiệp, Biên Hòa, Đồng Nai', '[Hình thức: COD]', 2990000, 'completed', NULL, 0, '2026-08-07T05:56:26.162Z');
INSERT INTO order_items (order_id, product_id, product_name, size, color, quantity, unit_price)
VALUES (115, 115, 'New Balance 550 White Grey', '42', 'Trắng Xanh Navy', 1, 2990000);
INSERT INTO orders (id, code, customer_name, phone, address, note, total, status, voucher_code, discount, created_at)
VALUES (116, 'ONE-9EF2BCF9', 'Nguyễn Phong Hồng Duy', '0923334455', '14 Hai Bà Trưng, TP. Pleiku, Gia Lai', '[Hình thức: COD]', 2990000, 'cancelled', NULL, 0, '2026-08-09T06:38:29.270Z');
INSERT INTO order_items (order_id, product_id, product_name, size, color, quantity, unit_price)
VALUES (116, 115, 'New Balance 550 White Grey', '42', 'Trắng Xanh Navy', 1, 2990000);
INSERT INTO orders (id, code, customer_name, phone, address, note, total, status, voucher_code, discount, created_at)
VALUES (117, 'ONE-89EB76E8', 'Phạm Quốc Tuấn', '0979888999', 'Biệt thự BT4, KĐT Ngoại Giao Đoàn, Bắc Từ Liêm, Hà Nội', '[Hình thức: COD]', 1840000, 'completed', 'ONE50', 50000, '2026-08-14T12:01:33.925Z');
INSERT INTO order_items (order_id, product_id, product_name, size, color, quantity, unit_price)
VALUES (117, 170, 'Anta Walker Retro Casual', '41', 'Trắng Sọc Xanh Navy', 1, 1890000);
INSERT INTO orders (id, code, customer_name, phone, address, note, total, status, voucher_code, discount, created_at)
VALUES (118, 'ONE-11339C33', 'Khổng Tú Quỳnh', '0917234567', '29 Lý Thường Kiệt, TP. Long Xuyên, An Giang', '[Hình thức: COD]', 7580000, 'completed', NULL, 0, '2026-08-16T05:20:03.325Z');
INSERT INTO order_items (order_id, product_id, product_name, size, color, quantity, unit_price)
VALUES (118, 121, 'New Balance Fresh Foam X Hierro v8', '41', 'Xám Đất Nung Phối Đen', 2, 3790000);
INSERT INTO orders (id, code, customer_name, phone, address, note, total, status, voucher_code, discount, created_at)
VALUES (119, 'ONE-AA763310', 'Lê Thanh Tùng', '0988654321', 'Số 45 Trần Phú, Phường Hải Châu 1, Hải Châu, Đà Nẵng', '[Hình thức: COD]', 2240000, 'completed', 'ONE50', 50000, '2026-08-16T14:12:19.657Z');
INSERT INTO order_items (order_id, product_id, product_name, size, color, quantity, unit_price)
VALUES (119, 159, 'Li-Ning Super Light 21 Breeze', '38', 'Hồng Cam Bình Minh', 1, 2290000);
INSERT INTO orders (id, code, customer_name, phone, address, note, total, status, voucher_code, discount, created_at)
VALUES (120, 'ONE-F83FE7BA', 'Vũ Minh Đức', '0934567890', '78 Lạch Tray, Ngô Quyền, Hải Phòng', '[Hình thức: COD]', 3590000, 'completed', NULL, 0, '2026-08-19T09:57:03.757Z');
INSERT INTO order_items (order_id, product_id, product_name, size, color, quantity, unit_price)
VALUES (120, 150, 'Mizuno Wave Rider 28 Enerzy', '41', 'Trắng Xám', 1, 3590000);
INSERT INTO orders (id, code, customer_name, phone, address, note, total, status, voucher_code, discount, created_at)
VALUES (121, 'ONE-B9817C8C', 'Dương Thu Trang', '0978901234', '56 Đồng Khởi, Biên Hòa, Đồng Nai', '[Hình thức: COD]', 4690000, 'completed', NULL, 0, '2026-08-21T15:17:13.372Z');
INSERT INTO order_items (order_id, product_id, product_name, size, color, quantity, unit_price)
VALUES (121, 129, 'Salomon XT-6 Black Phantom', '42', 'Đen Toàn Diện (Black Phantom)', 1, 4690000);
INSERT INTO orders (id, code, customer_name, phone, address, note, total, status, voucher_code, discount, created_at)
VALUES (122, 'ONE-462AC69B', 'Trần Phương Đoàn', '0395724805', 'Số 12 Ngõ 84 Ngọc Khánh, Ba Đình, Hà Nội', '[Hình thức: COD]', 13570000, 'completed', NULL, 0, '2026-08-23T08:00:24.286Z');
INSERT INTO order_items (order_id, product_id, product_name, size, color, quantity, unit_price)
VALUES (122, 129, 'Salomon XT-6 Black Phantom', '42', 'Đen Toàn Diện (Black Phantom)', 1, 4690000);
INSERT INTO order_items (order_id, product_id, product_name, size, color, quantity, unit_price)
VALUES (122, 130, 'Salomon ACS Pro Advanced Metal', '43', 'Đen Tuyển', 1, 4990000);
INSERT INTO order_items (order_id, product_id, product_name, size, color, quantity, unit_price)
VALUES (122, 132, 'Salomon Pulsar Trail Pro', '42', 'Trắng Bạc', 1, 3890000);
INSERT INTO orders (id, code, customer_name, phone, address, note, total, status, voucher_code, discount, created_at)
VALUES (123, 'ONE-DDF3AF06', 'Trịnh Thăng Bình', '0908123456', '14 Bà Triệu, TP. Vũng Tàu, Bà Rịa - Vũng Tàu', '[Hình thức: COD]', 3390000, 'completed', NULL, 0, '2026-08-24T14:09:22.505Z');
INSERT INTO order_items (order_id, product_id, product_name, size, color, quantity, unit_price)
VALUES (123, 127, 'Puma MB.03 Toxic LaMelo Ball', '42', 'Tím Neon Độc Lạ', 1, 3390000);
INSERT INTO orders (id, code, customer_name, phone, address, note, total, status, voucher_code, discount, created_at)
VALUES (124, 'ONE-E613D947', 'Phạm Quốc Tuấn', '0979888999', 'Biệt thự BT4, KĐT Ngoại Giao Đoàn, Bắc Từ Liêm, Hà Nội', '[Hình thức: COD]', 3771000, 'completed', 'ONE10', 419000, '2026-08-27T02:38:54.173Z');
INSERT INTO order_items (order_id, product_id, product_name, size, color, quantity, unit_price)
VALUES (124, 136, 'Asics Gel-Nimbus 26 PureGEL', '40', 'Xanh Biển Phối Trắng', 1, 4190000);
INSERT INTO orders (id, code, customer_name, phone, address, note, total, status, voucher_code, discount, created_at)
VALUES (125, 'ONE-BC50D806', 'Nguyễn Hoàng Nam', '0903124567', '254/12 Lê Văn Sỹ, Phường 14, Quận 3, TP.HCM', '[Hình thức: COD]', 2241000, 'completed', 'ONE10', 249000, '2026-08-27T13:30:58.244Z');
INSERT INTO order_items (order_id, product_id, product_name, size, color, quantity, unit_price)
VALUES (125, 156, 'Mizuno Contender Retro Sport', '39', 'Trắng Xám Runbird Đỏ', 1, 2490000);
INSERT INTO orders (id, code, customer_name, phone, address, note, total, status, voucher_code, discount, created_at)
VALUES (126, 'ONE-276A24D4', 'Dương Thu Trang', '0978901234', '56 Đồng Khởi, Biên Hòa, Đồng Nai', '[Hình thức: COD]', 4590000, 'completed', NULL, 0, '2026-08-28T07:00:06.305Z');
INSERT INTO order_items (order_id, product_id, product_name, size, color, quantity, unit_price)
VALUES (126, 133, 'Salomon XT-4 OG Fiery Red', '42', 'Trắng Đen', 1, 4590000);
INSERT INTO orders (id, code, customer_name, phone, address, note, total, status, voucher_code, discount, created_at)
VALUES (127, 'ONE-E762388D', 'Trần Phương Đoàn', '0395724805', 'Số 12 Ngõ 84 Ngọc Khánh, Ba Đình, Hà Nội', '[Hình thức: COD]', 2490000, 'completed', NULL, 0, '2026-08-31T01:44:15.396Z');
INSERT INTO order_items (order_id, product_id, product_name, size, color, quantity, unit_price)
VALUES (127, 156, 'Mizuno Contender Retro Sport', '42', 'Trắng Xám Runbird Đỏ', 1, 2490000);
INSERT INTO orders (id, code, customer_name, phone, address, note, total, status, voucher_code, discount, created_at)
VALUES (128, 'ONE-D25A59D9', 'Đặng Đình Khoa', '0918234567', '42 Nguyễn Huệ, TP. Huế, Thừa Thiên Huế', '[Hình thức: COD]', 10920000, 'completed', 'ONE50', 50000, '2026-09-01T07:46:13.192Z');
INSERT INTO order_items (order_id, product_id, product_name, size, color, quantity, unit_price)
VALUES (128, 107, 'Nike Pegasus Trail 4 GORE-TEX', '41', 'Xám Than Cam Rực', 1, 3990000);
INSERT INTO order_items (order_id, product_id, product_name, size, color, quantity, unit_price)
VALUES (128, 105, 'Nike Dunk Low Retro Panda', '44', 'Trắng Đen (Panda)', 1, 3190000);
INSERT INTO order_items (order_id, product_id, product_name, size, color, quantity, unit_price)
VALUES (128, 113, 'Adidas Adizero Boston 12', '41', 'Trắng Sọc Đen Neon', 1, 3790000);
INSERT INTO orders (id, code, customer_name, phone, address, note, total, status, voucher_code, discount, created_at)
VALUES (129, 'ONE-F86AAFDB', 'Vương Gia Huy', '0992012345', '50 Đào Xã, Thanh Thủy, Phú Thọ', '[Hình thức: COD]', 3490000, 'completed', NULL, 0, '2026-09-05T02:43:52.548Z');
INSERT INTO order_items (order_id, product_id, product_name, size, color, quantity, unit_price)
VALUES (129, 101, 'Nike Air Zoom Pegasus 41', '42', 'Trắng Phối Cam Volt', 1, 3490000);
INSERT INTO orders (id, code, customer_name, phone, address, note, total, status, voucher_code, discount, created_at)
VALUES (130, 'ONE-9C467D3C', 'Dương Thu Trang', '0978901234', '56 Đồng Khởi, Biên Hòa, Đồng Nai', '[Hình thức: COD]', 4590000, 'completed', NULL, 0, '2026-09-05T09:11:03.465Z');
INSERT INTO order_items (order_id, product_id, product_name, size, color, quantity, unit_price)
VALUES (130, 133, 'Salomon XT-4 OG Fiery Red', '41', 'Đỏ Rực Phối Vàng Cam', 1, 4590000);
INSERT INTO orders (id, code, customer_name, phone, address, note, total, status, voucher_code, discount, created_at)
VALUES (131, 'ONE-6021629F', 'Dương Thu Trang', '0978901234', '56 Đồng Khởi, Biên Hòa, Đồng Nai', '[Hình thức: COD]', 3290000, 'completed', NULL, 0, '2026-09-07T04:48:25.670Z');
INSERT INTO order_items (order_id, product_id, product_name, size, color, quantity, unit_price)
VALUES (131, 165, 'Anta KT9 3D Carbon Stabilizer', '41', 'Đen Phantom Phối Vàng Kim', 1, 3290000);
INSERT INTO orders (id, code, customer_name, phone, address, note, total, status, voucher_code, discount, created_at)
VALUES (132, 'ONE-6CF34EFD', 'Đỗ Thị Mai Anh', '0912334455', 'Tòa Landmark 2 - Vinhomes Central Park, Bình Thạnh, TP.HCM', '[Hình thức: COD]', 5530000, 'completed', 'ONE50', 50000, '2026-09-14T13:47:14.917Z');
INSERT INTO order_items (order_id, product_id, product_name, size, color, quantity, unit_price)
VALUES (132, 108, 'Adidas Samba OG Classic', '42', 'Trắng Sọc Đen Mũi Xám', 2, 2790000);
INSERT INTO orders (id, code, customer_name, phone, address, note, total, status, voucher_code, discount, created_at)
VALUES (133, 'ONE-0EECC8EF', 'Mai Tiến Dũng', '0938456789', '15 Trần Hưng Đạo, TP. Quy Nhơn, Bình Định', '[Hình thức: COD]', 3591000, 'completed', 'ONE10', 399000, '2026-09-16T14:12:46.921Z');
INSERT INTO order_items (order_id, product_id, product_name, size, color, quantity, unit_price)
VALUES (133, 157, 'Li-Ning Feidian 3.0 Elite Carbon', '39', 'Xanh Lam Neon', 1, 3990000);
INSERT INTO orders (id, code, customer_name, phone, address, note, total, status, voucher_code, discount, created_at)
VALUES (134, 'ONE-83DDFE80', 'Tôn Nữ Diệu Thảo', '0935456789', '82 Nguyễn Thái Học, TP. Rạch Giá, Kiên Giang', '[Hình thức: COD]', 5840000, 'completed', 'ONE50', 50000, '2026-09-17T02:34:05.312Z');
INSERT INTO order_items (order_id, product_id, product_name, size, color, quantity, unit_price)
VALUES (134, 102, 'Nike ZoomX Vaporfly 3', '43', 'Hồng Neon Bạc', 1, 5890000);
INSERT INTO orders (id, code, customer_name, phone, address, note, total, status, voucher_code, discount, created_at)
VALUES (135, 'ONE-88819D64', 'Nguyễn Hoàng Nam', '0903124567', '254/12 Lê Văn Sỹ, Phường 14, Quận 3, TP.HCM', '[Hình thức: COD]', 3490000, 'completed', NULL, 0, '2026-09-17T15:18:16.921Z');
INSERT INTO order_items (order_id, product_id, product_name, size, color, quantity, unit_price)
VALUES (135, 101, 'Nike Air Zoom Pegasus 41', '44', 'Trắng Phối Cam Volt', 1, 3490000);
INSERT INTO orders (id, code, customer_name, phone, address, note, total, status, voucher_code, discount, created_at)
VALUES (136, 'ONE-E6907958', 'Ngô Kiến Huy', '0989012345', '18 Hùng Vương, TP. Hạ Long, Quảng Ninh', '[Hình thức: COD]', 2890000, 'cancelled', NULL, 0, '2026-09-18T11:02:58.721Z');
INSERT INTO order_items (order_id, product_id, product_name, size, color, quantity, unit_price)
VALUES (136, 161, 'Li-Ning YuShuai 18 V2 Streetball', '41', 'Đen Tuyền', 1, 2890000);
INSERT INTO orders (id, code, customer_name, phone, address, note, total, status, voucher_code, discount, created_at)
VALUES (137, 'ONE-0421FF8D', 'Đỗ Hùng Dũng', '0912223344', '91 Tôn Đức Thắng, Đống Đa, Hà Nội', '[Hình thức: COD]', 3490000, 'completed', NULL, 0, '2026-09-20T02:00:50.946Z');
INSERT INTO order_items (order_id, product_id, product_name, size, color, quantity, unit_price)
VALUES (137, 148, 'Onitsuka Tiger Delegation EX Chunky', '39', 'Đen Nguyên Bản', 1, 3490000);
INSERT INTO orders (id, code, customer_name, phone, address, note, total, status, voucher_code, discount, created_at)
VALUES (138, 'ONE-242BF63B', 'Bùi Tiến Dũng', '0971890123', '22 Thạch Hãn, Hải Lăng, Quảng Trị', '[Hình thức: COD]', 7380000, 'completed', NULL, 0, '2026-09-20T14:45:43.540Z');
INSERT INTO order_items (order_id, product_id, product_name, size, color, quantity, unit_price)
VALUES (138, 131, 'Salomon Speedcross 6 Grip', '43', 'Xanh Biển Phối Đen', 2, 3690000);
INSERT INTO orders (id, code, customer_name, phone, address, note, total, status, voucher_code, discount, created_at)
VALUES (139, 'ONE-82B0CC19', 'Đỗ Thị Mai Anh', '0912334455', 'Tòa Landmark 2 - Vinhomes Central Park, Bình Thạnh, TP.HCM', '[Hình thức: COD]', 2690000, 'completed', NULL, 0, '2026-09-21T09:42:40.918Z');
INSERT INTO order_items (order_id, product_id, product_name, size, color, quantity, unit_price)
VALUES (139, 116, 'New Balance 530 Steel Grey', '39', 'Xám Bạc Ánh Kim', 1, 2690000);
INSERT INTO orders (id, code, customer_name, phone, address, note, total, status, voucher_code, discount, created_at)
VALUES (140, 'ONE-0D09BF5A', 'Dương Thu Trang', '0978901234', '56 Đồng Khởi, Biên Hòa, Đồng Nai', '[Hình thức: COD]', 3590000, 'cancelled', NULL, 0, '2026-09-22T11:52:01.112Z');
INSERT INTO order_items (order_id, product_id, product_name, size, color, quantity, unit_price)
VALUES (140, 150, 'Mizuno Wave Rider 28 Enerzy', '41', 'Trắng Xám', 1, 3590000);
INSERT INTO orders (id, code, customer_name, phone, address, note, total, status, voucher_code, discount, created_at)
VALUES (141, 'ONE-040AD200', 'Tạ Minh Tâm', '0947567890', '33 Lê Lợi, TP. Vinh, Nghệ An', '[Hình thức: COD]', 2190000, 'completed', NULL, 0, '2026-09-24T05:51:03.676Z');
INSERT INTO order_items (order_id, product_id, product_name, size, color, quantity, unit_price)
VALUES (141, 168, 'Anta PG7 Nitro Daily Cushion', '39', 'Xanh Dương Đậm', 1, 2190000);
INSERT INTO orders (id, code, customer_name, phone, address, note, total, status, voucher_code, discount, created_at)
VALUES (142, 'ONE-D65EBBC1', 'Lê Thanh Tùng', '0988654321', 'Số 45 Trần Phú, Phường Hải Châu 1, Hải Châu, Đà Nẵng', '[Hình thức: COD]', 2691000, 'completed', 'ONE10', 299000, '2026-09-27T11:29:42.110Z');
INSERT INTO order_items (order_id, product_id, product_name, size, color, quantity, unit_price)
VALUES (142, 115, 'New Balance 550 White Grey', '43', 'Trắng Xanh Navy', 1, 2990000);
INSERT INTO orders (id, code, customer_name, phone, address, note, total, status, voucher_code, discount, created_at)
VALUES (143, 'ONE-B63587D8', 'Phạm Quốc Tuấn', '0979888999', 'Biệt thự BT4, KĐT Ngoại Giao Đoàn, Bắc Từ Liêm, Hà Nội', '[Hình thức: COD]', 4190000, 'completed', NULL, 0, '2026-09-28T10:48:34.367Z');
INSERT INTO order_items (order_id, product_id, product_name, size, color, quantity, unit_price)
VALUES (143, 167, 'Anta C202 GT Pro Carbon Racing', '40', 'Cam Lửa Bạc', 1, 4190000);
INSERT INTO orders (id, code, customer_name, phone, address, note, total, status, voucher_code, discount, created_at)
VALUES (144, 'ONE-9FA21869', 'Lê Thanh Tùng', '0988654321', 'Số 45 Trần Phú, Phường Hải Châu 1, Hải Châu, Đà Nẵng', '[Hình thức: COD]', 2511000, 'completed', 'ONE10', 279000, '2026-09-29T14:56:22.492Z');
INSERT INTO order_items (order_id, product_id, product_name, size, color, quantity, unit_price)
VALUES (144, 108, 'Adidas Samba OG Classic', '41', 'Đen Sọc Trắng', 1, 2790000);
INSERT INTO orders (id, code, customer_name, phone, address, note, total, status, voucher_code, discount, created_at)
VALUES (145, 'ONE-AAC329CC', 'Phan Bảo Châu', '0909123456', 'Khu Phố 6, Phường Tam Hiệp, Biên Hòa, Đồng Nai', '[Hình thức: COD]', 3890000, 'completed', NULL, 0, '2026-09-29T14:58:16.585Z');
INSERT INTO order_items (order_id, product_id, product_name, size, color, quantity, unit_price)
VALUES (145, 132, 'Salomon Pulsar Trail Pro', '40', 'Trắng Bạc', 1, 3890000);
INSERT INTO orders (id, code, customer_name, phone, address, note, total, status, voucher_code, discount, created_at)
VALUES (146, 'ONE-0A8B216D', 'Hoàng Văn Hùng', '0967890123', 'Đại Lộ Bình Dương, Thuận An, Bình Dương', '[Hình thức: COD]', 4390000, 'completed', NULL, 0, '2026-10-01T03:29:58.870Z');
INSERT INTO order_items (order_id, product_id, product_name, size, color, quantity, unit_price)
VALUES (146, 119, 'New Balance Fresh Foam X 1080v13', '40', 'Đen Bạc', 1, 4390000);
INSERT INTO orders (id, code, customer_name, phone, address, note, total, status, voucher_code, discount, created_at)
VALUES (147, 'ONE-FABB4E41', 'Nguyễn Hoàng Nam', '0903124567', '254/12 Lê Văn Sỹ, Phường 14, Quận 3, TP.HCM', '[Hình thức: COD]', 3690000, 'completed', NULL, 0, '2026-10-01T05:50:43.713Z');
INSERT INTO order_items (order_id, product_id, product_name, size, color, quantity, unit_price)
VALUES (147, 131, 'Salomon Speedcross 6 Grip', '42', 'Đen Đỏ Rực', 1, 3690000);
INSERT INTO orders (id, code, customer_name, phone, address, note, total, status, voucher_code, discount, created_at)
VALUES (148, 'ONE-0109A940', 'Tôn Nữ Diệu Thảo', '0935456789', '82 Nguyễn Thái Học, TP. Rạch Giá, Kiên Giang', '[Hình thức: COD]', 2691000, 'cancelled', 'ONE10', 299000, '2026-10-02T03:16:23.115Z');
INSERT INTO order_items (order_id, product_id, product_name, size, color, quantity, unit_price)
VALUES (148, 126, 'Puma Velocity Nitro 3', '39', 'Đen Phối Vàng Chanh', 1, 2990000);
INSERT INTO orders (id, code, customer_name, phone, address, note, total, status, voucher_code, discount, created_at)
VALUES (149, 'ONE-BE9384E9', 'Lê Thanh Tùng', '0988654321', 'Số 45 Trần Phú, Phường Hải Châu 1, Hải Châu, Đà Nẵng', '[Hình thức: COD]', 5391000, 'completed', 'ONE10', 599000, '2026-10-05T01:01:28.650Z');
INSERT INTO order_items (order_id, product_id, product_name, size, color, quantity, unit_price)
VALUES (149, 112, 'Adidas Adizero Adios Pro 3', '43', 'Xanh Ngọc Solar Red', 1, 5990000);
INSERT INTO orders (id, code, customer_name, phone, address, note, total, status, voucher_code, discount, created_at)
VALUES (150, 'ONE-555542C4', 'Ngô Kiến Huy', '0989012345', '18 Hùng Vương, TP. Hạ Long, Quảng Ninh', '[Hình thức: COD]', 4990000, 'completed', NULL, 0, '2026-10-06T09:08:02.675Z');
INSERT INTO order_items (order_id, product_id, product_name, size, color, quantity, unit_price)
VALUES (150, 130, 'Salomon ACS Pro Advanced Metal', '40', 'Đen Tuyển', 1, 4990000);
INSERT INTO orders (id, code, customer_name, phone, address, note, total, status, voucher_code, discount, created_at)
VALUES (151, 'ONE-EB9870EA', 'Mai Tiến Dũng', '0938456789', '15 Trần Hưng Đạo, TP. Quy Nhơn, Bình Định', '[Hình thức: COD]', 9280000, 'completed', NULL, 0, '2026-10-07T06:52:25.226Z');
INSERT INTO order_items (order_id, product_id, product_name, size, color, quantity, unit_price)
VALUES (151, 133, 'Salomon XT-4 OG Fiery Red', '40', 'Trắng Đen', 1, 4590000);
INSERT INTO order_items (order_id, product_id, product_name, size, color, quantity, unit_price)
VALUES (151, 129, 'Salomon XT-6 Black Phantom', '40', 'Trắng Be Bạc', 1, 4690000);
INSERT INTO orders (id, code, customer_name, phone, address, note, total, status, voucher_code, discount, created_at)
VALUES (152, 'ONE-B5A451AE', 'Mai Tiến Dũng', '0938456789', '15 Trần Hưng Đạo, TP. Quy Nhơn, Bình Định', '[Hình thức: COD]', 5742000, 'cancelled', 'ONE10', 638000, '2026-10-07T12:14:14.527Z');
INSERT INTO order_items (order_id, product_id, product_name, size, color, quantity, unit_price)
VALUES (152, 101, 'Nike Air Zoom Pegasus 41', '40', 'Trắng Phối Cam Volt', 1, 3490000);
INSERT INTO order_items (order_id, product_id, product_name, size, color, quantity, unit_price)
VALUES (152, 161, 'Li-Ning YuShuai 18 V2 Streetball', '41', 'Đen Tuyền', 1, 2890000);
INSERT INTO orders (id, code, customer_name, phone, address, note, total, status, voucher_code, discount, created_at)
VALUES (153, 'ONE-6FA1627D', 'Tạ Minh Tâm', '0947567890', '33 Lê Lợi, TP. Vinh, Nghệ An', '[Hình thức: COD]', 8580000, 'completed', NULL, 0, '2026-10-08T03:53:35.336Z');
INSERT INTO order_items (order_id, product_id, product_name, size, color, quantity, unit_price)
VALUES (153, 103, 'Nike Invincible 3', '42', 'Xám Bạc', 2, 4290000);
INSERT INTO orders (id, code, customer_name, phone, address, note, total, status, voucher_code, discount, created_at)
VALUES (154, 'ONE-E4CB9BA7', 'Lê Thanh Tùng', '0988654321', 'Số 45 Trần Phú, Phường Hải Châu 1, Hải Châu, Đà Nẵng', '[Hình thức: COD]', 3231000, 'completed', 'ONE10', 359000, '2026-10-09T12:26:42.726Z');
INSERT INTO order_items (order_id, product_id, product_name, size, color, quantity, unit_price)
VALUES (154, 150, 'Mizuno Wave Rider 28 Enerzy', '41', 'Trắng Xám', 1, 3590000);
INSERT INTO orders (id, code, customer_name, phone, address, note, total, status, voucher_code, discount, created_at)
VALUES (155, 'ONE-DE69120E', 'Nguyễn Kiều Oanh', '0926345678', '71 Cách Mạng Tháng 8, TP. Cà Mau', '[Hình thức: COD]', 2790000, 'completed', NULL, 0, '2026-10-11T01:54:56.618Z');
INSERT INTO order_items (order_id, product_id, product_name, size, color, quantity, unit_price)
VALUES (155, 108, 'Adidas Samba OG Classic', '43', 'Trắng Sọc Đen Mũi Xám', 1, 2790000);
INSERT INTO orders (id, code, customer_name, phone, address, note, total, status, voucher_code, discount, created_at)
VALUES (156, 'ONE-DAB83878', 'Đặng Đình Khoa', '0918234567', '42 Nguyễn Huệ, TP. Huế, Thừa Thiên Huế', '[Hình thức: COD]', 3390000, 'completed', NULL, 0, '2026-10-12T02:15:29.877Z');
INSERT INTO order_items (order_id, product_id, product_name, size, color, quantity, unit_price)
VALUES (156, 139, 'Asics GT-2000 12 Stability', '40', 'Xanh Navy Trắng', 1, 3390000);
INSERT INTO orders (id, code, customer_name, phone, address, note, total, status, voucher_code, discount, created_at)
VALUES (157, 'ONE-87AD9FAB', 'Phan Bảo Châu', '0909123456', 'Khu Phố 6, Phường Tam Hiệp, Biên Hòa, Đồng Nai', '[Hình thức: COD]', 4990000, 'completed', NULL, 0, '2026-10-19T03:07:57.096Z');
INSERT INTO order_items (order_id, product_id, product_name, size, color, quantity, unit_price)
VALUES (157, 130, 'Salomon ACS Pro Advanced Metal', '41', 'Kim Loại Bạc Trắng', 1, 4990000);
INSERT INTO orders (id, code, customer_name, phone, address, note, total, status, voucher_code, discount, created_at)
VALUES (158, 'ONE-FB3837EA', 'Hoàng Văn Hùng', '0967890123', 'Đại Lộ Bình Dương, Thuận An, Bình Dương', '[Hình thức: COD]', 4190000, 'completed', NULL, 0, '2026-10-24T14:33:46.878Z');
INSERT INTO order_items (order_id, product_id, product_name, size, color, quantity, unit_price)
VALUES (158, 167, 'Anta C202 GT Pro Carbon Racing', '40', 'Trắng Xanh Biển', 1, 4190000);
INSERT INTO orders (id, code, customer_name, phone, address, note, total, status, voucher_code, discount, created_at)
VALUES (159, 'ONE-B990A527', 'Khổng Tú Quỳnh', '0917234567', '29 Lý Thường Kiệt, TP. Long Xuyên, An Giang', '[Hình thức: COD]', 5890000, 'completed', NULL, 0, '2026-10-25T03:20:09.890Z');
INSERT INTO order_items (order_id, product_id, product_name, size, color, quantity, unit_price)
VALUES (159, 102, 'Nike ZoomX Vaporfly 3', '43', 'Hồng Neon Bạc', 1, 5890000);
INSERT INTO orders (id, code, customer_name, phone, address, note, total, status, voucher_code, discount, created_at)
VALUES (160, 'ONE-6585DA45', 'Hoàng Văn Hùng', '0967890123', 'Đại Lộ Bình Dương, Thuận An, Bình Dương', '[Hình thức: COD]', 7580000, 'completed', NULL, 0, '2026-10-25T08:40:21.151Z');
INSERT INTO order_items (order_id, product_id, product_name, size, color, quantity, unit_price)
VALUES (160, 154, 'Mizuno Wave Mujin 10 Michelin Trail', '43', 'Xanh Rừng Phối Đen', 2, 3790000);
INSERT INTO orders (id, code, customer_name, phone, address, note, total, status, voucher_code, discount, created_at)
VALUES (161, 'ONE-A1C0E77D', 'Vũ Minh Đức', '0934567890', '78 Lạch Tray, Ngô Quyền, Hải Phòng', '[Hình thức: COD]', 7542000, 'cancelled', 'ONE10', 838000, '2026-10-25T12:39:50.515Z');
INSERT INTO order_items (order_id, product_id, product_name, size, color, quantity, unit_price)
VALUES (161, 136, 'Asics Gel-Nimbus 26 PureGEL', '41', 'Xanh Biển Phối Trắng', 1, 4190000);
INSERT INTO order_items (order_id, product_id, product_name, size, color, quantity, unit_price)
VALUES (161, 136, 'Asics Gel-Nimbus 26 PureGEL', '42', 'Xanh Biển Phối Trắng', 1, 4190000);
INSERT INTO orders (id, code, customer_name, phone, address, note, total, status, voucher_code, discount, created_at)
VALUES (162, 'ONE-72ADAB5F', 'Bùi Tiến Dũng', '0971890123', '22 Thạch Hãn, Hải Lăng, Quảng Trị', '[Hình thức: COD]', 4590000, 'completed', NULL, 0, '2026-10-26T03:24:02.196Z');
INSERT INTO order_items (order_id, product_id, product_name, size, color, quantity, unit_price)
VALUES (162, 133, 'Salomon XT-4 OG Fiery Red', '44', 'Trắng Đen', 1, 4590000);
INSERT INTO orders (id, code, customer_name, phone, address, note, total, status, voucher_code, discount, created_at)
VALUES (163, 'ONE-BD57DDAF', 'Bùi Ngọc Lan', '0945678901', '120 Đường 30/4, Ninh Kiều, Cần Thơ', '[Hình thức: COD]', 9970000, 'completed', NULL, 0, '2026-10-26T13:54:56.373Z');
INSERT INTO order_items (order_id, product_id, product_name, size, color, quantity, unit_price)
VALUES (163, 166, 'Anta Shock The Game 7 Cement King', '41', 'Đen Tím', 1, 2390000);
INSERT INTO order_items (order_id, product_id, product_name, size, color, quantity, unit_price)
VALUES (163, 144, 'Onitsuka Tiger Mexico 66 SD Leather', '41', 'Trắng Ngà Da Mềm', 2, 3790000);
INSERT INTO orders (id, code, customer_name, phone, address, note, total, status, voucher_code, discount, created_at)
VALUES (164, 'ONE-3C3C200A', 'Phan Thanh Bình', '0944567890', '47 Trương Định, Quận 1, TP.HCM', '[Hình thức: COD]', 7380000, 'completed', NULL, 0, '2026-10-29T02:20:37.235Z');
INSERT INTO order_items (order_id, product_id, product_name, size, color, quantity, unit_price)
VALUES (164, 136, 'Asics Gel-Nimbus 26 PureGEL', '40', 'Xanh Biển Phối Trắng', 1, 4190000);
INSERT INTO order_items (order_id, product_id, product_name, size, color, quantity, unit_price)
VALUES (164, 105, 'Nike Dunk Low Retro Panda', '39', 'Trắng Đen (Panda)', 1, 3190000);
INSERT INTO orders (id, code, customer_name, phone, address, note, total, status, voucher_code, discount, created_at)
VALUES (165, 'ONE-FADF48E9', 'Hoàng Văn Hùng', '0967890123', 'Đại Lộ Bình Dương, Thuận An, Bình Dương', '[Hình thức: COD]', 5890000, 'completed', NULL, 0, '2026-10-31T09:05:27.407Z');
INSERT INTO order_items (order_id, product_id, product_name, size, color, quantity, unit_price)
VALUES (165, 102, 'Nike ZoomX Vaporfly 3', '40', 'Hồng Neon Bạc', 1, 5890000);
INSERT INTO orders (id, code, customer_name, phone, address, note, total, status, voucher_code, discount, created_at)
VALUES (166, 'ONE-FCB51AA7', 'Lê Thanh Tùng', '0988654321', 'Số 45 Trần Phú, Phường Hải Châu 1, Hải Châu, Đà Nẵng', '[Hình thức: COD]', 3990000, 'confirmed', NULL, 0, '2026-11-01T05:36:46.203Z');
INSERT INTO order_items (order_id, product_id, product_name, size, color, quantity, unit_price)
VALUES (166, 135, 'Salomon Speedverse PRG', '41', 'Trắng Ngà Phối Xám', 1, 3990000);
INSERT INTO orders (id, code, customer_name, phone, address, note, total, status, voucher_code, discount, created_at)
VALUES (167, 'ONE-B0C9D01F', 'Phan Bảo Châu', '0909123456', 'Khu Phố 6, Phường Tam Hiệp, Biên Hòa, Đồng Nai', '[Hình thức: COD]', 4190000, 'shipping', NULL, 0, '2026-11-01T07:58:39.186Z');
INSERT INTO order_items (order_id, product_id, product_name, size, color, quantity, unit_price)
VALUES (167, 136, 'Asics Gel-Nimbus 26 PureGEL', '40', 'Đen Platinum', 1, 4190000);
INSERT INTO orders (id, code, customer_name, phone, address, note, total, status, voucher_code, discount, created_at)
VALUES (168, 'ONE-7C1E159D', 'Đinh Trọng Thắng', '0965789012', '102 Nguyễn Trãi, TP. Thanh Hóa', '[Hình thức: COD]', 1990000, 'shipping', NULL, 0, '2026-11-01T08:30:09.228Z');
INSERT INTO order_items (order_id, product_id, product_name, size, color, quantity, unit_price)
VALUES (168, 123, 'Puma Suede Classic XXI', '44', 'Đỏ Sọc Trắng', 1, 1990000);
INSERT INTO orders (id, code, customer_name, phone, address, note, total, status, voucher_code, discount, created_at)
VALUES (169, 'ONE-FA34FE85', 'Lê Thanh Tùng', '0988654321', 'Số 45 Trần Phú, Phường Hải Châu 1, Hải Châu, Đà Nẵng', '[Hình thức: COD]', 7002000, 'shipping', 'ONE10', 778000, '2026-11-01T09:12:56.743Z');
INSERT INTO order_items (order_id, product_id, product_name, size, color, quantity, unit_price)
VALUES (169, 132, 'Salomon Pulsar Trail Pro', '41', 'Đỏ Cam Hoàng Hôn', 2, 3890000);
INSERT INTO orders (id, code, customer_name, phone, address, note, total, status, voucher_code, discount, created_at)
VALUES (170, 'ONE-8CD3C237', 'Nguyễn Kiều Oanh', '0926345678', '71 Cách Mạng Tháng 8, TP. Cà Mau', '[Hình thức: COD]', 4190000, 'completed', NULL, 0, '2026-11-01T09:53:56.879Z');
INSERT INTO order_items (order_id, product_id, product_name, size, color, quantity, unit_price)
VALUES (170, 111, 'Adidas Ultraboost Light', '41', 'Trắng Phối Đỏ Cam', 1, 4190000);
INSERT INTO orders (id, code, customer_name, phone, address, note, total, status, voucher_code, discount, created_at)
VALUES (171, 'ONE-2675389D', 'Dương Thu Trang', '0978901234', '56 Đồng Khởi, Biên Hòa, Đồng Nai', '[Hình thức: COD]', 4990000, 'confirmed', NULL, 0, '2026-11-01T11:30:51.145Z');
INSERT INTO order_items (order_id, product_id, product_name, size, color, quantity, unit_price)
VALUES (171, 130, 'Salomon ACS Pro Advanced Metal', '44', 'Kim Loại Bạc Trắng', 1, 4990000);
INSERT INTO orders (id, code, customer_name, phone, address, note, total, status, voucher_code, discount, created_at)
VALUES (172, 'ONE-F41C7263', 'Phạm Thành Lương', '0999012345', '18 Hàng Bạc, Hoàn Kiếm, Hà Nội', '[Hình thức: COD]', 2490000, 'shipping', NULL, 0, '2026-11-02T04:20:24.366Z');
INSERT INTO order_items (order_id, product_id, product_name, size, color, quantity, unit_price)
VALUES (172, 156, 'Mizuno Contender Retro Sport', '41', 'Xanh Navy Trắng', 1, 2490000);
INSERT INTO orders (id, code, customer_name, phone, address, note, total, status, voucher_code, discount, created_at)
VALUES (173, 'ONE-BDB02D6C', 'Dương Thu Trang', '0978901234', '56 Đồng Khởi, Biên Hòa, Đồng Nai', '[Hình thức: COD]', 3990000, 'completed', NULL, 0, '2026-11-02T05:57:25.513Z');
INSERT INTO order_items (order_id, product_id, product_name, size, color, quantity, unit_price)
VALUES (173, 135, 'Salomon Speedverse PRG', '40', 'Trắng Ngà Phối Xám', 1, 3990000);
INSERT INTO orders (id, code, customer_name, phone, address, note, total, status, voucher_code, discount, created_at)
VALUES (174, 'ONE-1D2A94C2', 'Nguyễn Hoàng Nam', '0903124567', '254/12 Lê Văn Sỹ, Phường 14, Quận 3, TP.HCM', '[Hình thức: COD]', 3440000, 'shipping', 'ONE50', 50000, '2026-11-02T09:26:19.367Z');
INSERT INTO order_items (order_id, product_id, product_name, size, color, quantity, unit_price)
VALUES (174, 101, 'Nike Air Zoom Pegasus 41', '43', 'Đen Bạc', 1, 3490000);
INSERT INTO orders (id, code, customer_name, phone, address, note, total, status, voucher_code, discount, created_at)
VALUES (175, 'ONE-8D32796F', 'Tôn Nữ Diệu Thảo', '0935456789', '82 Nguyễn Thái Học, TP. Rạch Giá, Kiên Giang', '[Hình thức: COD]', 3590000, 'pending', NULL, 0, '2026-11-02T11:52:02.467Z');
INSERT INTO order_items (order_id, product_id, product_name, size, color, quantity, unit_price)
VALUES (175, 120, 'New Balance FuelCell Rebel v4', '44', 'Trắng Phối Đỏ Neon', 1, 3590000);
