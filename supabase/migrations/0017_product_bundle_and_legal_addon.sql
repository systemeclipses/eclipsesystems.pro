alter table public.plans add column if not exists kind public.plan_kind not null default 'product';
alter table public.plans add column if not exists requires_plan public.plan_code;

insert into public.plans (code, name, monthly_price_cents, annual_price_cents, stripe_product_id, stripe_monthly_price_id, stripe_annual_price_id, min_seats, features, is_active, sort_order, kind, requires_plan)
values
  ('timekeeping','Eclipse Timekeeping',1000,9600,'prod_replace_timekeeping','price_replace_timekeeping_month','price_replace_timekeeping_year',2,'{"projects":false,"invoicing":false,"shifts":false,"chat":false,"legal":false,"reporting":true}'::jsonb,true,10,'product',null),
  ('mission_command','Mission Command by Eclipse',1800,17280,'prod_replace_mission_command','price_replace_mission_command_month','price_replace_mission_command_year',2,'{"projects":false,"invoicing":false,"shifts":true,"chat":true,"legal":false,"reporting":true}'::jsonb,true,20,'product',null),
  ('eclipse','Eclipse',2200,21120,'prod_replace_eclipse','price_replace_eclipse_month','price_replace_eclipse_year',2,'{"projects":true,"invoicing":true,"shifts":false,"chat":false,"legal":false,"reporting":true}'::jsonb,true,30,'product',null),
  ('suite','Eclipse Suite',3800,36480,'prod_replace_suite','price_replace_suite_month','price_replace_suite_year',2,'{"projects":true,"invoicing":true,"shifts":true,"chat":true,"legal":false,"reporting":true}'::jsonb,true,40,'bundle',null),
  ('legal_addon','Eclipse Legal Add-on',2000,19200,'prod_replace_legal_addon','price_replace_legal_addon_month','price_replace_legal_addon_year',2,'{"projects":false,"invoicing":false,"shifts":false,"chat":false,"legal":true,"reporting":false}'::jsonb,true,50,'add_on','suite')
on conflict (code) do update set
  name = excluded.name,
  monthly_price_cents = excluded.monthly_price_cents,
  annual_price_cents = excluded.annual_price_cents,
  min_seats = excluded.min_seats,
  features = excluded.features,
  is_active = excluded.is_active,
  sort_order = excluded.sort_order,
  kind = excluded.kind,
  requires_plan = excluded.requires_plan;

update public.plans
set is_active = false
where code in ('starter','pro','business','legal');

do $$ begin
  alter table public.subscriptions add constraint subscriptions_id_org_unique unique (id, organization_id);
exception when duplicate_object then null;
end $$;

create table if not exists public.subscription_add_ons (
  id uuid primary key default gen_random_uuid(),
  subscription_id uuid not null references public.subscriptions(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  plan public.plan_code not null references public.plans(code) on delete restrict,
  status public.subscription_status not null,
  stripe_subscription_item_id text unique,
  stripe_price_id text,
  seats int not null default 1 check (seats > 0),
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  canceled_at timestamptz,
  trial_start timestamptz,
  trial_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (subscription_id, plan)
);

do $$ begin
  alter table public.subscription_add_ons add constraint subscription_add_ons_subscription_org_fk
    foreign key (subscription_id, organization_id) references public.subscriptions(id, organization_id) on delete cascade;
exception when duplicate_object then null;
end $$;

create index if not exists subscription_add_ons_org_idx on public.subscription_add_ons (organization_id);

create or replace function public.tg_validate_subscription_add_on()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  add_on_kind public.plan_kind;
  required_plan public.plan_code;
  base_plan public.plan_code;
begin
  select kind, requires_plan into add_on_kind, required_plan
  from public.plans
  where code = new.plan;

  if add_on_kind <> 'add_on' then
    raise exception 'subscription add-on plan must have kind add_on';
  end if;

  select plan into base_plan
  from public.subscriptions
  where id = new.subscription_id
    and organization_id = new.organization_id;

  if required_plan is not null and base_plan <> required_plan then
    raise exception 'add-on % requires base plan %', new.plan, required_plan;
  end if;

  return new;
end;
$$;

drop trigger if exists subscription_add_ons_validate on public.subscription_add_ons;
create trigger subscription_add_ons_validate before insert or update on public.subscription_add_ons
for each row execute function public.tg_validate_subscription_add_on();

create or replace function public.org_has_feature(org_id uuid, feature text)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select coalesce(
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

drop trigger if exists subscription_add_ons_set_updated_at on public.subscription_add_ons;
create trigger subscription_add_ons_set_updated_at before update on public.subscription_add_ons
for each row execute function public.set_updated_at();

alter table public.subscription_add_ons enable row level security;
alter table public.subscription_add_ons force row level security;

create policy subscription_add_ons_select_member on public.subscription_add_ons for select using (public.is_org_member(organization_id));
create policy subscription_add_ons_insert_service on public.subscription_add_ons for insert with check (auth.role() = 'service_role');
create policy subscription_add_ons_update_service on public.subscription_add_ons for update using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
create policy subscription_add_ons_delete_service on public.subscription_add_ons for delete using (auth.role() = 'service_role');
