create table if not exists public.employee_offboardings (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  membership_id uuid not null references public.memberships(id) on delete cascade,
  initiated_by_membership_id uuid,
  state text not null default 'scheduled',
  departure_type text not null,
  initiated_by_type text not null default 'admin',
  effective_date date not null,
  final_day date not null,
  work_state text,
  reason_private text,
  note_to_employee text,
  notify_employee boolean not null default true,
  access_ends_at timestamptz,
  archive_after date,
  final_pay_due_at timestamptz,
  final_pay_approved_at timestamptz,
  final_pay_approved_by_membership_id uuid,
  final_pay_snapshot jsonb not null default '{}'::jsonb,
  retention_policy jsonb not null default '{"payroll_years":7,"post_departure_access_days":90}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz,
  archived_at timestamptz,
  rescinded_at timestamptz,
  deleted_at timestamptz,
  constraint employee_offboardings_state_check check (state in ('scheduled', 'active_offboarding', 'finalizing', 'completed', 'archived', 'rescinded', 'cancelled')),
  constraint employee_offboardings_departure_type_check check (departure_type in ('voluntary_notice', 'voluntary_immediate', 'involuntary_for_cause', 'involuntary_without_cause', 'layoff', 'fixed_term_end', 'death', 'job_abandonment', 'retirement', 'other')),
  constraint employee_offboardings_initiated_by_type_check check (initiated_by_type in ('employee', 'manager', 'admin', 'system'))
);

create table if not exists public.offboarding_checklist_items (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  offboarding_id uuid not null references public.employee_offboardings(id) on delete cascade,
  title text not null,
  category text not null default 'general',
  requires_note boolean not null default false,
  required boolean not null default true,
  due_at timestamptz,
  completed_at timestamptz,
  completed_by_membership_id uuid,
  note text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.offboarding_final_pay_records (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  offboarding_id uuid not null references public.employee_offboardings(id) on delete cascade,
  membership_id uuid not null,
  regular_hours numeric(8, 2) not null default '0',
  overtime_hours numeric(8, 2) not null default '0',
  regular_pay_cents integer not null default 0,
  overtime_pay_cents integer not null default 0,
  pto_payout_cents integer not null default 0,
  adjustment_cents integer not null default 0,
  total_cents integer not null default 0,
  breakdown jsonb not null default '{}'::jsonb,
  compliance jsonb not null default '{}'::jsonb,
  status text not null default 'draft',
  approved_by_membership_id uuid,
  approved_at timestamptz,
  processed_at timestamptz,
  payroll_reference text,
  created_at timestamptz not null default now(),
  constraint offboarding_final_pay_status_check check (status in ('draft', 'approved', 'processed', 'voided'))
);

create table if not exists public.offboarding_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  offboarding_id uuid not null references public.employee_offboardings(id) on delete cascade,
  actor_membership_id uuid,
  actor_type text not null default 'user',
  event_type text not null,
  from_state text,
  to_state text,
  message text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists employee_offboardings_org_state_idx on public.employee_offboardings (organization_id, state, final_day);
create index if not exists employee_offboardings_membership_idx on public.employee_offboardings (membership_id, deleted_at);
create index if not exists offboarding_checklist_offboarding_idx on public.offboarding_checklist_items (offboarding_id, sort_order);
create index if not exists offboarding_events_offboarding_idx on public.offboarding_events (offboarding_id, created_at);
