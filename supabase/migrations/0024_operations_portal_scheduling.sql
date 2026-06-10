alter table public.organizations
  add column if not exists is_demo boolean not null default false;

create table if not exists public.operations_portal_shifts (
  id text primary key default ('ops-shift-' || gen_random_uuid()::text),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  employee_id text,
  swap_with_employee_id text,
  day text not null,
  time text not null,
  site text not null,
  status text not null default 'published' check (status in ('published', 'swap_requested', 'open')),
  resolved_by text,
  resolved_at text,
  resolution_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists operations_portal_shifts_org_idx
  on public.operations_portal_shifts(organization_id)
  where deleted_at is null;

alter table public.operations_portal_shifts enable row level security;

drop policy if exists operations_portal_shifts_select_org on public.operations_portal_shifts;
create policy operations_portal_shifts_select_org on public.operations_portal_shifts
  for select
  using (organization_id::text = current_setting('app.current_org', true));

drop policy if exists operations_portal_shifts_insert_org on public.operations_portal_shifts;
create policy operations_portal_shifts_insert_org on public.operations_portal_shifts
  for insert
  with check (organization_id::text = current_setting('app.current_org', true));

drop policy if exists operations_portal_shifts_update_org on public.operations_portal_shifts;
create policy operations_portal_shifts_update_org on public.operations_portal_shifts
  for update
  using (organization_id::text = current_setting('app.current_org', true))
  with check (organization_id::text = current_setting('app.current_org', true));
