import type { Operation } from "fast-json-patch";

export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };

export type JsonNodeType = "object" | "array" | "string" | "number" | "boolean" | "null";

export type JsonNode = {
  path: string;
  key: string | number | null;
  type: JsonNodeType;
  value: JsonValue | undefined;
  preview: string;
  offset: number;
  length: number;
  children: JsonNode[];
};

export type DocumentError = {
  source: "parse" | "schema";
  message: string;
  line: number;
  column: number;
  offset: number;
  path?: string;
};

export type DocumentChange = {
  text: string;
  value: JsonValue | undefined;
  errors: DocumentError[];
  dirty: boolean;
  patch?: Operation[];
};

export type PatchFrame = {
  forward: Operation[];
  inverse: Operation[];
};

export type ParseResult = {
  text: string;
  root: JsonNode | null;
  value: JsonValue | undefined;
  errors: DocumentError[];
};

export type ParseMode = "strict" | "tolerant";
