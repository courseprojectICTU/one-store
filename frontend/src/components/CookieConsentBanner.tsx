'use client';

import React, { useState, useEffect } from 'react';
import { useShop } from '@/context/ShopContext';
import { ShieldCheck } from 'lucide-react';

export default function CookieConsentBanner() {
  const { dict, acceptCookieConsent, declineCookieConsent, cookieConsent } = useShop();
  const cText = dict.common.cookie_consent;

  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('one:cookie-consent');
      const hasCookie =
        typeof document !== 'undefined' &&
        document.cookie.includes('one_cookie_consent=accepted');
      if (!stored && !hasCookie && !cookieConsent) {
        // Delay slightly for smooth entrance
        const timer = setTimeout(() => {
          setVisible(true);
        }, 800);
        return () => clearTimeout(timer);
      }
    } catch {
      // ignore
    }
  }, [cookieConsent]);

  if (!visible || !cText || cookieConsent) return null;

  const handleAccept = () => {
    acceptCookieConsent();
    setVisible(false);
  };

  const handleDismiss = () => {
    declineCookieConsent();
    setVisible(false);
  };

  return (
    <aside
      aria-label={cText.title}
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        maxWidth: '430px',
        width: 'calc(100% - 48px)',
        zIndex: 9999,
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: '1px solid rgba(0, 0, 0, 0.08)',
        borderRadius: '16px',
        boxShadow: '0 16px 40px rgba(0, 0, 0, 0.12), 0 4px 12px rgba(0, 0, 0, 0.05)',
        padding: '20px 22px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            background: 'rgba(227, 30, 45, 0.08)',
            color: 'var(--red, #e31e2d)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <ShieldCheck size={18} strokeWidth={2.2} />
        </div>
        <h4
          style={{
            margin: 0,
            fontSize: '0.95rem',
            fontWeight: 700,
            color: 'var(--text-main, #111111)',
            letterSpacing: '-0.01em',
          }}
        >
          {cText.title}
        </h4>
      </div>

      <p
        style={{
          margin: 0,
          fontSize: '0.82rem',
          lineHeight: 1.5,
          color: 'var(--text-muted, #555555)',
        }}
      >
        {cText.desc}
      </p>

      <div
        style={{
          fontSize: '0.74rem',
          color: 'var(--text-dim, #888888)',
          fontWeight: 500,
        }}
      >
        {cText.learn_more}
      </div>

      <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
        <button
          type="button"
          onClick={handleAccept}
          style={{
            flex: 1,
            background: 'var(--red, #e31e2d)',
            color: '#ffffff',
            border: 'none',
            borderRadius: '8px',
            padding: '9px 16px',
            fontSize: '0.85rem',
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(227, 30, 45, 0.25)',
            transition: 'all 0.2s ease',
          }}
        >
          {cText.accept}
        </button>
        <button
          type="button"
          onClick={handleDismiss}
          style={{
            background: 'transparent',
            color: 'var(--text-muted, #666666)',
            border: '1px solid rgba(0, 0, 0, 0.12)',
            borderRadius: '8px',
            padding: '9px 14px',
            fontSize: '0.82rem',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
        >
          {cText.decline}
        </button>
      </div>
    </aside>
  );
}
