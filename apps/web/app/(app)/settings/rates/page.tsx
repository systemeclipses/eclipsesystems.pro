import { BadgeDollarSign } from "lucide-react";
import { EmptyState, PageHeader, Surface } from "@/components/app/page-shell";

export default function RatesSettingsPage() {
  return (
    <section className="space-y-5">
      <PageHeader eyebrow="Billing controls" title="Rates" description="Rate cards will connect billable work to invoices as the workspace fills out." />
      <Surface>
        <EmptyState icon={BadgeDollarSign} title="No custom rates yet" description="Default member, project, and matter rates will appear here once rate management is enabled." />
      </Surface>
    </section>
  );
}
