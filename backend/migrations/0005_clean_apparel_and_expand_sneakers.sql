-- 0005_clean_apparel_and_expand_sneakers.sql
-- Xóa toàn bộ dữ liệu quần áo, thời trang cũ
DELETE FROM order_items WHERE product_id IN (SELECT id FROM products WHERE category IN ('Áo', 'Quần', 'Áo khoác', 'Váy'));
DELETE FROM products WHERE category IN ('Áo', 'Quần', 'Áo khoác', 'Váy');

-- Bổ sung các mẫu sneaker chuẩn Âu - Á theo hồ sơ STORE_PROFILE
INSERT OR IGNORE INTO products (name, slug, category, description, price, compare_at_price, stock, sizes, colors, featured) VALUES
('Nike Dunk Low Retro White Black', 'nike-dunk-low-retro-panda', 'Lifestyle', 'Mẫu sneaker quốc dân phối màu Panda kinh điển, da trơn cao cấp, đệm êm linh hoạt dễ phối đồ dạo phố.', 3190000, 3690000, 28, '["39","40","41","42","43","44"]', '["Trắng Đen (Panda)"]', 1),
('Asics Gel-Kayano 30', 'asics-gel-kayano-30', 'Running', 'Vua của dòng giày ổn định và chống lật cổ chân với hệ thống 4D GUIDANCE SYSTEM và công nghệ PureGEL độc quyền.', 4290000, 4890000, 16, '["40","41","42","43","44","45"]', '["Xám Bạc","Đen Trắng"]', 1),
('Onitsuka Tiger Mexico 66', 'onitsuka-tiger-mexico-66', 'Lifestyle', 'Huyền thoại sọc hổ hoài cổ xứ Phù Tang, chất liệu da mềm thanh mảnh, nhẹ nhàng và tinh tế trên từng bước đi.', 2890000, 3390000, 22, '["38","39","40","41","42","43"]', '["Trắng Sọc Xanh Đỏ","Vàng Kill Bill"]', 1),
('Mizuno Wave Rider 27', 'mizuno-wave-rider-27', 'Running', 'Đĩa đệm cơ học Wave độc quyền từ Nhật Bản, đệm bọt MIZUNO ENERZY siêu nảy, bền bỉ vượt thời gian.', 3490000, 3990000, 18, '["39","40","41","42","43","44"]', '["Xanh Navy","Trắng Xám"]', 1),
('Puma Palermo Leather', 'puma-palermo-leather', 'Lifestyle', 'Phong cách bóng đá Terrace kinh điển nước Đức, đế gum retro bền bỉ cùng tag da vàng kim sang trọng.', 2490000, 2890000, 25, '["39","40","41","42","43"]', '["Xanh Cốm Trắng","Hồng Pastel"]', 1),
('Anta KT8 Shock The Game', 'anta-kt8-shock-the-game', 'Basketball', 'Giày bóng rổ thi đấu đỉnh cao của Klay Thompson, công nghệ đệm NitroEdge nảy cực nhạy, bám sân tuyệt đối.', 2690000, 3190000, 15, '["40","41","42","43","44"]', '["Xanh Tím Neon","Trắng Vàng"]', 1);
