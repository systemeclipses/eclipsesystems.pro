create table if not exists public.gf1_inventory_items (
  id text primary key,
  name text not null,
  category text not null check (category in (
    'computers',
    'monitors',
    'docking_stations',
    'attachable_monitors',
    'keyboards_mice',
    'phones',
    'chairs',
    'webcams',
    'printers_scanners'
  )),
  status text not null check (status in ('in_use', 'available', 'repair', 'retiring', 'expired')),
  icon text,
  description text,
  location text,
  location_type text check (location_type in ('home', 'office')),
  department text,
  owner text,
  assigned_to uuid references auth.users(id) on delete set null,
  notes text[] not null default '{}'::text[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null
);

create index if not exists gf1_inventory_items_category_idx on public.gf1_inventory_items (category);
create index if not exists gf1_inventory_items_status_idx on public.gf1_inventory_items (status);

alter table public.gf1_inventory_items enable row level security;

create policy "gf1_inventory_read"
on public.gf1_inventory_items
for select
using (
  exists (
    select 1
    from public.profiles
    where profiles.user_id = auth.uid()
      and profiles.role = 'admin'
  )
);

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

insert into public.gf1_inventory_items (
  id,
  name,
  category,
  status,
  icon,
  description,
  location,
  department,
  owner,
  notes
) values
  (
    'hw-001',
    'Dell Latitude 7440',
    'computers',
    'in_use',
    'fas fa-laptop',
    'Primary laptop for our operations pod with biometric auth enabled.',
    'Atlanta HQ',
    'Operations',
    'Avery Chen',
    array['Windows 11', 'Asset tag HW-0016']
  ),
  (
    'hw-014',
    'Cisco Catalyst 9200 Switch',
    'monitors',
    'available',
    'fas fa-network-wired',
    'Spare 48-port switch staged for branch office expansion in Q2.',
    'Inventory Cage',
    'IT Infrastructure',
    null,
    array['PoE+', 'Last tested Dec 2025']
  ),
  (
    'sw-101',
    'Atlassian Jira (Cloud)',
    'docking_stations',
    'in_use',
    'fas fa-diagram-project',
    'Core workflow management for engineering and client implementation teams.',
    null,
    'Engineering',
    'Platform PMO',
    array['85 seats', 'Renewal 07/15/2026']
  ),
  (
    'sw-204',
    'Lucidchart Enterprise',
    'attachable_monitors',
    'retiring',
    'fas fa-shapes',
    'Being phased out in favor of native Miro whiteboards.',
    null,
    'Revenue Ops',
    'Systems Team',
    array['45 seats', 'Sunset 03/31/2026']
  ),
  (
    'lic-310',
    'Microsoft 365 E5 Compliance Add-on',
    'keyboards_mice',
    'in_use',
    'fas fa-shield-halved',
    'Advanced compliance bundle for executives and finance.',
    null,
    'Finance',
    'Security Office',
    array['25 seats', 'Auto-renews monthly']
  ),
  (
    'lic-402',
    'Tableau Creator',
    'keyboards_mice',
    'available',
    'fas fa-chart-pie',
    'Floating license available for analytics contractors.',
    null,
    'Data & Insights',
    null,
    array['3 seats ready']
  ),
  (
    'veh-002',
    '2023 Ford Transit',
    'phones',
    'repair',
    'fas fa-truck-ramp-box',
    'Used for on-site install teams; currently awaiting transmission service.',
    'Birmingham Garage',
    null,
    'Field Ops',
    array['Mileage 14,220', 'Service ETA 01/09/2026']
  ),
  (
    'veh-004',
    'Tesla Model 3 Pool Car',
    'chairs',
    'available',
    'fas fa-car-side',
    'Reserved vehicle for visiting execs and customer tours.',
    'Atlanta HQ',
    null,
    'Facilities',
    array['Charge limit 80%', 'Key card at front desk']
  ),
  (
    'misc-120',
    '3D Printer (Formlabs Form 4)',
    'webcams',
    'in_use',
    'fas fa-cubes',
    'Rapid prototyping for custom kiosk parts.',
    'Innovation Lab',
    'R&D',
    'Mateo Ruiz',
    array['Resin tray replaced Nov 2025']
  ),
  (
    'misc-210',
    'Disaster Recovery NAS Array',
    'printers_scanners',
    'expired',
    'fas fa-database',
    'Legacy NAS awaiting secure disposal after cloud migration.',
    'Secure Storage',
    'IT Infrastructure',
    null,
    array['DoD wipe pending']
  )
on conflict (id) do nothing;
