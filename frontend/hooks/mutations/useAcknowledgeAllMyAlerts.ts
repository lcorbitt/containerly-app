import { useMutation, useQueryClient } from "@tanstack/react-query";
import { acknowledgeAllMyAlerts } from "@/services/alert.service";
import { myAlertsQueryKeyRoot } from "@/hooks/queries/useMyAlerts";

export function useAcknowledgeAllMyAlerts(userId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => acknowledgeAllMyAlerts(),
    onSuccess: () => {
      void qc.invalidateQueries({
        queryKey: userId ? [...myAlertsQueryKeyRoot, userId] : [...myAlertsQueryKeyRoot],
      });
    },
  });
}
