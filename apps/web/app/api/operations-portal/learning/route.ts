import { NextResponse } from "next/server";
import { assignLearning, completeLearningAssignment, getLearningOverview, removeLearningAssignment, type LearningReason } from "@/src/db/queries/operations-portal-learning";

const reasons = new Set(["new_hire", "role_change", "promotion", "compliance", "corrective", "manual"]);

async function refetch() {
  return NextResponse.json(await getLearningOverview());
}

export async function GET() {
  try {
    return refetch();
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to load learning data." }, { status: 401 });
  }
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  try {
    if (body.action === "complete") {
      if (typeof body.enrollmentId !== "string") return NextResponse.json({ error: "enrollmentId is required." }, { status: 400 });
      await completeLearningAssignment(body.enrollmentId);
      return refetch();
    }

    const employeeIds = Array.isArray(body.employeeIds) ? body.employeeIds.filter((id: unknown): id is string => typeof id === "string") : [];
    const courseIds = Array.isArray(body.courseIds) ? body.courseIds.filter((id: unknown): id is string => typeof id === "string") : undefined;
    const pathId = typeof body.pathId === "string" && body.pathId ? body.pathId : undefined;
    const reason = typeof body.reason === "string" && reasons.has(body.reason) ? body.reason as LearningReason : "manual";
    const dueDate = typeof body.dueDate === "string" && body.dueDate ? body.dueDate : null;
    await assignLearning({ employeeIds, courseIds, pathId, reason, dueDate });
    return refetch();
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to save learning data." }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  const body = await request.json().catch(() => ({}));
  if (typeof body.enrollmentId !== "string") return NextResponse.json({ error: "enrollmentId is required." }, { status: 400 });
  try {
    await removeLearningAssignment(body.enrollmentId);
    return refetch();
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to remove assignment." }, { status: 400 });
  }
}
