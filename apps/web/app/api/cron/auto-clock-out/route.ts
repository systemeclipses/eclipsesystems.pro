import { NextResponse } from "next/server";
import { runAutoClockOut } from "@/src/db/queries/auto-clock-out";

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const runId = crypto.randomUUID();
  const startedAt = Date.now();
  const stats = await runAutoClockOut(runId);

  return NextResponse.json({
    ok: true,
    runId,
    duration_ms: Date.now() - startedAt,
    ...stats
  });
}
