import { format } from "date-fns";
import { getActiveOrgId } from "@/lib/org";
import { createServerClient } from "@/lib/supabase/server";

export default async function TimesheetPage() {
  const orgId = await getActiveOrgId();
  const supabase = createServerClient();
  const { data: entries } = await supabase.from("time_entries").select("id,description,started_at,ended_at,duration_seconds,status").eq("organization_id", orgId).order("started_at", { ascending: false });

  return (
    <section>
      <h1 className="text-2xl font-semibold">Timesheet</h1>
      <div className="mt-6 overflow-hidden rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted text-left"><tr><th className="p-3">Date</th><th>Description</th><th>Hours</th><th>Status</th></tr></thead>
          <tbody>
            {(entries ?? []).map((entry) => (
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
