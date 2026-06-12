import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  acknowledgeAlert,
  acknowledgeAllMyAlerts,
  acknowledgeAllOrgAlerts,
} from "@/services/alert.service";
import { resolveCustomerAccessRequest } from "@/services/shipment.service";
import {
  myAlertsQueryKeyRoot,
  optimisticallyAcknowledgeAllAlerts,
  orgAlertsQueryKeyRoot,
  restoreAlertsQueryCache,
} from "@/hooks/queries/useAlerts";
import { invalidateShipmentAccessTabQuery } from "@/hooks/queries/useShipment";

export function useAcknowledgeAlertMutation(organizationId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: acknowledgeAlert,
    onSuccess: () => {
      if (organizationId) {
        void qc.invalidateQueries({ queryKey: [...orgAlertsQueryKeyRoot, organizationId] });
      }
      void qc.invalidateQueries({ queryKey: myAlertsQueryKeyRoot });
    },
  });
}

export function useAcknowledgeAllOrgAlertsMutation(organizationId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => {
      if (!organizationId) throw new Error("organizationId required");
      return acknowledgeAllOrgAlerts(organizationId);
    },
    onMutate: async () => {
      if (!organizationId) return undefined;
      return optimisticallyAcknowledgeAllAlerts(qc, [...orgAlertsQueryKeyRoot, organizationId]);
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) {
        restoreAlertsQueryCache(qc, context.previous);
      }
    },
    onSettled: () => {
      if (organizationId) {
        void qc.invalidateQueries({ queryKey: [...orgAlertsQueryKeyRoot, organizationId] });
      }
    },
  });
}

export function useAcknowledgeAllMyAlertsMutation(userId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => acknowledgeAllMyAlerts(),
    onMutate: async () => {
      if (!userId) return undefined;
      return optimisticallyAcknowledgeAllAlerts(qc, [...myAlertsQueryKeyRoot, userId]);
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) {
        restoreAlertsQueryCache(qc, context.previous);
      }
    },
    onSettled: () => {
      if (userId) {
        void qc.invalidateQueries({ queryKey: [...myAlertsQueryKeyRoot, userId] });
      }
    },
  });
}

export function useResolveCustomerAccessRequestMutation(organizationId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { accessRequestId: string; action: "approve" | "deny" }) =>
      resolveCustomerAccessRequest(input),
    onSuccess: (data) => {
      if (organizationId) {
        void qc.invalidateQueries({ queryKey: [...orgAlertsQueryKeyRoot, organizationId] });
      }
      if (data.ok && organizationId) {
        void invalidateShipmentAccessTabQuery(qc, {
          shipmentId: data.shipment_id,
          organizationId,
        });
      }
    },
  });
}
