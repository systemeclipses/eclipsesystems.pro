import { cookies } from "next/headers";
import { createServerClient as createSsrServerClient } from "@supabase/ssr";
import type { Database } from "@/types/database";

export function createServerClient() {
  const cookieStore = cookies();

  return createSsrServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options) {
          cookieStore.set({ name, value: "", ...options });
        }
      }
    }
  );
}
