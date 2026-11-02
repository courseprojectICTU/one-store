'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import {
  LayoutDashboard,
  PackageCheck,
  ShoppingBag,
  Users,
  Ticket,
  BrainCircuit,
  FileSpreadsheet,
  LogOut,
  Search,
  Filter,
  Plus,
  Edit2,
  Trash2,
  Eye,
  RefreshCw,
  ArrowLeft,
  Check,
  X,
  Download,
  Star,
  Target,
  AlertTriangle,
  UploadCloud,
  Clock,
  ShieldCheck,
  ExternalLink,
} from 'lucide-react';
import { api, money, formatDateTime } from '@/lib/api';
import { Product, Order, KnowledgeDoc, Voucher } from '@/types';
import Logo from '@/components/Logo';
import './admin.css';

type CustomerAnalytics = {
  phone: string;
  name: string;
  address: string;
  total_orders: number;
  completed_orders: number;
  total_spent: number;
  first_order_at: string;
  last_order_at: string;
  segment: 'VIP' | 'POTENTIAL' | 'NEW';
};

const BRANDS = [
  'Nike',
  'Adidas',
  'New Balance',
  'Puma',
  'Salomon',
  'Asics',
  'Onitsuka Tiger',
  'Mizuno',
  'Li-Ning',
  'Anta',
];

const CATEGORIES = ['Running', 'Lifestyle', 'Outdoor', 'Basketball'];
const AVAILABLE_SIZES = ['38', '39', '40', '41', '42', '43', '44', '45'];

export default function AdminPortalPage() {
  // === AUTH STATE ===
  const [adminToken, setAdminToken] = useState<string>('');
  const [adminUser, setAdminUser] = useState<any>(null);
  const [isAuthorized, setIsAuthorized] = useState<boolean>(false);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [loginUsername, setLoginUsername] = useState<string>('admin');
  const [loginPassword, setLoginPassword] = useState<string>('');
  const [loginError, setLoginError] = useState<string>('');
  const [loginSubmitting, setLoginSubmitting] = useState<boolean>(false);

  // === UI STATE ===
  const [activeTab, setActiveTab] = useState<
    'overview' | 'orders' | 'products' | 'customers' | 'vouchers' | 'knowledge' | 'reports'
  >('overview');
  const [currentTime, setCurrentTime] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<string>('');

  // === DATA STATE ===
  const [overview, setOverview] = useState<any>(null);
  const [revenueChart, setRevenueChart] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<CustomerAnalytics[]>([]);
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [knowledgeDocs, setKnowledgeDocs] = useState<KnowledgeDoc[]>([]);
  const [loadingData, setLoadingData] = useState<boolean>(false);

  // === ORDERS TAB FILTERS & MODAL ===
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('all');
  const [orderSearch, setOrderSearch] = useState<string>('');
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [updatingOrderStatus, setUpdatingOrderStatus] = useState<boolean>(false);

  // === PRODUCTS TAB FILTERS & FORM MODAL ===
  const [productBrandFilter, setProductBrandFilter] = useState<string>('all');
  const [productCategoryFilter, setProductCategoryFilter] = useState<string>('all');
  const [productSearch, setProductSearch] = useState<string>('');
  const [isProductModalOpen, setIsProductModalOpen] = useState<boolean>(false);
  const [editingProductId, setEditingProductId] = useState<number | null>(null);

  // Product Form
  const [pName, setPName] = useState<string>('');
  const [pSlug, setPSlug] = useState<string>('');
  const [pCategory, setPCategory] = useState<string>('Running');
  const [pDescription, setPDescription] = useState<string>('');
  const [pPrice, setPPrice] = useState<number>(2490000);
  const [pCompare, setPCompare] = useState<number | ''>('');
  const [pStock, setPStock] = useState<number>(20);
  const [pSizes, setPSizes] = useState<string[]>(['39', '40', '41', '42', '43']);
  const [pColors, setPColors] = useState<string>('Trắng Đen, Xanh Biển');
  const [pImageFile, setPImageFile] = useState<File | null>(null);
  const [pImagePreview, setPImagePreview] = useState<string | null>(null);
  const [pExistingImageKey, setPExistingImageKey] = useState<string | null>(null);
  const [pFeatured, setPFeatured] = useState<boolean>(false);
  const [savingProduct, setSavingProduct] = useState<boolean>(false);

  // === CUSTOMERS TAB FILTERS & MODAL ===
  const [customerSegmentFilter, setCustomerSegmentFilter] = useState<string>('all');
  const [customerSearch, setCustomerSearch] = useState<string>('');
  const [selectedCustomerOrders, setSelectedCustomerOrders] = useState<any[] | null>(null);
  const [selectedCustomerPhone, setSelectedCustomerPhone] = useState<string>('');

  // === VOUCHERS TAB FORM ===
  const [vCode, setVCode] = useState<string>('');
  const [vType, setVType] = useState<'percent' | 'fixed'>('percent');
  const [vValue, setVValue] = useState<number>(10);
  const [vMinOrder, setVMinOrder] = useState<number>(0);
  const [vMaxUses, setVMaxUses] = useState<number>(100);
  const [savingVoucher, setSavingVoucher] = useState<boolean>(false);

  // === KNOWLEDGE TAB FORM ===
  const [kTitle, setKTitle] = useState<string>('');
  const [kContent, setKContent] = useState<string>('');
  const [savingKnowledge, setSavingKnowledge] = useState<boolean>(false);

  // Toast helper
  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  }, []);

  // System clock
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleDateString('vi-VN', {
          weekday: 'short',
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }),
      );
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const getHeaders = useCallback(() => {
    return {
      Authorization: `Bearer ${adminToken}`,
    };
  }, [adminToken]);

  // Load all admin data
  const loadDashboardData = useCallback(async () => {
    if (!adminToken) return;
    setLoadingData(true);
    try {
      const headers = getHeaders();
      const [overRes, chartRes, topRes, ordRes, prodRes, custRes, vouchRes, knowRes] =
        await Promise.allSettled([
          api('/api/admin/analytics/overview', { headers }),
          api('/api/admin/analytics/revenue-chart', { headers }),
          api('/api/admin/analytics/top-products', { headers }),
          api('/api/admin/orders', { headers }),
          api('/api/products'),
          api('/api/admin/customers/analytics', { headers }),
          api('/api/admin/vouchers', { headers }),
          api('/api/admin/knowledge', { headers }),
        ]);

      if (overRes.status === 'fulfilled' && overRes.value.overview) {
        setOverview(overRes.value.overview);
      }
      if (chartRes.status === 'fulfilled' && Array.isArray(chartRes.value.chart)) {
        setRevenueChart(chartRes.value.chart);
      }
      if (topRes.status === 'fulfilled' && Array.isArray(topRes.value.topProducts)) {
        setTopProducts(topRes.value.topProducts);
      }
      if (ordRes.status === 'fulfilled' && Array.isArray(ordRes.value.orders)) {
        setOrders(ordRes.value.orders);
      }
      if (prodRes.status === 'fulfilled' && Array.isArray(prodRes.value.products)) {
        setProducts(prodRes.value.products);
      }
      if (custRes.status === 'fulfilled' && Array.isArray(custRes.value.customers)) {
        setCustomers(custRes.value.customers);
      }
      if (vouchRes.status === 'fulfilled' && Array.isArray(vouchRes.value.vouchers)) {
        setVouchers(vouchRes.value.vouchers);
      }
      if (knowRes.status === 'fulfilled' && Array.isArray(knowRes.value.documents)) {
        setKnowledgeDocs(knowRes.value.documents);
      }
    } catch (err: any) {
      showToast(err.message || 'Không thể tải toàn bộ dữ liệu quản trị');
    } finally {
      setLoadingData(false);
    }
  }, [adminToken, getHeaders, showToast]);

  // Verify auth session on mount
  useEffect(() => {
    const storedToken =
      typeof window !== 'undefined' ? localStorage.getItem('one:admin-token') || '' : '';

    if (!storedToken) {
      setAuthLoading(false);
      setIsAuthorized(false);
      return;
    }

    setAdminToken(storedToken);
    fetch('/api/admin/auth/me', {
      headers: { Authorization: `Bearer ${storedToken}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error('Hết hạn');
        return res.json();
      })
      .then((data) => {
        if (data.ok && data.user) {
          setAdminUser(data.user);
          setIsAuthorized(true);
        } else {
          setIsAuthorized(false);
        }
      })
      .catch(() => {
        if (typeof window !== 'undefined') localStorage.removeItem('one:admin-token');
        setIsAuthorized(false);
      })
      .finally(() => {
        setAuthLoading(false);
      });
  }, []);

  // When authorized, load data
  useEffect(() => {
    if (isAuthorized && adminToken) {
      loadDashboardData();
    }
  }, [isAuthorized, adminToken, loadDashboardData]);

  // Login handler
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoginSubmitting(true);
    try {
      const res = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          usernameOrEmail: loginUsername.trim(),
          password: loginPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'Đăng nhập không thành công');
      }

      const token = data.token;
      if (typeof window !== 'undefined') {
        localStorage.setItem('one:admin-token', token);
      }
      setAdminToken(token);
      setAdminUser(data.user);
      setIsAuthorized(true);
      showToast(`Chào mừng ${data.user.full_name} đăng nhập thành công`);
    } catch (err: any) {
      setLoginError(err.message || 'Lỗi kết nối máy chủ');
    } finally {
      setLoginSubmitting(false);
    }
  };

  // Logout handler
  const handleLogout = async () => {
    if (!confirm('Bạn có chắc muốn đăng xuất khỏi cổng quản trị?')) return;
    try {
      await fetch('/api/admin/auth/logout', {
        method: 'POST',
        headers: getHeaders(),
      });
    } catch {
      // Ignore
    }
    if (typeof window !== 'undefined') {
      localStorage.removeItem('one:admin-token');
    }
    setAdminToken('');
    setAdminUser(null);
    setIsAuthorized(false);
    showToast('Đã đăng xuất thành công');
  };

  // Order status update
  const handleUpdateOrderStatus = async (orderId: number, newStatus: string) => {
    setUpdatingOrderStatus(true);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { ...getHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || 'Lỗi cập nhật');

      showToast(`Đã cập nhật trạng thái đơn #${orderId} sang: ${newStatus}`);
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status: newStatus });
      }
      // Cập nhật mảng orders cục bộ
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus as any } : o)),
      );
      // Reload overview
      api('/api/admin/analytics/overview', { headers: getHeaders() }).then((r) => {
        if (r.overview) setOverview(r.overview);
      });
    } catch (err: any) {
      showToast(err.message || 'Không thể cập nhật trạng thái đơn');
    } finally {
      setUpdatingOrderStatus(false);
    }
  };

  // Open order detail modal
  const handleViewOrder = async (orderId: number) => {
    try {
      const res = await api(`/api/admin/orders/${orderId}`, { headers: getHeaders() });
      if (res.order) {
        setSelectedOrder(res.order);
      }
    } catch (err: any) {
      showToast(err.message || 'Lỗi tải chi tiết đơn hàng');
    }
  };

  // Open customer orders modal
  const handleViewCustomerOrders = async (phone: string) => {
    setSelectedCustomerPhone(phone);
    try {
      const res = await api(`/api/admin/customers/${encodeURIComponent(phone)}/orders`, {
        headers: getHeaders(),
      });
      if (Array.isArray(res.orders)) {
        setSelectedCustomerOrders(res.orders);
      }
    } catch (err: any) {
      showToast(err.message || 'Lỗi tải lịch sử đơn của khách hàng');
    }
  };

  // Product Form Handlers
  const handleOpenAddProduct = () => {
    setEditingProductId(null);
    setPName('');
    setPSlug('');
    setPCategory('Running');
    setPDescription('');
    setPPrice(2490000);
    setPCompare('');
    setPStock(20);
    setPSizes(['39', '40', '41', '42', '43']);
    setPColors('Trắng Đen, Xanh Biển');
    setPImageFile(null);
    setPImagePreview(null);
    setPExistingImageKey(null);
    setPFeatured(false);
    setIsProductModalOpen(true);
  };

  const handleOpenEditProduct = (p: Product) => {
    setEditingProductId(p.id);
    setPName(p.name);
    setPSlug(p.slug);
    setPCategory(p.category);
    setPDescription(p.description || '');
    setPPrice(p.price);
    setPCompare(p.compare_at_price ?? '');
    setPStock(p.stock);
    setPSizes(Array.isArray(p.sizes) ? p.sizes : ['39', '40', '41', '42', '43']);
    setPColors(Array.isArray(p.colors) ? p.colors.join(', ') : 'Trắng Đen');
    setPImageFile(null);
    setPImagePreview(p.image_key ? `/api/images/${encodeURIComponent(p.image_key)}` : null);
    setPExistingImageKey(p.image_key || null);
    setPFeatured(Boolean(p.featured));
    setIsProductModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pSizes.length === 0) {
      showToast('Vui lòng chọn ít nhất một kích cỡ giày');
      return;
    }
    setSavingProduct(true);
    try {
      let imageKey = pExistingImageKey;
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

      const colorsArr = pColors
        .split(',')
        .map((c) => c.trim())
        .filter(Boolean);

      const payload = {
        name: pName.trim(),
        slug: pSlug.trim(),
        category: pCategory.trim(),
        description: pDescription.trim(),
        price: Number(pPrice),
        compare_at_price: pCompare === '' ? null : Number(pCompare),
        stock: Number(pStock),
        sizes: pSizes,
        colors: colorsArr.length > 0 ? colorsArr : ['Trắng Đen'],
        featured: pFeatured,
        image_key: imageKey,
      };

      if (editingProductId) {
        await api(`/api/admin/products/${editingProductId}`, {
          method: 'PATCH',
          headers: { ...getHeaders(), 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        showToast(`Cập nhật sản phẩm #${editingProductId} thành công!`);
      } else {
        await api('/api/admin/products', {
          method: 'POST',
          headers: { ...getHeaders(), 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        showToast('Tạo mới sản phẩm sneaker thành công!');
      }

      setIsProductModalOpen(false);
      loadDashboardData();
    } catch (err: any) {
      showToast(err.message || 'Lỗi lưu sản phẩm');
    } finally {
      setSavingProduct(false);
    }
  };

  const handleDeleteProduct = async (id: number) => {
    if (!confirm('Bạn có chắc muốn xóa sản phẩm này khỏi cơ sở dữ liệu?')) return;
    try {
      await api(`/api/admin/products/${id}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });
      showToast('Đã xóa sản phẩm thành công');
      loadDashboardData();
    } catch (err: any) {
      showToast(err.message || 'Không thể xóa sản phẩm đã có đơn hàng');
    }
  };

  // Voucher Form
  const handleSaveVoucher = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingVoucher(true);
    try {
      await api('/api/admin/vouchers', {
        method: 'POST',
        headers: { ...getHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: vCode.toUpperCase().trim(),
          discount_type: vType,
          discount_value: Number(vValue),
          min_order: Number(vMinOrder),
          max_uses: Number(vMaxUses),
        }),
      });
      showToast(`Đã tạo mã giảm giá ${vCode.toUpperCase()} thành công!`);
      setVCode('');
      loadDashboardData();
    } catch (err: any) {
      showToast(err.message || 'Lỗi tạo mã giảm giá');
    } finally {
      setSavingVoucher(false);
    }
  };

  const handleToggleVoucher = async (code: string, currentActive: number) => {
    try {
      await api(`/api/admin/vouchers/${encodeURIComponent(code)}`, {
        method: 'PATCH',
        headers: { ...getHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !currentActive }),
      });
      showToast(`Đã ${currentActive ? 'vô hiệu hóa' : 'kích hoạt'} mã ${code}`);
      loadDashboardData();
    } catch (err: any) {
      showToast(err.message || 'Lỗi đổi trạng thái voucher');
    }
  };

  // Knowledge Form
  const handleSaveKnowledge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!kTitle.trim() || !kContent.trim()) return;
    setSavingKnowledge(true);
    try {
      await api('/api/admin/knowledge', {
        method: 'POST',
        headers: { ...getHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: kTitle.trim(), content: kContent.trim() }),
      });
      showToast('Đã lưu và vector hóa tài liệu vào kho tri thức!');
      setKTitle('');
      setKContent('');
      loadDashboardData();
    } catch (err: any) {
      showToast(err.message || 'Lỗi vector hóa tài liệu');
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
      loadDashboardData();
    } catch (err: any) {
      showToast(err.message || 'Lỗi khi xóa tài liệu');
    }
  };

  // Filtered Orders
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const matchStatus = orderStatusFilter === 'all' || o.status === orderStatusFilter;
      const s = orderSearch.toLowerCase();
      const matchSearch =
        !s ||
        o.code.toLowerCase().includes(s) ||
        o.phone.toLowerCase().includes(s) ||
        o.customer_name.toLowerCase().includes(s);
      return matchStatus && matchSearch;
    });
  }, [orders, orderStatusFilter, orderSearch]);

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchBrand =
        productBrandFilter === 'all' ||
        p.name.toLowerCase().includes(productBrandFilter.toLowerCase()) ||
        p.category.toLowerCase().includes(productBrandFilter.toLowerCase());
      const matchCategory =
        productCategoryFilter === 'all' || p.category.toLowerCase() === productCategoryFilter.toLowerCase();
      const s = productSearch.toLowerCase();
      const matchSearch =
        !s || p.name.toLowerCase().includes(s) || p.slug.toLowerCase().includes(s);
      return matchBrand && matchCategory && matchSearch;
    });
  }, [products, productBrandFilter, productCategoryFilter, productSearch]);

  // Filtered Customers
  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      const matchSegment =
        customerSegmentFilter === 'all' || c.segment === customerSegmentFilter;
      const s = customerSearch.toLowerCase();
      const matchSearch =
        !s || c.name.toLowerCase().includes(s) || c.phone.toLowerCase().includes(s);
      return matchSegment && matchSearch;
    });
  }, [customers, customerSegmentFilter, customerSearch]);

  // Export report download trigger
  const handleExport = (type: 'orders' | 'products' | 'customers') => {
    const url = `/api/admin/export/${type}`;
    // Tải thông qua fetch kèm header Authorization
    fetch(url, { headers: getHeaders() })
      .then((res) => {
        if (!res.ok) throw new Error('Không có quyền xuất dữ liệu');
        return res.blob();
      })
      .then((blob) => {
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = `${type}_report_${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(downloadUrl);
        showToast(`Đã xuất báo cáo ${type}.csv thành công`);
      })
      .catch((err) => {
        showToast(err.message || 'Lỗi xuất báo cáo');
      });
  };

  // Helper render status badge
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="admin-badge admin-badge-pending">Chờ xử lý</span>;
      case 'confirmed':
        return <span className="admin-badge admin-badge-confirmed">Đã duyệt</span>;
      case 'shipping':
        return <span className="admin-badge admin-badge-shipping">Đang giao</span>;
      case 'completed':
        return <span className="admin-badge admin-badge-completed">Hoàn tất</span>;
      case 'cancelled':
        return <span className="admin-badge admin-badge-cancelled">Đã hủy</span>;
      default:
        return <span className="admin-badge">{status}</span>;
    }
  };

  // Helper render customer segment badge
  const renderSegmentBadge = (segment: string) => {
    switch (segment) {
      case 'VIP':
        return (
          <span className="admin-badge admin-badge-vip">
            <Star size={11} fill="#b45309" /> Khách VIP
          </span>
        );
      case 'POTENTIAL':
        return (
          <span className="admin-badge admin-badge-potential">
            <Target size={11} /> Tiềm năng
          </span>
        );
      default:
        return <span className="admin-badge admin-badge-new">Khách mới</span>;
    }
  };

  /* ==========================================================================
     RENDER: LOADING
     ========================================================================== */
  if (authLoading) {
    return (
      <div className="admin-login-wrap">
        <div style={{ color: '#ffffff', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <RefreshCw size={20} className="spin" />
          <span>Đang kiểm tra phiên làm việc...</span>
        </div>
      </div>
    );
  }

  /* ==========================================================================
     RENDER: LOGIN SCREEN (CỔNG RIÊNG KHÔNG DÙNG TOKEN)
     ========================================================================== */
  if (!isAuthorized) {
    return (
      <div className="admin-login-wrap">
        <div className="admin-login-box">
          <div className="admin-login-header">
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px' }}>
              <Logo size="md" variant="full" />
            </div>
            <div className="admin-login-badge">PORTAL QUẢN TRỊ VIÊN HỆ THỐNG</div>
            <p style={{ color: '#64748b', fontSize: '13px', margin: '8px 0 0' }}>
              Đăng nhập tài khoản & mật khẩu để truy cập
            </p>
          </div>

          {loginError && <div className="admin-login-error">{loginError}</div>}

          <form onSubmit={handleLogin}>
            <div className="admin-form-group">
              <label>Tài khoản / Email</label>
              <input
                className="admin-input"
                type="text"
                required
                autoComplete="username"
                value={loginUsername}
                onChange={(e) => setLoginUsername(e.target.value)}
                placeholder="Ví dụ: admin hoặc admin@one.store"
              />
            </div>

            <div className="admin-form-group">
              <label>Mật khẩu</label>
              <input
                className="admin-input"
                type="password"
                required
                autoComplete="current-password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="Nhập mật khẩu..."
              />
            </div>

            <button className="admin-btn-primary" type="submit" disabled={loginSubmitting}>
              {loginSubmitting ? (
                <>
                  <RefreshCw size={16} className="spin" />
                  <span>ĐANG XÁC THỰC...</span>
                </>
              ) : (
                <>
                  <ShieldCheck size={16} />
                  <span>ĐĂNG NHẬP HỆ THỐNG</span>
                </>
              )}
            </button>
          </form>

          <div style={{ marginTop: '24px', textAlign: 'center' }}>
            <Link
              href="/"
              style={{
                color: '#64748b',
                fontSize: '12px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                textDecoration: 'none',
              }}
            >
              <ArrowLeft size={14} />
              <span>Trở về trang web bán hàng</span>
            </Link>
          </div>
        </div>

        {toastMessage && (
          <div
            style={{
              position: 'fixed',
              bottom: '24px',
              right: '24px',
              background: '#0f172a',
              color: '#ffffff',
              padding: '12px 20px',
              borderRadius: '6px',
              boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
              fontSize: '13px',
              fontWeight: 600,
              zIndex: 9999,
            }}
          >
            {toastMessage}
          </div>
        )}
      </div>
    );
  }

  /* ==========================================================================
     RENDER: DEDICATED ADMIN HUB CONSOLE (CỨNG CÁP, TỐI GIẢN, TRỰC QUAN)
     ========================================================================== */
  return (
    <div className="admin-viewport">
      <div className="admin-shell">
        {/* === SIDEBAR CỐ ĐỊNH BÊN TRÁI === */}
        <aside className="admin-sidebar">
          <div className="admin-sidebar-brand">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Logo size="sm" variant="icon" />
              <div>
                <strong style={{ fontSize: '15px', color: '#0f172a' }}>ONE - STORE</strong>
                <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 700, letterSpacing: '0.04em' }}>
                  ADMIN PORTAL HUB
                </div>
              </div>
            </div>
          </div>

          <div className="admin-sidebar-menu">
            <button
              className={`admin-menu-item ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              <LayoutDashboard size={18} />
              <span>Tổng quan & Báo cáo</span>
            </button>

            <button
              className={`admin-menu-item ${activeTab === 'orders' ? 'active' : ''}`}
              onClick={() => setActiveTab('orders')}
            >
              <PackageCheck size={18} />
              <span>Quản lý Đơn hàng</span>
              {overview?.pending_orders > 0 && (
                <span
                  style={{
                    marginLeft: 'auto',
                    background: '#e11d48',
                    color: '#fff',
                    borderRadius: '10px',
                    padding: '1px 6px',
                    fontSize: '10px',
                    fontWeight: 800,
                  }}
                >
                  {overview.pending_orders}
                </span>
              )}
            </button>

            <button
              className={`admin-menu-item ${activeTab === 'products' ? 'active' : ''}`}
              onClick={() => setActiveTab('products')}
            >
              <ShoppingBag size={18} />
              <span>Quản lý Sản phẩm</span>
            </button>

            <button
              className={`admin-menu-item ${activeTab === 'customers' ? 'active' : ''}`}
              onClick={() => setActiveTab('customers')}
            >
              <Users size={18} />
              <span>Khách hàng & Tiềm năng</span>
            </button>

            <button
              className={`admin-menu-item ${activeTab === 'vouchers' ? 'active' : ''}`}
              onClick={() => setActiveTab('vouchers')}
            >
              <Ticket size={18} />
              <span>Mã Giảm Giá (Vouchers)</span>
            </button>

            <button
              className={`admin-menu-item ${activeTab === 'knowledge' ? 'active' : ''}`}
              onClick={() => setActiveTab('knowledge')}
            >
              <BrainCircuit size={18} />
              <span>Kho Tri Thức AI RAG</span>
            </button>

            <button
              className={`admin-menu-item ${activeTab === 'reports' ? 'active' : ''}`}
              onClick={() => setActiveTab('reports')}
            >
              <FileSpreadsheet size={18} />
              <span>Xuất Báo Cáo Dữ Liệu</span>
            </button>
          </div>

          <div className="admin-sidebar-user">
            <div className="admin-user-info">
              <div className="admin-user-avatar">
                {adminUser?.username?.[0]?.toUpperCase() || 'A'}
              </div>
              <div>
                <strong style={{ fontSize: '13px', color: '#0f172a', display: 'block' }}>
                  {adminUser?.full_name || 'Quản Trị Viên'}
                </strong>
                <span style={{ fontSize: '11px', color: '#64748b' }}>
                  {adminUser?.role === 'superadmin' ? 'Quản trị viên cấp cao' : 'Nhân viên'}
                </span>
              </div>
            </div>
            <button
              className="admin-btn admin-btn-outline admin-btn-sm"
              title="Đăng xuất"
              onClick={handleLogout}
              style={{ color: '#dc2626', borderColor: '#fca5a5' }}
            >
              <LogOut size={14} />
            </button>
          </div>
        </aside>

        {/* === MAIN CONTENT VÙNG PHẢI === */}
        <main className="admin-main">
          {/* Top Bar */}
          <header className="admin-topbar">
            <div className="admin-breadcrumb">
              <span>HỆ THỐNG QUẢN TRỊ</span>
              <span>/</span>
              <span className="current">
                {activeTab === 'overview' && 'TỔNG QUAN & BÁO CÁO'}
                {activeTab === 'orders' && 'QUẢN LÝ ĐƠN HÀNG'}
                {activeTab === 'products' && 'QUẢN LÝ SẢN PHẨM SNEAKER'}
                {activeTab === 'customers' && 'KHÁCH HÀNG & PHÂN KHÚC TIỀM NĂNG'}
                {activeTab === 'vouchers' && 'QUẢN LÝ MÃ GIẢM GIÁ'}
                {activeTab === 'knowledge' && 'KHO TRI THỨC AI RAG'}
                {activeTab === 'reports' && 'XUẤT BÁO CÁO DỮ LIỆU'}
              </span>
            </div>

            <div className="admin-topbar-actions">
              <div className="admin-clock">
                <Clock size={12} style={{ display: 'inline', marginRight: '4px' }} />
                <span>{currentTime || 'Đang đồng bộ...'}</span>
              </div>

              <button
                className="admin-btn admin-btn-outline admin-btn-sm"
                onClick={loadDashboardData}
                disabled={loadingData}
                title="Làm mới dữ liệu"
              >
                <RefreshCw size={14} className={loadingData ? 'spin' : ''} />
                <span>LÀM MỚI</span>
              </button>

              <Link
                href="/"
                target="_blank"
                className="admin-btn admin-btn-outline admin-btn-sm"
                title="Xem trang web bán hàng trong tab mới"
                style={{ textDecoration: 'none' }}
              >
                <ExternalLink size={14} />
                <span>XEM CỬA HÀNG</span>
              </Link>
            </div>
          </header>

          {/* Content Canvas */}
          <div className="admin-content">
            {/* ==========================================================
                TAB 1: TỔNG QUAN (OVERVIEW)
               ========================================================== */}
            {activeTab === 'overview' && (
              <div>
                {/* KPI Metrics */}
                <div className="admin-kpi-grid">
                  <div className="admin-kpi-card">
                    <div className="admin-kpi-label">DOANH THU THỰC TẾ (HOÀN TẤT)</div>
                    <div className="admin-kpi-value" style={{ color: '#047857' }}>
                      {money(overview?.total_revenue || 0)}
                    </div>
                    <div className="admin-kpi-sub">
                      {overview?.completed_orders || 0} đơn giao thành công
                    </div>
                  </div>

                  <div className="admin-kpi-card">
                    <div className="admin-kpi-label">TỔNG SỐ ĐƠN HÀNG</div>
                    <div className="admin-kpi-value">{overview?.total_orders || 0}</div>
                    <div className="admin-kpi-sub">
                      <span style={{ color: '#b45309', fontWeight: 700 }}>
                        {overview?.pending_orders || 0} chờ duyệt
                      </span>{' '}
                      · {overview?.shipping_orders || 0} đang giao
                    </div>
                  </div>

                  <div className="admin-kpi-card">
                    <div className="admin-kpi-label">GIÁ TRỊ TRUNG BÌNH ĐƠN (AOV)</div>
                    <div className="admin-kpi-value">{money(overview?.aov || 0)}</div>
                    <div className="admin-kpi-sub">Trên mỗi đơn hoàn tất</div>
                  </div>

                  <div className="admin-kpi-card">
                    <div className="admin-kpi-label">SỐ LƯỢNG KHÁCH HÀNG</div>
                    <div className="admin-kpi-value">{overview?.total_customers || 0}</div>
                    <div className="admin-kpi-sub">Khách hàng từng đặt hàng</div>
                  </div>
                </div>

                {/* Biểu đồ Doanh Thu & Cơ cấu Trạng Thái */}
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', marginBottom: '24px' }}>
                  {/* Biểu đồ Cột Doanh Thu 14 ngày */}
                  <div className="admin-card">
                    <div className="admin-card-header">
                      <h3 className="admin-card-title">XU HƯỚNG DOANH THU 14 NGÀY GẦN NHẤT</h3>
                      <span style={{ fontSize: '12px', color: '#64748b' }}>Đơn hàng hoàn tất</span>
                    </div>

                    <div style={{ height: '220px', display: 'flex', alignItems: 'flex-end', gap: '10px', paddingTop: '20px' }}>
                      {revenueChart.length === 0 ? (
                        <div style={{ width: '100%', textAlign: 'center', color: '#94a3b8', margin: 'auto' }}>
                          Chưa có phát sinh doanh thu trong 14 ngày qua
                        </div>
                      ) : (
                        revenueChart.map((d, idx) => {
                          const maxRev = Math.max(...revenueChart.map((c) => c.revenue || 1), 1000000);
                          const heightPct = Math.max(8, Math.round(((d.revenue || 0) / maxRev) * 100));
                          return (
                            <div
                              key={idx}
                              style={{
                                flex: 1,
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                height: '100%',
                                justifyContent: 'flex-end',
                              }}
                            >
                              <span style={{ fontSize: '10px', color: '#64748b', marginBottom: '4px' }}>
                                {d.revenue > 0 ? (d.revenue / 1000000).toFixed(1) + 'M' : '0'}
                              </span>
                              <div
                                className="admin-chart-bar"
                                style={{
                                  width: '100%',
                                  maxWidth: '36px',
                                  height: `${heightPct}%`,
                                  background: d.revenue > 0 ? '#0f172a' : '#e2e8f0',
                                  borderRadius: '4px 4px 0 0',
                                }}
                                title={`${d.date}: ${money(d.revenue || 0)} (${d.completed_orders || 0} đơn)`}
                              />
                              <span style={{ fontSize: '10px', color: '#64748b', marginTop: '6px' }}>
                                {d.date?.slice(5)}
                              </span>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                  {/* Phân bổ Trạng thái Đơn hàng */}
                  <div className="admin-card">
                    <div className="admin-card-header">
                      <h3 className="admin-card-title">CƠ CẤU TRẠNG THÁI ĐƠN</h3>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {[
                        { label: 'Chờ xử lý', key: 'pending_orders', color: '#f59e0b', count: overview?.pending_orders || 0 },
                        { label: 'Đã duyệt', key: 'confirmed_orders', color: '#3b82f6', count: overview?.confirmed_orders || 0 },
                        { label: 'Đang giao', key: 'shipping_orders', color: '#8b5cf6', count: overview?.shipping_orders || 0 },
                        { label: 'Hoàn tất', key: 'completed_orders', color: '#10b981', count: overview?.completed_orders || 0 },
                        { label: 'Đã hủy', key: 'cancelled_orders', color: '#ef4444', count: overview?.cancelled_orders || 0 },
                      ].map((st, i) => {
                        const total = overview?.total_orders || 1;
                        const pct = Math.round((st.count / total) * 100);
                        return (
                          <div key={i}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                              <span style={{ fontWeight: 600, color: '#334155' }}>{st.label}</span>
                              <strong>
                                {st.count} ({pct}%)
                              </strong>
                            </div>
                            <div style={{ height: '7px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                              <div style={{ width: `${pct}%`, height: '100%', background: st.color }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Top 5 Sản phẩm Bán Chạy Nhất */}
                <div className="admin-card">
                  <div className="admin-card-header">
                    <h3 className="admin-card-title">TOP SẢN PHẨM BÁN CHẠY NHẤT</h3>
                    <button
                      className="admin-btn admin-btn-outline admin-btn-sm"
                      onClick={() => setActiveTab('products')}
                    >
                      XEM TOÀN BỘ SẢN PHẨM
                    </button>
                  </div>

                  <div className="admin-table-wrap">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Xếp hạng</th>
                          <th>Mẫu Sneaker</th>
                          <th>Phân loại</th>
                          <th>Đã bán</th>
                          <th>Doanh thu mang lại</th>
                        </tr>
                      </thead>
                      <tbody>
                        {topProducts.length === 0 ? (
                          <tr>
                            <td colSpan={5} style={{ textAlign: 'center', color: '#64748b', padding: '24px' }}>
                              Chưa có dữ liệu sản phẩm bán ra
                            </td>
                          </tr>
                        ) : (
                          topProducts.slice(0, 5).map((tp, idx) => (
                            <tr key={idx}>
                              <td style={{ fontWeight: 800, color: idx === 0 ? '#b45309' : '#0f172a' }}>
                                #{idx + 1}
                              </td>
                              <td>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                  {tp.image_url ? (
                                    <img
                                      src={tp.image_url}
                                      alt={tp.product_name}
                                      style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #e2e8f0' }}
                                    />
                                  ) : (
                                    <div style={{ width: '40px', height: '40px', background: '#f1f5f9', borderRadius: '4px' }} />
                                  )}
                                  <strong>{tp.product_name}</strong>
                                </div>
                              </td>
                              <td>{tp.category}</td>
                              <td style={{ fontWeight: 700 }}>{tp.total_sold} đôi</td>
                              <td style={{ fontWeight: 700, color: '#047857' }}>{money(tp.total_revenue)}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* ==========================================================
                TAB 2: QUẢN LÝ ĐƠN HÀNG (ORDERS)
               ========================================================== */}
            {activeTab === 'orders' && (
              <div>
                {/* Toolbar */}
                <div className="admin-toolbar">
                  <div className="admin-filter-group">
                    {[
                      { id: 'all', label: 'Tất cả' },
                      { id: 'pending', label: 'Chờ xử lý' },
                      { id: 'confirmed', label: 'Đã duyệt' },
                      { id: 'shipping', label: 'Đang giao' },
                      { id: 'completed', label: 'Hoàn tất' },
                      { id: 'cancelled', label: 'Đã hủy' },
                    ].map((f) => (
                      <button
                        key={f.id}
                        className={`admin-filter-btn ${orderStatusFilter === f.id ? 'active' : ''}`}
                        onClick={() => setOrderStatusFilter(f.id)}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ position: 'relative' }}>
                      <input
                        className="admin-search-input"
                        placeholder="Tìm mã đơn, SĐT, tên khách..."
                        value={orderSearch}
                        onChange={(e) => setOrderSearch(e.target.value)}
                      />
                    </div>
                    <button
                      className="admin-btn admin-btn-outline"
                      onClick={() => handleExport('orders')}
                    >
                      <Download size={14} />
                      <span>XUẤT EXCEL/CSV</span>
                    </button>
                  </div>
                </div>

                {/* Orders Table */}
                <div className="admin-table-wrap">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Mã đơn</th>
                        <th>Thời gian</th>
                        <th>Khách hàng & SĐT</th>
                        <th>Địa chỉ giao hàng</th>
                        <th>Số món</th>
                        <th>Tổng tiền</th>
                        <th>Trạng thái</th>
                        <th>Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredOrders.length === 0 ? (
                        <tr>
                          <td colSpan={8} style={{ textAlign: 'center', color: '#64748b', padding: '36px' }}>
                            Không tìm thấy đơn hàng nào phù hợp với bộ lọc
                          </td>
                        </tr>
                      ) : (
                        filteredOrders.map((o) => (
                          <tr key={o.id}>
                            <td style={{ fontWeight: 800, fontFamily: 'monospace', color: '#0f172a' }}>
                              {o.code}
                            </td>
                            <td style={{ fontSize: '12px', color: '#64748b' }}>
                              {formatDateTime(o.created_at, 'vi-VN')}
                            </td>
                            <td>
                              <strong>{o.customer_name}</strong>
                              <div style={{ fontSize: '12px', color: '#64748b' }}>{o.phone}</div>
                            </td>
                            <td style={{ maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={o.address}>
                              {o.address}
                            </td>
                            <td style={{ fontWeight: 600 }}>{o.total_items || 1} đôi</td>
                            <td style={{ fontWeight: 800, color: '#0f172a' }}>{money(o.total)}</td>
                            <td>{renderStatusBadge(o.status)}</td>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <button
                                  className="admin-btn admin-btn-outline admin-btn-sm"
                                  onClick={() => handleViewOrder(o.id)}
                                >
                                  <Eye size={12} />
                                  <span>Chi tiết</span>
                                </button>
                                <select
                                  value={o.status}
                                  onChange={(e) => handleUpdateOrderStatus(o.id, e.target.value)}
                                  disabled={updatingOrderStatus}
                                  style={{
                                    padding: '4px 6px',
                                    fontSize: '11px',
                                    borderRadius: '4px',
                                    border: '1px solid #cbd5e1',
                                    outline: 'none',
                                    background: '#ffffff',
                                    cursor: 'pointer',
                                  }}
                                >
                                  <option value="pending">Chờ xử lý</option>
                                  <option value="confirmed">Đã duyệt</option>
                                  <option value="shipping">Đang giao</option>
                                  <option value="completed">Hoàn tất</option>
                                  <option value="cancelled">Hủy đơn</option>
                                </select>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ==========================================================
                TAB 3: QUẢN LÝ SẢN PHẨM (PRODUCTS)
               ========================================================== */}
            {activeTab === 'products' && (
              <div>
                {/* Toolbar */}
                <div className="admin-toolbar">
                  <div className="admin-filter-group">
                    {/* Brand Filter */}
                    <select
                      value={productBrandFilter}
                      onChange={(e) => setProductBrandFilter(e.target.value)}
                      style={{
                        padding: '6px 10px',
                        borderRadius: '5px',
                        border: '1px solid #cbd5e1',
                        fontSize: '12px',
                        fontWeight: 600,
                        background: '#fff',
                      }}
                    >
                      <option value="all">Tất cả thương hiệu (10 hãng)</option>
                      {BRANDS.map((b) => (
                        <option key={b} value={b}>
                          {b}
                        </option>
                      ))}
                    </select>

                    {/* Category Filter */}
                    <select
                      value={productCategoryFilter}
                      onChange={(e) => setProductCategoryFilter(e.target.value)}
                      style={{
                        padding: '6px 10px',
                        borderRadius: '5px',
                        border: '1px solid #cbd5e1',
                        fontSize: '12px',
                        fontWeight: 600,
                        background: '#fff',
                      }}
                    >
                      <option value="all">Tất cả phân khúc</option>
                      {CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>

                    <input
                      className="admin-search-input"
                      placeholder="Tìm tên sản phẩm, slug..."
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      className="admin-btn admin-btn-outline"
                      onClick={() => handleExport('products')}
                    >
                      <Download size={14} />
                      <span>XUẤT EXCEL/CSV</span>
                    </button>
                    <button className="admin-btn admin-btn-dark" onClick={handleOpenAddProduct}>
                      <Plus size={14} />
                      <span>THÊM SẢN PHẨM MỚI</span>
                    </button>
                  </div>
                </div>

                {/* Products Table */}
                <div className="admin-table-wrap">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Hình ảnh</th>
                        <th>Tên sản phẩm Sneaker</th>
                        <th>Hãng / Phân khúc</th>
                        <th>Giá bán</th>
                        <th>Giá so sánh</th>
                        <th>Tồn kho</th>
                        <th>Nổi bật</th>
                        <th>Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredProducts.length === 0 ? (
                        <tr>
                          <td colSpan={9} style={{ textAlign: 'center', color: '#64748b', padding: '36px' }}>
                            Không tìm thấy sản phẩm nào phù hợp
                          </td>
                        </tr>
                      ) : (
                        filteredProducts.map((p) => {
                          const imgUrl = p.image_key ? `/api/images/${encodeURIComponent(p.image_key)}` : null;
                          return (
                            <tr key={p.id}>
                              <td style={{ color: '#64748b', fontWeight: 600 }}>#{p.id}</td>
                              <td>
                                {imgUrl ? (
                                  <img
                                    src={imgUrl}
                                    alt={p.name}
                                    style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #e2e8f0' }}
                                  />
                                ) : (
                                  <div style={{ width: '48px', height: '48px', background: '#f1f5f9', borderRadius: '4px' }} />
                                )}
                              </td>
                              <td>
                                <strong>{p.name}</strong>
                                <div style={{ fontSize: '11px', color: '#64748b' }}>{p.slug}</div>
                              </td>
                              <td>
                                <span style={{ fontWeight: 600, color: '#0f172a' }}>{p.category}</span>
                              </td>
                              <td style={{ fontWeight: 800, color: '#047857' }}>{money(p.price)}</td>
                              <td style={{ color: '#94a3b8', textDecoration: 'line-through' }}>
                                {p.compare_at_price ? money(p.compare_at_price) : '-'}
                              </td>
                              <td>
                                <span
                                  style={{
                                    fontWeight: 700,
                                    color: p.stock <= 5 ? '#dc2626' : '#0f172a',
                                  }}
                                >
                                  {p.stock} đôi
                                </span>
                              </td>
                              <td>
                                {p.featured ? (
                                  <span className="admin-badge admin-badge-vip">Bán chạy</span>
                                ) : (
                                  <span style={{ color: '#94a3b8', fontSize: '12px' }}>Thường</span>
                                )}
                              </td>
                              <td>
                                <div style={{ display: 'flex', gap: '6px' }}>
                                  <button
                                    className="admin-btn admin-btn-outline admin-btn-sm"
                                    onClick={() => handleOpenEditProduct(p)}
                                    title="Chỉnh sửa sản phẩm"
                                  >
                                    <Edit2 size={12} />
                                    <span>Sửa</span>
                                  </button>
                                  <button
                                    className="admin-btn admin-btn-outline admin-btn-sm"
                                    onClick={() => handleDeleteProduct(p.id)}
                                    style={{ color: '#dc2626', borderColor: '#fca5a5' }}
                                    title="Xóa sản phẩm"
                                  >
                                    <Trash2 size={12} />
                                    <span>Xóa</span>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ==========================================================
                TAB 4: KHÁCH HÀNG & PHÂN TÍCH TIỀM NĂNG (CUSTOMERS)
               ========================================================== */}
            {activeTab === 'customers' && (
              <div>
                {/* Toolbar */}
                <div className="admin-toolbar">
                  <div className="admin-filter-group">
                    {[
                      { id: 'all', label: 'Tất cả phân khúc' },
                      { id: 'VIP', label: 'Khách VIP' },
                      { id: 'POTENTIAL', label: 'Khách Tiềm năng' },
                      { id: 'NEW', label: 'Khách Mới' },
                    ].map((f) => (
                      <button
                        key={f.id}
                        className={`admin-filter-btn ${customerSegmentFilter === f.id ? 'active' : ''}`}
                        onClick={() => setCustomerSegmentFilter(f.id)}
                      >
                        {f.label}
                      </button>
                    ))}

                    <input
                      className="admin-search-input"
                      placeholder="Tìm theo tên khách, số điện thoại..."
                      value={customerSearch}
                      onChange={(e) => setCustomerSearch(e.target.value)}
                    />
                  </div>

                  <button
                    className="admin-btn admin-btn-outline"
                    onClick={() => handleExport('customers')}
                  >
                    <Download size={14} />
                    <span>XUẤT EXCEL/CSV</span>
                  </button>
                </div>

                {/* Customers Table */}
                <div className="admin-table-wrap">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Khách hàng</th>
                        <th>Số điện thoại</th>
                        <th>Địa chỉ giao hàng</th>
                        <th>Tổng số đơn</th>
                        <th>Đơn hoàn tất</th>
                        <th>Tổng chi tiêu (LTV)</th>
                        <th>Phân khúc</th>
                        <th>Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredCustomers.length === 0 ? (
                        <tr>
                          <td colSpan={8} style={{ textAlign: 'center', color: '#64748b', padding: '36px' }}>
                            Không tìm thấy dữ liệu khách hàng
                          </td>
                        </tr>
                      ) : (
                        filteredCustomers.map((c, idx) => (
                          <tr key={idx}>
                            <td>
                              <strong>{c.name || 'Khách hàng'}</strong>
                            </td>
                            <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>{c.phone}</td>
                            <td style={{ maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={c.address}>
                              {c.address || '-'}
                            </td>
                            <td style={{ fontWeight: 600 }}>{c.total_orders} đơn</td>
                            <td style={{ fontWeight: 600, color: '#047857' }}>
                              {c.completed_orders} đơn
                            </td>
                            <td style={{ fontWeight: 800, color: '#0f172a' }}>
                              {money(c.total_spent)}
                            </td>
                            <td>{renderSegmentBadge(c.segment)}</td>
                            <td>
                              <button
                                className="admin-btn admin-btn-outline admin-btn-sm"
                                onClick={() => handleViewCustomerOrders(c.phone)}
                              >
                                <Eye size={12} />
                                <span>Xem lịch sử đơn</span>
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ==========================================================
                TAB 5: QUẢN LÝ MÃ GIẢM GIÁ (VOUCHERS)
               ========================================================== */}
            {activeTab === 'vouchers' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px' }}>
                {/* Form Tạo Voucher */}
                <div className="admin-card">
                  <div className="admin-card-header">
                    <h3 className="admin-card-title">TẠO MÃ GIẢM GIÁ MỚI</h3>
                  </div>

                  <form onSubmit={handleSaveVoucher}>
                    <div className="admin-form-group">
                      <label>Mã Voucher (In hoa)</label>
                      <input
                        className="admin-input"
                        required
                        value={vCode}
                        onChange={(e) => setVCode(e.target.value.toUpperCase())}
                        placeholder="Ví dụ: SNEAKER2026, ONE20"
                      />
                    </div>

                    <div className="admin-form-group">
                      <label>Loại giảm giá</label>
                      <select
                        className="admin-input"
                        value={vType}
                        onChange={(e) => setVType(e.target.value as any)}
                      >
                        <option value="percent">Phần trăm (%)</option>
                        <option value="fixed">Số tiền cố định (VND)</option>
                      </select>
                    </div>

                    <div className="admin-form-group">
                      <label>
                        Giá trị giảm ({vType === 'percent' ? '%' : 'VND'})
                      </label>
                      <input
                        className="admin-input"
                        type="number"
                        min={1}
                        max={vType === 'percent' ? 100 : 10000000}
                        required
                        value={vValue}
                        onChange={(e) => setVValue(Number(e.target.value))}
                      />
                    </div>

                    <div className="admin-form-group">
                      <label>Đơn hàng tối thiểu (VND)</label>
                      <input
                        className="admin-input"
                        type="number"
                        min={0}
                        required
                        value={vMinOrder}
                        onChange={(e) => setVMinOrder(Number(e.target.value))}
                      />
                    </div>

                    <div className="admin-form-group">
                      <label>Số lượt sử dụng tối đa</label>
                      <input
                        className="admin-input"
                        type="number"
                        min={1}
                        required
                        value={vMaxUses}
                        onChange={(e) => setVMaxUses(Number(e.target.value))}
                      />
                    </div>

                    <button
                      className="admin-btn-primary"
                      type="submit"
                      disabled={savingVoucher}
                      style={{ marginTop: '12px' }}
                    >
                      {savingVoucher ? 'ĐANG TẠO...' : 'LƯU MÃ VOUCHER'}
                    </button>
                  </form>
                </div>

                {/* Danh Sách Vouchers */}
                <div className="admin-card">
                  <div className="admin-card-header">
                    <h3 className="admin-card-title">DANH SÁCH MÃ GIẢM GIÁ HIỆN CÓ</h3>
                  </div>

                  <div className="admin-table-wrap">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Mã code</th>
                          <th>Loại giảm</th>
                          <th>Giá trị</th>
                          <th>Đơn tối thiểu</th>
                          <th>Đã dùng / Tối đa</th>
                          <th>Trạng thái</th>
                          <th>Thao tác</th>
                        </tr>
                      </thead>
                      <tbody>
                        {vouchers.length === 0 ? (
                          <tr>
                            <td colSpan={7} style={{ textAlign: 'center', color: '#64748b', padding: '24px' }}>
                              Chưa có mã voucher nào
                            </td>
                          </tr>
                        ) : (
                          vouchers.map((v) => (
                            <tr key={v.code}>
                              <td style={{ fontWeight: 800, fontFamily: 'monospace', color: '#0f172a' }}>
                                {v.code}
                              </td>
                              <td>{v.discount_type === 'percent' ? 'Phần trăm' : 'Cố định'}</td>
                              <td style={{ fontWeight: 700, color: '#047857' }}>
                                {v.discount_type === 'percent'
                                  ? `-${v.discount_value}%`
                                  : `-${money(v.discount_value)}`}
                              </td>
                              <td>{money(v.min_order)}</td>
                              <td>
                                {v.used_count} / {v.max_uses}
                              </td>
                              <td>
                                {v.active ? (
                                  <span className="admin-badge admin-badge-completed">Đang bật</span>
                                ) : (
                                  <span className="admin-badge admin-badge-cancelled">Đã tắt</span>
                                )}
                              </td>
                              <td>
                                <button
                                  className="admin-btn admin-btn-outline admin-btn-sm"
                                  onClick={() => handleToggleVoucher(v.code, v.active)}
                                >
                                  {v.active ? 'Tắt' : 'Bật'}
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* ==========================================================
                TAB 6: KHO TRI THỨC AI RAG (KNOWLEDGE)
               ========================================================== */}
            {activeTab === 'knowledge' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                {/* Form Tạo Tài Liệu Tri Thức */}
                <div className="admin-card">
                  <div className="admin-card-header">
                    <h3 className="admin-card-title">THÊM TÀI LIỆU VÀO KHO TRI THỨC RAG</h3>
                  </div>
                  <p style={{ fontSize: '13px', color: '#64748b', marginTop: 0 }}>
                    Nội dung sẽ được nhúng vector hóa tự động bằng Cloudflare Workers AI (`@cf/baai/bge-m3`) và nạp vào Vectorize để Chatbot tra cứu.
                  </p>

                  <form onSubmit={handleSaveKnowledge}>
                    <div className="admin-form-group">
                      <label>Tiêu đề tài liệu</label>
                      <input
                        className="admin-input"
                        required
                        maxLength={120}
                        value={kTitle}
                        onChange={(e) => setKTitle(e.target.value)}
                        placeholder="Ví dụ: Chính sách kiểm hàng đồng kiểm khi nhận COD"
                      />
                    </div>

                    <div className="admin-form-group">
                      <label>Nội dung chi tiết</label>
                      <textarea
                        className="admin-input"
                        required
                        minLength={20}
                        maxLength={20000}
                        rows={8}
                        value={kContent}
                        onChange={(e) => setKContent(e.target.value)}
                        placeholder="Nhập nội dung quy định, chính sách, hướng dẫn đo cỡ chân..."
                      />
                    </div>

                    <button
                      className="admin-btn-primary"
                      type="submit"
                      disabled={savingKnowledge}
                    >
                      {savingKnowledge ? 'ĐANG VECTOR HÓA...' : 'LƯU & VECTOR HÓA TRI THỨC'}
                    </button>
                  </form>
                </div>

                {/* Danh Sách Tài Liệu Hiện Có */}
                <div className="admin-card">
                  <div className="admin-card-header">
                    <h3 className="admin-card-title">TÀI LIỆU HIỆN CÓ ({knowledgeDocs.length})</h3>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {knowledgeDocs.length === 0 ? (
                      <div style={{ textAlign: 'center', color: '#64748b', padding: '24px' }}>
                        Chưa có tài liệu nào
                      </div>
                    ) : (
                      knowledgeDocs.map((doc) => (
                        <div
                          key={doc.id}
                          style={{
                            padding: '14px',
                            border: '1px solid #e2e8f0',
                            borderRadius: '6px',
                            background: '#f8fafc',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                          }}
                        >
                          <div>
                            <strong style={{ fontSize: '14px', color: '#0f172a' }}>{doc.title}</strong>
                            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
                              Tạo lúc: {formatDateTime(doc.created_at, 'vi-VN')}
                            </div>
                          </div>
                          <button
                            className="admin-btn admin-btn-outline admin-btn-sm"
                            onClick={() => handleDeleteKnowledge(doc.id)}
                            style={{ color: '#dc2626', borderColor: '#fca5a5' }}
                          >
                            <Trash2 size={12} />
                            <span>Xóa</span>
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ==========================================================
                TAB 7: XUẤT BÁO CÁO DỮ LIỆU (REPORTS)
               ========================================================== */}
            {activeTab === 'reports' && (
              <div>
                <div className="admin-card">
                  <div className="admin-card-header">
                    <h3 className="admin-card-title">TRUNG TÂM XUẤT BÁO CÁO DỮ LIỆU CHUẨN EXCEL</h3>
                  </div>
                  <p style={{ fontSize: '13px', color: '#64748b', marginTop: 0 }}>
                    Tất cả các tệp báo cáo được xuất dưới định dạng `.csv` hỗ trợ UTF-8 with BOM, tương thích tuyệt đối 100% với Microsoft Excel, Google Sheets mà không bị lỗi font chữ Tiếng Việt.
                  </p>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginTop: '20px' }}>
                    {/* Báo cáo Đơn hàng */}
                    <div style={{ border: '1px solid #e2e8f0', borderRadius: '6px', padding: '20px', background: '#f8fafc' }}>
                      <PackageCheck size={28} style={{ color: '#0f172a', marginBottom: '12px' }} />
                      <h4 style={{ margin: '0 0 8px', fontSize: '15px', color: '#0f172a' }}>
                        BÁO CÁO TOÀN BỘ ĐƠN HÀNG
                      </h4>
                      <p style={{ fontSize: '12px', color: '#64748b', minHeight: '48px' }}>
                        Xuất dữ liệu chi tiết tất cả các đơn hàng, thời gian đặt, khách hàng, số điện thoại, địa chỉ, tổng tiền COD, mã giảm giá và trạng thái đơn.
                      </p>
                      <button
                        className="admin-btn admin-btn-dark"
                        style={{ width: '100%', marginTop: '12px' }}
                        onClick={() => handleExport('orders')}
                      >
                        <Download size={14} />
                        <span>TẢI BÁO CÁO ĐƠN HÀNG</span>
                      </button>
                    </div>

                    {/* Báo cáo Sản phẩm */}
                    <div style={{ border: '1px solid #e2e8f0', borderRadius: '6px', padding: '20px', background: '#f8fafc' }}>
                      <ShoppingBag size={28} style={{ color: '#0f172a', marginBottom: '12px' }} />
                      <h4 style={{ margin: '0 0 8px', fontSize: '15px', color: '#0f172a' }}>
                        BÁO CÁO SẢN PHẨM & TỒN KHO
                      </h4>
                      <p style={{ fontSize: '12px', color: '#64748b', minHeight: '48px' }}>
                        Xuất danh mục 70 mẫu sneaker 10 thương hiệu Âu - Á, giá niêm yết, giá bán, số lượng tồn kho và phân khúc sản phẩm.
                      </p>
                      <button
                        className="admin-btn admin-btn-dark"
                        style={{ width: '100%', marginTop: '12px' }}
                        onClick={() => handleExport('products')}
                      >
                        <Download size={14} />
                        <span>TẢI BÁO CÁO SẢN PHẨM</span>
                      </button>
                    </div>

                    {/* Báo cáo Khách hàng */}
                    <div style={{ border: '1px solid #e2e8f0', borderRadius: '6px', padding: '20px', background: '#f8fafc' }}>
                      <Users size={28} style={{ color: '#0f172a', marginBottom: '12px' }} />
                      <h4 style={{ margin: '0 0 8px', fontSize: '15px', color: '#0f172a' }}>
                        BÁO CÁO KHÁCH HÀNG & TIỀM NĂNG
                      </h4>
                      <p style={{ fontSize: '12px', color: '#64748b', minHeight: '48px' }}>
                        Xuất danh sách khách hàng, số điện thoại, tổng chi tiêu tích lũy (LTV), số đơn hoàn tất và phân loại khách VIP / Tiềm năng.
                      </p>
                      <button
                        className="admin-btn admin-btn-dark"
                        style={{ width: '100%', marginTop: '12px' }}
                        onClick={() => handleExport('customers')}
                      >
                        <Download size={14} />
                        <span>TẢI BÁO CÁO KHÁCH HÀNG</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* ==========================================================================
          MODAL 1: XEM CHI TIẾT ĐƠN HÀNG
         ========================================================================== */}
      {selectedOrder && (
        <div className="admin-modal-backdrop" onClick={() => setSelectedOrder(null)}>
          <div className="admin-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <div>
                <strong style={{ fontSize: '16px', color: '#0f172a' }}>
                  CHI TIẾT ĐƠN HÀNG #{selectedOrder.code}
                </strong>
                <div style={{ fontSize: '12px', color: '#64748b' }}>
                  Thời gian: {formatDateTime(selectedOrder.created_at, 'vi-VN')}
                </div>
              </div>
              <button
                className="admin-btn admin-btn-outline admin-btn-sm"
                onClick={() => setSelectedOrder(null)}
              >
                <X size={14} />
              </button>
            </div>

            <div className="admin-modal-body">
              {/* Thông tin khách hàng & Giao nhận */}
              <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '6px', marginBottom: '16px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '13px' }}>
                  <div>
                    <span style={{ color: '#64748b' }}>Người nhận:</span>{' '}
                    <strong>{selectedOrder.customer_name}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748b' }}>Số điện thoại:</span>{' '}
                    <strong>{selectedOrder.phone}</strong>
                  </div>
                  <div style={{ gridColumn: 'span 2' }}>
                    <span style={{ color: '#64748b' }}>Địa chỉ:</span>{' '}
                    <strong>{selectedOrder.address}</strong>
                  </div>
                  {selectedOrder.note && (
                    <div style={{ gridColumn: 'span 2' }}>
                      <span style={{ color: '#64748b' }}>Ghi chú:</span>{' '}
                      <em>{selectedOrder.note}</em>
                    </div>
                  )}
                </div>
              </div>

              {/* Danh sách sản phẩm trong đơn */}
              <h4 style={{ margin: '0 0 10px', fontSize: '13px', textTransform: 'uppercase', color: '#475569' }}>
                DANH SÁCH SẢN PHẨM ({selectedOrder.items?.length || 0})
              </h4>
              <div style={{ border: '1px solid #e2e8f0', borderRadius: '6px', overflow: 'hidden', marginBottom: '16px' }}>
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Sản phẩm</th>
                      <th>Cỡ giày</th>
                      <th>Màu sắc</th>
                      <th>Số lượng</th>
                      <th>Đơn giá</th>
                      <th>Thành tiền</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(selectedOrder.items || []).map((it: any, i: number) => (
                      <tr key={i}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {it.image_url ? (
                              <img
                                src={it.image_url}
                                alt={it.product_name}
                                style={{ width: '36px', height: '36px', objectFit: 'cover', borderRadius: '4px' }}
                              />
                            ) : (
                              <div style={{ width: '36px', height: '36px', background: '#e2e8f0', borderRadius: '4px' }} />
                            )}
                            <span style={{ fontWeight: 600 }}>{it.product_name}</span>
                          </div>
                        </td>
                        <td style={{ fontWeight: 700 }}>{it.size}</td>
                        <td>{it.color}</td>
                        <td>{it.quantity}</td>
                        <td>{money(it.unit_price)}</td>
                        <td style={{ fontWeight: 700, color: '#047857' }}>
                          {money(it.unit_price * it.quantity)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Thanh toán & Trạng thái */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ fontSize: '13px' }}>
                  <div style={{ marginBottom: '6px' }}>
                    <span style={{ color: '#64748b' }}>Trạng thái hiện tại:</span>{' '}
                    {renderStatusBadge(selectedOrder.status)}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '10px' }}>
                    <span style={{ color: '#64748b', fontSize: '12px' }}>Chuyển sang:</span>
                    <select
                      value={selectedOrder.status}
                      onChange={(e) => handleUpdateOrderStatus(selectedOrder.id, e.target.value)}
                      disabled={updatingOrderStatus}
                      style={{ padding: '6px 10px', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                    >
                      <option value="pending">Chờ xử lý</option>
                      <option value="confirmed">Đã duyệt</option>
                      <option value="shipping">Đang giao</option>
                      <option value="completed">Hoàn tất</option>
                      <option value="cancelled">Hủy đơn</option>
                    </select>
                  </div>
                </div>

                <div style={{ textAlign: 'right', fontSize: '13px' }}>
                  {selectedOrder.voucher_code && (
                    <div style={{ color: '#b45309', marginBottom: '4px' }}>
                      Voucher ({selectedOrder.voucher_code}): -{money(selectedOrder.discount || 0)}
                    </div>
                  )}
                  <div style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', marginTop: '6px' }}>
                    Tổng thanh toán COD: {money(selectedOrder.total)}
                  </div>
                </div>
              </div>
            </div>

            <div className="admin-modal-footer">
              <button
                className="admin-btn admin-btn-dark"
                onClick={() => setSelectedOrder(null)}
              >
                ĐÓNG
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================================================
          MODAL 2: THÊM / SỬA SẢN PHẨM SNEAKER
         ========================================================================== */}
      {isProductModalOpen && (
        <div className="admin-modal-backdrop" onClick={() => setIsProductModalOpen(false)}>
          <div className="admin-modal-box" style={{ maxWidth: '720px' }} onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <strong style={{ fontSize: '16px', color: '#0f172a' }}>
                {editingProductId ? `CHỈNH SỬA SẢN PHẨM #${editingProductId}` : 'THÊM MỚI SẢN PHẨM SNEAKER'}
              </strong>
              <button
                className="admin-btn admin-btn-outline admin-btn-sm"
                onClick={() => setIsProductModalOpen(false)}
              >
                <X size={14} />
              </button>
            </div>

            <form onSubmit={handleSaveProduct}>
              <div className="admin-modal-body">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="admin-form-group">
                    <label>Tên sản phẩm Sneaker *</label>
                    <input
                      className="admin-input"
                      required
                      value={pName}
                      onChange={(e) => {
                        setPName(e.target.value);
                        if (!editingProductId) {
                          setPSlug(
                            e.target.value
                              .toLowerCase()
                              .normalize('NFD')
                              .replace(/[\u0300-\u036f]/g, '')
                              .replace(/đ/g, 'd')
                              .replace(/[^a-z0-9]+/g, '-')
                              .replace(/^-|-$/g, ''),
                          );
                        }
                      }}
                      placeholder="Ví dụ: Nike Air Zoom Pegasus 40"
                    />
                  </div>

                  <div className="admin-form-group">
                    <label>Slug (URL) *</label>
                    <input
                      className="admin-input"
                      required
                      pattern="[a-z0-9-]+"
                      value={pSlug}
                      onChange={(e) => setPSlug(e.target.value)}
                    />
                  </div>

                  <div className="admin-form-group">
                    <label>Thương hiệu / Phân khúc *</label>
                    <select
                      className="admin-input"
                      value={pCategory}
                      onChange={(e) => setPCategory(e.target.value)}
                    >
                      <optgroup label="10 Hãng Âu - Á">
                        {BRANDS.map((b) => (
                          <option key={b} value={b}>
                            {b}
                          </option>
                        ))}
                      </optgroup>
                      <optgroup label="Phân khúc vận động">
                        {CATEGORIES.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </optgroup>
                    </select>
                  </div>

                  <div className="admin-form-group">
                    <label>Giá bán (VND) *</label>
                    <input
                      className="admin-input"
                      type="number"
                      min={0}
                      required
                      value={pPrice}
                      onChange={(e) => setPPrice(Number(e.target.value))}
                    />
                  </div>

                  <div className="admin-form-group">
                    <label>Giá so sánh niêm yết (Gạch ngang)</label>
                    <input
                      className="admin-input"
                      type="number"
                      min={0}
                      value={pCompare}
                      onChange={(e) => setPCompare(e.target.value === '' ? '' : Number(e.target.value))}
                      placeholder="Tùy chọn (ví dụ: 3500000)"
                    />
                  </div>

                  <div className="admin-form-group">
                    <label>Số lượng tồn kho *</label>
                    <input
                      className="admin-input"
                      type="number"
                      min={0}
                      required
                      value={pStock}
                      onChange={(e) => setPStock(Number(e.target.value))}
                    />
                  </div>
                </div>

                {/* Chọn Cỡ Giày Thể Thao */}
                <div className="admin-form-group" style={{ marginTop: '10px' }}>
                  <label>Kích cỡ giày có sẵn (Bấm để chọn / bỏ chọn):</label>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {AVAILABLE_SIZES.map((sz) => {
                      const isSelected = pSizes.includes(sz);
                      return (
                        <button
                          key={sz}
                          type="button"
                          className={`admin-filter-btn ${isSelected ? 'active' : ''}`}
                          style={{ minWidth: '44px', textAlign: 'center' }}
                          onClick={() => {
                            if (isSelected) {
                              setPSizes(pSizes.filter((s) => s !== sz));
                            } else {
                              setPSizes([...pSizes, sz].sort((a, b) => Number(a) - Number(b)));
                            }
                          }}
                        >
                          {sz}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Danh sách màu */}
                <div className="admin-form-group">
                  <label>Phối màu sắc (phân tách bởi dấu phẩy):</label>
                  <input
                    className="admin-input"
                    value={pColors}
                    onChange={(e) => setPColors(e.target.value)}
                    placeholder="Ví dụ: Trắng Đen, Xanh Biển, Cam Lửa Bạc"
                  />
                </div>

                {/* Mô tả */}
                <div className="admin-form-group">
                  <label>Mô tả công nghệ & đặc điểm giày:</label>
                  <textarea
                    className="admin-input"
                    rows={3}
                    value={pDescription}
                    onChange={(e) => setPDescription(e.target.value)}
                    placeholder="Đệm bọt, đĩa carbon trợ lực, phom chân Á Đông..."
                  />
                </div>

                {/* Tải ảnh Cloudflare R2 */}
                <div className="admin-form-group">
                  <label>Hình ảnh sản phẩm (Upload vào Cloudflare R2):</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    {pImagePreview ? (
                      <img
                        src={pImagePreview}
                        alt="Preview"
                        style={{ width: '64px', height: '64px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                      />
                    ) : (
                      <div style={{ width: '64px', height: '64px', background: '#f1f5f9', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <UploadCloud size={24} style={{ color: '#94a3b8' }} />
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setPImageFile(file);
                          setPImagePreview(URL.createObjectURL(file));
                        }
                      }}
                    />
                  </div>
                </div>

                {/* Checkbox Featured */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '10px' }}>
                  <input
                    type="checkbox"
                    id="featCheck"
                    checked={pFeatured}
                    onChange={(e) => setPFeatured(e.target.checked)}
                    style={{ width: '16px', height: '16px' }}
                  />
                  <label htmlFor="featCheck" style={{ margin: 0, cursor: 'pointer', fontWeight: 600 }}>
                    Đánh dấu sản phẩm nổi bật (Hiển thị tại Top Bán Chạy)
                  </label>
                </div>
              </div>

              <div className="admin-modal-footer">
                <button
                  type="button"
                  className="admin-btn admin-btn-outline"
                  onClick={() => setIsProductModalOpen(false)}
                >
                  HỦY BỎ
                </button>
                <button
                  type="submit"
                  className="admin-btn admin-btn-dark"
                  disabled={savingProduct}
                >
                  {savingProduct ? 'ĐANG LƯU...' : editingProductId ? 'LƯU THAY ĐỔI' : 'TẠO MỚI SẢN PHẨM'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==========================================================================
          MODAL 3: XEM LỊCH SỬ ĐƠN CỦA KHÁCH HÀNG
         ========================================================================== */}
      {selectedCustomerOrders && (
        <div className="admin-modal-backdrop" onClick={() => setSelectedCustomerOrders(null)}>
          <div className="admin-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <strong>LỊCH SỬ ĐƠN HÀNG — SĐT: {selectedCustomerPhone}</strong>
              <button
                className="admin-btn admin-btn-outline admin-btn-sm"
                onClick={() => setSelectedCustomerOrders(null)}
              >
                <X size={14} />
              </button>
            </div>

            <div className="admin-modal-body">
              {selectedCustomerOrders.length === 0 ? (
                <p style={{ textAlign: 'center', color: '#64748b' }}>Không có đơn hàng nào</p>
              ) : (
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Mã đơn</th>
                      <th>Ngày đặt</th>
                      <th>Địa chỉ</th>
                      <th>Tổng tiền</th>
                      <th>Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedCustomerOrders.map((o) => (
                      <tr key={o.id}>
                        <td style={{ fontWeight: 800, fontFamily: 'monospace' }}>{o.code}</td>
                        <td style={{ fontSize: '12px' }}>
                          {formatDateTime(o.created_at, 'vi-VN')}
                        </td>
                        <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {o.address}
                        </td>
                        <td style={{ fontWeight: 800 }}>{money(o.total)}</td>
                        <td>{renderStatusBadge(o.status)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="admin-modal-footer">
              <button className="admin-btn admin-btn-dark" onClick={() => setSelectedCustomerOrders(null)}>
                ĐÓNG
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TOAST MESSAGE TOÀN CỤC */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            background: '#0f172a',
            color: '#ffffff',
            padding: '12px 20px',
            borderRadius: '6px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
            fontSize: '13px',
            fontWeight: 600,
            zIndex: 9999,
          }}
        >
          {toastMessage}
        </div>
      )}
    </div>
  );
}
