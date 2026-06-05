import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { supaAdmin } from '@/lib/supabase/admin';

function sha256(input: string) {
  return crypto.createHash('sha256').update(input).digest('hex');
}

export async function GET(_request: Request, context: { params: Promise<{ token: string }> }) {
  const { token } = await context.params;
  if (!token) {
    return NextResponse.json({ error: 'Missing token' }, { status: 400 });
  }

  const admin = supaAdmin();
  const tokenHash = sha256(token);
  const { data: requestRow, error } = await admin
    .from('agreement_signing_requests')
    .select('signed_pdf_path')
    .eq('token_hash', tokenHash)
    .maybeSingle();

  if (error || !requestRow?.signed_pdf_path) {
    return NextResponse.json({ error: 'Signed PDF not found' }, { status: 404 });
  }

  const download = await admin.storage
    .from('agreement-documents')
    .download(requestRow.signed_pdf_path);

  if (download.error || !download.data) {
    return NextResponse.json({ error: 'Unable to download PDF' }, { status: 500 });
  }

  const arrayBuffer = await download.data.arrayBuffer();
  return new NextResponse(arrayBuffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'inline; filename=\"signed-agreement.pdf\"',
    },
  });
}
