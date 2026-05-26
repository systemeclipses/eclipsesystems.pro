import { and, desc, eq, isNull, or } from "drizzle-orm";
import { db } from "@/src/db";
import { auditLog, ptoApprovalTemplates, ptoCoverageRules, ptoDecisionReactions, ptoManagerInsights, ptoRequestMessages } from "@/src/db/schema";

export async function getPtoManagerV2Dashboard(organizationId: string, membershipId: string | null) {
  const now = new Date();
  const [templates, coverageRules, insights, recentMessages, reactions] = await Promise.all([
    db.select().from(ptoApprovalTemplates).where(and(eq(ptoApprovalTemplates.organizationId, organizationId), isNull(ptoApprovalTemplates.deletedAt))).orderBy(desc(ptoApprovalTemplates.createdAt)).limit(6),
    db.select().from(ptoCoverageRules).where(and(eq(ptoCoverageRules.organizationId, organizationId), isNull(ptoCoverageRules.deletedAt))).orderBy(desc(ptoCoverageRules.createdAt)).limit(6),
    db
      .select()
      .from(ptoManagerInsights)
      .where(and(
        eq(ptoManagerInsights.organizationId, organizationId),
        isNull(ptoManagerInsights.dismissedAt),
        or(isNull(ptoManagerInsights.membershipId), membershipId ? eq(ptoManagerInsights.membershipId, membershipId) : isNull(ptoManagerInsights.membershipId))
      ))
      .orderBy(desc(ptoManagerInsights.createdAt))
      .limit(4),
    db.select().from(ptoRequestMessages).where(eq(ptoRequestMessages.organizationId, organizationId)).orderBy(desc(ptoRequestMessages.createdAt)).limit(8),
    db.select().from(ptoDecisionReactions).where(eq(ptoDecisionReactions.organizationId, organizationId)).orderBy(desc(ptoDecisionReactions.createdAt)).limit(8)
  ]);

  const activeCoverageRules = coverageRules.filter((rule) => rule.enabled);
  return {
    templates,
    coverageRules,
    insights,
    recentMessages,
    reactions,
    stats: {
      activeTemplates: templates.filter((template) => template.enabled).length,
      coverageGapsThisMonth: activeCoverageRules.length,
      messagesLast30Days: recentMessages.filter((message) => now.getTime() - message.createdAt.getTime() < 30 * 86_400_000).length,
      reactionsLast30Days: reactions.filter((reaction) => now.getTime() - reaction.createdAt.getTime() < 30 * 86_400_000).length
    }
  };
}

export async function createPtoRequestMessage(input: { organizationId: string; requestId: string; senderMembershipId: string; body: string }) {
  const [message] = await db.insert(ptoRequestMessages).values(input).returning();
  await db.insert(auditLog).values({
    organizationId: input.organizationId,
    actorMembershipId: input.senderMembershipId,
    action: "pto.message_sent",
    targetType: "pto_request",
    targetId: input.requestId,
    after: { messageId: message.id, body: input.body }
  });
  return message;
}

export async function createPtoDecisionReaction(input: { organizationId: string; requestId: string; actorMembershipId: string; reaction?: string | null; message?: string | null }) {
  const [reaction] = await db.insert(ptoDecisionReactions).values({
    organizationId: input.organizationId,
    requestId: input.requestId,
    actorMembershipId: input.actorMembershipId,
    reaction: input.reaction || null,
    message: input.message || null
  }).returning();
  await db.insert(auditLog).values({
    organizationId: input.organizationId,
    actorMembershipId: input.actorMembershipId,
    action: "pto.decision_reaction_added",
    targetType: "pto_request",
    targetId: input.requestId,
    after: reaction
  });
  return reaction;
}
