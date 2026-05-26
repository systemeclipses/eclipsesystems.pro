alter table public.pto_categories
  add column if not exists negative_balance_allowed boolean not null default false;
