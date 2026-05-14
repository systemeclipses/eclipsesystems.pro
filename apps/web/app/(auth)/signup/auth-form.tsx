"use client";

import { Github } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const supabase = createClient();
  const label = mode === "login" ? "Sign in" : "Create account";

  async function signInWith(provider: "google" | "apple" | "azure" | "github") {
    await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${location.origin}/auth/callback` }
    });
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6">
      <h1 className="text-3xl font-semibold">{label}</h1>
      <div className="mt-6 grid gap-3">
        <Button onClick={() => signInWith("google")}>Continue with Google</Button>
        <Button onClick={() => signInWith("apple")} variant="outline">Continue with Apple</Button>
        <Button onClick={() => signInWith("azure")} variant="outline">Continue with Microsoft</Button>
        <Button onClick={() => signInWith("github")} variant="outline"><Github className="h-4 w-4" /> Continue with GitHub</Button>
      </div>
    </main>
  );
}
