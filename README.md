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
- Auth.js v5 with Google, Apple, Microsoft Entra ID, and GitHub OAuth plus database sessions
- Supabase Postgres as the database host, accessed through Drizzle ORM
- Stripe Checkout, Billing Portal, and signed webhooks
- Vitest, Playwright, pgTAP

## Local Dev Setup

1. `pnpm install`
2. Copy `.env.example` to `.env.local`.
3. Fill `DATABASE_URL`, `DIRECT_URL`, `AUTH_SECRET`, `AUTH_URL`, and the OAuth client credentials for each enabled provider.
4. Run `pnpm --filter @eclipsesystems/web db:migrate`.
5. Optional billing setup: `pnpm seed:stripe`, then paste the printed Stripe price IDs into `.env.local`.
6. `pnpm dev`

Generate `AUTH_SECRET` with:

```bash
openssl rand -base64 32
```

`DATABASE_URL` should be the Supabase pooler connection string on port `6543` with `pgbouncer=true`. `DIRECT_URL` should be the direct Supabase Postgres connection string for migrations.

## OAuth Providers

OAuth is configured directly through Auth.js, not Supabase Auth. Use `{AUTH_URL}/api/auth/callback/{provider}` for each redirect URI.

Google callback:

- `http://localhost:3000/api/auth/callback/google`
- `https://eclipsesystems.pro/api/auth/callback/google`

Apple callback:

- `http://localhost:3000/api/auth/callback/apple`
- `https://eclipsesystems.pro/api/auth/callback/apple`

Microsoft Entra ID callback:

- `http://localhost:3000/api/auth/callback/entra-id`
- `https://eclipsesystems.pro/api/auth/callback/entra-id`

GitHub callback:

- `http://localhost:3000/api/auth/callback/github`
- `https://eclipsesystems.pro/api/auth/callback/github`

### Google

In Google Cloud Console, create an OAuth client:

- Application type: Web application
- Authorized JavaScript origin:
  - `http://localhost:3000`
  - `https://eclipsesystems.pro`
- Authorized redirect URI:
  - `http://localhost:3000/api/auth/callback/google`
  - `https://eclipsesystems.pro/api/auth/callback/google`

Copy the client id into `GOOGLE_CLIENT_ID` and the client secret into `GOOGLE_CLIENT_SECRET`.

### Apple

In Apple Developer, create a Services ID for web sign-in, enable Sign in with Apple, and add the return URLs listed above. Create a private key for Sign in with Apple and keep the `.p8` file private.

Generate the six-month Apple client secret with:

```bash
APPLE_TEAM_ID=... APPLE_KEY_ID=... APPLE_CLIENT_ID=... APPLE_PRIVATE_KEY_PATH=./AuthKey_XXXX.p8 pnpm apple:secret
```

Paste the output into `APPLE_CLIENT_SECRET`. Repeat this before it expires.

### Microsoft Entra ID

In Microsoft Entra admin center, register an app, add the Entra callback URL, create a client secret, and use these env vars:

- `MICROSOFT_ENTRA_ID_CLIENT_ID`
- `MICROSOFT_ENTRA_ID_CLIENT_SECRET`
- `MICROSOFT_ENTRA_ID_TENANT_ID=common` for multi-tenant and personal Microsoft accounts

### GitHub

In GitHub Developer settings, create an OAuth app, set Homepage URL to `AUTH_URL`, set Authorization callback URL to the GitHub callback above, then copy:

- `GITHUB_CLIENT_ID`
- `GITHUB_CLIENT_SECRET`

Required Auth.js env vars:

- `DATABASE_URL`: Supabase pooler connection string for serverless runtime queries.
- `DIRECT_URL`: Direct Supabase Postgres connection string for migrations.
- `AUTH_SECRET`: Secret used by Auth.js to sign/encrypt auth state.
- `AUTH_URL`: `http://localhost:3000` locally and `https://eclipsesystems.pro` in production.
- `GOOGLE_CLIENT_ID`: Google OAuth client id.
- `GOOGLE_CLIENT_SECRET`: Google OAuth client secret.
- `APPLE_CLIENT_ID`: Apple Services ID.
- `APPLE_CLIENT_SECRET`: Apple JWT client secret generated from the private key.
- `MICROSOFT_ENTRA_ID_CLIENT_ID`: Microsoft Entra application client id.
- `MICROSOFT_ENTRA_ID_CLIENT_SECRET`: Microsoft Entra client secret.
- `MICROSOFT_ENTRA_ID_TENANT_ID`: Use `common` unless limiting sign-ins to one tenant.
- `GITHUB_CLIENT_ID`: GitHub OAuth app client id.
- `GITHUB_CLIENT_SECRET`: GitHub OAuth app client secret.

## Drizzle Migrations

Generate migrations after schema changes:

```bash
pnpm --filter @eclipsesystems/web db:generate
```

Run migrations:

```bash
pnpm --filter @eclipsesystems/web db:migrate
```

## Deploy

Frontend deploys to Vercel. Supabase runs hosted Postgres. Stripe webhook endpoint should point at either the Supabase edge function directly or the included Next.js forwarding route:

- `https://<project-ref>.supabase.co/functions/v1/stripe-webhook`
- `https://eclipsesystems.pro/api/stripe/webhook`

## Schema Overview

The schema is multi-tenant by `organization_id`. Auth.js users mirror into `profiles`; organizations have memberships and a single subscription; domain tables hang off organizations. Feature-gated modules are clients/projects/tasks, invoices, shifts, chat, legal matters, conflict checks, and trust accounting. Sensitive tables write to `audit_log` through triggers.

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
