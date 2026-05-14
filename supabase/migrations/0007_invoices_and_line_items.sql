create table if not exists public.org_sequences (
  organization_id uuid primary key references public.organizations(id) on delete cascade,
  invoice_next int not null default 1
);

create or replace function public.next_invoice_number(org_id uuid)
returns text
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  next_value int;
begin
  insert into public.org_sequences (organization_id, invoice_next)
  values (org_id, 2)
  on conflict (organization_id) do update
    set invoice_next = public.org_sequences.invoice_next + 1
  returning invoice_next - 1 into next_value;

  return 'INV-' || lpad(next_value::text, 6, '0');
end;
$$;

create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete restrict,
  number text not null,
  status public.invoice_status not null default 'draft',
  currency char(3) not null default 'USD',
  issue_date date not null default current_date,
  due_date date,
  subtotal numeric(19,4) not null default 0,
  tax_rate numeric(7,4) not null default 0,
  tax_amount numeric(19,4) not null default 0,
  discount_amount numeric(19,4) not null default 0,
  total numeric(19,4) not null default 0,
  amount_paid numeric(19,4) not null default 0,
  notes text,
  terms text,
  sent_at timestamptz,
  viewed_at timestamptz,
  paid_at timestamptz,
  pdf_path text,
  ledes_export_path text,
  stripe_invoice_id text unique,
  payment_link text,
  created_by uuid not null references public.memberships(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (organization_id, number),
  constraint invoices_currency_iso check (currency ~ '^[A-Z]{3}$')
);

create table if not exists public.invoice_line_items (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  time_entry_id uuid references public.time_entries(id) on delete set null,
  project_id uuid references public.projects(id) on delete set null,
  matter_id uuid,
  description text not null,
  quantity numeric(10,2) not null default 1,
  unit text not null default 'hours' check (unit in ('hours','units','flat')),
  unit_price numeric(19,4) not null,
  amount numeric(19,4) not null,
  utbms_task_code text,
  utbms_activity_code text,
  position int not null default 0
);

create table if not exists public.invoice_payments (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  amount numeric(19,4) not null,
  paid_at timestamptz not null default now(),
  method text,
  reference text,
  notes text,
  stripe_payment_intent_id text unique
);

do $$ begin
  alter table public.time_entries add constraint time_entries_invoice_fk
    foreign key (invoice_id) references public.invoices(id) on delete set null;
exception when duplicate_object then null;
end $$;

drop trigger if exists invoices_set_updated_at on public.invoices;
create trigger invoices_set_updated_at before update on public.invoices for each row execute function public.set_updated_at();
