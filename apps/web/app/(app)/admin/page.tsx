import { PageHeader } from "@/components/app/page-shell";
import { OffboardingAdminClient } from "@/components/admin/offboarding-admin-client";
import { getActiveOrgId } from "@/lib/org";
import { getEligibleOffboardingMembers, getOffboardingDashboard, getOffboardingDetail } from "@/src/db/queries/offboarding";

export default async function AdminPage() {
  const organizationId = await getActiveOrgId();
  const [dashboard, members] = await Promise.all([
    getOffboardingDashboard(organizationId),
    getEligibleOffboardingMembers(organizationId)
  ]);
  const detailResults = await Promise.all(dashboard.rows.slice(0, 8).map((row) => getOffboardingDetail(organizationId, row.id)));
  const details = detailResults.filter((detail): detail is NonNullable<typeof detail> => detail !== null);

  return (
    <section className="space-y-5">
      <PageHeader eyebrow="Admin controls" title="Admin" description="Offboarding compliance, final pay tracking, archives, and workforce lifecycle controls." />
      <OffboardingAdminClient dashboard={dashboard} members={members} details={details} />
    </section>
  );
}
