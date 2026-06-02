"use client";

import type { KeyboardEvent } from "react";
import { ArrowDown, ArrowUp } from "lucide-react";
import type { DataTableColumn, SortDirection } from "./types";

export type { DataTableColumn, SortDirection };

type DataTableProps<T> = {
  columns: DataTableColumn<T>[];
  rows: T[];
  getRowId: (row: T) => string;
  emptyMessage?: string;
  onRowClick?: (row: T) => void;
  loading?: boolean;
  sortColumn?: string | null;
  sortDirection?: SortDirection;
  onSortChange?: (columnId: string) => void;
};

export function DataTable<T>({
  columns,
  rows,
  getRowId,
  emptyMessage = "No rows.",
  onRowClick,
  loading = false,
  sortColumn = null,
  sortDirection = "desc",
  onSortChange,
}: DataTableProps<T>) {
  const interactive = Boolean(onRowClick);

  const onRowKeyDown = (row: T) => (e: KeyboardEvent<HTMLTableRowElement>) => {
    if (!onRowClick) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onRowClick(row);
    }
  };

  return (
    <div className="overflow-x-auto rounded-lg border border-zinc-100 dark:border-zinc-800">
      <table className="w-full min-w-[32rem] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-zinc-200 bg-zinc-50/80 text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-200">
            {columns.map((col) => {
              const sortable = Boolean(col.sortable && onSortChange);
              const active = sortColumn === col.id;
              return (
                <th
                  key={col.id}
                  scope="col"
                  className={`px-4 py-3 text-xs font-bold uppercase tracking-wide ${col.headerClassName ?? ""}`}
                >
                  {sortable ? (
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wide text-zinc-700 hover:text-zinc-900 dark:text-zinc-200 dark:hover:text-zinc-100"
                      onClick={() => onSortChange?.(col.id)}
                    >
                      {col.header}
                      {active ? (
                        sortDirection === "asc" ? (
                          <ArrowUp className="h-3.5 w-3.5 opacity-90" aria-hidden />
                        ) : (
                          <ArrowDown className="h-3.5 w-3.5 opacity-90" aria-hidden />
                        )
                      ) : null}
                    </button>
                  ) : (
                    col.header
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
          {loading ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-10 text-center text-sm text-zinc-500">
                Loading…
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr
                key={getRowId(row)}
                className={`bg-white dark:bg-zinc-950 ${
                  interactive
                    ? "color-fade cursor-pointer hover:bg-primary-orange/5 hover:shadow-[inset_3px_0_0_rgba(255,78,0,1)] dark:hover:bg-primary-orange/10"
                    : ""
                }`}
                onClick={interactive ? () => onRowClick?.(row) : undefined}
                onKeyDown={interactive ? onRowKeyDown(row) : undefined}
                tabIndex={interactive ? 0 : undefined}
                role={interactive ? "link" : undefined}
              >
                {columns.map((col) => (
                  <td key={col.id} className={`px-4 py-3 ${col.className ?? ""}`}>
                    {col.cell(row)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
      {!loading && rows.length === 0 ? (
        <p className="border-t border-zinc-100 px-4 py-6 text-center text-sm text-zinc-500 dark:border-zinc-800">
          {emptyMessage}
        </p>
      ) : null}
    </div>
  );
}
