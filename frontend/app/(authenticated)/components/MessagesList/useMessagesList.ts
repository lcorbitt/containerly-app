"use client";

import {
  useUpdateImporterShipmentThreadReadMutation,
  useUpdateShipmentThreadReadMutation,
} from "@/hooks/mutations/useShipmentMessageThreads";
import { useOrganizationWorkspaceOptional } from "@/atoms/organization-workspace";
import type { ShipmentMessageThreadSummary } from "@/types/workspace-load";

export function useMessagesList(viewer: "operator" | "customer") {
  const workspace = useOrganizationWorkspaceOptional();
  const selectedOrgId = workspace?.selectedOrgId ?? null;
  const operatorUpdateThreadReadMut = useUpdateShipmentThreadReadMutation(selectedOrgId);
  const customerUpdateThreadReadMut = useUpdateImporterShipmentThreadReadMutation();

  function handleThreadNavigate(thread: ShipmentMessageThreadSummary) {
    if (!thread.is_unread) return;

    if (viewer === "customer") {
      customerUpdateThreadReadMut.mutate({ shipmentId: thread.shipment_id });
      return;
    }

    if (selectedOrgId) {
      operatorUpdateThreadReadMut.mutate({ shipmentId: thread.shipment_id });
    }
  }

  return { handleThreadNavigate };
}
