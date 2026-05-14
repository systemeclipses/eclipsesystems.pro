export type ComparisonColumn = { key: string; label: string };
export type ComparisonRow = { label: string; cells: Record<string, string> };

export function ComparisonTable({ columns, rows, caption }: { columns: ComparisonColumn[]; rows: ComparisonRow[]; caption: string }) {
  return (
    <div className="mt-6 overflow-x-auto rounded-lg border border-border">
      <table className="w-full min-w-[680px] border-collapse text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead className="bg-muted text-left">
          <tr>
            <th scope="col" className="p-3 font-semibold">Criteria</th>
            {columns.map((column) => (
              <th key={column.key} scope="col" className="p-3 font-semibold">{column.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.label} className="border-t border-border align-top">
              <th scope="row" className="p-3 text-left font-medium">{row.label}</th>
              {columns.map((column) => (
                <td key={column.key} className="p-3 text-muted-foreground">{row.cells[column.key]}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
