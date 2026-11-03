-- Migration 0015: Cập nhật PBKDF2 hash chuẩn 100k iterations cho Cloudflare Workers
UPDATE admin_users 
SET password_hash = '8b6125635a5b8a9d7aabf4258626dcedc3dfdee60e35029a480bcca20c03dd6a' 
WHERE username = 'admin';
