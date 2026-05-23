import { format } from "date-fns";
import { Clock3 } from "lucide-react";
import { EmptyState, PageHeader, StatPill, Surface } from "@/components/app/page-shell";
import { ManualTimeForm } from "@/components/timer/manual-time-form";
import { getActiveOrgId, getAuthenticatedUserId } from "@/lib/org";
import { getProjectsForUser } from "@/src/db/queries/projects";
import { getTimeEntrySeconds, getTimesheetEntriesForUser } from "@/src/db/queries/time-entries";

export default async function TimesheetPage() {
  const userId = await getAuthenticatedUserId();
  const orgId = await getActiveOrgId();
  const entries = await getTimesheetEntriesForUser(userId, orgId);
  const projects = await getProjectsForUser(userId, orgId);
  const totalSeconds = entries.reduce((sum, entry) => sum + getTimeEntrySeconds(entry), 0);
  const totalHours = (totalSeconds / 3600).toFixed(2);

  return (
    <section className="space-y-5">
      <PageHeader eyebrow="Time ledger" title="Timesheet" description="Review timer and manual entries before they become billing records." action={{ href: "/timer", label: "Open timer" }} />
      <div className="grid gap-3 md:grid-cols-3">
        <StatPill label="Entries" value={entries.length} />
        <StatPill label="Tracked hours" value={totalHours} />
        <StatPill label="Draft items" value={entries.filter((entry) => entry.status === "draft").length} />
      </div>
      <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
        <Surface className="overflow-hidden p-0">
          {entries.length ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-sm">
                <thead className="bg-secondary/70 text-left">
                  <tr>
                    <th className="p-3">Date</th>
                    <th>Description</th>
                    <th>Hours</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((entry) => (
                    <tr key={entry.id} className="border-t border-border">
                      <td className="p-3">{format(new Date(entry.started_at), "MMM d, h:mm a")}</td>
                      <td>{entry.description ?? "Timer entry"}</td>
                      <td>{(getTimeEntrySeconds(entry) / 3600).toFixed(2)}</td>
                      <td><span className="rounded-sm bg-cream px-2 py-1 text-xs font-semibold text-primary">{entry.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-5">
              <EmptyState icon={Clock3} title="No time entries yet" description="Start a timer or add manual time to build your timesheet." action={{ href: "/timer", label: "Start timer" }} />
            </div>
          )}
        </Surface>
        <ManualTimeForm projects={projects} />
      </div>
    </section>
  );
}
