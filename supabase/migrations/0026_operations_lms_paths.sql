create table if not exists public.operations_lms_courses (
  id text not null,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  title text not null,
  description text not null,
  category text not null check (category in ('safety', 'compliance', 'onboarding', 'software', 'soft skills', 'leadership')),
  duration text not null,
  recurrence_months integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  primary key (organization_id, id)
);

create table if not exists public.operations_lms_lessons (
  id text not null,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  course_id text not null,
  title text not null,
  body text not null,
  position integer not null default 0,
  primary key (organization_id, id)
);

create table if not exists public.operations_lms_quizzes (
  id text not null,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  course_id text not null,
  prompt text not null,
  correct_answer text not null default 'Acknowledge safe procedure',
  questions jsonb not null default '[]'::jsonb,
  passing_score integer not null default 80,
  primary key (organization_id, id)
);

create table if not exists public.operations_lms_learning_paths (
  id text not null,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  kind text not null check (kind in ('new_hire', 'role_based', 'promotion', 'compliance', 'manual')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (organization_id, id)
);

create table if not exists public.operations_lms_learning_path_courses (
  path_id text not null,
  course_id text not null,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  position integer not null default 0,
  required boolean not null default true,
  primary key (organization_id, path_id, course_id)
);

create table if not exists public.operations_lms_assignment_rules (
  id text primary key default ('ops-lms-rule-' || gen_random_uuid()::text),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  trigger text not null,
  path_id text not null,
  created_at timestamptz not null default now(),
  unique (organization_id, trigger, path_id)
);

create table if not exists public.operations_lms_enrollments (
  id text primary key default ('ops-lms-enrollment-' || gen_random_uuid()::text),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  employee_id text not null,
  course_id text not null,
  status text not null default 'assigned' check (status in ('assigned', 'in_progress', 'complete', 'overdue', 'removed')),
  reason text not null default 'manual' check (reason in ('new_hire', 'role_change', 'promotion', 'compliance', 'corrective', 'manual')),
  due_date date,
  progress integer not null default 0,
  current_lesson integer not null default 0,
  assigned_by text,
  completed_at timestamptz,
  certificate_issued_at timestamptz,
  removed_by text,
  removed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, employee_id, course_id, reason)
);

create table if not exists public.operations_lms_certificates (
  id text primary key default ('ops-lms-cert-' || gen_random_uuid()::text),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  enrollment_id text not null,
  employee_id text not null,
  course_id text not null,
  issued_at timestamptz not null default now(),
  certificate_number text not null
);

create table if not exists public.operations_portal_notifications (
  id text primary key default ('ops-note-' || gen_random_uuid()::text),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  employee_id text not null,
  kind text not null,
  title text not null,
  body text not null,
  target_type text,
  target_id text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists operations_lms_courses_org_idx on public.operations_lms_courses(organization_id) where deleted_at is null;
create index if not exists operations_lms_lessons_course_idx on public.operations_lms_lessons(course_id, position);
create index if not exists operations_lms_enrollments_employee_idx on public.operations_lms_enrollments(organization_id, employee_id, status);
create index if not exists operations_lms_enrollments_due_idx on public.operations_lms_enrollments(organization_id, due_date) where status in ('assigned', 'in_progress', 'overdue');
create index if not exists operations_portal_notifications_employee_idx on public.operations_portal_notifications(organization_id, employee_id, read_at);

alter table public.operations_lms_courses enable row level security;
alter table public.operations_lms_lessons enable row level security;
alter table public.operations_lms_quizzes enable row level security;
alter table public.operations_lms_learning_paths enable row level security;
alter table public.operations_lms_learning_path_courses enable row level security;
alter table public.operations_lms_assignment_rules enable row level security;
alter table public.operations_lms_enrollments enable row level security;
alter table public.operations_lms_certificates enable row level security;
alter table public.operations_portal_notifications enable row level security;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'operations_lms_courses',
    'operations_lms_lessons',
    'operations_lms_quizzes',
    'operations_lms_learning_paths',
    'operations_lms_learning_path_courses',
    'operations_lms_assignment_rules',
    'operations_lms_enrollments',
    'operations_lms_certificates',
    'operations_portal_notifications'
  ] loop
    execute format('drop policy if exists %I_org_select on public.%I', table_name, table_name);
    execute format('create policy %I_org_select on public.%I for select using (organization_id::text = current_setting(''app.current_org'', true))', table_name, table_name);
    execute format('drop policy if exists %I_org_insert on public.%I', table_name, table_name);
    execute format('create policy %I_org_insert on public.%I for insert with check (organization_id::text = current_setting(''app.current_org'', true))', table_name, table_name);
    execute format('drop policy if exists %I_org_update on public.%I', table_name, table_name);
    execute format('create policy %I_org_update on public.%I for update using (organization_id::text = current_setting(''app.current_org'', true)) with check (organization_id::text = current_setting(''app.current_org'', true))', table_name, table_name);
  end loop;
end $$;
