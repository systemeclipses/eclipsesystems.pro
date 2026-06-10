import { NextResponse } from "next/server";
import { addTicketComment, bulkUpdateTickets, createTicket, getTicketOverview, updateTicket, type TicketMutation } from "@/src/db/queries/operations-portal-tickets";

const statuses = new Set(["open", "waiting_on_staff", "waiting_on_client", "resolved", "closed"]);
const priorities = new Set(["low", "normal", "high"]);
const categories = new Set(["HVAC", "Electrical", "Facilities", "Billing", "Access", "Other"]);

function cleanChanges(body: Record<string, unknown>): TicketMutation {
  const changes: TicketMutation = {};
  if (typeof body.status === "string" && statuses.has(body.status)) changes.status = body.status as TicketMutation["status"];
  if (typeof body.priority === "string" && priorities.has(body.priority)) changes.priority = body.priority as TicketMutation["priority"];
  if (typeof body.assigneeId === "string") changes.assigneeId = body.assigneeId;
  if (typeof body.category === "string" && categories.has(body.category)) changes.category = body.category as TicketMutation["category"];
  if (typeof body.dueDate === "string") changes.dueDate = body.dueDate;
  if (Array.isArray(body.tags)) changes.tags = body.tags.filter((tag): tag is string => typeof tag === "string");
  if (typeof body.projectId === "string") changes.projectId = body.projectId;
  if (typeof body.invoiceId === "string") changes.invoiceId = body.invoiceId;
  return changes;
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    return NextResponse.json(await getTicketOverview(url.searchParams.get("clientId")));
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to load tickets." }, { status: 401 });
  }
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  try {
    if (body.action === "comment") {
      if (typeof body.ticketId !== "string" || typeof body.body !== "string") return NextResponse.json({ error: "ticketId and body are required." }, { status: 400 });
      const ticket = await addTicketComment({
        ticketId: body.ticketId,
        body: body.body,
        kind: body.kind === "internal_note" ? "internal_note" : "public_reply",
        mentions: Array.isArray(body.mentions) ? body.mentions.filter((mention: unknown): mention is string => typeof mention === "string") : [],
        attachments: Array.isArray(body.attachments) ? body.attachments.filter((attachment: unknown): attachment is { fileName: string; fileUrl: string } => {
          return typeof attachment === "object" && attachment !== null && typeof (attachment as { fileName?: unknown }).fileName === "string" && typeof (attachment as { fileUrl?: unknown }).fileUrl === "string";
        }) : []
      });
      return NextResponse.json({ ticket });
    }

    if (typeof body.subject !== "string" || typeof body.clientId !== "string") return NextResponse.json({ error: "subject and clientId are required." }, { status: 400 });
    const ticket = await createTicket({
      subject: body.subject,
      description: typeof body.description === "string" ? body.description : body.subject,
      clientId: body.clientId,
      priority: typeof body.priority === "string" && priorities.has(body.priority) ? body.priority as never : "normal",
      category: typeof body.category === "string" && categories.has(body.category) ? body.category as never : "Other",
      assigneeId: typeof body.assigneeId === "string" ? body.assigneeId : undefined,
      source: body.source === "client" ? "client" : "internal",
      dueDate: typeof body.dueDate === "string" ? body.dueDate : null,
      tags: Array.isArray(body.tags) ? body.tags.filter((tag: unknown): tag is string => typeof tag === "string") : undefined
    });
    return NextResponse.json({ ticket });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to save ticket." }, { status: 400 });
  }
}

export async function PATCH(request: Request) {
  const body = await request.json().catch(() => ({}));
  try {
    if (Array.isArray(body.ticketIds)) {
      const tickets = await bulkUpdateTickets({ ticketIds: body.ticketIds.filter((id: unknown): id is string => typeof id === "string"), changes: cleanChanges(body) });
      return NextResponse.json({ tickets });
    }
    if (typeof body.ticketId !== "string") return NextResponse.json({ error: "ticketId is required." }, { status: 400 });
    const ticket = await updateTicket({ ticketId: body.ticketId, changes: cleanChanges(body) });
    return NextResponse.json({ ticket });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to update ticket." }, { status: 400 });
  }
}
