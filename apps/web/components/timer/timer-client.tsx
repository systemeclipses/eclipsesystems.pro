"use client";

import { useState } from "react";
import { Play, Square } from "lucide-react";
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
    <section>
      <h1 className="text-2xl font-semibold">Timer</h1>
      <div className="mt-6 grid gap-4 rounded-lg border border-border p-5">
        <textarea className="min-h-24 rounded-md border border-border p-3" value={description} onChange={(event) => setDescription(event.target.value)} placeholder="What are you working on?" />
        <select className="h-10 rounded-md border border-border px-3" value={projectId} onChange={(event) => setProjectId(event.target.value)}>
          <option value="">No project</option>
          {projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
        </select>
        {active ? <Button onClick={stop}><Square className="h-4 w-4" /> Stop</Button> : <Button onClick={start}><Play className="h-4 w-4" /> Start</Button>}
      </div>
    </section>
  );
}
