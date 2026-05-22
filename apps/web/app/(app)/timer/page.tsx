import { getActiveOrgId, getAuthenticatedUserId } from "@/lib/org";
import { TimerClient } from "@/components/timer/timer-client";
import { getProjectsForUser } from "@/src/db/queries/projects";
import { getRunningTimeEntryForUser } from "@/src/db/queries/time-entries";

export default async function TimerPage() {
  const userId = await getAuthenticatedUserId();
  const orgId = await getActiveOrgId();
  const projects = await getProjectsForUser(userId, orgId);
  const running = await getRunningTimeEntryForUser(userId, orgId);

  return <TimerClient orgId={orgId} projects={projects} running={running ? { id: running.id, description: running.description, started_at: running.startedAt.toISOString() } : null} />;
}
