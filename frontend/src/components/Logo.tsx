'use client';

import React from 'react';
import { COLORS, FONTS } from '@/constants';

interface LogoProps {
  variant?: 'full' | 'icon' | 'stacked';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showSubtitle?: boolean;
  className?: string;
  inverted?: boolean;
}

export default function Logo({
  variant = 'full',
  size = 'md',
  showSubtitle = false,
  className = '',
  inverted = false,
}: LogoProps) {
  // Dimensions map based on size
  const iconSizeMap = {
    sm: 28,
    md: 38,
    lg: 48,
    xl: 64,
  };

  const fontSizeMap = {
    sm: 18,
    md: 24,
    lg: 30,
    xl: 40,
  };

  const iconPx = iconSizeMap[size] || 38;
  const fontPx = fontSizeMap[size] || 24;

  const primaryColor = inverted ? COLORS.white : COLORS.black.primary;
  const accentRed = COLORS.red.primary;

  const IconSvg = (
    <svg
      width={iconPx}
      height={iconPx}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'inline-block', flexShrink: 0, verticalAlign: 'middle' }}
      aria-hidden="true"
    >
      <defs>
        <linearGradient
          id={inverted ? 'logoGradInv' : 'logoGradMain'}
          x1="6"
          y1="42"
          x2="42"
          y2="6"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor={inverted ? '#ffffff' : '#0a0a0a'} />
          <stop offset="100%" stopColor={inverted ? '#f1f5f9' : '#262626'} />
        </linearGradient>
      </defs>

      {/* Aerodynamic Sneaker Rocker Wave / Outsole Cushion in Red Accent */}
      <path
        d="M 6 36 C 12 36.5 19 35 25 30.5 C 32 25 37 17 42 9 C 37 13.5 30.5 17 23.5 19 C 16.5 21 11 25.5 8 32 C 7 34 6.5 35 6 36 Z"
        fill={accentRed}
        opacity="0.95"
      />

      {/* Dynamic Forward-Canted Numeral 1 */}
      <path
        d="M 16 17 L 23 11.5 L 25.5 11.5 L 20.8 35 L 15.5 35 L 18.8 19 L 14.5 21 Z"
        fill={`url(#${inverted ? 'logoGradInv' : 'logoGradMain'})`}
      />

      {/* Speed Wing / Upper Lateral Line */}
      <path
        d="M 23 17 C 29 15 35 12 41 7 C 37 11 32 14.5 25 17.5 L 24.2 21.5 C 29 19.5 34 17 38 13 C 34 16.5 29.5 19.5 23.5 21.8 Z"
        fill={`url(#${inverted ? 'logoGradInv' : 'logoGradMain'})`}
      />

      {/* Ground Contact / Athletic Tread */}
      <rect
        x="13"
        y="36.5"
        width="13"
        height="3"
        rx="1.5"
        fill={`url(#${inverted ? 'logoGradInv' : 'logoGradMain'})`}
      />
    </svg>
  );

  if (variant === 'icon') {
    return (
      <span className={`inline-flex items-center ${className}`} title="One - Store">
        {IconSvg}
      </span>
    );
  }

  if (variant === 'stacked') {
    return (
      <div
        className={`inline-flex flex-col items-center text-center ${className}`}
        style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}
      >
        {IconSvg}
        <div style={{ lineHeight: 1.1 }}>
          <span
            style={{
              fontFamily: FONTS.display,
              fontSize: `${fontPx}px`,
              fontWeight: 800,
              letterSpacing: '-0.015em',
              color: primaryColor,
            }}
          >
            One - Store<span style={{ color: accentRed }}>.</span>
          </span>
          {showSubtitle && (
            <div
              style={{
                fontFamily: FONTS.sans,
                fontSize: '11px',
                fontWeight: 600,
                letterSpacing: '0.22em',
                textTransform: 'uppercase',
                color: inverted ? COLORS.gray[400] : COLORS.gray[500],
                marginTop: '4px',
              }}
            >
              Authentic Sneaker Store
            </div>
          )}
        </div>
      </div>
    );
  }

  // Default 'full' horizontal logo
  return (
    <div
      className={`brand-logo-container ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: `${Math.round(iconPx * 0.3)}px`,
        textDecoration: 'none',
        lineHeight: 1,
      }}
    >
      {IconSvg}
      <div style={{ display: 'inline-flex', flexDirection: 'column' }}>
        <span
          style={{
            fontFamily: FONTS.display,
            fontSize: `${fontPx}px`,
            fontWeight: 800,
            letterSpacing: '-0.015em',
            color: primaryColor,
            lineHeight: 1.1,
          }}
        >
          One - Store<span style={{ color: accentRed }}>.</span>
        </span>
        {showSubtitle && (
          <span
            style={{
              fontFamily: FONTS.sans,
              fontSize: '10px',
              fontWeight: 700,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: inverted ? COLORS.gray[400] : COLORS.gray[500],
              marginTop: '2px',
            }}
          >
            Authentic Sneakers &amp; Running
          </span>
        )}
      </div>
    </div>
  );
}
