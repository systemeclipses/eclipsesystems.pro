-- 2026-02-12_add_proposal_fees_addons.sql
-- Add WC pricing fields, fee basis tracking, add-ons, and reporting updates.

-- Enums for fee basis and add-on pricing models.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'gf1_fee_basis') THEN
    CREATE TYPE public.gf1_fee_basis AS ENUM ('PEPC', 'PEPM');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'gf1_addon_pricing_model') THEN
    CREATE TYPE public.gf1_addon_pricing_model AS ENUM ('flat_monthly', 'per_employee_per_month', 'per_employee_per_check');
  END IF;
END$$;

ALTER TABLE public.proposals
  ADD COLUMN IF NOT EXISTS wc_cost_cents integer,
  ADD COLUMN IF NOT EXISTS wc_selling_price_cents integer,
  ADD COLUMN IF NOT EXISTS admin_fee_enabled boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS admin_fee_rate_cents integer,
  ADD COLUMN IF NOT EXISTS admin_fee_basis public.gf1_fee_basis,
  ADD COLUMN IF NOT EXISTS timekeeping_fee_enabled boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS timekeeping_fee_rate_cents integer,
  ADD COLUMN IF NOT EXISTS timekeeping_fee_basis public.gf1_fee_basis,
  ADD COLUMN IF NOT EXISTS checks_per_month numeric(6,3),
  ADD COLUMN IF NOT EXISTS addons_json jsonb DEFAULT '[]'::jsonb;

UPDATE public.proposals
SET admin_fee_basis = 'PEPM'
WHERE admin_fee_basis IS NULL
  AND admin_fee_enabled IS TRUE;

UPDATE public.proposals
SET timekeeping_fee_basis = 'PEPM'
WHERE timekeeping_fee_basis IS NULL
  AND timekeeping_fee_enabled IS TRUE;

UPDATE public.proposals
SET addons_json = '[]'::jsonb
WHERE addons_json IS NULL;

-- Tighten proposal RLS to align with assigned sales reps unless admin/manager.
DROP POLICY IF EXISTS "gf1_proposals_rw_creator" ON public.proposals;
CREATE POLICY "gf1_proposals_rw_assigned"
  ON public.proposals
  USING (
    gf1_has_role(auth.uid(), ARRAY['sales','sales_manager','admin'])
    AND EXISTS (
      SELECT 1
      FROM public.organizations o
      WHERE o.id = organization_id
        AND (
          o.assigned_sales_rep_id = auth.uid()
          OR gf1_has_role(auth.uid(), ARRAY['sales_manager','admin'])
        )
    )
  )
  WITH CHECK (
    gf1_has_role(auth.uid(), ARRAY['sales','sales_manager','admin'])
    AND EXISTS (
      SELECT 1
      FROM public.organizations o
      WHERE o.id = organization_id
        AND (
          o.assigned_sales_rep_id = auth.uid()
          OR gf1_has_role(auth.uid(), ARRAY['sales_manager','admin'])
        )
    )
  );

-- Extend org financials view with add-ons + WC profit/margin.
CREATE OR REPLACE VIEW public.org_financials_vw AS
SELECT
  o.id AS org_id,
  o.*,
  pricing.annual_admin_fees,
  pricing.annual_other_fees,
  pricing.annual_revenue,
  pricing.annual_commission,
  pricing.annual_addon_fees,
  pricing.wc_profit,
  pricing.wc_margin_pct
FROM public.organizations o
LEFT JOIN public.proposals p ON p.organization_id = o.id
LEFT JOIN LATERAL (
  WITH wizard_source AS (
    SELECT
      COALESCE(
        p.wizard_payload,
        p.pricing_json->'wizardPricing',
        p.pricing_summary->'wizardPricing',
        p.pricing_json,
        p.pricing_summary
      ) AS wizard
  ),
  wizard_fields AS (
    SELECT
      wizard,
      NULLIF(wizard->>'adminFeeMode', '') AS admin_fee_mode,
      NULLIF(wizard->>'adminFeeValue', '')::numeric AS admin_fee_value,
      NULLIF(wizard->>'payFrequency', '') AS pay_frequency,
      NULLIF(wizard->>'employeeCount', '')::numeric AS employee_count,
      NULLIF(wizard->>'setupFees', '')::numeric AS setup_fees,
      NULLIF(wizard->>'estimatedMonthlyAdminCost', '')::numeric AS estimated_monthly_admin_cost,
      COALESCE(wizard->'statePricings', '[]'::jsonb) AS state_pricings,
      COALESCE(wizard->'otherFees', '[]'::jsonb) AS other_fees
    FROM wizard_source
  ),
  wizard_rollup AS (
    SELECT
      wizard_fields.admin_fee_mode,
      wizard_fields.admin_fee_value,
      wizard_fields.pay_frequency,
      wizard_fields.employee_count,
      wizard_fields.setup_fees,
      wizard_fields.estimated_monthly_admin_cost,
      (
        SELECT SUM(COALESCE(NULLIF(row->>'employees', '')::numeric, 0))
        FROM jsonb_array_elements(wizard_fields.state_pricings) AS row
      ) AS state_employee_count,
      (
        SELECT SUM(
          CASE
            WHEN NULLIF(row->>'annualPayroll', '') IS NOT NULL THEN (row->>'annualPayroll')::numeric
            WHEN NULLIF(row->>'employees', '') IS NOT NULL THEN (row->>'employees')::numeric * 50000
            ELSE 0
          END
        )
        FROM jsonb_array_elements(wizard_fields.state_pricings) AS row
      ) AS payroll_volume,
      (
        SELECT SUM(COALESCE(NULLIF(row->>'amount', '')::numeric, 0))
        FROM jsonb_array_elements(wizard_fields.other_fees) AS row
      ) AS other_fees_total
    FROM wizard_fields
  ),
  frequency AS (
    SELECT CASE LOWER(COALESCE(wizard_rollup.pay_frequency, o.pay_frequency::text))
      WHEN 'weekly' THEN 52
      WHEN 'biweekly' THEN 26
      WHEN 'bi-weekly' THEN 26
      WHEN 'semimonthly' THEN 24
      WHEN 'semi-monthly' THEN 24
      WHEN 'semi_monthly' THEN 24
      WHEN 'monthly' THEN 12
      WHEN 'other' THEN 12
      ELSE 12
    END AS periods_per_year
    FROM wizard_rollup
  ),
  wizard_metrics AS (
    SELECT
      COALESCE(wizard_rollup.employee_count, wizard_rollup.state_employee_count, 0) AS modeled_employee_count,
      wizard_rollup.payroll_volume AS payroll_volume,
      CASE
        WHEN wizard_rollup.admin_fee_mode = 'per_check' THEN wizard_rollup.admin_fee_value
        ELSE NULL
      END AS flat_admin_fee_per_employee_per_period,
      CASE
        WHEN wizard_rollup.admin_fee_mode = 'percent_of_gross' THEN wizard_rollup.admin_fee_value
        ELSE NULL
      END AS admin_fee_percent,
      COALESCE(wizard_rollup.setup_fees, 0::numeric) AS setup_fee_total,
      COALESCE(wizard_rollup.other_fees_total, 0::numeric) AS other_fees_total,
      CASE
        WHEN wizard_rollup.admin_fee_mode = 'per_check' THEN
          COALESCE(wizard_rollup.admin_fee_value, 0)
          * COALESCE(wizard_rollup.employee_count, wizard_rollup.state_employee_count, 0)
          * frequency.periods_per_year
        WHEN wizard_rollup.admin_fee_mode = 'percent_of_gross' THEN
          COALESCE(wizard_rollup.payroll_volume, 0) * (COALESCE(wizard_rollup.admin_fee_value, 0) / 100)
        WHEN wizard_rollup.estimated_monthly_admin_cost IS NOT NULL THEN wizard_rollup.estimated_monthly_admin_cost * 12
        ELSE NULL
      END AS annual_admin_target
    FROM wizard_rollup, frequency
  ),
  normalized AS (
    SELECT
      COALESCE(
        NULLIF(p.pricing_summary->'metrics'->>'annual_admin_target', '')::numeric,
        p.annual_admin_target,
        wizard_metrics.annual_admin_target
      ) AS annual_admin_target,
      COALESCE(
        NULLIF(p.pricing_summary->'metrics'->>'flat_admin_fee_per_employee_per_period', '')::numeric,
        p.flat_admin_fee_per_employee_per_period,
        wizard_metrics.flat_admin_fee_per_employee_per_period
      ) AS flat_admin_fee_per_employee_per_period,
      COALESCE(
        NULLIF(p.pricing_summary->'metrics'->>'modeled_employee_count', '')::numeric,
        p.modeled_employee_count::numeric,
        wizard_metrics.modeled_employee_count
      ) AS modeled_employee_count,
      COALESCE(
        NULLIF(p.pricing_summary->'metrics'->>'base_price_per_employee_per_year', '')::numeric,
        p.base_price_per_employee_per_year
      ) AS base_price_per_employee_per_year,
      COALESCE(
        NULLIF(p.pricing_summary->'metrics'->>'payroll_volume', '')::numeric,
        p.payroll_volume,
        wizard_metrics.payroll_volume
      ) AS payroll_volume,
      COALESCE(
        NULLIF(p.pricing_summary->'metrics'->>'admin_fee_percent', '')::numeric,
        p.admin_fee_percent,
        wizard_metrics.admin_fee_percent
      ) AS admin_fee_percent,
      COALESCE(
        NULLIF(p.pricing_summary->'metrics'->>'setup_fee_total', '')::numeric,
        p.setup_fee_total,
        wizard_metrics.setup_fee_total
      ) AS setup_fee_total,
      COALESCE(
        NULLIF(p.pricing_summary->'metrics'->>'deposit_total', '')::numeric,
        p.deposit_total,
        wizard_metrics.other_fees_total
      ) AS deposit_total,
      COALESCE(NULLIF(p.pricing_summary->'metrics'->>'estimated_commission', '')::numeric, p.estimated_commission) AS estimated_commission,
      COALESCE(
        NULLIF(p.pricing_summary->'metrics'->>'commission_percent', '')::numeric,
        p.commission_percent,
        o.commission_percent,
        0::numeric
      ) AS commission_percent,
      COALESCE(
        p.billing_model,
        CASE wizard_rollup.admin_fee_mode
          WHEN 'percent_of_gross' THEN 'percent_of_gross'::public.gf1_billing_model
          WHEN 'per_check' THEN 'flat_per_employee'::public.gf1_billing_model
          ELSE NULL
        END,
        CASE
          WHEN COALESCE(
            NULLIF(p.pricing_summary->'metrics'->>'flat_admin_fee_per_employee_per_period', '')::numeric,
            p.flat_admin_fee_per_employee_per_period,
            wizard_metrics.flat_admin_fee_per_employee_per_period
          ) IS NOT NULL
            THEN 'flat_per_employee'::public.gf1_billing_model
          WHEN COALESCE(
            NULLIF(p.pricing_summary->'metrics'->>'admin_fee_percent', '')::numeric,
            p.admin_fee_percent,
            wizard_metrics.admin_fee_percent
          ) IS NOT NULL
            THEN 'percent_of_gross'::public.gf1_billing_model
          ELSE NULL
        END
      ) AS billing_model
    FROM wizard_metrics, wizard_rollup
  ),
  fee_calc AS (
    SELECT
      COALESCE(p.admin_fee_enabled, false) AS admin_fee_enabled,
      p.admin_fee_rate_cents,
      p.admin_fee_basis,
      COALESCE(p.timekeeping_fee_enabled, false) AS timekeeping_fee_enabled,
      p.timekeeping_fee_rate_cents,
      p.timekeeping_fee_basis,
      COALESCE(p.checks_per_month, frequency.periods_per_year / 12.0) AS checks_per_month,
      COALESCE(p.addons_json, '[]'::jsonb) AS addons_json,
      p.wc_cost_cents,
      p.wc_selling_price_cents,
      CASE
        WHEN COALESCE(p.admin_fee_enabled, false) AND p.admin_fee_rate_cents IS NOT NULL THEN
          (p.admin_fee_rate_cents::numeric / 100)
          * COALESCE(normalized.modeled_employee_count, 0)
          * CASE WHEN p.admin_fee_basis = 'PEPC' THEN COALESCE(p.checks_per_month, frequency.periods_per_year / 12.0) ELSE 1 END
        ELSE NULL
      END AS admin_fee_monthly,
      CASE
        WHEN COALESCE(p.timekeeping_fee_enabled, false) AND p.timekeeping_fee_rate_cents IS NOT NULL THEN
          (p.timekeeping_fee_rate_cents::numeric / 100)
          * COALESCE(normalized.modeled_employee_count, 0)
          * CASE WHEN p.timekeeping_fee_basis = 'PEPC' THEN COALESCE(p.checks_per_month, frequency.periods_per_year / 12.0) ELSE 1 END
        ELSE NULL
      END AS timekeeping_fee_monthly
    FROM normalized, frequency
  ),
  addon_rollup AS (
    SELECT
      COALESCE(SUM(
        CASE
          WHEN COALESCE((addon->>'enabled')::boolean, false) = false THEN 0
          WHEN addon->>'pricing_model' = 'per_employee_per_month' THEN (addon->>'amount_cents')::numeric / 100 * COALESCE(normalized.modeled_employee_count, 0)
          WHEN addon->>'pricing_model' = 'per_employee_per_check' THEN (addon->>'amount_cents')::numeric / 100 * COALESCE(normalized.modeled_employee_count, 0) * fee_calc.checks_per_month
          ELSE (addon->>'amount_cents')::numeric / 100
        END
      ), 0::numeric) AS addons_monthly
    FROM jsonb_array_elements(fee_calc.addons_json) AS addon, normalized, fee_calc
  ),
  base AS (
    SELECT
      COALESCE(
        CASE normalized.billing_model
          WHEN 'percent_of_gross' THEN normalized.payroll_volume * (normalized.admin_fee_percent / 100)
          WHEN 'flat_per_employee' THEN normalized.flat_admin_fee_per_employee_per_period * normalized.modeled_employee_count * frequency.periods_per_year
          ELSE NULL
        END,
        normalized.annual_admin_target,
        normalized.modeled_employee_count * normalized.base_price_per_employee_per_year,
        normalized.payroll_volume * (normalized.admin_fee_percent / 100),
        0::numeric
      ) AS legacy_annual_admin_fees,
      COALESCE(normalized.setup_fee_total, 0::numeric) + COALESCE(normalized.deposit_total, 0::numeric) AS annual_other_fees,
      normalized.estimated_commission AS estimated_commission,
      normalized.commission_percent AS commission_percent
    FROM normalized, frequency
  ),
  totals AS (
    SELECT
      CASE
        WHEN fee_calc.admin_fee_enabled OR fee_calc.timekeeping_fee_enabled THEN
          COALESCE(fee_calc.admin_fee_monthly, 0) * 12
          + COALESCE(fee_calc.timekeeping_fee_monthly, 0) * 12
        ELSE base.legacy_annual_admin_fees
      END AS annual_admin_fees,
      base.annual_other_fees + (addon_rollup.addons_monthly * 12) AS annual_other_fees,
      base.estimated_commission AS estimated_commission,
      base.commission_percent AS commission_percent,
      addon_rollup.addons_monthly * 12 AS annual_addon_fees
    FROM base, fee_calc, addon_rollup
  )
  SELECT
    totals.annual_admin_fees,
    totals.annual_other_fees,
    totals.annual_admin_fees + totals.annual_other_fees AS annual_revenue,
    COALESCE(
      totals.estimated_commission,
      totals.annual_admin_fees * (COALESCE(totals.commission_percent, 0::numeric) / 100),
      0::numeric
    ) AS annual_commission,
    totals.annual_addon_fees,
    CASE
      WHEN fee_calc.wc_selling_price_cents IS NOT NULL AND fee_calc.wc_cost_cents IS NOT NULL THEN
        (fee_calc.wc_selling_price_cents - fee_calc.wc_cost_cents) / 100.0
      ELSE NULL
    END AS wc_profit,
    CASE
      WHEN fee_calc.wc_selling_price_cents IS NOT NULL
        AND fee_calc.wc_selling_price_cents > 0
        AND fee_calc.wc_cost_cents IS NOT NULL THEN
        (fee_calc.wc_selling_price_cents - fee_calc.wc_cost_cents)::numeric / fee_calc.wc_selling_price_cents
      ELSE NULL
    END AS wc_margin_pct
  FROM totals, fee_calc
) pricing ON true;

GRANT SELECT ON public.org_financials_vw TO authenticated;
