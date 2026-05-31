"use client";

import Link from "next/link";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { CheckCircle2, FileUp, Loader2, Upload } from "lucide-react";
import { DialogCloseButton } from "@/components/DialogCloseButton";
import { Reveal } from "@/components/Reveal";
import {
  bulkCreateCommercialShipments,
  type BulkImportResult,
} from "@/services/shipment-import.service";
import {
  downloadShipmentBulkImportTemplate,
  downloadShipmentImportTemplate,
  isShipmentImportFileName,
  parseShipmentBulkImportFile,
  parseShipmentImportFileAsync,
  SHIPMENT_IMPORT_FILE_ACCEPT,
  type ShipmentBulkImportParseResult,
  type ShipmentImportDraft,
} from "@/utils/shipment-import";
import {
  SHIPMENT_DATA_IMPORT_MODAL_BACKDROP_CLASS,
  SHIPMENT_DATA_IMPORT_MODAL_PANEL_CLASS,
  SHIPMENT_DATA_IMPORT_MODAL_REVEAL_CLASS,
  SHIPMENT_DATA_IMPORT_MODAL_SHELL_CLASS,
} from "./constants";

/** `single` pre-fills the new shipment form; `bulk` creates one shipment per spreadsheet row. */
export type ShipmentImportVariant = "single" | "bulk";

type ShipmentDataImportModalProps = {
  open: boolean;
  onClose: () => void;
  organizationId: string;
  variant: ShipmentImportVariant;
  /** Pre-fill the new shipment form (`variant="single"` only). Called automatically after a successful parse. */
  onApply?: (draft: ShipmentImportDraft, meta: { fileName: string }) => void;
  /** Close single import and open bulk import (`variant="single"` only). */
  onSwitchToBulkImport?: () => void;
  /** Called after bulk create finishes (`variant="bulk"` only). */
  onBulkComplete?: (result: BulkImportResult) => void;
};

export function ShipmentDataImportModal({
  open,
  onClose,
  organizationId,
  variant,
  onApply,
  onSwitchToBulkImport,
  onBulkComplete,
}: ShipmentDataImportModalProps) {
  const isBulk = variant === "bulk";
  const titleId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const [fileName, setFileName] = useState<string | null>(null);
  const [bulkParse, setBulkParse] = useState<ShipmentBulkImportParseResult | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parsing, setParsing] = useState(false);
  const [creating, setCreating] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [bulkResult, setBulkResult] = useState<BulkImportResult | null>(null);
  const [portalReady, setPortalReady] = useState(false);

  useEffect(() => {
    setPortalReady(true);
  }, []);

  useEffect(() => {
    if (!open) {
      setFileName(null);
      setBulkParse(null);
      setDragOver(false);
      setError(null);
      setParsing(false);
      setCreating(false);
      setProgress(null);
      setBulkResult(null);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.focus();
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !creating) {
        e.preventDefault();
        onClose();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose, creating]);

  const parseFile = useCallback(async (file: File) => {
    setError(null);
    setBulkParse(null);
    setBulkResult(null);
    setParsing(true);
    setFileName(file.name);

    try {
      if (isBulk) {
        const parsed = await parseShipmentBulkImportFile(file);
        setBulkParse(parsed);
      } else {
        const draft = await parseShipmentImportFileAsync(file);
        onApply?.(draft, { fileName: file.name });
        onClose();
      }
    } catch (e) {
      setFileName(null);
      setError(e instanceof Error ? e.message : "Could not parse file.");
    } finally {
      setParsing(false);
    }
  }, [isBulk, onApply, onClose]);

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

  function handleFiles(list: FileList | null) {
    const file = list?.[0];
    if (file) readFile(file);
  }

  async function handleBulkCreate() {
    if (!bulkParse?.rows.length) {
      setError("Upload a spreadsheet or CSV first. Each row with order number, booking number, and container number becomes one shipment.");
      return;
    }

    setCreating(true);
    setError(null);
    setProgress({ done: 0, total: bulkParse.rows.length });

    try {
      const result = await bulkCreateCommercialShipments(
        organizationId,
        bulkParse.rows,
        (done, total) => setProgress({ done, total }),
      );
      setBulkResult(result);
      onBulkComplete?.(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Bulk import failed.");
    } finally {
      setCreating(false);
      setProgress(null);
    }
  }

  const showBulkResults = Boolean(bulkResult);
  const bulkCount = bulkParse?.rows.length ?? 0;

  const modal =
    portalReady && typeof document !== "undefined"
      ? createPortal(
          <Reveal show={open} className={SHIPMENT_DATA_IMPORT_MODAL_REVEAL_CLASS}>
            <div className={SHIPMENT_DATA_IMPORT_MODAL_SHELL_CLASS}>
              <button
                type="button"
                aria-label="Close dialog"
                className={SHIPMENT_DATA_IMPORT_MODAL_BACKDROP_CLASS}
                onClick={() => {
                  if (!creating) onClose();
                }}
              />
              <div
                ref={panelRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                tabIndex={-1}
                className={SHIPMENT_DATA_IMPORT_MODAL_PANEL_CLASS}
              >
        <div className="flex items-start justify-between gap-3 border-b border-zinc-100 px-5 py-4 dark:border-zinc-800">
          <div>
            <h2 id={titleId} className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
              {isBulk ? "Bulk Import Shipments" : "Import Shipment Data"}
            </h2>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              {isBulk
                ? "Upload a spreadsheet — each row creates a new shipment with its own workspace page."
                : "Upload a spreadsheet, CSV, or JSON file — on success the new shipment form opens with fields pre-filled."}
            </p>
          </div>
          <DialogCloseButton
            onClick={() => {
              if (!creating) onClose();
            }}
          />
        </div>

        <div className="space-y-4 px-5 py-4">
          <p className="text-xs text-zinc-600 dark:text-zinc-400">
            {isBulk ? (
              <>
                <button
                  type="button"
                  onClick={() => void downloadShipmentBulkImportTemplate("xlsx")}
                  className="font-medium text-sky-800 underline dark:text-sky-300"
                >
                  Download .xlsx template
                </button>
                {" · "}
                <button
                  type="button"
                  onClick={() => void downloadShipmentBulkImportTemplate("csv")}
                  className="font-medium text-sky-800 underline dark:text-sky-300"
                >
                  CSV template
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => downloadShipmentImportTemplate("xlsx")}
                  className="font-medium text-sky-800 underline dark:text-sky-300"
                >
                  Download .xlsx template
                </button>
                {" · "}
                <button
                  type="button"
                  onClick={() => downloadShipmentImportTemplate("csv")}
                  className="font-medium text-sky-800 underline dark:text-sky-300"
                >
                  CSV template
                </button>
                {" · "}
                For many shipments at once, use{" "}
                {onSwitchToBulkImport ? (
                  <button
                    type="button"
                    onClick={onSwitchToBulkImport}
                    className="font-semibold text-sky-800 underline dark:text-sky-300"
                  >
                    Bulk import
                  </button>
                ) : (
                  <strong className="font-semibold">Bulk import</strong>
                )}
                .
              </>
            )}
          </p>

          {!showBulkResults ? (
            <>
              <div>
                <p className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Import file</p>
                <div
                  onDragEnter={(e) => {
                    e.preventDefault();
                    setDragOver(true);
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOver(true);
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault();
                    setDragOver(false);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragOver(false);
                    handleFiles(e.dataTransfer.files);
                  }}
                  className={`mt-1.5 flex flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-8 text-center transition-colors ${
                    dragOver
                      ? "border-sky-400 bg-sky-50/80 dark:border-sky-600 dark:bg-sky-950/30"
                      : "border-zinc-200 bg-zinc-50/50 dark:border-zinc-700 dark:bg-zinc-900/30"
                  }`}
                >
                  <Upload className="h-8 w-8 text-zinc-400 dark:text-zinc-500" strokeWidth={1.75} aria-hidden />
                  <p className="mt-3 text-sm font-medium text-zinc-800 dark:text-zinc-200">
                    Drag and drop a .xlsx, .csv, or .json file
                  </p>
                  <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">or</p>
                  <button
                    type="button"
                    disabled={parsing || creating}
                    onClick={() => inputRef.current?.click()}
                    className="mt-3 inline-flex h-9 items-center justify-center rounded-md border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-800 hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:bg-zinc-900"
                  >
                    Select file
                  </button>
                  <input
                    ref={inputRef}
                    type="file"
                    accept={SHIPMENT_IMPORT_FILE_ACCEPT}
                    className="sr-only"
                    aria-label="Select import file"
                    onChange={(e) => {
                      handleFiles(e.target.files);
                      e.target.value = "";
                    }}
                  />
                </div>
              </div>

              {fileName ? (
                <div className="flex items-center gap-2 rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700">
                  {parsing ? (
                    <Loader2 className="h-4 w-4 shrink-0 animate-spin text-zinc-500" aria-hidden />
                  ) : (
                    <FileUp className="h-4 w-4 shrink-0 text-zinc-500" aria-hidden />
                  )}
                  <span className="min-w-0 truncate text-zinc-800 dark:text-zinc-200">{fileName}</span>
                </div>
              ) : null}

              {isBulk && bulkParse ? (
                <div className="rounded-lg border border-zinc-200 bg-zinc-50/80 px-3 py-2 text-xs dark:border-zinc-700 dark:bg-zinc-900/40">
                  <p className="font-medium text-zinc-800 dark:text-zinc-200">
                    {bulkParse.rows.length} shipment{bulkParse.rows.length === 1 ? "" : "s"} ready — click{" "}
                    <span className="whitespace-nowrap">Create shipments</span> below.
                  </p>
                  {bulkParse.skipped.length > 0 ? (
                    <p className="mt-1 text-zinc-600 dark:text-zinc-400">
                      {bulkParse.skipped.length} row{bulkParse.skipped.length === 1 ? "" : "s"} skipped (missing required fields).
                    </p>
                  ) : null}
                  <ul className="mt-2 max-h-28 space-y-0.5 overflow-y-auto font-mono text-[11px] text-zinc-600 dark:text-zinc-400">
                    {bulkParse.rows.slice(0, 8).map((row) => (
                      <li key={row.rowNumber}>
                        Row {row.rowNumber}: {row.draft.orderNumber}
                      </li>
                    ))}
                    {bulkParse.rows.length > 8 ? (
                      <li className="text-zinc-500">…and {bulkParse.rows.length - 8} more</li>
                    ) : null}
                  </ul>
                </div>
              ) : null}

              {progress ? (
                <p className="text-xs text-zinc-600 dark:text-zinc-400">
                  Creating shipments… {progress.done} / {progress.total}
                </p>
              ) : null}
            </>
          ) : (
            <div className="space-y-3">
              <div className="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50/80 px-3 py-2 text-sm text-emerald-950 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-100">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                <div>
                  <p className="font-medium">
                    Created {bulkResult!.created.length} shipment{bulkResult!.created.length === 1 ? "" : "s"}
                  </p>
                  {bulkResult!.failed.length > 0 ? (
                    <p className="mt-1 text-xs opacity-90">
                      {bulkResult!.failed.length} row{bulkResult!.failed.length === 1 ? "" : "s"} failed.
                    </p>
                  ) : null}
                </div>
              </div>

              {bulkResult!.created.length > 0 ? (
                <ul className="max-h-40 space-y-1 overflow-y-auto text-xs">
                  {bulkResult!.created.map((row) => (
                    <li key={row.shipmentId}>
                      <Link
                        href={`/shipments/${row.shipmentId}`}
                        className="font-medium text-sky-800 underline dark:text-sky-300"
                        onClick={onClose}
                      >
                        {row.orderNumber}
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : null}

              {bulkResult!.failed.length > 0 ? (
                <ul className="max-h-32 space-y-1 overflow-y-auto rounded-lg border border-red-200 bg-red-50/50 px-3 py-2 text-xs text-red-800 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-200">
                  {bulkResult!.failed.map((row) => (
                    <li key={`${row.rowNumber}-${row.orderNumber}`}>
                      Row {row.rowNumber} ({row.orderNumber || "no order number"}): {row.error}
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          )}

          {error ? <p className="text-sm text-red-600 dark:text-red-400">{error}</p> : null}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-zinc-100 px-5 py-4 dark:border-zinc-800">
          {showBulkResults ? (
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-9 items-center justify-center rounded-md bg-zinc-900 px-4 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
            >
              Done
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={onClose}
                disabled={creating}
                className="inline-flex h-9 items-center justify-center rounded-md border border-zinc-200 px-4 text-sm font-medium text-zinc-700 disabled:opacity-50 dark:border-zinc-600 dark:text-zinc-200"
              >
                Cancel
              </button>
              {isBulk ? (
                <button
                  type="button"
                  disabled={creating || parsing}
                  onClick={() => void handleBulkCreate()}
                  className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-zinc-900 px-4 text-sm font-medium text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
                >
                  {creating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                      Creating…
                    </>
                  ) : bulkCount > 0 ? (
                    `Create ${bulkCount} shipment${bulkCount === 1 ? "" : "s"}`
                  ) : (
                    "Create shipments"
                  )}
                </button>
              ) : null}
            </>
          )}
        </div>
              </div>
            </div>
          </Reveal>,
          document.body,
        )
      : null;

  return modal;
}
