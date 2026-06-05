import { NextResponse } from 'next/server';
import { decryptJson, encryptJson, type EncryptedEnvelope } from '@/lib/security/encryption';
import { refreshTokens, sendMailViaGraph, type MsTokens, type SendEmailParams } from '@/lib/microsoft/graph';

function getTokenSecret(): string {
  return process.env.PROPOSAL_PRICING_SECRET ?? '';
}

function getTokensFromCookieHeader(cookieHeader: string | null): MsTokens | null {
  if (!cookieHeader) return null;
  const match = cookieHeader.split(';').find((c) => c.trim().startsWith('ms_graph_token='));
  if (!match) return null;
  try {
    const value = decodeURIComponent(match.trim().slice('ms_graph_token='.length));
    const envelope: EncryptedEnvelope = JSON.parse(value);
    return decryptJson<MsTokens>(envelope, getTokenSecret());
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  let tokens = getTokensFromCookieHeader(request.headers.get('cookie'));
  if (!tokens) {
    return NextResponse.json({ error: 'not_connected' }, { status: 401 });
  }

  const params: SendEmailParams = await request.json();
  if (!params.to || !params.subject) {
    return NextResponse.json({ error: 'missing_fields' }, { status: 400 });
  }

  let newCookieValue: string | null = null;
  if (tokens.expiresAt - Date.now() < 5 * 60 * 1000) {
    try {
      tokens = await refreshTokens(tokens.refreshToken);
      newCookieValue = JSON.stringify(encryptJson(tokens, getTokenSecret()));
    } catch {
      return NextResponse.json({ error: 'token_expired' }, { status: 401 });
    }
  }

  try {
    await sendMailViaGraph(tokens.accessToken, params);
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? 'send_failed' }, { status: 500 });
  }

  const res = NextResponse.json({ ok: true });
  if (newCookieValue) {
    res.cookies.set('ms_graph_token', newCookieValue, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
    });
  }
  return res;
}
