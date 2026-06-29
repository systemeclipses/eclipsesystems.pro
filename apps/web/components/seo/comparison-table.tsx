export type ComparisonColumn = { key: string; label: string };
export type ComparisonRow = { label: string; cells: Record<string, string> };

export function ComparisonTable({ columns, rows, caption }: { columns: ComparisonColumn[]; rows: ComparisonRow[]; caption: string }) {
  return (
    <div className="mt-8 overflow-x-auto rounded-[1.5rem] border border-[#d8d0c1] bg-[#fbfaf6] shadow-xl shadow-[#172219]/5">
      <table className="w-full min-w-[680px] border-collapse text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead className="bg-[#314839] text-left text-[#f9e8d2]">
          <tr>
            <th scope="col" className="p-3 font-semibold">Criteria</th>
            {columns.map((column) => (
              <th key={column.key} scope="col" className="p-3 font-semibold">{column.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.label} className="border-t border-[#d8d0c1] align-top">
              <th scope="row" className="p-3 text-left font-medium">{row.label}</th>
              {columns.map((column) => (
                <td key={column.key} className="p-3 font-semibold text-[#314839]/70">{row.cells[column.key]}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
