import { useMutation, useQueryClient } from "@tanstack/react-query";
import { resolveCustomerAccessRequest } from "@/services/shipment.service";
import { orgAlertsQueryKeyRoot } from "@/hooks/queries/useAlert";

export function useResolveCustomerAccessRequest(organizationId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { accessRequestId: string; action: "approve" | "deny" }) =>
      resolveCustomerAccessRequest(input),
    onSuccess: () => {
      if (organizationId) {
        void qc.invalidateQueries({ queryKey: [...orgAlertsQueryKeyRoot, organizationId] });
      }
    },
  });
}
