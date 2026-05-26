"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { addDays, format, isSameDay } from "date-fns";
import { Bell, CalendarClock, Check, ClipboardList, FileText, MessageSquareText, Plus, Send, ShieldAlert, UsersRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/app/page-shell";

type Overview = Awaited<ReturnType<typeof import("@/src/db/queries/mission-command").getMissionCommandOverview>>;

const tabs = [
  { id: "schedule", label: "Schedule", icon: CalendarClock },
  { id: "chat", label: "Chat", icon: MessageSquareText },
  { id: "tasks", label: "Tasks", icon: ClipboardList },
  { id: "announcements", label: "Announcements", icon: Bell },
  { id: "forms", label: "Forms", icon: FileText }
] as const;

function inputDateTime(date: Date) {
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

export function ShiftsClient({ overview }: { orgId: string; overview: Overview }) {
  const router = useRouter();
  const [tab, setTab] = useState<(typeof tabs)[number]["id"]>("schedule");
  const [selectedChannelId, setSelectedChannelId] = useState(overview.channels[0]?.id ?? "");
  const [pending, setPending] = useState(false);
  const weekDays = useMemo(() => overview.days.map((day) => new Date(day)), [overview.days]);
  const selectedChannel = overview.channels.find((channel) => channel.id === selectedChannelId) ?? overview.channels[0];
  const channelMessages = overview.messages.filter((message) => message.channelId === selectedChannel?.id).reverse();

  async function post(path: string, payload: object) {
    setPending(true);
    await fetch(path, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
    setPending(false);
    router.refresh();
  }

  async function createShift(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await post("/api/mission/shifts", {
      membershipId: String(form.get("membershipId") ?? ""),
      startsAt: String(form.get("startsAt") ?? ""),
      endsAt: String(form.get("endsAt") ?? ""),
      roleName: String(form.get("roleName") ?? ""),
      notes: String(form.get("notes") ?? ""),
      publish: form.get("publish") === "on"
    });
    event.currentTarget.reset();
  }

  async function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await post("/api/mission/messages", { channelId: selectedChannel?.id, body: String(form.get("body") ?? "") });
    event.currentTarget.reset();
  }

  async function createTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await post("/api/mission/tasks", {
      title: String(form.get("title") ?? ""),
      assigneeMembershipId: String(form.get("assigneeMembershipId") ?? ""),
      dueAt: String(form.get("dueAt") ?? ""),
      priority: String(form.get("priority") ?? "normal")
    });
    event.currentTarget.reset();
  }

  async function createAnnouncement(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await post("/api/mission/announcements", {
      title: String(form.get("title") ?? ""),
      body: String(form.get("body") ?? ""),
      requireAcknowledgment: form.get("requireAcknowledgment") === "on"
    });
    event.currentTarget.reset();
  }

  return (
    <section className="space-y-5 pb-20 md:pb-0">
      <PageHeader eyebrow="Mission Command" title="Operations" description="Schedule the work, coordinate the team, assign tasks, send announcements, and keep Timekeeping in sync." />

      <div className="grid gap-3 md:grid-cols-5">
        <Stat label="Published shifts" value={overview.stats.publishedShifts} />
        <Stat label="Open shifts" value={overview.stats.openShifts} warn={overview.stats.openShifts > 0} />
        <Stat label="Due tasks" value={overview.stats.dueTasks} />
        <Stat label="Overdue tasks" value={overview.stats.overdueTasks} warn={overview.stats.overdueTasks > 0} />
        <Stat label="Needs ack" value={overview.stats.unreadAnnouncements} />
      </div>

      <nav className="hidden gap-2 rounded-md border border-border bg-white/65 p-2 md:flex">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setTab(id)} className={`inline-flex h-11 items-center gap-2 rounded-md px-3 text-sm font-semibold ${tab === id ? "bg-primary text-white" : "text-muted-foreground hover:bg-secondary/70 hover:text-ink"}`}>
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </nav>

      {tab === "schedule" ? (
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
          <section className="overflow-hidden rounded-md border border-border bg-white/65">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-4">
              <div>
                <h2 className="font-semibold">Week of {format(new Date(overview.weekStart), "MMM d, yyyy")}</h2>
                <p className="mt-1 text-sm text-muted-foreground">Published shifts create expected punches; approved PTO blocks scheduling.</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="h-10">Week</Button>
                <Button variant="outline" className="h-10">Filters</Button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <div className="min-w-[980px]">
                <div className="grid grid-cols-[170px_repeat(7,1fr)] border-b border-border bg-cream/60 text-sm font-semibold">
                  <div className="p-3">Team</div>
                  {weekDays.map((day) => <div key={day.toISOString()} className="border-l border-border p-3">{format(day, "EEE d")}</div>)}
                </div>
                {overview.members.map((member) => (
                  <div key={member.id} className="grid min-h-28 grid-cols-[170px_repeat(7,1fr)] border-b border-border">
                    <div className="p-3">
                      <p className="font-semibold">{member.name || member.email}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{member.department || member.role}</p>
                    </div>
                    {weekDays.map((day) => {
                      const shifts = overview.shifts.filter((shift) => shift.membershipId === member.id && isSameDay(new Date(shift.startsAt), day));
                      const pto = overview.ptoBlocks.some((block) => block.membershipId === member.id && new Date(block.startsAt) <= day && new Date(block.endsAt) >= day);
                      return (
                        <div key={day.toISOString()} className={`border-l border-border p-2 ${pto ? "bg-amber-50" : ""}`}>
                          {pto ? <p className="mb-2 rounded-sm bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-800">PTO</p> : null}
                          {shifts.map((shift) => <ShiftBlock key={shift.id} shift={shift} />)}
                        </div>
                      );
                    })}
                  </div>
                ))}
                <div className="grid min-h-24 grid-cols-[170px_repeat(7,1fr)] bg-white">
                  <div className="p-3 font-semibold text-muted-foreground">Open shifts</div>
                  {weekDays.map((day) => (
                    <div key={day.toISOString()} className="border-l border-border p-2">
                      {overview.shifts.filter((shift) => !shift.membershipId && isSameDay(new Date(shift.startsAt), day)).map((shift) => <ShiftBlock key={shift.id} shift={shift} open />)}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 border-t border-border p-4 text-sm">
              {weekDays.map((day) => {
                const count = overview.shifts.filter((shift) => shift.status === "published" && isSameDay(new Date(shift.startsAt), day)).length;
                return <span key={day.toISOString()} className={`rounded-sm px-2 py-1 font-semibold ${count >= 2 ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"}`}>{format(day, "EEE")}: {count} {count >= 2 ? "ok" : "thin"}</span>;
              })}
            </div>
          </section>

          <form onSubmit={createShift} className="rounded-md border border-border bg-white/65 p-5">
            <h2 className="font-semibold">New Shift</h2>
            <div className="mt-4 grid gap-3">
              <label className="grid gap-2 text-sm font-medium text-muted-foreground">Employee<select name="membershipId" className="h-11 rounded-md border border-border bg-white px-3 text-ink"><option value="">Open shift</option>{overview.members.map((member) => <option key={member.id} value={member.id}>{member.name || member.email}</option>)}</select></label>
              <label className="grid gap-2 text-sm font-medium text-muted-foreground">Start<input name="startsAt" type="datetime-local" defaultValue={inputDateTime(addDays(new Date(overview.weekStart), 1))} className="h-11 rounded-md border border-border bg-white px-3 text-ink" /></label>
              <label className="grid gap-2 text-sm font-medium text-muted-foreground">End<input name="endsAt" type="datetime-local" defaultValue={inputDateTime(addDays(new Date(overview.weekStart), 1).setHours ? new Date(addDays(new Date(overview.weekStart), 1).setHours(17, 0, 0, 0)) : new Date())} className="h-11 rounded-md border border-border bg-white px-3 text-ink" /></label>
              <label className="grid gap-2 text-sm font-medium text-muted-foreground">Role<input name="roleName" className="h-11 rounded-md border border-border bg-white px-3 text-ink" placeholder="Cashier" /></label>
              <label className="grid gap-2 text-sm font-medium text-muted-foreground">Notes<textarea name="notes" className="min-h-20 rounded-md border border-border bg-white px-3 py-2 text-ink" /></label>
              <label className="flex items-center gap-2 text-sm text-muted-foreground"><input name="publish" type="checkbox" /> Save and publish</label>
            </div>
            <Button disabled={pending} className="mt-5 h-11 w-full"><Plus className="h-4 w-4" /> Create Shift</Button>
          </form>
        </div>
      ) : null}

      {tab === "chat" ? (
        <div className="grid gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="rounded-md border border-border bg-white/65 p-4">
            <h2 className="font-semibold">Channels</h2>
            <div className="mt-4 grid gap-2">
              {overview.channels.map((channel) => (
                <button key={channel.id} onClick={() => setSelectedChannelId(channel.id)} className={`rounded-md px-3 py-2 text-left text-sm font-semibold ${selectedChannel?.id === channel.id ? "bg-primary text-white" : "bg-cream text-muted-foreground"}`}>
                  #{channel.name}
                  <span className="ml-2 text-xs opacity-70">{channel.type}</span>
                </button>
              ))}
            </div>
            <div className="mt-5 rounded-md bg-secondary/70 p-3 text-sm text-primary">SMS bridge ready: app messages can route through a Twilio provider layer when configured.</div>
          </aside>
          <section className="rounded-md border border-border bg-white/65">
            <div className="border-b border-border p-4">
              <h2 className="font-semibold">#{selectedChannel?.name ?? "general"}</h2>
              <p className="mt-1 text-sm text-muted-foreground">Contextual team communication, shift cards, and system updates collect here.</p>
            </div>
            <div className="min-h-[360px] space-y-3 p-4">
              {channelMessages.map((message) => (
                <div key={message.id} className="rounded-md bg-white p-3 text-sm">
                  <p className="font-semibold">{message.senderName || message.senderEmail || "System"} <span className="text-xs font-normal text-muted-foreground">{format(new Date(message.sentAt), "h:mm a")}</span></p>
                  <p className="mt-1 text-muted-foreground">{message.body}</p>
                </div>
              ))}
              {!channelMessages.length ? <p className="text-sm text-muted-foreground">No messages yet. Post a shift need, coverage update, or team note.</p> : null}
            </div>
            <form onSubmit={sendMessage} className="flex gap-2 border-t border-border p-4">
              <input name="body" className="h-11 flex-1 rounded-md border border-border bg-white px-3 text-sm" placeholder="Type a message..." />
              <Button disabled={pending || !selectedChannel} className="h-11"><Send className="h-4 w-4" /></Button>
            </form>
          </section>
        </div>
      ) : null}

      {tab === "tasks" ? (
        <div className="grid gap-5 lg:grid-cols-[360px_minmax(0,1fr)]">
          <form onSubmit={createTask} className="rounded-md border border-border bg-white/65 p-5">
            <h2 className="font-semibold">New Task</h2>
            <div className="mt-4 grid gap-3">
              <label className="grid gap-2 text-sm font-medium text-muted-foreground">Title<input name="title" className="h-11 rounded-md border border-border bg-white px-3 text-ink" placeholder="Restock cooler before close" /></label>
              <label className="grid gap-2 text-sm font-medium text-muted-foreground">Assignee<select name="assigneeMembershipId" className="h-11 rounded-md border border-border bg-white px-3 text-ink"><option value="">Whoever owns the shift/site</option>{overview.members.map((member) => <option key={member.id} value={member.id}>{member.name || member.email}</option>)}</select></label>
              <label className="grid gap-2 text-sm font-medium text-muted-foreground">Due<input name="dueAt" type="datetime-local" className="h-11 rounded-md border border-border bg-white px-3 text-ink" /></label>
              <label className="grid gap-2 text-sm font-medium text-muted-foreground">Priority<select name="priority" className="h-11 rounded-md border border-border bg-white px-3 text-ink"><option>normal</option><option>low</option><option>high</option><option>urgent</option></select></label>
            </div>
            <Button disabled={pending} className="mt-5 h-11 w-full">Create Task</Button>
          </form>
          <TaskList tasks={overview.tasks} onComplete={(id) => post(`/api/mission/tasks/${id}/complete`, {})} />
        </div>
      ) : null}

      {tab === "announcements" ? (
        <div className="grid gap-5 lg:grid-cols-[360px_minmax(0,1fr)]">
          <form onSubmit={createAnnouncement} className="rounded-md border border-border bg-white/65 p-5">
            <h2 className="font-semibold">New Announcement</h2>
            <div className="mt-4 grid gap-3">
              <label className="grid gap-2 text-sm font-medium text-muted-foreground">Title<input name="title" className="h-11 rounded-md border border-border bg-white px-3 text-ink" placeholder="New break room procedures" /></label>
              <label className="grid gap-2 text-sm font-medium text-muted-foreground">Body<textarea name="body" className="min-h-32 rounded-md border border-border bg-white px-3 py-2 text-ink" /></label>
              <label className="flex items-center gap-2 text-sm text-muted-foreground"><input name="requireAcknowledgment" type="checkbox" /> Require acknowledgment</label>
            </div>
            <Button disabled={pending} className="mt-5 h-11 w-full">Send Announcement</Button>
          </form>
          <section className="rounded-md border border-border bg-white/65 p-5">
            <h2 className="font-semibold">Announcements</h2>
            <div className="mt-4 grid gap-3">
              {overview.announcements.map((announcement) => (
                <div key={announcement.id} className="rounded-md border border-border bg-white p-4 text-sm">
                  <p className="font-semibold">{announcement.title}</p>
                  <p className="mt-2 text-muted-foreground">{announcement.body}</p>
                  <p className="mt-3 text-xs font-semibold text-primary">{announcement.requireAcknowledgment ? "Acknowledgment required" : "FYI"} · {announcement.status}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      ) : null}

      {tab === "forms" ? (
        <section className="rounded-md border border-border bg-white/65 p-5">
          <div className="flex items-start gap-3">
            <ShieldAlert className="h-6 w-6 text-primary" />
            <div>
              <h2 className="font-semibold">Forms & Checklists</h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">The data model is ready for incident reports, shift handoff forms, equipment inspections, and locked submissions. The builder UI is the next layer: field schema, routing rules, signatures, and PDF export.</p>
            </div>
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            {["Incident Report", "Shift Handoff", "Closing Checklist"].map((name) => <div key={name} className="rounded-md border border-border bg-white p-4 text-sm font-semibold">{name}<p className="mt-2 text-sm font-normal text-muted-foreground">Template-ready</p></div>)}
          </div>
        </section>
      ) : null}

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-white/95 px-2 pb-[max(env(safe-area-inset-bottom),0.75rem)] pt-2 shadow-[0_-12px_30px_rgba(24,29,25,0.08)] backdrop-blur md:hidden">
        <div className="mx-auto grid max-w-md grid-cols-5 gap-1">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setTab(id)} className={`grid min-h-14 place-items-center rounded-md px-1 text-[10px] font-semibold ${tab === id ? "bg-primary text-white" : "text-muted-foreground"}`}>
              <Icon className="mb-1 h-5 w-5" />
              {label.split(" ")[0]}
            </button>
          ))}
        </div>
      </nav>
    </section>
  );
}

function ShiftBlock({ shift, open = false }: { shift: Overview["shifts"][number]; open?: boolean }) {
  return (
    <div className={`mb-2 rounded-md border p-2 text-xs ${open ? "border-dashed border-amber-300 bg-amber-50 text-amber-800" : shift.status === "draft" ? "border-border bg-cream text-muted-foreground" : "border-primary/20 bg-secondary/70 text-primary"}`}>
      <p className="font-semibold">{open ? "OPEN" : shift.roleName || "Shift"}</p>
      <p className="mt-1">{format(new Date(shift.startsAt), "h:mm a")} - {format(new Date(shift.endsAt), "h:mm a")}</p>
      <p className="mt-1 uppercase">{shift.status} · {shift.expectedPunchStatus}</p>
    </div>
  );
}

function Stat({ label, value, warn = false }: { label: string; value: number; warn?: boolean }) {
  return (
    <div className={`rounded-md border p-4 ${warn ? "border-amber-200 bg-amber-50 text-amber-800" : "border-border bg-white/65"}`}>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-2 text-3xl font-semibold">{value}</p>
    </div>
  );
}

function TaskList({ tasks, onComplete }: { tasks: Overview["tasks"]; onComplete: (id: string) => void }) {
  return (
    <section className="rounded-md border border-border bg-white/65 p-5">
      <h2 className="font-semibold">Tasks Overview</h2>
      <div className="mt-4 grid gap-3">
        {tasks.map((task) => (
          <div key={task.id} className={`rounded-md border border-border bg-white p-4 text-sm ${task.completedAt ? "opacity-60" : ""}`}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-semibold">{task.title}</p>
                <p className="mt-1 text-muted-foreground">{task.assigneeName || task.assigneeEmail || "Rule-based assignee"} · {task.dueAt ? format(new Date(task.dueAt), "MMM d, h:mm a") : "No due date"}</p>
              </div>
              <span className={`rounded-sm px-2 py-1 text-xs font-semibold ${task.priority === "urgent" || task.priority === "high" ? "bg-red-50 text-red-700" : "bg-cream text-primary"}`}>{task.priority}</span>
            </div>
            {!task.completedAt ? <Button onClick={() => onComplete(task.id)} variant="outline" className="mt-3 h-9"><Check className="h-4 w-4" /> Mark complete</Button> : <p className="mt-3 text-xs font-semibold text-primary">Completed</p>}
          </div>
        ))}
        {!tasks.length ? <p className="text-sm text-muted-foreground">Tasks appear here as managers assign them to people, shifts, sites, or roles.</p> : null}
      </div>
    </section>
  );
}
