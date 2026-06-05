import { Building2 } from "lucide-react";
import { PackageDashboard } from "@/components/app/package-dashboard";
import { getPackageDefinition } from "@/lib/packages";

export default function OperationsPage() {
  const pkg = getPackageDefinition("operations-hub");
  if (!pkg) return null;

  return (
    <PackageDashboard
      eyebrow={pkg.name}
      title={pkg.tagline}
      promise={pkg.description}
      audience={pkg.audience}
      icon={Building2}
      navItems={pkg.navItems}
      primaryAction="Open operations"
      primaryHref="/operations#features"
      metrics={pkg.metrics}
      features={pkg.features}
      moduleNote={pkg.moduleNote}
      worksWith={pkg.worksWith}
    />
  );
}
