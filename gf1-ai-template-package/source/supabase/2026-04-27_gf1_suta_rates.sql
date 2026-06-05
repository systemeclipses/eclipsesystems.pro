-- 2026-04-27_gf1_suta_rates.sql
-- Per-state SUTA default rates editable from the GF1 admin settings page.
-- Seeded from src/lib/gf1/rates.ts (Feb 2026 spreadsheet). Unlisted states
-- continue to fall back to 1.7% on the application side.

create table if not exists public.gf1_suta_rates (
  state text primary key,
  rate numeric(8, 5) not null,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id)
);

comment on table public.gf1_suta_rates is
  'Editable per-state SUTA default rates used by the GF1 proposal generator and agreement form.';

-- RLS: read for any authenticated user, write only by admins.
alter table public.gf1_suta_rates enable row level security;

drop policy if exists "gf1_suta_rates_read_authenticated" on public.gf1_suta_rates;
create policy "gf1_suta_rates_read_authenticated"
  on public.gf1_suta_rates
  for select
  to authenticated
  using (true);

drop policy if exists "gf1_suta_rates_write_admin" on public.gf1_suta_rates;
create policy "gf1_suta_rates_write_admin"
  on public.gf1_suta_rates
  for all
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where profiles.user_id = auth.uid()
        and profiles.role = 'admin'
    )
  )
  with check (
    exists (
      select 1 from public.profiles
      where profiles.user_id = auth.uid()
        and profiles.role = 'admin'
    )
  );

-- Seed values from rates.ts (rates are stored as percentage values, e.g. 1.70 = 1.70%).
insert into public.gf1_suta_rates (state, rate) values
  ('AL', 1.7),
  ('AZ', 2.28875),
  ('CA', 3.34167),
  ('CO', 1.64273),
  ('CT', 2.0),
  ('DE', 1.2),
  ('FL', 1.46211),
  ('GA', 1.81353),
  ('IA', 1.0),
  ('ID', 0.81464),
  ('IL', 1.91389),
  ('IN', 2.5),
  ('KS', 1.965),
  ('LA', 1.81313),
  ('MA', 2.885),
  ('MD', 4.3),
  ('MI', 2.73267),
  ('MN', 1.54),
  ('MO', 1.8237),
  ('MS', 1.1),
  ('NC', 1.05273),
  ('NH', 1.86),
  ('NJ', 2.97114),
  ('NM', 1.11),
  ('NY', 2.89167),
  ('OH', 2.7),
  ('OK', 1.5),
  ('OR', 2.04),
  ('SC', 1.0),
  ('SD', 0.73333),
  ('TN', 0.98),
  ('TX', 1.04615),
  ('UT', 2.9375),
  ('VA', 1.07923),
  ('WA', 1.44),
  ('WI', 2.38857),
  ('WV', 2.43333)
on conflict (state) do nothing;

notify pgrst, 'reload schema';
