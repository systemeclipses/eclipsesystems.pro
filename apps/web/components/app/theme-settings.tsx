"use client";

import { useEffect, useState } from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import { applyEclipseTheme, getStoredThemePreference, playEclipseTransition, resolveThemePreference, saveAccountThemePreference, type ThemePreference } from "@/components/app/theme-toggle";

const options: Array<{ value: ThemePreference; label: string; description: string; icon: typeof Sun }> = [
  { value: "light", label: "Light mode", description: "Daylight workspace with the cream Eclipse palette.", icon: Sun },
  { value: "dark", label: "Dark mode", description: "Eclipse Mode for calmer evening focus.", icon: Moon },
  { value: "system", label: "System setting", description: "Follow your device setting automatically.", icon: Monitor }
];

export function ThemeSettings() {
  const [preference, setPreference] = useState<ThemePreference>("light");
  const [resolved, setResolved] = useState("light");

  useEffect(() => {
    const initial = getStoredThemePreference();
    setPreference(initial);
    setResolved(resolveThemePreference(initial));

    function sync(event: Event) {
      const detail = (event as CustomEvent<{ preference: ThemePreference; mode: string }>).detail;
      if (detail?.preference) setPreference(detail.preference);
      if (detail?.mode) setResolved(detail.mode);
    }

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    function syncSystem() {
      const current = getStoredThemePreference();
      setPreference(current);
      setResolved(resolveThemePreference(current));
      if (current === "system") applyEclipseTheme("system");
    }

    window.addEventListener("eclipse-theme-change", sync);
    media.addEventListener("change", syncSystem);

    return () => {
      window.removeEventListener("eclipse-theme-change", sync);
      media.removeEventListener("change", syncSystem);
    };
  }, []);

  function choose(next: ThemePreference) {
    const currentMode = resolveThemePreference(preference);
    const nextMode = resolveThemePreference(next);
    if (currentMode !== nextMode) playEclipseTransition(nextMode);
    const mode = applyEclipseTheme(next);
    setPreference(next);
    setResolved(mode);
    void saveAccountThemePreference(next).catch(() => undefined);
  }

  return (
    <div className="rounded-md border border-border bg-white/65 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold dark:text-white">Appearance</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">Choose daylight, Eclipse Mode, or follow your device.</p>
        </div>
        <span className="rounded-sm bg-secondary px-2 py-1 text-xs font-semibold text-primary">
          Active: {resolved === "dark" ? "Eclipse" : "Daylight"}
        </span>
      </div>

      <div className="mt-5 grid gap-3 lg:grid-cols-3">
        {options.map((option) => {
          const Icon = option.icon;
          const selected = preference === option.value;

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => choose(option.value)}
              className={`rounded-md border p-4 text-left transition ${
                selected
                  ? "border-primary bg-secondary/80 text-ink shadow-lg shadow-primary/18 ring-1 ring-primary/20 dark:shadow-black/35"
                  : "border-border bg-cream/70 hover:bg-white/75 dark:text-white"
              }`}
            >
              <Icon className="h-5 w-5 text-primary" />
              <p className="mt-4 font-semibold">{option.label}</p>
              <p className="mt-2 text-sm leading-5 text-muted-foreground">{option.description}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
