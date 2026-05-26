import Link from "next/link";
import { ArrowRight, BadgeDollarSign, Building2, CalendarClock, CreditCard, ShieldCheck, UserRound, UsersRound } from "lucide-react";
import { PageHeader } from "@/components/app/page-shell";

const settings = [
  {
    title: "Account",
    description: "Profile details, user identity, and Appearance preferences.",
    href: "/settings/account",
    icon: UserRound
  },
  {
    title: "Organization",
    description: "Workspace name, currency, timezone, and operating defaults.",
    href: "/settings/organization",
    icon: Building2
  },
  {
    title: "Members",
    description: "Workspace access, roles, and member visibility.",
    href: "/settings/members",
    icon: UsersRound
  },
  {
    title: "Billing",
    description: "Subscription status, plan details, and billing portal access.",
    href: "/settings/billing",
    icon: CreditCard
  },
  {
    title: "Rates",
    description: "Rate cards for billable work, projects, and matters.",
    href: "/settings/rates",
    icon: BadgeDollarSign
  },
  {
    title: "Timekeeping & PTO",
    description: "Pay rules, holidays, PTO categories, geofences, automation, and privacy.",
    href: "/settings/timekeeping",
    icon: CalendarClock
  },
  {
    title: "Admin",
    description: "Owner controls, audit visibility, and advanced workspace tools.",
    href: "/admin",
    icon: ShieldCheck
  }
] as const;

export default function SettingsPage() {
  return (
    <section className="space-y-5">
      <PageHeader
        eyebrow="Workspace controls"
        title="Settings"
        description="Manage account preferences, team access, billing, rates, and administrative controls from one place."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {settings.map((item) => {
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className="group flex min-h-44 flex-col justify-between rounded-md border border-border bg-white/65 p-5 transition hover:-translate-y-0.5 hover:border-primary/60 hover:bg-white/80 hover:shadow-lg hover:shadow-primary/10 dark:hover:bg-white/10"
            >
              <div>
                <div className="grid h-11 w-11 place-items-center rounded-sm bg-secondary text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <h2 className="mt-5 text-xl font-semibold text-ink dark:text-white">{item.title}</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.description}</p>
              </div>
              <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-primary dark:text-secondary">
                Open {item.title}
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
