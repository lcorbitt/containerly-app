import { useQuery } from "@tanstack/react-query";
import { fetchShipmentWorkspaceRow } from "@/services/shipment-workspace-row.service";

export const shipmentWorkspaceRowQueryKeyRoot = ["shipment-workspace-row"] as const;

export function useShipmentWorkspaceRowQuery(input: {
  shipmentId: string;
  organizationId: string | null;
}) {
  return useQuery({
    queryKey: [...shipmentWorkspaceRowQueryKeyRoot, input.shipmentId, input.organizationId],
    queryFn: async () => {
      if (!input.organizationId) throw new Error("organizationId required");
      return fetchShipmentWorkspaceRow({
        shipmentId: input.shipmentId,
        organizationId: input.organizationId,
      });
    },
    enabled: Boolean(input.organizationId),
  });
}
