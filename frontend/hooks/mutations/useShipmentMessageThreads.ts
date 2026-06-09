import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  importerMessageThreadsQueryKeyRoot,
  orgMessageThreadsQueryKeyRoot,
} from "@/hooks/queries/useShipmentMessageThreads";
import {
  markImporterShipmentThreadRead,
  markShipmentThreadRead,
} from "@/services/workspace.service";

export function useMarkShipmentThreadReadMutation(organizationId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { shipmentId: string }) => {
      if (!organizationId) throw new Error("organizationId required");
      return markShipmentThreadRead({
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

export function useMarkImporterShipmentThreadReadMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { shipmentId: string }) => markImporterShipmentThreadRead(input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: importerMessageThreadsQueryKeyRoot });
    },
  });
}
