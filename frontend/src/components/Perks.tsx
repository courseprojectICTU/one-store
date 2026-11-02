'use client';

import React from 'react';
import { useShop } from '@/context/ShopContext';
import { ShieldCheck, Ruler, PackageCheck, Headphones } from 'lucide-react';
import { COLORS } from '@/constants';

export default function Perks() {
  const { dict } = useShop();

  return (
    <div className="wrap">
      <div className="perks">
        <div className="perk-card">
          <div className="perk-icon-wrap">
            <ShieldCheck size={22} strokeWidth={2.2} />
          </div>
          <strong>{dict.common.perks.authentic_title}</strong>
          <small>{dict.common.perks.authentic_desc}</small>
        </div>

        <div className="perk-card">
          <div className="perk-icon-wrap">
            <Ruler size={22} strokeWidth={2.2} />
          </div>
          <strong>{dict.common.perks.exchange_title}</strong>
          <small>{dict.common.perks.exchange_desc}</small>
        </div>

        <div className="perk-card">
          <div className="perk-icon-wrap">
            <PackageCheck size={22} strokeWidth={2.2} />
          </div>
          <strong>{dict.common.perks.shipping_title}</strong>
          <small>{dict.common.perks.shipping_desc}</small>
        </div>

        <div className="perk-card">
          <div className="perk-icon-wrap">
            <Headphones size={22} strokeWidth={2.2} />
          </div>
          <strong>{dict.common.perks.support_title}</strong>
          <small>{dict.common.perks.support_desc}</small>
        </div>
      </div>
    </div>
  );
}
