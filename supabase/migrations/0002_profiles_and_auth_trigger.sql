create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email extensions.citext not null unique,
  full_name text,
  display_name text,
  avatar_url text,
  phone text,
  timezone text not null default 'UTC',
  locale text not null default 'en-US',
  default_organization_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at before update on public.profiles
for each row execute function public.set_updated_at();

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  org_id uuid := gen_random_uuid();
  membership_id uuid := gen_random_uuid();
  profile_name text := coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name');
begin
  insert into public.profiles (id, email, full_name, display_name, avatar_url)
  values (new.id, new.email, profile_name, profile_name, new.raw_user_meta_data ->> 'avatar_url')
  on conflict (id) do nothing;

  insert into public.organizations (id, kind, name, slug, owner_id)
  values (org_id, 'personal', coalesce(profile_name, split_part(new.email, '@', 1), 'Personal'), null, new.id);

  insert into public.memberships (id, organization_id, user_id, role, accepted_at, status)
  values (membership_id, org_id, new.id, 'owner', now(), 'active');

  update public.profiles set default_organization_id = org_id where id = new.id;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
for each row execute function public.handle_new_auth_user();
