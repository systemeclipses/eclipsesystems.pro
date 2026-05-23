import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/src/db";
import { projects } from "@/src/db/schema";

export async function getProjectsForUser(userId: string, organizationId: string) {
  return db
    .select({ id: projects.id, name: projects.name, code: projects.code })
    .from(projects)
    .where(and(eq(projects.organizationId, organizationId), isNull(projects.deletedAt)));
}

export async function createProjectForOrganization(input: { organizationId: string; name: string; code?: string | null }) {
  const [project] = await db
    .insert(projects)
    .values({
      organizationId: input.organizationId,
      name: input.name,
      code: input.code || null
    })
    .returning({ id: projects.id, name: projects.name, code: projects.code });

  return project;
}
