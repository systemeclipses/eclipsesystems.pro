import { getActiveOrgId } from "@/lib/org";
import { createServerClient } from "@/lib/supabase/server";

export default async function MembersSettingsPage() {
  const orgId = await getActiveOrgId();
  const supabase = createServerClient();
  const { data } = await supabase.from("memberships").select("id,role,profiles(full_name,email)").eq("organization_id", orgId);
  return <section><h1 className="text-2xl font-semibold">Members</h1><pre className="mt-6 rounded-lg border border-border p-4">{JSON.stringify(data ?? [], null, 2)}</pre></section>;
}
