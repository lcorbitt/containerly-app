"use client";

import { useCallback, useState } from "react";
import type { DataTableColumn, DataTableExportConfig } from "./types";
import { buildDataTableCsv, downloadCsvFile } from "./utils";

export function useDataTableExport<T>({
  columns,
  exportConfig,
}: {
  columns: DataTableColumn<T>[];
  exportConfig?: DataTableExportConfig<T>;
}) {
  const [exporting, setExporting] = useState(false);

  const canExport =
    Boolean(exportConfig) && columns.some((column) => column.exportValue != null);

  const handleExport = useCallback(async () => {
    if (!exportConfig || exporting) return;

    setExporting(true);
    try {
      const rows = await exportConfig.fetchRows();
      if (rows.length === 0) return;
      const csv = buildDataTableCsv(columns, rows);
      downloadCsvFile(exportConfig.fileName, csv);
    } finally {
      setExporting(false);
    }
  }, [columns, exportConfig, exporting]);

  return {
    canExport,
    exporting,
    handleExport,
  };
}
