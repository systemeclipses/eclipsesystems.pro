-- 2026-03-03_opportunity_contact_logs.sql
-- Contact attempts for opportunity leads + claim logic for responses.

-- Ensure optional lead fields exist (safe to run multiple times).
alter table public.opportunity_leads
  add column if not exists industry text;

alter table public.opportunity_leads
  add column if not exists estimated_employees integer;

create table if not exists public.opportunity_contact_logs (
  id uuid primary key default gen_random_uuid(),
  opportunity_id uuid not null references public.opportunity_leads(id) on delete cascade,
  contacted_by uuid not null references auth.users(id),
  contacted_at timestamptz not null default now(),
  channel text null,
  notes text null,
  follow_up_at timestamptz null,
  got_response boolean not null default false,
  response_notes text null,
  created_at timestamptz not null default now()
);

create index if not exists idx_opportunity_contact_logs_opportunity
  on public.opportunity_contact_logs (opportunity_id);

create index if not exists idx_opportunity_contact_logs_contacted_at
  on public.opportunity_contact_logs (contacted_at desc);

create index if not exists idx_opportunity_contact_logs_response
  on public.opportunity_contact_logs (got_response, contacted_at desc);

alter table public.opportunity_contact_logs enable row level security;

drop policy if exists "gf1_opportunity_contact_logs_read" on public.opportunity_contact_logs;
create policy "gf1_opportunity_contact_logs_read"
  on public.opportunity_contact_logs
  for select
  using (gf1_has_role(auth.uid(), array['sales','sales_manager','admin']));

drop policy if exists "gf1_opportunity_contact_logs_insert" on public.opportunity_contact_logs;
create policy "gf1_opportunity_contact_logs_insert"
  on public.opportunity_contact_logs
  for insert
  with check (gf1_has_role(auth.uid(), array['sales','sales_manager','admin']));

drop policy if exists "gf1_opportunity_contact_logs_update" on public.opportunity_contact_logs;
create policy "gf1_opportunity_contact_logs_update"
  on public.opportunity_contact_logs
  for update
  using (
    gf1_has_role(auth.uid(), array['sales','sales_manager','admin'])
    and (contacted_by = auth.uid() or gf1_has_role(auth.uid(), array['sales_manager','admin']))
  )
  with check (
    gf1_has_role(auth.uid(), array['sales','sales_manager','admin'])
    and (contacted_by = auth.uid() or gf1_has_role(auth.uid(), array['sales_manager','admin']))
  );

drop view if exists public.opportunity_leads_vw;
create view public.opportunity_leads_vw as
select
  l.id,
  l.organization_name,
  l.industry,
  l.estimated_employees,
  l.primary_contact_name,
  l.primary_contact_phone,
  l.primary_contact_email,
  coalesce(last_contact.contacted_at, l.last_contacted_at) as last_contacted_at,
  coalesce(last_contact.contacted_by, l.last_contacted_by) as last_contacted_by,
  p.name as last_contacted_by_name,
  last_contact.channel as last_contact_channel,
  last_contact.follow_up_at as last_follow_up_at,
  last_contact.notes as last_contact_notes,
  last_contact.got_response as last_contact_got_response,
  claim.claimed_by,
  claim.claimed_at,
  l.source,
  l.notes,
  l.created_by,
  l.created_at,
  l.updated_at
from public.opportunity_leads l
left join lateral (
  select e.contacted_at, e.contacted_by, e.channel, e.notes, e.follow_up_at, e.got_response
  from public.opportunity_contact_logs e
  where e.opportunity_id = l.id
  order by e.contacted_at desc
  limit 1
) last_contact on true
left join lateral (
  select e.contacted_by as claimed_by, e.contacted_at as claimed_at
  from public.opportunity_contact_logs e
  where e.opportunity_id = l.id
    and e.got_response = true
  order by e.contacted_at desc
  limit 1
) claim on true
left join public.profiles p on p.user_id = coalesce(last_contact.contacted_by, l.last_contacted_by);
