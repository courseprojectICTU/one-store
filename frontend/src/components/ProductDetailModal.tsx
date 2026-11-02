'use client';

import React, { useState, useEffect } from 'react';
import { useShop } from '@/context/ShopContext';
import { money, imageOf, api } from '@/lib/api';
import { Review } from '@/types';
import { X, Ruler, Minus, Plus, Heart, Check, Star } from 'lucide-react';
import { COLORS } from '@/constants';

export default function ProductDetailModal() {
  const {
    activeModal,
    setActiveModal,
    selectedProduct,
    setSelectedProduct,
    addToCart,
    buyNow,
    memberToken,
    showToast,
    toggleWishlist,
    isWishlisted,
    dict,
  } = useShop();

  const pm = dict.product.modal;

  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [rating, setRating] = useState<number>(5);
  const [comment, setComment] = useState<string>('');
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    if (selectedProduct) {
      setSelectedSize(selectedProduct.sizes?.[0] || '39');
      setSelectedColor(selectedProduct.colors?.[0] || 'Đen');
      setQuantity(1);
      setComment('');
      setRating(5);

      // Fetch reviews
      setLoadingReviews(true);
      api(`/api/reviews/${selectedProduct.id}`)
        .then((data) => {
          if (Array.isArray(data.reviews)) {
            setReviews(data.reviews);
          }
        })
        .catch(() => setReviews([]))
        .finally(() => setLoadingReviews(false));
    }
  }, [selectedProduct]);

  if (activeModal !== 'detail' || !selectedProduct) return null;

  const handleClose = () => {
    setActiveModal(null);
    setSelectedProduct(null);
  };

  const handleAddToCart = () => {
    if (selectedProduct.stock <= 0) {
      showToast(dict.messages.stock_out_alert);
      return;
    }
    addToCart({
      product_id: selectedProduct.id,
      product_name: selectedProduct.name,
      size: selectedSize,
      color: selectedColor,
      quantity,
      unit_price: selectedProduct.price,
      image_url: imageOf(selectedProduct),
    });
    handleClose();
  };

  const handleBuyNow = () => {
    if (selectedProduct.stock <= 0) {
      showToast(dict.messages.stock_out_alert);
      return;
    }
    buyNow({
      product_id: selectedProduct.id,
      product_name: selectedProduct.name,
      size: selectedSize,
      color: selectedColor,
      quantity,
      unit_price: selectedProduct.price,
      image_url: imageOf(selectedProduct),
    });
    handleClose();
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberToken) {
      showToast(dict.messages.login_required_wishlist);
      return;
    }
    try {
      setSubmittingReview(true);
      await api(`/api/reviews/${selectedProduct.id}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${memberToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ rating, comment }),
      });
      showToast(pm.review_success);
      setComment('');
      // Refresh reviews
      const updated = await api(`/api/reviews/${selectedProduct.id}`);
      if (Array.isArray(updated.reviews)) setReviews(updated.reviews);
    } catch (err: any) {
      showToast(err.message || pm.review_error);
    } finally {
      setSubmittingReview(false);
    }
  };

  const wishlisted = isWishlisted(selectedProduct.id);

  return (
    <>
      <div className="overlay open" onClick={handleClose} />
      <div className="modal open" id="modal">
        <div className="modalbox" id="modalContent">
          <button aria-label="Close" className="close" onClick={handleClose} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={20} />
          </button>
          <div className="detail">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img alt={selectedProduct.name} src={imageOf(selectedProduct)} />
            <div className="detail-content">
              <span className="eyebrow">{dict.product.categories_map[selectedProduct.category] || selectedProduct.category}</span>
              <h2>{selectedProduct.name}</h2>
              <div style={{ marginBottom: '16px' }}>
                <span className="money" style={{ fontSize: '20px' }}>
                  {money(selectedProduct.price)}
                </span>
                {selectedProduct.compare_at_price &&
                  selectedProduct.compare_at_price > selectedProduct.price && (
                    <span className="old" style={{ fontSize: '15px' }}>
                      {money(selectedProduct.compare_at_price)}
                    </span>
                  )}
              </div>

              <p style={{ color: '#555', lineHeight: '1.6', marginBottom: '20px' }}>
                {(dict.product.descriptions_map &&
                  (dict.product.descriptions_map[String(selectedProduct.id)] ||
                    dict.product.descriptions_map[selectedProduct.name])) ||
                  selectedProduct.description ||
                  pm.default_description}
              </p>

              <div style={{ marginBottom: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label style={{ fontWeight: 700, fontSize: '12px' }}>
                    {pm.size_label} <b>{selectedSize}</b>
                  </label>
                  <button
                    type="button"
                    onClick={() => setActiveModal('sizeguide')}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#687e60',
                      fontSize: '12px',
                      cursor: 'pointer',
                      fontWeight: 600,
                      textDecoration: 'underline',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <Ruler size={13} />
                    <span>{pm.size_guide_link}</span>
                  </button>
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {(selectedProduct.sizes || ['39', '40', '41', '42', '43']).map((sz) => (
                    <button
                      key={sz}
                      type="button"
                      className={`chip ${selectedSize === sz ? 'active' : ''}`}
                      onClick={() => setSelectedSize(sz)}
                      style={{ padding: '8px 16px', minWidth: '45px' }}
                    >
                      {sz}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: '18px' }}>
                <label style={{ fontWeight: 700, fontSize: '12px', display: 'block', marginBottom: '6px' }}>
                  {pm.color_label}{' '}
                  <span style={{ fontWeight: 600, color: '#111827' }}>
                    {dict.product.colors_map[selectedColor] || selectedColor}
                  </span>
                </label>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {(selectedProduct.colors || ['Đen', 'Trắng']).map((col) => (
                    <button
                      key={col}
                      type="button"
                      className={`chip ${selectedColor === col ? 'active' : ''}`}
                      onClick={() => setSelectedColor(col)}
                      style={{ padding: '8px 16px' }}
                    >
                      {dict.product.colors_map[col] || col}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px' }}>
                <div style={{ display: 'inline-flex', border: '1px solid #d2d8cd', borderRadius: '4px', alignItems: 'center' }}>
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    style={{ border: 'none', background: 'none', padding: '10px 14px', display: 'flex', alignItems: 'center', cursor: 'pointer' }}
                  >
                    <Minus size={14} />
                  </button>
                  <span style={{ padding: '10px 14px', fontWeight: 700 }}>{quantity}</span>
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.min(selectedProduct.stock || 20, q + 1))}
                    style={{ border: 'none', background: 'none', padding: '10px 14px', display: 'flex', alignItems: 'center', cursor: 'pointer' }}
                  >
                    <Plus size={14} />
                  </button>
                </div>
                <span className="dim">
                  {pm.stock_prefix} {selectedProduct.stock > 0 ? `${selectedProduct.stock} ${pm.items_suffix}` : pm.out_of_stock}
                </span>
              </div>

              {/* Action Buttons: MUA NGAY + THÊM GIỎ HÀNG */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    className="primary"
                    onClick={handleBuyNow}
                    disabled={selectedProduct.stock <= 0}
                    style={{
                      flex: 1,
                      padding: '13px',
                      fontSize: '14px',
                      fontWeight: 800,
                      letterSpacing: '0.04em',
                      background: COLORS.red.primary,
                      borderColor: COLORS.red.primary,
                      color: COLORS.white,
                      borderRadius: '10px',
                    }}
                  >
                    {selectedProduct.stock > 0 ? pm.buy_now_btn : pm.out_of_stock}
                  </button>
                  <button
                    type="button"
                    className="outline"
                    onClick={() => toggleWishlist(selectedProduct.id)}
                    title={wishlisted ? 'Favorited' : 'Add to wishlist'}
                    style={{
                      padding: '0 16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: '10px',
                      borderColor: COLORS.gray[300],
                    }}
                  >
                    <Heart size={18} fill={wishlisted ? COLORS.red.primary : 'none'} color={wishlisted ? COLORS.red.primary : 'currentColor'} />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={selectedProduct.stock <= 0}
                  style={{
                    width: '100%',
                    padding: '12px',
                    fontSize: '13px',
                    fontWeight: 700,
                    border: `1.5px solid ${COLORS.black.primary}`,
                    background: COLORS.white,
                    color: COLORS.black.primary,
                    borderRadius: '10px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  {pm.add_to_cart_btn}
                </button>
              </div>

              {/* Store Guarantees */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '8px',
                  background: '#f8f7f3',
                  padding: '12px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  marginBottom: '20px',
                  border: '1px solid #e4e4df',
                }}
              >
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}><Check size={14} color="#2e6b36" /> <b>{pm.guarantee_authentic}</b></div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}><Check size={14} color="#2e6b36" /> <b>{pm.guarantee_exchange}</b></div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}><Check size={14} color="#2e6b36" /> <b>{pm.guarantee_freeship}</b></div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}><Check size={14} color="#2e6b36" /> <b>{pm.guarantee_cod}</b></div>
              </div>

              {/* Reviews Section */}
              <div className="review-panel" style={{ borderRadius: '4px' }}>
                <h4 style={{ margin: '0 0 10px', fontSize: '15px' }}>
                  {pm.reviews_title} ({reviews.length})
                </h4>
                {loadingReviews ? (
                  <p className="dim">{pm.loading_reviews}</p>
                ) : reviews.length === 0 ? (
                  <p className="dim">{pm.no_reviews}</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '180px', overflowY: 'auto' }}>
                    {reviews.map((r) => (
                      <div key={r.id} style={{ borderBottom: '1px solid #e0e0db', paddingBottom: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                          <b>{r.customer_name || pm.customer_anonymous}</b>
                          <div style={{ display: 'inline-flex', gap: '2px', color: '#d99726' }}>
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                size={12}
                                fill={star <= r.rating ? '#d99726' : 'none'}
                                strokeWidth={1.5}
                              />
                            ))}
                          </div>
                        </div>
                        <p style={{ margin: '4px 0 0', fontSize: '13px' }}>{r.comment}</p>
                      </div>
                    ))}
                  </div>
                )}

                {memberToken ? (
                  <form onSubmit={handleSubmitReview} style={{ marginTop: '14px', borderTop: '1px solid #e4e4df', paddingTop: '10px' }}>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 700 }}>{pm.rating_label}</span>
                      <select
                        value={rating}
                        onChange={(e) => setRating(Number(e.target.value))}
                        style={{ width: 'auto', padding: '6px', margin: 0 }}
                      >
                        <option value={5}>5 sao</option>
                        <option value={4}>4 sao</option>
                        <option value={3}>3 sao</option>
                        <option value={2}>2 sao</option>
                        <option value={1}>1 sao</option>
                      </select>
                    </div>
                    <textarea
                      placeholder={pm.comment_placeholder}
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      required
                      rows={2}
                      style={{ width: '100%', padding: '8px', fontSize: '13px', margin: '4px 0' }}
                    />
                    <button
                      type="submit"
                      className="primary"
                      disabled={submittingReview}
                      style={{ padding: '8px 18px', fontSize: '12px' }}
                    >
                      {submittingReview ? pm.submitting_review_btn : pm.submit_review_btn}
                    </button>
                  </form>
                ) : (
                  <p className="dim" style={{ fontSize: '12px', margin: '10px 0 0' }}>
                    {pm.login_to_review}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
