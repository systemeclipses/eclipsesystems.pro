import { commands } from "@commands/registry";
import type { Command } from "@commands/types";
import { useDocumentStore } from "@state/documentStore";
import { useSettingsStore } from "@state/settingsStore";
import { useUiStore } from "@state/uiStore";

const commandIds = [
  "open",
  "paste-json",
  "save",
  "undo",
  "redo",
  "copy-path",
  "copy-value",
  "expand-all",
  "collapse-all",
  "toggle-theme"
] as const;

export function WorkspaceToolbar() {
  const mode = useSettingsStore((state) => state.mode);
  const indent = useSettingsStore((state) => state.indent);
  const setMode = useSettingsStore((state) => state.setMode);
  const setIndent = useSettingsStore((state) => state.setIndent);
  const errors = useDocumentStore((state) => state.errors);
  const selectionPath = useUiStore((state) => state.selectionPath);
  const setPaletteOpen = useUiStore((state) => state.setPaletteOpen);

  const selectedCommands = commandIds
    .map((id) => commands.find((command) => command.id === id))
    .filter((command): command is Command => Boolean(command));

  return (
    <section className="workspace-hero" aria-labelledby="tool-title">
      <div className="hero-copy">
        <p className="eyebrow">Client-side JSON</p>
        <h2 id="tool-title">Read, repair, and understand structured data at speed.</h2>
        <p>
          Parse work runs off the main thread, the tree is virtualized, and every edit stays tied
          to JSON Pointer paths, schema feedback, and patch-safe history.
        </p>
      </div>
      <div className="hero-status" aria-label="Document status">
        <div>
          <span className="status-number">{errors.length}</span>
          <span className="status-label">issues</span>
        </div>
        <div>
          <span className="status-path">{selectionPath || "/"}</span>
          <span className="status-label">selected path</span>
        </div>
      </div>
      <div className="toolbar" aria-label="JSON commands">
        {selectedCommands.map((command) => (
          <button
            key={command.id}
            type="button"
            className="tool-button"
            onClick={() =>
              void command.handler({
                openPalette: () => setPaletteOpen(true),
                closePalette: () => setPaletteOpen(false)
              })
            }
          >
            {command.name}
          </button>
        ))}
        <button type="button" className="tool-button primary" onClick={() => setPaletteOpen(true)}>
          Command K
        </button>
        <label className="control-pill">
          <span>Mode</span>
          <select value={mode} onChange={(event) => setMode(event.target.value === "strict" ? "strict" : "tolerant")}>
            <option value="tolerant">Tolerant</option>
            <option value="strict">Strict</option>
          </select>
        </label>
        <label className="control-pill">
          <span>Indent</span>
          <select value={indent} onChange={(event) => setIndent(Number(event.target.value))}>
            <option value={2}>2</option>
            <option value={4}>4</option>
          </select>
        </label>
      </div>
    </section>
  );
}
