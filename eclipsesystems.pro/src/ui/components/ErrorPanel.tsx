import { useDocumentStore } from "@state/documentStore";
import { useUiStore } from "@state/uiStore";

export function ErrorPanel() {
  const errors = useDocumentStore((state) => state.errors);
  const setSelectionPath = useUiStore((state) => state.setSelectionPath);

  return (
    <section className="panel error-panel" aria-labelledby="errors-title">
      <div className="panel-header">
        <h2 id="errors-title">Errors</h2>
        <span>{errors.length}</span>
      </div>
      {errors.length === 0 ? (
        <p className="empty-state">No parse or schema errors.</p>
      ) : (
        <ul className="error-list">
          {errors.map((error, index) => (
            <li key={`${error.source}-${error.offset}-${index}`}>
              <button type="button" onClick={() => error.path && setSelectionPath(error.path)}>
                <strong>{error.source}</strong> {error.message}
                <span>
                  line {error.line}, column {error.column}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
