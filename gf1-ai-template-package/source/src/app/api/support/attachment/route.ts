import { NextResponse } from 'next/server';
import { supaAdmin } from '@/lib/supabase/admin';

const SUPPORT_BUCKET = 'support-attachments';

function sanitizeFileName(value: string) {
  return value.replace(/[/\\?%*:|"<>]/g, '_');
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const path = searchParams.get('path')?.trim();
  if (!path) {
    return NextResponse.json({ error: 'Missing path' }, { status: 400 });
  }
  if (path.startsWith('/') || path.includes('..')) {
    return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
  }

  const admin = supaAdmin();
  const { data, error } = await admin.storage.from(SUPPORT_BUCKET).download(path);
  if (error || !data) {
    return NextResponse.json({ error: 'Attachment not found' }, { status: 404 });
  }

  const fallbackName = path.split('/').filter(Boolean).slice(-1)[0] ?? 'attachment';
  const fileName = sanitizeFileName(searchParams.get('name') ?? fallbackName);
  const headers = new Headers();
  headers.set('Content-Type', data.type || 'application/octet-stream');
  headers.set('Content-Disposition', `attachment; filename="${fileName}"`);
  headers.set('Cache-Control', 'no-store');

  return new Response(data.stream(), { status: 200, headers });
}
