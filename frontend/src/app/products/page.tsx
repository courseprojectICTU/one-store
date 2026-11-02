'use client';

import React from 'react';
import Header from '@/components/Header';
import StoryBanner from '@/components/StoryBanner';
import ProductSection from '@/components/ProductSection';
import Footer from '@/components/Footer';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { useShop } from '@/context/ShopContext';

export default function ProductsPage() {
  const { dict, selectedCategory, setSelectedCategory } = useShop();


  const getCategoryLabel = (cat: string) => {
    const c = cat.toLowerCase();
    if (c === 'running') return dict.common.nav.running;
    if (c === 'lifestyle') return dict.common.nav.lifestyle;
    if (c === 'outdoor') return dict.common.nav.outdoor;
    if (c === 'basketball') return dict.common.nav.basketball;
    const mapped = dict.product.categories_map[cat] || cat;
    return mapped.toUpperCase();
  };

  const isSpecificCategory =
    selectedCategory &&
    selectedCategory !== 'Tất cả' &&
    selectedCategory !== 'All';

  return (
    <div id="shop">
      <Header />
      <main>
        {/* Breadcrumb điều hướng về trang chủ */}
        <div className="wrap" style={{ paddingTop: '28px' }}>
          <nav aria-label="Breadcrumb">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#666' }}>
              <Link href="/" style={{ color: '#666', textDecoration: 'none' }}>
                {dict.common.nav.home}
              </Link>
              <ChevronRight size={14} />
              {isSpecificCategory ? (
                <>
                  <Link
                    href="/products"
                    onClick={() => setSelectedCategory('Tất cả')}
                    style={{ color: '#666', textDecoration: 'none' }}
                  >
                    {dict.common.nav.products}
                  </Link>
                  <ChevronRight size={14} />
                  <span style={{ color: '#111', fontWeight: 600 }}>
                    {getCategoryLabel(selectedCategory)}
                  </span>
                </>
              ) : (
                <span style={{ color: '#111', fontWeight: 600 }}>
                  {dict.common.nav.products}
                </span>
              )}
            </div>
          </nav>
        </div>

        {/* Banner nhỏ ở đầu trang sản phẩm */}
        <div className="products-top-banner">
          <StoryBanner />
        </div>
        <ProductSection />
      </main>
      <Footer />
    </div>
  );
}
