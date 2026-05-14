create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  kind public.org_kind not null default 'team',
  name text not null,
  slug extensions.citext unique,
  owner_id uuid not null references public.profiles(id) on delete restrict,
  stripe_customer_id text unique,
  default_currency char(3) not null default 'USD',
  timezone text not null default 'UTC',
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint organizations_currency_iso check (default_currency ~ '^[A-Z]{3}$')
);

create table if not exists public.memberships (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role public.member_role not null default 'member',
  manager_id uuid references public.memberships(id) on delete set null,
  billable_rate numeric(19,4),
  cost_rate numeric(19,4),
  job_title text,
  employment_type text check (employment_type is null or employment_type in ('employee','contractor','intern')),
  invited_by uuid references public.profiles(id) on delete set null,
  invited_at timestamptz,
  accepted_at timestamptz,
  status text not null default 'active' check (status in ('active','suspended','removed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (organization_id, user_id),
  constraint memberships_no_self_manager check (manager_id is null or manager_id <> id)
);

create index if not exists memberships_org_user_idx on public.memberships (organization_id, user_id) where deleted_at is null;
create index if not exists memberships_manager_idx on public.memberships (manager_id) where deleted_at is null;

create table if not exists public.invitations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  email extensions.citext not null,
  role public.member_role not null default 'member',
  manager_id uuid references public.memberships(id) on delete set null,
  token text not null unique default encode(gen_random_bytes(24), 'base64url'),
  status public.invite_status not null default 'pending',
  invited_by uuid references public.profiles(id) on delete set null,
  expires_at timestamptz not null default (now() + interval '14 days'),
  accepted_by uuid references public.profiles(id) on delete set null,
  accepted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create unique index if not exists invitations_one_pending_email_idx
  on public.invitations (organization_id, email)
  where status = 'pending' and deleted_at is null;

do $$ begin
  alter table public.profiles
    add constraint profiles_default_org_fk foreign key (default_organization_id)
    references public.organizations(id) on delete set null;
exception when duplicate_object then null;
end $$;

drop trigger if exists organizations_set_updated_at on public.organizations;
create trigger organizations_set_updated_at before update on public.organizations
for each row execute function public.set_updated_at();
drop trigger if exists memberships_set_updated_at on public.memberships;
create trigger memberships_set_updated_at before update on public.memberships
for each row execute function public.set_updated_at();
drop trigger if exists invitations_set_updated_at on public.invitations;
create trigger invitations_set_updated_at before update on public.invitations
for each row execute function public.set_updated_at();
