import type { ReactNode } from "react";

export type DataTableColumn<T> = {
  id: string;
  header: ReactNode;
  cell: (row: T) => ReactNode;
  className?: string;
  headerClassName?: string;
  /** When true and `onSortChange` is provided, header is a sort control (sort key = `id`). */
  sortable?: boolean;
};

export type SortDirection = "asc" | "desc";
