import { Hono } from 'hono';
import { z } from 'zod';
import { getAdminUser, requireWritePermission } from './admin';
export type ShopBindings = {
  DB: D1Database;
  CACHE: KVNamespace;
  IMAGES: R2Bucket;
  ASSETS: Fetcher;
  ADMIN_TOKEN: string;
  AI: {
    run(model: string, input: Record<string, unknown>): Promise<unknown>;
  };
  VECTORIZE: {
    upsert(vectors: Array<{ id: string; values: number[] }>): Promise<unknown>;
    query(values: number[], options: { topK: number }): Promise<{ matches: Array<{ id: string; score: number }> }>;
    deleteByIds(ids: string[]): Promise<unknown>;
  };
};
export const commerce = new Hono<{ Bindings: ShopBindings }>();
const error = (_c: any, message: string, status = 400) =>
  new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
const allowedAdmin = (c: any) =>
  Boolean(
    c.env.ADMIN_TOKEN?.length >= 20 &&
    c.req.header('authorization') === `Bearer ${c.env.ADMIN_TOKEN}`,
  );
const encoder = new TextEncoder();
const hex = (b: ArrayBuffer) =>
  Array.from(new Uint8Array(b), (v) => v.toString(16).padStart(2, '0')).join('');
async function sha(text: string) {
  return hex(await crypto.subtle.digest('SHA-256', encoder.encode(text)));
}
async function derive(password: string, salt: string) {
  const key = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, [
    'deriveBits',
  ]);
  return hex(
    await crypto.subtle.deriveBits(
      { name: 'PBKDF2', salt: encoder.encode(salt), iterations: 210000, hash: 'SHA-256' },
      key,
      256,
    ),
  );
}
type AuthCustomer = { id: number; name: string; email: string };
async function loggedIn(c: any): Promise<AuthCustomer | null> {
  const token = (c.req.header('authorization') || '').replace(/^Bearer /, '');
  if (!/^[a-f0-9]{64}$/.test(token)) return null;
  const customer = await c.env.DB.prepare(
    `SELECT customers.id,customers.name,customers.email FROM customer_sessions JOIN customers ON customer_sessions.customer_id=customers.id WHERE token_hash=? AND expires_at>datetime('now')`,
  )
    .bind(await sha(token))
    .first();
  return customer as AuthCustomer | null;
}
async function issue(c: any, id: number) {
  const token = Array.from(crypto.getRandomValues(new Uint8Array(32)), (v) =>
    v.toString(16).padStart(2, '0'),
  ).join('');
  await c.env.DB.prepare(
    `INSERT INTO customer_sessions(token_hash,customer_id,expires_at) VALUES(?,?,datetime('now','+14 days'))`,
  )
    .bind(await sha(token), id)
    .run();
  return token;
}
const account = z.object({
  email: z.string().trim().email().max(150),
  password: z.string().min(10).max(128),
});
commerce.post('/auth/register', async (c) => {
  const body = account
    .extend({ name: z.string().trim().min(2).max(100) })
    .safeParse(await c.req.json().catch(() => null));
  if (!body.success)
    return error(c, 'Tên, email hoặc mật khẩu không hợp lệ (mật khẩu tối thiểu 10 ký tự)');
  const { email, password, name } = body.data;
  const salt = crypto.randomUUID();
  const hash = await derive(password, salt);
  try {
    const r = await c.env.DB.prepare(
      'INSERT INTO customers(name,email,password_hash,salt) VALUES(?,?,?,?)',
    )
      .bind(name, email.toLowerCase(), hash, salt)
      .run();
    return c.json(
      {
        token: await issue(c, Number(r.meta.last_row_id)),
        user: { id: r.meta.last_row_id, name, email: email.toLowerCase() },
      },
      201,
    );
  } catch {
    return error(c, 'Không thể đăng ký; email có thể đã được sử dụng', 409);
  }
});
commerce.post('/auth/login', async (c) => {
  const body = account.safeParse(await c.req.json().catch(() => null));
  if (!body.success) return error(c, 'Email hoặc mật khẩu không hợp lệ');
  const user = await c.env.DB.prepare('SELECT * FROM customers WHERE email=?')
    .bind(body.data.email.toLowerCase())
    .first<any>();
  if (!user || (await derive(body.data.password, user.salt)) !== user.password_hash)
    return error(c, 'Email hoặc mật khẩu không chính xác', 401);
  return c.json({
    token: await issue(c, user.id),
    user: { id: user.id, name: user.name, email: user.email },
  });
});
commerce.get('/auth/me', async (c) => {
  const user = await loggedIn(c);
  return user ? c.json({ user }) : error(c, 'Vui lòng đăng nhập', 401);
});
commerce.post('/auth/logout', async (c) => {
  const token = (c.req.header('authorization') || '').replace(/^Bearer /, '');
  if (/^[a-f0-9]{64}$/.test(token))
    await c.env.DB.prepare('DELETE FROM customer_sessions WHERE token_hash=?')
      .bind(await sha(token))
      .run();
  return c.json({ ok: true });
});
commerce.get('/wishlist', async (c) => {
  const user = await loggedIn(c);
  if (!user) return error(c, 'Vui lòng đăng nhập', 401);
  const data = await c.env.DB.prepare(
    'SELECT product_id FROM wishlists WHERE customer_id=? ORDER BY product_id DESC',
  )
    .bind(user.id)
    .all<{ product_id: number }>();
  return c.json({ ids: data.results.map((x) => x.product_id) });
});
commerce.post('/wishlist/:id', async (c) => {
  const user = await loggedIn(c);
  if (!user) return error(c, 'Vui lòng đăng nhập', 401);
  const id = Number(c.req.param('id'));
  if (!Number.isSafeInteger(id) || id < 1) return error(c, 'ID không hợp lệ');
  const p = await c.env.DB.prepare('SELECT id FROM products WHERE id=?').bind(id).first();
  if (!p) return error(c, 'Không tìm thấy sản phẩm', 404);
  await c.env.DB.prepare('INSERT OR IGNORE INTO wishlists(customer_id,product_id) VALUES(?,?)')
    .bind(user.id, id)
    .run();
  return c.json({ ok: true });
});
commerce.delete('/wishlist/:id', async (c) => {
  const user = await loggedIn(c);
  if (!user) return error(c, 'Vui lòng đăng nhập', 401);
  await c.env.DB.prepare('DELETE FROM wishlists WHERE customer_id=? AND product_id=?')
    .bind(user.id, c.req.param('id'))
    .run();
  return c.json({ ok: true });
});
commerce.get('/my/orders', async (c) => {
  const user = await loggedIn(c);
  if (!user) return error(c, 'Vui lòng đăng nhập', 401);
  const r = await c.env.DB.prepare(
    'SELECT id,code,total,status,discount,voucher_code,created_at FROM orders WHERE customer_id=? ORDER BY id DESC LIMIT 100',
  )
    .bind(user.id)
    .all();
  return c.json({ orders: r.results });
});
commerce.get('/orders/lookup', async (c) => {
  const code = (c.req.query('code') || '').toUpperCase().trim();
  const phone = (c.req.query('phone') || '').trim();

  if (!code && !phone) {
    return error(c, 'Vui lòng cung cấp số điện thoại hoặc mã đơn hàng để tra cứu', 400);
  }

  if (code && !/^(ONE|VL|BK)-[A-Z0-9]{4,16}$/i.test(code)) {
    return error(c, 'Mã đơn hàng không đúng định dạng (ví dụ: ONE-XXXXXXXX)', 400);
  }

  let cleanPhone = '';
  if (phone) {
    cleanPhone = phone.replace(/[\s().-]/g, '');
    if (cleanPhone.length < 8 || cleanPhone.length > 15) {
      return error(c, 'Số điện thoại không hợp lệ (tối thiểu 8 chữ số)', 400);
    }
  }

  let ordersResult: any[] = [];

  if (code && cleanPhone) {
    const res = await c.env.DB.prepare(
      `SELECT id, code, customer_name, phone, address, note, total, status, discount, voucher_code, created_at 
       FROM orders 
       WHERE code = ? AND (phone = ? OR phone = ? OR replace(replace(phone, ' ', ''), '-', '') = ?)
       ORDER BY id DESC LIMIT 50`,
    )
      .bind(code, phone, cleanPhone, cleanPhone)
      .all<any>();
    ordersResult = res.results || [];
  } else if (cleanPhone) {
    const res = await c.env.DB.prepare(
      `SELECT id, code, customer_name, phone, address, note, total, status, discount, voucher_code, created_at 
       FROM orders 
       WHERE phone = ? OR phone = ? OR replace(replace(phone, ' ', ''), '-', '') = ? OR phone LIKE ?
       ORDER BY id DESC LIMIT 50`,
    )
      .bind(phone, cleanPhone, cleanPhone, `%${cleanPhone}%`)
      .all<any>();
    ordersResult = res.results || [];
  } else if (code) {
    const res = await c.env.DB.prepare(
      `SELECT id, code, customer_name, phone, address, note, total, status, discount, voucher_code, created_at 
       FROM orders 
       WHERE code = ? 
       ORDER BY id DESC LIMIT 50`,
    )
      .bind(code)
      .all<any>();
    ordersResult = res.results || [];
  }

  if (!ordersResult.length) {
    return c.json({ orders: [], message: 'Không tìm thấy đơn hàng nào khớp với thông tin đã nhập' });
  }

  // Lấy chi tiết danh sách sản phẩm (order_items) cho từng đơn hàng
  const orderIds = ordersResult.map((o) => o.id);
  const placeholders = orderIds.map(() => '?').join(',');
  const itemsRes = await c.env.DB.prepare(
    `SELECT oi.order_id, oi.product_id, oi.product_name, oi.size, oi.color, oi.quantity, oi.unit_price, p.image_key
     FROM order_items oi
     LEFT JOIN products p ON oi.product_id = p.id
     WHERE oi.order_id IN (${placeholders})`,
  )
    .bind(...orderIds)
    .all<any>();

  const itemsByOrder = new Map<number, any[]>();
  for (const item of itemsRes.results || []) {
    const arr = itemsByOrder.get(item.order_id) || [];
    arr.push({
      ...item,
      image_url: item.image_key ? `/api/images/${encodeURIComponent(item.image_key)}` : null,
    });
    itemsByOrder.set(item.order_id, arr);
  }

  const enrichedOrders = ordersResult.map((o) => ({
    ...o,
    items: itemsByOrder.get(o.id) || [],
  }));

  return c.json({
    orders: enrichedOrders,
    order: enrichedOrders[0] || null,
  });
});
commerce.get('/reviews/:productId', async (c) => {
  const rows = await c.env.DB.prepare(
    'SELECT r.rating,r.comment,r.created_at,c.name FROM reviews r JOIN customers c ON c.id=r.customer_id WHERE r.product_id=? ORDER BY r.id DESC LIMIT 50',
  )
    .bind(c.req.param('productId'))
    .all();
  return c.json({ reviews: rows.results });
});
commerce.post('/reviews/:productId', async (c) => {
  const user = await loggedIn(c);
  if (!user) return error(c, 'Vui lòng đăng nhập', 401);
  const body = z
    .object({ rating: z.number().int().min(1).max(5), comment: z.string().trim().max(1000) })
    .safeParse(await c.req.json().catch(() => null));
  if (!body.success) return error(c, 'Đánh giá không hợp lệ');
  const id = Number(c.req.param('productId'));
  const bought = await c.env.DB.prepare(
    `SELECT 1 FROM orders JOIN order_items ON orders.id=order_items.order_id WHERE orders.customer_id=? AND order_items.product_id=? AND orders.status='completed' LIMIT 1`,
  )
    .bind(user.id, id)
    .first();
  if (!bought) return error(c, 'Chỉ khách đã mua và hoàn tất đơn mới được đánh giá', 403);
  await c.env.DB.prepare(
    'INSERT INTO reviews(customer_id,product_id,rating,comment) VALUES(?,?,?,?) ON CONFLICT(customer_id,product_id) DO UPDATE SET rating=excluded.rating,comment=excluded.comment,created_at=CURRENT_TIMESTAMP',
  )
    .bind(user.id, id, body.data.rating, body.data.comment)
    .run();
  return c.json({ ok: true });
});
commerce.post('/vouchers/check', async (c) => {
  const body = z
    .object({ code: z.string().trim().max(30), subtotal: z.number().int().nonnegative() })
    .safeParse(await c.req.json().catch(() => null));
  if (!body.success) return error(c, 'Mã giảm giá hoặc tổng tiền không hợp lệ');
  const v = await c.env.DB.prepare(
    `SELECT * FROM vouchers WHERE code=? AND active=1 AND used_count<max_uses AND (expires_at IS NULL OR expires_at>datetime('now'))`,
  )
    .bind(body.data.code.toUpperCase())
    .first<any>();
  if (!v || body.data.subtotal < v.min_order)
    return error(c, 'Voucher không hợp lệ hoặc đơn hàng chưa đủ điều kiện');
  const discount = Math.min(
    body.data.subtotal,
    v.discount_type === 'percent'
      ? Math.floor((body.data.subtotal * v.discount_value) / 100)
      : v.discount_value,
  );
  return c.json({
    code: v.code,
    discount,
    subtotal: body.data.subtotal,
    total: body.data.subtotal - discount,
  });
});
commerce.get('/admin/customers', async (c) => {
  const user = await getAdminUser(c);
  if (!user) return error(c, 'Không có quyền', 401);
  const rows = await c.env.DB.prepare(
    'SELECT id,name,email,created_at FROM customers ORDER BY id DESC LIMIT 200',
  ).all();
  return c.json({ customers: rows.results });
});
commerce.get('/admin/overview', async (c) => {
  const user = await getAdminUser(c);
  if (!user) return error(c, 'Không có quyền', 401);
  const r = await c.env.DB.prepare(
    `SELECT (SELECT count(*) FROM products) products,(SELECT count(*) FROM customers) customers,(SELECT count(*) FROM orders) orders,(SELECT count(*) FROM orders WHERE status='pending') pending,(SELECT coalesce(sum(total),0) FROM orders WHERE status='completed') revenue,(SELECT count(*) FROM products WHERE stock<=5) low_stock`,
  ).first();
  return c.json({ overview: r });
});
commerce.get('/admin/vouchers', async (c) => {
  const user = await getAdminUser(c);
  if (!user) return error(c, 'Không có quyền', 401);
  const r = await c.env.DB.prepare('SELECT * FROM vouchers ORDER BY code').all();
  return c.json({ vouchers: r.results });
});
commerce.post('/admin/vouchers', async (c) => {
  const user = await getAdminUser(c);
  const writeErr = requireWritePermission(user);
  if (writeErr) return writeErr;
  if (!user) return error(c, 'Không có quyền', 401);
  const schema = z.object({
    code: z.string().regex(/^[A-Z0-9_-]{3,30}$/),
    discount_type: z.enum(['fixed', 'percent']),
    discount_value: z.number().int().positive(),
    min_order: z.number().int().nonnegative(),
    max_uses: z.number().int().positive(),
  });
  const input = schema.safeParse(await c.req.json().catch(() => null));
  if (!input.success) return error(c, 'Dữ liệu voucher không hợp lệ');
  const v = input.data;
  if (v.discount_type === 'percent' && v.discount_value > 100)
    return error(c, 'Phần trăm tối đa 100');
  try {
    await c.env.DB.prepare(
      'INSERT INTO vouchers(code,discount_type,discount_value,min_order,max_uses) VALUES(?,?,?,?,?)',
    )
      .bind(v.code, v.discount_type, v.discount_value, v.min_order, v.max_uses)
      .run();
    return c.json({ ok: true }, 201);
  } catch {
    return error(c, 'Mã voucher đã tồn tại', 409);
  }
});
commerce.patch('/admin/vouchers/:code', async (c) => {
  const user = await getAdminUser(c);
  const writeErr = requireWritePermission(user);
  if (writeErr) return writeErr;
  if (!user) return error(c, 'Không có quyền', 401);
  const body = z.object({ active: z.boolean() }).safeParse(await c.req.json().catch(() => null));
  if (!body.success) return error(c, 'Dữ liệu không hợp lệ');
  await c.env.DB.prepare('UPDATE vouchers SET active=? WHERE code=?')
    .bind(body.data.active ? 1 : 0, c.req.param('code'))
    .run();
  return c.json({ ok: true });
});
