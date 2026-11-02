CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  price INTEGER NOT NULL CHECK(price >= 0),
  compare_at_price INTEGER CHECK(compare_at_price >= 0),
  stock INTEGER NOT NULL DEFAULT 0 CHECK(stock >= 0),
  sizes TEXT NOT NULL DEFAULT '["S","M","L","XL"]',
  colors TEXT NOT NULL DEFAULT '["Đen","Trắng"]',
  image_key TEXT,
  featured INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT NOT NULL UNIQUE,
  customer_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT NOT NULL,
  note TEXT NOT NULL DEFAULT '',
  total INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS order_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL REFERENCES orders(id),
  product_id INTEGER NOT NULL REFERENCES products(id),
  product_name TEXT NOT NULL,
  size TEXT NOT NULL,
  color TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price INTEGER NOT NULL
);
INSERT OR IGNORE INTO products(name,slug,category,description,price,compare_at_price,stock,sizes,colors,featured) VALUES
('Nike Air Zoom Pegasus 40','nike-air-zoom-pegasus-40','Running','Huyền thoại giày chạy bộ hàng ngày của Nike với đệm bọt React và 2 túi khí Zoom Air êm ái, trợ lực tối đa trên từng dặm chạy.',3290000,3890000,25,'["39","40","41","42","43","44"]','["Trắng Phối Đỏ","Đen Bạc"]',1),
('Adidas Samba OG Classic','adidas-samba-og-classic','Lifestyle','Biểu tượng thời trang đường phố Terrace retro kinh điển từ Đức, da mũi chữ T bằng da lộn cao cấp, phối đồ cực chuẩn.',2790000,3190000,30,'["39","40","41","42","43"]','["Trắng Sọc Đen","Đen Sọc Trắng"]',1),
('Asics Gel-Nimbus 26','asics-gel-nimbus-26','Running','Đỉnh cao công nghệ PureGEL và bọt FF BLAST+ ECO bảo vệ khớp gối, siêu êm và phom chuẩn nhất cho bàn chân Á Đông.',4190000,4590000,18,'["40","41","42","43","44","45"]','["Xanh Biển","Đen Platinum"]',1),
('New Balance 550 White Grey','new-balance-550-white-grey','Lifestyle','Phong cách bóng rổ cổ điển thập niên 80, thiết kế dad shoes thanh lịch, chất da cao cấp đệm êm bền bỉ.',2990000,3590000,20,'["39","40","41","42","43","44"]','["Trắng Xám","Trắng Xanh Navy"]',1),
('Salomon XT-6 Gorpcore','salomon-xt-6-gorpcore','Outdoor','Ngôi sao dẫn đầu trào lưu Gorpcore thời thượng, đệm ACS ổn định địa hình, đế Mud Contagrip và dây Quicklace.',4690000,5200000,15,'["40","41","42","43","44"]','["Đen Carbon","Trắng Be"]',1),
('Li-Ning Feidian 3.0 Elite','li-ning-feidian-3-elite','Running','Vũ khí marathon đỉnh cao với đĩa đệm Carbon nguyên khối uốn cong cùng bọt BOOM siêu nhẹ và đàn hồi vượt trội.',3890000,4390000,14,'["39","40","41","42","43"]','["Trắng Cam","Xanh Neon"]',1);
CREATE TRIGGER IF NOT EXISTS prevent_negative_stock BEFORE UPDATE OF stock ON products
WHEN NEW.stock < 0 BEGIN SELECT RAISE(ABORT, 'Insufficient stock'); END;
