function assertEnv(value: string | undefined, name: string): string {
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}. Add it to .env.local (see README).`);
  }
  return value;
}

// These are safe to inline into client bundles (NEXT_PUBLIC_* gets exposed by Next).
const PUBLIC_SUPABASE_URL = assertEnv(process.env.NEXT_PUBLIC_SUPABASE_URL, 'NEXT_PUBLIC_SUPABASE_URL');
const PUBLIC_SUPABASE_ANON_KEY = assertEnv(
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  'NEXT_PUBLIC_SUPABASE_ANON_KEY'
);

export const env = {
  supabaseUrl: PUBLIC_SUPABASE_URL,
  supabaseAnonKey: PUBLIC_SUPABASE_ANON_KEY,
};

// Server-only env (do not expose to clients).
export function getServiceRoleKey(): string {
  return assertEnv(process.env.SUPABASE_SERVICE_ROLE_KEY, 'SUPABASE_SERVICE_ROLE_KEY');
}

export function getProposalPricingSecret(): string {
  return assertEnv(process.env.PROPOSAL_PRICING_SECRET, 'PROPOSAL_PRICING_SECRET');
}

export function getAnthropicApiKey(): string {
  return assertEnv(process.env.ANTHROPIC_API_KEY, 'ANTHROPIC_API_KEY');
}

export function getGeminiApiKey(): string {
  return assertEnv(process.env.GEMINI_API_KEY, 'GEMINI_API_KEY');
}

export function getAzureConfig() {
  return {
    clientId: assertEnv(process.env.AZURE_AD_CLIENT_ID, 'AZURE_AD_CLIENT_ID'),
    clientSecret: assertEnv(process.env.AZURE_AD_CLIENT_SECRET, 'AZURE_AD_CLIENT_SECRET'),
    tenantId: assertEnv(process.env.AZURE_AD_TENANT_ID, 'AZURE_AD_TENANT_ID'),
    redirectUri: assertEnv(process.env.AZURE_AD_REDIRECT_URI, 'AZURE_AD_REDIRECT_URI'),
  };
}
