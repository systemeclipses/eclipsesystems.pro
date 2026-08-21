"use client";

import { useEffect } from "react";

function savedThemeIsDark() {
  const stored = window.localStorage.getItem("eclipse-theme");
  if (stored === "dark") return true;
  if (stored === "system") return window.matchMedia("(prefers-color-scheme: dark)").matches;
  return false;
}

export function MarketingThemeGuard() {
  useEffect(() => {
    const root = document.documentElement;

    root.classList.remove("dark");
    root.style.colorScheme = "light";

    return () => {
      const dark = savedThemeIsDark();
      root.classList.toggle("dark", dark);
      root.style.colorScheme = dark ? "dark" : "light";
    };
  }, []);

  return null;
}
