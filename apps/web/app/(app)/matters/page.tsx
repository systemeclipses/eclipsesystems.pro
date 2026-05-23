import { Scale } from "lucide-react";
import { EmptyState, PageHeader, Surface } from "@/components/app/page-shell";
import { getActiveOrgId, getAuthenticatedUserId } from "@/lib/org";

export default async function MattersPage() {
  await getAuthenticatedUserId();
  const orgId = await getActiveOrgId();
  return (
    <section className="space-y-5">
      <PageHeader eyebrow="Legal add-on" title="Matters" description="Matter billing, UTBMS, trust-aware workflows, and LEDES exports will connect here." />
      <Surface>
        <EmptyState icon={Scale} title="No matters yet" description={`Workspace ${orgId} has no legal matter records. Add-on workflows will appear here when enabled.`} />
      </Surface>
    </section>
  );
}
