import { useQuery } from "@tanstack/react-query";
import { fetchShipmentWorkspaceRowForBrowser } from "@/services/shipment.service";
import { loadShipmentScopeThread } from "@/services/workspace.service";

export const shipmentWorkspaceRowQueryKeyRoot = ["shipment-workspace-row"] as const;

export function shipmentScopeThreadQueryKey(organizationId: string, shipmentId: string) {
  return ["shipment-scope-thread", organizationId, shipmentId] as const;
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
    enabled: Boolean(input.organizationId),
  });
}

export function useShipmentScopeThreadQuery(organizationId: string | null, shipmentId: string) {
  return useQuery({
    queryKey: organizationId
      ? shipmentScopeThreadQueryKey(organizationId, shipmentId)
      : ["shipment-scope-thread", "disabled", shipmentId],
    queryFn: () =>
      loadShipmentScopeThread({
        organizationId: organizationId!,
        shipmentId,
      }),
    enabled: Boolean(organizationId),
  });
}
