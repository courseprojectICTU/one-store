'use client';

import React, { useMemo } from 'react';
import { useShop } from '@/context/ShopContext';
import { imageOf } from '@/lib/api';
import { Flame, Trophy } from 'lucide-react';
import { COLORS } from '@/constants';

export default function BestSellers() {
  const { products, setSelectedProduct, setActiveModal, dict } = useShop();
  const bs = dict.common.bestsellers;

  // Chọn ra 4 sản phẩm bán chạy nhất tiêu biểu
  const topSellers = useMemo(() => {
    if (!products || products.length === 0) return [];

    // Danh sách 4 mẫu giày bán chạy iconic nhất
    const targetKeywords = ['Dunk Low', 'Samba OG', 'Gel-Kayano', 'New Balance 550'];
    const matched: typeof products = [];
    const usedIds = new Set<number>();

    for (const kw of targetKeywords) {
      const found = products.find(
        (p) => !usedIds.has(p.id) && p.name.toLowerCase().includes(kw.toLowerCase()),
      );
      if (found) {
        matched.push(found);
        usedIds.add(found.id);
      }
    }

    // Nếu chưa đủ 4 thì lấy thêm từ các sản phẩm có cờ featured hoặc theo thứ tự
    if (matched.length < 4) {
      for (const p of products) {
        if (!usedIds.has(p.id)) {
          matched.push(p);
          usedIds.add(p.id);
        }
        if (matched.length >= 4) break;
      }
    }

    return matched.slice(0, 4);
  }, [products]);

  if (topSellers.length === 0) return null;

  return (
    <div style={{ maxWidth: '1360px', margin: '40px auto 0', padding: '0 32px' }}>
      <section
        aria-label={bs.title}
        style={{
          background: '#ffffff',
          borderRadius: '24px',
          border: '1px solid #e4e4e7',
          padding: 'clamp(28px, 4vw, 44px)',
          boxShadow: '0 10px 30px -10px rgba(0, 0, 0, 0.05)',
        }}
      >
        {/* Section Header */}
        <div style={{ marginBottom: '32px', textAlign: 'center' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(225, 29, 72, 0.08)',
              color: COLORS.red.primary,
              border: '1px solid rgba(225, 29, 72, 0.25)',
              padding: '6px 14px',
              borderRadius: '9999px',
              fontSize: '11px',
              fontWeight: 800,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              marginBottom: '10px',
            }}
          >
            <Flame size={14} />
            <span>{bs.eyebrow}</span>
          </div>

          <h2
            style={{
              fontSize: 'clamp(24px, 3vw, 36px)',
              fontWeight: 800,
              color: '#09090b',
              margin: '0 0 8px',
              letterSpacing: '-0.02em',
              fontFamily: 'var(--font-display)',
            }}
          >
            {bs.title}
          </h2>

          <p
            style={{
              fontSize: '15px',
              color: '#71717a',
              margin: 0,
              maxWidth: '560px',
              marginLeft: 'auto',
              marginRight: 'auto',
            }}
          >
            {bs.subtitle}
          </p>
        </div>

        {/* 4 Cards Grid - Only Image & Name */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '24px',
          }}
        >
          {topSellers.map((item, idx) => (
            <div
              key={item.id}
              onClick={() => {
                setSelectedProduct(item);
                setActiveModal('detail');
              }}
              style={{
                background: '#ffffff',
                border: '1px solid #e4e4e7',
                borderRadius: '20px',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                position: 'relative',
                boxShadow: '0 4px 15px rgba(0, 0, 0, 0.03)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-6px)';
                e.currentTarget.style.borderColor = COLORS.red.primary;
                e.currentTarget.style.boxShadow = '0 16px 36px -10px rgba(225, 29, 72, 0.18)';
                const img = e.currentTarget.querySelector('.bestseller-img') as HTMLElement;
                if (img) img.style.transform = 'scale(1.06)';
                const title = e.currentTarget.querySelector('.bestseller-title') as HTMLElement;
                if (title) title.style.color = COLORS.red.primary;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.borderColor = '#e4e4e7';
                e.currentTarget.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.03)';
                const img = e.currentTarget.querySelector('.bestseller-img') as HTMLElement;
                if (img) img.style.transform = 'scale(1)';
                const title = e.currentTarget.querySelector('.bestseller-title') as HTMLElement;
                if (title) title.style.color = '#09090b';
              }}
            >
              {/* Rank Badge */}
              <div
                style={{
                  position: 'absolute',
                  top: '14px',
                  left: '14px',
                  zIndex: 2,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  background: 'rgba(10, 10, 14, 0.88)',
                  backdropFilter: 'blur(8px)',
                  color: '#ffffff',
                  border: '1px solid rgba(225, 29, 72, 0.5)',
                  padding: '4px 10px',
                  borderRadius: '9999px',
                  fontSize: '11px',
                  fontWeight: 800,
                  letterSpacing: '0.04em',
                }}
              >
                <Trophy size={12} style={{ color: COLORS.red.primary }} />
                <span>{bs.rank_prefix}{idx + 1}</span>
              </div>

              {/* Sneaker Image Container */}
              <div
                style={{
                  position: 'relative',
                  width: '100%',
                  aspectRatio: '1 / 1',
                  background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '24px',
                  overflow: 'hidden',
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imageOf(item)}
                  alt={item.name}
                  className="bestseller-img"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                    transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                  }}
                  loading="lazy"
                />
              </div>

              {/* Sneaker Name Only */}
              <div
                style={{
                  padding: '18px 20px 22px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                  flex: 1,
                  justifyContent: 'center',
                  textAlign: 'center',
                }}
              >
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    color: '#a1a1aa',
                  }}
                >
                  {dict.product.categories_map[item.category] || item.category}
                </span>

                <h3
                  className="bestseller-title"
                  style={{
                    fontSize: '16px',
                    fontWeight: 800,
                    color: '#09090b',
                    margin: 0,
                    lineHeight: 1.35,
                    fontFamily: 'var(--font-display)',
                    transition: 'color 0.2s ease',
                  }}
                >
                  {item.name}
                </h3>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
