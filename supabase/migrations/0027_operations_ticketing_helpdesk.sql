create table if not exists public.operations_portal_tickets (
  id text primary key default ('ops-ticket-' || gen_random_uuid()::text),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  client_id text not null,
  subject text not null,
  description text not null default '',
  status text not null default 'open' check (status in ('open', 'waiting_on_staff', 'waiting_on_client', 'resolved', 'closed')),
  priority text not null default 'normal' check (priority in ('low', 'normal', 'high')),
  category text not null default 'Other' check (category in ('HVAC', 'Electrical', 'Facilities', 'Billing', 'Access', 'Other')),
  due_date date,
  tags text[] not null default '{}',
  assignee_id text,
  source text not null default 'internal' check (source in ('client', 'internal')),
  project_id text,
  invoice_id text,
  resolved_at timestamptz,
  closed_at timestamptz,
  created_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.operations_portal_ticket_comments (
  id text primary key default ('ops-ticket-comment-' || gen_random_uuid()::text),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  ticket_id text not null references public.operations_portal_tickets(id) on delete cascade,
  kind text not null default 'public_reply' check (kind in ('internal_note', 'public_reply')),
  author_role text not null,
  author_name text not null,
  body text not null,
  mentions text[] not null default '{}',
  created_by text,
  created_at timestamptz not null default now()
);

create table if not exists public.operations_portal_ticket_attachments (
  id text primary key default ('ops-ticket-attachment-' || gen_random_uuid()::text),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  ticket_id text not null references public.operations_portal_tickets(id) on delete cascade,
  comment_id text references public.operations_portal_ticket_comments(id) on delete set null,
  file_url text not null,
  file_name text not null,
  uploaded_by text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.operations_portal_ticket_events (
  id text primary key default ('ops-ticket-event-' || gen_random_uuid()::text),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  ticket_id text not null references public.operations_portal_tickets(id) on delete cascade,
  actor_id text,
  actor_name text not null,
  type text not null,
  from_value text,
  to_value text,
  created_at timestamptz not null default now()
);

create index if not exists operations_portal_tickets_org_status_idx
  on public.operations_portal_tickets(organization_id, status, priority)
  where deleted_at is null;

create index if not exists operations_portal_tickets_assignee_idx
  on public.operations_portal_tickets(organization_id, assignee_id, status)
  where deleted_at is null;

create index if not exists operations_portal_tickets_client_idx
  on public.operations_portal_tickets(organization_id, client_id, status)
  where deleted_at is null;

create index if not exists operations_portal_ticket_comments_ticket_idx
  on public.operations_portal_ticket_comments(organization_id, ticket_id, created_at);

create index if not exists operations_portal_ticket_attachments_ticket_idx
  on public.operations_portal_ticket_attachments(organization_id, ticket_id, created_at);

create index if not exists operations_portal_ticket_events_ticket_idx
  on public.operations_portal_ticket_events(organization_id, ticket_id, created_at);

alter table public.operations_portal_tickets enable row level security;
alter table public.operations_portal_ticket_comments enable row level security;
alter table public.operations_portal_ticket_attachments enable row level security;
alter table public.operations_portal_ticket_events enable row level security;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'operations_portal_tickets',
    'operations_portal_ticket_comments',
    'operations_portal_ticket_attachments',
    'operations_portal_ticket_events'
  ] loop
    execute format('drop policy if exists %I_org_select on public.%I', table_name, table_name);
    execute format('create policy %I_org_select on public.%I for select using (organization_id::text = current_setting(''app.current_org'', true))', table_name, table_name);
    execute format('drop policy if exists %I_org_insert on public.%I', table_name, table_name);
    execute format('create policy %I_org_insert on public.%I for insert with check (organization_id::text = current_setting(''app.current_org'', true))', table_name, table_name);
    execute format('drop policy if exists %I_org_update on public.%I', table_name, table_name);
    execute format('create policy %I_org_update on public.%I for update using (organization_id::text = current_setting(''app.current_org'', true)) with check (organization_id::text = current_setting(''app.current_org'', true))', table_name, table_name);
  end loop;
end $$;
