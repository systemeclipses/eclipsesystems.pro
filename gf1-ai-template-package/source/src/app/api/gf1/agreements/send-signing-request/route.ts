import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { supaServer } from '@/lib/supabase/server';
import { supaAdmin } from '@/lib/supabase/admin';
import { sendAgreementSignatureRequestEmail } from '@/lib/brevo';

function sha256(input: string) {
  return crypto.createHash('sha256').update(input).digest('hex');
}

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'agreement';
}

function buildFriendlyPathSlug(name: string, requestId?: string | null) {
  const base = slugify(name);
  const code = (requestId ?? '').replace(/-/g, '').slice(0, 6).toLowerCase();
  return code ? `${base}-${code}` : base;
}

export async function POST(request: Request) {
  try {
    const supabase = await supaServer();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const organizationId = body?.organizationId as string | undefined;
    const recipientName = body?.recipientName as string | undefined;
    const recipientEmail = body?.recipientEmail as string | undefined;
    const formJson = body?.formJson;

    if (!organizationId || !recipientName || !recipientEmail || !formJson) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const admin = supaAdmin();
    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = sha256(token);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    const { data: org } = await admin
      .from('organizations')
      .select('legal_name, dba_name, trade_name, name')
      .eq('id', organizationId)
      .maybeSingle();
    const organizationName =
      formJson?.legalName ||
      formJson?.dbaName ||
      org?.legal_name ||
      org?.dba_name ||
      org?.trade_name ||
      org?.name ||
      'organization';

    const { data: created, error: insertError } = await admin
      .from('agreement_signing_requests')
      .insert({
        organization_id: organizationId,
        form_json: formJson,
        recipient_name: recipientName,
        recipient_email: recipientEmail,
        token_hash: tokenHash,
        expires_at: expiresAt,
        created_by: user.id,
      })
      .select('id')
      .maybeSingle();

    if (insertError) {
      console.error(insertError);
      return NextResponse.json({ error: 'Unable to create signing request' }, { status: 500 });
    }

    const origin = request.headers.get('origin');
    const forwardedHost = request.headers.get('x-forwarded-host');
    const forwardedProto = request.headers.get('x-forwarded-proto') ?? 'https';
    const host = forwardedHost ?? request.headers.get('host');
    const baseUrl =
      origin ||
      (host ? `${forwardedProto}://${host}` : null) ||
      process.env.NEXT_PUBLIC_BASE_URL ||
      process.env.NEXT_PUBLIC_APP_URL ||
      'https://galactic365.com';
    const cleanBase = baseUrl.replace(/\/$/, '');
    const slug = buildFriendlyPathSlug(organizationName, created?.id ?? null);
    const signingUrl = `${cleanBase}/sign/agreements/${slug}?token=${token}`;

    await sendAgreementSignatureRequestEmail({
      to: recipientEmail,
      recipientName,
      organizationName,
      signingUrl,
      senderName: 'Galactic Employer Services',
    });

    return NextResponse.json({
      ok: true,
      signingUrl,
      requestId: created?.id ?? null,
      expiresAt,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
