create table if not exists public.product_entitlements (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  product text not null,
  status text not null default 'active',
  acquired_via text not null default 'individual',
  features jsonb not null default '[]'::jsonb,
  trial_ends_at timestamptz,
  starts_at timestamptz not null default now(),
  ends_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint product_entitlements_product_check check (product in ('timekeeping', 'eclipse', 'mission_command', 'legal_addon')),
  constraint product_entitlements_status_check check (status in ('active', 'trial', 'expired', 'suspended')),
  constraint product_entitlements_acquired_via_check check (acquired_via in ('individual', 'suite', 'trial', 'partner_bundle'))
);

create unique index if not exists product_entitlements_org_product_active_idx
  on public.product_entitlements (organization_id, product)
  where status in ('active', 'trial') and ends_at is null;

create index if not exists product_entitlements_org_status_idx
  on public.product_entitlements (organization_id, status);
