import { redirect } from 'next/navigation';
import type { User } from '@supabase/supabase-js';
import { supaServer } from '@/lib/supabase/server';
import { supaAdmin } from '@/lib/supabase/admin';
import type { ProfileRole } from './types';

type SupabaseServerClient = Awaited<ReturnType<typeof supaServer>>;

const SIGN_IN_REDIRECT = '/signin';
const FORBIDDEN_REDIRECT = '/dashboard?auth=forbidden';
const GF1_ALLOWED_ROLES: ProfileRole[] = ['admin', 'sales', 'sales_manager'];

export function hasGf1Access(role: ProfileRole | null | undefined) {
  return Boolean(role && GF1_ALLOWED_ROLES.includes(role));
}

export async function resolveProfileName(user: User): Promise<string | null> {
  const admin = supaAdmin();
  try {
    const { data, error, status } = await admin
      .from('profiles')
      .select('name')
      .eq('user_id', user.id)
      .limit(1)
      .maybeSingle();

    if (error && status !== 406) {
      console.error('Failed to load profile name', error);
    } else if (typeof data?.name === 'string') {
      const trimmed = data.name.trim();
      if (trimmed) return trimmed;
    }
  } catch (err) {
    console.error('Unexpected error resolving profile name', err);
  }

  const fallback = (user.user_metadata as any)?.full_name || (user.user_metadata as any)?.name;
  if (typeof fallback === 'string' && fallback.trim()) return fallback.trim();

  return null;
}

export async function resolveProfileEmail(user: User): Promise<string | null> {
  const admin = supaAdmin();
  try {
    const { data, error, status } = await admin
      .from('profiles')
      .select('email')
      .eq('user_id', user.id)
      .limit(1)
      .maybeSingle();

    if (error && status !== 406) {
      console.error('Failed to load profile email', error);
    } else if (typeof data?.email === 'string') {
      const trimmed = data.email.trim();
      if (trimmed) return trimmed;
    }
  } catch (err) {
    console.error('Unexpected error resolving profile email', err);
  }

  if (user.email) return user.email;

  return null;
}

export async function resolveProfilePhone(user: User): Promise<string | null> {
  const admin = supaAdmin();
  try {
    const { data, error, status } = await admin
      .from('profiles')
      .select('phone')
      .eq('user_id', user.id)
      .limit(1)
      .maybeSingle();

    if (error && status !== 406) {
      console.error('Failed to load profile phone', error);
    } else if (typeof data?.phone === 'string') {
      const trimmed = data.phone.trim();
      if (trimmed) return trimmed;
    }
  } catch (err) {
    console.error('Unexpected error resolving profile phone', err);
  }

  return null;
}

export async function fetchSalesOrgIds(
  supabase: SupabaseServerClient,
  salesRepName: string
): Promise<string[]> {
  const { data, error } = await supabase
    .from('organizations')
    .select('id')
    .eq('sales_rep_name', salesRepName);

  if (error) {
    console.error('Failed to load sales org ids', error);
    return [];
  }

  return (data ?? []).map((row: any) => row.id).filter(Boolean) as string[];
}

export async function resolveProfileRole(user: User): Promise<ProfileRole | null> {
  const admin = supaAdmin();
  const { data, error, status } = await admin
    .from('profiles')
    .select('role')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle();

  if (error && status !== 406) {
    console.error('Failed to load GF1 profile role', error);
    throw error;
  }

  if (data?.role) {
    return data.role as ProfileRole;
  }

  if (user.email) {
    const { data: fallback, error: fallbackError, status: fallbackStatus } = await admin
      .from('profiles')
      .select('role')
      .eq('email', user.email)
      .limit(1)
      .maybeSingle();

    if (fallbackError && fallbackStatus !== 406) {
      console.error('Failed to load GF1 profile role by email', fallbackError);
      throw fallbackError;
    }

    if (fallback?.role) return fallback.role as ProfileRole;
  }

  return null;
}

export async function getCurrentUser() {
  const supabase = await supaServer();
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  return data.user;
}

export async function getCurrentRole(): Promise<ProfileRole | null> {
  const supabase = await supaServer();
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  const user = data.user;
  if (!user) return null;
  return resolveProfileRole(user);
}

export async function requireAuth(existingClient?: SupabaseServerClient) {
  const supabase = existingClient ?? (await supaServer());
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  const user = data.user;
  if (!user) redirect(SIGN_IN_REDIRECT);
  const role = await resolveProfileRole(user);
  return { supabase, user, role };
}

export async function requireAdmin(existingClient?: SupabaseServerClient) {
  const session = await requireAuth(existingClient);
  if (session.role !== 'admin') {
    redirect(FORBIDDEN_REDIRECT);
  }
  return session;
}

export async function requireStaffOrAdmin(existingClient?: SupabaseServerClient) {
  const session = await requireAuth(existingClient);
  const allowed = new Set<ProfileRole>(['admin', 'staff', 'sales', 'sales_manager']);
  if (!session.role || !allowed.has(session.role)) {
    redirect(FORBIDDEN_REDIRECT);
  }
  return session;
}

export async function requireSalesUser(existingClient?: SupabaseServerClient) {
  const session = await requireAuth(existingClient);
  const allowed = new Set<ProfileRole>(GF1_ALLOWED_ROLES);
  // GF1 role gates: adjust allowed roles here if profiles.role expands beyond sales.
  if (!session.role || !allowed.has(session.role)) {
    redirect(FORBIDDEN_REDIRECT);
  }
  return session;
}

export async function requireGf1Access(existingClient?: SupabaseServerClient) {
  const session = await requireAuth(existingClient);
  if (!hasGf1Access(session.role)) {
    redirect(FORBIDDEN_REDIRECT);
  }
  return session;
}

export async function requireSalesManager(existingClient?: SupabaseServerClient) {
  const session = await requireAuth(existingClient);
  const allowed = new Set<ProfileRole>(['sales_manager', 'admin']);
  if (!session.role || !allowed.has(session.role)) {
    redirect(FORBIDDEN_REDIRECT);
  }
  return session;
}

export async function requireImplementationUser(existingClient?: SupabaseServerClient) {
  const session = await requireAuth(existingClient);
  const allowed = new Set<ProfileRole>(['implementations', 'admin']);
  if (!session.role || !allowed.has(session.role)) {
    redirect(FORBIDDEN_REDIRECT);
  }
  return session;
}
