import { format } from "date-fns";
import { getActiveOrgId, getAuthenticatedUserId } from "@/lib/org";
import { getTimesheetEntriesForUser } from "@/src/db/queries/time-entries";

export default async function TimesheetPage() {
  const userId = await getAuthenticatedUserId();
  const orgId = await getActiveOrgId();
  const entries = await getTimesheetEntriesForUser(userId, orgId);

  return (
    <section>
      <h1 className="text-2xl font-semibold">Timesheet</h1>
      <div className="mt-6 overflow-hidden rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted text-left"><tr><th className="p-3">Date</th><th>Description</th><th>Hours</th><th>Status</th></tr></thead>
          <tbody>
            {entries.map((entry) => (
              <tr key={entry.id} className="border-t border-border">
                <td className="p-3">{format(new Date(entry.started_at), "MMM d")}</td>
                <td>{entry.description ?? "Timer entry"}</td>
                <td>{((entry.duration_seconds ?? 0) / 3600).toFixed(2)}</td>
                <td>{entry.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
