import { Building2 } from "lucide-react";
import { CreateRecordForm } from "@/components/app/app-card-form";
import { EmptyState, PageHeader, Surface } from "@/components/app/page-shell";
import { getActiveOrgId, getAuthenticatedUserId } from "@/lib/org";
import { requireFeature } from "@/lib/plan-features";
import { getClientsForUser } from "@/src/db/queries/clients";

export default async function ClientsPage() {
  const userId = await getAuthenticatedUserId();
  const orgId = await getActiveOrgId();
  await requireFeature(orgId, "projects");
  const data = await getClientsForUser(userId, orgId);

  return (
    <section className="space-y-5">
      <PageHeader
        eyebrow="Client records"
        title="Clients"
        description="Keep the people and companies you bill close to projects, invoices, and time."
      />
      <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
        <Surface>
          {data.length ? (
            <div className="grid gap-3">
              {data.map((client) => (
                <div key={client.id} className="flex items-center justify-between rounded-md border border-border bg-cream/70 p-4">
                  <div>
                    <p className="font-semibold">{client.name}</p>
                    <p className="mt-1 text-sm text-muted-foreground">Ready for projects and invoices</p>
                  </div>
                  <Building2 className="h-5 w-5 text-primary" />
                </div>
              ))}
            </div>
          ) : (
            <EmptyState icon={Building2} title="No clients yet" description="Add your first client to start connecting time, projects, and invoices." />
          )}
        </Surface>
        <CreateRecordForm endpoint="/api/clients" title="Add client" fields={[{ name: "name", label: "Client name", placeholder: "Acme Legal", required: true }]} />
      </div>
    </section>
  );
}
