create or replace function public.is_org_member(org_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.memberships
    where organization_id = org_id
      and user_id = auth.uid()
      and status = 'active'
      and deleted_at is null
  );
$$;

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
      and (case m.role when 'owner' then 4 when 'admin' then 3 when 'manager' then 2 when 'member' then 1 end) >=
          (case required when 'owner' then 4 when 'admin' then 3 when 'manager' then 2 when 'member' then 1 end)
  );
$$;

create or replace function public.my_membership_id(org_id uuid)
returns uuid
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select id from public.memberships
  where organization_id = org_id and user_id = auth.uid()
    and status = 'active' and deleted_at is null
  limit 1;
$$;

create or replace function public.subordinate_membership_ids(org_id uuid)
returns setof uuid
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  with recursive my_id as (
    select id from public.memberships
    where organization_id = org_id and user_id = auth.uid()
      and status = 'active' and deleted_at is null
  ),
  tree as (
    select m.id, m.manager_id
    from public.memberships m
    where m.manager_id in (select id from my_id) and m.deleted_at is null
    union all
    select m.id, m.manager_id
    from public.memberships m
    join tree t on m.manager_id = t.id
    where m.deleted_at is null
  )
  select id from tree;
$$;

create or replace function public.org_has_feature(org_id uuid, feature text)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select coalesce(
    (select (p.features ->> feature)::boolean
     from public.subscriptions s
     join public.plans p on p.code = s.plan
     where s.organization_id = org_id
       and s.status in ('trialing','active','past_due')),
    false
  );
$$;

create or replace function public.get_invitation_by_token(invitation_token text)
returns public.invitations
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select *
  from public.invitations
  where token = invitation_token
    and status = 'pending'
    and expires_at > now()
    and deleted_at is null
  limit 1;
$$;

create or replace function public.is_channel_member(channel_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.chat_channel_members ccm
    join public.chat_channels cc on cc.id = ccm.channel_id
    where ccm.channel_id = is_channel_member.channel_id
      and ccm.membership_id = public.my_membership_id(cc.organization_id)
      and cc.deleted_at is null
  );
$$;
