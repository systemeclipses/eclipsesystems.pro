import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";

export async function getActiveOrgId() {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("default_organization_id")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.default_organization_id) redirect("/onboarding");
  return profile.default_organization_id;
}
