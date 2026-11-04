-- Migration 0016: Tạo tài khoản Demo Admin với cơ chế Sandbox (Chỉ Xem - Read-Only)
-- Tài khoản này phục vụ khách tham quan, nghiệm thu và đánh giá hệ thống.
-- Quyền hạn: Chỉ được phép XEM (READ-ONLY) toàn bộ báo cáo, đơn hàng, sản phẩm, khách hàng, voucher và kho tri thức.
-- Bị khóa 100% quyền THÊM, SỬA, XÓA trên toàn bộ các bảng dữ liệu.

INSERT OR REPLACE INTO admin_users (id, username, email, password_hash, salt, full_name, role, active)
VALUES (
  2,
  'demo',
  'demo@one.store',
  'd2dcdb37ecf9476de2f15814bf5c2a56576fbac445c88292df84ef68edb2d32e',
  'onestore_demo_salt_2026',
  'Demo Sandbox Admin (Chỉ xem)',
  'demo',
  1
);
