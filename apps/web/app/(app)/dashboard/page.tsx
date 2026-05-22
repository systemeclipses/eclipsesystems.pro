import { getActiveOrgId, getAuthenticatedUserId } from "@/lib/org";
import { getRunningTimerCountForUser } from "@/src/db/queries/dashboard";

export default async function DashboardPage() {
  const userId = await getAuthenticatedUserId();
  const orgId = await getActiveOrgId();
  const runningTimerCount = await getRunningTimerCountForUser(userId, orgId);

  return (
    <section>
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <div className="mt-6 rounded-lg border border-border p-5">
        <p className="text-sm text-muted-foreground">Running timers</p>
        <p className="mt-2 text-3xl font-semibold">{runningTimerCount}</p>
      </div>
    </section>
  );
}
