import { NextResponse } from 'next/server';
import { supaServer } from '@/lib/supabase/server';
import { supaAdmin } from '@/lib/supabase/admin';
import { resolveProfileRole } from '@/lib/gf1/auth';

const allowedRoles = new Set(['admin']);

export async function GET() {
  const supabase = await supaServer();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    return NextResponse.json({ users: [] }, { status: 401 });
  }

  const role = await resolveProfileRole(user);
  if (!role || !allowedRoles.has(role)) {
    return NextResponse.json({ users: [] }, { status: 403 });
  }

  const admin = supaAdmin();
  const { data, error: fetchError } = await admin
    .from('profiles')
    .select('user_id, name, full_name, email, role')
    .order('name', { ascending: true, nullsFirst: false });

  if (fetchError) {
    console.error('[inventory-users] Failed to load profiles', fetchError);
    return NextResponse.json({ users: [] }, { status: 500 });
  }

  return NextResponse.json({ users: data ?? [] });
}
