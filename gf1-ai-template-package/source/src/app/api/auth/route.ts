import { NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

const isProd = process.env.NODE_ENV === 'production';
const cookieOptions: CookieOptions = {
  sameSite: 'lax',
  secure: isProd,
  path: '/',
};

function createClient(request: Request, response: NextResponse) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions,
      cookies: {
        getAll() {
          const raw = request.headers.get('cookie');
          if (!raw) return [];
          return raw.split(';').map((part) => {
            const [name, value] = part.trim().split('=');
            return { name, value };
          });
        },
        setAll(cookies) {
          cookies.forEach(({ name, value, options }) => {
            response.cookies.set(
              name,
              value,
              {
                ...(options as CookieOptions),
                sameSite: cookieOptions.sameSite,
                secure: cookieOptions.secure,
                path: cookieOptions.path,
              },
            );
          });
        },
      },
    },
  );
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { session } = body ?? {};

    console.log('[/api/auth] Received session payload:', {
      hasSession: !!session,
      accessBytes: session?.access_token ? String(session.access_token).length : 0,
      refreshBytes: session?.refresh_token ? String(session.refresh_token).length : 0,
    });

    if (!session?.access_token || !session?.refresh_token) {
      return NextResponse.json({ ok: false, message: 'Missing access or refresh token' }, { status: 400 });
    }

    const response = NextResponse.json({ ok: true });
    const supabase = createClient(request, response);
    const { error } = await supabase.auth.setSession({
      access_token: String(session.access_token),
      refresh_token: String(session.refresh_token),
    });

    if (error) {
      console.error('[/api/auth] setSession error:', error.message);
      return NextResponse.json({ ok: false, message: error.message }, { status: 400 });
    }

    return response;
  } catch (err: any) {
    console.error('[/api/auth] Unexpected error:', err?.message ?? err);
    return NextResponse.json({ ok: false, message: 'failed to set session' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const response = NextResponse.json({ ok: true });
  const supabase = createClient(request, response);
  await supabase.auth.signOut();
  return response;
}
