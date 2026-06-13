"use client";

import Link from "next/link";
import { CheckCircle2, FileUp, Loader2, Upload } from "lucide-react";
import { Modal } from "@/components/Modal";
import {
  downloadShipmentBulkImportTemplate,
  downloadShipmentImportTemplate,
  SHIPMENT_IMPORT_FILE_ACCEPT,
} from "@/utils/shipment-import";
import {
  SHIPMENT_DATA_IMPORT_MODAL_OVERLAY_CLASS,
  SHIPMENT_IMPORT_BULK_LINK_CLASS,
  SHIPMENT_IMPORT_BULK_PREVIEW_BOX_CLASS,
  SHIPMENT_IMPORT_BULK_PREVIEW_LIST_CLASS,
  SHIPMENT_IMPORT_CANCEL_BUTTON_CLASS,
  SHIPMENT_IMPORT_CREATED_LIST_CLASS,
  SHIPMENT_IMPORT_DONE_BUTTON_CLASS,
  SHIPMENT_IMPORT_DROPZONE_ACTIVE_CLASS,
  SHIPMENT_IMPORT_DROPZONE_BASE_CLASS,
  SHIPMENT_IMPORT_DROPZONE_IDLE_CLASS,
  SHIPMENT_IMPORT_FAILED_LIST_CLASS,
  SHIPMENT_IMPORT_FILE_ROW_CLASS,
  SHIPMENT_IMPORT_PARSING_CARD_CLASS,
  SHIPMENT_IMPORT_PARSING_OVERLAY_CLASS,
  SHIPMENT_IMPORT_PRIMARY_BUTTON_CLASS,
  SHIPMENT_IMPORT_RESULT_LINK_CLASS,
  SHIPMENT_IMPORT_SELECT_FILE_BUTTON_CLASS,
  SHIPMENT_IMPORT_SUCCESS_BANNER_CLASS,
  SHIPMENT_IMPORT_TEMPLATE_LINK_CLASS,
} from "./constants";
import type { ShipmentDataImportModalProps } from "./types";
import { useShipmentDataImportModal } from "./useShipmentDataImportModal";

export type { ShipmentImportVariant } from "./types";

export function ShipmentDataImportModal(props: ShipmentDataImportModalProps) {
  const { open, onClose, onSwitchToBulkImport } = props;
  const {
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
    showBulkResults,
    bulkCount,
    handleFiles,
    handleBulkCreate,
    handleBulkDismiss,
  } = useShipmentDataImportModal(props);

  const footer = showBulkResults ? (
    <button type="button" onClick={handleBulkDismiss} className={SHIPMENT_IMPORT_DONE_BUTTON_CLASS}>
      Done
    </button>
  ) : (
    <>
      <button
        type="button"
        onClick={onClose}
        disabled={creating}
        className={SHIPMENT_IMPORT_CANCEL_BUTTON_CLASS}
      >
        Cancel
      </button>
      {isBulk ? (
        <button
          type="button"
          disabled={creating || parsing}
          onClick={() => void handleBulkCreate()}
          className={SHIPMENT_IMPORT_PRIMARY_BUTTON_CLASS}
        >
          {creating ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              Creating…
            </>
          ) : bulkCount > 0 ? (
            `Create ${bulkCount} shipment${bulkCount === 1 ? "" : "s"}`
          ) : (
            "Create Shipments"
          )}
        </button>
      ) : null}
    </>
  );

  const overlay = parsing ? (
    <div className={SHIPMENT_IMPORT_PARSING_OVERLAY_CLASS} aria-live="polite" aria-busy="true">
      <div className={SHIPMENT_IMPORT_PARSING_CARD_CLASS}>
        <Loader2 className="h-6 w-6 animate-spin text-primary-orange" aria-hidden />
        <div>
          <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Parsing shipment file…</p>
          <p className="mt-2 text-xs text-zinc-600 dark:text-zinc-400">
            We’re reading your file and preparing a pre-filled shipment draft.
          </p>
        </div>
      </div>
    </div>
  ) : null;

  return (
    <Modal
      open={open}
      onClose={showBulkResults ? handleBulkDismiss : onClose}
      title={isBulk ? "Bulk Import Shipments" : "Import Shipment"}
      busy={busy}
      overlay={overlay}
      overlayClassName={SHIPMENT_DATA_IMPORT_MODAL_OVERLAY_CLASS}
      bodyClassName="space-y-4"
      footer={footer}
    >
      <p className="text-xs text-zinc-600 dark:text-zinc-400">
        {isBulk ? (
          <>
            <button
              type="button"
              onClick={() => void downloadShipmentBulkImportTemplate("xlsx")}
              className={SHIPMENT_IMPORT_TEMPLATE_LINK_CLASS}
            >
              Download .xlsx template
            </button>
            {" · "}
            <button
              type="button"
              onClick={() => void downloadShipmentBulkImportTemplate("csv")}
              className={SHIPMENT_IMPORT_TEMPLATE_LINK_CLASS}
            >
              CSV template
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={() => downloadShipmentImportTemplate("xlsx")}
              className={SHIPMENT_IMPORT_TEMPLATE_LINK_CLASS}
            >
              Download .xlsx template
            </button>
            {" · "}
            <button
              type="button"
              onClick={() => downloadShipmentImportTemplate("csv")}
              className={SHIPMENT_IMPORT_TEMPLATE_LINK_CLASS}
            >
              CSV template
            </button>
            {" · "}
            For many shipments at once, use{" "}
            {onSwitchToBulkImport ? (
              <button type="button" onClick={onSwitchToBulkImport} className={SHIPMENT_IMPORT_BULK_LINK_CLASS}>
                Bulk Import
              </button>
            ) : (
              <strong className="font-semibold">Bulk Import</strong>
            )}
            .
          </>
        )}
      </p>

      {!showBulkResults ? (
        <>
          <div>
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
              className={`${SHIPMENT_IMPORT_DROPZONE_BASE_CLASS} ${
                dragOver ? SHIPMENT_IMPORT_DROPZONE_ACTIVE_CLASS : SHIPMENT_IMPORT_DROPZONE_IDLE_CLASS
              }`}
            >
              <Upload className="h-8 w-8 text-zinc-400 dark:text-zinc-500" strokeWidth={1.75} aria-hidden />
              <p className="mt-4 text-sm font-medium text-zinc-800 dark:text-zinc-200">
                Drag and drop a .xlsx, .csv, or .json file
              </p>
              <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">or</p>
              <button
                type="button"
                disabled={parsing || creating}
                onClick={() => inputRef.current?.click()}
                className={SHIPMENT_IMPORT_SELECT_FILE_BUTTON_CLASS}
              >
                Select File
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
            <div className={SHIPMENT_IMPORT_FILE_ROW_CLASS}>
              {parsing ? (
                <Loader2 className="h-4 w-4 shrink-0 animate-spin text-zinc-500" aria-hidden />
              ) : (
                <FileUp className="h-4 w-4 shrink-0 text-zinc-500" aria-hidden />
              )}
              <span className="min-w-0 truncate text-zinc-800 dark:text-zinc-200">{fileName}</span>
            </div>
          ) : null}

          {isBulk && bulkParse ? (
            <div className={SHIPMENT_IMPORT_BULK_PREVIEW_BOX_CLASS}>
              <p className="font-medium text-zinc-800 dark:text-zinc-200">
                {bulkParse.rows.length} shipment{bulkParse.rows.length === 1 ? "" : "s"} ready — click{" "}
                <span className="whitespace-nowrap">Create shipments</span> below.
              </p>
              {bulkParse.skipped.length > 0 ? (
                <p className="mt-2 text-zinc-600 dark:text-zinc-400">
                  {bulkParse.skipped.length} row{bulkParse.skipped.length === 1 ? "" : "s"} skipped (missing required fields).
                </p>
              ) : null}
              <ul className={SHIPMENT_IMPORT_BULK_PREVIEW_LIST_CLASS}>
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
        <div className="space-y-4">
          <div className={SHIPMENT_IMPORT_SUCCESS_BANNER_CLASS}>
            <CheckCircle2 className="mt-2 h-4 w-4 shrink-0" aria-hidden />
            <div>
              <p className="font-medium">
                Created {bulkResult!.created.length} shipment{bulkResult!.created.length === 1 ? "" : "s"}
              </p>
              {bulkResult!.failed.length > 0 ? (
                <p className="mt-2 text-xs opacity-90">
                  {bulkResult!.failed.length} row{bulkResult!.failed.length === 1 ? "" : "s"} failed.
                </p>
              ) : null}
            </div>
          </div>

          {bulkResult!.created.length > 0 ? (
            <ul className={SHIPMENT_IMPORT_CREATED_LIST_CLASS}>
              {bulkResult!.created.map((row) => (
                <li key={row.shipmentId}>
                  <Link
                    href={`/shipments/${row.shipmentId}`}
                    className={SHIPMENT_IMPORT_RESULT_LINK_CLASS}
                    onClick={onClose}
                  >
                    {row.orderNumber}
                  </Link>
                </li>
              ))}
            </ul>
          ) : null}

          {bulkResult!.failed.length > 0 ? (
            <ul className={SHIPMENT_IMPORT_FAILED_LIST_CLASS}>
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
    </Modal>
  );
}
