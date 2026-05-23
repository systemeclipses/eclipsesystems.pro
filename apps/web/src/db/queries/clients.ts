import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/src/db";
import { clients } from "@/src/db/schema";

export async function getClientsForUser(userId: string, organizationId: string) {
  return db
    .select({ id: clients.id, name: clients.name })
    .from(clients)
    .where(and(eq(clients.organizationId, organizationId), isNull(clients.deletedAt)));
}

export async function createClientForOrganization(organizationId: string, name: string) {
  const [client] = await db
    .insert(clients)
    .values({
      organizationId,
      name
    })
    .returning({ id: clients.id, name: clients.name });

  return client;
}
