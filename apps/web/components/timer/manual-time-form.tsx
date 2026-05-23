"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

type Project = { id: string; name: string };

function toLocalInputValue(date: Date) {
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

export function ManualTimeForm({ projects }: { projects: Project[] }) {
  const router = useRouter();
  const now = new Date();
  const [startedAt, setStartedAt] = useState(toLocalInputValue(new Date(now.getTime() - 60 * 60 * 1000)));
  const [endedAt, setEndedAt] = useState(toLocalInputValue(now));
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);

    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/time-entries/manual", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        description: String(form.get("description") ?? ""),
        projectId: String(form.get("projectId") ?? ""),
        startedAt,
        endedAt
      })
    });
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;

    setPending(false);
    if (!response.ok) {
      setError(payload?.error ?? "Unable to add time.");
      return;
    }

    event.currentTarget.reset();
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="rounded-md border border-border bg-white/65 p-5">
      <h2 className="text-lg font-semibold">Add manual time</h2>
      <div className="mt-4 grid gap-3">
        <label className="grid gap-2 text-sm font-medium text-muted-foreground">
          Description
          <input name="description" className="h-11 rounded-md border border-border bg-white px-3 text-ink outline-none ring-primary/25 focus:ring-2" />
        </label>
        <label className="grid gap-2 text-sm font-medium text-muted-foreground">
          Project
          <select name="projectId" className="h-11 rounded-md border border-border bg-white px-3 text-ink outline-none ring-primary/25 focus:ring-2">
            <option value="">No project</option>
            {projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
          </select>
        </label>
        <label className="grid gap-2 text-sm font-medium text-muted-foreground">
          Start
          <input type="datetime-local" value={startedAt} onChange={(event) => setStartedAt(event.target.value)} className="h-11 rounded-md border border-border bg-white px-3 text-ink outline-none ring-primary/25 focus:ring-2" />
        </label>
        <label className="grid gap-2 text-sm font-medium text-muted-foreground">
          End
          <input type="datetime-local" value={endedAt} onChange={(event) => setEndedAt(event.target.value)} className="h-11 rounded-md border border-border bg-white px-3 text-ink outline-none ring-primary/25 focus:ring-2" />
        </label>
      </div>
      {error ? <p className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
      <Button disabled={pending} className="mt-5 h-11 w-full justify-between">
        {pending ? "Adding..." : "Add time"} <Plus className="h-4 w-4" />
      </Button>
    </form>
  );
}
