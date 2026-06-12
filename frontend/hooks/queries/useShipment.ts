import { useQuery, type QueryClient } from "@tanstack/react-query";
import { shipmentScopeThreadOrgQueryKeyPrefix } from "@/hooks/queries/useShipmentMessageThreads";
import {
  fetchShipmentWorkspaceRowForBrowser,
  getShipmentAccessTab,
  loadDocumentQueuePageBrowser,
  type DocumentQueueFilter,
  type OperatorShipmentScope,
} from "@/services/shipment.service";
import { loadShipmentScopeThread } from "@/services/workspace.service";

export const shipmentWorkspaceRowQueryKeyRoot = ["shipment-workspace-row"] as const;
export const shipmentAccessTabQueryKeyRoot = ["shipment-access-tab"] as const;
export const documentQueueQueryKeyRoot = ["document-queue"] as const;

export function shipmentAccessTabQueryKey(shipmentId: string, organizationId: string) {
  return [...shipmentAccessTabQueryKeyRoot, shipmentId, organizationId] as const;
}

export function invalidateShipmentAccessTabQuery(
  qc: QueryClient,
  input: { shipmentId: string; organizationId: string },
) {
  return qc.invalidateQueries({
    queryKey: shipmentAccessTabQueryKey(input.shipmentId, input.organizationId),
  });
}

export function invalidateShipmentWorkspaceRowQuery(
  qc: QueryClient,
  input: { shipmentId: string; organizationId: string },
) {
  return qc.invalidateQueries({
    queryKey: [...shipmentWorkspaceRowQueryKeyRoot, input.shipmentId, input.organizationId],
  });
}

export function removeShipmentWorkspaceRowQuery(qc: QueryClient, shipmentId: string) {
  return qc.removeQueries({
    queryKey: [...shipmentWorkspaceRowQueryKeyRoot, shipmentId],
  });
}

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

export function useShipmentAccessTabQuery(input: {
  shipmentId: string;
  organizationId: string | null;
}) {
  return useQuery({
    queryKey: [...shipmentAccessTabQueryKeyRoot, input.shipmentId, input.organizationId],
    queryFn: async () => {
      if (!input.organizationId) throw new Error("organizationId required");
      return getShipmentAccessTab({
        shipmentId: input.shipmentId,
        organizationId: input.organizationId,
      });
    },
    enabled: Boolean(input.organizationId && input.shipmentId),
  });
}

export function useShipmentScopeThreadQuery(organizationId: string | null, shipmentId: string) {
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

export function useDocumentQueueQuery(input: {
  organizationId: string | null;
  scope: OperatorShipmentScope;
  workflowFilter: DocumentQueueFilter;
  search: string;
  page: number;
  pageSize: number;
}) {
  return useQuery({
    queryKey: [
      ...documentQueueQueryKeyRoot,
      input.organizationId,
      input.scope,
      input.workflowFilter,
      input.search,
      input.page,
      input.pageSize,
    ],
    queryFn: async () => {
      if (!input.organizationId) throw new Error("organizationId required");
      return loadDocumentQueuePageBrowser({
        organizationId: input.organizationId,
        scope: input.scope,
        workflowFilter: input.workflowFilter,
        search: input.search,
        page: input.page,
        pageSize: input.pageSize,
      });
    },
    enabled: Boolean(input.organizationId),
  });
}
