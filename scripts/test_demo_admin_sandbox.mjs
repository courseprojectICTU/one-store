import assert from 'node:assert';

const BASE_URL = process.argv[2] || process.env.TEST_URL || 'http://127.0.0.1:8787';

console.log(`[TEST] Testing Sandbox Admin Authorization on: ${BASE_URL}`);

async function runTests() {
  let passed = 0;
  let total = 0;

  function check(desc, condition, actual) {
    total++;
    if (condition) {
      console.log(`  PASS: ${desc}`);
      passed++;
    } else {
      console.error(`  FAIL: ${desc} (Actual: ${JSON.stringify(actual)})`);
    }
  }

  // --- TEST 1: Đăng nhập nhanh Demo Admin qua /api/admin/auth/demo-login ---
  console.log('\n--- 1. Kiểm thử Đăng nhập nhanh Demo Sandbox ---');
  const demoLoginRes = await fetch(`${BASE_URL}/api/admin/auth/demo-login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  const demoLoginData = await demoLoginRes.json();
  check('Demo Login endpoint trả về HTTP 200', demoLoginRes.status === 200, demoLoginRes.status);
  check('Demo user role là demo', demoLoginData.user?.role === 'demo', demoLoginData.user?.role);
  check('Có session token', typeof demoLoginData.token === 'string', demoLoginData.token);

  const demoToken = demoLoginData.token;
  const demoHeaders = {
    Authorization: `Bearer ${demoToken}`,
    'Content-Type': 'application/json',
  };

  // --- TEST 2: Đăng nhập thường với tài khoản demo / DemoAdmin@2026 ---
  console.log('\n--- 2. Kiểm thử Đăng nhập chuẩn bằng username & password ---');
  const stdLoginRes = await fetch(`${BASE_URL}/api/admin/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      usernameOrEmail: 'demo',
      password: 'DemoAdmin@2026',
    }),
  });
  const stdLoginData = await stdLoginRes.json();
  check('Đăng nhập demo / DemoAdmin@2026 trả về 200', stdLoginRes.status === 200, stdLoginRes.status);
  check('User ID là 2', stdLoginData.user?.id === 2, stdLoginData.user?.id);

  // --- TEST 3: Quyền ĐỌC (READ-ONLY) của tài khoản Demo ---
  console.log('\n--- 3. Kiểm thử Quyền ĐỌC dữ liệu (Cho phép 100%) ---');

  // 3.1 Overview
  const ovRes = await fetch(`${BASE_URL}/api/admin/analytics/overview`, { headers: demoHeaders });
  const ovData = await ovRes.json();
  check('Đọc tổng quan overview thành công (HTTP 200)', ovRes.status === 200, ovRes.status);
  check('Có số liệu overview', Boolean(ovData.overview), ovData);

  // 3.2 Orders
  const ordRes = await fetch(`${BASE_URL}/api/admin/orders`, { headers: demoHeaders });
  const ordData = await ordRes.json();
  check('Đọc danh sách đơn hàng thành công (HTTP 200)', ordRes.status === 200, ordRes.status);
  check('Có mảng orders', Array.isArray(ordData.orders), ordData);

  // 3.3 Customers
  const custRes = await fetch(`${BASE_URL}/api/admin/customers/analytics`, { headers: demoHeaders });
  const custData = await custRes.json();
  check('Đọc phân tích khách hàng thành công (HTTP 200)', custRes.status === 200, custRes.status);
  check('Có mảng customers', Array.isArray(custData.customers), custData);

  // 3.4 Vouchers
  const vouchRes = await fetch(`${BASE_URL}/api/admin/vouchers`, { headers: demoHeaders });
  check('Đọc danh sách vouchers thành công (HTTP 200)', vouchRes.status === 200, vouchRes.status);

  // 3.5 Knowledge
  const knowRes = await fetch(`${BASE_URL}/api/admin/knowledge`, { headers: demoHeaders });
  check('Đọc kho tri thức RAG thành công (HTTP 200)', knowRes.status === 200, knowRes.status);

  // --- TEST 4: Cơ chế Cách Ly Ghi/Sửa/Xóa (Chặn 100% các thao tác phá hủy dữ liệu) ---
  console.log('\n--- 4. Kiểm thử Cơ Chế Cách Ly Quyền Dữ Liệu (Chặn Write/Update/Delete) ---');

  // 4.1 Cập nhật trạng thái đơn hàng
  const patchOrdRes = await fetch(`${BASE_URL}/api/admin/orders/1/status`, {
    method: 'PATCH',
    headers: demoHeaders,
    body: JSON.stringify({ status: 'completed' }),
  });
  const patchOrdData = await patchOrdRes.json();
  check('Chặn cập nhật trạng thái đơn hàng (HTTP 403 Forbidden)', patchOrdRes.status === 403, patchOrdRes.status);
  check('Thông báo lỗi chứa Sandbox', patchOrdData.error?.includes('Sandbox'), patchOrdData.error);

  // 4.2 Thêm sản phẩm mới
  const postProdRes = await fetch(`${BASE_URL}/api/admin/products`, {
    method: 'POST',
    headers: demoHeaders,
    body: JSON.stringify({
      name: 'Hack Test Sneaker',
      slug: 'hack-test-sneaker',
      category: 'Running',
      price: 1000000,
      stock: 10,
      sizes: ['40'],
      colors: ['Black'],
    }),
  });
  const postProdData = await postProdRes.json();
  check('Chặn thêm sản phẩm mới (HTTP 403 Forbidden)', postProdRes.status === 403, postProdRes.status);

  // 4.3 Sửa sản phẩm
  const patchProdRes = await fetch(`${BASE_URL}/api/admin/products/1`, {
    method: 'PATCH',
    headers: demoHeaders,
    body: JSON.stringify({
      name: 'Tampered Name',
      slug: 'nike-air-zoom-pegasus-41',
      category: 'Running',
      price: 999,
      stock: 0,
      sizes: ['40'],
      colors: ['Black'],
    }),
  });
  check('Chặn sửa sản phẩm (HTTP 403 Forbidden)', patchProdRes.status === 403, patchProdRes.status);

  // 4.4 Xóa sản phẩm
  const delProdRes = await fetch(`${BASE_URL}/api/admin/products/1`, {
    method: 'DELETE',
    headers: demoHeaders,
  });
  check('Chặn xóa sản phẩm (HTTP 403 Forbidden)', delProdRes.status === 403, delProdRes.status);

  // 4.5 Tạo voucher mới
  const postVouchRes = await fetch(`${BASE_URL}/api/admin/vouchers`, {
    method: 'POST',
    headers: demoHeaders,
    body: JSON.stringify({
      code: 'HACK99',
      discount_type: 'percent',
      discount_value: 99,
      min_order: 0,
      max_uses: 999,
    }),
  });
  check('Chặn tạo voucher mới (HTTP 403 Forbidden)', postVouchRes.status === 403, postVouchRes.status);

  // 4.6 Thêm tri thức RAG
  const postKnowRes = await fetch(`${BASE_URL}/api/admin/knowledge`, {
    method: 'POST',
    headers: demoHeaders,
    body: JSON.stringify({
      title: 'Hacked Document Title',
      content: 'This document should never be saved into database or vector database at all.',
    }),
  });
  check('Chặn thêm tài liệu tri thức (HTTP 403 Forbidden)', postKnowRes.status === 403, postKnowRes.status);

  // 4.7 Đổi mật khẩu admin
  const chPassRes = await fetch(`${BASE_URL}/api/admin/auth/change-password`, {
    method: 'POST',
    headers: demoHeaders,
    body: JSON.stringify({
      currentPassword: 'DemoAdmin@2026',
      newPassword: 'HackedPassword@123',
    }),
  });
  check('Chặn đổi mật khẩu tài khoản Demo (HTTP 403 Forbidden)', chPassRes.status === 403, chPassRes.status);

  console.log(`\n========================================`);
  console.log(`KẾT QUẢ KIỂM THỬ: ${passed}/${total} TIÊU CHÍ ĐẠT (${Math.round((passed / total) * 100)}%)`);
  console.log(`========================================\n`);

  if (passed === total) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Lỗi khi chạy test:', err);
  process.exit(1);
});

