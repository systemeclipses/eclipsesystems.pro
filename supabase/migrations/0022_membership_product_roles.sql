do $$ begin
  alter table public.memberships add constraint memberships_id_org_unique unique (id, organization_id);
exception when duplicate_object then null;
end $$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

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
      and (case m.role::text when 'superuser' then 5 when 'owner' then 4 when 'admin' then 3 when 'manager' then 2 when 'member' then 1 end) >=
          (case required::text when 'superuser' then 5 when 'owner' then 4 when 'admin' then 3 when 'manager' then 2 when 'member' then 1 end)
  );
$$;

create table if not exists public.membership_product_roles (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  membership_id uuid not null references public.memberships(id) on delete cascade,
  product text not null check (product in ('timekeeping', 'eclipse', 'mission_command', 'suite', 'legal_addon')),
  access_role text not null check (access_role in ('employee', 'admin')),
  granted_by_membership_id uuid references public.memberships(id) on delete set null,
  granted_at timestamptz not null default now(),
  revoked_at timestamptz,
  revoked_by_membership_id uuid references public.memberships(id) on delete set null,
  revoke_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint membership_product_roles_same_org_fk
    foreign key (membership_id, organization_id)
    references public.memberships(id, organization_id)
    on delete cascade
);

create index if not exists membership_product_roles_org_idx
  on public.membership_product_roles(organization_id, product, access_role)
  where revoked_at is null;

create unique index if not exists membership_product_roles_membership_product_idx
  on public.membership_product_roles(membership_id, product);

create index if not exists membership_product_roles_membership_idx
  on public.membership_product_roles(membership_id)
  where revoked_at is null;

drop trigger if exists membership_product_roles_set_updated_at on public.membership_product_roles;
create trigger membership_product_roles_set_updated_at before update on public.membership_product_roles
for each row execute function public.set_updated_at();

alter table public.membership_product_roles enable row level security;
alter table public.membership_product_roles force row level security;

drop policy if exists membership_product_roles_select_org_member on public.membership_product_roles;
create policy membership_product_roles_select_org_member
  on public.membership_product_roles for select
  using (public.is_org_member(organization_id));

drop policy if exists membership_product_roles_insert_admin on public.membership_product_roles;
create policy membership_product_roles_insert_admin
  on public.membership_product_roles for insert
  with check (public.has_org_role(organization_id, 'admin') or auth.role() = 'service_role');

drop policy if exists membership_product_roles_update_admin on public.membership_product_roles;
create policy membership_product_roles_update_admin
  on public.membership_product_roles for update
  using (public.has_org_role(organization_id, 'admin') and revoked_at is null)
  with check (public.has_org_role(organization_id, 'admin'));

drop policy if exists membership_product_roles_delete_none on public.membership_product_roles;
create policy membership_product_roles_delete_none
  on public.membership_product_roles for delete
  using (false);
