import type { DataTableColumn } from "./types";

function escapeCsvCell(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function resolveDataTableExportHeader<T>(column: DataTableColumn<T>): string | null {
  if (column.exportValue == null) return null;
  if (column.exportHeader?.trim()) return column.exportHeader.trim();
  if (typeof column.header === "string") return column.header;
  return column.id;
}

export function buildDataTableCsv<T>(columns: DataTableColumn<T>[], rows: T[]): string {
  const exportColumns = columns
    .map((column) => ({ column, header: resolveDataTableExportHeader(column) }))
    .filter((entry): entry is { column: DataTableColumn<T>; header: string } => entry.header != null);

  const headerLine = exportColumns.map((entry) => escapeCsvCell(entry.header)).join(",");
  const bodyLines = rows.map((row) =>
    exportColumns
      .map(({ column }) => {
        const raw = column.exportValue?.(row);
        const text = raw == null || String(raw).trim() === "" ? "—" : String(raw).trim();
        return escapeCsvCell(text);
      })
      .join(","),
  );

  return [headerLine, ...bodyLines].join("\r\n");
}

export function downloadCsvFile(fileName: string, csv: string): void {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName.endsWith(".csv") ? fileName : `${fileName}.csv`;
  anchor.click();
  URL.revokeObjectURL(url);
}
