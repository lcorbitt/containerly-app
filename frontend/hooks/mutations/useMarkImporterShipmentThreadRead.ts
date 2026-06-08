import { useMutation, useQueryClient } from "@tanstack/react-query";
import { importerMessageThreadsQueryKeyRoot } from "@/hooks/queries/useImporterMessageThreads";
import { markImporterShipmentThreadRead } from "@/services/workspace.service";

export function useMarkImporterShipmentThreadRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { shipmentId: string }) => markImporterShipmentThreadRead(input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: importerMessageThreadsQueryKeyRoot });
    },
  });
}
