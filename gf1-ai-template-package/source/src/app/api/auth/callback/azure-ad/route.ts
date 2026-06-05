import { NextResponse } from 'next/server';
import { exchangeCode } from '@/lib/microsoft/graph';
import { encryptJson } from '@/lib/security/encryption';

function getTokenSecret(): string {
  return process.env.PROPOSAL_PRICING_SECRET ?? '';
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  let returnUrl = '/';
  let isPopup = false;
  try {
    if (state) {
      const decoded = JSON.parse(Buffer.from(state, 'base64url').toString());
      if (typeof decoded.returnUrl === 'string') returnUrl = decoded.returnUrl;
      if (decoded.popup === true) isPopup = true;
    }
  } catch {}

  const failAuth = () => {
    if (isPopup) {
      const html = `<!doctype html>
<html>
  <head><meta charset="utf-8" /><title>Microsoft Auth</title></head>
  <body>
    <script>
      (function () {
        try {
          if (window.opener) {
            window.opener.postMessage({ type: 'ms_auth', status: 'error' }, '${origin}');
            window.close();
            return;
          }
        } catch (e) {}
        window.location.href = '${origin}${returnUrl}?ms_auth=error';
      })();
    </script>
  </body>
</html>`;
      return new NextResponse(html, { headers: { 'content-type': 'text/html' } });
    }
    return NextResponse.redirect(`${origin}${returnUrl}?ms_auth=error`);
  };

  if (error || !code) {
    return failAuth();
  }

  try {
    const tokens = await exchangeCode(code);
    const encrypted = encryptJson(tokens, getTokenSecret());
    const isProd = process.env.NODE_ENV === 'production';
    const cookieValue = JSON.stringify(encrypted);
    if (isPopup) {
      const html = `<!doctype html>
<html>
  <head><meta charset="utf-8" /><title>Microsoft Auth</title></head>
  <body>
    <script>
      (function () {
        try {
          if (window.opener) {
            window.opener.postMessage({ type: 'ms_auth', status: 'success' }, '${origin}');
            window.close();
            return;
          }
        } catch (e) {}
        window.location.href = '${origin}${returnUrl}?ms_auth=success';
      })();
    </script>
  </body>
</html>`;
      const response = new NextResponse(html, { headers: { 'content-type': 'text/html' } });
      response.cookies.set('ms_graph_token', cookieValue, {
        httpOnly: true,
        secure: isProd,
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 30,
      });
      return response;
    }

    const response = NextResponse.redirect(`${origin}${returnUrl}?ms_auth=success`);
    response.cookies.set('ms_graph_token', cookieValue, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
    });
    return response;
  } catch (err: any) {
    console.error('[azure-ad callback] token exchange failed:', err?.message ?? err);
    return failAuth();
  }
}
