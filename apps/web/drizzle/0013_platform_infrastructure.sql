create table if not exists public.mission_shift_templates (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  name text not null,
  description text,
  role_name text,
  site_id uuid,
  starts_at_time text not null,
  ends_at_time text not null,
  break_minutes integer not null default 0,
  paid_break boolean not null default false,
  default_notes text,
  color text,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.mission_schedule_templates (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  name text not null,
  description text,
  template_data jsonb not null default '{"shifts":[]}'::jsonb,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.mission_task_templates (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  name text not null,
  description text,
  priority text not null default 'normal',
  require_photo boolean not null default false,
  require_note boolean not null default false,
  subtasks jsonb not null default '[]'::jsonb,
  assignee_rule jsonb not null default '{"type":"manual"}'::jsonb,
  recurrence_rule jsonb,
  due_rule text not null default 'fixed',
  due_offset_minutes integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint mission_task_templates_priority_check check (priority in ('low', 'normal', 'high', 'urgent'))
);

create table if not exists public.mission_sms_verification_codes (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  membership_id uuid not null references public.memberships(id) on delete cascade,
  phone_number text not null,
  code_hash text not null,
  expires_at timestamptz not null,
  consumed_at timestamptz,
  attempts integer not null default 0,
  max_attempts integer not null default 5,
  created_at timestamptz not null default now()
);

create table if not exists public.mission_sms_messages (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  membership_id uuid references public.memberships(id) on delete set null,
  direction text not null,
  phone_number text not null,
  body text not null,
  channel_id uuid references public.mission_channels(id) on delete set null,
  message_id uuid references public.mission_messages(id) on delete set null,
  provider text not null default 'twilio',
  provider_sid text,
  provider_status text,
  sent_at timestamptz,
  delivered_at timestamptz,
  failed_at timestamptz,
  failure_reason text,
  received_at timestamptz,
  parsed_command text,
  segment_count integer,
  cost_cents numeric(8, 4),
  created_at timestamptz not null default now(),
  constraint mission_sms_messages_direction_check check (direction in ('in', 'out'))
);

alter table public.mission_sms_subscriptions add column if not exists country_code text not null default 'US';
alter table public.mission_sms_subscriptions add column if not exists verified_at timestamptz;
alter table public.mission_sms_subscriptions add column if not exists opt_out_method text;
alter table public.mission_sms_subscriptions add column if not exists active_channel_id uuid references public.mission_channels(id) on delete set null;
alter table public.mission_sms_subscriptions add column if not exists updated_at timestamptz not null default now();

create table if not exists public.mission_skills (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  name text not null,
  description text,
  category text,
  requires_expiration boolean not null default false,
  expiration_warning_days integer not null default 30,
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.mission_membership_skills (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  membership_id uuid not null references public.memberships(id) on delete cascade,
  skill_id uuid not null references public.mission_skills(id) on delete cascade,
  certified_at date,
  expires_at date,
  document_url text,
  verified_by_membership_id uuid,
  verified_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.integration_connections (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  provider_id text not null,
  provider_category text not null,
  display_name text,
  external_account_id text,
  config jsonb not null default '{}'::jsonb,
  state text not null default 'active',
  last_error text,
  last_error_at timestamptz,
  last_sync_at timestamptz,
  last_health_check_at timestamptz,
  health_status text,
  connected_by_membership_id uuid,
  connected_at timestamptz not null default now(),
  disconnected_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint integration_connections_state_check check (state in ('active', 'paused', 'error', 'disconnected')),
  constraint integration_connections_org_provider_unique unique (organization_id, provider_id)
);

create table if not exists public.integration_credentials (
  id uuid primary key default gen_random_uuid(),
  connection_id uuid not null references public.integration_connections(id) on delete cascade,
  credential_type text not null,
  encrypted_data text not null,
  encryption_key_id text not null,
  expires_at timestamptz,
  scopes jsonb not null default '[]'::jsonb,
  last_rotated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.integration_mappings (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  provider_id text not null,
  entity_type text not null,
  local_id uuid not null,
  remote_id text not null,
  remote_data jsonb not null default '{}'::jsonb,
  sync_direction text not null default 'bidirectional',
  last_synced_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint integration_mappings_direction_check check (sync_direction in ('local_to_remote', 'remote_to_local', 'bidirectional')),
  constraint integration_mappings_local_unique unique (organization_id, provider_id, entity_type, local_id),
  constraint integration_mappings_remote_unique unique (organization_id, provider_id, entity_type, remote_id)
);

create table if not exists public.payroll_submissions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  pay_period_id uuid references public.pay_periods(id) on delete set null,
  provider_id text not null,
  submitted_by_membership_id uuid,
  state text not null default 'queued',
  records_count integer not null default 0,
  records_failed integer not null default 0,
  provider_reference text,
  request_payload jsonb,
  response_payload jsonb,
  error_message text,
  submitted_at timestamptz not null default now(),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  constraint payroll_submissions_state_check check (state in ('queued', 'submitted', 'processed', 'failed', 'partial'))
);

create table if not exists public.webhook_subscriptions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  name text not null,
  endpoint_url text not null,
  event_types jsonb not null default '[]'::jsonb,
  secret_hash text not null,
  active boolean not null default true,
  max_retries integer not null default 5,
  retry_backoff_seconds integer not null default 30,
  last_delivered_at timestamptz,
  last_failed_at timestamptz,
  consecutive_failures integer not null default 0,
  created_by_membership_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.webhook_deliveries (
  id uuid primary key default gen_random_uuid(),
  subscription_id uuid not null references public.webhook_subscriptions(id) on delete cascade,
  event_type text not null,
  event_id text not null,
  payload jsonb not null default '{}'::jsonb,
  attempt_count integer not null default 0,
  next_retry_at timestamptz,
  last_attempted_at timestamptz,
  response_status integer,
  response_body text,
  response_time_ms integer,
  state text not null default 'pending',
  created_at timestamptz not null default now(),
  delivered_at timestamptz,
  constraint webhook_deliveries_state_check check (state in ('pending', 'delivered', 'failed', 'abandoned'))
);

create table if not exists public.oauth_apps (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  provider text not null,
  client_id text not null,
  client_secret_encrypted text not null,
  redirect_uri text not null,
  scopes jsonb not null default '[]'::jsonb,
  enabled boolean not null default true,
  display_name text,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint oauth_apps_provider_check check (provider in ('microsoft', 'github', 'google', 'okta', 'azure_ad', 'saml'))
);

create table if not exists public.notification_preferences (
  membership_id uuid primary key references public.memberships(id) on delete cascade,
  organization_id uuid not null,
  preferences jsonb not null default '{}'::jsonb,
  quiet_hours_enabled boolean not null default true,
  quiet_hours_start text not null default '21:00',
  quiet_hours_end text not null default '07:00',
  quiet_hours_timezone text,
  emergency_bypass_quiet_hours boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.push_tokens (
  id uuid primary key default gen_random_uuid(),
  membership_id uuid not null references public.memberships(id) on delete cascade,
  organization_id uuid not null,
  token text not null,
  platform text not null,
  device_id text,
  device_name text,
  app_version text,
  active boolean not null default true,
  registered_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  deactivated_at timestamptz,
  constraint push_tokens_platform_check check (platform in ('ios', 'android', 'web')),
  constraint push_tokens_token_unique unique (token)
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  membership_id uuid not null references public.memberships(id) on delete cascade,
  type text not null,
  category text not null,
  title text not null,
  body text,
  action_url text,
  action_label text,
  related_entity_type text,
  related_entity_id uuid,
  priority text not null default 'normal',
  read_at timestamptz,
  archived_at timestamptz,
  delivered_via jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint notifications_priority_check check (priority in ('low', 'normal', 'high', 'emergency'))
);

create table if not exists public.api_keys (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  name text not null,
  description text,
  key_prefix text not null,
  key_hash text not null,
  scopes jsonb not null default '[]'::jsonb,
  allowed_ips jsonb not null default '[]'::jsonb,
  rate_limit_per_minute integer not null default 100,
  created_by_membership_id uuid,
  created_at timestamptz not null default now(),
  last_used_at timestamptz,
  expires_at timestamptz,
  revoked_at timestamptz,
  revoked_by_membership_id uuid
);

create table if not exists public.job_runs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid,
  job_name text not null,
  state text not null default 'queued',
  queued_at timestamptz not null default now(),
  started_at timestamptz,
  completed_at timestamptz,
  records_processed integer not null default 0,
  records_failed integer not null default 0,
  error_message text,
  metadata jsonb not null default '{}'::jsonb,
  scheduled_for timestamptz,
  created_at timestamptz not null default now(),
  constraint job_runs_state_check check (state in ('queued', 'running', 'completed', 'failed', 'cancelled'))
);

create unique index if not exists mission_skills_org_name_idx on public.mission_skills (organization_id, name) where deleted_at is null;
create unique index if not exists mission_membership_skills_unique_idx on public.mission_membership_skills (membership_id, skill_id) where deleted_at is null;
create index if not exists mission_membership_skills_expiring_idx on public.mission_membership_skills (expires_at) where expires_at is not null and deleted_at is null;
create index if not exists mission_shift_templates_org_idx on public.mission_shift_templates (organization_id, display_order) where deleted_at is null;
create index if not exists mission_schedule_templates_org_idx on public.mission_schedule_templates (organization_id) where active = true and deleted_at is null;
create index if not exists mission_task_templates_org_idx on public.mission_task_templates (organization_id) where active = true and deleted_at is null;
create index if not exists mission_sms_codes_active_idx on public.mission_sms_verification_codes (membership_id, created_at desc) where consumed_at is null;
create index if not exists mission_sms_messages_org_time_idx on public.mission_sms_messages (organization_id, created_at desc);
create index if not exists mission_sms_messages_membership_time_idx on public.mission_sms_messages (membership_id, created_at desc) where membership_id is not null;
create index if not exists mission_sms_messages_provider_sid_idx on public.mission_sms_messages (provider_sid) where provider_sid is not null;
create index if not exists mission_sms_subscriptions_phone_idx on public.mission_sms_subscriptions (phone_number);
create unique index if not exists mission_sms_subscriptions_org_membership_idx on public.mission_sms_subscriptions (organization_id, membership_id);
create index if not exists integration_connections_org_state_idx on public.integration_connections (organization_id, state);
create index if not exists integration_connections_provider_idx on public.integration_connections (provider_id, state);
create index if not exists integration_credentials_connection_idx on public.integration_credentials (connection_id) where deleted_at is null;
create index if not exists integration_credentials_expiring_idx on public.integration_credentials (expires_at) where expires_at is not null and deleted_at is null;
create index if not exists integration_mappings_local_idx on public.integration_mappings (local_id, provider_id);
create index if not exists integration_mappings_remote_idx on public.integration_mappings (provider_id, remote_id);
create index if not exists payroll_submissions_period_idx on public.payroll_submissions (pay_period_id) where pay_period_id is not null;
create index if not exists payroll_submissions_org_recent_idx on public.payroll_submissions (organization_id, submitted_at desc);
create index if not exists webhook_subscriptions_org_active_idx on public.webhook_subscriptions (organization_id) where active = true;
create index if not exists webhook_deliveries_pending_idx on public.webhook_deliveries (next_retry_at) where state = 'pending';
create index if not exists webhook_deliveries_subscription_idx on public.webhook_deliveries (subscription_id, created_at desc);
create index if not exists oauth_apps_org_provider_idx on public.oauth_apps (organization_id, provider);
create index if not exists notification_preferences_org_idx on public.notification_preferences (organization_id);
create index if not exists push_tokens_membership_active_idx on public.push_tokens (membership_id) where active = true;
create index if not exists notifications_membership_unread_idx on public.notifications (membership_id, created_at desc) where read_at is null and archived_at is null;
create index if not exists notifications_membership_all_idx on public.notifications (membership_id, created_at desc);
create index if not exists api_keys_org_active_idx on public.api_keys (organization_id) where revoked_at is null;
create index if not exists api_keys_lookup_idx on public.api_keys (key_hash) where revoked_at is null;
create index if not exists job_runs_pending_idx on public.job_runs (scheduled_for) where state = 'queued';
create index if not exists job_runs_by_job_idx on public.job_runs (job_name, started_at desc);
create index if not exists job_runs_org_idx on public.job_runs (organization_id, started_at desc) where organization_id is not null;
