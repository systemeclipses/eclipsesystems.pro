-- 2025-12-23_add_sales_rep_assignment.sql
-- Ensure each organization can store the sales rep responsible for the lead.

alter table public.organizations
  add column if not exists sales_rep_name text;

-- Best-effort backfill so existing orgs inherit the name of the creator if available.
do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'profiles'
      and column_name = 'full_name'
  ) then
    update public.organizations o
    set sales_rep_name = nullif(btrim(p.full_name), '')
    from public.profiles p
    where o.sales_rep_name is null
      and o.created_by = p.user_id
      and nullif(btrim(p.full_name), '') is not null;
  end if;
end $$;
