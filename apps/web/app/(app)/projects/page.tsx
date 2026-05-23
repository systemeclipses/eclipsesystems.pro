import { FolderKanban } from "lucide-react";
import { CreateRecordForm } from "@/components/app/app-card-form";
import { EmptyState, PageHeader, Surface } from "@/components/app/page-shell";
import { getActiveOrgId, getAuthenticatedUserId } from "@/lib/org";
import { getProjectsForUser } from "@/src/db/queries/projects";

export default async function ProjectsPage() {
  const userId = await getAuthenticatedUserId();
  const orgId = await getActiveOrgId();
  const data = await getProjectsForUser(userId, orgId);

  return (
    <section className="space-y-5">
      <PageHeader
        eyebrow="Work ledger"
        title="Projects"
        description="Use projects to group time, budgets, client work, and billable activity."
      />
      <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
        <Surface>
          {data.length ? (
            <div className="grid gap-3 md:grid-cols-2">
              {data.map((project) => (
                <div key={project.id} className="rounded-md border border-border bg-cream/70 p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-lg font-semibold">{project.name}</p>
                    <FolderKanban className="h-5 w-5 text-primary" />
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{project.code ? `Code ${project.code}` : "No project code"}</p>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState icon={FolderKanban} title="No projects yet" description="Create a project to make time entries easier to organize and bill." />
          )}
        </Surface>
        <CreateRecordForm
          endpoint="/api/projects"
          title="Add project"
          fields={[
            { name: "name", label: "Project name", placeholder: "Website redesign", required: true },
            { name: "code", label: "Code", placeholder: "WEB-001" }
          ]}
        />
      </div>
    </section>
  );
}
