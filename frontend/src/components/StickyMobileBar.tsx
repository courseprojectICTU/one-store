'use client';

import React from 'react';
import { useShop } from '@/context/ShopContext';
import { money } from '@/lib/api';
import { ShoppingBag, Zap, ArrowDown } from 'lucide-react';
import { COLORS } from '@/constants';

export default function StickyMobileBar() {
  const { cartCount, subtotal, isCartOpen, setIsCartOpen, setIsCheckoutMode, activeModal, dict } =
    useShop();

  // Hide if drawer or any modal is open, to prevent visual overlap
  if (isCartOpen || activeModal !== null) {
    return null;
  }

  const handleOpenCart = () => {
    setIsCheckoutMode(false);
    setIsCartOpen(true);
  };

  const handleOpenCheckout = () => {
    if (cartCount > 0) {
      setIsCheckoutMode(true);
      setIsCartOpen(true);
    } else {
      const el = document.getElementById('products');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="mobile-bottom-bar" aria-label="Mobile sticky action bar">
      <button
        type="button"
        className="mobile-cart-btn"
        onClick={handleOpenCart}
        title={dict.common.mobile_bar.cart_label}
      >
        <div style={{ position: 'relative', display: 'inline-flex' }}>
          <ShoppingBag size={22} />
          {cartCount > 0 && (
            <span
              style={{
                position: 'absolute',
                top: '-7px',
                right: '-9px',
                background: COLORS.red.primary,
                color: '#fff',
                fontSize: '11px',
                fontWeight: 800,
                borderRadius: '10px',
                padding: '1px 6px',
                minWidth: '16px',
                textAlign: 'center',
              }}
            >
              {cartCount}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left', lineHeight: 1.2 }}>
          <span style={{ fontSize: '11px', color: COLORS.gray[500], fontWeight: 600 }}>
            {dict.common.mobile_bar.cart_label}
          </span>
          <span style={{ fontSize: '13px', fontWeight: 800, color: COLORS.black.primary }}>
            {cartCount > 0 ? money(subtotal) : '0₫'}
          </span>
        </div>
      </button>

      <button
        type="button"
        className="mobile-checkout-btn"
        onClick={handleOpenCheckout}
        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}
      >
        {cartCount > 0 ? (
          <>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
              <Zap size={14} />
              <span>{dict.common.mobile_bar.checkout_action}</span>
            </span>
            <span style={{ fontSize: '11px', opacity: 0.85, fontWeight: 500 }}>
              {dict.common.mobile_bar.checkout_sub}
            </span>
          </>
        ) : (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
            <span>{dict.common.mobile_bar.explore_action}</span>
            <ArrowDown size={14} />
          </span>
        )}
      </button>
    </div>
  );
}
