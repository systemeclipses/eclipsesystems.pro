alter table public.memberships
  add column if not exists department text,
  add column if not exists manager_membership_id uuid,
  add column if not exists pay_rate_cents integer not null default 0,
  add column if not exists hire_date date,
  add column if not exists probation_ends_at date;

alter table public.time_entries
  add column if not exists punch_note text,
  add column if not exists started_location jsonb,
  add column if not exists ended_location jsonb,
  add column if not exists device_info jsonb,
  add column if not exists review_flag text,
  add column if not exists approved_at timestamptz,
  add column if not exists locked_at timestamptz;

create table if not exists public.pay_rate_history (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  membership_id uuid not null,
  effective_date date not null,
  rate_cents integer not null,
  created_by_membership_id uuid,
  created_at timestamptz not null default now()
);

create table if not exists public.holidays (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  date date not null,
  name text not null,
  multiplier_basis_points integer not null default 10000,
  is_paid boolean not null default true,
  non_working_paid boolean not null default false,
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.geofences (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  name text not null,
  address text,
  latitude numeric(10, 7) not null,
  longitude numeric(10, 7) not null,
  radius_meters integer not null default 100,
  out_of_bounds_behavior text not null default 'block',
  require_clock_out_location boolean not null default false,
  created_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint geofences_out_of_bounds_check check (out_of_bounds_behavior in ('block', 'warn'))
);

create table if not exists public.geofence_assignments (
  geofence_id uuid not null references public.geofences(id) on delete cascade,
  membership_id uuid not null references public.memberships(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (geofence_id, membership_id)
);

create table if not exists public.pay_periods (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status text not null default 'open',
  approved_by_membership_id uuid,
  approved_at timestamptz,
  locked_at timestamptz,
  constraint pay_periods_status_check check (status in ('open', 'approved', 'locked'))
);

create table if not exists public.pto_categories (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  name text not null,
  is_paid boolean not null default true,
  accrual_rule jsonb not null default '{"type":"none"}'::jsonb,
  cap_hours numeric(8, 2),
  carryover_rule jsonb not null default '{"type":"none"}'::jsonb,
  weekly_max_hours numeric(8, 2),
  notice_days integer not null default 0,
  blackout_dates jsonb not null default '[]'::jsonb,
  probation_applies boolean not null default false,
  sort_order integer not null default 0,
  deleted_at timestamptz
);

create table if not exists public.pto_balances (
  organization_id uuid not null,
  membership_id uuid not null,
  category_id uuid not null references public.pto_categories(id) on delete cascade,
  accrued_hours numeric(8, 2) not null default 0,
  used_hours numeric(8, 2) not null default 0,
  pending_hours numeric(8, 2) not null default 0,
  adjusted_hours numeric(8, 2) not null default 0,
  updated_at timestamptz not null default now(),
  primary key (membership_id, category_id)
);

create table if not exists public.pto_requests (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  membership_id uuid not null,
  category_id uuid not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  hours numeric(8, 2) not null,
  status text not null default 'pending',
  employee_note text,
  manager_note text,
  decided_by_membership_id uuid,
  decided_at timestamptz,
  submitted_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint pto_requests_status_check check (status in ('pending', 'approved', 'denied', 'cancelled'))
);

create table if not exists public.automation_rules (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  type text not null,
  params jsonb not null default '{}'::jsonb,
  enabled boolean not null default false,
  created_by_membership_id uuid,
  created_at timestamptz not null default now()
);

create table if not exists public.audit_log (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  actor_membership_id uuid,
  action text not null,
  target_type text not null,
  target_id text not null,
  before jsonb,
  after jsonb,
  reason text,
  created_at timestamptz not null default now()
);

create index if not exists time_entries_org_membership_started_idx on public.time_entries (organization_id, membership_id, started_at desc);
create index if not exists pto_requests_org_status_idx on public.pto_requests (organization_id, status, starts_at);
create index if not exists audit_log_org_created_idx on public.audit_log (organization_id, created_at desc);
