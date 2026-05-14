create or replace view public.v_org_seat_usage
with (security_invoker = true)
as
select
  o.id as organization_id,
  count(m.id)::int as used_seats,
  s.plan,
  s.seats as allowed_seats
from public.organizations o
left join public.memberships m on m.organization_id = o.id and m.status = 'active' and m.deleted_at is null
left join public.subscriptions s on s.organization_id = o.id
where o.deleted_at is null
group by o.id, s.plan, s.seats;

create or replace view public.v_time_by_member_week
with (security_invoker = true)
as
select
  organization_id,
  membership_id,
  date_trunc('week', started_at)::date as iso_week,
  (sum(coalesce(duration_seconds, 0)) / 3600.0)::numeric(10,2) as total_hours,
  (sum(case when billable then coalesce(duration_seconds, 0) else 0 end) / 3600.0)::numeric(10,2) as billable_hours,
  coalesce(sum(case when billable then amount else 0 end), 0)::numeric(19,4) as billable_amount
from public.time_entries
where deleted_at is null
group by organization_id, membership_id, date_trunc('week', started_at)::date;

create or replace view public.v_time_by_project
with (security_invoker = true)
as
select
  p.organization_id,
  p.id as project_id,
  (sum(coalesce(te.duration_seconds, 0)) / 3600.0)::numeric(10,2) as total_hours,
  coalesce(sum(case when te.billable then te.amount else 0 end), 0)::numeric(19,4) as billable_amount,
  case when p.budget_hours is null or p.budget_hours = 0 then null
       else ((sum(coalesce(te.duration_seconds, 0)) / 3600.0) / p.budget_hours * 100)::numeric(10,2)
  end as budget_pct_used
from public.projects p
left join public.time_entries te on te.project_id = p.id and te.deleted_at is null
where p.deleted_at is null
group by p.organization_id, p.id, p.budget_hours;

create or replace view public.v_invoice_summary
with (security_invoker = true)
as
select
  organization_id,
  coalesce(sum(total - amount_paid) filter (where status in ('sent','viewed','partially_paid','overdue')), 0)::numeric(19,4) as total_outstanding,
  count(*) filter (where due_date < current_date and status in ('sent','viewed','partially_paid','overdue'))::int as overdue_count,
  coalesce(sum(total - amount_paid) filter (where due_date < current_date and status in ('sent','viewed','partially_paid','overdue')), 0)::numeric(19,4) as overdue_amount,
  coalesce(sum(total) filter (where status = 'paid'), 0)::numeric(19,4) as paid_total
from public.invoices
where deleted_at is null
group by organization_id;

create or replace view public.v_subordinate_time
with (security_invoker = true)
as
with recursive tree as (
  select manager.id as manager_membership_id, child.id as member_id, child.manager_id, child.organization_id
  from public.memberships manager
  join public.memberships child on child.manager_id = manager.id
  where manager.deleted_at is null and child.deleted_at is null
  union all
  select t.manager_membership_id, child.id, child.manager_id, child.organization_id
  from tree t
  join public.memberships child on child.manager_id = t.member_id
  where child.deleted_at is null
)
select
  t.organization_id,
  t.manager_membership_id,
  t.member_id,
  date_trunc('week', te.started_at)::date as week,
  (sum(coalesce(te.duration_seconds, 0)) / 3600.0)::numeric(10,2) as hours,
  (sum(case when te.billable then coalesce(te.duration_seconds, 0) else 0 end) / 3600.0)::numeric(10,2) as billable
from tree t
join public.time_entries te on te.membership_id = t.member_id and te.deleted_at is null
group by t.organization_id, t.manager_membership_id, t.member_id, date_trunc('week', te.started_at)::date;

create or replace view public.v_running_timers
with (security_invoker = true)
as
select
  te.organization_id,
  te.membership_id,
  p.full_name,
  te.started_at,
  extract(epoch from (now() - te.started_at))::int as elapsed_seconds
from public.time_entries te
join public.memberships m on m.id = te.membership_id
join public.profiles p on p.id = m.user_id
where te.deleted_at is null and te.ended_at is null;
