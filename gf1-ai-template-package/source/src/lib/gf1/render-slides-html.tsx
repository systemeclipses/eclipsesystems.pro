import { Buffer } from 'node:buffer';
import { getLayoutEntry, getLayoutDefaults } from '@/app/(protected)/gf1/proposals/[id]/_components/SlideBuilder/layouts';
import { resolveDataWithDefaults } from '@/lib/gf1/slide-tokens';
import type { ProposalSlide, SalesContext, SlideFieldValue } from './slide-types';

const IMAGE_PROXY_PREFIX = '/api/gf1/proposals/image-proxy?url=';

// Turns an <img> src found in the rendered markup into an absolute URL the
// server can fetch: unwrap the same-origin image proxy back to its real target,
// pass through absolute URLs, and resolve relative /public paths against origin.
function resolveFetchUrl(src: string, origin: string): string | null {
  if (!src || src.startsWith('data:')) return null;
  if (src.startsWith(IMAGE_PROXY_PREFIX)) {
    try {
      return decodeURIComponent(src.slice(IMAGE_PROXY_PREFIX.length));
    } catch {
      return null;
    }
  }
  if (/^https?:\/\//i.test(src)) return src;
  if (src.startsWith('/')) return `${origin}${encodeURI(src)}`;
  return `${origin}/${encodeURI(src)}`;
}

async function fetchAsDataUrl(url: string): Promise<string | null> {
  try {
    // Send browser-like headers: some image hosts (hotlink protection) reject
    // requests without a User-Agent/Accept. Cap the wait so a slow host can't
    // delay the export.
    const res = await fetch(url, {
      cache: 'no-store',
      redirect: 'follow',
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        Accept: 'image/avif,image/webp,image/png,image/svg+xml,image/*,*/*;q=0.8',
      },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const contentType = res.headers.get('content-type') || 'application/octet-stream';
    const buffer = Buffer.from(await res.arrayBuffer());
    return `data:${contentType};base64,${buffer.toString('base64')}`;
  } catch {
    return null;
  }
}

// Inlines every <img> as a base64 data URL. Headless Chromium then needs no
// network to render images, which is why photos now reliably appear in the PDF
// (the previous same-origin proxy hop could fail server-side). Images that
// can't be fetched are left as-is rather than breaking the whole render.
async function inlineImages(markup: string, origin: string): Promise<string> {
  const srcs = new Set<string>();
  const srcRegex = /<img\b[^>]*?\ssrc="([^"]+)"/g;
  let match: RegExpExecArray | null;
  while ((match = srcRegex.exec(markup)) !== null) {
    srcs.add(match[1]);
  }

  const replacements = await Promise.all(
    [...srcs].map(async (src) => {
      const fetchUrl = resolveFetchUrl(src, origin);
      if (!fetchUrl) return [src, null] as const;
      return [src, await fetchAsDataUrl(fetchUrl)] as const;
    }),
  );

  let result = markup;
  for (const [src, dataUrl] of replacements) {
    if (dataUrl) result = result.split(`src="${src}"`).join(`src="${dataUrl}"`);
  }
  return result;
}

// Renders the visible slides to a self-contained HTML document that headless
// Chromium prints to PDF. It renders the same layout components as the on-screen
// editor (mirroring SlideCanvas), so the PDF is pixel-faithful to the preview.
// Each slide is one 1280x720 page (16:9) via CSS @page sizing.
//
// We deliberately do NOT import the "use client" SlideCanvas here — that would
// (a) trip Next's react-dom/server guard and (b) render as an empty client
// reference on the server. The layout components themselves are plain,
// server-renderable React, so we reproduce SlideCanvas's tiny render here.
// react-dom/server is imported dynamically for the same guard reason.

function renderSlideBody(
  slide: ProposalSlide,
  salesContext: SalesContext,
  deckLayoutIds: ProposalSlide['layoutId'][],
) {
  const entry = getLayoutEntry(slide.layoutId);
  if (!entry) {
    return (
      <div
        style={{
          width: '1280px',
          height: '720px',
          background: '#fef2f2',
          color: '#7f1d1d',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'system-ui, sans-serif',
          fontSize: '20px',
        }}
      >
        Unknown slide layout: {slide.layoutId}
      </div>
    );
  }
  const defaults = getLayoutDefaults(slide.layoutId);
  const data: Record<string, SlideFieldValue> = resolveDataWithDefaults(
    slide.data ?? {},
    defaults,
    salesContext,
  );
  const Layout = entry.Component;
  return (
    <div style={{ width: '1280px', height: '720px' }}>
      <Layout data={data} ctx={salesContext} renderMode="export" deck={{ layoutIds: deckLayoutIds }} />
    </div>
  );
}

export async function renderSlidesToHtml({
  slides,
  salesContext,
  origin,
}: {
  slides: ProposalSlide[];
  salesContext: SalesContext;
  origin: string;
}): Promise<string> {
  const { renderToStaticMarkup } = await import('react-dom/server');

  const visible = [...slides]
    .filter((slide) => slide.visible)
    .sort((a, b) => a.order - b.order);
  const layoutIds = visible.map((slide) => slide.layoutId);

  const rawMarkup = visible
    .map((slide) => {
      const inner = renderToStaticMarkup(renderSlideBody(slide, salesContext, layoutIds));
      return `<div class="slide">${inner}</div>`;
    })
    .join('\n');

  // Embed every image as a data URL so Chromium needs no network for images.
  const slidesMarkup = await inlineImages(rawMarkup, origin);

  // Inline the Tondu heading font the same way so it's guaranteed to render in
  // the PDF (a network @font-face fetch is unreliable in the print context).
  const tonduDataUrl = await fetchAsDataUrl(`${origin}/Tondu-Beta.ttf`);
  const tonduSrc = tonduDataUrl
    ? `url("${tonduDataUrl}") format("truetype")`
    : `url("${origin}/Tondu-Beta.ttf") format("truetype")`;

  // <base> resolves the slides' relative asset URLs (e.g. "/Logo Slammed.png"
  // and the same-origin image proxy) against the deployment. Tondu is loaded
  // from /public; Poppins from Google Fonts. We await document.fonts.ready in
  // the route before printing so glyph metrics are final.
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<base href="${origin}/" />
<style>
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&display=swap');
@font-face {
  font-family: "Tondu";
  src: ${tonduSrc};
  font-style: normal;
  font-weight: 700;
  font-display: swap;
}
* { margin: 0; padding: 0; box-sizing: border-box; }
html, body { margin: 0; padding: 0; background: #ffffff; }
@page { size: 1280px 720px; margin: 0; }
.slide {
  width: 1280px;
  height: 720px;
  overflow: hidden;
  position: relative;
  page-break-after: always;
  break-after: page;
}
.slide:last-child { page-break-after: auto; break-after: auto; }
</style>
</head>
<body>
${slidesMarkup}
</body>
</html>`;
}
