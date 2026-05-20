import { applyPatch as applyJsonPatch, compare, getValueByPointer, type Operation } from "fast-json-patch";
import { parseDocument } from "./parser";
import type {
  DocumentChange,
  DocumentError,
  JsonNode,
  JsonValue,
  ParseMode,
  ParseResult,
  PatchFrame
} from "./types";

type Listener = (change: DocumentChange) => void;

function cloneValue(value: JsonValue | undefined): JsonValue | undefined {
  return value === undefined ? undefined : (structuredClone(value) as JsonValue);
}

function stringify(value: JsonValue | undefined, indent = 2) {
  return value === undefined ? "" : `${JSON.stringify(value, null, indent)}\n`;
}

function invertPatch(before: JsonValue | undefined, patch: Operation[]): Operation[] {
  return [...patch].reverse().map((operation) => {
    if (operation.op === "add") {
      return { op: "remove", path: operation.path } satisfies Operation;
    }
    if (operation.op === "remove") {
      return {
        op: "add",
        path: operation.path,
        value: cloneValue(getValueByPointer(before, operation.path) as JsonValue)
      } satisfies Operation;
    }
    if (operation.op === "replace") {
      return {
        op: "replace",
        path: operation.path,
        value: cloneValue(getValueByPointer(before, operation.path) as JsonValue)
      } satisfies Operation;
    }
    throw new Error(`Unsupported undo operation: ${operation.op}`);
  });
}

export class Document {
  private text = "";
  private root: JsonNode | null = null;
  private value: JsonValue | undefined;
  private errors: DocumentError[] = [];
  private dirty = false;
  private undoStack: PatchFrame[] = [];
  private redoStack: PatchFrame[] = [];
  private listeners = new Set<Listener>();
  private mode: ParseMode;
  private indent: number;

  constructor(text = "{\n  \"plan_code\": \"suite\",\n  \"billing_interval\": \"month\",\n  \"seats\": 2\n}\n", options: { mode?: ParseMode; indent?: number } = {}) {
    this.mode = options.mode ?? "tolerant";
    this.indent = options.indent ?? 2;
    this.reparse(text);
  }

  subscribe(listener: Listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  setText(text: string) {
    const previousValue = cloneValue(this.value);
    this.reparse(text);
    if (previousValue !== undefined && this.value !== undefined && this.errors.every((error) => error.source !== "parse")) {
      const forward = compare(previousValue as object, this.value as object);
      if (forward.length > 0) {
        this.undoStack.push({ forward, inverse: invertPatch(previousValue, forward) });
        this.redoStack = [];
      }
    }
    this.dirty = true;
    this.emit();
  }

  setRawText(text: string) {
    this.text = text;
    this.dirty = true;
    this.emit();
  }

  acceptParseResult(result: ParseResult) {
    if (result.text !== this.text) return;
    const previousValue = cloneValue(this.value);
    this.root = result.root;
    this.value = result.value;
    this.errors = result.errors;

    if (previousValue !== undefined && this.value !== undefined && this.errors.every((error) => error.source !== "parse")) {
      const forward = compare(previousValue as object, this.value as object);
      if (forward.length > 0) {
        this.undoStack.push({ forward, inverse: invertPatch(previousValue, forward) });
        this.redoStack = [];
      }
    }

    this.dirty = true;
    this.emit();
  }

  setMode(mode: ParseMode) {
    this.mode = mode;
    this.reparse(this.text);
    this.emit();
  }

  setIndent(indent: number) {
    this.indent = indent;
    this.reparse(this.text);
    this.emit();
  }

  getText() {
    return this.text;
  }

  getValue() {
    return cloneValue(this.value);
  }

  getRoot() {
    return this.root;
  }

  isDirty() {
    return this.dirty;
  }

  markClean() {
    this.dirty = false;
    this.emit();
  }

  getErrors() {
    return [...this.errors];
  }

  getUndoDepth() {
    return this.undoStack.length;
  }

  getRedoDepth() {
    return this.redoStack.length;
  }

  getNodeAtPath(path: string): JsonNode | null {
    if (!this.root) return null;
    if (path === "") return this.root;
    const queue = [this.root];
    while (queue.length > 0) {
      const node = queue.shift();
      if (!node) continue;
      if (node.path === path) return node;
      queue.push(...node.children);
    }
    return null;
  }

  getPathAtOffset(offset: number) {
    const root = this.root;
    if (!root) return "";
    let best = root;
    const visit = (node: JsonNode) => {
      if (offset >= node.offset && offset <= node.offset + node.length && node.length <= best.length) {
        best = node;
      }
      node.children.forEach(visit);
    };
    visit(root);
    return best.path;
  }

  applyPatch(patch: Operation[]) {
    if (this.value === undefined) throw new Error("Cannot patch an invalid document");
    const before = cloneValue(this.value);
    const next = applyJsonPatch(cloneValue(this.value), patch, true, false).newDocument as JsonValue;
    this.undoStack.push({ forward: patch, inverse: invertPatch(before, patch) });
    this.redoStack = [];
    this.reparse(stringify(next, this.indent));
    this.dirty = true;
    this.emit(patch);
  }

  undo() {
    const frame = this.undoStack.pop();
    if (!frame || this.value === undefined) return;
    const next = applyJsonPatch(cloneValue(this.value), frame.inverse, true, false).newDocument as JsonValue;
    this.redoStack.push(frame);
    this.reparse(stringify(next, this.indent));
    this.dirty = true;
    this.emit(frame.inverse);
  }

  redo() {
    const frame = this.redoStack.pop();
    if (!frame || this.value === undefined) return;
    const next = applyJsonPatch(cloneValue(this.value), frame.forward, true, false).newDocument as JsonValue;
    this.undoStack.push(frame);
    this.reparse(stringify(next, this.indent));
    this.dirty = true;
    this.emit(frame.forward);
  }

  private reparse(text: string) {
    const result = parseDocument(text, this.mode);
    this.text = result.text;
    this.root = result.root;
    this.value = result.value;
    this.errors = result.errors;
  }

  private emit(patch?: Operation[]) {
    const change: DocumentChange = {
      text: this.text,
      value: cloneValue(this.value),
      errors: this.getErrors(),
      dirty: this.dirty,
      patch
    };
    this.listeners.forEach((listener) => listener(change));
  }
}
