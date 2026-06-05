import React from 'react';
import type { SlideFieldDef, SlideFieldValue } from '@/lib/gf1/slide-types';
import {
  BRAND_BLUE,
  BRAND_GOLD,
  SlammedLogo,
  HEADING_FONT,
  PlaceholderImage,
  SlideShell,
  BODY_TEXT,
  Glyph,
  proxiedSrc,
} from './_shared';
import { asList, asString } from '@/lib/gf1/slide-tokens';

export const TIMEKEEPING_FIELDS: SlideFieldDef[] = [
  { key: 'title', label: 'Title', kind: 'text', defaultValue: 'Modern Time & Attendance' },
  { key: 'subTitle', label: 'Sub-title (e.g. partner brand)', kind: 'text', defaultValue: 'Workforce Management' },
  { key: 'screenshotUrl', label: 'Mobile App Screenshot URL', kind: 'image_url', defaultValue: '/wfm.png' },
  {
    key: 'intro',
    label: 'Intro paragraph',
    kind: 'multiline',
    defaultValue:
      'A full timekeeping suite built for the way teams actually work — from the job site to the office to the road. Clocks, mobile, and payroll all talk to each other, so exceptions never slip through the cracks.',
  },
  {
    key: 'sidebarTagline',
    label: 'Sidebar tagline',
    kind: 'multiline',
    defaultValue:
      "PrismHR's enterprise-grade time and labor platform, synced directly with your Galactic payroll so clocks, timecards, and paychecks all stay in lockstep.",
  },
  {
    key: 'features',
    label: 'Features (one per line)',
    kind: 'list',
    defaultList: [
      'Web Clock with IP restrictions',
      'Mobile App with geo-fencing & geo-tagging',
      'Physical timeclock hardware (badge/PIN/biometric)',
      'Real-time dashboards & exception alerts',
      'Manager approvals on the go',
      'PTO requests & approvals',
      'Department / job / labor allocations',
      'Schedule building & shift swaps',
      'Automatic OT, meal, and break rule enforcement',
      'Seamless integration with payroll',
    ],
  },
];

const FEATURE_ICONS = [
  Glyph.Globe,
  Glyph.Phone,
  Glyph.Clock,
  Glyph.Chart,
  Glyph.Check,
  Glyph.Calendar,
  Glyph.Users,
  Glyph.Bolt,
  Glyph.Shield,
  Glyph.Plus,
];

function FeatureRow({ idx, text }: { idx: number; text: string }) {
  const Icon = FEATURE_ICONS[idx % FEATURE_ICONS.length];
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
      <div
        style={{
          width: '42px',
          height: '42px',
          borderRadius: '50%',
          background: BRAND_BLUE,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Icon color="#ffffff" size={22} />
      </div>
      <span style={{ color: BODY_TEXT, fontSize: '17px', lineHeight: 1.35 }}>{text}</span>
    </div>
  );
}

export function TimekeepingLayout({ data }: { data: Record<string, SlideFieldValue> }) {
  const title = asString(data.title) || 'Modern Time & Attendance';
  const subTitle = asString(data.subTitle);
  const screenshot = asString(data.screenshotUrl);
  const intro = asString(data.intro);
  const sidebarTagline = asString(data.sidebarTagline);
  const features = asList(data.features);

  const half = Math.ceil(features.length / 2);
  const left = features.slice(0, half);
  const right = features.slice(half);

  return (
    <SlideShell>
      <div style={{ display: 'flex', height: '100%' }}>
        {/* Main content */}
        <div style={{ flex: 1, padding: '56px 50px 0', minWidth: 0 }}>
          <h1
            style={{
              margin: '0 0 16px',
              color: BRAND_BLUE,
              fontFamily: HEADING_FONT,
              fontSize: '46px',
              fontWeight: 900,
              lineHeight: 1,
              letterSpacing: '0.02em',
            }}
          >
            {title}
          </h1>
          <div
            style={{
              width: '80px',
              height: '5px',
              background: BRAND_GOLD,
              marginBottom: '22px',
            }}
          />
          {intro ? (
            <p style={{ margin: '0 0 26px', color: BODY_TEXT, fontSize: '18px', lineHeight: 1.5 }}>{intro}</p>
          ) : null}

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '16px 28px',
            }}
          >
            {left.map((item, i) => (
              <FeatureRow key={`l-${i}`} idx={i} text={item} />
            ))}
            {right.map((item, i) => (
              <FeatureRow key={`r-${i}`} idx={half + i} text={item} />
            ))}
          </div>
        </div>

        {/* Sidebar on the right — mirrors the 401(k) sidebar but with a phone mockup */}
        <div
          style={{
            width: '320px',
            flexShrink: 0,
            background: BRAND_BLUE,
            color: '#ffffff',
            padding: '56px 28px 30px',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
            position: 'relative',
          }}
        >
          {/* Gold accent on the LEFT edge (401k has it on the right) */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              left: 0,
              width: '6px',
              background: BRAND_GOLD,
            }}
          />
          <div
            style={{
              fontFamily: HEADING_FONT,
              fontSize: '13px',
              fontWeight: 700,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: BRAND_GOLD,
            }}
          >
            Powered By
          </div>
          <div
            style={{
              fontFamily: HEADING_FONT,
              fontSize: '34px',
              fontWeight: 900,
              letterSpacing: '0.01em',
              lineHeight: 1,
              marginBottom: '4px',
            }}
          >
            {subTitle || 'Workforce Management'}
          </div>
          {sidebarTagline ? (
            <div style={{ fontSize: '13px', lineHeight: 1.5, color: '#cfe5f5' }}>
              {sidebarTagline}
            </div>
          ) : null}
          <div
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginTop: '10px',
            }}
          >
            {screenshot ? (
              <img
                src={proxiedSrc(screenshot)}
                alt=""
                crossOrigin="anonymous"
                style={{
                  maxWidth: '260px',
                  maxHeight: '440px',
                  objectFit: 'contain',
                  display: 'block',
                }}
              />
            ) : (
              <PlaceholderImage
                width={220}
                height={420}
                src={screenshot}
                rounded={24}
                background="#ffffff"
                border="none"
              />
            )}
          </div>
        </div>
      </div>

      <div style={{ position: 'absolute', bottom: '18px', left: '50px' }}>
        <SlammedLogo height={30} />
      </div>
    </SlideShell>
  );
}
