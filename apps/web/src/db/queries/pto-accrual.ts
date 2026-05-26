import { and, eq, isNull, sql } from "drizzle-orm";
import { db } from "@/src/db";
import { auditLog, memberships, ptoAccrualEvents, ptoBalances, ptoCategories, shifts } from "@/src/db/schema";

type AccrualConfig =
  | { method: "none" }
  | { method: "per_hour_worked"; rate: number; counts_overtime?: boolean; counts_pto_hours?: boolean }
  | { method: "per_pay_period"; amount: number; pro_rate_first_period?: boolean }
  | { method: "anniversary_lump_sum"; annual_amount: number; anchor: "hire_date" | "jan_1" | "custom"; custom_date?: { month: number; day: number }; pro_rate_first_year?: boolean }
  | { method: "monthly"; amount: number; day_of_month: number };

type FullAccrualRule = {
  config: AccrualConfig | { tiered: Array<{ starts_at_months: number; config: AccrualConfig }> };
  cap: number | null;
  cap_behavior: "stop_accruing" | "lose_overflow";
  carryover_rule: { type: "unlimited" } | { type: "max_carryover"; hours: number } | { type: "payout" } | { type: "forfeit" };
  carryover_anniversary: "hire_date" | "jan_1" | "fiscal_year_start";
};

function monthsBetween(start: Date | null, end: Date) {
  if (!start) return 0;
  return (end.getFullYear() - start.getFullYear()) * 12 + end.getMonth() - start.getMonth();
}

function normalizeConfig(raw: unknown, category: { capHours: string | null; carryoverRule: unknown }): FullAccrualRule {
  const value = raw && typeof raw === "object" ? raw as Record<string, unknown> : {};
  const method = String(value.method ?? value.type ?? "none");
  const config = value.tiered
    ? { tiered: value.tiered as Array<{ starts_at_months: number; config: AccrualConfig }> }
    : method === "per_hour_worked"
      ? { method, rate: Number(value.rate ?? value.hours ?? 0), counts_overtime: Boolean(value.counts_overtime), counts_pto_hours: Boolean(value.counts_pto_hours) } as AccrualConfig
      : method === "per_pay_period"
        ? { method, amount: Number(value.amount ?? value.hours ?? 0), pro_rate_first_period: Boolean(value.pro_rate_first_period) } as AccrualConfig
        : method === "monthly"
          ? { method, amount: Number(value.amount ?? value.hours ?? 0), day_of_month: Number(value.day_of_month ?? 1) } as AccrualConfig
          : method === "anniversary_lump_sum"
            ? { method, annual_amount: Number(value.annual_amount ?? value.amount ?? value.hours ?? 0), anchor: (value.anchor as "hire_date" | "jan_1" | "custom") ?? "hire_date", custom_date: value.custom_date as { month: number; day: number } | undefined, pro_rate_first_year: Boolean(value.pro_rate_first_year) } as AccrualConfig
            : { method: "none" } as AccrualConfig;

  const carryover = category.carryoverRule && typeof category.carryoverRule === "object" ? category.carryoverRule as FullAccrualRule["carryover_rule"] : { type: "unlimited" as const };
  return {
    config,
    cap: value.cap == null ? (category.capHours == null ? null : Number(category.capHours)) : Number(value.cap),
    cap_behavior: (value.cap_behavior as "stop_accruing" | "lose_overflow") ?? "stop_accruing",
    carryover_rule: carryover,
    carryover_anniversary: (value.carryover_anniversary as "hire_date" | "jan_1" | "fiscal_year_start") ?? "jan_1"
  };
}

function resolveAccrualConfig(rule: FullAccrualRule, membership: { hireDate: Date | null }) {
  if (!("tiered" in rule.config)) return rule.config;
  const months = monthsBetween(membership.hireDate, new Date());
  return rule.config.tiered
    .filter((tier) => months >= tier.starts_at_months)
    .sort((a, b) => b.starts_at_months - a.starts_at_months)[0]?.config ?? { method: "none" as const };
}

function available(balance: { accruedHours: string; usedHours: string; pendingHours: string; adjustedHours: string } | null) {
  if (!balance) return 0;
  return Number(balance.accruedHours) + Number(balance.adjustedHours) - Number(balance.usedHours) - Number(balance.pendingHours);
}

export async function applyAccrual(input: {
  organizationId: string;
  membershipId: string;
  categoryId: string;
  hours: number;
  reason: string;
  source: Record<string, unknown>;
  effectiveDate: Date;
  idempotencyKey: string;
}) {
  const [existing] = await db.select().from(ptoAccrualEvents).where(eq(ptoAccrualEvents.idempotencyKey, input.idempotencyKey)).limit(1);
  if (existing) return existing;

  const [category] = await db.select().from(ptoCategories).where(and(eq(ptoCategories.id, input.categoryId), eq(ptoCategories.organizationId, input.organizationId), isNull(ptoCategories.deletedAt))).limit(1);
  if (!category) return null;

  const [balance] = await db
    .select()
    .from(ptoBalances)
    .where(and(eq(ptoBalances.membershipId, input.membershipId), eq(ptoBalances.categoryId, input.categoryId)))
    .limit(1);

  const rule = normalizeConfig(category.accrualRule, category);
  const currentAvailable = available(balance ?? null);
  let applied = Math.max(0, input.hours);
  let lost = 0;

  if (rule.cap !== null && currentAvailable + applied > rule.cap) {
    applied = Math.max(0, rule.cap - currentAvailable);
    lost = Math.max(0, input.hours - applied);
  }

  const [event] = await db
    .insert(ptoAccrualEvents)
    .values({
      organizationId: input.organizationId,
      membershipId: input.membershipId,
      categoryId: input.categoryId,
      hoursRequested: input.hours.toFixed(3),
      hoursApplied: applied.toFixed(3),
      hoursLostToCap: lost.toFixed(3),
      reason: input.reason,
      source: input.source,
      effectiveDate: input.effectiveDate,
      idempotencyKey: input.idempotencyKey
    })
    .returning();

  await db
    .insert(ptoBalances)
    .values({
      organizationId: input.organizationId,
      membershipId: input.membershipId,
      categoryId: input.categoryId,
      accruedHours: applied.toFixed(2)
    })
    .onConflictDoUpdate({
      target: [ptoBalances.membershipId, ptoBalances.categoryId],
      set: {
        accruedHours: sql`${ptoBalances.accruedHours} + ${applied.toFixed(2)}`,
        updatedAt: new Date()
      }
    });

  await db.insert(auditLog).values({
    organizationId: input.organizationId,
    actorMembershipId: input.membershipId,
    action: "PTO_ACCRUED",
    targetType: "pto_balance",
    targetId: `${input.membershipId}:${input.categoryId}`,
    after: { hours: applied, lost, source: input.source, reason: input.reason }
  });

  return event;
}

export async function runPerHourAccrualsForShift(input: { organizationId: string; membershipId: string; shiftId: string; endedAt: Date }) {
  const [shift] = await db.select().from(shifts).where(eq(shifts.id, input.shiftId)).limit(1);
  const [membership] = await db.select().from(memberships).where(eq(memberships.id, input.membershipId)).limit(1);
  if (!shift || !membership) return { processed: 0, skipped: 0, errors: 0 };

  const durationHours = Math.max(0, (input.endedAt.getTime() - shift.startedAt.getTime()) / 3_600_000);
  const categories = await db.select().from(ptoCategories).where(and(eq(ptoCategories.organizationId, input.organizationId), isNull(ptoCategories.deletedAt)));
  const stats = { processed: 0, skipped: 0, errors: 0 };

  for (const category of categories) {
    try {
      const rule = normalizeConfig(category.accrualRule, category);
      const config = resolveAccrualConfig(rule, membership);
      if (config.method !== "per_hour_worked" || config.rate <= 0) {
        stats.skipped++;
        continue;
      }

      await applyAccrual({
        organizationId: input.organizationId,
        membershipId: input.membershipId,
        categoryId: category.id,
        hours: durationHours * config.rate,
        reason: `Per-hour accrual: ${durationHours.toFixed(2)}h x ${config.rate}/hr`,
        source: { type: "per_hour_worked", shift_id: input.shiftId },
        effectiveDate: input.endedAt,
        idempotencyKey: `per_hour:${input.shiftId}:${category.id}`
      });
      stats.processed++;
    } catch {
      stats.errors++;
    }
  }

  return stats;
}

function lastDayOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

function anchorDate(config: Extract<AccrualConfig, { method: "anniversary_lump_sum" }>, hireDate: Date | null, year: number) {
  if (config.anchor === "jan_1") return new Date(year, 0, 1);
  if (config.anchor === "custom" && config.custom_date) return new Date(year, config.custom_date.month - 1, config.custom_date.day);
  const base = hireDate ?? new Date(year, 0, 1);
  return new Date(year, base.getMonth(), base.getDate());
}

export async function runScheduledAccrual(kind: "monthly" | "anniversary", today = new Date()) {
  const categories = await db.select().from(ptoCategories).where(isNull(ptoCategories.deletedAt));
  const stats = { processed: 0, skipped: 0, errors: 0 };

  for (const category of categories) {
    const members = await db.select().from(memberships).where(and(eq(memberships.organizationId, category.organizationId), isNull(memberships.deletedAt)));
    for (const membership of members) {
      try {
        const rule = normalizeConfig(category.accrualRule, category);
        const config = resolveAccrualConfig(rule, membership);
        if (kind === "monthly") {
          if (config.method !== "monthly") {
            stats.skipped++;
            continue;
          }
          const targetDay = Math.min(config.day_of_month, lastDayOfMonth(today));
          if (today.getDate() !== targetDay) {
            stats.skipped++;
            continue;
          }
          await applyAccrual({
            organizationId: category.organizationId,
            membershipId: membership.id,
            categoryId: category.id,
            hours: config.amount,
            reason: `Monthly accrual for ${today.toISOString().slice(0, 7)}`,
            source: { type: "monthly", month: today.toISOString().slice(0, 7) },
            effectiveDate: today,
            idempotencyKey: `monthly:${today.toISOString().slice(0, 7)}:${membership.id}:${category.id}`
          });
          stats.processed++;
          continue;
        }

        if (config.method !== "anniversary_lump_sum") {
          stats.skipped++;
          continue;
        }
        const anchor = anchorDate(config, membership.hireDate, today.getFullYear());
        if (anchor.toISOString().slice(5, 10) !== today.toISOString().slice(5, 10)) {
          stats.skipped++;
          continue;
        }
        await applyAccrual({
          organizationId: category.organizationId,
          membershipId: membership.id,
          categoryId: category.id,
          hours: config.annual_amount,
          reason: `Annual grant (${config.anchor}): ${config.annual_amount}h`,
          source: { type: "anniversary", year: today.getFullYear() },
          effectiveDate: today,
          idempotencyKey: `anniversary:${today.getFullYear()}:${membership.id}:${category.id}`
        });
        stats.processed++;
      } catch {
        stats.errors++;
      }
    }
  }

  return stats;
}

export async function runCarryover(today = new Date()) {
  const balances = await db.select().from(ptoBalances);
  const stats = { processed: 0, skipped: 0, errors: 0 };
  const isJan1 = today.getMonth() === 0 && today.getDate() === 1;
  if (!isJan1) return { ...stats, skipped: balances.length };

  for (const balance of balances) {
    try {
      const [category] = await db.select().from(ptoCategories).where(eq(ptoCategories.id, balance.categoryId)).limit(1);
      if (!category) {
        stats.skipped++;
        continue;
      }
      const rule = normalizeConfig(category.accrualRule, category);
      const current = available(balance);
      let deduction = 0;
      if (rule.carryover_rule.type === "max_carryover") deduction = Math.max(0, current - rule.carryover_rule.hours);
      if (rule.carryover_rule.type === "forfeit" || rule.carryover_rule.type === "payout") deduction = Math.max(0, current);
      if (deduction <= 0) {
        stats.skipped++;
        continue;
      }
      await db.update(ptoBalances).set({ adjustedHours: sql`${ptoBalances.adjustedHours} - ${deduction.toFixed(2)}`, updatedAt: new Date() }).where(and(eq(ptoBalances.membershipId, balance.membershipId), eq(ptoBalances.categoryId, balance.categoryId)));
      await db.insert(auditLog).values({
        organizationId: balance.organizationId,
        actorMembershipId: balance.membershipId,
        action: "PTO_CARRYOVER_APPLIED",
        targetType: "pto_balance",
        targetId: `${balance.membershipId}:${balance.categoryId}`,
        after: { deduction, rule: rule.carryover_rule, date: today.toISOString() }
      });
      stats.processed++;
    } catch {
      stats.errors++;
    }
  }
  return stats;
}
