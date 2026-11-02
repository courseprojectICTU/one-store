'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { api, money } from '@/lib/api';
import { Product, Order, KnowledgeDoc, Voucher, Customer } from '@/types';
import { useShop } from '@/context/ShopContext';
import Logo from './Logo';
import { ArrowLeft } from 'lucide-react';
import { COLORS } from '@/constants';

export default function AdminDashboard({ onBackToStore }: { onBackToStore: () => void }) {
  const { showToast, refreshProducts } = useShop();
  const [adminToken, setAdminToken] = useState('');
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [loading, setLoading] = useState(false);

  // Admin data
  const [adminProductsList, setAdminProductsList] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [knowledgeDocs, setKnowledgeDocs] = useState<KnowledgeDoc[]>([]);
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [overview, setOverview] = useState<any>(null);

  // Product form state
  const [editingId, setEditingId] = useState<number | null>(null);
  const [pName, setPName] = useState('');
  const [pSlug, setPSlug] = useState('');
  const [pCategory, setPCategory] = useState('Running');
  const [pDescription, setPDescription] = useState('');
  const [pPrice, setPPrice] = useState<number>(249000);
  const [pCompare, setPCompare] = useState<number | ''>('');
  const [pStock, setPStock] = useState<number>(20);
  const [pSizes, setPSizes] = useState('39,40,41,42,43,44');
  const [pColors, setPColors] = useState('Đen,Trắng');
  const [pImageFile, setPImageFile] = useState<File | null>(null);
  const [pFeatured, setPFeatured] = useState(false);
  const [savingProduct, setSavingProduct] = useState(false);

  // Knowledge form state
  const [kTitle, setKTitle] = useState('');
  const [kContent, setKContent] = useState('');
  const [savingKnowledge, setSavingKnowledge] = useState(false);

  const getHeaders = useCallback(() => {
    return {
      Authorization: `Bearer ${adminToken}`,
    };
  }, [adminToken]);

  const loadAdminData = useCallback(async () => {
    if (!adminToken) return;
    try {
      setLoading(true);
      const headers = getHeaders();
      const [prodRes, ordRes, knowRes, vouchRes, custRes, overRes] = await Promise.allSettled([
        api('/api/products'),
        api('/api/admin/orders', { headers }),
        api('/api/admin/knowledge', { headers }),
        api('/api/admin/vouchers', { headers }),
        api('/api/admin/customers', { headers }),
        api('/api/admin/overview', { headers }),
      ]);

      if (prodRes.status === 'fulfilled' && prodRes.value.products) {
        setAdminProductsList(prodRes.value.products);
      }
      if (ordRes.status === 'fulfilled' && ordRes.value.orders) {
        setOrders(ordRes.value.orders);
        setIsAuthorized(true);
      }
      if (knowRes.status === 'fulfilled' && Array.isArray(knowRes.value.documents)) {
        setKnowledgeDocs(knowRes.value.documents);
      }
      if (vouchRes.status === 'fulfilled' && Array.isArray(vouchRes.value.vouchers)) {
        setVouchers(vouchRes.value.vouchers);
      }
      if (custRes.status === 'fulfilled' && Array.isArray(custRes.value.customers)) {
        setCustomers(custRes.value.customers);
      }
      if (overRes.status === 'fulfilled' && overRes.value.overview) {
        setOverview(overRes.value.overview);
      }
    } catch (e: any) {
      showToast(e.message || 'Mã quản trị không hợp lệ');
    } finally {
      setLoading(false);
    }
  }, [adminToken, getHeaders, showToast]);

  const handleLoginAdmin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!adminToken || adminToken.length < 20) {
      showToast('ADMIN_TOKEN cần tối thiểu 20 ký tự');
      return;
    }
    await loadAdminData();
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingProduct(true);
      const headers = getHeaders();

      let imageKey: string | null = null;
      if (pImageFile) {
        const formData = new FormData();
        formData.append('file', pImageFile);
        const uploadRes = await fetch('/api/admin/images', {
          method: 'POST',
          headers: { Authorization: `Bearer ${adminToken}` },
          body: formData,
        });
        const uploadData = await uploadRes.json();
        if (uploadData.key) {
          imageKey = uploadData.key;
        }
      }

      const bodyData: any = {
        name: pName.trim(),
        slug: pSlug.trim(),
        category: pCategory.trim(),
        description: pDescription.trim(),
        price: Number(pPrice),
        compare_at_price: pCompare === '' ? null : Number(pCompare),
        stock: Number(pStock),
        sizes: pSizes.split(',').map((s) => s.trim()).filter(Boolean),
        colors: pColors.split(',').map((c) => c.trim()).filter(Boolean),
        featured: pFeatured,
      };

      if (imageKey) {
        bodyData.image_key = imageKey;
      }

      if (editingId) {
        await api(`/api/admin/products/${editingId}`, {
          method: 'PATCH',
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify(bodyData),
        });
        showToast('Cập nhật sản phẩm thành công!');
      } else {
        await api('/api/admin/products', {
          method: 'POST',
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify(bodyData),
        });
        showToast('Tạo mới sản phẩm thành công!');
      }

      resetProductForm();
      loadAdminData();
      refreshProducts();
    } catch (err: any) {
      showToast(err.message || 'Lỗi lưu sản phẩm');
    } finally {
      setSavingProduct(false);
    }
  };

  const resetProductForm = () => {
    setEditingId(null);
    setPName('');
    setPSlug('');
    setPCategory('Áo');
    setPDescription('');
    setPPrice(249000);
    setPCompare('');
    setPStock(20);
    setPSizes('S,M,L,XL');
    setPColors('Đen,Trắng');
    setPFeatured(false);
    setPImageFile(null);
  };

  const handleEditProduct = (p: Product) => {
    setEditingId(p.id);
    setPName(p.name);
    setPSlug(p.slug);
    setPCategory(p.category);
    setPDescription(p.description || '');
    setPPrice(p.price);
    setPCompare(p.compare_at_price ?? '');
    setPStock(p.stock);
    setPSizes(Array.isArray(p.sizes) ? p.sizes.join(',') : 'S,M,L,XL');
    setPColors(Array.isArray(p.colors) ? p.colors.join(',') : 'Đen,Trắng');
    setPFeatured(Boolean(p.featured));
    window.scrollTo({ top: 300, behavior: 'smooth' });
  };

  const handleDeleteProduct = async (id: number) => {
    if (!confirm('Bạn có chắc muốn xóa sản phẩm này không?')) return;
    try {
      await api(`/api/admin/products/${id}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });
      showToast('Đã xóa sản phẩm');
      loadAdminData();
      refreshProducts();
    } catch (e: any) {
      showToast(e.message || 'Không thể xóa sản phẩm đã có đơn hàng');
    }
  };

  const handleUpdateOrderStatus = async (orderId: number, status: string) => {
    try {
      await api(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: { ...getHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      showToast(`Đã chuyển trạng thái đơn sang: ${status}`);
      loadAdminData();
    } catch (e: any) {
      showToast(e.message || 'Lỗi cập nhật trạng thái đơn');
    }
  };

  const handleSaveKnowledge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!kTitle.trim() || !kContent.trim()) return;
    try {
      setSavingKnowledge(true);
      await api('/api/admin/knowledge', {
        method: 'POST',
        headers: { ...getHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: kTitle.trim(), content: kContent.trim() }),
      });
      showToast('Đã lưu và vector hóa tài liệu vào kho tri thức!');
      setKTitle('');
      setKContent('');
      loadAdminData();
    } catch (e: any) {
      showToast(e.message || 'Lỗi vector hóa tài liệu');
    } finally {
      setSavingKnowledge(false);
    }
  };

  const handleDeleteKnowledge = async (id: string) => {
    if (!confirm('Bạn có chắc muốn xóa tài liệu này khỏi kho tri thức?')) return;
    try {
      await api(`/api/admin/knowledge/${id}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });
      showToast('Đã xóa tài liệu tri thức');
      loadAdminData();
    } catch (e: any) {
      showToast(e.message || 'Lỗi khi xóa tài liệu');
    }
  };

  return (
    <div className="admin" id="admin">
      <a
        href="/"
        onClick={(e) => {
          e.preventDefault();
          onBackToStore();
        }}
        style={{ fontWeight: 700, color: COLORS.red.primary, display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '14px' }}
      >
        <ArrowLeft size={16} />
        <span>Trở về cửa hàng</span>
      </a>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
        <Logo size="sm" variant="icon" />
        <h1 style={{ margin: 0 }}>One - Store / Quản trị</h1>
      </div>
      <p className="dim">
        Nhập mã quản trị (ADMIN_TOKEN) để thao tác. Không chia sẻ mã này cho người khác.
      </p>

      <form
        onSubmit={handleLoginAdmin}
        style={{ display: 'flex', gap: '8px', maxWidth: '550px', marginBottom: '24px' }}
      >
        <input
          className="search"
          placeholder="ADMIN_TOKEN (>= 20 ký tự)"
          style={{ flex: 1 }}
          type="password"
          value={adminToken}
          onChange={(e) => setAdminToken(e.target.value)}
        />
        <button className="primary" type="submit" disabled={loading}>
          {loading ? 'Kiểm tra...' : 'Đăng nhập'}
        </button>
      </form>

      {isAuthorized && (
        <div id="adminArea">
          {/* Chatbot Knowledge Section */}
          <section className="panel" style={{ marginBottom: '24px' }}>
            <h2>Kho tri thức chatbot (RAG)</h2>
            <p className="dim">
              Thêm nội dung chính sách, hướng dẫn mua hàng hoặc thông tin thương hiệu để chatbot tra cứu.
            </p>
            <form className="form" onSubmit={handleSaveKnowledge} style={{ maxWidth: '760px' }}>
              <label>
                Tiêu đề tài liệu
                <input
                  maxLength={120}
                  required
                  value={kTitle}
                  onChange={(e) => setKTitle(e.target.value)}
                  placeholder="Ví dụ: Chính sách đổi trả hàng trong 7 ngày"
                />
              </label>
              <label>
                Nội dung
                <textarea
                  maxLength={20000}
                  minLength={20}
                  required
                  style={{ minHeight: '140px' }}
                  value={kContent}
                  onChange={(e) => setKContent(e.target.value)}
                  placeholder="Nhập chi tiết điều khoản chính sách, kích cỡ, chất liệu..."
                />
              </label>
              <button className="primary" type="submit" disabled={savingKnowledge}>
                {savingKnowledge ? 'ĐANG VECTOR HÓA...' : 'LƯU VÀ VECTOR HÓA'}
              </button>
            </form>

            <div className="knowledge-list" style={{ marginTop: '20px' }}>
              <h3>Tài liệu hiện có ({knowledgeDocs.length})</h3>
              {knowledgeDocs.length === 0 ? (
                <p className="dim">Chưa có tài liệu nào trong kho tri thức.</p>
              ) : (
                knowledgeDocs.map((doc) => (
                  <div key={doc.id} className="knowledge-row">
                    <div>
                      <strong>{doc.title}</strong>
                      <span className="dim" style={{ fontSize: '12px' }}>
                        Tạo lúc: {new Date(doc.created_at).toLocaleString('vi-VN')}
                      </span>
                    </div>
                    <button
                      className="smallbtn"
                      style={{ color: '#a54a47' }}
                      onClick={() => handleDeleteKnowledge(doc.id)}
                    >
                      Xóa
                    </button>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* 2-Column Admin Layout */}
          <div className="admin-layout">
            {/* Left: Product Form */}
            <div className="panel">
              <h2>{editingId ? `Sửa sản phẩm #${editingId}` : 'Thêm sản phẩm mới'}</h2>
              <form className="form" onSubmit={handleSaveProduct}>
                <label>
                  Tên sản phẩm
                  <input
                    required
                    value={pName}
                    onChange={(e) => {
                      setPName(e.target.value);
                      if (!editingId) {
                        setPSlug(
                          e.target.value
                            .toLowerCase()
                            .normalize('NFD')
                            .replace(/[\u0300-\u036f]/g, '')
                            .replace(/đ/g, 'd')
                            .replace(/[^a-z0-9]+/g, '-')
                            .replace(/^-|-$/g, '')
                        );
                      }
                    }}
                  />
                </label>
                <label>
                  Slug (đường dẫn URL)
                  <input
                    pattern="[a-z0-9-]+"
                    required
                    value={pSlug}
                    onChange={(e) => setPSlug(e.target.value)}
                  />
                </label>
                <label>
                  Danh mục
                  <input
                    required
                    value={pCategory}
                    onChange={(e) => setPCategory(e.target.value)}
                  />
                </label>
                <label>
                  Mô tả sản phẩm
                  <textarea
                    value={pDescription}
                    onChange={(e) => setPDescription(e.target.value)}
                  />
                </label>
                <label>
                  Giá bán (VND)
                  <input
                    min={0}
                    required
                    type="number"
                    value={pPrice}
                    onChange={(e) => setPPrice(Number(e.target.value))}
                  />
                </label>
                <label>
                  Giá gốc gạch ngang (tùy chọn)
                  <input
                    min={0}
                    type="number"
                    value={pCompare}
                    onChange={(e) => setPCompare(e.target.value === '' ? '' : Number(e.target.value))}
                  />
                </label>
                <label>
                  Số lượng tồn kho
                  <input
                    min={0}
                    required
                    type="number"
                    value={pStock}
                    onChange={(e) => setPStock(Number(e.target.value))}
                  />
                </label>
                <label>
                  Kích thước (phân cách bởi dấu phẩy)
                  <input
                    required
                    value={pSizes}
                    onChange={(e) => setPSizes(e.target.value)}
                  />
                </label>
                <label>
                  Màu sắc (phân cách bởi dấu phẩy)
                  <input
                    required
                    value={pColors}
                    onChange={(e) => setPColors(e.target.value)}
                  />
                </label>
                <label>
                  Tải ảnh sản phẩm (JPG/PNG/WebP, tối đa 5MB)
                  <input
                    accept="image/jpeg,image/png,image/webp"
                    type="file"
                    onChange={(e) => setPImageFile(e.target.files?.[0] || null)}
                  />
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    checked={pFeatured}
                    onChange={(e) => setPFeatured(e.target.checked)}
                    style={{ width: 'auto' }}
                    type="checkbox"
                  />
                  Sản phẩm nổi bật (Bán chạy)
                </label>
                <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                  <button className="primary" type="submit" disabled={savingProduct} style={{ flex: 1 }}>
                    {savingProduct ? 'ĐANG LƯU...' : editingId ? 'CẬP NHẬT SẢN PHẨM' : 'LƯU SẢN PHẨM'}
                  </button>
                  <button className="outline" onClick={resetProductForm} type="button">
                    Làm mới
                  </button>
                </div>
              </form>
            </div>

            {/* Right: Products List & Orders & Overview */}
            <div>
              <div className="panel">
                <h2>Danh sách sản phẩm ({adminProductsList.length})</h2>
                <div style={{ overflow: 'auto', maxHeight: '380px' }}>
                  <table className="admintable">
                    <thead>
                      <tr>
                        <th>Sản phẩm</th>
                        <th>Giá</th>
                        <th>Kho</th>
                        <th>Hành động</th>
                      </tr>
                    </thead>
                    <tbody>
                      {adminProductsList.map((p) => (
                        <tr key={p.id}>
                          <td>
                            <strong>{p.name}</strong>
                            <div className="dim">{p.category}</div>
                          </td>
                          <td>{money(p.price)}</td>
                          <td>{p.stock}</td>
                          <td>
                            <button
                              className="smallbtn"
                              onClick={() => handleEditProduct(p)}
                              style={{ marginRight: '6px' }}
                            >
                              Sửa
                            </button>
                            <button
                              className="smallbtn"
                              style={{ color: '#a54a47' }}
                              onClick={() => handleDeleteProduct(p.id)}
                            >
                              Xóa
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Advanced Overview */}
              {overview && (
                <div className="panel" style={{ marginTop: '22px' }}>
                  <h2>Thống kê tổng quan</h2>
                  <div className="overview-grid">
                    <div>
                      <span className="dim">Tổng đơn hàng</span>
                      <h3 style={{ margin: '4px 0 0' }}>{overview.total_orders || orders.length}</h3>
                    </div>
                    <div>
                      <span className="dim">Tổng doanh thu</span>
                      <h3 style={{ margin: '4px 0 0', color: '#27382b' }}>
                        {money(overview.total_revenue || 0)}
                      </h3>
                    </div>
                    <div>
                      <span className="dim">Số khách hàng</span>
                      <h3 style={{ margin: '4px 0 0' }}>{overview.total_customers || customers.length}</h3>
                    </div>
                    <div>
                      <span className="dim">Mã Voucher</span>
                      <h3 style={{ margin: '4px 0 0' }}>{vouchers.length}</h3>
                    </div>
                  </div>
                </div>
              )}

              {/* Latest Orders */}
              <div className="panel" style={{ marginTop: '22px' }}>
                <h2>Đơn hàng mới nhất ({orders.length})</h2>
                <div style={{ overflow: 'auto', maxHeight: '350px' }}>
                  <table className="admintable">
                    <thead>
                      <tr>
                        <th>Mã / Khách</th>
                        <th>Tổng tiền</th>
                        <th>Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map((o) => (
                        <tr key={o.id}>
                          <td>
                            <strong>{o.code}</strong>
                            <div className="dim">{o.customer_name} ({o.phone})</div>
                          </td>
                          <td>{money(o.total)}</td>
                          <td>
                            <select
                              value={o.status}
                              onChange={(e) => handleUpdateOrderStatus(o.id, e.target.value)}
                              style={{ padding: '4px', fontSize: '12px' }}
                            >
                              <option value="pending">Chờ xử lý (pending)</option>
                              <option value="confirmed">Đã duyệt (confirmed)</option>
                              <option value="shipping">Đang giao (shipping)</option>
                              <option value="completed">Hoàn tất (completed)</option>
                              <option value="cancelled">Đã hủy (cancelled)</option>
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
