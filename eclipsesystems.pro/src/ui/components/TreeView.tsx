import { useVirtualizer } from "@tanstack/react-virtual";
import { useMemo, useRef, type KeyboardEvent } from "react";
import { useDocumentStore } from "@state/documentStore";
import { useUiStore } from "@state/uiStore";
import { flattenTree } from "@utils/tree";

export function TreeView() {
  const parentRef = useRef<HTMLDivElement | null>(null);
  const root = useDocumentStore((state) => state.root);
  const errors = useDocumentStore((state) => state.errors);
  const expandedPaths = useUiStore((state) => state.expandedPaths);
  const selectionPath = useUiStore((state) => state.selectionPath);
  const toggleExpanded = useUiStore((state) => state.toggleExpanded);
  const setSelectionPath = useUiStore((state) => state.setSelectionPath);

  const rows = useMemo(() => flattenTree(root, expandedPaths), [root, expandedPaths]);
  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 32,
    overscan: 12
  });

  const selectedIndex = Math.max(
    0,
    rows.findIndex(({ node }) => node.path === selectionPath)
  );

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const current = rows[selectedIndex];
    if (!current) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setSelectionPath(rows[Math.min(rows.length - 1, selectedIndex + 1)]?.node.path ?? "");
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setSelectionPath(rows[Math.max(0, selectedIndex - 1)]?.node.path ?? "");
    }
    if (event.key === "ArrowRight" || event.key === "Enter") {
      event.preventDefault();
      if (current.node.children.length > 0 && !expandedPaths.has(current.node.path)) {
        toggleExpanded(current.node.path);
      }
    }
    if (event.key === "ArrowLeft" || event.key === "Escape") {
      event.preventDefault();
      if (expandedPaths.has(current.node.path)) toggleExpanded(current.node.path);
    }
  }

  return (
    <section className="panel tree-panel" aria-labelledby="tree-title">
      <div className="panel-header">
        <h2 id="tree-title">Tree</h2>
        <span aria-live="polite">{rows.length} nodes</span>
      </div>
      <div
        ref={parentRef}
        className="tree-viewport"
        role="tree"
        tabIndex={0}
        aria-label="JSON tree"
        onKeyDown={onKeyDown}
      >
        <div style={{ height: `${rowVirtualizer.getTotalSize()}px`, position: "relative" }}>
          {rowVirtualizer.getVirtualItems().map((virtualRow) => {
            const row = rows[virtualRow.index];
            const hasError = errors.some((error) => error.path === row.node.path);
            const expanded = expandedPaths.has(row.node.path);
            return (
              <button
                key={row.node.path || "root"}
                type="button"
                role="treeitem"
                aria-selected={selectionPath === row.node.path}
                aria-expanded={row.node.children.length > 0 ? expanded : undefined}
                className="tree-row"
                style={{
                  transform: `translateY(${virtualRow.start}px)`,
                  paddingLeft: `${8 + row.depth * 18}px`
                }}
                onClick={() => setSelectionPath(row.node.path)}
                onDoubleClick={() => toggleExpanded(row.node.path)}
              >
                <span className="tree-caret">{row.node.children.length > 0 ? (expanded ? "v" : ">") : ""}</span>
                <span className="tree-key">{row.node.key ?? "$"}</span>
                <span className="type-badge">{row.node.type}</span>
                <span className="tree-preview">{row.node.preview}</span>
                {hasError ? <span className="error-badge">!</span> : null}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
