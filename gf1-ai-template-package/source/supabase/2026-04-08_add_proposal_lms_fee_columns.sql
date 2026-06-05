DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'gf1_fee_basis') THEN
    CREATE TYPE public.gf1_fee_basis AS ENUM ('PEPC', 'PEPM');
  END IF;
END$$;

ALTER TABLE public.proposals
  ADD COLUMN IF NOT EXISTS learning_management_system_fee_enabled boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS learning_management_system_fee_rate_cents integer,
  ADD COLUMN IF NOT EXISTS learning_management_system_fee_basis public.gf1_fee_basis;

UPDATE public.proposals
SET learning_management_system_fee_basis = 'PEPM'
WHERE learning_management_system_fee_basis IS NULL
  AND learning_management_system_fee_enabled IS TRUE;
