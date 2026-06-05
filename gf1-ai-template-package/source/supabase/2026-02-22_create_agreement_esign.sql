-- Create tables for agreement e-signatures and signing requests (idempotent)
create table if not exists agreement_signing_requests (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  form_json jsonb not null default '{}'::jsonb,
  recipient_name text not null,
  recipient_email text not null,
  status text not null default 'sent',
  token_hash text not null,
  expires_at timestamptz not null,
  created_by uuid null references auth.users(id),
  signed_at timestamptz null,
  signed_pdf_path text null,
  provider_signatory_name text not null default 'Blan Marriott',
  provider_signatory_title text not null default 'President',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists agreement_signing_requests_token_hash_unique
  on agreement_signing_requests (token_hash);

create index if not exists agreement_signing_requests_org_idx
  on agreement_signing_requests (organization_id);

create table if not exists agreement_signatures (
  id uuid primary key default gen_random_uuid(),
  signing_request_id uuid not null references agreement_signing_requests(id) on delete cascade,
  signature_type text not null,
  typed_name text null,
  signature_image_path text null,
  consent_text text not null,
  consent_checked boolean not null default false,
  signer_ip text null,
  signer_user_agent text null,
  created_at timestamptz not null default now()
);

create index if not exists agreement_signatures_request_idx
  on agreement_signatures (signing_request_id);

create or replace function set_agreement_signing_requests_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists agreement_signing_requests_set_updated_at on agreement_signing_requests;
create trigger agreement_signing_requests_set_updated_at
before update on agreement_signing_requests
for each row execute function set_agreement_signing_requests_updated_at();

-- Storage bucket for signed agreements and signatures (idempotent)
insert into storage.buckets (id, name, public)
values ('agreement-documents', 'agreement-documents', false)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('agreement-signatures', 'agreement-signatures', false)
on conflict (id) do nothing;
