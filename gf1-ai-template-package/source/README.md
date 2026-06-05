# Galactic Intranet

Internal operations hub for Galactic, Inc. Built with Next.js 16 (App Router) and Supabase to provide authenticated access to dashboards, training, support tooling, and administrative approvals.

## Highlights
- **Modern UI**: Custom theme with glassmorphism cards, responsive navigation, and cohesive styling shared across protected pages.
- **Supabase Auth Bridge**: Client ↔ server session sync to keep RSC/middleware aware of Supabase cookies.
- **Approval Workflow**: Newly created accounts require an admin to mark them `approved` before protected areas unlock.
- **Admin Toolkit**: Paginated pending-user list with search, single/bulk approvals, audit/notification hooks, and optional Brevo email integration.
- **Typed Utilities**: Shared helpers for admin detection (`parseAdminEmails`, `isAdminEmail`, `isUserApproved`) with unit coverage via Vitest.

## Getting Started
1. **Install dependencies**
   ```bash
   npm install --include=dev
   ```
2. **Copy environment config**
   ```bash
   cp .env.local.example .env.local   # create one if you do not have it yet
   ```
3. **Run the dev server**
   ```bash
   npm run dev
   ```
4. Visit `http://localhost:3000`.

### Environment Variables
| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Supabase anon key for client access |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Service-role key used by admin APIs to update users |
| `ADMIN_EMAILS` | ✅ | Comma-separated list of admin email addresses; these bypass approval gates |
| `NEXT_PUBLIC_ADMIN_EMAILS` | ✅ | Same admin list, exposed client-side to show admin nav entry |
| `NEXT_PUBLIC_APP_URL` | ➖ | Used in transactional emails for approval confirmations |
| `BREVO_API_KEY` | ➖ | Enables optional Brevo transactional email sends |
| `BREVO_SENDER_EMAIL` / `BREVO_SENDER_NAME` | ➖ | Email metadata when Brevo is configured |

## Scripts
| Command | Description |
|---------|-------------|
| `npm run dev` | Start Next.js locally with hot reloading |
| `npm run build` | Create a production build |
| `npm start` | Run the production build |
| `npm run lint` | Execute ESLint checks |
| `npm run test` | Run Vitest unit tests (`src/lib/auth.test.ts`) |
| `npm run test:watch` | Watch mode for Vitest |

## Architecture Notes
- **App Router**: Shared layout (`src/app/layout.tsx`) renders the global header/footer and injects Supabase-derived user info into the client header.
- **Protected Routes**: `src/app/(protected)/layout.tsx` validates both authentication and approval. Non-approved users redirect to `/awaiting-approval`.
- **Middleware**: `middleware.ts` refreshes Supabase cookies on every protected request so server components stay in sync.
- **Supabase Clients**: `src/lib/supabase/server.ts` (SSR helper) and `src/lib/supabase/client.ts` (client helper).
- **UI System**: `src/app/globals.css` defines shared tokens (`.surface-card`, `.auth-card`, `.nav-link`, etc.) that power the refreshed design.
- **Admin Utilities**: `src/lib/auth.ts` centralizes admin/approval logic; routes and layouts import these helpers to keep access checks consistent.

## Authentication Flow
1. User signs in/up via Supabase (`/signin`).  
2. Session data posts to `/api/auth` to seed server-side cookies (for RSC + middleware).  
3. Protected pages run through `(protected)/layout.tsx` which calls `isUserApproved`.  
4. Admins listed in `ADMIN_EMAILS` are treated as implicitly approved.  
5. Admin screens use the Supabase service-role client to update `user_metadata.approved` and optionally insert audit or notification rows.

## Testing
- Uses **Vitest** with Node environment.
- Tests live under `src/**/*.test.ts`. Current coverage targets the auth helper utilities.
- Run `npm run test` for a single pass or `npm run test:watch` while iterating.
- Coverage output (text + JSON summary) is stored under `coverage/` when running with `--coverage`.

## Styling Guide
- Shared utility classes (`.hero`, `.surface-card`, `.data-table`, `.ghost-button`, etc.) live in `globals.css`.
- Buttons default to a primary gradient; apply `.secondary-button` or `.ghost-button` for alternate styles.
- Layout helpers: `.space-stack` (vertical rhythm), `.card-grid--two/--three` (responsive grid), `.auth-card` (forms), `.surface-panel` (content sections).
- Keep new components consistent by reusing these classes instead of inline styles.

## Admin Workflow Tips
1. Add admin email addresses to `ADMIN_EMAILS` before bootstrapping the app.
2. Visit `/admin/users` to review pending accounts.
3. Use single approvals for spot-checking; use “Approve all visible” when comfortable with the filtered batch.
4. Configure `BREVO_*` env vars if you want automatic approval notifications sent via Brevo.

## Next Steps
- Add role-aware navigation (e.g., show “Admin” tab only for admin accounts).
- Expand Vitest coverage to include API route guards and UI critical paths.
- Wire document generators and support modules to backend services as they come online.
