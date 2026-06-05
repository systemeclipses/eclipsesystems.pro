alter table public.organizations
  add column if not exists implementation_owner_id uuid references auth.users(id);

alter table public.organizations
  add column if not exists implementation_owner_name text;

alter table public.organizations
  add column if not exists go_live_date date;

create table if not exists public.gf1_client_implementation_steps (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  step_key text not null,
  completed_at timestamptz null,
  completed_by uuid null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (organization_id, step_key)
);

create index if not exists idx_gf1_client_implementation_steps_org
  on public.gf1_client_implementation_steps (organization_id);

create or replace function public.set_gf1_client_implementation_steps_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists gf1_client_implementation_steps_set_updated_at on public.gf1_client_implementation_steps;
create trigger gf1_client_implementation_steps_set_updated_at
before update on public.gf1_client_implementation_steps
for each row execute function public.set_gf1_client_implementation_steps_updated_at();

alter table public.gf1_client_implementation_steps enable row level security;

drop policy if exists "gf1_client_implementation_steps_read" on public.gf1_client_implementation_steps;
create policy "gf1_client_implementation_steps_read"
  on public.gf1_client_implementation_steps
  for select
  using (public.gf1_has_role(auth.uid(), array['admin','sales','sales_manager','implementations']));

drop policy if exists "gf1_client_implementation_steps_write" on public.gf1_client_implementation_steps;
create policy "gf1_client_implementation_steps_write"
  on public.gf1_client_implementation_steps
  for all
  using (public.gf1_has_role(auth.uid(), array['admin','implementations']))
  with check (public.gf1_has_role(auth.uid(), array['admin','implementations']));
