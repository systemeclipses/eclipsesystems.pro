-- Add manager and approval token fields to proposals
alter table public.proposals
  add column if not exists approval_token text,
  add column if not exists manager_id uuid references auth.users(id),
  add column if not exists manager_email text;

create index if not exists idx_proposals_approval_token on public.proposals (approval_token);
