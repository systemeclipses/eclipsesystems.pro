import { useEffect } from "react";
import { bindKeyboardCommands } from "@commands/keyboard";
import { bindWindowDrop } from "@io/jsonIo";
import { useDocumentStore } from "@state/documentStore";
import { useSettingsStore } from "@state/settingsStore";
import { useUiStore } from "@state/uiStore";
import { ErrorPanel } from "@ui/components/ErrorPanel";
import { JsonEditor } from "@ui/components/JsonEditor";
import { TreeView } from "@ui/components/TreeView";
import { WorkspaceToolbar } from "@ui/components/WorkspaceToolbar";

export function ToolRoute() {
  const setText = useDocumentStore((state) => state.setText);
  const document = useDocumentStore((state) => state.document);
  const mode = useSettingsStore((state) => state.mode);
  const indent = useSettingsStore((state) => state.indent);
  const setPaletteOpen = useUiStore((state) => state.setPaletteOpen);

  useEffect(() => bindWindowDrop(setText), [setText]);
  useEffect(
    () =>
      bindKeyboardCommands({
        openPalette: () => setPaletteOpen(true),
        closePalette: () => setPaletteOpen(false)
      }),
    [setPaletteOpen]
  );
  useEffect(() => document.setMode(mode), [document, mode]);
  useEffect(() => document.setIndent(indent), [document, indent]);

  return (
    <>
      <WorkspaceToolbar />
      <div className="workspace">
        <section className="panel editor-panel" aria-labelledby="editor-title">
          <div className="panel-header">
            <h2 id="editor-title">Editor</h2>
            <span>Worker-backed parser</span>
          </div>
          <JsonEditor />
        </section>
        <TreeView />
        <ErrorPanel />
      </div>
    </>
  );
}
