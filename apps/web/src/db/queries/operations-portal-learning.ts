import { sql } from "drizzle-orm";
import { portalSeedData, type CourseCatalogItem, type PortalViewer, type TrainingAssignment } from "@/lib/operations-portal-data";
import { scopedEmployeeIds } from "@/lib/operations-permissions";
import { withServerDb } from "@/src/db/session";

type Tx = Parameters<Parameters<typeof withServerDb>[0]>[0];

export type LearningReason = NonNullable<TrainingAssignment["reason"]>;

export type LearningPath = {
  id: string;
  name: string;
  kind: "new_hire" | "role_based" | "promotion" | "compliance" | "manual";
  courseIds: string[];
};

export type LearningOverview = {
  courses: CourseCatalogItem[];
  training: TrainingAssignment[];
  paths: LearningPath[];
};

const pathDefinitions: LearningPath[] = [
  { id: "path-new-hire", name: "New Hire", kind: "new_hire", courseIds: ["course-new-hire", "course-time", "course-hub", "course-osha", "course-first-aid"] },
  { id: "path-field-safety", name: "Field Safety", kind: "role_based", courseIds: ["course-ladder", "course-loto", "course-electrical", "course-epa", "course-driving"] },
  { id: "path-supervisor", name: "Supervisor / Promotion", kind: "promotion", courseIds: ["course-customer", "course-difficult"] },
  { id: "path-compliance", name: "Compliance / Recert", kind: "compliance", courseIds: ["course-epa", "course-osha", "course-first-aid"] }
];

function rows<T>(result: unknown): T[] {
  return Array.isArray(result) ? result as T[] : [];
}

function viewerForRole(role: string | null): PortalViewer {
  if (role === "owner" || role === "admin") return { role };
  if (role === "manager") return { role: "manager" };
  return { role: "employee" };
}

function dueLabel(value: string | null) {
  if (!value) return "No due date";
  const due = new Date(`${value}T12:00:00`);
  const days = Math.ceil((due.getTime() - Date.now()) / 86400000);
  if (days < 0) return `${Math.abs(days)}d overdue`;
  if (days === 0) return "Due today";
  if (days === 1) return "Due tomorrow";
  return `Due in ${days}d`;
}

function courseFromSeed(id: string) {
  const course = portalSeedData.courseCatalog.find((item) => item.id === id);
  if (!course) throw new Error(`Missing seed course ${id}`);
  return course;
}

function defaultDue(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

async function ensureLearningSeed(tx: Tx, organizationId: string) {
  for (const course of portalSeedData.courseCatalog) {
    const recurrenceMonths = ["course-epa", "course-osha", "course-first-aid"].includes(course.id) ? 12 : null;
    await tx.execute(sql`
      insert into operations_lms_courses (id, organization_id, title, description, category, duration, recurrence_months)
      values (${course.id}, ${organizationId}::uuid, ${course.title}, ${course.description}, ${course.category}, ${course.duration}, ${recurrenceMonths})
      on conflict (organization_id, id) do update set
        title = excluded.title,
        description = excluded.description,
        category = excluded.category,
        duration = excluded.duration,
        recurrence_months = excluded.recurrence_months,
        updated_at = now()
    `);
    for (const [index, lesson] of course.lessons.entries()) {
      await tx.execute(sql`
        insert into operations_lms_lessons (id, organization_id, course_id, title, body, position)
        values (${`${course.id}-lesson-${index + 1}`}, ${organizationId}::uuid, ${course.id}, ${lesson.title}, ${lesson.body}, ${index})
        on conflict (organization_id, id) do update set title = excluded.title, body = excluded.body, position = excluded.position
      `);
    }
    await tx.execute(sql`
      insert into operations_lms_quizzes (id, organization_id, course_id, prompt, correct_answer, questions, passing_score)
      values (${`${course.id}-quiz`}, ${organizationId}::uuid, ${course.id}, ${course.quiz}, 'Acknowledge safe procedure', ${JSON.stringify(course.quizQuestions)}::jsonb, 80)
      on conflict (organization_id, id) do update set prompt = excluded.prompt, questions = excluded.questions, passing_score = excluded.passing_score
    `);
  }

  for (const path of pathDefinitions) {
    await tx.execute(sql`
      insert into operations_lms_learning_paths (id, organization_id, name, kind)
      values (${path.id}, ${organizationId}::uuid, ${path.name}, ${path.kind})
      on conflict (organization_id, id) do update set name = excluded.name, kind = excluded.kind, updated_at = now()
    `);
    for (const [index, courseId] of path.courseIds.entries()) {
      await tx.execute(sql`
        insert into operations_lms_learning_path_courses (path_id, course_id, organization_id, position, required)
        values (${path.id}, ${courseId}, ${organizationId}::uuid, ${index}, true)
        on conflict (organization_id, path_id, course_id) do update set position = excluded.position, required = excluded.required
      `);
    }
  }

  const count = rows<{ count: string }>(await tx.execute(sql`
    select count(*)::text as count from operations_lms_enrollments where organization_id = ${organizationId}::uuid
  `))[0]?.count ?? "0";
  if (Number(count) > 0) return;

  const seedAssignments: Array<{ employeeId: string; courseId: string; reason: LearningReason; status: TrainingAssignment["status"]; due: string; progress: number }> = [
    ...pathDefinitions[0].courseIds.map((courseId, index) => ({ employeeId: "employee-nina", courseId, reason: "new_hire" as const, status: courseId === "course-new-hire" ? "in_progress" as const : "assigned" as const, due: defaultDue(index + 4), progress: courseId === "course-new-hire" ? 60 : 0 })),
    { employeeId: "employee-brett", courseId: "course-ladder", reason: "compliance", status: "overdue", due: defaultDue(-3), progress: 0 },
    { employeeId: "employee-brett", courseId: "course-driving", reason: "corrective", status: "assigned", due: defaultDue(5), progress: 0 },
    ...["course-ladder", "course-loto", "course-electrical", "course-epa", "course-driving"].map((courseId, index) => ({ employeeId: "employee-jamal", courseId, reason: "compliance" as const, status: index < 3 ? "complete" as const : "assigned" as const, due: defaultDue(index + 10), progress: index < 3 ? 100 : 0 }))
  ];

  for (const assignment of seedAssignments) {
    const completed = assignment.status === "complete" ? sql`now() - interval '4 days'` : sql`null`;
    await tx.execute(sql`
      insert into operations_lms_enrollments (organization_id, employee_id, course_id, status, reason, due_date, progress, current_lesson, assigned_by, completed_at, certificate_issued_at)
      values (${organizationId}::uuid, ${assignment.employeeId}, ${assignment.courseId}, ${assignment.status}, ${assignment.reason}, ${assignment.due}::date, ${assignment.progress}, 0, 'Carol · demo seed', ${completed}, ${completed})
      on conflict (organization_id, employee_id, course_id, reason) do nothing
    `);
  }
}

export async function getLearningOverview() {
  return withServerDb(async (tx, session): Promise<LearningOverview> => {
    await ensureLearningSeed(tx, session.organizationId);

    const courseRows = rows<{ id: string; title: string; description: string; category: CourseCatalogItem["category"]; duration: string }>(await tx.execute(sql`
      select id, title, description, category, duration
      from operations_lms_courses
      where organization_id = ${session.organizationId}::uuid and deleted_at is null
      order by title
    `));
    const lessonRows = rows<{ course_id: string; title: string; body: string }>(await tx.execute(sql`
      select course_id, title, body
      from operations_lms_lessons
      where organization_id = ${session.organizationId}::uuid
      order by course_id, position
    `));
    const quizRows = rows<{ course_id: string; prompt: string; questions: CourseCatalogItem["quizQuestions"] }>(await tx.execute(sql`
      select course_id, prompt, questions from operations_lms_quizzes where organization_id = ${session.organizationId}::uuid
    `));

    const courses = courseRows.map((course) => ({
      ...course,
      lessons: lessonRows.filter((lesson) => lesson.course_id === course.id).map((lesson) => ({ title: lesson.title, body: lesson.body })),
      quiz: quizRows.find((quiz) => quiz.course_id === course.id)?.prompt ?? courseFromSeed(course.id).quiz,
      quizQuestions: quizRows.find((quiz) => quiz.course_id === course.id)?.questions ?? courseFromSeed(course.id).quizQuestions
    }));

    const viewer = viewerForRole(session.role);
    const accessibleIds = scopedEmployeeIds(viewer, portalSeedData.employees);
    const enrollmentRows = rows<{
      id: string;
      employee_id: string;
      course_id: string;
      status: TrainingAssignment["status"];
      reason: LearningReason;
      due_date: string | null;
      progress: number;
      current_lesson: number;
      assigned_by: string | null;
      certificate_issued_at: string | null;
    }>(await tx.execute(sql`
      select id, employee_id, course_id, status, reason, due_date::text, progress, current_lesson, assigned_by, certificate_issued_at::text
      from operations_lms_enrollments
      where organization_id = ${session.organizationId}::uuid
      order by due_date nulls last, created_at desc
    `));

    const training = enrollmentRows.filter((enrollment) => accessibleIds.includes(enrollment.employee_id)).map((enrollment) => {
      const course = courses.find((item) => item.id === enrollment.course_id) ?? courseFromSeed(enrollment.course_id);
      const status = enrollment.status !== "complete" && enrollment.due_date && new Date(`${enrollment.due_date}T23:59:59`).getTime() < Date.now() ? "overdue" : enrollment.status;
      return {
        id: enrollment.id,
        employeeId: enrollment.employee_id,
        courseId: enrollment.course_id,
        course: course.title,
        status,
        reason: enrollment.reason,
        due: dueLabel(enrollment.due_date),
        dueDate: enrollment.due_date ?? undefined,
        progress: enrollment.progress,
        currentLesson: enrollment.current_lesson,
        certificateIssued: enrollment.certificate_issued_at ? "Issued" : undefined,
        assignedBy: enrollment.assigned_by ?? undefined
      };
    });

    return { courses, training, paths: pathDefinitions };
  });
}

export async function assignLearning(input: { courseIds?: string[]; pathId?: string; employeeIds: string[]; reason: LearningReason; dueDate?: string | null }) {
  return withServerDb(async (tx, session) => {
    await ensureLearningSeed(tx, session.organizationId);
    const viewer = viewerForRole(session.role);
    const allowedIds = new Set(scopedEmployeeIds(viewer, portalSeedData.employees));
    const employeeIds = input.employeeIds.filter((id) => allowedIds.has(id));
    if (employeeIds.length === 0) throw new Error("No scoped employees selected.");

    const pathCourseIds = input.pathId ? pathDefinitions.find((path) => path.id === input.pathId)?.courseIds ?? [] : [];
    const courseIds = Array.from(new Set([...(input.courseIds ?? []), ...pathCourseIds]));
    if (courseIds.length === 0) throw new Error("Pick at least one course or path.");

    for (const employeeId of employeeIds) {
      for (const courseId of courseIds) {
        await tx.execute(sql`
          insert into operations_lms_enrollments (organization_id, employee_id, course_id, status, reason, due_date, progress, current_lesson, assigned_by)
          values (${session.organizationId}::uuid, ${employeeId}, ${courseId}, 'assigned', ${input.reason}, ${input.dueDate ?? defaultDue(14)}::date, 0, 0, ${session.role ?? "user"})
          on conflict (organization_id, employee_id, course_id, reason) do update set status = 'assigned', due_date = excluded.due_date, removed_at = null, removed_by = null, updated_at = now()
        `);
        await tx.execute(sql`
          insert into operations_portal_notifications (organization_id, employee_id, kind, title, body, target_type, target_id)
          values (${session.organizationId}::uuid, ${employeeId}, 'lms_assignment', 'Training assigned', ${`Assigned: ${input.reason.replaceAll("_", " ")}`}, 'lms', ${courseId})
        `);
      }
    }
    return { ok: true };
  });
}

export async function completeLearningAssignment(enrollmentId: string) {
  return withServerDb(async (tx, session) => {
    const viewer = viewerForRole(session.role);
    const allowedIds = new Set(scopedEmployeeIds(viewer, portalSeedData.employees));
    const [existing] = rows<{ employee_id: string; course_id: string }>(await tx.execute(sql`
      select employee_id, course_id from operations_lms_enrollments where id = ${enrollmentId} and organization_id = ${session.organizationId}::uuid limit 1
    `));
    if (!existing || !allowedIds.has(existing.employee_id)) throw new Error("Assignment not found.");

    await tx.execute(sql`
      update operations_lms_enrollments
      set status = 'complete', progress = 100, completed_at = now(), certificate_issued_at = now(), updated_at = now()
      where id = ${enrollmentId} and organization_id = ${session.organizationId}::uuid
    `);
    await tx.execute(sql`
      insert into operations_lms_certificates (organization_id, enrollment_id, employee_id, course_id, certificate_number)
      values (${session.organizationId}::uuid, ${enrollmentId}, ${existing.employee_id}, ${existing.course_id}, ${`CERT-${Date.now()}`})
      on conflict do nothing
    `);
    await tx.execute(sql`
      insert into operations_portal_notifications (organization_id, employee_id, kind, title, body, target_type, target_id)
      values (${session.organizationId}::uuid, ${existing.employee_id}, 'lms_complete', 'Certificate issued', 'Course complete. Certificate ready.', 'lms', ${existing.course_id})
    `);
    return { ok: true };
  });
}

export async function removeLearningAssignment(enrollmentId: string) {
  return withServerDb(async (tx, session) => {
    const viewer = viewerForRole(session.role);
    const allowedIds = new Set(scopedEmployeeIds(viewer, portalSeedData.employees));
    const [existing] = rows<{ employee_id: string }>(await tx.execute(sql`
      select employee_id from operations_lms_enrollments where id = ${enrollmentId} and organization_id = ${session.organizationId}::uuid limit 1
    `));
    if (!existing || !allowedIds.has(existing.employee_id)) throw new Error("Assignment not found.");
    await tx.execute(sql`
      update operations_lms_enrollments
      set status = 'removed', removed_by = ${session.role ?? "user"}, removed_at = now(), updated_at = now()
      where id = ${enrollmentId} and organization_id = ${session.organizationId}::uuid
    `);
    return { ok: true };
  });
}
