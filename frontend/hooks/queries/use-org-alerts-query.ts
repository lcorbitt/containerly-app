import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchOrgAlertsPage, subscribeOrgAlerts } from "@/services/alerts.service";

export const orgAlertsQueryKeyRoot = ["org-alerts"] as const;

export function useOrgAlertsQuery(organizationId: string | null) {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: [...orgAlertsQueryKeyRoot, organizationId],
    queryFn: () => {
      if (!organizationId) throw new Error("organizationId required");
      return fetchOrgAlertsPage(organizationId);
    },
    enabled: Boolean(organizationId),
  });

  useEffect(() => {
    if (!organizationId) return;
    const sub = subscribeOrgAlerts(organizationId, () => {
      void qc.invalidateQueries({ queryKey: [...orgAlertsQueryKeyRoot, organizationId] });
    });
    return () => sub.unsubscribe();
  }, [organizationId, qc]);

  return query;
}
