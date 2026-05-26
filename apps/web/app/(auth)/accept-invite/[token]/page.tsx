import { Button } from "@/components/ui/button";
import { redirect } from "next/navigation";

export default async function AcceptInvitePage({ params }: { params: { token: string } }) {
  if (!params.token) redirect("/login");

  return (
    <main className="min-h-screen bg-cream px-4 py-6">
      <section className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-md flex-col justify-center rounded-md border border-border bg-white/75 p-6">
        <p className="text-sm font-semibold text-primary">New team invitation</p>
        <h1 className="mt-3 text-3xl font-semibold">Welcome to your time tracking setup</h1>
        <p className="mt-4 text-sm leading-6 text-muted-foreground">Accept the invitation to join your organization, then we will walk you through the few things you need before your first clock-in.</p>
        <div className="mt-6 rounded-md bg-cream/70 p-4 text-sm text-muted-foreground">
          <p>This link connects your account to the organization that invited you. If it has expired, ask your manager to send a new one.</p>
        </div>
      <form action={`/api/invitations/accept?token=${params.token}`} method="post" className="mt-6">
        <Button className="h-12 w-full">Get Started</Button>
      </form>
      </section>
    </main>
  );
}
