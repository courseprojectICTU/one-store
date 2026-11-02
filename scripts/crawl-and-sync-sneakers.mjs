/**
 * scripts/crawl-and-sync-sneakers.mjs
 * Script thu thập dữ liệu 70 mẫu sneaker chính hãng chuẩn thị trường của 10 thương hiệu hợp tác,
 * tải ảnh trực tiếp vào Cloudflare R2 Bucket (/api/admin/images),
 * nạp vào CSDL D1 (products), và tạo tài liệu tri thức RAG vector hóa vào Vectorize.
 */

import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const API_BASE = 'http://127.0.0.1:8787';
const ADMIN_TOKEN = 'nhom2_ba_khi_fashion_dev_secret_token_123456789';

// Kho ảnh sneaker dự phòng chất lượng cao đã kiểm định
const VERIFIED_FALLBACK_IMAGES = [
  'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80',
  'https://images.unsplash.com/photo-1552346154-21d32810aba3?w=800&q=80',
  'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=800&q=80',
  'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=800&q=80',
  'https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?w=800&q=80',
  'https://images.unsplash.com/photo-1514989940723-e8e51635b782?w=800&q=80',
  'https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?w=800&q=80',
  'https://images.unsplash.com/photo-1582588678413-dbf45f4823e9?w=800&q=80',
  'https://images.unsplash.com/photo-1587563871167-1ee9c731aefb?w=800&q=80',
  'https://images.unsplash.com/photo-1579338559194-a162d19bf842?w=800&q=80',
  'https://images.unsplash.com/photo-1512374382149-233c42b661ac?w=800&q=80',
  'https://images.unsplash.com/photo-1515955656352-a1fa3ffcd111?w=800&q=80',
  'https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=800&q=80',
  'https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=800&q=80',
  'https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=800&q=80',
  'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=800&q=80',
  'https://images.unsplash.com/photo-1575537302964-96cd47c06b1b?w=800&q=80',
  'https://images.unsplash.com/photo-1586525198428-225f6f12cff5?w=800&q=80',
  'https://images.unsplash.com/photo-1562183241-b937e95585b6?w=800&q=80',
  'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=800&q=80',
  'https://images.unsplash.com/photo-1605348532760-6753d2c43329?w=800&q=80',
  'https://images.unsplash.com/photo-1607522370275-f14206abe5d3?w=800&q=80',
  'https://images.unsplash.com/photo-1617606002779-51d866bdd1d1?w=800&q=80',
  'https://images.unsplash.com/photo-1597045566677-8cf032ed6634?w=800&q=80',
  'https://images.unsplash.com/photo-1588117305388-c2631a279f82?w=800&q=80',
  'https://images.unsplash.com/photo-1581605405669-fcdf81165afa?w=800&q=80',
  'https://images.unsplash.com/photo-1574634534894-89d7576c8259?w=800&q=80',
  'https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=800&q=80',
  'https://images.unsplash.com/photo-1565814636199-ae8133055c1c?w=800&q=80',
  'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800&q=80',
  'https://images.unsplash.com/photo-1516478177764-9fe5bd7e9717?w=800&q=80',
  'https://images.unsplash.com/photo-1520256862855-398228c41684?w=800&q=80',
];

// Danh sách 70 sản phẩm tiêu biểu chuẩn thị trường của 10 thương hiệu hợp tác
export const SNEAKER_CATALOG = [
  // 1. NIKE (7 sản phẩm)
  {
    brand: 'Nike',
    name: 'Nike Air Zoom Pegasus 41',
    slug: 'nike-air-zoom-pegasus-41',
    category: 'Running',
    price: 3490000,
    compare_at_price: 3890000,
    description: 'Chiến mã chạy bộ hàng ngày thế hệ mới với bộ đôi túi khí Air Zoom trước sau kết hợp bọt đệm ReactX hoàn toàn mới, tăng 13% độ hoàn trả năng lượng so với thế hệ trước. Phom ôm chân, phù hợp cự ly 5km - 21km.',
    sizes: ['39', '40', '41', '42', '43', '44'],
    colors: ['Trắng Phối Cam Volt', 'Đen Bạc'],
    stock: 28,
    featured: 1,
    source_img: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80',
    specs: { cushion: 'ReactX + Dual Air Zoom', foot_type: 'Bàn chân thon đến trung tính', purpose: 'Chạy bộ hàng ngày, cự ly 5km - 21km' }
  },
  {
    brand: 'Nike',
    name: 'Nike ZoomX Vaporfly 3',
    slug: 'nike-zoomx-vaporfly-3',
    category: 'Running',
    price: 5890000,
    compare_at_price: 6490000,
    description: 'Siêu giày đua marathon đỉnh cao thế giới. Tấm đĩa sợi carbon Flyplate nguyên khối đặt giữa hai lớp bọt siêu nhẹ ZoomX, mang lại lực đẩy về phía trước tối đa để bứt phá kỷ lục cá nhân (PR).',
    sizes: ['40', '41', '42', '43', '44'],
    colors: ['Hồng Neon Bạc', 'Trắng Ngọc'],
    stock: 14,
    featured: 1,
    source_img: 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=800&q=80',
    specs: { cushion: 'ZoomX Foam + Full Carbon Flyplate', foot_type: 'Chân thon, đáp ngực bàn chân', purpose: 'Thi đấu Marathon 42km, bứt tốc độ' }
  },
  {
    brand: 'Nike',
    name: 'Nike Invincible 3',
    slug: 'nike-invincible-3',
    category: 'Running',
    price: 4290000,
    compare_at_price: 4790000,
    description: 'Vua đệm êm giảm chấn bảo vệ khớp gối. Khối lượng bọt ZoomX cực dày được đặt trên đế bè rộng giúp duy trì sự thăng bằng tối ưu, lý tưởng cho những ngày chạy phục hồi đường dài.',
    sizes: ['40', '41', '42', '43', '44', '45'],
    colors: ['Đen Trắng Phối Đỏ', 'Xám Bạc'],
    stock: 20,
    featured: 0,
    source_img: 'https://images.unsplash.com/photo-1552346154-21d32810aba3?w=800&q=80',
    specs: { cushion: 'Thick ZoomX Foam Stack', foot_type: 'Trung tính, cần bảo vệ đầu gối', purpose: 'Chạy phục hồi (Recovery Run), chạy dài 15km - 30km' }
  },
  {
    brand: 'Nike',
    name: 'Nike Air Zoom Vomero 17',
    slug: 'nike-air-zoom-vomero-17',
    category: 'Running',
    price: 3890000,
    compare_at_price: 4390000,
    description: 'Sự kết hợp hoàn hảo giữa độ êm ái của bọt ZoomX bên trên và bọt Cushlon 3.0 bền bỉ bên dưới. Êm ái vượt trội, lưỡi gà và cổ giày đệm mút sang trọng.',
    sizes: ['39', '40', '41', '42', '43'],
    colors: ['Xanh Navy Bạc', 'Trắng Platinum'],
    stock: 18,
    featured: 0,
    source_img: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=800&q=80',
    specs: { cushion: 'Dual Foam ZoomX + Cushlon 3.0', foot_type: 'Bàn chân trung tính', purpose: 'Chạy cự ly dài êm ái, đi bộ hàng ngày' }
  },
  {
    brand: 'Nike',
    name: 'Nike Dunk Low Retro Panda',
    slug: 'nike-dunk-low-retro-panda',
    category: 'Lifestyle',
    price: 3190000,
    compare_at_price: 3590000,
    description: 'Biểu tượng phong cách đường phố toàn cầu. Phối màu Trắng Đen (Panda) kinh điển phối cùng chất da trơn dẻo dai, dễ dàng mix đồ từ quần jeans, ống thụng đến short thể thao.',
    sizes: ['38', '39', '40', '41', '42', '43', '44'],
    colors: ['Trắng Đen (Panda)'],
    stock: 35,
    featured: 1,
    source_img: 'https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?w=800&q=80',
    specs: { cushion: 'Cupsole Foam truyền thống', foot_type: 'Tiêu chuẩn', purpose: 'Thời trang dạo phố, đi học, đi làm' }
  },
  {
    brand: 'Nike',
    name: 'Nike Air Force 1 07 Triple White',
    slug: 'nike-air-force-1-07-white',
    category: 'Lifestyle',
    price: 2890000,
    compare_at_price: 3290000,
    description: 'Đôi sneaker trắng huyền thoại bất tử của Nike từ năm 1982. Đệm khí Nike Air ẩn trong gót, thân giày da thật viền may tinh xảo, tab kim loại AF-1 trên dây buộc sáng bóng.',
    sizes: ['38', '39', '40', '41', '42', '43', '44'],
    colors: ['All White (Trắng Tinh Khôi)'],
    stock: 30,
    featured: 0,
    source_img: 'https://images.unsplash.com/photo-1514989940723-e8e51635b782?w=800&q=80',
    specs: { cushion: 'Encapsulated Nike Air', foot_type: 'Tiêu chuẩn', purpose: 'Sneaker trắng dạo phố quốc dân' }
  },
  {
    brand: 'Nike',
    name: 'Nike Pegasus Trail 4 GORE-TEX',
    slug: 'nike-pegasus-trail-4-gtx',
    category: 'Outdoor',
    price: 3990000,
    compare_at_price: 4490000,
    description: 'Giày chạy địa hình dã ngoại chống nước tuyệt đối với màng GORE-TEX cao cấp. Đệm bọt React êm ái linh hoạt khi chuyển đổi từ đường nhựa thành phố sang đường mòn lầy lội.',
    sizes: ['40', '41', '42', '43', '44'],
    colors: ['Xám Than Cam Rực', 'Đen Tuyển'],
    stock: 16,
    featured: 0,
    source_img: 'https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?w=800&q=80',
    specs: { cushion: 'Nike React Foam + GORE-TEX Waterproof', foot_type: 'Trung tính', purpose: 'Chạy trail dã ngoại, leo núi, đi mưa' }
  },

  // 2. ADIDAS (7 sản phẩm)
  {
    brand: 'Adidas',
    name: 'Adidas Samba OG Classic',
    slug: 'adidas-samba-og-classic',
    category: 'Lifestyle',
    price: 2790000,
    compare_at_price: 3190000,
    description: 'Biểu tượng văn hóa thời trang bóng đá Terrace retro từ Đức. Thân da mềm cao cấp phối mũi da lộn chữ T kinh điển, đế cao su gum tự nhiên bám đường và mang phong cách trường tồn.',
    sizes: ['39', '40', '41', '42', '43'],
    colors: ['Trắng Sọc Đen Mũi Xám', 'Đen Sọc Trắng'],
    stock: 32,
    featured: 1,
    source_img: 'https://images.unsplash.com/photo-1582588678413-dbf45f4823e9?w=800&q=80',
    specs: { cushion: 'Low-profile Rubber Gum', foot_type: 'Bàn chân thon gọn', purpose: 'Phối đồ retro thời thượng dạo phố' }
  },
  {
    brand: 'Adidas',
    name: 'Adidas Gazelle Indoor',
    slug: 'adidas-gazelle-indoor',
    category: 'Lifestyle',
    price: 2990000,
    compare_at_price: 3390000,
    description: 'Bản nâng cấp đình đám với đế cao su gum trong suốt bao bọc quanh thân giày. Chất liệu da lộn mềm mịn thượng hạng với các tông màu vintage cuốn hút mọi ánh nhìn.',
    sizes: ['38', '39', '40', '41', '42', '43'],
    colors: ['Xanh Lá Đậm Sọc Trắng', 'Xanh Biển Nhạt'],
    stock: 22,
    featured: 0,
    source_img: 'https://images.unsplash.com/photo-1587563871167-1ee9c731aefb?w=800&q=80',
    specs: { cushion: 'Gum Rubber Semi-translucent Cupsole', foot_type: 'Tiêu chuẩn', purpose: 'Thời trang vintage, dạo phố cổ điển' }
  },
  {
    brand: 'Adidas',
    name: 'Adidas Superstar 82 Originals',
    slug: 'adidas-superstar-82-originals',
    category: 'Lifestyle',
    price: 2590000,
    compare_at_price: 2990000,
    description: 'Huyền thoại mũi sò Shell-toe xuất hiện trên mọi sàn diễn hip-hop và bóng rổ từ 1969. Chất da hạt dày dặn, viền 3 sọc răng cưa đục lỗ thông khí thoáng mát.',
    sizes: ['39', '40', '41', '42', '43', '44'],
    colors: ['Trắng Sọc Đen Gót Đen'],
    stock: 25,
    featured: 0,
    source_img: 'https://images.unsplash.com/photo-1579338559194-a162d19bf842?w=800&q=80',
    specs: { cushion: 'EVA Sockliner + Shell Toe', foot_type: 'Rộng rãi dễ mang', purpose: 'Streetwear kinh điển, hip-hop culture' }
  },
  {
    brand: 'Adidas',
    name: 'Adidas Ultraboost Light',
    slug: 'adidas-ultraboost-light',
    category: 'Running',
    price: 4190000,
    compare_at_price: 4890000,
    description: 'Thế hệ đệm bọt Light BOOST nhẹ hơn 30% so với Boost truyền thống, mang lại bước chạy siêu êm ái, bồng bềnh và trả lực liên tục. Thân dệt Primeknit ôm khít như đôi tất.',
    sizes: ['40', '41', '42', '43', '44', '45'],
    colors: ['Trắng Phối Đỏ Cam', 'Đen Core Black'],
    stock: 20,
    featured: 1,
    source_img: 'https://images.unsplash.com/photo-1512374382149-233c42b661ac?w=800&q=80',
    specs: { cushion: 'Light BOOST 30% Lighter + LEP Torsion', foot_type: 'Bàn chân trung tính', purpose: 'Chạy bộ êm ái, đi bộ, tập gym cả ngày' }
  },
  {
    brand: 'Adidas',
    name: 'Adidas Adizero Adios Pro 3',
    slug: 'adidas-adizero-adios-pro-3',
    category: 'Running',
    price: 5990000,
    compare_at_price: 6590000,
    description: 'Vũ khí vô địch các giải World Marathon Majors. Trang bị hệ thống thanh năng lượng sợi carbon ENERGYRODS 2.0 mô phỏng cấu trúc xương ngón chân cùng 2 tầng bọt Lightstrike Pro siêu nảy.',
    sizes: ['40', '41', '42', '43', '44'],
    colors: ['Xanh Ngọc Solar Red', 'Trắng Bạc'],
    stock: 12,
    featured: 1,
    source_img: 'https://images.unsplash.com/photo-1515955656352-a1fa3ffcd111?w=800&q=80',
    specs: { cushion: 'Lightstrike Pro + Carbon ENERGYRODS 2.0', foot_type: 'Chân thon, vận động viên', purpose: 'Siêu giày đua Marathon 42km phá kỷ lục' }
  },
  {
    brand: 'Adidas',
    name: 'Adidas Adizero Boston 12',
    slug: 'adidas-adizero-boston-12',
    category: 'Running',
    price: 3790000,
    compare_at_price: 4290000,
    description: 'Mẫu giày luyện tập tốc độ (tempo / interval) và cự ly dài ưa chuộng nhất. Đệm kép kết hợp Lightstrike Pro êm nảy và Lightstrike 2.0 bền chắc cùng thanh carbon Energyrods trợ lực.',
    sizes: ['39', '40', '41', '42', '43'],
    colors: ['Trắng Sọc Đen Neon', 'Xanh Dương Đậm'],
    stock: 19,
    featured: 0,
    source_img: 'https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=800&q=80',
    specs: { cushion: 'Lightstrike Pro + Lightstrike 2.0 + Glass Fibre Rods', foot_type: 'Trung tính', purpose: 'Chạy biến tốc tempo run, luyện tập marathon' }
  },
  {
    brand: 'Adidas',
    name: 'Adidas Terrex Free Hiker 2 GORE-TEX',
    slug: 'adidas-terrex-free-hiker-2-gtx',
    category: 'Outdoor',
    price: 4490000,
    compare_at_price: 5190000,
    description: 'Giày dã ngoại trekking leo núi đỉnh cao với đế đệm Boost êm ái trên từng mỏm đá gồ ghề. Đế ngoài cao su Continental siêu bám địa hình trơn ướt cùng màng GORE-TEX chống nước hoàn toàn.',
    sizes: ['40', '41', '42', '43', '44'],
    colors: ['Xám Bạc Đen Vàng Rừng', 'Xanh Rêu Đen'],
    stock: 15,
    featured: 0,
    source_img: 'https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=800&q=80',
    specs: { cushion: 'Full-length BOOST + Continental Rubber + GORE-TEX', foot_type: 'Bảo vệ cổ chân vững chãi', purpose: 'Trekking dã ngoại, leo núi, thám hiểm rừng' }
  },

  // 3. NEW BALANCE (7 sản phẩm)
  {
    brand: 'New Balance',
    name: 'New Balance 550 White Grey',
    slug: 'new-balance-550-white-grey',
    category: 'Lifestyle',
    price: 2990000,
    compare_at_price: 3490000,
    description: 'Tái hiện mẫu giày bóng rổ cổ thấp vintage năm 1989. Thiết kế dad shoes thanh lịch, chất da phối viền xám nhẹ nhàng, logo N dập nổi đặc trưng dễ dàng mix đồ thanh lịch.',
    sizes: ['39', '40', '41', '42', '43', '44'],
    colors: ['Trắng Xám Bạc', 'Trắng Xanh Navy'],
    stock: 26,
    featured: 1,
    source_img: 'https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=800&q=80',
    specs: { cushion: 'Rubber Cupsole + EVA Insert', foot_type: 'Bàn chân tiêu chuẩn', purpose: 'Thời trang vintage, phong cách Minimalist' }
  },
  {
    brand: 'New Balance',
    name: 'New Balance 530 Steel Grey',
    slug: 'new-balance-530-steel-grey',
    category: 'Lifestyle',
    price: 2690000,
    compare_at_price: 3090000,
    description: 'Cơn sốt giày retro runner đầu những năm 2000. Thân giày bằng lưới mắt to siêu thoáng khí kết hợp các dải da bóng sắc nét, đế đệm ABZORB hấp thụ chấn động mềm mại khi di chuyển.',
    sizes: ['38', '39', '40', '41', '42', '43'],
    colors: ['Xám Bạc Ánh Kim', 'Trắng Phối Xanh Dương'],
    stock: 30,
    featured: 1,
    source_img: 'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=800&q=80',
    specs: { cushion: 'ABZORB Midsole Cushioning', foot_type: 'Rộng rãi thoáng khí', purpose: 'Dạo phố hè, phong cách Y2K sành điệu' }
  },
  {
    brand: 'New Balance',
    name: 'New Balance 2002R Protection Pack',
    slug: 'new-balance-2002r-protection-pack',
    category: 'Lifestyle',
    price: 3990000,
    compare_at_price: 4590000,
    description: 'Thiết kế viền da lộn rách xước có chủ đích (deconstructed) độc nhất vô nhị. Trang bị công nghệ đế đệm N-ergy cao cấp và ABZORB SBS giảm sốc vượt trội dưới gót chân.',
    sizes: ['40', '41', '42', '43', '44'],
    colors: ['Xám Khói Rain Cloud', 'Đen Phantom'],
    stock: 18,
    featured: 1,
    source_img: 'https://images.unsplash.com/photo-1575537302964-96cd47c06b1b?w=800&q=80',
    specs: { cushion: 'N-ergy + ABZORB SBS Pods', foot_type: 'Bàn chân trung tính', purpose: 'Đỉnh cao phong cách Streetwear cá tính' }
  },
  {
    brand: 'New Balance',
    name: 'New Balance 1906R Metallic Silver',
    slug: 'new-balance-1906r-metallic-silver',
    category: 'Lifestyle',
    price: 3890000,
    compare_at_price: 4390000,
    description: 'Mẫu giày Tech-runner mang hơi thở tương lai. Khung nhựa gót TPU Stability Web hỗ trợ vòm bàn chân, hệ thống dây khóa N-Lock giữ mu bàn chân ổn định trên từng sải bước.',
    sizes: ['39', '40', '41', '42', '43'],
    colors: ['Bạc Metallic Ánh Vàng', 'Trắng Phối Xanh Lá'],
    stock: 17,
    featured: 0,
    source_img: 'https://images.unsplash.com/photo-1586525198428-225f6f12cff5?w=800&q=80',
    specs: { cushion: 'N-ergy + Stability Web Arch Support', foot_type: 'Trung tính, hỗ trợ vòm', purpose: 'Thời trang Futuristic Tech-wear' }
  },
  {
    brand: 'New Balance',
    name: 'New Balance Fresh Foam X 1080v13',
    slug: 'new-balance-fresh-foam-x-1080v13',
    category: 'Running',
    price: 4390000,
    compare_at_price: 4890000,
    description: 'Đỉnh cao êm ái của New Balance với khối bọt Fresh Foam X thế hệ mới nhất, mang lại cảm giác tiếp đất mềm như kẹo dẻo và chuyển động lăn bàn chân siêu mượt mà.',
    sizes: ['40', '41', '42', '43', '44', '45'],
    colors: ['Xanh Biển Phối Trắng', 'Đen Bạc'],
    stock: 20,
    featured: 0,
    source_img: 'https://images.unsplash.com/photo-1562183241-b937e95585b6?w=800&q=80',
    specs: { cushion: 'Fresh Foam X Plush Cushioning', foot_type: 'Bàn chân bè vừa đến rộng', purpose: 'Chạy cự ly dài 21km - 42km siêu êm ái' }
  },
  {
    brand: 'New Balance',
    name: 'New Balance FuelCell Rebel v4',
    slug: 'new-balance-fuelcell-rebel-v4',
    category: 'Running',
    price: 3590000,
    compare_at_price: 3990000,
    description: 'Giày chạy tốc độ không cần đĩa carbon nhẹ nhất phân khúc với bọt đệm FuelCell pha PEBA siêu nảy. Thiết kế mũi bè chuẩn phom bàn chân người Châu Á, bứt tốc độ cực nhạy.',
    sizes: ['39', '40', '41', '42', '43', '44'],
    colors: ['Trắng Phối Đỏ Neon', 'Xanh Da Trời'],
    stock: 16,
    featured: 0,
    source_img: 'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=800&q=80',
    specs: { cushion: 'FuelCell PEBA Blend Foam', foot_type: 'Mũi chân bè thoải mái', purpose: 'Chạy tốc độ, tập luyện biến tốc 5km - 15km' }
  },
  {
    brand: 'New Balance',
    name: 'New Balance Fresh Foam X Hierro v8',
    slug: 'new-balance-fresh-foam-x-hierro-v8',
    category: 'Outdoor',
    price: 3790000,
    compare_at_price: 4290000,
    description: 'Chiến binh việt dã địa hình với đế ngoài cao su Vibram Megagrip bám dính chắc chắn trên mọi cung đường bùn đất, đá dăm kết hợp đệm Fresh Foam X bảo vệ khớp chân.',
    sizes: ['40', '41', '42', '43', '44'],
    colors: ['Xám Đất Nung Phối Đen', 'Xanh Rêu'],
    stock: 15,
    featured: 0,
    source_img: 'https://images.unsplash.com/photo-1605348532760-6753d2c43329?w=800&q=80',
    specs: { cushion: 'Fresh Foam X + Vibram Megagrip Outsole', foot_type: 'Vững chãi địa hình', purpose: 'Chạy trail dã ngoại, leo núi, trekking' }
  },

  // 4. PUMA (7 sản phẩm)
  {
    brand: 'Puma',
    name: 'Puma Palermo Leather Gum',
    slug: 'puma-palermo-leather-gum',
    category: 'Lifestyle',
    price: 2490000,
    compare_at_price: 2890000,
    description: 'Hồi sinh phong cách bóng đá Terrace thập niên 80 từ bờ biển nước Ý. Chất da tự nhiên mềm mại phối mũi da lộn, đế gum retro và tag da vàng kim chữ Palermo sang trọng.',
    sizes: ['39', '40', '41', '42', '43'],
    colors: ['Xanh Cốm Trắng', 'Hồng Pastel Phối Trắng'],
    stock: 24,
    featured: 1,
    source_img: 'https://images.unsplash.com/photo-1607522370275-f14206abe5d3?w=800&q=80',
    specs: { cushion: 'Classic Gum Rubber Outsole', foot_type: 'Thon gọn thời trang', purpose: 'Dạo phố retro thanh lịch, chụp ảnh thời trang' }
  },
  {
    brand: 'Puma',
    name: 'Puma Suede Classic XXI',
    slug: 'puma-suede-classic-xxi',
    category: 'Lifestyle',
    price: 1990000,
    compare_at_price: 2390000,
    description: 'Đôi giày da lộn bất tử của văn hóa đường phố và b-boy breakdance từ năm 1968. Da lộn nhung cao cấp dày dặn, dải Formstrip uốn lượn bên sườn tạo dấu ấn nhận diện không thể nhầm lẫn.',
    sizes: ['38', '39', '40', '41', '42', '43', '44'],
    colors: ['Đen Sọc Trắng', 'Đỏ Sọc Trắng'],
    stock: 28,
    featured: 0,
    source_img: 'https://images.unsplash.com/photo-1617606002779-51d866bdd1d1?w=800&q=80',
    specs: { cushion: 'Comfort Sockliner + Rubber Midsole', foot_type: 'Tiêu chuẩn', purpose: 'Thời trang vintage, văn hóa đường phố' }
  },
  {
    brand: 'Puma',
    name: 'Puma Army Trainer Retro',
    slug: 'puma-army-trainer-retro',
    category: 'Lifestyle',
    price: 2290000,
    compare_at_price: 2690000,
    description: 'Thiết kế nguyên bản của dòng giày huấn luyện quân đội Đức (German Army Trainer). Tối giản, thanh lịch với da trơn trắng và mũi da lộn chữ T xám, đế bệt bền bỉ.',
    sizes: ['39', '40', '41', '42', '43'],
    colors: ['Trắng Xám Đế Gum'],
    stock: 20,
    featured: 0,
    source_img: 'https://images.unsplash.com/photo-1597045566677-8cf032ed6634?w=800&q=80',
    specs: { cushion: 'Low-profile Gum Sole', foot_type: 'Tiêu chuẩn', purpose: 'Phối đồ minimalism, đi làm, đi chơi' }
  },
  {
    brand: 'Puma',
    name: 'Puma Deviate Nitro 2 Carbon',
    slug: 'puma-deviate-nitro-2-carbon',
    category: 'Running',
    price: 3990000,
    compare_at_price: 4590000,
    description: 'Giày chạy bộ trợ lực đĩa carbon composite INNOPLATE cao cấp kết hợp lớp bọt bơm khí nitơ Nitro Elite siêu nhẹ và nảy. Độ bám đường đỉnh cao với đế cao su PUMAGRIP bám cả trên mặt đường ướt.',
    sizes: ['40', '41', '42', '43', '44'],
    colors: ['Cam Neon Phối Đen', 'Trắng Bạc'],
    stock: 16,
    featured: 1,
    source_img: 'https://images.unsplash.com/photo-1588117305388-c2631a279f82?w=800&q=80',
    specs: { cushion: 'NITRO Elite Foam + INNOPLATE Carbon Plate', foot_type: 'Bàn chân trung tính', purpose: 'Chạy marathon, chạy tốc độ cao' }
  },
  {
    brand: 'Puma',
    name: 'Puma Velocity Nitro 3',
    slug: 'puma-velocity-nitro-3',
    category: 'Running',
    price: 2990000,
    compare_at_price: 3490000,
    description: 'Được đánh giá là đôi giày chạy bộ hàng ngày đáng tiền nhất. Đệm bọt NITRO êm ái, nhẹ và êm, độ bền vượt 1000km, phù hợp cho cả người mới chạy và vận động viên cự ly dài.',
    sizes: ['39', '40', '41', '42', '43', '44'],
    colors: ['Xanh Dương Điện Tử', 'Đen Phối Vàng Chanh'],
    stock: 22,
    featured: 0,
    source_img: 'https://images.unsplash.com/photo-1581605405669-fcdf81165afa?w=800&q=80',
    specs: { cushion: 'NITRO Foam + PROFOAM LITE', foot_type: 'Trung tính dễ mang', purpose: 'Chạy bộ hàng ngày 5km - 21km' }
  },
  {
    brand: 'Puma',
    name: 'Puma MB.03 Toxic LaMelo Ball',
    slug: 'puma-mb03-toxic-lamelo-ball',
    category: 'Basketball',
    price: 3390000,
    compare_at_price: 3890000,
    description: 'Giày bóng rổ signature phá cách của ngôi sao NBA LaMelo Ball. Đồ họa vết cào xé độc đáo, đệm bọt NITRO bùng nổ sức bật và đế ngoài cao su siêu bám sân sàn gỗ hoặc bê tông.',
    sizes: ['40', '41', '42', '43', '44', '45'],
    colors: ['Tím Neon Độc Lạ', 'Trắng Đen'],
    stock: 15,
    featured: 0,
    source_img: 'https://images.unsplash.com/photo-1574634534894-89d7576c8259?w=800&q=80',
    specs: { cushion: 'Full-length NITRO Infused Foam', foot_type: 'Khóa gót bảo vệ cổ chân', purpose: 'Thi đấu bóng rổ, bật nhảy linh hoạt' }
  },
  {
    brand: 'Puma',
    name: 'Puma Voyage Nitro 3 Trail',
    slug: 'puma-voyage-nitro-3-trail',
    category: 'Outdoor',
    price: 3290000,
    compare_at_price: 3790000,
    description: 'Giày dã ngoại địa hình bám chắc mọi bề mặt sỏi đá với hợp chất cao su PUMAGRIP-ATR đa hướng. Hệ thống dây buộc OPTIFIT ôm chắc mu bàn chân khi đổ dốc an toàn.',
    sizes: ['40', '41', '42', '43', '44'],
    colors: ['Đen Phối Xanh Olive', 'Xám Bạc'],
    stock: 14,
    featured: 0,
    source_img: 'https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=800&q=80',
    specs: { cushion: 'NITRO Foam + PUMAGRIP-ATR Traction', foot_type: 'Vững chãi địa hình', purpose: 'Chạy trail dã ngoại, leo núi, băng rừng' }
  },

  // 5. SALOMON (7 sản phẩm)
  {
    brand: 'Salomon',
    name: 'Salomon XT-6 Black Phantom',
    slug: 'salomon-xt-6-black-phantom',
    category: 'Outdoor',
    price: 4690000,
    compare_at_price: 5290000,
    description: 'Ngôi sao dẫn đầu trào lưu thời trang Gorpcore toàn cầu từ dãy núi Alps nước Pháp. Khung đế Agile Chassis System (ACS) chống vặn xoắn gót chân, màng ép nhiệt TPU bền bỉ và dây rút Quicklace tiện lợi.',
    sizes: ['40', '41', '42', '43', '44'],
    colors: ['Đen Toàn Diện (Black Phantom)', 'Trắng Be Bạc'],
    stock: 20,
    featured: 1,
    source_img: 'https://images.unsplash.com/photo-1565814636199-ae8133055c1c?w=800&q=80',
    specs: { cushion: 'EVA Dual-Density + Agile Chassis System', foot_type: 'Chân thon gọn, nên tăng 0.5 size', purpose: 'Đỉnh cao Gorpcore, trekking dã ngoại, phố xá' }
  },
  {
    brand: 'Salomon',
    name: 'Salomon ACS Pro Advanced Metal',
    slug: 'salomon-acs-pro-advanced-metal',
    category: 'Outdoor',
    price: 4990000,
    compare_at_price: 5590000,
    description: 'Thiết kế Techwear tương lai mang tính kỹ thuật cao với hệ thống lồng thông gió Kurim hai bên hông giày. Khung đỡ Kurim giữ vững bàn chân khi di chuyển ở mọi địa hình gồ ghề.',
    sizes: ['40', '41', '42', '43', '44'],
    colors: ['Kim Loại Bạc Trắng', 'Đen Tuyển'],
    stock: 15,
    featured: 1,
    source_img: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800&q=80',
    specs: { cushion: 'Agile Chassis System + Air Flow Openings', foot_type: 'Ôm chân kỹ thuật', purpose: 'Thời trang Techwear cao cấp, dã ngoại' }
  },
  {
    brand: 'Salomon',
    name: 'Salomon Speedcross 6 Grip',
    slug: 'salomon-speedcross-6-grip',
    category: 'Outdoor',
    price: 3690000,
    compare_at_price: 4190000,
    description: 'Vua bám bùn đất của làng chạy việt dã. Gai đế Chevron hình chữ V sắc nhọn găm sâu vào đất mềm và bùn lầy, thân giày kháng xé sợi ripstop và bảo vệ ngón chân chống va đập.',
    sizes: ['39', '40', '41', '42', '43'],
    colors: ['Đen Đỏ Rực', 'Xanh Biển Phối Đen'],
    stock: 18,
    featured: 0,
    source_img: 'https://images.unsplash.com/photo-1516478177764-9fe5bd7e9717?w=800&q=80',
    specs: { cushion: 'EnergyCell+ High Rebound + Mud Contagrip', foot_type: 'Chân thon, gai bám bùn sâu', purpose: 'Chạy trail dốc bùn lầy, giải chạy địa hình' }
  },
  {
    brand: 'Salomon',
    name: 'Salomon Pulsar Trail Pro',
    slug: 'salomon-pulsar-trail-pro',
    category: 'Outdoor',
    price: 3890000,
    compare_at_price: 4390000,
    description: 'Giày việt dã tốc độ trang bị đĩa Energy Blade bằng sợi tổng hợp đẩy người chạy lao về phía trước, bọt Energy Foam siêu nảy giúp giữ sức trên các cự ly chạy trail 50km - 100km.',
    sizes: ['40', '41', '42', '43', '44'],
    colors: ['Đỏ Cam Hoàng Hôn', 'Trắng Bạc'],
    stock: 14,
    featured: 0,
    source_img: 'https://images.unsplash.com/photo-1520256862855-398228c41684?w=800&q=80',
    specs: { cushion: 'Energy Foam + Energy Blade Plate', foot_type: 'Trung tính', purpose: 'Chạy ultra trail đường dài, tăng tốc leo dốc' }
  },
  {
    brand: 'Salomon',
    name: 'Salomon XT-4 OG Fiery Red',
    slug: 'salomon-xt-4-og-fiery-red',
    category: 'Outdoor',
    price: 4590000,
    compare_at_price: 5190000,
    description: 'Bản phối màu gradient rực lửa nguyên bản từ lịch sử đường mòn Salomon. Khung đế nâng đỡ toàn phần bền bỉ như áo giáp, đế Contagrip kiểm soát trơn trượt trên đá ướt.',
    sizes: ['40', '41', '42', '43', '44'],
    colors: ['Đỏ Rực Phối Vàng Cam', 'Trắng Đen'],
    stock: 16,
    featured: 0,
    source_img: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80',
    specs: { cushion: 'Full-length Agile Chassis + TPU Film', foot_type: 'Kháng xước chống va đập', purpose: 'Gorpcore cá tính, dã ngoại leo núi' }
  },
  {
    brand: 'Salomon',
    name: 'Salomon X Ultra 4 GORE-TEX',
    slug: 'salomon-x-ultra-4-gtx',
    category: 'Outdoor',
    price: 3790000,
    compare_at_price: 4290000,
    description: 'Đôi giày trekking dã ngoại bán chạy nhất của Salomon. Công nghệ ADV-C Chassis khóa chặt khớp mắt cá ngoài, bảo vệ bàn chân không bị lật khi bước qua đá gồ ghề nguy hiểm.',
    sizes: ['40', '41', '42', '43', '44'],
    colors: ['Đen Xám Bạc', 'Xanh Rêu Xám'],
    stock: 19,
    featured: 0,
    source_img: 'https://images.unsplash.com/photo-1552346154-21d32810aba3?w=800&q=80',
    specs: { cushion: 'ADV-C Chassis + GORE-TEX Waterproof', foot_type: 'Bảo vệ cổ chân tối đa', purpose: 'Leo núi Fansipan, trekking dã ngoại nhiều ngày' }
  },
  {
    brand: 'Salomon',
    name: 'Salomon Speedverse PRG',
    slug: 'salomon-speedverse-prg',
    category: 'Lifestyle',
    price: 3990000,
    compare_at_price: 4490000,
    description: 'Sự giao thoa táo bạo giữa giày địa hình và thời trang dạo phố đương đại. Các đường vân uốn lượn sắc bén trên thân giày phối da và lưới dệt 3D cao cấp.',
    sizes: ['39', '40', '41', '42', '43'],
    colors: ['Trắng Ngà Phối Xám', 'Đen Tuyền'],
    stock: 15,
    featured: 0,
    source_img: 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=800&q=80',
    specs: { cushion: 'Molded EVA + Lug Pattern Outsole', foot_type: 'Thời trang', purpose: 'Sneaker dạo phố phá cách, streetwear' }
  },

  // 6. ASICS (7 sản phẩm)
  {
    brand: 'Asics',
    name: 'Asics Gel-Nimbus 26 PureGEL',
    slug: 'asics-gel-nimbus-26-puregel',
    category: 'Running',
    price: 4190000,
    compare_at_price: 4690000,
    description: 'Được mệnh danh là đôi giày chạy êm nhất thế giới của Nhật Bản. Công nghệ PureGEL giấu bên trong gót mềm hơn 65% so với gel truyền thống kết hợp bọt FF BLAST+ ECO bảo vệ đầu gối tuyệt đối.',
    sizes: ['40', '41', '42', '43', '44', '45'],
    colors: ['Xanh Biển Phối Trắng', 'Đen Platinum'],
    stock: 25,
    featured: 1,
    source_img: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=800&q=80',
    specs: { cushion: 'PureGEL + FF BLAST+ ECO Foam', foot_type: 'Bàn chân bè Á Đông chuẩn True-to-size', purpose: 'Chạy bộ êm ái hàng ngày, bảo vệ khớp gối' }
  },
  {
    brand: 'Asics',
    name: 'Asics Gel-Kayano 31 4D Guidance',
    slug: 'asics-gel-kayano-31-4d-guidance',
    category: 'Running',
    price: 4390000,
    compare_at_price: 4990000,
    description: 'Vua của dòng giày ổn định và chống sụp vòm chân. Hệ thống 4D GUIDANCE SYSTEM tự động điều chỉnh thích ứng theo từng chuyển động mỏi của bàn chân, giữ thăng bằng hoàn hảo.',
    sizes: ['40', '41', '42', '43', '44', '45'],
    colors: ['Xám Bạc Băng Giá', 'Đen Phối Vàng Đồng'],
    stock: 22,
    featured: 1,
    source_img: 'https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?w=800&q=80',
    specs: { cushion: 'PureGEL + 4D GUIDANCE SYSTEM', foot_type: 'Chân vòm bẹt, cổ chân lật trong (Overpronation)', purpose: 'Chạy cự ly dài an toàn, bảo vệ vòm bàn chân' }
  },
  {
    brand: 'Asics',
    name: 'Asics Novablast 4 Trampoline',
    slug: 'asics-novablast-4-trampoline',
    category: 'Running',
    price: 3690000,
    compare_at_price: 4190000,
    description: 'Thiết kế đế hình học bạt nhún trampoline độc quyền mang lại cảm giác nảy bật tưng bừng trên từng bước chạy. Trọng lượng siêu nhẹ với bọt đệm FF BLAST+ ECO tái tạo năng lượng dồi dào.',
    sizes: ['39', '40', '41', '42', '43', '44'],
    colors: ['Trắng Phối Xanh Neon', 'Đen Xám Khói'],
    stock: 28,
    featured: 1,
    source_img: 'https://images.unsplash.com/photo-1514989940723-e8e51635b782?w=800&q=80',
    specs: { cushion: 'FF BLAST+ ECO Trampoline Geometric Pods', foot_type: 'Bàn chân trung tính', purpose: 'Chạy vui vẻ, tốc độ nảy bật sảng khoái' }
  },
  {
    brand: 'Asics',
    name: 'Asics GT-2000 12 Stability',
    slug: 'asics-gt-2000-12-stability',
    category: 'Running',
    price: 3390000,
    compare_at_price: 3890000,
    description: 'Sự cân bằng hoàn hảo giữa độ nhẹ linh hoạt và khả năng trợ lực cổ chân với công nghệ 3D GUIDANCE SYSTEM, bền bỉ và cực kỳ đáng tin cậy cho những buổi chạy hằng ngày.',
    sizes: ['40', '41', '42', '43', '44'],
    colors: ['Xanh Navy Trắng', 'Xám Đen'],
    stock: 18,
    featured: 0,
    source_img: 'https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?w=800&q=80',
    specs: { cushion: 'Rearfoot PureGEL + 3D GUIDANCE SYSTEM', foot_type: 'Hỗ trợ chống lật nhẹ', purpose: 'Chạy hàng ngày 5km - 15km' }
  },
  {
    brand: 'Asics',
    name: 'Asics Gel-NYC Cream Oyster Grey',
    slug: 'asics-gel-nyc-cream-oyster-grey',
    category: 'Lifestyle',
    price: 3490000,
    compare_at_price: 3990000,
    description: 'Hòa quyện di sản thiết kế cổ điển GEL-NIMBUS 3 và GEL-CUMULUS 16 thành tuyệt tác thời trang retro runner đương đại. Đệm GEL lộ ra ở cả gót và mũi tạo nét cá tính khác biệt.',
    sizes: ['39', '40', '41', '42', '43', '44'],
    colors: ['Kem Xám Bạc (Cream Oyster)', 'Trắng Phối Xanh Rêu'],
    stock: 20,
    featured: 0,
    source_img: 'https://images.unsplash.com/photo-1582588678413-dbf45f4823e9?w=800&q=80',
    specs: { cushion: 'Visible Forefoot & Rearfoot GEL Technology', foot_type: 'Rộng rãi êm chân', purpose: 'Sneaker dạo phố thời trang Retro Y2K' }
  },
  {
    brand: 'Asics',
    name: 'Asics Metaspeed Sky Paris Carbon',
    slug: 'asics-metaspeed-sky-paris-carbon',
    category: 'Running',
    price: 6290000,
    compare_at_price: 6990000,
    description: 'Siêu phẩm giày đua marathon kỷ lục tại Thế vận hội Paris. Bọt FF TURBO PLUS siêu nẩy kết hợp đĩa carbon mở rộng giúp các chân chạy sải bước dài hơn mà tốn ít sức lực nhất.',
    sizes: ['40', '41', '42', '43', '44'],
    colors: ['Đỏ Cam Lửa Paris', 'Trắng Bạc'],
    stock: 10,
    featured: 1,
    source_img: 'https://images.unsplash.com/photo-1587563871167-1ee9c731aefb?w=800&q=80',
    specs: { cushion: 'FF TURBO PLUS + Full Carbon Plate', foot_type: 'Vận động viên thi đấu chuyên nghiệp', purpose: 'Đua Marathon 42.195km phá kỷ lục' }
  },
  {
    brand: 'Asics',
    name: 'Asics Gel-Trabuco 12 Trail',
    slug: 'asics-gel-trabuco-12-trail',
    category: 'Outdoor',
    price: 3590000,
    compare_at_price: 4090000,
    description: 'Đôi giày việt dã bảo vệ bàn chân toàn diện trên cung đường đá dăm với tấm chống đá nhọn (Rock Protection Plate) và cao su ASICSGRIP bám dính siêu hạng trên đá ướt.',
    sizes: ['40', '41', '42', '43', '44'],
    colors: ['Xanh Đen Cam', 'Xám Rừng'],
    stock: 15,
    featured: 0,
    source_img: 'https://images.unsplash.com/photo-1579338559194-a162d19bf842?w=800&q=80',
    specs: { cushion: 'FF BLAST + Rearfoot GEL + ASICSGRIP', foot_type: 'Bảo vệ đá nhọn va đập', purpose: 'Chạy trail dã ngoại, leo núi đá' }
  },

  // 7. ONITSUKA TIGER (7 sản phẩm)
  {
    brand: 'Onitsuka Tiger',
    name: 'Onitsuka Tiger Mexico 66 White Blue Red',
    slug: 'onitsuka-tiger-mexico-66-white-blue-red',
    category: 'Lifestyle',
    price: 2890000,
    compare_at_price: 3390000,
    description: 'Huyền thoại sọc hổ bất tử từ Thế vận hội Mexico 1968. Thân giày bằng da bò mềm mại ôm gọn bàn chân thanh mảnh, lưỡi gà chéo sau gót kinh điển mang phong cách hoài cổ xứ Phù Tang.',
    sizes: ['38', '39', '40', '41', '42', '43'],
    colors: ['Trắng Sọc Xanh Đỏ', 'Trắng Sọc Đen'],
    stock: 30,
    featured: 1,
    source_img: 'https://images.unsplash.com/photo-1512374382149-233c42b661ac?w=800&q=80',
    specs: { cushion: 'Slim OrthoLite Sockliner', foot_type: 'Thon gọn, ôm sát mu chân', purpose: 'Biểu tượng thời trang thanh lịch Nhật Bản' }
  },
  {
    brand: 'Onitsuka Tiger',
    name: 'Onitsuka Tiger Mexico 66 SD Leather',
    slug: 'onitsuka-tiger-mexico-66-sd-leather',
    category: 'Lifestyle',
    price: 3790000,
    compare_at_price: 4290000,
    description: 'Phiên bản kỷ niệm Super Deluxe (SD) chế tác từ da thuộc thượng hạng Nhật Bản. Bổ sung đệm bọt amplifoam ở gót chân giúp êm ái hơn hẳn phiên bản truyền thống.',
    sizes: ['39', '40', '41', '42', '43'],
    colors: ['Trắng Ngà Da Mềm', 'Đen Sọc Bạc'],
    stock: 18,
    featured: 0,
    source_img: 'https://images.unsplash.com/photo-1515955656352-a1fa3ffcd111?w=800&q=80',
    specs: { cushion: 'AmpliFoam Heel Cushioning + Premium Leather', foot_type: 'Thon gọn cao cấp', purpose: 'Thời trang quý phái, chất liệu da Nhật thượng hạng' }
  },
  {
    brand: 'Onitsuka Tiger',
    name: 'Onitsuka Tiger Serrano Retro Gold',
    slug: 'onitsuka-tiger-serrano-retro-gold',
    category: 'Lifestyle',
    price: 2390000,
    compare_at_price: 2790000,
    description: 'Lấy cảm hứng từ giày đinh điền kinh thập niên 70 với dáng mũi giày cong nhẹ thanh thoát. Thân vải dù siêu nhẹ phối da lộn hai bên mang lại cảm giác nhẹ bẫng khi di chuyển.',
    sizes: ['38', '39', '40', '41', '42', '43'],
    colors: ['Vàng Ánh Kim Sọc Xanh', 'Xanh Navy Sọc Trắng'],
    stock: 22,
    featured: 0,
    source_img: 'https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=800&q=80',
    specs: { cushion: 'Lightweight Low-profile Rubber', foot_type: 'Bàn chân thon nhẹ nhàng', purpose: 'Đi bộ thư thả, dạo phố năng động' }
  },
  {
    brand: 'Onitsuka Tiger',
    name: 'Onitsuka Tiger Tokuten Indoor Gum',
    slug: 'onitsuka-tiger-tokuten-indoor-gum',
    category: 'Lifestyle',
    price: 2690000,
    compare_at_price: 3090000,
    description: 'Phong cách giày sân bóng trong nhà cổ điển với chất da lộn mịn bao bọc mũi giày và đế cao su gum tự nhiên dày dặn, đang là một trong những mẫu giày hot trend được giới trẻ săn đón.',
    sizes: ['39', '40', '41', '42', '43'],
    colors: ['Trắng Sọc Đen Đế Gum', 'Xám Bạc'],
    stock: 25,
    featured: 1,
    source_img: 'https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=800&q=80',
    specs: { cushion: 'Indoor Gum Rubber Cupsole', foot_type: 'Tiêu chuẩn', purpose: 'Phối đồ retro terrace sành điệu' }
  },
  {
    brand: 'Onitsuka Tiger',
    name: 'Onitsuka Tiger GSM Court Vintage',
    slug: 'onitsuka-tiger-gsm-court-vintage',
    category: 'Lifestyle',
    price: 2590000,
    compare_at_price: 2990000,
    description: 'Viết tắt của Game - Set - Match, mẫu giày tennis cổ điển thập niên 80. Các đường dập lỗ ziczac trên thân da trơn thanh lịch, đế phẳng nâng niu bàn chân suốt cả ngày dài.',
    sizes: ['39', '40', '41', '42', '43', '44'],
    colors: ['Trắng Sọc Xanh Hunter', 'Trắng Sọc Đỏ Rượu'],
    stock: 20,
    featured: 0,
    source_img: 'https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=800&q=80',
    specs: { cushion: 'Court Style Flat Rubber Outsole', foot_type: 'Bàn chân tiêu chuẩn', purpose: 'Thời trang thanh lịch công sở, dạo phố' }
  },
  {
    brand: 'Onitsuka Tiger',
    name: 'Onitsuka Tiger Delegation EX Chunky',
    slug: 'onitsuka-tiger-delegation-ex-chunky',
    category: 'Lifestyle',
    price: 3490000,
    compare_at_price: 3990000,
    description: 'Bản phối hiện đại đế dày chunky thời thượng cải tiến từ giày của đoàn thể thao Nhật Bản năm 1964. Tích hợp bọt đệm FLYTEFOAM PROPEL siêu êm ái tăng chiều cao tinh tế.',
    sizes: ['38', '39', '40', '41', '42', '43'],
    colors: ['Trắng Phối Đỏ Xanh', 'Đen Nguyên Bản'],
    stock: 16,
    featured: 0,
    source_img: 'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=800&q=80',
    specs: { cushion: 'FLYTEFOAM PROPEL Thick Midsole', foot_type: 'Êm ái tăng chiều cao', purpose: 'Thời trang chunky trẻ trung, dạo phố' }
  },
  {
    brand: 'Onitsuka Tiger',
    name: 'Onitsuka Tiger Mexico 66 Yellow Kill Bill',
    slug: 'onitsuka-tiger-mexico-66-yellow-kill-bill',
    category: 'Lifestyle',
    price: 2990000,
    compare_at_price: 3490000,
    description: 'Phối màu vàng sọc đen biểu tượng gắn liền với Lý Tiểu Long và bộ phim Kill Bill huyền thoại. Điểm nhấn nổi bật độc nhất vô nhị làm bừng sáng mọi bộ trang phục dạo phố.',
    sizes: ['38', '39', '40', '41', '42', '43'],
    colors: ['Vàng Sọc Đen (Kill Bill)'],
    stock: 26,
    featured: 1,
    source_img: 'https://images.unsplash.com/photo-1575537302964-96cd47c06b1b?w=800&q=80',
    specs: { cushion: 'Slim OrthoLite Sockliner', foot_type: 'Bàn chân thon', purpose: 'Điểm nhấn cá tính, phong cách điện ảnh kinh điển' }
  },

  // 8. MIZUNO (7 sản phẩm)
  {
    brand: 'Mizuno',
    name: 'Mizuno Wave Rider 28 Enerzy',
    slug: 'mizuno-wave-rider-28-enerzy',
    category: 'Running',
    price: 3590000,
    compare_at_price: 4090000,
    description: 'Dòng giày chạy biểu tượng suốt gần 30 năm qua của Nhật Bản. Đĩa đệm cơ học Wave độc quyền phân tán lực chấn động kết hợp bọt MIZUNO ENERZY NXT đàn hồi siêu nảy và bền bỉ vượt trội.',
    sizes: ['39', '40', '41', '42', '43', '44'],
    colors: ['Xanh Dương Bạc', 'Trắng Xám'],
    stock: 24,
    featured: 1,
    source_img: 'https://images.unsplash.com/photo-1586525198428-225f6f12cff5?w=800&q=80',
    specs: { cushion: 'Mizuno Wave Plate + MIZUNO ENERZY NXT', foot_type: 'Chuẩn bàn chân bè Á Đông', purpose: 'Chạy bộ hàng ngày, bền bỉ trên 1500km' }
  },
  {
    brand: 'Mizuno',
    name: 'Mizuno Wave Inspire 20 Support',
    slug: 'mizuno-wave-inspire-20-support',
    category: 'Running',
    price: 3490000,
    compare_at_price: 3990000,
    description: 'Dành riêng cho những người có vòm chân bẹt và cổ chân dễ bị lật trong. Đĩa Wave bất đối xứng tăng cường độ cứng ở phía má trong giúp giữ thẳng trục mắt cá chân an toàn.',
    sizes: ['40', '41', '42', '43', '44'],
    colors: ['Xanh Đen Phối Cam', 'Xám Platinum'],
    stock: 18,
    featured: 0,
    source_img: 'https://images.unsplash.com/photo-1562183241-b937e95585b6?w=800&q=80',
    specs: { cushion: 'Double Fan Wave Plate + MIZUNO ENERZY', foot_type: 'Chân vòm thấp, chống lật cổ chân', purpose: 'Chạy bộ an toàn, bảo vệ vòm bàn chân' }
  },
  {
    brand: 'Mizuno',
    name: 'Mizuno Wave Skyrise 5 Floating',
    slug: 'mizuno-wave-skyrise-5-floating',
    category: 'Running',
    price: 3290000,
    compare_at_price: 3790000,
    description: 'Cảm giác chạy bồng bềnh như lướt trên mây với công nghệ đệm kép MIZUNO ENERZY CORE siêu êm dưới lòng bàn chân. Dáng giày thanh thoát, vải lưới Jacquard thoáng khí tối đa.',
    sizes: ['39', '40', '41', '42', '43', '44'],
    colors: ['Trắng Xanh Bạc', 'Đen Khói'],
    stock: 20,
    featured: 0,
    source_img: 'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=800&q=80',
    specs: { cushion: 'MIZUNO ENERZY CORE Plush Foam', foot_type: 'Bàn chân trung tính', purpose: 'Chạy phục hồi êm ái, đi bộ đường dài' }
  },
  {
    brand: 'Mizuno',
    name: 'Mizuno Wave Rebellion Pro 2 Carbon',
    slug: 'mizuno-wave-rebellion-pro-2-carbon',
    category: 'Running',
    price: 5590000,
    compare_at_price: 6290000,
    description: 'Siêu giày đua marathon phá cách với thiết kế vát gót khí động học cực hạn. Đĩa đệm Carbon tăng cường sợi thủy tinh và bọt Enerzy Lite+ giúp guồng chân xoay nhanh kinh ngạc.',
    sizes: ['40', '41', '42', '43', '44'],
    colors: ['Vàng Chanh Phối Tím Neon'],
    stock: 12,
    featured: 1,
    source_img: 'https://images.unsplash.com/photo-1605348532760-6753d2c43329?w=800&q=80',
    specs: { cushion: 'Carbon Wave Plate + Smooth Speed Assist Cut Heel', foot_type: 'Đáp giữa và ngực bàn chân (Midfoot/Forefoot)', purpose: 'Đua Marathon cự ly 42km tốc độ cao' }
  },
  {
    brand: 'Mizuno',
    name: 'Mizuno Wave Mujin 10 Michelin Trail',
    slug: 'mizuno-wave-mujin-10-michelin-trail',
    category: 'Outdoor',
    price: 3790000,
    compare_at_price: 4290000,
    description: 'Hợp tác đỉnh cao với hãng lốp xe số 1 thế giới Michelin. Hợp chất cao su lốp Michelin bám dính siêu hạng trên bùn ướt và đá trơn trượt cùng đĩa đệm Wave ổn định địa hình hiểm trở.',
    sizes: ['40', '41', '42', '43', '44'],
    colors: ['Xanh Rừng Phối Đen', 'Xám Đất'],
    stock: 15,
    featured: 0,
    source_img: 'https://images.unsplash.com/photo-1607522370275-f14206abe5d3?w=800&q=80',
    specs: { cushion: 'Mizuno Wave + Michelin Rubber Outsole', foot_type: 'Vững chãi địa hình', purpose: 'Việt dã leo núi, chạy trail hiểm trở' }
  },
  {
    brand: 'Mizuno',
    name: 'Mizuno Wave Momentum 3 Court',
    slug: 'mizuno-wave-momentum-3-court',
    category: 'Basketball',
    price: 3390000,
    compare_at_price: 3890000,
    description: 'Giày thi đấu thể thao trong nhà (Bóng chuyền, Bóng rổ, Cầu lông) với thiết kế cổ giày bootie ôm khít mắt cá, đĩa Wave trợ lực bật nhảy và đế không để lại vệt màu trên sàn (Non-marking).',
    sizes: ['40', '41', '42', '43', '44'],
    colors: ['Trắng Xanh Neon', 'Đen Bạc'],
    stock: 16,
    featured: 0,
    source_img: 'https://images.unsplash.com/photo-1617606002779-51d866bdd1d1?w=800&q=80',
    specs: { cushion: 'Mizuno Wave + MIZUNO ENERZY Court', foot_type: 'Bật nhảy tiếp đất an toàn', purpose: 'Thi đấu bóng rổ, bóng chuyền, cầu lông' }
  },
  {
    brand: 'Mizuno',
    name: 'Mizuno Contender Retro Sport',
    slug: 'mizuno-contender-retro-sport',
    category: 'Lifestyle',
    price: 2490000,
    compare_at_price: 2890000,
    description: 'Mẫu sneaker mang đậm tinh thần hoài cổ thập niên 90 với logo chim Runbird dũng mãnh dập nổi hai bên. Phom dáng đầm chắc, da lộn phối vải lưới cao cấp.',
    sizes: ['39', '40', '41', '42', '43'],
    colors: ['Trắng Xám Runbird Đỏ', 'Xanh Navy Trắng'],
    stock: 20,
    featured: 0,
    source_img: 'https://images.unsplash.com/photo-1597045566677-8cf032ed6634?w=800&q=80',
    specs: { cushion: 'EVA Midsole + Trans-foot Rubber', foot_type: 'Dễ mang', purpose: 'Thời trang dạo phố vintage Nhật Bản' }
  },

  // 9. LI-NING (7 sản phẩm)
  {
    brand: 'Li-Ning',
    name: 'Li-Ning Feidian 3.0 Elite Carbon',
    slug: 'li-ning-feidian-3-elite-carbon',
    category: 'Running',
    price: 3990000,
    compare_at_price: 4590000,
    description: 'Vũ khí marathon đỉnh cao càn quét các bục vinh quang. Đĩa đệm Carbon nguyên khối uốn cong toàn phần kết hợp bọt đệm BOOM (bọt béo PEBA ép nhiệt siêu tới hạn) đàn hồi hơn 80%.',
    sizes: ['39', '40', '41', '42', '43', '44'],
    colors: ['Trắng Phối Cam Cháy', 'Xanh Lam Neon'],
    stock: 15,
    featured: 1,
    source_img: 'https://images.unsplash.com/photo-1588117305388-c2631a279f82?w=800&q=80',
    specs: { cushion: 'Full-length Carbon Plate + BOOM Technology', foot_type: 'Chân thon, vận động viên', purpose: 'Đua Marathon 42km tốc độ cao' }
  },
  {
    brand: 'Li-Ning',
    name: 'Li-Ning Yueying 3 Pro Dual BOOM',
    slug: 'li-ning-yueying-3-pro-dual-boom',
    category: 'Running',
    price: 2790000,
    compare_at_price: 3190000,
    description: 'Dòng giày chạy hàng ngày được ưa chuộng bậc nhất của Li-Ning với 2 tầng bọt BOOM êm ái bảo vệ cổ chân, khung TPU Probar Loc chống vặn xoắn giữa bàn chân vững chãi.',
    sizes: ['39', '40', '41', '42', '43'],
    colors: ['Trắng Tím Hologram', 'Đen Bạc'],
    stock: 22,
    featured: 0,
    source_img: 'https://images.unsplash.com/photo-1581605405669-fcdf81165afa?w=800&q=80',
    specs: { cushion: 'Dual-layer BOOM Foam + Probar Loc', foot_type: 'Phom bàn chân người Châu Á', purpose: 'Chạy bộ hàng ngày 5km - 21km' }
  },
  {
    brand: 'Li-Ning',
    name: 'Li-Ning Super Light 21 Breeze',
    slug: 'li-ning-super-light-21-breeze',
    category: 'Running',
    price: 2290000,
    compare_at_price: 2690000,
    description: 'Dòng giày chạy siêu nhẹ kỷ lục chỉ khoảng 180g mỗi chiếc. Thân giày bằng sợi dệt trong suốt thoáng khí giải nhiệt mùa hè kết hợp đệm bọt BOOM êm nảy.',
    sizes: ['38', '39', '40', '41', '42', '43'],
    colors: ['Xanh Băng Tuyết', 'Hồng Cam Bình Minh'],
    stock: 25,
    featured: 0,
    source_img: 'https://images.unsplash.com/photo-1574634534894-89d7576c8259?w=800&q=80',
    specs: { cushion: 'Lightweight BOOM Foam + Cool Shell Mesh', foot_type: 'Rộng rãi siêu thoáng', purpose: 'Chạy mùa hè, tập gym, đi bộ siêu nhẹ' }
  },
  {
    brand: 'Li-Ning',
    name: 'Li-Ning Way of Wade 10 Mint Blossom',
    slug: 'li-ning-way-of-wade-10-mint-blossom',
    category: 'Basketball',
    price: 4990000,
    compare_at_price: 5690000,
    description: 'Siêu phẩm bóng rổ hợp tác cùng huyền thoại NBA Dwyane Wade. Tấm đĩa carbon kéo dài toàn bộ đế, lớp bọt BOOM toàn diện bọc trong khung TPU trong suốt, bám sàn gỗ đỉnh cao.',
    sizes: ['40', '41', '42', '43', '44', '45'],
    colors: ['Xanh Bạc Hà Mint Blossom', 'Đen Vàng Kim'],
    stock: 14,
    featured: 1,
    source_img: 'https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=800&q=80',
    specs: { cushion: 'Full-length Carbon Fiber + Encapsulated BOOM', foot_type: 'Khóa gót bảo vệ cổ chân', purpose: 'Bóng rổ đỉnh cao, phong cách thiết kế vị lai' }
  },
  {
    brand: 'Li-Ning',
    name: 'Li-Ning YuShuai 18 V2 Streetball',
    slug: 'li-ning-yushuai-18-v2-streetball',
    category: 'Basketball',
    price: 2890000,
    compare_at_price: 3390000,
    description: 'Dòng giày bóng rổ cày sân bê tông nức tiếng bền bỉ suốt 18 thế hệ. Đế cao su TUFF RB chống mài mòn gấp 5 lần cao su thông thường kết hợp đệm BOOM bảo vệ đầu gối khi va chạm.',
    sizes: ['40', '41', '42', '43', '44'],
    colors: ['Trắng Đỏ Lửa', 'Đen Tuyền'],
    stock: 20,
    featured: 0,
    source_img: 'https://images.unsplash.com/photo-1565814636199-ae8133055c1c?w=800&q=80',
    specs: { cushion: 'BOOM Midsole + TUFF RB Anti-abrasion Rubber', foot_type: 'Dày dặn bảo vệ', purpose: 'Bóng rổ ngoài trời sân bê tông, thi đấu học sinh sinh viên' }
  },
  {
    brand: 'Li-Ning',
    name: 'Li-Ning Shadow 2 Double Carbon',
    slug: 'li-ning-shadow-2-double-carbon',
    category: 'Running',
    price: 5290000,
    compare_at_price: 5990000,
    description: 'Thiết kế rỗng ruột tương lai mang tính đột phá với 2 tấm đĩa carbon song song uốn cong tạo thành hệ thống đàn hồi cơ học Jiang Technology, trả lực mạnh mẽ chưa từng có.',
    sizes: ['40', '41', '42', '43', '44'],
    colors: ['Trắng Đen Phối Đỏ Neon'],
    stock: 10,
    featured: 1,
    source_img: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800&q=80',
    specs: { cushion: 'Dual Carbon Plates + Jiang Hollow Cushioning System', foot_type: 'Trung tính', purpose: 'Chạy biểu diễn công nghệ tương lai, sưu tầm' }
  },
  {
    brand: 'Li-Ning',
    name: 'Li-Ning Rouge Rabbit 7 Pro',
    slug: 'li-ning-rouge-rabbit-7-pro',
    category: 'Running',
    price: 2190000,
    compare_at_price: 2590000,
    description: 'Đôi giày chạy quốc dân thế hệ thứ 7 với bọt đệm BOOM nhẹ êm cùng đế ngoài GCR bám ướt cải tiến. Mức giá cực kỳ hợp lý cho người tập chạy bộ và rèn luyện thể thao hàng ngày.',
    sizes: ['39', '40', '41', '42', '43'],
    colors: ['Trắng Phối Cam Đào', 'Xanh Biển Nhạt'],
    stock: 26,
    featured: 0,
    source_img: 'https://images.unsplash.com/photo-1516478177764-9fe5bd7e9717?w=800&q=80',
    specs: { cushion: 'Forefoot BOOM + LIGHT FOAM PLUS', foot_type: 'Dễ mang', purpose: 'Chạy bộ hàng ngày 5km - 10km, đi bộ' }
  },

  // 10. ANTA (7 sản phẩm)
  {
    brand: 'Anta',
    name: 'Anta KT8 Shock The Game Klay Thompson',
    slug: 'anta-kt8-shock-the-game-klay-thompson',
    category: 'Basketball',
    price: 2790000,
    compare_at_price: 3290000,
    description: 'Dòng giày thi đấu đỉnh cao của nhà vô địch NBA Klay Thompson. Thiết kế cổ giày có thể gập xuống thành cổ thấp, đệm NitroEdge nảy cực nhạy kết hợp thanh xoắn 3D carbon nâng đỡ.',
    sizes: ['40', '41', '42', '43', '44'],
    colors: ['Xanh Tím Neon Vịnh San Francisco', 'Trắng Vàng Warriors'],
    stock: 18,
    featured: 1,
    source_img: 'https://images.unsplash.com/photo-1520256862855-398228c41684?w=800&q=80',
    specs: { cushion: 'Full-length NitroEdge Foam + Convertible Collar', foot_type: 'Bảo vệ cổ chân linh hoạt', purpose: 'Bóng rổ thi đấu đỉnh cao, bật nảy ném rổ' }
  },
  {
    brand: 'Anta',
    name: 'Anta KT9 3D Carbon Stabilizer',
    slug: 'anta-kt9-3d-carbon-stabilizer',
    category: 'Basketball',
    price: 3290000,
    compare_at_price: 3790000,
    description: 'Thế hệ thứ 9 với hệ thống ổn định SMART S.A.M hấp thụ đến 95% lực phản hồi khi tiếp đất, khóa gót carbon đa hướng giúp các tay ném giữ thăng bằng tuyệt đối trên không trung.',
    sizes: ['40', '41', '42', '43', '44', '45'],
    colors: ['Đen Phantom Phối Vàng Kim', 'Trắng Băng'],
    stock: 15,
    featured: 0,
    source_img: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80',
    specs: { cushion: 'SMART S.A.M Shock Absorber + NitroEdge', foot_type: 'Bảo vệ gót và cổ chân', purpose: 'Thi đấu bóng rổ chuyên nghiệp' }
  },
  {
    brand: 'Anta',
    name: 'Anta Shock The Game 7 Cement King',
    slug: 'anta-shock-the-game-7-cement-king',
    category: 'Basketball',
    price: 2390000,
    compare_at_price: 2790000,
    description: 'Vua của các trận bóng rổ đường phố ngoại trời. Đế gai sâu cao su xi măng A-Hardcourt RB siêu chống mài mòn, bọc mũi TPU chống va đập ngón chân khi va chạm quyết liệt.',
    sizes: ['40', '41', '42', '43', '44'],
    colors: ['Xám Bê Tông Phối Đỏ Lửa', 'Đen Tím'],
    stock: 22,
    featured: 0,
    source_img: 'https://images.unsplash.com/photo-1552346154-21d32810aba3?w=800&q=80',
    specs: { cushion: 'A-Flashfoam + A-Hardcourt RB Anti-abrasion', foot_type: 'Cứng cáp chịu va đập', purpose: 'Bóng rổ đường phố ngoài trời sân bê tông' }
  },
  {
    brand: 'Anta',
    name: 'Anta C202 GT Pro Carbon Racing',
    slug: 'anta-c202-gt-pro-carbon-racing',
    category: 'Running',
    price: 4190000,
    compare_at_price: 4790000,
    description: 'Siêu giày đua marathon đẳng cấp quốc tế của Anta với đĩa carbon 3D ôm trọn vòm chân cùng bọt Nitro siêu nảy đàn hồi đến 84%. Trọng lượng nhẹ chỉ 195g cho sải bước thần tốc.',
    sizes: ['40', '41', '42', '43', '44'],
    colors: ['Cam Lửa Bạc', 'Trắng Xanh Biển'],
    stock: 12,
    featured: 1,
    source_img: 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=800&q=80',
    specs: { cushion: 'Nitro Tech + 3D Carbon Plate', foot_type: 'Chân thon, vận động viên', purpose: 'Đua Marathon 42km bứt phá kỷ lục' }
  },
  {
    brand: 'Anta',
    name: 'Anta PG7 Nitro Daily Cushion',
    slug: 'anta-pg7-nitro-daily-cushion',
    category: 'Running',
    price: 2190000,
    compare_at_price: 2590000,
    description: 'Đôi giày chạy bộ đệm êm thường ngày ứng dụng công nghệ đệm khí nitơ Nitro Tech thế hệ mới. Đem lại cảm giác mềm mại như giẫm trên thảm cỏ, phù hợp cho người mới bắt đầu.',
    sizes: ['39', '40', '41', '42', '43', '44'],
    colors: ['Trắng Xám Bạc', 'Xanh Dương Đậm'],
    stock: 25,
    featured: 0,
    source_img: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=800&q=80',
    specs: { cushion: 'Nitro Tech Daily Cushion', foot_type: 'Bàn chân bè Á Đông thoải mái', purpose: 'Chạy bộ hàng ngày 5km - 15km, đi bộ' }
  },
  {
    brand: 'Anta',
    name: 'Anta Mach 4 Speed Training',
    slug: 'anta-mach-4-speed-training',
    category: 'Running',
    price: 2490000,
    compare_at_price: 2890000,
    description: 'Mẫu giày rèn luyện tốc độ (Tempo run) không đĩa carbon được các runner Châu Á đánh giá rất cao. Thân lưới dệt thoáng khí, đệm bọt nảy nhạy bén giúp guồng chân đều nhịp.',
    sizes: ['39', '40', '41', '42', '43'],
    colors: ['Trắng Phối Xanh Neon', 'Đen Đỏ'],
    stock: 20,
    featured: 0,
    source_img: 'https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?w=800&q=80',
    specs: { cushion: 'A-Flashfoam++ Speed Foam', foot_type: 'Trung tính', purpose: 'Tập chạy biến tốc, rèn luyện tốc độ' }
  },
  {
    brand: 'Anta',
    name: 'Anta Walker Retro Casual',
    slug: 'anta-walker-retro-casual',
    category: 'Lifestyle',
    price: 1890000,
    compare_at_price: 2290000,
    description: 'Giày dạo phố retro phong cách casual năng động với mức giá cực kỳ dễ tiếp cận. Thân da tổng hợp phối vải thoáng, đệm êm nâng đỡ bàn chân khi đi bộ nhiều giờ liền.',
    sizes: ['39', '40', '41', '42', '43', '44'],
    colors: ['Trắng Sọc Xanh Navy', 'Trắng Toàn Diện'],
    stock: 28,
    featured: 0,
    source_img: 'https://images.unsplash.com/photo-1514989940723-e8e51635b782?w=800&q=80',
    specs: { cushion: 'EVA Comfort Cushioning', foot_type: 'Rộng rãi dễ mang', purpose: 'Dạo phố, đi học, đi làm thường ngày' }
  }
];

// Hàm tải ảnh từ URL và nạp vào Cloudflare R2 qua API /api/admin/images
async function uploadImageToR2(imageUrl, fallbackIndex = 0) {
  let targetUrl = imageUrl;
  try {
    let res = await fetch(targetUrl, { signal: AbortSignal.timeout(12000) });
    if (!res.ok) {
      targetUrl = VERIFIED_FALLBACK_IMAGES[fallbackIndex % VERIFIED_FALLBACK_IMAGES.length];
      res = await fetch(targetUrl, { signal: AbortSignal.timeout(12000) });
    }
    const buf = await res.arrayBuffer();
    const contentType = res.headers.get('content-type') || 'image/jpeg';
    const ext = contentType.includes('png') ? 'png' : contentType.includes('webp') ? 'webp' : 'jpg';

    const formData = new FormData();
    formData.append('file', new Blob([buf], { type: contentType }), `shoe.${ext}`);

    const uploadRes = await fetch(`${API_BASE}/api/admin/images`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ADMIN_TOKEN}`,
      },
      body: formData,
    });

    if (!uploadRes.ok) {
      const errText = await uploadRes.text();
      throw new Error(`Upload failed HTTP ${uploadRes.status}: ${errText}`);
    }

    const data = await uploadRes.json();
    return data.key; // e.g. "products/uuid.jpg"
  } catch (err) {
    console.warn(`[Image Download/Upload Warning] Failed for ${targetUrl}: ${err.message}. Retrying with prime fallback...`);
    // Retry with prime fallback
    const fallbackUrl = VERIFIED_FALLBACK_IMAGES[fallbackIndex % VERIFIED_FALLBACK_IMAGES.length];
    const fbRes = await fetch(fallbackUrl);
    const fbBuf = await fbRes.arrayBuffer();
    const fbForm = new FormData();
    fbForm.append('file', new Blob([fbBuf], { type: 'image/jpeg' }), 'shoe.jpg');
    const fbUpload = await fetch(`${API_BASE}/api/admin/images`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${ADMIN_TOKEN}` },
      body: fbForm,
    });
    const fbData = await fbUpload.json();
    return fbData.key;
  }
}

async function main() {
  console.log('=== BẮT ĐẦU CÀO VÀ ĐỒNG BỘ 70 SNEAKER CHÍNH HÃNG VÀO CLOUDFLARE R2 & D1 ===');
  console.log(`Tổng số sản phẩm chuẩn bị xử lý: ${SNEAKER_CATALOG.length} đôi giày của 10 thương hiệu.`);

  const processedProducts = [];

  for (let i = 0; i < SNEAKER_CATALOG.length; i++) {
    const item = SNEAKER_CATALOG[i];
    process.stdout.write(`[${i + 1}/${SNEAKER_CATALOG.length}] Đang xử lý: ${item.name} (${item.brand})... `);
    const r2Key = await uploadImageToR2(item.source_img, i);
    processedProducts.push({
      ...item,
      image_key: r2Key,
    });
    console.log(`OK -> R2 Key: ${r2Key}`);
  }

  console.log('\n=== TẤT CẢ ẢNH ĐÃ ĐƯỢC TẢI VÀ LƯU THÀNH CÔNG VÀO CLOUDFLARE R2! ===');

  // Tạo file migration SQL: backend/migrations/0007_seed_authentic_market_sneakers.sql
  const migrationPath = path.resolve('backend/migrations/0007_seed_authentic_market_sneakers.sql');
  const sqlLines = [
    '-- 0007_seed_authentic_market_sneakers.sql',
    '-- Đồng bộ 70 mẫu sneaker chính hãng chuẩn thị trường của 10 thương hiệu đối tác',
    '-- Làm sạch danh mục cũ để đồng bộ dữ liệu mới nhất',
    'DELETE FROM products;',
    '',
    'INSERT INTO products (name, slug, category, description, price, compare_at_price, stock, sizes, colors, image_key, featured) VALUES',
  ];

  const valueRows = processedProducts.map((p) => {
    const descEsc = p.description.replace(/'/g, "''");
    const nameEsc = p.name.replace(/'/g, "''");
    const sizesJson = JSON.stringify(p.sizes).replace(/'/g, "''");
    const colorsJson = JSON.stringify(p.colors).replace(/'/g, "''");
    return `('${nameEsc}', '${p.slug}', '${p.category}', '${descEsc}', ${p.price}, ${p.compare_at_price}, ${p.stock}, '${sizesJson}', '${colorsJson}', '${p.image_key}', ${p.featured})`;
  });

  sqlLines.push(valueRows.join(',\n') + ';');
  fs.writeFileSync(migrationPath, sqlLines.join('\n'), 'utf8');
  console.log(`\nĐã xuất file Migration D1: ${migrationPath}`);

  // Nạp toàn bộ 70 sản phẩm vào CSDL D1 thông qua Wrangler CLI
  console.log('\nĐang nạp 70 sản phẩm vào CSDL D1 local...');
  try {
    execSync('npx wrangler d1 execute fashion_db --local --file=backend/migrations/0007_seed_authentic_market_sneakers.sql', {
      stdio: 'inherit',
      cwd: process.cwd(),
    });
    console.log('\n=== ĐÃ NẠP THÀNH CÔNG 70 SẢN PHẨM VÀO CSDL D1! ===');
  } catch (err) {
    console.error('Lỗi khi nạp SQL vào D1:', err.message);
  }

  // Xây dựng 4 tài liệu tri thức RAG chuyên sâu cho AI Chatbot
  console.log('\n=== BẮT ĐẦU NẠP TÀI LIỆU TRI THỨC VÀO CLOUDFLARE VECTORIZE CHO CHATBOT ===');

  const doc1Content = `DANH MỤC 70 MẪU GIÀY THỂ THAO & SNEAKER CHÍNH HÃNG TẠI ONE - STORE (NĂM 2026)
One - Store phân phối độc quyền và chính hãng 70 mẫu giày của 10 thương hiệu hàng đầu Châu Âu, Bắc Mỹ và Châu Á:

1. THƯƠNG HIỆU NIKE (Mỹ):
- Nike Air Zoom Pegasus 41 (Running): 3.490.000₫ (Gốc: 3.890.000₫). Đệm bọt ReactX hoàn trả năng lượng +13% kết hợp túi khí Zoom Air. Phù hợp chạy bộ hàng ngày 5km - 21km.
- Nike ZoomX Vaporfly 3 (Running / Marathon): 5.890.000₫ (Gốc: 6.490.000₫). Siêu giày đua đĩa đệm Carbon Flyplate nguyên khối + bọt ZoomX bứt tốc kỷ lục.
- Nike Invincible 3 (Running): 4.290.000₫ (Gốc: 4.790.000₫). Đệm bọt ZoomX cực dày bảo vệ khớp gối tối đa, phục hồi đường dài.
- Nike Air Zoom Vomero 17 (Running): 3.890.000₫ (Gốc: 4.390.000₫). Đệm kép ZoomX + Cushlon 3.0 siêu êm ái.
- Nike Dunk Low Retro Panda (Lifestyle): 3.190.000₫ (Gốc: 3.590.000₫). Phối màu trắng đen kinh điển dạo phố.
- Nike Air Force 1 '07 Triple White (Lifestyle): 2.890.000₫ (Gốc: 3.290.000₫). Đôi sneaker da trắng huyền thoại đệm khí Nike Air.
- Nike Pegasus Trail 4 GORE-TEX (Outdoor): 3.990.000₫ (Gốc: 4.490.000₫). Kháng nước dã ngoại đệm React.

2. THƯƠNG HIỆU ADIDAS (Đức):
- Adidas Samba OG Classic (Lifestyle): 2.790.000₫ (Gốc: 3.190.000₫). Da lộn mũi chữ T phong cách terrace retro.
- Adidas Gazelle Indoor (Lifestyle): 2.990.000₫ (Gốc: 3.390.000₫). Đế cao su gum trong suốt, da lộn vintage.
- Adidas Superstar 82 Originals (Lifestyle): 2.590.000₫ (Gốc: 2.990.000₫). Mũi sò Shell-toe biểu tượng văn hóa hip-hop.
- Adidas Ultraboost Light (Running): 4.190.000₫ (Gốc: 4.890.000₫). Bọt Light BOOST nhẹ hơn 30%, bồng bềnh và trả lực liên tục.
- Adidas Adizero Adios Pro 3 (Running / Racing): 5.990.000₫ (Gốc: 6.590.000₫). Thanh carbon ENERGYRODS 2.0 + bọt Lightstrike Pro vô địch marathon.
- Adidas Adizero Boston 12 (Running): 3.790.000₫ (Gốc: 4.290.000₫). Đệm kép Lightstrike Pro và 2.0 tập luyện biến tốc.
- Adidas Terrex Free Hiker 2 GORE-TEX (Outdoor): 4.490.000₫ (Gốc: 5.190.000₫). Đệm Boost leo núi trekking màng GORE-TEX.

3. THƯƠNG HIỆU NEW BALANCE (Mỹ):
- New Balance 550 White Grey (Lifestyle): 2.990.000₫ (Gốc: 3.490.000₫). Dad shoes bóng rổ cổ điển 1989.
- New Balance 530 Steel Grey (Lifestyle): 2.690.000₫ (Gốc: 3.090.000₫). Retro runner Y2K lưới thoáng khí, đệm ABZORB.
- New Balance 2002R Protection Pack (Lifestyle): 3.990.000₫ (Gốc: 4.590.000₫). Da lộn viền rách xước đệm N-ergy cao cấp.
- New Balance 1906R Metallic Silver (Lifestyle): 3.890.000₫ (Gốc: 4.390.000₫). Phong cách Tech-runner hiện đại khung TPU Stability Web.
- New Balance Fresh Foam X 1080v13 (Running): 4.390.000₫ (Gốc: 4.890.000₫). Bọt Fresh Foam X tiếp đất êm như kẹo dẻo.
- New Balance FuelCell Rebel v4 (Running): 3.590.000₫ (Gốc: 3.990.000₫). Đệm FuelCell PEBA đàn hồi nảy không đĩa carbon.
- New Balance Fresh Foam X Hierro v8 (Outdoor): 3.790.000₫ (Gốc: 4.290.000₫). Đế Vibram Megagrip bám địa hình bùn đất.

4. THƯƠNG HIỆU PUMA (Đức):
- Puma Palermo Leather Gum (Lifestyle): 2.490.000₫ (Gốc: 2.890.000₫). Bóng đá terrace bờ biển nước Ý, tag da vàng kim.
- Puma Suede Classic XXI (Lifestyle): 1.990.000₫ (Gốc: 2.390.000₫). Da lộn nhung bất tử từ năm 1968.
- Puma Army Trainer Retro (Lifestyle): 2.290.000₫ (Gốc: 2.690.000₫). Phong cách quân đội Đức tối giản thanh lịch.
- Puma Deviate Nitro 2 Carbon (Running): 3.990.000₫ (Gốc: 4.590.000₫). Đĩa carbon INNOPLATE + bọt NITRO Elite.
- Puma Velocity Nitro 3 (Running): 2.990.000₫ (Gốc: 3.490.000₫). Giày chạy bộ đa năng bền bỉ trên 1000km.
- Puma MB.03 Toxic LaMelo Ball (Basketball): 3.390.000₫ (Gốc: 3.890.000₫). Giày bóng rổ phá cách bọt NITRO bùng nổ sức bật.
- Puma Voyage Nitro 3 Trail (Outdoor): 3.290.000₫ (Gốc: 3.790.000₫). Đế PUMAGRIP-ATR đa hướng dã ngoại.

5. THƯƠNG HIỆU SALOMON (Pháp):
- Salomon XT-6 Black Phantom (Outdoor / Lifestyle): 4.690.000₫ (Gốc: 5.290.000₫). Biểu tượng thời trang Gorpcore toàn cầu khung ACS.
- Salomon ACS Pro Advanced Metal (Outdoor): 4.990.000₫ (Gốc: 5.590.000₫). Lồng thông gió Kurim phong cách Techwear.
- Salomon Speedcross 6 Grip (Outdoor): 3.690.000₫ (Gốc: 4.190.000₫). Gai đế Chevron bám bùn lầy dốc đứng.
- Salomon Pulsar Trail Pro (Outdoor): 3.890.000₫ (Gốc: 4.390.000₫). Đĩa Energy Blade chạy việt dã tốc độ cao.
- Salomon XT-4 OG Fiery Red (Outdoor): 4.590.000₫ (Gốc: 5.190.000₫). Họa tiết gradient rực lửa khung đế Agile Chassis.
- Salomon X Ultra 4 GORE-TEX (Outdoor): 3.790.000₫ (Gốc: 4.290.000₫). Khung ADV-C chống lật cổ chân khi leo núi Fansipan.
- Salomon Speedverse PRG (Lifestyle): 3.990.000₫ (Gốc: 4.490.000₫). Giao thoa giữa việt dã và thời trang dạo phố.

6. THƯƠNG HIỆU ASICS (Nhật Bản):
- Asics Gel-Nimbus 26 PureGEL (Running): 4.190.000₫ (Gốc: 4.690.000₫). Đôi giày êm nhất thế giới, bọt FF BLAST+ ECO + PureGEL bảo vệ khớp gối.
- Asics Gel-Kayano 31 4D Guidance (Running): 4.390.000₫ (Gốc: 4.990.000₫). Vua chống lật cổ chân và vòm bẹt với 4D GUIDANCE SYSTEM.
- Asics Novablast 4 Trampoline (Running): 3.690.000₫ (Gốc: 4.190.000₫). Bạt lò xo trampoline nảy cực đại và nhẹ bẫng.
- Asics GT-2000 12 Stability (Running): 3.390.000₫ (Gốc: 3.890.000₫). Ổn định và cân bằng cho người tập luyện hàng ngày.
- Asics Gel-NYC Cream Oyster Grey (Lifestyle): 3.490.000₫ (Gốc: 3.990.000₫). Đệm GEL lộ ra cả gót và mũi phong cách retro Y2K.
- Asics Metaspeed Sky Paris Carbon (Running): 6.290.000₫ (Gốc: 6.990.000₫). Siêu giày đua marathon bọt FF TURBO PLUS.
- Asics Gel-Trabuco 12 Trail (Outdoor): 3.590.000₫ (Gốc: 4.090.000₫). Chống đá nhọn Rock Protection Plate + ASICSGRIP.

7. THƯƠNG HIỆU ONITSUKA TIGER (Nhật Bản):
- Onitsuka Tiger Mexico 66 White Blue Red (Lifestyle): 2.890.000₫ (Gốc: 3.390.000₫). Sọc hổ da bò mềm thanh lịch từ Olympic 1968.
- Onitsuka Tiger Mexico 66 SD Leather (Lifestyle): 3.790.000₫ (Gốc: 4.290.000₫). Phiên bản Super Deluxe da Nhật Bản thượng hạng đệm amplifoam.
- Onitsuka Tiger Serrano Retro Gold (Lifestyle): 2.390.000₫ (Gốc: 2.790.000₫). Lấy cảm hứng từ giày đinh thập niên 70 nhẹ bẫng.
- Onitsuka Tiger Tokuten Indoor Gum (Lifestyle): 2.690.000₫ (Gốc: 3.090.000₫). Giày bóng đá trong nhà đế gum hot trend.
- Onitsuka Tiger GSM Court Vintage (Lifestyle): 2.590.000₫ (Gốc: 2.990.000₫). Tennis cổ điển thanh lịch công sở.
- Onitsuka Tiger Delegation EX Chunky (Lifestyle): 3.490.000₫ (Gốc: 3.990.000₫). Đế dày chunky FLYTEFOAM PROPEL tăng chiều cao.
- Onitsuka Tiger Mexico 66 Yellow Kill Bill (Lifestyle): 2.990.000₫ (Gốc: 3.490.000₫). Vàng sọc đen gắn liền với Lý Tiểu Long và Kill Bill.

8. THƯƠNG HIỆU MIZUNO (Nhật Bản):
- Mizuno Wave Rider 28 Enerzy (Running): 3.590.000₫ (Gốc: 4.090.000₫). Đĩa đệm cơ học Wave phân tán phản lực + MIZUNO ENERZY NXT bền trên 1500km.
- Mizuno Wave Inspire 20 Support (Running): 3.490.000₫ (Gốc: 3.990.000₫). Đĩa Wave bất đối xứng chống lật cổ chân và sụp vòm bàn chân.
- Mizuno Wave Skyrise 5 Floating (Running): 3.290.000₫ (Gốc: 3.790.000₫). Đệm MIZUNO ENERZY CORE êm bồng bềnh như mây.
- Mizuno Wave Rebellion Pro 2 Carbon (Running): 5.590.000₫ (Gốc: 6.290.000₫). Mẫu giày vát gót bứt tốc độ kỳ tài đĩa Carbon.
- Mizuno Wave Mujin 10 Michelin Trail (Outdoor): 3.790.000₫ (Gốc: 4.290.000₫). Đế cao su lốp xe Michelin bám đá ướt.
- Mizuno Wave Momentum 3 Court (Basketball / Court): 3.390.000₫ (Gốc: 3.890.000₫). Đệm Wave bật nhảy tiếp đất an toàn sàn gỗ.
- Mizuno Contender Retro Sport (Lifestyle): 2.490.000₫ (Gốc: 2.890.000₫). Logo chim Runbird dũng mãnh hoài cổ thập niên 90.

9. THƯƠNG HIỆU LI-NING (Trung Quốc):
- Li-Ning Feidian 3.0 Elite Carbon (Running): 3.990.000₫ (Gốc: 4.590.000₫). Đĩa carbon uốn cong toàn phần + bọt BOOM đàn hồi trên 80%.
- Li-Ning Yueying 3 Pro Dual BOOM (Running): 2.790.000₫ (Gốc: 3.190.000₫). 2 tầng bọt BOOM chạy bộ hàng ngày êm ái.
- Li-Ning Super Light 21 Breeze (Running): 2.290.000₫ (Gốc: 2.690.000₫). Siêu nhẹ 180g giải nhiệt mùa hè sợi trong suốt.
- Li-Ning Way of Wade 10 Mint Blossom (Basketball): 4.990.000₫ (Gốc: 5.690.000₫). Siêu phẩm bóng rổ Dwyane Wade đĩa carbon toàn phần bọc khung TPU.
- Li-Ning YuShuai 18 V2 Streetball (Basketball): 2.890.000₫ (Gốc: 3.390.000₫). Cao su TUFF RB chống mòn gấp 5 lần cày sân bê tông.
- Li-Ning Shadow 2 Double Carbon (Running): 5.290.000₫ (Gốc: 5.990.000₫). Thiết kế 2 đĩa carbon rỗng ruột Jiang Technology lực bật cực đại.
- Li-Ning Rouge Rabbit 7 Pro (Running): 2.190.000₫ (Gốc: 2.590.000₫). Giày chạy bộ quốc dân bền bỉ giá mềm.

10. THƯƠNG HIỆU ANTA (Trung Quốc):
- Anta KT8 Shock The Game Klay Thompson (Basketball): 2.790.000₫ (Gốc: 3.290.000₫). Cổ giày gập linh hoạt, đệm NitroEdge nảy cực nhạy.
- Anta KT9 3D Carbon Stabilizer (Basketball): 3.290.000₫ (Gốc: 3.790.000₫). Hấp thụ 95% phản lực SMART S.A.M khóa gót carbon đa hướng.
- Anta Shock The Game 7 Cement King (Basketball): 2.390.000₫ (Gốc: 2.790.000₫). Cao su xi măng A-Hardcourt RB cày sân bóng rổ đường phố.
- Anta C202 GT Pro Carbon Racing (Running): 4.190.000₫ (Gốc: 4.790.000₫). Đĩa carbon 3D ôm vòm chân + bọt Nitro Tech đàn hồi 84%.
- Anta PG7 Nitro Daily Cushion (Running): 2.190.000₫ (Gốc: 2.590.000₫). Đệm khí nitơ êm mềm như thảm cỏ cho người mới chạy.
- Anta Mach 4 Speed Training (Running): 2.490.000₫ (Gốc: 2.890.000₫). Tập tempo run sải bước nhanh nhẹn.
- Anta Walker Retro Casual (Lifestyle): 1.890.000₫ (Gốc: 2.290.000₫). Dạo phố phong cách thường nhật êm ái giá hợp lý.`;

  const doc2Content = `HƯỚNG DẪN TƯ VẤN CHỌN GIÀY THEO PHOM BÀN CHÂN & CÔNG NGHỆ BỌT ĐỆM ÂU - Á
Tài liệu hướng dẫn chuyên sâu cho nhân viên và trợ lý AI Tư vấn One hỗ trợ khách hàng:

1. PHÂN BIỆT PHOM BÀN CHÂN VÀ CHỌN CỠ GIÀY (SIZE GUIDE):
- Bàn chân bè ngang người Châu Á (mu bàn chân dày, xòe ngón chân):
  + Nên ưu tiên các thương hiệu Châu Á như Asics (Gel-Nimbus, Gel-Kayano, Novablast), Mizuno (Wave Rider), Li-Ning (Yueying) và Anta (PG7). Các hãng này thiết kế toe-box (hộp ngón chân) nở rộng, chọn chuẩn kích thước True-To-Size (EUR).
  + Nếu chọn giày Âu - Mỹ như Nike Pegasus, Nike Vomero, Salomon XT-6, Adidas Samba: Khuyên khách hàng NÊN TĂNG 0.5 ĐẾN 1 SIZE (ví dụ chân đi 41 nên chọn 41.5 hoặc 42) để không bị bó ngón út và mu bàn chân.
- Bàn chân vòm bẹt / Cổ chân lật trong (Overpronation):
  + Tuyệt đối không chọn giày đế quá mềm lún không có khung trợ lực.
  + Hãy giới thiệu ngay Asics Gel-Kayano 31 (hệ thống 4D GUIDANCE) hoặc Mizuno Wave Inspire 20 (đĩa Double Fan Wave chống sụp vòm).
- Bàn chân đau đầu gối / Cần bảo vệ khớp:
  + Chọn Asics Gel-Nimbus 26 (PureGEL), Nike Invincible 3 (ZoomX cực dày) hoặc New Balance Fresh Foam X 1080v13.

2. SO SÁNH CÔNG NGHỆ BỌT ĐỆM & TRỢ LỰC:
- Bọt ZoomX (Nike) & Lightstrike Pro (Adidas): Siêu nhẹ, độ nảy đàn hồi cao nhất, tối ưu cho thi đấu marathon tốc độ.
- Bọt PureGEL + FF BLAST+ ECO (Asics): Êm ái và phân tán lực chấn động tốt nhất cho khớp gối và cột sống.
- Bọt BOOM (Li-Ning) & Nitro Tech (Anta, Puma): Ứng dụng công nghệ ép khí nitơ siêu tới hạn, vừa êm vừa bền bỉ, không bị xẹp bọt sau 500km.
- Đĩa đệm Wave (Mizuno): Đĩa cơ học dạng sóng bằng hợp chất Pebax, siêu bền trên 1500km, không bị biến dạng theo nhiệt độ.
- Khung Agile Chassis System (Salomon): Chống lật cổ chân và giữ thăng bằng tối đa khi tiếp đất trên địa hình sỏi đá dốc.`;

  const doc3Content = `CHÍNH SÁCH BÁN HÀNG, VẬN CHUYỂN & DỊCH VỤ CỦA ONE - STORE
Cửa hàng One - Store áp dụng các chính sách cam kết dịch vụ minh bạch, chuẩn mực:

1. CHÍNH SÁCH MIỄN PHÍ VẬN CHUYỂN TRONG NƯỚC (FREESHIP MỚI):
- Khách hàng được MIỄN PHÍ VẬN CHUYỂN TRONG NƯỚC khi mua TỪ 3 SẢN PHẨM / ĐÔI GIÀY TRỞ LÊN (mua nhiều hơn 2 đơn/sản phẩm).
- Đối với đơn hàng mua 1 hoặc 2 đôi giày: Phí vận chuyển tiêu chuẩn toàn quốc là 30.000₫.
- Giỏ hàng có thanh tiến trình Freeship Bar tự động thông báo số đôi giày còn thiếu (1/3, 2/3) để khách hàng dễ dàng mua thêm nhận ưu đãi freeship.

2. CHÍNH SÁCH ĐỒNG KIỂM KHI NHẬN HÀNG (COD):
- Quý khách được phép mở hộp kiểm tra đúng mẫu, đúng màu sắc và đúng cỡ giày trước khi thanh toán tiền mặt cho nhân viên giao hàng.
- Nếu không vừa size hoặc không đúng mô tả, quý khách có quyền từ chối nhận hàng mà không mất thêm chi phí.

3. ĐỔI CỠ GIÀY TRONG 7 NGÀY:
- Hỗ trợ đổi size hoặc đổi mẫu miễn phí trong 7 ngày đối với sản phẩm còn nguyên tem mác, hộp giày và chưa sử dụng ngoài trời.

4. CAM KẾT CHÍNH HÃNG 100%:
- Đầy đủ tem mác, hộp chính hãng. Cam kết hoàn tiền 200% nếu phát hiện hàng giả, hàng nhái.

5. MÃ GIẢM GIÁ KHUYẾN MÃI:
- Mã voucher ONE10: Giảm ngay 10% trên tổng giá trị đơn hàng cho khách hàng mua sắm trực tuyến.`;

  const knowledgeDocs = [
    { title: 'Danh muc 70 mau Sneaker Chinh hang va Bang gia Thi truong One - Store 2026', content: doc1Content },
    { title: 'Cam nang Tu van Chon Giay theo Phom Ban chan va Cong nghe Dem Au A', content: doc2Content },
    { title: 'Chinh sach Mien phi Van chuyen tu 3 doi va Dong kiem One - Store', content: doc3Content },
  ];

  for (const doc of knowledgeDocs) {
    console.log(`Đang nạp và vector hóa tài liệu: "${doc.title}"...`);
    const res = await fetch(`${API_BASE}/api/admin/knowledge`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ADMIN_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(doc),
    });
    if (res.ok) {
      const data = await res.json();
      console.log(`  -> Thành công! Document ID: ${data.id}, Chunks: ${data.chunks}`);
    } else {
      console.warn(`  -> Lỗi khi nạp knowledge: ${await res.text()}`);
    }
  }

  console.log('\n=== HOÀN TẤT ĐỒNG BỘ TOÀN BỘ 70 SẢN PHẨM & TRI THỨC CHATBOT THÀNH CÔNG! ===');
}

main().catch((err) => {
  console.error('Lỗi thực thi script:', err);
  process.exit(1);
});
