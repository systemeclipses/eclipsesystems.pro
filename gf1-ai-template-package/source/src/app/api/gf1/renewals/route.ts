import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { supaServer } from '@/lib/supabase/server';
import { supaAdmin } from '@/lib/supabase/admin';
import { resolveProfileRole } from '@/lib/gf1/auth';
import type { Gf1RenewalItem, ProfileRole } from '@/lib/gf1/types';

const allowedRoles = new Set<ProfileRole>(['admin', 'sales', 'sales_manager']);

async function requireGf1User() {
  const supabase = await supaServer();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return { user: null, role: null };
  const role = await resolveProfileRole(user);
  return { user, role };
}

export async function GET() {
  const { user, role } = await requireGf1User();
  if (!user) return NextResponse.json({ renewals: [] }, { status: 401 });
  if (!role || !allowedRoles.has(role)) {
    return NextResponse.json({ renewals: [] }, { status: 403 });
  }

  const admin = supaAdmin();
  let { data, error } = await admin
    .from('gf1_renewals')
    .select('id, company_name, renewal_due_date, is_completed, salesperson_name, created_by, completed_at, created_at, updated_at')
    .order('renewal_due_date', { ascending: true })
    .order('company_name', { ascending: true });

  if (error && typeof error.message === 'string' && error.message.toLowerCase().includes('salesperson_name')) {
    const fallback = await admin
      .from('gf1_renewals')
      .select('id, company_name, renewal_due_date, is_completed, created_by, completed_at, created_at, updated_at')
      .order('renewal_due_date', { ascending: true })
      .order('company_name', { ascending: true });
    data = fallback.data;
    error = fallback.error;
  }

  if (error) {
    console.error('[renewals] Failed to load renewals', error);
    return NextResponse.json({ renewals: [] }, { status: 500 });
  }

  const renewals = (data ?? []) as Gf1RenewalItem[];
  const createdByIds = Array.from(
    new Set(renewals.map((row) => row.created_by).filter((id): id is string => Boolean(id)))
  );

  let nameByUserId: Record<string, string> = {};
  if (createdByIds.length) {
    const { data: profileRows, error: profilesError } = await admin
      .from('profiles')
      .select('user_id, name')
      .in('user_id', createdByIds);
    if (profilesError) {
      console.error('[renewals] Failed to load salesperson names', profilesError);
    } else {
      nameByUserId = Object.fromEntries(
        (profileRows ?? [])
          .filter((row): row is { user_id: string; name: string | null } => Boolean(row?.user_id))
          .map((row) => [row.user_id, row.name?.trim() || 'Unknown'])
      );
    }
  }

  const rowsWithSalesperson = renewals.map((row) => {
    const manualSalesperson = row.salesperson_name?.trim();
    return {
      ...row,
      salesperson_name: manualSalesperson || (row.created_by ? nameByUserId[row.created_by] ?? 'Unknown' : 'Unknown'),
    };
  });

  return NextResponse.json({ renewals: rowsWithSalesperson });
}

export async function POST(request: Request) {
  const { user, role } = await requireGf1User();
  if (!user) return NextResponse.json({ ok: false, message: 'unauthenticated' }, { status: 401 });
  if (!role || !allowedRoles.has(role)) {
    return NextResponse.json({ ok: false, message: 'unauthorized' }, { status: 403 });
  }

  const payload = await request.json().catch(() => null);
  const companyName = typeof payload?.company_name === 'string' ? payload.company_name.trim() : '';
  const renewalDueDate = typeof payload?.renewal_due_date === 'string' ? payload.renewal_due_date.trim() : '';
  const salespersonName = typeof payload?.salesperson_name === 'string' ? payload.salesperson_name.trim() : '';

  if (!companyName || !renewalDueDate || !salespersonName) {
    return NextResponse.json({ ok: false, message: 'Missing required fields' }, { status: 400 });
  }

  const admin = supaAdmin();
  const { error } = await admin.from('gf1_renewals').insert({
    id: crypto.randomUUID(),
    company_name: companyName,
    renewal_due_date: renewalDueDate,
    salesperson_name: salespersonName,
    is_completed: false,
    created_by: user.id,
  });

  if (error) {
    console.error('[renewals] Failed to create renewal', error);
    return NextResponse.json({ ok: false, message: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}

export async function PATCH(request: Request) {
  const { user, role } = await requireGf1User();
  if (!user) return NextResponse.json({ ok: false, message: 'unauthenticated' }, { status: 401 });
  if (!role || !allowedRoles.has(role)) {
    return NextResponse.json({ ok: false, message: 'unauthorized' }, { status: 403 });
  }

  const payload = await request.json().catch(() => null);
  const id = typeof payload?.id === 'string' ? payload.id.trim() : '';
  if (!id) {
    return NextResponse.json({ ok: false, message: 'Missing renewal id' }, { status: 400 });
  }

  const updates: Record<string, unknown> = {};
  if (typeof payload?.company_name === 'string') {
    const companyName = payload.company_name.trim();
    if (companyName) updates.company_name = companyName;
  }
  if (typeof payload?.renewal_due_date === 'string') {
    const renewalDueDate = payload.renewal_due_date.trim();
    if (renewalDueDate) updates.renewal_due_date = renewalDueDate;
  }
  if (typeof payload?.salesperson_name === 'string') {
    const salespersonName = payload.salesperson_name.trim();
    if (salespersonName) updates.salesperson_name = salespersonName;
  }
  if (typeof payload?.is_completed === 'boolean') {
    updates.is_completed = payload.is_completed;
    updates.completed_at = payload.is_completed ? new Date().toISOString() : null;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ ok: false, message: 'No updates provided' }, { status: 400 });
  }

  const admin = supaAdmin();
  const { error } = await admin.from('gf1_renewals').update(updates).eq('id', id);
  if (error) {
    console.error('[renewals] Failed to update renewal', error);
    return NextResponse.json({ ok: false, message: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
