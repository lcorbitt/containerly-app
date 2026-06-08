import type { ReactNode } from "react";

export type DataTableColumn<T> = {
  id: string;
  header: ReactNode;
  cell: (row: T) => ReactNode;
  className?: string;
  headerClassName?: string;
  /** When true and `onSortChange` is provided, header is a sort control (sort key = `id`). */
  sortable?: boolean;
  /** Plain-text CSV header; defaults to `header` when it is a string, otherwise `id`. */
  exportHeader?: string;
  /** When set, column is included in CSV export. */
  exportValue?: (row: T) => string | null | undefined;
};

export type SortDirection = "asc" | "desc";

export interface DataTableExportConfig<T> {
  fileName: string;
  fetchRows: () => Promise<T[]>;
}
