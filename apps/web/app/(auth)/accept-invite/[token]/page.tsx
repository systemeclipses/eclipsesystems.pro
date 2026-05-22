import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";

export default async function AcceptInvitePage({ params }: { params: { token: string } }) {
  if (!params.token) redirect("/login");

  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-6">
      <h1 className="text-2xl font-semibold">Accept invitation</h1>
      <p className="mt-3 text-muted-foreground">Join the organization and start tracking time with your team.</p>
      <form action={`/api/invitations/accept?token=${params.token}`} className="mt-6">
        <Button>Accept invite</Button>
      </form>
    </main>
  );
}
