create table if not exists public.shifts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  membership_id uuid not null,
  time_entry_id uuid,
  state text not null default 'CLOCKED_IN',
  started_at timestamptz not null,
  ended_at timestamptz,
  current_break_started_at timestamptz,
  flag_reason text,
  site_id uuid,
  start_punch_id uuid,
  end_punch_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint shifts_state_check check (state in ('CLOCKED_OUT', 'CLOCKED_IN', 'ON_BREAK', 'PENDING_REVIEW', 'LOCKED'))
);

create table if not exists public.punches (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  membership_id uuid not null,
  shift_id uuid,
  request_id text,
  type text not null,
  timestamp timestamptz not null default now(),
  location jsonb,
  site_id uuid,
  note text,
  device_info jsonb,
  previous_state text,
  new_state text,
  flags jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  constraint punches_type_check check (type in ('clock_in', 'clock_out', 'break_start', 'break_end', 'auto_clock_out', 'manager_correction', 'flag_for_review', 'resolve_flag'))
);

create unique index if not exists punches_request_id_idx on public.punches (request_id) where request_id is not null;
create index if not exists shifts_active_idx on public.shifts (organization_id, membership_id, state) where deleted_at is null;
create index if not exists punches_shift_idx on public.punches (shift_id, timestamp);
