"use client";

import { useEffect } from "react";
import { applyEclipseTheme, getStoredThemePreference, loadAccountThemePreference, playEclipseTransition, resolveThemePreference } from "@/components/app/theme-toggle";

export function ThemePreferenceSync() {
  useEffect(() => {
    let active = true;

    loadAccountThemePreference()
      .then((preference) => {
        if (!active || !preference) return;
        const currentMode = resolveThemePreference(getStoredThemePreference());
        const nextMode = resolveThemePreference(preference);
        if (currentMode !== nextMode) playEclipseTransition(nextMode);
        applyEclipseTheme(preference);
      })
      .catch(() => undefined);

    return () => {
      active = false;
    };
  }, []);

  return null;
}
