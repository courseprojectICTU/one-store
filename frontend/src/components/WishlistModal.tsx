'use client';

import React from 'react';
import { useShop } from '@/context/ShopContext';
import { money, imageOf } from '@/lib/api';
import { X } from 'lucide-react';

export default function WishlistModal() {
  const {
    activeModal,
    setActiveModal,
    products,
    wishlistIds,
    toggleWishlist,
    setSelectedProduct,
    dict,
  } = useShop();

  const wText = dict.modals.wishlist;

  if (activeModal !== 'wishlist') return null;

  const handleClose = () => setActiveModal(null);

  const favoritedProducts = products.filter((p) => wishlistIds.includes(p.id));

  return (
    <>
      <div className="overlay open" onClick={handleClose} />
      <div className="modal open" id="commerceModal">
        <div className="modalbox" style={{ padding: '28px', maxWidth: '640px' }}>
          <button aria-label="Close" className="close" onClick={handleClose} style={{ float: 'right', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={20} />
          </button>
          <div>
            <h2>{wText.title} ({wishlistIds.length})</h2>
            <p className="dim">{wText.subtitle}</p>

            {favoritedProducts.length === 0 ? (
              <div className="empty" style={{ padding: '40px 20px' }}>
                {wText.empty}
              </div>
            ) : (
              <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '14px', maxHeight: '400px', overflowY: 'auto' }}>
                {favoritedProducts.map((p) => (
                  <div key={p.id} className="cRow">
                    <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        alt={p.name}
                        src={imageOf(p)}
                        style={{ width: '60px', height: '75px', objectFit: 'cover', borderRadius: '2px' }}
                      />
                      <div>
                        <strong style={{ fontSize: '14px' }}>{p.name}</strong>
                        <div className="dim">{dict.product.categories_map[p.category] || p.category}</div>
                        <div className="money" style={{ marginTop: '4px' }}>{money(p.price)}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        className="smallbtn"
                        onClick={() => {
                          setSelectedProduct(p);
                          setActiveModal('detail');
                        }}
                      >
                        {wText.buy_action}
                      </button>
                      <button
                        className="smallbtn"
                        style={{ color: '#a54a47' }}
                        onClick={() => toggleWishlist(p.id)}
                      >
                        {wText.remove_action}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
