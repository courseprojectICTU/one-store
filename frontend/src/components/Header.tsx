'use client';

import React from 'react';
import { useShop } from '@/context/ShopContext';
import Logo from './Logo';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Globe, Heart, Search, ShoppingBag } from 'lucide-react';

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();

  const {
    cartCount,
    setIsCartOpen,
    setActiveModal,
    selectedCategory,
    setSelectedCategory,
    wishlistIds,
    memberUser,
    dict,
    locale,
    setLocale,
    cookieConsent,
    acceptCookieConsent,
  } = useShop();

  const cleanPath = (pathname || '/').replace(/\/+$/, '') || '/';
  const categoryLower = (selectedCategory || '').toLowerCase();

  const isHomeActive = cleanPath === '/';
  const isRunningActive = cleanPath === '/products' && categoryLower === 'running';
  const isLifestyleActive = cleanPath === '/products' && categoryLower === 'lifestyle';
  const isOutdoorActive = cleanPath === '/products' && categoryLower === 'outdoor';
  const isProductsActive =
    cleanPath === '/products' && !isRunningActive && !isLifestyleActive && !isOutdoorActive;
  const isOrdersActive = cleanPath === '/orders';
  const isPoliciesActive = cleanPath === '/policies';

  const scrollToCatalog = () => {
    const el = document.getElementById('products');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleSearchFocus = () => {
    if (cleanPath === '/products') {
      scrollToCatalog();
      const searchInput = document.getElementById('searchInput');
      if (searchInput) searchInput.focus();
    } else {
      router.push('/products#products');
      setTimeout(() => {
        scrollToCatalog();
        const searchInput = document.getElementById('searchInput');
        if (searchInput) searchInput.focus();
      }, 300);
    }
  };

  return (
    <>
      <div className="announcement">
        {dict.common.announcement}
      </div>
      {!cookieConsent && (
        <div
          className="cookie-declined-strip"
          style={{
            background: '#ffffff',
            color: '#000000',
            borderBottom: '1px solid #e4e4e7',
            padding: '10px 16px',
            fontSize: '12px',
            fontWeight: 700,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            textAlign: 'center',
            lineHeight: '1.6',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexWrap: 'wrap',
            gap: '6px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
          }}
        >
          <span>
            {dict.common.cookie_consent.declined_bar_prefix}{' '}
            <button
              type="button"
              onClick={acceptCookieConsent}
              style={{
                background: 'none',
                border: 'none',
                color: '#000000',
                textDecoration: 'underline',
                textUnderlineOffset: '3px',
                fontWeight: 900,
                fontSize: 'inherit',
                letterSpacing: 'inherit',
                textTransform: 'uppercase',
                cursor: 'pointer',
                padding: '2px 4px',
                margin: 0,
                fontFamily: 'inherit',
                display: 'inline',
                transition: 'color 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#e11d48';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = '#000000';
              }}
            >
              {dict.common.cookie_consent.declined_bar_action}
            </button>
            .
          </span>
        </div>
      )}
      <header className="header">
        <nav className="nav">
          <Link className="brand" href="/" prefetch={false} style={{ display: 'inline-flex', alignItems: 'center' }}>
            <Logo size="md" />
          </Link>
          <div className="navlinks">
            <Link
              href="/"
              prefetch={false}
              className={isHomeActive ? 'active' : undefined}
              aria-current={isHomeActive ? 'page' : undefined}
            >
              {dict.common.nav.home}
            </Link>
            <Link
              href="/products"
              prefetch={false}
              className={isProductsActive ? 'active' : undefined}
              aria-current={isProductsActive ? 'page' : undefined}
              onClick={(e) => {
                setSelectedCategory('Tất cả');
                if (cleanPath === '/products') {
                  e.preventDefault();
                  window.history.pushState({}, '', '/products');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }
              }}
            >
              {dict.common.nav.products}
            </Link>
            <Link
              href="/products?category=Running#products"
              prefetch={false}
              className={isRunningActive ? 'active' : undefined}
              aria-current={isRunningActive ? 'page' : undefined}
              onClick={(e) => {
                setSelectedCategory('Running');
                if (cleanPath === '/products') {
                  e.preventDefault();
                  window.history.pushState({}, '', '/products?category=Running');
                  scrollToCatalog();
                }
              }}
            >
              {dict.common.nav.running}
            </Link>
            <Link
              href="/products?category=Lifestyle#products"
              prefetch={false}
              className={isLifestyleActive ? 'active' : undefined}
              aria-current={isLifestyleActive ? 'page' : undefined}
              onClick={(e) => {
                setSelectedCategory('Lifestyle');
                if (cleanPath === '/products') {
                  e.preventDefault();
                  window.history.pushState({}, '', '/products?category=Lifestyle');
                  scrollToCatalog();
                }
              }}
            >
              {dict.common.nav.lifestyle}
            </Link>
            <Link
              href="/products?category=Outdoor#products"
              prefetch={false}
              className={isOutdoorActive ? 'active' : undefined}
              aria-current={isOutdoorActive ? 'page' : undefined}
              onClick={(e) => {
                setSelectedCategory('Outdoor');
                if (cleanPath === '/products') {
                  e.preventDefault();
                  window.history.pushState({}, '', '/products?category=Outdoor');
                  scrollToCatalog();
                }
              }}
            >
              {dict.common.nav.outdoor}
            </Link>
            <Link
              href="/orders"
              prefetch={false}
              className={isOrdersActive ? 'active' : undefined}
              aria-current={isOrdersActive ? 'page' : undefined}
            >
              {dict.common.nav.my_orders}
            </Link>
            <Link
              href="/policies"
              prefetch={false}
              className={isPoliciesActive ? 'active' : undefined}
              aria-current={isPoliciesActive ? 'page' : undefined}
            >
              {dict.common.nav.policies}
            </Link>
          </div>
          <div className="navright">
            <button
              type="button"
              className="lang-toggle-btn"
              onClick={() => setLocale(locale === 'vi' ? 'en' : 'vi')}
              title={dict.common.nav.lang_switch_title}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '4px 9px',
                border: '1px solid var(--border, #e5e5e5)',
                borderRadius: '999px',
                fontSize: '0.72rem',
                fontWeight: 700,
                letterSpacing: '0.04em',
                background: 'rgba(255, 255, 255, 0.7)',
                backdropFilter: 'blur(4px)',
                cursor: 'pointer',
                color: 'var(--text-main, #111)',
                transition: 'all 0.2s ease',
              }}
            >
              <Globe size={13} strokeWidth={2} />
              <span>{locale === 'vi' ? 'VIE' : 'ENG'}</span>
            </button>
            <button
              aria-label={dict.common.nav.wishlist}
              className="iconbtn"
              onClick={() => setActiveModal('wishlist')}
              title={dict.common.nav.wishlist}
            >
              <Heart size={18} />
              {wishlistIds.length > 0 && (
                <span className="count">{wishlistIds.length}</span>
              )}
            </button>
            <button
              aria-label={dict.common.nav.search_prompt}
              className="iconbtn"
              onClick={handleSearchFocus}
              title={dict.common.nav.search_prompt}
            >
              <Search size={18} />
            </button>
            <button
              aria-label={dict.common.nav.cart}
              className="iconbtn"
              onClick={() => setIsCartOpen(true)}
              title={dict.common.nav.cart}
            >
              <ShoppingBag size={19} />
              <span className="count">{cartCount}</span>
            </button>
          </div>
        </nav>
      </header>
    </>
  );
}
