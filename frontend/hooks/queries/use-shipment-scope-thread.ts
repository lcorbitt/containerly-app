import { useQuery } from "@tanstack/react-query";
import { loadShipmentScopeThread } from "@/services/workspace-shipment-thread.service";

export function shipmentScopeThreadQueryKey(organizationId: string, shipmentId: string) {
  return ["shipment-scope-thread", organizationId, shipmentId] as const;
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
