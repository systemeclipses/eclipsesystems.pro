import { NextResponse } from 'next/server';
import { z } from 'zod';
import { supaServer } from '@/lib/supabase/server';
import { hasGf1Access, resolveProfileRole } from '@/lib/gf1/auth';
import { sendRetirementInterestEmail } from '@/lib/brevo';

const payloadSchema = z.object({
  prospectId: z.string().uuid('Invalid prospect ID'),
  organizationName: z.string().min(1, 'Organization name required'),
  prospectName: z.string().optional().nullable(),
});

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const validated = payloadSchema.parse(payload);

    const supabase = await supaServer();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const role = await resolveProfileRole(user);
    if (!hasGf1Access(role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await sendRetirementInterestEmail({
      to: 'vanessa@galactic-inc.com',
      cc: ['blan@galactic-inc.com'],
      organizationName: validated.organizationName,
      prospectName: validated.prospectName ?? null,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to send 401k notification';
    console.error('[retirement-401k-notify] error', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
