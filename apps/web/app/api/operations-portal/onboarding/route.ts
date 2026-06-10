import { NextResponse } from "next/server";
import { completeOnboardingInstance, getOnboardingOverview, saveOnboardingTask, type OnboardingTaskType } from "@/src/db/queries/operations-onboarding";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  try {
    const overview = await getOnboardingOverview(searchParams.get("employeeId") ?? "employee-nina");
    return NextResponse.json(overview);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to load onboarding." }, { status: 400 });
  }
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  try {
    if (body.action === "complete-instance" && typeof body.employeeId === "string") {
      await completeOnboardingInstance(body.employeeId);
      const overview = await getOnboardingOverview(body.employeeId);
      return NextResponse.json(overview);
    }

    if (typeof body.employeeId !== "string" || typeof body.taskTemplateId !== "string" || typeof body.type !== "string") {
      return NextResponse.json({ error: "employeeId, taskTemplateId, and type are required." }, { status: 400 });
    }

    await saveOnboardingTask({
      employeeId: body.employeeId,
      taskTemplateId: body.taskTemplateId,
      type: body.type as OnboardingTaskType,
      data: body.data && typeof body.data === "object" ? body.data : {},
      signature: body.signature && typeof body.signature === "object" ? body.signature : undefined,
      ip: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
      userAgent: request.headers.get("user-agent")
    });
    const overview = await getOnboardingOverview(body.employeeId);
    return NextResponse.json(overview);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to save onboarding." }, { status: 400 });
  }
}
