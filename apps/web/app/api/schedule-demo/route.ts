import { NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";

const demoRequestSchema = z.object({
  name: z.string().trim().min(1).max(160),
  email: z.string().trim().email().max(254),
  businessName: z.string().trim().min(1).max(200),
  employeeCount: z.coerce.number().int().min(1).max(100000),
  needs: z.string().trim().min(1).max(5000)
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = demoRequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Please complete every field before scheduling a demo." }, { status: 400 });
  }

  const webhookUrl = process.env.DEMO_REQUEST_WEBHOOK_URL;

  if (webhookUrl) {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        source: "eclipsesystems.pro/schedule-demo",
        submittedAt: new Date().toISOString(),
        ...parsed.data
      })
    });

    if (!response.ok) {
      return NextResponse.json({ error: "We could not send the request. Please try again." }, { status: 502 });
    }
  } else {
    console.info("Schedule demo request", {
      source: "eclipsesystems.pro/schedule-demo",
      submittedAt: new Date().toISOString(),
      ...parsed.data
    });
  }

  return NextResponse.json({ ok: true });
}
