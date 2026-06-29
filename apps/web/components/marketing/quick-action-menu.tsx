"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  HelpCircle,
  Linkedin,
  Mail,
  MessageSquareText,
  Sparkles,
  X
} from "lucide-react";
import { FormEvent, useState } from "react";

type View = "menu" | "schedule" | "faqs" | "contact";
type Status = "idle" | "submitting" | "success" | "error";

const faqs = [
  {
    question: "What does Eclipse build?",
    answer: "Custom portals, operations hubs, CRM workflows, storefronts, dashboards, automations, integrations, and the systems between them."
  },
  {
    question: "How does a project begin?",
    answer: "We start with discovery alongside you and your key people, then define fit, priorities, scope, and a practical build path."
  },
  {
    question: "Do you support the software after launch?",
    answer: "Yes. Training, rollout support, workflow help, maintenance, and updates can all continue after implementation."
  },
  {
    question: "Can you improve a system we already use?",
    answer: "Often, yes. We can review your current stack and recommend whether to integrate, customize, replace, or build around it."
  }
] as const;

const viewCopy: Record<View, { title: string; subtitle: string }> = {
  menu: { title: "How can we help?", subtitle: "Choose a next step." },
  schedule: { title: "Schedule a demo", subtitle: "Choose a time that works." },
  faqs: { title: "Quick answers", subtitle: "The things people ask first." },
  contact: { title: "Contact Eclipse", subtitle: "Reach the right place." }
};

const timeOptions = ["9:00 AM", "10:30 AM", "1:00 PM", "2:30 PM", "4:00 PM"];

function dateKey(date: Date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0")
  ].join("-");
}

function getCalendarDays(month: Date) {
  const firstDay = new Date(month.getFullYear(), month.getMonth(), 1).getDay();
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();

  return Array.from({ length: 42 }, (_, index) => {
    const day = index - firstDay + 1;
    return day > 0 && day <= daysInMonth ? new Date(month.getFullYear(), month.getMonth(), day) : null;
  });
}

export function QuickActionMenu() {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<View>("menu");
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedDate, setSelectedDate] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const calendarDays = getCalendarDays(visibleMonth);
  const currentMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const canGoBack = visibleMonth > currentMonth;

  function closeMenu() {
    setOpen(false);
    setView("menu");
    setStatus("idle");
    setMessage("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);

    if (!selectedDate) {
      setStatus("error");
      setMessage("Choose a date for your demo.");
      return;
    }

    setStatus("submitting");
    setMessage("");
    const company = String(data.get("company") ?? "").trim();
    const preferredTime = "Preferred demo time: " + selectedDate + " at " + String(data.get("time"));

    const response = await fetch("/api/schedule-demo", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: data.get("name"),
        email: data.get("email"),
        businessName: company || "Not provided",
        employeeCount: 1,
        needs: preferredTime + (company ? "\nCompany: " + company : "")
      })
    });

    const payload = (await response.json().catch(() => null)) as { error?: string } | null;

    if (!response.ok) {
      setStatus("error");
      setMessage(payload?.error ?? "We could not send the request. Please try again.");
      return;
    }

    setStatus("success");
    setMessage("We will email you to confirm the time.");
  }

  return (
    <div className="fixed bottom-5 right-5 z-[70] flex flex-col items-end gap-3">
      {open ? (
        <div className="w-[min(calc(100vw-2.5rem),24rem)] rounded-[1.25rem] border border-[#d8d0c1] bg-[#fbfaf6] p-3 text-[#172219] shadow-2xl shadow-black/20">
          <div className="flex items-center justify-between gap-3 border-b border-[#d8d0c1] px-2 pb-3">
            <div className="flex items-center gap-3">
              {view !== "menu" ? (
                <button
                  type="button"
                  aria-label="Back to quick actions"
                  onClick={() => {
                    setView("menu");
                    setStatus("idle");
                    setMessage("");
                  }}
                  className="grid h-9 w-9 place-items-center rounded-full bg-[#314839] text-[#f9e8d2] transition hover:bg-[#172219]"
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
              ) : (
                <span className="grid h-10 w-10 place-items-center rounded-full bg-[#314839]">
                  <Image src="/brand/logomark-white.png" alt="" width={28} height={28} className="h-7 w-7 object-contain" />
                </span>
              )}
              <div>
                <p className="text-sm font-bold">{viewCopy[view].title}</p>
                <p className="text-xs font-semibold text-[#314839]/62">{viewCopy[view].subtitle}</p>
              </div>
            </div>
            <button
              type="button"
              aria-label="Close quick actions"
              onClick={closeMenu}
              className="grid h-9 w-9 place-items-center rounded-full border border-[#d8d0c1] text-[#314839] transition hover:bg-[#eef1e5]"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {view === "menu" ? (
            <div className="mt-3 grid gap-2">
              <button
                type="button"
                onClick={() => setView("schedule")}
                className="group grid grid-cols-[2.5rem_1fr] gap-3 rounded-[1rem] p-3 text-left transition hover:bg-[#eef1e5]"
              >
                <span className="grid h-10 w-10 place-items-center rounded-full bg-[#b4c292] text-[#172219] transition group-hover:bg-[#314839] group-hover:text-[#f9e8d2]">
                  <MessageSquareText className="h-5 w-5" />
                </span>
                <span>
                  <span className="block text-sm font-bold">Schedule a demo</span>
                  <span className="mt-1 block text-xs font-semibold leading-5 text-[#314839]/64">Pick a time without leaving this page.</span>
                </span>
              </button>

              <button
                type="button"
                onClick={() => setView("faqs")}
                className="group grid grid-cols-[2.5rem_1fr] gap-3 rounded-[1rem] p-3 text-left transition hover:bg-[#eef1e5]"
              >
                <span className="grid h-10 w-10 place-items-center rounded-full bg-[#b4c292] text-[#172219] transition group-hover:bg-[#314839] group-hover:text-[#f9e8d2]">
                  <HelpCircle className="h-5 w-5" />
                </span>
                <span>
                  <span className="block text-sm font-bold">FAQs</span>
                  <span className="mt-1 block text-xs font-semibold leading-5 text-[#314839]/64">Get quick answers right here.</span>
                </span>
              </button>

              <button
                type="button"
                onClick={() => setView("contact")}
                className="group grid grid-cols-[2.5rem_1fr] gap-3 rounded-[1rem] p-3 text-left transition hover:bg-[#eef1e5]"
              >
                <span className="grid h-10 w-10 place-items-center rounded-full bg-[#b4c292] text-[#172219] transition group-hover:bg-[#314839] group-hover:text-[#f9e8d2]">
                  <Mail className="h-5 w-5" />
                </span>
                <span>
                  <span className="block text-sm font-bold">Contact info</span>
                  <span className="mt-1 block text-xs font-semibold leading-5 text-[#314839]/64">Email and social links in one place.</span>
                </span>
              </button>

              <Link
                href="/demos"
                onClick={closeMenu}
                className="mt-1 flex items-center justify-between gap-4 rounded-[1rem] bg-[#314839] p-4 text-[#f9e8d2] transition hover:bg-[#172219]"
              >
                <span>
                  <span className="flex items-center gap-2 text-xs font-bold uppercase text-[#b4c292]">
                    <Sparkles className="h-3.5 w-3.5" /> Featured
                  </span>
                  <span className="mt-2 block text-sm font-bold">See our systems in motion.</span>
                  <span className="mt-1 block text-xs leading-5 text-white/65">Explore the live demo experience.</span>
                </span>
                <ExternalLink className="h-4 w-4 shrink-0" />
              </Link>
            </div>
          ) : view === "faqs" ? (
            <div className="grid max-h-[min(31rem,65vh)] gap-2 overflow-y-auto py-3 pr-1">
              {faqs.map((faq) => (
                <details key={faq.question} className="group rounded-[1rem] border border-[#d8d0c1] bg-white px-4 py-3 open:bg-[#eef1e5]">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-bold">
                    {faq.question}
                    <ChevronRight className="h-4 w-4 shrink-0 transition group-open:rotate-90" />
                  </summary>
                  <p className="pt-3 text-xs font-semibold leading-5 text-[#314839]/70">{faq.answer}</p>
                </details>
              ))}
              <Link href="/help-center" onClick={closeMenu} className="mt-1 flex items-center justify-center gap-2 rounded-full border border-[#314839]/20 px-4 py-2.5 text-xs font-bold text-[#314839] hover:bg-[#eef1e5]">
                Visit the full help center <ExternalLink className="h-3.5 w-3.5" />
              </Link>
            </div>
          ) : view === "contact" ? (
            <div className="grid gap-3 py-3">
              <a href="mailto:help@eclipsesystems.pro" className="rounded-[1rem] bg-[#314839] p-4 text-[#f9e8d2] transition hover:bg-[#172219]">
                <span className="flex items-center gap-2 text-xs font-bold uppercase text-[#b4c292]"><Mail className="h-4 w-4" /> Email us</span>
                <span className="mt-3 block text-sm font-bold">help@eclipsesystems.pro</span>
                <span className="mt-1 block text-xs leading-5 text-white/65">Questions, project ideas, and support requests are all welcome.</span>
              </a>
              <div className="grid grid-cols-2 gap-2">
                <a href="https://www.linkedin.com/company/eclipse-systems" target="_blank" rel="noreferrer" className="flex items-center justify-between rounded-[1rem] border border-[#d8d0c1] bg-white p-4 text-sm font-bold transition hover:bg-[#eef1e5]">
                  <span className="flex items-center gap-2"><Linkedin className="h-4 w-4" /> LinkedIn</span>
                  <ExternalLink className="h-3.5 w-3.5 text-[#314839]/50" />
                </a>
                <a href="https://twitter.com/eclipsesystems" target="_blank" rel="noreferrer" className="flex items-center justify-between rounded-[1rem] border border-[#d8d0c1] bg-white p-4 text-sm font-bold transition hover:bg-[#eef1e5]">
                  <span className="flex items-center gap-2"><span aria-hidden="true" className="text-base">X</span> Follow</span>
                  <ExternalLink className="h-3.5 w-3.5 text-[#314839]/50" />
                </a>
              </div>
              <button type="button" onClick={() => setView("schedule")} className="flex h-11 items-center justify-center gap-2 rounded-full bg-[#b4c292] text-sm font-bold text-[#172219] transition hover:bg-[#c5d2a4]">
                <CalendarDays className="h-4 w-4" /> Schedule a demo
              </button>
            </div>
          ) : status === "success" ? (
            <div className="grid min-h-80 place-items-center px-5 py-10 text-center">
              <div>
                <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-[#b4c292] text-[#172219]">
                  <Check className="h-7 w-7" />
                </span>
                <p className="mt-5 text-lg font-bold">Demo requested.</p>
                <p className="mt-2 text-sm leading-6 text-[#314839]/70">{message}</p>
                <button type="button" onClick={closeMenu} className="mt-5 rounded-full bg-[#314839] px-5 py-2.5 text-sm font-bold text-[#f9e8d2]">
                  Done
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="pt-3">
              <div className="rounded-[1rem] bg-[#eef1e5] p-3">
                <div className="flex items-center justify-between px-1">
                  <button
                    type="button"
                    aria-label="Previous month"
                    disabled={!canGoBack}
                    onClick={() => setVisibleMonth(new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() - 1, 1))}
                    className="grid h-8 w-8 place-items-center rounded-full transition hover:bg-white disabled:opacity-25"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <p className="text-sm font-bold">
                    {visibleMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                  </p>
                  <button
                    type="button"
                    aria-label="Next month"
                    onClick={() => setVisibleMonth(new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 1))}
                    className="grid h-8 w-8 place-items-center rounded-full transition hover:bg-white"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
                <div className="mt-2 grid grid-cols-7 text-center text-[10px] font-bold uppercase text-[#314839]/48">
                  {["S", "M", "T", "W", "T", "F", "S"].map((day, index) => <span key={day + index}>{day}</span>)}
                </div>
                <div className="mt-1 grid grid-cols-7 gap-0.5">
                  {calendarDays.map((day, index) => {
                    if (!day) return <span key={"empty-" + index} className="h-8" />;
                    const key = dateKey(day);
                    const disabled = day < today;
                    const selected = selectedDate === key;

                    return (
                      <button
                        key={key}
                        type="button"
                        disabled={disabled}
                        aria-pressed={selected}
                        onClick={() => setSelectedDate(key)}
                        className={selected
                          ? "grid h-8 place-items-center rounded-full bg-[#314839] text-xs font-bold text-[#f9e8d2]"
                          : "grid h-8 place-items-center rounded-full text-xs font-bold transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-25"}
                      >
                        {day.getDate()}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2">
                <input name="name" required autoComplete="name" placeholder="Your name" className="h-10 rounded-lg border border-[#d8d0c1] bg-white px-3 text-sm outline-none focus:border-[#314839]" />
                <input name="email" type="email" required autoComplete="email" placeholder="Email" className="h-10 rounded-lg border border-[#d8d0c1] bg-white px-3 text-sm outline-none focus:border-[#314839]" />
                <input name="company" autoComplete="organization" placeholder="Company (optional)" className="h-10 rounded-lg border border-[#d8d0c1] bg-white px-3 text-sm outline-none focus:border-[#314839]" />
                <select name="time" aria-label="Preferred time" className="h-10 rounded-lg border border-[#d8d0c1] bg-white px-3 text-sm outline-none focus:border-[#314839]">
                  {timeOptions.map((time) => <option key={time}>{time}</option>)}
                </select>
              </div>

              {message ? <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">{message}</p> : null}

              <button
                type="submit"
                disabled={status === "submitting"}
                className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-full bg-[#314839] text-sm font-bold text-[#f9e8d2] transition hover:bg-[#172219] disabled:opacity-60"
              >
                <CalendarDays className="h-4 w-4" />
                {status === "submitting" ? "Sending..." : "Request this time"}
              </button>
            </form>
          )}
        </div>
      ) : null}

      <button
        type="button"
        aria-label={open ? "Close quick actions" : "Open quick actions"}
        aria-expanded={open}
        onClick={() => (open ? closeMenu() : setOpen(true))}
        className="grid h-14 w-14 place-items-center rounded-full border border-[#f9e8d2]/30 bg-[#314839] shadow-2xl shadow-black/25 transition hover:-translate-y-1 hover:bg-[#172219]"
      >
        <Image src="/brand/logomark-white.png" alt="" width={34} height={34} className="h-8 w-8 object-contain" />
      </button>
    </div>
  );
}
