import React from 'react';

export const CANVAS_W = 1280;
export const CANVAS_H = 720;

// Route absolute (cross-origin) image URLs through our same-origin proxy so the
// browser will display them with crossOrigin="anonymous" set and html2canvas can
// read their pixels without tainting the export canvas. Relative/public assets
// (e.g. "/Logo Slammed.png") are already same-origin and pass through untouched.
export function proxiedSrc(src?: string | null): string {
  if (!src) return '';
  if (!/^https?:\/\//i.test(src)) return src;
  return `/api/gf1/proposals/image-proxy?url=${encodeURIComponent(src)}`;
}
export const BRAND_BLUE = '#005c99';
export const BRAND_BLUE_DARK = '#004678';
export const BRAND_GOLD = '#f9c512';
export const BRAND_GOLD_DARK = '#d89707';
export const SOFT_BG = '#ffffff';
export const BODY_TEXT = '#3a4a59';
export const MUTED_TEXT = '#7b8b97';
export const HEADING_FONT =
  '"Tondu", "Poppins", "Helvetica Neue", "Arial Black", "Segoe UI", system-ui, -apple-system, sans-serif';
export const BODY_FONT =
  '"Poppins", "Segoe UI", system-ui, -apple-system, sans-serif';

export function SlideShell({
  children,
  background = SOFT_BG,
}: {
  children: React.ReactNode;
  background?: string;
}) {
  return (
    <div
      style={{
        width: `${CANVAS_W}px`,
        height: `${CANVAS_H}px`,
        background,
        position: 'relative',
        overflow: 'hidden',
        fontFamily: BODY_FONT,
        color: BODY_TEXT,
      }}
    >
      {children}
    </div>
  );
}

// Footer/branding mark using the canonical "Logo Slammed" PNG from /public.
// Used in the bottom-right corner of every slide so the deck matches the rest
// of Galactic's marketing material. Pass `white` on dark backgrounds.
export function SlammedLogo({
  height = 32,
  white = false,
}: {
  height?: number;
  white?: boolean;
}) {
  return (
    <img
      src="/Logo Slammed.png"
      alt="Galactic"
      crossOrigin="anonymous"
      style={{
        height: `${height}px`,
        width: 'auto',
        display: 'block',
        objectFit: 'contain',
        filter: white ? 'brightness(0) invert(1)' : undefined,
      }}
    />
  );
}

// Diagonal blue/gold ribbon — used at the top-right of the cover slide and
// repeating accents on other standard slides.
export function CornerRibbon({
  position,
  scale = 1,
  variant = 'blue-on-top',
  flipY = false,
  stripeAngle = 30,
  goldWidth = 22,
  blueWidth = 22,
}: {
  position: 'top-right' | 'bottom-left' | 'top-left' | 'bottom-right';
  scale?: number;
  variant?: 'blue-on-top' | 'gold-on-top';
  flipY?: boolean;
  stripeAngle?: number;
  goldWidth?: number;
  blueWidth?: number;
}) {
  const size = 360 * scale;
  const goldFirst = variant === 'gold-on-top';

  let style: React.CSSProperties = {
    position: 'absolute',
    width: `${size}px`,
    height: `${size}px`,
    pointerEvents: 'none',
  };
  let rotation = 0;
  switch (position) {
    case 'top-right':
      style = { ...style, top: `-${size * 0.35}px`, right: `-${size * 0.35}px` };
      rotation = 0;
      break;
    case 'bottom-left':
      style = { ...style, bottom: `-${size * 0.35}px`, left: `-${size * 0.35}px` };
      rotation = 180;
      break;
    case 'top-left':
      style = { ...style, top: `-${size * 0.35}px`, left: `-${size * 0.35}px` };
      rotation = 270;
      break;
    case 'bottom-right':
      style = { ...style, bottom: `-${size * 0.35}px`, right: `-${size * 0.35}px` };
      rotation = 90;
      break;
  }

  return (
    <div style={style}>
      <svg
        viewBox="0 0 100 100"
        width="100%"
        height="100%"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Two diagonal stripes with circular cutouts — matches the proposal template */}
        <g transform={`rotate(${rotation} 50 50)`}>
          <g transform={flipY ? 'translate(0 100) scale(1 -1)' : undefined}>
        {goldFirst ? (
          <>
            <rect x={55} y="-25" width={blueWidth} height="160" fill={BRAND_BLUE} transform={`rotate(${stripeAngle} 50 50)`} />
            <rect x={55 - goldWidth} y="-25" width={goldWidth} height="160" fill={BRAND_GOLD} transform={`rotate(${stripeAngle} 50 50)`} />
          </>
        ) : (
          <>
            <rect x={55 - goldWidth} y="-25" width={goldWidth} height="160" fill={BRAND_GOLD} transform={`rotate(${stripeAngle} 50 50)`} />
            <rect x={55} y="-25" width={blueWidth} height="160" fill={BRAND_BLUE} transform={`rotate(${stripeAngle} 50 50)`} />
          </>
        )}
          </g>
        </g>
      </svg>
    </div>
  );
}

// Downward-pointing blue triangle stacked on a similar, slightly larger yellow
// triangle (same proportions). Used as a corner accent in place of the
// diagonal ribbon stripes.
export function CornerChevron({
  position,
  width = 280,
  height = 140,
  scale = 1.22,
  offsetX = 0,
}: {
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  width?: number;
  height?: number;
  scale?: number;
  offsetX?: number;
}) {
  const yellowW = width * scale;
  const yellowH = height * scale;
  const dx = (yellowW - width) / 2;
  const dy = yellowH - height;

  const vbPadX = dx;
  const vbPadBottom = dy;

  let style: React.CSSProperties = {
    position: 'absolute',
    width: `${width + 2 * vbPadX}px`,
    height: `${height + vbPadBottom}px`,
    pointerEvents: 'none',
    zIndex: 5,
  };
  switch (position) {
    case 'top-left':
      style = { ...style, top: '0px', left: `${offsetX - vbPadX}px` };
      break;
    case 'top-right':
      style = { ...style, top: '0px', right: `${offsetX - vbPadX}px` };
      break;
    case 'bottom-left':
      style = { ...style, bottom: '0px', left: `${offsetX - vbPadX}px` };
      break;
    case 'bottom-right':
      style = { ...style, bottom: '0px', right: `${offsetX - vbPadX}px` };
      break;
  }

  const isBottom = position === 'bottom-left' || position === 'bottom-right';
  const vbHeight = height + vbPadBottom;
  // For bottom positions the polygons are flipped vertically directly via
  // coordinate math so the apex points up into the slide instead of down off
  // the slide edge.
  const yellowPoints = isBottom
    ? `${-dx},${vbHeight} ${width + dx},${vbHeight} ${width / 2},${vbHeight - yellowH}`
    : `${-dx},0 ${width + dx},0 ${width / 2},${yellowH}`;
  const bluePoints = isBottom
    ? `0,${vbHeight} ${width},${vbHeight} ${width / 2},${vbHeight - height}`
    : `0,0 ${width},0 ${width / 2},${height}`;

  return (
    <div style={style}>
      <svg
        width="100%"
        height="100%"
        viewBox={`${-vbPadX} 0 ${width + 2 * vbPadX} ${vbHeight}`}
        style={{
          display: 'block',
          transform:
            position === 'top-right' || position === 'bottom-right'
              ? 'scaleX(-1)'
              : undefined,
          transformOrigin: 'center',
        }}
      >
        <polygon points={yellowPoints} fill={BRAND_GOLD} />
        <polygon points={bluePoints} fill={BRAND_BLUE} />
      </svg>
    </div>
  );
}

// Two parallel diagonal stripes that span the full height of the slide.
// Used on the cover slide — replaces the corner-only ribbon for that layout.
export function EdgeStripes({
  variant = 'blue-on-top',
  offsetX = 1040,
  stripeWidth = 120,
  angle = 30,
}: {
  variant?: 'blue-on-top' | 'gold-on-top';
  offsetX?: number;
  stripeWidth?: number;
  angle?: number;
}) {
  const goldFirst = variant === 'gold-on-top';
  const tallH = CANVAS_H + 600;
  const yStart = -300;
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        overflow: 'hidden',
      }}
    >
      <svg
        width={CANVAS_W}
        height={CANVAS_H}
        viewBox={`0 0 ${CANVAS_W} ${CANVAS_H}`}
        style={{ display: 'block' }}
      >
        <g transform={`rotate(${angle} ${offsetX} ${CANVAS_H / 2})`}>
          {goldFirst ? (
            <>
              <rect x={offsetX} y={yStart} width={stripeWidth} height={tallH} fill={BRAND_BLUE} />
              <rect x={offsetX - stripeWidth} y={yStart} width={stripeWidth} height={tallH} fill={BRAND_GOLD} />
            </>
          ) : (
            <>
              <rect x={offsetX - stripeWidth} y={yStart} width={stripeWidth} height={tallH} fill={BRAND_GOLD} />
              <rect x={offsetX} y={yStart} width={stripeWidth} height={tallH} fill={BRAND_BLUE} />
            </>
          )}
        </g>
      </svg>
    </div>
  );
}

// Used on slides 04, 07, 08, 09, 11, 13 — full-width blue bar + gold underline.
export function BlueHeaderBar({
  title,
  rightSlot,
  height = 110,
  titleAlign = 'left',
  titleMaxWidth,
  titleFontSize = 52,
  goldStripeHeight = 6,
  titleLineHeight = 1,
  stripeColor = BRAND_GOLD,
}: {
  title: React.ReactNode;
  rightSlot?: React.ReactNode;
  height?: number;
  titleAlign?: 'left' | 'right' | 'center';
  titleMaxWidth?: number | string;
  titleFontSize?: number;
  goldStripeHeight?: number;
  titleLineHeight?: number | string;
  stripeColor?: string;
}) {
  const alignRight = titleAlign === 'right';
  const alignCenter = titleAlign === 'center';
  return (
    <>
      <div
        style={{
          background: BRAND_BLUE,
          height: `${height}px`,
          padding: '0 56px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
        }}
      >
        <h1
          style={{
            margin: 0,
            marginLeft: alignRight ? 'auto' : undefined,
            flex: alignCenter ? 1 : undefined,
            color: '#ffffff',
            fontFamily: HEADING_FONT,
            fontSize: `${titleFontSize}px`,
            fontWeight: 900,
            letterSpacing: '0.02em',
            lineHeight: titleLineHeight,
            textAlign: titleAlign,
            maxWidth: typeof titleMaxWidth === 'number' ? `${titleMaxWidth}px` : titleMaxWidth,
          }}
        >
          {title}
        </h1>
        {rightSlot}
      </div>
      <div style={{ height: `${goldStripeHeight}px`, background: stripeColor, flexShrink: 0 }} />
    </>
  );
}

export function BulletList({
  items,
  fontSize = 18,
  gap = 10,
  bulletColor = BRAND_BLUE,
}: {
  items: string[];
  fontSize?: number;
  gap?: number;
  bulletColor?: string;
}) {
  return (
    <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: `${gap}px` }}>
      {items.map((item, i) => (
        <li key={`${i}-${item.slice(0, 12)}`} style={{ display: 'flex', gap: '10px', fontSize: `${fontSize}px`, color: BODY_TEXT, lineHeight: 1.45 }}>
          <span style={{ color: bulletColor, fontWeight: 900, lineHeight: 1.45, flexShrink: 0 }}>•</span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export function PinIcon({ color = '#ffffff', size = 20 }: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill={color}
        d="M12 2C7.59 2 4 5.59 4 10c0 5.25 7.13 11.51 7.43 11.78a.85.85 0 0 0 1.14 0C12.87 21.51 20 15.25 20 10c0-4.41-3.59-8-8-8zm0 11a3 3 0 1 1 0-6 3 3 0 0 1 0 6z"
      />
    </svg>
  );
}

export function FooterLogoStrip({
  orgLine,
  date,
}: {
  orgLine?: string | null;
  date?: string;
}) {
  return (
    <div
      style={{
        position: 'absolute',
        bottom: '14px',
        left: '0',
        right: '0',
        padding: '0 36px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        pointerEvents: 'none',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '14px' }}>
        {orgLine ? (
          <span style={{ fontSize: '11px', color: MUTED_TEXT, fontWeight: 700, letterSpacing: '0.06em' }}>
            {orgLine}
          </span>
        ) : null}
        {date ? (
          <span style={{ fontSize: '11px', color: MUTED_TEXT, fontWeight: 600 }}>{date}</span>
        ) : null}
      </div>
      <SlammedLogo height={32} />
    </div>
  );
}

export function DiamondImage({
  size,
  src,
  background = '#e8edf2',
  tint,
}: {
  size: number;
  src?: string | null;
  background?: string;
  tint?: string;
}) {
  const baseStyle: React.CSSProperties = {
    position: 'relative',
    width: `${size}px`,
    height: `${size}px`,
  };
  const diamondClip = 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)';

  if (src && src.trim().length > 0) {
    return (
      <div style={baseStyle}>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            clipPath: diamondClip,
            WebkitClipPath: diamondClip,
          }}
        >
          <img
            src={proxiedSrc(src)}
            alt=""
            crossOrigin="anonymous"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: 'block',
            }}
          />
        </div>
        {tint ? (
          <div
            style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              width: `${size}px`,
              height: `${size}px`,
              background: tint,
              transform: 'translate(-50%, -50%) rotate(45deg)',
              transformOrigin: 'center',
              pointerEvents: 'none',
            }}
          />
        ) : null}
      </div>
    );
  }
  return (
    <div
      style={{
        ...baseStyle,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#9aaab8',
      }}
    >
      <svg width="42" height="42" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M21 5H3a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h18a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2zM5 17l3.5-4.5 2.5 3 3.5-4.5L20 17H5z" />
      </svg>
      {tint ? (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: tint,
            pointerEvents: 'none',
            clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
          }}
        />
      ) : null}
    </div>
  );
}

export function PlaceholderImage({
  width,
  height,
  label,
  src,
  rounded = 12,
  border = `1px solid rgba(0,92,153,0.12)`,
  background = '#e8edf2',
  fit = 'cover',
  padding = 0,
}: {
  width: number | string;
  height: number | string;
  label?: string;
  src?: string | null;
  rounded?: number;
  border?: string;
  background?: string;
  // 'cover' crops to fill (good for photos); 'contain' shows the whole image
  // (good for logos, which must not be cropped).
  fit?: 'cover' | 'contain';
  padding?: number | string;
}) {
  if (src && src.trim().length > 0) {
    return (
      <div
        style={{
          width: typeof width === 'number' ? `${width}px` : width,
          height: typeof height === 'number' ? `${height}px` : height,
          borderRadius: `${rounded}px`,
          overflow: 'hidden',
          border,
          background,
          boxSizing: 'border-box',
          padding: typeof padding === 'number' ? `${padding}px` : padding,
        }}
      >
        <img
          src={proxiedSrc(src)}
          alt={label ?? ''}
          crossOrigin="anonymous"
          style={{ width: '100%', height: '100%', objectFit: fit, display: 'block' }}
        />
      </div>
    );
  }
  return (
    <div
      style={{
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
        borderRadius: `${rounded}px`,
        border,
        background,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#9aaab8',
        fontSize: '14px',
      }}
    >
      <svg width="42" height="42" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M21 5H3a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h18a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2zM5 17l3.5-4.5 2.5 3 3.5-4.5L20 17H5z" />
      </svg>
    </div>
  );
}

export function FeatureIcon({
  icon,
  color = BRAND_BLUE,
  size = 44,
  background,
}: {
  icon: React.ReactNode;
  color?: string;
  size?: number;
  background?: string;
}) {
  return (
    <div
      style={{
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: '8px',
        background: background ?? `${color}1f`,
        color,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      {icon}
    </div>
  );
}

// Small inline glyphs used across the slides — kept generic and brand-tinted.
export const Glyph = {
  Clock: (props: { size?: number; color?: string }) => (
    <svg width={props.size ?? 22} height={props.size ?? 22} viewBox="0 0 24 24" fill="none" stroke={props.color ?? '#fff'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" /><polyline points="12 7 12 12 15 14" />
    </svg>
  ),
  Doc: (props: { size?: number; color?: string }) => (
    <svg width={props.size ?? 22} height={props.size ?? 22} viewBox="0 0 24 24" fill="none" stroke={props.color ?? '#fff'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
    </svg>
  ),
  Bank: (props: { size?: number; color?: string }) => (
    <svg width={props.size ?? 22} height={props.size ?? 22} viewBox="0 0 24 24" fill="none" stroke={props.color ?? '#fff'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 21h18M5 21V10M9 21V10M15 21V10M19 21V10M2 10h20L12 3 2 10z" />
    </svg>
  ),
  Money: (props: { size?: number; color?: string }) => (
    <svg width={props.size ?? 22} height={props.size ?? 22} viewBox="0 0 24 24" fill="none" stroke={props.color ?? '#fff'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  ),
  Shield: (props: { size?: number; color?: string }) => (
    <svg width={props.size ?? 22} height={props.size ?? 22} viewBox="0 0 24 24" fill="none" stroke={props.color ?? '#fff'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  ),
  Heart: (props: { size?: number; color?: string }) => (
    <svg width={props.size ?? 22} height={props.size ?? 22} viewBox="0 0 24 24" fill="none" stroke={props.color ?? '#fff'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  ),
  Phone: (props: { size?: number; color?: string }) => (
    <svg width={props.size ?? 22} height={props.size ?? 22} viewBox="0 0 24 24" fill="none" stroke={props.color ?? '#fff'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="2" width="14" height="20" rx="2" /><line x1="12" y1="18" x2="12" y2="18" />
    </svg>
  ),
  Laptop: (props: { size?: number; color?: string }) => (
    <svg width={props.size ?? 22} height={props.size ?? 22} viewBox="0 0 24 24" fill="none" stroke={props.color ?? '#fff'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="12" rx="2" /><line x1="2" y1="20" x2="22" y2="20" />
    </svg>
  ),
  Chart: (props: { size?: number; color?: string }) => (
    <svg width={props.size ?? 22} height={props.size ?? 22} viewBox="0 0 24 24" fill="none" stroke={props.color ?? '#fff'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="20" x2="12" y2="10" /><line x1="18" y1="20" x2="18" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  ),
  Users: (props: { size?: number; color?: string }) => (
    <svg width={props.size ?? 22} height={props.size ?? 22} viewBox="0 0 24 24" fill="none" stroke={props.color ?? '#fff'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  Calendar: (props: { size?: number; color?: string }) => (
    <svg width={props.size ?? 22} height={props.size ?? 22} viewBox="0 0 24 24" fill="none" stroke={props.color ?? '#fff'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  ),
  Lock: (props: { size?: number; color?: string }) => (
    <svg width={props.size ?? 22} height={props.size ?? 22} viewBox="0 0 24 24" fill="none" stroke={props.color ?? '#fff'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  ),
  Check: (props: { size?: number; color?: string }) => (
    <svg width={props.size ?? 22} height={props.size ?? 22} viewBox="0 0 24 24" fill="none" stroke={props.color ?? '#fff'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  Plus: (props: { size?: number; color?: string }) => (
    <svg width={props.size ?? 22} height={props.size ?? 22} viewBox="0 0 24 24" fill="none" stroke={props.color ?? '#fff'} strokeWidth="2.5" strokeLinecap="round">
      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  ),
  Search: (props: { size?: number; color?: string }) => (
    <svg width={props.size ?? 22} height={props.size ?? 22} viewBox="0 0 24 24" fill="none" stroke={props.color ?? '#fff'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="7" /><line x1="16" y1="16" x2="21" y2="21" />
    </svg>
  ),
  Globe: (props: { size?: number; color?: string }) => (
    <svg width={props.size ?? 22} height={props.size ?? 22} viewBox="0 0 24 24" fill="none" stroke={props.color ?? '#fff'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  ),
  Bolt: (props: { size?: number; color?: string }) => (
    <svg width={props.size ?? 22} height={props.size ?? 22} viewBox="0 0 24 24" fill="none" stroke={props.color ?? '#fff'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  ),
  Megaphone: (props: { size?: number; color?: string }) => (
    <svg width={props.size ?? 22} height={props.size ?? 22} viewBox="0 0 24 24" fill="none" stroke={props.color ?? '#fff'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 11v3a1 1 0 0 0 1 1h2l3.5 4v-13L6 10H4a1 1 0 0 0-1 1z" /><path d="M15 6c2 1 3 3 3 6.5S17 18 15 19" />
    </svg>
  ),
  Folder: (props: { size?: number; color?: string }) => (
    <svg width={props.size ?? 22} height={props.size ?? 22} viewBox="0 0 24 24" fill="none" stroke={props.color ?? '#fff'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2z" />
    </svg>
  ),
  Stethoscope: (props: { size?: number; color?: string }) => (
    <svg width={props.size ?? 22} height={props.size ?? 22} viewBox="0 0 24 24" fill="none" stroke={props.color ?? '#fff'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 2v2" /><path d="M5 2v2" /><path d="M5 3H4a2 2 0 0 0-2 2v4a6 6 0 0 0 12 0V5a2 2 0 0 0-2-2h-1" /><path d="M8 15a6 6 0 0 0 12 0v-3" /><circle cx="20" cy="10" r="2" />
    </svg>
  ),
  Scales: (props: { size?: number; color?: string }) => (
    <svg width={props.size ?? 22} height={props.size ?? 22} viewBox="0 0 24 24" fill="none" stroke={props.color ?? '#fff'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1z" /><path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1z" /><path d="M7 21h10" /><path d="M12 3v18" /><path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2" />
    </svg>
  ),
  Monitor: (props: { size?: number; color?: string }) => (
    <svg width={props.size ?? 22} height={props.size ?? 22} viewBox="0 0 24 24" fill="none" stroke={props.color ?? '#fff'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="14" rx="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" />
    </svg>
  ),
  ZayZoon: (props: { size?: number; color?: string }) => (
    <svg width={props.size ?? 22} height={props.size ?? 22} viewBox="0 0 24 24" fill="none" stroke={props.color ?? '#fff'} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 6 18 6 6 18 18 18" />
    </svg>
  ),
};
