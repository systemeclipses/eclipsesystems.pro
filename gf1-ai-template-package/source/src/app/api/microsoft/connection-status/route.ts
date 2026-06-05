import { NextResponse } from 'next/server';
import { decryptJson, type EncryptedEnvelope } from '@/lib/security/encryption';
import type { MsTokens } from '@/lib/microsoft/graph';

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

export async function GET(request: Request) {
  const tokens = getTokensFromCookieHeader(request.headers.get('cookie'));
  if (!tokens) {
    return NextResponse.json({ connected: false, reason: 'missing' }, { status: 200 });
  }
  if (tokens.expiresAt <= Date.now()) {
    return NextResponse.json({ connected: false, reason: 'expired' }, { status: 200 });
  }
  return NextResponse.json({ connected: true }, { status: 200 });
}
