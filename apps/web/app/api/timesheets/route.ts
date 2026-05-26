import { NextResponse } from "next/server";
import { getActiveOrgId } from "@/lib/org";
import { getTeamTimesheets } from "@/src/db/queries/timekeeping";
import { getTimekeepingSettings } from "@/src/db/queries/timekeeping-settings";

export async function GET() {
  const organizationId = await getActiveOrgId();
  const settings = await getTimekeepingSettings(organizationId);
  const timesheets = await getTeamTimesheets({ organizationId, settings });
  return NextResponse.json(timesheets);
}
