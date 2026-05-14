# Eclipse Systems Timekeeping

## Product Overview

Eclipse Systems is an all-in-one timekeeping SaaS for individuals, teams, shift-based operators, and legal practices. It combines live timers, manual time entry, approvals, clients, projects, invoices, shift marketplace workflows, realtime chat, legal matters, UTBMS billing, LEDES export, and trust accounting.

| Plan | Monthly | Annual effective monthly | Includes |
| --- | ---: | ---: | --- |
| Starter | $10/seat | $8/seat | Personal and team timekeeping, manual entries, live timer, basic reports, mobile and web |
| Pro | $18/seat | $14.40/seat | Starter plus clients, projects, tasks, invoicing, PDF export, payment links |
| Business | $28/seat | $22.40/seat | Pro plus shifts, add/drop marketplace, swaps, realtime chat, hierarchy, approvals |
| Legal | $55/seat | $44/seat | Business plus UTBMS, matters, conflict checks, LEDES 1998B, trust ledger, custom rates |

All paid plans have a 14-day card-required trial. Team organizations require at least 2 seats. Personal organizations are the application-layer exception with exactly 1 seat.

## Tech Stack

- Next.js 14 App Router, TypeScript strict, Tailwind, shadcn-style primitives, Lucide icons
- Supabase Auth, Postgres, Row-Level Security, Realtime, Edge Functions
- `@supabase/supabase-js` v2 and `@supabase/ssr`
- Stripe Checkout, Billing Portal, and signed webhooks
- Vitest, Playwright, pgTAP

## Local Dev Setup

1. `pnpm install`
2. Copy `.env.example` to `.env.local` and fill Supabase and Stripe values.
3. `supabase start`
4. `supabase db reset`
5. `pnpm seed:stripe`
6. Paste the printed Stripe price IDs into `.env.local` and update `plans` Stripe IDs in Supabase.
7. `pnpm dev`

## OAuth Providers

Use these redirect URIs for every provider:

- `https://eclipsesystems.pro/auth/callback`
- `https://<project-ref>.supabase.co/auth/v1/callback`
- `http://localhost:3000/auth/callback` for local development

Google:
Create OAuth credentials in Google Cloud Console, add the redirect URIs, then paste the client ID and secret into Supabase Dashboard, Auth, Providers, Google.

Apple:
Create a Services ID and private key in Apple Developer, configure web redirect URIs, then paste the service ID, team ID, key ID, and private key into Supabase Dashboard, Auth, Providers, Apple.

Microsoft:
Create an Azure App Registration, enable the web platform redirect URIs, create a client secret, then configure Supabase Dashboard, Auth, Providers, Azure.

GitHub:
Create a GitHub OAuth App, add the callback URL, then configure Supabase Dashboard, Auth, Providers, GitHub.

## Deploy

Frontend deploys to Vercel. Supabase runs hosted Postgres, Auth, Realtime, and Edge Functions. Stripe webhook endpoint should point at either the Supabase edge function directly or the included Next.js forwarding route:

- `https://<project-ref>.supabase.co/functions/v1/stripe-webhook`
- `https://eclipsesystems.pro/api/stripe/webhook`

## Schema Overview

The schema is multi-tenant by `organization_id`. Auth users mirror into `profiles`; organizations have memberships and a single subscription; domain tables hang off organizations. Feature-gated modules are clients/projects/tasks, invoices, shifts, chat, legal matters, conflict checks, and trust accounting. Sensitive tables write to `audit_log` through triggers.

## RLS Philosophy

Every table has RLS enabled and forced. Tenant tables check active organization membership, feature-gated tables call `org_has_feature()`, and managerial access uses the recursive subordinate helper. Stripe mutation tables are service-role only. Add new gated tables by including `organization_id`, `deleted_at`, RLS enable/force, named CRUD policies, and a feature check when appropriate.

## Adding A Plan Feature

Add the feature flag to `packages/shared/plans.ts`, seed it in `0015_seed_reference_data.sql`, expose it through UI gating with `requireFeature()`, and enforce it in database policies with `org_has_feature()`.

## Tests

- `pnpm test`
- `pnpm typecheck`
- `pnpm lint`
- `pnpm test:e2e`
- `supabase test db`

## Implementation Decisions

- `{{PROJECT_NAME}}` was resolved to the current workspace brand, Eclipse Systems.
- Existing untracked Vite files in `eclipsesystems.pro/` were left untouched; the requested monorepo was scaffolded at repository root.
- Money is stored as `numeric(19,4)` in Postgres and converted to Stripe cents only at API boundaries.
- The Next.js Stripe webhook route forwards raw body and signature to the Supabase Edge Function, keeping signing secrets and database writes in Supabase.
- UTBMS seed names are based on LEDES/LOC published UTBMS activity and expense references; the README should be revisited if a client requires a different jurisdictional code set.

## Known TODOs

- Install Supabase CLI locally and run `supabase db reset`; this environment did not have the CLI available.
- Replace placeholder Stripe product and price IDs in seeded `plans`.
- Wire Resend email delivery for invitations and trial-ending notices.
- Replace the invoice PDF and LEDES export stubs with production renderers.
- Expand pgTAP tests from policy-existence coverage into full JWT fixture isolation tests.
