import React from 'react';
import type { SalesContext, SlideFieldDef, SlideFieldValue } from '@/lib/gf1/slide-types';
import {
  BRAND_BLUE,
  BRAND_GOLD,
  HEADING_FONT,
  SlideShell,
} from './_shared';
import { asString } from '@/lib/gf1/slide-tokens';

export const CLOSING_FIELDS: SlideFieldDef[] = [
  { key: 'eyebrow', label: 'Eyebrow', kind: 'text', defaultValue: 'A Special Thanks To' },
  { key: 'orgLine', label: 'Organization line', kind: 'text', defaultValue: '{{org.name}}' },
  { key: 'headline', label: 'Headline', kind: 'text', defaultValue: 'Thank You.' },
  {
    key: 'subline',
    label: 'Sub-line',
    kind: 'multiline',
    defaultValue: "We'd love to partner with you. Reach out any time with questions.",
  },
  { key: 'contactName', label: 'Contact Name', kind: 'text', defaultValue: '{{org.salesRep}}' },
  { key: 'contactRole', label: 'Contact Role', kind: 'text', defaultValue: 'Your Galactic Sales Partner' },
  { key: 'contactEmail', label: 'Contact Email', kind: 'text', defaultValue: '' },
  { key: 'contactPhone', label: 'Contact Phone', kind: 'text', defaultValue: '' },
  { key: 'website', label: 'Website', kind: 'text', defaultValue: 'galactic-inc.com' },
];

export function ClosingLayout({
  data,
  ctx,
}: {
  data: Record<string, SlideFieldValue>;
  ctx?: SalesContext;
}) {
  const eyebrow = asString(data.eyebrow);
  const orgLine = asString(data.orgLine);
  const headline = asString(data.headline) || 'Thank You.';
  const subline = asString(data.subline);
  const contactName = asString(data.contactName);
  const contactRole = asString(data.contactRole);
  const contactEmail = asString(data.contactEmail);
  const contactPhone = asString(data.contactPhone);
  const website = asString(data.website);

  // Initial no longer used — swapped for Galactic logomark in the contact card.
  void ctx;

  return (
    <SlideShell background={BRAND_BLUE}>
      {/* Decorative circles — same visual vocabulary as the exec summary */}
      <div
        style={{
          position: 'absolute',
          top: '-160px',
          right: '-120px',
          width: '420px',
          height: '420px',
          borderRadius: '50%',
          background: BRAND_GOLD,
          opacity: 0.14,
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '-140px',
          left: '-100px',
          width: '320px',
          height: '320px',
          borderRadius: '50%',
          border: `3px solid ${BRAND_GOLD}`,
          opacity: 0.25,
        }}
      />

      <div
        style={{
          position: 'relative',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '70px 80px',
          textAlign: 'center',
        }}
      >
        {eyebrow ? (
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '14px',
              fontSize: '14px',
              fontWeight: 700,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: BRAND_GOLD,
              marginBottom: '10px',
              fontFamily: '"Poppins", "Segoe UI", system-ui, sans-serif',
            }}
          >
            <span style={{ width: '36px', height: '2px', background: BRAND_GOLD }} />
            <span>{eyebrow}</span>
            <span style={{ width: '36px', height: '2px', background: BRAND_GOLD }} />
          </div>
        ) : null}

        {orgLine ? (
          <div
            style={{
              fontFamily: HEADING_FONT,
              fontSize: '26px',
              fontWeight: 900,
              color: '#cfe5f5',
              letterSpacing: '0.02em',
              marginBottom: '20px',
            }}
          >
            {orgLine}
          </div>
        ) : null}

        <h1
          style={{
            margin: 0,
            color: '#ffffff',
            fontFamily: HEADING_FONT,
            fontSize: '140px',
            fontWeight: 900,
            letterSpacing: '0.01em',
            lineHeight: 1,
          }}
        >
          {headline}
        </h1>

        <div
          style={{
            width: '120px',
            height: '6px',
            background: BRAND_GOLD,
            margin: '22px 0 22px',
          }}
        />

        {subline ? (
          <p
            style={{
              margin: 0,
              color: '#cfe5f5',
              fontSize: '20px',
              maxWidth: '640px',
              lineHeight: 1.5,
              marginBottom: '36px',
            }}
          >
            {subline}
          </p>
        ) : null}

        {/* Contact card */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '22px',
            background: 'rgba(255,255,255,0.07)',
            border: '1px solid rgba(255,255,255,0.16)',
            borderRadius: '14px',
            padding: '18px 26px',
            minWidth: '520px',
          }}
        >
          <div
            style={{
              width: '72px',
              height: '72px',
              borderRadius: '50%',
              background: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              boxShadow: `0 0 0 4px ${BRAND_GOLD}`,
            }}
          >
            <img
              src="/Logomark.png"
              alt=""
              crossOrigin="anonymous"
              style={{ maxWidth: '62px', maxHeight: '62px', width: 'auto', height: 'auto', display: 'block' }}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '2px' }}>
            {contactName ? (
              <div
                style={{
                  fontFamily: HEADING_FONT,
                  fontSize: '24px',
                  fontWeight: 900,
                  color: '#ffffff',
                  lineHeight: 1.1,
                }}
              >
                {contactName}
              </div>
            ) : null}
            {contactRole ? (
              <div style={{ color: BRAND_GOLD, fontSize: '13px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                {contactRole}
              </div>
            ) : null}
            {(contactEmail || contactPhone) ? (
              <div style={{ color: '#e5eff7', fontSize: '14px', marginTop: '6px', display: 'flex', gap: '14px' }}>
                {contactEmail ? <span>{contactEmail}</span> : null}
                {contactEmail && contactPhone ? <span style={{ color: 'rgba(255,255,255,0.3)' }}>•</span> : null}
                {contactPhone ? <span>{contactPhone}</span> : null}
              </div>
            ) : null}
          </div>
        </div>

        {website ? (
          <div
            style={{
              marginTop: '24px',
              color: '#cfe5f5',
              fontSize: '14px',
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              fontWeight: 700,
            }}
          >
            {website}
          </div>
        ) : null}
      </div>

      <div
        style={{
          position: 'absolute',
          bottom: '20px',
          right: '28px',
          width: '180px',
          height: '26px',
          overflow: 'hidden',
        }}
      >
        <img
          src="/whiteLogowithletters.svg"
          alt="Galactic"
          crossOrigin="anonymous"
          width={180}
          height={26}
          style={{
            width: '180px',
            height: '26px',
            maxWidth: '180px',
            maxHeight: '26px',
            objectFit: 'contain',
            display: 'block',
          }}
        />
      </div>
    </SlideShell>
  );
}
