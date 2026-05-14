create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  email extensions.citext,
  phone text,
  address jsonb,
  notes text,
  default_hourly_rate numeric(19,4),
  default_currency char(3),
  is_archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint clients_currency_iso check (default_currency is null or default_currency ~ '^[A-Z]{3}$')
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  client_id uuid references public.clients(id) on delete set null,
  name text not null,
  code text,
  description text,
  color text,
  billable boolean not null default true,
  billing_type text not null default 'hourly' check (billing_type in ('hourly','fixed','non_billable')),
  hourly_rate numeric(19,4),
  fixed_amount numeric(19,4),
  budget_hours numeric(10,2),
  budget_amount numeric(19,4),
  starts_on date,
  ends_on date,
  is_archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create unique index if not exists projects_org_code_idx on public.projects (organization_id, code) where code is not null and deleted_at is null;

create table if not exists public.project_members (
  project_id uuid not null references public.projects(id) on delete cascade,
  membership_id uuid not null references public.memberships(id) on delete cascade,
  hourly_rate_override numeric(19,4),
  created_at timestamptz not null default now(),
  primary key (project_id, membership_id)
);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  name text not null,
  billable boolean not null default true,
  hourly_rate numeric(19,4),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

drop trigger if exists clients_set_updated_at on public.clients;
create trigger clients_set_updated_at before update on public.clients for each row execute function public.set_updated_at();
drop trigger if exists projects_set_updated_at on public.projects;
create trigger projects_set_updated_at before update on public.projects for each row execute function public.set_updated_at();
drop trigger if exists tasks_set_updated_at on public.tasks;
create trigger tasks_set_updated_at before update on public.tasks for each row execute function public.set_updated_at();
