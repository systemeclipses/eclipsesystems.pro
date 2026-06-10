import { Store } from "lucide-react";
import { PackageDashboard } from "@/components/app/package-dashboard";
import { getPackageDefinition } from "@/lib/packages";

export default function StorefrontPage() {
  const pkg = getPackageDefinition("storefront");
  if (!pkg) return null;

  return (
    <PackageDashboard
      eyebrow={pkg.name}
      title={pkg.tagline}
      promise={pkg.description}
      audience={pkg.audience}
      icon={Store}
      navItems={pkg.navItems}
      primaryAction="Open storefront"
      primaryHref="/storefront#features"
      metrics={pkg.metrics}
      features={pkg.features}
    />
  );
}
