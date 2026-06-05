import { NextResponse } from 'next/server';
import { supaServer } from '@/lib/supabase/server';
import { deriveFollowUpType, normalizeContactChannel } from '@/lib/gf1/opportunity-follow-ups';

type ContactPayload = {
  opportunityId?: string;
  channel?: string | null;
  followUpType?: string | null;
  notes?: string | null;
  followUpAt?: string | null;
  gotResponse?: boolean | null;
  responseNotes?: string | null;
};

export async function POST(req: Request) {
  const supabase = await supaServer();
  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError || !auth?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let payload: ContactPayload = {};
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
  }

  const opportunityId = payload.opportunityId?.trim();
  if (!opportunityId) {
    return NextResponse.json({ error: 'Missing opportunityId' }, { status: 400 });
  }

  const channel = normalizeContactChannel(payload.channel);
  const followUpAt = typeof payload.followUpAt === 'string' && payload.followUpAt.trim() ? payload.followUpAt : null;
  const followUpType = deriveFollowUpType({
    followUpType: payload.followUpType,
    channel,
    hasFollowUpAt: Boolean(followUpAt),
  });

  const insertPayload = {
    opportunity_id: opportunityId,
    contacted_by: auth.user.id,
    channel,
    notes: payload.notes?.trim() || null,
    follow_up_at: followUpAt,
    follow_up_type: followUpType,
    got_response: Boolean(payload.gotResponse),
    response_notes: payload.responseNotes?.trim() || null,
  };

  const { error: insertError } = await supabase.from('opportunity_contact_logs').insert(insertPayload);

  if (insertError) {
    const insertMessage = insertError.message?.toLowerCase() ?? '';
    if (insertMessage.includes('follow_up_type')) {
      return NextResponse.json(
        { error: 'Database is missing the follow-up type column. Run the latest Supabase migration.' },
        { status: 400 },
      );
    }
    return NextResponse.json({ error: insertError.message }, { status: 400 });
  }

  // Keep lead-level fields in sync for existing views/queries.
  const baseUpdatePayload: Record<string, unknown> = {
    last_contacted_at: new Date().toISOString(),
    last_contacted_by: auth.user.id,
  };
  if (Boolean(payload.gotResponse)) {
    // Hard claim when contact reports a response.
    baseUpdatePayload.claimed_by = auth.user.id;
  }

  const { error: leadUpdateError } = await supabase
    .from('opportunity_leads')
    .update(baseUpdatePayload)
    .eq('id', opportunityId);

  if (leadUpdateError && Boolean(payload.gotResponse)) {
    const message = leadUpdateError.message?.toLowerCase() ?? '';
    if (message.includes('claimed_by')) {
      await supabase
        .from('opportunity_leads')
        .update({
          last_contacted_at: new Date().toISOString(),
          last_contacted_by: auth.user.id,
        })
        .eq('id', opportunityId);
    }
  }

  return NextResponse.json({ ok: true });
}
