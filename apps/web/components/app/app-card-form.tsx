"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CreateRecordForm({
  endpoint,
  title,
  fields
}: {
  endpoint: string;
  title: string;
  fields: Array<{ name: string; label: string; placeholder?: string; required?: boolean }>;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);

    const form = new FormData(event.currentTarget);
    const body = Object.fromEntries(fields.map((field) => [field.name, String(form.get(field.name) ?? "").trim()]));

    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body)
    });
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;

    setPending(false);
    if (!response.ok) {
      setError(payload?.error ?? "Unable to save.");
      return;
    }

    event.currentTarget.reset();
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="rounded-md border border-border bg-white/65 p-5">
      <h2 className="text-lg font-semibold">{title}</h2>
      <div className="mt-4 grid gap-3">
        {fields.map((field) => (
          <label key={field.name} className="grid gap-2 text-sm font-medium text-muted-foreground">
            {field.label}
            <input
              name={field.name}
              required={field.required}
              placeholder={field.placeholder}
              className="h-11 rounded-md border border-border bg-white px-3 text-ink outline-none ring-primary/25 focus:ring-2"
            />
          </label>
        ))}
      </div>
      {error ? <p className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
      <Button disabled={pending} className="mt-5 h-11 w-full justify-between">
        {pending ? "Saving..." : "Save"} <ArrowRight className="h-4 w-4" />
      </Button>
    </form>
  );
}
