import Ajv from "ajv";
import {
  findNodeAtLocation,
  getLocation,
  parse,
  parseTree,
  printParseErrorCode,
  type Node as JsoncNode,
  type ParseError
} from "jsonc-parser";
import { eclipseJsonSchema } from "./schema";
import { escapePathSegment, joinPath, splitPath } from "./jsonPointer";
import type { DocumentError, JsonNode, JsonNodeType, JsonValue, ParseMode, ParseResult } from "./types";

const ajv = new Ajv({ allErrors: true, strict: false });
const validateEclipseJson = ajv.compile(eclipseJsonSchema);

function getLineColumn(text: string, offset: number) {
  let line = 1;
  let column = 1;
  for (let index = 0; index < Math.min(offset, text.length); index += 1) {
    if (text[index] === "\n") {
      line += 1;
      column = 1;
    } else {
      column += 1;
    }
  }
  return { line, column };
}

function nodeType(node: JsoncNode): JsonNodeType {
  if (node.type === "object" || node.type === "array") return node.type;
  if (node.type === "string" || node.type === "number" || node.type === "boolean") return node.type;
  return "null";
}

function previewValue(value: unknown): string {
  if (value === undefined) return "";
  if (value === null) return "null";
  if (Array.isArray(value)) return `${value.length} items`;
  if (typeof value === "object") return `${Object.keys(value as Record<string, unknown>).length} keys`;
  const rendered = JSON.stringify(value);
  return rendered.length > 80 ? `${rendered.slice(0, 77)}...` : rendered;
}

function buildNode(node: JsoncNode, path: string, key: string | number | null): JsonNode {
  const value = node.value as JsonValue | undefined;
  const children: JsonNode[] = [];

  if (node.type === "object") {
    for (const property of node.children ?? []) {
      const propertyKey = String(property.children?.[0]?.value ?? "");
      const propertyValue = property.children?.[1];
      if (propertyValue) children.push(buildNode(propertyValue, joinPath(path, propertyKey), propertyKey));
    }
  }

  if (node.type === "array") {
    (node.children ?? []).forEach((child, index) => {
      children.push(buildNode(child, joinPath(path, index), index));
    });
  }

  return {
    path,
    key,
    type: nodeType(node),
    value,
    preview: previewValue(value),
    offset: node.offset,
    length: node.length,
    children
  };
}

function schemaErrors(text: string, value: JsonValue | undefined): DocumentError[] {
  if (value === undefined) return [];
  const valid = validateEclipseJson(value);
  if (valid) return [];
  return (validateEclipseJson.errors ?? []).map((error) => {
    const path = error.instancePath || "";
    const node = findJsoncNodeAtPath(text, path);
    const offset = node?.offset ?? 0;
    const pos = getLineColumn(text, offset);
    return {
      source: "schema",
      message: error.message ?? "Schema validation failed",
      line: pos.line,
      column: pos.column,
      offset,
      path
    };
  });
}

export function parseDocument(text: string, mode: ParseMode = "tolerant"): ParseResult {
  const errors: ParseError[] = [];
  const allowTrailingComma = mode === "tolerant";
  const disallowComments = mode === "strict";
  const value = parse(text, errors, { allowTrailingComma, disallowComments }) as JsonValue | undefined;
  const rootTree = parseTree(text, errors, { allowTrailingComma, disallowComments });

  const parseErrors: DocumentError[] = errors.map((error) => {
    const pos = getLineColumn(text, error.offset);
    return {
      source: "parse",
      message: printParseErrorCode(error.error),
      line: pos.line,
      column: pos.column,
      offset: error.offset
    };
  });

  return {
    text,
    root: rootTree ? buildNode(rootTree, "", null) : null,
    value,
    errors: [...parseErrors, ...(parseErrors.length === 0 ? schemaErrors(text, value) : [])]
  };
}

export function findJsoncNodeAtPath(text: string, path: string): JsoncNode | undefined {
  const root = parseTree(text);
  if (!root) return undefined;
  return findNodeAtLocation(root, splitPath(path));
}

export function getPathAtOffsetFromText(text: string, offset: number): string {
  const path = getLocation(text, offset).path.map(escapePathSegment).join("/");
  return path ? `/${path}` : "";
}
