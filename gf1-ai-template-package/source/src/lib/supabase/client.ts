import { createClient } from '@supabase/supabase-js';
import { env } from '@/lib/env';

export const supaClient = (storage?: Storage) =>
  createClient(
    env.supabaseUrl,
    env.supabaseAnonKey,
    { auth: { persistSession: true, autoRefreshToken: true, storage } }
  );
