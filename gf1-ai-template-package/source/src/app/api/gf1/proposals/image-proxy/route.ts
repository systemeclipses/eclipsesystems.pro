import { NextResponse } from 'next/server';

// Same-origin image proxy for slide rendering / PDF export.
//
// Slide images (e.g. an org's logo) are served from Supabase storage on a
// different origin. The slide <img> tags carry crossOrigin="anonymous" so that
// html2canvas can read their pixels without tainting the export canvas — but
// when the remote response omits Access-Control-Allow-Origin, the browser
// refuses to even display the image. Streaming it back through this route makes
// it same-origin, which both fixes the on-screen preview and lets html2canvas
// capture it cleanly.
//
// The allowlist keeps this from becoming an open proxy (SSRF). Only the
// project's Supabase storage host is permitted.

function deriveSupabaseHost(): string | null {
  const fromEnv = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  if (fromEnv) {
    try {
      return new URL(fromEnv).hostname;
    } catch {
      // fall through to the hard-coded fallback below
    }
  }
  return 'fupyymbofvdmdfmombkb.supabase.co';
}

const ALLOWED_HOSTS = new Set([deriveSupabaseHost()].filter(Boolean) as string[]);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const target = searchParams.get('url');
  if (!target) {
    return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 });
  }

  let parsed: URL;
  try {
    parsed = new URL(target);
  } catch {
    return NextResponse.json({ error: 'Invalid url' }, { status: 400 });
  }

  if (parsed.protocol !== 'https:' || !ALLOWED_HOSTS.has(parsed.hostname)) {
    return NextResponse.json({ error: 'Host not allowed' }, { status: 403 });
  }

  let upstream: Response;
  try {
    upstream = await fetch(parsed.toString(), { cache: 'no-store' });
  } catch {
    return NextResponse.json({ error: 'Upstream fetch failed' }, { status: 502 });
  }

  if (!upstream.ok || !upstream.body) {
    return NextResponse.json({ error: 'Upstream error' }, { status: 502 });
  }

  const contentType = upstream.headers.get('content-type') ?? 'application/octet-stream';
  if (!contentType.startsWith('image/')) {
    return NextResponse.json({ error: 'Not an image' }, { status: 415 });
  }

  return new NextResponse(upstream.body, {
    status: 200,
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
