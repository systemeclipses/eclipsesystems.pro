import { useEffect, useMemo, useRef, useState } from "react";
import { commands } from "@commands/registry";
import { useUiStore } from "@state/uiStore";

export function CommandPalette() {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const open = useUiStore((state) => state.paletteOpen);
  const setOpen = useUiStore((state) => state.setPaletteOpen);
  const [query, setQuery] = useState("");

  const visibleCommands = useMemo(
    () =>
      commands.filter((command) => command.name.toLowerCase().includes(query.trim().toLowerCase())),
    [query]
  );

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
      if (event.key === "Tab") {
        const focusable = Array.from(
          document.querySelectorAll<HTMLElement>("[data-palette] input, [data-palette] button")
        );
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (!first || !last) return;
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, setOpen]);

  if (!open) return null;

  return (
    <div className="modal-backdrop" role="presentation">
      <section
        className="command-palette"
        role="dialog"
        aria-modal="true"
        aria-labelledby="palette-title"
        data-palette
      >
        <h2 id="palette-title">Command Palette</h2>
        <input
          ref={inputRef}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Type a command"
          aria-label="Search commands"
        />
        <ul>
          {visibleCommands.map((command) => (
            <li key={command.id}>
              <button
                type="button"
                onClick={() => {
                  void command.handler({ openPalette: () => setOpen(true), closePalette: () => setOpen(false) });
                  setOpen(false);
                }}
              >
                <span>{command.name}</span>
                {command.shortcut ? <kbd>{command.shortcut}</kbd> : null}
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
