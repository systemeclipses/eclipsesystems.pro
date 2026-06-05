import type { Metadata } from 'next';
import RetirementQuestionnaireForm from './RetirementQuestionnaireForm';
import { supaAdmin } from '@/lib/supabase/admin';

export const metadata: Metadata = {
  title: 'Retirement Plan Questionnaire · Galactic 365',
  description: 'Share details about your retirement plan so we can build a 401(k) recommendation.',
};

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type SearchParams = Promise<{
  org_id?: string;
  org?: string;
  prospect?: string;
  interested?: string;
  offers_plan?: string;
  submitted?: string;
}>;

function parseYesNo(value?: string): boolean | null {
  if (value === 'yes') return true;
  if (value === 'no') return false;
  return null;
}

export default async function RetirementQuestionnairePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const orgId = sp?.org_id ?? null;

  // Primary: ?submitted=1 stamped on the URL after a successful submit.
  let alreadySubmitted = sp?.submitted === '1';

  // Secondary: direct marker-file download (works without DB column or list quirks).
  if (!alreadySubmitted && orgId) {
    try {
      const admin = supaAdmin();
      const markerPath = `retirement-questionnaires/${orgId}/.submitted`;
      const dl = await admin.storage.from('agreement-documents').download(markerPath);
      const exists = !dl.error && Boolean(dl.data) && (dl.data?.size ?? 0) > 0;
      console.log('[retirement-questionnaire] marker check', {
        orgId,
        markerPath,
        exists,
        hasError: Boolean(dl.error),
        errorMessage: dl.error ? String((dl.error as { message?: string }).message ?? dl.error) : null,
        dataSize: dl.data?.size ?? null,
      });
      if (exists) alreadySubmitted = true;
    } catch (err) {
      console.error('[retirement-questionnaire] marker check threw', err);
    }
  }

  // Tertiary: DB column (best-effort, only if migration was applied).
  if (!alreadySubmitted && orgId) {
    try {
      const admin = supaAdmin();
      const { data: orgRow } = await admin
        .from('organizations')
        .select('retirement_questionnaire_submitted_at')
        .eq('id', orgId)
        .maybeSingle();
      if (
        (orgRow as { retirement_questionnaire_submitted_at?: string | null } | null)
          ?.retirement_questionnaire_submitted_at
      ) {
        alreadySubmitted = true;
      }
    } catch {}
  }

  return (
    <RetirementQuestionnaireForm
      orgId={orgId}
      initialCompanyName={sp?.org ?? ''}
      initialProspectName={sp?.prospect ?? ''}
      initialInterestedInJoining={parseYesNo(sp?.interested)}
      initialOffersRetirementPlan={parseYesNo(sp?.offers_plan)}
      alreadySubmitted={alreadySubmitted}
    />
  );
}
