import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Clock3, FileText, Scale, UsersRound } from "lucide-react";

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
      <section className="px-3 pt-3">
        <div className="rounded-md bg-primary text-white">
          <div className="mx-auto grid max-w-[104rem] gap-8 px-5 py-12 md:py-16 lg:grid-cols-[0.75fr_1fr] lg:items-center">
            <div>
              <p className="text-sm font-semibold text-secondary">Field notes from Eclipse.</p>
              <h1 className="mt-4 font-title text-6xl leading-[0.88] text-cream md:text-8xl">Blog for teams in motion.</h1>
            </div>
            <p className="max-w-3xl text-base leading-7 text-white/78 md:text-lg">
              Practical writing on time capture, billing hygiene, shift operations, legal workflows, and the quiet systems that keep teams moving.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[104rem] px-5 py-12">
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {posts.map((post) => {
            const Icon = post.icon;
            return (
              <Link key={post.title} href={post.href} className="group flex min-h-80 flex-col rounded-md border border-border bg-white/70 p-6 shadow-sm transition hover:-translate-y-1 hover:bg-white hover:shadow-2xl hover:shadow-primary/20">
                <div className="grid h-11 w-11 place-items-center rounded-sm bg-secondary text-primary">
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
    </main>
  );
}
