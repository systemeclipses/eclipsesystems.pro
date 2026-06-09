create extension if not exists pgcrypto;

create table if not exists public.onboarding_checklists (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.onboarding_task_templates (
  id uuid primary key default gen_random_uuid(),
  checklist_id uuid not null references public.onboarding_checklists(id) on delete cascade,
  org_id uuid not null references public.organizations(id) on delete cascade,
  key text not null,
  title text not null,
  type text not null check (type in ('profile','address','emergency_contact','direct_deposit','i9','w4','document_ack','video','custom_form','signoff')),
  position integer not null default 0,
  required boolean not null default true,
  config jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (checklist_id, key)
);

create table if not exists public.onboarding_instances (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  employee_id text not null,
  checklist_id uuid not null references public.onboarding_checklists(id) on delete restrict,
  status text not null default 'not_started' check (status in ('not_started','in_progress','complete')),
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (org_id, employee_id)
);

create table if not exists public.onboarding_task_progress (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  instance_id uuid not null references public.onboarding_instances(id) on delete cascade,
  task_template_id uuid not null references public.onboarding_task_templates(id) on delete cascade,
  status text not null default 'not_started' check (status in ('not_started','in_progress','complete')),
  data jsonb not null default '{}'::jsonb,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (instance_id, task_template_id)
);

create table if not exists public.signatures (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  signer_profile_id text not null,
  kind text not null check (kind in ('typed','drawn')),
  value text not null,
  doc_ref text not null,
  ip text,
  user_agent text,
  created_at timestamptz not null default now()
);

create table if not exists public.form_submissions (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  employee_id text not null,
  form_type text not null check (form_type in ('i9','w4','direct_deposit','custom')),
  encrypted_data text not null,
  encryption_key_id text not null,
  data_mask jsonb not null default '{}'::jsonb,
  status text not null default 'submitted',
  submitted_at timestamptz not null default now(),
  signature_id uuid references public.signatures(id) on delete set null,
  updated_at timestamptz not null default now()
);

create table if not exists public.onboarding_documents (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  title text not null,
  kind text not null check (kind in ('handbook','policy','video')),
  body text,
  url text,
  version_hash text not null,
  requires_ack boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.document_acknowledgments (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  employee_id text not null,
  document_id uuid not null references public.onboarding_documents(id) on delete cascade,
  version_hash text not null,
  acknowledged_at timestamptz not null default now(),
  signature_id uuid references public.signatures(id) on delete set null,
  unique (employee_id, document_id, version_hash)
);

create index if not exists onboarding_instances_org_employee_idx on public.onboarding_instances(org_id, employee_id);
create index if not exists onboarding_task_progress_instance_idx on public.onboarding_task_progress(instance_id);
create index if not exists form_submissions_org_employee_idx on public.form_submissions(org_id, employee_id, form_type);
create index if not exists onboarding_documents_org_idx on public.onboarding_documents(org_id);
create unique index if not exists onboarding_checklists_one_default_per_org_idx
  on public.onboarding_checklists(org_id)
  where is_default;
create unique index if not exists onboarding_documents_org_title_version_idx
  on public.onboarding_documents(org_id, title, version_hash);

alter table public.onboarding_checklists enable row level security;
alter table public.onboarding_task_templates enable row level security;
alter table public.onboarding_instances enable row level security;
alter table public.onboarding_task_progress enable row level security;
alter table public.form_submissions enable row level security;
alter table public.onboarding_documents enable row level security;
alter table public.document_acknowledgments enable row level security;
alter table public.signatures enable row level security;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'onboarding_checklists',
    'onboarding_task_templates',
    'onboarding_instances',
    'onboarding_task_progress',
    'form_submissions',
    'onboarding_documents',
    'document_acknowledgments',
    'signatures'
  ] loop
    execute format('drop policy if exists %I_org_select on public.%I', table_name, table_name);
    execute format('create policy %I_org_select on public.%I for select using (org_id::text = current_setting(''app.current_org'', true))', table_name, table_name);
    execute format('drop policy if exists %I_org_insert on public.%I', table_name, table_name);
    execute format('create policy %I_org_insert on public.%I for insert with check (org_id::text = current_setting(''app.current_org'', true))', table_name, table_name);
    execute format('drop policy if exists %I_org_update on public.%I', table_name, table_name);
    execute format('create policy %I_org_update on public.%I for update using (org_id::text = current_setting(''app.current_org'', true)) with check (org_id::text = current_setting(''app.current_org'', true))', table_name, table_name);
  end loop;
end $$;
