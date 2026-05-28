import Link from "next/link";
import { ArrowRight, BadgeDollarSign, Bell, Building2, CalendarClock, CreditCard, LockKeyhole, Monitor, PlugZap, RadioTower, ScrollText, ShieldCheck, UserCog, UserRound, UsersRound } from "lucide-react";
import { PageHeader } from "@/components/app/page-shell";
import { getActiveOrgId, getAuthenticatedUserId } from "@/lib/org";
import { PRODUCT_DETAILS, getProductUiContext } from "@/src/billing/entitlements";

const personalSettings = [
  {
    title: "Profile",
    description: "Name, contact details, password, and account security.",
    href: "/settings/account",
    icon: UserRound
  },
  {
    title: "Notifications",
    description: "Timekeeping, PTO, approval, and account notification preferences.",
    href: "/settings/account#notifications",
    icon: Bell
  },
  {
    title: "Display",
    description: "Timezone, language, theme, and display preferences.",
    href: "/settings/account#display",
    icon: Monitor
  }
] as const;

const adminSettings = [
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
    title: "Roles & Permissions",
    description: "Built-in roles, custom roles, scopes, access reviews, and audit trails.",
    href: "/settings/roles",
    icon: UserCog
  },
  {
    title: "Security & Observability",
    description: "MFA, SSO, service health, synthetic monitoring, and incident controls.",
    href: "/settings/security",
    icon: RadioTower
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
    title: "Integrations",
    description: "Connected systems, service hooks, and data exchange controls.",
    href: "/settings/security",
    icon: PlugZap
  },
  {
    title: "Audit Log",
    description: "Review important account, access, billing, and workflow events.",
    href: "/settings/security",
    icon: ScrollText
  },
  {
    title: "Admin",
    description: "Owner controls, audit visibility, and advanced workspace tools.",
    href: "/admin",
    icon: ShieldCheck
  }
] as const;

export default async function SettingsPage() {
  const userId = await getAuthenticatedUserId();
  const orgId = await getActiveOrgId();
  const context = await getProductUiContext(userId, orgId);
  const isAdminRole = context.role !== "employee";
  const visibleAdminSettings = adminSettings.filter((item) => item.href !== "/settings/billing" || context.showBilling);

  return (
    <section className="space-y-5">
      <PageHeader
        eyebrow="Workspace controls"
        title="Settings"
        description="Manage account preferences, team access, billing, rates, and administrative controls from one place."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {personalSettings.map((item) => {
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

      {isAdminRole ? (
        <>
          <div className="pt-2">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Organization controls</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {visibleAdminSettings.map((item) => {
              const Icon = item.icon;

              return (
                <Link
                  key={item.title}
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
        </>
      ) : null}

      {context.showMarketplace ? (
        <section className="rounded-md border border-border bg-white/65 p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-primary">Products & Plans</p>
              <h2 className="mt-2 text-2xl font-semibold">Your product lineup</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                Active products are available to the team. Locked products stay visible here for admins only.
              </p>
            </div>
            <Link href="/settings/billing" className="inline-flex h-10 items-center gap-2 rounded-md border border-border px-3 text-sm font-semibold text-primary">
              Manage billing <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {(["timekeeping", "eclipse", "mission_command", "legal_addon"] as const).map((product) => {
              const active = context.entitledProducts.includes(product);
              const detail = PRODUCT_DETAILS[product];
              return (
                <div key={product} className={`rounded-md border p-4 ${active ? "border-primary/25 bg-cream/70" : "border-border bg-white"}`}>
                  <div className="flex items-start justify-between gap-3">
                    <p className={`font-semibold ${detail.accentClass}`}>{detail.shortName}</p>
                    {active ? <span className="rounded-sm bg-green-50 px-2 py-1 text-xs font-semibold text-green-700">Active</span> : <LockKeyhole className="h-4 w-4 text-muted-foreground" />}
                  </div>
                  <p className="mt-3 text-sm leading-5 text-muted-foreground">{detail.description}</p>
                  {!active ? <Link href={`/settings/billing?product=${product}`} className="mt-4 inline-flex text-sm font-semibold text-primary">Learn more</Link> : null}
                </div>
              );
            })}
          </div>
          {context.suiteSavingsMonthlyCents > 0 && !context.isSuite ? (
            <p className="mt-4 rounded-md bg-secondary/70 p-3 text-sm font-semibold text-primary">
              Suite pricing is ${context.suiteSavingsMonthlyCents / 100}/seat/month less than buying Timekeeping, Eclipse, and Mission Command separately.
            </p>
          ) : null}
        </section>
      ) : null}
    </section>
  );
}
