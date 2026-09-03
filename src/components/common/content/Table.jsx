import React from "react";
import { cn } from "../../../utils/cn";

export function Table({
  columns = [],
  data = [],
  loading = false,
  emptyMessage = "No records found.",
  emptyState = null,
  onRowClick,
  selectable = false,
  selectedRows = [],
  onSelectRow,
  onSelectAll,
  rowKey = "id",
  hoverable = true,
  striped = false,
  className = "",
  containerClassName = "",
  ...props
}) {
  const allSelected =
    data.length > 0 &&
    data.every((row) => selectedRows.includes(row[rowKey] !== undefined ? row[rowKey] : row));

  const someSelected =
    data.some((row) => selectedRows.includes(row[rowKey] !== undefined ? row[rowKey] : row)) &&
    !allSelected;

  const handleSelectAll = (e) => {
    onSelectAll?.(e.target.checked);
  };

  const handleSelectRow = (e, row) => {
    e.stopPropagation();
    const key = row[rowKey] !== undefined ? row[rowKey] : row;
    onSelectRow?.(key, row);
  };

  return (
    <div
      className={cn(
        "w-full overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm",
        containerClassName
      )}
    >
      <table
        className={cn("w-full text-left text-sm text-gray-700 divide-y divide-gray-200", className)}
        {...props}
      >
        <thead className="bg-gray-50 text-xs uppercase font-semibold text-gray-500 tracking-wider">
          <tr>
            {selectable && (
              <th scope="col" className="w-10 px-4 py-3 text-center">
                <input
                  type="checkbox"
                  checked={allSelected}
                  ref={(input) => {
                    if (input) input.indeterminate = someSelected;
                  }}
                  onChange={handleSelectAll}
                  aria-label="Select all rows"
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
              </th>
            )}
            {columns.map((col, idx) => (
              <th
                key={col.key || idx}
                scope="col"
                style={{ width: col.width }}
                className={cn(
                  "px-4 py-3.5 select-none",
                  col.align === "center" && "text-center",
                  col.align === "right" && "text-right",
                  col.headerClassName
                )}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>

        <tbody className="divide-y divide-gray-200 bg-white">
          {loading ? (
            <tr>
              <td
                colSpan={columns.length + (selectable ? 1 : 0)}
                className="py-12 text-center text-gray-400"
              >
                <div className="flex flex-col items-center justify-center gap-2">
                  <svg
                    className="w-6 h-6 animate-spin text-blue-600"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span className="text-sm font-medium text-gray-500">Loading data...</span>
                </div>
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length + (selectable ? 1 : 0)}
                className="py-12 text-center text-gray-500"
              >
                {emptyState || (
                  <div className="flex flex-col items-center justify-center gap-2">
                    <svg
                      className="w-8 h-8 text-gray-300"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="1.5"
                        d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                      />
                    </svg>
                    <span className="text-sm">{emptyMessage}</span>
                  </div>
                )}
              </td>
            </tr>
          ) : (
            data.map((row, rowIdx) => {
              const rowIdentifier = row[rowKey] !== undefined ? row[rowKey] : rowIdx;
              const isSelected = selectedRows.includes(rowIdentifier);

              return (
                <tr
                  key={rowIdentifier}
                  onClick={() => onRowClick?.(row, rowIdx)}
                  className={cn(
                    "transition-colors duration-150",
                    striped && rowIdx % 2 === 1 && "bg-gray-50/50",
                    hoverable && "hover:bg-blue-50/40",
                    isSelected && "bg-blue-50/80 font-medium",
                    onRowClick && "cursor-pointer"
                  )}
                >
                  {selectable && (
                    <td className="w-10 px-4 py-3.5 text-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => handleSelectRow(e, row)}
                        aria-label={`Select row ${rowIdx + 1}`}
                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                    </td>
                  )}
                  {columns.map((col, colIdx) => (
                    <td
                      key={col.key || colIdx}
                      className={cn(
                        "px-4 py-3.5 text-sm text-gray-700",
                        col.align === "center" && "text-center",
                        col.align === "right" && "text-right",
                        col.cellClassName
                      )}
                    >
                      {col.render
                        ? col.render(row[col.key], row, rowIdx)
                        : row[col.key] !== undefined && row[col.key] !== null
                        ? String(row[col.key])
                        : "—"}
                    </td>
                  ))}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}

export default Table;
