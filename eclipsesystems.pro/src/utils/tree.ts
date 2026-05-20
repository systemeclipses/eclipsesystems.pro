import type { JsonNode } from "@core/types";

export function flattenTree(root: JsonNode | null, expanded: Set<string>) {
  const rows: Array<{ node: JsonNode; depth: number }> = [];
  const visit = (node: JsonNode, depth: number) => {
    rows.push({ node, depth });
    if (!expanded.has(node.path)) return;
    node.children.forEach((child) => visit(child, depth + 1));
  };
  if (root) visit(root, 0);
  return rows;
}

export function collectPaths(root: JsonNode | null) {
  const paths: string[] = [];
  const visit = (node: JsonNode) => {
    paths.push(node.path);
    node.children.forEach(visit);
  };
  if (root) visit(root);
  return paths;
}
