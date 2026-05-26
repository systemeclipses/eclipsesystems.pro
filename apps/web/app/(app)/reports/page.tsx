import { BarChart3 } from "lucide-react";
import { EmptyState, PageHeader, StatPill, Surface } from "@/components/app/page-shell";
import { getActiveOrgId, getAuthenticatedUserId } from "@/lib/org";
import { requireFeature } from "@/lib/plan-features";
import { getTimeEntrySeconds, getTimesheetEntriesForUser } from "@/src/db/queries/time-entries";

export default async function ReportsPage() {
  const userId = await getAuthenticatedUserId();
  const orgId = await getActiveOrgId();
  await requireFeature(orgId, "reporting");
  const entries = await getTimesheetEntriesForUser(userId, orgId);
  const totalSeconds = entries.reduce((sum, entry) => sum + getTimeEntrySeconds(entry), 0);
  const running = entries.filter((entry) => !entry.ended_at).length;

  return (
    <section className="space-y-5">
      <PageHeader eyebrow="Operational reporting" title="Reports" description="A compact read on time volume, draft work, and active timers." />
      <div className="grid gap-3 md:grid-cols-3">
        <StatPill label="Tracked hours" value={(totalSeconds / 3600).toFixed(2)} />
        <StatPill label="Entries" value={entries.length} />
        <StatPill label="Running timers" value={running} />
      </div>
      <Surface>
        {entries.length ? (
          <div className="grid gap-3 md:grid-cols-5">
            {entries.slice(0, 5).map((entry) => (
              <div key={entry.id} className="rounded-md bg-cream/70 p-4">
                <p className="text-xs text-muted-foreground">{entry.status}</p>
                <p className="mt-8 text-2xl font-semibold">{(getTimeEntrySeconds(entry) / 3600).toFixed(2)}h</p>
                <p className="mt-2 truncate text-sm">{entry.description || "Timer entry"}</p>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState icon={BarChart3} title="Reports are waiting on time" description="Start tracking time and this page will turn into your operational summary." action={{ href: "/timer", label: "Start timer" }} />
        )}
      </Surface>
    </section>
  );
}
