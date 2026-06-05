alter table public.gf1_inventory_items
  add column if not exists location_type text,
  add column if not exists assigned_to uuid references auth.users(id) on delete set null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'gf1_inventory_items_location_type_check'
  ) then
    alter table public.gf1_inventory_items
      add constraint gf1_inventory_items_location_type_check
      check (location_type in ('home', 'office'));
  end if;
end $$;

alter table public.gf1_inventory_items enable row level security;

drop policy if exists "gf1_inventory_write" on public.gf1_inventory_items;
drop policy if exists "gf1_inventory_update" on public.gf1_inventory_items;
drop policy if exists "gf1_inventory_delete" on public.gf1_inventory_items;

create policy "gf1_inventory_write"
on public.gf1_inventory_items
for insert
with check (
  exists (
    select 1
    from public.profiles
    where profiles.user_id = auth.uid()
      and profiles.role = 'admin'
  )
);

create policy "gf1_inventory_update"
on public.gf1_inventory_items
for update
using (
  exists (
    select 1
    from public.profiles
    where profiles.user_id = auth.uid()
      and profiles.role = 'admin'
  )
);

create policy "gf1_inventory_delete"
on public.gf1_inventory_items
for delete
using (
  exists (
    select 1
    from public.profiles
    where profiles.user_id = auth.uid()
      and profiles.role = 'admin'
  )
);
