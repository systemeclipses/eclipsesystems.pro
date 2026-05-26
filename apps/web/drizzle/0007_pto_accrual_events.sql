create table if not exists public.pto_accrual_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  membership_id uuid not null,
  category_id uuid not null references public.pto_categories(id) on delete cascade,
  hours_requested numeric(8, 3) not null,
  hours_applied numeric(8, 3) not null,
  hours_lost_to_cap numeric(8, 3) not null default 0,
  reason text not null,
  source jsonb not null default '{}'::jsonb,
  effective_date timestamptz not null,
  idempotency_key text not null,
  created_at timestamptz not null default now()
);

create unique index if not exists pto_accrual_events_idempotency_idx
  on public.pto_accrual_events (idempotency_key);

create index if not exists pto_accrual_events_member_category_idx
  on public.pto_accrual_events (organization_id, membership_id, category_id, effective_date desc);
