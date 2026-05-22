import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/src/db";
import { timeEntries } from "@/src/db/schema";

export async function getRunningTimerCountForUser(userId: string, organizationId: string) {
  const rows = await db
    .select({ id: timeEntries.id })
    .from(timeEntries)
    .where(
      and(
        eq(timeEntries.organizationId, organizationId),
        isNull(timeEntries.endedAt),
        isNull(timeEntries.deletedAt)
      )
    );

  return rows.length;
}
