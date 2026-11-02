'use client';

import React from 'react';
import Logo from './Logo';
import Link from 'next/link';
import { useShop } from '@/context/ShopContext';

export default function Footer({ onOpenAdmin }: { onOpenAdmin?: () => void }) {
  const { dict, setActiveModal } = useShop();

  return (
    <footer className="footer">
      <div className="footer-inner">
        <div>
          <div style={{ marginBottom: '12px' }}>
            <Logo size="md" showSubtitle />
          </div>
          <p>{dict.common.footer.tagline}</p>
        </div>
        <div>
          <b>{dict.common.footer.explore_title}</b>
          <p>
            <Link href="/products">{dict.common.footer.products_link}</Link>
            <br />
            <Link href="/products#story">{dict.common.footer.story_link}</Link>
            <br />
            <a
              href="#sizeguide"
              onClick={(e) => {
                e.preventDefault();
                setActiveModal('sizeguide');
              }}
            >
              {dict.common.footer.size_guide_link}
            </a>
          </p>
        </div>
        <div>
          <b>{dict.common.footer.support_title}</b>
          <p>
            <Link href="/orders">{dict.common.footer.orders_link}</Link>
            <br />
            <Link href="/policies?tab=authentic">{dict.common.footer.authentic_link}</Link>
            <br />
            <Link href="/policies?tab=shipping">{dict.common.footer.shipping_link}</Link>
            <br />
            <Link href="/policies?tab=returns">{dict.common.footer.returns_link}</Link>
            <br />
            <Link href="/policies?tab=warranty">{dict.common.footer.warranty_link}</Link>
            <br />
            <Link href="/policies?tab=privacy">{dict.common.footer.privacy_link}</Link>
            <br />
            {dict.common.footer.contact_email}
          </p>
        </div>
      </div>
      <div className="footer-inner" style={{ paddingTop: '35px' }}>
        <small>{dict.common.footer.copyright}</small>
        <small style={{ color: '#a1a1aa' }}>
          Hệ thống phân phối giày thể thao & sneaker chính hãng Âu - Á
        </small>
      </div>
    </footer>
  );
}
