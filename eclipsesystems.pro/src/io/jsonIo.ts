import { getValueByPointer } from "fast-json-patch";
import type { Document } from "@core/document";
import type { JsonValue } from "@core/types";

export type ImportSource = "file" | "drop" | "clipboard" | "url";

export async function importFromFile(file: File) {
  return { source: "file" as const, name: file.name, text: await file.text() };
}

export async function importFromFilePicker() {
  if (!window.showOpenFilePicker) throw new Error("File picker API is unavailable in this browser");
  const [handle] = await window.showOpenFilePicker({
    multiple: false,
    types: [{ description: "JSON", accept: { "application/json": [".json"] } }]
  });
  const file = await handle.getFile();
  return importFromFile(file);
}

export async function importFromClipboard() {
  return { source: "clipboard" as const, name: "clipboard.json", text: await navigator.clipboard.readText() };
}

export async function importFromUrl(url: string) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Unable to fetch ${url}: ${response.status}`);
  return { source: "url" as const, name: url, text: await response.text() };
}

export function bindWindowDrop(onText: (text: string) => void) {
  const prevent = (event: DragEvent) => {
    event.preventDefault();
  };
  const drop = (event: DragEvent) => {
    event.preventDefault();
    const file = event.dataTransfer?.files.item(0);
    if (!file) return;
    void file.text().then(onText);
  };
  window.addEventListener("dragover", prevent);
  window.addEventListener("drop", drop);
  return () => {
    window.removeEventListener("dragover", prevent);
    window.removeEventListener("drop", drop);
  };
}

export function downloadJson(document: Document, filename = "document.json") {
  const blob = new Blob([document.getText()], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = documentRef().createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export async function copyDocument(document: Document) {
  await navigator.clipboard.writeText(document.getText());
}

export async function copyPath(path: string) {
  await navigator.clipboard.writeText(path || "/");
}

export async function copySubtree(document: Document, path: string) {
  const value = getValueByPointer(document.getValue() as JsonValue, path) as JsonValue | undefined;
  await navigator.clipboard.writeText(JSON.stringify(value, null, 2));
}

function documentRef() {
  return globalThis.document;
}
