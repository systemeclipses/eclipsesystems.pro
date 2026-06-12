import { NextResponse } from "next/server";
import { claimPersistedPortalShift, createPersistedPortalShift, listPersistedPortalShifts, updatePersistedPortalShift } from "@/src/db/queries/operations-portal-scheduling";

export async function GET() {
  try {
    const data = await listPersistedPortalShifts();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to load scheduling data." }, { status: 401 });
  }
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  if (typeof body.day !== "string" || typeof body.time !== "string" || typeof body.site !== "string") {
    return NextResponse.json({ error: "day, time, and site are required." }, { status: 400 });
  }

  try {
    const shift = await createPersistedPortalShift({
      employeeId: typeof body.employeeId === "string" && body.employeeId ? body.employeeId : undefined,
      day: body.day,
      time: body.time,
      site: body.site,
      status: body.status === "open" || body.status === "swap_requested" ? body.status : "published"
    });
    return NextResponse.json({ shift });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to create shift." }, { status: 400 });
  }
}

export async function PATCH(request: Request) {
  const body = await request.json().catch(() => ({}));
  if (typeof body.shiftId !== "string") {
    return NextResponse.json({ error: "shiftId is required." }, { status: 400 });
  }

  try {
    const hasEdits = typeof body.day === "string" || typeof body.time === "string" || typeof body.site === "string" || typeof body.status === "string" || body.employeeId === null;
    if (!hasEdits && typeof body.employeeId !== "string") {
      return NextResponse.json({ error: "employeeId is required." }, { status: 400 });
    }
    const shift = hasEdits
      ? await updatePersistedPortalShift({
          shiftId: body.shiftId,
          employeeId: typeof body.employeeId === "string" ? body.employeeId : body.employeeId === null ? null : undefined,
          day: typeof body.day === "string" ? body.day : undefined,
          time: typeof body.time === "string" ? body.time : undefined,
          site: typeof body.site === "string" ? body.site : undefined,
          status: body.status === "open" || body.status === "swap_requested" || body.status === "published" ? body.status : undefined
        })
      : await claimPersistedPortalShift({ shiftId: body.shiftId, employeeId: body.employeeId });
    return NextResponse.json({ shift });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to update shift." }, { status: 400 });
  }
}
