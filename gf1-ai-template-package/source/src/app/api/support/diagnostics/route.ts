import { NextResponse } from 'next/server';
import { env } from '@/lib/env';
import { supaServer } from '@/lib/supabase/server';
import { supaAdmin } from '@/lib/supabase/admin';

const SUPPORT_BUCKET = 'support-attachments';

type SupportTicketRow = {
  id: string;
  created_at: string;
  attachment_url: string | null;
  attachment_urls: string[] | null;
};

function normalizeHost(value: string) {
  try {
    return new URL(value).host;
  } catch {
    return null;
  }
}

export async function GET() {
  try {
    const supabase = await supaServer();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle();

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    const admin = supaAdmin();
    const runtimeHost = normalizeHost(env.supabaseUrl);

    const { data: bucket, error: bucketError } = await admin.storage.getBucket(SUPPORT_BUCKET);

    const probePath = `__support_probe__/missing-${Date.now()}.txt`;
    const probeUrl = admin.storage.from(SUPPORT_BUCKET).getPublicUrl(probePath).data.publicUrl;
    let probeStatus: number | null = null;
    let probeBody: string | null = null;

    try {
      const probeRes = await fetch(probeUrl, { method: 'GET', cache: 'no-store' });
      probeStatus = probeRes.status;
      probeBody = (await probeRes.text()).slice(0, 200);
    } catch (error) {
      probeBody = error instanceof Error ? error.message : 'Probe request failed';
    }

    const { data: recentRows, error: recentError } = await admin
      .from('support_tickets')
      .select('id, created_at, attachment_url, attachment_urls')
      .order('created_at', { ascending: false })
      .limit(15);

    const recentTickets = (recentRows ?? []) as SupportTicketRow[];
    const attachmentSamples = recentTickets
      .flatMap((row) => {
        const urls =
          row.attachment_urls && row.attachment_urls.length > 0
            ? row.attachment_urls
            : row.attachment_url
              ? [row.attachment_url]
              : [];
        return urls.map((url) => {
          const attachmentHost = normalizeHost(url);
          return {
            ticket_id: row.id,
            created_at: row.created_at,
            url,
            host: attachmentHost,
            matches_runtime_project: Boolean(runtimeHost && attachmentHost === runtimeHost),
          };
        });
      })
      .slice(0, 20);

    return NextResponse.json(
      {
        ok: true,
        checked_at: new Date().toISOString(),
        runtime: {
          supabase_url: env.supabaseUrl,
          host: runtimeHost,
        },
        bucket: {
          name: SUPPORT_BUCKET,
          exists: Boolean(bucket),
          public: bucket?.public ?? null,
          error: bucketError?.message ?? null,
        },
        probe: {
          url: probeUrl,
          status: probeStatus,
          body_preview: probeBody,
        },
        attachments: {
          sample_count: attachmentSamples.length,
          query_error: recentError?.message ?? null,
          samples: attachmentSamples,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
