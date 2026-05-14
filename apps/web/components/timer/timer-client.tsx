"use client";

import { useState } from "react";
import { Play, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

type Project = { id: string; name: string };
type Running = { id: string; description: string | null; started_at: string } | null;

export function TimerClient({ orgId, projects, running }: { orgId: string; projects: Project[]; running: Running }) {
  const supabase = createClient();
  const [description, setDescription] = useState(running?.description ?? "");
  const [projectId, setProjectId] = useState("");
  const [active, setActive] = useState(running);

  async function start() {
    const { data: membershipId } = await supabase.rpc("my_membership_id", { org_id: orgId });
    const { data, error } = await supabase.from("time_entries").insert({
      organization_id: orgId,
      membership_id: membershipId,
      project_id: projectId || null,
      description,
      started_at: new Date().toISOString(),
      source: "timer"
    } as never).select("id,description,started_at").single();
    if (!error) setActive(data as Running);
  }

  async function stop() {
    if (!active) return;
    await supabase.from("time_entries").update({ ended_at: new Date().toISOString() } as never).eq("id", active.id);
    setActive(null);
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
