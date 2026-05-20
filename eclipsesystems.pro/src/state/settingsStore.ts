import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ParseMode } from "@core/types";

export type Theme = "system" | "light" | "dark";

type SettingsState = {
  theme: Theme;
  indent: number;
  mode: ParseMode;
  setTheme: (theme: Theme) => void;
  setIndent: (indent: number) => void;
  setMode: (mode: ParseMode) => void;
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      theme: "system",
      indent: 2,
      mode: "tolerant",
      setTheme: (theme) => set({ theme }),
      setIndent: (indent) => set({ indent }),
      setMode: (mode) => set({ mode })
    }),
    { name: "eclipse-json-tool-settings" }
  )
);
