"use client";

import { useCallback, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/atoms/toast";
import { useUpdateShipmentRootCauseMutation } from "@/hooks/mutations/useShipments";
import { invalidateShipmentWorkspaceRowQuery } from "@/hooks/queries/useShipment";
import type { ShipmentRootCause } from "@shared/dto/performance.dto";

export function useShipmentRootCauseSection({
  shipmentId,
  organizationId,
  initialRootCause,
  onSaved,
}: {
  shipmentId: string;
  organizationId: string;
  initialRootCause: ShipmentRootCause | null;
  onSaved?: () => void;
}) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const updateRootCauseMutation = useUpdateShipmentRootCauseMutation();
  const [value, setValue] = useState(initialRootCause);

  const handleChange = useCallback(
    async (next: ShipmentRootCause | null) => {
      setValue(next);
      try {
        await updateRootCauseMutation.mutateAsync({
          shipmentId,
          organizationId,
          rootCause: next,
        });
        await invalidateShipmentWorkspaceRowQuery(qc, { shipmentId, organizationId });
        onSaved?.();
      } catch (e) {
        toast(e instanceof Error ? e.message : "Could not save root cause", "error");
        setValue(initialRootCause);
      }
    },
    [
      initialRootCause,
      onSaved,
      organizationId,
      qc,
      shipmentId,
      toast,
      updateRootCauseMutation,
    ],
  );

  return {
    value,
    saving: updateRootCauseMutation.isPending,
    handleChange,
  };
}
