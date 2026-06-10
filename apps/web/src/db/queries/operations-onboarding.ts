import { sql } from "drizzle-orm";
import { portalSeedData, type PortalViewer } from "@/lib/operations-portal-data";
import { scopedEmployeeIds } from "@/lib/operations-permissions";
import { encryptJson, last4 } from "@/src/security/encryption";
import { withServerDb } from "@/src/db/session";

export type OnboardingTaskType = "profile" | "address" | "emergency_contact" | "direct_deposit" | "i9" | "w4" | "document_ack" | "video" | "custom_form" | "signoff";
export type OnboardingTask = {
  id: string;
  key: string;
  title: string;
  type: OnboardingTaskType;
  position: number;
  required: boolean;
  config: Record<string, unknown>;
  status: "not_started" | "in_progress" | "complete";
  data: Record<string, unknown>;
  completedAt: string | null;
};

export type OnboardingOverview = {
  isDemo: boolean;
  instance: { id: string; employeeId: string; status: "not_started" | "in_progress" | "complete"; percent: number };
  employeeName: string;
  tasks: OnboardingTask[];
  documents: Array<{ id: string; title: string; kind: "handbook" | "policy" | "video"; body: string | null; url: string | null; versionHash: string; requiresAck: boolean }>;
  employees: Array<{ employeeId: string; name: string; status: string; percent: number; outstanding: string[] }>;
};

const defaultTasks: Array<{ key: string; title: string; type: OnboardingTaskType; required: boolean; config?: Record<string, unknown> }> = [
  { key: "welcome", title: "Welcome video", type: "video", required: true, config: { documentKind: "video" } },
  { key: "contact", title: "Contact info", type: "address", required: true },
  { key: "emergency", title: "Emergency contact", type: "emergency_contact", required: true },
  { key: "direct-deposit", title: "Direct deposit", type: "direct_deposit", required: true, config: { sensitive: true } },
  { key: "i9-section-1", title: "Form I-9 Section 1", type: "i9", required: true, config: { sensitive: true, section: 1 } },
  { key: "w4", title: "Form W-4", type: "w4", required: true, config: { sensitive: true } },
  { key: "handbook", title: "Read & acknowledge", type: "document_ack", required: true },
  { key: "signoff", title: "Sign-offs", type: "signoff", required: false },
  { key: "review", title: "Review & submit", type: "custom_form", required: true, config: { review: true } }
];

function asRows<T>(value: unknown) {
  return value as T[];
}

function viewerForRole(role: string | null): PortalViewer {
  if (role === "owner" || role === "admin") return { role };
  if (role === "manager") return { role: "manager" };
  return { role: "employee" };
}

function employeeName(employeeId: string) {
  return portalSeedData.employees.find((employee) => employee.id === employeeId)?.name ?? "New hire";
}

function canReadEmployee(role: string | null, employeeId: string) {
  return scopedEmployeeIds(viewerForRole(role), portalSeedData.employees).includes(employeeId);
}

function maskSensitive(type: OnboardingTaskType, data: Record<string, unknown>) {
  if (type === "direct_deposit") {
    return {
      bankName: data.bankName ?? "",
      accountType: data.accountType ?? "",
      routingLast4: last4(data.routingNumber),
      accountLast4: last4(data.accountNumber)
    };
  }
  if (type === "i9") return { attestation: data.attestation ?? "", ssnLast4: last4(data.ssn), workAuthLast4: last4(data.workAuthorizationNumber) };
  if (type === "w4") return { filingStatus: data.filingStatus ?? "", extraWithholding: data.extraWithholding ?? "" };
  return data;
}

async function ensureDefaultOnboarding(tx: Parameters<Parameters<typeof withServerDb>[0]>[0], organizationId: string) {
  const checklistRows = asRows<{ id: string }>(await tx.execute(sql`
    insert into onboarding_checklists (org_id, name, is_default)
    values (${organizationId}::uuid, 'Default new-hire checklist', true)
    on conflict do nothing
    returning id
  `));
  const existingChecklist = checklistRows[0] ?? asRows<{ id: string }>(await tx.execute(sql`select id from onboarding_checklists where org_id = ${organizationId}::uuid and is_default = true limit 1`))[0];
  const checklistId = existingChecklist.id;

  for (const [index, task] of defaultTasks.entries()) {
    await tx.execute(sql`
      insert into onboarding_task_templates (checklist_id, org_id, key, title, type, position, required, config)
      values (${checklistId}::uuid, ${organizationId}::uuid, ${task.key}, ${task.title}, ${task.type}, ${index + 1}, ${task.required}, ${JSON.stringify(task.config ?? {})}::jsonb)
      on conflict (checklist_id, key) do update set title = excluded.title, type = excluded.type, position = excluded.position, required = excluded.required, config = excluded.config
    `);
  }

  await tx.execute(sql`
    insert into onboarding_documents (org_id, title, kind, body, url, version_hash, requires_ack)
    values
      (${organizationId}::uuid, 'Welcome to Ridgeway', 'video', null, 'https://example.com/ridgeway-welcome', 'video-v1', false),
      (${organizationId}::uuid, 'Employee Handbook', 'handbook', 'Ridgeway handbook: safety, timekeeping, conduct, client care, and reporting expectations.', null, 'handbook-v1', true),
      (${organizationId}::uuid, 'Field Safety Policy', 'policy', 'Field safety policy: PPE, lockout/tagout, ladder safety, incident reporting, and escalation.', null, 'safety-v1', true)
    on conflict do nothing
  `);

  const instanceRows = asRows<{ id: string }>(await tx.execute(sql`
    insert into onboarding_instances (org_id, employee_id, checklist_id, status, started_at)
    values (${organizationId}::uuid, 'employee-nina', ${checklistId}::uuid, 'in_progress', now())
    on conflict (org_id, employee_id) do update set checklist_id = excluded.checklist_id
    returning id
  `));
  const instanceId = instanceRows[0].id;
  const templates = asRows<{ id: string; key: string }>(await tx.execute(sql`select id, key from onboarding_task_templates where checklist_id = ${checklistId}::uuid order by position`));
  for (const template of templates) {
    const seeded = ["welcome", "contact", "emergency"].includes(template.key);
    await tx.execute(sql`
      insert into onboarding_task_progress (org_id, instance_id, task_template_id, status, data, completed_at)
      values (${organizationId}::uuid, ${instanceId}::uuid, ${template.id}::uuid, ${seeded ? "complete" : "not_started"}, ${seeded ? JSON.stringify({ seeded: true }) : "{}"}::jsonb, ${seeded ? sql`now()` : sql`null`})
      on conflict (instance_id, task_template_id) do nothing
    `);
  }
}

export async function getOnboardingOverview(employeeId = "employee-nina") {
  return withServerDb(async (tx, session): Promise<OnboardingOverview> => {
    if (!canReadEmployee(session.role, employeeId)) throw new Error("You cannot view this onboarding record.");
    await ensureDefaultOnboarding(tx, session.organizationId);
    const [org] = asRows<{ is_demo: boolean }>(await tx.execute(sql`select is_demo from organizations where id = ${session.organizationId}::uuid limit 1`));
    const [instance] = asRows<{ id: string; employee_id: string; status: OnboardingOverview["instance"]["status"] }>(await tx.execute(sql`
      select id, employee_id, status from onboarding_instances where org_id = ${session.organizationId}::uuid and employee_id = ${employeeId} limit 1
    `));
    const tasks = asRows<{
      id: string; key: string; title: string; type: OnboardingTaskType; position: number; required: boolean; config: Record<string, unknown>; status: OnboardingTask["status"]; data: Record<string, unknown>; completed_at: Date | null;
    }>(await tx.execute(sql`
      select t.id, t.key, t.title, t.type, t.position, t.required, t.config,
             coalesce(p.status, 'not_started') as status, coalesce(p.data, '{}'::jsonb) as data, p.completed_at
      from onboarding_task_templates t
      left join onboarding_task_progress p on p.task_template_id = t.id and p.instance_id = ${instance.id}::uuid
      where t.checklist_id = (select checklist_id from onboarding_instances where id = ${instance.id}::uuid)
      order by t.position
    `));
    const documents = asRows<OnboardingOverview["documents"][number]>(await tx.execute(sql`
      select id, title, kind, body, url, version_hash as "versionHash", requires_ack as "requiresAck"
      from onboarding_documents where org_id = ${session.organizationId}::uuid order by kind, title
    `));
    const instanceRows = asRows<{ id: string; employee_id: string; status: string }>(await tx.execute(sql`select id, employee_id, status from onboarding_instances where org_id = ${session.organizationId}::uuid`));
    const employeeSummaries = [];
    for (const row of instanceRows) {
      const progress = asRows<{ title: string; required: boolean; status: string }>(await tx.execute(sql`
        select t.title, t.required, coalesce(p.status, 'not_started') as status
        from onboarding_task_templates t
        left join onboarding_task_progress p on p.task_template_id = t.id and p.instance_id = ${row.id}::uuid
        where t.checklist_id = (select checklist_id from onboarding_instances where id = ${row.id}::uuid)
      `));
      const done = progress.filter((item) => item.status === "complete").length;
      employeeSummaries.push({
        employeeId: row.employee_id,
        name: employeeName(row.employee_id),
        status: row.status,
        percent: progress.length ? Math.round((done / progress.length) * 100) : 0,
        outstanding: progress.filter((item) => item.required && item.status !== "complete").map((item) => item.title)
      });
    }
    const completed = tasks.filter((task) => task.status === "complete").length;
    return {
      isDemo: org?.is_demo ?? false,
      instance: { id: instance.id, employeeId: instance.employee_id, status: instance.status, percent: tasks.length ? Math.round((completed / tasks.length) * 100) : 0 },
      employeeName: employeeName(instance.employee_id),
      tasks: tasks.map((task) => ({ ...task, completedAt: task.completed_at?.toISOString() ?? null })),
      documents,
      employees: employeeSummaries
    };
  });
}

export async function saveOnboardingTask(input: {
  employeeId: string;
  taskTemplateId: string;
  type: OnboardingTaskType;
  data: Record<string, unknown>;
  signature?: { kind: "typed" | "drawn"; value: string; docRef: string };
  ip?: string | null;
  userAgent?: string | null;
}) {
  return withServerDb(async (tx, session) => {
    if (!canReadEmployee(session.role, input.employeeId)) throw new Error("You cannot update this onboarding record.");
    const [instance] = asRows<{ id: string }>(await tx.execute(sql`select id from onboarding_instances where org_id = ${session.organizationId}::uuid and employee_id = ${input.employeeId} limit 1`));
    if (!instance) throw new Error("Onboarding instance not found.");
    let signatureId: string | null = null;
    if (input.signature?.value) {
      const [signature] = asRows<{ id: string }>(await tx.execute(sql`
        insert into signatures (org_id, signer_profile_id, kind, value, doc_ref, ip, user_agent)
        values (${session.organizationId}::uuid, ${session.userId}, ${input.signature.kind}, ${input.signature.value}, ${input.signature.docRef}, ${input.ip ?? null}, ${input.userAgent ?? null})
        returning id
      `));
      signatureId = signature.id;
    }
    const sensitive = input.type === "direct_deposit" || input.type === "i9" || input.type === "w4" || input.type === "custom_form";
    const progressData = sensitive ? maskSensitive(input.type, input.data) : input.data;
    if (sensitive) {
      const encrypted = encryptJson(input.data);
      await tx.execute(sql`
        insert into form_submissions (org_id, employee_id, form_type, encrypted_data, encryption_key_id, data_mask, status, signature_id)
        values (${session.organizationId}::uuid, ${input.employeeId}, ${input.type === "direct_deposit" ? "direct_deposit" : input.type === "i9" ? "i9" : input.type === "w4" ? "w4" : "custom"}, ${encrypted.encryptedData}, ${encrypted.keyId}, ${JSON.stringify(progressData)}::jsonb, 'submitted', ${signatureId}::uuid)
      `);
      await tx.execute(sql`
        insert into audit_log (organization_id, actor_membership_id, action, target_type, target_id, after, reason)
        values (${session.organizationId}::uuid, ${session.membershipId}::uuid, 'onboarding.sensitive_write', ${input.type}, ${input.employeeId}, ${JSON.stringify(progressData)}::jsonb, 'Sensitive onboarding form saved with encrypted payload')
      `);
    }
    if (input.type === "document_ack") {
      const documentId = String(input.data.documentId ?? "");
      const versionHash = String(input.data.versionHash ?? "");
      if (documentId && versionHash) {
        await tx.execute(sql`
          insert into document_acknowledgments (org_id, employee_id, document_id, version_hash, signature_id)
          values (${session.organizationId}::uuid, ${input.employeeId}, ${documentId}::uuid, ${versionHash}, ${signatureId}::uuid)
          on conflict (employee_id, document_id, version_hash) do nothing
        `);
      }
    }
    await tx.execute(sql`
      insert into onboarding_task_progress (org_id, instance_id, task_template_id, status, data, completed_at)
      values (${session.organizationId}::uuid, ${instance.id}::uuid, ${input.taskTemplateId}::uuid, 'complete', ${JSON.stringify(progressData)}::jsonb, now())
      on conflict (instance_id, task_template_id) do update set status = 'complete', data = excluded.data, completed_at = now(), updated_at = now()
    `);
    await tx.execute(sql`update onboarding_instances set status = 'in_progress', started_at = coalesce(started_at, now()), updated_at = now() where id = ${instance.id}::uuid`);
    return { ok: true };
  });
}

export async function completeOnboardingInstance(employeeId: string) {
  return withServerDb(async (tx, session) => {
    const viewer = viewerForRole(session.role);
    if (viewer.role !== "owner" && viewer.role !== "admin") throw new Error("Only HR/admin can complete onboarding.");
    await tx.execute(sql`
      update onboarding_instances
      set status = 'complete', completed_at = now(), updated_at = now()
      where org_id = ${session.organizationId}::uuid and employee_id = ${employeeId}
    `);
    return { ok: true };
  });
}
