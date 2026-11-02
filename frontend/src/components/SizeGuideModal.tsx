'use client';

import React from 'react';
import { useShop } from '@/context/ShopContext';
import { X, Ruler, Lightbulb, Footprints } from 'lucide-react';
import { COLORS } from '@/constants';

const sizeTable = [
  { eur: '38', us: '5.5', uk: '5.0', cm: '24.0' },
  { eur: '39', us: '6.5', uk: '6.0', cm: '24.5' },
  { eur: '40', us: '7.0', uk: '6.5', cm: '25.0' },
  { eur: '41', us: '8.0', uk: '7.5', cm: '26.0' },
  { eur: '42', us: '8.5', uk: '8.0', cm: '26.5' },
  { eur: '43', us: '9.5', uk: '9.0', cm: '27.5' },
  { eur: '44', us: '10.0', uk: '9.5', cm: '28.0' },
  { eur: '45', us: '11.0', uk: '10.5', cm: '29.0' },
];

export default function SizeGuideModal() {
  const { activeModal, setActiveModal, dict } = useShop();

  if (activeModal !== 'sizeguide') return null;

  const handleClose = () => setActiveModal(null);
  const sg = dict.product.size_guide;

  return (
    <>
      {/* Backdrop Overlay */}
      <div className="overlay open" onClick={handleClose} />

      {/* Centered Modal Container */}
      <div
        className="modal open"
        id="sizeGuideModal"
        onClick={(e) => {
          if (e.target === e.currentTarget) handleClose();
        }}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 50,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px 16px',
        }}
      >
        {/* Scoped CSS for Inner Scrollbar and Responsive Layout */}
        <style>{`
          .size-guide-scroll-container {
            scrollbar-width: thin;
            scrollbar-color: #cbd5e1 transparent;
          }
          .size-guide-scroll-container::-webkit-scrollbar {
            width: 6px;
          }
          .size-guide-scroll-container::-webkit-scrollbar-track {
            background: transparent;
            margin: 16px 0;
          }
          .size-guide-scroll-container::-webkit-scrollbar-thumb {
            background: #cbd5e1;
            border-radius: 9999px;
          }
          .size-guide-scroll-container::-webkit-scrollbar-thumb:hover {
            background: #94a3b8;
          }
        `}</style>

        {/* Modal Card with Rounded Corners & Hidden Overflow */}
        <div
          className="modalbox"
          style={{
            width: 'min(680px, 100%)',
            maxWidth: '680px',
            margin: '0 auto',
            maxHeight: 'min(88vh, 760px)',
            background: '#ffffff',
            borderRadius: '24px',
            border: '1px solid #e4e4e7',
            boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.04)',
            position: 'relative',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Close Button Inside Card */}
          <button
            aria-label={sg.close_btn_aria}
            className="close"
            onClick={handleClose}
            style={{
              position: 'absolute',
              top: '18px',
              right: '18px',
              zIndex: 30,
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: '#ffffff',
              border: '1px solid #e4e4e7',
              color: '#52525b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#f4f4f5';
              e.currentTarget.style.color = '#09090b';
              e.currentTarget.style.borderColor = '#d4d4d8';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#ffffff';
              e.currentTarget.style.color = '#52525b';
              e.currentTarget.style.borderColor = '#e4e4e7';
            }}
          >
            <X size={18} />
          </button>

          {/* Scrollable Content Container with Generous Padding */}
          <div
            className="size-guide-scroll-container"
            style={{
              overflowY: 'auto',
              overflowX: 'hidden',
              flex: 1,
              padding: 'clamp(24px, 4vw, 36px)',
              paddingRight: 'clamp(20px, 3.5vw, 32px)',
            }}
          >
            {/* Eyebrow Badge */}
            <div style={{ marginBottom: '10px' }}>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'rgba(225, 29, 72, 0.08)',
                  color: COLORS.red.primary,
                  border: '1px solid rgba(225, 29, 72, 0.25)',
                  padding: '5px 12px',
                  borderRadius: '9999px',
                  fontSize: '11px',
                  fontWeight: 800,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                }}
              >
                {sg.eyebrow}
              </span>
            </div>

            {/* Title */}
            <h2
              style={{
                margin: '0 0 20px',
                fontSize: 'clamp(20px, 2.5vw, 24px)',
                fontWeight: 800,
                color: '#09090b',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                fontFamily: 'var(--font-display)',
                letterSpacing: '-0.02em',
                paddingRight: '40px', // Không bị che bởi nút đóng
              }}
            >
              <span
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: 'rgba(225, 29, 72, 0.08)',
                  color: COLORS.red.primary,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Ruler size={20} />
              </span>
              <span>{sg.title}</span>
            </h2>

            {/* Size Table with Clean Borders & Rounded Corners */}
            <div
              style={{
                overflowX: 'auto',
                marginBottom: '20px',
                borderRadius: '14px',
                border: '1px solid #e4e4e7',
                boxShadow: '0 2px 6px rgba(0, 0, 0, 0.02)',
              }}
            >
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  fontSize: '13px',
                  textAlign: 'center',
                }}
              >
                <thead>
                  <tr style={{ background: '#09090b', color: '#ffffff' }}>
                    <th style={{ padding: '12px 10px', fontWeight: 800, fontSize: '12px' }}>{sg.col_eur}</th>
                    <th style={{ padding: '12px 10px', fontWeight: 700, fontSize: '12px' }}>{sg.col_us}</th>
                    <th style={{ padding: '12px 10px', fontWeight: 700, fontSize: '12px' }}>{sg.col_uk}</th>
                    <th style={{ padding: '12px 10px', fontWeight: 700, fontSize: '12px' }}>{sg.col_cm}</th>
                  </tr>
                </thead>
                <tbody>
                  {sizeTable.map((row, idx) => (
                    <tr
                      key={row.eur}
                      style={{
                        background: idx % 2 === 0 ? '#ffffff' : '#f8fafc',
                        borderBottom: idx === sizeTable.length - 1 ? 'none' : '1px solid #e4e4e7',
                        transition: 'background 0.15s ease',
                      }}
                    >
                      <td style={{ padding: '11px 8px', fontWeight: 800, color: COLORS.red.primary, fontSize: '13.5px' }}>
                        {row.eur}
                      </td>
                      <td style={{ padding: '11px 8px', color: '#3f3f46' }}>{row.us}</td>
                      <td style={{ padding: '11px 8px', color: '#3f3f46' }}>{row.uk}</td>
                      <td style={{ padding: '11px 8px', fontWeight: 600, color: '#09090b' }}>{row.cm} cm</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Expert Tips */}
            <div
              style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderLeft: `4px solid ${COLORS.red.primary}`,
                padding: '16px 18px',
                borderRadius: '12px',
                marginBottom: '20px',
                fontSize: '13px',
                lineHeight: 1.6,
              }}
            >
              <b
                style={{
                  color: '#09090b',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '8px',
                  fontSize: '13.5px',
                }}
              >
                <Lightbulb size={16} color={COLORS.red.primary} />
                <span>{sg.tips_title}</span>
              </b>
              <ul style={{ margin: 0, paddingLeft: '20px', color: '#475569' }}>
                <li style={{ marginBottom: '6px' }}>{sg.tips_asian}</li>
                <li>{sg.tips_western}</li>
              </ul>
            </div>

            {/* How to measure */}
            <div
              style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                padding: '16px 18px',
                borderRadius: '12px',
                fontSize: '13px',
                lineHeight: 1.6,
                color: '#475569',
              }}
            >
              <b
                style={{
                  color: '#09090b',
                  fontSize: '13.5px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '8px',
                }}
              >
                <Footprints size={16} color={COLORS.red.primary} />
                <span>{sg.measure_title}</span>
              </b>
              <ol style={{ margin: 0, paddingLeft: '20px' }}>
                <li style={{ marginBottom: '6px' }}>{sg.step1}</li>
                <li style={{ marginBottom: '6px' }}>{sg.step2}</li>
                <li>{sg.step3}</li>
              </ol>
            </div>

            {/* Bottom Action Button */}
            <div style={{ marginTop: '24px', textAlign: 'right' }}>
              <button
                type="button"
                className="primary"
                onClick={handleClose}
                style={{
                  padding: '11px 26px',
                  borderRadius: '10px',
                  fontSize: '13.5px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(225, 29, 72, 0.25)',
                }}
              >
                {sg.understood_btn}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
