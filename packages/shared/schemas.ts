import { z } from "zod";

export const planCodeSchema = z.enum(["timekeeping", "mission_command", "eclipse", "suite", "legal_addon"]);
export const basePlanCodeSchema = z.enum(["timekeeping", "mission_command", "eclipse", "suite"]);
export const addOnPlanCodeSchema = z.enum(["legal_addon"]);
export const billingIntervalSchema = z.enum(["month", "year"]);
export const memberRoleSchema = z.enum(["owner", "admin", "manager", "member"]);

export const checkoutSessionSchema = z.object({
  organization_id: z.string().uuid(),
  plan_code: basePlanCodeSchema,
  billing_interval: billingIntervalSchema,
  seats: z.number().int().positive()
});

export const inviteMemberSchema = z.object({
  organization_id: z.string().uuid(),
  email: z.string().email(),
  role: memberRoleSchema.default("member"),
  manager_id: z.string().uuid().nullable().optional()
});

export const timeEntryInputSchema = z.object({
  organization_id: z.string().uuid(),
  project_id: z.string().uuid().nullable().optional(),
  task_id: z.string().uuid().nullable().optional(),
  matter_id: z.string().uuid().nullable().optional(),
  description: z.string().max(4000).nullable().optional(),
  started_at: z.string().datetime(),
  ended_at: z.string().datetime().nullable().optional(),
  billable: z.boolean().default(true)
});
