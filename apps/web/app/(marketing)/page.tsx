import Link from "next/link";
import { Clock, FileText, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  return (
    <main className="min-h-screen">
      <section className="border-b border-border bg-muted/60">
        <div className="mx-auto grid max-w-6xl gap-8 px-6 py-16 md:grid-cols-[1.1fr_0.9fr] md:items-center">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Eclipse Systems</p>
            <h1 className="mt-3 text-4xl font-semibold tracking-normal md:text-6xl">Timekeeping for teams that bill carefully.</h1>
            <p className="mt-5 max-w-2xl text-lg text-muted-foreground">
              Live timers, approvals, invoicing, shift operations, chat, legal billing, and trust accounting in one tenant-safe workspace.
            </p>
            <div className="mt-8 flex gap-3">
              <Button asChild><Link href="/signup">Start trial</Link></Button>
              <Button asChild variant="outline"><Link href="/pricing">Pricing</Link></Button>
            </div>
          </div>
          <div className="rounded-lg border border-border bg-white p-5 shadow-sm">
            <div className="grid gap-3">
              {[Clock, FileText, ShieldCheck].map((Icon, index) => (
                <div key={index} className="flex items-center gap-3 rounded-md border border-border p-4">
                  <Icon className="h-5 w-5 text-primary" />
                  <div className="h-3 w-full rounded bg-muted" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
