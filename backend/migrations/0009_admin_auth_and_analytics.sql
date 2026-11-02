-- Migration 0009: Admin Authentication, Sessions, and Analytics Support
CREATE TABLE IF NOT EXISTS admin_users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE COLLATE NOCASE,
  email TEXT NOT NULL UNIQUE COLLATE NOCASE,
  password_hash TEXT NOT NULL,
  salt TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'superadmin',
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_login TEXT
);

CREATE TABLE IF NOT EXISTS admin_sessions (
  token_hash TEXT PRIMARY KEY,
  admin_id INTEGER NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_admin_sessions_admin ON admin_sessions(admin_id);

-- Seed default superadmin: username='admin', email='admin@one.store', pass='OneStore@2026'
INSERT OR IGNORE INTO admin_users (username, email, password_hash, salt, full_name, role)
VALUES (
  'admin',
  'admin@one.store',
  '4ae614239414eda1edc314a0b0a965e8b4e1d4c07147994cd0372377a36a58c0',
  'onestore_admin_salt_2026',
  'Quản Trị Viên One - Store',
  'superadmin'
);
