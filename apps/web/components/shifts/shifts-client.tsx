import { CalendarClock } from "lucide-react";
import { EmptyState, PageHeader, Surface } from "@/components/app/page-shell";

export function ShiftsClient({ orgId }: { orgId: string }) {
  return (
    <section className="space-y-5">
      <PageHeader eyebrow="Mission Command" title="Shifts" description="Schedule coverage, swaps, and marketplace posts will collect here for operators." />
      <Surface>
        <EmptyState icon={CalendarClock} title="No shifts scheduled" description={`Workspace ${orgId} has no shift records yet. Schedule views and swap workflows will appear here when enabled.`} />
      </Surface>
    </section>
  );
}
