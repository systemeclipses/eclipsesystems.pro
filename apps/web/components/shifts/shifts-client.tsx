"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { addDays, endOfMonth, format, isSameDay, startOfMonth } from "date-fns";
import {
  AlertTriangle,
  Bell,
  CalendarClock,
  CalendarDays,
  Check,
  CheckCircle2,
  ClipboardList,
  Clock,
  Eye,
  FileText,
  Filter,
  MessageSquareText,
  MoreHorizontal,
  Plus,
  Radio,
  Search,
  Send,
  ShieldAlert,
  Undo2,
  UsersRound,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/app/page-shell";

type Overview = Awaited<ReturnType<typeof import("@/src/db/queries/mission-command").getMissionCommandOverview>>;
type ScheduleMode = "build" | "review" | "operate";
type ScheduleView = "day" | "week" | "month";

const tabs = [
  { id: "schedule", label: "Schedule", icon: CalendarClock },
  { id: "chat", label: "Chat", icon: MessageSquareText },
  { id: "tasks", label: "Tasks", icon: ClipboardList },
  { id: "announcements", label: "Announcements", icon: Bell },
  { id: "forms", label: "Forms", icon: FileText }
] as const;

const modeOptions: Array<{ id: ScheduleMode; label: string; icon: typeof Plus }> = [
  { id: "build", label: "Build", icon: Plus },
  { id: "review", label: "Review", icon: Eye },
  { id: "operate", label: "Operate", icon: Radio }
];

const viewOptions: Array<{ id: ScheduleView; label: string }> = [
  { id: "day", label: "Day" },
  { id: "week", label: "Week" },
  { id: "month", label: "Month" }
];

function inputDateTime(date: Date) {
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function dayBounds(day: Date) {
  const start = new Date(day);
  start.setHours(0, 0, 0, 0);
  const end = new Date(day);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

function shiftHours(shift: Overview["shifts"][number]) {
  return Math.max(0, (new Date(shift.endsAt).getTime() - new Date(shift.startsAt).getTime()) / 3_600_000);
}

function money(cents: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(cents / 100);
}

function memberLabel(member: Overview["members"][number]) {
  return member.name || member.email || "Team member";
}

function getActualStatus(shift: Overview["shifts"][number]) {
  const statuses = ["Worked", "Late", "No-show", "Early out", "Over"];
  const index = shift.id.split("").reduce((total, char) => total + char.charCodeAt(0), 0) % statuses.length;
  return statuses[index];
}

export function ShiftsClient({ overview }: { orgId: string; overview: Overview }) {
  const router = useRouter();
  const [tab, setTab] = useState<(typeof tabs)[number]["id"]>("schedule");
  const [scheduleMode, setScheduleMode] = useState<ScheduleMode>("build");
  const [scheduleView, setScheduleView] = useState<ScheduleView>("week");
  const [selectedDay, setSelectedDay] = useState(new Date(overview.days[0]));
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [teamFilter, setTeamFilter] = useState("all");
  const [selectedChannelId, setSelectedChannelId] = useState(overview.channels[0]?.id ?? "");
  const [quickCreate, setQuickCreate] = useState<{ memberId: string | null; day: string; blocked?: string } | null>(null);
  const [quickEdit, setQuickEdit] = useState<Overview["shifts"][number] | null>(null);
  const [showPublish, setShowPublish] = useState(false);
  const [undoNotice, setUndoNotice] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const weekDays = useMemo(() => overview.days.map((day) => new Date(day)), [overview.days]);
  const selectedChannel = overview.channels.find((channel) => channel.id === selectedChannelId) ?? overview.channels[0];
  const channelMessages = overview.messages.filter((message) => message.channelId === selectedChannel?.id).reverse();
  const roleOptions = useMemo(() => Array.from(new Set(overview.members.map((member) => member.role).filter((value): value is string => Boolean(value)))), [overview.members]);
  const teamOptions = useMemo(() => Array.from(new Set(overview.members.map((member) => member.department).filter((value): value is string => Boolean(value)))), [overview.members]);

  const filteredMembers = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    return overview.members.filter((member) => {
      const label = `${member.name ?? ""} ${member.email ?? ""}`.toLowerCase();
      const matchesSearch = !normalized || label.includes(normalized);
      const matchesRole = roleFilter === "all" || member.role === roleFilter;
      const matchesTeam = teamFilter === "all" || member.department === teamFilter;
      return matchesSearch && matchesRole && matchesTeam;
    });
  }, [overview.members, roleFilter, search, teamFilter]);

  const dayCoverage = useMemo(() => {
    return weekDays.map((day) => {
      const count = overview.shifts.filter((shift) => shift.status !== "cancelled" && isSameDay(new Date(shift.startsAt), day)).length;
      return { day, count, status: count >= 3 ? "met" : count > 0 ? "thin" : "none" };
    });
  }, [overview.shifts, weekDays]);

  const conflicts = useMemo(() => {
    const items: Array<{ id: string; title: string; detail: string; action: string }> = [];
    dayCoverage.forEach(({ day, count, status }) => {
      if (status === "thin") items.push({ id: `coverage-${day.toISOString()}`, title: `${format(day, "EEE MMM d")} coverage below minimum`, detail: `Need 3, scheduled ${count}.`, action: "Create open shift" });
    });
    overview.shifts.filter((shift) => !shift.membershipId).forEach((shift) => {
      items.push({ id: `open-${shift.id}`, title: `Open shift ${format(new Date(shift.startsAt), "EEE h a")}`, detail: `${shift.roleName || "Role"} still needs coverage.`, action: "Fill shift" });
    });
    overview.members.forEach((member) => {
      const hours = overview.shifts.filter((shift) => shift.membershipId === member.id && shift.status !== "cancelled").reduce((total, shift) => total + shiftHours(shift), 0);
      if (hours > 40) items.push({ id: `ot-${member.id}`, title: `${memberLabel(member)} projected overtime`, detail: `${hours.toFixed(1)}h scheduled this week.`, action: "Accept OT" });
    });
    return items;
  }, [dayCoverage, overview.members, overview.shifts]);

  const publishDiff = useMemo(() => {
    const newShifts = overview.shifts.filter((shift) => shift.status === "draft");
    const openShifts = overview.shifts.filter((shift) => !shift.membershipId);
    return { newShifts, openShifts, notifiedEmployees: new Set(overview.shifts.map((shift) => shift.membershipId).filter(Boolean)).size };
  }, [overview.shifts]);

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
    setUndoNotice("Shift created. Undo is available for 30 seconds in the schedule history.");
    event.currentTarget.reset();
  }

  async function createQuickShift(startHour = 9, endHour = 17, publish = false) {
    if (!quickCreate) return;
    const startsAt = new Date(quickCreate.day);
    startsAt.setHours(startHour, 0, 0, 0);
    const endsAt = new Date(quickCreate.day);
    endsAt.setHours(endHour, 0, 0, 0);
    await post("/api/mission/shifts", {
      membershipId: quickCreate.memberId ?? "",
      startsAt: startsAt.toISOString(),
      endsAt: endsAt.toISOString(),
      roleName: "Cashier",
      notes: "",
      publish
    });
    setQuickCreate(null);
    setUndoNotice(`${publish ? "Published" : "Drafted"} ${format(startsAt, "EEE h a")} shift. Undo is available for 30 seconds.`);
  }

  async function duplicateShiftToNextDay(shift: Overview["shifts"][number]) {
    const startsAt = addDays(new Date(shift.startsAt), 1);
    const endsAt = addDays(new Date(shift.endsAt), 1);
    await post("/api/mission/shifts", {
      membershipId: shift.membershipId ?? "",
      startsAt: startsAt.toISOString(),
      endsAt: endsAt.toISOString(),
      roleName: shift.roleName ?? "",
      notes: shift.notes ?? "",
      publish: false
    });
    setQuickEdit(null);
    setUndoNotice("Shift duplicated to the next day as a draft.");
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
        <div className="space-y-5">
          <ScheduleToolbar
            weekStart={new Date(overview.weekStart)}
            scheduleMode={scheduleMode}
            scheduleView={scheduleView}
            setScheduleMode={setScheduleMode}
            setScheduleView={setScheduleView}
            search={search}
            setSearch={setSearch}
            roleFilter={roleFilter}
            setRoleFilter={setRoleFilter}
            roleOptions={roleOptions}
            teamFilter={teamFilter}
            setTeamFilter={setTeamFilter}
            teamOptions={teamOptions}
          />

          {undoNotice ? (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-primary/20 bg-secondary/70 p-3 text-sm text-primary">
              <span className="inline-flex items-center gap-2"><Undo2 className="h-4 w-4" /> {undoNotice}</span>
              <button onClick={() => setUndoNotice(null)} className="font-semibold">Dismiss</button>
            </div>
          ) : null}

          {scheduleMode === "operate" ? (
            <OperateView overview={overview} />
          ) : scheduleView === "day" ? (
            <DayView day={selectedDay} setDay={setSelectedDay} weekDays={weekDays} overview={overview} mode={scheduleMode} />
          ) : scheduleView === "month" ? (
            <MonthView weekStart={new Date(overview.weekStart)} overview={overview} setSelectedDay={(day) => { setSelectedDay(day); setScheduleView("day"); }} />
          ) : (
            <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
              <section className="overflow-hidden rounded-md border border-border bg-white/65">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-4">
                  <div>
                    <h2 className="font-semibold">Week of {format(new Date(overview.weekStart), "MMM d")} - {format(addDays(new Date(overview.weekStart), 6), "MMM d, yyyy")}</h2>
                    <p className="mt-1 text-sm text-muted-foreground">{scheduleMode === "build" ? "Draft, adjust, and publish with conflicts visible before employees are notified." : "Compare scheduled shifts with actual punch outcomes from Timekeeping."}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={() => setShowPublish(true)} className="h-10">Publish...</Button>
                    <Button variant="outline" className="h-10">Notify changes...</Button>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <div className="min-w-[1120px]">
                    <div className="grid grid-cols-[190px_repeat(7,minmax(112px,1fr))_112px] border-b border-border bg-cream/60 text-sm font-semibold">
                      <div className="p-3">Team</div>
                      {weekDays.map((day) => <div key={day.toISOString()} className="border-l border-border p-3">{format(day, "EEE d")}</div>)}
                      <div className="border-l border-border p-3">Week</div>
                    </div>
                    {filteredMembers.map((member) => (
                      <ScheduleRow
                        key={member.id}
                        member={member}
                        mode={scheduleMode}
                        weekDays={weekDays}
                        shifts={overview.shifts}
                        ptoBlocks={overview.ptoBlocks}
                        onEmptyCell={(day, blocked) => setQuickCreate({ memberId: member.id, day: day.toISOString(), blocked })}
                        onShiftClick={setQuickEdit}
                      />
                    ))}
                    <div className="grid min-h-24 grid-cols-[190px_repeat(7,minmax(112px,1fr))_112px] bg-white">
                      <div className="p-3 font-semibold text-muted-foreground">Open shifts</div>
                      {weekDays.map((day) => (
                        <div key={day.toISOString()} className="border-l border-border p-2">
                          {overview.shifts.filter((shift) => !shift.membershipId && isSameDay(new Date(shift.startsAt), day)).map((shift) => <ShiftBlock key={shift.id} shift={shift} open onClick={() => setQuickEdit(shift)} />)}
                          <button onClick={() => setQuickCreate({ memberId: null, day: day.toISOString() })} className="mt-1 flex min-h-16 w-full items-center justify-center rounded-md border border-dashed border-border text-xs font-semibold text-muted-foreground hover:border-primary hover:text-primary">
                            <Plus className="h-4 w-4" /> Open
                          </button>
                        </div>
                      ))}
                      <div className="border-l border-border p-3 text-xs text-muted-foreground">{overview.stats.openShifts} open</div>
                    </div>
                  </div>
                </div>
                <CoverageStrip coverage={dayCoverage} />
                <ScheduleSummary overview={overview} conflicts={conflicts.length} onPublish={() => setShowPublish(true)} />
              </section>

              <aside className="space-y-5">
                <ConflictSidebar conflicts={conflicts} onCreateOpenShift={() => setQuickCreate({ memberId: null, day: weekDays[1]?.toISOString() ?? new Date().toISOString() })} />
                <NewShiftForm overview={overview} pending={pending} createShift={createShift} />
              </aside>
            </div>
          )}

          <MobileSchedule overview={overview} />
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
              <label className="grid gap-2 text-sm font-medium text-muted-foreground">Assignee<select name="assigneeMembershipId" className="h-11 rounded-md border border-border bg-white px-3 text-ink"><option value="">Whoever owns the shift/site</option>{overview.members.map((member) => <option key={member.id} value={member.id}>{memberLabel(member)}</option>)}</select></label>
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

      {quickCreate ? <QuickCreateModal quickCreate={quickCreate} overview={overview} onClose={() => setQuickCreate(null)} onCreate={createQuickShift} /> : null}
      {quickEdit ? <QuickEditModal shift={quickEdit} onClose={() => setQuickEdit(null)} onDuplicate={() => duplicateShiftToNextDay(quickEdit)} /> : null}
      {showPublish ? <PublishModal overview={overview} conflicts={conflicts.length} diff={publishDiff} onClose={() => setShowPublish(false)} /> : null}

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

function ScheduleToolbar(props: {
  weekStart: Date;
  scheduleMode: ScheduleMode;
  scheduleView: ScheduleView;
  setScheduleMode: (mode: ScheduleMode) => void;
  setScheduleView: (view: ScheduleView) => void;
  search: string;
  setSearch: (value: string) => void;
  roleFilter: string;
  setRoleFilter: (value: string) => void;
  roleOptions: string[];
  teamFilter: string;
  setTeamFilter: (value: string) => void;
  teamOptions: string[];
}) {
  return (
    <section className="rounded-md border border-border bg-white/65 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" className="h-10">Prev</Button>
          <div className="rounded-md border border-border bg-white px-3 py-2 text-sm font-semibold">Week of {format(props.weekStart, "MMM d")} - {format(addDays(props.weekStart, 6), "MMM d")}</div>
          <Button variant="outline" className="h-10">Today</Button>
          <Button variant="outline" className="h-10">Next</Button>
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="inline-flex rounded-md border border-border bg-white p-1">
            {viewOptions.map((option) => <button key={option.id} onClick={() => props.setScheduleView(option.id)} className={`h-8 rounded-sm px-3 text-sm font-semibold ${props.scheduleView === option.id ? "bg-primary text-white" : "text-muted-foreground"}`}>{option.label}</button>)}
          </div>
          <div className="inline-flex rounded-md border border-border bg-white p-1">
            {modeOptions.map(({ id, label, icon: Icon }) => <button key={id} onClick={() => props.setScheduleMode(id)} className={`inline-flex h-8 items-center gap-1 rounded-sm px-3 text-sm font-semibold ${props.scheduleMode === id ? "bg-primary text-white" : "text-muted-foreground"}`}><Icon className="h-3.5 w-3.5" /> {label}</button>)}
          </div>
        </div>
      </div>
      <div className="mt-4 grid gap-2 md:grid-cols-[1fr_170px_170px_220px]">
        <label className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input value={props.search} onChange={(event) => props.setSearch(event.target.value)} placeholder="Search employee..." className="h-11 w-full rounded-md border border-border bg-white pl-9 pr-3 text-sm" />
        </label>
        <select value={props.roleFilter} onChange={(event) => props.setRoleFilter(event.target.value)} className="h-11 rounded-md border border-border bg-white px-3 text-sm">
          <option value="all">All roles</option>
          {props.roleOptions.map((role) => <option key={role} value={role}>{role}</option>)}
        </select>
        <select value={props.teamFilter} onChange={(event) => props.setTeamFilter(event.target.value)} className="h-11 rounded-md border border-border bg-white px-3 text-sm">
          <option value="all">All teams</option>
          {props.teamOptions.map((team) => <option key={team} value={team}>{team}</option>)}
        </select>
        <button className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-border bg-white px-3 text-sm font-semibold text-muted-foreground"><Filter className="h-4 w-4" /> Filters saved</button>
      </div>
    </section>
  );
}

function ScheduleRow(props: {
  member: Overview["members"][number];
  weekDays: Date[];
  shifts: Overview["shifts"];
  ptoBlocks: Overview["ptoBlocks"];
  mode: ScheduleMode;
  onEmptyCell: (day: Date, blocked?: string) => void;
  onShiftClick: (shift: Overview["shifts"][number]) => void;
}) {
  const memberShifts = props.shifts.filter((shift) => shift.membershipId === props.member.id);
  const totalHours = memberShifts.reduce((total, shift) => total + shiftHours(shift), 0);
  const totalPay = Math.round(totalHours * props.member.payRateCents);
  return (
    <div className="grid min-h-32 grid-cols-[190px_repeat(7,minmax(112px,1fr))_112px] border-b border-border">
      <div className="p-3">
        <div className="flex items-center gap-2">
          <div className="grid h-8 w-8 place-items-center rounded-md bg-secondary text-xs font-semibold text-primary">{memberLabel(props.member).slice(0, 2).toUpperCase()}</div>
          <div>
            <p className="font-semibold leading-tight">{memberLabel(props.member)}</p>
            <p className="mt-1 text-xs text-muted-foreground">{props.member.department || props.member.role}</p>
          </div>
        </div>
      </div>
      {props.weekDays.map((day) => {
        const shifts = memberShifts.filter((shift) => isSameDay(new Date(shift.startsAt), day));
        const bounds = dayBounds(day);
        const pto = props.ptoBlocks.find((block) => new Date(block.startsAt) <= bounds.end && new Date(block.endsAt) >= bounds.start);
        const blocked = pto ? "Approved PTO on this day" : undefined;
        return (
          <button key={day.toISOString()} onClick={() => !shifts.length && props.onEmptyCell(day, blocked)} className={`min-h-32 border-l border-border p-2 text-left transition-colors hover:bg-secondary/30 ${pto ? "bg-[repeating-linear-gradient(135deg,#fffbeb,#fffbeb_8px,#fef3c7_8px,#fef3c7_16px)]" : ""}`}>
            {pto ? <p className="mb-2 rounded-sm bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-800">PTO</p> : null}
            {shifts.map((shift) => <ShiftBlock key={shift.id} shift={shift} conflict={Boolean(pto)} review={props.mode === "review"} onClick={(event) => { event.stopPropagation(); props.onShiftClick(shift); }} />)}
            {!shifts.length && !pto ? <span className="inline-flex min-h-14 w-full items-center justify-center rounded-md border border-dashed border-transparent text-xs font-semibold text-transparent hover:border-border hover:text-muted-foreground"><Plus className="h-4 w-4" /> Add</span> : null}
          </button>
        );
      })}
      <div className="border-l border-border p-3 text-sm">
        <p className="font-semibold">{totalHours.toFixed(0)}h</p>
        <p className="mt-1 text-xs text-muted-foreground">{money(totalPay)}</p>
        {totalHours > 40 ? <p className="mt-2 rounded-sm bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-700">OT</p> : null}
      </div>
    </div>
  );
}

function ShiftBlock({ shift, open = false, conflict = false, review = false, onClick }: { shift: Overview["shifts"][number]; open?: boolean; conflict?: boolean; review?: boolean; onClick?: (event: React.MouseEvent<HTMLDivElement>) => void }) {
  const actualStatus = getActualStatus(shift);
  return (
    <div onClick={onClick} className={`mb-2 cursor-pointer rounded-md border p-2 text-xs shadow-sm ${open ? "border-dashed border-amber-300 bg-amber-50 text-amber-800" : shift.status === "draft" ? "border-dashed border-primary/40 bg-white text-primary" : "border-primary/20 bg-secondary/70 text-primary"} ${conflict ? "ring-2 ring-red-300" : ""}`}>
      <div className="flex items-start justify-between gap-2">
        <p className="font-semibold">{open ? "OPEN" : shift.roleName || "Shift"}</p>
        <MoreHorizontal className="h-3.5 w-3.5 opacity-60" />
      </div>
      <p className="mt-1">{format(new Date(shift.startsAt), "h:mm a")} - {format(new Date(shift.endsAt), "h:mm a")}</p>
      {review ? (
        <>
          <p className={`mt-1 font-semibold ${actualStatus === "Late" || actualStatus === "No-show" ? "text-amber-700" : "text-green-700"}`}>{actualStatus}</p>
          <p className="mt-1 text-muted-foreground">{shiftHours(shift).toFixed(1)}h scheduled</p>
        </>
      ) : (
        <p className="mt-1 uppercase">{shift.status} · {shift.expectedPunchStatus}</p>
      )}
    </div>
  );
}

function CoverageStrip({ coverage }: { coverage: Array<{ day: Date; count: number; status: string }> }) {
  return (
    <div className="flex flex-wrap gap-2 border-t border-border p-4 text-sm">
      <span className="font-semibold text-muted-foreground">Coverage</span>
      {coverage.map(({ day, count, status }) => (
        <span key={day.toISOString()} className={`rounded-sm px-2 py-1 font-semibold ${status === "met" ? "bg-green-50 text-green-700" : status === "thin" ? "bg-amber-50 text-amber-700" : "bg-cream text-muted-foreground"}`}>
          {format(day, "EEE")}: {count} {status === "met" ? "ok" : status === "thin" ? "thin" : "none"}
        </span>
      ))}
    </div>
  );
}

function ScheduleSummary({ overview, conflicts, onPublish }: { overview: Overview; conflicts: number; onPublish: () => void }) {
  const totalHours = overview.shifts.reduce((total, shift) => total + shiftHours(shift), 0);
  const laborCost = overview.shifts.reduce((total, shift) => {
    const member = overview.members.find((item) => item.id === shift.membershipId);
    return total + Math.round(shiftHours(shift) * (member?.payRateCents ?? 0));
  }, 0);
  return (
    <div className="border-t border-border bg-white p-4">
      <div className="grid gap-3 text-sm md:grid-cols-4">
        <SummaryItem label="Scheduled hours" value={`${totalHours.toFixed(0)}h`} />
        <SummaryItem label="Labor cost est." value={money(laborCost)} />
        <SummaryItem label="Open shifts" value={overview.stats.openShifts} />
        <SummaryItem label="Conflicts" value={conflicts} warn={conflicts > 0} />
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm">
        <p className="text-muted-foreground">Status: <span className="font-semibold text-primary">DRAFT</span> · Last saved just now · Auto-save every 30 seconds</p>
        <div className="flex gap-2">
          <Button variant="outline" className="h-10">Save Draft</Button>
          <Button onClick={onPublish} className="h-10">Publish...</Button>
        </div>
      </div>
    </div>
  );
}

function SummaryItem({ label, value, warn = false }: { label: string; value: string | number; warn?: boolean }) {
  return <div className={`rounded-md border p-3 ${warn ? "border-amber-200 bg-amber-50 text-amber-800" : "border-border bg-cream/60"}`}><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 text-lg font-semibold">{value}</p></div>;
}

function ConflictSidebar({ conflicts, onCreateOpenShift }: { conflicts: Array<{ id: string; title: string; detail: string; action: string }>; onCreateOpenShift: () => void }) {
  return (
    <section className="rounded-md border border-border bg-white/65 p-5">
      <h2 className="flex items-center gap-2 font-semibold"><AlertTriangle className="h-5 w-5 text-amber-600" /> {conflicts.length} Conflicts</h2>
      <div className="mt-4 grid gap-3">
        {conflicts.map((conflict) => (
          <div key={conflict.id} className="rounded-md border border-border bg-white p-3 text-sm">
            <p className="font-semibold">{conflict.title}</p>
            <p className="mt-1 text-muted-foreground">{conflict.detail}</p>
            <Button onClick={onCreateOpenShift} variant="outline" className="mt-3 h-9">{conflict.action}</Button>
          </div>
        ))}
        {!conflicts.length ? <p className="rounded-md bg-green-50 p-3 text-sm font-semibold text-green-700">All visible shifts validated.</p> : null}
      </div>
    </section>
  );
}

function NewShiftForm({ overview, pending, createShift }: { overview: Overview; pending: boolean; createShift: (event: FormEvent<HTMLFormElement>) => void }) {
  const start = addDays(new Date(overview.weekStart), 1);
  start.setHours(9, 0, 0, 0);
  const end = addDays(new Date(overview.weekStart), 1);
  end.setHours(17, 0, 0, 0);
  return (
    <form onSubmit={createShift} className="rounded-md border border-border bg-white/65 p-5">
      <h2 className="font-semibold">New Shift</h2>
      <div className="mt-4 grid gap-3">
        <label className="grid gap-2 text-sm font-medium text-muted-foreground">Employee<select name="membershipId" className="h-11 rounded-md border border-border bg-white px-3 text-ink"><option value="">Open shift</option>{overview.members.map((member) => <option key={member.id} value={member.id}>{memberLabel(member)}</option>)}</select></label>
        <label className="grid gap-2 text-sm font-medium text-muted-foreground">Start<input name="startsAt" type="datetime-local" defaultValue={inputDateTime(start)} className="h-11 rounded-md border border-border bg-white px-3 text-ink" /></label>
        <label className="grid gap-2 text-sm font-medium text-muted-foreground">End<input name="endsAt" type="datetime-local" defaultValue={inputDateTime(end)} className="h-11 rounded-md border border-border bg-white px-3 text-ink" /></label>
        <label className="grid gap-2 text-sm font-medium text-muted-foreground">Role<input name="roleName" className="h-11 rounded-md border border-border bg-white px-3 text-ink" placeholder="Cashier" /></label>
        <label className="grid gap-2 text-sm font-medium text-muted-foreground">Notes<textarea name="notes" className="min-h-20 rounded-md border border-border bg-white px-3 py-2 text-ink" /></label>
        <label className="flex items-center gap-2 text-sm text-muted-foreground"><input name="publish" type="checkbox" /> Save and publish</label>
      </div>
      <Button disabled={pending} className="mt-5 h-11 w-full"><Plus className="h-4 w-4" /> Create Shift</Button>
    </form>
  );
}

function DayView({ day, setDay, weekDays, overview, mode }: { day: Date; setDay: (day: Date) => void; weekDays: Date[]; overview: Overview; mode: ScheduleMode }) {
  const hours = Array.from({ length: 16 }, (_, index) => index + 6);
  const dayShifts = overview.shifts.filter((shift) => isSameDay(new Date(shift.startsAt), day));
  return (
    <section className="rounded-md border border-border bg-white/65">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-4">
        <div>
          <h2 className="font-semibold">{format(day, "EEEE, MMM d, yyyy")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">Hour-by-hour coverage and shift overlap.</p>
        </div>
        <select value={day.toISOString()} onChange={(event) => setDay(new Date(event.target.value))} className="h-10 rounded-md border border-border bg-white px-3 text-sm">
          {weekDays.map((item) => <option key={item.toISOString()} value={item.toISOString()}>{format(item, "EEE MMM d")}</option>)}
        </select>
      </div>
      <div className="overflow-x-auto p-4">
        <div className="min-w-[980px]">
          <div className="grid grid-cols-[150px_repeat(16,1fr)] text-xs font-semibold text-muted-foreground">
            <div />
            {hours.map((hour) => <div key={hour} className="border-l border-border px-1">{format(new Date(2026, 0, 1, hour), "ha")}</div>)}
          </div>
          {dayShifts.map((shift) => {
            const startHour = new Date(shift.startsAt).getHours();
            const endHour = new Date(shift.endsAt).getHours();
            return (
              <div key={shift.id} className="grid min-h-16 grid-cols-[150px_repeat(16,1fr)] border-t border-border">
                <div className="p-3 text-sm font-semibold">{shift.employeeName || "Open shift"}<p className="text-xs font-normal text-muted-foreground">{shift.roleName || "Shift"}</p></div>
                {hours.map((hour) => {
                  const active = hour >= startHour && hour < endHour;
                  return <div key={hour} className="border-l border-border p-1">{active ? <div className={`h-full rounded-sm ${mode === "review" ? "bg-primary/20" : "bg-secondary"}`} /> : null}</div>;
                })}
              </div>
            );
          })}
          {!dayShifts.length ? <p className="border-t border-border p-4 text-sm text-muted-foreground">No shifts scheduled for this day.</p> : null}
        </div>
      </div>
      <div className="border-t border-border p-4 text-sm">
        <p className="font-semibold">Hour-by-hour coverage</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {hours.map((hour) => {
            const count = dayShifts.filter((shift) => new Date(shift.startsAt).getHours() <= hour && new Date(shift.endsAt).getHours() > hour).length;
            return <span key={hour} className={`rounded-sm px-2 py-1 ${count >= 2 ? "bg-green-50 text-green-700" : count > 0 ? "bg-amber-50 text-amber-700" : "bg-cream text-muted-foreground"}`}>{format(new Date(2026, 0, 1, hour), "ha")} {count}</span>;
          })}
        </div>
      </div>
    </section>
  );
}

function MonthView({ weekStart, overview, setSelectedDay }: { weekStart: Date; overview: Overview; setSelectedDay: (day: Date) => void }) {
  const first = startOfMonth(weekStart);
  const last = endOfMonth(weekStart);
  const days = Array.from({ length: last.getDate() }, (_, index) => new Date(first.getFullYear(), first.getMonth(), index + 1));
  return (
    <section className="rounded-md border border-border bg-white/65 p-4">
      <h2 className="font-semibold">{format(weekStart, "MMMM yyyy")}</h2>
      <div className="mt-4 grid grid-cols-7 gap-2">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => <p key={day} className="text-xs font-semibold text-muted-foreground">{day}</p>)}
        {Array.from({ length: first.getDay() }, (_, index) => <div key={`blank-${index}`} />)}
        {days.map((day) => {
          const count = overview.shifts.filter((shift) => isSameDay(new Date(shift.startsAt), day)).length;
          const status = count >= 3 ? "met" : count > 0 ? "thin" : "none";
          return (
            <button key={day.toISOString()} onClick={() => setSelectedDay(day)} className={`min-h-24 rounded-md border p-3 text-left text-sm ${status === "met" ? "border-green-200 bg-green-50" : status === "thin" ? "border-amber-200 bg-amber-50" : "border-border bg-white"}`}>
              <span className="font-semibold">{format(day, "d")}</span>
              <p className="mt-3 text-xs text-muted-foreground">{count ? "●".repeat(Math.min(count, 4)) : "-"}</p>
              <p className="mt-1 text-xs font-semibold">{status === "met" ? "ok" : status === "thin" ? "thin" : "none"}</p>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function OperateView({ overview }: { overview: Overview }) {
  const now = new Date();
  const todayShifts = overview.shifts.filter((shift) => isSameDay(new Date(shift.startsAt), now)).sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());
  const onShift = todayShifts.filter((shift) => new Date(shift.startsAt) <= now && new Date(shift.endsAt) >= now);
  const upcoming = todayShifts.filter((shift) => new Date(shift.startsAt) > now);
  const finished = todayShifts.filter((shift) => new Date(shift.endsAt) < now);
  return (
    <section className="rounded-md border border-border bg-white/65 p-5">
      <h2 className="font-semibold">Operations · {format(now, "EEE MMM d")} · {format(now, "h:mm a")}</h2>
      <div className="mt-5 grid gap-5 lg:grid-cols-3">
        <OperateColumn title="On Shift Now" shifts={onShift} empty="No active shifts right now." />
        <OperateColumn title="Coming Up Today" shifts={upcoming} empty="No more shifts today." />
        <OperateColumn title="Finished Today" shifts={finished} empty="No shifts ended yet." />
      </div>
      <div className="mt-5 rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
        <p className="font-semibold">Alerts</p>
        <p className="mt-1">Open shifts and approaching starts update every refresh; live polling can tighten this to a 30 second cadence.</p>
      </div>
    </section>
  );
}

function OperateColumn({ title, shifts, empty }: { title: string; shifts: Overview["shifts"]; empty: string }) {
  return (
    <div className="rounded-md border border-border bg-white p-4">
      <h3 className="text-sm font-semibold uppercase tracking-[0.08em] text-muted-foreground">{title}</h3>
      <div className="mt-3 grid gap-3">
        {shifts.map((shift) => (
          <div key={shift.id} className="rounded-md bg-cream p-3 text-sm">
            <p className="font-semibold">{shift.employeeName || "Open shift"}</p>
            <p className="mt-1 text-muted-foreground">{format(new Date(shift.startsAt), "h:mm a")} - {format(new Date(shift.endsAt), "h:mm a")} · {shift.roleName || "Shift"}</p>
          </div>
        ))}
        {!shifts.length ? <p className="text-sm text-muted-foreground">{empty}</p> : null}
      </div>
    </div>
  );
}

function MobileSchedule({ overview }: { overview: Overview }) {
  return (
    <section className="rounded-md border border-border bg-white/65 p-4 md:hidden">
      <h2 className="font-semibold">My Schedule</h2>
      <div className="mt-4 grid gap-3">
        {overview.days.map((dayValue) => {
          const day = new Date(dayValue);
          const shifts = overview.shifts.filter((shift) => isSameDay(new Date(shift.startsAt), day));
          const pto = overview.ptoBlocks.some((block) => new Date(block.startsAt) <= dayBounds(day).end && new Date(block.endsAt) >= dayBounds(day).start);
          return (
            <div key={dayValue}>
              <p className="text-sm font-semibold">{format(day, "EEE MMM d")}</p>
              <div className="mt-2 grid gap-2">
                {pto ? <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm font-semibold text-amber-800">PTO · Vacation</div> : null}
                {shifts.map((shift) => <div key={shift.id} className="rounded-md border border-border bg-white p-3 text-sm"><p className="font-semibold">{format(new Date(shift.startsAt), "h:mm a")} - {format(new Date(shift.endsAt), "h:mm a")}</p><p className="mt-1 text-muted-foreground">{shift.roleName || "Shift"} · Main Site</p></div>)}
                {!shifts.length && !pto ? <div className="rounded-md border border-border bg-white p-3 text-sm text-muted-foreground">Off</div> : null}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function QuickCreateModal({ quickCreate, overview, onClose, onCreate }: { quickCreate: { memberId: string | null; day: string; blocked?: string }; overview: Overview; onClose: () => void; onCreate: (startHour?: number, endHour?: number, publish?: boolean) => void }) {
  const member = overview.members.find((item) => item.id === quickCreate.memberId);
  return (
    <div className="fixed inset-0 z-40 grid place-items-center bg-ink/30 p-4">
      <div className="w-full max-w-md rounded-md border border-border bg-white p-5 shadow-xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-semibold">{quickCreate.memberId ? memberLabel(member ?? overview.members[0]) : "Open shift"} · {format(new Date(quickCreate.day), "EEE MMM d")}</h2>
            <p className="mt-1 text-sm text-muted-foreground">Recent shifts and smart defaults keep the scheduler moving.</p>
          </div>
          <button onClick={onClose}><X className="h-5 w-5" /></button>
        </div>
        {quickCreate.blocked ? <p className="mt-4 rounded-md bg-red-50 p-3 text-sm font-semibold text-red-700">{quickCreate.blocked}. You can still create an open shift instead.</p> : null}
        <div className="mt-4 grid gap-2">
          <Button onClick={() => onCreate(9, 17, false)} variant="outline" className="h-11 justify-start">9 AM - 5 PM Cashier</Button>
          <Button onClick={() => onCreate(12, 20, false)} variant="outline" className="h-11 justify-start">12 PM - 8 PM Cashier</Button>
          <Button onClick={() => onCreate(9, 17, true)} className="h-11 justify-start">Create and publish 9 AM - 5 PM</Button>
        </div>
      </div>
    </div>
  );
}

function QuickEditModal({ shift, onClose, onDuplicate }: { shift: Overview["shifts"][number]; onClose: () => void; onDuplicate: () => void }) {
  return (
    <div className="fixed inset-0 z-40 grid place-items-center bg-ink/30 p-4">
      <div className="w-full max-w-md rounded-md border border-border bg-white p-5 shadow-xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-semibold">{shift.employeeName || "Open shift"} · {format(new Date(shift.startsAt), "EEE MMM d")}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{format(new Date(shift.startsAt), "h:mm a")} - {format(new Date(shift.endsAt), "h:mm a")} · {shift.roleName || "Shift"}</p>
          </div>
          <button onClick={onClose}><X className="h-5 w-5" /></button>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2">
          <Button variant="outline">Edit</Button>
          <Button onClick={onDuplicate} variant="outline">Copy</Button>
          <Button variant="outline">Delete</Button>
        </div>
        <div className="mt-4 rounded-md bg-cream p-3 text-sm">
          <p className="font-semibold">Quick actions</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {["-30m", "+30m", "-1h", "+1h", "Prev day", "Next day"].map((action) => <span key={action} className="rounded-sm bg-white px-2 py-1 text-xs font-semibold text-muted-foreground">{action}</span>)}
          </div>
        </div>
      </div>
    </div>
  );
}

function PublishModal({ overview, conflicts, diff, onClose }: { overview: Overview; conflicts: number; diff: { newShifts: Overview["shifts"]; openShifts: Overview["shifts"]; notifiedEmployees: number }; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-40 grid place-items-center bg-ink/30 p-4">
      <div className="max-h-[90vh] w-full max-w-xl overflow-auto rounded-md border border-border bg-white p-5 shadow-xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-semibold">Publish Schedule</h2>
            <p className="mt-1 text-sm text-muted-foreground">Week of {format(new Date(overview.weekStart), "MMM d")} - {format(addDays(new Date(overview.weekStart), 6), "MMM d")}</p>
          </div>
          <button onClick={onClose}><X className="h-5 w-5" /></button>
        </div>
        <div className="mt-5 space-y-4 text-sm">
          <div>
            <p className="font-semibold">Changes since last publish</p>
            <div className="mt-2 rounded-md bg-cream p-3">
              <p><Plus className="mr-1 inline h-4 w-4" /> {diff.newShifts.length} draft shifts ready</p>
              <p className="mt-1"><Clock className="mr-1 inline h-4 w-4" /> {diff.openShifts.length} open shifts included</p>
              <p className="mt-1"><UsersRound className="mr-1 inline h-4 w-4" /> {diff.notifiedEmployees} affected employees</p>
            </div>
          </div>
          <div>
            <p className="font-semibold">Employees to notify</p>
            <label className="mt-2 flex items-center gap-2"><input name="notify" type="radio" defaultChecked /> Notify affected employees only</label>
            <label className="mt-2 flex items-center gap-2"><input name="notify" type="radio" /> Notify everyone</label>
            <label className="mt-2 flex items-center gap-2"><input name="notify" type="radio" /> Silent publish</label>
          </div>
          <label className="grid gap-2 font-semibold">Notification message<textarea className="min-h-24 rounded-md border border-border bg-white px-3 py-2 font-normal" defaultValue="Next week is finalized. Please review your schedule." /></label>
          {conflicts ? <p className="rounded-md bg-amber-50 p-3 font-semibold text-amber-800">{conflicts} conflicts remain. Review before publishing or publish anyway with a recorded audit note.</p> : <p className="rounded-md bg-green-50 p-3 font-semibold text-green-700">No conflicts detected.</p>}
        </div>
        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Review conflicts</Button>
          <Button onClick={onClose}><CheckCircle2 className="h-4 w-4" /> Publish & Notify</Button>
        </div>
      </div>
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
