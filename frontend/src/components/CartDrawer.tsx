'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useShop } from '@/context/ShopContext';
import { money, api, formatDateTime } from '@/lib/api';
import { ArrowLeft, X, Check, ShoppingBag, Minus, Plus, ShieldCheck, AlertTriangle, Package, Trash2 } from 'lucide-react';
import { COLORS } from '@/constants';

const FREESHIP_MIN_ITEMS = 3;

export default function CartDrawer() {
  const {
    isCartOpen,
    setIsCartOpen,
    isCheckoutMode,
    setIsCheckoutMode,
    buyNowItem,
    setBuyNowItem,
    cart,
    removeFromCart,
    updateQuantity,
    clearCart,
    removeSelectedFromCart,
    subtotal,
    showToast,
    appliedVoucher,
    setAppliedVoucher,
    memberUser,
    guestInfo,
    saveGuestInfo,
    addRecentOrder,
    cookieConsent,
    acceptCookieConsent,
    locale,
    dict,
  } = useShop();

  const cText = dict.checkout;
  const mText = dict.messages;

  const [submittingOrder, setSubmittingOrder] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<{
    code: string;
    total: number;
    name: string;
    phone: string;
    address: string;
    created_at?: string;
  } | null>(null);

  // Form fields initialized with guestInfo or memberUser
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [note, setNote] = useState('');
  const [voucherCodeInput, setVoucherCodeInput] = useState('');
  const [applyingVoucher, setApplyingVoucher] = useState(false);

  // Auto-populate when guestInfo or memberUser is available
  useEffect(() => {
    if (memberUser?.name) {
      setCustomerName(memberUser.name);
    } else if (guestInfo.name) {
      setCustomerName(guestInfo.name);
    }

    if (guestInfo.phone) setPhone(guestInfo.phone);
    if (guestInfo.address) setAddress(guestInfo.address);
    if (guestInfo.note) setNote(guestInfo.note);
  }, [guestInfo, memberUser]);

  const isDirectCheckout = Boolean(buyNowItem);

  // Checkbox selection state for cart items
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>(() => cart.map((i) => i.id));

  // Sync selectedItemIds when cart changes
  useEffect(() => {
    setSelectedItemIds((prev) => {
      const existingIds = new Set(cart.map((i) => i.id));
      const filtered = prev.filter((id) => existingIds.has(id));
      const currentSet = new Set(filtered);
      cart.forEach((i) => {
        if (!currentSet.has(i.id)) {
          filtered.push(i.id);
        }
      });
      return filtered;
    });
  }, [cart]);

  const selectedCartItems = cart.filter((item) => selectedItemIds.includes(item.id));
  const activeItems = isDirectCheckout && buyNowItem ? [buyNowItem] : selectedCartItems;

  const isAllSelected = cart.length > 0 && selectedItemIds.length === cart.length;

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedItemIds([]);
    } else {
      setSelectedItemIds(cart.map((i) => i.id));
    }
  };

  const handleToggleSelectItem = (id: string) => {
    setSelectedItemIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  const handleClearAll = () => {
    if (cart.length === 0) return;
    clearCart();
    setSelectedItemIds([]);
    showToast(cText.clear_all_confirm);
  };

  const totalQuantity = activeItems.reduce((sum, item) => sum + item.quantity, 0);
  const activeSubtotal = isDirectCheckout && buyNowItem
    ? buyNowItem.unit_price * buyNowItem.quantity
    : selectedCartItems.reduce((sum, item) => sum + item.unit_price * item.quantity, 0);
  const shippingFee = totalQuantity >= FREESHIP_MIN_ITEMS || activeItems.length === 0 ? 0 : 30000;
  const discountAmount = appliedVoucher ? appliedVoucher.discount : 0;
  const finalTotal = Math.max(0, activeSubtotal + shippingFee - discountAmount);

  // Freeship calculation (by quantity: >= 3 items)
  const progressPercent = Math.min(100, Math.round((totalQuantity / FREESHIP_MIN_ITEMS) * 100));
  const remainingForFreeship = Math.max(0, FREESHIP_MIN_ITEMS - totalQuantity);

  const handleClose = () => {
    setIsCartOpen(false);
    setIsCheckoutMode(false);
    setBuyNowItem(null);
  };

  const handleBack = () => {
    if (isDirectCheckout) {
      setBuyNowItem(null);
      setIsCheckoutMode(false);
      setIsCartOpen(false);
    } else {
      setIsCheckoutMode(false);
    }
  };

  const handleApplyVoucher = async () => {
    const code = voucherCodeInput.trim().toUpperCase();
    if (!code) return;
    try {
      setApplyingVoucher(true);
      const res = await api(`/api/vouchers/check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, subtotal: activeSubtotal }),
      }).catch(async () => {
        // Fallback for demo voucher
        return {
          code,
          discount: code === 'ONE10' || code === 'BAKHI10' ? Math.round(activeSubtotal * 0.1) : 50000,
        };
      });
      const discount = res.discount || 50000;
      setAppliedVoucher({ code, discount });
      showToast(mText.voucher_success(code, money(discount)));
    } catch (e: any) {
      showToast(e.message || mText.voucher_invalid);
    } finally {
      setApplyingVoucher(false);
    }
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (activeItems.length === 0) {
      showToast(mText.empty_cart_alert);
      return;
    }

    const trimmedName = customerName.trim();
    const trimmedPhone = phone.trim();
    const trimmedAddress = address.trim();

    if (!trimmedName || !trimmedPhone || !trimmedAddress) {
      showToast(mText.fill_required_fields);
      return;
    }

    try {
      setSubmittingOrder(true);

      // Save for guest autofill next time
      saveGuestInfo({
        name: trimmedName,
        phone: trimmedPhone,
        address: trimmedAddress,
        note: note.trim(),
      });

      const clientTime = new Date().toISOString();
      const payload = {
        customer_name: trimmedName,
        phone: trimmedPhone,
        address: trimmedAddress,
        client_time: clientTime,
        note: note.trim()
          ? `${note.trim()} ${locale === 'en' ? '[Method: COD]' : '[Hình thức: COD]'}`
          : (locale === 'en' ? '[Method: COD]' : '[Hình thức: COD]'),
        voucher_code: appliedVoucher?.code?.trim() || undefined,
        items: activeItems.map((i) => ({
          product_id: Number(i.product_id),
          quantity: Math.max(1, Number(i.quantity)),
          size: String(i.size).trim(),
          color: String(i.color).trim(),
        })),
      };

      const result = await api('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const orderCode =
        result.order?.code || result.code || 'ONE-' + Date.now().toString().slice(-6);

      setOrderSuccess({
        code: orderCode,
        total: result.order?.total || finalTotal,
        name: trimmedName,
        phone: trimmedPhone,
        address: trimmedAddress,
        created_at: result.created_at || clientTime,
      });

      addRecentOrder(orderCode);

      if (isDirectCheckout) {
        setBuyNowItem(null);
      } else {
        removeSelectedFromCart(selectedItemIds);
        setSelectedItemIds([]);
      }
      setIsCheckoutMode(false);
      showToast(mText.order_success);
    } catch (err: any) {
      showToast(err.message || mText.order_failed);
    } finally {
      setSubmittingOrder(false);
    }
  };

  return (
    <>
      <div className={`overlay ${isCartOpen ? 'open' : ''}`} onClick={handleClose} />
      <aside aria-label={cText.cart_title} className={`drawer ${isCartOpen ? 'open' : ''}`} id="drawer">
        {/* Header */}
        <div className="drawer-head">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {isCheckoutMode && !orderSuccess && (
              <button
                type="button"
                onClick={handleBack}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '18px',
                  cursor: 'pointer',
                  padding: '2px 8px',
                  display: 'flex',
                  alignItems: 'center',
                }}
                title={cText.back_to_cart}
              >
                <ArrowLeft size={18} />
              </button>
            )}
            <b style={{ fontSize: '18px' }}>
              {orderSuccess
                ? cText.order_success_title
                : isCheckoutMode
                  ? cText.direct_checkout_title
                  : `${cText.cart_title} (${cart.length})`}
            </b>
          </div>
          <button aria-label="Close" className="close" onClick={handleClose} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={20} />
          </button>
        </div>

        {/* Freeship Progress Bar */}
        {!orderSuccess && activeItems.length > 0 && (
          <div
            style={{
              padding: '12px 24px',
              background: progressPercent >= 100 ? '#f0fdf4' : '#fafaf7',
              borderBottom: '1px solid #e4e4df',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '12px',
                marginBottom: '6px',
                fontWeight: 600,
                color: progressPercent >= 100 ? '#166534' : '#4b5563',
              }}
            >
              <span>
                {progressPercent >= 100 ? (
                  cText.freeship_qualified
                ) : (
                  <>
                    {cText.freeship_remaining_prefix} <b>{remainingForFreeship}</b> {cText.freeship_remaining_suffix}
                  </>
                )}
              </span>
              <span>{progressPercent}%</span>
            </div>
            <div
              style={{
                width: '100%',
                height: '6px',
                background: '#e5e7eb',
                borderRadius: '3px',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${progressPercent}%`,
                  height: '100%',
                  background:
                    progressPercent >= 100
                      ? 'linear-gradient(90deg, #22c55e, #16a34a)'
                      : 'linear-gradient(90deg, #8fa381, #556b4f)',
                  transition: 'width 0.4s ease-in-out',
                }}
              />
            </div>
          </div>
        )}

        <div className="drawer-body" style={{ flex: 1, overflowY: 'auto' }}>
          {/* Order Success View */}
          {orderSuccess ? (
            <div style={{ textAlign: 'center', padding: '30px 10px' }}>
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  background: '#dcfce7',
                  color: '#166534',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '16px',
                }}
              >
                <Check size={32} strokeWidth={2.5} />
              </div>
              <h3 style={{ margin: '0 0 8px', fontSize: '20px', color: '#1f2937' }}>
                {cText.order_success_title}!
              </h3>
              <p style={{ color: '#4b5563', fontSize: '14px', lineHeight: '1.6', margin: '0 0 16px' }}>
                {cText.order_success.thank_you}
              </p>

              <div
                style={{
                  background: '#f8f7f3',
                  border: '1px solid #e4e4df',
                  borderRadius: '8px',
                  padding: '16px',
                  textAlign: 'left',
                  fontSize: '13px',
                  marginBottom: '20px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ color: '#6b7280' }}>{cText.order_success.code_label}</span>
                  <strong style={{ color: COLORS.black.primary, letterSpacing: '0.05em' }}>
                    {orderSuccess.code}
                  </strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ color: '#6b7280' }}>{cText.order_success.total_label}</span>
                  <strong style={{ color: COLORS.red.primary }}>{money(orderSuccess.total)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ color: '#6b7280' }}>
                    {locale === 'en' ? 'Order Time:' : 'Thời gian đặt:'}
                  </span>
                  <span style={{ color: '#111', fontWeight: 600 }}>
                    {formatDateTime(orderSuccess.created_at, locale)}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ color: '#6b7280' }}>{cText.order_success.customer_label}</span>
                  <span>{orderSuccess.name} ({orderSuccess.phone})</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#6b7280' }}>{cText.order_success.address_label}</span>
                  <span style={{ maxWidth: '60%', textAlign: 'right' }}>{orderSuccess.address}</span>
                </div>
              </div>

              {!cookieConsent && (
                <div
                  style={{
                    background: '#fff1f2',
                    border: '1.5px solid #e11d48',
                    borderRadius: '10px',
                    padding: '14px 16px',
                    textAlign: 'left',
                    marginBottom: '20px',
                    boxShadow: '0 4px 12px rgba(225, 29, 72, 0.08)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '12px' }}>
                    <AlertTriangle size={20} color="#be123c" style={{ flexShrink: 0, marginTop: '2px' }} />
                    <p
                      style={{
                        margin: 0,
                        fontSize: '13px',
                        lineHeight: '1.6',
                        fontWeight: 800,
                        color: '#be123c',
                      }}
                    >
                      {cText.order_success.cookie_warning}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      acceptCookieConsent();
                      addRecentOrder(orderSuccess.code);
                      saveGuestInfo({
                        name: orderSuccess.name,
                        phone: orderSuccess.phone,
                        address: orderSuccess.address,
                        note: '',
                      });
                    }}
                    style={{
                      width: '100%',
                      background: '#e11d48',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '10px 14px',
                      fontSize: '13px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      boxShadow: '0 4px 12px rgba(225, 29, 72, 0.25)',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <ShieldCheck size={16} />
                    {cText.order_success.cookie_accept_btn}
                  </button>
                </div>
              )}

              <div
                style={{
                  fontSize: '12px',
                  color: '#687e60',
                  background: '#f3f6f1',
                  padding: '10px 14px',
                  borderRadius: '6px',
                  marginBottom: '20px',
                }}
              >
                {cText.order_success.inspection_tip}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <button
                  className="primary"
                  onClick={() => {
                    setOrderSuccess(null);
                    setBuyNowItem(null);
                    handleClose();
                  }}
                  style={{ width: '100%' }}
                >
                  {cText.order_success.continue_btn}
                </button>
                <Link
                  href="/orders"
                  onClick={() => {
                    setOrderSuccess(null);
                    setBuyNowItem(null);
                    handleClose();
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid #d1d5db',
                    background: '#ffffff',
                    color: '#374151',
                    fontSize: '13px',
                    fontWeight: 600,
                    textDecoration: 'none',
                    transition: 'all 0.2s',
                  }}
                >
                  <Package size={15} />
                  <span>{cText.order_success.view_orders_btn}</span>
                </Link>
              </div>
            </div>
          ) : !isCheckoutMode ? (
            /* Cart Items List */
            <div>
              {cart.length === 0 ? (
                <div className="empty" style={{ padding: '40px 20px', textAlign: 'center' }}>
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '14px' }}>
                    <ShoppingBag size={48} strokeWidth={1.5} color="#9ca3af" />
                  </div>
                  <b style={{ display: 'block', fontSize: '16px', marginBottom: '6px' }}>
                    {cText.empty_cart_title}
                  </b>
                  <p style={{ color: '#777', fontSize: '13px', margin: '0 0 16px' }}>
                    {cText.empty_cart_desc}
                  </p>
                  <button className="primary" onClick={handleClose}>
                    {cText.empty_cart_btn}
                  </button>
                </div>
              ) : (
                <div id="cartItems">
                  {/* Cart Toolbar: Select All & Clear All */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      background: '#fafaf9',
                      border: '1px solid #e4e4df',
                      borderRadius: '8px',
                      marginBottom: '12px',
                      fontSize: '13px',
                    }}
                  >
                    <label
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        cursor: 'pointer',
                        fontWeight: 700,
                        color: COLORS.black.primary,
                        margin: 0,
                        userSelect: 'none',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isAllSelected}
                        onChange={handleToggleSelectAll}
                        style={{
                          width: '18px',
                          height: '18px',
                          cursor: 'pointer',
                          accentColor: COLORS.red.primary,
                          borderRadius: '4px',
                        }}
                      />
                      <span>
                        {cText.select_all} ({selectedItemIds.length}/{cart.length})
                      </span>
                    </label>
                    <button
                      type="button"
                      onClick={handleClearAll}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: COLORS.red.primary,
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '4px 6px',
                        borderRadius: '6px',
                        transition: 'opacity 0.2s',
                      }}
                      title={cText.clear_all}
                    >
                      <Trash2 size={14} />
                      <span>{cText.clear_all}</span>
                    </button>
                  </div>

                  {cart.map((item) => (
                    <div key={item.id} className="cartrow" style={{ alignItems: 'center' }}>
                      {/* Checkbox selection for item */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          paddingRight: '2px',
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={selectedItemIds.includes(item.id)}
                          onChange={() => handleToggleSelectItem(item.id)}
                          aria-label={cText.select_item_aria(item.product_name)}
                          style={{
                            width: '18px',
                            height: '18px',
                            cursor: 'pointer',
                            accentColor: COLORS.red.primary,
                            borderRadius: '4px',
                          }}
                        />
                      </div>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        alt={item.product_name}
                        src={item.image_url}
                        style={{ width: '70px', height: '70px', objectFit: 'cover', borderRadius: '6px' }}
                      />
                      <div style={{ flex: 1 }}>
                        <h4 style={{ margin: '0 0 4px', fontSize: '14px' }}>{item.product_name}</h4>
                        <div className="dim" style={{ fontSize: '12px' }}>
                          {cText.size_label} <b>{item.size}</b> · {cText.color_label} {dict.product.colors_map[item.color] || item.color}
                        </div>
                        <div
                          style={{
                            margin: '8px 0',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <button
                              type="button"
                              className="smallbtn"
                              onClick={() => updateQuantity(item.id, -1)}
                              disabled={item.quantity <= 1}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                padding: '0 8px',
                                opacity: item.quantity <= 1 ? 0.35 : 1,
                                cursor: item.quantity <= 1 ? 'not-allowed' : 'pointer',
                              }}
                              title={item.quantity <= 1 ? cText.min_quantity_tip : undefined}
                            >
                              <Minus size={13} />
                            </button>
                            <span style={{ fontWeight: 700, minWidth: '20px', textAlign: 'center' }}>
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              className="smallbtn"
                              onClick={() => updateQuantity(item.id, 1)}
                              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 8px' }}
                            >
                              <Plus size={13} />
                            </button>
                          </div>
                          <span className="money" style={{ fontSize: '14px' }}>
                            {money(item.unit_price * item.quantity)}
                          </span>
                        </div>
                        <button
                          type="button"
                          className="remove"
                          onClick={() => {
                            removeFromCart(item.id);
                            setSelectedItemIds((prev) => prev.filter((i) => i !== item.id));
                          }}
                          style={{ fontSize: '11px' }}
                        >
                          {cText.remove}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* One-Step Guest Checkout Form */
            <form className="form" id="checkoutForm" onSubmit={handleSubmitOrder}>
              {/* Order Summary Strip - Đồng bộ hoàn toàn giao diện giữa thanh toán nhanh và thanh toán giỏ hàng */}
              <div
                style={{
                  background: '#fff9fa',
                  border: '1.5px solid rgba(225, 29, 72, 0.25)',
                  borderRadius: '10px',
                  padding: '14px',
                  marginBottom: '16px',
                  boxShadow: '0 2px 8px rgba(225, 29, 72, 0.04)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '10px',
                  }}
                >
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      background: COLORS.red.light,
                      color: COLORS.red.primary,
                      padding: '3px 8px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: 800,
                      letterSpacing: '0.04em',
                    }}
                  >
                    <Package size={13} />
                    <span>
                      {cText.direct_checkout_badge || 'SẢN PHẨM ĐÃ CHỌN'} ({activeItems.length})
                    </span>
                  </div>
                  <span
                    style={{
                      fontSize: '13px',
                      fontWeight: 800,
                      color: COLORS.black.primary,
                    }}
                  >
                    {money(activeSubtotal)}
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {activeItems.map((item, idx) => (
                    <div
                      key={item.id || idx}
                      style={{
                        display: 'flex',
                        gap: '12px',
                        alignItems: 'center',
                        paddingTop: idx > 0 ? '10px' : '0',
                        borderTop: idx > 0 ? '1px dashed rgba(225, 29, 72, 0.15)' : 'none',
                      }}
                    >
                      {item.image_url && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          alt={item.product_name}
                          src={item.image_url}
                          style={{
                            width: '56px',
                            height: '56px',
                            objectFit: 'cover',
                            borderRadius: '8px',
                            border: '1px solid #f1f5f9',
                            background: '#fff',
                            flexShrink: 0,
                          }}
                        />
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <h4
                          style={{
                            margin: '0 0 3px',
                            fontSize: '13px',
                            fontWeight: 800,
                            color: COLORS.black.primary,
                            lineHeight: 1.35,
                          }}
                        >
                          {item.product_name}
                        </h4>
                        <div style={{ fontSize: '12px', color: '#64748b' }}>
                          {cText.size_label} <b>{item.size}</b> · {cText.color_label} <b>{dict.product.colors_map[item.color] || item.color}</b> · SL: <b>{item.quantity}</b>
                        </div>
                        <div
                          style={{
                            marginTop: '2px',
                            fontSize: '12px',
                            fontWeight: 800,
                            color: COLORS.red.primary,
                          }}
                        >
                          {money(item.unit_price * item.quantity)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  marginBottom: '12px',
                  fontSize: '13px',
                  color: COLORS.black.primary,
                  fontWeight: 800,
                }}
              >
                <span>{cText.guest_badge}</span>
              </div>

              <label>
                {cText.customer_name} <span style={{ color: COLORS.red.primary }}>*</span>
                <input
                  name="customer_name"
                  placeholder={cText.customer_name_placeholder}
                  required
                  minLength={2}
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                />
              </label>

              <label>
                {cText.phone} <span style={{ color: COLORS.red.primary }}>*</span>
                <input
                  name="phone"
                  pattern="[0-9+() .-]{9,20}"
                  placeholder={cText.phone_placeholder}
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </label>

              <label>
                {cText.address} <span style={{ color: COLORS.red.primary }}>*</span>
                <input
                  name="address"
                  placeholder={cText.address_placeholder}
                  required
                  minLength={5}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </label>

              <label>
                {cText.note}
                <textarea
                  name="note"
                  placeholder={cText.note_placeholder}
                  rows={2}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  style={{ minHeight: '60px' }}
                />
              </label>

              {/* Payment Method Selector */}
              <div style={{ marginTop: '14px', marginBottom: '14px' }}>
                <span
                  style={{
                    fontSize: '12px',
                    fontWeight: 700,
                    display: 'block',
                    marginBottom: '8px',
                    color: COLORS.black.primary,
                  }}
                >
                  {cText.payment_method}
                </span>
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px 14px',
                    borderRadius: '10px',
                    border: `1.5px solid ${COLORS.red.primary}`,
                    background: 'rgba(225, 29, 72, 0.04)',
                    cursor: 'default',
                    fontSize: '13px',
                    margin: 0,
                  }}
                >
                  <input
                    type="radio"
                    name="payment_method"
                    checked={true}
                    readOnly
                    style={{
                      width: '18px',
                      height: '18px',
                      minWidth: '18px',
                      maxWidth: '18px',
                      flexShrink: 0,
                      margin: 0,
                      padding: 0,
                      accentColor: COLORS.red.primary,
                      cursor: 'default',
                    }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <b style={{ display: 'block', color: '#09090b', fontSize: '13.5px', marginBottom: '2px' }}>
                      {cText.payment_cod_title}
                    </b>
                    <div style={{ fontSize: '11.5px', color: COLORS.gray[600], lineHeight: 1.4 }}>
                      {cText.payment_cod_desc}
                    </div>
                  </div>
                </label>
              </div>

              {/* Voucher Input */}
              <div style={{ marginTop: '10px', marginBottom: '14px' }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    name="voucher_code"
                    placeholder={cText.voucher_placeholder}
                    value={voucherCodeInput}
                    onChange={(e) => setVoucherCodeInput(e.target.value)}
                    style={{ margin: 0, fontSize: '13px' }}
                  />
                  <button
                    type="button"
                    className="smallbtn"
                    onClick={handleApplyVoucher}
                    disabled={applyingVoucher}
                    style={{ padding: '0 16px', fontWeight: 700 }}
                  >
                    {cText.apply_voucher}
                  </button>
                </div>
                {appliedVoucher && (
                  <div
                    style={{
                      color: '#2e6b36',
                      fontSize: '12px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginTop: '6px',
                    }}
                  >
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <Check size={14} />
                      <span>{cText.voucher_applied} <b>{appliedVoucher.code}</b></span>
                    </span>
                    <span>-{money(appliedVoucher.discount)}</span>
                  </div>
                )}
              </div>

              {/* Price Breakdown */}
              <div
                style={{
                  borderTop: '1px solid #e4e4df',
                  paddingTop: '12px',
                  fontSize: '13px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#666' }}>{cText.subtotal}</span>
                  <span>{money(activeSubtotal)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#666' }}>{cText.shipping_fee}</span>
                  <span>
                    {shippingFee === 0 ? (
                      <b style={{ color: '#16a34a' }}>{cText.shipping_free}</b>
                    ) : (
                      money(shippingFee)
                    )}
                  </span>
                </div>
                {appliedVoucher && (
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      color: '#2e6b36',
                    }}
                  >
                    <span>{cText.voucher_discount} ({appliedVoucher.code})</span>
                    <span>-{money(discountAmount)}</span>
                  </div>
                )}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '16px',
                    fontWeight: 800,
                    borderTop: '1px dashed #d1d5db',
                    paddingTop: '8px',
                    marginTop: '4px',
                    color: COLORS.black.primary,
                  }}
                >
                  <span>{cText.total_payment}</span>
                  <span style={{ color: COLORS.red.primary }}>{money(finalTotal)}</span>
                </div>
              </div>

              <button
                className="primary"
                type="submit"
                disabled={submittingOrder}
                style={{
                  width: '100%',
                  marginTop: '16px',
                  padding: '14px',
                  fontSize: '15px',
                  fontWeight: 800,
                  letterSpacing: '0.04em',
                }}
              >
                {submittingOrder
                  ? cText.submitting
                  : `${cText.confirm_order_btn} (${money(finalTotal)})`}
              </button>

              <div
                style={{
                  textAlign: 'center',
                  fontSize: '11px',
                  color: '#6b7280',
                  marginTop: '8px',
                }}
              >
                {cText.security_note}
              </div>
            </form>
          )}
        </div>

        {/* Footer for Cart mode */}
        {!orderSuccess && !isCheckoutMode && cart.length > 0 && (
          <div className="drawer-bottom" id="cartBottom">
            <div className="total">
              <span>{cText.subtotal}</span>
              <span id="subtotal">{money(subtotal)}</span>
            </div>
            {appliedVoucher && (
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  color: '#2e6b36',
                  marginBottom: '8px',
                  fontSize: '13px',
                }}
              >
                <span>{cText.voucher_discount} ({appliedVoucher.code})</span>
                <span>-{money(discountAmount)}</span>
              </div>
            )}
            <button
              className="primary"
              disabled={selectedItemIds.length === 0}
              onClick={() => {
                if (selectedItemIds.length === 0) {
                  showToast(cText.no_items_selected_alert);
                  return;
                }
                setIsCheckoutMode(true);
              }}
              style={{
                width: '100%',
                padding: '14px',
                fontSize: '14px',
                fontWeight: 800,
                opacity: selectedItemIds.length === 0 ? 0.5 : 1,
                cursor: selectedItemIds.length === 0 ? 'not-allowed' : 'pointer',
              }}
            >
              {selectedItemIds.length > 0
                ? `${cText.proceed_checkout} (${totalQuantity})`
                : cText.proceed_checkout}
            </button>
            <p className="dim" style={{ textAlign: 'center', marginTop: '8px', fontSize: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
              <ShieldCheck size={13} />
              <span>{cText.security_note}</span>
            </p>
          </div>
        )}
      </aside>
    </>
  );
}
