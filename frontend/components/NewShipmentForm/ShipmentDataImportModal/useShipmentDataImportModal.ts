"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useBulkCreateShipmentsMutation } from "@/hooks/mutations/useShipments";
import type { BulkImportResult } from "@/services/shipment-import.service";
import {
  isShipmentImportFileName,
  parseShipmentBulkImportFile,
  parseShipmentImportFileAsync,
  type ShipmentBulkImportParseResult,
  type ShipmentImportDraft,
} from "@/utils/shipment-import";
import type { ShipmentDataImportModalProps } from "./types";

const MIN_PARSING_MS = 2000;

export function useShipmentDataImportModal({
  open,
  onClose,
  organizationId,
  variant,
  onApply,
  onBulkComplete,
}: ShipmentDataImportModalProps) {
  const isBulk = variant === "bulk";
  const inputRef = useRef<HTMLInputElement>(null);
  const bulkCreateMutation = useBulkCreateShipmentsMutation();

  const [fileName, setFileName] = useState<string | null>(null);
  const [bulkParse, setBulkParse] = useState<ShipmentBulkImportParseResult | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parsing, setParsing] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [bulkResult, setBulkResult] = useState<BulkImportResult | null>(null);

  const creating = bulkCreateMutation.isPending;
  const busy = parsing || creating;

  useEffect(() => {
    if (!open) {
      setFileName(null);
      setBulkParse(null);
      setDragOver(false);
      setError(null);
      setParsing(false);
      setProgress(null);
      setBulkResult(null);
    }
  }, [open]);

  const parseFile = useCallback(
    async (file: File) => {
      setError(null);
      setBulkParse(null);
      setBulkResult(null);
      setParsing(true);
      setFileName(file.name);

      const startedAt = Date.now();
      let ok = false;
      let nextBulkParse: ShipmentBulkImportParseResult | null = null;
      let nextDraft: ShipmentImportDraft | null = null;
      try {
        if (isBulk) {
          nextBulkParse = await parseShipmentBulkImportFile(file);
          ok = true;
        } else {
          nextDraft = await parseShipmentImportFileAsync(file);
          ok = true;
        }
      } catch (e) {
        setFileName(null);
        setError(e instanceof Error ? e.message : "Could not parse file.");
      } finally {
        const elapsed = Date.now() - startedAt;
        if (elapsed < MIN_PARSING_MS) {
          await new Promise<void>((resolve) => setTimeout(resolve, MIN_PARSING_MS - elapsed));
        }

        if (ok) {
          if (isBulk && nextBulkParse) {
            setBulkParse(nextBulkParse);
          }
          if (!isBulk && nextDraft) {
            onApply?.(nextDraft, { fileName: file.name });
          }
        }

        setParsing(false);
        if (!isBulk && ok) {
          onClose();
        }
      }
    },
    [isBulk, onApply, onClose],
  );

  const readFile = useCallback(
    (file: File) => {
      if (!isShipmentImportFileName(file.name)) {
        setError("Use a .xlsx, .csv, or .json file.");
        return;
      }
      void parseFile(file);
    },
    [parseFile],
  );

  const handleFiles = useCallback(
    (list: FileList | null) => {
      const file = list?.[0];
      if (file) readFile(file);
    },
    [readFile],
  );

  const handleBulkCreate = useCallback(async () => {
    if (!bulkParse?.rows.length) {
      setError(
        "Upload a spreadsheet or CSV first. Each row with order number, booking number, and container number becomes one shipment.",
      );
      return;
    }

    setError(null);
    setProgress({ done: 0, total: bulkParse.rows.length });

    try {
      const result = await bulkCreateMutation.mutateAsync({
        organizationId,
        drafts: bulkParse.rows,
        onProgress: (done, total) => setProgress({ done, total }),
      });
      setBulkResult(result);
      onBulkComplete?.(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Bulk import failed.");
    } finally {
      setProgress(null);
    }
  }, [bulkCreateMutation, bulkParse, onBulkComplete, organizationId]);

  return {
    isBulk,
    inputRef,
    fileName,
    bulkParse,
    dragOver,
    setDragOver,
    error,
    parsing,
    creating,
    progress,
    bulkResult,
    busy,
    showBulkResults: Boolean(bulkResult),
    bulkCount: bulkParse?.rows.length ?? 0,
    handleFiles,
    handleBulkCreate,
  };
}
