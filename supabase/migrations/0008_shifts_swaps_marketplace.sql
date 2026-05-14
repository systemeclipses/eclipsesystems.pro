create table if not exists public.shift_locations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  address jsonb,
  timezone text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.shift_roles (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  color text,
  default_rate numeric(19,4),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.shifts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  location_id uuid references public.shift_locations(id) on delete set null,
  role_id uuid references public.shift_roles(id) on delete set null,
  assigned_to uuid references public.memberships(id) on delete set null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  break_minutes int not null default 0,
  status public.shift_status not null default 'open',
  notes text,
  rate numeric(19,4),
  created_by uuid not null references public.memberships(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint shifts_ends_after_starts check (ends_at > starts_at),
  exclude using gist (
    assigned_to with =,
    tstzrange(starts_at, ends_at, '[)') with &&
  ) where (assigned_to is not null and deleted_at is null and status not in ('dropped','no_show','canceled'))
);

create table if not exists public.shift_swap_requests (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  shift_id uuid not null references public.shifts(id) on delete cascade,
  requested_by uuid not null references public.memberships(id) on delete cascade,
  offered_to uuid references public.memberships(id) on delete set null,
  status public.swap_status not null default 'requested',
  message text,
  responded_at timestamptz,
  responded_by uuid references public.memberships(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.shift_marketplace_posts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  shift_id uuid not null unique references public.shifts(id) on delete cascade,
  posted_by uuid not null references public.memberships(id) on delete cascade,
  posted_at timestamptz not null default now(),
  claimed_by uuid references public.memberships(id) on delete set null,
  claimed_at timestamptz,
  requires_approval boolean not null default true,
  approved_by uuid references public.memberships(id) on delete set null,
  approved_at timestamptz,
  status text not null default 'open' check (status in ('open','claimed','approved','expired','canceled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

drop trigger if exists shifts_set_updated_at on public.shifts;
create trigger shifts_set_updated_at before update on public.shifts for each row execute function public.set_updated_at();
