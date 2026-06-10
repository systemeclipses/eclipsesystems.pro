ALTER TYPE member_role ADD VALUE IF NOT EXISTS 'superuser' BEFORE 'owner';

CREATE OR REPLACE FUNCTION public.has_org_role(org_id uuid, required public.member_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.memberships m
    WHERE m.organization_id = org_id
      AND m.user_id = auth.uid()
      AND m.status = 'active'
      AND m.deleted_at IS NULL
      AND (CASE m.role::text WHEN 'superuser' THEN 5 WHEN 'owner' THEN 4 WHEN 'admin' THEN 3 WHEN 'manager' THEN 2 WHEN 'member' THEN 1 END) >=
          (CASE required::text WHEN 'superuser' THEN 5 WHEN 'owner' THEN 4 WHEN 'admin' THEN 3 WHEN 'manager' THEN 2 WHEN 'member' THEN 1 END)
  );
$$;

CREATE OR REPLACE FUNCTION public.org_has_feature(org_id uuid, feature text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.memberships m
    WHERE m.organization_id = org_id
      AND m.user_id = auth.uid()
      AND m.role::text = 'superuser'
      AND m.status = 'active'
      AND m.deleted_at IS NULL
  )
  OR COALESCE(
    EXISTS (
      SELECT 1
      FROM public.subscriptions s
      JOIN public.plans p ON p.code = s.plan
      WHERE s.organization_id = org_id
        AND s.status IN ('trialing','active','past_due')
        AND COALESCE((p.features ->> feature)::boolean, false)
    )
    OR EXISTS (
      SELECT 1
      FROM public.subscription_add_ons a
      JOIN public.plans p ON p.code = a.plan
      WHERE a.organization_id = org_id
        AND a.status IN ('trialing','active','past_due')
        AND COALESCE((p.features ->> feature)::boolean, false)
    ),
    false
  );
$$;
