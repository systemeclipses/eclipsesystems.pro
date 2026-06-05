create table if not exists public.gf1_renewal_reminder_logs (
  id bigserial primary key,
  renewal_id text not null references public.gf1_renewals (id) on delete cascade,
  days_before_due integer not null,
  due_date_snapshot date not null,
  sent_to text[] not null default '{}',
  sent_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now()),
  constraint gf1_renewal_reminder_logs_unique
    unique (renewal_id, days_before_due, due_date_snapshot)
);

create index if not exists gf1_renewal_reminder_logs_renewal_idx
  on public.gf1_renewal_reminder_logs (renewal_id);

create index if not exists gf1_renewal_reminder_logs_sent_at_idx
  on public.gf1_renewal_reminder_logs (sent_at desc);

alter table public.gf1_renewal_reminder_logs enable row level security;
