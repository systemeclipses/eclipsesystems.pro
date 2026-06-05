import { NextResponse } from 'next/server';
import { supaServer } from '@/lib/supabase/server';

type NotesPayload = {
  opportunityId?: string;
  notes?: string | null;
};

export async function POST(req: Request) {
  const supabase = await supaServer();
  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError || !auth?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let payload: NotesPayload = {};
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
  }

  const opportunityId = payload.opportunityId?.trim();
  if (!opportunityId) {
    return NextResponse.json({ error: 'Missing opportunityId' }, { status: 400 });
  }

  const { error } = await supabase
    .from('opportunity_leads')
    .update({ notes: payload.notes?.trim() || null })
    .eq('id', opportunityId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
