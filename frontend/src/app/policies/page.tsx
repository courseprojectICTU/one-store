'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useShop } from '@/context/ShopContext';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  ShieldCheck,
  Truck,
  RotateCcw,
  Wrench,
  Lock,
  Ruler,
  CheckCircle2,
  ChevronRight,
  AlertCircle,
  HelpCircle,
  PhoneCall,
  Clock,
  Sparkles,
  PackageCheck,
  BadgePercent,
  Check,
} from 'lucide-react';
import { COLORS } from '@/constants';

type TabKey = 'authentic' | 'shipping' | 'returns' | 'warranty' | 'privacy' | 'size_guide';

function PoliciesContent() {
  const { dict, locale } = useShop();
  const t = dict.policies;
  const searchParams = useSearchParams();

  const [activeTab, setActiveTab] = useState<TabKey>('authentic');

  // Đọc tab từ query param ?tab=... nếu có
  useEffect(() => {
    const tabParam = searchParams.get('tab') as TabKey;
    if (tabParam && ['authentic', 'shipping', 'returns', 'warranty', 'privacy', 'size_guide'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  const tabsConfig: { key: TabKey; label: string; icon: React.ReactNode }[] = [
    { key: 'authentic', label: t.tabs.authentic, icon: <ShieldCheck size={18} /> },
    { key: 'shipping', label: t.tabs.shipping, icon: <Truck size={18} /> },
    { key: 'returns', label: t.tabs.returns, icon: <RotateCcw size={18} /> },
    { key: 'warranty', label: t.tabs.warranty, icon: <Wrench size={18} /> },
    { key: 'privacy', label: t.tabs.privacy, icon: <Lock size={18} /> },
    { key: 'size_guide', label: t.tabs.size_guide, icon: <Ruler size={18} /> },
  ];

  return (
    <div className="wrap" style={{ paddingTop: '28px', paddingBottom: '90px' }}>
      {/* Breadcrumb */}
      <nav
        aria-label="Breadcrumb"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '0.8rem',
          fontWeight: 700,
          letterSpacing: '0.05em',
          color: '#71717a',
          marginBottom: '28px',
        }}
      >
        <Link href="/" style={{ color: '#71717a', textDecoration: 'none' }}>
          {t.breadcrumb_home}
        </Link>
        <ChevronRight size={14} />
        <span style={{ color: COLORS.red.primary }}>{t.breadcrumb_policies}</span>
      </nav>

      {/* Hero Header Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, #09090b 0%, #18181b 100%)',
          borderRadius: '24px',
          padding: 'clamp(28px, 4vw, 44px)',
          color: '#ffffff',
          position: 'relative',
          overflow: 'hidden',
          marginBottom: '36px',
          border: '1px solid rgba(225, 29, 72, 0.25)',
          boxShadow: '0 20px 45px -15px rgba(0,0,0,0.5)',
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(225, 29, 72, 0.15)',
            border: '1px solid rgba(225, 29, 72, 0.35)',
            color: '#ff4d6d',
            padding: '5px 14px',
            borderRadius: '999px',
            fontSize: '0.72rem',
            fontWeight: 800,
            letterSpacing: '0.06em',
            marginBottom: '16px',
          }}
        >
          <Sparkles size={14} />
          {t.page_eyebrow}
        </div>
        <h1
          style={{
            fontSize: 'clamp(1.6rem, 3.2vw, 2.4rem)',
            fontWeight: 900,
            letterSpacing: '-0.02em',
            margin: '0 0 12px 0',
            lineHeight: 1.2,
            color: '#ffffff'
          }}
        >
          {t.page_title}
        </h1>
        <p
          style={{
            fontSize: '0.95rem',
            color: '#d4d4d8',
            maxWidth: '720px',
            lineHeight: 1.6,
            margin: 0,
          }}
        >
          {t.page_subtitle}
        </p>
      </div>

      {/* Main Policy Layout */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
        {/* Navigation Tabs */}
        <div
          style={{
            display: 'flex',
            gap: '10px',
            overflowX: 'auto',
            paddingBottom: '8px',
            borderBottom: '1px solid #e4e4e7',
          }}
        >
          {tabsConfig.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px 20px',
                  borderRadius: '12px',
                  border: isActive ? `1.5px solid ${COLORS.red.primary}` : '1px solid #e4e4e7',
                  background: isActive ? '#fff1f2' : '#ffffff',
                  color: isActive ? COLORS.red.primary : '#3f3f46',
                  fontWeight: isActive ? 800 : 600,
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  whiteSpace: 'nowrap',
                  boxShadow: isActive ? '0 4px 12px rgba(225, 29, 72, 0.12)' : 'none',
                }}
              >
                {tab.icon}
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content Display */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: '20px',
            border: '1px solid #e4e4e7',
            padding: 'clamp(24px, 4vw, 40px)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
          }}
        >
          {/* TAB 1: 100% AUTHENTIC */}
          {activeTab === 'authentic' && (
            <div>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '4px 12px',
                  background: '#ecfdf5',
                  color: '#059669',
                  borderRadius: '999px',
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  letterSpacing: '0.04em',
                  marginBottom: '14px',
                }}
              >
                <ShieldCheck size={14} />
                {t.authentic.badge}
              </div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: '0 0 14px 0', color: '#18181b' }}>
                {t.authentic.title}
              </h2>
              <p style={{ fontSize: '0.95rem', color: '#52525b', lineHeight: 1.6, marginBottom: '28px' }}>
                {t.authentic.summary}
              </p>

              {/* 3 Highlights */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                  gap: '20px',
                  marginBottom: '36px',
                }}
              >
                {t.authentic.highlights.map((h, i) => (
                  <div
                    key={i}
                    style={{
                      background: '#fafafa',
                      border: '1px solid #e4e4e7',
                      borderRadius: '16px',
                      padding: '22px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px',
                    }}
                  >
                    <div style={{ color: COLORS.red.primary }}>
                      <CheckCircle2 size={24} />
                    </div>
                    <b style={{ fontSize: '1rem', color: '#18181b' }}>{h.title}</b>
                    <span style={{ fontSize: '0.88rem', color: '#52525b', lineHeight: 1.5 }}>{h.desc}</span>
                  </div>
                ))}
              </div>

              {/* Brands Box */}
              <div
                style={{
                  background: '#f8fafc',
                  border: '1px solid #cbd5e1',
                  borderRadius: '16px',
                  padding: '24px',
                }}
              >
                <b style={{ fontSize: '1.05rem', color: '#0f172a', display: 'block', marginBottom: '8px' }}>
                  {t.authentic.details_title}
                </b>
                <p style={{ fontSize: '0.9rem', color: '#475569', lineHeight: 1.6, margin: '0 0 14px 0' }}>
                  {t.authentic.details_desc}
                </p>
                <ul style={{ margin: 0, paddingLeft: '20px', color: '#334155', fontSize: '0.88rem', lineHeight: 1.7 }}>
                  <li>
                    <b>{t.authentic.brands_western}</b>
                  </li>
                  <li>
                    <b>{t.authentic.brands_asian}</b>
                  </li>
                </ul>
                <div
                  style={{
                    marginTop: '16px',
                    paddingTop: '16px',
                    borderTop: '1px dashed #cbd5e1',
                    fontSize: '0.85rem',
                    color: '#64748b',
                    fontStyle: 'italic',
                  }}
                >
                  {t.authentic.commitment_note}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SHIPPING & INSPECTION */}
          {activeTab === 'shipping' && (
            <div>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '4px 12px',
                  background: '#eff6ff',
                  color: '#2563eb',
                  borderRadius: '999px',
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  letterSpacing: '0.04em',
                  marginBottom: '14px',
                }}
              >
                <Truck size={14} />
                {t.shipping.badge}
              </div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: '0 0 14px 0', color: '#18181b' }}>
                {t.shipping.title}
              </h2>
              <p style={{ fontSize: '0.95rem', color: '#52525b', lineHeight: 1.6, marginBottom: '28px' }}>
                {t.shipping.summary}
              </p>

              {/* Highlights */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                  gap: '20px',
                  marginBottom: '36px',
                }}
              >
                {t.shipping.highlights.map((h, i) => (
                  <div
                    key={i}
                    style={{
                      background: '#fafafa',
                      border: '1px solid #e4e4e7',
                      borderRadius: '16px',
                      padding: '22px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px',
                    }}
                  >
                    <div style={{ color: COLORS.red.primary }}>
                      {i === 0 ? <PackageCheck size={24} /> : i === 1 ? <BadgePercent size={24} /> : <Clock size={24} />}
                    </div>
                    <b style={{ fontSize: '1rem', color: '#18181b' }}>{h.title}</b>
                    <span style={{ fontSize: '0.88rem', color: '#52525b', lineHeight: 1.5 }}>{h.desc}</span>
                  </div>
                ))}
              </div>

              {/* 4 Inspection Steps */}
              <div
                style={{
                  background: '#fff9fa',
                  border: '1.5px solid rgba(225, 29, 72, 0.25)',
                  borderRadius: '18px',
                  padding: '26px',
                  marginBottom: '24px',
                }}
              >
                <b style={{ fontSize: '1.05rem', color: '#be123c', display: 'block', marginBottom: '16px' }}>
                  {t.shipping.inspection_guide_title}
                </b>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {t.shipping.inspection_steps.map((st, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '24px',
                          height: '24px',
                          borderRadius: '999px',
                          background: COLORS.red.primary,
                          color: '#ffffff',
                          fontSize: '0.75rem',
                          fontWeight: 800,
                          flexShrink: 0,
                          marginTop: '2px',
                        }}
                      >
                        {idx + 1}
                      </span>
                      <span style={{ fontSize: '0.9rem', color: '#27272a', lineHeight: 1.6 }}>{st}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ fontSize: '0.85rem', color: '#71717a', fontStyle: 'italic' }}>
                {t.shipping.hotline_note}
              </div>
            </div>
          )}

          {/* TAB 3: RETURNS */}
          {activeTab === 'returns' && (
            <div>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '4px 12px',
                  background: '#fef3c7',
                  color: '#b45309',
                  borderRadius: '999px',
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  letterSpacing: '0.04em',
                  marginBottom: '14px',
                }}
              >
                <RotateCcw size={14} />
                {t.returns.badge}
              </div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: '0 0 14px 0', color: '#18181b' }}>
                {t.returns.title}
              </h2>
              <p style={{ fontSize: '0.95rem', color: '#52525b', lineHeight: 1.6, marginBottom: '28px' }}>
                {t.returns.summary}
              </p>

              {/* Highlights */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                  gap: '20px',
                  marginBottom: '36px',
                }}
              >
                {t.returns.highlights.map((h, i) => (
                  <div
                    key={i}
                    style={{
                      background: '#fafafa',
                      border: '1px solid #e4e4e7',
                      borderRadius: '16px',
                      padding: '22px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px',
                    }}
                  >
                    <div style={{ color: COLORS.red.primary }}>
                      <CheckCircle2 size={24} />
                    </div>
                    <b style={{ fontSize: '1rem', color: '#18181b' }}>{h.title}</b>
                    <span style={{ fontSize: '0.88rem', color: '#52525b', lineHeight: 1.5 }}>{h.desc}</span>
                  </div>
                ))}
              </div>

              {/* Conditions & Process Grid */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                  gap: '24px',
                }}
              >
                <div
                  style={{
                    background: '#f8fafc',
                    border: '1px solid #cbd5e1',
                    borderRadius: '16px',
                    padding: '24px',
                  }}
                >
                  <b style={{ fontSize: '1.05rem', color: '#0f172a', display: 'block', marginBottom: '14px' }}>
                    {t.returns.conditions_title}
                  </b>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {t.returns.conditions.map((c, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                        <Check size={16} style={{ color: '#10b981', flexShrink: 0, marginTop: '3px' }} />
                        <span style={{ fontSize: '0.88rem', color: '#334155', lineHeight: 1.5 }}>{c}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div
                  style={{
                    background: '#fdf2f8',
                    border: '1px solid #fbcfe8',
                    borderRadius: '16px',
                    padding: '24px',
                  }}
                >
                  <b style={{ fontSize: '1.05rem', color: '#9d174d', display: 'block', marginBottom: '14px' }}>
                    {t.returns.process_title}
                  </b>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {t.returns.process_steps.map((st, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '22px',
                            height: '22px',
                            borderRadius: '999px',
                            background: '#db2777',
                            color: '#ffffff',
                            fontSize: '0.72rem',
                            fontWeight: 800,
                            flexShrink: 0,
                            marginTop: '2px',
                          }}
                        >
                          {idx + 1}
                        </span>
                        <span style={{ fontSize: '0.88rem', color: '#831843', lineHeight: 1.5 }}>{st}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: WARRANTY */}
          {activeTab === 'warranty' && (
            <div>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '4px 12px',
                  background: '#f1f5f9',
                  color: '#475569',
                  borderRadius: '999px',
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  letterSpacing: '0.04em',
                  marginBottom: '14px',
                }}
              >
                <Wrench size={14} />
                {t.warranty.badge}
              </div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: '0 0 14px 0', color: '#18181b' }}>
                {t.warranty.title}
              </h2>
              <p style={{ fontSize: '0.95rem', color: '#52525b', lineHeight: 1.6, marginBottom: '28px' }}>
                {t.warranty.summary}
              </p>

              {/* Highlights */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                  gap: '20px',
                  marginBottom: '36px',
                }}
              >
                {t.warranty.highlights.map((h, i) => (
                  <div
                    key={i}
                    style={{
                      background: '#fafafa',
                      border: '1px solid #e4e4e7',
                      borderRadius: '16px',
                      padding: '22px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px',
                    }}
                  >
                    <div style={{ color: COLORS.red.primary }}>
                      <CheckCircle2 size={24} />
                    </div>
                    <b style={{ fontSize: '1rem', color: '#18181b' }}>{h.title}</b>
                    <span style={{ fontSize: '0.88rem', color: '#52525b', lineHeight: 1.5 }}>{h.desc}</span>
                  </div>
                ))}
              </div>

              {/* Covered & Not Covered */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                  gap: '24px',
                }}
              >
                <div
                  style={{
                    background: '#f0fdf4',
                    border: '1px solid #bbf7d0',
                    borderRadius: '16px',
                    padding: '24px',
                  }}
                >
                  <b style={{ fontSize: '1.05rem', color: '#166534', display: 'block', marginBottom: '14px' }}>
                    {t.warranty.covered_title}
                  </b>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {t.warranty.covered_items.map((item, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                        <Check size={16} style={{ color: '#16a34a', flexShrink: 0, marginTop: '3px' }} />
                        <span style={{ fontSize: '0.88rem', color: '#14532d', lineHeight: 1.5 }}>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div
                  style={{
                    background: '#fff1f2',
                    border: '1px solid #fecdd3',
                    borderRadius: '16px',
                    padding: '24px',
                  }}
                >
                  <b style={{ fontSize: '1.05rem', color: '#9f1239', display: 'block', marginBottom: '14px' }}>
                    {t.warranty.not_covered_title}
                  </b>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {t.warranty.not_covered_items.map((item, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                        <AlertCircle size={16} style={{ color: '#e11d48', flexShrink: 0, marginTop: '3px' }} />
                        <span style={{ fontSize: '0.88rem', color: '#881337', lineHeight: 1.5 }}>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: PRIVACY */}
          {activeTab === 'privacy' && (
            <div>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '4px 12px',
                  background: '#f5f3ff',
                  color: '#6d28d9',
                  borderRadius: '999px',
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  letterSpacing: '0.04em',
                  marginBottom: '14px',
                }}
              >
                <Lock size={14} />
                {t.privacy.badge}
              </div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: '0 0 14px 0', color: '#18181b' }}>
                {t.privacy.title}
              </h2>
              <p style={{ fontSize: '0.95rem', color: '#52525b', lineHeight: 1.6, marginBottom: '28px' }}>
                {t.privacy.summary}
              </p>

              {/* Highlights */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                  gap: '20px',
                  marginBottom: '36px',
                }}
              >
                {t.privacy.highlights.map((h, i) => (
                  <div
                    key={i}
                    style={{
                      background: '#fafafa',
                      border: '1px solid #e4e4e7',
                      borderRadius: '16px',
                      padding: '22px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px',
                    }}
                  >
                    <div style={{ color: COLORS.red.primary }}>
                      <CheckCircle2 size={24} />
                    </div>
                    <b style={{ fontSize: '1rem', color: '#18181b' }}>{h.title}</b>
                    <span style={{ fontSize: '0.88rem', color: '#52525b', lineHeight: 1.5 }}>{h.desc}</span>
                  </div>
                ))}
              </div>

              {/* Data usage & Rights */}
              <div
                style={{
                  background: '#f8fafc',
                  border: '1px solid #cbd5e1',
                  borderRadius: '16px',
                  padding: '24px',
                }}
              >
                <b style={{ fontSize: '1.05rem', color: '#0f172a', display: 'block', marginBottom: '12px' }}>
                  {t.privacy.data_usage_title}
                </b>
                <ul style={{ margin: '0 0 20px 0', paddingLeft: '20px', color: '#334155', fontSize: '0.88rem', lineHeight: 1.6 }}>
                  {t.privacy.data_usage_items.map((it, idx) => (
                    <li key={idx} style={{ marginBottom: '6px' }}>
                      {it}
                    </li>
                  ))}
                </ul>
                <div style={{ paddingTop: '16px', borderTop: '1px dashed #cbd5e1' }}>
                  <b style={{ fontSize: '0.95rem', color: '#0f172a', display: 'block', marginBottom: '6px' }}>
                    {t.privacy.rights_title}
                  </b>
                  <p style={{ fontSize: '0.88rem', color: '#475569', lineHeight: 1.6, margin: 0 }}>
                    {t.privacy.rights_desc}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: SIZE GUIDE */}
          {activeTab === 'size_guide' && (
            <div>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '4px 12px',
                  background: '#eff6ff',
                  color: '#1d4ed8',
                  borderRadius: '999px',
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  letterSpacing: '0.04em',
                  marginBottom: '14px',
                }}
              >
                <Ruler size={14} />
                {t.size_guide.badge}
              </div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: '0 0 14px 0', color: '#18181b' }}>
                {t.size_guide.title}
              </h2>
              <p style={{ fontSize: '0.95rem', color: '#52525b', lineHeight: 1.6, marginBottom: '28px' }}>
                {t.size_guide.summary}
              </p>

              {/* 3 Steps Measurement */}
              <div
                style={{
                  background: '#fff9fa',
                  border: '1.5px solid rgba(225, 29, 72, 0.25)',
                  borderRadius: '18px',
                  padding: '26px',
                  marginBottom: '32px',
                }}
              >
                <b style={{ fontSize: '1.05rem', color: '#be123c', display: 'block', marginBottom: '16px' }}>
                  {t.size_guide.measure_steps_title}
                </b>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {t.size_guide.measure_steps.map((st, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '24px',
                          height: '24px',
                          borderRadius: '999px',
                          background: COLORS.red.primary,
                          color: '#ffffff',
                          fontSize: '0.75rem',
                          fontWeight: 800,
                          flexShrink: 0,
                          marginTop: '2px',
                        }}
                      >
                        {idx + 1}
                      </span>
                      <span style={{ fontSize: '0.9rem', color: '#27272a', lineHeight: 1.6 }}>{st}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Footwear Conversion Table */}
              <div style={{ marginBottom: '32px' }}>
                <b style={{ fontSize: '1.05rem', color: '#18181b', display: 'block', marginBottom: '12px' }}>
                  Bảng quy đổi cỡ giày chuẩn quốc tế (EUR · US · UK · CM)
                </b>
                <div style={{ overflowX: 'auto', border: '1px solid #e4e4e7', borderRadius: '14px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center', fontSize: '0.88rem' }}>
                    <thead>
                      <tr style={{ background: '#f4f4f5', borderBottom: '1px solid #e4e4e7' }}>
                        <th style={{ padding: '12px 14px', fontWeight: 800, color: '#18181b' }}>EUR</th>
                        <th style={{ padding: '12px 14px', fontWeight: 800, color: '#18181b' }}>US Men</th>
                        <th style={{ padding: '12px 14px', fontWeight: 800, color: '#18181b' }}>UK</th>
                        <th style={{ padding: '12px 14px', fontWeight: 800, color: COLORS.red.primary }}>Chiều dài bàn chân (CM)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { eur: '38', us: '5.5', uk: '5.0', cm: '24.0 cm' },
                        { eur: '39', us: '6.5', uk: '6.0', cm: '24.5 cm' },
                        { eur: '40', us: '7.0', uk: '6.5', cm: '25.0 cm' },
                        { eur: '41', us: '8.0', uk: '7.5', cm: '26.0 cm' },
                        { eur: '42', us: '8.5', uk: '8.0', cm: '26.5 cm' },
                        { eur: '43', us: '9.5', uk: '9.0', cm: '27.5 cm' },
                        { eur: '44', us: '10.0', uk: '9.5', cm: '28.0 cm' },
                        { eur: '45', us: '11.0', uk: '10.5', cm: '29.0 cm' },
                      ].map((row, rIdx) => (
                        <tr
                          key={rIdx}
                          style={{
                            borderBottom: rIdx < 7 ? '1px solid #f4f4f5' : 'none',
                            background: rIdx % 2 === 0 ? '#ffffff' : '#fafafa',
                          }}
                        >
                          <td style={{ padding: '10px 14px', fontWeight: 700, color: '#27272a' }}>{row.eur}</td>
                          <td style={{ padding: '10px 14px', color: '#52525b' }}>{row.us}</td>
                          <td style={{ padding: '10px 14px', color: '#52525b' }}>{row.uk}</td>
                          <td style={{ padding: '10px 14px', fontWeight: 800, color: COLORS.red.primary }}>{row.cm}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Expert Tips */}
              <div
                style={{
                  background: '#f8fafc',
                  border: '1px solid #cbd5e1',
                  borderRadius: '16px',
                  padding: '24px',
                }}
              >
                <b style={{ fontSize: '1.05rem', color: '#0f172a', display: 'block', marginBottom: '14px' }}>
                  {t.size_guide.tips_title}
                </b>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {t.size_guide.tips.map((tip, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                      <Check size={16} style={{ color: '#0284c7', flexShrink: 0, marginTop: '3px' }} />
                      <span style={{ fontSize: '0.88rem', color: '#334155', lineHeight: 1.5 }}>{tip}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Support Callout Box */}
        <div
          style={{
            background: '#fafafa',
            border: '1px solid #e4e4e7',
            borderRadius: '16px',
            padding: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '999px',
                background: '#fff1f2',
                color: COLORS.red.primary,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <PhoneCall size={22} />
            </div>
            <div>
              <b style={{ fontSize: '0.95rem', color: '#18181b', display: 'block' }}>
                Bạn cần hỗ trợ thêm thông tin về đơn hàng hoặc chính sách?
              </b>
              <span style={{ fontSize: '0.85rem', color: '#71717a' }}>
                Hotline: <b>0900-ONE-STORE</b> (8:00 – 22:00 hàng ngày) hoặc nhắn tin trực tiếp với Trợ lý AI.
              </span>
            </div>
          </div>
          <Link
            href="/products"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '10px 20px',
              background: COLORS.black.primary,
              color: '#ffffff',
              borderRadius: '10px',
              fontWeight: 700,
              fontSize: '0.85rem',
              textDecoration: 'none',
              transition: 'background 0.2s',
            }}
          >
            MUA SẮM NGAY
            <ChevronRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function PoliciesPage() {
  return (
    <>
      <Header />
      <main style={{ minHeight: '80vh', background: '#fafafa' }}>
        <Suspense fallback={<div className="wrap" style={{ padding: '60px 0', textAlign: 'center' }}>Đang tải chính sách...</div>}>
          <PoliciesContent />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}
