import React from 'react';
import type { SlideFieldDef, SlideFieldValue } from '@/lib/gf1/slide-types';
import {
  BRAND_BLUE,
  BRAND_GOLD,
  BODY_TEXT,
  HEADING_FONT,
  PlaceholderImage,
  SlammedLogo,
  SlideShell,
} from './_shared';
import { asString } from '@/lib/gf1/slide-tokens';

export const MULTI_COMPANY_FIELDS: SlideFieldDef[] = [
  { key: 'title', label: 'Title', kind: 'text', defaultValue: 'Multiple Companies. One Login.' },
  { key: 'heroImageUrl', label: 'Hero Image URL', kind: 'image_url', defaultValue: '/multi.png' },
  {
    key: 'calloutAHeading',
    label: 'Top-left callout heading',
    kind: 'text',
    defaultValue: 'Switch between companies',
  },
  {
    key: 'calloutADescription',
    label: 'Top-left callout description',
    kind: 'multiline',
    defaultValue:
      'Managers and owners can effortlessly switch between companies and locations using built-in navigation. No logging out, no re-authenticating.',
  },
  {
    key: 'calloutBHeading',
    label: 'Bottom-left callout heading',
    kind: 'text',
    defaultValue: 'Security settings that just make sense',
  },
  {
    key: 'calloutBDescription',
    label: 'Bottom-left callout description',
    kind: 'multiline',
    defaultValue:
      'Managers can be given access to precisely the screens they need and no more. Access and security are of huge importance to Galactic!',
  },
  {
    key: 'calloutCHeading',
    label: 'Bottom-right callout heading',
    kind: 'text',
    defaultValue: 'Reporting needs? No problem!',
  },
  {
    key: 'calloutCDescription',
    label: 'Bottom-right callout description',
    kind: 'multiline',
    defaultValue:
      'No matter if you need consolidated reporting or granular reporting, we have you covered.',
  },
  {
    key: 'calloutDHeading',
    label: 'Top-right callout heading',
    kind: 'text',
    defaultValue: 'One team, every entity',
  },
  {
    key: 'calloutDDescription',
    label: 'Top-right callout description',
    kind: 'multiline',
    defaultValue:
      'You\'ll always work with the same payroll specialist and benefits coordinator across every entity. Familiar faces who know all of your companies inside and out.',
  },
];

function SwitchIcon({ size = 64 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <path
        d="M14 28a18 18 0 0 1 32-9"
        stroke={BRAND_BLUE}
        strokeWidth="4"
        strokeLinecap="round"
        fill="none"
      />
      <path d="M44 13l4 7-8 1" stroke={BRAND_BLUE} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path
        d="M50 36a18 18 0 0 1-32 9"
        stroke={BRAND_BLUE}
        strokeWidth="4"
        strokeLinecap="round"
        fill="none"
      />
      <path d="M20 51l-4-7 8-1" stroke={BRAND_BLUE} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}

function LockIcon({ size = 64 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <rect x="14" y="28" width="36" height="26" rx="3" fill={BRAND_BLUE} />
      <path
        d="M22 28v-6a10 10 0 0 1 20 0v6"
        stroke={BRAND_BLUE}
        strokeWidth="5"
        fill="none"
        strokeLinecap="round"
      />
      <circle cx="32" cy="40" r="3" fill="#ffffff" />
      <rect x="30.5" y="40" width="3" height="7" fill="#ffffff" />
    </svg>
  );
}

function TeamIcon({ size = 64 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" aria-hidden="true">
      {/* Center person (larger) */}
      <circle cx="32" cy="22" r="8" stroke={BRAND_BLUE} strokeWidth="4" fill="#ffffff" />
      <path
        d="M18 52c0-8 6-14 14-14s14 6 14 14"
        stroke={BRAND_BLUE}
        strokeWidth="4"
        strokeLinecap="round"
        fill="#ffffff"
      />
      {/* Left person */}
      <circle cx="14" cy="26" r="5" stroke={BRAND_BLUE} strokeWidth="3.5" fill="#ffffff" />
      <path
        d="M6 46c0-5 3.5-9 8-9"
        stroke={BRAND_BLUE}
        strokeWidth="3.5"
        strokeLinecap="round"
        fill="none"
      />
      {/* Right person */}
      <circle cx="50" cy="26" r="5" stroke={BRAND_BLUE} strokeWidth="3.5" fill="#ffffff" />
      <path
        d="M58 46c0-5-3.5-9-8-9"
        stroke={BRAND_BLUE}
        strokeWidth="3.5"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

function DocIcon({ size = 64 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <path
        d="M18 10h20l10 10v34a2 2 0 0 1-2 2H18a2 2 0 0 1-2-2V12a2 2 0 0 1 2-2z"
        stroke={BRAND_BLUE}
        strokeWidth="3"
        fill="#ffffff"
      />
      <path d="M38 10v10h10" stroke={BRAND_BLUE} strokeWidth="3" fill="none" strokeLinejoin="round" />
      <line x1="23" y1="30" x2="41" y2="30" stroke={BRAND_BLUE} strokeWidth="3" strokeLinecap="round" />
      <line x1="23" y1="37" x2="41" y2="37" stroke={BRAND_BLUE} strokeWidth="3" strokeLinecap="round" />
      <line x1="23" y1="44" x2="41" y2="44" stroke={BRAND_BLUE} strokeWidth="3" strokeLinecap="round" />
      <line x1="23" y1="51" x2="35" y2="51" stroke={BRAND_BLUE} strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

function Callout({
  icon,
  heading,
  description,
  width = 260,
  headingWidth,
  descriptionWidth,
  align = 'left',
  iconAlign,
  iconPosition = 'top',
  textOffsetY,
  textOffsetX,
}: {
  icon: React.ReactNode;
  heading: string;
  description: string;
  width?: number;
  headingWidth?: number;
  descriptionWidth?: number;
  align?: 'left' | 'right' | 'center';
  iconAlign?: 'left' | 'right' | 'center';
  iconPosition?: 'top' | 'right' | 'left';
  textOffsetY?: number;
  textOffsetX?: number;
}) {
  const textBlock = (
    <div
      style={{
        flex: 1,
        textAlign: align,
        marginTop: textOffsetY ? `${textOffsetY}px` : undefined,
        marginLeft: textOffsetX ? `${textOffsetX}px` : undefined,
      }}
    >
      <div
        style={{
          color: BRAND_BLUE,
          fontFamily: HEADING_FONT,
          fontWeight: 900,
          fontSize: '22px',
          letterSpacing: '0.01em',
          marginBottom: '8px',
          lineHeight: 1.15,
          maxWidth: headingWidth ? `${headingWidth}px` : undefined,
          marginLeft: align === 'right' && headingWidth ? 'auto' : undefined,
        }}
      >
        {heading}
      </div>
      <div
        style={{
          color: BODY_TEXT,
          fontSize: '15px',
          lineHeight: 1.5,
          maxWidth: descriptionWidth ? `${descriptionWidth}px` : undefined,
          marginLeft: align === 'right' && descriptionWidth ? 'auto' : undefined,
        }}
      >
        {description}
      </div>
    </div>
  );

  if (iconPosition === 'right') {
    return (
      <div
        style={{
          width: `${width + (textOffsetX ?? 0)}px`,
          display: 'flex',
          alignItems: 'flex-start',
          gap: '4px',
        }}
      >
        {textBlock}
        <div style={{ flexShrink: 0, marginTop: '-6px' }}>{icon}</div>
      </div>
    );
  }

  if (iconPosition === 'left') {
    return (
      <div style={{ width: `${width}px`, display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
        <div style={{ flexShrink: 0, marginTop: '-6px' }}>{icon}</div>
        {textBlock}
      </div>
    );
  }

  const resolvedIconAlign = iconAlign ?? align;
  const iconJustify =
    resolvedIconAlign === 'right'
      ? 'flex-end'
      : resolvedIconAlign === 'center'
        ? 'center'
        : 'flex-start';

  return (
    <div style={{ width: `${width}px`, textAlign: align }}>
      <div
        style={{
          display: 'flex',
          justifyContent: iconJustify,
          marginBottom: '10px',
        }}
      >
        {icon}
      </div>
      {textBlock}
    </div>
  );
}

export function MultiCompanyLayout({ data }: { data: Record<string, SlideFieldValue> }) {
  const title = asString(data.title) || 'Multiple Companies. One Login.';
  const heroImg = asString(data.heroImageUrl);
  const aH = asString(data.calloutAHeading);
  const aD = asString(data.calloutADescription);
  const bH = asString(data.calloutBHeading);
  const bD = asString(data.calloutBDescription);
  const cH = asString(data.calloutCHeading);
  const cD = asString(data.calloutCDescription);
  const dH = asString(data.calloutDHeading);
  const dD = asString(data.calloutDDescription);

  return (
    <SlideShell>
      {/* Left-edge accent stripes for extra pop */}
      <div style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: '110px', background: BRAND_BLUE }} />
      <div style={{ position: 'absolute', top: 0, bottom: 0, left: '110px', width: '28px', background: BRAND_GOLD }} />

      {/* Title — large, centered in the white area (right of left stripes) */}
      <div style={{ position: 'absolute', top: '28px', left: '138px', right: '0px' }}>
        <h1
          style={{
            margin: 0,
            color: BRAND_BLUE,
            fontFamily: HEADING_FONT,
            fontSize: '60px',
            fontWeight: 900,
            lineHeight: 1,
            letterSpacing: '0.01em',
            textAlign: 'center',
          }}
        >
          {title}
        </h1>
      </div>

      {/* Hero stacked-screenshots image, centered in the white area */}
      <div
        style={{
          position: 'absolute',
          left: 'calc(50% + 69px)',
          top: '400px',
          transform: 'translate(-50%, -50%)',
          width: '620px',
          height: '380px',
        }}
      >
        <PlaceholderImage
          width="100%"
          height="100%"
          src={heroImg}
          rounded={0}
          background="transparent"
          border="none"
        />
      </div>

      {/* Top-left callout: switch between companies (text left, icon right next to hero) */}
      <div style={{ position: 'absolute', top: '115px', left: '130px' }}>
        <Callout
          icon={<div style={{ marginTop: '-20px' }}><SwitchIcon size={130} /></div>}
          heading={aH}
          description={aD}
          width={440}
          iconPosition="right"
          textOffsetY={10}
          textOffsetX={70}
        />
      </div>

      {/* Bottom-left callout: security */}
      <div style={{ position: 'absolute', bottom: '25px', left: '165px' }}>
        <Callout
          icon={<div style={{ marginLeft: '70px' }}><LockIcon size={130} /></div>}
          heading={bH}
          description={bD}
          width={440}
          iconAlign="left"
        />
      </div>

      {/* Top-right callout: shared employees (icon left, text right-aligned — mirrors top-left) */}
      <div style={{ position: 'absolute', top: '105px', right: '50px' }}>
        <Callout
          icon={<div style={{ marginLeft: '-60px', marginTop: '25px' }}><TeamIcon size={130} /></div>}
          heading={dH}
          description={dD}
          width={320}
          descriptionWidth={220}
          iconPosition="left"
          align="right"
        />
      </div>

      {/* Bottom-right callout: reporting */}
      <div style={{ position: 'absolute', bottom: '70px', right: '50px' }}>
        <Callout icon={<DocIcon size={130} />} heading={cH} description={cD} width={300} align="right" />
      </div>

      <div style={{ position: 'absolute', bottom: '14px', right: '16px' }}>
        <SlammedLogo height={26} />
      </div>
    </SlideShell>
  );
}
