# Workflows

## Dashboard
Sales dashboard with pipeline counts, recent activity, follow-up queue, and forecast metrics.

Routes:
- `/gf1`

## Opportunities
Pre-organization intake stream with outreach logging, claims, response handling, and scheduled follow-ups.

Routes:
- `/gf1/opportunities`
- `/gf1/activity`

## Organizations
Lead, prospect, and client records with contacts, worksites, ownership, logo uploads, intake links, proposals, and activity history.

Routes:
- `/gf1/organizations`
- `/gf1/organizations/[id]`
- `/gf1/leads/[id]`
- `/gf1/clients/[id]`
- `/gf1/prospects/[id]`

## Pipeline
Board and form flows for moving organizations from lead to prospect to client.

Routes:
- `/gf1/pipeline`
- `/gf1/leads/new`

## Proposals
Proposal drafting, approvals, slide builder, PDF export, PPTX generation, and downstream health/retirement notifications.

Routes:
- `/gf1/proposals`
- `/gf1/proposals/new`
- `/gf1/proposals/[id]`
- `/gf1/proposals/[id]/edit`
- `/gf1/proposals/[id]/slides`
- `/gf1/proposals/generator`
- `/gf1/proposals/pending`

## Pricing And Agreements
Agreement builder, pricing calculations, PDF export, and e-sign request workflows.

Routes:
- `/gf1/pricing`
- `/gf1/pricing/[id]`

## Renewals
Renewal queue with reminder generation and due-date management.

Routes:
- `/gf1/renewals`

## Reports
Lead, prospect, client, revenue, commission, and win/loss reporting.

Routes:
- `/gf1/reports`
- `/gf1/reports/win-loss`

## Support
GF1-scoped wrapper around the support portal and its API routes.

Routes:
- `/gf1/support`

## Admin
SUTA default rate administration plus company inventory management.

Routes:
- `/gf1/admin/settings`
- `/gf1/admin/inventory`

## Public Flows
External intake and questionnaire experiences that sales uses to collect client data.

Routes:
- `/gf1/intake/[token]`
- `/gf1/retirement-questionnaire`

