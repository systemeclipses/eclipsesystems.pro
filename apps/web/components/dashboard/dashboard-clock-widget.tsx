"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Clock3, MapPin, Square } from "lucide-react";

type ShiftState = "CLOCKED_OUT" | "CLOCKED_IN" | "ON_BREAK" | "PENDING_REVIEW" | "LOCKED";

type RunningEntry = {
  id: string;
  started_at: string;
} | null;

type LatestPunch = {
  label: string;
  time: string;
} | null;

function formatTime(value: string | Date) {
  return new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" }).format(new Date(value));
}

function formatDuration(totalSeconds: number) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return [h, m, s].map((value) => String(value).padStart(2, "0")).join(":");
}

function parseJson<T>(text: string): T | null {
  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

async function getLocation() {
  if (!navigator.geolocation) return null;
  return new Promise<{ latitude: number; longitude: number; accuracy?: number | null } | null>((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (position) => resolve({ latitude: position.coords.latitude, longitude: position.coords.longitude, accuracy: position.coords.accuracy }),
      () => resolve(null),
      { timeout: 8000, maximumAge: 60000, enableHighAccuracy: true }
    );
  });
}

export function DashboardClockWidget({
  initialRunning,
  initialState,
  initialLatestPunch
}: {
  initialRunning: RunningEntry;
  initialState: ShiftState;
  initialLatestPunch: LatestPunch;
}) {
  const router = useRouter();
  const [running, setRunning] = useState(initialRunning);
  const [state, setState] = useState<ShiftState>(initialState);
  const [latestPunch, setLatestPunch] = useState(initialLatestPunch);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const interval = window.setInterval(() => setTick((value) => value + 1), 1000);
    return () => window.clearInterval(interval);
  }, []);

  const isClockedIn = Boolean(running) && state !== "CLOCKED_OUT";
  const duration = running ? Math.max(0, Math.floor((Date.now() - new Date(running.started_at).getTime()) / 1000)) : 0;
  const statusText = state === "ON_BREAK" ? "You are on break" : isClockedIn ? "You are clocked in" : "You are clocked out";
  const cardTone = isClockedIn
    ? "border-green-200 bg-green-600 text-white dark:border-secondary/40 dark:bg-secondary dark:text-primary"
    : "border-[#d7c9ac] bg-[hsl(35_69%_90%)] text-[hsl(132_16%_13%)]";
  const mutedText = isClockedIn ? "text-white/75 dark:text-primary/80" : "text-[hsl(129_12%_34%)]";
  const iconText = isClockedIn ? "text-white/80 dark:text-primary" : "text-[hsl(134_16%_33%)]";
  const buttonTone = isClockedIn
    ? "bg-white text-ink hover:bg-cream dark:bg-primary dark:text-white dark:hover:bg-[#3b5243]"
    : "bg-primary text-white hover:bg-[#3b5243]";
  const detailTone = isClockedIn ? "bg-white/12 dark:bg-primary/15" : "bg-white/70";
  const siteText = isClockedIn ? "text-white/70 dark:text-primary/80" : "text-muted-foreground";
  void tick;

  async function punch() {
    setPending(true);
    setError(null);
    const location = await getLocation();
    const response = await fetch(isClockedIn ? "/api/time-entries/stop" : "/api/time-entries/start", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        id: running?.id,
        requestId: crypto.randomUUID(),
        location,
        platform: navigator.platform,
        offline: !navigator.onLine
      })
    });

    const text = await response.text();
    const payload = parseJson<{ error?: string; id?: string; started_at?: string; current_state?: ShiftState; state?: ShiftState }>(text);
    setPending(false);

    if (!response.ok) {
      setError(payload?.error ?? "Unable to punch.");
      return;
    }

    const now = new Date().toISOString();
    if (isClockedIn) {
      setRunning(null);
      setState("CLOCKED_OUT");
      setLatestPunch({ label: "Clocked out", time: now });
    } else {
      const startedAt = payload?.started_at ?? now;
      setRunning({ id: payload?.id ?? crypto.randomUUID(), started_at: startedAt });
      setState(payload?.current_state ?? "CLOCKED_IN");
      setLatestPunch({ label: "Clocked in", time: startedAt });
    }

    router.refresh();
  }

  return (
    <div className={`rounded-md border p-5 ${cardTone}`}>
      <div className="flex items-center justify-between">
        <p className={`text-sm font-semibold ${iconText}`}>Clock</p>
        <Clock3 className={`h-5 w-5 ${iconText}`} />
      </div>

      <p className={`mt-6 text-sm font-semibold ${mutedText}`}>{statusText}</p>
      <p className="mt-2 font-mono text-5xl font-semibold leading-none tabular-nums">{isClockedIn ? formatDuration(duration) : "--:--:--"}</p>

      <button
        onClick={punch}
        disabled={pending || state === "LOCKED"}
        className={`mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-md px-4 text-sm font-semibold transition disabled:opacity-70 ${buttonTone}`}
      >
        {isClockedIn ? <Square className="h-4 w-4" /> : <Clock3 className="h-4 w-4" />}
        {pending ? "Processing..." : isClockedIn ? "Clock Out" : "Clock In"}
      </button>

      <div className={`mt-5 rounded-sm p-3 ${detailTone}`}>
        <p className={`text-xs font-semibold uppercase ${mutedText}`}>Most recent punch today</p>
        <p className="mt-1 text-sm font-semibold">
          {latestPunch ? `${latestPunch.label} at ${formatTime(latestPunch.time)}` : "No punches yet today"}
        </p>
        {isClockedIn ? (
          <p className={`mt-2 inline-flex items-center gap-1 text-xs ${siteText}`}><MapPin className="h-3.5 w-3.5" /> Main Site</p>
        ) : null}
      </div>

      {error ? <p className="mt-4 rounded-sm bg-white p-3 text-sm font-semibold text-red-700">{error}</p> : null}
    </div>
  );
}
