import { MessageSquareText } from "lucide-react";
import { EmptyState, PageHeader, Surface } from "@/components/app/page-shell";

export function ChatClient({ orgId }: { orgId: string }) {
  return (
    <section className="space-y-5">
      <PageHeader eyebrow="Team signal" title="Chat" description="Workspace channels and direct messages will connect here as Mission Command expands." />
      <Surface>
        <EmptyState icon={MessageSquareText} title="No channels yet" description={`Chat is ready for workspace ${orgId}. Channels, DMs, file shares, and operational messages will live here.`} />
      </Surface>
    </section>
  );
}
