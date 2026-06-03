alter type public.member_role add value if not exists 'superuser' before 'owner';

create or replace function public.has_org_role(org_id uuid, required public.member_role)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.memberships m
    where m.organization_id = org_id
      and m.user_id = auth.uid()
      and m.status = 'active'
      and m.deleted_at is null
      and (case m.role::text when 'superuser' then 5 when 'owner' then 4 when 'admin' then 3 when 'manager' then 2 when 'member' then 1 end) >=
          (case required::text when 'superuser' then 5 when 'owner' then 4 when 'admin' then 3 when 'manager' then 2 when 'member' then 1 end)
  );
$$;

create or replace function public.org_has_feature(org_id uuid, feature text)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.memberships m
    where m.organization_id = org_id
      and m.user_id = auth.uid()
      and m.role::text = 'superuser'
      and m.status = 'active'
      and m.deleted_at is null
  )
  or coalesce(
    exists (
      select 1
      from public.subscriptions s
      join public.plans p on p.code = s.plan
      where s.organization_id = org_id
        and s.status in ('trialing','active','past_due')
        and coalesce((p.features ->> feature)::boolean, false)
    )
    or exists (
      select 1
      from public.subscription_add_ons a
      join public.plans p on p.code = a.plan
      where a.organization_id = org_id
        and a.status in ('trialing','active','past_due')
        and coalesce((p.features ->> feature)::boolean, false)
    ),
    false
  );
$$;
