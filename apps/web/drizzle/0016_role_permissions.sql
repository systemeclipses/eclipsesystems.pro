CREATE TABLE IF NOT EXISTS permission_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  role_key TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  kind TEXT NOT NULL DEFAULT 'custom' CHECK (kind IN ('built_in', 'custom')),
  base_role TEXT CHECK (base_role IN ('owner', 'admin', 'manager', 'team_lead', 'employee')),
  color TEXT,
  icon TEXT,
  default_scope_type TEXT NOT NULL DEFAULT 'self' CHECK (
    default_scope_type IN ('self', 'direct_reports', 'department', 'site', 'role', 'custom_group', 'all')
  ),
  default_scope_config JSONB NOT NULL DEFAULT '{}',
  created_by_membership_id UUID REFERENCES memberships(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  UNIQUE(organization_id, role_key)
);

CREATE INDEX IF NOT EXISTS permission_roles_org_idx
  ON permission_roles(organization_id, kind)
  WHERE deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS permission_grants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  role_id UUID REFERENCES permission_roles(id) ON DELETE CASCADE,
  membership_id UUID REFERENCES memberships(id) ON DELETE CASCADE,
  permission TEXT NOT NULL,
  effect TEXT NOT NULL DEFAULT 'allow' CHECK (effect IN ('allow', 'deny')),
  scope_type TEXT NOT NULL DEFAULT 'self' CHECK (
    scope_type IN ('self', 'direct_reports', 'department', 'site', 'role', 'custom_group', 'all')
  ),
  scope_config JSONB NOT NULL DEFAULT '{}',
  reason TEXT,
  granted_by_membership_id UUID REFERENCES memberships(id) ON DELETE SET NULL,
  granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  revoked_at TIMESTAMPTZ,
  revoked_by_membership_id UUID REFERENCES memberships(id) ON DELETE SET NULL,
  revoke_reason TEXT,
  CHECK (role_id IS NOT NULL OR membership_id IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS permission_grants_role_idx
  ON permission_grants(role_id, permission)
  WHERE revoked_at IS NULL;

CREATE INDEX IF NOT EXISTS permission_grants_membership_idx
  ON permission_grants(membership_id, permission)
  WHERE revoked_at IS NULL;

CREATE INDEX IF NOT EXISTS permission_grants_org_idx
  ON permission_grants(organization_id, permission)
  WHERE revoked_at IS NULL;

CREATE TABLE IF NOT EXISTS permission_custom_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_by_membership_id UUID REFERENCES memberships(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  UNIQUE(organization_id, name)
);

CREATE TABLE IF NOT EXISTS permission_custom_group_members (
  group_id UUID NOT NULL REFERENCES permission_custom_groups(id) ON DELETE CASCADE,
  membership_id UUID NOT NULL REFERENCES memberships(id) ON DELETE CASCADE,
  added_by_membership_id UUID REFERENCES memberships(id) ON DELETE SET NULL,
  added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (group_id, membership_id)
);

CREATE INDEX IF NOT EXISTS permission_custom_group_members_membership_idx
  ON permission_custom_group_members(membership_id);

CREATE TABLE IF NOT EXISTS ownership_transfer_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  from_membership_id UUID NOT NULL REFERENCES memberships(id) ON DELETE CASCADE,
  to_membership_id UUID NOT NULL REFERENCES memberships(id) ON DELETE CASCADE,
  reason TEXT,
  state TEXT NOT NULL DEFAULT 'pending' CHECK (state IN ('pending', 'accepted', 'declined', 'expired', 'cancelled')),
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  decided_at TIMESTAMPTZ,
  CHECK (from_membership_id <> to_membership_id)
);

CREATE INDEX IF NOT EXISTS ownership_transfer_requests_pending_idx
  ON ownership_transfer_requests(organization_id, expires_at)
  WHERE state = 'pending';
