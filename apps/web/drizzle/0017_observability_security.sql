CREATE TABLE IF NOT EXISTS security_settings (
  organization_id UUID PRIMARY KEY REFERENCES organizations(id) ON DELETE CASCADE,
  require_mfa_for_admins BOOLEAN NOT NULL DEFAULT TRUE,
  require_mfa_for_all BOOLEAN NOT NULL DEFAULT FALSE,
  enforce_strong_passwords BOOLEAN NOT NULL DEFAULT TRUE,
  block_non_us_signins BOOLEAN NOT NULL DEFAULT FALSE,
  idle_timeout_days INTEGER NOT NULL DEFAULT 30,
  absolute_timeout_days INTEGER NOT NULL DEFAULT 90,
  sso_provider TEXT,
  sso_status TEXT NOT NULL DEFAULT 'not_configured' CHECK (sso_status IN ('not_configured', 'active', 'error', 'paused')),
  allow_employee_data_exports BOOLEAN NOT NULL DEFAULT TRUE,
  notify_suspicious_signins BOOLEAN NOT NULL DEFAULT TRUE,
  data_residency TEXT NOT NULL DEFAULT 'US East',
  log_retention_hot_days INTEGER NOT NULL DEFAULT 90,
  log_retention_cold_years INTEGER NOT NULL DEFAULT 7,
  updated_by_membership_id UUID REFERENCES memberships(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS security_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  actor_membership_id UUID REFERENCES memberships(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'error', 'critical')),
  outcome TEXT NOT NULL DEFAULT 'success' CHECK (outcome IN ('success', 'failure', 'blocked', 'partial')),
  target_type TEXT,
  target_id TEXT,
  ip_address INET,
  user_agent TEXT,
  trace_id TEXT,
  request_id TEXT,
  metadata JSONB NOT NULL DEFAULT '{}',
  hash_previous TEXT,
  hash_current TEXT,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS security_events_org_time_idx
  ON security_events(organization_id, occurred_at DESC);

CREATE INDEX IF NOT EXISTS security_events_type_idx
  ON security_events(organization_id, event_type, occurred_at DESC);

CREATE INDEX IF NOT EXISTS security_events_severity_idx
  ON security_events(organization_id, severity, occurred_at DESC)
  WHERE severity IN ('warning', 'error', 'critical');

CREATE TABLE IF NOT EXISTS observability_service_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_name TEXT NOT NULL,
  environment TEXT NOT NULL DEFAULT 'production',
  status TEXT NOT NULL CHECK (status IN ('ok', 'degraded', 'down', 'maintenance')),
  latency_p95_ms INTEGER,
  error_rate_basis_points INTEGER,
  saturation_basis_points INTEGER,
  checked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB NOT NULL DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS observability_service_checks_service_idx
  ON observability_service_checks(service_name, environment, checked_at DESC);

CREATE TABLE IF NOT EXISTS observability_synthetic_monitors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  service_name TEXT NOT NULL,
  cadence_minutes INTEGER NOT NULL DEFAULT 5,
  status TEXT NOT NULL DEFAULT 'passing' CHECK (status IN ('passing', 'failing', 'paused')),
  last_run_at TIMESTAMPTZ,
  last_duration_ms INTEGER,
  last_error TEXT,
  runbook_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS observability_synthetic_monitors_status_idx
  ON observability_synthetic_monitors(status, service_name);

CREATE TABLE IF NOT EXISTS observability_incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('sev_0', 'sev_1', 'sev_2', 'sev_3', 'sev_4')),
  status TEXT NOT NULL DEFAULT 'investigating' CHECK (status IN ('investigating', 'identified', 'monitoring', 'resolved')),
  affected_services TEXT[] NOT NULL DEFAULT '{}',
  customer_impact TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  runbook_url TEXT,
  postmortem_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS observability_incidents_status_idx
  ON observability_incidents(status, severity, started_at DESC);
