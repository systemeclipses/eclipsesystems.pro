create table if not exists public.pto_approval_templates (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  name text not null,
  scope jsonb not null default '{}'::jsonb,
  match_rules jsonb not null default '{}'::jsonb,
  action text not null default 'pre_screen',
  blockers jsonb not null default '{}'::jsonb,
  enabled boolean not null default false,
  created_by_membership_id uuid,
  last_triggered_at timestamptz,
  trigger_count integer not null default 0,
  created_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint pto_approval_templates_action_check check (action in ('auto_approve', 'auto_approve_notify', 'pre_screen'))
);

create table if not exists public.pto_coverage_rules (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  name text not null,
  days_of_week jsonb not null default '[]'::jsonb,
  starts_at_time text,
  ends_at_time text,
  minimum_required integer not null default 1,
  minimum_percent integer,
  applies_to jsonb not null default '{}'::jsonb,
  exclusions jsonb not null default '{}'::jsonb,
  severity text not null default 'soft',
  effective_start date,
  effective_end date,
  enabled boolean not null default false,
  created_by_membership_id uuid,
  created_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint pto_coverage_rules_severity_check check (severity in ('soft', 'hard'))
);

create table if not exists public.pto_request_messages (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  request_id uuid not null references public.pto_requests(id) on delete cascade,
  sender_membership_id uuid not null,
  body text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.pto_decision_reactions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  request_id uuid not null references public.pto_requests(id) on delete cascade,
  actor_membership_id uuid not null,
  reaction text,
  message text,
  created_at timestamptz not null default now()
);

create table if not exists public.pto_manager_insights (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  membership_id uuid,
  type text not null,
  severity text not null default 'info',
  title text not null,
  body text not null,
  details jsonb not null default '{}'::jsonb,
  dismissed_at timestamptz,
  created_at timestamptz not null default now(),
  expires_at timestamptz
);

create index if not exists pto_request_messages_request_idx on public.pto_request_messages (request_id, created_at);
create index if not exists pto_manager_insights_org_idx on public.pto_manager_insights (organization_id, dismissed_at, expires_at);
