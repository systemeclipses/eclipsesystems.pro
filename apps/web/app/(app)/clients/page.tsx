import { requireFeature } from "@/lib/plan-features";
import { getActiveOrgId, getAuthenticatedUserId } from "@/lib/org";
import { getClientsForUser } from "@/src/db/queries/clients";

export default async function ClientsPage() {
  const userId = await getAuthenticatedUserId();
  const orgId = await getActiveOrgId();
  await requireFeature(orgId, "projects");
  const data = await getClientsForUser(userId, orgId);
  return <section><h1 className="text-2xl font-semibold">Clients</h1><pre className="mt-6 rounded-lg border border-border p-4">{JSON.stringify(data ?? [], null, 2)}</pre></section>;
}
