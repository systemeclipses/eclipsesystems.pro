create table if not exists public.utbms_task_codes (
  code text primary key,
  category text,
  name text not null,
  description text
);

create table if not exists public.utbms_activity_codes (
  code text primary key,
  name text not null,
  description text
);

create table if not exists public.utbms_expense_codes (
  code text primary key,
  name text not null,
  description text
);

create table if not exists public.matters (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete restrict,
  number text not null,
  name text not null,
  description text,
  status public.matter_status not null default 'open',
  practice_area text,
  opened_on date not null default current_date,
  closed_on date,
  responsible_attorney_id uuid references public.memberships(id) on delete set null,
  originating_attorney_id uuid references public.memberships(id) on delete set null,
  billing_arrangement text,
  default_currency char(3),
  budget_amount numeric(19,4),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (organization_id, number)
);

create table if not exists public.matter_rates (
  id uuid primary key default gen_random_uuid(),
  matter_id uuid not null references public.matters(id) on delete cascade,
  membership_id uuid references public.memberships(id) on delete cascade,
  timekeeper_level text check (timekeeper_level is null or timekeeper_level in ('partner','senior_associate','associate','paralegal','staff')),
  hourly_rate numeric(19,4) not null,
  effective_from date not null,
  effective_to date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

do $$ begin alter table public.time_entries add constraint time_entries_matter_fk foreign key (matter_id) references public.matters(id) on delete set null; exception when duplicate_object then null; end $$;
do $$ begin alter table public.time_entries add constraint time_entries_utbms_task_fk foreign key (utbms_task_code) references public.utbms_task_codes(code) on delete set null; exception when duplicate_object then null; end $$;
do $$ begin alter table public.time_entries add constraint time_entries_utbms_activity_fk foreign key (utbms_activity_code) references public.utbms_activity_codes(code) on delete set null; exception when duplicate_object then null; end $$;
do $$ begin alter table public.invoices add column if not exists matter_id uuid references public.matters(id) on delete set null; end $$;
do $$ begin alter table public.invoice_line_items add constraint invoice_line_items_matter_fk foreign key (matter_id) references public.matters(id) on delete set null; exception when duplicate_object then null; end $$;

create table if not exists public.conflict_checks (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  subject_name extensions.citext not null,
  subject_type text check (subject_type is null or subject_type in ('individual','organization')),
  aliases text[],
  notes text,
  status public.conflict_status not null default 'pending',
  checked_by uuid references public.memberships(id) on delete set null,
  checked_at timestamptz,
  resolution text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.trust_accounts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  client_id uuid references public.clients(id) on delete restrict,
  matter_id uuid references public.matters(id) on delete restrict,
  name text not null,
  currency char(3) not null default 'USD',
  balance numeric(19,4) not null default 0 check (balance >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.trust_transactions (
  id uuid primary key default gen_random_uuid(),
  trust_account_id uuid not null references public.trust_accounts(id) on delete cascade,
  kind public.trust_txn_kind not null,
  amount numeric(19,4) not null check (amount > 0),
  occurred_on date not null default current_date,
  description text,
  reference text,
  recorded_by uuid not null references public.memberships(id) on delete restrict,
  invoice_id uuid references public.invoices(id) on delete set null,
  created_at timestamptz not null default now()
);

create or replace function public.tg_update_trust_balance()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
declare delta numeric(19,4);
begin
  delta := case new.kind when 'deposit' then new.amount when 'interest' then new.amount else -new.amount end;
  update public.trust_accounts set balance = balance + delta, updated_at = now() where id = new.trust_account_id;
  if exists (select 1 from public.trust_accounts where id = new.trust_account_id and balance < 0) then
    raise exception 'trust account balance cannot be negative';
  end if;
  return new;
end;
$$;
drop trigger if exists trust_transactions_update_balance on public.trust_transactions;
create trigger trust_transactions_update_balance after insert on public.trust_transactions for each row execute function public.tg_update_trust_balance();

drop trigger if exists matters_set_updated_at on public.matters;
create trigger matters_set_updated_at before update on public.matters for each row execute function public.set_updated_at();
drop trigger if exists trust_accounts_set_updated_at on public.trust_accounts;
create trigger trust_accounts_set_updated_at before update on public.trust_accounts for each row execute function public.set_updated_at();
