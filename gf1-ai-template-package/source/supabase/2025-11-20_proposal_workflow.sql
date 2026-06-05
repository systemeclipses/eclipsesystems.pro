-- 2025-11-20_gf1_proposal_workflow.sql
-- Run this inside your Supabase project's SQL editor or via the CLI.

-------------------------------
-- 0. Shared helpers & enums --
-------------------------------

create extension if not exists "pgcrypto";

create or replace function public.is_staff_or_admin(uid uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where user_id = uid
      and role in ('admin','staff')
  );
$$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'proposal_adjustment_type') then
    create type public.proposal_adjustment_type as enum ('setup', 'conversion', 'deposit', 'other');
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'proposal_request_status') then
    create type public.proposal_request_status as enum (
      'pending_intake',
      'ready_for_pricing',
      'awaiting_approval',
      'approved',
      'rejected',
      'converted'
    );
  end if;
end
$$;

alter table public.organizations
  add column if not exists industry text;

------------------------------------------
-- 1. Prospect intake data from public  --
------------------------------------------

create table if not exists public.prospect_intake_submissions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  prospect_id uuid references public.prospects(id) on delete set null,
  intake_token text not null unique,
  status text not null default 'submitted' check (status in ('draft','submitted','converted')),
  company_name text not null,
  doing_business_as text,
  fein text,
  website text,
  phone text,
  address_line1 text,
  address_line2 text,
  city text,
  state text,
  postal_code text,
  country text,
  industry text,
  headcount_total integer,
  headcount_full_time integer,
  headcount_part_time integer,
  payroll_frequency text,
  payroll_platform text,
  payroll_estimated_annual numeric(14,2),
  benefit_waiting_period text,
  benefit_carrier text,
  workers_comp_carrier text,
  current_admin_fee_percent numeric(7,4),
  service_notes text,
  additional_notes text,
  services jsonb not null default '[]'::jsonb,
  payload jsonb not null,
  submitted_by_name text,
  submitted_by_email text,
  submitted_by_phone text,
  source text,
  created_at timestamptz not null default now(),
  submitted_at timestamptz,
  updated_at timestamptz not null default now()
);

create index if not exists idx_prospect_intake_org on public.prospect_intake_submissions (organization_id);
create index if not exists idx_prospect_intake_status on public.prospect_intake_submissions (status);

create table if not exists public.prospect_intake_wc_codes (
  id uuid primary key default gen_random_uuid(),
  intake_id uuid not null references public.prospect_intake_submissions(id) on delete cascade,
  code text not null,
  description text,
  est_annual_payroll numeric(14,2),
  rate numeric(9,5),
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists idx_prospect_intake_wc_codes_intake on public.prospect_intake_wc_codes (intake_id);

alter table public.prospect_intake_submissions enable row level security;
alter table public.prospect_intake_wc_codes enable row level security;

create policy "anon_can_create_intake"
  on public.prospect_intake_submissions
  for insert
  with check (auth.role() = 'anon');

create policy "service_or_staff_read_intake"
  on public.prospect_intake_submissions
  for select
  using (auth.role() = 'service_role' or public.is_staff_or_admin(auth.uid()));

create policy "service_or_staff_update_intake"
  on public.prospect_intake_submissions
  for update
  using (auth.role() = 'service_role' or public.is_staff_or_admin(auth.uid()))
  with check (auth.role() = 'service_role' or public.is_staff_or_admin(auth.uid()));

create policy "service_only_manage_wc_intake"
  on public.prospect_intake_wc_codes
  for insert with check (auth.role() = 'service_role');

create policy "service_or_staff_read_wc_intake"
  on public.prospect_intake_wc_codes
  for select using (auth.role() = 'service_role' or public.is_staff_or_admin(auth.uid()));

create policy "service_or_staff_update_wc_intake"
  on public.prospect_intake_wc_codes
  for update using (auth.role() = 'service_role' or public.is_staff_or_admin(auth.uid()))
  with check (auth.role() = 'service_role' or public.is_staff_or_admin(auth.uid()));

----------------------------------
-- 2. Proposal request tracking --
----------------------------------

create table if not exists public.proposal_requests (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  prospect_id uuid,
  proposal_id uuid references public.proposals(id) on delete set null,
  intake_id uuid references public.prospect_intake_submissions(id) on delete set null,
  requested_by uuid references auth.users(id),
  assigned_to uuid references auth.users(id),
  status public.proposal_request_status not null default 'pending_intake',
  priority text,
  due_date date,
  summary text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

do $$
begin
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public'
      and table_name = 'prospects'
  ) and not exists (
    select 1 from pg_constraint
    where conname = 'proposal_requests_prospect_id_fkey'
  ) then
    alter table public.proposal_requests
      add constraint proposal_requests_prospect_id_fkey
      foreign key (prospect_id) references public.prospects(id) on delete set null;
  end if;
end
$$;

create index if not exists idx_proposal_requests_org on public.proposal_requests (organization_id);
create index if not exists idx_proposal_requests_status on public.proposal_requests (status);

alter table public.proposal_requests enable row level security;

create policy "service_only_manage_requests"
  on public.proposal_requests
  for insert with check (auth.role() = 'service_role');

create policy "staff_read_requests"
  on public.proposal_requests
  for select using (auth.role() = 'service_role' or public.is_staff_or_admin(auth.uid()));

create policy "staff_update_requests"
  on public.proposal_requests
  for update
  using (auth.role() = 'service_role' or public.is_staff_or_admin(auth.uid()))
  with check (auth.role() = 'service_role' or public.is_staff_or_admin(auth.uid()));

---------------------------------
-- 3. Proposal pricing storage --
---------------------------------

create table if not exists public.proposal_pricing_secure (
  proposal_id uuid primary key references public.proposals(id) on delete cascade,
  ciphertext text not null,
  iv text not null,
  auth_tag text not null,
  version integer not null default 1,
  updated_by uuid references auth.users(id),
  updated_at timestamptz not null default now()
);

alter table public.proposal_pricing_secure enable row level security;

create policy "staff_read_pricing"
  on public.proposal_pricing_secure
  for select using (auth.role() = 'service_role' or public.is_staff_or_admin(auth.uid()));

create policy "service_write_pricing"
  on public.proposal_pricing_secure
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

-----------------------------------------
-- 4. Proposal adjustments & WC fields --
-----------------------------------------

create table if not exists public.proposal_adjustments (
  id uuid primary key default gen_random_uuid(),
  proposal_id uuid not null references public.proposals(id) on delete cascade,
  label text not null,
  amount numeric(14,2) not null,
  adjustment_type public.proposal_adjustment_type not null,
  calculation_method text not null default 'flat' check (calculation_method in ('flat','percent_of_payroll','percent_of_admin_fee')),
  percentage numeric(7,4),
  sort_order integer default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_proposal_adjustments_proposal on public.proposal_adjustments (proposal_id);

create table if not exists public.proposal_wc_codes (
  id uuid primary key default gen_random_uuid(),
  proposal_id uuid not null references public.proposals(id) on delete cascade,
  code text not null,
  description text,
  est_annual_payroll numeric(14,2),
  carrier_rate numeric(9,5),
  notes text,
  sort_order integer default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_proposal_wc_codes_proposal on public.proposal_wc_codes (proposal_id);

alter table public.proposal_adjustments enable row level security;
alter table public.proposal_wc_codes enable row level security;

create policy "staff_manage_adjustments"
  on public.proposal_adjustments
  for all
  using (auth.role() = 'service_role' or public.is_staff_or_admin(auth.uid()))
  with check (auth.role() = 'service_role' or public.is_staff_or_admin(auth.uid()));

create policy "staff_manage_proposal_wc"
  on public.proposal_wc_codes
  for all
  using (auth.role() = 'service_role' or public.is_staff_or_admin(auth.uid()))
  with check (auth.role() = 'service_role' or public.is_staff_or_admin(auth.uid()));

--------------------------------
-- 5. Proposal approval audit --
--------------------------------

create table if not exists public.proposal_approvals (
  id uuid primary key default gen_random_uuid(),
  proposal_id uuid not null references public.proposals(id) on delete cascade,
  reviewer_id uuid not null references auth.users(id),
  action text not null check (action in ('requested','approved','rejected','sent_to_client')),
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists idx_proposal_approvals_proposal on public.proposal_approvals (proposal_id);

alter table public.proposal_approvals enable row level security;

create policy "staff_manage_proposal_approvals"
  on public.proposal_approvals
  for all
  using (auth.role() = 'service_role' or public.is_staff_or_admin(auth.uid()))
  with check (auth.role() = 'service_role' or public.is_staff_or_admin(auth.uid()));

----------------------------------------
-- 6. Optional generated file storage  --
----------------------------------------

create table if not exists public.proposal_documents (
  id uuid primary key default gen_random_uuid(),
  proposal_id uuid not null references public.proposals(id) on delete cascade,
  storage_path text not null,
  version integer not null default 1,
  approved_only boolean not null default true,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create index if not exists idx_proposal_documents_proposal on public.proposal_documents (proposal_id);

alter table public.proposal_documents enable row level security;

create policy "staff_manage_proposal_documents"
  on public.proposal_documents
  for all
  using (auth.role() = 'service_role' or public.is_staff_or_admin(auth.uid()))
  with check (auth.role() = 'service_role' or public.is_staff_or_admin(auth.uid()));

----------------------------------------------
-- 7. Extend proposals with approval fields --
----------------------------------------------

alter table public.proposals
  add column if not exists approval_status text not null default 'draft',
  add column if not exists approval_required boolean not null default true,
  add column if not exists approval_requested_by uuid references auth.users(id),
  add column if not exists approval_requested_at timestamptz,
  add column if not exists approval_decided_by uuid references auth.users(id),
  add column if not exists approval_decided_at timestamptz,
  add column if not exists approval_notes text,
  add column if not exists proposal_request_id uuid references public.proposal_requests(id),
  add column if not exists prospect_intake_id uuid references public.prospect_intake_submissions(id),
  add column if not exists admin_fee_percent numeric(8,4),
  add column if not exists commission_percent numeric(8,4),
  add column if not exists payroll_volume numeric(14,2),
  add column if not exists estimated_commission numeric(14,2),
  add column if not exists setup_fee_total numeric(14,2),
  add column if not exists deposit_total numeric(14,2),
  add column if not exists pricing_summary jsonb,
  add column if not exists competitor_pricing jsonb,
  alter column prospect_id drop not null;

create index if not exists idx_proposals_approval_status on public.proposals (approval_status);
create index if not exists idx_proposals_proposal_request on public.proposals (proposal_request_id);

comment on column public.proposals.approval_status is
  'workflow state: draft -> awaiting_approval -> approved/rejected -> sent_to_client -> accepted';
