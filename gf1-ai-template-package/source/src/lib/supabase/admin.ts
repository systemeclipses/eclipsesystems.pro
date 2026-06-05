import { createClient } from '@supabase/supabase-js';
import { env, getServiceRoleKey } from '@/lib/env';

import type { SupabaseClient } from '@supabase/supabase-js';

let client: SupabaseClient | null = null;

export function supaAdmin() {
  if (!client) {
    client = createClient(env.supabaseUrl, getServiceRoleKey(), {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }

  return client;
}
