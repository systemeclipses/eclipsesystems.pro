import { create } from "zustand";

export type ActivePanel = "editor" | "tree" | "errors" | "schema";

type UiState = {
  activePanel: ActivePanel;
  selectionPath: string;
  expandedPaths: Set<string>;
  paletteOpen: boolean;
  setActivePanel: (panel: ActivePanel) => void;
  setSelectionPath: (path: string) => void;
  toggleExpanded: (path: string) => void;
  expandAll: (paths: string[]) => void;
  collapseAll: () => void;
  setPaletteOpen: (open: boolean) => void;
};

export const useUiStore = create<UiState>((set) => ({
  activePanel: "editor",
  selectionPath: "",
  expandedPaths: new Set([""]),
  paletteOpen: false,
  setActivePanel: (activePanel) => set({ activePanel }),
  setSelectionPath: (selectionPath) => set({ selectionPath }),
  toggleExpanded: (path) =>
    set((state) => {
      const expandedPaths = new Set(state.expandedPaths);
      if (expandedPaths.has(path)) expandedPaths.delete(path);
      else expandedPaths.add(path);
      return { expandedPaths };
    }),
  expandAll: (paths) => set({ expandedPaths: new Set(["", ...paths]) }),
  collapseAll: () => set({ expandedPaths: new Set([""]) }),
  setPaletteOpen: (paletteOpen) => set({ paletteOpen })
}));
