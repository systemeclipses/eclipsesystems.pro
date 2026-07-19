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

const requiredNotificationRecipients = [
  "info@eclipsesystems.pro",
  "garrett@eclipsesystems.pro",
  "john@eclipsesystems.pro"
];

function notificationRecipients() {
  const configured = process.env.DEMO_NOTIFICATION_EMAILS
    ?.split(",")
    .map((email) => email.trim())
    .filter(Boolean);

  return Array.from(new Set([...requiredNotificationRecipients, ...(configured ?? [])]));
}

async function sendBookingNotification(data: z.infer<typeof demoRequestSchema>) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("RESEND_API_KEY is not configured");

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
      "idempotency-key": crypto.randomUUID()
    },
    body: JSON.stringify({
      from: process.env.DEMO_NOTIFICATION_FROM ?? "Eclipse Systems <info@eclipsesystems.pro>",
      to: notificationRecipients(),
      reply_to: data.email,
      subject: `New contact form submission from ${data.name}`,
      text: [
        "A new contact form submission was received on eclipsesystems.pro.",
        "",
        `Name: ${data.name}`,
        `Email: ${data.email}`,
        `Business: ${data.businessName}`,
        `Employee count: ${data.employeeCount}`,
        "",
        "Request details:",
        data.needs
      ].join("\n")
    })
  });

  if (!response.ok) {
    console.error("Demo notification email failed", {
      status: response.status,
      body: await response.text()
    });
    throw new Error("Demo notification email failed");
  }

}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = demoRequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Please complete every field before scheduling a demo." }, { status: 400 });
  }

  const webhookUrl = process.env.DEMO_REQUEST_WEBHOOK_URL;

  try {
    await sendBookingNotification(parsed.data);

    if (webhookUrl) {
      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          source: "eclipsesystems.pro/contact",
          submittedAt: new Date().toISOString(),
          ...parsed.data
        })
      });

      if (!response.ok) throw new Error("Demo request webhook failed");
    }

  } catch (error) {
    console.error("Schedule demo delivery failed", error);
    return NextResponse.json({ error: "We could not send the request. Please try again." }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
