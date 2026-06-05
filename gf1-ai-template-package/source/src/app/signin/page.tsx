'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supaClient } from '@/lib/supabase/client';

type Message = { text: string; tone: 'info' | 'error' };

export default function SignIn() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const mode = searchParams.get('mode');
  const [isSignup, setIsSignup] = useState(mode === 'signup');
  const [showPw, setShowPw] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<Message | null>(null);

  async function resolvePostSignInPath(
    supabase: ReturnType<typeof supaClient>,
    userId?: string | null,
    emailAddr?: string | null
  ) {
    try {
      if (userId) {
        const { data } = await supabase
          .from('profiles')
          .select('role')
          .eq('user_id', userId)
          .maybeSingle();
        const role = (data as { role?: string | null } | null)?.role ?? null;
        if (role === 'letter_generator') return '/generators/letter';
        if (role) return '/dashboard';
      }

      if (emailAddr) {
        const { data } = await supabase
          .from('profiles')
          .select('role')
          .eq('email', emailAddr)
          .maybeSingle();
        const role = (data as { role?: string | null } | null)?.role ?? null;
        if (role === 'letter_generator') return '/generators/letter';
      }
    } catch {
      // ignore role lookup errors and use default redirect
    }

    return '/dashboard';
  }

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setLoading(true);
    const storage = rememberMe ? window.localStorage : window.sessionStorage;
    const supabase = supaClient(storage);
    let data: Awaited<ReturnType<typeof supabase.auth.signInWithPassword>>['data'] | null = null;
    let error: Awaited<ReturnType<typeof supabase.auth.signInWithPassword>>['error'] | null = null;
    try {
      ({ data, error } = await supabase.auth.signInWithPassword({ email, password }));
    } catch (err) {
      setLoading(false);
      const fallback =
        err instanceof TypeError && /fetch/i.test(err.message)
          ? 'Unable to reach Supabase. Check NEXT_PUBLIC_SUPABASE_URL and your network connection.'
          : 'Sign-in failed. Please try again.';
      setMessage({ text: fallback, tone: 'error' });
      return;
    }
    setLoading(false);
    if (error) {
      const text =
        /fetch/i.test(error.message)
          ? 'Unable to reach Supabase. Check NEXT_PUBLIC_SUPABASE_URL and your network connection.'
          : error.message;
      setMessage({ text, tone: 'error' });
      return;
    }
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('dashboard-donut-derby-popup', 'show');
    }

    console.log('[signin] Sending to /api/auth:', {
      session: data?.session,
      accessTokenType: typeof data?.session?.access_token,
      refreshTokenType: typeof data?.session?.refresh_token,
    });

    try {
      // Extract ONLY the token strings, don't reference the session object at all
      const access_token = data?.session?.access_token;
      const refresh_token = data?.session?.refresh_token;
      
      console.log('[signin] Token types:', { 
        accessTokenType: typeof access_token,
        accessTokenLength: String(access_token).length,
        refreshTokenType: typeof refresh_token,
        refreshTokenLength: String(refresh_token).length,
      });

      if (!access_token || !refresh_token) {
        console.error('[signin] Missing tokens:', { access_token: !!access_token, refresh_token: !!refresh_token });
        return;
      }

      // Detect corrupted tokens (access tokens should be ~1-2KB, not megabytes)
      if (String(access_token).length > 10000) {
        console.warn('[signin] Access token suspiciously large, skipping /api/auth call');
        // Don't try to set corrupted tokens; rely on browser localStorage auth
        const destination = await resolvePostSignInPath(
          supabase,
          data?.user?.id ?? null,
          data?.user?.email ?? null
        );
        router.replace(destination);
        return;
      }

      // Force convert to strings to avoid circular refs
      const accessStr = String(access_token);
      const refreshStr = String(refresh_token);

      const sessionPayload = { 
        session: { access_token: accessStr, refresh_token: refreshStr } 
      };
      console.log('[signin] Final payload size:', JSON.stringify(sessionPayload).length);
      
      const resp = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sessionPayload),
        credentials: 'include',
      });
      const json = await resp.json().catch(() => ({ ok: false }));
      if (!resp.ok || json?.ok === false) {
        console.warn('[signin] /api/auth failed:', { status: resp.status, body: json });
      }
      const destination = await resolvePostSignInPath(
        supabase,
        data?.user?.id ?? null,
        data?.user?.email ?? null
      );
      router.replace(destination);
    } catch (err) {
      console.error('Failed to set server auth cookies', err);
      const destination = await resolvePostSignInPath(
        supabase,
        data?.user?.id ?? null,
        data?.user?.email ?? null
      );
      router.replace(destination); // fallback with role-based destination
    }
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setLoading(true);
    const supabase = supaClient();
    const { data, error } = await supabase.auth.signUp({ email, password });
    setLoading(false);
    if (error) {
      setMessage({ text: error.message, tone: 'error' });
      return;
    }

    if (data?.session) {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('dashboard-donut-derby-popup', 'show');
      }
      try {
        const { access_token, refresh_token } = data.session;
        await fetch('/api/auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ session: { access_token, refresh_token } }),
          credentials: 'include',
        });
        router.replace('/dashboard');
      } catch (err) {
        console.error('Failed to set server auth cookies after sign-up', err);
        router.replace('/dashboard');
      }
      return;
    }

    setMessage({
      text: 'Check your inbox for a confirmation link. Approval may still be required before you can access protected sections.',
      tone: 'info',
    });
  }

  async function handleReset() {
    setMessage(null);
    const supabase = supaClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setMessage({
      text: error ? error.message : 'Password reset email sent. Look for a message from Galactic Ops.',
      tone: error ? 'error' : 'info',
    });
  }

  return (
    <section className="auth-root">
      <div className="auth-content">
        <section className="auth-wrapper space-stack">
          <article className="auth-card space-stack">
            <div className="auth-logo-wrap">
              <img
                src="/g365.svg"
                alt="Galactic 365"
                className="auth-logo"
              />
            </div>
            <form
              onSubmit={(e) => (isSignup ? handleSignUp(e) : handleSignIn(e))}
              className="form-grid"
              autoComplete="on"
            >
              {!isSignup ? (
                <p className="auth-form-title">Sign into your account</p>
              ) : (
                <p className="auth-form-title">Create your account</p>
              )}
              <label htmlFor="email">
                Email
            <input
              id="email"
              name="email"
              type="email"
              placeholder="you@galactic-inc.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </label>

          <label htmlFor="password">
            <div className="auth-field-header">
              <span>Password</span>
              {!isSignup ? (
                <button onClick={handleReset} disabled={!email} className="link-button" type="button">
                  Forgot your password?
                </button>
              ) : null}
            </div>
            <div className="password-field">
              <input
                id="password"
                name="password"
                type={showPw ? 'text' : 'password'}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete={isSignup ? 'new-password' : 'current-password'}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPw((s) => !s)}
                aria-label={showPw ? 'Hide password' : 'Show password'}
              >
                <i className={showPw ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye'} aria-hidden="true" />
              </button>
            </div>
          </label>

          {!isSignup ? (
            <label className="auth-checkbox">
              <input
                type="checkbox"
                name="remember"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              Remember me
            </label>
          ) : null}

          <button disabled={loading} type="submit">
            {loading ? (isSignup ? 'Creating...' : 'Signing in...') : 'Continue'}
          </button>
        </form>

        <div className="auth-toggle">
          <button
            type="button"
            className="ghost-button secondary-button"
                onClick={() => setIsSignup((s) => !s)}
              >
                {isSignup ? 'Back to sign in' : 'Need an account?'}
              </button>
            </div>

            {message && (
              <div className={`callout ${message.tone === 'error' ? 'error' : ''}`}>
                {message.text}
              </div>
            )}
          </article>
        </section>
      </div>
    </section>
  );
}
