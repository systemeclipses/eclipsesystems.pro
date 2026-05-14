create table if not exists public.time_entries (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  membership_id uuid not null references public.memberships(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  task_id uuid references public.tasks(id) on delete set null,
  matter_id uuid,
  utbms_task_code text,
  utbms_activity_code text,
  description text,
  started_at timestamptz not null,
  ended_at timestamptz,
  duration_seconds int generated always as (case when ended_at is null then null else extract(epoch from (ended_at - started_at))::int end) stored,
  is_running boolean generated always as (ended_at is null) stored,
  billable boolean not null default true,
  hourly_rate numeric(19,4),
  amount numeric(19,4),
  status public.time_entry_status not null default 'draft',
  source text not null default 'manual' check (source in ('manual','timer','import','api')),
  tags text[] not null default '{}',
  invoice_id uuid,
  approved_by uuid references public.memberships(id) on delete set null,
  approved_at timestamptz,
  rejected_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint time_entries_ended_after_started check (ended_at is null or ended_at > started_at)
);

create index if not exists time_entries_org_started_idx on public.time_entries (organization_id, started_at desc) where deleted_at is null;
create index if not exists time_entries_member_started_idx on public.time_entries (membership_id, started_at desc) where deleted_at is null;
create index if not exists time_entries_project_idx on public.time_entries (project_id) where deleted_at is null;
create index if not exists time_entries_status_idx on public.time_entries (status);
create unique index if not exists time_entries_one_running_idx on public.time_entries (membership_id) where is_running and deleted_at is null;

drop trigger if exists time_entries_set_updated_at on public.time_entries;
create trigger time_entries_set_updated_at before update on public.time_entries for each row execute function public.set_updated_at();
