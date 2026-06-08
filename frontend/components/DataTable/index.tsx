"use client";

import type { KeyboardEvent } from "react";
import { ArrowDown, ArrowUp } from "lucide-react";
import {
  DATA_TABLE_EXPORT_BUTTON_CLASS,
  DATA_TABLE_EXPORT_BUTTON_LABEL,
  DATA_TABLE_EXPORTING_BUTTON_LABEL,
  DATA_TABLE_EXPORT_TOOLBAR_CLASS,
} from "./constants";
import { useDataTableExport } from "./useDataTableExport";
import type { DataTableColumn, DataTableExportConfig, SortDirection } from "./types";

export type { DataTableColumn, DataTableExportConfig, SortDirection };

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
  /** When set, shows Export and downloads all rows from `fetchRows` as CSV. */
  export?: DataTableExportConfig<T>;
  exportDisabled?: boolean;
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
  export: exportConfig,
  exportDisabled = false,
}: DataTableProps<T>) {
  const interactive = Boolean(onRowClick);
  const { canExport, exporting, handleExport } = useDataTableExport({ columns, exportConfig });

  const onRowKeyDown = (row: T) => (e: KeyboardEvent<HTMLTableRowElement>) => {
    if (!onRowClick) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onRowClick(row);
    }
  };

  return (
    <div>
      {canExport ? (
        <div className={DATA_TABLE_EXPORT_TOOLBAR_CLASS}>
          <button
            type="button"
            className={DATA_TABLE_EXPORT_BUTTON_CLASS}
            disabled={exportDisabled || loading || exporting}
            onClick={() => void handleExport()}
          >
            {exporting ? DATA_TABLE_EXPORTING_BUTTON_LABEL : DATA_TABLE_EXPORT_BUTTON_LABEL}
          </button>
        </div>
      ) : null}

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
            ) : rows.length === 0 ? (
              <tr className="bg-white dark:bg-zinc-950">
                <td
                  colSpan={columns.length}
                  className="px-4 py-10 text-center text-sm text-zinc-500 dark:text-zinc-400"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr
                  key={getRowId(row)}
                  className={`bg-white dark:bg-zinc-950 ${
                    interactive
                      ? "group color-fade cursor-pointer hover:bg-primary-orange/5 dark:hover:bg-primary-orange/10"
                      : ""
                  }`}
                  onClick={interactive ? () => onRowClick?.(row) : undefined}
                  onKeyDown={interactive ? onRowKeyDown(row) : undefined}
                  tabIndex={interactive ? 0 : undefined}
                  role={interactive ? "link" : undefined}
                >
                  {columns.map((col, colIndex) => (
                    <td
                      key={col.id}
                      className={`px-4 py-3 ${col.className ?? ""} ${
                        interactive && colIndex === 0
                          ? "color-fade border-l-[3px] border-l-transparent group-hover:border-l-primary-orange"
                          : ""
                      }`}
                    >
                      {col.cell(row)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
