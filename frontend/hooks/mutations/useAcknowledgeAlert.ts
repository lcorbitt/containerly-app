import { useMutation, useQueryClient } from "@tanstack/react-query";
import { acknowledgeAlert } from "@/services/alert.service";
import { orgAlertsQueryKeyRoot } from "@/hooks/queries/useAlert";

export function useAcknowledgeAlert(organizationId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: acknowledgeAlert,
    onSuccess: () => {
      if (organizationId) {
        void qc.invalidateQueries({ queryKey: [...orgAlertsQueryKeyRoot, organizationId] });
      }
    },
  });
}
