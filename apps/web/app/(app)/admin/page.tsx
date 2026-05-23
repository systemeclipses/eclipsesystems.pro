import { ShieldCheck } from "lucide-react";
import { EmptyState, PageHeader, Surface } from "@/components/app/page-shell";

export default function AdminPage() {
  return (
    <section className="space-y-5">
      <PageHeader eyebrow="Admin controls" title="Admin" description="Owner operations, audit visibility, and advanced controls for growing teams." />
      <Surface>
        <EmptyState icon={ShieldCheck} title="Admin console is quiet" description="As audit logs, invitations, and policy controls are enabled, they will collect here." />
      </Surface>
    </section>
  );
}
