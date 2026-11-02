-- 0006_seed_vouchers.sql
-- Khởi tạo mã giảm giá mặc định cho One - Store
INSERT OR IGNORE INTO vouchers(code, discount_type, discount_value, min_order, max_uses, used_count, active) 
VALUES 
('ONE10', 'percent', 10, 0, 1000, 0, 1),
('ONE50', 'fixed', 50000, 300000, 1000, 0, 1);
