-- Enforce one proposal per organization.
-- NOTE: This will fail if duplicate organization_id rows already exist in public.proposals.
create unique index if not exists idx_proposals_unique_org
  on public.proposals (organization_id);
