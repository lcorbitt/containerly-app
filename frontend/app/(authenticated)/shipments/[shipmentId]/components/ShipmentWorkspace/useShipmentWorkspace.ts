"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useConfirm } from "@/atoms/confirm-dialog";
import { useToast } from "@/atoms/toast";
import { useDeleteShipmentMutation } from "@/hooks/mutations/useShipments";
import { removeShipmentWorkspaceRowQuery } from "@/hooks/queries/useShipment";
import type { ShipmentWorkspaceRow } from "@/services/shipment.service";

export function useShipmentWorkspaceDelete({
  shipmentId,
  selectedOrgId,
  canDeleteShipment,
  row,
}: {
  shipmentId: string;
  selectedOrgId: string | null;
  canDeleteShipment: boolean;
  row: ShipmentWorkspaceRow | null;
}) {
  const router = useRouter();
  const qc = useQueryClient();
  const { confirm } = useConfirm();
  const { toast } = useToast();
  const deleteMutation = useDeleteShipmentMutation();
  const [redirectAfterDelete, setRedirectAfterDelete] = useState(false);

  const deleting = deleteMutation.isPending;

  const handleDeleteShipment = useCallback(async () => {
    if (!selectedOrgId || !canDeleteShipment) return;
    const label = row?.order_number?.trim() || row?.customer_name?.trim() || "this shipment";
    const ok = await confirm({
      title: "Delete Shipment?",
      description: `Permanently delete ${label}? This removes documents, messages, and tracking linked to the shipment.`,
      confirmLabel: "Delete",
      cancelLabel: "Cancel",
      variant: "danger",
    });
    if (!ok) return;

    try {
      const result = await deleteMutation.mutateAsync({
        organization_id: selectedOrgId,
        shipment_id: shipmentId,
      });
      if (!result.ok) {
        toast(result.error, "error");
        return;
      }
      setRedirectAfterDelete(true);
      void removeShipmentWorkspaceRowQuery(qc, shipmentId);
      toast("Shipment deleted", "success");
      await router.replace("/shipments");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Could not delete shipment", "error");
    }
  }, [
    canDeleteShipment,
    confirm,
    deleteMutation,
    qc,
    row,
    router,
    selectedOrgId,
    shipmentId,
    toast,
  ]);

  return {
    handleDeleteShipment,
    deleting,
    redirectAfterDelete,
  };
}
