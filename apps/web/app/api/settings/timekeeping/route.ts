import { NextResponse } from "next/server";
import { getActiveOrgId, getAuthenticatedUserId } from "@/lib/org";
import { getMembershipIdForUser } from "@/src/db/queries/organizations";
import { updatePtoCategoryBalancePolicy } from "@/src/db/queries/timekeeping";
import { defaultTimekeepingSettings, saveTimekeepingSettings, type TimekeepingSettings } from "@/src/db/queries/timekeeping-settings";

function numberValue(value: unknown, fallback: number) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function normalizeSettings(value: unknown): TimekeepingSettings {
  const settings = value && typeof value === "object" ? value as Partial<TimekeepingSettings> : {};
  const payRules = settings.payRules ?? defaultTimekeepingSettings.payRules;
  const visibility = settings.visibility ?? defaultTimekeepingSettings.visibility;

  return {
    ...defaultTimekeepingSettings,
    ...settings,
    payRules: {
      ...defaultTimekeepingSettings.payRules,
      ...payRules,
      standardWorkweekHours: numberValue(payRules.standardWorkweekHours, 40),
      overtimeThreshold: numberValue(payRules.overtimeThreshold, 40),
      overtimeMultiplier: numberValue(payRules.overtimeMultiplier, 1.5),
      doubleTimeThreshold: numberValue(payRules.doubleTimeThreshold, 12),
      doubleTimeMultiplier: numberValue(payRules.doubleTimeMultiplier, 2),
      autoClockOut: {
        ...defaultTimekeepingSettings.payRules.autoClockOut,
        ...payRules.autoClockOut,
        thresholdHours: numberValue(payRules.autoClockOut?.thresholdHours, 16)
      }
    },
    visibility: { ...defaultTimekeepingSettings.visibility, ...visibility },
    notifications: { ...defaultTimekeepingSettings.notifications, ...settings.notifications }
  };
}

export async function PUT(request: Request) {
  const userId = await getAuthenticatedUserId();
  const organizationId = await getActiveOrgId();
  const body = await request.json().catch(() => ({}));
  const settings = normalizeSettings(body.settings);
  const saved = await saveTimekeepingSettings({ organizationId, actorUserId: userId, settings });
  return NextResponse.json(saved);
}

export async function PATCH(request: Request) {
  const userId = await getAuthenticatedUserId();
  const organizationId = await getActiveOrgId();
  const actorMembershipId = await getMembershipIdForUser(userId, organizationId);
  const body = await request.json().catch(() => ({}));

  if (body.action !== "update_pto_category_balance_policy" || typeof body.categoryId !== "string" || typeof body.negativeBalanceAllowed !== "boolean") {
    return NextResponse.json({ error: "Invalid timekeeping settings update." }, { status: 400 });
  }

  try {
    const category = await updatePtoCategoryBalancePolicy({
      organizationId,
      actorMembershipId,
      categoryId: body.categoryId,
      negativeBalanceAllowed: body.negativeBalanceAllowed
    });
    return NextResponse.json(category);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to update PTO category." }, { status: 400 });
  }
}
