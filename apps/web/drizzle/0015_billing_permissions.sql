CREATE TABLE IF NOT EXISTS billing_permission_grants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  membership_id UUID NOT NULL REFERENCES memberships(id) ON DELETE CASCADE,
  permission TEXT NOT NULL CHECK (
    permission IN (
      'billing.view',
      'billing.usage.view',
      'billing.payment.update',
      'billing.plan.modify',
      'billing.cancel',
      'billing.owner'
    )
  ),
  granted_by_membership_id UUID REFERENCES memberships(id) ON DELETE SET NULL,
  granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  revoked_at TIMESTAMPTZ,
  revoked_by_membership_id UUID REFERENCES memberships(id) ON DELETE SET NULL,
  revoke_reason TEXT
);

CREATE UNIQUE INDEX IF NOT EXISTS billing_permission_grants_active_idx
  ON billing_permission_grants(organization_id, membership_id, permission)
  WHERE revoked_at IS NULL;

CREATE INDEX IF NOT EXISTS billing_permission_grants_membership_idx
  ON billing_permission_grants(membership_id)
  WHERE revoked_at IS NULL;
