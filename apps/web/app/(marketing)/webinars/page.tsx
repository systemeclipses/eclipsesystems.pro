import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CalendarDays, Clock3, MonitorPlay, UsersRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PublicCta, PublicPageHero, PublicSectionHeading } from "@/components/marketing/public-page";

export const metadata: Metadata = {
  title: "Custom Software Workshops",
  description: "Discuss client portals, workflow automation, operations dashboards and integration planning with Eclipse Systems."
};

const sessions = [
  { title: "From manual handoffs to connected workflows", date: "Workshop topic", icon: Clock3 },
  { title: "Client portals that answer the next question", date: "Workshop topic", icon: UsersRound },
  { title: "Plan integrations and reporting before launch", date: "Workshop topic", icon: MonitorPlay }
] as const;

export default function WebinarsPage() {
  return (
    <main className="min-h-screen bg-cream text-ink">
      <PublicPageHero eyebrow="Discussion topics" title="Workshops around your business workflow." description="Talk through a specific process, an existing system or a proposed integration. Contact the team to confirm availability and the format of a workshop." image="/media/generated/heroes/webinars.jpg" imageAlt="A small team taking part in a practical software workshop" points={["Workflow discovery", "Practical examples", "Scoped discussion"]} />

      <section className="mx-auto max-w-[100rem] px-5 py-16 md:py-24">
        <PublicSectionHeading eyebrow="Sessions" title="Learn it. See it. Use it." />
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {sessions.map((session) => {
            const Icon = session.icon;
            return (
              <article key={session.title} className="rounded-[1.5rem] border border-[#d8d0c1] bg-[#fbfaf6] p-7 shadow-xl shadow-[#172219]/5 transition hover:-translate-y-1 hover:shadow-2xl hover:shadow-[#172219]/12">
                <div className="flex items-center justify-between gap-4">
                  <div className="grid h-12 w-12 place-items-center rounded-xl bg-secondary text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase text-muted-foreground">
                    <CalendarDays className="h-4 w-4" />
                    {session.date}
                  </span>
                </div>
                <h2 className="mt-8 font-title text-4xl leading-none">{session.title}</h2>
                <p className="mt-5 text-sm leading-6 text-muted-foreground">A proposed discussion topic. Contact the team to agree on the workflow, availability and session format.</p>
                <Button asChild className="mt-7 bg-primary text-primary-foreground hover:bg-[#314839]">
                  <Link href="/contact">Discuss this topic <ArrowRight className="h-4 w-4" /></Link>
                </Button>
              </article>
            );
          })}
        </div>
      </section>
      <PublicCta eyebrow="Want the workflow, not just the webinar?" title="See how Eclipse fits your team." primaryLabel="Schedule a Demo" primaryHref="/contact" secondaryLabel="Explore Our Systems" secondaryHref="/demos" />
    </main>
  );
}
