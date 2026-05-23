import { PageHeader, Surface } from "@/components/app/page-shell";
import { getActiveOrgId, getAuthenticatedUserId } from "@/lib/org";
import { getOrganizationForUser } from "@/src/db/queries/organizations";

export default async function OrganizationSettingsPage() {
  const userId = await getAuthenticatedUserId();
  const orgId = await getActiveOrgId();
  const organization = await getOrganizationForUser(userId, orgId);

  return (
    <section className="space-y-5">
      <PageHeader eyebrow="Workspace settings" title="Organization" description="Core workspace details connected to memberships, billing, and records." />
      <Surface>
        <div className="grid gap-4 md:grid-cols-4">
          <div>
            <p className="text-sm text-muted-foreground">Name</p>
            <p className="mt-2 font-semibold">{organization?.name ?? "Workspace"}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Kind</p>
            <p className="mt-2 font-semibold">{organization?.kind ?? "team"}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Currency</p>
            <p className="mt-2 font-semibold">{organization?.defaultCurrency ?? "USD"}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Timezone</p>
            <p className="mt-2 font-semibold">{organization?.timezone ?? "UTC"}</p>
          </div>
        </div>
      </Surface>
    </section>
  );
}
