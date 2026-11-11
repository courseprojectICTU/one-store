'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useShop } from '@/context/ShopContext';

export default function VisitorTracker() {
  const pathname = usePathname();
  const { locale } = useShop();
  const lastTrackedRef = useRef<{ path: string; at: number } | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const cleanPath = (pathname || '/').replace(/\/+$/, '') || '/';
    if (cleanPath.startsWith('/admin')) return;

    const now = Date.now();
    const last = lastTrackedRef.current;
    if (last && last.path === cleanPath && now - last.at < 3000) {
      return;
    }
    lastTrackedRef.current = { path: cleanPath, at: now };

    const screen = `${window.screen?.width || 0}x${window.screen?.height || 0}`;
    const referrer = document.referrer ? document.referrer.slice(0, 400) : '';

    fetch('/api/visit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        path: cleanPath,
        referrer,
        locale,
        screen,
      }),
      keepalive: true,
    }).catch(() => {});
  }, [pathname, locale]);

  return null;
}

