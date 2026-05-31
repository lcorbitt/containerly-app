"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { FileDown } from "lucide-react";
import { ShipmentCommercialFormFields } from "@/components/ShipmentCommercialFormFields";
import {
  emptyFormValues,
  formValuesFromImportDraft,
  formValuesToCommercialHeader,
  formValuesToIdentityLine,
  validateFormValues,
} from "@/components/ShipmentCommercialFormFields/utils";
import type { ShipmentCommercialFormValues } from "@/components/ShipmentCommercialFormFields/types";
import { createCommercialShipment } from "@/services/shipment.service";
import { useToast } from "@/contexts/toast";
import { ShipmentDataImportModal } from "./ShipmentDataImportModal";
import type { ShipmentImportDraft } from "./utils";

export function NewShipmentForm({
  organizationId,
  onCreated,
  showChrome = true,
  className: formClassName,
  importOpen: importOpenProp,
  onImportOpenChange,
}: {
  organizationId: string;
  onCreated?: (shipmentId: string) => void;
  showChrome?: boolean;
  className?: string;
  importOpen?: boolean;
  onImportOpenChange?: (open: boolean) => void;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [values, setValues] = useState<ShipmentCommercialFormValues>(emptyFormValues);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [importOpenInternal, setImportOpenInternal] = useState(false);
  const importControlled = onImportOpenChange !== undefined;
  const importOpen = importControlled ? (importOpenProp ?? false) : importOpenInternal;
  const setImportOpen = importControlled
    ? (open: boolean) => onImportOpenChange!(open)
    : setImportOpenInternal;

  const formSurfaceClass =
    showChrome === false
      ? "flex flex-col gap-4"
      : "flex flex-col gap-4 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 sm:p-5";

  const applyImport = useCallback(
    (draft: ShipmentImportDraft, meta: { fileName: string }) => {
      setValues(formValuesFromImportDraft(draft));
      setError(null);
      setImportOpen(false);
      toast(
        `Parsed ${meta.fileName} successfully.`,
        "success",
      );
    },
    [toast, setImportOpen],
  );

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const validationError = validateFormValues(values);
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    try {
      const r = await createCommercialShipment({
        organization_id: organizationId,
        header: formValuesToCommercialHeader(values),
        lines: [formValuesToIdentityLine(values)],
      });
      if (!r.ok) {
        setError(r.error);
        return;
      }
      onCreated?.(r.data.shipment_id);
      router.push(`/shipments/${r.data.shipment_id}`);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <form onSubmit={submit} className={`${formSurfaceClass} ${formClassName ?? ""}`.trim()}>
        {showChrome ? (
          <div className="mb-1 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">New shipment</h2>
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                Enter details manually or import from a spreadsheet, CSV, or JSON. Upload documents and invite customers from the workspace
                after creation.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setImportOpen(true)}
              className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-3 text-xs font-medium text-zinc-800 transition-colors hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:bg-zinc-900"
            >
              <FileDown className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
              Import
            </button>
          </div>
        ) : null}

        <ShipmentCommercialFormFields
          values={values}
          onChange={(patch) => setValues((prev) => ({ ...prev, ...patch }))}
        />

        {error ? <p className="text-sm text-red-600 dark:text-red-400">{error}</p> : null}

        <button
          type="submit"
          disabled={loading}
          className="inline-flex h-10 items-center justify-center rounded-md bg-zinc-900 px-4 text-sm font-medium text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
        >
          {loading ? "Creating…" : "Create Shipment"}
        </button>
      </form>

      <ShipmentDataImportModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        organizationId={organizationId}
        variant="single"
        onApply={applyImport}
      />
    </>
  );
}
