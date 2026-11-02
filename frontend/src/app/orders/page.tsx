'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useShop } from '@/context/ShopContext';
import { api, money, formatDateTime } from '@/lib/api';
import { Order } from '@/types';
import {
  Package,
  Search,
  Phone,
  Hash,
  MapPin,
  Calendar,
  Clock,
  CheckCircle2,
  Truck,
  RotateCcw,
  AlertCircle,
  ShoppingBag,
  ArrowRight,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react';
import { COLORS } from '@/constants';
import Link from 'next/link';

function OrdersContent() {
  const { locale, dict, recentOrders, guestInfo, showToast } = useShop();
  const tText = dict.modals.tracking;
  const statusDict = dict.modals.order_status;

  const formatOrderNote = (noteStr: string) => {
    if (!noteStr) return '';
    if (locale === 'en') {
      return noteStr
        .replace(/\[Hình thức:\s*COD\]/gi, '[Method: COD]')
        .replace(/\[Hình thức:\s*Chuyển khoản QR\]/gi, '[Method: Bank QR]')
        .replace(/\[Hình thức:\s*([^\]]+)\]/gi, '[Method: $1]');
    }
    return noteStr
      .replace(/\[Method:\s*COD\]/gi, '[Hình thức: COD]')
      .replace(/\[Method:\s*Bank QR\]/gi, '[Hình thức: Chuyển khoản QR]')
      .replace(/\[Method:\s*([^\]]+)\]/gi, '[Hình thức: $1]');
  };

  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);

  // Tự động điền số điện thoại nếu đã có từ guestInfo hoặc đơn gần nhất
  useEffect(() => {
    if (guestInfo?.phone && !phone) {
      setPhone(guestInfo.phone);
    }
  }, [guestInfo?.phone]);

  const executeSearch = async (searchPhone: string, searchCode: string) => {
    const trimmedPhone = searchPhone.trim();
    const trimmedCode = searchCode.trim().toUpperCase();

    if (!trimmedPhone && !trimmedCode) {
      showToast(tText.empty_prompt || 'Vui lòng nhập số điện thoại hoặc mã đơn hàng để tra cứu');
      return;
    }

    try {
      setLoading(true);
      setHasSearched(true);
      const queryParams = new URLSearchParams();
      if (trimmedPhone) queryParams.set('phone', trimmedPhone);
      if (trimmedCode) queryParams.set('code', trimmedCode);

      const res = await api(`/api/orders/lookup?${queryParams.toString()}`);

      if (Array.isArray(res.orders) && res.orders.length > 0) {
        setOrders(res.orders);
      } else if (res.order) {
        setOrders([res.order]);
      } else {
        setOrders([]);
      }
    } catch (err: any) {
      showToast(err.message || tText.not_found);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeSearch(phone, code);
  };

  const handleSelectRecent = (orderCode: string) => {
    setCode(orderCode);
    executeSearch('', orderCode);
  };

  const getStatusBadge = (status: string) => {
    const s = status.toLowerCase();
    switch (s) {
      case 'completed':
        return {
          bg: '#ecfdf5',
          border: '#a7f3d0',
          text: '#065f46',
          icon: <CheckCircle2 size={14} />,
          label: statusDict['completed'] || 'Đã giao thành công',
        };
      case 'shipping':
        return {
          bg: '#eef2ff',
          border: '#c7d2fe',
          text: '#3730a3',
          icon: <Truck size={14} />,
          label: statusDict['shipping'] || 'Đang giao hàng',
        };
      case 'processing':
      case 'confirmed':
        return {
          bg: '#f0f9ff',
          border: '#bae6fd',
          text: '#0369a1',
          icon: <Clock size={14} />,
          label: statusDict['processing'] || 'Đang xử lý',
        };
      case 'cancelled':
        return {
          bg: '#fff1f2',
          border: '#fecdd3',
          text: '#9f1239',
          icon: <RotateCcw size={14} />,
          label: statusDict['cancelled'] || 'Đã hủy',
        };
      default:
        return {
          bg: '#fffbeb',
          border: '#fde68a',
          text: '#92400e',
          icon: <Clock size={14} />,
          label: statusDict['pending'] || 'Chờ xác nhận',
        };
    }
  };

  return (
    <div className="wrap" style={{ paddingTop: '32px', paddingBottom: '80px' }}>
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#666' }}>
          <Link href="/" style={{ color: '#666', textDecoration: 'none' }}>
            {dict.common.nav.home}
          </Link>
          <ChevronRight size={14} />
          <span style={{ color: '#111', fontWeight: 600 }}>{dict.common.nav.my_orders || 'LỊCH SỬ MUA HÀNG'}</span>
        </div>
      </nav>

      {/* Header Banner */}
      <div style={{ marginBottom: '32px' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(227, 30, 45, 0.08)',
            color: 'var(--red, #e31e2d)',
            padding: '6px 14px',
            borderRadius: '999px',
            fontSize: '12px',
            fontWeight: 700,
            letterSpacing: '0.04em',
            marginBottom: '12px',
          }}
        >
          <Package size={15} />
          <span>ONE - STORE ORDERS</span>
        </div>
        <h1
          style={{
            margin: '0 0 10px',
            fontSize: 'clamp(1.85rem, 3.5vw, 2.5rem)',
            fontWeight: 800,
            color: 'var(--text-main, #111111)',
            letterSpacing: '-0.02em',
          }}
        >
          {tText.title}
        </h1>
        <p style={{ margin: 0, fontSize: '15px', color: '#555', maxWidth: '720px', lineHeight: 1.6 }}>
          {tText.subtitle}
        </p>
      </div>

      {/* Tra Cứu Card */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: '24px',
          border: '1px solid #e5e7eb',
          padding: 'clamp(24px, 3.5vw, 36px)',
          boxShadow: '0 10px 30px -10px rgba(0, 0, 0, 0.05)',
          marginBottom: '36px',
        }}
      >
        <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '20px',
            }}
          >
            {/* Trường Số điện thoại */}
            <div>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '13px',
                  fontWeight: 700,
                  color: '#111827',
                  marginBottom: '8px',
                }}
              >
                <Phone size={15} color="var(--red, #e31e2d)" />
                <span>{tText.phone_label}</span>
                <span style={{ fontSize: '11px', color: '#059669', fontWeight: 600, marginLeft: 'auto' }}>
                  {tText.all_orders_tip}
                </span>
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder={tText.phone_placeholder || 'Ví dụ: 0912345678'}
                style={{
                  width: '100%',
                  padding: '13px 16px',
                  borderRadius: '12px',
                  border: '1.5px solid #d1d5db',
                  fontSize: '14px',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Trường Mã đơn hàng */}
            <div>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '13px',
                  fontWeight: 700,
                  color: '#111827',
                  marginBottom: '8px',
                }}
              >
                <Hash size={15} color="#6b7280" />
                <span>{tText.order_code_label}</span>
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder={tText.order_code_placeholder || 'Ví dụ: ONE-XXXXXX (Nếu có)'}
                style={{
                  width: '100%',
                  padding: '13px 16px',
                  borderRadius: '12px',
                  border: '1.5px solid #d1d5db',
                  fontSize: '14px',
                  outline: 'none',
                  textTransform: 'uppercase',
                  transition: 'border-color 0.2s',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </div>

          {/* Hộp Đơn hàng gần đây trên thiết bị */}
          {recentOrders.length > 0 && (
            <div
              style={{
                marginTop: '4px',
                padding: '14px 18px',
                background: 'rgba(227, 30, 45, 0.04)',
                borderRadius: '14px',
                border: '1px solid rgba(227, 30, 45, 0.12)',
              }}
            >
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#374151' }}>
                {tText.recent_title || 'Đơn hàng gần đây trên thiết bị:'}
              </span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '10px' }}>
                {recentOrders.map((rc) => (
                  <button
                    key={rc}
                    type="button"
                    onClick={() => handleSelectRecent(rc)}
                    disabled={loading}
                    style={{
                      background: '#ffffff',
                      border: '1px solid rgba(227, 30, 45, 0.25)',
                      borderRadius: '8px',
                      padding: '6px 14px',
                      fontSize: '13px',
                      fontWeight: 700,
                      color: 'var(--red, #e31e2d)',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
                    }}
                  >
                    <Package size={14} />
                    <span>{rc}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div style={{ display: 'flex', justifyContent: 'flex-start', marginTop: '4px' }}>
            <button
              type="submit"
              disabled={loading}
              style={{
                background: 'var(--red, #e31e2d)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '12px',
                padding: '14px 32px',
                fontSize: '15px',
                fontWeight: 700,
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 14px rgba(227, 30, 45, 0.25)',
                transition: 'all 0.2s ease',
              }}
            >
              <Search size={17} />
              <span>{loading ? tText.searching : tText.submit_btn}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Kết Quả Tra Cứu */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#6b7280' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              border: '3px solid #e5e7eb',
              borderTopColor: 'var(--red, #e31e2d)',
              borderRadius: '50%',
              margin: '0 auto 16px',
              animation: 'spin 0.8s linear infinite',
            }}
          />
          <p style={{ margin: 0, fontSize: '15px', fontWeight: 600 }}>{tText.searching}</p>
        </div>
      ) : hasSearched && orders.length === 0 ? (
        <div
          style={{
            background: '#ffffff',
            borderRadius: '24px',
            border: '1px solid #e5e7eb',
            padding: 'clamp(48px, 6vw, 72px) 24px',
            textAlign: 'center',
            boxShadow: '0 8px 24px -6px rgba(0, 0, 0, 0.04)',
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: '#fef2f2',
              color: '#dc2626',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '16px',
            }}
          >
            <AlertCircle size={32} />
          </div>
          <h3 style={{ margin: '0 0 8px', fontSize: '19px', color: '#111827', fontWeight: 700 }}>
            {tText.not_found}
          </h3>
          <p style={{ margin: '0 0 24px', fontSize: '14px', color: '#6b7280', maxWidth: '520px', marginInline: 'auto', lineHeight: 1.6 }}>
            {tText.not_found_desc}
          </p>
          <Link
            href="/products"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              background: 'var(--text-main, #111111)',
              color: '#ffffff',
              padding: '12px 26px',
              borderRadius: '10px',
              fontSize: '14px',
              fontWeight: 700,
              textDecoration: 'none',
              transition: 'background 0.2s ease',
            }}
          >
            <ShoppingBag size={17} />
            <span>{tText.back_to_shop || 'Khám phá sản phẩm ngay'}</span>
          </Link>
        </div>
      ) : orders.length > 0 ? (
        <div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '20px',
            }}
          >
            <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: '#111827' }}>
              {tText.results_found} <span style={{ color: 'var(--red, #e31e2d)' }}>{orders.length}</span> {tText.orders_suffix}
            </h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {orders.map((ord) => {
              const badge = getStatusBadge(ord.status);
              return (
                <div
                  key={ord.id || ord.code}
                  style={{
                    background: '#ffffff',
                    borderRadius: '20px',
                    border: '1px solid #e5e7eb',
                    overflow: 'hidden',
                    boxShadow: '0 8px 24px -6px rgba(0, 0, 0, 0.04)',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {/* Card Header */}
                  <div
                    style={{
                      background: '#f9fafb',
                      padding: '18px 26px',
                      borderBottom: '1px solid #f3f4f6',
                      display: 'flex',
                      flexWrap: 'wrap',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '12px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '13px', color: '#6b7280' }}>{tText.order_label}</span>
                      <strong style={{ fontSize: '16px', color: '#111827', letterSpacing: '0.04em' }}>
                        {ord.code}
                      </strong>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '13px', color: '#6b7280' }}>
                        <Calendar size={14} />
                        <span>{formatDateTime(ord.created_at, locale)}</span>
                      </div>
                      <div
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '6px 14px',
                          borderRadius: '999px',
                          fontSize: '12px',
                          fontWeight: 700,
                          background: badge.bg,
                          border: `1px solid ${badge.border}`,
                          color: badge.text,
                        }}
                      >
                        {badge.icon}
                        <span>{badge.label}</span>
                      </div>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div style={{ padding: '24px 26px' }}>
                    {/* Recipient Details */}
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                        gap: '14px',
                        padding: '16px 20px',
                        background: '#f8fafc',
                        border: '1px solid #f1f5f9',
                        borderRadius: '14px',
                        fontSize: '13px',
                        marginBottom: '20px',
                      }}
                    >
                      <div>
                        <span style={{ color: '#64748b' }}>{tText.recipient_label} </span>
                        <strong style={{ color: '#0f172a' }}>{ord.customer_name}</strong>
                      </div>
                      <div>
                        <span style={{ color: '#64748b' }}>{tText.recipient_phone_label} </span>
                        <strong style={{ color: '#0f172a' }}>{ord.phone}</strong>
                      </div>
                      <div style={{ gridColumn: '1 / -1' }}>
                        <span style={{ color: '#64748b' }}>{tText.address_label} </span>
                        <span style={{ color: '#0f172a' }}>{ord.address}</span>
                      </div>
                      {ord.note && (
                        <div style={{ gridColumn: '1 / -1' }}>
                          <span style={{ color: '#64748b' }}>{tText.note_label} </span>
                          <span style={{ color: '#475569', fontStyle: 'italic' }}>{formatOrderNote(ord.note)}</span>
                        </div>
                      )}
                    </div>

                    {/* Danh Sách Sản Phẩm */}
                    {Array.isArray(ord.items) && ord.items.length > 0 && (
                      <div style={{ marginBottom: '20px' }}>
                        <div style={{ fontSize: '14px', fontWeight: 700, color: '#374151', marginBottom: '12px' }}>
                          {tText.items_title}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          {ord.items.map((item, idx) => (
                            <div
                              key={idx}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '12px 18px',
                                background: '#ffffff',
                                border: '1px solid #f1f5f9',
                                borderRadius: '12px',
                                gap: '14px',
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                {item.image_url ? (
                                  <img
                                    src={item.image_url}
                                    alt={item.product_name}
                                    style={{
                                      width: '54px',
                                      height: '54px',
                                      borderRadius: '10px',
                                      objectFit: 'cover',
                                      border: '1px solid #e2e8f0',
                                    }}
                                  />
                                ) : (
                                  <div
                                    style={{
                                      width: '54px',
                                      height: '54px',
                                      borderRadius: '10px',
                                      background: '#f1f5f9',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      color: '#94a3b8',
                                    }}
                                  >
                                    <Package size={22} />
                                  </div>
                                )}
                                <div>
                                  <div style={{ fontSize: '15px', fontWeight: 700, color: '#111827' }}>
                                    {item.product_name}
                                  </div>
                                  <div
                                    style={{
                                      display: 'flex',
                                      gap: '8px',
                                      fontSize: '13px',
                                      color: '#64748b',
                                      marginTop: '4px',
                                    }}
                                  >
                                    <span>
                                      {tText.size_label} <b>{item.size}</b>
                                    </span>
                                    <span>·</span>
                                    <span>
                                      {tText.color_label} <b>{dict.product.colors_map[item.color] || item.color}</b>
                                    </span>
                                    <span>·</span>
                                    <span>
                                      {tText.qty_label} <b>{item.quantity}</b>
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: '15px', fontWeight: 700, color: '#111827' }}>
                                  {money(item.unit_price * item.quantity)}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Card Footer */}
                    <div
                      style={{
                        paddingTop: '16px',
                        borderTop: '1px solid #f1f5f9',
                        display: 'flex',
                        flexWrap: 'wrap',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '14px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#059669' }}>
                        <ShieldCheck size={17} />
                        <span>{tText.inspection_policy}</span>
                      </div>
                      <div style={{ textAlign: 'right', display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                        <span style={{ fontSize: '14px', color: '#6b7280' }}>{tText.total_label}</span>
                        <strong style={{ fontSize: '20px', color: 'var(--red, #e31e2d)', fontWeight: 800 }}>
                          {money(ord.total)}
                        </strong>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div
          style={{
            background: '#ffffff',
            borderRadius: '24px',
            border: '1px solid #e5e7eb',
            padding: 'clamp(48px, 6vw, 72px) 24px',
            textAlign: 'center',
            boxShadow: '0 8px 24px -6px rgba(0, 0, 0, 0.04)',
          }}
        >
          <div
            style={{
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              background: 'rgba(227, 30, 45, 0.08)',
              color: 'var(--red, #e31e2d)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '16px',
            }}
          >
            <Package size={28} />
          </div>
          <h3 style={{ margin: '0 0 8px', fontSize: '18px', color: '#111827', fontWeight: 700 }}>
            {tText.lookup_all_title}
          </h3>
          <p style={{ margin: '0 0 20px', fontSize: '14px', color: '#6b7280', maxWidth: '520px', marginInline: 'auto', lineHeight: 1.6 }}>
            {tText.no_orders_yet}
          </p>
        </div>
      )}
    </div>
  );
}

export default function OrdersPage() {
  return (
    <div id="shop">
      <Header />
      <main style={{ minHeight: '70vh', background: 'var(--bg-main, #fcfcfb)' }}>
        <Suspense fallback={<div style={{ padding: '60px 20px', textAlign: 'center' }}>...</div>}>
          <OrdersContent />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
