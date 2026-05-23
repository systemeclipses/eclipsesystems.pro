import { desc, eq, isNull, and } from "drizzle-orm";
import { db } from "@/src/db";
import { invoices } from "@/src/db/schema";

export async function getInvoicesForOrganization(organizationId: string) {
  return db
    .select({
      id: invoices.id,
      number: invoices.number,
      total: invoices.total,
      status: invoices.status
    })
    .from(invoices)
    .where(and(eq(invoices.organizationId, organizationId), isNull(invoices.deletedAt)))
    .orderBy(desc(invoices.id));
}
