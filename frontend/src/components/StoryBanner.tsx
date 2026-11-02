'use client';

import React from 'react';
import { useShop } from '@/context/ShopContext';
import { ArrowUpRight, Award } from 'lucide-react';
import { COLORS } from '@/constants';

export default function StoryBanner() {
  const { dict } = useShop();

  const scrollToProducts = (e: React.MouseEvent) => {
    e.preventDefault();
    const el = document.getElementById('products');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="story-wrapper">
      <section className="banner" id="story" aria-label="One - Store Quality Commitment">
        <div>
          <span className="eyebrow">
            <Award size={14} style={{ color: '#ff4d6d' }} />
            <span>{dict.common.story.eyebrow}</span>
          </span>
          <h2>
            {dict.common.story.headline_line1}
            <br />
            <span style={{ color: '#ff4d6d' }}>{dict.common.story.headline_line2}</span>
          </h2>
          <p>{dict.common.story.subhead}</p>
          <a
            className="primary"
            href="#products"
            onClick={scrollToProducts}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '14px 26px',
            }}
          >
            <span>{dict.common.story.cta}</span>
            <ArrowUpRight size={18} strokeWidth={2.5} />
          </a>
        </div>
        <div className="banner-image" />
      </section>
    </div>
  );
}
