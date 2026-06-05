import { getAzureConfig } from '../env';

export type MsTokens = {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
};

export type SendEmailParams = {
  to: string;
  subject: string;
  body: string;
};

export function buildAuthUrl(returnUrl: string, options?: { popup?: boolean }): string {
  const { clientId, tenantId, redirectUri } = getAzureConfig();
  const state = Buffer.from(
    JSON.stringify({ returnUrl, popup: Boolean(options?.popup) })
  ).toString('base64url');
  const params = new URLSearchParams({
    client_id: clientId,
    response_type: 'code',
    redirect_uri: redirectUri,
    scope: 'openid email profile Mail.Send offline_access',
    state,
    response_mode: 'query',
  });
  return `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/authorize?${params}`;
}

export async function exchangeCode(code: string): Promise<MsTokens> {
  const { clientId, clientSecret, tenantId, redirectUri } = getAzureConfig();
  const res = await fetch(`https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
      scope: 'openid email profile Mail.Send offline_access',
    }),
  });
  const data = await res.json();
  if (!res.ok || !data.access_token) {
    throw new Error(data.error_description ?? 'Failed to exchange authorization code');
  }
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: Date.now() + (data.expires_in ?? 3600) * 1000,
  };
}

export async function refreshTokens(refreshToken: string): Promise<MsTokens> {
  const { clientId, clientSecret, tenantId } = getAzureConfig();
  const res = await fetch(`https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  });
  const data = await res.json();
  if (!res.ok || !data.access_token) {
    throw new Error(data.error_description ?? 'Failed to refresh token');
  }
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token ?? refreshToken,
    expiresAt: Date.now() + (data.expires_in ?? 3600) * 1000,
  };
}

export async function sendMailViaGraph(accessToken: string, params: SendEmailParams): Promise<void> {
  const res = await fetch('https://graph.microsoft.com/v1.0/me/sendMail', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: {
        subject: params.subject,
        body: {
          contentType: 'HTML',
          content: params.body.replace(/\n/g, '<br>'),
        },
        toRecipients: [{ emailAddress: { address: params.to } }],
      },
      saveToSentItems: true,
    }),
  });
  if (res.status === 204) return;
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as any)?.error?.message ?? `Graph API error ${res.status}`);
  }
}
