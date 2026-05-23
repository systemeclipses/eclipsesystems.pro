create table if not exists public.password_credentials (
  user_id uuid primary key references public.users(id) on delete cascade,
  password_hash text not null,
  password_salt text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists password_credentials_set_updated_at on public.password_credentials;
create trigger password_credentials_set_updated_at before update on public.password_credentials
for each row execute function public.set_updated_at();
