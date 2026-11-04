import { Hono } from 'hono';
import { z } from 'zod';
import type { ShopBindings } from './commerce';

export const adminRouter = new Hono<{ Bindings: ShopBindings }>();

const encoder = new TextEncoder();
const hex = (b: ArrayBuffer) =>
  Array.from(new Uint8Array(b), (v) => v.toString(16).padStart(2, '0')).join('');

async function sha(text: string): Promise<string> {
  return hex(await crypto.subtle.digest('SHA-256', encoder.encode(text)));
}

async function derive(password: string, salt: string): Promise<string> {
  const key = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, [
    'deriveBits',
  ]);
  return hex(
    await crypto.subtle.deriveBits(
      { name: 'PBKDF2', salt: encoder.encode(salt), iterations: 100000, hash: 'SHA-256' },
      key,
      256,
    ),
  );
}

function generateToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

export type AdminUserPayload = {
  id: number;
  username: string;
  email: string;
  full_name: string;
  role: string;
};

export async function getAdminUser(c: any): Promise<AdminUserPayload | null> {
  const authHeader = c.req.header('authorization') || '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  if (!token) return null;

  // 1. Fallback tương thích ngược với ADMIN_TOKEN tĩnh cho các script kiểm thử
  if (c.env.ADMIN_TOKEN && c.env.ADMIN_TOKEN.length >= 20 && token === c.env.ADMIN_TOKEN) {
    return {
      id: 0,
      username: 'superadmin',
      email: 'admin@one.store',
      full_name: 'Quản Trị Viên Hệ Thống',
      role: 'superadmin',
    };
  }

  // 2. Xác thực bằng Session Token trong CSDL
  try {
    const tokenHash = await sha(token);
    const sessionUser = (await c.env.DB.prepare(
      `SELECT u.id, u.username, u.email, u.full_name, u.role
       FROM admin_sessions s
       JOIN admin_users u ON s.admin_id = u.id
       WHERE s.token_hash = ? AND s.expires_at > datetime('now') AND u.active = 1`,
    )
      .bind(tokenHash)
      .first()) as AdminUserPayload | null;

    return sessionUser || null;
  } catch (err) {
    console.error('Lỗi xác thực admin session:', err);
    return null;
  }
}

export function requireWritePermission(user: AdminUserPayload | null): Response | null {
  if (!user) return err('Không có quyền truy cập', 401);
  if (user.role === 'demo' || user.role === 'readonly') {
    return err(
      'Chế độ Sandbox: Tài khoản Demo chỉ có quyền xem, không được phép thêm, sửa hoặc xóa dữ liệu.',
      403,
    );
  }
  return null;
}

const err = (message: string, status = 400) =>
  new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });

/* ==========================================================================
   1. XÁC THỰC ADMIN (LOGIN, ME, LOGOUT, CHANGE-PASSWORD)
   ========================================================================== */

adminRouter.post('/admin/auth/login', async (c) => {
  const raw = await c.req.json().catch(() => ({}));
  const usernameOrEmail = (raw?.usernameOrEmail || raw?.username || '').trim();
  const password = typeof raw?.password === 'string' ? raw.password : '';

  if (!usernameOrEmail || usernameOrEmail.length < 2 || !password || password.length < 6) {
    return err('Vui lòng nhập đầy đủ tài khoản và mật khẩu', 400);
  }

  const admin = await c.env.DB.prepare(
    `SELECT id, username, email, password_hash, salt, full_name, role, active 
     FROM admin_users 
     WHERE (username = ? OR email = ?) AND active = 1`,
  )
    .bind(usernameOrEmail.toLowerCase(), usernameOrEmail.toLowerCase())
    .first<any>();

  if (!admin) {
    return err('Tài khoản hoặc mật khẩu không chính xác', 401);
  }

  const computedHash = await derive(password, admin.salt);
  if (computedHash !== admin.password_hash) {
    return err('Tài khoản hoặc mật khẩu không chính xác', 401);
  }

  // Tạo token phiên ngẫu nhiên (32 bytes hex)
  const token = generateToken();
  const tokenHash = await sha(token);

  // Lưu phiên vào admin_sessions, thời hạn 7 ngày
  await c.env.DB.batch([
    c.env.DB.prepare(
      `INSERT INTO admin_sessions (token_hash, admin_id, expires_at)
       VALUES (?, ?, datetime('now', '+7 days'))`,
    ).bind(tokenHash, admin.id),
    c.env.DB.prepare(
      `UPDATE admin_users SET last_login = datetime('now') WHERE id = ?`,
    ).bind(admin.id),
  ]);

  return c.json({
    ok: true,
    token,
    user: {
      id: admin.id,
      username: admin.username,
      email: admin.email,
      full_name: admin.full_name,
      role: admin.role,
    },
  });
});

adminRouter.post('/admin/auth/demo-login', async (c) => {
  const demoAdmin = await c.env.DB.prepare(
    `SELECT id, username, email, full_name, role, active 
     FROM admin_users 
     WHERE username = 'demo' AND active = 1`,
  ).first<any>();

  if (!demoAdmin) {
    return err('Tài khoản Demo hiện chưa được kích hoạt', 404);
  }

  // Tạo token phiên ngẫu nhiên (32 bytes hex) cho Demo Admin
  const token = generateToken();
  const tokenHash = await sha(token);

  await c.env.DB.batch([
    c.env.DB.prepare(
      `INSERT INTO admin_sessions (token_hash, admin_id, expires_at)
       VALUES (?, ?, datetime('now', '+7 days'))`,
    ).bind(tokenHash, demoAdmin.id),
    c.env.DB.prepare(
      `UPDATE admin_users SET last_login = datetime('now') WHERE id = ?`,
    ).bind(demoAdmin.id),
  ]);

  return c.json({
    ok: true,
    token,
    user: {
      id: demoAdmin.id,
      username: demoAdmin.username,
      email: demoAdmin.email,
      full_name: demoAdmin.full_name,
      role: demoAdmin.role,
    },
    message: 'Đăng nhập thành công với quyền Demo Sandbox (Chỉ Xem)',
  });
});

adminRouter.get('/admin/auth/me', async (c) => {
  const user = await getAdminUser(c);
  if (!user) return err('Phiên đăng nhập đã hết hạn hoặc không hợp lệ', 401);
  return c.json({ ok: true, user });
});

adminRouter.post('/admin/auth/logout', async (c) => {
  const authHeader = c.req.header('authorization') || '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  if (token) {
    const tokenHash = await sha(token);
    await c.env.DB.prepare('DELETE FROM admin_sessions WHERE token_hash = ?')
      .bind(tokenHash)
      .run();
  }
  return c.json({ ok: true, message: 'Đăng xuất thành công' });
});

adminRouter.post('/admin/auth/change-password', async (c) => {
  const user = await getAdminUser(c);
  const writeErr = requireWritePermission(user);
  if (writeErr) return writeErr;
  if (!user || user.id === 0) return err('Không có quyền đổi mật khẩu tài khoản này', 403);

  const schema = z.object({
    currentPassword: z.string().min(6),
    newPassword: z.string().min(8),
  });
  const parsed = schema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return err('Mật khẩu mới cần tối thiểu 8 ký tự', 400);

  const currentAdmin = await c.env.DB.prepare(
    'SELECT password_hash, salt FROM admin_users WHERE id = ?',
  )
    .bind(user.id)
    .first<any>();

  if (!currentAdmin) return err('Không tìm thấy tài khoản', 404);

  const currentHash = await derive(parsed.data.currentPassword, currentAdmin.salt);
  if (currentHash !== currentAdmin.password_hash) {
    return err('Mật khẩu hiện tại không chính xác', 400);
  }

  // Tạo salt mới và băm mật khẩu mới
  const newSalt = generateToken().slice(0, 24);
  const newHash = await derive(parsed.data.newPassword, newSalt);

  await c.env.DB.prepare(
    'UPDATE admin_users SET password_hash = ?, salt = ? WHERE id = ?',
  )
    .bind(newHash, newSalt, user.id)
    .run();

  return c.json({ ok: true, message: 'Đổi mật khẩu thành công' });
});

/* ==========================================================================
   2. QUẢN LÝ ĐƠN HÀNG (ORDERS HUB)
   ========================================================================== */

adminRouter.get('/admin/orders', async (c) => {
  const user = await getAdminUser(c);
  if (!user) return err('Không có quyền', 401);

  const status = c.req.query('status') || '';
  const search = (c.req.query('search') || '').trim();
  const limit = Math.min(200, Math.max(1, Number(c.req.query('limit')) || 100));

  let query = `
    SELECT o.id, o.code, o.customer_name, o.phone, o.address, o.note, o.total, o.status, 
           o.voucher_code, o.discount, o.created_at,
           (SELECT count(*) FROM order_items WHERE order_id = o.id) as total_items
    FROM orders o
    WHERE 1=1
  `;
  const binds: any[] = [];

  if (status && ['pending', 'confirmed', 'shipping', 'completed', 'cancelled'].includes(status)) {
    query += ` AND o.status = ?`;
    binds.push(status);
  }

  if (search) {
    query += ` AND (o.code LIKE ? OR o.phone LIKE ? OR o.customer_name LIKE ?)`;
    const sTerm = `%${search}%`;
    binds.push(sTerm, sTerm, sTerm);
  }

  query += ` ORDER BY o.id DESC LIMIT ?`;
  binds.push(limit);

  const res = await c.env.DB.prepare(query).bind(...binds).all<any>();
  return c.json({ orders: res.results || [] });
});

adminRouter.get('/admin/orders/:id', async (c) => {
  const user = await getAdminUser(c);
  if (!user) return err('Không có quyền', 401);

  const orderId = Number(c.req.param('id'));
  const order = await c.env.DB.prepare(
    `SELECT id, code, customer_name, phone, address, note, total, status, voucher_code, discount, created_at
     FROM orders WHERE id = ?`,
  )
    .bind(orderId)
    .first<any>();

  if (!order) return err('Không tìm thấy đơn hàng', 404);

  const items = await c.env.DB.prepare(
    `SELECT oi.id, oi.product_id, oi.product_name, oi.size, oi.color, oi.quantity, oi.unit_price, p.image_key
     FROM order_items oi
     LEFT JOIN products p ON oi.product_id = p.id
     WHERE oi.order_id = ?`,
  )
    .bind(orderId)
    .all<any>();

  const enrichedItems = (items.results || []).map((i) => ({
    ...i,
    image_url: i.image_key ? `/api/images/${encodeURIComponent(i.image_key)}` : null,
  }));

  return c.json({
    order: {
      ...order,
      items: enrichedItems,
    },
  });
});

adminRouter.patch('/admin/orders/:id/status', async (c) => {
  const user = await getAdminUser(c);
  const writeErr = requireWritePermission(user);
  if (writeErr) return writeErr;
  if (!user) return err('Không có quyền', 401);

  const schema = z.object({
    status: z.enum(['pending', 'confirmed', 'shipping', 'completed', 'cancelled']),
  });
  const parsed = schema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return err('Trạng thái không hợp lệ', 400);

  const orderId = Number(c.req.param('id'));
  const r = await c.env.DB.prepare('UPDATE orders SET status = ? WHERE id = ?')
    .bind(parsed.data.status, orderId)
    .run();

  if (!r.meta.changes) return err('Không tìm thấy đơn hàng', 404);

  return c.json({ ok: true, status: parsed.data.status });
});

/* ==========================================================================
   3. QUẢN LÝ KHÁCH HÀNG & PHÂN TÍCH TIỀM NĂNG (CUSTOMERS & LEADS)
   ========================================================================== */

adminRouter.get('/admin/customers/analytics', async (c) => {
  const user = await getAdminUser(c);
  if (!user) return err('Không có quyền', 401);

  // Tổng hợp dữ liệu từ các đơn hàng theo số điện thoại khách hàng
  const query = `
    SELECT 
      o.phone,
      o.customer_name as name,
      max(o.address) as address,
      count(o.id) as total_orders,
      sum(CASE WHEN o.status = 'completed' THEN 1 ELSE 0 END) as completed_orders,
      sum(CASE WHEN o.status = 'completed' THEN o.total ELSE 0 END) as total_spent,
      max(o.created_at) as last_order_at,
      min(o.created_at) as first_order_at
    FROM orders o
    WHERE o.phone IS NOT NULL AND length(trim(o.phone)) >= 9
    GROUP BY o.phone
    ORDER BY total_spent DESC, total_orders DESC
    LIMIT 200
  `;

  const res = await c.env.DB.prepare(query).all<any>();
  const customers = (res.results || []).map((cust) => {
    const totalSpent = Number(cust.total_spent || 0);
    const completedOrders = Number(cust.completed_orders || 0);
    const totalOrders = Number(cust.total_orders || 0);

    let segment: 'VIP' | 'POTENTIAL' | 'NEW' = 'NEW';
    if (totalSpent >= 5000000 || completedOrders >= 3) {
      segment = 'VIP';
    } else if (completedOrders >= 1 || totalOrders >= 2) {
      segment = 'POTENTIAL';
    }

    return {
      ...cust,
      total_spent: totalSpent,
      completed_orders: completedOrders,
      total_orders: totalOrders,
      segment,
    };
  });

  return c.json({ customers });
});

adminRouter.get('/admin/customers/:phone/orders', async (c) => {
  const user = await getAdminUser(c);
  if (!user) return err('Không có quyền', 401);

  const phone = c.req.param('phone');
  const cleanPhone = phone.replace(/[\s-]/g, '');

  const res = await c.env.DB.prepare(
    `SELECT id, code, customer_name, phone, address, total, status, created_at
     FROM orders
     WHERE phone = ? OR phone = ? OR replace(replace(phone, ' ', ''), '-', '') = ?
     ORDER BY id DESC LIMIT 50`,
  )
    .bind(phone, cleanPhone, cleanPhone)
    .all<any>();

  return c.json({ orders: res.results || [] });
});

/* ==========================================================================
   4. THỐNG KÊ & BIỂU ĐỒ (ANALYTICS & CHARTS)
   ========================================================================== */

adminRouter.get('/admin/analytics/overview', async (c) => {
  const user = await getAdminUser(c);
  if (!user) return err('Không có quyền', 401);

  // 1. Thống kê KPI tổng thể
  const stats = await c.env.DB.prepare(`
    SELECT
      (SELECT count(*) FROM products) as total_products,
      (SELECT count(*) FROM products WHERE stock <= 5) as low_stock_products,
      (SELECT count(*) FROM orders) as total_orders,
      (SELECT count(*) FROM orders WHERE status = 'pending') as pending_orders,
      (SELECT count(*) FROM orders WHERE status = 'confirmed') as confirmed_orders,
      (SELECT count(*) FROM orders WHERE status = 'shipping') as shipping_orders,
      (SELECT count(*) FROM orders WHERE status = 'completed') as completed_orders,
      (SELECT count(*) FROM orders WHERE status = 'cancelled') as cancelled_orders,
      (SELECT coalesce(sum(total), 0) FROM orders WHERE status = 'completed') as total_revenue,
      (SELECT count(DISTINCT phone) FROM orders WHERE phone IS NOT NULL) as total_customers
  `).first<any>();

  const totalRev = Number(stats?.total_revenue || 0);
  const completedOrd = Number(stats?.completed_orders || 0);
  const aov = completedOrd > 0 ? Math.round(totalRev / completedOrd) : 0;

  return c.json({
    overview: {
      ...stats,
      aov,
    },
  });
});

adminRouter.get('/admin/analytics/revenue-chart', async (c) => {
  const user = await getAdminUser(c);
  if (!user) return err('Không có quyền', 401);

  // Nhóm doanh thu và số đơn theo ngày (14 ngày gần nhất)
  const res = await c.env.DB.prepare(`
    SELECT 
      substr(created_at, 1, 10) as date,
      count(*) as total_orders,
      sum(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_orders,
      sum(CASE WHEN status = 'completed' THEN total ELSE 0 END) as revenue
    FROM orders
    WHERE created_at >= datetime('now', '-14 days')
    GROUP BY substr(created_at, 1, 10)
    ORDER BY date ASC
  `).all<any>();

  return c.json({ chart: res.results || [] });
});

adminRouter.get('/admin/analytics/top-products', async (c) => {
  const user = await getAdminUser(c);
  if (!user) return err('Không có quyền', 401);

  const res = await c.env.DB.prepare(`
    SELECT 
      oi.product_id,
      oi.product_name,
      p.category,
      p.image_key,
      sum(oi.quantity) as total_sold,
      sum(oi.quantity * oi.unit_price) as total_revenue
    FROM order_items oi
    JOIN orders o ON oi.order_id = o.id
    LEFT JOIN products p ON oi.product_id = p.id
    WHERE o.status != 'cancelled'
    GROUP BY oi.product_id, oi.product_name
    ORDER BY total_sold DESC
    LIMIT 10
  `).all<any>();

  const topProducts = (res.results || []).map((p) => ({
    ...p,
    image_url: p.image_key ? `/api/images/${encodeURIComponent(p.image_key)}` : null,
  }));

  return c.json({ topProducts });
});

/* ==========================================================================
   5. XUẤT BÁO CÁO (EXPORT CSV WITH UTF-8 BOM)
   ========================================================================== */

function escapeCsvCell(cell: any): string {
  if (cell === null || cell === undefined) return '""';
  const str = String(cell).replace(/"/g, '""');
  return `"${str}"`;
}

adminRouter.get('/admin/export/:type', async (c) => {
  const user = await getAdminUser(c);
  if (!user) return err('Không có quyền', 401);

  const type = c.req.param('type');
  const nowStr = new Date().toISOString().slice(0, 10);
  const UTF8_BOM = '\uFEFF';

  if (type === 'orders') {
    const ordersRes = await c.env.DB.prepare(`
      SELECT o.code, o.created_at, o.customer_name, o.phone, o.address, o.total, o.status, o.voucher_code, o.discount, o.note
      FROM orders o
      ORDER BY o.id DESC LIMIT 1000
    `).all<any>();

    const rows = [
      ['Mã đơn', 'Thời gian đặt', 'Khách hàng', 'Số điện thoại', 'Địa chỉ giao hàng', 'Tổng tiền (VND)', 'Trạng thái', 'Mã Voucher', 'Giảm giá (VND)', 'Ghi chú'],
      ...(ordersRes.results || []).map((o) => [
        o.code,
        o.created_at,
        o.customer_name,
        o.phone,
        o.address,
        o.total,
        o.status,
        o.voucher_code || '',
        o.discount || 0,
        o.note || '',
      ]),
    ];

    const csvContent = UTF8_BOM + rows.map((r) => r.map(escapeCsvCell).join(',')).join('\r\n');
    return new Response(csvContent, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="orders_report_${nowStr}.csv"`,
      },
    });
  }

  if (type === 'products') {
    const prodRes = await c.env.DB.prepare(`
      SELECT id, name, slug, category, price, compare_at_price, stock, featured, created_at
      FROM products
      ORDER BY id ASC
    `).all<any>();

    const rows = [
      ['ID', 'Tên sản phẩm', 'Slug', 'Danh mục / Hãng', 'Giá bán (VND)', 'Giá niêm yết (VND)', 'Tồn kho', 'Nổi bật', 'Ngày tạo'],
      ...(prodRes.results || []).map((p) => [
        p.id,
        p.name,
        p.slug,
        p.category,
        p.price,
        p.compare_at_price || '',
        p.stock,
        p.featured ? 'Có' : 'Không',
        p.created_at,
      ]),
    ];

    const csvContent = UTF8_BOM + rows.map((r) => r.map(escapeCsvCell).join(',')).join('\r\n');
    return new Response(csvContent, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="products_report_${nowStr}.csv"`,
      },
    });
  }

  if (type === 'customers') {
    const custRes = await c.env.DB.prepare(`
      SELECT 
        o.phone,
        o.customer_name as name,
        max(o.address) as address,
        count(o.id) as total_orders,
        sum(CASE WHEN o.status = 'completed' THEN 1 ELSE 0 END) as completed_orders,
        sum(CASE WHEN o.status = 'completed' THEN o.total ELSE 0 END) as total_spent,
        min(o.created_at) as first_order_at,
        max(o.created_at) as last_order_at
      FROM orders o
      WHERE o.phone IS NOT NULL
      GROUP BY o.phone
      ORDER BY total_spent DESC
    `).all<any>();

    const rows = [
      ['Số điện thoại', 'Họ tên', 'Địa chỉ', 'Tổng số đơn', 'Số đơn hoàn tất', 'Tổng chi tiêu (VND)', 'Phân khúc', 'Đơn đầu tiên', 'Đơn gần nhất'],
      ...(custRes.results || []).map((cust) => {
        const spent = Number(cust.total_spent || 0);
        const comp = Number(cust.completed_orders || 0);
        let segment = 'Khách mới';
        if (spent >= 5000000 || comp >= 3) segment = 'Khách VIP';
        else if (comp >= 1 || cust.total_orders >= 2) segment = 'Khách tiềm năng';

        return [
          cust.phone,
          cust.name,
          cust.address || '',
          cust.total_orders,
          cust.completed_orders,
          spent,
          segment,
          cust.first_order_at,
          cust.last_order_at,
        ];
      }),
    ];

    const csvContent = UTF8_BOM + rows.map((r) => r.map(escapeCsvCell).join(',')).join('\r\n');
    return new Response(csvContent, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="customers_report_${nowStr}.csv"`,
      },
    });
  }

  return err('Loại báo cáo không hỗ trợ', 400);
});
