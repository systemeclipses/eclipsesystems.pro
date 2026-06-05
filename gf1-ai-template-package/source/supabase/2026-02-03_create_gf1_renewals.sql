create table if not exists public.gf1_renewals (
  id text primary key,
  company_name text not null,
  renewal_due_date date not null,
  salesperson_name text null,
  is_completed boolean not null default false,
  completed_at timestamptz null,
  created_by uuid null references auth.users (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists gf1_renewals_due_idx
  on public.gf1_renewals (renewal_due_date asc);

create index if not exists gf1_renewals_completed_idx
  on public.gf1_renewals (is_completed, renewal_due_date asc);

create or replace function public.set_gf1_renewals_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists trg_gf1_renewals_updated_at on public.gf1_renewals;
create trigger trg_gf1_renewals_updated_at
before update on public.gf1_renewals
for each row
execute function public.set_gf1_renewals_updated_at();

alter table public.gf1_renewals enable row level security;
