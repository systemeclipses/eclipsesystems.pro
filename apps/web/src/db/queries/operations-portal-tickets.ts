import { sql } from "drizzle-orm";
import { portalSeedData, type PortalMessage, type PortalViewer, type SupportTicket, type TicketAttachment, type TicketCategory, type TicketEvent, type TicketStatus } from "@/lib/operations-portal-data";
import { scopedEmployeeIds } from "@/lib/operations-permissions";
import { withServerDb } from "@/src/db/session";

type Tx = Parameters<Parameters<typeof withServerDb>[0]>[0];
type CommentKind = "internal_note" | "public_reply";

export type TicketMutation = Partial<Pick<SupportTicket, "status" | "priority" | "assigneeId" | "category" | "dueDate" | "tags" | "projectId" | "invoiceId">>;

function rows<T>(value: unknown) {
  return value as T[];
}

function viewerForRole(role: string | null): PortalViewer {
  if (role === "owner" || role === "admin") return { role };
  if (role === "manager") return { role: "manager" };
  return { role: "employee" };
}

function actorName(viewer: PortalViewer) {
  if (viewer.role === "owner") return "Dale Whitfield";
  if (viewer.role === "admin") return "Carol Estrada";
  if (viewer.role === "manager") return "Marcus Whitfield";
  if (viewer.role === "client") return "Client contact";
  return "Jamal Carter";
}

function employeeName(employeeId: string | null | undefined) {
  return portalSeedData.employees.find((employee) => employee.id === employeeId)?.name ?? "Unassigned";
}

function dateLabel(value: string | Date | null | undefined) {
  if (!value) return "No due date";
  const date = value instanceof Date ? value : new Date(`${value}T12:00:00`);
  const days = Math.ceil((date.getTime() - Date.now()) / 86400000);
  if (days < 0) return `${Math.abs(days)}d overdue`;
  if (days === 0) return "Due today";
  if (days === 1) return "Due tomorrow";
  return `Due in ${days}d`;
}

function canSeeTicket(viewer: PortalViewer, ticket: { assignee_id?: string | null; client_id?: string | null }) {
  if (viewer.role === "client") return ticket.client_id === viewer.clientId;
  if (viewer.role === "owner" || viewer.role === "admin") return true;
  if (!ticket.assignee_id) return viewer.role === "manager";
  return scopedEmployeeIds(viewer, portalSeedData.employees).includes(ticket.assignee_id);
}

async function logEvent(tx: Tx, organizationId: string, ticketId: string, actorId: string | null, actor: string, type: string, fromValue?: string | null, toValue?: string | null) {
  await tx.execute(sql`
    insert into operations_portal_ticket_events (organization_id, ticket_id, actor_id, actor_name, type, from_value, to_value)
    values (${organizationId}::uuid, ${ticketId}, ${actorId}, ${actor}, ${type}, ${fromValue ?? null}, ${toValue ?? null})
  `);
}

async function notify(tx: Tx, organizationId: string, employeeId: string | null | undefined, title: string, body: string, ticketId: string) {
  if (!employeeId) return;
  await tx.execute(sql`
    insert into operations_portal_notifications (organization_id, employee_id, kind, title, body, target_type, target_id)
    values (${organizationId}::uuid, ${employeeId}, 'ticket', ${title}, ${body}, 'ticket', ${ticketId})
  `);
}

async function ensureTicketSeed(tx: Tx, organizationId: string) {
  const count = rows<{ count: string }>(await tx.execute(sql`select count(*)::text as count from operations_portal_tickets where organization_id = ${organizationId}::uuid`))[0]?.count ?? "0";
  if (Number(count) > 0) return;

  for (const ticket of portalSeedData.tickets) {
    await tx.execute(sql`
      insert into operations_portal_tickets (id, organization_id, client_id, subject, description, status, priority, category, due_date, tags, assignee_id, source, project_id, invoice_id, created_by, resolved_at, closed_at)
      values (${ticket.id}, ${organizationId}::uuid, ${ticket.clientId}, ${ticket.subject}, ${ticket.description ?? ""}, ${ticket.status}, ${ticket.priority}, ${ticket.category}, ${ticket.dueDate ?? null}::date, ${ticket.tags}::text[], ${ticket.assigneeId}, ${ticket.source}, ${ticket.projectId ?? null}, ${ticket.invoiceId ?? null}, 'demo-seed', ${ticket.resolvedAt ? sql`now() - interval '1 day'` : sql`null`}, ${ticket.closedAt ? sql`now()` : sql`null`})
      on conflict (id) do nothing
    `);
    for (const message of ticket.messages) {
      await tx.execute(sql`
        insert into operations_portal_ticket_comments (id, organization_id, ticket_id, kind, author_role, author_name, body, mentions, created_by, created_at)
        values (${message.id}, ${organizationId}::uuid, ${ticket.id}, ${message.kind ?? "public_reply"}, ${message.authorRole}, ${message.authorName}, ${message.body}, ${message.mentions ?? []}::text[], 'demo-seed', now() - interval '1 day')
        on conflict (id) do nothing
      `);
    }
    for (const attachment of ticket.attachments) {
      await tx.execute(sql`
        insert into operations_portal_ticket_attachments (id, organization_id, ticket_id, comment_id, file_url, file_name, uploaded_by)
        values (${attachment.id}, ${organizationId}::uuid, ${ticket.id}, ${attachment.commentId ?? null}, ${attachment.fileUrl}, ${attachment.fileName}, ${attachment.uploadedBy})
        on conflict (id) do nothing
      `);
    }
    for (const event of ticket.events) {
      await tx.execute(sql`
        insert into operations_portal_ticket_events (id, organization_id, ticket_id, actor_id, actor_name, type, from_value, to_value)
        values (${event.id}, ${organizationId}::uuid, ${ticket.id}, 'demo-seed', ${event.actorName}, ${event.type}, ${event.fromValue ?? null}, ${event.toValue ?? null})
        on conflict (id) do nothing
      `);
    }
  }
}

async function getTicketsForSession(tx: Tx, organizationId: string, viewer: PortalViewer) {
  const ticketRows = rows<{
    id: string; client_id: string; subject: string; description: string; status: TicketStatus; priority: SupportTicket["priority"]; category: TicketCategory; due_date: string | null; tags: string[]; assignee_id: string | null; source: SupportTicket["source"]; project_id: string | null; invoice_id: string | null; resolved_at: string | null; closed_at: string | null; updated_at: string;
  }>(await tx.execute(sql`
    select id, client_id, subject, description, status, priority, category, due_date::text, tags, assignee_id, source, project_id, invoice_id, resolved_at::text, closed_at::text, updated_at::text
    from operations_portal_tickets
    where organization_id = ${organizationId}::uuid and deleted_at is null
    order by case priority when 'high' then 0 when 'normal' then 1 else 2 end, due_date nulls last, updated_at desc
  `));
  const visibleRows = ticketRows.filter((ticket) => canSeeTicket(viewer, ticket));
  const ids = visibleRows.map((ticket) => ticket.id);
  if (ids.length === 0) return [];

  const commentRows = rows<{
    id: string; ticket_id: string; kind: CommentKind; author_role: PortalMessage["authorRole"]; author_name: string; body: string; mentions: string[]; created_at: string;
  }>(await tx.execute(sql`
    select id, ticket_id, kind, author_role, author_name, body, mentions, created_at::text
    from operations_portal_ticket_comments
    where organization_id = ${organizationId}::uuid and ticket_id = any(${ids}::text[])
    order by created_at
  `));
  const attachmentRows = rows<{ id: string; ticket_id: string; comment_id: string | null; file_url: string; file_name: string; uploaded_by: string; created_at: string }>(await tx.execute(sql`
    select id, ticket_id, comment_id, file_url, file_name, uploaded_by, created_at::text
    from operations_portal_ticket_attachments
    where organization_id = ${organizationId}::uuid and ticket_id = any(${ids}::text[])
    order by created_at
  `));
  const eventRows = rows<{ id: string; ticket_id: string; actor_name: string; type: TicketEvent["type"]; from_value: string | null; to_value: string | null; created_at: string }>(await tx.execute(sql`
    select id, ticket_id, actor_name, type, from_value, to_value, created_at::text
    from operations_portal_ticket_events
    where organization_id = ${organizationId}::uuid and ticket_id = any(${ids}::text[])
    order by created_at
  `));

  return visibleRows.map((ticket): SupportTicket => {
    const messages = commentRows
      .filter((comment) => comment.ticket_id === ticket.id && (viewer.role !== "client" || comment.kind === "public_reply"))
      .map((comment): PortalMessage => ({
        id: comment.id,
        authorRole: comment.author_role,
        authorName: comment.author_name,
        body: comment.body,
        at: new Date(comment.created_at).toLocaleString(),
        kind: comment.kind,
        mentions: comment.mentions,
        attachments: attachmentRows.filter((attachment) => attachment.comment_id === comment.id).map((attachment): TicketAttachment => ({
          id: attachment.id,
          fileUrl: attachment.file_url,
          fileName: attachment.file_name,
          uploadedBy: attachment.uploaded_by,
          createdAt: new Date(attachment.created_at).toLocaleString(),
          commentId: attachment.comment_id
        }))
      }));
    return {
      id: ticket.id,
      clientId: ticket.client_id,
      subject: ticket.subject,
      description: ticket.description,
      status: ticket.status,
      priority: ticket.priority,
      category: ticket.category,
      dueDate: ticket.due_date ?? undefined,
      tags: ticket.tags ?? [],
      assigneeId: ticket.assignee_id ?? "employee-jamal",
      source: ticket.source,
      projectId: ticket.project_id,
      invoiceId: ticket.invoice_id,
      resolvedAt: ticket.resolved_at,
      closedAt: ticket.closed_at,
      lastUpdate: dateLabel(ticket.updated_at),
      messages,
      attachments: attachmentRows.filter((attachment) => attachment.ticket_id === ticket.id).map((attachment) => ({ id: attachment.id, fileUrl: attachment.file_url, fileName: attachment.file_name, uploadedBy: attachment.uploaded_by, createdAt: new Date(attachment.created_at).toLocaleString(), commentId: attachment.comment_id })),
      events: eventRows.filter((event) => event.ticket_id === ticket.id).map((event) => ({ id: event.id, actorName: event.actor_name, type: event.type, fromValue: event.from_value, toValue: event.to_value, at: new Date(event.created_at).toLocaleString() }))
    };
  });
}

export async function getTicketOverview(clientId?: string | null) {
  return withServerDb(async (tx, session) => {
    await ensureTicketSeed(tx, session.organizationId);
    const viewer = clientId ? { role: "client" as const, clientId } : viewerForRole(session.role);
    return { tickets: await getTicketsForSession(tx, session.organizationId, viewer) };
  });
}

export async function createTicket(input: { subject: string; description?: string; clientId: string; priority?: SupportTicket["priority"]; category?: TicketCategory; assigneeId?: string; source?: SupportTicket["source"]; dueDate?: string | null; tags?: string[] }) {
  return withServerDb(async (tx, session) => {
    await ensureTicketSeed(tx, session.organizationId);
    const viewer = viewerForRole(session.role);
    const assigneeId = input.assigneeId ?? "employee-jamal";
    if (!canSeeTicket(viewer, { assignee_id: assigneeId, client_id: input.clientId })) throw new Error("You cannot create a ticket for that queue.");
    const actor = actorName(viewer);
    const [row] = rows<{ id: string }>(await tx.execute(sql`
      insert into operations_portal_tickets (organization_id, client_id, subject, description, status, priority, category, due_date, tags, assignee_id, source, created_by)
      values (${session.organizationId}::uuid, ${input.clientId}, ${input.subject}, ${input.description ?? input.subject}, ${input.source === "client" ? "waiting_on_staff" : "open"}, ${input.priority ?? "normal"}, ${input.category ?? "Other"}, ${input.dueDate ?? null}::date, ${input.tags ?? ["new"]}::text[], ${assigneeId}, ${input.source ?? "internal"}, ${session.userId})
      returning id
    `));
    await addTicketCommentInternal(tx, session.organizationId, row.id, actor, viewer.role, input.description ?? `Opened ticket: ${input.subject}`, input.source === "client" ? "public_reply" : "internal_note", [], session.userId);
    await logEvent(tx, session.organizationId, row.id, session.userId, actor, "created", null, "open");
    await notify(tx, session.organizationId, assigneeId, "Ticket assigned", input.subject, row.id);
    return (await getTicketsForSession(tx, session.organizationId, viewer)).find((ticket) => ticket.id === row.id);
  });
}

async function addTicketCommentInternal(tx: Tx, organizationId: string, ticketId: string, actor: string, role: string, body: string, kind: CommentKind, mentions: string[], userId: string | null) {
  const [comment] = rows<{ id: string }>(await tx.execute(sql`
    insert into operations_portal_ticket_comments (organization_id, ticket_id, kind, author_role, author_name, body, mentions, created_by)
    values (${organizationId}::uuid, ${ticketId}, ${kind}, ${role}, ${actor}, ${body}, ${mentions}::text[], ${userId})
    returning id
  `));
  await logEvent(tx, organizationId, ticketId, userId, actor, "comment", null, kind);
  return comment.id;
}

export async function updateTicket(input: { ticketId: string; changes: TicketMutation }) {
  return withServerDb(async (tx, session) => {
    await ensureTicketSeed(tx, session.organizationId);
    const viewer = viewerForRole(session.role);
    const [ticket] = rows<{ id: string; assignee_id: string | null; client_id: string; status: TicketStatus; priority: string; category: string; due_date: string | null; tags: string[]; project_id: string | null; invoice_id: string | null }>(await tx.execute(sql`
      select id, assignee_id, client_id, status, priority, category, due_date::text, tags, project_id, invoice_id
      from operations_portal_tickets
      where organization_id = ${session.organizationId}::uuid and id = ${input.ticketId} and deleted_at is null
      limit 1
    `));
    if (!ticket || !canSeeTicket(viewer, ticket) || (input.changes.assigneeId && !canSeeTicket(viewer, { assignee_id: input.changes.assigneeId, client_id: ticket.client_id }))) throw new Error("Ticket not found or out of scope.");
    const actor = actorName(viewer);
    const status = input.changes.status;
    await tx.execute(sql`
      update operations_portal_tickets
      set status = coalesce(${input.changes.status ?? null}, status),
          priority = coalesce(${input.changes.priority ?? null}, priority),
          category = coalesce(${input.changes.category ?? null}, category),
          assignee_id = coalesce(${input.changes.assigneeId ?? null}, assignee_id),
          due_date = coalesce(${input.changes.dueDate ?? null}::date, due_date),
          tags = coalesce(${input.changes.tags ?? null}::text[], tags),
          project_id = coalesce(${input.changes.projectId ?? null}, project_id),
          invoice_id = coalesce(${input.changes.invoiceId ?? null}, invoice_id),
          resolved_at = case when ${status ?? null} = 'resolved' then now() when ${status ?? null} = 'open' then null else resolved_at end,
          closed_at = case when ${status ?? null} = 'closed' then now() when ${status ?? null} = 'open' then null else closed_at end,
          updated_at = now()
      where organization_id = ${session.organizationId}::uuid and id = ${input.ticketId}
    `);
    for (const [key, next] of Object.entries(input.changes)) {
      if (next === undefined) continue;
      const from = key === "assigneeId" ? employeeName(ticket.assignee_id) : String((ticket as Record<string, unknown>)[key === "dueDate" ? "due_date" : key] ?? "");
      const to = key === "assigneeId" ? employeeName(String(next)) : Array.isArray(next) ? next.join(", ") : String(next ?? "");
      await logEvent(tx, session.organizationId, input.ticketId, session.userId, actor, key === "assigneeId" ? "assignee" : key === "dueDate" ? "due_date" : key, from, to);
    }
    if (input.changes.assigneeId) await notify(tx, session.organizationId, input.changes.assigneeId, "Ticket assigned", `Assigned to ${employeeName(input.changes.assigneeId)}`, input.ticketId);
    return (await getTicketsForSession(tx, session.organizationId, viewer)).find((item) => item.id === input.ticketId);
  });
}

export async function addTicketComment(input: { ticketId: string; body: string; kind: CommentKind; mentions?: string[]; attachments?: Array<{ fileName: string; fileUrl: string }> }) {
  return withServerDb(async (tx, session) => {
    await ensureTicketSeed(tx, session.organizationId);
    const viewer = viewerForRole(session.role);
    const [ticket] = rows<{ id: string; assignee_id: string | null; client_id: string; status: TicketStatus }>(await tx.execute(sql`
      select id, assignee_id, client_id, status
      from operations_portal_tickets
      where organization_id = ${session.organizationId}::uuid and id = ${input.ticketId} and deleted_at is null
      limit 1
    `));
    if (!ticket || !canSeeTicket(viewer, ticket)) throw new Error("Ticket not found or out of scope.");
    const actor = actorName(viewer);
    const kind = viewer.role === "client" ? "public_reply" : input.kind;
    const commentId = await addTicketCommentInternal(tx, session.organizationId, input.ticketId, actor, viewer.role, input.body, kind, input.mentions ?? [], session.userId);
    for (const attachment of input.attachments ?? []) {
      await tx.execute(sql`
        insert into operations_portal_ticket_attachments (organization_id, ticket_id, comment_id, file_url, file_name, uploaded_by)
        values (${session.organizationId}::uuid, ${input.ticketId}, ${commentId}, ${attachment.fileUrl}, ${attachment.fileName}, ${session.userId})
      `);
      await logEvent(tx, session.organizationId, input.ticketId, session.userId, actor, "attachment", null, attachment.fileName);
    }
    const nextStatus = viewer.role === "client" ? "waiting_on_staff" : kind === "public_reply" ? "waiting_on_client" : ticket.status;
    await tx.execute(sql`update operations_portal_tickets set status = ${nextStatus}, updated_at = now() where organization_id = ${session.organizationId}::uuid and id = ${input.ticketId}`);
    await notify(tx, session.organizationId, ticket.assignee_id, kind === "internal_note" ? "Internal note added" : "Ticket reply added", input.body.slice(0, 120), input.ticketId);
    for (const mention of input.mentions ?? []) await notify(tx, session.organizationId, mention, "You were mentioned", input.body.slice(0, 120), input.ticketId);
    return (await getTicketsForSession(tx, session.organizationId, viewer)).find((item) => item.id === input.ticketId);
  });
}

export async function bulkUpdateTickets(input: { ticketIds: string[]; changes: TicketMutation }) {
  const tickets = [];
  for (const ticketId of input.ticketIds) tickets.push(await updateTicket({ ticketId, changes: input.changes }));
  return tickets.filter(Boolean);
}
