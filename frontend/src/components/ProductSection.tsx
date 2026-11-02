'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useShop } from '@/context/ShopContext';
import ProductCard from './ProductCard';
import { Ruler, RotateCcw, Search } from 'lucide-react';
import { COLORS } from '@/constants';

export default function ProductSection() {
  const {
    products,
    loadingProducts,
    selectedCategory,
    setSelectedCategory,
    searchQuery,
    setSearchQuery,
    setActiveModal,
    dict,
  } = useShop();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const handleUrlState = () => {
        const params = new URLSearchParams(window.location.search);
        const cat = params.get('category');
        if (cat) {
          setSelectedCategory(cat);
        }
        if (cat || window.location.hash === '#products' || params.get('scroll') === '1') {
          setTimeout(() => {
            const el = document.getElementById('products');
            if (el) {
              el.scrollIntoView({ behavior: 'smooth' });
            }
          }, 120);
        }
      };

      handleUrlState();
      window.addEventListener('popstate', handleUrlState);
      return () => window.removeEventListener('popstate', handleUrlState);
    }
  }, [setSelectedCategory]);

  const pText = dict.product;
  const allBrandsLabel = pText.all_brands;
  const allSizesLabel = pText.all_sizes;
  const allCategoryLabel = pText.all_categories;

  const [selectedBrand, setSelectedBrand] = useState('ALL');
  const [selectedSizeFilter, setSelectedSizeFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState<'default' | 'price-asc' | 'price-desc' | 'featured'>('default');

  const brands = useMemo(() => ['Nike', 'Adidas', 'New Balance', 'Puma', 'Salomon', 'Asics', 'Onitsuka Tiger', 'Mizuno', 'Li-Ning', 'Anta'], []);
  const shoeSizes = useMemo(() => ['38', '39', '40', '41', '42', '43', '44', '45'], []);

  // Categories extracted dynamically from product database
  const categories = useMemo(() => {
    const set = new Set<string>(['Running', 'Lifestyle', 'Outdoor', 'Basketball']);
    products.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set);
  }, [products]);

  // Comprehensive filter logic
  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    let result = products.filter((p) => {
      // Category match
      const matchCat =
        selectedCategory === 'Tất cả' ||
        selectedCategory === 'All' ||
        p.category.toLowerCase() === selectedCategory.toLowerCase();

      // Brand match (name or description contains brand)
      const matchBrand =
        selectedBrand === 'ALL' ||
        p.name.toLowerCase().includes(selectedBrand.toLowerCase()) ||
        p.description.toLowerCase().includes(selectedBrand.toLowerCase());

      // Size match
      const matchSize =
        selectedSizeFilter === 'ALL' ||
        (Array.isArray(p.sizes) && p.sizes.includes(selectedSizeFilter));

      // Text search match
      const matchQuery =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q);

      return matchCat && matchBrand && matchSize && matchQuery;
    });

    // Sorting
    if (sortBy === 'price-asc') {
      result.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-desc') {
      result.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'featured') {
      result.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
    }

    return result;
  }, [products, selectedCategory, selectedBrand, selectedSizeFilter, searchQuery, sortBy]);

  const hasActiveFilters =
    (selectedCategory !== 'Tất cả' && selectedCategory !== 'All') ||
    selectedBrand !== 'ALL' ||
    selectedSizeFilter !== 'ALL' ||
    searchQuery.trim() !== '';

  const handleResetFilters = () => {
    setSelectedCategory('Tất cả');
    setSelectedBrand('ALL');
    setSelectedSizeFilter('ALL');
    setSearchQuery('');
  };

  return (
    <section className="section wrap" id="products">
      {/* Section Header */}
      <div className="section-heading">
        <div>
          <span className="eyebrow">{pText.section_eyebrow}</span>
          <h2>{pText.section_title}</h2>
          <p style={{ color: COLORS.gray[500], marginTop: '6px' }}>{pText.section_desc}</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <span
            style={{
              display: 'inline-block',
              background: COLORS.white,
              border: `1px solid ${COLORS.gray[200]}`,
              padding: '6px 14px',
              borderRadius: '9999px',
              fontSize: '13px',
              fontWeight: 700,
              color: COLORS.black.primary,
              boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
            }}
          >
            {loadingProducts ? pText.loading : `${filteredProducts.length} ${pText.items_matched}`}
          </span>
          <br />
          <button
            type="button"
            onClick={() => setActiveModal('sizeguide')}
            style={{
              background: 'none',
              border: 'none',
              color: COLORS.red.primary,
              fontWeight: 700,
              fontSize: '13px',
              cursor: 'pointer',
              marginTop: '8px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Ruler size={15} />
            <span>{pText.size_guide_trigger}</span>
          </button>
        </div>
      </div>

      {/* Floating Filter Control Card */}
      <div className="filter-card">
        {/* Row 1: Search & Sorting */}
        <div
          style={{
            display: 'flex',
            gap: '14px',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '18px',
          }}
        >
          <div style={{ flex: '1 1 320px', maxWidth: '520px', position: 'relative' }}>
            <Search
              size={18}
              style={{
                position: 'absolute',
                left: '14px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: COLORS.gray[400],
                pointerEvents: 'none',
              }}
            />
            <input
              aria-label={pText.search_placeholder}
              className="search"
              id="searchInput"
              placeholder={pText.search_placeholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: '100%', margin: 0, paddingLeft: '42px' }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '13px', fontWeight: 700, color: COLORS.gray[700] }}>
              {pText.sort_label}
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              style={{
                padding: '10px 16px',
                borderRadius: '10px',
                border: `1px solid ${COLORS.gray[300]}`,
                fontSize: '13px',
                fontWeight: 600,
                background: COLORS.white,
                color: COLORS.black.primary,
                cursor: 'pointer',
                outline: 'none',
              }}
            >
              <option value="default">{pText.sort_newest}</option>
              <option value="featured">{pText.sort_featured}</option>
              <option value="price-asc">{pText.sort_price_asc}</option>
              <option value="price-desc">{pText.sort_price_desc}</option>
            </select>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                style={{
                  border: `1px solid ${COLORS.red.border}`,
                  background: COLORS.red.light,
                  padding: '10px 16px',
                  borderRadius: '10px',
                  fontSize: '12px',
                  fontWeight: 700,
                  color: COLORS.red.primary,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.2s',
                }}
                title={pText.reset_filters}
              >
                <RotateCcw size={14} />
                <span>{pText.reset_filters}</span>
              </button>
            )}
          </div>
        </div>

        {/* Row 2: Categories Pills */}
        <div style={{ marginBottom: '16px' }}>
          <div
            style={{
              fontSize: '11px',
              fontWeight: 800,
              letterSpacing: '0.06em',
              color: COLORS.gray[500],
              marginBottom: '8px',
              textTransform: 'uppercase',
            }}
          >
            {pText.filter_categories}
          </div>
          <div className="categories">
            <button
              type="button"
              className={`chip ${(selectedCategory === 'Tất cả' || selectedCategory === 'All') ? 'active' : ''}`}
              onClick={() => {
                setSelectedCategory('Tất cả');
                if (typeof window !== 'undefined') {
                  window.history.pushState({}, '', '/products');
                }
              }}
            >
              {allCategoryLabel}
            </button>
            {categories.map((cat) => {
              const label = pText.categories_map[cat] || cat;
              return (
                <button
                  key={cat}
                  type="button"
                  className={`chip ${selectedCategory === cat ? 'active' : ''}`}
                  onClick={() => {
                  setSelectedCategory(cat);
                  if (typeof window !== 'undefined') {
                    window.history.pushState({}, '', `/products?category=${encodeURIComponent(cat)}`);
                  }
                }}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Row 3: Brands Filter */}
        <div style={{ marginBottom: '16px' }}>
          <div
            style={{
              fontSize: '11px',
              fontWeight: 800,
              letterSpacing: '0.06em',
              color: COLORS.gray[500],
              marginBottom: '8px',
              textTransform: 'uppercase',
            }}
          >
            {pText.filter_brands}
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => setSelectedBrand('ALL')}
              style={{
                border: selectedBrand === 'ALL' ? `1.5px solid ${COLORS.black.primary}` : `1px solid ${COLORS.gray[200]}`,
                background: selectedBrand === 'ALL' ? COLORS.black.primary : COLORS.gray[50],
                color: selectedBrand === 'ALL' ? COLORS.white : COLORS.gray[700],
                borderRadius: '8px',
                padding: '6px 14px',
                fontSize: '12px',
                fontWeight: selectedBrand === 'ALL' ? 800 : 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {allBrandsLabel}
            </button>
            {brands.map((brand) => (
              <button
                key={brand}
                type="button"
                onClick={() => setSelectedBrand(brand)}
                style={{
                  border: selectedBrand === brand ? `1.5px solid ${COLORS.black.primary}` : `1px solid ${COLORS.gray[200]}`,
                  background: selectedBrand === brand ? COLORS.black.primary : COLORS.gray[50],
                  color: selectedBrand === brand ? COLORS.white : COLORS.gray[700],
                  borderRadius: '8px',
                  padding: '6px 14px',
                  fontSize: '12px',
                  fontWeight: selectedBrand === brand ? 800 : 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {brand}
              </button>
            ))}
          </div>
        </div>

        {/* Row 4: Shoe Sizes Filter */}
        <div>
          <div
            style={{
              fontSize: '11px',
              fontWeight: 800,
              letterSpacing: '0.06em',
              color: COLORS.gray[500],
              marginBottom: '8px',
              textTransform: 'uppercase',
            }}
          >
            {pText.filter_sizes}
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => setSelectedSizeFilter('ALL')}
              style={{
                border: selectedSizeFilter === 'ALL' ? `1.5px solid ${COLORS.red.primary}` : `1px solid ${COLORS.gray[200]}`,
                background: selectedSizeFilter === 'ALL' ? COLORS.red.primary : COLORS.white,
                color: selectedSizeFilter === 'ALL' ? COLORS.white : COLORS.gray[700],
                borderRadius: '8px',
                padding: '6px 14px',
                fontSize: '12px',
                fontWeight: selectedSizeFilter === 'ALL' ? 800 : 600,
                cursor: 'pointer',
                minWidth: '40px',
                textAlign: 'center',
                transition: 'all 0.15s ease',
              }}
            >
              {allSizesLabel}
            </button>
            {shoeSizes.map((sz) => (
              <button
                key={sz}
                type="button"
                onClick={() => setSelectedSizeFilter(sz)}
                style={{
                  border: selectedSizeFilter === sz ? `1.5px solid ${COLORS.red.primary}` : `1px solid ${COLORS.gray[200]}`,
                  background: selectedSizeFilter === sz ? COLORS.red.primary : COLORS.white,
                  color: selectedSizeFilter === sz ? COLORS.white : COLORS.gray[700],
                  borderRadius: '8px',
                  padding: '6px 12px',
                  fontSize: '12px',
                  fontWeight: selectedSizeFilter === sz ? 800 : 600,
                  cursor: 'pointer',
                  minWidth: '38px',
                  textAlign: 'center',
                  transition: 'all 0.15s ease',
                }}
              >
                {sz}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Products Grid */}
      {loadingProducts ? (
        <div className="empty">{pText.loading}</div>
      ) : filteredProducts.length === 0 ? (
        <div
          className="empty"
          style={{
            background: COLORS.white,
            borderRadius: '24px',
            border: `1px solid ${COLORS.gray[200]}`,
            boxShadow: 'var(--shadow-card)',
            padding: '70px 24px',
            textAlign: 'center',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
            <Search size={42} strokeWidth={1.5} color={COLORS.gray[400]} />
          </div>
          <b style={{ fontSize: '18px', display: 'block', marginBottom: '8px', color: COLORS.black.primary }}>
            {pText.empty_title}
          </b>
          <p style={{ color: COLORS.gray[500], fontSize: '14px', margin: '0 0 20px' }}>
            {pText.empty_desc}
          </p>
          <button className="primary" onClick={handleResetFilters}>
            {pText.empty_btn}
          </button>
        </div>
      ) : (
        <div className="products" id="productGrid">
          {filteredProducts.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </section>
  );
}
