import { Link, useLocation, useParams } from "react-router-dom";

type RouteCopy = {
  eyebrow: string;
  title: string;
  body: string;
  items: string[];
  primaryLabel?: string;
  primaryHref?: string;
  secondaryLabel?: string;
  secondaryTo?: string;
};

const directCopy: Record<string, RouteCopy> = {
  "/pricing": {
    eyebrow: "Pricing",
    title: "Packages that match the way your team already works.",
    body: "Start with timekeeping, add Mission Command when scheduling and coverage need structure, and layer in project billing or legal controls only when the workflow calls for it.",
    items: ["Timekeeping foundation", "Mission Command operations", "Project billing suite", "Legal add-on"],
    primaryLabel: "Request pricing",
    primaryHref: "mailto:hello@eclipsesystems.pro?subject=Eclipse%20Systems%20pricing"
  },
  "/features": {
    eyebrow: "Features",
    title: "The operational moments Eclipse is built to clean up.",
    body: "Eclipse focuses on the records that matter after the work is done: approved time, covered shifts, billable projects, and legal-ready matter details.",
    items: ["Live timers", "Approval queues", "Shift coverage", "Invoice handoff"],
    secondaryLabel: "Explore industries",
    secondaryTo: "/industries"
  },
  "/industries": {
    eyebrow: "Industries",
    title: "For teams where time and coverage turn into revenue.",
    body: "Eclipse fits service businesses that need clean operational records without stitching together a timer, scheduler, chat tool, invoice tool, and legal billing add-on.",
    items: ["Field services", "Professional services", "Operations teams", "Law firms"],
    secondaryLabel: "See features",
    secondaryTo: "/features"
  },
  "/locations": {
    eyebrow: "Locations",
    title: "Built for Alabama operators, ready for distributed teams.",
    body: "Eclipse Systems is based around practical operations workflows for teams that need less admin drag and cleaner handoffs.",
    items: ["Birmingham", "Huntsville", "Mobile", "Montgomery"],
    primaryLabel: "Contact Eclipse",
    primaryHref: "mailto:hello@eclipsesystems.pro?subject=Eclipse%20Systems%20local%20workflow"
  },
  "/utbms": {
    eyebrow: "Legal add-on",
    title: "Matter billing controls without forcing legal complexity on everyone.",
    body: "Law firms can layer UTBMS, LEDES, trust ledger context, and matter-aware rates on top of the same operational timekeeping foundation.",
    items: ["UTBMS codes", "LEDES export", "Trust context", "Matter rates"],
    secondaryLabel: "Review legal controls",
    secondaryTo: "/features/legal-add-on"
  },
  "/glossary": {
    eyebrow: "Glossary",
    title: "Plain-language operations and billing terms.",
    body: "A growing reference for teams tightening timekeeping, approvals, shift coverage, project billing, and legal workflows.",
    items: ["Billable hours", "Approvals", "LEDES", "Shift swaps"],
    secondaryLabel: "Read guides",
    secondaryTo: "/guides"
  },
  "/blog": {
    eyebrow: "Notes",
    title: "Practical ideas for running cleaner operations.",
    body: "Short notes on reducing administrative handoffs, preparing clean invoices, and making approval workflows easier for managers.",
    items: ["Operations hygiene", "Billing readiness", "Scheduling policy", "Legal timekeeping"],
    secondaryLabel: "Read guides",
    secondaryTo: "/guides"
  },
  "/guides": {
    eyebrow: "Guides",
    title: "Workflow guides for teams that need cleaner records.",
    body: "Use these topics to frame the first audit: where time starts, who approves it, when exceptions are caught, and how records become invoices.",
    items: ["Time approval basics", "Shift swap policy", "Billing readiness", "Legal time hygiene"],
    primaryLabel: "Plan an audit",
    primaryHref: "mailto:hello@eclipsesystems.pro?subject=Eclipse%20Systems%20workflow%20audit"
  }
};

const detailCopy: Record<string, RouteCopy> = {
  Feature: {
    eyebrow: "Feature",
    title: "A cleaner workflow for {name}.",
    body: "This Eclipse capability is designed to reduce handoffs, expose exceptions earlier, and give managers records they can trust.",
    items: ["Cleaner capture", "Manager review", "Audit trail", "Billing-ready output"]
  },
  Industry: {
    eyebrow: "Industry",
    title: "Operations software for {name}.",
    body: "Eclipse helps teams keep daily work, approvals, coverage, and billing aligned without adding unnecessary software sprawl.",
    items: ["Team visibility", "Clean approvals", "Project records", "Revenue handoff"]
  },
  Location: {
    eyebrow: "Local workflow",
    title: "Eclipse Systems for {name} teams.",
    body: "Local and distributed teams can use Eclipse to tighten timekeeping, scheduling, project billing, and legal workflows.",
    items: ["Operational audit", "Workflow setup", "Manager adoption", "Ongoing cleanup"]
  },
  "UTBMS Code": {
    eyebrow: "UTBMS",
    title: "UTBMS support for {name}.",
    body: "Matter-aware timekeeping helps legal teams connect daily work to cleaner billing records and export-ready invoice detail.",
    items: ["Matter mapping", "Code validation", "LEDES context", "Rate controls"]
  },
  "Glossary Term": {
    eyebrow: "Glossary",
    title: "{name}, explained for operations teams.",
    body: "Eclipse keeps important workflow terms tied to the daily records managers and billing teams actually use.",
    items: ["Definition", "Workflow impact", "Review points", "Billing context"]
  },
  Plan: {
    eyebrow: "Plan",
    title: "{name} package planning.",
    body: "Pick the smallest useful Eclipse package first, then add operational or legal controls when they remove real admin work.",
    items: ["Core needs", "Approval flow", "Integrations", "Rollout plan"]
  },
  Comparison: {
    eyebrow: "Comparison",
    title: "Eclipse compared with {name}.",
    body: "Eclipse is positioned for teams that want time, operations, project billing, and optional legal controls in one calmer workflow.",
    items: ["Fewer handoffs", "Shared records", "Cleaner approvals", "Optional legal controls"]
  },
  Alternative: {
    eyebrow: "Alternative",
    title: "A focused alternative to {name}.",
    body: "Eclipse is for teams that care less about another dashboard and more about making daily work easier to approve, bill, and trust.",
    items: ["Operational clarity", "Right-sized modules", "Billing readiness", "Manager-friendly flow"]
  }
};

function humanize(value?: string) {
  if (!value) return "this workflow";
  return value
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function buildDetailCopy(title: string, name: string): RouteCopy {
  const copy = detailCopy[title];
  if (!copy) {
    return {
      eyebrow: "Eclipse Systems",
      title: `${name} workflow support.`,
      body: "This page is part of the Eclipse Systems site map and is ready for a focused content pass.",
      items: ["Timekeeping", "Operations", "Billing", "Legal controls"]
    };
  }

  return {
    ...copy,
    title: copy.title.replace("{name}", name)
  };
}

export function StaticRoute({ title }: { title: string }) {
  const location = useLocation();
  const params = useParams();
  const slug = Object.values(params)[0];
  const name = humanize(slug);
  const copy = directCopy[location.pathname] ?? buildDetailCopy(title, name);
  const primaryLabel = copy.primaryLabel ?? "Start a workflow audit";
  const primaryHref =
    copy.primaryHref ?? "mailto:hello@eclipsesystems.pro?subject=Eclipse%20Systems%20workflow%20audit";
  const secondaryLabel = copy.secondaryLabel ?? "Return home";
  const secondaryTo = copy.secondaryTo ?? "/";

  return (
    <section className="static-route" aria-labelledby="route-title">
      <p className="eyebrow">{copy.eyebrow}</p>
      <h2 id="route-title">{copy.title}</h2>
      <p>{copy.body}</p>
      <ul className="static-list">
        {copy.items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
      <div className="contact-options">
        <a className="primary-link" href={primaryHref}>
          {primaryLabel}
        </a>
        <Link className="secondary-link" to={secondaryTo}>
          {secondaryLabel}
        </Link>
      </div>
    </section>
  );
}

export function NotFoundRoute() {
  return (
    <section className="static-route" aria-labelledby="missing-title">
      <p className="eyebrow">Not found</p>
      <h2 id="missing-title">This Eclipse Systems page is not live.</h2>
      <p>Use the site navigation to return to a working page, or email Eclipse Systems directly.</p>
      <div className="contact-options">
        <Link className="secondary-link" to="/">
          Return home
        </Link>
        <a className="primary-link" href="mailto:hello@eclipsesystems.pro?subject=Eclipse%20Systems%20question">
          Email Eclipse Systems
        </a>
      </div>
    </section>
  );
}
