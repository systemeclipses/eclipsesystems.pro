import React from 'react';
import type { SlideFieldDef, SlideFieldValue } from '@/lib/gf1/slide-types';
import {
  BRAND_BLUE,
  BRAND_GOLD,
  SlammedLogo,
  HEADING_FONT,
  PinIcon,
  SlideShell,
  BODY_TEXT,
  PlaceholderImage,
  proxiedSrc,
} from './_shared';
import { asList, asString } from '@/lib/gf1/slide-tokens';

export const WHO_IS_GALACTIC_FIELDS: SlideFieldDef[] = [
  { key: 'location', label: 'Location Tag', kind: 'text', defaultValue: 'Vestavia Hills, AL' },
  { key: 'cityImageUrl', label: 'Skyline Image URL', kind: 'image_url', defaultValue: '/proposal-template-city.png' },
  { key: 'panelHeading', label: 'Panel Heading', kind: 'text', defaultValue: 'Who is Galactic?' },
  { key: 'subImage1Url', label: 'Sub Image 1', kind: 'image_url', defaultValue: '/shelby.png' },
  { key: 'subImage2Url', label: 'Sub Image 2', kind: 'image_url', defaultValue: '/hoover.png' },
  { key: 'subImage3Url', label: 'Sub Image 3', kind: 'image_url', defaultValue: '/napeo.png' },
  {
    key: 'description',
    label: 'Description',
    kind: 'multiline',
    defaultValue:
      'Galactic is a PEO that has delivered comprehensive employer services to companies all over the United States since 1999.',
  },
  { key: 'valuesHeading', label: 'Values Heading', kind: 'text', defaultValue: 'Our Core Values:' },
  {
    key: 'values',
    label: 'Core Values (one per line)',
    kind: 'list',
    defaultList: [
      'Precision & Excellence',
      'Service with a purpose',
      'Desire to Learn & Grow',
      'Team-oriented',
      'Trustworthiness',
    ],
  },
];

export function WhoIsGalacticLayout({ data }: { data: Record<string, SlideFieldValue> }) {
  const location = asString(data.location);
  const cityImage = asString(data.cityImageUrl) || '/proposal-template-city.png';
  const heading = asString(data.panelHeading) || 'Who is Galactic?';
  const description = asString(data.description);
  const valuesHeading = asString(data.valuesHeading) || 'Our Core Values:';
  const values = asList(data.values);
  const slotPresets: Record<string, { padding: string; scale: number; translateX: number; translateY: number }> = {
    '/shelby.png': { padding: '0', scale: 1, translateX: 0, translateY: 0 },
    '/hoover.png': { padding: '18px', scale: 1, translateX: 0, translateY: 0 },
    '/napeo.png': { padding: '0', scale: 2.6, translateX: 8, translateY: 18 },
  };
  const neutralPreset = { padding: '8px', scale: 1, translateX: 0, translateY: 0 };
  const subImages = [
    { key: 'sub1', src: asString(data.subImage1Url) },
    { key: 'sub2', src: asString(data.subImage2Url) },
    { key: 'sub3', src: asString(data.subImage3Url) },
  ]
    .filter((img) => img.src && img.src !== '__deleted__')
    .map((img) => ({ ...img, ...(slotPresets[img.src] ?? neutralPreset) }));

  const colA = values.filter((_, i) => i % 2 === 0);
  const colB = values.filter((_, i) => i % 2 === 1);

  return (
    <SlideShell>
      {/* Background: skyline image fills top portion of slide */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '360px', overflow: 'hidden', background: '#1a3550' }}>
        <img
          src={proxiedSrc(cityImage)}
          alt=""
          crossOrigin="anonymous"
          style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: '50% 60%', display: 'block' }}
        />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(15,30,55,0.20) 0%, rgba(255,255,255,0) 35%, rgba(255,255,255,1) 80%)' }} />
      </div>

      {/* Location pill */}
      {location ? (
        <div
          style={{
            position: 'absolute',
            top: '24px',
            left: '32px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: '#ffffff',
            fontWeight: 700,
            fontSize: '26px',
            textShadow: '0 1px 8px rgba(0,0,0,0.4)',
          }}
        >
          <PinIcon color="#ffffff" size={32} />
          {location}
        </div>
      ) : null}

      {/* Blue panel with heading */}
      <div
        style={{
          position: 'absolute',
          top: '180px',
          left: '60px',
          width: '390px',
          height: '380px',
          background: BRAND_BLUE,
          borderRadius: '20px',
          border: `2px solid ${BRAND_BLUE}`,
          padding: '38px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: 'none',
        }}
      >
        <h2
          style={{
            margin: 0,
            color: '#ffffff',
            fontFamily: HEADING_FONT,
            fontSize: '68px',
            fontWeight: 900,
            lineHeight: 0.95,
            letterSpacing: '0.02em',
            textAlign: 'left',
          }}
        >
          {heading}
        </h2>
      </div>

      {/* Right text column */}
      <div
        style={{
          position: 'absolute',
          top: '320px',
          left: '530px',
          right: '70px',
        }}
      >
        <p
          style={{
            margin: 0,
            color: BODY_TEXT,
            fontSize: '26px',
            fontWeight: 600,
            lineHeight: 1.32,
          }}
        >
          {description}
        </p>

        <div style={{ marginTop: '48px' }}>
          <div
            style={{
              color: BRAND_BLUE,
              fontFamily: HEADING_FONT,
              fontSize: '36px',
              fontWeight: 900,
              letterSpacing: '0.02em',
            }}
          >
            {valuesHeading}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 36px', marginTop: '10px' }}>
            {[colA, colB].map((col, ci) => (
              <ul key={ci} style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {col.map((item, i) => (
                  <li key={`${ci}-${i}`} style={{ display: 'flex', gap: '8px', color: BODY_TEXT, fontSize: '24px', fontWeight: 600 }}>
                    <span style={{ color: BRAND_BLUE, fontWeight: 900 }}>•</span>
                    {item}
                  </li>
                ))}
              </ul>
            ))}
          </div>
        </div>
      </div>

      {/* Up to three image boxes under the blue panel — auto-centered when fewer than 3 */}
      {subImages.length > 0 ? (
        <div
          style={{
            position: 'absolute',
            top: '570px',
            left: '60px',
            width: '390px',
            display: 'flex',
            justifyContent: 'center',
            gap: '10px',
          }}
        >
          {subImages.map((img) => {
            const transformParts: string[] = [];
            if (img.translateX) transformParts.push(`translateX(${img.translateX}px)`);
            if (img.translateY) transformParts.push(`translateY(${img.translateY}px)`);
            if (img.scale !== 1) transformParts.push(`scale(${img.scale})`);
            const transform = transformParts.length ? transformParts.join(' ') : undefined;
            return (
              <div
                key={img.key}
                style={{
                  position: 'relative',
                  width: '123px',
                  height: '120px',
                  borderRadius: '10px',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: img.padding,
                  }}
                >
                  <img
                    src={proxiedSrc(img.src)}
                    alt=""
                    crossOrigin="anonymous"
                    style={{
                      maxWidth: '100%',
                      maxHeight: '100%',
                      objectFit: 'contain',
                      display: 'block',
                      transform,
                      transformOrigin: 'center center',
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      ) : null}

      <div style={{ position: 'absolute', bottom: '18px', right: '24px' }}>
        <SlammedLogo height={32} />
      </div>
    </SlideShell>
  );
}
