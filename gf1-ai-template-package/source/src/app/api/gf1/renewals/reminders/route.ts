import { NextRequest, NextResponse } from 'next/server';
import { supaServer } from '@/lib/supabase/server';
import { supaAdmin } from '@/lib/supabase/admin';
import { resolveProfileRole } from '@/lib/gf1/auth';
import { parseAdminEmails } from '@/lib/auth';
import { sendGf1RenewalReminderEmail } from '@/lib/brevo';

const REMINDER_DAY_OFFSETS = new Set([30, 14, 7, 4, 3, 2, 1]);

type RenewalRow = {
  id: string;
  company_name: string;
  renewal_due_date: string;
  is_completed: boolean;
  created_by: string | null;
};

function parseBearerToken(header: string | null) {
  if (!header) return null;
  const [scheme, token] = header.split(' ');
  if (!scheme || !token) return null;
  if (scheme.toLowerCase() !== 'bearer') return null;
  return token;
}

function utcDayTimestamp(input: Date | string) {
  const date = input instanceof Date ? input : new Date(`${input}T00:00:00Z`);
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

function toIsoDateFromTimestamp(timestamp: number) {
  return new Date(timestamp).toISOString().slice(0, 10);
}

async function canRunManually() {
  const supabase = await supaServer();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return false;
  const role = await resolveProfileRole(user);
  return role === 'admin' || role === 'sales_manager';
}

export async function GET(request: NextRequest) {
  const expectedToken = process.env.CRON_SECRET ?? '';
  const providedToken = parseBearerToken(request.headers.get('authorization'));
  const isCronAuthorized = Boolean(expectedToken && providedToken === expectedToken);

  if (!isCronAuthorized) {
    const manualAllowed = await canRunManually();
    if (!manualAllowed) {
      return NextResponse.json({ ok: false, message: 'unauthorized' }, { status: 401 });
    }
  }

  const todayUtc = utcDayTimestamp(new Date());
  const maxDueDateTimestamp = todayUtc + 30 * 24 * 60 * 60 * 1000;
  const minDueDateIso = toIsoDateFromTimestamp(todayUtc);
  const maxDueDateIso = toIsoDateFromTimestamp(maxDueDateTimestamp);

  const admin = supaAdmin();
  const { data: renewals, error: renewalsError } = await admin
    .from('gf1_renewals')
    .select('id, company_name, renewal_due_date, is_completed, created_by')
    .eq('is_completed', false)
    .gte('renewal_due_date', minDueDateIso)
    .lte('renewal_due_date', maxDueDateIso);

  if (renewalsError) {
    console.error('[renewals-reminders] failed to load renewals', renewalsError);
    return NextResponse.json({ ok: false, message: renewalsError.message }, { status: 500 });
  }

  const renewalRows = (renewals ?? []) as RenewalRow[];
  const candidates = renewalRows
    .map((row) => {
      const dueTimestamp = utcDayTimestamp(row.renewal_due_date);
      const daysBeforeDue = Math.floor((dueTimestamp - todayUtc) / (24 * 60 * 60 * 1000));
      return { row, daysBeforeDue };
    })
    .filter(({ daysBeforeDue }) => REMINDER_DAY_OFFSETS.has(daysBeforeDue));

  if (candidates.length === 0) {
    return NextResponse.json({ ok: true, sent: 0, skipped: 0, reason: 'no-matching-renewals' });
  }

  const { data: sentLogs, error: logsError } = await admin
    .from('gf1_renewal_reminder_logs')
    .select('renewal_id, days_before_due, due_date_snapshot')
    .in('renewal_id', candidates.map(({ row }) => row.id));

  if (logsError) {
    console.error('[renewals-reminders] failed to load reminder logs', logsError);
    return NextResponse.json({ ok: false, message: logsError.message }, { status: 500 });
  }

  const alreadySent = new Set(
    (sentLogs ?? []).map(
      (log: { renewal_id: string; days_before_due: number; due_date_snapshot: string }) =>
        `${log.renewal_id}|${log.days_before_due}|${log.due_date_snapshot}`
    )
  );

  const creatorIds = Array.from(
    new Set(candidates.map(({ row }) => row.created_by).filter((id): id is string => Boolean(id)))
  );
  const creatorEmailMap = new Map<string, string>();
  if (creatorIds.length > 0) {
    const { data: creators } = await admin
      .from('profiles')
      .select('user_id, email')
      .in('user_id', creatorIds);
    (creators ?? []).forEach((creator: { user_id: string; email: string | null }) => {
      if (creator.user_id && creator.email) {
        creatorEmailMap.set(creator.user_id, creator.email.toLowerCase());
      }
    });
  }

  const configuredReminderEmails = parseAdminEmails(
    process.env.GF1_RENEWAL_REMINDER_EMAILS ?? process.env.ADMIN_EMAILS
  );

  let sentCount = 0;
  let skippedCount = 0;
  const logRows: Array<{
    renewal_id: string;
    days_before_due: number;
    due_date_snapshot: string;
    sent_to: string[];
    sent_at: string;
  }> = [];

  for (const { row, daysBeforeDue } of candidates) {
    const uniqueKey = `${row.id}|${daysBeforeDue}|${row.renewal_due_date}`;
    if (alreadySent.has(uniqueKey)) {
      skippedCount += 1;
      continue;
    }

    const recipients = new Set<string>(configuredReminderEmails);
    if (row.created_by) {
      const creatorEmail = creatorEmailMap.get(row.created_by);
      if (creatorEmail) recipients.add(creatorEmail);
    }

    const recipientList = Array.from(recipients);
    if (recipientList.length === 0) {
      skippedCount += 1;
      continue;
    }

    try {
      await Promise.all(
        recipientList.map((email) =>
          sendGf1RenewalReminderEmail({
            to: email,
            companyName: row.company_name,
            renewalDueDate: row.renewal_due_date,
            daysBeforeDue,
          })
        )
      );
      sentCount += recipientList.length;
      logRows.push({
        renewal_id: row.id,
        days_before_due: daysBeforeDue,
        due_date_snapshot: row.renewal_due_date,
        sent_to: recipientList,
        sent_at: new Date().toISOString(),
      });
    } catch (error) {
      console.error('[renewals-reminders] failed to send', {
        renewalId: row.id,
        daysBeforeDue,
        error,
      });
      skippedCount += 1;
    }
  }

  if (logRows.length > 0) {
    const { error: insertLogError } = await admin.from('gf1_renewal_reminder_logs').insert(logRows);
    if (insertLogError) {
      console.error('[renewals-reminders] failed to insert reminder logs', insertLogError);
      return NextResponse.json(
        { ok: false, message: insertLogError.message, sent: sentCount, skipped: skippedCount },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({ ok: true, sent: sentCount, skipped: skippedCount });
}
