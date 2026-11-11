-- Khởi tạo bảng visitor_logs phục vụ thống kê lượt truy cập theo quốc gia, thiết bị và khung thời gian 24h
CREATE TABLE IF NOT EXISTS visitor_logs (
  id TEXT PRIMARY KEY,
  _ingest_ts INTEGER NOT NULL,
  country TEXT NOT NULL,
  device TEXT NOT NULL,
  time TEXT NOT NULL,
  ip TEXT NOT NULL,
  meta TEXT
);

CREATE INDEX IF NOT EXISTS idx_visitor_ingest_ts ON visitor_logs(_ingest_ts);
CREATE INDEX IF NOT EXISTS idx_visitor_country ON visitor_logs(country);
CREATE INDEX IF NOT EXISTS idx_visitor_device ON visitor_logs(device);

