alter table public.shifts
  add column if not exists auto_clocked_out_at timestamptz,
  add column if not exists auto_clock_out_run_id text;

create index if not exists shifts_auto_clock_out_idx
  on public.shifts (organization_id, state, started_at)
  where deleted_at is null and auto_clocked_out_at is null;
