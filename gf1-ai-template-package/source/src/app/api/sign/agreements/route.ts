import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { supaAdmin } from '@/lib/supabase/admin';

function sha256(input: string) {
  return crypto.createHash('sha256').update(input).digest('hex');
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get('token');
  if (!token) {
    return NextResponse.json({ error: 'Missing token' }, { status: 400 });
  }

  const admin = supaAdmin();
  const tokenHash = sha256(token);

  const { data: requestRow, error } = await admin
    .from('agreement_signing_requests')
    .select('id, organization_id, recipient_name, status, expires_at, form_json, provider_signatory_name, provider_signatory_title, signed_pdf_path')
    .eq('token_hash', tokenHash)
    .maybeSingle();

  if (error || !requestRow) {
    return NextResponse.json({ error: 'Signing request not found' }, { status: 404 });
  }

  const now = new Date();
  const expiresAt = new Date(requestRow.expires_at);
  const isExpired = expiresAt.getTime() < now.getTime();

  const { data: org } = await admin
    .from('organizations')
    .select('legal_name, trade_name, name')
    .eq('id', requestRow.organization_id)
    .maybeSingle();

  const organizationName = org?.legal_name || org?.trade_name || org?.name || 'organization';

  return NextResponse.json({
    requestId: requestRow.id,
    organizationName,
    recipientName: requestRow.recipient_name,
    status: isExpired ? 'expired' : requestRow.status,
    expiresAt: requestRow.expires_at,
    formJson: requestRow.form_json,
    providerSignatoryName: requestRow.provider_signatory_name,
    providerSignatoryTitle: requestRow.provider_signatory_title,
    signedPdfPath: requestRow.signed_pdf_path,
  });
}
