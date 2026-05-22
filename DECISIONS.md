# Decisions

## Auth.js over Supabase Auth

We switched authentication to Auth.js v5 with database sessions in Supabase Postgres. Supabase is treated as a plain Postgres host for app auth. This keeps OAuth callbacks on the application domain through `/api/auth/*` instead of requiring a Supabase Auth callback/custom auth domain.

## Prompt Conflicts and Resolutions

- The prompt requested `src/app/...`, but this project uses `apps/web/app/...`. Auth.js route handlers were added under `apps/web/app/api/auth/[...nextauth]/route.ts`, and shared auth/db code lives in `apps/web/src`.
- The prompt said successful sign-in should land on `/app/dashboard` unless the site map says otherwise. The actual site map exposes the logged-in dashboard at `/dashboard`, so OAuth sign-in redirects there.
- The existing schema used Supabase Auth-shaped `auth.users -> profiles -> memberships`. Auth.js uses its own adapter tables, so the migration creates `users`, `accounts`, `sessions`, and `verification_tokens`, then repoints `profiles.id` at `users.id`.
- Auth.js Drizzle examples use default text ids. The existing app schema uses UUID ids for user/profile relationships, so the Auth.js `users.id` column is UUID while still using the adapter table shape and adapter-provided table mapping.
- OAuth sign-in uses Auth.js built-in providers for Google, Apple, Microsoft Entra ID, and GitHub. Microsoft Entra ID is configured with provider id `entra-id` so its callback is `/api/auth/callback/entra-id`.
- Existing app pages still use organization-scoped data. The new Drizzle query layer takes `userId` and `organizationId` arguments; follow-up hardening should join membership in every query so ownership is enforced in SQL, not only by caller discipline.

## Assumptions

- `DATABASE_URL` points at the Supabase pooler URL on port `6543` with `pgbouncer=true`.
- `DIRECT_URL` points at the direct Supabase Postgres connection and is used for migrations.
- `AUTH_URL` is `http://localhost:3000` in development and `https://eclipsesystems.pro` in production.
