-- 2025-11-21_gf1_step1.sql
-- Galactic 365 / GalForceOne STEP 1
-- Adds CRM-ready schema for leads -> intake -> proposals plus role-scoped RLS.

---------------------------
-- 0) Helper enums/rules --
---------------------------

create extension if not exists "pgcrypto";

-- Roles used for GF1. Kept as text to mirror profiles.role.
create or replace function public.gf1_get_role(uid uuid)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role
  from public.profiles
  where user_id = uid
  limit 1;
$$;

create or replace function public.gf1_has_role(uid uuid, allowed text[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(gf1_get_role(uid), '') = any(allowed);
$$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'gf1_org_status') then
    create type public.gf1_org_status as enum ('lead', 'prospect', 'client');
  end if;
  if not exists (select 1 from pg_type where typname = 'gf1_pay_frequency') then
    create type public.gf1_pay_frequency as enum ('weekly', 'biweekly', 'semimonthly', 'monthly', 'other');
  end if;
  if not exists (select 1 from pg_type where typname = 'gf1_payroll_submission_method') then
    create type public.gf1_payroll_submission_method as enum ('portal', 'email');
  end if;
  if not exists (select 1 from pg_type where typname = 'gf1_billing_model') then
    create type public.gf1_billing_model as enum ('percent_of_gross', 'flat_per_employee');
  end if;
  if not exists (select 1 from pg_type where typname = 'gf1_proposal_status') then
    create type public.gf1_proposal_status as enum ('draft', 'pending_approval', 'approved', 'rejected', 'sent_to_prospect');
  end if;
  if not exists (select 1 from pg_type where typname = 'gf1_proposal_decision') then
    create type public.gf1_proposal_decision as enum ('pending', 'approved', 'rejected');
  end if;
end$$;

------------------------
-- 1) Organizations   --
------------------------

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  status public.gf1_org_status not null default 'lead',
  legal_name text not null,
  dba_name text,
  website text,
  logo_url text,
  primary_contact_id uuid,
  address_street text,
  address_city text,
  address_state text,
  address_zip text,
  address_county text,
  description_of_operations text,
  naics_code text,
  years_in_business integer,
  company_type text,
  owners_json jsonb,
  bankruptcy_flag boolean default false,
  lawsuits_flag boolean default false,
  controlled_group_flag boolean default false,
  fein text,
  additional_feins jsonb,
  multi_state_flag boolean default false,
  local_taxes_flag boolean default false,
  total_employees integer,
  full_time_employees integer,
  part_time_employees integer,
  commission_only_employees integer,
  pay_frequency public.gf1_pay_frequency default 'biweekly',
  pay_frequency_other text,
  pay_schedule_json jsonb,
  first_check_date date,
  first_period_start date,
  first_period_end date,
  regular_commissions_or_bonuses_flag boolean default false,
  payroll_submission_method public.gf1_payroll_submission_method,
  current_payroll_provider text,
  has_remote_employees_flag boolean default false,
  remote_states jsonb,
  has_1099s_flag boolean default false,
  employees_live_vs_work_state_flag boolean default false,
  offers_health_flag boolean default false,
  offers_dental_flag boolean default false,
  offers_vision_flag boolean default false,
  other_benefit_plans text,
  wc_codes_json jsonb,
  wc_codes_annual_payroll_json jsonb,
  wc_states_json jsonb,
  pto_tracking_needed_flag boolean default false,
  has_retirement_plan_flag boolean default false,
  wants_galactic_retirement_flag boolean default false,
  gl_import_needed_flag boolean default false,
  large_employer_aca_flag boolean default false,
  labor_posters_needed_flag boolean default false,
  timekeeping_needed_flag boolean default false,
  background_checks_needed_flag boolean default false,
  drug_screenings_needed_flag boolean default false,
  wants_wotc_flag boolean default false,
  ats_needed_flag boolean default false,
  additional_reporting_needed_flag boolean default false,
  additional_details text,
  created_by uuid references auth.users(id)
);

alter table public.organizations
  alter column status set default 'lead',
  add column if not exists created_by uuid references auth.users(id),
  add column if not exists primary_contact_id uuid,
  add column if not exists dba_name text,
  add column if not exists legal_name text,
  add column if not exists description_of_operations text,
  add column if not exists naics_code text,
  add column if not exists years_in_business integer,
  add column if not exists company_type text,
  add column if not exists owners_json jsonb,
  add column if not exists bankruptcy_flag boolean default false,
  add column if not exists lawsuits_flag boolean default false,
  add column if not exists controlled_group_flag boolean default false,
  add column if not exists fein text,
  add column if not exists additional_feins jsonb,
  add column if not exists multi_state_flag boolean default false,
  add column if not exists local_taxes_flag boolean default false,
  add column if not exists total_employees integer,
  add column if not exists full_time_employees integer,
  add column if not exists part_time_employees integer,
  add column if not exists commission_only_employees integer,
  add column if not exists pay_frequency public.gf1_pay_frequency default 'biweekly',
  add column if not exists pay_frequency_other text,
  add column if not exists pay_schedule_json jsonb,
  add column if not exists first_check_date date,
  add column if not exists first_period_start date,
  add column if not exists first_period_end date,
  add column if not exists regular_commissions_or_bonuses_flag boolean default false,
  add column if not exists payroll_submission_method public.gf1_payroll_submission_method,
  add column if not exists current_payroll_provider text,
  add column if not exists has_remote_employees_flag boolean default false,
  add column if not exists remote_states jsonb,
  add column if not exists has_1099s_flag boolean default false,
  add column if not exists employees_live_vs_work_state_flag boolean default false,
  add column if not exists offers_health_flag boolean default false,
  add column if not exists offers_dental_flag boolean default false,
  add column if not exists offers_vision_flag boolean default false,
  add column if not exists other_benefit_plans text,
  add column if not exists wc_codes_json jsonb,
  add column if not exists wc_codes_annual_payroll_json jsonb,
  add column if not exists wc_states_json jsonb,
  add column if not exists pto_tracking_needed_flag boolean default false,
  add column if not exists has_retirement_plan_flag boolean default false,
  add column if not exists wants_galactic_retirement_flag boolean default false,
  add column if not exists gl_import_needed_flag boolean default false,
  add column if not exists large_employer_aca_flag boolean default false,
  add column if not exists labor_posters_needed_flag boolean default false,
  add column if not exists timekeeping_needed_flag boolean default false,
  add column if not exists background_checks_needed_flag boolean default false,
  add column if not exists drug_screenings_needed_flag boolean default false,
  add column if not exists wants_wotc_flag boolean default false,
  add column if not exists ats_needed_flag boolean default false,
  add column if not exists additional_reporting_needed_flag boolean default false,
  add column if not exists additional_details text;

-- Ensure FK is present for primary_contact_id when contacts exists.
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'contacts' and column_name = 'id'
  ) and not exists (
    select 1 from pg_constraint
    where conname = 'organizations_primary_contact_fk'
      and conrelid = 'public.organizations'::regclass
  ) then
    alter table public.organizations
      add constraint organizations_primary_contact_fk
      foreign key (primary_contact_id) references public.contacts(id) on delete set null;
  end if;
end $$;

create index if not exists idx_org_status on public.organizations (status);

alter table public.organizations enable row level security;

drop policy if exists "gf1_org_rw_creator" on public.organizations;
create policy "gf1_org_rw_creator"
  on public.organizations
  using (
    gf1_has_role(auth.uid(), array['sales','sales_manager','admin'])
    and (created_by = auth.uid() or gf1_has_role(auth.uid(), array['sales_manager','admin']))
  )
  with check (
    gf1_has_role(auth.uid(), array['sales','sales_manager','admin'])
    and (created_by = auth.uid() or gf1_has_role(auth.uid(), array['sales_manager','admin']))
  );

-- Allow all GF1 roles to read organizations regardless of creator.
drop policy if exists "gf1_org_read_all_staff" on public.organizations;
create policy "gf1_org_read_all_staff"
  on public.organizations
  for select
  using (gf1_has_role(auth.uid(), array['sales','sales_manager','admin']));

------------------------
-- 2) Contacts/People --
------------------------

create table if not exists public.contacts (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  full_name text not null,
  title text,
  phone text,
  email text,
  is_primary boolean default false
);

create index if not exists idx_contacts_org on public.contacts (organization_id);
alter table public.contacts enable row level security;

drop policy if exists "gf1_contacts_rw_by_org" on public.contacts;
create policy "gf1_contacts_rw_by_org"
  on public.contacts
  using (
    gf1_has_role(auth.uid(), array['sales','sales_manager','admin'])
    and exists (
      select 1 from public.organizations o
      where o.id = organization_id
        and (o.created_by = auth.uid() or gf1_has_role(auth.uid(), array['sales_manager','admin']))
    )
  )
  with check (
    gf1_has_role(auth.uid(), array['sales','sales_manager','admin'])
    and exists (
      select 1 from public.organizations o
      where o.id = organization_id
        and (o.created_by = auth.uid() or gf1_has_role(auth.uid(), array['sales_manager','admin']))
    )
  );

-- Read-all for contacts (staff/manager/admin).
drop policy if exists "gf1_contacts_read_all_staff" on public.contacts;
create policy "gf1_contacts_read_all_staff"
  on public.contacts
  for select
  using (
    gf1_has_role(auth.uid(), array['sales','sales_manager','admin'])
  );

------------------------
-- 3) Worksites       --
------------------------

create table if not exists public.worksites (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  street text,
  city text,
  state text,
  zip text,
  county text
);

create index if not exists idx_worksites_org on public.worksites (organization_id);
alter table public.worksites enable row level security;

drop policy if exists "gf1_worksites_rw_by_org" on public.worksites;
create policy "gf1_worksites_rw_by_org"
  on public.worksites
  using (
    gf1_has_role(auth.uid(), array['sales','sales_manager','admin'])
    and exists (
      select 1 from public.organizations o
      where o.id = organization_id
        and (o.created_by = auth.uid() or gf1_has_role(auth.uid(), array['sales_manager','admin']))
    )
  )
  with check (
    gf1_has_role(auth.uid(), array['sales','sales_manager','admin'])
    and exists (
      select 1 from public.organizations o
      where o.id = organization_id
        and (o.created_by = auth.uid() or gf1_has_role(auth.uid(), array['sales_manager','admin']))
    )
  );

-- Read-all for worksites (staff/manager/admin).
drop policy if exists "gf1_worksites_read_all_staff" on public.worksites;
create policy "gf1_worksites_read_all_staff"
  on public.worksites
  for select
  using (gf1_has_role(auth.uid(), array['sales','sales_manager','admin']));

------------------------
-- 4) Intake tokens   --
------------------------

create table if not exists public.gf1_intake_tokens (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  created_by uuid references auth.users(id),
  token text not null unique,
  expires_at timestamptz not null,
  used_at timestamptz
);

create index if not exists idx_gf1_intake_org on public.gf1_intake_tokens (organization_id);
alter table public.gf1_intake_tokens enable row level security;

drop policy if exists "gf1_intake_public_read" on public.gf1_intake_tokens;
create policy "gf1_intake_public_read"
  on public.gf1_intake_tokens
  for select
  using (
    (auth.role() = 'anon' and expires_at > now())
    or gf1_has_role(auth.uid(), array['sales','sales_manager','admin'])
  );

drop policy if exists "gf1_intake_manage_staff" on public.gf1_intake_tokens;
create policy "gf1_intake_manage_staff"
  on public.gf1_intake_tokens
  for all
  using (gf1_has_role(auth.uid(), array['sales','sales_manager','admin']))
  with check (gf1_has_role(auth.uid(), array['sales','sales_manager','admin']));

------------------------
-- 5) Proposals       --
------------------------

create table if not exists public.proposals (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  created_by uuid references auth.users(id),
  status public.gf1_proposal_status not null default 'draft',
  base_price_per_employee_per_year numeric,
  minimum_price_per_employee_per_year numeric,
  annual_admin_target numeric,
  billing_model public.gf1_billing_model,
  percent_of_gross numeric,
  flat_admin_fee_per_employee_per_period numeric,
  modeled_employee_count integer,
  notes_for_internal text,
  notes_for_prospect text,
  services_json jsonb,
  pdf_url text
);

alter table public.proposals
  add column if not exists created_by uuid references auth.users(id),
  add column if not exists base_price_per_employee_per_year numeric,
  add column if not exists minimum_price_per_employee_per_year numeric,
  add column if not exists annual_admin_target numeric,
  add column if not exists billing_model public.gf1_billing_model,
  add column if not exists percent_of_gross numeric,
  add column if not exists flat_admin_fee_per_employee_per_period numeric,
  add column if not exists modeled_employee_count integer,
  add column if not exists notes_for_internal text,
  add column if not exists notes_for_prospect text,
  add column if not exists services_json jsonb,
  add column if not exists pdf_url text;

alter table public.proposals enable row level security;

drop policy if exists "gf1_proposals_rw_creator" on public.proposals;
create policy "gf1_proposals_rw_creator"
  on public.proposals
  using (
    gf1_has_role(auth.uid(), array['sales','sales_manager','admin'])
    and (created_by = auth.uid() or gf1_has_role(auth.uid(), array['sales_manager','admin']))
  )
  with check (
    gf1_has_role(auth.uid(), array['sales','sales_manager','admin'])
    and (created_by = auth.uid() or gf1_has_role(auth.uid(), array['sales_manager','admin']))
  );

------------------------
-- 6) Proposal approval
------------------------

create table if not exists public.proposal_approvals (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  proposal_id uuid not null references public.proposals(id) on delete cascade,
  reviewer_id uuid not null references auth.users(id),
  decision public.gf1_proposal_decision not null default 'pending',
  decision_at timestamptz,
  comments text
);

alter table public.proposal_approvals
  add column if not exists decision public.gf1_proposal_decision not null default 'pending',
  add column if not exists decision_at timestamptz,
  add column if not exists comments text;

create index if not exists idx_proposal_approvals_proposal on public.proposal_approvals (proposal_id);
alter table public.proposal_approvals enable row level security;

drop policy if exists "gf1_proposal_approvals_staff" on public.proposal_approvals;
create policy "gf1_proposal_approvals_staff"
  on public.proposal_approvals
  using (gf1_has_role(auth.uid(), array['sales','sales_manager','admin']))
  with check (gf1_has_role(auth.uid(), array['sales','sales_manager','admin']));

-- Approval/read access for managers to see all proposals.
drop policy if exists "gf1_proposals_manager_read_all" on public.proposals;
create policy "gf1_proposals_manager_read_all"
  on public.proposals
  for select
  using (gf1_has_role(auth.uid(), array['sales_manager','admin']));

-- Default creator-level access is handled in gf1_proposals_rw_creator.

--------------------------------------
-- 7) Leads table (pipeline visibility)
--------------------------------------

do $$
begin
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'leads'
  ) then
    alter table public.leads enable row level security;

    drop policy if exists "gf1_leads_read_staff" on public.leads;
    create policy "gf1_leads_read_staff"
      on public.leads
      for select
      using (gf1_has_role(auth.uid(), array['sales','sales_manager','admin']));

    -- Write policy: if leads.created_by exists, scope to owner or manager/admin; otherwise allow GF1 roles to write.
    drop policy if exists "gf1_leads_write_owner" on public.leads;
    if exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = 'leads' and column_name = 'created_by'
    ) then
      create policy "gf1_leads_write_owner"
        on public.leads
        for all
        using (
          gf1_has_role(auth.uid(), array['sales','sales_manager','admin'])
          and (created_by = auth.uid() or gf1_has_role(auth.uid(), array['sales_manager','admin']))
        )
        with check (
          gf1_has_role(auth.uid(), array['sales','sales_manager','admin'])
          and (created_by = auth.uid() or gf1_has_role(auth.uid(), array['sales_manager','admin']))
        );
    else
      create policy "gf1_leads_write_owner"
        on public.leads
        for all
        using (gf1_has_role(auth.uid(), array['sales','sales_manager','admin']))
        with check (gf1_has_role(auth.uid(), array['sales','sales_manager','admin']));
    end if;
  end if;
end $$;
