import { TimekeepingModule } from "@/components/timekeeping/timekeeping-module";
import { getActiveOrgId, getAuthenticatedUserId } from "@/lib/org";
import { calculateTimesheetForMembership, getManagerTimekeepingQueue, getTeamTimesheets, getTimekeepingOverview } from "@/src/db/queries/timekeeping";
import { getPtoManagerV2Dashboard } from "@/src/db/queries/pto-manager-v2";
import { getTimekeepingSettings } from "@/src/db/queries/timekeeping-settings";
import { getCurrentShiftState } from "@/src/db/queries/shift-state-machine";

function serializeDate<T extends Record<string, unknown>>(row: T) {
  return Object.fromEntries(
    Object.entries(row).map(([key, value]) => [key, value instanceof Date ? value.toISOString() : value])
  ) as T;
}

export default async function TimekeepingPage() {
  const userId = await getAuthenticatedUserId();
  const orgId = await getActiveOrgId();
  const overview = await getTimekeepingOverview(userId, orgId);
  const managerQueue = await getManagerTimekeepingQueue(orgId);
  const settings = await getTimekeepingSettings(orgId);
  const currentShift = await getCurrentShiftState(orgId, overview.membership.id);
  const timesheet = await calculateTimesheetForMembership({ organizationId: orgId, membershipId: overview.membership.id, settings });
  const isManagerOrHigher = ["superuser", "owner", "admin", "manager"].includes(overview.membership.role);
  const teamTimesheets = isManagerOrHigher ? await getTeamTimesheets({ organizationId: orgId, settings }) : null;
  const managerV2 = isManagerOrHigher ? await getPtoManagerV2Dashboard(orgId, overview.membership.id) : null;

  return (
    <TimekeepingModule
      running={overview.running ? serializeDate(overview.running) : null}
      entries={overview.entries.map(serializeDate)}
      categories={overview.categories}
      requests={overview.requests.map(serializeDate)}
      managerQueue={{
        pendingRequests: managerQueue.pendingRequests.map(serializeDate),
        flaggedEntries: managerQueue.flaggedEntries.map(serializeDate)
      }}
      hasPtoToday={overview.hasPtoToday}
      role={overview.membership.role}
      summary={overview.summary}
      paidBreaks={settings.payRules.paidBreaks}
      timesheet={JSON.parse(JSON.stringify(timesheet))}
      teamTimesheets={teamTimesheets ? JSON.parse(JSON.stringify(teamTimesheets)) : null}
      managerV2={managerV2 ? JSON.parse(JSON.stringify(managerV2)) : null}
      currentShift={JSON.parse(JSON.stringify(currentShift))}
    />
  );
}
