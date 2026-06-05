# Data Model

The schema source of truth for this package is the copied Supabase SQL under `source/supabase/`.

## Core Entities
- `profiles.role`: Role source of truth for access control. Key roles: admin, sales_manager, sales, implementations, staff.
- `organizations`: Core CRM record. Status tracks the lead -> prospect -> client lifecycle.
- `contacts and worksites`: Organization satellites for contact methods and location/worksite data.
- `gf1_intake_tokens`: Public intake link issuance and redemption for prospects.
- `proposals and proposal_approvals`: Pricing/proposal records, approval decisions, slide content, export state, and notifications.
- `agreements and signing routes`: Pricing-to-agreement conversion, PDF generation, signature requests, and tokenized signing flows.
- `opportunity_leads and opportunity_contact_logs`: Service opportunity stream, ownership claims, contact attempts, follow-ups, and response capture.
- `gf1_renewals`: Renewal due dates, reminder state, and sales ownership.
- `gf1_client_implementation_steps`: Implementation checklist state for new clients after sale.
- `gf1_inventory_items`: Hardware / office inventory tracked under GF1 admin.
- `gf1_suta_rates`: State-level SUTA defaults used in pricing and agreements.
- `org_financials_vw and opportunity_leads_vw`: Read models used by reports, dashboards, and opportunity pages.

## Included Migration Files
- `supabase/2025-11-20_proposal_workflow.sql`
- `supabase/2025-11-21_gf1_step1.sql`
- `supabase/2025-12-16_add_proposal_approval_fields.sql`
- `supabase/2025-12-23_add_sales_rep_assignment.sql`
- `supabase/2026-01-05_add_proposals_pricing_json.sql`
- `supabase/2026-01-05_fix_proposals_status_constraint.sql`
- `supabase/2026-01-08_add_inventory_assignment_location.sql`
- `supabase/2026-01-08_create_gf1_inventory_items.sql`
- `supabase/2026-01-10_unique_proposal_per_org.sql`
- `supabase/2026-01-29_add_inventory_age.sql`
- `supabase/2026-01-29_add_inventory_purchase_date.sql`
- `supabase/2026-01-29_add_monitor_inventory.sql`
- `supabase/2026-02-03_add_gf1_renewals_salesperson_name.sql`
- `supabase/2026-02-03_create_gf1_renewal_reminder_logs.sql`
- `supabase/2026-02-03_create_gf1_renewals.sql`
- `supabase/2026-02-12_add_proposal_fees_addons.sql`
- `supabase/2026-02-22_create_agreement_esign.sql`
- `supabase/2026-03-03_opportunity_contact_logs.sql`
- `supabase/2026-03-03_opportunity_leads_employees.sql`
- `supabase/2026-03-03_opportunity_leads_industry.sql`
- `supabase/2026-03-03_opportunity_leads.sql`
- `supabase/2026-03-09_opportunity_contact_logs_completed.sql`
- `supabase/2026-03-09_opportunity_contact_logs_follow_up_type.sql`
- `supabase/2026-03-10_opportunity_activity_bootstrap_and_seed.sql`
- `supabase/2026-04-06_create_generated_pdfs.sql`
- `supabase/2026-04-08_add_proposal_lms_fee_columns.sql`
- `supabase/2026-04-14_gf1_client_implementations.sql`
- `supabase/2026-04-27_gf1_suta_rates.sql`

## Rebuild Rule
- Keep the same relationship structure unless the new client explicitly wants renamed tables or a different backend. If you rename anything, preserve a mapping layer and document it.
