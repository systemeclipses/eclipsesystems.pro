import { Link } from "react-router-dom";
import { ProductCarousel } from "@ui/components/ProductCarousel";
import { SoftwarePreview } from "@ui/components/SoftwarePreview";

const products = [
  {
    kind: "timekeeping",
    name: "Eclipse Timekeeping",
    kicker: "Time capture",
    summary: "Live timers, manual entries, approvals, timesheets, and reporting that managers can trust before payroll or billing moves.",
    href: "/features/timekeeping"
  },
  {
    kind: "mission",
    name: "Mission Command by Eclipse",
    kicker: "Team operations",
    summary: "A Connecteam-style hub for team chat, schedule visibility, shift drops, swaps, claims, and coverage approvals.",
    href: "/features/mission-command"
  },
  {
    kind: "eclipse",
    name: "Eclipse",
    kicker: "Project billing",
    summary: "Clients, projects, tasks, billable rates, draft invoices, PDF exports, and payment links tied directly to approved work.",
    href: "/features/project-billing"
  },
  {
    kind: "legal",
    name: "Eclipse Legal Add-on",
    kicker: "Law firm controls",
    summary: "Matter-aware timekeeping with UTBMS, LEDES export, trust ledger workflows, conflict checks, and custom legal rates.",
    href: "/features/legal-add-on"
  }
] as const;

const proofPoints = [
  ["Less admin drag", "Approvals, timesheets, shifts, and billing context stay in one operational record."],
  ["Cleaner handoffs", "Managers see exceptions before they reach payroll, invoices, or matter billing."],
  ["Right-sized suite", "Legal controls stay optional, so general operations teams keep a simpler workspace."]
] as const;

export function HomeRoute() {
  return (
    <div className="home-page">
      <section className="home-hero" aria-labelledby="home-title">
        <div className="home-hero-copy">
          <p className="eyebrow">Eclipse Systems</p>
          <h2 id="home-title">One calm workspace for time, teams, projects, and billing.</h2>
          <p>
            Eclipse Suite bundles Timekeeping, Mission Command, and Eclipse project billing. Legal
            stays separate as an add-on, so non-legal teams never pay complexity tax for law-firm
            workflows.
          </p>
          <div className="hero-actions">
            <Link className="primary-link" to="/contact">
              Schedule workflow audit
            </Link>
            <a className="secondary-link" href="mailto:hello@eclipsesystems.pro?subject=Eclipse%20Systems%20pricing">
              Ask for pricing
            </a>
            <a className="text-link" href="#products">
              See products
            </a>
          </div>
          <dl className="hero-metrics" aria-label="Eclipse Suite highlights">
            <div>
              <dt>4</dt>
              <dd>connected products</dd>
            </div>
            <div>
              <dt>1</dt>
              <dd>shared workflow</dd>
            </div>
            <div>
              <dt>0</dt>
              <dd>spreadsheet handoffs</dd>
            </div>
          </dl>
        </div>
        <div className="hero-preview-stack" aria-hidden="true">
          <SoftwarePreview kind="suite" title="Eclipse Suite" />
          <div className="mini-preview-row">
            <SoftwarePreview kind="mission" title="Mission Command by Eclipse" />
            <SoftwarePreview kind="legal" title="Eclipse Legal Add-on" />
          </div>
        </div>
      </section>

      <ProductCarousel />

      <section id="products" className="product-flow" aria-labelledby="products-title">
        <div className="section-heading">
          <p className="eyebrow">Product family</p>
          <h2 id="products-title">Each product has a job. Suite pulls the daily work together.</h2>
        </div>
        <div className="product-grid">
          {products.map((product) => (
            <article key={product.name} className="product-card">
              <div>
                <p className="eyebrow">{product.kicker}</p>
                <h3>{product.name}</h3>
                <p>{product.summary}</p>
                <Link className="text-link" to={product.href}>
                  Explore {product.kicker.toLowerCase()}
                </Link>
              </div>
              <SoftwarePreview kind={product.kind} title={product.name} />
            </article>
          ))}
        </div>
      </section>

      <section className="suite-story" aria-labelledby="suite-title">
        <div className="section-heading">
          <p className="eyebrow">Intentional flow</p>
          <h2 id="suite-title">From clock-in to invoice without stitching tools together.</h2>
        </div>
        <div className="flow-steps">
          {[
            ["Capture", "Employees track work, shifts, and notes while the day is happening."],
            ["Approve", "Managers review time, coverage, and exceptions before records harden."],
            ["Bill", "Approved work becomes project invoices or legal-ready matter records."]
          ].map(([title, body], index) => (
            <article key={title} className="flow-step">
              <span>{String(index + 1).padStart(2, "0")}</span>
              <h3>{title}</h3>
              <p>{body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="market-proof" aria-labelledby="proof-title">
        <div className="section-heading">
          <p className="eyebrow">Why teams switch</p>
          <h2 id="proof-title">The value is not another app. It is fewer operational leaks.</h2>
        </div>
        <div className="proof-grid">
          {proofPoints.map(([title, body]) => (
            <article key={title} className="proof-item">
              <h3>{title}</h3>
              <p>{body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="contact-band" aria-labelledby="contact-band-title">
        <div>
          <p className="eyebrow">Next step</p>
          <h2 id="contact-band-title">Bring a messy workflow. Eclipse will map the clean path.</h2>
        </div>
        <Link className="primary-link" to="/contact">
          Start a conversation
        </Link>
      </section>
    </div>
  );
}
