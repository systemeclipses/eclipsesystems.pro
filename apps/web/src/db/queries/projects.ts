import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/src/db";
import { projects } from "@/src/db/schema";

export async function getProjectsForUser(userId: string, organizationId: string) {
  return db
    .select({ id: projects.id, name: projects.name, code: projects.code })
    .from(projects)
    .where(and(eq(projects.organizationId, organizationId), isNull(projects.deletedAt)));
}
