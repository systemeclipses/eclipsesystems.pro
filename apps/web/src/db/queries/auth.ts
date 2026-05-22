import { eq } from "drizzle-orm";
import { db } from "@/src/db";
import { invitations } from "@/src/db/schema";

export async function getPendingInvitationTokenForEmail(email: string) {
  const [invitation] = await db
    .select({ token: invitations.token })
    .from(invitations)
    .where(eq(invitations.email, email))
    .limit(1);

  return invitation?.token ?? null;
}
