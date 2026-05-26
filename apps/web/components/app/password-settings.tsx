"use client";

import { useState } from "react";
import { KeyRound } from "lucide-react";

export function PasswordSettings({ hasPassword }: { hasPassword: boolean }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [message, setMessage] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("saving");
    setMessage("");

    const response = await fetch("/api/account/password", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword, newPassword, confirmPassword })
    });

    const data = (await response.json().catch(() => null)) as { error?: string } | null;

    if (!response.ok) {
      setStatus("error");
      setMessage(data?.error ?? "Could not update password.");
      return;
    }

    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setStatus("saved");
    setMessage(hasPassword ? "Password updated." : "Password added to your account.");
  }

  return (
    <form onSubmit={submit} className="rounded-md border border-border bg-white/65 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold dark:text-white">{hasPassword ? "Reset password" : "Set password"}</h2>
          </div>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {hasPassword ? "Change the password used for email sign in." : "Add an email password to this account."}
          </p>
        </div>
        <span className="rounded-sm bg-secondary px-2 py-1 text-xs font-semibold text-primary">
          {hasPassword ? "Password enabled" : "No password yet"}
        </span>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-3">
        {hasPassword ? (
          <label className="grid gap-2 text-sm font-semibold">
            Current password
            <input
              type="password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              autoComplete="current-password"
              className="h-11 rounded-md border border-border bg-cream/70 px-3 text-sm outline-none transition focus:border-primary"
            />
          </label>
        ) : null}
        <label className="grid gap-2 text-sm font-semibold">
          New password
          <input
            type="password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            autoComplete="new-password"
            minLength={8}
            className="h-11 rounded-md border border-border bg-cream/70 px-3 text-sm outline-none transition focus:border-primary"
          />
        </label>
        <label className="grid gap-2 text-sm font-semibold">
          Confirm password
          <input
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            autoComplete="new-password"
            minLength={8}
            className="h-11 rounded-md border border-border bg-cream/70 px-3 text-sm outline-none transition focus:border-primary"
          />
        </label>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={status === "saving"}
          className="inline-flex h-11 items-center rounded-md bg-primary px-4 text-sm font-semibold text-white transition hover:bg-[#263b2e] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {status === "saving" ? "Saving..." : hasPassword ? "Update password" : "Set password"}
        </button>
        {message ? (
          <p className={`text-sm font-semibold ${status === "error" ? "text-red-700 dark:text-red-300" : "text-primary dark:text-secondary"}`}>
            {message}
          </p>
        ) : null}
      </div>
    </form>
  );
}
