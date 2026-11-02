'use client';

import React from 'react';
import { useShop } from '@/context/ShopContext';

export default function Toast() {
  const { toastMessage } = useShop();

  if (!toastMessage) return null;

  return (
    <div className="toast show" role="status">
      {toastMessage}
    </div>
  );
}
