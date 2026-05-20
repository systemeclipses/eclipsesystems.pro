import { copyPath, copySubtree, downloadJson, importFromClipboard, importFromFilePicker } from "@io/jsonIo";
import { useDocumentStore } from "@state/documentStore";
import { useSettingsStore } from "@state/settingsStore";
import { useUiStore } from "@state/uiStore";
import { collectPaths } from "@utils/tree";
import type { Command } from "./types";

export const commands: Command[] = [
  {
    id: "open",
    name: "Open JSON",
    shortcut: "Mod+O",
    handler: async () => {
      const imported = await importFromFilePicker();
      useDocumentStore.getState().setText(imported.text);
    }
  },
  {
    id: "save",
    name: "Save JSON",
    shortcut: "Mod+S",
    handler: () => downloadJson(useDocumentStore.getState().document)
  },
  {
    id: "copy-path",
    name: "Copy Path",
    shortcut: "Mod+Shift+C",
    handler: async () => copyPath(useUiStore.getState().selectionPath)
  },
  {
    id: "copy-value",
    name: "Copy Value",
    shortcut: "Mod+C",
    handler: async () =>
      copySubtree(useDocumentStore.getState().document, useUiStore.getState().selectionPath)
  },
  {
    id: "expand-all",
    name: "Expand All",
    handler: () => useUiStore.getState().expandAll(collectPaths(useDocumentStore.getState().root))
  },
  {
    id: "collapse-all",
    name: "Collapse All",
    handler: () => useUiStore.getState().collapseAll()
  },
  {
    id: "undo",
    name: "Undo",
    shortcut: "Mod+Z",
    handler: () => useDocumentStore.getState().undo()
  },
  {
    id: "redo",
    name: "Redo",
    shortcut: "Mod+Shift+Z",
    handler: () => useDocumentStore.getState().redo()
  },
  {
    id: "toggle-theme",
    name: "Toggle Theme",
    handler: () => {
      const current = useSettingsStore.getState().theme;
      useSettingsStore.getState().setTheme(current === "dark" ? "light" : "dark");
    }
  },
  {
    id: "paste-json",
    name: "Paste JSON",
    handler: async () => {
      const imported = await importFromClipboard();
      useDocumentStore.getState().setText(imported.text);
    }
  }
];

export function findCommandByShortcut(shortcut: string) {
  return commands.find((command) => command.shortcut?.toLowerCase() === shortcut.toLowerCase());
}
