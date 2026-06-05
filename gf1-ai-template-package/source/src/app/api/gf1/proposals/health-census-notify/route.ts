import { NextResponse } from 'next/server';
import { z } from 'zod';
import path from 'path';
import { promises as fs } from 'fs';
import { supaServer } from '@/lib/supabase/server';
import { hasGf1Access, resolveProfileEmail, resolveProfileName, resolveProfileRole } from '@/lib/gf1/auth';
import {
  sendHealthCensusBenefitsHeadsUpEmail,
  sendHealthCensusInterestEmail,
} from '@/lib/brevo';

const payloadSchema = z.object({
  prospectId: z.string().uuid('Invalid prospect ID'),
  organizationName: z.string().min(1, 'Organization name required'),
  prospectName: z.string().optional().nullable(),
});

const DEFAULT_ATTACHMENT_PATH = 'public/Galactic Health Insurance Census.xlsx';

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

    const recipientEmail = await resolveProfileEmail(user);
    if (!recipientEmail) {
      return NextResponse.json({ error: 'Recipient email not found' }, { status: 400 });
    }

    const recipientName = (await resolveProfileName(user)) ?? undefined;

    let attachment: { name: string; content: string } | undefined;
    const attachmentPath =
      process.env.HEALTH_CENSUS_ATTACHMENT_PATH || DEFAULT_ATTACHMENT_PATH;
    try {
      const absolutePath = path.resolve(process.cwd(), attachmentPath);
      const fileBuffer = await fs.readFile(absolutePath);
      attachment = {
        name: path.basename(absolutePath),
        content: fileBuffer.toString('base64'),
      };
    } catch (err) {
      console.warn('[health-census-notify] Attachment not found', err);
    }

    await sendHealthCensusInterestEmail({
      to: recipientEmail,
      cc: ['john@galactic-inc.com'],
      recipientName,
      organizationName: validated.organizationName,
      prospectName: validated.prospectName ?? null,
      attachment,
    });

    try {
      await sendHealthCensusBenefitsHeadsUpEmail({
        to: 'benefits@galactic-inc.com',
        salespersonName: recipientName ?? 'A Galactic sales rep',
        organizationName: validated.organizationName,
      });
    } catch (err) {
      console.warn('[health-census-notify] benefits team heads-up failed', err);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to send health census notification';
    console.error('[health-census-notify] error', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
