create table if not exists public.mission_shifts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  membership_id uuid references public.memberships(id) on delete set null,
  site_id uuid,
  role_name text,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  break_minutes integer not null default 0,
  paid_break boolean not null default false,
  notes text,
  status text not null default 'draft',
  expected_punch_status text not null default 'pending',
  created_by_membership_id uuid,
  published_at timestamptz,
  parent_template_id uuid,
  recurrence_rule jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint mission_shifts_status_check check (status in ('draft', 'published', 'cancelled', 'completed', 'missed')),
  constraint mission_shifts_expected_punch_check check (expected_punch_status in ('pending', 'clocked_in', 'worked', 'missed', 'modified'))
);

create table if not exists public.mission_open_shift_claims (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  shift_id uuid not null references public.mission_shifts(id) on delete cascade,
  claimant_membership_id uuid not null references public.memberships(id) on delete cascade,
  status text not null default 'pending',
  manager_decision text,
  decided_by_membership_id uuid,
  decided_at timestamptz,
  created_at timestamptz not null default now(),
  constraint mission_open_shift_claims_status_check check (status in ('pending', 'approved', 'denied', 'cancelled'))
);

create table if not exists public.mission_shift_swaps (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  original_shift_id uuid not null references public.mission_shifts(id) on delete cascade,
  proposed_shift_id uuid references public.mission_shifts(id) on delete set null,
  swap_type text not null,
  initiator_membership_id uuid not null references public.memberships(id) on delete cascade,
  target_membership_id uuid references public.memberships(id) on delete set null,
  status text not null default 'pending',
  reason text,
  manager_decision text,
  decided_by_membership_id uuid,
  decided_at timestamptz,
  created_at timestamptz not null default now(),
  constraint mission_shift_swaps_type_check check (swap_type in ('drop', 'swap')),
  constraint mission_shift_swaps_status_check check (status in ('pending', 'accepted', 'declined', 'approved', 'denied', 'cancelled'))
);

create table if not exists public.mission_availability (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  membership_id uuid not null references public.memberships(id) on delete cascade,
  day_of_week integer not null,
  starts_at_time text,
  ends_at_time text,
  available boolean not null default true,
  effective_from date,
  effective_to date,
  notes text,
  status text not null default 'approved',
  created_at timestamptz not null default now()
);

create table if not exists public.mission_channels (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  name text not null,
  type text not null,
  is_pinned boolean not null default false,
  context jsonb not null default '{}'::jsonb,
  created_by_membership_id uuid,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  constraint mission_channels_type_check check (type in ('team', 'site', 'role', 'shift', 'project', 'dm', 'announcement', 'general'))
);

create table if not exists public.mission_channel_members (
  channel_id uuid not null references public.mission_channels(id) on delete cascade,
  membership_id uuid not null references public.memberships(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (channel_id, membership_id)
);

create table if not exists public.mission_messages (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  channel_id uuid not null references public.mission_channels(id) on delete cascade,
  sender_membership_id uuid references public.memberships(id) on delete set null,
  body text not null,
  attachments jsonb not null default '[]'::jsonb,
  reply_to_message_id uuid,
  sent_at timestamptz not null default now(),
  edited_at timestamptz,
  deleted_at timestamptz
);

create table if not exists public.mission_tasks (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  title text not null,
  description text,
  priority text not null default 'normal',
  assignee_membership_id uuid references public.memberships(id) on delete set null,
  assignee_rule jsonb not null default '{}'::jsonb,
  due_at timestamptz,
  due_basis text,
  completed_at timestamptz,
  completed_by_membership_id uuid,
  completion_proof jsonb not null default '{}'::jsonb,
  related_shift_id uuid references public.mission_shifts(id) on delete set null,
  related_project_id uuid,
  parent_template_id uuid,
  recurrence_rule jsonb,
  created_by_membership_id uuid,
  created_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint mission_tasks_priority_check check (priority in ('low', 'normal', 'high', 'urgent'))
);

create table if not exists public.mission_announcements (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  title text not null,
  body text not null,
  attachments jsonb not null default '[]'::jsonb,
  audience_rule jsonb not null default '{}'::jsonb,
  delivery_channels jsonb not null default '["in_app"]'::jsonb,
  require_acknowledgment boolean not null default false,
  scheduled_for timestamptz,
  sent_at timestamptz,
  sent_by_membership_id uuid,
  status text not null default 'draft',
  created_at timestamptz not null default now(),
  constraint mission_announcements_status_check check (status in ('draft', 'scheduled', 'sent', 'archived'))
);

create table if not exists public.mission_announcement_acknowledgments (
  announcement_id uuid not null references public.mission_announcements(id) on delete cascade,
  membership_id uuid not null references public.memberships(id) on delete cascade,
  acknowledged_at timestamptz not null default now(),
  primary key (announcement_id, membership_id)
);

create table if not exists public.mission_forms (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  name text not null,
  description text,
  fields jsonb not null default '[]'::jsonb,
  routing_rules jsonb not null default '{}'::jsonb,
  version integer not null default 1,
  created_by_membership_id uuid,
  archived_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.mission_form_submissions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  form_id uuid not null references public.mission_forms(id) on delete cascade,
  submitted_by_membership_id uuid references public.memberships(id) on delete set null,
  data jsonb not null default '{}'::jsonb,
  status text not null default 'submitted',
  locked boolean not null default true,
  signature_data jsonb,
  submitted_at timestamptz not null default now()
);

create table if not exists public.mission_sms_subscriptions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  membership_id uuid not null references public.memberships(id) on delete cascade,
  phone_number text not null,
  channel_preferences jsonb not null default '{}'::jsonb,
  provider text not null default 'twilio',
  provider_sid text,
  verified boolean not null default false,
  opted_out boolean not null default false,
  opted_out_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.mission_audit_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  actor_membership_id uuid,
  event_type text not null,
  target_type text not null,
  target_id text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists mission_shifts_org_range_idx on public.mission_shifts (organization_id, starts_at, ends_at, status);
create index if not exists mission_messages_channel_idx on public.mission_messages (channel_id, sent_at);
create index if not exists mission_tasks_org_due_idx on public.mission_tasks (organization_id, due_at, completed_at);
create index if not exists mission_announcements_org_status_idx on public.mission_announcements (organization_id, status, sent_at);
