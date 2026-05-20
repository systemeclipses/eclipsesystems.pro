import { commands, findCommandByShortcut } from "./registry";
import type { CommandContext } from "./types";

function normalizeShortcut(event: KeyboardEvent) {
  const parts = [];
  if (event.metaKey || event.ctrlKey) parts.push("Mod");
  if (event.shiftKey) parts.push("Shift");
  if (event.altKey) parts.push("Alt");
  const key = event.key.length === 1 ? event.key.toUpperCase() : event.key;
  parts.push(key);
  return parts.join("+");
}

export function bindKeyboardCommands(context: CommandContext) {
  const listener = (event: KeyboardEvent) => {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
      event.preventDefault();
      context.openPalette();
      return;
    }

    const command = findCommandByShortcut(normalizeShortcut(event));
    if (!command) return;
    event.preventDefault();
    void command.handler(context);
  };
  window.addEventListener("keydown", listener);
  return () => window.removeEventListener("keydown", listener);
}

export { commands };
