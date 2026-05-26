import { NextResponse } from "next/server";
import { runScheduledAccrual } from "@/src/db/queries/pto-accrual";

function authorize(request: Request) {
  const secret = process.env.CRON_SECRET;
  return Boolean(secret && request.headers.get("authorization") === `Bearer ${secret}`);
}

export async function GET(request: Request) {
  if (!authorize(request)) return new Response("Unauthorized", { status: 401 });
  const runId = crypto.randomUUID();
  const startedAt = Date.now();
  const stats = await runScheduledAccrual("monthly");
  return NextResponse.json({ ok: true, runId, duration_ms: Date.now() - startedAt, ...stats });
}
