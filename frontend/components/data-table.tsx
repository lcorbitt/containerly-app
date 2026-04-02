"use client";

import type { KeyboardEvent, ReactNode } from "react";

export type DataTableColumn<T> = {
  id: string;
  header: ReactNode;
  cell: (row: T) => ReactNode;
  className?: string;
  headerClassName?: string;
};

type DataTableProps<T> = {
  columns: DataTableColumn<T>[];
  rows: T[];
  getRowId: (row: T) => string;
  emptyMessage?: string;
  onRowClick?: (row: T) => void;
};

export function DataTable<T>({
  columns,
  rows,
  getRowId,
  emptyMessage = "No rows.",
  onRowClick,
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
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-zinc-200 text-zinc-500 dark:border-zinc-800">
            {columns.map((col) => (
              <th
                key={col.id}
                scope="col"
                className={`py-2 pr-4 font-medium ${col.headerClassName ?? ""}`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={getRowId(row)}
              className={`border-b border-zinc-100 dark:border-zinc-900 ${
                interactive
                  ? "cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-900/60"
                  : ""
              }`}
              onClick={interactive ? () => onRowClick?.(row) : undefined}
              onKeyDown={interactive ? onRowKeyDown(row) : undefined}
              tabIndex={interactive ? 0 : undefined}
            >
              {columns.map((col) => (
                <td key={col.id} className={`py-2 pr-4 ${col.className ?? ""}`}>
                  {col.cell(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length === 0 ? (
        <p className="py-4 text-sm text-zinc-500">{emptyMessage}</p>
      ) : null}
    </div>
  );
}
