create table if not exists public.audit_log (
  id bigserial primary key,
  organization_id uuid,
  actor_id uuid references public.profiles(id) on delete set null,
  table_name text not null,
  record_id uuid,
  action text not null check (action in ('insert','update','delete','soft_delete')),
  old_data jsonb,
  new_data jsonb,
  diff jsonb,
  ip_address inet,
  user_agent text,
  occurred_at timestamptz not null default now()
);

create index if not exists audit_log_table_record_idx on public.audit_log (table_name, record_id);
create index if not exists audit_log_org_occurred_idx on public.audit_log (organization_id, occurred_at desc);
create index if not exists audit_log_actor_occurred_idx on public.audit_log (actor_id, occurred_at desc);

create or replace function public.jsonb_diff(old_row jsonb, new_row jsonb)
returns jsonb
language sql
immutable
set search_path = public, pg_temp
as $$
  select coalesce(jsonb_object_agg(n.key, jsonb_build_object('old', o.value, 'new', n.value)), '{}'::jsonb)
  from jsonb_each(new_row) n
  left join jsonb_each(old_row) o using (key)
  where o.value is distinct from n.value;
$$;

create or replace function public.tg_audit()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  old_json jsonb;
  new_json jsonb;
  org_id uuid;
  row_id uuid;
  audit_action text;
begin
  old_json := case when tg_op in ('UPDATE','DELETE') then to_jsonb(old) else null end;
  new_json := case when tg_op in ('INSERT','UPDATE') then to_jsonb(new) else null end;
  org_id := coalesce((new_json ->> 'organization_id')::uuid, (old_json ->> 'organization_id')::uuid);
  row_id := coalesce((new_json ->> 'id')::uuid, (old_json ->> 'id')::uuid);
  audit_action := lower(tg_op);
  if tg_op = 'UPDATE' and old_json ->> 'deleted_at' is null and new_json ->> 'deleted_at' is not null then
    audit_action := 'soft_delete';
  end if;

  insert into public.audit_log (organization_id, actor_id, table_name, record_id, action, old_data, new_data, diff)
  values (org_id, auth.uid(), tg_table_name, row_id, audit_action, old_json, new_json, public.jsonb_diff(coalesce(old_json, '{}'::jsonb), coalesce(new_json, '{}'::jsonb)));

  return coalesce(new, old);
end;
$$;

drop trigger if exists audit_time_entries on public.time_entries;
create trigger audit_time_entries after insert or update or delete on public.time_entries for each row execute function public.tg_audit();
drop trigger if exists audit_invoices on public.invoices;
create trigger audit_invoices after insert or update or delete on public.invoices for each row execute function public.tg_audit();
drop trigger if exists audit_shifts on public.shifts;
create trigger audit_shifts after insert or update or delete on public.shifts for each row execute function public.tg_audit();
drop trigger if exists audit_matters on public.matters;
create trigger audit_matters after insert or update or delete on public.matters for each row execute function public.tg_audit();
drop trigger if exists audit_memberships on public.memberships;
create trigger audit_memberships after insert or update or delete on public.memberships for each row execute function public.tg_audit();
drop trigger if exists audit_subscriptions on public.subscriptions;
create trigger audit_subscriptions after insert or update or delete on public.subscriptions for each row execute function public.tg_audit();
drop trigger if exists audit_trust_transactions on public.trust_transactions;
create trigger audit_trust_transactions after insert or update or delete on public.trust_transactions for each row execute function public.tg_audit();
