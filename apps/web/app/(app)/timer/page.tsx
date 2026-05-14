import { getActiveOrgId } from "@/lib/org";
import { createServerClient } from "@/lib/supabase/server";
import { TimerClient } from "@/components/timer/timer-client";

export default async function TimerPage() {
  const orgId = await getActiveOrgId();
  const supabase = createServerClient();
  const { data: projects } = await supabase.from("projects").select("id,name").eq("organization_id", orgId);
  const { data: running } = await supabase.from("time_entries").select("*").eq("organization_id", orgId).is("ended_at", null).maybeSingle();

  return <TimerClient orgId={orgId} projects={projects ?? []} running={running ?? null} />;
}
