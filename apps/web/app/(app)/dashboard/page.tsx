import { getActiveOrgId } from "@/lib/org";
import { createServerClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const orgId = await getActiveOrgId();
  const supabase = createServerClient();
  const { data: timers } = await supabase.from("time_entries").select("id").eq("organization_id", orgId).is("ended_at", null);

  return (
    <section>
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <div className="mt-6 rounded-lg border border-border p-5">
        <p className="text-sm text-muted-foreground">Running timers</p>
        <p className="mt-2 text-3xl font-semibold">{timers?.length ?? 0}</p>
      </div>
    </section>
  );
}
