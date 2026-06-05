import { NextResponse } from 'next/server';
import { resolveProfileName, resolveProfileRole } from '@/lib/gf1/auth';
import { supaAdmin } from '@/lib/supabase/admin';
import { supaServer } from '@/lib/supabase/server';
import { GF1_IMPLEMENTATION_STEPS } from '@/lib/gf1/implementation';
import type { ProfileRole } from '@/lib/gf1/types';

const VALID_STEP_KEYS = new Set(GF1_IMPLEMENTATION_STEPS.map((step) => step.key));
const allowedRoles = new Set<ProfileRole>(['implementations', 'admin']);

export async function PATCH(request: Request) {
  const supabase = await supaServer();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ ok: false, message: 'Unauthenticated.' }, { status: 401 });
  }

  const role = await resolveProfileRole(user);
  if (!role || !allowedRoles.has(role)) {
    return NextResponse.json({ ok: false, message: 'Unauthorized.' }, { status: 403 });
  }

  const admin = supaAdmin();
  const payload = await request.json().catch(() => null);
  const action = typeof payload?.action === 'string' ? payload.action.trim() : '';
  const organizationId = typeof payload?.organizationId === 'string' ? payload.organizationId.trim() : '';

  if (!organizationId || !action) {
    return NextResponse.json({ ok: false, message: 'Missing organization id or action.' }, { status: 400 });
  }

  if (action === 'claim') {
    const profileName = (await resolveProfileName(user)) ?? user.email ?? 'Unassigned';
    const { error } = await admin
      .from('organizations')
      .update({
        implementation_owner_id: user.id,
        implementation_owner_name: profileName,
      })
      .eq('id', organizationId)
      .eq('status', 'client');

    if (error) {
      const message = error.message?.toLowerCase() ?? '';
      if (message.includes('implementation_owner')) {
        return NextResponse.json(
          { ok: false, message: 'Implementation tracking columns are missing. Run the latest GF1 implementation migration.' },
          { status: 400 }
        );
      }
      return NextResponse.json({ ok: false, message: error.message }, { status: 400 });
    }

    return NextResponse.json({
      ok: true,
      organizationId,
      implementation_owner_id: user.id,
      implementation_owner_name: profileName,
    });
  }

  if (action === 'toggle-step') {
    const stepKey = typeof payload?.stepKey === 'string' ? payload.stepKey.trim() : '';
    const isCompleted = typeof payload?.isCompleted === 'boolean' ? payload.isCompleted : null;
    const goLiveDateRaw = typeof payload?.goLiveDate === 'string' ? payload.goLiveDate.trim() : '';
    const goLiveDate = /^\d{4}-\d{2}-\d{2}$/.test(goLiveDateRaw) ? goLiveDateRaw : '';

    if (!stepKey || !VALID_STEP_KEYS.has(stepKey) || isCompleted === null) {
      return NextResponse.json({ ok: false, message: 'Invalid step update payload.' }, { status: 400 });
    }

    if (stepKey === 'go_live_and_support' && isCompleted && !goLiveDate) {
      return NextResponse.json(
        { ok: false, message: 'Go-live date is required to complete this step.' },
        { status: 400 }
      );
    }

    if (role !== 'admin') {
      const { data: organization, error: orgError } = await admin
        .from('organizations')
        .select('status, implementation_owner_id')
        .eq('id', organizationId)
        .maybeSingle();

      if (orgError) {
        const message = orgError.message?.toLowerCase() ?? '';
        if (message.includes('implementation_owner')) {
          return NextResponse.json(
            { ok: false, message: 'Implementation tracking columns are missing. Run the latest GF1 implementation migration.' },
            { status: 400 }
          );
        }
        return NextResponse.json({ ok: false, message: orgError.message }, { status: 400 });
      }

      if (!organization || organization.status !== 'client') {
        return NextResponse.json({ ok: false, message: 'Organization is not in client stage.' }, { status: 400 });
      }

      if (organization.implementation_owner_id !== user.id) {
        return NextResponse.json(
          { ok: false, message: 'Claim this client before updating implementation steps.' },
          { status: 403 }
        );
      }
    }

    if (stepKey === 'go_live_and_support') {
      const newGoLiveDate = isCompleted ? goLiveDate : null;
      const { error: orgUpdateError } = await admin
        .from('organizations')
        .update({ go_live_date: newGoLiveDate })
        .eq('id', organizationId);

      if (orgUpdateError) {
        const msg = orgUpdateError.message?.toLowerCase() ?? '';
        if (msg.includes('go_live_date')) {
          return NextResponse.json(
            { ok: false, message: 'Go-live date column is missing. Run the latest GF1 implementation migration.' },
            { status: 400 }
          );
        }
        return NextResponse.json({ ok: false, message: orgUpdateError.message }, { status: 400 });
      }
    }

    const completedAt = isCompleted ? new Date().toISOString() : null;
    const { error } = await admin.from('gf1_client_implementation_steps').upsert({
      organization_id: organizationId,
      step_key: stepKey,
      completed_at: completedAt,
      completed_by: isCompleted ? user.id : null,
    });

    if (error) {
      const message = error.message?.toLowerCase() ?? '';
      if (message.includes('gf1_client_implementation_steps')) {
        return NextResponse.json(
          { ok: false, message: 'Implementation checklist table is missing. Run the latest GF1 implementation migration.' },
          { status: 400 }
        );
      }
      return NextResponse.json({ ok: false, message: error.message }, { status: 400 });
    }

    return NextResponse.json({
      ok: true,
      organizationId,
      stepKey,
      completed_at: completedAt,
      completed_by: isCompleted ? user.id : null,
      goLiveDate: stepKey === 'go_live_and_support' ? (isCompleted ? goLiveDate : null) : undefined,
    });
  }

  return NextResponse.json({ ok: false, message: 'Unknown action.' }, { status: 400 });
}
