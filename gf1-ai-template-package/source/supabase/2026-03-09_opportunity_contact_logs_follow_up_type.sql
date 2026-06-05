-- 2026-03-09_opportunity_contact_logs_follow_up_type.sql
-- Adds explicit follow-up categories for activity filtering.

alter table public.opportunity_contact_logs
  add column if not exists follow_up_type text;

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

create index if not exists idx_opportunity_contact_logs_follow_up_type
  on public.opportunity_contact_logs (follow_up_type);

create index if not exists idx_opportunity_contact_logs_follow_up_schedule
  on public.opportunity_contact_logs (follow_up_type, follow_up_at desc)
  where follow_up_at is not null;
