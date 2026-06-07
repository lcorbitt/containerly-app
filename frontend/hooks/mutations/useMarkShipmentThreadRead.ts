import { useMutation, useQueryClient } from "@tanstack/react-query";
import { orgMessageThreadsQueryKeyRoot } from "@/hooks/queries/useOrgMessageThreads";
import { markShipmentThreadRead } from "@/services/workspace.service";

export function useMarkShipmentThreadRead(organizationId: string | null) {
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
