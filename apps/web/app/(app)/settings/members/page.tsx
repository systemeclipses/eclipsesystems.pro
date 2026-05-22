import { getActiveOrgId, getAuthenticatedUserId } from "@/lib/org";
import { getMembersForUser } from "@/src/db/queries/members";

export default async function MembersSettingsPage() {
  const userId = await getAuthenticatedUserId();
  const orgId = await getActiveOrgId();
  const data = await getMembersForUser(userId, orgId);
  return <section><h1 className="text-2xl font-semibold">Members</h1><pre className="mt-6 rounded-lg border border-border p-4">{JSON.stringify(data ?? [], null, 2)}</pre></section>;
}
