-- 2026-01-05_add_proposals_pricing_json.sql
-- Adds the pricing_json column used by the GF1 proposal editor flows.

alter table public.proposals
  add column if not exists pricing_json jsonb;

comment on column public.proposals.pricing_json is
  'Full JSON payload for GF1 proposal pricing/wizard state. Nullable until captured.';

-- Ensure PostgREST picks up the new column immediately.
notify pgrst, 'reload schema';
