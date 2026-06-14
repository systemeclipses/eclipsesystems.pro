DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'memberships_id_org_unique'
      AND conrelid = 'memberships'::regclass
  ) THEN
    ALTER TABLE memberships ADD CONSTRAINT memberships_id_org_unique UNIQUE (id, organization_id);
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS membership_product_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  membership_id UUID NOT NULL REFERENCES memberships(id) ON DELETE CASCADE,
  product TEXT NOT NULL CHECK (product IN ('timekeeping', 'eclipse', 'mission_command', 'suite', 'legal_addon')),
  access_role TEXT NOT NULL CHECK (access_role IN ('employee', 'admin')),
  granted_by_membership_id UUID REFERENCES memberships(id) ON DELETE SET NULL,
  granted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  revoked_at TIMESTAMPTZ,
  revoked_by_membership_id UUID REFERENCES memberships(id) ON DELETE SET NULL,
  revoke_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT membership_product_roles_same_org_fk
    FOREIGN KEY (membership_id, organization_id)
    REFERENCES memberships(id, organization_id)
    ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS membership_product_roles_org_idx
  ON membership_product_roles(organization_id, product, access_role)
  WHERE revoked_at IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS membership_product_roles_membership_product_idx
  ON membership_product_roles(membership_id, product);

CREATE INDEX IF NOT EXISTS membership_product_roles_membership_idx
  ON membership_product_roles(membership_id)
  WHERE revoked_at IS NULL;

DROP TRIGGER IF EXISTS membership_product_roles_set_updated_at ON membership_product_roles;
CREATE TRIGGER membership_product_roles_set_updated_at BEFORE UPDATE ON membership_product_roles
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
