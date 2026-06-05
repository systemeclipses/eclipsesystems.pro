// /middleware.ts  (ROOT of the repo)
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { env } from '@/lib/env';

export async function middleware(req: NextRequest) {
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set('x-pathname', req.nextUrl.pathname);

  // Get the response
  let res = NextResponse.next({ request: { headers: requestHeaders } });

  const supabase = createServerClient(env.supabaseUrl, env.supabaseAnonKey, {
    cookies: {
      getAll() {
        return req.cookies.getAll();
      },
      setAll(cookies) {
        cookies.forEach(({ name, value, options }) => {
          res.cookies.set(name, value, options as CookieOptions);
        });
      },
    },
  });

  // Also copy all existing request cookies to response so they're available in layouts
  req.cookies.getAll().forEach(({ name, value }) => {
    res.cookies.set(name, value);
  });

  // Skip any refresh in development to avoid cookie loops
  if (process.env.NODE_ENV !== 'development') {
    try {
      const { data } = await supabase.auth.getSession();
      const session = data?.session;
      const expiresAt = session?.expires_at ? Number(session.expires_at) * 1000 : null;
      const now = Date.now();
      const shouldRefresh = !session || (expiresAt !== null && expiresAt - now < 5 * 60 * 1000);
      if (shouldRefresh) {
        await supabase.auth.refreshSession();
      }
    } catch (e: any) {
      console.warn('Middleware: session check/refresh error', e?.message ?? e);
    }
  }
  return res;
}

// run only on protected routes
export const config = {
  // Limit middleware to core protected routes while testing
  matcher: [
    '/dashboard/:path*',
    '/documents/:path*',
    '/academy/:path*',
    '/support/:path*',
    '/generators/:path*',
    '/gf1/:path*',
    '/profile/:path*',
    '/reports/:path*',
  ],
};
