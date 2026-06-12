"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  emptyFormValues,
  formValuesFromImportDraft,
  formValuesToCommercialHeader,
  formValuesToIdentityLine,
  validateFormValues,
} from "@/components/ShipmentCommercialFormFields/utils";
import type { ShipmentCommercialFormValues } from "@/components/ShipmentCommercialFormFields/types";
import { useCreateShipmentMutation } from "@/hooks/mutations/useShipments";
import { useToast } from "@/atoms/toast";
import type { ShipmentImportDraft } from "@/utils/shipment-import";
import type { NewShipmentFormProps } from "./types";

export function useNewShipmentForm({
  organizationId,
  onCreated,
  showChrome = true,
  importOpen: importOpenProp,
  onImportOpenChange,
  onCreatingChange,
}: NewShipmentFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const createMutation = useCreateShipmentMutation();
  const [values, setValues] = useState<ShipmentCommercialFormValues>(emptyFormValues);
  const [error, setError] = useState<string | null>(null);
  const [importOpenInternal, setImportOpenInternal] = useState(false);
  const importControlled = onImportOpenChange !== undefined;
  const importOpen = importControlled ? (importOpenProp ?? false) : importOpenInternal;
  const setImportOpen = useCallback(
    (open: boolean) => {
      if (importControlled) {
        onImportOpenChange!(open);
      } else {
        setImportOpenInternal(open);
      }
    },
    [importControlled, onImportOpenChange],
  );

  const loading = createMutation.isPending;

  useEffect(() => {
    onCreatingChange?.(loading);
  }, [loading, onCreatingChange]);

  const formSurfaceClass =
    showChrome === false
      ? "flex flex-col gap-4"
      : "flex flex-col gap-4 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 sm:p-5";

  const applyImport = useCallback(
    (draft: ShipmentImportDraft, meta: { fileName: string }) => {
      setValues(formValuesFromImportDraft(draft));
      setError(null);
      setImportOpen(false);
      toast(`Parsed ${meta.fileName} successfully.`, "success");
    },
    [toast, setImportOpen],
  );

  const submit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);
      const validationError = validateFormValues(values);
      if (validationError) {
        setError(validationError);
        return;
      }

      try {
        const r = await createMutation.mutateAsync({
          organization_id: organizationId,
          header: formValuesToCommercialHeader(values),
          lines: [formValuesToIdentityLine(values)],
        });
        if (!r.ok) {
          setError(r.error);
          return;
        }

        const shipmentId = r.data.shipment_id?.trim();
        if (!shipmentId) {
          setError("Shipment created but no id was returned.");
          return;
        }

        if (onCreated) {
          await onCreated(shipmentId);
        } else {
          await router.push(`/shipments/${shipmentId}`);
          router.refresh();
        }
      } catch {
        setError("Could not create shipment.");
      }
    },
    [createMutation, organizationId, onCreated, router, values],
  );

  return {
    values,
    setValues,
    error,
    loading,
    importOpen,
    setImportOpen,
    formSurfaceClass,
    applyImport,
    submit,
  };
}
