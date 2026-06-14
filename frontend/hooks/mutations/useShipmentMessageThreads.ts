import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  invalidateOrgShipmentMessageQueries,
  importerMessageThreadsQueryKeyRoot,
  orgMessageThreadsQueryKeyRoot,
} from "@/hooks/queries/useShipmentMessageThreads";
import {
  shipmentPortalQueryKey,
  invalidateShipmentWorkspaceRowQuery,
  shipmentScopeThreadQueryKey,
} from "@/hooks/queries/useShipment";
import { containerWorkspaceQueryKey } from "@/hooks/queries/useWorkspace";
import {
  deleteShipmentMessage,
  updateImporterShipmentThreadRead,
  updateShipmentThreadRead,
  updateShipmentMessage,
  createContainerMessage,
  createShipmentMessage,
} from "@/services/workspace.service";

export function useUpdateShipmentThreadReadMutation(organizationId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { shipmentId: string }) => {
      if (!organizationId) throw new Error("organizationId required");
      return updateShipmentThreadRead({
        organizationId,
        shipmentId: input.shipmentId,
      });
    },
    onSuccess: () => {
      if (organizationId) {
        void qc.invalidateQueries({
          queryKey: [...orgMessageThreadsQueryKeyRoot, organizationId],
        });
      }
    },
  });
}

export function useUpdateImporterShipmentThreadReadMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { shipmentId: string }) => updateImporterShipmentThreadRead(input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: importerMessageThreadsQueryKeyRoot });
    },
  });
}

function invalidateShipmentThreadCaches(
  qc: ReturnType<typeof useQueryClient>,
  input: { organizationId: string; shipmentId: string },
) {
  invalidateOrgShipmentMessageQueries(qc, input.organizationId);
  void qc.invalidateQueries({
    queryKey: shipmentScopeThreadQueryKey(input.organizationId, input.shipmentId),
  });
  void invalidateShipmentWorkspaceRowQuery(qc, {
    shipmentId: input.shipmentId,
    organizationId: input.organizationId,
  });
  void qc.invalidateQueries({
    queryKey: shipmentPortalQueryKey(input.shipmentId),
  });
}

export function useCreateShipmentMessageMutation(organizationId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      shipmentId: string;
      body: string;
      replyParentId: string | null;
      files: File[];
    }) => {
      if (!organizationId) throw new Error("organizationId required");
      return createShipmentMessage({
        organizationId,
        shipmentId: input.shipmentId,
        body: input.body,
        replyParentId: input.replyParentId,
        files: input.files,
      });
    },
    onSuccess: (_data, variables) => {
      if (organizationId) {
        invalidateShipmentThreadCaches(qc, {
          organizationId,
          shipmentId: variables.shipmentId,
        });
      }
    },
  });
}

export function useUpdateShipmentMessageMutation(organizationId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      messageId: string;
      body: string;
      shipmentId?: string;
      containerId?: string;
    }) => updateShipmentMessage({ messageId: input.messageId, body: input.body }),
    onSuccess: (_data, variables) => {
      if (!organizationId) return;
      invalidateOrgShipmentMessageQueries(qc, organizationId);
      if (variables.shipmentId) {
        invalidateShipmentThreadCaches(qc, {
          organizationId,
          shipmentId: variables.shipmentId,
        });
      }
      if (variables.containerId) {
        void qc.invalidateQueries({
          queryKey: containerWorkspaceQueryKey(organizationId, variables.containerId),
        });
      }
    },
  });
}

export function useDeleteShipmentMessageMutation(organizationId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      messageId: string;
      shipmentId?: string;
      containerId?: string;
    }) => deleteShipmentMessage({ messageId: input.messageId }),
    onSuccess: (_data, variables) => {
      if (!organizationId) return;
      invalidateOrgShipmentMessageQueries(qc, organizationId);
      if (variables.shipmentId) {
        invalidateShipmentThreadCaches(qc, {
          organizationId,
          shipmentId: variables.shipmentId,
        });
      }
      if (variables.containerId) {
        void qc.invalidateQueries({
          queryKey: containerWorkspaceQueryKey(organizationId, variables.containerId),
        });
      }
    },
  });
}

export function useCreateContainerMessageMutation(organizationId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      containerId: string;
      body: string;
      replyParentId: string | null;
      files: File[];
    }) => {
      if (!organizationId) throw new Error("organizationId required");
      return createContainerMessage({
        organizationId,
        containerId: input.containerId,
        body: input.body,
        replyParentId: input.replyParentId,
        files: input.files,
      });
    },
    onSuccess: (_data, variables) => {
      if (organizationId) {
        invalidateOrgShipmentMessageQueries(qc, organizationId);
        void qc.invalidateQueries({
          queryKey: containerWorkspaceQueryKey(organizationId, variables.containerId),
        });
      }
    },
  });
}
