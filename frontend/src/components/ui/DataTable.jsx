"use client";

import { AlertCircle, ArrowDown, ArrowUp, ArrowUpDown, RefreshCw } from "lucide-react";
import TableSkeleton from "@/components/ui/TableSkeleton";
import EmptyState from "@/components/ui/EmptyState";

export default function DataTable({
  columns,
  rows,
  keyField = "id",
  isLoading,
  error,
  onRetry,
  emptyLabel = "No records found.",
  onRowClick,
  sortConfig,
  onSortChange,
  size = "base",
}) {
  if (isLoading) {
    return <TableSkeleton columns={columns.length} />;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
        <div className="w-10 h-10 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl flex items-center justify-center">
          <AlertCircle className="w-5 h-5" />
        </div>
        <p className={`${size === "lg" ? "text-sm" : "text-xs"} text-stone-500 font-light`}>{error}</p>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className={`inline-flex items-center gap-2 px-4 py-2 bg-stone-900 hover:bg-stone-800 text-stone-100 font-bold font-mono ${size === "lg" ? "text-xs" : "text-[11px]"} uppercase tracking-wider rounded-lg transition`}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Retry
          </button>
        )}
      </div>
    );
  }

  if (!rows || rows.length === 0) {
    return <EmptyState label={emptyLabel} size={size} />;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-stone-200">
            {columns.map((column) => {
              const isSortable = Boolean(column.sortable && onSortChange);
              const isActive = isSortable && sortConfig?.key === column.key;
              return (
                <th
                  key={column.key}
                  className={`py-3 px-3 ${size === "lg" ? "text-sm" : "text-xs"} font-mono uppercase tracking-wider text-stone-500 font-bold whitespace-nowrap`}
                >
                  {isSortable ? (
                    <button
                      type="button"
                      onClick={() => onSortChange(column.key)}
                      className="inline-flex items-center gap-1 hover:text-stone-800 transition-colors cursor-pointer"
                      aria-label={`Sort by ${column.header}`}
                    >
                      {column.header}
                      {isActive ? (
                        sortConfig.direction === "asc" ? (
                          <ArrowUp className="w-3 h-3" />
                        ) : (
                          <ArrowDown className="w-3 h-3" />
                        )
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-stone-300" />
                      )}
                    </button>
                  ) : (
                    column.header
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row[keyField]}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              className={`border-b border-stone-100 hover:bg-stone-50/60 transition-colors ${
                onRowClick ? "cursor-pointer" : ""
              }`}
            >
              {columns.map((column) => (
                <td
                  key={column.key}
                  className={`py-3 px-3 ${size === "lg" ? "text-sm" : "text-xs"} text-stone-700 align-middle`}
                >
                  {column.render ? column.render(row) : row[column.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
