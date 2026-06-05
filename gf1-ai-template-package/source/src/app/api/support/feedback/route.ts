import { NextResponse } from 'next/server';
import { supaServer } from '@/lib/supabase/server';
import { supaAdmin } from '@/lib/supabase/admin';

export async function POST(req: Request) {
  try {
    const { ticket_id, rating, comments } = await req.json();
    if (!ticket_id || rating === undefined || rating === null) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    const ratingValue = Number(rating);
    if (!Number.isInteger(ratingValue) || ratingValue < 1 || ratingValue > 5) {
      return NextResponse.json({ error: 'Rating must be an integer from 1 to 5.' }, { status: 400 });
    }

    const supabase = await supaServer();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Please sign in to submit feedback.' }, { status: 401 });
    }

    const { data: ticket, error: ticketError } = await supabase
      .from('support_tickets')
      .select('id, created_by, requester_email, status')
      .eq('id', ticket_id)
      .maybeSingle();

    if (ticketError || !ticket) {
      return NextResponse.json({ error: 'Ticket not found.' }, { status: 404 });
    }

    const isOwner = ticket.created_by === user.id;
    const isRequesterEmailMatch =
      Boolean(ticket.requester_email) && Boolean(user.email) && ticket.requester_email === user.email;

    if (!isOwner && !isRequesterEmailMatch) {
      return NextResponse.json({ error: 'Not authorized for this ticket.' }, { status: 403 });
    }

    if ((ticket.status ?? '').toLowerCase() !== 'closed') {
      return NextResponse.json(
        { error: 'Feedback can only be submitted for closed tickets.' },
        { status: 400 }
      );
    }

    const admin = supaAdmin();
    const { data, error } = await admin
      .from('support_feedback')
      .upsert(
        {
          ticket_id,
          created_by: user.id,
          rating: ratingValue,
          comments: typeof comments === 'string' && comments.trim() ? comments.trim() : null,
        },
        { onConflict: 'ticket_id,created_by' }
      )
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, feedback: data }, { status: 200 });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
