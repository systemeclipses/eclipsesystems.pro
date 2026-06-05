import { UsersRound } from "lucide-react";
import { PackageDashboard } from "@/components/app/package-dashboard";
import { getPackageDefinition } from "@/lib/packages";

export default function ClientPortalPage() {
  const pkg = getPackageDefinition("client-portal");
  if (!pkg) return null;

  return (
    <PackageDashboard
      eyebrow={pkg.name}
      title={pkg.tagline}
      promise={pkg.description}
      audience={pkg.audience}
      icon={UsersRound}
      navItems={pkg.navItems}
      primaryAction="Open portal"
      primaryHref="/client-portal#features"
      metrics={pkg.metrics}
      features={pkg.features}
      worksWith={pkg.worksWith}
    />
  );
}
