"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

export type ThemeMode = "light" | "dark";
export type ThemePreference = ThemeMode | "system";

const storageKey = "eclipse-theme";

function getSystemMode(): ThemeMode {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function resolveThemePreference(preference: ThemePreference): ThemeMode {
  return preference === "system" ? getSystemMode() : preference;
}

export function getStoredThemePreference(): ThemePreference {
  if (typeof window === "undefined") return "light";
  const stored = window.localStorage.getItem(storageKey);
  if (isThemePreference(stored)) return stored;
  return "light";
}

export function isThemePreference(value: unknown): value is ThemePreference {
  return value === "light" || value === "dark" || value === "system";
}

export async function loadAccountThemePreference() {
  const response = await fetch("/api/account/theme", { cache: "no-store" });
  if (!response.ok) return null;
  const data = (await response.json().catch(() => null)) as { preference?: unknown } | null;
  return isThemePreference(data?.preference) ? data.preference : null;
}

export async function saveAccountThemePreference(preference: ThemePreference) {
  await fetch("/api/account/theme", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ preference })
  });
}

function paintTheme(mode: ThemeMode) {
  document.documentElement.classList.toggle("dark", mode === "dark");
  document.documentElement.style.colorScheme = mode;
}

export function applyEclipseTheme(preference: ThemePreference) {
  const mode = resolveThemePreference(preference);
  paintTheme(mode);
  window.localStorage.setItem(storageKey, preference);
  window.dispatchEvent(new CustomEvent("eclipse-theme-change", { detail: { preference, mode } }));
  return mode;
}

export function playEclipseTransition(targetMode: ThemeMode) {
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
  const [preference, setPreference] = useState<ThemePreference>("light");
  const mode = resolveThemePreference(preference);

  useEffect(() => {
    const initial = getStoredThemePreference();
    setPreference(initial);
    applyEclipseTheme(initial);

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    function syncSystem() {
      if (getStoredThemePreference() === "system") {
        setPreference("system");
        paintTheme(getSystemMode());
      }
    }
    function syncCustom(event: Event) {
      const next = (event as CustomEvent<{ preference: ThemePreference }>).detail?.preference;
      if (next === "light" || next === "dark" || next === "system") setPreference(next);
    }

    media.addEventListener("change", syncSystem);
    window.addEventListener("eclipse-theme-change", syncCustom);

    return () => {
      media.removeEventListener("change", syncSystem);
      window.removeEventListener("eclipse-theme-change", syncCustom);
    };
  }, []);

  function toggle() {
    setPreference((current) => {
      const currentMode = resolveThemePreference(current);
      const next: ThemePreference = currentMode === "dark" ? "light" : "dark";
      playEclipseTransition(next);
      applyEclipseTheme(next);
      void saveAccountThemePreference(next).catch(() => undefined);
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
