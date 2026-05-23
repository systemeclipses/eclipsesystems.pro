"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

type ThemeMode = "light" | "dark";

function getInitialMode(): ThemeMode {
  if (typeof window === "undefined") return "light";
  const stored = window.localStorage.getItem("eclipse-theme");
  if (stored === "light" || stored === "dark") return stored;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyMode(mode: ThemeMode) {
  document.documentElement.classList.toggle("dark", mode === "dark");
  document.documentElement.style.colorScheme = mode;
  window.localStorage.setItem("eclipse-theme", mode);
}

function playEclipseTransition(targetMode: ThemeMode) {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  document.querySelector(".theme-eclipse-overlay")?.remove();
  const overlay = document.createElement("div");
  overlay.className = "theme-eclipse-overlay";
  overlay.dataset.target = targetMode;
  overlay.innerHTML = '<span class="light-wipe"></span><span class="sun-rays"></span>';
  document.documentElement.classList.add("theme-transitioning");
  document.body.appendChild(overlay);

  window.setTimeout(() => {
    overlay.remove();
    document.documentElement.classList.remove("theme-transitioning");
  }, 1720);
}

export function ThemeToggle() {
  const [mode, setMode] = useState<ThemeMode>("light");

  useEffect(() => {
    const initial = getInitialMode();
    setMode(initial);
    applyMode(initial);
  }, []);

  function toggle() {
    setMode((current) => {
      const next = current === "dark" ? "light" : "dark";
      playEclipseTransition(next);
      applyMode(next);
      return next;
    });
  }

  const isDark = mode === "dark";

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={isDark}
      aria-label={isDark ? "Switch to light mode" : "Switch to eclipse dark mode"}
      className="theme-eclipse-toggle relative h-12 w-full overflow-hidden rounded-md border border-white/15 bg-white/10 px-3 text-white shadow-inner shadow-black/10 transition hover:bg-white/15"
      data-mode={mode}
    >
      <span className="flex h-full items-center justify-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/82">
        {isDark ? <Sun className="h-3.5 w-3.5 text-[#f6d27f]" /> : <Moon className="h-3.5 w-3.5 text-[#dfe6d4]" />}
        <span>{isDark ? "End Eclipse" : "Start Eclipse"}</span>
      </span>
    </button>
  );
}
