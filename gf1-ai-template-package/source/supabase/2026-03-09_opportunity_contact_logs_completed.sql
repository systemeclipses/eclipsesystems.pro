-- 2026-03-09_opportunity_contact_logs_completed.sql
-- Track completion status for activity follow-ups.

alter table public.opportunity_contact_logs
  add column if not exists follow_up_completed_at timestamptz;

alter table public.opportunity_contact_logs
  add column if not exists follow_up_completed_by uuid references auth.users(id);

create index if not exists idx_opportunity_contact_logs_completed_at
  on public.opportunity_contact_logs (follow_up_completed_at desc);

create index if not exists idx_opportunity_contact_logs_completed_by
  on public.opportunity_contact_logs (follow_up_completed_by);
