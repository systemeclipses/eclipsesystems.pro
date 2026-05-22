import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/src/db";
import { clients } from "@/src/db/schema";

export async function getClientsForUser(userId: string, organizationId: string) {
  return db
    .select({ name: clients.name })
    .from(clients)
    .where(and(eq(clients.organizationId, organizationId), isNull(clients.deletedAt)));
}
