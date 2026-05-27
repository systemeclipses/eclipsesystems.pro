import Link from "next/link";
import { ArrowRight, BriefcaseBusiness, Clock3, Layers3, Scale, UsersRound } from "lucide-react";
import { PLAN_NAMES, type PlanCode } from "@eclipsesystems/shared/plans";

type Recommendation = {
  plan: PlanCode;
  label: string;
  description: string;
  reason: string;
  href: string;
  icon: typeof Clock3;
};

const productDetails: Record<PlanCode, Omit<Recommendation, "plan">> = {
  timekeeping: {
    label: PLAN_NAMES.timekeeping,
    description: "Focused time capture, reporting, and cleaner daily records.",
    reason: "A calm starting point for teams that need time discipline first.",
    href: "/pricing#timekeeping",
    icon: Clock3
  },
  mission_command: {
    label: PLAN_NAMES.mission_command,
    description: "Shift coverage, team chat, and manager-facing operations.",
    reason: "Useful when scheduling and team coordination start sharing the same room as time.",
    href: "/pricing#mission-command",
    icon: UsersRound
  },
  eclipse: {
    label: PLAN_NAMES.eclipse,
    description: "Projects, clients, budgets, and invoicing connected to time.",
    reason: "A natural next step when tracked hours need to become billable work.",
    href: "/pricing#eclipse",
    icon: BriefcaseBusiness
  },
  suite: {
    label: PLAN_NAMES.suite,
    description: "Timekeeping, project billing, shift operations, and chat together.",
    reason: "Best when one product is already carrying more than one workflow.",
    href: "/pricing#suite",
    icon: Layers3
  },
  legal_addon: {
    label: PLAN_NAMES.legal_addon,
    description: "Matter billing, UTBMS structure, LEDES paths, and legal controls.",
    reason: "Worth adding only when legal billing needs real matter structure.",
    href: "/pricing#legal-addon",
    icon: Scale
  }
};

function isPlanCode(plan: string | null | undefined): plan is PlanCode {
  return plan === "timekeeping" || plan === "mission_command" || plan === "eclipse" || plan === "suite" || plan === "legal_addon";
}

function buildRecommendations(currentPlan: string | null | undefined) {
  const plan = isPlanCode(currentPlan) ? currentPlan : null;
  const picks: PlanCode[] =
    plan === "timekeeping"
      ? ["suite", "eclipse", "mission_command"]
    : plan === "mission_command"
        ? ["suite", "eclipse"]
        : plan === "eclipse"
          ? ["suite", "mission_command"]
          : plan === "suite"
            ? ["legal_addon"]
            : plan === "legal_addon"
              ? ["suite", "timekeeping"]
              : ["timekeeping", "suite"];

  return picks.map((code) => ({ plan: code, ...productDetails[code] }));
}

export function ProductRecommendations({
  currentPlan,
  context = "billing",
  compact = false
}: {
  currentPlan?: string | null;
  context?: "billing" | "dashboard" | "feature";
  compact?: boolean;
}) {
  const recommendations = buildRecommendations(currentPlan);
  if (!recommendations.length) return null;

  const knownPlan = isPlanCode(currentPlan) ? PLAN_NAMES[currentPlan] : null;
  const eyebrow = context === "dashboard" ? "Available when you need it" : "Available next";
  const title =
    currentPlan === "suite"
      ? "Legal depth can stay separate until it matters."
      : knownPlan
        ? "Grow from here without changing the way your team works."
        : "Start narrow, then grow into the suite.";
  const description =
    currentPlan === "suite"
      ? "Your core workspace is bundled. Eclipse Legal stays optional for teams that need matter-specific billing."
      : knownPlan
        ? `Your workspace is on ${knownPlan}. These are the quiet next steps that fit around it.`
        : "Pick the smallest useful starting point, or bundle the operating workspace from day one.";

  return (
    <section className={`rounded-md border border-border bg-white/65 ${compact ? "p-5" : "p-5 md:p-6"}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-primary dark:text-white">{eyebrow}</p>
          <h2 className={`${compact ? "mt-2 text-xl" : "mt-3 text-2xl"} font-semibold text-ink dark:text-white`}>{title}</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{description}</p>
        </div>
        <Link href="/pricing" className="inline-flex h-10 items-center gap-2 rounded-md border border-border px-3 text-sm font-semibold text-primary transition hover:bg-cream/70 dark:text-secondary">
          View pricing <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <div className={`mt-5 grid gap-3 ${compact ? "" : "lg:grid-cols-3"}`}>
        {recommendations.map((item) => {
          const Icon = item.icon;

          return (
            <Link
              key={item.plan}
              href={item.href}
              className="group rounded-md border border-border bg-cream/70 p-4 transition hover:-translate-y-0.5 hover:border-primary/50 hover:bg-white/80 hover:shadow-lg hover:shadow-primary/10 dark:text-white dark:hover:bg-white/10"
            >
              <div className="flex items-start justify-between gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-sm bg-secondary text-primary">
                  <Icon className="h-5 w-5" />
                </span>
                <ArrowRight className="h-4 w-4 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary" />
              </div>
              <h3 className="mt-4 font-semibold">{item.label}</h3>
              <p className="mt-2 text-sm leading-5 text-muted-foreground">{item.description}</p>
              {!compact ? <p className="mt-4 text-xs font-semibold uppercase text-primary dark:text-secondary">{item.reason}</p> : null}
            </Link>
          );
        })}
      </div>
    </section>
  );
}
