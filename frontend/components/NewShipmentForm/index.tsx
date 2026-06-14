"use client";

import { FileDown, Loader2 } from "lucide-react";
import { ShipmentCommercialFormFields } from "@/components/ShipmentCommercialFormFields";
import { ShipmentDataImportModal } from "./ShipmentDataImportModal";
import {
  NEW_SHIPMENT_IMPORT_BUTTON_CLASS,
  NEW_SHIPMENT_SUBMIT_BUTTON_CLASS,
} from "./constants";
import type { NewShipmentFormProps } from "./types";
import { useNewShipmentForm } from "./useNewShipmentForm";

export function NewShipmentForm({
  organizationId,
  onCreated,
  showChrome = true,
  className: formClassName,
  importOpen: importOpenProp,
  onImportOpenChange,
  onSwitchToBulkImport,
  onCreatingChange,
}: NewShipmentFormProps) {
  const {
    values,
    setValues,
    error,
    loading,
    importOpen,
    setImportOpen,
    formSurfaceClass,
    applyImport,
    submit,
  } = useNewShipmentForm({
    organizationId,
    onCreated,
    showChrome,
    importOpen: importOpenProp,
    onImportOpenChange,
    onCreatingChange,
  });

  return (
    <>
      <form onSubmit={submit} className={`${formSurfaceClass} ${formClassName ?? ""}`.trim()}>
        {showChrome ? (
          <div className="mb-2 flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">New Shipment</h2>
              <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
                Enter details manually or import from a spreadsheet, CSV, or JSON. Upload documents and invite customers from the workspace
                after creation.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setImportOpen(true)}
              className={NEW_SHIPMENT_IMPORT_BUTTON_CLASS}
            >
              <FileDown className="h-4 w-4" strokeWidth={2} aria-hidden />
              Import
            </button>
          </div>
        ) : null}

        <ShipmentCommercialFormFields
          values={values}
          onChange={(update) => setValues((prev) => ({ ...prev, ...update }))}
        />

        {error ? <p className="text-sm text-red-600 dark:text-red-400">{error}</p> : null}

        <button
          type="submit"
          disabled={loading}
          className={NEW_SHIPMENT_SUBMIT_BUTTON_CLASS}
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              Creating…
            </>
          ) : (
            "Create Shipment"
          )}
        </button>
      </form>

      <ShipmentDataImportModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        organizationId={organizationId}
        variant="single"
        onApply={applyImport}
        onSwitchToBulkImport={onSwitchToBulkImport}
      />
    </>
  );
}
