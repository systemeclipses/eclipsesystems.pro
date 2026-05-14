create table if not exists public.plans (
  code public.plan_code primary key,
  name text not null,
  monthly_price_cents int not null check (monthly_price_cents > 0),
  annual_price_cents int not null check (annual_price_cents > 0),
  stripe_product_id text,
  stripe_monthly_price_id text,
  stripe_annual_price_id text,
  min_seats int not null default 2 check (min_seats > 0),
  features jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  sort_order int not null default 0
);

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null unique references public.organizations(id) on delete cascade,
  plan public.plan_code not null references public.plans(code) on delete restrict,
  billing_interval public.billing_interval not null default 'month',
  status public.subscription_status not null,
  stripe_subscription_id text unique,
  stripe_price_id text,
  seats int not null default 1 check (seats > 0),
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  canceled_at timestamptz,
  trial_start timestamptz,
  trial_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.stripe_events (
  id text primary key,
  type text not null,
  payload jsonb not null,
  processed_at timestamptz,
  error text,
  received_at timestamptz not null default now()
);

create table if not exists public.payment_methods (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  stripe_payment_method_id text not null unique,
  brand text,
  last4 text,
  exp_month int,
  exp_year int,
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);

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

drop trigger if exists subscriptions_set_updated_at on public.subscriptions;
create trigger subscriptions_set_updated_at before update on public.subscriptions
for each row execute function public.set_updated_at();
