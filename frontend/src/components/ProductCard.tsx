'use client';

import React, { useState, useEffect } from 'react';
import { Product } from '@/types';
import { money, imageOf } from '@/lib/api';
import { useShop } from '@/context/ShopContext';
import { Heart, Ruler, ShoppingBag } from 'lucide-react';
import { COLORS } from '@/constants';

function getColorDot(colorName: string): string {
  const c = colorName.toLowerCase();
  if (c.includes('đen') || c.includes('black')) return '#18181b';
  if (c.includes('trắng') || c.includes('white')) return '#ffffff';
  if (c.includes('đỏ') || c.includes('red')) return '#e11d48';
  if (c.includes('hồng') || c.includes('pink')) return '#ec4899';
  if (c.includes('cam') || c.includes('orange') || c.includes('volt')) return '#f97316';
  if (c.includes('vàng') || c.includes('yellow')) return '#eab308';
  if (c.includes('xanh lá') || c.includes('green') || c.includes('rêu')) return '#16a34a';
  if (c.includes('navy')) return '#1e3a8a';
  if (c.includes('xanh') || c.includes('blue') || c.includes('ngọc') || c.includes('mint')) return '#0284c7';
  if (c.includes('tím') || c.includes('purple')) return '#9333ea';
  if (c.includes('nâu') || c.includes('brown')) return '#78350f';
  if (c.includes('xám') || c.includes('bạc') || c.includes('grey') || c.includes('silver')) return '#94a3b8';
  return '#71717a';
}

export default function ProductCard({ product }: { product: Product }) {
  const {
    setSelectedProduct,
    setActiveModal,
    toggleWishlist,
    isWishlisted,
    addToCart,
    buyNow,
    dict,
  } = useShop();

  const pc = dict.product.card;
  const wishlisted = isWishlisted(product.id);
  const availableSizes =
    product.sizes && product.sizes.length > 0 ? product.sizes : ['39', '40', '41', '42', '43'];
  const availableColors =
    product.colors && product.colors.length > 0 ? product.colors : ['Đen', 'Trắng'];

  const [selectedSize, setSelectedSize] = useState<string>(availableSizes[0]);
  const [selectedColor, setSelectedColor] = useState<string>(availableColors[0]);
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    if (availableSizes.length > 0 && !availableSizes.includes(selectedSize)) {
      setSelectedSize(availableSizes[0]);
    }
  }, [product.sizes]);

  useEffect(() => {
    if (availableColors.length > 0 && !availableColors.includes(selectedColor)) {
      setSelectedColor(availableColors[0]);
    }
  }, [product.colors]);

  const handleOpenDetail = () => {
    setSelectedProduct(product);
    setActiveModal('detail');
  };

  const handleOpenSizeGuide = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveModal('sizeguide');
  };

  const handleBuyNow = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (product.stock <= 0) return;
    buyNow({
      product_id: product.id,
      product_name: product.name,
      size: selectedSize,
      color: selectedColor,
      quantity: 1,
      unit_price: product.price,
      image_url: imageOf(product),
    });
  };

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (product.stock <= 0) return;
    setIsAdding(true);
    addToCart({
      product_id: product.id,
      product_name: product.name,
      size: selectedSize,
      color: selectedColor,
      quantity: 1,
      unit_price: product.price,
      image_url: imageOf(product),
    });
    setTimeout(() => setIsAdding(false), 600);
  };

  return (
    <article className="product">
      {/* Wishlist toggle */}
      <button
        aria-label={wishlisted ? pc.wishlist_remove_aria : pc.wishlist_add_aria}
        className="fav-toggle"
        onClick={(e) => {
          e.stopPropagation();
          toggleWishlist(product.id);
        }}
        title={wishlisted ? pc.wishlist_saved_title : pc.wishlist_save_title}
      >
        <Heart
          size={16}
          fill={wishlisted ? COLORS.red.primary : 'none'}
          color={wishlisted ? COLORS.red.primary : COLORS.gray[500]}
        />
      </button>

      {/* Product Image Area */}
      <div className="photo" onClick={handleOpenDetail}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img alt={product.name} loading="lazy" src={imageOf(product)} />
        {product.stock <= 0 ? (
          <span className="tag" style={{ background: COLORS.gray[600], boxShadow: 'none' }}>
            {pc.out_of_stock}
          </span>
        ) : product.featured ? (
          <span className="tag">{pc.best_seller}</span>
        ) : product.compare_at_price && product.compare_at_price > product.price ? (
          <span className="tag">{pc.discount}</span>
        ) : null}

        <button
          className="quick"
          onClick={(e) => {
            e.stopPropagation();
            handleOpenDetail();
          }}
        >
          {pc.view_detail}
        </button>
      </div>

      {/* Product Details Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', marginTop: '14px' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '4px',
          }}
        >
          <span className="sub">
            {dict.product.categories_map[product.category] || product.category}
          </span>
          <button
            type="button"
            onClick={handleOpenSizeGuide}
            style={{
              background: 'none',
              border: 'none',
              color: COLORS.gray[500],
              fontSize: '11px',
              cursor: 'pointer',
              padding: 0,
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              transition: 'color 0.2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = COLORS.red.primary)}
            onMouseLeave={(e) => (e.currentTarget.style.color = COLORS.gray[500])}
          >
            <Ruler size={12} />
            <span>{pc.size_guide_link}</span>
          </button>
        </div>

        <h3
          onClick={handleOpenDetail}
          style={{
            cursor: 'pointer',
            fontSize: '15px',
            lineHeight: 1.42,
            margin: '0 0 8px',
            minHeight: '42px',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {product.name}
        </h3>

        <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: '12px' }}>
          <span className="money">{money(product.price)}</span>
          {product.compare_at_price && product.compare_at_price > product.price && (
            <span className="old">{money(product.compare_at_price)}</span>
          )}
        </div>

        {/* Quick Size Selection Pills */}
        <div style={{ marginBottom: '10px' }}>
          <div
            style={{
              fontSize: '11px',
              fontWeight: 700,
              color: COLORS.gray[600],
              marginBottom: '6px',
              display: 'flex',
              justifyContent: 'space-between',
            }}
          >
            <span>
              {pc.select_size} <b style={{ color: COLORS.black.primary }}>{selectedSize}</b>
            </span>
          </div>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {availableSizes.map((sz) => {
              const isSelected = selectedSize === sz;
              return (
                <button
                  key={sz}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedSize(sz);
                  }}
                  style={{
                    border: isSelected ? `1.5px solid ${COLORS.black.primary}` : `1px solid ${COLORS.gray[200]}`,
                    background: isSelected ? COLORS.black.primary : COLORS.gray[50],
                    color: isSelected ? COLORS.white : COLORS.gray[700],
                    borderRadius: '6px',
                    padding: '3px 8px',
                    fontSize: '11px',
                    fontWeight: isSelected ? 800 : 600,
                    cursor: 'pointer',
                    minWidth: '32px',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {sz}
                </button>
              );
            })}
          </div>
        </div>

        {/* Quick Color Selection Pills */}
        <div style={{ marginBottom: '14px' }}>
          <div
            style={{
              fontSize: '11px',
              fontWeight: 700,
              color: COLORS.gray[600],
              marginBottom: '6px',
              display: 'flex',
              justifyContent: 'space-between',
            }}
          >
            <span>
              {pc.select_color || 'Chọn màu sắc:'}{' '}
              <b style={{ color: COLORS.black.primary }}>
                {dict.product.colors_map[selectedColor] || selectedColor}
              </b>
            </span>
          </div>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {availableColors.map((col) => {
              const isSelected = selectedColor === col;
              const dotColor = getColorDot(col);
              const isWhiteDot =
                col.toLowerCase().includes('trắng') || col.toLowerCase().includes('white');
              const displayColor = dict.product.colors_map[col] || col;

              return (
                <button
                  key={col}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedColor(col);
                  }}
                  title={displayColor}
                  style={{
                    border: isSelected ? `1.5px solid ${COLORS.black.primary}` : `1px solid ${COLORS.gray[200]}`,
                    background: isSelected ? COLORS.black.primary : COLORS.gray[50],
                    color: isSelected ? COLORS.white : COLORS.gray[700],
                    borderRadius: '6px',
                    padding: '3px 8px',
                    fontSize: '11px',
                    fontWeight: isSelected ? 800 : 600,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    maxWidth: '100%',
                  }}
                >
                  <span
                    style={{
                      width: '7px',
                      height: '7px',
                      borderRadius: '50%',
                      backgroundColor: dotColor,
                      border: isWhiteDot ? '1px solid #d4d4d8' : 'none',
                      flexShrink: 0,
                    }}
                  />
                  <span
                    style={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {displayColor}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Action Buttons: MUA NGAY (Red Sneaker Energy) + Giỏ Hàng (Icon) */}
        <div style={{ display: 'flex', gap: '8px', marginTop: 'auto' }}>
          <button
            type="button"
            className="primary"
            onClick={handleBuyNow}
            disabled={product.stock <= 0}
            style={{
              flex: 1,
              padding: '11px 16px',
              fontSize: '13px',
              fontWeight: 800,
              borderRadius: '10px',
            }}
          >
            {product.stock <= 0 ? pc.out_of_stock : pc.buy_now}
          </button>

          <button
            type="button"
            onClick={handleQuickAdd}
            disabled={product.stock <= 0 || isAdding}
            title={pc.add_to_cart_tooltip}
            aria-label={pc.add_to_cart_tooltip}
            style={{
              width: '44px',
              height: '42px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: `1.5px solid ${COLORS.gray[300]}`,
              background: isAdding ? COLORS.black.primary : COLORS.white,
              color: isAdding ? COLORS.white : COLORS.black.primary,
              borderRadius: '10px',
              cursor: 'pointer',
              flexShrink: 0,
              transition: 'all 0.2s ease',
            }}
          >
            <ShoppingBag size={18} strokeWidth={2.2} />
          </button>
        </div>
      </div>
    </article>
  );
}
