import fs from 'node:fs';
import path from 'node:path';

const outDir = path.resolve('frontend/out');
const chunksDir = path.resolve('frontend/out/_next/static/chunks');
const chunkCacheDir = path.resolve('frontend/.chunk-cache');

// 1. Đồng bộ file RSC text (__PAGE__.txt) cho Cloudflare Assets
function syncRscFiles(dir) {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      if (entry.name.startsWith('__next.')) {
        const parentDir = dir;
        const pageTxt = path.join(fullPath, '__PAGE__.txt');
        if (fs.existsSync(pageTxt)) {
          const targetName = `${entry.name}.__PAGE__.txt`;
          const targetPath = path.join(parentDir, targetName);
          fs.copyFileSync(pageTxt, targetPath);
          console.log(`[sync-rsc] Synced: ${path.relative(outDir, targetPath)}`);
        }
      } else {
        syncRscFiles(fullPath);
      }
    }
  }
}

// 2. Bảo toàn và lũy tích các chunks để tránh lỗi Miniflare ENOENT / 500 khi client giữ tab cũ
function preserveCumulativeChunks() {
  if (!fs.existsSync(chunkCacheDir)) {
    fs.mkdirSync(chunkCacheDir, { recursive: true });
  }

  if (fs.existsSync(chunksDir)) {
    // A. Khôi phục các chunks từ cache vào chunksDir nếu chưa có (tránh 500 khi trình duyệt cũ request chunk cũ)
    const cachedFiles = fs.readdirSync(chunkCacheDir);
    let restoredCount = 0;
    for (const file of cachedFiles) {
      const destPath = path.join(chunksDir, file);
      if (!fs.existsSync(destPath)) {
        fs.copyFileSync(path.join(chunkCacheDir, file), destPath);
        restoredCount++;
      }
    }
    if (restoredCount > 0) {
      console.log(`[sync-rsc] Khôi phục ${restoredCount} chunks cũ từ cache để chống lỗi 500 ENOENT.`);
    }

    // B. Cập nhật các chunks mới vừa build vào cache
    const currentChunks = fs.readdirSync(chunksDir);
    for (const file of currentChunks) {
      const cachePath = path.join(chunkCacheDir, file);
      if (!fs.existsSync(cachePath)) {
        fs.copyFileSync(path.join(chunksDir, file), cachePath);
      }
    }
  }
}

syncRscFiles(outDir);
preserveCumulativeChunks();
