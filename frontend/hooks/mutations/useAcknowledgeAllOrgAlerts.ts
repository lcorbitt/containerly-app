import { useMutation, useQueryClient } from "@tanstack/react-query";
import { acknowledgeAllOrgAlerts } from "@/services/alert.service";
import { orgAlertsQueryKeyRoot } from "@/hooks/queries/useAlert";

export function useAcknowledgeAllOrgAlerts(organizationId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => {
      if (!organizationId) throw new Error("organizationId required");
      return acknowledgeAllOrgAlerts(organizationId);
    },
    onSuccess: () => {
      if (organizationId) {
        void qc.invalidateQueries({ queryKey: [...orgAlertsQueryKeyRoot, organizationId] });
      }
    },
  });
}
