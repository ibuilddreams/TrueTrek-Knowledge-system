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
  // "cobalt" renders the portal design's own table — the one `PortalTable`
  // writes by hand — so a screen on the new design keeps DataTable's sorting,
  // loading and error handling instead of reimplementing them. The default is
  // the porcelain table, unchanged, which the admin portal still reads.
  tone = "porcelain",
}) {
  const isCobalt = tone === "cobalt";

  if (isLoading) {
    return <TableSkeleton columns={columns.length} tone={tone} />;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
        <div
          className={
            isCobalt
              ? "grid h-10 w-10 place-items-center rounded-cn-p-sm bg-cn-p-bad-bg text-cn-p-bad"
              : "w-10 h-10 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl flex items-center justify-center"
          }
        >
          <AlertCircle className="w-5 h-5" />
        </div>
        <p
          className={`${size === "lg" ? "text-sm" : "text-xs"} ${
            isCobalt ? "text-cn-p-ink-2" : "text-muted font-light"
          }`}
        >
          {error}
        </p>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className={
              isCobalt
                ? "inline-flex h-9 items-center gap-2 rounded-cn-p-sm bg-cn-p-accent px-3 text-[13px] font-semibold text-white transition hover:bg-cn-p-accent-hover"
                : `inline-flex items-center gap-2 px-4 py-2 bg-pine hover:bg-moss text-paper font-medium font-sans ${size === "lg" ? "text-xs" : "text-[11px]"} uppercase tracking-widest rounded-lg transition`
            }
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Retry
          </button>
        )}
      </div>
    );
  }

  if (!rows || rows.length === 0) {
    return <EmptyState label={emptyLabel} size={size} tone={isCobalt ? "portal" : "porcelain"} />;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className={isCobalt ? "" : "border-b border-line"}>
            {columns.map((column) => {
              const isSortable = Boolean(column.sortable && onSortChange);
              const isActive = isSortable && sortConfig?.key === column.key;
              return (
                <th
                  key={column.key}
                  className={
                    isCobalt
                      ? "border-b border-cn-p-line bg-cn-p-page px-4 py-3 text-left text-xs font-semibold whitespace-nowrap text-cn-p-ink-2"
                      : `py-3 px-3 ${size === "lg" ? "text-sm" : "text-xs"} font-sans uppercase tracking-widest text-muted font-medium whitespace-nowrap`
                  }
                >
                  {isSortable ? (
                    <button
                      type="button"
                      onClick={() => onSortChange(column.key)}
                      className={`inline-flex items-center gap-1 cursor-pointer transition-colors ${
                        isCobalt ? "hover:text-cn-p-ink" : "hover:text-ink"
                      }`}
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
                        <ArrowUpDown
                          className={`w-3 h-3 ${isCobalt ? "text-cn-p-line-2" : "text-muted/40"}`}
                        />
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
              className={`transition-colors ${
                isCobalt
                  ? "border-b border-cn-p-line last:border-b-0 hover:bg-cn-p-page"
                  : "border-b border-line hover:bg-porcelain/60"
              } ${onRowClick ? "cursor-pointer" : ""}`}
            >
              {columns.map((column) => (
                <td
                  key={column.key}
                  className={
                    isCobalt
                      ? "px-4 py-3.5 align-middle text-sm text-cn-p-ink"
                      : `py-3 px-3 ${size === "lg" ? "text-sm" : "text-xs"} text-ink align-middle`
                  }
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
