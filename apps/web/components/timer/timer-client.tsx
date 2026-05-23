"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Play, Square } from "lucide-react";
import { Button } from "@/components/ui/button";

type Project = { id: string; name: string };
type Running = { id: string; description: string | null; started_at: string } | null;

export function TimerClient({ orgId, projects, running }: { orgId: string; projects: Project[]; running: Running }) {
  const [description, setDescription] = useState(running?.description ?? "");
  const [projectId, setProjectId] = useState("");
  const [active, setActive] = useState(running);

  async function start() {
    const response = await fetch("/api/time-entries/start", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ orgId, projectId: projectId || null, description })
    });

    if (response.ok) setActive(await response.json() as Running);
  }

  async function stop() {
    if (!active) return;
    const response = await fetch("/api/time-entries/stop", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id: active.id })
    });
    if (response.ok) setActive(null);
  }

  return (
    <section className="space-y-5">
      <div className="overflow-hidden rounded-md bg-primary p-6 text-white md:p-8">
        <p className="text-sm font-semibold text-secondary">Live timer</p>
        <h1 className="mt-4 font-title text-6xl leading-[0.86] text-cream md:text-7xl">{active ? "Timer running." : "Start clean."}</h1>
        <p className="mt-5 max-w-2xl text-sm leading-6 text-white/75">Capture work while it is happening, then review it in the timesheet before billing.</p>
      </div>
      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <div className="grid gap-4 rounded-md border border-border bg-white/65 p-5">
          <textarea className="min-h-36 rounded-md border border-border bg-white p-3 text-ink outline-none ring-primary/25 focus:ring-2" value={description} onChange={(event) => setDescription(event.target.value)} placeholder="What are you working on?" />
          <select className="h-11 rounded-md border border-border bg-white px-3 text-ink outline-none ring-primary/25 focus:ring-2" value={projectId} onChange={(event) => setProjectId(event.target.value)}>
            <option value="">No project</option>
            {projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
          </select>
          {active ? (
            <Button onClick={stop} className="h-11 justify-between bg-[#2f4135]">
              Stop timer <Square className="h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={start} className="h-11 justify-between">
              Start timer <Play className="h-4 w-4" />
            </Button>
          )}
        </div>
        <aside className="rounded-md border border-border bg-secondary p-5 text-ink">
          <p className="text-sm font-semibold text-primary">Current entry</p>
          <p className="mt-5 text-3xl font-semibold">{active ? "In progress" : "Idle"}</p>
          <p className="mt-3 text-sm leading-6 text-[#35483b]">{active?.description || "Add context before you start so the timesheet is easier to review later."}</p>
          <Link href="/timesheet" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-primary">
            Review timesheet <ArrowRight className="h-4 w-4" />
          </Link>
        </aside>
      </div>
    </section>
  );
}
