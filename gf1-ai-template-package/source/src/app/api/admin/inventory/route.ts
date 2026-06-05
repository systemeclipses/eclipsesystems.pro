import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { supaServer } from '@/lib/supabase/server';
import { supaAdmin } from '@/lib/supabase/admin';
import { resolveProfileRole } from '@/lib/gf1/auth';
import type { InventoryCategory, InventoryItem, InventoryStatus } from '@/lib/gf1/types';

const allowedRoles = new Set(['admin']);

type InventoryLocationType = 'home' | 'office' | null;

export async function GET() {
  const supabase = await supaServer();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    return NextResponse.json({ items: [] }, { status: 401 });
  }

  const role = await resolveProfileRole(user);
  if (!role || !allowedRoles.has(role)) {
    return NextResponse.json({ items: [] }, { status: 403 });
  }

  const admin = supaAdmin();
  const { data, error: fetchError } = await admin
    .from('gf1_inventory_items')
    .select('id, name, category, status, purchase_date, icon, description, location, department, owner, notes, assigned_to, location_type')
    .order('category', { ascending: true })
    .order('name', { ascending: true });

  if (fetchError) {
    console.error('[inventory] Failed to load inventory items', fetchError);
    return NextResponse.json({ items: [] }, { status: 500 });
  }

  return NextResponse.json({ items: (data ?? []) as InventoryItem[] });
}

export async function POST(request: Request) {
  const supabase = await supaServer();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    return NextResponse.json({ ok: false, message: 'unauthenticated' }, { status: 401 });
  }

  const role = await resolveProfileRole(user);
  if (!role || !allowedRoles.has(role)) {
    return NextResponse.json({ ok: false, message: 'unauthorized' }, { status: 403 });
  }

  const payload = await request.json().catch(() => null);
  const name = typeof payload?.name === 'string' ? payload.name.trim() : '';
  const category = payload?.category as InventoryCategory | undefined;
  const status = payload?.status as InventoryStatus | undefined;

  if (!name || !category || !status) {
    return NextResponse.json({ ok: false, message: 'Missing required fields' }, { status: 400 });
  }

  const notes = Array.isArray(payload?.notes) ? payload.notes.filter(Boolean) : [];
  const assignedTo = typeof payload?.assigned_to === 'string' ? payload.assigned_to.trim() : null;
  const locationType = (payload?.location_type ?? null) as InventoryLocationType;
  const purchaseDate = typeof payload?.purchase_date === 'string' ? payload.purchase_date.trim() : null;

  const admin = supaAdmin();
  const { error: insertError } = await admin.from('gf1_inventory_items').insert({
    id: payload?.id ?? crypto.randomUUID(),
    name,
    category,
    status,
    purchase_date: purchaseDate || null,
    icon: typeof payload?.icon === 'string' ? payload.icon.trim() : null,
    description: typeof payload?.description === 'string' ? payload.description.trim() : null,
    location: typeof payload?.location === 'string' ? payload.location.trim() : null,
    department: typeof payload?.department === 'string' ? payload.department.trim() : null,
    owner: typeof payload?.owner === 'string' ? payload.owner.trim() : null,
    notes,
    assigned_to: assignedTo || null,
    location_type: locationType,
    created_by: user.id,
  });

  if (insertError) {
    console.error('[inventory] Failed to insert inventory item', insertError);
    return NextResponse.json({ ok: false, message: insertError.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}

export async function PATCH(request: Request) {
  const supabase = await supaServer();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    return NextResponse.json({ ok: false, message: 'unauthenticated' }, { status: 401 });
  }

  const role = await resolveProfileRole(user);
  if (!role || !allowedRoles.has(role)) {
    return NextResponse.json({ ok: false, message: 'unauthorized' }, { status: 403 });
  }

  const payload = await request.json().catch(() => null);
  const id = typeof payload?.id === 'string' ? payload.id.trim() : '';
  if (!id) {
    return NextResponse.json({ ok: false, message: 'Missing item id' }, { status: 400 });
  }

  const updates: Record<string, unknown> = {};
  if (typeof payload?.assigned_to === 'string' || payload?.assigned_to === null) {
    const nextAssigned = typeof payload.assigned_to === 'string' ? payload.assigned_to.trim() : null;
    updates.assigned_to = nextAssigned || null;
  }
  if (typeof payload?.purchase_date === 'string' || payload?.purchase_date === null) {
    const nextDate = typeof payload.purchase_date === 'string' ? payload.purchase_date.trim() : null;
    updates.purchase_date = nextDate || null;
  }
  if (typeof payload?.owner === 'string' || payload?.owner === null) {
    const nextOwner = typeof payload.owner === 'string' ? payload.owner.trim() : null;
    updates.owner = nextOwner || null;
  }
  if (typeof payload?.location_type === 'string' || payload?.location_type === null) {
    updates.location_type = payload.location_type ?? null;
  }
  if (typeof payload?.status === 'string') {
    updates.status = payload.status;
  }
  if (typeof payload?.name === 'string') {
    const nextName = payload.name.trim();
    if (nextName) {
      updates.name = nextName;
    }
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ ok: false, message: 'No updates provided' }, { status: 400 });
  }

  const admin = supaAdmin();
  const { error: updateError } = await admin
    .from('gf1_inventory_items')
    .update(updates)
    .eq('id', id);

  if (updateError) {
    console.error('[inventory] Failed to update inventory item', updateError);
    return NextResponse.json({ ok: false, message: updateError.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const supabase = await supaServer();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    return NextResponse.json({ ok: false, message: 'unauthenticated' }, { status: 401 });
  }

  const role = await resolveProfileRole(user);
  if (!role || !allowedRoles.has(role)) {
    return NextResponse.json({ ok: false, message: 'unauthorized' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id')?.trim();
  if (!id) {
    return NextResponse.json({ ok: false, message: 'Missing item id' }, { status: 400 });
  }

  const admin = supaAdmin();
  const { error: deleteError } = await admin.from('gf1_inventory_items').delete().eq('id', id);
  if (deleteError) {
    console.error('[inventory] Failed to delete inventory item', deleteError);
    return NextResponse.json({ ok: false, message: deleteError.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
