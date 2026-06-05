-- 2026-03-10_opportunity_activity_bootstrap_and_seed.sql
-- Idempotent bootstrap for opportunity activity follow-ups + demo seed data.

create extension if not exists pgcrypto;

-- Base opportunities table (safe if it already exists).
create table if not exists public.opportunity_leads (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  organization_name text not null,
  primary_contact_name text null,
  primary_contact_phone text null,
  primary_contact_email text null,
  industry text null,
  estimated_employees integer null,
  last_contacted_at timestamptz null,
  last_contacted_by uuid null references auth.users(id),
  source text null,
  notes text null,
  created_by uuid null references auth.users(id)
);

alter table public.opportunity_leads
  add column if not exists industry text;

alter table public.opportunity_leads
  add column if not exists estimated_employees integer;

create index if not exists idx_opportunity_leads_created_at
  on public.opportunity_leads (created_at desc);

create index if not exists idx_opportunity_leads_last_contacted_at
  on public.opportunity_leads (last_contacted_at desc);

create or replace function public.set_opportunity_leads_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists opportunity_leads_set_updated_at on public.opportunity_leads;
create trigger opportunity_leads_set_updated_at
before update on public.opportunity_leads
for each row execute function public.set_opportunity_leads_updated_at();

-- Contact log table with follow-up activity fields.
create table if not exists public.opportunity_contact_logs (
  id uuid primary key default gen_random_uuid(),
  opportunity_id uuid not null references public.opportunity_leads(id) on delete cascade,
  contacted_by uuid not null references auth.users(id),
  contacted_at timestamptz not null default now(),
  channel text null,
  follow_up_type text null,
  notes text null,
  follow_up_at timestamptz null,
  got_response boolean not null default false,
  response_notes text null,
  follow_up_completed_at timestamptz null,
  follow_up_completed_by uuid null references auth.users(id),
  created_at timestamptz not null default now()
);

alter table public.opportunity_contact_logs
  add column if not exists follow_up_type text;

alter table public.opportunity_contact_logs
  add column if not exists follow_up_completed_at timestamptz;

alter table public.opportunity_contact_logs
  add column if not exists follow_up_completed_by uuid references auth.users(id);

update public.opportunity_contact_logs
set follow_up_type = case
  when lower(trim(coalesce(channel, ''))) in ('phone', 'email', 'text', 'linkedin', 'meeting', 'proposal', 'documents', 'other')
    then lower(trim(channel))
  when lower(trim(coalesce(channel, ''))) in ('linked in', 'linked_in')
    then 'linkedin'
  when lower(trim(coalesce(channel, ''))) in ('document', 'docs')
    then 'documents'
  when follow_up_at is not null
    then 'other'
  else null
end
where follow_up_type is null;

create index if not exists idx_opportunity_contact_logs_opportunity
  on public.opportunity_contact_logs (opportunity_id);

create index if not exists idx_opportunity_contact_logs_contacted_at
  on public.opportunity_contact_logs (contacted_at desc);

create index if not exists idx_opportunity_contact_logs_response
  on public.opportunity_contact_logs (got_response, contacted_at desc);

create index if not exists idx_opportunity_contact_logs_follow_up_type
  on public.opportunity_contact_logs (follow_up_type);

create index if not exists idx_opportunity_contact_logs_follow_up_schedule
  on public.opportunity_contact_logs (follow_up_type, follow_up_at desc)
  where follow_up_at is not null;

create index if not exists idx_opportunity_contact_logs_completed_at
  on public.opportunity_contact_logs (follow_up_completed_at desc);

create index if not exists idx_opportunity_contact_logs_completed_by
  on public.opportunity_contact_logs (follow_up_completed_by);

alter table public.opportunity_leads enable row level security;
alter table public.opportunity_contact_logs enable row level security;

-- Policies only created if your role helper exists.
do $$
begin
  if to_regprocedure('public.gf1_has_role(uuid,text[])') is null then
    raise notice 'Skipping gf1_* policies because public.gf1_has_role(uuid,text[]) was not found.';
  else
    execute 'drop policy if exists "gf1_opportunity_leads_rw_creator" on public.opportunity_leads';
    execute 'create policy "gf1_opportunity_leads_rw_creator"
      on public.opportunity_leads
      using (
        gf1_has_role(auth.uid(), array[''''sales'''',''''sales_manager'''',''''admin''''])
        and (created_by = auth.uid() or gf1_has_role(auth.uid(), array[''''sales_manager'''',''''admin'''']))
      )
      with check (
        gf1_has_role(auth.uid(), array[''''sales'''',''''sales_manager'''',''''admin''''])
        and (created_by = auth.uid() or gf1_has_role(auth.uid(), array[''''sales_manager'''',''''admin'''']))
      )';

    execute 'drop policy if exists "gf1_opportunity_leads_read_all_staff" on public.opportunity_leads';
    execute 'create policy "gf1_opportunity_leads_read_all_staff"
      on public.opportunity_leads
      for select
      using (gf1_has_role(auth.uid(), array[''''sales'''',''''sales_manager'''',''''admin'''']))';

    execute 'drop policy if exists "gf1_opportunity_contact_logs_read" on public.opportunity_contact_logs';
    execute 'create policy "gf1_opportunity_contact_logs_read"
      on public.opportunity_contact_logs
      for select
      using (gf1_has_role(auth.uid(), array[''''sales'''',''''sales_manager'''',''''admin'''']))';

    execute 'drop policy if exists "gf1_opportunity_contact_logs_insert" on public.opportunity_contact_logs';
    execute 'create policy "gf1_opportunity_contact_logs_insert"
      on public.opportunity_contact_logs
      for insert
      with check (gf1_has_role(auth.uid(), array[''''sales'''',''''sales_manager'''',''''admin'''']))';

    execute 'drop policy if exists "gf1_opportunity_contact_logs_update" on public.opportunity_contact_logs';
    execute 'create policy "gf1_opportunity_contact_logs_update"
      on public.opportunity_contact_logs
      for update
      using (
        gf1_has_role(auth.uid(), array[''''sales'''',''''sales_manager'''',''''admin''''])
        and (contacted_by = auth.uid() or gf1_has_role(auth.uid(), array[''''sales_manager'''',''''admin'''']))
      )
      with check (
        gf1_has_role(auth.uid(), array[''''sales'''',''''sales_manager'''',''''admin''''])
        and (contacted_by = auth.uid() or gf1_has_role(auth.uid(), array[''''sales_manager'''',''''admin'''']))
      )';
  end if;
end $$;

create or replace view public.opportunity_leads_vw as
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

-- Seed: 3 demo follow-ups for the current week.
-- Re-runnable: old demo rows are removed and reinserted.
do $$
declare
  seed_user_id uuid;
  lead_a uuid;
  lead_b uuid;
  lead_c uuid;
  week_start timestamptz;
begin
  select u.id
  into seed_user_id
  from auth.users u
  order by u.created_at asc
  limit 1;

  if seed_user_id is null then
    raise exception 'No rows found in auth.users. Create at least one user before running this seed.';
  end if;

  select id into lead_a
  from public.opportunity_leads
  where organization_name = 'DEMO Follow-up Org Alpha'
  order by created_at desc
  limit 1;

  if lead_a is null then
    insert into public.opportunity_leads (
      organization_name,
      primary_contact_name,
      primary_contact_phone,
      primary_contact_email,
      source,
      notes,
      created_by
    )
    values (
      'DEMO Follow-up Org Alpha',
      'Alex Carter',
      '(555) 111-0101',
      'alex.alpha@example.com',
      'seed',
      'Seed org for activity testing',
      seed_user_id
    )
    returning id into lead_a;
  end if;

  select id into lead_b
  from public.opportunity_leads
  where organization_name = 'DEMO Follow-up Org Bravo'
  order by created_at desc
  limit 1;

  if lead_b is null then
    insert into public.opportunity_leads (
      organization_name,
      primary_contact_name,
      primary_contact_phone,
      primary_contact_email,
      source,
      notes,
      created_by
    )
    values (
      'DEMO Follow-up Org Bravo',
      'Brooke Daniels',
      '(555) 111-0102',
      'brooke.bravo@example.com',
      'seed',
      'Seed org for activity testing',
      seed_user_id
    )
    returning id into lead_b;
  end if;

  select id into lead_c
  from public.opportunity_leads
  where organization_name = 'DEMO Follow-up Org Charlie'
  order by created_at desc
  limit 1;

  if lead_c is null then
    insert into public.opportunity_leads (
      organization_name,
      primary_contact_name,
      primary_contact_phone,
      primary_contact_email,
      source,
      notes,
      created_by
    )
    values (
      'DEMO Follow-up Org Charlie',
      'Casey Evans',
      '(555) 111-0103',
      'casey.charlie@example.com',
      'seed',
      'Seed org for activity testing',
      seed_user_id
    )
    returning id into lead_c;
  end if;

  delete from public.opportunity_contact_logs
  where notes like '[seed_demo_followup]%';

  week_start := date_trunc('week', now());

  insert into public.opportunity_contact_logs (
    opportunity_id,
    contacted_by,
    contacted_at,
    channel,
    follow_up_type,
    notes,
    follow_up_at,
    got_response,
    response_notes
  )
  values
    (
      lead_a,
      seed_user_id,
      now() - interval '2 days',
      'phone',
      'phone',
      '[seed_demo_followup] Call Alex re: proposal questions',
      week_start + interval '1 day' + interval '09:00',
      false,
      null
    ),
    (
      lead_b,
      seed_user_id,
      now() - interval '1 day',
      'email',
      'email',
      '[seed_demo_followup] Send updated quote by email',
      week_start + interval '2 day' + interval '11:30',
      false,
      null
    ),
    (
      lead_c,
      seed_user_id,
      now() - interval '3 hours',
      'meeting',
      'documents',
      '[seed_demo_followup] Request final documents before meeting',
      week_start + interval '4 day' + interval '14:00',
      false,
      null
    );
end $$;
