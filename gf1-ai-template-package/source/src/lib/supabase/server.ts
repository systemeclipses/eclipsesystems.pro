import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { env } from '@/lib/env';

const isProd = process.env.NODE_ENV === 'production';

export async function supaServer() {
  const cookieStore = await cookies();

  return createServerClient(
    env.supabaseUrl,
    env.supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(
                name,
                value,
                {
                  ...(options as CookieOptions),
                  secure: isProd,
                },
              );
            });
          } catch {
            // ignore write errors during SSR
          }
        },
      },
    }
  );
}
