"use client";

import { useQuery } from "@tanstack/react-query";
import { useOrgAlertsRealtimeInvalidation } from "@/hooks/queries/useOrgAlertsRealtime";
import { fetchOrgAlertsPage } from "@/services/alert.service";

const DEFAULT_ORG_ALERTS_LIMIT = 50;

export const orgAlertsQueryKeyRoot = ["org-alerts"] as const;

function orgAlertsQueryKey(organizationId: string, limit: number) {
  return [...orgAlertsQueryKeyRoot, organizationId, limit] as const;
}

export function useOrgAlertsQuery(organizationId: string | null) {
  useOrgAlertsRealtimeInvalidation(organizationId);

  return useQuery({
    queryKey: organizationId
      ? orgAlertsQueryKey(organizationId, DEFAULT_ORG_ALERTS_LIMIT)
      : [...orgAlertsQueryKeyRoot, "disabled", null],
    queryFn: () => {
      if (!organizationId) throw new Error("organizationId required");
      return fetchOrgAlertsPage(organizationId, DEFAULT_ORG_ALERTS_LIMIT);
    },
    enabled: Boolean(organizationId),
  });
}

export function useOrgAlerts(organizationId: string | null) {
  const q = useOrgAlertsQuery(organizationId);
  return q.data ?? [];
}
