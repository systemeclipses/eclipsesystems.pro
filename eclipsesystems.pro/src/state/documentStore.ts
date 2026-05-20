import { create } from "zustand";
import type { Operation } from "fast-json-patch";
import { Document } from "@core/document";
import type { DocumentError, JsonNode, JsonValue } from "@core/types";
import { parseInWorker } from "@workers/client";
import { useSettingsStore } from "./settingsStore";

type DocumentState = {
  document: Document;
  text: string;
  root: JsonNode | null;
  value: JsonValue | undefined;
  errors: DocumentError[];
  dirty: boolean;
  undoDepth: number;
  redoDepth: number;
  setText: (text: string) => void;
  applyPatch: (patch: Operation[]) => void;
  undo: () => void;
  redo: () => void;
  markClean: () => void;
};

const document = new Document();

function snapshot(doc: Document) {
  return {
    text: doc.getText(),
    root: doc.getRoot(),
    value: doc.getValue(),
    errors: doc.getErrors(),
    dirty: doc.isDirty(),
    undoDepth: doc.getUndoDepth(),
    redoDepth: doc.getRedoDepth()
  };
}

export const useDocumentStore = create<DocumentState>((set) => {
  document.subscribe(() => set(snapshot(document)));
  return {
    document,
    ...snapshot(document),
    setText: (text) => {
      document.setRawText(text);
      void parseInWorker(text, useSettingsStore.getState().mode).then((result) => {
        if (result) document.acceptParseResult(result);
      });
    },
    applyPatch: (patch) => document.applyPatch(patch),
    undo: () => document.undo(),
    redo: () => document.redo(),
    markClean: () => document.markClean()
  };
});
