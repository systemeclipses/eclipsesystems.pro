import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CalendarDays, Clock3, MonitorPlay, UsersRound } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Webinars",
  description: "Eclipse Systems webinars for timekeeping, billing, workforce operations, and legal workflow teams."
};

const sessions = [
  { title: "From messy timesheets to invoice-ready work", date: "On demand", icon: Clock3 },
  { title: "Shift swaps without the group text spiral", date: "Upcoming", icon: UsersRound },
  { title: "Legal billing controls before LEDES gets painful", date: "On demand", icon: MonitorPlay }
] as const;

export default function WebinarsPage() {
  return (
    <main className="min-h-screen bg-cream text-ink">
      <section className="px-3 pt-3">
        <div className="rounded-md bg-primary text-white">
          <div className="mx-auto grid max-w-[104rem] gap-8 px-5 py-12 md:py-16 lg:grid-cols-[0.75fr_1fr] lg:items-center">
            <div>
              <p className="text-sm font-semibold text-secondary">Live sessions and replays.</p>
              <h1 className="mt-4 font-title text-6xl leading-[0.88] text-cream md:text-8xl">Webinars for operators.</h1>
            </div>
            <p className="max-w-3xl text-base leading-7 text-white/78 md:text-lg">
              Short, practical sessions for managers, billers, firm admins, and owners who want cleaner records without making work feel heavier.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[104rem] px-5 py-12">
        <div className="grid gap-5 md:grid-cols-3">
          {sessions.map((session) => {
            const Icon = session.icon;
            return (
              <article key={session.title} className="rounded-md border border-border bg-white/70 p-6 shadow-sm transition hover:-translate-y-1 hover:bg-white hover:shadow-2xl hover:shadow-primary/20">
                <div className="flex items-center justify-between gap-4">
                  <div className="grid h-11 w-11 place-items-center rounded-sm bg-secondary text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase text-muted-foreground">
                    <CalendarDays className="h-4 w-4" />
                    {session.date}
                  </span>
                </div>
                <h2 className="mt-8 font-title text-4xl leading-none">{session.title}</h2>
                <p className="mt-5 text-sm leading-6 text-muted-foreground">A 30-minute operational walkthrough with templates, examples, and a Q&A segment.</p>
                <Button asChild className="mt-7 bg-primary text-primary-foreground hover:bg-[#314839]">
                  <Link href="/signup">Save a seat <ArrowRight className="h-4 w-4" /></Link>
                </Button>
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
}
