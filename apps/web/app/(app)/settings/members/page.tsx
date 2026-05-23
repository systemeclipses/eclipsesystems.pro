import { UsersRound } from "lucide-react";
import { EmptyState, PageHeader, Surface } from "@/components/app/page-shell";
import { getActiveOrgId, getAuthenticatedUserId } from "@/lib/org";
import { getMembersForUser } from "@/src/db/queries/members";

export default async function MembersSettingsPage() {
  const userId = await getAuthenticatedUserId();
  const orgId = await getActiveOrgId();
  const data = await getMembersForUser(userId, orgId);
  return (
    <section className="space-y-5">
      <PageHeader eyebrow="Workspace access" title="Members" description="See who belongs to this workspace and how they are assigned." />
      <Surface>
        {data.length ? (
          <div className="grid gap-3">
            {data.map((member) => (
              <div key={member.id} className="flex items-center justify-between rounded-md border border-border bg-cream/70 p-4">
                <div>
                  <p className="font-semibold">{member.profile.full_name || member.profile.email}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{member.profile.email}</p>
                </div>
                <span className="rounded-sm bg-primary px-2 py-1 text-xs font-semibold text-white">{member.role}</span>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState icon={UsersRound} title="No members found" description="Membership records will appear here as users join the workspace." />
        )}
      </Surface>
    </section>
  );
}
