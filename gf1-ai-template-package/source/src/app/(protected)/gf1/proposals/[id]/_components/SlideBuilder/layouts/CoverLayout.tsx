import React from 'react';
import type { SalesContext, SlideFieldDef, SlideFieldValue } from '@/lib/gf1/slide-types';
import {
  BRAND_BLUE,
  EdgeStripes,
  HEADING_FONT,
  PlaceholderImage,
  SlammedLogo,
  SlideShell,
  BODY_TEXT,
} from './_shared';
import { asString } from '@/lib/gf1/slide-tokens';

export const COVER_FIELDS: SlideFieldDef[] = [
  { key: 'title', label: 'Title', kind: 'text', defaultValue: 'Proposal Of Services' },
  { key: 'subtitle', label: 'Prepared For', kind: 'text', defaultValue: '{{org.name}}' },
  { key: 'date', label: 'Date', kind: 'text', defaultValue: '{{date.monthYear}}' },
  { key: 'imageUrl', label: 'Hero Image URL', kind: 'image_url', helpText: 'Leave blank for placeholder.' },
];

export function CoverLayout({
  data,
  ctx,
}: {
  data: Record<string, SlideFieldValue>;
  ctx?: SalesContext;
}) {
  const title = asString(data.title) || 'Proposal Of Services';
  const subtitle = asString(data.subtitle);
  const date = asString(data.date);
  const rawImageUrl = asString(data.imageUrl);
  const usingLogoFallback = rawImageUrl !== '__deleted__' && !rawImageUrl && Boolean(ctx?.org.logoUrl);
  const imageUrl =
    rawImageUrl === '__deleted__'
      ? ''
      : rawImageUrl || ctx?.org.logoUrl || '';
  const titleLines = title.split(/\s*\/\s*|\s*\|\s*/).map((s) => s.trim()).filter(Boolean);
  const renderTitle = titleLines.length > 1 ? titleLines : [title];

  return (
    <SlideShell>
      <EdgeStripes variant="blue-on-top" />

      <div style={{ position: 'absolute', top: '48px', left: '60px' }}>
        <SlammedLogo height={64} />
      </div>

      <div
        style={{
          position: 'absolute',
          left: '60px',
          top: '260px',
          maxWidth: '740px',
        }}
      >
        <h1
          style={{
            margin: 0,
            fontFamily: HEADING_FONT,
            color: BRAND_BLUE,
            fontSize: '100px',
            fontWeight: 900,
            lineHeight: 0.96,
            letterSpacing: '0.02em',
          }}
        >
          {renderTitle.map((line, i) => (
            <div key={i}>{line}</div>
          ))}
        </h1>
        {subtitle ? (
          <div
            style={{
              marginTop: '28px',
              color: BODY_TEXT,
              fontSize: '32px',
              fontWeight: 600,
              maxWidth: '700px',
            }}
          >
            {subtitle}
          </div>
        ) : null}
      </div>

      {(() => {
        const diameter = 420;
        const cx = 1040;
        const cy = 360;
        return (
          <div
            style={{
              position: 'absolute',
              left: `${cx - diameter / 2}px`,
              top: `${cy - diameter / 2}px`,
              width: `${diameter}px`,
              height: `${diameter}px`,
              borderRadius: '50%',
              overflow: 'hidden',
              background: usingLogoFallback ? '#eceff3' : '#dde3ea',
              boxShadow: '0 12px 40px rgba(0,0,0,0.18)',
              border: `6px solid #ffffff`,
            }}
          >
            <PlaceholderImage
              width={diameter - 12}
              height={diameter - 12}
              src={imageUrl}
              rounded={diameter}
              background={usingLogoFallback ? '#eceff3' : '#dde3ea'}
              // A logo must show in full (no circular crop); a hero photo should
              // fill the circle. Pad the logo in so it sits inside the ring.
              fit={usingLogoFallback ? 'contain' : 'cover'}
              padding={usingLogoFallback ? 56 : 0}
            />
          </div>
        );
      })()}

      {date ? (
        <div
          style={{
            position: 'absolute',
            right: '24px',
            bottom: '6px',
            color: BRAND_BLUE,
            fontFamily: HEADING_FONT,
            fontSize: '32px',
            fontWeight: 900,
            letterSpacing: '0.02em',
          }}
        >
          {date}
        </div>
      ) : null}

    </SlideShell>
  );
}
