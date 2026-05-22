# Setup

1. Clone the repo.
2. Install dependencies:

   ```bash
   pnpm install
   ```

3. Copy `.env.example` to `.env.local`.
4. Fill the required Auth.js, database, and OAuth env vars:

   ```bash
   DATABASE_URL=
   DIRECT_URL=
   AUTH_SECRET=
   AUTH_URL=http://localhost:3000
   GOOGLE_CLIENT_ID=
   GOOGLE_CLIENT_SECRET=
   APPLE_CLIENT_ID=
   APPLE_CLIENT_SECRET=
   MICROSOFT_ENTRA_ID_CLIENT_ID=
   MICROSOFT_ENTRA_ID_CLIENT_SECRET=
   MICROSOFT_ENTRA_ID_TENANT_ID=common
   GITHUB_CLIENT_ID=
   GITHUB_CLIENT_SECRET=
   ```

5. Generate an auth secret:

   ```bash
   openssl rand -base64 32
   ```

6. Run the database migration:

   ```bash
   pnpm --filter @eclipsesystems/web db:migrate
   ```

7. Start the dev server:

   ```bash
   pnpm dev
   ```

8. Open `http://localhost:3000/login` and continue with Google, Apple, Microsoft, or GitHub.

Successful sign-in should create rows in `users`, `accounts`, and `sessions`, then land on `/dashboard`. The `accounts.provider` value records which OAuth provider was used.

## OAuth Credential Walkthroughs

All providers use this callback format:

```text
{AUTH_URL}/api/auth/callback/{provider}
```

### Google

1. Go to Google Cloud Console.
2. Create or select a project.
3. Configure the OAuth consent screen.
4. Create an OAuth client with type `Web application`.
5. Add redirect URIs:
   - `http://localhost:3000/api/auth/callback/google`
   - `https://eclipsesystems.pro/api/auth/callback/google`
6. Save the client id and client secret as `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`.

### Apple

1. Go to Apple Developer.
2. Create a Services ID for the website client and enable Sign in with Apple.
3. Add return URLs:
   - `http://localhost:3000/api/auth/callback/apple`
   - `https://eclipsesystems.pro/api/auth/callback/apple`
4. Create a Sign in with Apple private key and download the `.p8` file.
5. Generate the client secret:

   ```bash
   APPLE_TEAM_ID=... APPLE_KEY_ID=... APPLE_CLIENT_ID=... APPLE_PRIVATE_KEY_PATH=./AuthKey_XXXX.p8 pnpm apple:secret
   ```

6. Save the output as `APPLE_CLIENT_SECRET`.

Apple client secrets expire. Regenerate this JWT at least every six months and update the deployed environment variable.

### Microsoft Entra ID

1. Go to Microsoft Entra admin center.
2. Register a new application.
3. Add redirect URIs:
   - `http://localhost:3000/api/auth/callback/entra-id`
   - `https://eclipsesystems.pro/api/auth/callback/entra-id`
4. Create a client secret.
5. Save the application client id and secret as `MICROSOFT_ENTRA_ID_CLIENT_ID` and `MICROSOFT_ENTRA_ID_CLIENT_SECRET`.
6. Use `MICROSOFT_ENTRA_ID_TENANT_ID=common` for multi-tenant and personal account support.

### GitHub

1. Go to GitHub Developer settings.
2. Create an OAuth app.
3. Set Homepage URL to `AUTH_URL`.
4. Add callback URLs:
   - `http://localhost:3000/api/auth/callback/github`
   - `https://eclipsesystems.pro/api/auth/callback/github`
5. Save the client id and client secret as `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET`.
