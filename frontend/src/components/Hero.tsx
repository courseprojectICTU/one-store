'use client';

import React from 'react';
import { useShop } from '@/context/ShopContext';
import Link from 'next/link';
import { ArrowUpRight, Flame, ShieldCheck } from 'lucide-react';
import { COLORS } from '@/constants';
import Sneaker3DViewer from './Sneaker3DViewer';

export default function Hero() {
  const { dict, setActiveModal } = useShop();

  return (
    <div className="hero-wrapper">
      <section className="hero" aria-label="One - Store Banner">
        <div className="hero-copy">
          <span className="eyebrow">
            <Flame size={14} style={{ color: '#ff4d6d' }} />
            <span>{dict.common.hero.eyebrow}</span>
          </span>
          <h1>
            {dict.common.hero.headline_line1}
            <br />
            <span className="hero-red-highlight">{dict.common.hero.headline_line2}</span>
          </h1>
          <p>{dict.common.hero.subhead}</p>
          <div className="hero-actions">
            <Link
              className="primary"
              href="/products"
            >
              <span>{dict.common.hero.cta}</span>
              <ArrowUpRight size={18} strokeWidth={2.5} />
            </Link>
            <button
              type="button"
              className="secondary-btn"
              onClick={() => setActiveModal('sizeguide')}
            >
              <ShieldCheck size={16} style={{ color: '#ff4d6d' }} />
              <span>{dict.product.size_guide_trigger}</span>
            </button>
          </div>
        </div>

        <div className="hero-photo-wrap" style={{ padding: '24px' }}>
          <Sneaker3DViewer modelUrl="/models/nike_air_jordan_1.glb" height={520} />
        </div>
      </section>
    </div>
  );
}
