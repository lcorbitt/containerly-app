"use client";

import { useCallback, useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/atoms/toast";
import { useUpdateShipmentMutation } from "@/hooks/mutations/useShipments";
import { invalidateShipmentWorkspaceRowQuery } from "@/hooks/queries/useShipment";
import { isValidMailTrackingNumber } from "./utils";

export function useShipmentMailTrackingPanel({
  shipmentId,
  organizationId,
  initialTrackingNumber,
  enabled = false,
  readOnly = false,
  onSaved,
}: {
  shipmentId: string;
  organizationId: string;
  initialTrackingNumber?: string | null;
  enabled?: boolean;
  readOnly?: boolean;
  onSaved?: () => void;
}) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const updateMutation = useUpdateShipmentMutation();
  const [trackingNumber, setTrackingNumber] = useState(initialTrackingNumber ?? "");

  useEffect(() => {
    setTrackingNumber(initialTrackingNumber ?? "");
  }, [initialTrackingNumber]);

  const savedNumber = initialTrackingNumber?.trim() ?? "";
  const documentsApproved = enabled;
  const canEdit = documentsApproved && !readOnly;
  const canSave = isValidMailTrackingNumber(trackingNumber);
  const saving = updateMutation.isPending;

  const save = useCallback(async () => {
    if (!organizationId || !canEdit || !canSave) return;
    try {
      const r = await updateMutation.mutateAsync({
        organization_id: organizationId,
        shipment_id: shipmentId,
        physical_mail_tracking_number: trackingNumber.trim() || null,
      });
      if (!r.ok) {
        toast(r.error, "error");
        return;
      }
      await invalidateShipmentWorkspaceRowQuery(qc, { shipmentId, organizationId });
      toast("Tracking number added — customer notified.", "success");
      onSaved?.();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Could not save tracking number", "error");
    }
  }, [
    canEdit,
    canSave,
    onSaved,
    organizationId,
    qc,
    shipmentId,
    toast,
    trackingNumber,
    updateMutation,
  ]);

  return {
    trackingNumber,
    setTrackingNumber,
    savedNumber,
    documentsApproved,
    canEdit,
    canSave,
    saving,
    save,
    readOnly,
  };
}
