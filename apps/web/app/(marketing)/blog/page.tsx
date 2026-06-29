import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Clock3, FileText, Scale, UsersRound } from "lucide-react";
import { PublicCta, PublicPageHero, PublicSectionHeading } from "@/components/marketing/public-page";

export const metadata: Metadata = {
  title: "Blog",
  description: "Eclipse Systems writing on timekeeping, billing operations, shift management, and legal workflows."
};

const posts = [
  { title: "The weekly time review that saves Friday afternoon", category: "Timekeeping", icon: Clock3, href: "/guides" },
  { title: "Why invoice drafts should start with approved time", category: "Billing", icon: FileText, href: "/invoice-template" },
  { title: "Shift swaps need a record, not a group text", category: "Operations", icon: UsersRound, href: "/webinars" },
  { title: "When a law firm outgrows generic time tracking", category: "Legal", icon: Scale, href: "/pricing" }
] as const;

export default function BlogPage() {
  return (
    <main className="min-h-screen bg-cream text-ink">
      <PublicPageHero eyebrow="Field notes from Eclipse" title="Ideas for Teams in Motion." description="Practical writing on business operations, customer workflows, billing hygiene, team coordination, and the quiet systems that keep work moving." image="/media/generated/heroes/resources.jpg" imageAlt="An operations leader organizing workflow notes and diagrams" points={["Operations", "Customer experience", "Connected systems"]} />

      <section className="mx-auto max-w-[100rem] px-5 py-16 md:py-24">
        <PublicSectionHeading eyebrow="Latest thinking" title="Useful ideas, plainly written." />
        <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {posts.map((post) => {
            const Icon = post.icon;
            return (
              <Link key={post.title} href={post.href} className="group flex min-h-96 flex-col rounded-[1.5rem] border border-[#d8d0c1] bg-[#fbfaf6] p-6 shadow-xl shadow-[#172219]/5 transition hover:-translate-y-1 hover:shadow-2xl hover:shadow-[#172219]/12">
                <div className="grid h-12 w-12 place-items-center rounded-xl bg-secondary text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <p className="mt-8 text-xs font-semibold uppercase text-muted-foreground">{post.category}</p>
                <h2 className="mt-3 font-title text-4xl leading-none">{post.title}</h2>
                <span className="mt-auto inline-flex items-center gap-2 pt-7 text-sm font-semibold text-primary">
                  Read more <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                </span>
              </Link>
            );
          })}
        </div>
      </section>
      <PublicCta eyebrow="Have a workflow worth fixing?" title="Let’s make the next version easier to run." primaryLabel="Schedule a Demo" primaryHref="/schedule-demo" />
    </main>
  );
}
