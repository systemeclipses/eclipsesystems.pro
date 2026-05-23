"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, type CSSProperties, type FormEvent } from "react";
import { ArrowRight, Github, Sparkles } from "lucide-react";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";

const fallbackStyles = {
  shell: {
    minHeight: "100vh",
    background: "#F9E8D2",
    color: "#1c261e",
    padding: "12px",
    fontFamily: "var(--font-helvena), Arial, sans-serif"
  },
  stage: {
    display: "grid",
    minHeight: "calc(100vh - 24px)",
    overflow: "hidden",
    borderRadius: "6px",
    background: "#47624F",
    color: "#fff",
    gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 360px), 1fr))"
  },
  story: {
    position: "relative",
    display: "flex",
    minHeight: "420px",
    flexDirection: "column",
    justifyContent: "space-between",
    padding: "40px"
  },
  texture: {
    position: "absolute",
    inset: 0,
    opacity: 0.45,
    background:
      "radial-gradient(circle at 18% 22%, #b4c292 0 8%, transparent 9%), linear-gradient(135deg, transparent 0 38%, rgba(249,232,210,.16) 39% 40%, transparent 41% 62%, rgba(180,194,146,.22) 63% 64%, transparent 65%), repeating-linear-gradient(0deg, rgba(249,232,210,.06) 0 1px, transparent 1px 42px), repeating-linear-gradient(90deg, rgba(249,232,210,.06) 0 1px, transparent 1px 42px)"
  },
  above: { position: "relative", zIndex: 1 },
  logo: {
    color: "#fff",
    fontFamily: "var(--font-seatren), Georgia, serif",
    fontSize: "30px",
    lineHeight: 1,
    textDecoration: "none"
  },
  eyebrow: {
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    color: "#b4c292",
    fontSize: "14px",
    fontWeight: 700
  },
  heroTitle: {
    marginTop: "20px",
    color: "#fff",
    fontFamily: "var(--font-seatren), Georgia, serif",
    fontSize: "clamp(64px, 8vw, 96px)",
    lineHeight: 0.88
  },
  heroCopy: {
    marginTop: "24px",
    maxWidth: "560px",
    color: "rgba(255,255,255,.78)",
    fontSize: "18px",
    lineHeight: 1.55
  },
  proofGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 160px), 1fr))",
    gap: "12px",
    color: "rgba(255,255,255,.72)",
    fontSize: "14px"
  },
  proofCard: {
    border: "1px solid rgba(255,255,255,.15)",
    borderRadius: "6px",
    background: "rgba(255,255,255,.1)",
    padding: "16px"
  },
  panel: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#F9E8D2",
    padding: "40px"
  },
  card: {
    width: "100%",
    maxWidth: "760px",
    border: "1px solid #d9c7aa",
    borderRadius: "6px",
    background: "rgba(255,255,255,.75)",
    color: "#1c261e",
    padding: "32px",
    boxShadow: "0 24px 60px rgba(71,98,79,.15)"
  },
  cardTitle: {
    marginTop: "12px",
    color: "#1c261e",
    fontFamily: "var(--font-seatren), Georgia, serif",
    fontSize: "48px",
    lineHeight: 1
  },
  mutedCopy: {
    marginTop: "16px",
    color: "#496052",
    fontSize: "14px",
    lineHeight: 1.7
  },
  primaryButton: {
    width: "100%",
    height: "44px",
    justifyContent: "space-between",
    background: "#47624F",
    color: "#fff"
  },
  outlineButton: {
    width: "100%",
    height: "44px",
    justifyContent: "flex-start",
    border: "1px solid #d9c7aa",
    background: "#fff",
    color: "#1c261e"
  },
  label: {
    display: "grid",
    gap: "8px",
    color: "#496052",
    fontSize: "13px",
    fontWeight: 500
  },
  input: {
    height: "44px",
    width: "100%",
    border: "1px solid #d9c7aa",
    borderRadius: "6px",
    background: "#fff",
    color: "#1c261e",
    padding: "0 12px",
    fontSize: "15px",
    fontWeight: 400
  },
  divider: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
    color: "#6d7f70",
    fontSize: "12px",
    fontWeight: 700,
    textTransform: "uppercase"
  },
  status: {
    borderRadius: "6px",
    padding: "10px 12px",
    fontSize: "13px",
    lineHeight: 1.5
  },
  note: {
    marginTop: "28px",
    border: "1px solid #47624F",
    borderRadius: "6px",
    background: "#47624F",
    padding: "16px",
    color: "#F9E8D2",
    fontSize: "14px",
    lineHeight: 1.7
  }
} satisfies Record<string, CSSProperties>;

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={className ?? "h-4 w-4 shrink-0"}>
      <path
        fill="#4285F4"
        d="M23.04 12.26c0-.82-.07-1.6-.21-2.36H12v4.46h6.19a5.3 5.3 0 0 1-2.3 3.48v2.89h3.72c2.18-2.01 3.43-4.97 3.43-8.47Z"
      />
      <path
        fill="#34A853"
        d="M12 23.5c3.1 0 5.7-1.03 7.6-2.77l-3.72-2.89c-1.03.69-2.35 1.1-3.88 1.1-2.99 0-5.52-2.02-6.42-4.73H1.74v2.98A11.5 11.5 0 0 0 12 23.5Z"
      />
      <path
        fill="#FBBC05"
        d="M5.58 14.21a6.91 6.91 0 0 1 0-4.42V6.81H1.74a11.5 11.5 0 0 0 0 10.38l3.84-2.98Z"
      />
      <path
        fill="#EA4335"
        d="M12 5.06c1.69 0 3.2.58 4.39 1.72l3.3-3.3A11.1 11.1 0 0 0 12 .5 11.5 11.5 0 0 0 1.74 6.81l3.84 2.98C6.48 7.08 9.01 5.06 12 5.06Z"
      />
    </svg>
  );
}

function AppleIcon({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={className ?? "h-4 w-4 shrink-0 fill-current"}>
      <path d="M12.15 6.9c-.95 0-2.42-1.08-3.96-1.04-2.04.03-3.91 1.18-4.96 3-2.12 3.67-.54 9.1 1.52 12.08 1.01 1.46 2.2 3.1 3.78 3.04 1.52-.06 2.09-.98 3.93-.98s2.36.98 3.96.95c1.64-.03 2.67-1.49 3.67-2.95 1.15-1.69 1.63-3.32 1.66-3.4-.04-.02-3.18-1.22-3.22-4.84-.03-3.03 2.48-4.48 2.59-4.55-1.42-2.06-3.61-2.35-4.38-2.38-1.98-.16-3.64 1.07-4.59 1.07Zm3.37-3.11C16.36 2.78 16.93 1.38 16.77 0c-1.21.05-2.68.81-3.55 1.82-.78.9-1.46 2.34-1.28 3.7 1.35.11 2.73-.69 3.58-1.73Z" />
    </svg>
  );
}

function MicrosoftIcon({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={className ?? "h-4 w-4 shrink-0"}>
      <path fill="#F25022" d="M1 1h10.45v10.45H1z" />
      <path fill="#7FBA00" d="M12.55 1H23v10.45H12.55z" />
      <path fill="#00A4EF" d="M1 12.55h10.45V23H1z" />
      <path fill="#FFB900" d="M12.55 12.55H23V23H12.55z" />
    </svg>
  );
}

const authProviders = [
  { id: "google", label: "Continue with Google", loadingLabel: "Opening Google...", icon: GoogleIcon },
  { id: "apple", label: "Continue with Apple", loadingLabel: "Opening Apple...", icon: AppleIcon },
  { id: "entra-id", label: "Continue with Microsoft", loadingLabel: "Opening Microsoft...", icon: MicrosoftIcon },
  { id: "github", label: "Continue with GitHub", loadingLabel: "Opening GitHub...", icon: Github }
];

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const isLogin = mode === "login";
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loadingProvider, setLoadingProvider] = useState<string | null>(null);
  const [loadingPassword, setLoadingPassword] = useState(false);
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const label = isLogin ? "Welcome back." : "Start your Eclipse.";
  const supporting = isLogin
    ? "Sign in to get back to time, billing, shifts, matters, and the operating work already in motion."
    : "Create your workspace and bring timekeeping, billing, shifts, and legal workflows into one orbit.";
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";

  async function signInWithProvider(providerId: string) {
    setLoadingProvider(providerId);
    setMessage(null);

    try {
      await signIn(providerId, { callbackUrl });
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Unable to start sign-in." });
      setLoadingProvider(null);
    }
  }

  async function submitPasswordForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoadingPassword(true);
    setMessage(null);

    if (!isLogin && password !== confirmPassword) {
      setMessage({ type: "error", text: "Passwords do not match." });
      setLoadingPassword(false);
      return;
    }

    try {
      const response = await fetch(isLogin ? "/api/password/login" : "/api/password/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          password,
          confirmPassword
        })
      });
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;

      if (!response.ok) {
        setMessage({ type: "error", text: payload?.error ?? "Unable to continue with email and password." });
        return;
      }

      router.push(callbackUrl);
      router.refresh();
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Unable to continue with email and password." });
    } finally {
      setLoadingPassword(false);
    }
  }

  return (
    <main className="min-h-screen bg-cream p-3 text-ink" style={fallbackStyles.shell}>
      <section className="grid min-h-[calc(100vh-1.5rem)] overflow-hidden rounded-md bg-primary text-white lg:grid-cols-[1.05fr_0.95fr]" style={fallbackStyles.stage}>
        <div className="relative flex min-h-[420px] flex-col justify-between p-6 md:p-10" style={fallbackStyles.story}>
          <div className="absolute inset-0 opacity-45 [background:radial-gradient(circle_at_18%_22%,#b4c292_0_8%,transparent_9%),linear-gradient(135deg,transparent_0_38%,rgba(249,232,210,.16)_39%_40%,transparent_41%_62%,rgba(180,194,146,.22)_63%_64%,transparent_65%),repeating-linear-gradient(0deg,rgba(249,232,210,.06)_0_1px,transparent_1px_42px),repeating-linear-gradient(90deg,rgba(249,232,210,.06)_0_1px,transparent_1px_42px)]" style={fallbackStyles.texture} />
          <div className="relative z-10" style={fallbackStyles.above}>
            <Link href="/" className="font-title text-3xl leading-none text-cream" style={fallbackStyles.logo}>Eclipse Systems</Link>
          </div>

          <div className="relative z-10 max-w-2xl" style={fallbackStyles.above}>
            <p className="inline-flex items-center gap-2 text-sm font-semibold text-secondary" style={fallbackStyles.eyebrow}>
              <Sparkles className="h-4 w-4" />
              One workspace for the work behind the numbers.
            </p>
            <h1 className="mt-5 font-title text-6xl leading-[0.88] text-cream md:text-8xl" style={fallbackStyles.heroTitle}>{label}</h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-white/78 md:text-lg" style={fallbackStyles.heroCopy}>{supporting}</p>
          </div>

          <div className="relative z-10 grid gap-3 text-sm text-white/72 sm:grid-cols-3" style={{ ...fallbackStyles.above, ...fallbackStyles.proofGrid }}>
            {["Track time", "Approve work", "Bill cleanly"].map((item) => (
              <div key={item} className="rounded-md border border-white/15 bg-white/10 p-4" style={fallbackStyles.proofCard}>
                <p className="font-semibold text-cream">{item}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-center bg-cream p-5 md:p-10" style={fallbackStyles.panel}>
          <div className="w-full max-w-[760px] rounded-md border border-border bg-white/75 p-5 text-ink shadow-2xl shadow-primary/15 md:p-8" style={fallbackStyles.card}>
            <p className="text-sm font-semibold text-primary">{isLogin ? "Sign in" : "Create account"}</p>
            <h2 className="mt-3 font-title text-5xl leading-none" style={fallbackStyles.cardTitle}>{isLogin ? "Enter the workspace." : "Build the workspace."}</h2>
            <p className="mt-4 text-sm leading-6 text-muted-foreground" style={fallbackStyles.mutedCopy}>
              Use email and password, or continue with a connected provider.
            </p>

            <div className="mt-7 grid gap-5 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] md:items-stretch">
              {message ? (
                <p
                  className={message.type === "error" ? "bg-red-50 text-red-700 md:col-span-3" : "bg-secondary/35 text-primary md:col-span-3"}
                  role="status"
                  style={{
                    ...fallbackStyles.status,
                    background: message.type === "error" ? "#fff1f2" : "rgba(180,194,146,.35)",
                    color: message.type === "error" ? "#b42318" : "#47624F"
                  }}
                >
                  {message.text}
                </p>
              ) : null}
              <form className="grid content-start gap-3" onSubmit={submitPasswordForm}>
                {!isLogin ? (
                  <label className="grid gap-2 text-sm font-medium text-muted-foreground" style={fallbackStyles.label}>
                    Name
                    <input
                      className="h-11 rounded-md border border-border bg-white px-3 text-ink outline-none ring-primary/25 focus:ring-2"
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      autoComplete="name"
                      style={fallbackStyles.input}
                    />
                  </label>
                ) : null}
                <label className="grid gap-2 text-sm font-medium text-muted-foreground" style={fallbackStyles.label}>
                  Email
                  <input
                    className="h-11 rounded-md border border-border bg-white px-3 text-ink outline-none ring-primary/25 focus:ring-2"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    autoComplete="email"
                    required
                    style={fallbackStyles.input}
                  />
                </label>
                <label className="grid gap-2 text-sm font-medium text-muted-foreground" style={fallbackStyles.label}>
                  Password
                  <input
                    className="h-11 rounded-md border border-border bg-white px-3 text-ink outline-none ring-primary/25 focus:ring-2"
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    autoComplete={isLogin ? "current-password" : "new-password"}
                    minLength={8}
                    required
                    style={fallbackStyles.input}
                  />
                </label>
                {!isLogin ? (
                  <label className="grid gap-2 text-sm font-medium text-muted-foreground" style={fallbackStyles.label}>
                    Confirm password
                    <input
                      className="h-11 rounded-md border border-border bg-white px-3 text-ink outline-none ring-primary/25 focus:ring-2"
                      type="password"
                      value={confirmPassword}
                      onChange={(event) => setConfirmPassword(event.target.value)}
                      autoComplete="new-password"
                      minLength={8}
                      required
                      style={fallbackStyles.input}
                    />
                  </label>
                ) : null}
                <Button
                  className="h-11 justify-between bg-primary px-4 text-primary-foreground hover:bg-[#314839]"
                  disabled={loadingPassword || loadingProvider !== null}
                  type="submit"
                  style={fallbackStyles.primaryButton}
                >
                  <span>{loadingPassword ? (isLogin ? "Signing in..." : "Creating account...") : isLogin ? "Sign in with email" : "Create account"}</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </form>

              <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 text-xs font-semibold uppercase text-muted-foreground md:grid-cols-1 md:grid-rows-[1fr_auto_1fr]" style={fallbackStyles.divider}>
                <span className="h-px bg-border md:h-full md:w-px" />
                <span>or</span>
                <span className="h-px bg-border md:h-full md:w-px" />
              </div>

              <div className="grid content-center gap-3">
                {authProviders.map((provider) => {
                  const Icon = provider.icon;
                  const isLoading = loadingProvider === provider.id;

                  return (
                    <Button
                      key={provider.id}
                      onClick={() => signInWithProvider(provider.id)}
                      className="h-11 justify-between border border-secondary bg-secondary px-4 text-white hover:bg-[#a7b582]"
                      disabled={loadingProvider !== null}
                      style={{
                        ...fallbackStyles.primaryButton,
                        border: "1px solid #b4c292",
                        background: "#b4c292",
                        color: "#fff"
                      }}
                    >
                      <span className="inline-flex min-w-0 items-center gap-2">
                        <Icon className="h-4 w-4 shrink-0" />
                        <span className="truncate">{isLoading ? provider.loadingLabel : provider.label}</span>
                      </span>
                      <ArrowRight className="h-4 w-4 shrink-0" />
                    </Button>
                  );
                })}
                {!isLogin ? (
                  <div className="rounded-md border border-primary bg-primary p-4 text-sm leading-6 text-white" style={{ ...fallbackStyles.note, marginTop: 0 }}>
                    <span style={{ color: "#fff" }}>Already have a workspace?</span>{" "}
                    <Link href="/login" className="font-semibold text-white hover:underline">
                      Sign in.
                    </Link>
                  </div>
                ) : null}
              </div>
            </div>

            {isLogin ? (
              <div className="mt-7 rounded-md border border-primary bg-primary p-4 text-sm leading-6 text-white" style={fallbackStyles.note}>
                <span style={{ color: "#fff" }}>New to Eclipse?</span>{" "}
                <Link href="/signup" className="font-semibold text-white hover:underline">
                  Create an account.
                </Link>
              </div>
            ) : null}
          </div>
        </div>
      </section>
    </main>
  );
}
