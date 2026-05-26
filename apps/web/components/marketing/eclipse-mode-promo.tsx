"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { applyEclipseTheme, playEclipseTransition } from "@/components/app/theme-toggle";

export function EclipseModePromo() {
  const [active, setActive] = useState(false);

  useEffect(() => {
    setActive(document.documentElement.classList.contains("dark"));
  }, []);

  function toggle() {
    const next = active ? "light" : "dark";
    playEclipseTransition(next);
    applyEclipseTheme(next);
    setActive(!active);
  }

  return (
    <div className="rounded-md border border-border bg-white/60 p-5 dark:bg-white/10">
      <div className="flex items-start justify-between gap-5">
        <div>
          <p className="text-sm font-semibold text-primary dark:text-secondary">Eclipse Mode</p>
          <h3 className="mt-3 font-title text-5xl leading-none text-ink dark:text-white">Let the interface slip behind the moon.</h3>
          <p className="mt-4 max-w-xl text-sm leading-6 text-muted-foreground">
            Eclipse Mode is our calmer evening workspace: the same operating surface, dimmed for focus when the day gets long.
          </p>
        </div>
        <button
          type="button"
          onClick={toggle}
          className="inline-flex h-11 shrink-0 items-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-white transition hover:opacity-90 dark:bg-cream dark:text-primary"
        >
          {active ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          {active ? "Return to daylight" : "Try Eclipse Mode"}
        </button>
      </div>
    </div>
  );
}
