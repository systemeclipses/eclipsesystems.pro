import { describe, expect, it } from "vitest";
import { Document } from "./document";
import { parseDocument } from "./parser";

describe("parseDocument", () => {
  it("parses tolerant JSONC and builds pointer paths", () => {
    const parsed = parseDocument('{\n  // ok\n  "items": [{ "name": "alpha" }],\n}\n');
    expect(parsed.errors).toEqual([]);
    expect(parsed.root?.path).toBe("");
    expect(parsed.root?.children[0]?.path).toBe("/items");
    expect(parsed.root?.children[0]?.children[0]?.children[0]?.path).toBe("/items/0/name");
  });

  it("reports parse errors with line and column", () => {
    const parsed = parseDocument('{\n  "bad": \n}');
    expect(parsed.errors[0]?.source).toBe("parse");
    expect(parsed.errors[0]?.line).toBeGreaterThan(0);
    expect(parsed.errors[0]?.column).toBeGreaterThan(0);
  });

  it("reports schema errors in the shared Eclipse plan shape", () => {
    const parsed = parseDocument('{"plan_code":"starter","billing_interval":"month","seats":0}');
    expect(parsed.errors.some((error) => error.source === "schema")).toBe(true);
  });
});

describe("Document", () => {
  it("looks up nodes by path and offsets", () => {
    const doc = new Document('{"a":{"b":1},"c":true}');
    expect(doc.getNodeAtPath("/a/b")?.value).toBe(1);
    expect(doc.getPathAtOffset(doc.getText().indexOf("1"))).toBe("/a/b");
  });

  it("applies patches", () => {
    const doc = new Document('{"a":1}');
    doc.applyPatch([{ op: "replace", path: "/a", value: 2 }]);
    expect(doc.getNodeAtPath("/a")?.value).toBe(2);
    expect(doc.isDirty()).toBe(true);
  });

  it("undoes across multiple edits and redoes them", () => {
    const doc = new Document('{"a":1,"b":2}');
    doc.applyPatch([{ op: "replace", path: "/a", value: 10 }]);
    doc.applyPatch([{ op: "replace", path: "/b", value: 20 }]);
    doc.undo();
    expect(doc.getNodeAtPath("/b")?.value).toBe(2);
    doc.undo();
    expect(doc.getNodeAtPath("/a")?.value).toBe(1);
    doc.redo();
    expect(doc.getNodeAtPath("/a")?.value).toBe(10);
    doc.redo();
    expect(doc.getNodeAtPath("/b")?.value).toBe(20);
  });

  it("invalidates redo after a new edit", () => {
    const doc = new Document('{"a":1,"b":2}');
    doc.applyPatch([{ op: "replace", path: "/a", value: 10 }]);
    doc.undo();
    expect(doc.getRedoDepth()).toBe(1);
    doc.applyPatch([{ op: "replace", path: "/b", value: 20 }]);
    expect(doc.getRedoDepth()).toBe(0);
  });
});
