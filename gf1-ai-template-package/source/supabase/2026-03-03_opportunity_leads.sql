-- 2026-03-03_opportunity_leads.sql
-- Lead service intake stream (pre-organization) for GF1 opportunities.

create table if not exists public.opportunity_leads (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  organization_name text not null,
  primary_contact_name text null,
  primary_contact_phone text null,
  primary_contact_email text null,
  last_contacted_at timestamptz null,
  last_contacted_by uuid null references auth.users(id),
  source text null,
  notes text null,
  created_by uuid null references auth.users(id)
);

create index if not exists idx_opportunity_leads_created_at
  on public.opportunity_leads (created_at desc);

create index if not exists idx_opportunity_leads_last_contacted_at
  on public.opportunity_leads (last_contacted_at desc);

create or replace function set_opportunity_leads_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists opportunity_leads_set_updated_at on public.opportunity_leads;
create trigger opportunity_leads_set_updated_at
before update on public.opportunity_leads
for each row execute function set_opportunity_leads_updated_at();

alter table public.opportunity_leads enable row level security;

drop policy if exists "gf1_opportunity_leads_rw_creator" on public.opportunity_leads;
create policy "gf1_opportunity_leads_rw_creator"
  on public.opportunity_leads
  using (
    gf1_has_role(auth.uid(), array['sales','sales_manager','admin'])
    and (created_by = auth.uid() or gf1_has_role(auth.uid(), array['sales_manager','admin']))
  )
  with check (
    gf1_has_role(auth.uid(), array['sales','sales_manager','admin'])
    and (created_by = auth.uid() or gf1_has_role(auth.uid(), array['sales_manager','admin']))
  );

drop policy if exists "gf1_opportunity_leads_read_all_staff" on public.opportunity_leads;
create policy "gf1_opportunity_leads_read_all_staff"
  on public.opportunity_leads
  for select
  using (gf1_has_role(auth.uid(), array['sales','sales_manager','admin']));

create or replace view public.opportunity_leads_vw as
select
  l.id,
  l.organization_name,
  l.primary_contact_name,
  l.primary_contact_phone,
  l.primary_contact_email,
  l.last_contacted_at,
  l.last_contacted_by,
  p.name as last_contacted_by_name,
  l.source,
  l.notes,
  l.created_by,
  l.created_at,
  l.updated_at
from public.opportunity_leads l
left join public.profiles p on p.user_id = l.last_contacted_by;
