import { NextResponse } from 'next/server';
import { Buffer } from 'node:buffer';
import { requireSalesUser, resolveProfileName } from '@/lib/gf1/auth';
import { supaAdmin } from '@/lib/supabase/admin';
import { LOGO_BUCKET, buildAccessibleLogoUrl } from '@/lib/gf1/logos';
import { revalidatePath } from 'next/cache';

function bufferFromFile(file: File) {
  return file.arrayBuffer().then((arrayBuffer) => Buffer.from(arrayBuffer));
}

function safeExtension(name: string) {
  const ext = name.split('.').pop();
  if (!ext) return 'png';
  return ext.toLowerCase();
}

export async function POST(request: Request) {
  const { user, role, supabase } = await requireSalesUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const formData = await request.formData();
  const organizationId = String(formData.get('organizationId') ?? '').trim();
  const file = formData.get('file');

  if (!organizationId) {
    return NextResponse.json({ error: 'Missing organization ID' }, { status: 400 });
  }
  if (!(file instanceof File) || !file.size) {
    return NextResponse.json({ error: 'Missing file upload' }, { status: 400 });
  }
  if (role === 'sales') {
    const salesRepName = await resolveProfileName(user);
    const salesRepFilter = salesRepName ?? '__no_access__';
    const { data: org } = await supabase
      .from('organizations')
      .select('sales_rep_name')
      .eq('id', organizationId)
      .maybeSingle();
    if (org?.sales_rep_name !== salesRepFilter) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
  }

  const admin = supaAdmin();
  const extension = safeExtension(file.name);
  const filePath = `organizations/${organizationId}/logo.${extension}`;

  try {
    const buffer = await bufferFromFile(file);
    const uploadResult = await admin.storage.from(LOGO_BUCKET).upload(filePath, buffer, {
      upsert: true,
      contentType: file.type || 'application/octet-stream',
      cacheControl: '3600',
    });

    if (uploadResult.error) {
      console.error('Logo upload failed', uploadResult.error);
      return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
    }

    const publicUrl = await buildAccessibleLogoUrl(admin, filePath);
    if (!publicUrl) {
      return NextResponse.json({ error: 'Unable to resolve logo URL' }, { status: 500 });
    }

    const { error: updateError } = await admin.from('organizations').update({ logo_url: publicUrl }).eq('id', organizationId);
    if (updateError) {
      console.error('Failed to update organization logo URL', updateError);
      return NextResponse.json({ error: 'Failed to update organization record' }, { status: 500 });
    }

    revalidatePath(`/gf1/organizations/${organizationId}`);
    revalidatePath('/gf1/organizations');
    revalidatePath('/gf1/pipeline');

    return NextResponse.json({ success: true, logoUrl: publicUrl });
  } catch (error) {
    console.error('Unexpected logo upload error', error);
    return NextResponse.json({ error: 'Unexpected error' }, { status: 500 });
  }
}
