import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/src/db";
import { memberships, profiles } from "@/src/db/schema";

export async function getMembersForUser(userId: string, organizationId: string) {
  return db
    .select({
      id: memberships.id,
      role: memberships.role,
      profile: {
        full_name: profiles.fullName,
        email: profiles.email
      }
    })
    .from(memberships)
    .innerJoin(profiles, eq(profiles.id, memberships.userId))
    .where(and(eq(memberships.organizationId, organizationId), isNull(memberships.deletedAt)));
}
