import { useQuery } from "@tanstack/react-query";
import {
  shipmentScopeThreadOrgQueryKeyPrefix,
  useOrgReportMessagesRealtimeInvalidation,
} from "@/hooks/queries/useOrgReportMessagesRealtime";
import { fetchShipmentWorkspaceRowForBrowser } from "@/services/shipment.service";
import { loadShipmentScopeThread } from "@/services/workspace.service";

export const shipmentWorkspaceRowQueryKeyRoot = ["shipment-workspace-row"] as const;

export function shipmentScopeThreadQueryKey(organizationId: string, shipmentId: string) {
  return [shipmentScopeThreadOrgQueryKeyPrefix, organizationId, shipmentId] as const;
}

export function useShipmentWorkspaceRowQuery(input: {
  shipmentId: string;
  organizationId: string | null;
}) {
  return useQuery({
    queryKey: [...shipmentWorkspaceRowQueryKeyRoot, input.shipmentId, input.organizationId],
    queryFn: async () => {
      if (!input.organizationId) throw new Error("organizationId required");
      return fetchShipmentWorkspaceRowForBrowser({
        shipmentId: input.shipmentId,
        organizationId: input.organizationId,
      });
    },
    enabled: Boolean(input.organizationId && input.shipmentId),
  });
}

export function useShipmentScopeThreadQuery(organizationId: string | null, shipmentId: string) {
  useOrgReportMessagesRealtimeInvalidation(organizationId);

  return useQuery({
    queryKey: organizationId
      ? shipmentScopeThreadQueryKey(organizationId, shipmentId)
      : [shipmentScopeThreadOrgQueryKeyPrefix, "disabled", shipmentId],
    queryFn: () =>
      loadShipmentScopeThread({
        organizationId: organizationId!,
        shipmentId,
      }),
    enabled: Boolean(organizationId),
  });
}
