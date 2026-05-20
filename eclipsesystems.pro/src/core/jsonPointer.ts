export function escapePathSegment(segment: string | number): string {
  return String(segment).replace(/~/g, "~0").replace(/\//g, "~1");
}

export function unescapePathSegment(segment: string): string {
  return segment.replace(/~1/g, "/").replace(/~0/g, "~");
}

export function joinPath(parent: string, segment: string | number): string {
  const escaped = escapePathSegment(segment);
  return parent === "" ? `/${escaped}` : `${parent}/${escaped}`;
}

export function splitPath(path: string): string[] {
  if (path === "") return [];
  return path
    .replace(/^\//, "")
    .split("/")
    .map(unescapePathSegment);
}
