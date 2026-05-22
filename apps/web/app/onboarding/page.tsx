import { Button } from "@/components/ui/button";
import { redirect } from "next/navigation";
import { auth } from "@/src/auth";
import { ensurePersonalOrganizationForUser } from "@/src/db/queries/organizations";

export default async function OnboardingPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  async function createOrg() {
    "use server";
    const currentSession = await auth();
    if (!currentSession?.user?.id) redirect("/login");
    await ensurePersonalOrganizationForUser(currentSession.user);
    redirect("/timer");
  }

  return <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-6"><h1 className="text-2xl font-semibold">Set up your workspace</h1><form action={createOrg} className="mt-6"><Button>Create personal organization</Button></form></main>;
}
