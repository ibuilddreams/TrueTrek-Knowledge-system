"use client";

import { AlertCircle, RefreshCw } from "lucide-react";
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
        <p className="text-xs text-stone-500 font-light">{error}</p>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center gap-2 px-4 py-2 bg-stone-900 hover:bg-stone-800 text-stone-100 font-bold font-mono text-[11px] uppercase tracking-wider rounded-lg transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Retry
          </button>
        )}
      </div>
    );
  }

  if (!rows || rows.length === 0) {
    return <EmptyState label={emptyLabel} />;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-stone-200">
            {columns.map((column) => (
              <th
                key={column.key}
                className="py-3 px-3 text-[10px] font-mono uppercase tracking-wider text-stone-400 font-semibold whitespace-nowrap"
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row[keyField]} className="border-b border-stone-100 hover:bg-stone-50/60 transition-colors">
              {columns.map((column) => (
                <td key={column.key} className="py-3 px-3 text-xs text-stone-700 align-middle">
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
