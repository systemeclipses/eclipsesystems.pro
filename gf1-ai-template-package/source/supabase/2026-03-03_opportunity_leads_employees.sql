-- 2026-03-03_opportunity_leads_employees.sql
-- Adds estimated employees to opportunity leads and updates the view.

alter table public.opportunity_leads
  add column if not exists estimated_employees integer;

drop view if exists public.opportunity_leads_vw;
create view public.opportunity_leads_vw as
select
  l.id,
  l.organization_name,
  l.industry,
  l.estimated_employees,
  l.primary_contact_name,
  l.primary_contact_phone,
  l.primary_contact_email,
  l.last_contacted_at,
  l.last_contacted_by,
  p.name as last_contacted_by_name,
  l.source,
  l.notes,
  l.created_by,
  l.created_at,
  l.updated_at
from public.opportunity_leads l
left join public.profiles p on p.user_id = l.last_contacted_by;
