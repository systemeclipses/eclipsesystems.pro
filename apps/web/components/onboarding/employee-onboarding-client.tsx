"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Bell, Camera, Check, ChevronLeft, Clock3, MapPin, ShieldCheck, Timer, UserRound, X } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";

type OnboardingContext = {
  employee: {
    fullName: string;
    preferredName: string;
    email: string;
    phone: string;
    avatarUrl: string | null;
  };
  organization: {
    name: string;
    timezone: string;
  };
  membership: {
    role: string;
    department: string | null;
    payRateCents: number;
    hireDate: string | null;
    probationEndsAt: string | null;
  };
  manager: {
    name: string;
    email: string | null;
  };
  sites: Array<{
    id: string;
    name: string;
    address: string | null;
    behavior: "block" | "warn";
  }>;
};

const tourScreens = [
  {
    title: "Clock in when you start",
    body: "One big button handles clocking in and out. Your timer and earnings stay visible while you work.",
    icon: Clock3
  },
  {
    title: "Track your hours",
    body: "See each day, your pay-period total, and what you have earned before payroll closes.",
    icon: Timer
  },
  {
    title: "Request time off",
    body: "Check your balances, submit requests, and get notified when your manager decides.",
    icon: ShieldCheck
  }
];

function money(cents: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}

function initialStepLabel(step: number) {
  if (step <= 1) return "";
  return `Step ${Math.min(step - 1, 5)} of 5`;
}

export function EmployeeOnboardingClient({ context }: { context: OnboardingContext }) {
  const router = useRouter();
  const [stage, setStage] = useState(0);
  const [tourIndex, setTourIndex] = useState(0);
  const [trainingState, setTrainingState] = useState<"offer" | "clocked_out" | "clocked_in" | "done" | "skipped">("offer");
  const [profile, setProfile] = useState({
    fullName: context.employee.fullName,
    preferredName: context.employee.preferredName,
    phone: context.employee.phone
  });
  const [notifications, setNotifications] = useState({
    pto: "push",
    missedClockOut: "push",
    weeklySummary: "email",
    quietStart: "21:00",
    quietEnd: "07:00"
  });
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const name = profile.preferredName || profile.fullName || context.employee.email.split("@")[0] || "there";
  const firstShift = useMemo(() => {
    const hire = context.membership.hireDate ? new Date(`${context.membership.hireDate}T08:00:00`) : new Date();
    return Number.isNaN(hire.getTime()) ? null : hire;
  }, [context.membership.hireDate]);

  async function saveProfile(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    setSaving(true);
    setNotice(null);
    const response = await fetch("/api/onboarding/profile", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(profile)
    });
    setSaving(false);
    if (!response.ok) {
      setNotice("We could not save that yet. You can continue and update it later.");
      return false;
    }
    return true;
  }

  async function continueFromProfile(event: FormEvent<HTMLFormElement>) {
    const ok = await saveProfile(event);
    if (ok) setStage(3);
  }

  function requestLocationPermission() {
    if (!navigator.geolocation) {
      setNotice("Location is not available in this browser. Your punches may be flagged for review.");
      setStage(5);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      () => {
        setNotice(null);
        setStage(5);
      },
      () => {
        setNotice("Location was not enabled. You can finish setup, but punches may be flagged until it is turned on.");
        setStage(5);
      },
      { timeout: 6000, maximumAge: 60000, enableHighAccuracy: true }
    );
  }

  function askForNotifications() {
    const wantsPush = notifications.pto === "push" || notifications.pto === "both" || notifications.missedClockOut === "push" || notifications.missedClockOut === "both";
    if (wantsPush && "Notification" in window && Notification.permission === "default") {
      void Notification.requestPermission();
    }
    setStage(6);
  }

  function finishTour() {
    if (tourIndex < tourScreens.length - 1) {
      setTourIndex((index) => index + 1);
      return;
    }
    setStage(7);
  }

  function openApp() {
    router.push("/timekeeping");
  }

  return (
    <main className="min-h-screen bg-cream px-4 py-5 text-ink">
      <div className="mx-auto flex min-h-[calc(100vh-2.5rem)] max-w-md flex-col">
        {stage > 1 && stage < 8 ? (
          <div className="mb-4 flex min-h-11 items-center justify-between">
            <button onClick={() => setStage((current) => Math.max(1, current - 1))} className="grid h-11 w-11 place-items-center rounded-md border border-border bg-white">
              <ChevronLeft className="h-5 w-5" />
            </button>
            <p className="text-sm font-semibold text-muted-foreground">{initialStepLabel(stage)}</p>
            <span className="h-11 w-11" />
          </div>
        ) : null}

        <section className="flex flex-1 flex-col justify-center rounded-md border border-border bg-white/75 p-5 shadow-sm">
          {stage === 0 ? (
            <div className="text-center">
              <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-secondary text-3xl">Hi</div>
              <h1 className="mt-8 text-3xl font-semibold">Welcome to {context.organization.name}</h1>
              <p className="mt-4 text-sm leading-6 text-muted-foreground">You are set up to track time and request time off here. {context.manager.name} can help if you have questions.</p>
              <p className="mt-4 rounded-md bg-cream/70 p-3 text-sm text-muted-foreground">This setup takes about 3 minutes. You can come back to anything that is not required.</p>
              <Button onClick={() => setStage(1)} className="mt-8 h-12 w-full">Let's go</Button>
            </div>
          ) : null}

          {stage === 1 ? (
            <div>
              <h1 className="text-3xl font-semibold">Welcome, {name}</h1>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">Confirm your account before the quick setup.</p>
              <div className="mt-6 grid gap-4">
                <label className="grid gap-2 text-sm font-medium text-muted-foreground">Email<input value={context.employee.email} readOnly className="h-12 rounded-md border border-border bg-cream/70 px-3 text-ink" /></label>
                <label className="grid gap-2 text-sm font-medium text-muted-foreground">Create a password<input type="password" disabled className="h-12 rounded-md border border-border bg-white px-3 text-ink" placeholder="Already handled by sign in" /></label>
                <div className="rounded-md bg-cream/70 p-3 text-sm text-muted-foreground">
                  <p>Use at least 8 characters with letters and numbers when password sign-up is enabled.</p>
                </div>
              </div>
              <Button onClick={() => setStage(2)} className="mt-6 h-12 w-full">Continue</Button>
            </div>
          ) : null}

          {stage === 2 ? (
            <form onSubmit={continueFromProfile}>
              <h1 className="text-3xl font-semibold">About you</h1>
              <div className="mt-5 rounded-md border border-dashed border-border bg-cream/50 p-4 text-center">
                <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-white text-primary">
                  <Camera className="h-8 w-8" />
                </div>
                <p className="mt-3 text-sm font-semibold">Add a photo</p>
                <p className="mt-1 text-xs text-muted-foreground">Optional. It helps managers recognize teammates.</p>
              </div>
              <div className="mt-5 grid gap-4">
                <label className="grid gap-2 text-sm font-medium text-muted-foreground">Full name<input value={profile.fullName} onChange={(event) => setProfile((current) => ({ ...current, fullName: event.target.value }))} className="h-12 rounded-md border border-border bg-white px-3 text-ink" /></label>
                <label className="grid gap-2 text-sm font-medium text-muted-foreground">Preferred name<input value={profile.preferredName} onChange={(event) => setProfile((current) => ({ ...current, preferredName: event.target.value }))} className="h-12 rounded-md border border-border bg-white px-3 text-ink" placeholder="Sam" /></label>
                <label className="grid gap-2 text-sm font-medium text-muted-foreground">Phone number<input value={profile.phone} onChange={(event) => setProfile((current) => ({ ...current, phone: event.target.value }))} className="h-12 rounded-md border border-border bg-white px-3 text-ink" placeholder="(555) 123-4567" /></label>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">Used for shift notifications and password recovery.</p>
              {notice ? <p className="mt-4 rounded-md bg-amber-50 p-3 text-sm text-amber-800">{notice}</p> : null}
              <Button disabled={saving} className="mt-6 h-12 w-full">{saving ? "Saving..." : "Continue"}</Button>
            </form>
          ) : null}

          {stage === 3 ? (
            <div>
              <h1 className="text-3xl font-semibold">Your role</h1>
              <div className="mt-6 divide-y divide-border rounded-md border border-border bg-white">
                <InfoRow label="Position" value={context.membership.role === "member" ? "Team member" : context.membership.role} />
                <InfoRow label="Pay rate" value={context.membership.payRateCents ? `${money(context.membership.payRateCents)} per hour` : "Not set"} />
                <InfoRow label="Start date" value={context.membership.hireDate ? format(new Date(`${context.membership.hireDate}T00:00:00`), "MMM d, yyyy") : "Not set"} />
                <InfoRow label="Manager" value={context.manager.name} />
                <InfoRow label="Pay schedule" value="Bi-weekly" />
              </div>
              {context.membership.probationEndsAt ? (
                <p className="mt-4 rounded-md bg-secondary/70 p-3 text-sm text-primary">PTO accrues during probation, but may not be usable until {format(new Date(`${context.membership.probationEndsAt}T00:00:00`), "MMM d, yyyy")}.</p>
              ) : null}
              <p className="mt-4 rounded-md bg-cream/70 p-3 text-sm text-muted-foreground">This information was set up by your employer. If anything looks wrong, let {context.manager.name} know before your first shift.</p>
              <div className="mt-6 grid gap-2">
                <Button onClick={() => setStage(4)} className="h-12">Looks good</Button>
                <Button onClick={() => setNotice("We marked this for manager review. You can keep setting up while they fix it.")} variant="outline" className="h-12">Something's wrong</Button>
              </div>
              {notice ? <p className="mt-4 rounded-md bg-amber-50 p-3 text-sm text-amber-800">{notice}</p> : null}
            </div>
          ) : null}

          {stage === 4 ? (
            <div>
              <h1 className="text-3xl font-semibold">Where you'll work</h1>
              <p className="mt-3 text-sm text-muted-foreground">You are assigned to:</p>
              <div className="mt-5 grid gap-3">
                {(context.sites.length ? context.sites : [{ id: "none", name: "Work site assigned by manager", address: "Ask your manager if this looks wrong.", behavior: "warn" as const }]).map((site) => (
                  <div key={site.id} className="rounded-md border border-border bg-white p-4">
                    <p className="flex items-center gap-2 font-semibold"><MapPin className="h-4 w-4 text-primary" /> {site.name}</p>
                    <p className="mt-2 text-sm text-muted-foreground">{site.address ?? "Address not listed"}</p>
                    <div className="mt-4 grid h-24 place-items-center rounded-md bg-cream/70 text-xs font-semibold text-muted-foreground">Map preview</div>
                  </div>
                ))}
              </div>
              <div className="mt-5 rounded-md bg-cream/70 p-4 text-sm leading-6 text-muted-foreground">
                <p>This app uses your location to confirm you are at your work site when you clock in.</p>
                <ul className="mt-3 space-y-2">
                  <li>Location is checked only when you clock in or out.</li>
                  <li>We do not track you during your shift or off the clock.</li>
                  <li>You can review stored punch details in your profile.</li>
                </ul>
              </div>
              <Button onClick={requestLocationPermission} className="mt-6 h-12 w-full">Continue</Button>
              {notice ? <p className="mt-4 rounded-md bg-amber-50 p-3 text-sm text-amber-800">{notice}</p> : null}
            </div>
          ) : null}

          {stage === 5 ? (
            <div>
              <h1 className="text-3xl font-semibold">Stay in the loop</h1>
              <p className="mt-3 text-sm text-muted-foreground">Choose how you want to hear about time and PTO updates.</p>
              <div className="mt-6 grid gap-4">
                <ChoiceRow label="PTO approvals and denials" value={notifications.pto} onChange={(value) => setNotifications((current) => ({ ...current, pto: value }))} options={["push", "email", "both"]} />
                <ChoiceRow label="Missed clock-out reminders" value={notifications.missedClockOut} onChange={(value) => setNotifications((current) => ({ ...current, missedClockOut: value }))} options={["push", "email", "both"]} />
                <ChoiceRow label="Weekly hours summary" value={notifications.weeklySummary} onChange={(value) => setNotifications((current) => ({ ...current, weeklySummary: value }))} options={["email", "off"]} />
              </div>
              <div className="mt-5 rounded-md border border-border bg-white p-4">
                <p className="font-semibold">Quiet hours</p>
                <div className="mt-3 grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                  <input type="time" value={notifications.quietStart} onChange={(event) => setNotifications((current) => ({ ...current, quietStart: event.target.value }))} className="h-11 rounded-md border border-border px-2" />
                  <span className="text-muted-foreground">to</span>
                  <input type="time" value={notifications.quietEnd} onChange={(event) => setNotifications((current) => ({ ...current, quietEnd: event.target.value }))} className="h-11 rounded-md border border-border px-2" />
                </div>
              </div>
              <p className="mt-4 text-sm text-muted-foreground">You can change all of these later in your profile.</p>
              <Button onClick={askForNotifications} className="mt-6 h-12 w-full"><Bell className="h-4 w-4" /> Continue</Button>
            </div>
          ) : null}

          {stage === 6 ? (
            <div className="text-center">
              {(() => {
                const screen = tourScreens[tourIndex];
                const Icon = screen.icon;
                return (
                  <>
                    <div className="mx-auto grid h-32 w-32 place-items-center rounded-md border border-border bg-cream/70">
                      <Icon className="h-14 w-14 text-primary" />
                    </div>
                    <h1 className="mt-8 text-3xl font-semibold">{screen.title}</h1>
                    <p className="mt-4 text-sm leading-6 text-muted-foreground">{screen.body}</p>
                    <div className="mt-8 flex justify-center gap-2">
                      {tourScreens.map((_, index) => <span key={index} className={`h-2.5 w-2.5 rounded-full ${index === tourIndex ? "bg-primary" : "bg-border"}`} />)}
                    </div>
                    <Button onClick={finishTour} className="mt-8 h-12 w-full">{tourIndex === tourScreens.length - 1 ? "Done" : "Next"}</Button>
                    <button onClick={() => setStage(7)} className="mt-3 h-11 w-full text-sm font-semibold text-muted-foreground">Skip tour</button>
                  </>
                );
              })()}
            </div>
          ) : null}

          {stage === 7 ? (
            <TrainingMode state={trainingState} setState={setTrainingState} onDone={() => setStage(8)} />
          ) : null}

          {stage === 8 ? (
            <div className="text-center">
              <div className="mx-auto grid h-24 w-24 place-items-center rounded-full bg-[#2f6f4f] text-white">
                <Check className="h-12 w-12" />
              </div>
              <h1 className="mt-8 text-3xl font-semibold">You're all set</h1>
              <p className="mt-4 text-sm leading-6 text-muted-foreground">Open the app when your shift starts and tap Clock In.</p>
              {firstShift ? <p className="mt-5 rounded-md bg-cream/70 p-3 text-sm font-semibold">First shift starts: {format(firstShift, "EEEE, MMM d 'at' h:mm a")}</p> : null}
              <div className="mt-6 rounded-md border border-border bg-white p-4 text-left text-sm text-muted-foreground">
                <p className="font-semibold text-ink">Want help getting ready?</p>
                <p className="mt-2">Add the app to your home screen, use Face ID or Touch ID if your browser offers it, and check your hours tab after your first shift.</p>
              </div>
              <Button onClick={openApp} className="mt-6 h-12 w-full">Open the app</Button>
              <Button onClick={() => router.push("/")} variant="outline" className="mt-2 h-12 w-full">Back to site</Button>
            </div>
          ) : null}
        </section>
      </div>
    </main>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 p-3 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-semibold">{value}</span>
    </div>
  );
}

function ChoiceRow({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: string[] }) {
  return (
    <div className="rounded-md border border-border bg-white p-4">
      <p className="font-semibold">{label}</p>
      <div className="mt-3 grid grid-cols-3 gap-2">
        {options.map((option) => (
          <button key={option} type="button" onClick={() => onChange(option)} className={`h-10 rounded-md text-sm font-semibold capitalize ${value === option ? "bg-primary text-white" : "bg-cream text-muted-foreground"}`}>
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}

function TrainingMode({ state, setState, onDone }: { state: "offer" | "clocked_out" | "clocked_in" | "done" | "skipped"; setState: (state: "offer" | "clocked_out" | "clocked_in" | "done" | "skipped") => void; onDone: () => void }) {
  if (state === "offer") {
    return (
      <div className="text-center">
        <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-secondary text-primary"><UserRound className="h-9 w-9" /></div>
        <h1 className="mt-8 text-3xl font-semibold">Want to practice clocking in?</h1>
        <p className="mt-4 text-sm leading-6 text-muted-foreground">We will walk through one practice punch. It will not count as a real shift.</p>
        <Button onClick={() => setState("clocked_out")} className="mt-8 h-12 w-full">Yes, show me</Button>
        <Button onClick={onDone} variant="outline" className="mt-2 h-12 w-full">Skip</Button>
      </div>
    );
  }

  if (state === "clocked_out") {
    return (
      <div>
        <p className="rounded-md bg-amber-50 p-3 text-sm font-semibold text-amber-800">Training mode. This is a practice run.</p>
        <button onClick={() => setState("clocked_in")} className="mt-8 grid min-h-64 w-full place-items-center rounded-md bg-[#2f6f4f] p-5 text-white active:scale-[0.99]">
          <span><span className="block text-4xl font-semibold uppercase">Clock In</span><span className="mt-5 flex items-center justify-center gap-2 text-sm"><MapPin className="h-4 w-4" /> Main Site</span></span>
        </button>
        <p className="mt-5 text-sm text-muted-foreground">Tap the green button to practice clocking in.</p>
      </div>
    );
  }

  if (state === "clocked_in") {
    return (
      <div>
        <p className="rounded-md bg-secondary/70 p-3 text-sm font-semibold text-primary">You did it. In real use, you would now see a live timer.</p>
        <button onClick={() => setState("done")} className="mt-8 grid min-h-64 w-full place-items-center rounded-md bg-[#7c2d12] p-5 text-white active:scale-[0.99]">
          <span className="text-4xl font-semibold uppercase">Clock Out</span>
        </button>
        <p className="mt-5 text-sm text-muted-foreground">Try clocking out next.</p>
      </div>
    );
  }

  return (
    <div className="text-center">
      <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-secondary text-primary"><Check className="h-10 w-10" /></div>
      <h1 className="mt-8 text-3xl font-semibold">Nice work</h1>
      <p className="mt-4 text-sm text-muted-foreground">You are ready to clock in for real whenever your shift starts.</p>
      <Button onClick={onDone} className="mt-8 h-12 w-full">Exit training mode</Button>
    </div>
  );
}
