'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { ShopProvider } from '@/context/ShopContext';
import ProductDetailModal from '@/components/ProductDetailModal';
import SizeGuideModal from '@/components/SizeGuideModal';
import CartDrawer from '@/components/CartDrawer';
import CookieConsentBanner from '@/components/CookieConsentBanner';
import WishlistModal from '@/components/WishlistModal';
import ChatbotWidget from '@/components/ChatbotWidget';
import StickyMobileBar from '@/components/StickyMobileBar';
import Toast from '@/components/Toast';

function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith('/admin');

  // Khi đang ở cổng quản trị /admin, ẩn toàn bộ modals mua sắm và widget của khách hàng
  if (isAdmin) {
    return <>{children}</>;
  }

  return (
    <>
      {children}
      <ProductDetailModal />
      <SizeGuideModal />
      <CartDrawer />
      <WishlistModal />
      <ChatbotWidget />
      <StickyMobileBar />
      <CookieConsentBanner />
      <Toast />
    </>
  );
}

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ShopProvider>
      <AppShell>{children}</AppShell>
    </ShopProvider>
  );
}
