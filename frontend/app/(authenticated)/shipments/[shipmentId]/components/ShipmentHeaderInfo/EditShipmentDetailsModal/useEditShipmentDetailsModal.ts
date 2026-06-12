"use client";

import { useCallback, useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  emptyFormValues,
  formValuesFromSource,
  formValuesToCommercialHeader,
  formValuesToIdentityLine,
  validateFormValues,
} from "@/components/ShipmentCommercialFormFields/utils";
import type { ShipmentCommercialFormValues } from "@/components/ShipmentCommercialFormFields/types";
import type { ShipmentCommercialFormSource } from "@/components/ShipmentCommercialFormFields/types";
import { useConfirm } from "@/atoms/confirm-dialog";
import { useUpdateShipmentMutation } from "@/hooks/mutations/useShipments";
import { invalidateShipmentWorkspaceRowQuery } from "@/hooks/queries/useShipment";
import {
  EDIT_SHIPMENT_DETAILS_CONFIRM_DESCRIPTION,
  EDIT_SHIPMENT_DETAILS_CONFIRM_LABEL,
  EDIT_SHIPMENT_DETAILS_CONFIRM_TITLE,
} from "./constants";

export function useEditShipmentDetailsModal({
  open,
  onClose,
  organizationId,
  shipmentId,
  source,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  organizationId: string;
  shipmentId: string;
  source: ShipmentCommercialFormSource;
  onSaved?: () => void;
}) {
  const qc = useQueryClient();
  const { confirm } = useConfirm();
  const updateMutation = useUpdateShipmentMutation();
  const [values, setValues] = useState<ShipmentCommercialFormValues>(emptyFormValues);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setValues(formValuesFromSource(source));
    setError(null);
  }, [open, source]);

  const saving = updateMutation.isPending;

  const submit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);
      const validationError = validateFormValues(values);
      if (validationError) {
        setError(validationError);
        return;
      }

      const confirmed = await confirm({
        title: EDIT_SHIPMENT_DETAILS_CONFIRM_TITLE,
        description: EDIT_SHIPMENT_DETAILS_CONFIRM_DESCRIPTION,
        confirmLabel: EDIT_SHIPMENT_DETAILS_CONFIRM_LABEL,
        cancelLabel: "Cancel",
      });
      if (!confirmed) return;

      try {
        const r = await updateMutation.mutateAsync({
          organization_id: organizationId,
          shipment_id: shipmentId,
          header: formValuesToCommercialHeader(values),
          lines: [formValuesToIdentityLine(values)],
        });
        if (!r.ok) {
          setError(r.error);
          return;
        }
        await invalidateShipmentWorkspaceRowQuery(qc, { shipmentId, organizationId });
        onSaved?.();
        onClose();
      } catch {
        setError("Could not save shipment details.");
      }
    },
    [confirm, onClose, onSaved, organizationId, qc, shipmentId, updateMutation, values],
  );

  return {
    values,
    setValues,
    error,
    saving,
    submit,
  };
}
