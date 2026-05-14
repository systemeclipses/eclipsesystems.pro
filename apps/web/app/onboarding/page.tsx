import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { createServerClient } from "@/lib/supabase/server";

export default async function OnboardingPage() {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  async function createOrg() {
    "use server";
    const server = createServerClient();
    const { data: { user: currentUser } } = await server.auth.getUser();
    if (!currentUser) redirect("/login");
    const { data: org } = await server.from("organizations").insert({ name: "Personal", kind: "personal", owner_id: currentUser.id } as never).select("id").single();
    if (org && "id" in org) await server.from("profiles").update({ default_organization_id: org.id } as never).eq("id", currentUser.id);
    redirect("/timer");
  }

  return <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-6"><h1 className="text-2xl font-semibold">Set up your workspace</h1><form action={createOrg} className="mt-6"><Button>Create personal organization</Button></form></main>;
}
