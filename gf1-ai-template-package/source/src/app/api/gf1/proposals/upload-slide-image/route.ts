import { NextResponse } from 'next/server';
import { Buffer } from 'node:buffer';
import { requireSalesUser } from '@/lib/gf1/auth';
import { supaAdmin } from '@/lib/supabase/admin';
import { LOGO_BUCKET, buildAccessibleLogoUrl } from '@/lib/gf1/logos';

const MAX_BYTES = 10 * 1024 * 1024;
const ALLOWED_EXT = new Set(['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg']);

function safeExtension(name: string): string {
  const ext = name.split('.').pop()?.toLowerCase() ?? '';
  return ALLOWED_EXT.has(ext) ? ext : 'png';
}

function randomToken(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export async function POST(request: Request) {
  const { user } = await requireSalesUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get('file');
  const proposalId = String(formData.get('proposalId') ?? '').trim() || 'shared';

  if (!(file instanceof File) || !file.size) {
    return NextResponse.json({ error: 'Missing file' }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: 'File exceeds 10MB' }, { status: 413 });
  }

  const admin = supaAdmin();
  const ext = safeExtension(file.name);
  const filePath = `proposal-slides/${proposalId}/${randomToken()}.${ext}`;

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const upload = await admin.storage.from(LOGO_BUCKET).upload(filePath, buffer, {
      upsert: false,
      contentType: file.type || 'application/octet-stream',
      cacheControl: '3600',
    });
    if (upload.error) {
      console.error('Slide image upload failed', upload.error);
      return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
    }

    const url = await buildAccessibleLogoUrl(admin, filePath);
    if (!url) {
      return NextResponse.json({ error: 'Unable to resolve URL' }, { status: 500 });
    }
    return NextResponse.json({ url });
  } catch (error) {
    console.error('Unexpected slide image upload error', error);
    return NextResponse.json({ error: 'Unexpected error' }, { status: 500 });
  }
}
