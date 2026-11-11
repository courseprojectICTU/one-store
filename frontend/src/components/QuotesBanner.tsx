'use client';

import React from 'react';
import { useShop } from '@/context/ShopContext';
import { Award, Quote, ShieldCheck, Sparkles, HeartHandshake } from 'lucide-react';
import { COLORS } from '@/constants';

const TOPIC_ICONS: Record<
  string,
  React.ComponentType<{ size?: number; strokeWidth?: number; 'aria-hidden'?: boolean }>
> = {
  reputation: ShieldCheck,
  experience: Sparkles,
  sales: HeartHandshake,
};

export default function QuotesBanner() {
  const { dict } = useShop();
  const qb = dict.common.quotes_banner;

  return (
    <div className="quotes-banner-wrapper">
      <section className="quotes-banner" aria-label={qb.title}>
        {/* Banner Header */}
        <div style={{ marginBottom: '34px', textAlign: 'center' }}>
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
              marginBottom: '12px',
            }}
          >
            <Award size={14} aria-hidden="true" />
            <span>{qb.eyebrow}</span>
          </div>

          <h2
            style={{
              fontSize: 'clamp(24px, 3vw, 36px)',
              fontWeight: 800,
              lineHeight: 1.25,
              color: COLORS.black.primary,
              margin: '0 0 10px',
              letterSpacing: '-0.01em',
              fontFamily: 'var(--font-display)',
            }}
          >
            {qb.title}
          </h2>

          <p
            style={{
              fontSize: '15px',
              lineHeight: 1.6,
              color: COLORS.gray[500],
              margin: '0 auto',
              maxWidth: '640px',
            }}
          >
            {qb.subtitle}
          </p>
        </div>

        {/* 3 Quotes Frames */}
        <div className="quotes-grid">
          {qb.items.map((item) => {
            const TopicIcon = TOPIC_ICONS[item.id] || Quote;
            return (
              <article key={item.id} className="quote-card">
                <div>
                  {/* Frame Topic Header + Decorative Quote Icon */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '12px',
                      marginBottom: '18px',
                    }}
                  >
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '5px 11px',
                        borderRadius: '9999px',
                        background: COLORS.red.light,
                        border: `1px solid ${COLORS.red.border}`,
                        color: COLORS.red.primary,
                        fontSize: '11px',
                        fontWeight: 800,
                        letterSpacing: '0.06em',
                        textTransform: 'uppercase',
                      }}
                    >
                      <TopicIcon size={13} strokeWidth={2.3} aria-hidden={true} />
                      <span>{item.topic}</span>
                    </span>

                    <Quote
                      size={24}
                      strokeWidth={1.8}
                      aria-hidden="true"
                      style={{ color: COLORS.gray[300], flexShrink: 0 }}
                    />
                  </div>

                  {/* Quote Content */}
                  <blockquote
                    style={{
                      margin: 0,
                      paddingLeft: '14px',
                      borderLeft: `3px solid ${COLORS.red.primary}`,
                      fontSize: '15px',
                      lineHeight: 1.65,
                      color: COLORS.gray[800],
                      fontWeight: 500,
                    }}
                  >
                    &ldquo;{item.quote}&rdquo;
                  </blockquote>
                </div>

                {/* Author Portrait + Name */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                    paddingTop: '18px',
                    borderTop: `1px solid ${COLORS.border.subtle}`,
                  }}
                >
                  <div className="quote-avatar-wrap">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.image}
                      alt={item.imageAlt}
                      loading="lazy"
                    />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <h3
                      style={{
                        margin: '0 0 3px',
                        fontSize: '17px',
                        fontWeight: 800,
                        lineHeight: 1.3,
                        color: COLORS.black.primary,
                        fontFamily: 'var(--font-display)',
                      }}
                    >
                      {item.author}
                    </h3>
                    <p
                      style={{
                        margin: 0,
                        fontSize: '12.5px',
                        fontWeight: 600,
                        color: COLORS.gray[500],
                        lineHeight: 1.4,
                      }}
                    >
                      {item.role}
                    </p>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
