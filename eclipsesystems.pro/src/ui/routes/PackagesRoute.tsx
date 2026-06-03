import { Link } from "react-router-dom";
import { packageTemplates } from "../../content/packages";
import { PackageIcon } from "@ui/components/PackageIcon";

const pricingTiers = [
  {
    name: "Package",
    description: "Buy the proven template as-is and launch with the standard workflow.",
    price: "Starting at $____"
  },
  {
    name: "Customize",
    description: "Tailor the screens, rules, roles, branding, reports, and integrations.",
    price: "Starting at $____"
  },
  {
    name: "Custom",
    description: "Commission a fully bespoke build when the workflow needs its own system.",
    price: "Contact us"
  }
] as const;

export function PackagesRoute() {
  return (
    <div className="packages-page">
      <section className="packages-hero" aria-labelledby="packages-title">
        <div>
          <p className="eyebrow">Packages & Pricing</p>
          <h2 id="packages-title">Buy it. Tailor it. Or build it.</h2>
        </div>
        <div>
          <p>
            Eclipse Systems builds custom software. These four packages are proven,
            production-grade starting points for the systems businesses ask for most often. Use one
            as-is, adapt it to your workflow, or use it as the first step toward a fully custom
            build.
          </p>
          <div className="hero-actions">
            <Link className="primary-link" to="/contact">
              Request a demo
            </Link>
            <Link className="secondary-link" to="/contact">
              Get started
            </Link>
          </div>
        </div>
      </section>

      <section className="product-flow" aria-labelledby="flagship-packages-title">
        <div className="section-heading">
          <p className="eyebrow">Flagship templates</p>
          <h2 id="flagship-packages-title">Start with the package closest to the work.</h2>
        </div>
        <div className="package-card-grid">
          {packageTemplates.map((template) => (
            <article key={template.id} className="package-card">
              <div className="package-card-top">
                <PackageIcon icon={template.icon} />
                <div>
                  <p className="eyebrow">{template.for}</p>
                  <h3>{template.name}</h3>
                  <p>{template.oneLiner}</p>
                </div>
              </div>

              <ul className="package-feature-list">
                {template.features.map((feature) => (
                  <li key={feature}>{feature}</li>
                ))}
              </ul>

              <div className="package-actions">
                <Link className="primary-link" to="/contact">
                  Request a demo
                </Link>
                <Link className="secondary-link" to="/contact">
                  Get started
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="suite-story" aria-labelledby="package-pricing-title">
        <div className="section-heading">
          <p className="eyebrow">Pricing model</p>
          <h2 id="package-pricing-title">Three ways to use each package.</h2>
        </div>
        <div className="pricing-package-grid">
          {packageTemplates.map((template) => (
            <article key={template.id} className="pricing-package-card">
              <div className="pricing-package-heading">
                <PackageIcon icon={template.icon} />
                <div>
                  <p className="eyebrow">{template.name}</p>
                  <h3>{template.oneLiner}</h3>
                </div>
              </div>
              <div className="pricing-tier-grid">
                {pricingTiers.map((tier) => (
                  <div key={`${template.id}-${tier.name}`} className="pricing-tier">
                    <p className="eyebrow">{tier.name}</p>
                    <strong>
                      {tier.price}
                      {tier.name !== "Custom" ? <>{/* TODO: set price */}</> : null}
                    </strong>
                    <p>{tier.description}</p>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="packages-cta" aria-labelledby="packages-cta-title">
        <p className="eyebrow">Not sure where to start?</p>
        <h2 id="packages-cta-title">Show us the workflow. We will show you the right path.</h2>
        <p>
          If a package fits, we will say so. If it needs tailoring, we will scope it. If your
          business needs something fully bespoke, we will build from a foundation that already
          works.
        </p>
        <Link className="primary-link" to="/contact">
          Book a call
        </Link>
      </section>
    </div>
  );
}
