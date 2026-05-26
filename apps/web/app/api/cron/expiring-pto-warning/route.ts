import { NextResponse } from "next/server";

function authorize(request: Request) {
  const secret = process.env.CRON_SECRET;
  return Boolean(secret && request.headers.get("authorization") === `Bearer ${secret}`);
}

export async function GET(request: Request) {
  if (!authorize(request)) return new Response("Unauthorized", { status: 401 });
  return NextResponse.json({
    ok: true,
    processed: 0,
    skipped: 0,
    errors: 0,
    note: "Expiring PTO warnings are scheduled; notification delivery will be wired with the notifications table."
  });
}
