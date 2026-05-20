import { json } from "@codemirror/lang-json";
import { bracketMatching, syntaxHighlighting, defaultHighlightStyle } from "@codemirror/language";
import { linter, lintGutter, type Diagnostic } from "@codemirror/lint";
import { EditorState } from "@codemirror/state";
import { EditorView, keymap, lineNumbers } from "@codemirror/view";
import { defaultKeymap, historyKeymap } from "@codemirror/commands";
import { useEffect, useRef } from "react";
import { useDocumentStore } from "@state/documentStore";
import { useUiStore } from "@state/uiStore";

export function JsonEditor() {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const viewRef = useRef<EditorView | null>(null);
  const text = useDocumentStore((state) => state.text);
  const document = useDocumentStore((state) => state.document);
  const setText = useDocumentStore((state) => state.setText);
  const setSelectionPath = useUiStore((state) => state.setSelectionPath);

  useEffect(() => {
    if (!hostRef.current || viewRef.current) return;

    const view = new EditorView({
      parent: hostRef.current,
      state: EditorState.create({
        doc: text,
        extensions: [
          lineNumbers(),
          lintGutter(),
          json(),
          bracketMatching(),
          syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
          keymap.of([...defaultKeymap, ...historyKeymap]),
          linter(() =>
            useDocumentStore.getState().errors.map(
              (error): Diagnostic => ({
                from: Math.max(0, error.offset),
                to: Math.max(0, error.offset + 1),
                severity: error.source === "parse" ? "error" : "warning",
                message: error.message
              })
            )
          ),
          EditorView.updateListener.of((update) => {
            if (update.docChanged) {
              setText(update.state.doc.toString());
            }
            if (update.selectionSet || update.docChanged) {
              setSelectionPath(document.getPathAtOffset(update.state.selection.main.head));
            }
          })
        ]
      })
    });

    viewRef.current = view;
    return () => {
      view.destroy();
      viewRef.current = null;
    };
  }, [document, setSelectionPath, setText, text]);

  useEffect(() => {
    const view = viewRef.current;
    if (!view || view.state.doc.toString() === text) return;
    view.dispatch({
      changes: { from: 0, to: view.state.doc.length, insert: text }
    });
  }, [text]);

  return <div ref={hostRef} className="editor-surface" aria-label="JSON text editor" />;
}
