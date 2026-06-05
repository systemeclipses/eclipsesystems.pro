import { NextResponse } from 'next/server';
import { buildAuthUrl } from '@/lib/microsoft/graph';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const returnUrl = searchParams.get('return') ?? '/';
  const popup = searchParams.get('popup') === '1';
  try {
    const authUrl = buildAuthUrl(returnUrl, { popup });
    return NextResponse.redirect(authUrl);
  } catch (err: any) {
    console.error('[azure-ad auth] failed to build auth url:', err?.message ?? err);
    if (popup) {
      const html = `<!doctype html>
<html>
  <head><meta charset="utf-8" /><title>Microsoft Auth</title></head>
  <body>
    <script>
      (function () {
        try {
          if (window.opener) {
            window.opener.postMessage({ type: 'ms_auth', status: 'error', reason: 'auth_url' }, '${origin}');
            window.close();
            return;
          }
        } catch (e) {}
        window.location.href = '${origin}${returnUrl}?ms_auth=error&ms_reason=auth_url';
      })();
    </script>
  </body>
</html>`;
      return new NextResponse(html, { headers: { 'content-type': 'text/html' } });
    }
    return NextResponse.redirect(`${origin}${returnUrl}?ms_auth=error&ms_reason=auth_url`);
  }
}
